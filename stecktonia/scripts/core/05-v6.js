/* ===== v6: 802.1X + RADIUS, SNMP-мониторинг, QoS ===== */
const T0=Date.now(),PK={};
let BWHY={},dxPrev=new Set();

// --- 802.1X: порт пускает устройство только после проверки логина/пароля на RADIUS-сервере ---
const radiusSrv=d=>{if(!d.radius)return null;for(let j=0;j<d.ifaces.length;j++){const g=d.ifaces[j];if(g.dx||g.off||g.radio)continue;const e=l2all(d,j).find(e=>e.d.ifaces.some(x=>x.ip===d.radius));if(e)return e.d}return null};
function dxScan(){BWHY={};const cur=new Set(),logs=[];
 S.devs.filter(d=>d.t==='sw'&&kind(d)==='msw').forEach(d=>{const ports=d.ifaces.filter(f=>f.dx&&!f.off);if(!ports.length)return;const srv=radiusSrv(d);
  ports.forEach(f=>behind(d,f).forEach(x=>{let why=null;const us=srv&&srv.users||{};
   if(!d.radius)why='на коммутаторе не задан RADIUS-сервер (radius <ip>)';
   else if(!srv)why=`RADIUS ${d.radius} недоступен коммутатору (сервер должен быть в той же сети, через неотмеченный порт)`;
   else if(srv.rsecret&&srv.rsecret!==(d.rsec||''))why='RADIUS: общий секрет не совпадает (на коммутаторе radius <ip> <секрет>, на сервере radius secret <секрет>)';
   else if(!x.dx||!x.dx.u)why='у устройства нет учётных данных 802.1X (dot1x <логин> <пароль>)';
   else if(!Object.prototype.hasOwnProperty.call(us,x.dx.u))why=`RADIUS: пользователь «${x.dx.u}» не найден`;
   else if(us[x.dx.u]!==x.dx.p)why='RADIUS: неверный пароль';
   const sig=d.id+f.n+x.id+(why||'ok');cur.add(sig);if(!dxPrev.has(sig))logs.push(why?`⊘ 802.1X: ${d.name} ${f.n} не пускает ${x.name} — ${why}`:`⊕ 802.1X: ${x.name} аутентифицирован на ${d.name} ${f.n}`);
   if(why)BWHY[x.id]=`${x.name}: порт ${d.name} ${f.n} закрыт 802.1X — ${why}`}))});
 dxPrev=cur;logs.forEach(p)}
const _trip6=trip;
trip=function(d,dst){const bad=[d,S.devs.find(x=>x.ifaces.some(f=>f.ip===dst))].find(x=>x&&BWHY[x.id]);
 if(bad){EX=[];REP=0;ex([d.id],BWHY[bad.id],{err:1,fix:'Пройдите аутентификацию: логин/пароль на устройстве (dot1x) и такой пользователь на RADIUS (radius user), либо отключите 802.1X на порту.'});return{ok:0,tr:[]}}
 const r=_trip6(d,dst);new Set(EX.flatMap(s=>s.p)).forEach(id=>PK[id]=(PK[id]||0)+1);return r};

// --- SNMP ---
function snmpq(nms,ip,comm,walk){if(ip2n(ip||'')==null)return p('Использование: snmpget|snmpwalk <ip> [community]');computeRip();EX=[];const a=deliver(nms,ip,64,[],1,srcIp(nms));
 if(!a.ok)return p('SNMP: таймаут — запрос не дошёл: '+a.m);const t=a.d;
 if(!t.snmp)return p(`SNMP: ${t.name} молчит — агент выключен (на ${t.name}: snmp community <строка>)`);
 if(t.snmp!==(comm||'public'))return p('SNMP: неверная community — агент отбросил запрос');
 p(`sysName: ${t.name}\nsysDescr: ${(CAT[kind(t)]||{}).l}\nsysUpTime: ${Math.floor((Date.now()-T0)/1000)} с\nifNumber: ${t.ifaces.length}\npktForwarded: ${PK[t.id]||0}`);
 if(walk)t.ifaces.forEach((f,i)=>p(`ifDescr.${i+1}: ${f.n}  ifOperStatus: ${peer(t,i)?'up':'down'}  ip: ${f.ip||'—'}`))}
