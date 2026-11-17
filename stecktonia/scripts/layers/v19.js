// ================= v19: 7 новых шаблонов, сценарии аварий с подсказками, отчёт в файл =================
// ---------- A. новые шаблоны ----------
TPL.push({n:'Офис: два отдела на L3-коммутаторе',d:'L3-коммутатор с VLAN 10 (бухгалтерия) и VLAN 20 (склад), сервер в VLAN 20. Межвлановая маршрутизация через SVI.',hint:'Проверьте: с PC1 (VLAN 10) ping 192.168.20.10 и ping 192.168.20.100. Затем закройте бухгалтерии доступ к серверу списком ACL.',
 dev:[['pc','PC1',90,110],['pc','PC2',90,260],['l3','L3SW1',330,190],['pc','PC3',560,110],['srv','Server',560,260]],
 link:[['PC1',0,'L3SW1',0],['PC2',0,'L3SW1',1],['PC3',0,'L3SW1',2],['Server',0,'L3SW1',3]],
 cfg:[['L3SW1','port fa0/1 access 10','port fa0/2 access 10','port fa0/3 access 20','port fa0/4 access 20','svi 10 192.168.10.1 /24','svi 20 192.168.20.1 /24'],
  pcs('PC1','192.168.10.10','192.168.10.1'),pcs('PC2','192.168.10.11','192.168.10.1'),pcs('PC3','192.168.20.10','192.168.20.1'),pcs('Server','192.168.20.100','192.168.20.1'),['Server','service add tcp 80']]});
TPL.push({n:'Три филиала: OSPF и NAT на границе',d:'Центральный маршрутизатор и два филиала связаны по OSPF, центр выходит в Интернет через NAT.',hint:'Проверьте: ping между PC-A и PC-B, ping 8.8.8.8 с любого ПК. Отключите канал R-A — R-B-центр: что изменилось в tracert.',
 dev:[['pc','PC-A',70,110],['rt','R-A',250,110],['rt','Center',450,200],['rt','R-B',250,300],['pc','PC-B',70,300],['rt','ISP',650,200],['srv','Web',830,200]],
 link:[['PC-A',0,'R-A',0],['R-A',1,'Center',0],['Center',1,'R-B',1],['R-B',0,'PC-B',0],['Center',2,'ISP',0],['ISP',1,'Web',0]],
 cfg:[pcs('PC-A','192.168.1.10','192.168.1.1'),pcs('PC-B','192.168.2.10','192.168.2.1'),
  ['R-A','ip gi0/0 192.168.1.1 /24','ip gi0/1 10.0.1.1 /30','ospf on','route add 0.0.0.0 0.0.0.0 10.0.1.2'],['R-B','ip gi0/0 192.168.2.1 /24','ip gi0/1 10.0.2.1 /30','ospf on','route add 0.0.0.0 0.0.0.0 10.0.2.2'],
  ['Center','ip gi0/0 10.0.1.2 /30','ip gi0/1 10.0.2.2 /30','ip gi0/2 203.0.113.2 /30','ospf on','route add 0.0.0.0 0.0.0.0 203.0.113.1','nat gi0/2 on'],
  ['ISP','ip gi0/0 203.0.113.1 /30','ip gi0/1 8.8.8.1 /24'],['Web','ip eth0 8.8.8.8 /24','gateway 8.8.8.1','service add tcp 80']]});
TPL.push({n:'Школа: проводные классы и Wi‑Fi',d:'Wi‑Fi роутер раздаёт адреса, два ПК подключены кабелем, ноутбук и смартфон — по Wi‑Fi, сервер школы в LAN.',hint:'Проверьте: с Phone1 ping 192.168.0.10 (ответ Server). Отодвиньте смартфон за пределы радиуса и посмотрите сообщение; смените диапазон на 5 ГГц.',
 dev:[['wr','WR1',330,190],['pc','PC1',90,110],['pc','PC2',90,280],['srv','Server',580,190],['ph','Phone1',380,60]],
 link:[['PC1',0,'WR1',1],['PC2',0,'WR1',2],['Server',0,'WR1',3]],
 cfg:[['PC1','dhcp'],['PC2','dhcp'],['Server','ip eth0 192.168.0.10 /24','gateway 192.168.0.1'],['Phone1','wifi Stacktoniya-1 12345678','dhcp wlan0']]});
