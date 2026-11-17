// ===== m_sim (v89): режим симуляции — список событий пакета с заголовками L2/L3 и обработкой по уровням OSI =====
const SIM={ev:[],rows:[],i:0,src:'',dst:'',filter:'all'};
const simE=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function simAug(ev){const rows=[];let fs=null,fd=null,ttl=64,dir=-1,org=null;
 ev.forEach((e,k)=>{const rep=e.rep?1:0,ds=(e.p||[]).map(id=>dv(id)).filter(Boolean),x=String(e.x||'');
  if(rep!==dir){dir=rep;ttl=64;org=null}
  const create=/собираю IP-пакет|формирую ответ/.test(x),deliv=/принадлежит мне/.test(x);
  if(create){org=e.p&&e.p[0];if(!rep){const m=/(\d+\.\d+\.\d+\.\d+)\s*→\s*(\d+\.\d+\.\d+\.\d+)/.exec(x);if(m){fs=m[1];fd=m[2]}}}
  const hop=ds.length>=2&&!create&&!deliv;if(hop&&ds[0].t==='rt'&&ds[0].id!==org)ttl--;
  let sip=rep?fd:fs,dip=rep?fs:fd;if(rep){const m=/\(echo reply\) для (\d+\.\d+\.\d+\.\d+)/.exec(x);if(m)dip=m[1]}
  rows.push({n:k+1,rep,kind:e.err?'error':create?'create':deliv?'deliver':hop?'hop':'info',ds,x,fix:e.fix||'',ttl:create?64:ttl,sip:sip||'—',dip:dip||'—',
   smac:hop&&ds[0]?ds[0].mac:'',dmac:hop?ds[ds.length-1].mac:'',type:rep?'Echo reply (тип 0)':'Echo request (тип 8)'})});
 return rows}
function simRun(d,dst){const ip=resolve(d,dst);if(!ip)return false;EX=[];const r=trip(d,ip);SIM.ev=EX.map(e=>({p:e.p,x:e.x,rep:e.rep,err:e.err,fix:e.fix}));SIM.rows=simAug(SIM.ev);SIM.i=0;SIM.src=d.id;SIM.dst=dst;return r}
const SIM_K={create:'Создание пакета',deliver:'Доставка получателю',hop:'Кадр передан дальше',error:'Ошибка',info:'Событие'};
function simLayers(r){const a=r.ds,o=[];
 if(r.kind==='create')o.push(['L7','Приложение: команда ping, ICMP '+r.type],['L4','ICMP — без портов (протокол IP №1)'],['L3','IP: источник '+r.sip+', назначение '+r.dip+', TTL '+r.ttl+'. Решение: получатель в моей подсети или нужен шлюз?'],['L2','Следующий шаг: ARP — узнать MAC следующего узла'],['L1','Передача в среду после инкапсуляции']);
 else if(r.kind==='deliver')o.push(['L1','Кадр принят'],['L2','Адрес назначения в кадре совпал — кадр мой, заголовок Ethernet снят'],['L3','Адрес назначения IP '+r.dip+' — мой, TTL '+r.ttl+'; заголовок IP снят'],['L7','ICMP: '+r.type+(r.rep?' — ping завершён':' — готовлю ответ')]);
 else if(r.kind==='hop'){const s=a[0],t=a[a.length-1],mid=a.slice(1,-1);
  o.push(['L3 '+s.name,'Решение о пересылке и next hop (см. пояснение). IP: '+r.sip+' → '+r.dip+', TTL в кадре '+r.ttl],['L2 '+s.name,'Ethernet: назначение '+r.dmac+' (после ARP), источник '+r.smac+', тип 0x0800 (IPv4)'],['L1 '+s.name,'Сигнал в кабель']);
  mid.forEach(m=>o.push(['L2 '+m.name,m.t==='sw'?'Коммутатор: ищет MAC '+r.dmac+' в таблице MAC и пересылает кадр внутри VLAN; IP не просматривает':'Промежуточный узел пересылает кадр']));
  o.push(['L1 '+t.name,'Приём сигнала'],['L2 '+t.name,'MAC назначения '+r.dmac+' — мой: кадр принят, Ethernet снят'],['L3 '+t.name,t.t==='rt'?'Адрес назначения '+r.dip+' — не мой: ищу маршрут, TTL уменьшится на 1 (следующее событие)':'Передаю пакет вверх по стеку (следующее событие)'])}
 else o.push(['—','Ошибка или служебное событие: см. пояснение']);return o}
