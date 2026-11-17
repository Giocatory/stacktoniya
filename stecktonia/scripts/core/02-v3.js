/* ===== v3: каталог устройств, NIC, Wi-Fi, управляемые/неуправляемые, DHCP-настройки, Ctrl+Z ===== */
const CAT={
 pc:{g:'Компьютеры и серверы',l:'Компьютер',p:'PC',i:'',t:'pc',n:1},
 lap:{l:'Ноутбук (кабель + Wi‑Fi)',p:'Laptop',i:'',t:'pc',n:1,wifi:1},
 srv:{l:'Сервер (DHCP/DNS)',p:'Server',i:'',t:'pc',n:2},
 ph:{g:'Телефоны и периферия',l:'Смартфон (Wi‑Fi)',p:'Phone',i:'',t:'pc',n:0,wifi:1},
 tab:{l:'Планшет (Wi‑Fi)',p:'Tab',i:'',t:'pc',n:0,wifi:1},
 ipp:{l:'IP-телефон',p:'IPphone',i:'',t:'pc',n:1},
 prn:{l:'Сетевой принтер',p:'Printer',i:'',t:'pc',n:1},
 hub:{g:'Коммутация',l:'Хаб (неуправляемый)',p:'Hub',i:'',t:'sw',n:8},
 sw:{l:'Коммутатор неуправляемый',p:'SW',i:'',t:'sw',n:8},
 msw:{l:'Коммутатор управляемый (VLAN)',p:'MSW',i:'',t:'sw',n:8},
 ap:{g:'Беспроводные',l:'Точка доступа Wi‑Fi',p:'AP',i:'',t:'sw',n:2,rad:1},
 rt:{g:'Маршрутизация',l:'Маршрутизатор',p:'R',i:'',t:'rt',n:4},
 l3:{l:'Коммутатор L3 (8 портов)',p:'L3SW',i:'',t:'rt',n:8},
 wr:{l:'Wi‑Fi роутер',p:'WiFiR',i:'',t:'rt',n:4,rad:1},
 fw:{l:'Межсетевой экран',p:'FW',i:'',t:'rt',n:3}};
const NOTE={hub:'Хаб повторяет кадры на все порты: один домен коллизий, без фильтрации и VLAN. Сегодня заменён коммутаторами.',sw:'Неуправляемый коммутатор сам учит MAC-адреса; настроек и VLAN нет — работает «из коробки».',msw:'Управляемый коммутатор: VLAN, trunk, отключение портов — основа сегментации корпоративной сети.',ap:'Точка доступа связывает Wi‑Fi клиентов с проводной сетью на L2 (без маршрутизации). Адреса клиентам выдаёт DHCP проводной сети.',rt:'Маршрутизатор соединяет разные подсети; у каждого интерфейса свой IP.',l3:'Коммутатор L3: много портов с маршрутизацией (здесь работает как маршрутизатор на 8 портов).',wr:'Wi‑Fi роутер: маршрутизатор с радио-интерфейсом wlan0 (своя подсеть, DHCP уже включён). Wi‑Fi клиенты попадают в другие сети через него.',fw:'Межсетевой экран: маршрутизатор, где главное — правила acl между зонами.',srv:'Сервер с двумя сетевыми картами: может раздавать DHCP (команда dhcp) и быть DNS-сервером (dnsrec).',ph:'Смартфон: только Wi‑Fi. Подключите к SSID с паролем, затем получите IP по DHCP.',lap:'Ноутбук: проводной адаптер и Wi‑Fi (wlan0).'};
const kind=d=>d.k||({pc:'pc',sw:'msw',rt:'rt'})[d.t];
const mkMac=()=>'00:'+[...Array(5)].map(()=>Math.floor(Math.random()*256).toString(16).padStart(2,'0')).join(':');

addDev=function(key,x,y,name){const c=CAT[key]||CAT.pc;key=CAT[key]?key:'pc';const id='d'+(++S.c);S.n[key]=(S.n[key]||0)+1;
 const ifaces=[...Array(c.n)].map((_,i)=>({n:c.t==='sw'?'fa0/'+(i+1):c.t==='rt'?'gi0/'+i:'eth'+i,ip:'',mask:''}));
 if(c.wifi)ifaces.push({n:'wlan0',ip:'',mask:'',wifi:1,ssid:'',pass:''});
 if(c.rad)ifaces.push({n:'wlan0',ip:'',mask:'',radio:1});
 const d={id,t:c.t,k:key,name:name||c.p+S.n[key],x,y,ifaces,gw:'',routes:[],mac:mkMac()};
 if(c.rad){d.ssid='Stacktoniya-'+S.n[key];d.pass='12345678'}
 if(key==='wr'){const f=ifaces[ifaces.length-1],o=S.n.wr-1;f.ip=`192.168.${o}.1`;f.mask='255.255.255.0';d.dhcp={wlan0:{first:`192.168.${o}.100`,n:50,gw:'',dns:''}}}
 S.devs.push(d);ch();return d};

