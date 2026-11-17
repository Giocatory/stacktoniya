// ================= v21: результаты экзамена в файл и ведомость группы для преподавателя =================
const exHash=s=>{let h=2166136261;for(const c of String(s)){h^=c.codePointAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(16)};
const exSig=r=>exHash([r.name,r.variant,r.sum,r.max,r.at,(r.tasks||[]).map(t=>t.n+':'+t.sum).join(',')].join('|')+'netlab-exam');
function exRecord(){const f=EXS.final;const r={app:'netlab-exam',v:1,name:EXS.name||'',variant:EXS.variant,strict:!!EXS.strict,at:f.at,sum:f.sum,max:f.max,pc:f.pc,grade:f.grade,tasks:EXS.tasks.map(t=>({n:EXQ[t.q].n,sum:t.res.sum,max:t.res.max,spent:Math.round(t.spent),att:t.att,to:!!t.timeout}))};r.sig=exSig(r);return r}
function exDl(fn,text,type){try{const b=new Blob([text],{type:type+';charset=utf-8'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=fn;document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(u)},500);return fn}catch(e){return null}}
const exFn=(r,ext)=>`Экзамен_${String(r.name||'студент').replace(/[^\wЀ-ӿ.-]+/g,'_')}_в${r.variant}.${ext}`;
let EXG=[];
function exAdd(text){let r;try{r=JSON.parse(text)}catch(e){return null}
 if(!r||r.app!=='netlab-exam'||!Array.isArray(r.tasks))return null;
 r.okSig=r.sig===exSig(r);if(EXG.some(x=>x.sig===r.sig&&x.name===r.name&&x.variant===r.variant&&x.at===r.at))return r;EXG.push(r);return r}
const exTime=r=>exFmt(r.tasks.reduce((s,t)=>s+(t.spent||0),0));
function exGroupHtml(){if(!EXG.length)return'<p class="mt">Результаты не загружены.</p>';
 const L=[...EXG].sort((a,b)=>String(a.name).localeCompare(String(b.name),'ru')),n=L.length,avg=Math.round(L.reduce((s,r)=>s+r.pc,0)/n),g={5:0,4:0,3:0,2:0};L.forEach(r=>g[r.grade]++);
 return`<p><b>Работ: ${n}. Средний результат: ${avg}%.</b> Оценки: «5» – ${g[5]}, «4» – ${g[4]}, «3» – ${g[3]}, «2» – ${g[2]}. Успеваемость (3 и выше): ${Math.round(100*(n-g[2])/n)}%.</p>
<table><tr><th>№</th><th>ФИО</th><th>Вар.</th><th>Баллы</th><th>%</th><th>Оценка</th><th>Время</th><th>По заданиям</th><th>Файл</th></tr>${L.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name||'—')}</td><td>${r.variant}</td><td>${r.sum}/${r.max}</td><td>${r.pc}</td><td><b>${r.grade}</b></td><td>${exTime(r)}</td><td>${r.tasks.map(t=>t.sum).join(' / ')}</td><td>${r.okSig?'✔':'<span class="er">изменён?</span>'}</td></tr>`).join('')}</table>
<p><button data-x="ex_csv">Скачать ведомость (CSV для Excel)</button> <button data-x="ex_gclr">Очистить список</button></p><p class="mt">Контрольная сумма отлавливает случайные правки файла, но не защищает от целенаправленной подделки: для ответственного контроля проводите экзамен под наблюдением.</p>`}
function exCsv(){const q=v=>'"'+String(v).replace(/"/g,'""')+'"';const rows=[['ФИО','Вариант','Баллы','Максимум','Процент','Оценка','Время','Задания (баллы)','Строгий режим','Дата','Файл не изменён']];
 [...EXG].sort((a,b)=>String(a.name).localeCompare(String(b.name),'ru')).forEach(r=>rows.push([r.name,r.variant,r.sum,r.max,r.pc,r.grade,exTime(r),r.tasks.map(t=>t.n+': '+t.sum+'/'+t.max).join(' | '),r.strict?'да':'нет',r.at,r.okSig?'да':'нет']));
 return'﻿'+rows.map(r=>r.map(q).join(';')).join('\r\n')}
{const _m=exMenu;exMenu=function(){return _m().replace('<h4>Банк заданий</h4>',`<h4>Ведомость группы (для преподавателя)</h4><p class="mt">Студенты скачивают файл результата после экзамена. Выберите сразу все файлы – получится сводная таблица и CSV для Excel.</p><p><input type="file" id="ex_f" multiple accept=".json,application/json"></p><div id="ex_g">${exGroupHtml()}</div><h4>Банк заданий</h4>`)}}
{const _r=exResultHtml;exResultHtml=function(){return _r().replace('<button data-x="ex_new">','<button data-x="ex_json">Скачать результат (файл для преподавателя)</button> <button data-x="ex_new">')}}
md.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-x]'),k=b&&b.dataset.x;if(!k)return;
 if(k==='ex_json'&&EXS&&EXS.final){const r=exRecord();exDl(exFn(r,'json'),JSON.stringify(r,null,1),'application/json')}
 else if(k==='ex_csv'){exDl('Ведомость_экзамен.csv',exCsv(),'text/csv')}
 else if(k==='ex_gclr'){EXG=[];$('#ex_g').innerHTML=exGroupHtml()}});
md.addEventListener('change',e=>{if(!e.target||e.target.id!=='ex_f')return;const fs=[...e.target.files];let left=fs.length,bad=0;if(!left)return;
 fs.forEach(f=>{const fr=new FileReader();fr.onload=()=>{if(!exAdd(String(fr.result)))bad++;if(!--left){$('#ex_g').innerHTML=exGroupHtml()+(bad?`<p class="er">Не распознано файлов: ${bad}</p>`:'')}};fr.onerror=()=>{bad++;if(!--left)$('#ex_g').innerHTML=exGroupHtml()};fr.readAsText(f)})});
p('Новое (v21): результат экзамена сохраняется в файл, а у преподавателя в окне «Экзамен» собирается ведомость группы с выгрузкой в CSV.');