TPL.push({n:'Серверная: веб, база данных и NAS за межсетевым экраном',d:'DMZ с веб-сервером, внутренняя сеть с СУБД и файловым хранилищем; наружу опубликован только порт 80, в базу веб ходит строго по порту 5432.',hint:'Из Internet: connect 172.16.0.10 80 — открыт, connect 192.168.1.20 5432 — нет. С Web: connect 192.168.1.20 5432 — проходит.',
 dev:[['pc','PC1',70,120],['db','DB1',70,300],['sw','SW1',230,210],['rt','FW',420,210],['srv','Web',620,330],['srv','Internet',760,110]],
 link:[['PC1',0,'SW1',0],['DB1',0,'SW1',1],['SW1',2,'FW',0],['FW',1,'Web',0],['FW',2,'Internet',0]],
 cfg:[pcs('PC1','192.168.1.10','192.168.1.1'),pcs('DB1','192.168.1.20','192.168.1.1'),['Web','ip eth0 172.16.0.10 /24','gateway 172.16.0.1','service add tcp 80'],['Internet','ip eth0 198.51.100.10 /24','gateway 198.51.100.1'],
  ['FW','ip gi0/0 192.168.1.1 /24','ip gi0/1 172.16.0.1 /24','ip gi0/2 198.51.100.1 /24','zone gi0/0 inside','zone gi0/1 dmz','zone gi0/2 outside','publish tcp 80','allow dmz inside tcp 5432']]});
TPL.push({n:'Две площадки: IPsec VPN через провайдера',d:'Частные сети офисов А и Б связаны туннелем IPsec поверх маршрутизатора провайдера, не знающего частных адресов.',hint:'Проверьте: ping 192.168.2.10 с PC1, tracert (RA, RB, PC2). Посмотрите панель туннеля на RA; создайте туннель с другим ключом и найдите причину отказа.',
 dev:[['pc','PC1',70,200],['rt','RA',250,200],['rt','ISP',450,200],['rt','RB',650,200],['pc','PC2',830,200]],
 link:[['PC1',0,'RA',0],['RA',1,'ISP',0],['ISP',1,'RB',0],['RB',1,'PC2',0]],
 cfg:[pcs('PC1','192.168.1.10','192.168.1.1'),pcs('PC2','192.168.2.10','192.168.2.1'),
  ['RA','ip gi0/0 192.168.1.1 /24','ip gi0/1 198.51.100.1 /30','route add 0.0.0.0 0.0.0.0 198.51.100.2','tunnel 198.51.100.1 203.0.113.1 ipsec k1','ip Tunnel0 10.9.9.1 /30','route add 192.168.2.0 /24 10.9.9.2'],
  ['ISP','ip gi0/0 198.51.100.2 /30','ip gi0/1 203.0.113.2 /30'],
  ['RB','ip gi0/0 203.0.113.1 /30','ip gi0/1 192.168.2.1 /24','route add 0.0.0.0 0.0.0.0 203.0.113.2','tunnel 203.0.113.1 198.51.100.1 ipsec k1','ip Tunnel0 10.9.9.2 /30','route add 192.168.1.0 /24 10.9.9.1']]});
TPL.push({n:'Кольцо коммутаторов со STP',d:'Три управляемых коммутатора в кольце, на каждом по компьютеру. STP блокирует один порт, чтобы не было петли.',hint:'Выполните show stp на SW1: найдите корень и заблокированный порт. Выключите активный канал (shutdown fa0/1) — связь должна сохраниться.',
 dev:[['msw','SW1',150,120],['msw','SW2',450,120],['msw','SW3',300,300],['pc','PC1',60,60],['pc','PC2',540,60],['pc','PC3',300,400]],
 link:[['SW1',0,'SW2',0],['SW2',1,'SW3',0],['SW3',1,'SW1',1],['PC1',0,'SW1',2],['PC2',0,'SW2',2],['PC3',0,'SW3',2]],
 cfg:[pcs('PC1','192.168.1.10','192.168.1.254'),pcs('PC2','192.168.1.11','192.168.1.254'),pcs('PC3','192.168.1.12','192.168.1.254')]});