function simPanel(){const R=SIM.rows,cur=Math.min(SIM.i,Math.max(0,R.length-1));
 const devs=S.devs.filter(d=>(d.t==='pc'||d.t==='rt')&&d.ifaces.some(f=>f.ip)),sd=SIM.src||(sel&&devs.find(d=>d.id===sel)?sel:(devs[0]||{}).id);
 let h=`<div id="smx"><h3 data-nohelp="1">Режим симуляции: события пакета</h3><p class="note">Запустите ping и пройдите по шагам: на каждом шаге видны заголовки IP и Ethernet (адреса, TTL), что делает каждое устройство на уровнях OSI и куда идёт кадр. Режим не меняет схему.</p>
<div class="row"><select id="smsrc" data-nohelp="1">${devs.map(d=>`<option value="${d.id}"${d.id===sd?' selected':''}>${simE(d.name)}</option>`).join('')}</select> → <input id="smdst" data-nohelp="1" value="${simE(SIM.dst||'')}" placeholder="IP или имя узла" size="18"> <button data-sm="run" data-nohelp="1">Отправить ping</button></div>`;
 if(!R.length)return h+'<p>Выберите источник, введите адрес назначения и нажмите «Отправить ping».</p></div>';
 h+=`<div class="row"><button data-sm="first" data-nohelp="1">⏮</button><button data-sm="prev" data-nohelp="1">◀ Назад</button><button data-sm="next" data-nohelp="1">Шаг ▶</button><button data-sm="all" data-nohelp="1">Показать всё</button> <span>Событие ${cur+1} из ${R.length}</span></div>
<table><tr><th>№</th><th>Напр.</th><th>Откуда → куда</th><th>Событие</th><th>TTL</th><th>MAC (источник → приёмник)</th></tr>`;
 R.forEach((r,k)=>{if(k>(SIM.all?R.length:cur))return;const a=r.ds,ft=a.length?simE(a[0].name)+(a.length>1?' → '+simE(a[a.length-1].name):''):'';
  h+=`<tr data-smrow="${k}" style="${k===cur?'background:var(--sel,rgba(80,140,255,.22));':''}${r.kind==='error'?'color:#d33;':''}cursor:pointer"><td>${r.n}</td><td>${r.rep?'← ответ':'→ запрос'}</td><td>${ft}</td><td>${SIM_K[r.kind]}</td><td>${r.kind==='info'||r.kind==='error'?'':r.ttl}</td><td>${r.dmac?simE(r.smac)+' → '+simE(r.dmac):'—'}</td></tr>`});
 const r=R[cur];h+=`</table><h4 data-nohelp="1">Событие ${r.n}: ${SIM_K[r.kind]}</h4><p>${simE(r.x)}</p>${r.fix?`<p class="note">Как исправить: ${simE(r.fix)}</p>`:''}
<table><tr><th>Уровень OSI / узел</th><th>Что происходит</th></tr>${simLayers(r).map(l=>`<tr><td><b>${simE(l[0])}</b></td><td>${simE(l[1])}</td></tr>`).join('')}</table></div>`;
 return h}
