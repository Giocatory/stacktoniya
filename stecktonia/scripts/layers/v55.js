// ===== v55: движок режимов «Подготовка к ГИА (демонстрационный экзамен)» и «Подготовка к Профессионалам» =====
// Модульные конкурсные форматы: модули с весами, общий (ДЭ) или модульный (Профессионалы) таймер, общая схема или схема на модуль,
// «дополнение заказчика», панель эксперта (корректировка критериев, комментарии, судейские аспекты), протокол, рейтинг, аналитика,
// возобновление после перезагрузки, режим без справки. Содержание (форматы и задания) — в v56.js.
const CMP={};            // форматы: ge, pr (заполняются в v56)
const CMX={};            // провайдеры заданий по имени
let CMS=null,CMT=null;
const cmReg=k=>{try{return JSON.parse(localStorage.getItem('nl_cm_'+k)||'[]')}catch(e){return[]}};
const cmRegSave=(k,a)=>{try{localStorage.setItem('nl_cm_'+k,JSON.stringify(a.slice(-300)))}catch(e){}};
const cmFmt=s=>{s=Math.max(0,Math.round(s));const h=Math.floor(s/3600);return(h?h+':':'')+String(Math.floor(s%3600/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
const cmR1=x=>Math.round(x*10)/10;
const cmKey=t=>String(t).replace(/\d+/g,'#').slice(0,90);
function cmProv(n){if(CMX[n])return CMX[n];const e=EXQ.find(q=>q.n===n);if(e)return e;if(typeof cmRebuild==='function')return cmRebuild(n);return null}
const cmCritOf=m=>{const p=m.prov,c=p.crit(m.ctx).map(x=>[x[0],x[1],x[2],false]);if(p.late)p.late.crit(m.ctx).forEach(x=>c.push([x[0],x[1],x[2],true]));return c};
function cmEval(m){const cs=cmCritOf(m);let sum=0,max=0;const list=cs.map(([t,p,f,late],i)=>{let auto=false;try{auto=!!f()}catch(e){}const ov=m.ov&&m.ov[i];const ok=ov===1?true:ov===0?false:auto;max+=p;if(ok)sum+=p;return{t,p,ok,auto,late,ov:ov===undefined?null:ov}});return{sum,max,list}}
function cmApplyOv(m){if(!m.res)return;let sum=0;m.res.list.forEach((c,i)=>{const ov=m.ov&&m.ov[i];c.ov=ov===undefined?null:ov;c.ok=ov===1?true:ov===0?false:c.auto;if(c.ok)sum+=c.p});m.res.sum=sum}
function cmGrade(M,pc){const s=(CMS&&CMS.scale)||M.scale;return pc>=s[0]?5:pc>=s[1]?4:pc>=s[2]?3:2}
const cmGradeTxt=g=>({5:'отлично',4:'хорошо',3:'удовлетворительно',2:'неудовлетворительно'})[g];
function cmBuild(key,name,variant,o){o=o||{};exSyncCustom();const M=CMP[key],r=exRng(variant*7919+key.charCodeAt(0)*31+5);
 const sc=M.scen?M.scen.init(exRng(variant*31337+11),variant):null;
 const mods=M.mods.map((d,i)=>{const rr=exRng(variant*104729+i*977+7),g=d.mk(rr,sc,variant);return{def:d,prov:g.prov,ctx:g.ctx,snap:null,res:null,att:0,spent:0,t0:0,done:false,last:null,ov:{},cmt:'',lateShown:false}});
 const sale=(o.scale&&o.scale.length===3)?o.scale:M.scale;
 return{key,name:name||'',group:o.group||'',variant,hide:!!o.hide,restrict:!!o.restrict,scale:sale,mods,cur:-1,t0:Date.now(),final:null,judge:M.judge.map(()=>0),sc,shared:!!M.scen,scStarted:false,warned:{}}}
function cmMin(m){return m.def.min||m.prov.min||20}
function cmLeft(){if(!CMS)return 0;const M=CMP[CMS.key];if(M.shared)return M.total*60-(Date.now()-CMS.t0)/1000;const m=CMS.mods[CMS.cur];return m?cmMin(m)*60-(m.spent+(Date.now()-m.t0)/1000):0}
function cmSwap(m,f){const keep=JSON.stringify(S),ksel=sel;try{S=JSON.parse(m.snap);return f()}finally{S=JSON.parse(keep);sel=ksel}}
function cmEvalMod(m){const live=CMS.shared||(CMS.cur>=0&&CMS.mods[CMS.cur]===m);if(live)return cmEval(m);if(m.snap)return cmSwap(m,()=>cmEval(m));
 const cs=cmCritOf(m);let max=0;const list=cs.map(([t,p,f,late])=>{max+=p;return{t,p,ok:false,auto:false,late,ov:null}});return{sum:0,max,list}}
function cmLeave(){const m=CMS.mods[CMS.cur];if(!m)return;m.spent+=(Date.now()-m.t0)/1000;if(!CMS.shared)m.snap=JSON.stringify(S)}
function cmLateAt(m){const l=m.prov.late;return l?cmMin(m)*60*l.at:Infinity}
function cmEnter(i){if(CMS.cur===i)return;if(CMS.cur>=0)cmLeave();const m=CMS.mods[i];CMS.cur=i;m.t0=Date.now();
 if(CMS.shared){if(!CMS.scStarted){CMS.scStarted=true;CMP[CMS.key].scen.start(CMS.sc)}}
 else if(m.snap){S=JSON.parse(m.snap);sel=null;ch();draw();side()}else{if(m.prov.start)m.prov.start(m.ctx)}
 cmPanel();cmTick();cmSave()}
function cmLock(on){document.body.classList.toggle('cm-lock',!!on);if(typeof qhModeSet==='function'){if(on){if(CMS&&CMS.qhPrev===undefined){CMS.qhPrev=qhMode}qhModeSet('off')}else if(CMS&&CMS.qhPrev!==undefined){qhModeSet(CMS.qhPrev);CMS.qhPrev=undefined}}}
function cmStart(key,name,variant,o){if(CMT)clearInterval(CMT);if(typeof EXS!=='undefined'&&EXS&&!EXS.final)exStop();if(CMS)cmLock(false);CMS=cmBuild(key,name,variant,o);if(CMS.restrict)cmLock(true);cmEnter(0);CMT=setInterval(cmTick,1000);return CMS}
function cmWarn(l){const w=CMS.warned,k=CMS.shared?'g':CMS.cur;[[600,'10 минут'],[300,'5 минут'],[60,'1 минута']].forEach(([s,t])=>{const id=k+':'+s;if(l<=s&&l>s-4&&!w[id]){w[id]=1;p('⏱ Осталось '+t+(CMS.shared?' до конца экзамена.':' до конца модуля.'))}})}
function cmTick(){if(!CMS||CMS.final)return;const l=cmLeft(),h=document.getElementById('cmh');if(h){h.textContent=(l<0?'−':'')+cmFmt(Math.abs(l));h.style.color=l<300?'#e5484d':''}
 const M=CMP[CMS.key],m=CMS.mods[CMS.cur];cmWarn(l);
 if(m&&m.prov.late&&!m.lateShown&&!M.shared&&(m.spent+(Date.now()-m.t0)/1000)>=cmLateAt(m))cmReveal(m);
 if(l<=-0.5){if(M.shared)cmFinish(true);else cmNext(true)}
 CMS._sv=(CMS._sv||0)+1;if(CMS._sv%5===0)cmSave()}
function cmReveal(m){if(m.lateShown)return;m.lateShown=true;p('📩 Дополнение заказчика к модулю «'+m.def.id+'»: '+m.prov.late.text(m.ctx));cmPanel();cmSave()}
function cmCheck(){const m=CMS.mods[CMS.cur];m.att++;m.last=cmEval(m);cmPanel();cmSave()}
function cmNext(timeout){const m=CMS.mods[CMS.cur];
 if(!timeout&&m.prov.late&&!m.lateShown){cmReveal(m);alert('Поступило дополнение заказчика — оно показано в панели. Выполните его до завершения модуля.');return false}
 m.done=true;m.timeout=!!timeout;m.last=cmEval(m);
 const nx=CMS.mods.findIndex((x,i)=>i>CMS.cur&&!x.done);if(nx<0){cmFinish(false);return true}p(`Модуль «${m.def.id}» завершён. Загружен модуль «${CMS.mods[nx].def.id}».`);cmEnter(nx);return true}
function cmTotals(){const M=CMP[CMS.key];let sum=0,tt=0;CMS.mods.forEach(m=>{const r=m.res||{sum:0,max:1};m.pts=cmR1(m.def.w*r.sum/(r.max||1));sum+=m.pts;tt+=m.spent});
 const jmax=M.judge.reduce((a,x)=>a+x.max,0),js=CMS.judge.reduce((a,x)=>a+(+x||0),0),rest=100-M.mods.reduce((a,x)=>a+x.w,0);const jw=jmax?cmR1(Math.min(js,jmax)/jmax*rest):0;
 return{mods:cmR1(sum),judge:jw,total:cmR1(sum+jw),time:Math.round(tt),max:100}}
function cmFinish(timeout){if(!CMS||CMS.final)return;cmLeave();CMS.mods.forEach(m=>{m.res=cmEvalMod(m);m.done=true});CMS.timeout=!!timeout;const T=cmTotals();CMS.final={...T,at:new Date().toLocaleString('ru-RU'),id:Date.now()};
 if(CMT)clearInterval(CMT);CMT=null;CMS.cur=-1;cmRegAdd();cmClearRun();cmLock(false);cmPanel();openMd(cmResultHtml())}
function cmRegAdd(){const M=CMP[CMS.key],a=cmReg(CMS.key),fails=[];CMS.mods.forEach(m=>m.res.list.forEach(c=>{if(!c.ok)fails.push(m.def.id+'|'+cmKey(c.t))}));
 const e={id:CMS.final.id,name:CMS.name||'участник',group:CMS.group,variant:CMS.variant,at:CMS.final.at,total:CMS.final.total,time:CMS.final.time,mods:CMS.mods.map(m=>m.pts),judge:CMS.final.judge,fails,crit:CMS.mods.map(m=>m.res.list.map(c=>c.ok?c.p:0))};
 const i=a.findIndex(x=>x.id===e.id);if(i>=0)a[i]=e;else a.push(e);cmRegSave(CMS.key,a)}
function cmStop(){if(CMT)clearInterval(CMT);CMT=null;cmLock(false);CMS=null;cmClearRun();cmPanel()}
// ---------- сохранение и возобновление ----------
const cmClearRun=()=>{try{localStorage.removeItem('nl_cm_run')}catch(e){}};
function cmSave(){if(!CMS||CMS.final)return;try{const m=CMS.cur>=0?CMS.mods[CMS.cur]:null;
 localStorage.setItem('nl_cm_run',JSON.stringify({key:CMS.key,name:CMS.name,group:CMS.group,variant:CMS.variant,hide:CMS.hide,restrict:CMS.restrict,scale:CMS.scale,t0:CMS.t0,cur:CMS.cur,sc:CMS.sc,scStarted:CMS.scStarted,warned:CMS.warned,qhPrev:CMS.qhPrev,savedAt:Date.now(),
  mods:CMS.mods.map((x,i)=>({pn:x.prov.n,ctx:x.ctx,snap:(i===CMS.cur&&!CMS.shared)?JSON.stringify(S):x.snap,spent:x.spent+(i===CMS.cur&&CMS.cur>=0?(Date.now()-x.t0)/1000:0),done:x.done,att:x.att,timeout:x.timeout,ov:x.ov,cmt:x.cmt,lateShown:x.lateShown}))}))}catch(e){}}
function cmSavedRun(){try{const j=localStorage.getItem('nl_cm_run');return j?JSON.parse(j):null}catch(e){return null}}
function cmResume(){const j=cmSavedRun();if(!j||!CMP[j.key])return false;const M=CMP[j.key];exSyncCustom();
 const mods=[];for(let i=0;i<j.mods.length;i++){const s=j.mods[i],p=cmProv(s.pn);if(!p||!M.mods[i])return false;mods.push({def:M.mods[i],prov:p,ctx:s.ctx,snap:s.snap||null,res:null,att:s.att||0,spent:s.spent||0,t0:Date.now(),done:!!s.done,last:null,ov:s.ov||{},cmt:s.cmt||'',lateShown:!!s.lateShown,timeout:s.timeout})}
 CMS={key:j.key,name:j.name,group:j.group,variant:j.variant,hide:j.hide,restrict:j.restrict,scale:j.scale,mods,cur:j.cur,t0:j.t0,final:null,judge:M.judge.map(()=>0),sc:j.sc,shared:!!M.scen,scStarted:j.scStarted,warned:j.warned||{},qhPrev:j.qhPrev};
 if(CMS.cur<0||!CMS.mods[CMS.cur])CMS.cur=0;
 if(CMS.restrict)cmLock(true);if(CMT)clearInterval(CMT);CMT=setInterval(cmTick,1000);cmPanel();cmTick();return true}
// ---------- протокол ----------
function cmCritRows(m,edit,mi){return m.res.list.map((c,i)=>{const mark=c.ov!==null&&c.ov!==undefined?' <i>(изм. экспертом)</i>':'';
 const sel=edit?` <select data-ov="${mi}:${i}" style="font-size:12px"><option value="">авто</option><option value="1"${c.ov===1?' selected':''}>зачесть</option><option value="0"${c.ov===0?' selected':''}>не зачесть</option></select>`:'';
 return`<li class="${c.ok?'ok':'er'}">${c.ok?'✔':'✖'} ${c.late?'<b>[дополнение]</b> ':''}${esc(c.t)} <i>(${c.ok?c.p:0}/${c.p})</i>${mark}${sel}</li>`}).join('')}
function cmResultHtml(forFile){const M=CMP[CMS.key],f=CMS.final;cmTotals();const pc=f.total,g=cmGrade(M,pc);
 const rows=CMS.mods.map(m=>`<tr><td>Модуль ${esc(m.def.id)}. ${esc(m.def.name)}<br><small>${esc(m.prov.n)}${m.timeout?' (время вышло)':''}</small></td><td>${m.res.sum} из ${m.res.max}</td><td>${m.pts} из ${m.def.w}</td><td>${cmFmt(m.spent)}</td><td>${m.att}</td></tr>`).join('');
 const det=CMS.mods.map((m,mi)=>`<h4>Модуль ${esc(m.def.id)}. ${esc(m.def.name)} — ${m.pts}/${m.def.w}</h4><p class="mt">${esc(m.prov.text(m.ctx))}${m.prov.late?'<br><b>Дополнение заказчика:</b> '+esc(m.prov.late.text(m.ctx)):''}</p><ul>${cmCritRows(m,!forFile,mi)}</ul>${forFile?(m.cmt?`<p><b>Комментарий эксперта:</b> ${esc(m.cmt)}</p>`:''):`<p>Комментарий эксперта: <input data-cmt="${mi}" value="${esc(m.cmt||'')}" style="width:70%"></p>`}`).join('');
 const jrows=M.judge.map((j,i)=>{const cur=+CMS.judge[i]||0;if(forFile){const lv=j.levels.find(l=>l[0]===cur);return`<tr><td>${esc(j.t)}</td><td>${cur} из ${j.max}${lv?' — '+esc(lv[1]):''}</td></tr>`}
  return`<tr><td>${esc(j.t)}</td><td><select data-ji="${i}">${j.levels.map(l=>`<option value="${l[0]}"${l[0]===cur?' selected':''}>${l[0]} — ${esc(l[1])}</option>`).join('')}</select></td></tr>`}).join('');
 const judge=M.judge.length?`<h4>Судейские аспекты (выставляет эксперт)</h4><table>${jrows}</table>`:'';
 const tail=CMS.key==='ge'?`<p style="font-size:20px"><b>Итог: ${f.total} из 100 — оценка ${g} (${cmGradeTxt(g)})</b></p><p class="mt">Шкала (учебная, настраивается при запуске): «5» — от ${CMS.scale[0]}%, «4» — от ${CMS.scale[1]}%, «3» — от ${CMS.scale[2]}%.</p>`
  :`<p style="font-size:20px"><b>Итог: ${f.total} из 100${f.total>=70?' — уровень «медальон профессионализма» (учебный порог 70)':''}</b></p><p class="mt">Время всех модулей: ${cmFmt(f.time)}. Место определяется в рейтинге участников.</p>`;
 const act=forFile?'':'<p><button data-x="cm_apply"><b>Сохранить оценки эксперта</b></button> <button data-x="cm_dl">Скачать протокол</button> <button data-x="cm_board">Рейтинг участников</button> <button data-x="cm_new">Новый запуск</button></p><p class="mt">Эксперт может изменить результат любого критерия («зачесть» / «не зачесть»), добавить комментарий и выставить судейские аспекты; после этого нажмите «Сохранить оценки эксперта» — итог и рейтинг пересчитаются.</p>';
 return`<h3>${forFile?'Протокол':'Результат'}: ${esc(M.title)}</h3><p><b>${esc(CMS.name||'участник')}</b>${CMS.group?', '+esc(CMS.group):''}, вариант ${CMS.variant}; ${esc(f.at)}${CMS.timeout?'; время вышло':''}</p>${tail}${act}<table><tr><th>Модуль</th><th>Критерии</th><th>Баллы</th><th>Время</th><th>Проверок</th></tr>${rows}${M.judge.length?`<tr><td>Судейские аспекты</td><td></td><td>${f.judge} из ${100-M.mods.reduce((a,x)=>a+x.w,0)}</td><td></td><td></td></tr>`:''}</table>${judge}${det}`}
function cmDownload(){const M=CMP[CMS.key],h=`<!doctype html><html lang="ru"><meta charset="utf-8"><title>Протокол</title><style>body{font:14px system-ui,sans-serif;margin:24px;max-width:900px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #888;padding:4px 8px;text-align:left}.ok{color:#1a7f45}.er{color:#c33}</style><body>${cmResultHtml(true)}<p style="margin-top:40px">Эксперт: ______________ / ______________ /&nbsp;&nbsp;&nbsp; Дата: ____________</p></body></html>`;
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([h],{type:'text/html;charset=utf-8'}));a.download=`Протокол_${M.short.replace(/[^\wа-яА-Я]+/g,'_')}_${(CMS.name||'участник').replace(/[^\wа-яА-Я]+/g,'_')}.html`;document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(a.href)},500)}
// ---------- рейтинг и аналитика ----------
function cmBoardRows(k){return cmReg(k).sort((a,b)=>b.total-a.total||a.time-b.time)}
function cmErrStats(k){const a=cmReg(k),cnt={};a.forEach(x=>{[...new Set(x.fails||[])].forEach(f=>{cnt[f]=(cnt[f]||0)+1})});return Object.entries(cnt).sort((x,y)=>y[1]-x[1]).slice(0,10).map(([f,n])=>({f,n,pc:Math.round(100*n/(a.length||1))}))}
function cmBoardHtml(k){const M=CMP[k],a=cmBoardRows(k),med=['🥇','🥈','🥉'],es=cmErrStats(k);
 return`<h3>Рейтинг: ${esc(M.title)}</h3>${a.length?`<table><tr><th>Место</th><th>Участник</th><th>Группа</th><th>Вар.</th><th>Баллы</th><th>Время</th><th>Дата</th></tr>${a.map((x,i)=>`<tr><td>${k==='pr'&&i<3?med[i]+' ':''}${i+1}</td><td>${esc(x.name)}</td><td>${esc(x.group||'')}</td><td>${x.variant}</td><td><b>${x.total}</b></td><td>${cmFmt(x.time)}</td><td>${esc(x.at)}</td></tr>`).join('')}</table>`:'<p class="mt">Пока нет результатов. Они сохраняются в браузере этого компьютера.</p>'}
${es.length?`<h4>Частые ошибки группы</h4><table><tr><th>Модуль</th><th>Критерий</th><th>Не выполнили</th></tr>${es.map(e=>`<tr><td>${esc(e.f.split('|')[0])}</td><td>${esc(e.f.split('|').slice(1).join('|'))}</td><td>${e.n} из ${a.length} (${e.pc}%)</td></tr>`).join('')}</table><p class="mt">Критерии с похожими числами объединяются. Эти темы стоит разобрать с группой.</p>`:''}
<p><button data-x="cm_csv" data-k="${k}">Скачать ведомость CSV</button> <button data-x="cm_csv2" data-k="${k}">CSV по критериям</button> <button data-x="cm_clear" data-k="${k}">Очистить рейтинг</button> <button data-x="cm_menu" data-k="${k}">← К запуску</button></p>`}
function cmDl(name,text){const el=document.createElement('a');el.href=URL.createObjectURL(new Blob(['﻿'+text],{type:'text/csv;charset=utf-8'}));el.download=name;document.body.appendChild(el);el.click();setTimeout(()=>{el.remove();URL.revokeObjectURL(el.href)},500)}
const cmQ=c=>'"'+String(c).replace(/"/g,'""')+'"';
function cmCsv(k){const a=cmBoardRows(k),M=CMP[k];const rows=[['Место','Участник','Группа','Вариант','Баллы','Время, с','Дата',...M.mods.map(m=>'Модуль '+m.id),'Судейские']].concat(a.map((x,i)=>[i+1,x.name,x.group||'',x.variant,x.total,x.time,x.at,...(x.mods||[]),x.judge||0]));cmDl(`Рейтинг_${M.short.replace(/[^\wа-яА-Я]+/g,'_')}.csv`,rows.map(r=>r.map(cmQ).join(';')).join('\r\n'))}
function cmCsv2(k){const a=cmBoardRows(k),M=CMP[k];const rows=[['Место','Участник','Группа','Вариант','Баллы']];const mx=M.mods.map((m,i)=>Math.max(0,...a.map(x=>(x.crit&&x.crit[i]||[]).length)));
 M.mods.forEach((m,i)=>{for(let c=0;c<mx[i];c++)rows[0].push(`${m.id}${c+1}`)});a.forEach((x,i)=>{const r=[i+1,x.name,x.group||'',x.variant,x.total];M.mods.forEach((m,mi)=>{for(let c=0;c<mx[mi];c++)r.push((x.crit&&x.crit[mi]&&x.crit[mi][c]!==undefined)?x.crit[mi][c]:'')});rows.push(r)});cmDl(`Критерии_${M.short.replace(/[^\wа-яА-Я]+/g,'_')}.csv`,rows.map(r=>r.map(cmQ).join(';')).join('\r\n'))}
// ---------- окно запуска ----------
function cmMenu(k){const M=CMP[k];exSyncCustom();const v=1+Math.floor(Math.random()*99),sv=cmSavedRun();
 const mt=M.mods.map(m=>`<tr><td>${esc(m.id)}</td><td>${esc(m.name)}</td><td>${m.w}</td><td>${M.shared?'общее':m.min+' мин'}</td><td>${esc(m.about||'')}</td></tr>`).join('');
 const jt=M.judge.reduce((a,x)=>a+x.max,0);
 return`<h3>${esc(M.title)}</h3>${sv?`<p style="border:1px solid var(--er);padding:6px 10px;border-radius:8px"><b>Есть прерванная работа:</b> ${esc(sv.name||'участник')}, ${esc(CMP[sv.key].short)}, вариант ${sv.variant}. <button data-x="cm_resume">Продолжить</button> <button data-x="cm_drop">Удалить</button></p>`:''}<p class="mt">${esc(M.desc)}</p>
<p class="mt"><b>Важно:</b> это учебная модель формата. Задания, критерии и шкала оценивания составлены для тренировки и не являются официальными материалами демонстрационного экзамена или чемпионата; нормативные требования уточняйте у методиста.</p>
<table><tr><th>Модуль</th><th>Содержание</th><th>Вес</th><th>Время</th><th>Что проверяется</th></tr>${mt}${M.judge.length?`<tr><td></td><td>Судейские аспекты (эксперт)</td><td>${100-M.mods.reduce((a,x)=>a+x.w,0)}</td><td></td><td>${M.judge.map(j=>esc(j.t)).join('; ')}</td></tr>`:''}</table>
<p>${M.shared?`Общее время: ${M.total} мин. `:''}Фамилия и имя: <input id="cm_n" style="width:200px"> Группа: <input id="cm_g" style="width:70px"> Вариант: <input id="cm_v" type="number" min="1" max="9999" value="${v}" style="width:70px"></p>
<p>Шкала оценок, %: «5» от <input id="cm_s5" type="number" value="${M.scale[0]}" style="width:50px"> «4» от <input id="cm_s4" type="number" value="${M.scale[1]}" style="width:50px"> «3» от <input id="cm_s3" type="number" value="${M.scale[2]}" style="width:50px">${k==='pr'?' (для Профессионалов оценка не выставляется)':''}</p>
<p><label><input type="checkbox" id="cm_h"${k==='pr'?' checked':''}> Скрыть баллы по критериям до конца (как на соревновании)</label><br><label><input type="checkbox" id="cm_r"${k==='pr'?' checked':''}> Режим без справки: скрыть Инструкцию, Шаблоны, Пример, Аварии и подсказки «?» (организационная мера, не защита от обхода)</label></p>
<p><button data-x="cm_go" data-k="${k}"><b>Начать</b></button> <button data-x="cm_board" data-k="${k}">Рейтинг участников (${cmReg(k).length})</button></p>
<p class="mt">Начало заменяет текущую схему — сохраните свою работу («Экспорт/импорт»). Номер варианта задаёт набор заданий и числа: один номер — те же условия. Если страницу случайно закрыть или перезагрузить, работа продолжится, время при этом не останавливается.</p>`}
// ---------- панель ----------
document.head.insertAdjacentHTML('beforeend','<style>#cmp{position:fixed;left:10px;top:104px;width:360px;max-height:72vh;overflow:auto;z-index:21;background:var(--pn);border:1px solid var(--bd);border-radius:10px;box-shadow:0 4px 18px rgba(0,0,0,.3);font-size:13px}#cmp .eh{display:flex;gap:8px;align-items:center;padding:6px 10px;cursor:pointer;position:sticky;top:0;background:var(--pn);border-bottom:1px solid var(--bd)}#cmp .eh b{flex:1}#cmp .eh span{font-variant-numeric:tabular-nums;font-weight:700}#cmp .eb{padding:8px 10px}#cmp.min .eb{display:none}#cmp li{margin:2px 0}#cmp .ok{color:#2e9e5b}#cmp .er{color:#e5484d}#cmp button{margin:2px 2px 2px 0}#cmp .tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px}#cmp .tabs button.on{background:var(--ac);color:#fff}#cmp .tabs button[disabled]{opacity:.5}#cmp .late{border-left:4px solid #d9822b;background:rgba(217,130,43,.12);padding:6px 8px;border-radius:6px;margin:6px 0}.cm-lock #bh,.cm-lock #btpl,.cm-lock #bs,.cm-lock #bfl,.cm-lock #bex,.cm-lock #bt,.cm-lock #qhbtn{display:none!important}</style>');
document.body.insertAdjacentHTML('beforeend','<div id="cmp" hidden></div>');
function cmPanel(){const el=document.getElementById('cmp');if(!CMS||CMS.final){el.hidden=true;el.innerHTML='';return}
 const M=CMP[CMS.key],m=CMS.mods[CMS.cur],keep=el.classList.contains('min');if(!m){el.hidden=true;return}const cs=cmCritOf(m).filter(c=>!c[3]),lc=cmCritOf(m).filter(c=>c[3]),L=m.last;
 const tabs=CMS.mods.map((x,i)=>`<button data-x="cm_tab" data-i="${i}" class="${i===CMS.cur?'on':''}"${(!M.free&&i!==CMS.cur)?' disabled':''}>${esc(x.def.id)}${x.done?' ✓':''}</button>`).join('');
 const li=(arr,off)=>arr.map(([t,pt],i)=>{if(L&&!CMS.hide){const c=L.list[i+off];return c?`<li class="${c.ok?'ok':'er'}">${c.ok?'✔':'✖'} ${esc(t)} <i>(${pt})</i></li>`:`<li>${esc(t)}</li>`}return`<li>${esc(t)}${CMS.hide?'':' <i>('+pt+')</i>'}</li>`}).join('');
 const late=m.lateShown?`<div class="late"><b>📩 Дополнение заказчика</b><br>${esc(m.prov.late.text(m.ctx))}<ul style="padding-left:18px;margin:4px 0">${li(lc,cs.length)}</ul></div>`:'';
 const prev=(L&&!CMS.hide)?`<p><b>Предварительно: ${L.sum} из ${L.max}</b></p>`:'';
 el.hidden=false;el.className=keep?'min':'';
 el.innerHTML=`<div class="eh" data-x="cm_min"><b>${esc(M.short)} · модуль ${esc(m.def.id)}</b><span id="cmh">${cmFmt(cmLeft())}</span><span>▾</span></div><div class="eb"><div class="tabs">${tabs}</div><p><b>${esc(m.def.name)}</b> <i>(вес ${m.def.w})</i></p><p><b>${esc(m.prov.n)}</b></p><p style="white-space:pre-line">${esc(m.prov.text(m.ctx))}</p><p class="mt">Критерии оценки${CMS.hide?'':' (баллы)'}:</p><ul style="padding-left:18px;margin:4px 0">${li(cs,0)}</ul>${late}${prev}${CMS.hide?'<p class="mt">Баллы по критериям скрыты до завершения.</p>':''}<p>${CMS.hide?'':'<button data-x="cm_chk">Проверить</button>'}${M.free?'':`<button data-x="cm_next"><b>${CMS.mods.some((x,i)=>i>CMS.cur&&!x.done)?'Завершить модуль':'Завершить соревнование'}</b></button>`}${M.free?'<button data-x="cm_fin"><b>Завершить экзамен</b></button>':''}<button data-x="cm_stop">Прервать</button></p></div>`}
document.getElementById('cmp').addEventListener('pointerdown',e=>e.stopPropagation());
document.getElementById('cmp').addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(!b||!CMS)return;const k=b.dataset.x;
 if(k==='cm_min')document.getElementById('cmp').classList.toggle('min');else if(k==='cm_chk')cmCheck();else if(k==='cm_tab'){const i=+b.dataset.i;if(CMP[CMS.key].free)cmEnter(i)}
 else if(k==='cm_next'){if(confirm('Завершить модуль? Вернуться к нему будет нельзя.'))cmNext(false)}
 else if(k==='cm_fin'){if(confirm('Завершить экзамен и получить результат? Незавершённые модули оцениваются как есть.'))cmFinish(false)}
 else if(k==='cm_stop'){if(confirm('Прервать без результата?'))cmStop()}});