TPL.push({n:'Службы предприятия: DNS, время и почта',d:'Коммутатор, три сервера (NTP, почта, DNS-сервер) и два клиента в одной подсети.',hint:'На PC1: ntp 192.168.1.7, sendmail 192.168.1.8 Привет, nslookup mail.lab. На Mail1: inbox. Запретите UDP/123 списком ACL и проверьте.',
 dev:[['pc','PC1',80,110],['pc','PC2',80,290],['sw','SW1',280,200],['ntp','NTP1',520,90],['mail','Mail1',520,200],['srv','DNS1',520,310]],
 link:[['PC1',0,'SW1',0],['PC2',0,'SW1',1],['NTP1',0,'SW1',2],['Mail1',0,'SW1',3],['DNS1',0,'SW1',4]],
 cfg:[['PC1','ip eth0 192.168.1.10 /24','dns 192.168.1.9'],['PC2','ip eth0 192.168.1.11 /24','dns 192.168.1.9'],['NTP1','ip eth0 192.168.1.7 /24'],['Mail1','ip eth0 192.168.1.8 /24'],['DNS1','ip eth0 192.168.1.9 /24','dnsrec mail.lab 192.168.1.8','dnsrec ntp.lab 192.168.1.7']]});

// ---------- B. сценарии аварий ----------
const rnd19=a=>a[Math.floor(Math.random()*a.length)];
const FLT=[
 {id:'gw',n:'Пропал шлюз по умолчанию',h:['Не работает связь с другими подсетями, а внутри подсети всё в порядке.','Посмотрите ipconfig на компьютерах: у одного нет шлюза.','Компьютер из условия: проверьте поле «Шлюз по умолчанию» (gateway).'],
  f:()=>{const l=S.devs.filter(x=>x.t==='pc'&&x.gw);if(!l.length)return;const x=rnd19(l);x.gw='';return`На ${x.name} пропал шлюз по умолчанию`}},
 {id:'mask',n:'Неверная маска подсети',h:['Часть узлов своей же подсети недоступна.','Сравните маски на узлах: ipconfig, lint.','Одна из масок короче или длиннее, чем у соседей.'],
  f:()=>{const l=S.devs.filter(x=>x.ifaces.some(f=>f.ip&&f.mask&&!f.svi));if(!l.length)return;const x=rnd19(l),f=x.ifaces.find(f=>f.ip&&f.mask&&!f.svi),o=f.mask;f.mask='255.255.255.252';return`У ${x.name} на ${f.n} изменена маска (была ${o})`}},
 {id:'port',n:'Выключен порт',h:['Один из узлов полностью пропал из сети.','links: найдите кабель в состоянии «down» или интерфейс «выключен».','Включите порт: no shutdown <интерфейс>.'],
  f:()=>{if(!S.links.length)return;const l=rnd19(S.links),d=dv(l.a);d.ifaces[l.ai].off=true;return`Выключен порт ${d.ifaces[l.ai].n} на ${d.name}`}},
 {id:'route',n:'Удалён маршрут',h:['Связь есть до маршрутизатора, но не дальше.','tracert покажет, на каком маршрутизаторе пакет остановился.','На этом маршрутизаторе проверьте route и добавьте недостающий маршрут (или включите протокол маршрутизации).'],
  f:()=>{const l=S.devs.filter(x=>x.t==='rt'&&x.routes.length);if(!l.length)return;const x=rnd19(l),r=x.routes.pop();return`На ${x.name} удалён маршрут ${r.net}/${plen(r.mask)} через ${r.nh}`}},
 {id:'vlan',n:'Порт в чужой VLAN',h:['Компьютер не видит соседей, хотя адреса верны.','Откройте панель управляемого коммутатора и сравните VLAN портов.','Порт одного из компьютеров находится в другой VLAN – верните прежний номер (port fa0/N access <vlan>).'],
  f:()=>{const l=S.devs.filter(x=>x.t==='sw'&&kind(x)==='msw'&&x.ifaces.some((f,i)=>!f.tr&&peer(x,i)));if(!l.length)return;const x=rnd19(l),f=rnd19(x.ifaces.filter((f,i)=>!f.tr&&peer(x,i)));f.v=(f.v||1)+10;return`На ${x.name} порт ${f.n} переведён в другой VLAN`}},
 {id:'dup',n:'Дублирование IP-адреса',h:['Связь нестабильна: то работает, то нет.','lint сразу покажет повторяющиеся адреса.','Измените адрес одного из двух компьютеров.'],
  f:()=>{const l=S.devs.filter(x=>x.t==='pc'&&x.ifaces.some(f=>f.ip&&!f.wifi));if(l.length<2)return;const a=l[0],b=l.find(x=>x!==a&&srcIp(x));if(!b)return;const f=b.ifaces.find(f=>f.ip&&!f.wifi),o=f.ip,fa=a.ifaces.find(f=>f.ip&&!f.wifi);f.ip=fa.ip;return`${b.name} получил адрес ${fa.ip}, совпадающий с ${a.name} (был ${o})`}},
 {id:'dns',n:'Неверный адрес DNS-сервера',h:['Ping по IP проходит, а по имени – нет.','nslookup <имя> завершается ошибкой.','Проверьте адрес DNS у клиента (dns <ip>).'],
  f:()=>{const l=S.devs.filter(x=>x.dns);if(!l.length)return;const x=rnd19(l),o=x.dns;x.dns='192.0.2.250';return`У ${x.name} изменён адрес DNS-сервера (был ${o})`}},
 {id:'svc',n:'Остановлена служба на сервере',h:['Ping до сервера проходит, но приложение недоступно.','connect <узел> http: порт закрыт («отказ»).','На сервере запустите службу: service add http.'],
  f:()=>{const l=S.devs.filter(x=>(x.svc||[]).length);if(!l.length)return;const x=rnd19(l),s=x.svc.pop();return`На ${x.name} остановлена служба ${s.p}/${s.n}`}},
 {id:'acl',n:'ACL блокирует трафик',h:['Ping даёт тайм-аут, хотя маршруты есть.','send покажет, что пакет отброшен списком ACL на маршрутизаторе.','На маршрутизаторе выполните acl clear (или поправьте правила).'],
  f:()=>{const l=S.devs.filter(x=>x.t==='rt'&&kind(x)==='rt'&&x.ifaces.filter(f=>f.ip).length>=2);if(!l.length)return;const x=rnd19(l),f=x.ifaces.find(f=>f.ip&&f.mask);const n=ip2n(f.ip)&ip2n(f.mask);const net=[24,16,8,0].map(s=>(n>>>s)&255).reverse().join('.');execOn(x,`acl deny ${net}/${plen(f.mask)} any`);return`На ${x.name} появилось правило ACL, запрещающее трафик из сети ${net}/${plen(f.mask)}`}},
 {id:'nat',n:'Отключён NAT',h:['Внутренние узлы не достают Интернет, внутри сети всё хорошо.','nat на пограничном маршрутизаторе: смотрите, включён ли он.','nat <внешний интерфейс> on.'],
  f:()=>{const l=S.devs.filter(x=>x.t==='rt'&&x.ifaces.some(f=>f.nat));if(!l.length)return;const x=rnd19(l),f=x.ifaces.find(f=>f.nat);f.nat=false;return`На ${x.name} отключён NAT на интерфейсе ${f.n}`}},
 {id:'dhcp',n:'Удалён пул DHCP',h:['Новые клиенты не получают адрес.','dhcp на клиенте: «ответа нет».','На маршрутизаторе или сервере создайте пул заново (dhcp <интерфейс> <первый ip> <число>).'],
  f:()=>{const l=S.devs.filter(x=>x.dhcp&&Object.keys(x.dhcp).length);if(!l.length)return;const x=rnd19(l),k=Object.keys(x.dhcp)[0];delete x.dhcp[k];return`На ${x.name} удалён пул DHCP интерфейса ${k}`}}];
