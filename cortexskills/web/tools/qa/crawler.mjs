import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
import { readFileSync } from 'node:fs';
const B='http://localhost:4000/api'; const call=async(tok,p,m='GET',b)=>(await fetch(B+p,{method:m,headers:{'Content-Type':'application/json',...(tok?{Authorization:'Bearer '+tok}:{})},body:b?JSON.stringify(b):undefined})).json();
const email=process.argv[2]||'admin@maghrebhospitalsgr.ma'; const langs=(process.argv[3]||'en,fr,ar').split(',');
const tok=(await call(null,'/auth/login','POST',{email,password:'CortexSkills#2026'})).token;
const nav=readFileSync('/home/user/scm-process-register/cortexskills/server/src/nav.js','utf8'); const routes0=[...nav.matchAll(/i\('\w+', '\w+', '([^']+)'/g)].map(m=>m[1]); const routes=process.env.ONLY?process.env.ONLY.split(','):routes0;
const ps=await call(tok,'/projects'); const p=ps.find(x=>x.focus==='AI')||ps[0];
const extra=['/process/design?kind=e2e&id=E2E-01','/gov/obs?tab=racsi','/gov/obs?tab=chart','/projects/'+p.id];
const br=await chromium.launch(); const results=[];
for (const lang of langs) {
  await call(tok,'/me/language','PUT',{language:lang});
  for (const W of (process.env.WIDTHS||'1440').split(',').map(Number)) {
  const pg=await br.newPage({viewport:{width:W,height:900}}); let errs=[]; pg.on('pageerror',e=>errs.push('PAGE '+e.message)); pg.on('console',m=>m.type()==='error'&&!/favicon|401/.test(m.text())&&errs.push(m.text()));
  await pg.goto('http://localhost:4000/login'); await pg.evaluate(([t,pid])=>{localStorage.setItem('cs.token',t);localStorage.setItem('cs.project',pid)},[tok,p.id]);
  for (const r of [...routes,...extra]) { errs=[];
    await pg.goto('http://localhost:4000'+r); await pg.waitForLoadState('networkidle').catch(()=>{}); await pg.waitForTimeout(400);
    const info=await pg.evaluate(()=>{const txt=document.querySelector('main, .content-panel, body').innerText; const keys=[...new Set((txt.match(/\b[a-z][a-zA-Z]+\.[a-zA-Z][a-zA-Z0-9.]+\b/g)||[]).filter(k=>!/^(e\.g|i\.e|www\.|[a-z]+\.(ma|com|app|js|json|csv|pdf|docx|xlsx))/.test(k)))]; return {overflow: document.documentElement.scrollWidth>window.innerWidth+1 ? document.documentElement.scrollWidth+'/'+window.innerWidth+' '+[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>window.innerWidth+1).slice(0,3).map(e=>e.tagName+'.'+String(e.className).slice(0,30)).join(','):false, keys: keys.slice(0,6), dir: document.documentElement.dir, h1: document.querySelector('h1')?.innerText||''};});
    if (errs.length||info.overflow||info.keys.length||!info.h1) results.push({lang,W,r,...info,errs:errs.slice(0,3)});
  }
  await pg.close(); }
}
await call(tok,'/me/language','PUT',{language:'en'});
await br.close(); console.log(JSON.stringify(results,null,1)); console.log('routes',routes.length+extra.length,'issues',results.length);
