const {test,before,after} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cheerio = require('cheerio');
const app = require('../server');
const manifest = require('../dist/site-manifest.json');
const config = require('../site.config.json');
let server;
let origin;
before(async()=>{
  server=await new Promise(resolve=>{const instance=app.listen(0,'127.0.0.1',()=>resolve(instance));});
  origin='http://127.0.0.1:'+server.address().port;
});
after(()=>new Promise(resolve=>server.close(resolve)));

test('all 46 pages expose their own content, metadata, images and links without JavaScript',async()=>{
  assert.equal(manifest.pages.length,46);
  const titles=new Set();
  const descriptions=new Set();
  const paths=new Set(manifest.pages.map(page=>page.path));
  for(const page of manifest.pages){
    const response=await fetch(origin+page.path);
    assert.equal(response.status,200,page.path);
    const html=await response.text();
    const $=cheerio.load(html);
    assert.equal($('.page-view').length,1,page.path);
    assert.equal($('.page-view').attr('data-view'),page.name);
    assert.equal($('.page-view[hidden]').length,0);
    assert.equal($('h1').length,1,page.path+' must have exactly one primary heading');
    assert.ok($('.page-view h1').text().trim(),page.path+' has no heading');
    assert.equal($('meta[name="description"]').length,1);
    const description=$('meta[name="description"]').attr('content');
    assert.ok(description.length>=25 && description.length<=160,page.path+' description must contain 25–160 characters');
    assert.match(description,/[.!?]$/,page.path+' description must be a complete sentence');
    assert.equal($('link[rel="canonical"]').length,1);
    assert.equal($('meta[name="msvalidate.01"]').length,1);
    assert.equal($('meta[name="msvalidate.01"]').attr('content'),'DECD6D19B79D8132DE9B46F168DA08B3');
    assert.equal($('meta[name="viewport"]').length,1);
    assert.equal($('img:not([alt])').length,0,page.path+' missing image alternatives');
    assert.ok($('.fb-mark').toArray().every(el=>$(el).attr('alt')==='RJDLx'));
    assert.equal($('title').text(),page.title);
    assert.equal($('link[rel="canonical"]').attr('href'),page.url);
    assert.equal($('meta[property="og:url"]').attr('content'),page.url);
    assert.ok($('meta[name="twitter:card"]').length);
    assert.equal($('meta[name="robots"]').attr('content'),'index,follow,max-image-preview:large');
    titles.add($('title').text());
    descriptions.add($('meta[name="description"]').attr('content'));
    assert.equal($('script[src*="googletagmanager.com/gtag/js"]').length,1);
    assert.equal($('head script[src="https://www.googletagmanager.com/gtag/js?id=G-J4MKWGPQJL"]').length,1);
    assert.equal($('head script[src^="/js/analytics.js"]').length,1);
    assert.ok(fs.existsSync(path.join(__dirname,'../dist/js/analytics.js')));
    assert.equal($('img[src^="data:"]').length,0,page.path+' contains placeholder images');
    $('img').each((_,el)=>{
      const img=$(el);
      const src=img.attr('src');
      assert.ok(src.startsWith('/images/'),src);
      assert.ok(fs.existsSync(path.join(__dirname,'../dist',src)),src);
      assert.ok(Number(img.attr('width'))>0 && Number(img.attr('height'))>0,src);
    });
    $('a[href]').each((_,el)=>{
      const href=$(el).attr('href');
      if(href.startsWith('/')&&!href.startsWith('//')) assert.ok(paths.has(href.split('#')[0]),page.path+' broken link '+href);
    });
    const graph=JSON.parse($('script[type="application/ld+json"]').text())['@graph'];
    assert.ok(graph.some(node=>node['@type']==='Organization'));
    assert.ok(graph.some(node=>node['@type']==='BreadcrumbList'));
    if($('.p-info h1').length) assert.ok(graph.some(node=>node['@type']==='Product'),page.path);
  }
  assert.equal(titles.size,46,'duplicate page titles');
  assert.equal(descriptions.size,46,'duplicate page descriptions');
});

test('sitemap has exactly the real canonical URLs and robots is plain text',async()=>{
  const response=await fetch(origin+'/robots.txt');
  assert.equal(response.status,200);
  assert.match(response.headers.get('content-type'),/text\/plain/);
  const robots=await response.text();
  for(const bot of ['Googlebot','Bingbot','Yandex','OAI-SearchBot','Claude-SearchBot','PerplexityBot']) assert.ok(robots.includes('User-agent: '+bot));
  assert.ok(robots.includes('Sitemap: '+config.origin+'/sitemap.xml'));
  const sitemapResponse=await fetch(origin+'/sitemap.xml');
  assert.equal(sitemapResponse.status,200);
  assert.match(sitemapResponse.headers.get('content-type'),/xml/);
  const xml=cheerio.load(await sitemapResponse.text(),{xml:true});
  assert.equal(xml('urlset').attr('xmlns'),'http://www.sitemaps.org/schemas/sitemap/0.9');
  assert.equal(new Set(xml('loc').toArray().map(el=>xml(el).text())).size,46);
  assert.deepEqual(xml('loc').toArray().map(el=>xml(el).text()),manifest.pages.map(page=>page.url));
});

test('unknown paths, fake policy pages, private source and missing assets return real 404s',async()=>{
  for(const route of ['/nonexistent-xyz.html','/random/deep/path','/privacy','/terms','/robots-missing.txt','/images/missing.png','/.env','/server.js','/package.json']){
    assert.equal((await fetch(origin+route)).status,404,route);
  }
});

test('legacy HTML URLs and collection aliases redirect once to canonical routes',async()=>{
  for(const [route,expected] of Object.entries({'/index.html':'/','/contact.html':'/contact','/collection-storage':'/collection-metal-shelves','/collection-woven-metal':'/collection-natural-yarn','/trade/':'/trade'})){
    const response=await fetch(origin+route,{redirect:'manual'});
    assert.equal(response.status,308,route);
    assert.equal(response.headers.get('location'),expected,route);
  }
});

test('IndexNow key is served verbatim and enquiry validation remains available',async()=>{
  assert.equal(await (await fetch(origin+'/'+config.indexNowKey+'.txt')).text(),config.indexNowKey);
  const response=await fetch(origin+'/api/enquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  assert.equal(response.status,400);
  assert.equal((await response.json()).success,false);
});

test('hero files are compressed and generated HTML is materially smaller',()=>{
  for(const name of ['images/hero-architectural-bronze.png','images/hero-interior-living.png']){
    const image=manifest.images[name];
    assert.ok(image.size<300000,name+' exceeds 300 KB');
    assert.ok(image.url.endsWith('.webp'));
  }
  assert.ok(manifest.pages.every(page=>page.bytes<100000));
});