function pcConn(){const ps=S.devs.filter(d=>d.t==='pc'&&srcIp(d));let ok=0,n=0;ps.forEach(a=>ps.forEach(b=>{if(a===b)return;n++;EX=[];if(trip(a,srcIp(b)).ok)ok++}));return{ok,n}}
function flHtml(){const f=S.fault2,sc=FLT.map((x,i)=>`<button data-x="fl_s${i}" style="margin:2px">${esc(x.n)}</button>`).join('');
 return`<h3>Сценарии аварий</h3><p class="mt">Преподаватель или студент вносит в <b>рабочую</b> схему одну неисправность выбранного типа. Задача – найти и устранить её. Подсказки открываются по одной, причина – в конце. Нажмите «Проверить», когда исправите: программа сравнит связность ПК с исходной.</p>
<p><button data-x="fl_rand"><b>Случайная авария</b></button></p><p>${sc}</p><div id="fl_o">${f?flState():'<p class="mt">Авария не внесена.</p>'}</div>`}
function flState(){const f=S.fault2;if(!f)return'';return`<div class="tip"><b>Авария «${esc(f.name)}» внесена.</b> Исходная связность: ${f.base.ok} из ${f.base.n} пар ПК. Найдите причину.<br>${f.hints.slice(0,f.shown).map((h,i)=>`<br>💡 Подсказка ${i+1}: ${esc(h)}`).join('')}${f.reveal?`<br><br><b>Причина:</b> ${esc(f.desc)}`:''}<p><button data-x="fl_hint">Подсказка</button> <button data-x="fl_chk">Проверить</button> <button data-x="fl_show">Показать причину</button></p><div id="fl_res">${f.res||''}</div></div>`}
function flApply(i){const c=pcConn();let t=null;const order=i!=null?[i]:FLT.map((_,k)=>k).sort(()=>Math.random()-.5);let u=null;for(const k of order){const r=FLT[k].f();if(r){t=r;u=FLT[k];break}}
 if(!t){$('#fl_o').innerHTML='<p class="er">Для этой аварии в схеме нет подходящего места (например, нет DNS или NAT). Выберите другую или постройте сеть сложнее.</p>';return}
 S.fault2={name:u.n,desc:t,hints:u.h,shown:0,reveal:false,base:c,res:''};S.fault=t;ch();$('#fl_o').innerHTML=flState();p('⚠ В схему внесена авария. Найдите причину: ping, tracert, diag, lint, links.')}
