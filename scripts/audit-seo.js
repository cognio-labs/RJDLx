/* Read-only crawl. No indexing submissions or deployment actions. */
const fs = require('node:fs/promises');
const path = require('node:path');
const cheerio = require('cheerio');
const {Resolver} = require('node:dns/promises');
const config = require('../site.config.json');
const manifest = require('../dist/site-manifest.json');
const base = process.argv[2] || config.origin;
const report = {checkedAt:new Date().toISOString(),base,pages:[],resources:[],redirects:[],crawlerChecks:[],dns:[],errors:[]};
const resources = new Set();
async function get(url, agent) {
  const chain = [];
  for (let i=0;i<8;i++) {
    const r=await fetch(url,{redirect:'manual',headers:agent?{'User-Agent':agent}:{},signal:AbortSignal.timeout(20000)});
    const body=await r.text();
    chain.push({url,status:r.status,location:r.headers.get('location'),contentType:r.headers.get('content-type'),xRobotsTag:r.headers.get('x-robots-tag')});
    if(r.status>=300&&r.status<400&&r.headers.has('location')) {url=new URL(r.headers.get('location'),url).href;continue;}
    return {chain,body,final:chain.at(-1)};
  }
  throw Error('Redirect loop: '+url);
}
async function pool(items, fn) {
  let index=0;
  await Promise.all(Array.from({length:4},async()=>{while(index<items.length){const item=items[index++];try{await fn(item);}catch(e){report.errors.push({item,error:e.message});}}}));
}
async function main(){
  const sitemap=await get(base+'/sitemap.xml');
  const xml=cheerio.load(sitemap.body,{xml:true});
  const urls=xml('urlset > url > loc').toArray().map(e=>xml(e).text());
  report.sitemap={...sitemap,body:undefined,namespace:xml('urlset').attr('xmlns'),urls};
  if(sitemap.final.status!==200||!sitemap.final.contentType?.includes('xml')||report.sitemap.namespace!=='http://www.sitemaps.org/schemas/sitemap/0.9'||new Set(urls).size!==urls.length||JSON.stringify(urls)!==JSON.stringify(manifest.pages.map(p=>p.url))) report.errors.push('Sitemap status/type/namespace/URL set mismatch');
  const robots=await get(base+'/robots.txt');
  report.robots=robots;
  if(robots.final.status!==200||!robots.final.contentType?.includes('text/plain')||!robots.body.includes('Sitemap: '+config.origin+'/sitemap.xml'))report.errors.push('Invalid robots response');
  await pool(manifest.pages,async p=>{
    const response=await get(base+p.path),$=cheerio.load(response.body);
    const row={path:p.path,...response.final,redirects:response.chain.length-1,title:$('title').text(),titleCount:$('title').length,description:$('meta[name="description"]').attr('content'),descriptionCount:$('meta[name="description"]').length,h1:$('h1').length,heading:$('h1').text().trim(),canonical:$('link[rel="canonical"]').attr('href'),canonicalCount:$('link[rel="canonical"]').length,robots:$('meta[name="robots"]').attr('content'),viewport:$('meta[name="viewport"]').attr('content'),images:$('img').length,missingAlt:$('img:not([alt])').length,emptyAlt:$('img[alt=""]').length,brokenLinks:[],placeholderLinks:[],structuredData:[]};
    $('a[href]').each((_,e)=>{
      const href=$(e).attr('href');
      if(href==='#'||/^javascript:/i.test(href))row.placeholderLinks.push({text:$(e).text().trim(),href});
      const documentBase=new URL($('base[href]').attr('href')||p.path,config.origin);
      const url=new URL(href,documentBase);
      if(url.origin!==config.origin)return;
      const target=manifest.pages.find(page=>page.path===url.pathname);
      if(!target && !url.pathname.startsWith('/api/'))row.brokenLinks.push(href);
      if(url.hash&&target){
        const id=decodeURIComponent(url.hash.slice(1));
        const targetDocument=target.path===p.path?$:cheerio.load(require('node:fs').readFileSync(path.join(__dirname,'../dist',target.name==='home'?'index.html':target.name+'.html'),'utf8'));
        if(!targetDocument('[id]').toArray().some(el=>targetDocument(el).attr('id')===id))row.brokenLinks.push(href);
      }
    });
    $('img[src],script[src],link[rel="stylesheet"],link[rel="icon"]').each((_,e)=>{const u=new URL($(e).attr('src')||$(e).attr('href'),base);if(u.origin===new URL(base).origin)resources.add(u.href);});
    $('script[type="application/ld+json"]').each((_,e)=>{try{row.structuredData.push(...JSON.parse($(e).text())['@graph'].map(n=>n['@type']));}catch{report.errors.push(p.path+' invalid JSON-LD');}});
    report.pages.push(row);
    if(row.status!==200||row.redirects||row.h1!==1||row.missingAlt||row.canonical!==p.url||row.canonicalCount!==1||row.descriptionCount!==1||row.titleCount!==1||!row.viewport||/noindex/i.test((row.robots||'')+(row.xRobotsTag||''))||row.brokenLinks.length)report.errors.push(p.path+' page checks failed');
  });
  await pool([...resources],async url=>{const r=await get(url);report.resources.push({...r.final,bytes:Buffer.byteLength(r.body)});if(r.final.status!==200)report.errors.push(url+' resource unavailable');});
  for(const route of ['/index.html','/contact.html','/collection-storage','/collection-woven-metal','/trade/','/nonexistent-seo-audit-page','/images/missing.png']){const r=await get(base+route);report.redirects.push({route,chain:r.chain});}
  for(const agent of ['Googlebot','bingbot'])for(const route of ['/robots.txt','/sitemap.xml']){const r=await get(base+route,agent);report.crawlerChecks.push({agent,route,chain:r.chain,isXml:route.endsWith('.xml')?r.body.includes('<urlset'):undefined});}
  if(base===config.origin){
    for(const url of ['http://rjdlx.com/','http://www.rjdlx.com/','https://rjdlx.com/']){try{report.redirects.push({route:url,chain:(await get(url)).chain});}catch(e){report.errors.push({url,error:e.message});}}
    const dns=new Resolver();
    for(const host of ['rjdlx.com','www.rjdlx.com'])for(const type of ['A','AAAA','CNAME']){try{report.dns.push({host,type,answer:await dns.resolve(host,type)});}catch{try{const r=await fetch('https://dns.google/resolve?name='+host+'&type='+type);const data=await r.json();report.dns.push({host,type,source:'Google DNS over HTTPS',status:data.Status,answer:data.Answer});}catch(e){report.dns.push({host,type,error:e.message});}}}
  }
  report.pages.sort((a,b)=>a.path.localeCompare(b.path));
  report.summary={pages:report.pages.length,resources:report.resources.length,uniqueTitles:new Set(report.pages.map(p=>p.title)).size,uniqueDescriptions:new Set(report.pages.map(p=>p.description)).size,descriptionMin:Math.min(...report.pages.map(p=>p.description?.length||0)),descriptionMax:Math.max(...report.pages.map(p=>p.description?.length||0)),missingAlt:report.pages.reduce((n,p)=>n+p.missingAlt,0),h1Failures:report.pages.filter(p=>p.h1!==1).length,errors:report.errors.length};
  await fs.mkdir(path.join(__dirname,'../artifacts'),{recursive:true});
  const file=path.join(__dirname,'../artifacts/seo-'+(base===config.origin?'live':'local')+'.json');
  await fs.writeFile(file,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report.summary,null,2));
  if(report.errors.length)console.log(JSON.stringify(report.errors,null,2));
  if(report.errors.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
