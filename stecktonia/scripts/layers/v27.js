// ===== v27: файл результата по скриптам и ведомость группы =====
const sxrName=()=>{try{return localStorage.getItem('netlab_sxn')||''}catch(e){return''}};
function sxrMake(name){const pr=sxLsGet();return{format:'netlab-sx-result',v:1,name:name||'',date:new Date().toISOString(),total:SXT.length,done:SXT.filter(t=>pr[t.id]).map(t=>({id:t.id,t:t.t,sh:t.sh,custom:!!t.custom}))}}
function sxrBuild(texts){const rows=[],bad=[];texts.forEach((x,i)=>{try{const j=JSON.parse(x);if(!j||j.format!=='netlab-sx-result'||!Array.isArray(j.done))throw 0;rows.push(j)}catch(e){bad.push(i+1)}});
 const base=SXT.filter(t=>!t.custom);rows.sort((a,b)=>String(a.name).localeCompare(String(b.name),'ru'));
 const head=['ФИО',...base.map((t,i)=>String(i+1)),'Своих','Всего','Дата'];
 const line=r=>{const ids=new Set(r.done.map(d=>d.id));const c=r.done.filter(d=>d.custom).length;return[r.name||'(без имени)',...base.map(t=>ids.has(t.id)?'✓':''),String(c),String(r.done.length),String(r.date||'').slice(0,16).replace('T',' ')]};
 const data=rows.map(line);
 const avg=base.map(t=>rows.length?Math.round(100*rows.filter(r=>r.done.some(d=>d.id===t.id)).length/rows.length)+'%':'');
 const html=`<div style="overflow:auto"><table class="sxt"><tr>${head.map((h,i)=>`<th${i>0&&i<=base.length?` title="${sxE(base[i-1].t)}"`:''}>${sxE(h)}</th>`).join('')}</tr>${data.map(r=>'<tr>'+r.map((c,i)=>`<td${i>0&&i<=base.length&&c?' class="ok"':''}>${sxE(c)}</td>`).join('')+'</tr>').join('')}${rows.length?`<tr><td><i>Выполнили, %</i></td>${avg.map(a=>`<td>${a}</td>`).join('')}<td></td><td></td><td></td></tr>`:''}</table></div>`+(bad.length?`<p class="er">Не удалось прочитать файлы: ${bad.join(', ')}</p>`:'');
 const csv='﻿'+[head,...data].map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(';')).join('\r\n');
 return{html,csv,n:rows.length,bad:bad.length}}
function sxrDl(name,text,type){const u=URL.createObjectURL(new Blob([text],{type})),l=document.createElement('a');l.href=u;l.download=name;document.body.appendChild(l);l.click();l.remove()}
document.head.insertAdjacentHTML('beforeend','<style>table.sxt{border-collapse:collapse;font-size:12px}table.sxt th,table.sxt td{border:1px solid var(--bd);padding:2px 5px;text-align:center}table.sxt td:first-child{text-align:left;white-space:nowrap}table.sxt td.ok{color:var(--ok);font-weight:700}</style>');
{const _tk=sxuTk;sxuTk=function(el){_tk(el);if(SXF)return;
 el.insertAdjacentHTML('beforeend',`<div class="sxk"><h4>Результаты и ведомость группы</h4><p>Студент: введите ФИО и сохраните файл результата, передайте его преподавателю. Преподаватель: загрузите файлы всех студентов — получится ведомость с выгрузкой в CSV.</p><div class="sxr"><input id="sxrn" placeholder="ФИО студента" value="${sxE(sxrName())}"><button id="sxrd">Скачать мой результат</button></div><div class="sxr"><span style="font-size:13px">Ведомость группы — файлы результатов:</span><input type="file" id="sxrf" multiple accept=".json,application/json" style="max-width:260px"><button id="sxrc" hidden>Скачать CSV</button></div><div id="sxrt"></div></div>`);
 let last=null;
 sxq('#sxrd').onclick=()=>{const n=sxq('#sxrn').value.trim();try{localStorage.setItem('netlab_sxn',n)}catch(e){}if(!n){alert('Введите ФИО');return}sxrDl('result_scripts_'+n.replace(/[^\wА-Яа-яЁё]+/g,'_')+'.json',JSON.stringify(sxrMake(n),null,1),'application/json')};
 sxq('#sxrf').onchange=async ev=>{const t=await Promise.all([...ev.target.files].map(f=>new Promise(r=>{const x=new FileReader();x.onload=()=>r(x.result);x.onerror=()=>r('');x.readAsText(f)})));last=sxrBuild(t);sxq('#sxrt').innerHTML=last.html;sxq('#sxrc').hidden=!last.n};
 sxq('#sxrc').onclick=()=>{if(last)sxrDl('vedomost_scripts.csv',last.csv,'text/csv;charset=utf-8')}}}
p('Новое (v27): результаты заданий по скриптам и Git сохраняются в файл студента, а у преподавателя собираются в ведомость группы (CSV).');
document.head.insertAdjacentHTML('beforeend','<style>#sxrt{display:block}#sxrt table.sxt td,#sxrt table.sxt th{height:auto;line-height:1.15;vertical-align:middle}#sxrt table.sxt{width:100%}</style>');