function simOpen(){openMd(simPanel()+'<p><button data-x="close">Закрыть</button></p>')}
function simRefresh(){if(!document.getElementById('smx')||md.hidden)return;mb.innerHTML=simPanel()+'<p><button data-x="close">Закрыть</button></p>'}
document.addEventListener('click',e=>{const row=e.target.closest&&e.target.closest('[data-smrow]');if(row){SIM.i=+row.dataset.smrow;SIM.all=0;simRefresh();return}
 const b=e.target.closest&&e.target.closest('[data-sm]');if(!b)return;const k=b.dataset.sm,R=SIM.rows;
 if(k==='run'){const d=dv(document.getElementById('smsrc').value),t=document.getElementById('smdst').value.trim();if(!d||!t)return;SIM.dst=t;SIM.src=d.id;simRun(d,t);SIM.all=0;}
 else if(k==='next')SIM.i=Math.min(R.length-1,SIM.i+1);else if(k==='prev')SIM.i=Math.max(0,SIM.i-1);else if(k==='first')SIM.i=0;else if(k==='all'){SIM.all=1;SIM.i=R.length-1}
 if(k==='next'||k==='prev'||k==='first')SIM.all=0;
 const r=R[Math.min(SIM.i,R.length-1)];if(r&&r.ds.length)flash(r.ds);simRefresh()});
{const _r=run;run=function(c){const a=String(c).trim().split(/\s+/),d=sel&&dv(sel);
 if(/^(simulate|sim)$/i.test(a[0])){if(!a[1]){p('Использование: simulate <ip|имя> — пройти путь ping по событиям (откуда → куда, TTL, MAC). Окно: Практика → Режим симуляции.');return}
  if(!d||!(d.t==='pc'||d.t==='rt')){p('Выберите ПК или маршрутизатор на схеме');return}const r=simRun(d,a[1]);if(r===false)return;
  p(`Режим симуляции: ${d.name} → ${a[1]} (${SIM.rows.length} событий)`);SIM.rows.forEach(x=>p(`#${String(x.n).padStart(2)} ${x.rep?'←':'→'} ${x.ds.length?x.ds.map(z=>z.name).join('>'):'—'}  ${SIM_K[x.kind]}${x.kind==='hop'||x.kind==='create'?`  TTL ${x.ttl}  ${x.sip}→${x.dip}`:''}${x.dmac?`  MAC ${x.smac} → ${x.dmac}`:''}`));
  p('Подробно по уровням OSI: Практика → Режим симуляции (окно).');return}
 return _r(c)}}
(function(){const dd=document.querySelector('#mbar .mi[data-k="p"] .mdd');if(!dd||document.getElementById('bsim'))return;const b=document.createElement('button');b.id='bsim';b.type='button';b.textContent='Режим симуляции: события пакета…';b.setAttribute('role','menuitem');b.setAttribute('data-nohelp','1');b.setAttribute('data-d','Пошаговый просмотр пути ping: заголовки IP и Ethernet, TTL, обработка по уровням OSI на каждом устройстве');b.onclick=simOpen;dd.appendChild(b)})();
if(typeof QH_ID!=='undefined')QH_ID.bsim=['Режим симуляции','Пошаговый просмотр пути пакета: на каждом шаге видно, какие заголовки (IP, Ethernet) на нём, как меняются MAC и TTL и что делает каждое устройство на уровнях OSI.'];
CMDS.push(['simulate','simulate <ip|имя>','Режим симуляции: события пути ping','Выводит последовательность событий пакета: откуда и куда передан кадр, TTL, адреса IP и MAC. Подробный разбор по уровням OSI — в окне «Практика → Режим симуляции».']);
MAN.push(['Т58. Режим симуляции: события пакета и уровни OSI',`<p><b>Идея.</b> Обычный ping показывает только результат. Режим симуляции раскладывает путь пакета на события: создание пакета, ARP, пересылка кадра через коммутатор, маршрутизация, доставка получателю, ответ.</p>
<p><b>Что видно на шаге.</b> Заголовок IP (адреса источника и назначения, TTL) и заголовок Ethernet (MAC источника и назначения, тип 0x0800). Главное правило: <b>IP-адреса не меняются</b> по пути (без NAT), <b>MAC-адреса меняются на каждом маршрутизируемом участке</b>, <b>TTL уменьшается на каждом маршрутизаторе</b>. Коммутатор смотрит только на MAC и не меняет кадр.</p>
<p><b>Уровни OSI.</b> Отправитель идёт сверху вниз (L7 → L1: приложение, ICMP, IP, Ethernet, сигнал), получатель — снизу вверх. Маршрутизатор поднимается до L3 (выбирает маршрут) и снова опускается до L1; коммутатор — только до L2.</p>
<p><b>Как пользоваться.</b> Практика → «Режим симуляции…»: выберите источник, введите адрес или имя, нажмите «Отправить ping» и идите кнопкой «Шаг ▶»; строка таблицы выделяется, устройства подсвечиваются на схеме. В консоли: <code>simulate &lt;ip|имя&gt;</code>.</p>
<p><b>Ограничения.</b> Режим строится по событиям модели; NAT, туннели и IPv6 показываются в тексте событий, а поля IP/TTL для них могут быть приблизительными. Реальные таймеры и очереди не моделируются.</p>`]);
