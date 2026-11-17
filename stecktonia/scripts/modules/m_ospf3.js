// ===== m_ospf3: OSPFv3 (динамическая маршрутизация IPv6) =====
const o3Rid=d=>{if(d.rid3)return d.rid3;if(d.rid)return d.rid;let m=null;d.ifaces.forEach(f=>{if(f.ip&&!f.tun&&(m===null||ip2n(f.ip)>ip2n(m)))m=f.ip});return m||''};
function o3Bad(a,f,b,bf){if(f.passive)return`на ${a.name} ${f.n} пассивный интерфейс (passive): Hello не отправляются`;if(bf.passive)return`на ${b.name} ${bf.n} пассивный интерфейс (passive): Hello не отправляются`;
 if(!o3Rid(a))return`у ${a.name} нет Router ID: в OSPFv3 он 32-битный и при отсутствии адреса IPv4 задаётся вручную (ospf3 rid 1.1.1.1)`;
 if(!o3Rid(b))return`у ${b.name} нет Router ID (ospf3 rid 2.2.2.2)`;
 if(!a.v6r)return`на ${a.name} выключена маршрутизация IPv6 (ipv6 unicast-routing)`;if(!b.v6r)return`на ${b.name} выключена маршрутизация IPv6 (ipv6 unicast-routing)`;
 if(ospfArea(f)!==ospfArea(bf))return`номера областей различаются: ${a.name} — область ${ospfArea(f)}, ${b.name} — область ${ospfArea(bf)}`;
 if(ospfHello(f)!==ospfHello(bf))return`интервалы Hello различаются: ${ospfHello(f)} с ≠ ${ospfHello(bf)} с`;
 if(ospfDead(f)!==ospfDead(bf))return`интервалы Dead различаются: ${ospfDead(f)} с ≠ ${ospfDead(bf)} с`;
 if((f.oauth||'')!==(bf.oauth||''))return(f.oauth&&bf.oauth)?'пароли аутентификации различаются':`аутентификация включена только на ${f.oauth?a.name:b.name}`;
 if(o3Rid(a)===o3Rid(b))return`одинаковый Router ID ${o3Rid(a)} у ${a.name} и ${b.name} (должен быть уникальным)`;
 if((+f.mtu||1500)!==(+bf.mtu||1500))return`MTU различается (${+f.mtu||1500} ≠ ${+bf.mtu||1500}): соседство «зависает» в состоянии ExStart`;return null}
// соседи по OSPFv3: в отличие от OSPFv2 общий префикс не нужен — достаточно общего канала (общение по link-local)
function o3Links(d){const o=[];if(!d.ospf3)return o;d.ifaces.forEach((f,i)=>{if(!f.ip6||f.off||f.tun)return;l2all(d,i).forEach(e=>{const b=e.d,bf=b.ifaces[e.i];if(b!==d&&b.t==='rt'&&b.ospf3&&bf&&bf.ip6)o.push({f,i,b,bf,bad:o3Bad(d,f,b,bf)})})});return o}
const o3Pfx=f=>s6(v6(f.ip6)&m6(f.p6||64))+'/'+(f.p6||64);
// маршруты: поиск в ширину по исправным соседствам, стоимость = число переходов
function o3Routes(){const R={};const rts=S.devs.filter(x=>x.t==='rt'&&x.ospf3);const adj={};rts.forEach(d=>{adj[d.id]=o3Links(d).filter(x=>!x.bad)});
 rts.forEach(d=>{const own=new Set(d.ifaces.filter(f=>f.ip6).map(o3Pfx)),seen=new Set([d.id]),out=[],q=[];
  adj[d.id].forEach(x=>{if(!seen.has(x.b.id)){seen.add(x.b.id);q.push({r:x.b,first:x.b,i:x.i,c:1})}});
  while(q.length){const c=q.shift();c.r.ifaces.forEach(f=>{if(!f.ip6)return;const k=o3Pfx(f);if(own.has(k))return;own.add(k);const pl=f.p6||64;out.push({net:s6(v6(f.ip6)&m6(pl)),len:pl,nh:s6(ll6(c.first)),i:c.i,k:'OSPFv3',o:1,cost:c.c,via:c.first.name})});
   (adj[c.r.id]||[]).forEach(x=>{if(!seen.has(x.b.id)){seen.add(x.b.id);q.push({r:x.b,first:c.first,i:c.i,c:c.c+1})}})}
  R[d.id]=out});return R}
{const _t=trip6;trip6=function(d,dst){if(!S.devs.some(x=>x.ospf3))return _t(d,dst);const R=o3Routes(),saved=new Map();
 S.devs.forEach(x=>{if(R[x.id]){saved.set(x,x.routes6);const st=x.routes6||[];x.routes6=st.concat(R[x.id].filter(r=>!st.some(s=>s.net===r.net&&s.len===r.len)))}});
 try{return _t(d,dst)}finally{saved.forEach((v,x)=>{if(v===undefined)delete x.routes6;else x.routes6=v})}}}