// ---------- кнопки и окно ----------
document.getElementById('bex').insertAdjacentHTML('afterend','<button id="bge" title="Подготовка к ГИА: демонстрационный экзамен">ГИА · ДЭ</button><button id="bpr" title="Подготовка к чемпионату «Профессионалы»">Профессионалы</button>');
document.getElementById('bge').onclick=()=>openMd(CMS&&CMS.final&&CMS.key==='ge'?cmResultHtml():cmMenu('ge'));
document.getElementById('bpr').onclick=()=>openMd(CMS&&CMS.final&&CMS.key==='pr'?cmResultHtml():cmMenu('pr'));
md.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-x]'),k=b&&b.dataset.x;if(!k||!k.startsWith('cm_'))return;const g=id=>document.getElementById(id);
 if(k==='cm_go'){const key=b.dataset.k,nm=(g('cm_n').value||'').trim(),gr=(g('cm_g').value||'').trim(),v=Math.max(1,Math.min(9999,+g('cm_v').value||1)),sc=[+g('cm_s5').value,+g('cm_s4').value,+g('cm_s3').value];
  if(CMS&&!CMS.final&&!confirm('Идёт другой запуск. Начать новый?'))return;cmStart(key,nm,v,{group:gr,hide:g('cm_h').checked,restrict:g('cm_r').checked,scale:(sc[0]>sc[1]&&sc[1]>sc[2]&&sc[2]>=0)?sc:null});md.hidden=true}
 else if(k==='cm_resume'){if(cmResume())md.hidden=true;else alert('Не удалось восстановить работу.')}
 else if(k==='cm_drop'){if(confirm('Удалить сохранённую работу?')){cmClearRun();openMd(cmMenu('ge'))}}
 else if(k==='cm_dl'){if(CMS&&CMS.final)cmDownload()}
 else if(k==='cm_board'){openMd(cmBoardHtml(b.dataset.k||(CMS&&CMS.key)||'ge'))}
 else if(k==='cm_menu'){openMd(cmMenu(b.dataset.k||'ge'))}
 else if(k==='cm_csv'){cmCsv(b.dataset.k)}else if(k==='cm_csv2'){cmCsv2(b.dataset.k)}
 else if(k==='cm_clear'){if(confirm('Удалить все результаты рейтинга?')){cmRegSave(b.dataset.k,[]);openMd(cmBoardHtml(b.dataset.k))}}
 else if(k==='cm_new'){const key=CMS?CMS.key:'ge';CMS=null;openMd(cmMenu(key))}
 else if(k==='cm_apply'){if(!CMS||!CMS.final)return;const M=CMP[CMS.key];
  md.querySelectorAll('[data-ji]').forEach(i=>{CMS.judge[+i.dataset.ji]=+i.value||0});
  md.querySelectorAll('[data-ov]').forEach(i=>{const[mi,ci]=i.dataset.ov.split(':').map(Number),m=CMS.mods[mi];if(i.value==='')delete m.ov[ci];else m.ov[ci]=+i.value});
  md.querySelectorAll('[data-cmt]').forEach(i=>{CMS.mods[+i.dataset.cmt].cmt=i.value.trim()});
  CMS.mods.forEach(cmApplyOv);const T=cmTotals();CMS.final={...CMS.final,...T};cmRegAdd();openMd(cmResultHtml())}});