$('#baddr').insertAdjacentHTML('afterend','<button id="bfl" title="Внести неисправность для тренировки поиска">Аварии</button>');
$('#bfl').onclick=()=>openMd(flHtml());
md.addEventListener('click',e=>{const bt=e.target.closest&&e.target.closest('[data-x]'),x=bt&&bt.dataset.x;if(!x||!x.startsWith('fl_'))return;
 if(x==='fl_rand')flApply(null);else if(/^fl_s\d+$/.test(x))flApply(+x.slice(4));
 else{const f=S.fault2;if(!f)return;
  if(x==='fl_hint'){f.shown=Math.min(f.hints.length,f.shown+1)}
  else if(x==='fl_show'){f.reveal=true}
  else if(x==='fl_chk'){const c=pcConn();f.res=c.ok>=f.base.ok?`<p class="ok"><b>Связность восстановлена: ${c.ok} из ${c.n} пар.</b> Аварию устранили. Запишите в отчёт причину и исправление.</p>`:`<p class="er"><b>Пока ${c.ok} из ${c.n} (было ${f.base.ok}).</b> Неисправность не устранена.</p>`}
  $('#fl_o').innerHTML=flState()}});
{const _run19=run;run=function(c){const s=c.trim(),a=s.split(/\s+/);
 if(a[0].toLowerCase()==='fault'){const v=(a[1]||'').toLowerCase();
  if(v==='list')return p(FLT.map((x,i)=>`${i}  ${x.n}`).join('\n'));
  if(v==='hint'){const f=S.fault2;if(!f)return p('Авария не внесена: fault random|<номер>');f.shown=Math.min(f.hints.length,f.shown+1);return p('Подсказка '+f.shown+': '+f.hints[f.shown-1])}
  if(v==='show'){const f=S.fault2;return p(f?'Причина: '+f.desc:'Авария не внесена')}
  if(v==='check'){const f=S.fault2;if(!f)return p('Авария не внесена');const c2=pcConn();return p(c2.ok>=f.base.ok?`✔ Связность восстановлена: ${c2.ok} из ${c2.n}`:`✖ Пока ${c2.ok} из ${c2.n} (было ${f.base.ok})`)}
  const i=v==='random'?null:parseInt(v);if(v!=='random'&&!(i>=0&&i<FLT.length))return p('Использование: fault random|<номер>|list|hint|show|check');
  const c0=pcConn();let t=null,u=null;const order=i==null?FLT.map((_,k)=>k).sort(()=>Math.random()-.5):[i];for(const k of order){const r=FLT[k].f();if(r){t=r;u=FLT[k];break}}
  if(!t)return p('Для этой аварии в схеме нет подходящего места');S.fault2={name:u.n,desc:t,hints:u.h,shown:0,reveal:false,base:c0,res:''};S.fault=t;ch();return p('⚠ Внесена авария «'+u.n+'». Найдите причину (fault hint — подсказка, fault check — проверить, fault show — ответ).')}
 return _run19(c)}}