// Wi-Fi: клиентский адаптер ↔ радио точки доступа/роутера с тем же SSID и паролем
function wfPass(a,f){return a.sec==='open'||a.pass===f.pass}
const wlink=(d,i)=>{const f=d.ifaces[i];if(!f.wifi||!f.ssid||f.off)return null;for(const a of S.devs){if(a===d||!a.ssid||a.off)continue;const ri=a.ifaces.findIndex(g=>g.radio);if(ri>=0&&a.ssid===f.ssid&&wfPass(a,f)&&!a.ifaces[ri].off)return{d:a,i:ri}}return null};
const _peer=peer;
peer=function(d,i){const f=d.ifaces[i];if(!f||f.off)return null;if(f.wifi)return wlink(d,i);if(f.radio)return peers(d,i)[0]||null;return _peer(d,i)};
function peers(d,i){const f=d.ifaces[i];if(!f||f.off)return[];
 if(f.radio)return S.devs.flatMap(c=>c===d?[]:c.ifaces.map((g,j)=>g.wifi&&!g.off&&g.ssid===d.ssid&&wfPass(d,g)&&!d.off?{d:c,i:j}:null).filter(Boolean));
 const q=_peer(d,i);return q&&!q.d.ifaces[q.i].off?[q]:[]}
l2all=function(d,out){const res=[],seen=new Set(),st=peers(d,out).map(q=>({...q,v:null,path:[d.id]}));
 while(st.length){const{d:x,i,v,path}=st.pop(),k=x.id+':'+i+':'+v;if(seen.has(k))continue;seen.add(k);const np=[...path,x.id];
  if(x.t==='sw'){const f=x.ifaces[i],hub=x.k==='hub',vv=f.tr?(v||1):(f.v||1);
   x.ifaces.forEach((g,j)=>{if((j===i&&!g.radio)||!(hub||g.tr||(g.v||1)===vv))return;peers(x,j).forEach(n=>st.push({...n,v:g.tr?vv:null,path:np}))})}
  else if(x!==d)res.push({d:x,i,path:np})}
 return res};
connect=function(a,b){if(a===b)return;const A=dv(a),B=dv(b),fr=D=>D.ifaces.findIndex((f,i)=>!f.wifi&&!f.radio&&!peer(D,i));const ia=fr(A),ib=fr(B);
 if(ia<0||ib<0)return p('Нет свободных проводных портов на '+(ia<0?A.name:B.name)+' (Wi‑Fi подключается по SSID, добавьте сетевую карту при необходимости)');
 link(A,ia,B,ib);p(`Кабель: ${A.name} ${A.ifaces[ia].n} ⇄ ${B.name} ${B.ifaces[ib].n}`);ch()};
function wifiWhy(d,i){const f=d.ifaces[i];if(!f.ssid)return'SSID не задан';const aps=S.devs.filter(a=>a!==d&&a.ssid===f.ssid);
 if(!aps.length)return`сеть «${f.ssid}» не найдена — проверьте имя сети (SSID)`;if(aps.some(a=>!a.off&&wfPass(a,f)))return true;return aps.some(a=>wfPass(a,f))?'радио точки доступа выключено':'неверный пароль Wi‑Fi'}