function monHtml(){const s=sel&&dv(sel),nms=(s&&s.t==='pc'?s:null)||S.devs.find(d=>d.k==='srv')||S.devs.find(d=>d.t==='pc');
 if(!nms)return'<p class="er">Нужна станция мониторинга: добавьте ПК или сервер.</p>';computeRip();
 const rows=S.devs.filter(t=>t.snmp&&t!==nms).map(t=>{const ip=srcIp(t);EX=[];const a=ip?deliver(nms,ip,64,[],1,srcIp(nms)):{ok:0,m:'у устройства нет IP'};
  return`<tr><td>${esc(t.name)}</td><td>${ip||'—'}</td><td class="${a.ok?'ok':'er'}">${a.ok?'● отвечает':'✖ '+esc(a.m)}</td><td>${t.ifaces.filter((f,i)=>peer(t,i)).length}/${t.ifaces.length}</td><td>${PK[t.id]||0}</td></tr>`});
 return`<p class="mt">Станция: ${esc(nms.name)} (выбранный ПК или первый сервер). Опрос каждые 3 с. Агент включается на устройстве: snmp community &lt;строка&gt;. Консоль станции: snmpget / snmpwalk &lt;ip&gt; [community].</p><table style="width:100%;border-collapse:collapse;font-size:13px"><tr style="text-align:left"><th>Устройство</th><th>IP</th><th>Статус</th><th>Порты up</th><th>Пакетов</th></tr>${rows.join('')||'<tr><td colspan="5" class="mt">Нет устройств с включённым SNMP</td></tr>'}</table>`}
setInterval(()=>{const m=$('#mon');if(m&&!md.hidden)m.innerHTML=monHtml()},3000);

// --- QoS: потоки (голос/видео/данные) по линкам с ограниченной скоростью ---
function qosCalc(){computeRip();const on=S.qosOn!==false,LK={},cls={voice:0,video:1,data:2};
 const fl=(S.flows||[]).map(f=>{const s=dv(f.src),t=S.devs.find(x=>x.name.toLowerCase()===String(f.dst).toLowerCase()),ip=t?srcIp(t):f.dst,o={f,s,keys:[],al:{},dl:0};
  if(!s||ip2n(ip||'')==null){o.err='неверный отправитель или получатель';return o}
  const r=trip(s,ip);if(!r.ok){o.err=lastErr()?lastErr().x:'нет связи';return o}
  EX.filter(x=>!x.rep&&!x.err).forEach(st=>{for(let i=0;i<st.p.length-1;i++){const a=st.p[i],b=st.p[i+1],k=S.links.findIndex(l=>(l.a===a&&l.b===b)||(l.a===b&&l.b===a));let key,cap;
   if(k>=0){const l=S.links[k];key='L'+k;cap=Math.min(dv(l.a).ifaces[l.ai].spd||1000,dv(l.b).ifaces[l.bi].spd||1000,cabCap(l))}
   else{const A=dv(a),B=dv(b),c=[A,B].find(x=>x.ifaces.some(g=>g.wifi));if(!c)continue;key='W'+c.id;cap=typeof wfCap==='function'?wfCap(c===A?B:A,c):(wband(c===A?B:A,c)==='5'?300:72)}
   if(!o.keys.includes(key)){o.keys.push(key);(LK[key]=LK[key]||{cap,fl:[]}).fl.push(o)}}});
  o.dl=o.keys.length;return o});
 Object.entries(LK).forEach(([key,L])=>{const need=L.fl.reduce((s,o)=>s+o.f.mbit,0);L.cong=need>L.cap;let rem=L.cap;
  if(!L.cong)L.fl.forEach(o=>o.al[key]=o.f.mbit);
  else if(!on)L.fl.forEach(o=>{o.al[key]=o.f.mbit*L.cap/need;o.dl+=49});
  else[0,1,2].forEach(c=>{const g=L.fl.filter(o=>cls[o.f.cls]===c),n=g.reduce((s,o)=>s+o.f.mbit,0);g.forEach(o=>{o.al[key]=n<=rem?o.f.mbit:rem*o.f.mbit/n;o.dl+=[1,9,49][c]});rem=Math.max(0,rem-n)})});
 return{fl,cong:Object.values(LK).filter(L=>L.cong).length,on}}