function o3Show(d,o){if(!d.ospf3){o('OSPFv3 на '+d.name+' не запущен (ospf3 on)');return}
 o(`OSPFv3 Router ID ${o3Rid(d)||'— не задан'}`);o('Сосед (Router ID)  Интерфейс  Состояние  Через');const L=o3Links(d);
 if(!L.length)o('(кандидатов в соседи нет: нет маршрутизаторов с ospf3 на общих каналах)');
 L.forEach(x=>o(`${(o3Rid(x.b)||'—').padEnd(18)} ${x.f.n.padEnd(9)}  ${x.bad?'DOWN':'FULL  '}      ${s6(ll6(x.b))}`+(x.bad?`\n   ✖ ${x.bad}`:'')))}
function o3Problems(){const P=[];S.devs.filter(d=>d.t==='rt'&&d.ospf3).forEach(d=>{if(!d.v6r)P.push(`${d.name}: OSPFv3 включён, но маршрутизация IPv6 выключена (ipv6 unicast-routing)`);else if(!o3Rid(d))P.push(`${d.name}: OSPFv3 не запустится — нет Router ID (ospf3 rid 1.1.1.1)`);
 o3Links(d).forEach(x=>{if(x.bad&&d.id<x.b.id&&d.v6r&&x.b.v6r&&o3Rid(d)&&o3Rid(x.b))P.push(`OSPFv3 ${d.name} ⇄ ${x.b.name}: ${x.bad}`)})});return P}
{const _pr=i6Problems;i6Problems=function(){return _pr().concat(o3Problems())}}
{const _r=run;run=function(c){const a=String(c).trim().split(/\s+/),w=(a[0]||'').toLowerCase(),w1=(a[1]||'').toLowerCase(),w2=(a[2]||'').toLowerCase(),d=sel&&dv(sel);
 if(d&&d.t==='rt'){
  if(w==='ospf3'){if(w1==='on'||w1==='off'){d.ospf3=w1==='on';if(!d.ospf3)delete d.ospf3;ch();p('OSPFv3: '+(w1==='on'?'включён на всех интерфейсах с адресом IPv6':'выключен')+(w1==='on'&&!d.v6r?'. Внимание: маршрутизация IPv6 выключена — ipv6 unicast-routing':'')+(w1==='on'&&!o3Rid(d)?'. Внимание: нет Router ID — ospf3 rid 1.1.1.1':''));return}
   if(w1==='rid'){if(ip2n(a[2]||'')==null){p('Использование: ospf3 rid <x.x.x.x>');return}d.rid3=a[2];ch();p('OSPFv3 Router ID '+a[2]);return}
   if(w1==='show'||!w1){o3Show(d,p);return}p('Команды: ospf3 on|off | ospf3 rid <x.x.x.x> | ospf3 show; параметры интерфейса — общие с OSPFv2: ospf area|hello|auth|mtu|passive <ifc> …; просмотр: show ipv6 ospf neighbor');return}
  if(w==='show'&&w1==='ipv6'&&w2==='ospf'){o3Show(d,p);return}
  if(w==='show'&&w1==='ipv6'&&w2==='route'){const r=_r(c);if(d.ospf3){const R=o3Routes()[d.id]||[];R.forEach(x=>p(`O  ${x.net}/${x.len}  [110/${x.cost}] через ${x.nh}, ${d.ifaces[x.i].n}  (${x.via})`))}return r}}
 return _r(c)}}