CMDS.push(['fault','fault random|<номер>|list|hint|show|check','Сценарии аварий: внести неисправность, получить подсказку, проверить исправление','Тренировка поиска неисправностей: внесите аварию, ищите причину по уровням (физика → канал → сеть → порт → служба), используйте подсказки по одной.','fault random','Диагностика']);
if(!CMDNAMES.includes('fault'))CMDNAMES.push('fault');

// ---------- C. отчёт в файл ----------
function cap19(cmd){const keep=pSnap();out.textContent='';try{run(cmd);return out.textContent.trim()}finally{pRst(keep)}}
function cssResolved(){const rs=getComputedStyle(document.documentElement);let css='';[...document.querySelectorAll('style')].forEach(s=>{css+=s.textContent});return css.replace(/var\((--[\w-]+)\)/g,(m,n)=>rs.getPropertyValue(n).trim()||m)}
function reportHtml(name){const d=new Date(),stamp=d.toLocaleString('ru-RU');
 const pre=t=>`<pre>${esc(t)}</pre>`;let svg='';try{const c=cv.cloneNode(true);const rs=getComputedStyle(document.documentElement);c.removeAttribute('style');c.removeAttribute('id');c.setAttribute('class','rsvg');c.querySelectorAll('[data-l]').forEach(n=>n.remove());
  let bx=[1e9,1e9,-1e9,-1e9];S.devs.forEach(x=>{bx=[Math.min(bx[0],x.x),Math.min(bx[1],x.y),Math.max(bx[2],x.x),Math.max(bx[3],x.y)]});
  if(S.devs.length){const pad=90;c.setAttribute('viewBox',`${bx[0]-pad} ${bx[1]-pad} ${bx[2]-bx[0]+2*pad} ${bx[3]-bx[1]+2*pad}`);c.removeAttribute('width');c.removeAttribute('height')}
  svg=c.outerHTML.replace(/var\((--[\w-]+)\)/g,(m,n)=>rs.getPropertyValue(n).trim()||m)}catch(e){}
 const done=[];TASKS.forEach((t,i)=>{const r=REPT[i];if(r)done.push(`<tr><td>${esc(t.t)}</td><td>${r.n}</td><td>${r.ok?'выполнено, ~'+r.ok+' мин':'не выполнено'}</td></tr>`)});
 let conn='';try{conn=variantCheck()}catch(e){}
 let mat='';try{const ps=S.devs.filter(x=>x.t==='pc'&&srcIp(x));if(ps.length&&ps.length<=12){mat='<table><tr><th></th>'+ps.map(x=>`<th>${esc(x.name)}</th>`).join('')+'</tr>'+ps.map(a=>`<tr><th>${esc(a.name)}</th>`+ps.map(b=>{if(a===b)return'<td>—</td>';EX=[];const r=trip(a,srcIp(b));return`<td class="${r.ok?'ok':'er'}">${r.ok?'✔':'✖'}</td>`}).join('')+'</tr>').join('')+'</table>'}}catch(e){}
 const fault=S.fault2?`<h2>Сценарий аварии</h2><p><b>${esc(S.fault2.name)}</b>: ${esc(S.fault2.desc)}</p>`:'';
 return`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Отчёт Стектония — ${esc(name||'студент')}</title><style>${cssResolved()}</style><style>body{display:block!important;height:auto!important;overflow:visible!important;background:#fff;color:#111;font:14px/1.45 system-ui,Arial,sans-serif;max-width:980px;margin:20px auto;padding:0 16px}h1{font-size:22px}h2{font-size:17px;margin-top:26px;border-bottom:1px solid #ccc;padding-bottom:3px}pre{background:#f4f4f4;border:1px solid #ddd;padding:8px;white-space:pre-wrap;font:12px/1.35 Consolas,monospace}table{border-collapse:collapse}td,th{border:1px solid #bbb;padding:4px 8px;text-align:left}.ok{color:#087f3c}.er{color:#b3261e}svg.rsvg{background:#f7fafc;border:1px solid #ccd;width:100%;height:auto;max-width:960px}@media print{h2{break-after:avoid}}</style></head><body>
<h1>Отчёт по практической работе Стектония</h1><p><b>Студент:</b> ${esc(name||'не указан')} &nbsp; <b>Дата:</b> ${esc(stamp)}</p>
<h2>1. Схема сети</h2>${svg||'<p>Схема пуста.</p>'}
<h2>2. Таблица адресации</h2>${pre(cap19('addrtable'))}
<h2>3. Кабели</h2>${pre(cap19('links'))}
<h2>4. Устройства</h2>${pre(cap19('inventory'))}
<h2>5. Связность</h2>${conn}${mat}
<h2>6. Автодиагностика схемы</h2>${pre(cap19('lint'))}
${fault}
<h2>7. Задания автопроверки</h2>${done.length?'<table><tr><th>Задание</th><th>Попыток</th><th>Результат</th></tr>'+done.join('')+'</table>':'<p>Попыток проверки ещё не было.</p>'}
<h2>8. Журнал консоли (последние строки)</h2>${pre(out.textContent.split('\n').slice(-60).join('\n'))}
<p style="margin-top:30px;color:#777;font-size:12px">Сформировано программой «Стектония». Файл схемы приложите отдельно («Экспорт / импорт»).</p></body></html>`}
function reportDownload(name){const h=reportHtml(name),fn=`Отчёт_${(name||'студент').replace(/[^\wЀ-ӿ.-]+/g,'_')}.html`;
 try{const b=new Blob([h],{type:'text/html;charset=utf-8'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=fn;document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(u)},500);return fn}catch(e){return null}}
