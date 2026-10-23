const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname,'../js/analytics.js'),'utf8');
function setup(saved, blocked=false, search='') {
  const listeners={};
  const banner={hidden:true,addEventListener:(event,fn)=>{listeners.click=fn;}};
  const window={location:{origin:'https://www.rjdlx.com',pathname:'/',search,hash:''},localStorage:{getItem:()=>{if(blocked)throw Error('storage blocked');return saved;},setItem:(_,value)=>{if(blocked)throw Error('storage blocked');saved=value;}}};
  const document={title:'RJDLx home',body:{dataset:{staticPage:'true'}},readyState:'loading',addEventListener:(event,fn)=>{listeners[event]=fn;},getElementById:()=>banner};
  const context=vm.createContext({window,document,URLSearchParams});
  vm.runInContext(source,context);
  const commands=()=>Array.from(window.dataLayer,entry=>Array.from(entry));
  const views=()=>commands().filter(entry=>entry[0]==='event'&&entry[1]==='page_view');
  const choose=choice=>listeners.click({target:{closest:()=>({getAttribute:()=>choice})}});
  return {window,document,banner,context,commands,views,choose,ready:()=>listeners.DOMContentLoaded()};
}
test('fresh visitor: consent precedes config; no page view until Accept; repeat clicks deduplicate',()=>{
  const s=setup(null);s.ready();
  assert.equal(s.commands()[0][0],'consent');
  assert.equal(s.commands()[0][2].analytics_storage,'denied');
  assert.equal(s.commands().find(c=>c[0]==='config')[1],'G-J4MKWGPQJL');
  assert.equal(s.commands().find(c=>c[0]==='config')[2].send_page_view,false);
  assert.equal(s.views().length,0);assert.equal(s.banner.hidden,false);
  s.choose('granted');s.choose('granted');s.window.rjdlxTrackPageView();
  assert.equal(s.views().length,1);assert.equal(s.banner.hidden,true);
  assert.equal(s.views()[0][2].send_to,'G-J4MKWGPQJL');
});
test('returning visitor and repeated execution initialize once independently of main.js',()=>{
  const s=setup('granted');s.ready();vm.runInContext(source,s.context);s.window.rjdlxTrackPageView();
  assert.equal(s.views().length,1);assert.equal(s.commands().filter(c=>c[0]==='config').length,1);
  assert.equal(s.commands().find(c=>c[0]==='config')[2].debug_mode,undefined);
});
test('decline suppresses manual page views, including returning visitors',()=>{
  const fresh=setup(null);fresh.ready();fresh.choose('denied');fresh.window.rjdlxTrackPageView();
  assert.equal(fresh.views().length,0);
  const returning=setup('denied');returning.ready();assert.equal(returning.views().length,0);assert.equal(returning.banner.hidden,true);
});
test('storage restrictions do not break Accept; unknown consent values stay opted out',()=>{
  const s=setup(null,true);s.ready();s.choose('granted');assert.equal(s.views().length,1);
  const invalid=setup('unexpected');invalid.ready();assert.equal(invalid.views().length,0);assert.equal(invalid.banner.hidden,false);
});
test('section anchors deduplicate; real pages and legacy view routes can be measured',()=>{
  const s=setup('granted');s.ready();s.window.location.hash='#material';s.window.rjdlxTrackPageView();assert.equal(s.views().length,1);
  s.window.location.pathname='/trade';s.document.title='Trade';s.window.rjdlxTrackPageView();assert.equal(s.views().length,2);
  s.window.location.pathname='/';s.window.location.hash='#/custom';s.window.rjdlxTrackPageView();assert.equal(s.views().length,3);
  assert.equal(s.views()[2][2].page_location,'https://www.rjdlx.com/#/custom');
});
test('debug mode is explicit and legacy redirect documents do not emit an extra view',()=>{
  const s=setup('granted',false,'?ga_debug=1');
  assert.equal(s.commands().find(c=>c[0]==='config')[2].debug_mode,true);
  s.window.location.hash='#/trade';s.ready();assert.equal(s.views().length,0);
});