function qosHtml(){const R=qosCalc(),nm2=id=>(dv(id)||{name:'?'}).name;
 const rows=R.fl.map((o,i)=>{const f=o.f,h=`<td>${esc(nm2(f.src))} → ${esc(String(f.dst))}</td><td>${f.cls}</td><td>${f.mbit}</td>`,x=`<td><button data-qd="${i}">✕</button></td>`;
  if(o.err)return`<tr>${h}<td colspan="3" class="er">✖ ${esc(o.err)}</td>${x}</tr>`;
  const del=Math.min(f.mbit,...Object.values(o.al)),loss=Math.max(0,100*(1-del/f.mbit)),ok=f.cls==='data'?loss<10:loss<(f.cls==='voice'?1:2)&&o.dl<150;
  return`<tr>${h}<td>${del.toFixed(1)} Мбит/с (потери ${loss.toFixed(0)}%)</td><td>${Math.round(o.dl)} мс</td><td class="${ok?'ok':'er'}">${ok?'✔ качество в норме':f.cls==='data'?'✖ медленно':'✖ рвётся звук/картинка'}</td>${x}</tr>`}).join('');
 const sv=S.devs.filter(d=>d.t==='pc');
 return`<h3>QoS и пропускная способность</h3><p class="mt">Поток — трафик между двумя узлами (голос, видео, данные) с заданной скоростью. Скорость линка задаётся командой <b>speed &lt;интерфейс&gt; &lt;Мбит/с&gt;</b> (по умолчанию 1000; Wi‑Fi: 300 на 5 ГГц, 72 на 2.4). Если потоки на линке в сумме больше его скорости — перегрузка: без QoS страдают все поровну, с QoS голос и видео идут первыми.</p>
 <p>Политика: <b>${R.on?'QoS включён (голос > видео > данные)':'QoS выключен (общая очередь FIFO)'}</b> <button data-x="qtog">Переключить</button></p>
 <table style="width:100%;border-collapse:collapse;font-size:13px"><tr style="text-align:left"><th>Поток</th><th>Класс</th><th>Запрошено, Мбит/с</th><th>Доставлено</th><th>Задержка</th><th>Вердикт</th><th></th></tr>${rows||'<tr><td colspan="7" class="mt">Потоков нет — добавьте ниже</td></tr>'}</table>
 <p>${R.cong?`⚠ Перегружено линков: ${R.cong}. ${R.on?'QoS отдал ёмкость голосу и видео, «ужались» данные — звонок чистый, файлы медленнее.':'Без QoS потери и задержка одинаковы у всех: голос рвётся вместе с файлами. Включите QoS.'}`:(R.fl.length?'Перегрузки нет — QoS не нужен. Уменьшите speed на линке или увеличьте потоки, чтобы увидеть эффект.':'')}</p>
 <p><select id="qs">${sv.map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select> → <input id="qd" placeholder="имя или IP"> <select id="qc"><option>voice</option><option>video</option><option>data</option></select> <input id="qr" value="10" style="width:60px"> Мбит/с <button data-x="qadd">+ Поток</button></p>`}
md.addEventListener('click',e=>{const t=e.target,x=t.dataset.x;
 if(x==='qtog'){S.qosOn=S.qosOn===false;ch();openMd(qosHtml())}
 else if(x==='qadd'){const dst=$('#qd').value.trim();if(!dst||!$('#qs').value)return;(S.flows=S.flows||[]).push({src:$('#qs').value,dst,cls:$('#qc').value,mbit:Math.max(.1,+$('#qr').value||1)});ch();openMd(qosHtml())}
 else if(t.dataset.qd!==undefined){S.flows.splice(+t.dataset.qd,1);ch();openMd(qosHtml())}});
$('#bt').insertAdjacentHTML('beforebegin','<button id="bm">Мониторинг</button><button id="bq">QoS</button>');
$('#bm').onclick=()=>openMd('<h3>Мониторинг (SNMP)</h3><div id="mon">'+monHtml()+'</div>');
$('#bq').onclick=()=>openMd(qosHtml());

// --- команды ---
const _run6=run;
run=function(c){const d=sel&&dv(sel),a=c.trim().split(/\s+/),cm=a[0].toLowerCase();if(!d)return _run6(c);const K=kind(d),f=d.ifaces.find(x=>x.n===a[1]);
 if(cm==='snmp'&&d.t!=='sw'){if(a[1]==='off'){d.snmp='';ch();return p('SNMP-агент выключен')}if(a[1]==='community'&&a[2]){d.snmp=a[2];ch();return p('SNMP-агент включён, community «'+a[2]+'»')}return p('Использование: snmp community <строка> | snmp off')}
 if(cm==='snmpget'||cm==='snmpwalk'){if(d.t!=='pc')return p('SNMP-запросы выполняются со станции мониторинга (ПК или сервер)');return snmpq(d,a[1],a[2],cm==='snmpwalk')}
 if(cm==='speed'&&d.t!=='sw'){if(!f||![10,100,1000,10000].includes(+a[2]))return p('Использование: speed <интерфейс> 10|100|1000|10000');f.spd=+a[2];ch();return p('OK')}
 if(K==='msw'&&cm==='radius'){if(ip2n(a[1]||'')==null)return p('Использование: radius <ip RADIUS-сервера>');d.radius=a[1];ch();return p('RADIUS-сервер: '+a[1])}
 if(K==='msw'&&cm==='dot1x'){if(!f||!/^(on|off)$/.test(a[2]||''))return p('Использование: dot1x <порт> on|off');f.dx=a[2]==='on';ch();return p('802.1X на '+f.n+': '+a[2])}
 if(K==='srv'&&cm==='radius'&&a[1]==='user'){if(!a[2])return p('Использование: radius user <логин> <пароль>');(d.users=d.users||{})[a[2]]=a[3]||'';ch();return p('Пользователь RADIUS добавлен: '+a[2])}
 if(d.t!=='sw'&&cm==='dot1x'){if(!a[1])return p('Использование: dot1x <логин> <пароль>');d.dx={u:a[1],p:a[2]||''};ch();return p('Учётные данные 802.1X сохранены')}
 return _run6(c)};