// DHCP: сервер — маршрутизатор или сервер; клиент — любой узел
function setPool(d,nn,first,n,gw,dns){const f=d.ifaces.find(x=>x.n.toLowerCase()===(nn||'').toLowerCase());if(!f||!f.ip)return'Выберите интерфейс, у которого уже есть IP';if(ip2n(first||'')==null||!(n>0))return'Неверный первый адрес или количество';if(!same(first,f.ip,f.mask))return`Пул ${first} вне подсети интерфейса ${f.n}`;(d.dhcp=d.dhcp||{})[f.n]={first,n,gw:gw||'',dns:dns||''};return'DHCP-пул включён на '+f.n}
dhcp=function(d,fi=0){const f=d.ifaces[fi];if(!f)return;p(`DHCP Discover (${f.n}): широковещательный запрос 0.0.0.0 → 255.255.255.255`);
 const e=l2all(d,fi).find(e=>(e.d.t==='rt'||e.d.k==='srv')&&(e.d.dhcp||{})[e.d.ifaces[e.i].n]);
 if(!e)return p('✖ Ответа нет. Нужен DHCP-сервер в том же широковещательном домене (тот же VLAN/Wi‑Fi сеть): «dhcp <интерфейс> <первый_ip> <число>» на маршрутизаторе или сервере. Проверьте кабели, VLAN, Wi‑Fi.');
 const r=e.d,ri=r.ifaces[e.i],pl=r.dhcp[ri.n];let ip=null;
 for(let k=0;k<pl.n;k++){const c=n2ip(ip2n(pl.first)+k);if(!S.devs.some(x=>x!==d&&x.ifaces.some(g=>g.ip===c))){ip=c;break}}
 if(!ip)return p('✖ DHCP: пул адресов исчерпан');
 f.ip=ip;f.mask=ri.mask;d.gw=pl.gw||(r.t==='rt'?ri.ip:d.gw);if(pl.dns)d.dns=pl.dns;
 ch();p(`DHCP Offer от ${r.name}: ${ip}\nDHCP Request → Ack: адрес ${ip}, маска ${ri.mask}, шлюз ${d.gw||'—'}${pl.dns?', DNS '+pl.dns:''}`);flash([d,...e.path.map(dv)])};

const _run3=run;
run=function(c){const d=sel&&dv(sel),a=c.trim().split(/\s+/),cm=a[0].toLowerCase();if(!d||!c.trim())return _run3(c);const K=kind(d),ifn=n=>d.ifaces.find(f=>f.n.toLowerCase()===(n||'').toLowerCase());
 if(d.t==='sw'&&K!=='msw'&&/^(port|vlan|shutdown|no)$/.test(cm))return p(`${CAT[K]?CAT[K].l:'Устройство'}: неуправляемое — настроить нельзя. Для VLAN возьмите управляемый коммутатор.`);
 if(cm==='shutdown'||(cm==='no'&&a[1]==='shutdown')){const f=ifn(cm==='no'?a[2]:a[1]);if(!f)return p('Использование: shutdown <интерфейс> | no shutdown <интерфейс>');f.off=cm==='shutdown';ch();return p(f.n+(f.off?' выключен администратором':' включён'))}
 if(cm==='ssid'&&CAT[K]&&CAT[K].rad){if(!a[1])return p(`SSID ${d.ssid}, пароль ${d.pass}`);d.ssid=a[1];d.pass=a[2]||'';ch();return p('Wi‑Fi сеть: '+d.ssid)}
 if(cm==='wifi'){const i=d.ifaces.findIndex(f=>f.wifi);if(i<0)return p('Нет Wi‑Fi адаптера (добавьте NIC «Wi‑Fi» в панели справа)');const f=d.ifaces[i];if(a[1]){f.ssid=a[1];f.pass=a[2]||'';ch()}const w=wifiWhy(d,i);return p(w===true?`Wi‑Fi: подключено к «${f.ssid}»`:'Wi‑Fi: нет подключения — '+w)}
 if(cm==='dhcp'&&(d.t==='rt'||K==='srv')&&a.length>=4){const m=setPool(d,a[1],a[2],+a[3],a[4],a[5]);ch();return p(m)}
 if(cm==='dhcp'&&d.t==='pc'){const i=a[1]?d.ifaces.findIndex(f=>f.n.toLowerCase()===a[1].toLowerCase()):0;return i<0?p('Нет такого интерфейса'):dhcp(d,i)}
 return _run3(c)};

