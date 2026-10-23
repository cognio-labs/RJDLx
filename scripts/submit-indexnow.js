/* Run only after the production sitemap and key file are live. */
const config = require('../site.config.json');
const manifest = require('../dist/site-manifest.json');

async function submit() {
  const keyLocation = config.origin + '/' + config.indexNowKey + '.txt';
  const keyResponse = await fetch(keyLocation, {redirect:'error'});
  if (!keyResponse.ok || (await keyResponse.text()).trim() !== config.indexNowKey) {
    throw new Error('Production key file is not live. Deploy and verify first; no URLs were submitted.');
  }
  const sitemapResponse = await fetch(config.origin+'/sitemap.xml', {redirect:'error'});
  const sitemap = await sitemapResponse.text();
  if(!sitemapResponse.ok || !sitemap.includes('<urlset') || !manifest.pages.every(page=>sitemap.includes('<loc>'+page.url+'</loc>'))) {
    throw new Error('Production sitemap does not match this build. No URLs were submitted.');
  }
  for(const page of manifest.pages) {
    const response = await fetch(page.url, {redirect:'error'});
    if(response.status!==200 || !(await response.text()).includes('href="'+page.url+'"')) {
      throw new Error('Production page is not ready: '+page.url+'. No URLs were submitted.');
    }
  }
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({host:new URL(config.origin).host,key:config.indexNowKey,keyLocation,urlList:manifest.pages.map(page=>page.url)})
  });
  if(![200,202].includes(response.status)) throw new Error('IndexNow returned '+response.status+': '+await response.text());
  console.log(`IndexNow accepted ${manifest.pages.length} URLs (HTTP ${response.status}). Submission is not an indexing guarantee.`);
}
submit().catch(error=>{console.error(error.message);process.exitCode=1;});
