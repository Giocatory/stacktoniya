// ===== m_matrix (v98): матрица связности «кто с кем» — ping всех пар конечных узлов, причины отказов, эталон и сравнение =====
const MX={res:null,base:null,sel:null,max:30};
function mxHosts(){return S.devs.filter(d=>d.t==='pc'&&d.ifaces.some(f=>f.ip&&f.mask))}
function mxIp(d){const f=d.ifaces.find(f=>f.ip&&f.mask);return f?f.ip:null}
function mxRun(){const H=mxHosts().slice(0,MX.max),R={ids:H.map(d=>d.id),cell:{},t:new Date().toLocaleTimeString()};
 const keepEX=EX;
 H.forEach(a=>H.forEach(b=>{if(a===b)return;const ip=mxIp(b);EX=[];let ok=false,why='';
  try{const r=trip(a,ip);ok=!!(r&&r.ok);if(!ok){const e=EX.slice().reverse().find(x=>x.err);why=e?String(e.x||e.err):'нет ответа';R.cell[a.id+'>'+b.id]={ok,why,fix:e&&e.fix?String(e.fix):''};return}}catch(e){why='ошибка проверки'}
  R.cell[a.id+'>'+b.id]={ok,why,fix:''}}));
 EX=keepEX;MX.res=R;return R}
function mxStats(R){const ids=R.ids,n=ids.length;let ok=0,tot=0;const asym=[],iso=[];
 for(const a of ids)for(const b of ids){if(a===b)continue;tot++;const c=R.cell[a+'>'+b];if(c.ok)ok++;if(a<b){const d=R.cell[b+'>'+a];if(c.ok!==d.ok)asym.push([c.ok?a:b,c.ok?b:a])}}
 ids.forEach(a=>{if(ids.every(b=>b===a||!(R.cell[a+'>'+b].ok||R.cell[b+'>'+a].ok)))iso.push(a)});
 const par=Object.fromEntries(ids.map(i=>[i,i])),fd=x=>par[x]===x?x:(par[x]=fd(par[x]));
 for(const a of ids)for(const b of ids)if(a!==b&&R.cell[a+'>'+b].ok&&R.cell[b+'>'+a].ok)par[fd(a)]=fd(b);
 const groups={};ids.forEach(i=>(groups[fd(i)]=groups[fd(i)]||[]).push(i));
 return{ok,tot,asym,iso,groups:Object.values(groups),n}}