const _side3=side;
side=function(){_side3();const d=sel&&dv(sel);if(!d)return;const K=kind(d),el=$('#side'),c=CAT[K]||{},h3=$('#side h3');if(c.l)h3.textContent=c.l;
 if(d.t==='sw'&&K!=='msw'){const h=[...el.querySelectorAll('h4')].find(x=>x.textContent.startsWith('VLAN'));if(h){while(h.nextSibling)h.nextSibling.remove();h.remove()}}
 let h=`<p class="mt">${esc(NOTE[K]||'')}</p>`;
 if(c.rad)h+=`<h4>Wi‑Fi</h4><input data-w="ssid" value="${esc(d.ssid||'')}" placeholder="SSID"><input data-w="pass" value="${esc(d.pass||'')}" placeholder="Пароль" style="margin-top:4px"><label><input type="checkbox" data-w="on" ${d.off?'':'checked'} style="width:auto;display:inline"> Радио включено</label><div class="mt">Клиентов: ${peers(d,d.ifaces.findIndex(f=>f.radio)).length}. У клиентов должны совпасть SSID и пароль.</div>`;
 d.ifaces.forEach((f,i)=>{if(f.wifi){const w=wifiWhy(d,i);h+=`<h4>Wi‑Fi адаптер ${f.n}</h4><input data-cw="ssid" data-i="${i}" value="${esc(f.ssid||'')}" placeholder="SSID сети"><input data-cw="pass" data-i="${i}" value="${esc(f.pass||'')}" placeholder="Пароль" style="margin-top:4px"><div class="mt ${w===true?'ok':'er'}">${w===true?'● подключено':'○ '+w}</div>`}});
 if(d.t==='pc')h+=`<h4>Получение адреса</h4>${d.ifaces.map((f,i)=>`<button class="b" data-dh="${i}" style="margin:2px 0;width:100%">DHCP на ${f.n}</button>`).join('')}`;
 if(d.t==='rt'||K==='msw')h+='<h4>Порты (админ. состояние)</h4>'+d.ifaces.map((f,i)=>`<label style="display:block"><input type="checkbox" data-off="${i}" ${f.off?'':'checked'} style="width:auto;display:inline"> ${f.n} включён</label>`).join('');
 if(d.t==='rt'||K==='srv'){const up=d.ifaces.filter(f=>f.ip);h+=`<h4>DHCP-сервер</h4><select id="dh_if" style="width:100%">${up.map(f=>`<option>${f.n}</option>`).join('')||'<option value="">нет интерфейсов с IP</option>'}</select><input id="dh_f" placeholder="Первый IP пула" style="margin-top:4px"><input id="dh_n" placeholder="Сколько адресов" style="margin-top:4px"><input id="dh_g" placeholder="Шлюз клиентам (необяз.)" style="margin-top:4px"><input id="dh_d" placeholder="DNS клиентам (необяз.)" style="margin-top:4px"><button class="b" id="dh_ok" style="margin-top:6px">Включить пул</button> <button class="b" id="dh_x">Сбросить</button><div class="mt">${Object.entries(d.dhcp||{}).map(([k,v])=>`${k}: ${v.first} +${v.n}`).join('; ')||'пулов нет'}</div>`}
 if(d.t==='pc'||d.t==='rt')h+=`<h4>Сетевые карты</h4><select id="nic_t" style="width:100%"><option value="eth">Ethernet 1 Гбит/с (медь)</option><option value="ten">Ethernet 10 Гбит/с</option><option value="sfp">Оптика SFP+ 10G</option>${d.t==='pc'&&!d.ifaces.some(f=>f.wifi)?'<option value="wifi">Wi‑Fi адаптер</option>':''}</select><button class="b" id="nic_b" style="margin-top:6px;width:100%">Добавить NIC</button>`;
 el.insertAdjacentHTML('beforeend',h)};
$('#side').addEventListener('change',e=>{const t=e.target,d=dv(sel),D=t.dataset;if(!d)return;
 if(D.w){if(D.w==='on')d.off=!t.checked;else d[D.w]=t.value.trim();ch()}
 else if(D.cw){d.ifaces[+D.i][D.cw]=t.value.trim();ch()}
 else if(D.off!==undefined){d.ifaces[+D.off].off=!t.checked;ch()}});
$('#side').addEventListener('click',e=>{const t=e.target,d=sel&&dv(sel);if(!d)return;
 if(t.id==='dh_ok'){p(setPool(d,$('#dh_if').value,$('#dh_f').value.trim(),+$('#dh_n').value,$('#dh_g').value.trim(),$('#dh_d').value.trim()));ch()}
 else if(t.id==='dh_x'){d.dhcp={};ch();p('DHCP-пулы сброшены')}
 else if(t.dataset.dh!==undefined)dhcp(d,+t.dataset.dh);
 else if(t.id==='nic_b'){const ty=$('#nic_t').value,base=ty==='wifi'?'wlan':d.t==='rt'?'gi0/':ty==='ten'?'ten':ty==='sfp'?'sfp':'eth';let k=0;while(d.ifaces.some(f=>f.n===base+k))k++;
  d.ifaces.push(ty==='wifi'?{n:base+k,ip:'',mask:'',wifi:1,ssid:'',pass:''}:{n:base+k,ip:'',mask:''});ch();p('Добавлена сетевая карта '+base+k)}});