$('#baddr').insertAdjacentHTML('afterend','<button id="brpf" title="Сформировать отчёт со схемой, адресацией и результатами в файл HTML">Отчёт</button>');
$('#brpf').onclick=()=>openMd(`<h3>Отчёт в файл</h3><p class="mt">Формируется страница HTML со схемой, таблицей адресации, списком кабелей, матрицей связности, результатами диагностики и заданий, журналом консоли. Откройте файл в браузере и распечатайте (Ctrl+P → «Сохранить как PDF») или приложите к работе.</p><p><input id="rp_n" placeholder="ФИО студента, группа" style="width:80%"></p><p><button data-x="rp_dl"><b>Скачать отчёт</b></button></p><div id="rp_o"></div>`);
md.addEventListener('click',e=>{const bt=e.target.closest&&e.target.closest('[data-x]');if(bt&&bt.dataset.x==='rp_dl'){const fn=reportDownload(($('#rp_n').value||'').trim());$('#rp_o').innerHTML=fn?`<p class="ok">Файл «${esc(fn)}» сформирован.</p>`:'<p class="er">Браузер не позволил сохранить файл.</p>'}});
{const _run19b=run;run=function(c){const s=c.trim(),a=s.split(/\s+/);if(a[0].toLowerCase()==='report'){const fn=reportDownload(a.slice(1).join(' '));return p(fn?`Отчёт сформирован: ${fn} (проверьте папку загрузок браузера)`:'Не удалось сохранить файл отчёта')}return _run19b(c)}}
CMDS.push(['report','report [ФИО]','Скачать отчёт по практической работе (HTML): схема, адресация, связность, задания, журнал','Готовый документ для сдачи работы: его можно распечатать или сохранить в PDF.','report Иванов И.И.','Обзор']);
if(!CMDNAMES.includes('report'))CMDNAMES.push('report');
p('Новое (v19): 7 новых шаблонов («Шаблоны»), сценарии аварий с подсказками (кнопка «Аварии», команда fault), отчёт в файл (кнопка «Отчёт (файл)», команда report).');
$('#bx').textContent='Экспорт/импорт';