// --- панель ---
const _side6=side;
side=function(){_side6();const d=sel&&dv(sel);if(!d)return;const K=kind(d);let h='';
 if(d.t!=='sw')h+=`<h4>SNMP-агент</h4><input data-sn value="${esc(d.snmp||'')}" placeholder="community (пусто — выключен)"><h4>Скорость интерфейсов</h4>`+d.ifaces.map((f,i)=>f.radio||f.wifi||f.svi?'':`<label>${f.n}<select data-spd="${i}" style="width:100%">${[10,100,1000,10000].map(s=>`<option value="${s}" ${(f.spd||1000)===s?'selected':''}>${s>=1000?s/1000+' Гбит/с':s+' Мбит/с'}</option>`).join('')}</select></label>`).join('');
 if(d.t==='pc')h+=`<h4>802.1X (клиент)</h4><input data-du value="${esc((d.dx||{}).u||'')}" placeholder="Логин"><input data-dp value="${esc((d.dx||{}).p||'')}" placeholder="Пароль" style="margin-top:4px">`;
 if(K==='srv')h+='<h4>RADIUS-пользователи</h4>'+Object.keys(d.users||{}).map(u=>`<div class="rt"><span>${esc(u)}</span><button class="xb" data-ru="${esc(u)}">✕</button></div>`).join('')+'<div class="rr" style="grid-template-columns:1fr 1fr auto"><input id="ru" placeholder="логин"><input id="rp" placeholder="пароль"><button id="rad_add">+</button></div>';
 if(K==='msw')h+=`<h4>802.1X (коммутатор)</h4><label>RADIUS-сервер (IP)<input data-rad value="${esc(d.radius||'')}"></label>`+d.ifaces.map((f,i)=>f.radio?'':`<label style="display:inline-block;margin-right:8px"><input type="checkbox" data-dx="${i}" ${f.dx?'checked':''} style="width:auto;display:inline"> ${f.n}</label>`).join('')+'<p class="mt">Порты с галочкой пропускают устройство только после проверки логина и пароля на RADIUS (сервер должен быть доступен через неотмеченный порт).</p>';
 $('#side').insertAdjacentHTML('beforeend',h)};
$('#side').addEventListener('change',e=>{const t=e.target,d=dv(sel),D=t.dataset;if(!d)return;const n=Object.keys(D)[0],v=t.value.trim();
 if(n==='sn'){d.snmp=v;ch()}else if(n==='du'||n==='dp'){d.dx=d.dx||{u:'',p:''};d.dx[n==='du'?'u':'p']=v;ch()}
 else if(n==='rad'){d.radius=v;ch()}else if(n==='dx'){d.ifaces[+D.dx].dx=t.checked;ch()}});
$('#side').addEventListener('click',e=>{const t=e.target,d=sel&&dv(sel);if(!d)return;
 if(t.id==='rad_add'){const u=$('#ru').value.trim();if(u){(d.users=d.users||{})[u]=$('#rp').value;ch()}}
 else if(t.dataset.ru!==undefined){delete d.users[t.dataset.ru];ch()}});
const _draw6=draw;
draw=function(){_draw6();dxScan();let h='';S.devs.forEach(x=>{if(BWHY[x.id])h+=`<text pointer-events="none" x="${x.x}" y="${x.y-28}" font-size="12" text-anchor="middle" fill="var(--er)">⊘ 802.1X</text>`});cv.insertAdjacentHTML('beforeend',h)};
TASKS.push({t:'9. Контроль доступа 802.1X',d:'Управляемый коммутатор MSW1, сервер Server (RADIUS) подключён к порту fa0/8, PC1 и Guest — к fa0/1 и fa0/2, PC2 — к fa0/3. Сервер: radius user alice secret; коммутатор: radius <ip сервера> и dot1x fa0/1 on, dot1x fa0/2 on; на PC1: dot1x alice secret. Проверка: PC1 достучится до PC2, а Guest без учётных данных — нет. Теория: 802.1X пускает в сеть только прошедших аутентификацию.',c:[['PC1','PC2',1],['Guest','PC2',0]]});
p('Новое: 802.1X (radius, dot1x), SNMP (snmp, snmpget, кнопка «Мониторинг»), QoS (кнопка «QoS», speed).');
draw();side();