// Рисунок: иконки по типу устройства и пунктир Wi‑Fi
const _draw3=draw;
draw=function(){_draw3();let h='';S.devs.forEach(c=>c.ifaces.forEach((f,i)=>{if(!f.wifi)return;const q=peer(c,i);if(q)h+=`<line x1="${c.x}" y1="${c.y}" x2="${q.d.x}" y2="${q.d.y}" stroke="var(--ac)" stroke-width="2" stroke-dasharray="3 5"/>`}));
 cv.insertAdjacentHTML('afterbegin',h);cv.querySelectorAll('g[data-id]').forEach(g=>{const d=dv(g.dataset.id),t=g.querySelector('text');if(d&&t)t.textContent=(CAT[kind(d)]||{i:t.textContent}).i});if(!drag)snap()};

// Выпадающий список устройств
document.head.insertAdjacentHTML('beforeend','<style>#ad{padding:5px 8px;border-radius:6px;background:var(--hd);color:inherit;border:1px solid #ffffff33;font:inherit;max-width:260px}#ad option,#ad optgroup{color:#14202b;background:#fff}</style>');
document.querySelectorAll('header [data-t^="add:"]').forEach(b=>b.remove());
const OPT=(()=>{let h='<option value="">＋ Добавить устройство…</option>',g=0;for(const k in CAT){const c=CAT[k];if(c.g){if(g)h+='</optgroup>';h+=`<optgroup label="${c.g}">`;g=1}h+=`<option value="${k}">${c.i} ${c.l}</option>`}return h+'</optgroup>'})();
$('header [data-t="cab"]').insertAdjacentHTML('beforebegin',`<select id="ad" aria-label="Добавить устройство">${OPT}</select>`);
$('#bt').insertAdjacentHTML('beforebegin','<button id="bu" title="Ctrl+Z">↶ Отменить</button><button id="br" title="Ctrl+Y">↷ Вернуть</button>');
$('#ad').onchange=e=>{const v=e.target.value;if(!v)return;tool='add:'+v;linkFrom=null;document.querySelectorAll('header [data-t]').forEach(x=>x.classList.remove('on'));draw()};
document.querySelectorAll('header [data-t]').forEach(b=>b.addEventListener('click',()=>$('#ad').value=''));

// Отмена / возврат (Ctrl+Z / Ctrl+Y)
let U=[],RD=[],last=JSON.stringify(S);
function snap(){const c=JSON.stringify(S);if(c!==last){U.push(last);if(U.length>100)U.shift();RD=[];last=c}}
const restore=s=>{S=JSON.parse(s);last=s;if(sel&&!dv(sel))sel=null;save();draw();side()};
function undo(){if(!U.length)return p('Отменять нечего');RD.push(last);restore(U.pop());p('↶ Отменено')}
function redo(){if(!RD.length)return p('Возвращать нечего');U.push(last);restore(RD.pop());p('↷ Возвращено')}
$('#bu').onclick=undo;$('#br').onclick=redo;cv.addEventListener('pointerup',snap);$('#bs').addEventListener('click',()=>{U=[];RD=[]});
document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select'))return;const m=e.ctrlKey||e.metaKey;if(m&&e.code==='KeyZ'){e.preventDefault();e.shiftKey?redo():undo()}else if(m&&e.code==='KeyY'){e.preventDefault();redo()}});

TASKS[2].d=TASKS[2].d.replace('на одном коммутаторе','на одном управляемом коммутаторе');
TASKS.push({t:'6. Wi‑Fi: смартфон в корпоративной сети',d:'Wi‑Fi роутер (DHCP на wlan0 уже включён) соединён кабелем с сервером Server (дайте ему адрес из подсети роутера, напр. 192.168.0.10/24). Смартфон Phone1: введите SSID и пароль роутера, нажмите «DHCP на wlan0». Проверка: Phone1 достучится до Server. Теория: Wi‑Fi — тот же L2, только без кабеля; доступ ограничивает SSID и пароль.',c:[['Phone1','Server',1]]});
p('Новое: список устройств (ПК, ноутбук, сервер, телефоны, хаб, коммутаторы, точка доступа, роутеры), Wi‑Fi (ssid, wifi), shutdown, dhcp-пулы, Ctrl+Z / Ctrl+Y.');
draw();side();
