import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const B='http://localhost:4000/api'; const call=async(tok,p,m='GET',b)=>{const r=await fetch(B+p,{method:m,headers:{'Content-Type':'application/json',...(tok?{Authorization:'Bearer '+tok}:{})},body:b?JSON.stringify(b):undefined});return r.json()};
const tok=(await call(null,'/auth/login','POST',{email:'headld@maghrebhospitalsgr.ma',password:'CortexSkills#2026'})).token;
// find an open task with an inline step not done and not locked
const ps=await call(tok,'/projects'); let target=null;
outer: for (const p of ps) { const ws=await call(tok,'/projects/'+p.id+'/workspace'); for (const ph of ws.phases) for (const it of ph.items) { if (it.status==='Completed') continue; const run=await call(tok,'/e2e-instances/'+it.id);
  for (const t of run.tasks.filter(t=>t.status!=='Completed')) { const st=await call(tok,'/tasks/'+t.id+'/steps'); if (st.locked) continue; const s=st.steps.find(s=>!s.done&&s.form.pattern==='inline'&&s.form.fields.length>=3); if (s){ target={inst:it.id,task:t.id,step:s.id,kind:s.form.kind,project:p.id}; break outer; } } } }
console.log('target',JSON.stringify(target));
const br=await chromium.launch(); const pg=await br.newPage({viewport:{width:1440,height:900}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:4000/login'); await pg.evaluate(([t,p])=>{localStorage.setItem('cs.token',t);localStorage.setItem('cs.project',p)},[tok,target.project]);
await pg.goto(`http://localhost:4000/runs/${target.inst}?task=${target.task}`); await pg.waitForLoadState('networkidle'); await pg.waitForTimeout(800);
const head=pg.locator('.step-head', { hasText: target.step }).first(); if ((await head.getAttribute('aria-expanded'))!=='true') await head.click(); await pg.waitForTimeout(400);
const body=pg.locator('.step-card', { hasText: target.step }).first();
const before=await body.locator('tbody tr').count();
await body.getByRole('button',{name:/Add a row|Add row|Ajouter/}).click(); await pg.waitForTimeout(300);
const results={};
// T1: typing character by character keeps focus and the full value (C1, C2)
const cell=body.locator('tbody tr').last().locator('td.cell input, td.cell textarea').first(); await cell.click();
const text='Data literacy for supervisors'; await pg.keyboard.type(text,{delay:25});
results.T1_value = (await cell.inputValue())===text; results.T1_focus = await cell.evaluate(e=>document.activeElement===e);
// T2: Tab moves to the next cell, previous value kept
await pg.keyboard.press('Tab'); const active2=await pg.evaluate(()=>document.activeElement?.getAttribute('data-cell')||document.activeElement?.className);
results.T2_tabMoves = !!active2 && (await cell.inputValue())===text;
// T3: Escape restores the value present when the cell was entered
const c3=body.locator('tbody tr').last().locator('td.cell input').nth(1); if (await c3.count()) { await c3.click(); const v0=await c3.inputValue(); await pg.keyboard.type('XYZ'); await pg.keyboard.press('Escape'); results.T3_escape=(await c3.inputValue())===v0; await pg.keyboard.type('Every 5 days'); }
// T4: leave the row → autosave → focus stays where the user went, values kept
await pg.locator('h1').click(); await pg.waitForTimeout(1800);
const st=await call(tok,'/tasks/'+target.task+'/steps'); const s=st.steps.find(x=>x.id===target.step);
results.T4_saved = s.rows.some(r=>JSON.stringify(r).includes('Data literacy for supervisors'));
results.T4_valueKept = (await body.locator('tbody tr').last().locator('td.cell input, td.cell textarea').first().inputValue())===text;
// T5: retype in a saved row while the refresh happens: draft wins
const c5=body.locator('tbody tr').last().locator('td.cell input, td.cell textarea').first(); await c5.click(); await pg.keyboard.press('End'); await pg.keyboard.type(' 2026',{delay:20});
results.T5_draftKept=(await c5.inputValue())===text+' 2026' && await c5.evaluate(e=>document.activeElement===e);
await pg.locator('h1').click(); await pg.waitForTimeout(1500);
// T6: Row Editor opens, edits, Back keeps the draft
await body.locator('tbody tr').last().getByRole('button',{name:/Row Editor|éditeur/}).click(); await pg.waitForTimeout(400);
const dlg=pg.locator('aside.drawer[role=dialog]').last(); results.T6_editorOpen=await dlg.isVisible();
const f=dlg.locator('input.input, textarea.input').first(); await f.click(); await pg.keyboard.press('End'); await pg.keyboard.type('!'); await dlg.getByRole('button',{name:/Back to the table|Retour/}).click(); await pg.waitForTimeout(300);
results.T6_backKeeps=(await body.locator('tbody tr').last().locator('td.cell input, td.cell textarea').first().inputValue()).endsWith('!');
results.T6_focusReturned = await pg.evaluate(()=>!!document.activeElement && document.activeElement!==document.body);
// T7: paste a block of two rows
await pg.locator('h1').click(); await pg.waitForTimeout(1200);
const n0=await body.locator('tbody tr').count(); const pc=body.locator('tbody tr').last().locator('td.cell input').first();
await pc.click(); await pc.evaluate(e=>{const dt=new DataTransfer();dt.setData('text/plain','Pasted A\nPasted B');e.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true}));}); await pg.waitForTimeout(500);
results.T7_paste=(await body.locator('tbody tr').count())>=n0+1;
await pg.locator('h1').click(); await pg.waitForTimeout(1500);
// T8: delete with Undo restores the row
const n1=await body.locator('tbody tr').count(); await body.locator('tbody tr').last().getByRole('button',{name:/^Delete|Supprimer/}).click(); await pg.waitForTimeout(200);
await pg.getByRole('button',{name:/Undo|Annuler/}).first().click(); await pg.waitForTimeout(300); results.T8_undo=(await body.locator('tbody tr').count())===n1;
results.errors=errs; console.log(JSON.stringify(results,null,1)); await pg.screenshot({path:process.argv[2]||'/tmp/claude-0/-home-user-scm-process-register/da8a407e-c889-5ec4-8497-ad18eb759d54/scratchpad/ui/foc.png'}); await br.close();