// ---------- возобновление и защита от случайного закрытия ----------
addEventListener('beforeunload',ev=>{if(CMS&&!CMS.final){cmSave();ev.preventDefault();ev.returnValue=''}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)cmSave()});
setTimeout(()=>{try{if(!CMS&&cmSavedRun()&&Object.keys(CMP).length&&cmResume())p('Восстановлена прерванная работа «'+CMP[CMS.key].short+'» — время шло всё это время. Продолжайте.')}catch(e){}},400);
// ---------- консоль ----------
{const _run=run;run=function(c){const s=c.trim(),a=s.split(/\s+/);if(a[0].toLowerCase()==='contest'){const v=(a[1]||'').toLowerCase();
  if(v==='start'){const key=a[2]==='pro'||a[2]==='pr'?'pr':a[2]==='ge'||a[2]==='gia'?'ge':null;if(!key)return p('Использование: contest start ge|pro <вариант> [ФИО]  (ge — ГИА/ДЭ, pro — Профессионалы)');cmStart(key,a.slice(4).join(' '),Math.max(1,+a[3]||1),{hide:key==='pr',restrict:false});return p(`${CMP[key].title}: запущено, модулей ${CMS.mods.length}. Условие — в панели слева.`)}
  if(v==='board'){const k=a[2]==='pro'?'pr':'ge';const r=cmBoardRows(k);return p(r.length?r.map((x,i)=>`${i+1}. ${x.name} — ${x.total} (${cmFmt(x.time)})`).join('\n'):'Рейтинг пуст')}
  if(!CMS||CMS.final)return p('Запуск не идёт. contest start ge|pro <вариант> [ФИО] · contest board ge|pro');
  if(v==='check'){cmCheck();const m=CMS.mods[CMS.cur];return p(`Модуль ${m.def.id}: ${m.last.sum} из ${m.last.max}\n`+(CMS.hide?'(критерии скрыты)':m.last.list.map(c=>(c.ok?'✔ ':'✖ ')+c.t).join('\n')))}
  if(v==='module'){const i=CMS.mods.findIndex((m,k)=>m.def.id===(a[2]||'').toUpperCase()||String(k+1)===a[2]);if(i<0)return p('Нет такого модуля');if(!CMP[CMS.key].free)return p('В этом режиме модули идут строго по порядку: contest next');cmEnter(i);return p('Открыт модуль '+CMS.mods[i].def.id)}
  if(v==='next'){if(CMP[CMS.key].free)return p('В ГИА все модули доступны свободно: contest module А|Б|В, завершение — contest finish');const ok=cmNext(false);return p(!ok?'Сначала выполните дополнение заказчика (оно показано выше), затем повторите contest next':CMS.final?`Завершено: ${CMS.final.total} из 100`:'Загружен следующий модуль')}
  if(v==='finish'){cmFinish(false);return p(`Завершено: ${CMS.final.total} из 100`)}
  if(v==='stop'){cmStop();return p('Прервано')}
  const m=CMS.mods[CMS.cur];return p(`${CMP[CMS.key].short}, модуль ${m.def.id}, осталось ${cmFmt(cmLeft())}. contest check | module | next | finish | stop`)}
 return _run(c)}}
CMDS.push(['contest','contest start ge|pro <вариант> [ФИО] | check | module А|Б|В | next | finish | stop | board ge|pro','Режимы ГИА (демонстрационный экзамен) и «Профессионалы»','ge — комплексное задание из 3 модулей на одной схеме с общим временем, модули в любом порядке; pro — 4 модуля с отдельным временем по порядку, дополнение заказчика, судейские аспекты и рейтинг. Номер варианта задаёт набор заданий и числа. Результат — протокол и таблица рейтинга (хранится в браузере).','Экзамен']);
if(!CMDNAMES.includes('contest'))CMDNAMES.push('contest');
