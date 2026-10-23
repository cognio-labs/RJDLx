/* Public read-only checks. These do not prove private webmaster account ownership. */
const fs = require('node:fs/promises');
const path = require('node:path');
const cheerio = require('cheerio');
const {Resolver} = require('node:dns/promises');
const config = require('../site.config.json');
async function inspect(route,agent){
  const response=await fetch(config.origin+route,{headers:agent?{'User-Agent':agent}:{},signal:AbortSignal.timeout(30000)});
  const text=await response.text();
  const $=cheerio.load(text);
  return {route,userAgent:agent||'default',status:response.status,url:response.url,contentType:response.headers.get('content-type'),bytes:Buffer.byteLength(text),title:$('title').text(),canonical:$('link[rel="canonical"]').attr('href')||null,googleAnalyticsLoader:$('script[src*="googletagmanager.com/gtag/js"]').length,validRobots:route==='/robots.txt'?/^User-agent:/mi.test(text):undefined,validSitemap:route==='/sitemap.xml'?/<urlset\b/.test(text):undefined};
}
async function main(){
  const report={checkedAt:new Date().toISOString(),origin:config.origin,checks:[],dnsGoogleVerificationRecords:0,notes:['DNS verification tokens are evidence of verification configuration, not proof of current Search Console access, sitemap submission, or indexing.','Spoofed user-agent requests check HTTP accessibility only; they do not prove real crawler IPs can pass every firewall rule.']};
  const dns=new Resolver();
  try{
    report.dnsGoogleVerificationRecords=(await dns.resolveTxt('rjdlx.com')).flat().filter(value=>value.startsWith('google-site-verification=')).length;
    report.dnsSource='system resolver';
  }catch(error){
    // Some Windows environments block Node's DNS resolver; use public DNS over HTTPS.
    report.dnsGoogleVerificationRecords=null;
    try{
      const response=await fetch('https://dns.google/resolve?name=rjdlx.com&type=TXT',{signal:AbortSignal.timeout(15000)});
      const answer=await response.json();
      if(!response.ok||answer.Status!==0) throw new Error('DNS-over-HTTPS lookup failed');
      report.dnsGoogleVerificationRecords=(answer.Answer||[]).filter(record=>record.type===16&&record.data.includes('google-site-verification=')).length;
      report.dnsSource='Google public DNS over HTTPS';
    }catch(fallbackError){report.dnsError=error.message+'; '+fallbackError.message;}
  }
  for(const route of ['/','/contact','/trade','/robots.txt','/sitemap.xml','/nonexistent-xyz.html','/random/deep/path']){
    try{report.checks.push(await inspect(route));}catch(error){report.checks.push({route,error:error.message});}
  }
  for(const agent of ['Googlebot','bingbot','YandexBot','OAI-SearchBot','Claude-SearchBot','PerplexityBot']){
    try{report.checks.push(await inspect('/',agent));}catch(error){report.checks.push({route:'/',userAgent:agent,error:error.message});}
  }
  await fs.mkdir(path.join(__dirname,'../artifacts'),{recursive:true});
  await fs.writeFile(path.join(__dirname,'../artifacts/live-indexing.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