// ---------- шаблон и сценарий ----------
TPL.push({n:'IPv6: OSPFv3 между тремя маршрутизаторами',d:'Три маршрутизатора в линию (R1–R2–R3), у каждого только адреса IPv6; PC-A и PC-C получают адреса по SLAAC, сети маршрутизаторов обмениваются префиксами по OSPFv3.',hint:'Проверьте: show ipv6 ospf neighbor на R2, show ipv6 route, ping PC-A → адрес PC-C. Затем «IPv6: проверка» → «Учебная неисправность OSPFv3».',
 dev:[['pc','PC-A',80,200],['rt','R1',260,200],['rt','R2',440,200],['rt','R3',620,200],['pc','PC-C',800,200]],
 link:[['PC-A',0,'R1',0],['R1',1,'R2',0],['R2',1,'R3',0],['R3',1,'PC-C',0]],
 cfg:[['R1','ipv6 unicast-routing','ip6 gi0/0 2001:db8:a::1/64','ip6 gi0/1 2001:db8:12::1/64','ospf3 rid 1.1.1.1','ospf3 on'],
  ['R2','ipv6 unicast-routing','ip6 gi0/0 2001:db8:12::2/64','ip6 gi0/1 2001:db8:23::1/64','ospf3 rid 2.2.2.2','ospf3 on'],
  ['R3','ipv6 unicast-routing','ip6 gi0/0 2001:db8:23::2/64','ip6 gi0/1 2001:db8:c::1/64','ospf3 rid 3.3.3.3','ospf3 on'],
  ['PC-A','slaac'],['PC-C','slaac']]});
function o3Scenario(){const i=TPL.findIndex(t=>/^IPv6: OSPFv3/.test(t.n||''));if(i<0){p('Шаблон OSPFv3 не найден');return}tplLoad(TPL[i]);const r1=byNm('R1'),r2=byNm('R2');delete r1.rid3;r2.ifaces[1].hello=5;ch();
 p('Учебная неисправность OSPFv3: PC-A не пингует PC-C. Найдите причины: show ipv6 ospf neighbor на R1 и R2, окно «IPv6: проверка». Подсказка: у маршрутизаторов нет адресов IPv4.')}
{const _pn=i6Panel;i6Panel=function(){return _pn().replace('<h4 data-nohelp="1">','<div class="row"><button data-o3b="scn" data-nohelp="1">Учебная неисправность OSPFv3</button></div><h4 data-nohelp="1">')}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-o3b]');if(!b)return;o3Scenario();i6Refresh()});
MAN.push(['Т54. OSPFv3: динамическая маршрутизация IPv6',`<p>OSPFv3 — вариант OSPF для IPv6. Команды на маршрутизаторе: <code>ospf3 on</code> (включить на интерфейсах с адресом IPv6), <code>ospf3 rid 1.1.1.1</code>, <code>show ipv6 ospf neighbor</code> и <code>show ipv6 route</code> (маршруты O). Параметры интерфейса общие с OSPFv2: <code>ospf area|hello|auth|mtu|passive &lt;ifc&gt;</code>. Шаблон «IPv6: OSPFv3 между тремя маршрутизаторами»; кнопка «Учебная неисправность OSPFv3» в окне «IPv6: проверка».</p>
<h3>Чем OSPFv3 отличается от OSPFv2</h3><p>Соседи общаются по link-local адресам, общий префикс на канале не обязателен. Router ID остаётся 32-битным: если на маршрутизаторе нет адреса IPv4, его нужно задать вручную, иначе процесс не запустится — самая частая ошибка. Область, Hello/Dead, аутентификация и MTU должны совпадать, как в OSPFv2. Следующий переход в таблице — link-local адрес соседа.</p>
<p><b>Ограничения:</b> стоимость — число переходов, без учёта полосы; нет типов LSA, DR/BDR, нескольких экземпляров на канале, суммирования и редистрибуции; временные таймеры и пакеты не воспроизводятся.</p>`]);
if(typeof EXNET!=='undefined')EXNET.push({n:'IPv6: OSPFv3 не работает',min:25,tag:'IPv6',init:r=>({}),start:c=>{o3Scenario()},
 text:c=>'Три маршрутизатора в линию (R1–R2–R3) обмениваются префиксами IPv6 по OSPFv3, но PC-A не пингует PC-C. Найдите все причины (show ipv6 ospf neighbor, окно «IPv6: проверка») и устраните, не отключая OSPFv3.',
 crit:c=>[['На всех маршрутизаторах задан Router ID',20,()=>['R1','R2','R3'].every(n=>o3Rid(byNm(n)))],['Нет неисправных соседств OSPFv3 (окно проверки пусто)',30,()=>i6Problems().length===0],['У R2 два соседа в состоянии FULL',15,()=>o3Links(byNm('R2')).filter(x=>!x.bad).length===2],['ping PC-A → PC-C',20,()=>exnPing6('PC-A','PC-C')],['ping PC-C → PC-A',15,()=>exnPing6('PC-C','PC-A')]]});
