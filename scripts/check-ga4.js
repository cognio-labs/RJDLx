/* Public HTTP evidence only; does not send GA events or claim dashboard receipt. */
const fs=require('node:fs/promises');
const path=require('node:path');
const cheerio=require('cheerio');
async function main(){
  const origin=process.argv[2]||'https://www.rjdlx.com';
  const report={checkedAt:new Date().toISOString(),origin,pages:[]};
  for(const route of ['/','/contact','/trade']){
    const r=await fetch(origin+route,{signal:AbortSignal.timeout(20000)}),html=await r.text(),$=cheerio.load(html);
    const script=$('script[src^="/js/analytics.js"]').attr('src');
    const row={route,status:r.status,finalUrl:r.url,csp:r.headers.get('content-security-policy'),cspMeta:$('meta[http-equiv="Content-Security-Policy"]').attr('content')||null,googleTagLoaders:$('script[src*="googletagmanager.com/gtag/js"]').map((_,el)=>$(el).attr('src')).get(),analyticsBootstrap:script||null};
    if(script){const asset=await fetch(new URL(script,origin));row.bootstrapStatus=asset.status;row.bootstrapContainsMeasurementId=(await asset.text()).includes('G-J4MKWGPQJL');}
    report.pages.push(row);
  }
  await fs.mkdir(path.join(__dirname,'../artifacts'),{recursive:true});
  await fs.writeFile(path.join(__dirname,'../artifacts/ga4-'+(origin.includes('127.0.0.1')?'local':'live')+'.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