const mxName=id=>{const d=dv(id);return d?d.name:'?'};
function mxPanel(){const R=MX.res;let h='<h3>Матрица связности</h3><p>Проверяется ping между всеми конечными узлами (по одному адресу каждого узла). Строка — отправитель, столбец — получатель. Нажмите на ячейку, чтобы увидеть причину отказа.</p><p><button data-mx="run">Проверить сейчас</button> <button data-mx="base">Сохранить как эталон</button> <button data-mx="csv">CSV</button></p>';
 if(!R)return h+'<p><i>Нажмите «Проверить сейчас».</i></p>';
 const ids=R.ids,st=mxStats(R);
 if(mxHosts().length>MX.max)h+='<p>⚠ Узлов больше '+MX.max+': проверены первые '+MX.max+'.</p>';
 h+=`<p><b>Результат (${esc(R.t)}):</b> доступно пар ${st.ok} из ${st.tot}. Сегментов связности: ${st.groups.length}${st.iso.length?'; изолированы: '+st.iso.map(i=>esc(mxName(i))).join(', '):''}.</p>`;
 if(st.asym.length)h+='<p>⚠ Односторонняя связь (туда работает, обратно нет): '+st.asym.map(([a,b])=>esc(mxName(a))+'→'+esc(mxName(b))).join('; ')+'. Типичные причины: ACL или межсетевой экран, отсутствие обратного маршрута, NAT.</p>';
 const B=MX.base;
 if(B){const ch=[];for(const a of ids)for(const b of ids){if(a===b)continue;const o=B.cell[a+'>'+b],n=R.cell[a+'>'+b];if(o&&n&&o.ok!==n.ok)ch.push(`${esc(mxName(a))}→${esc(mxName(b))}: ${o.ok?'работало':'не работало'} → ${n.ok?'работает':'не работает'}`)}
  h+=ch.length?`<p><b>Отличия от эталона (${ch.length}):</b></p><ul>${ch.slice(0,40).map(x=>'<li>'+x+'</li>').join('')}</ul>`:'<p>✓ Совпадает с эталоном.</p>'}
 h+='<div style="overflow:auto"><table class="ex" id="mxt"><tr><th></th>'+ids.map(i=>'<th>'+esc(mxName(i))+'</th>').join('')+'</tr>';
 for(const a of ids){h+='<tr><th>'+esc(mxName(a))+'</th>';for(const b of ids){if(a===b){h+='<td>—</td>';continue}const c=R.cell[a+'>'+b],o=B&&B.cell[a+'>'+b],chg=o&&o.ok!==c.ok;
  h+=`<td data-mxc="${a}>${b}" style="cursor:pointer;text-align:center;font-weight:700;color:${c.ok?'var(--ok,#2a7)':'var(--er,#c33)'}${chg?';outline:2px solid #e90':''}">${c.ok?'✓':'✗'}</td>`}h+='</tr>'}
 h+='</table></div>';
 if(MX.sel&&R.cell[MX.sel]){const [a,b]=MX.sel.split('>'),c=R.cell[MX.sel];h+=`<p><b>${esc(mxName(a))} → ${esc(mxName(b))} (${esc(mxIp(dv(b))||'')}):</b> ${c.ok?'связь есть':'<span class="er">нет связи</span>. '+esc(c.why)}${c.fix?'<br><i>Что сделать:</i> '+esc(c.fix):''}</p>`}
 return h}
