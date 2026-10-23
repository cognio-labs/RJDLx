/* Compile the existing design into crawler-readable pages. Source assets stay untouched. */
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const cheerio = require('cheerio');
const sharp = require('sharp');
const config = require('../site.config.json');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const cache = path.join(root, '.cache', 'images');
const clean = (text) => text.replace(/\s+/g, ' ').trim();
const escape = (value) => value.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const descriptions = require('./seo-descriptions.json');

async function build() {
  await fs.mkdir(output, {recursive:true});
  // Remove only stale generated HTML files inside the known build directory.
  for (const file of await fs.readdir(output)) {
    if (/^[a-z0-9-]+\.html$/.test(file)) await fs.unlink(path.join(output, file));
  }
  await fs.mkdir(path.join(output, 'images'), {recursive:true});
  await fs.mkdir(cache, {recursive:true});
  const source = await fs.readFile(path.join(root, 'index.html'), 'utf8');
  const bundle = await fs.readFile(path.join(root, 'js/main.js'), 'utf8');
  const context = {window:{}};
  vm.runInNewContext(await fs.readFile(path.join(root, 'js/imgmap.js'), 'utf8'), context);
  const imageMap = context.window.__IMG;
  const titles = vm.runInNewContext('('+bundle.match(/var TITLES=(\{[^\n]+\});/)[1]+')');
  const aliases = vm.runInNewContext('('+bundle.match(/var F2V=(\{[^\n]+\});/)[1]+')');
  const $source = cheerio.load(source);
  const views = $source('.page-view').toArray().map((el) => $source(el).attr('data-view'));
  if (views.length !== 46 || $source('.page-view .page-view').length) throw new Error('Unexpected page structure; refusing to build.');
  const images = new Map();
  for (const value of Object.values(imageMap)) images.set(value, null);
  $source('img[src], link[rel="icon"], link[as="image"]').each((_, el) => {
    const value = $source(el).attr('src') || $source(el).attr('href');
    if (/^\/?images\//.test(value)) images.set(value.replace(/^\//,''), null);
  });
  for (const [original] of images) {
    const file = path.resolve(root, original);
    if (!file.startsWith(path.join(root, 'images') + path.sep)) throw new Error('Invalid asset path');
    const data = await fs.readFile(file);
    const meta = await sharp(data).metadata();
    let url = '/'+original;
    let width = meta.width;
    let height = meta.height;
    let size = data.length;
    let srcset = '';
    if (/\.(png|jpe?g)$/i.test(original) && data.length > 80000 && !['h23','h24','favicon'].includes(path.parse(original).name)) {
      const digest = crypto.createHash('sha256').update(data).update('webp-1920-78-v1').digest('hex').slice(0,16);
      const widths = [...new Set([Math.min(640,meta.width), Math.min(1280,meta.width), Math.min(1920,meta.width)])];
      const variants = [];
      for (const target of widths) {
        const name = `${digest}-${target}.webp`;
        const cached = path.join(cache, name);
        try { await fs.access(cached); }
        catch { await sharp(data).rotate().resize({width:target,withoutEnlargement:true}).webp({quality:78}).toFile(cached); }
        await fs.copyFile(cached, path.join(output,'images',name));
        variants.push({url:'/images/'+name,width:target});
      }
      url = variants.at(-1).url;
      width = variants.at(-1).width;
      height = Math.round(meta.height * width / meta.width);
      size = (await fs.stat(path.join(output,url))).size;
      srcset = variants.map((v) => `${v.url} ${v.width}w`).join(', ');
    } else {
      await fs.copyFile(file,path.join(output,original));
    }
    images.set(original,{url,width,height,size,originalBytes:data.length,srcset});
  }
  await fs.cp(path.join(root,'css'),path.join(output,'css'),{recursive:true});
  await fs.mkdir(path.join(output,'js'),{recursive:true});
  await fs.copyFile(path.join(root,'js/main.js'),path.join(output,'js/main.js'));
  const optimizedMap = Object.fromEntries(Object.entries(imageMap).map(([key,value])=>[key,images.get(value)?.url||value]));
  await fs.writeFile(path.join(output,'js/imgmap.js'),'window.__IMG='+JSON.stringify(optimizedMap)+';\n');
  await sharp(path.join(root,'images/hero-architectural-bronze.png')).resize(1200,630,{fit:'cover'}).jpeg({quality:82}).toFile(path.join(output,'images/rjdlx-share.jpg'));

  const manifest = {origin:config.origin,pages:[],aliases:{},images:Object.fromEntries(images)};
  for (const name of views) {
    const $ = cheerio.load(source);
    $('.page-view').each((_,el) => { if ($(el).attr('data-view') !== name) $(el).remove(); });
    const view = $('.page-view').removeAttr('hidden');
    $('body').attr('data-view',name).attr('data-static-page','true');
    const url = config.origin + (name==='home'?'/':'/'+name);
    const title = titles[name] || `${name.replace(/-/g,' ')} | RJDLx`;
    const heading = clean(view.find('h1').text());
    const label = clean(title.replace(/\s*[—|]\s*RJDLx.*$/,'').replace(/^.*?[—]\s*RJDLx Collections$/,''));
    const description = descriptions[name];
    if (!description || description.length < 25 || description.length > 160 || !/[.!?]$/.test(description)) throw new Error('Review SEO description for '+name);
    if ($('h1').length !== 1) throw new Error('Expected one primary H1 on '+name);
    if ($('img:not([alt])').length) throw new Error('Missing image alternative on '+name);
    $('title').text(title);
    $('meta[name="description"]').attr('content',description);
    $('link[as="image"]').remove();
    $('link[rel="canonical"]').remove();
    $('head').append('<link rel="canonical" href="'+escape(url)+'">');
    for (const [key,value] of Object.entries({'robots':'index,follow,max-image-preview:large','twitter:card':'summary_large_image','twitter:title':title,'twitter:description':description,'twitter:image':config.origin+'/images/rjdlx-share.jpg'})) {
      $('head').append($('<meta>').attr({name:key,content:value}));
    }
    for (const [key,value] of Object.entries({'og:type':'website','og:site_name':'RJDLx','og:locale':'en_IN','og:title':title,'og:description':description,'og:url':url,'og:image':config.origin+'/images/rjdlx-share.jpg','og:image:width':'1200','og:image:height':'630','og:image:alt':'RJDLx — furniture, lighting and architectural décor'})) {
      $('head').append($('<meta>').attr({property:key,content:value}));
    }
    for (const [provider,meta] of Object.entries({google:'google-site-verification',bing:'msvalidate.01',yandex:'yandex-verification'})) {
      if(config.verification[provider]) {
        $('meta[name="'+meta+'"]').remove();
        $('head').append($('<meta>').attr({name:meta,content:config.verification[provider]}));
      }
    }
    $('a[href]').each((_,el)=>{
      const href=$(el).attr('href');
      const match=href.match(/^([a-z0-9-]+)\.html(#[A-Za-z0-9_-]+)?$/);
      if(match && aliases[match[1]]) $(el).attr('href',(aliases[match[1]]==='home'?'/':'/'+aliases[match[1]])+(match[2]||''));
    });
    $('img').each((_,el)=>{
      const img=$(el);
      const original=imageMap[img.attr('data-im')] || (img.attr('src')||'').replace(/^\//,'');
      const asset=images.get(original);
      if(!asset) return;
      const important=!!img.closest('#nav,#preloader').length || (name==='home' ? !!img.closest('.hero-layer.is-active').length : img.is(view.find('img').first()));
      img.attr({src:asset.url,width:asset.width,height:asset.height,decoding:'async',loading:important?'eager':'lazy'});
      if(important && !img.closest('#nav,#preloader').length) img.attr('fetchpriority','high');
      else img.removeAttr('fetchpriority');
      if(asset.srcset) img.attr({srcset:asset.srcset,sizes:'(max-width: 760px) 100vw, 100vw'});
    });
    $('[data-src]').each((_,el)=>{
      const element=$(el);
      const original=imageMap[element.attr('data-im')] || element.attr('data-src');
      if(images.has(original)) element.attr('data-src',images.get(original).url);
    });
    const graph=[
      {'@type':'Organization','@id':config.origin+'/#organization',name:config.name,url:config.origin+'/',email:config.email,logo:config.origin+'/images/h23.png'},
      {'@type':'WebSite','@id':config.origin+'/#website',url:config.origin+'/',name:config.name,publisher:{'@id':config.origin+'/#organization'}},
      {'@type':name==='contact'?'ContactPage':name.startsWith('collection')?'CollectionPage':'WebPage','@id':url+'#page',url,name:title,description,inLanguage:'en',isPartOf:{'@id':config.origin+'/#website'}},
      {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:config.origin+'/'},...(name==='home'?[]:[{'@type':'ListItem',position:2,name:label,item:url}])]}
    ];
    const productName=clean(view.find('.p-info h1').text());
    if(productName) graph.push({'@type':'Product',name:productName,url,description,image:config.origin+view.find('img').first().attr('src'),brand:{'@type':'Brand',name:config.name},manufacturer:{'@id':config.origin+'/#organization'}});
    $('head').append('<script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c')+'</script>');
    $('head').append('<noscript><style>.preloader,.cursor{display:none!important}.reveal,.reveal-img{opacity:1!important;transform:none!important;clip-path:none!important}body{overflow:auto!important}</style></noscript>');
    const html=$.html();
    const file=name==='home'?'index.html':name+'.html';
    await fs.writeFile(path.join(output,file),html);
    manifest.pages.push({name,path:name==='home'?'/':'/'+name,url,title,description,heading,bytes:Buffer.byteLength(html)});
  }
  for(const [alias,target] of Object.entries(aliases)) {
    const from=alias==='index'?'/index':'/'+alias;
    const to=target==='home'?'/':'/'+target;
    if(from!==to) manifest.aliases[from]=to;
  }
  await fs.writeFile(path.join(output,'404.html'),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Page not found | RJDLx</title><link rel="stylesheet" href="/css/main.css"></head><body><main class="page"><section class="page-hero"><p>404</p><h1>Page not found.</h1><p>The requested page could not be found.</p><a href="/">Return to RJDLx</a> · <a href="/collections">Explore collections</a> · <a href="/contact">Contact us</a></section></main></body></html>');
  await fs.writeFile(path.join(output,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+manifest.pages.map(p=>'  <url><loc>'+escape(p.url)+'</loc></url>').join('\n')+'\n</urlset>\n');
  const rules='Allow: /\nDisallow: /api/\n';
  await fs.writeFile(path.join(output,'robots.txt'),'# Public search and retrieval are allowed.\nUser-agent: *\n'+rules+'\n'+['Googlebot','Bingbot','Yandex','OAI-SearchBot','ChatGPT-User','Claude-SearchBot','Claude-User','PerplexityBot','Perplexity-User'].map(bot=>'User-agent: '+bot+'\n'+rules).join('\n')+'\nSitemap: '+config.origin+'/sitemap.xml\n');
  await fs.writeFile(path.join(output,config.indexNowKey+'.txt'),config.indexNowKey);
  await fs.writeFile(path.join(output,'site-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(`Built ${manifest.pages.length} crawlable pages at ${config.origin}; ${images.size} images resolved.`);
  console.log(`Homepage HTML: ${manifest.pages[0].bytes} bytes (source: ${Buffer.byteLength(source)} bytes).`);
}
build().catch(error=>{console.error(error);process.exitCode=1;});