function mxOpen(){if(!MX.res)mxRun();openMd(mxPanel()+'<p><button data-x="close">Закрыть</button></p>')}
function mxRefresh(){if(!document.getElementById('mxt')&&!md.hidden&&!/Матрица связности/.test(mb.innerHTML))return;mb.innerHTML=mxPanel()+'<p><button data-x="close">Закрыть</button></p>'}
function mxCsv(){const R=MX.res;if(!R)return '';const ids=R.ids;return[['',...ids.map(mxName)].join(';'),...ids.map(a=>[mxName(a),...ids.map(b=>a===b?'-':R.cell[a+'>'+b].ok?'1':'0')].join(';'))].join('\n')}
document.addEventListener('click',e=>{const c=e.target.closest&&e.target.closest('[data-mxc]');if(c){MX.sel=c.dataset.mxc;mxRefresh();return}
 const b=e.target.closest&&e.target.closest('[data-mx]');if(!b)return;const k=b.dataset.mx;
 if(k==='run'){mxRun();MX.sel=null}else if(k==='base'){if(!MX.res)mxRun();MX.base=JSON.parse(JSON.stringify(MX.res));mxRun()}
 else if(k==='csv'){if(!MX.res)mxRun();const bl=new Blob(['﻿'+mxCsv()],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download='matrix.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);return}
 mxRefresh()});
(function(){const dd=document.querySelector('#mbar .mi[data-k="p"] .mdd');if(!dd||document.getElementById('bmx'))return;const b=document.createElement('button');b.id='bmx';b.type='button';b.textContent='Матрица связности…';b.setAttribute('role','menuitem');b.setAttribute('data-nohelp','1');b.setAttribute('data-d','Ping между всеми парами конечных узлов: кто с кем связан, причины отказов, сравнение с эталоном');b.onclick=mxOpen;dd.appendChild(b)})();
{const _r=run;run=function(c){const s=String(c||'').trim(),w=s.toLowerCase().split(/\s+/);
 if(w[0]==='matrix'||w[0]==='connectivity'){const sub=w[1]||'';
  if(sub==='base'){mxRun();MX.base=JSON.parse(JSON.stringify(MX.res));return p('Эталон сохранён: '+MX.res.ids.length+' узл., пар '+Object.keys(MX.res.cell).length)}
  if(sub==='open')return mxOpen();
  if(sub==='csv'){mxRun();return p(mxCsv())}
  if(sub&&sub!=='run'&&sub!=='diff')return p('Использование: matrix [run|diff|base|csv|open]');
  const R=mxRun(),ids=R.ids;if(ids.length<2)return p('Для матрицы нужно минимум два конечных узла с IP-адресом.');
  const st=mxStats(R),nm=ids.map(mxName),wd=Math.max(...nm.map(x=>x.length),4);
  p(' '.repeat(wd+1)+nm.map(x=>x.slice(0,6).padEnd(7)).join(''));
  ids.forEach((a,i)=>p(nm[i].padEnd(wd+1)+ids.map(b=>(a===b?'  -':R.cell[a+'>'+b].ok?'  ✓':'  ✗').padEnd(7)).join('')));
  p(`Доступно пар: ${st.ok} из ${st.tot}; сегментов связности: ${st.groups.length}`+(st.iso.length?'; изолированы: '+st.iso.map(mxName).join(', '):''));
  if(st.asym.length)p('Односторонняя связь: '+st.asym.map(([a,b])=>mxName(a)+'→'+mxName(b)).join('; '));
  let k=0;for(const a of ids)for(const b of ids){if(a===b)continue;const c=R.cell[a+'>'+b];if(!c.ok&&k<8){p(`  ✗ ${mxName(a)} → ${mxName(b)}: ${c.why}`);k++}}
  if(sub==='diff'||MX.base){const B=MX.base;if(!B)p('Эталон не сохранён (matrix base).');else{const ch=[];for(const a of ids)for(const b of ids){if(a===b)continue;const o=B.cell[a+'>'+b],n=R.cell[a+'>'+b];if(o&&n&&o.ok!==n.ok)ch.push(mxName(a)+'→'+mxName(b)+': '+(o.ok?'✓→✗':'✗→✓'))}p(ch.length?'Отличия от эталона: '+ch.join('; '):'Совпадает с эталоном.')}}
  return}
 return _r(c)}}
CMDS.push(['matrix [run|diff|base|csv|open]','matrix — ping всех пар конечных узлов; matrix base — сохранить эталон; matrix diff — сравнить с эталоном; matrix csv — таблица для Excel; matrix open — окно','Матрица связности «кто с кем»','Показывает, какие конечные узлы видят друг друга, причины отказов, односторонние связи (ACL, нет обратного маршрута), изолированные узлы и число сегментов связности. Эталон позволяет после каждого изменения увидеть, что именно сломалось или заработало.']);
MAN.push(['Т66. Матрица связности: проверка после каждого изменения',`<p><b>Идея.</b> После изменения ACL, VLAN, маршрутов или NAT инженер проверяет не одну пару узлов, а <b>всю матрицу связности</b>: кто с кем должен и не должен общаться. Так находят побочные эффекты (случайно открыли лишнее или закрыли нужное).</p>
<p><b>Как пользоваться.</b> Меню «Практика → Матрица связности…» или команда <code>matrix</code>. Строка – отправитель, столбец – получатель, ✓ – ping проходит, ✗ – нет; нажатие на ячейку показывает причину и подсказку. Сначала доведите сеть до правильного состояния и сохраните <b>эталон</b> (<code>matrix base</code>), затем после каждого изменения смотрите <code>matrix diff</code>: ячейки с отличиями выделены.</p>
<p><b>Что показывает сводка.</b> Число доступных пар, сегменты связности (группы узлов, видящих друг друга в обе стороны), изолированные узлы и <b>односторонняя связь</b>: туда пакет проходит, обратно нет. Типичные причины – ACL или межсетевой экран, отсутствие обратного маршрута, NAT.</p>
<p><b>Ограничения.</b> Проверяется ICMP по одному адресу каждого узла, без портов и служб (для TCP/UDP используйте connect, curl и сценарии заданий); не более 30 узлов; эталон хранится до закрытия страницы, для переноса используйте CSV.</p>`]);
