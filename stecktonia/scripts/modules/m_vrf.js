// ===== m_vrf (v111): VRF-lite — несколько независимых таблиц маршрутизации на одном маршрутизаторе =====
// Модель: d.vrfs=['RED',…]; интерфейс f.vrf='RED'; маршрут r.vrf='RED'. Пустое имя — глобальная таблица.
// Реализация без изменения ядра: перед обработкой пакета маршрутизатор «видит» только интерфейсы и маршруты той таблицы,
// в которую пакет пришёл (VRF входного интерфейса). Динамические протоколы (RIP/OSPF/BGP…) работают в глобальной таблице.
const vfHas=d=>d&&d.t==='rt'&&Array.isArray(d.vrfs)&&d.vrfs.length>0;
const vfName=s=>/^[A-Za-z][A-Za-z0-9_-]{0,15}$/.test(s||'');
function vfShadow(d,cv,fn){if(!d)return fn();const sv={i:d.ifaces,r:d.routes,t:RIPT&&RIPT[d.id]};
 d.ifaces=sv.i.map(f=>(f.vrf||'')===cv?f:Object.assign({},f,{ip:'',mask:''}));d.routes=sv.r.filter(r=>(r.vrf||'')===cv);if(cv&&RIPT)RIPT[d.id]=[];
 try{return fn()}finally{d.ifaces=sv.i;d.routes=sv.r;if(RIPT&&sv.t!==undefined)RIPT[d.id]=sv.t}}
function vfGlobal(fn){const R=(S.devs||[]).filter(vfHas);const go=k=>k>=R.length?fn():vfShadow(R[k],'',()=>go(k+1));return go(0)}
const vfIfVrf=(d,f)=>f&&f.vrf&&(d.vrfs||[]).includes(f.vrf)?f.vrf:'';
// --- доставка: выбор таблицы по входному интерфейсу ---
const VFSTK=[];
{const _d=deliver;deliver=function(d,dst,ttl,tr,first,src){
 const caller=VFSTK[VFSTK.length-1];VFSTK.push(d);
 try{if(!vfHas(d))return _d(d,dst,ttl,tr,first,src);
  let cv='',why='';
  if(first){const f=d.ifaces.find(x=>x.ip===src)||d.ifaces.find(x=>x.ip&&x.mask&&same(src,x.ip,x.mask));cv=vfIfVrf(d,f);why=f?`пакет создан на интерфейсе ${f.n}`:'пакет создан на самом маршрутизаторе'}
  else{const i=d.ifaces.findIndex((f,k)=>f.ip&&caller&&l2all(d,k).some(e=>e.d===caller));if(i>=0){cv=vfIfVrf(d,d.ifaces[i]);why=`пакет пришёл на интерфейс ${d.ifaces[i].n}`}}
  if(!(cv===''&&!d.ifaces.some(f=>vfIfVrf(d,f))))ex([d.id],`${d.name}: ${why} — ${cv?`он принадлежит VRF ${cv}, поэтому маршрут ищу только в таблице VRF ${cv}: интерфейсы и маршруты других таблиц для этого пакета невидимы`:'интерфейс в глобальной таблице — маршрут ищу только в ней, таблицы VRF для этого пакета невидимы'}`);
  return vfShadow(d,cv,()=>_d(d,dst,ttl,tr,first,src))}
 finally{VFSTK.pop()}}}
// RIP/OSPF и прочие расчёты видят только глобальные интерфейсы
{const _c=computeRip;computeRip=function(){return vfGlobal(()=>_c())}}
if(typeof rkProblems==='function'){const _k=rkProblems;rkProblems=function(){return vfGlobal(()=>_k())}}
// --- импорт: чистка данных ---
{const _dc=devClean;devClean=function(d){_dc(d);if('vrfs' in d){d.vrfs=Array.isArray(d.vrfs)?[...new Set(d.vrfs.filter(vfName))].slice(0,16):[];if(!d.vrfs.length)delete d.vrfs}
 const V=d.vrfs||[];d.ifaces.forEach(f=>{if('vrf' in f&&!(typeof f.vrf==='string'&&V.includes(f.vrf)))delete f.vrf});
 d.routes=d.routes.filter(r=>!('vrf' in r)||(typeof r.vrf==='string'&&V.includes(r.vrf)))}}
// --- команды ---
const vfIf=(d,n)=>d.ifaces.find(f=>f.n.toLowerCase()===String(n||'').toLowerCase());
function vfShow(d,io){const V=d.vrfs||[];if(!V.length)return io('VRF не созданы. Создание: vrf add <имя>');
 io('VRF-lite маршрутизатора '+d.name+' (таблица «глобальная» — обычная):');
 ['',...V].forEach(v=>{const I=d.ifaces.filter(f=>(f.vrf||'')===v),R=d.routes.filter(r=>(r.vrf||'')===v);
  io(`\n${v?'VRF '+v:'Глобальная таблица'}`);io('  интерфейсы: '+(I.length?I.map(f=>f.n+(f.ip?` (${f.ip}/${plen(f.mask)})`:'')).join(', '):'—'));
  I.filter(f=>f.ip&&f.mask).forEach(f=>io(`  C  ${n2ip((ip2n(f.ip)&ip2n(f.mask))>>>0)}/${plen(f.mask)}  напрямую, ${f.n}`));
  R.forEach(r=>io(`  S  ${r.net}/${plen(r.mask)}  через ${r.nh}`))})}
function vfCheck(d,io){const V=d.vrfs||[],P=[];
 d.ifaces.forEach(f=>{if(f.vrf&&!V.includes(f.vrf))P.push(`${f.n}: назначен неизвестный VRF ${f.vrf}`)});
 V.forEach(v=>{const I=d.ifaces.filter(f=>f.vrf===v);if(!I.length)P.push(`VRF ${v}: нет ни одного интерфейса — таблица пуста и недостижима`);
  const seen={};I.filter(f=>f.ip&&f.mask).forEach(f=>{const k=n2ip((ip2n(f.ip)&ip2n(f.mask))>>>0)+'/'+plen(f.mask);if(seen[k])P.push(`VRF ${v}: интерфейсы ${seen[k]} и ${f.n} в одной подсети ${k} — внутри одной таблицы подсети не должны пересекаться`);else seen[k]=f.n});
  d.routes.filter(r=>r.vrf===v).forEach(r=>{if(!I.some(f=>f.ip&&f.mask&&same(r.nh,f.ip,f.mask)))P.push(`VRF ${v}: маршрут ${r.net}/${plen(r.mask)} через ${r.nh} — next-hop не лежит ни в одной подсети интерфейсов этого VRF (маршрут не сработает; помните: таблицы изолированы)`)})});
 d.ifaces.filter(f=>!f.vrf&&f.ip).forEach(f=>{const g=d.ifaces.find(x=>x!==f&&x.vrf&&x.ip&&x.mask&&same(f.ip,x.ip,x.mask)&&same(x.ip,f.ip,f.mask));if(g)P.push(`${f.n} (глобальная таблица) и ${g.n} (VRF ${g.vrf}) в одной подсети — вероятно, интерфейс забыли отнести к VRF`)});
 if(!P.length)return io(`VRF ${d.name}: проблем не найдено. Таблицы: ${V.length}; интерфейсов в VRF: ${d.ifaces.filter(f=>f.vrf).length}. Одинаковые адреса в разных VRF — нормально, это и есть смысл VRF.`);
 io(`Найдено проблем VRF: ${P.length}`);P.forEach((x,i)=>io(`${i+1}. ${x}`))}
{const _r=run;run=function(c){const s=String(c||'').trim(),a=s.split(/\s+/),w=a.map(x=>x.toLowerCase()),d=sel&&dv(sel);if(!d||d.t!=='rt')return _r(c);
 if(w[0]==='vrf'){const sub=w[1];
  if(!sub||sub==='show')return vfShow(d,p);
  if(sub==='add'){if(!vfName(a[2]))return p('Использование: vrf add <имя> (латиница/цифры, до 16 символов)');d.vrfs=d.vrfs||[];if(d.vrfs.includes(a[2]))return p('VRF '+a[2]+' уже существует');d.vrfs.push(a[2]);ch();return p(`VRF ${a[2]} создан. Назначьте интерфейсы: vrf assign <интерфейс> ${a[2]}`)}
  if(sub==='del'){if(!(d.vrfs||[]).includes(a[2]))return p('Нет такого VRF');d.vrfs=d.vrfs.filter(x=>x!==a[2]);d.ifaces.forEach(f=>{if(f.vrf===a[2])delete f.vrf});d.routes=d.routes.filter(r=>r.vrf!==a[2]);if(!d.vrfs.length)delete d.vrfs;ch();return p('VRF '+a[2]+' удалён: интерфейсы вернулись в глобальную таблицу, его маршруты удалены')}
  if(sub==='assign'){const f=vfIf(d,a[2]);if(!f)return p('Использование: vrf assign <интерфейс> <VRF>; интерфейсы: '+d.ifaces.map(x=>x.n).join(', '));if(!(d.vrfs||[]).includes(a[3]))return p('Нет VRF «'+(a[3]||'')+'». Сначала: vrf add <имя>');f.vrf=a[3];ch();return p(`${f.n} теперь в VRF ${a[3]}${f.ip?'. Адрес сохранён (в Cisco IOS при смене VRF он стирается — повторите ip, если нужно).':''}`)}
  if(sub==='unassign'){const f=vfIf(d,a[2]);if(!f)return p('Использование: vrf unassign <интерфейс>');delete f.vrf;ch();return p(f.n+' возвращён в глобальную таблицу')}
  if(sub==='route'){const v=a[2],op=w[3];if(!(d.vrfs||[]).includes(v))return p('Использование: vrf route <VRF> add <сеть> <маска|/N> <шлюз> · vrf route <VRF> del <сеть>');
   if(op==='add'){const m=nm(a[5]||'');if(ip2n(a[4]||'')==null||!m||ip2n(a[6]||'')==null)return p('Использование: vrf route '+v+' add <сеть> <маска|/N> <шлюз>');d.routes.push({net:a[4],mask:m,nh:a[6],vrf:v});ch();return p('OK: маршрут добавлен в VRF '+v)}
   if(op==='del'){const n=d.routes.length;d.routes=d.routes.filter(r=>!(r.vrf===v&&r.net===a[4]));ch();return p(n>d.routes.length?'OK':'Маршрут не найден в VRF '+v)}
   return p('Использование: vrf route <VRF> add|del …')}
  if(sub==='ping'||sub==='tracert'){const v=a[2];if(!(d.vrfs||[]).includes(v)||!a[3])return p('Использование: vrf '+sub+' <VRF> <ip>');
   return vfShadow(d,v,()=>_r((sub==='ping'?'ping ':'tracert ')+a[3]))}
  if(sub==='check')return vfCheck(d,p);
  return p('Команды: vrf show · vrf add/del <имя> · vrf assign <интерфейс> <VRF> · vrf unassign <интерфейс> · vrf route <VRF> add|del … · vrf ping|tracert <VRF> <ip> · vrf check')}
 if((w[0]==='ping'||w[0]==='tracert')&&a.length===2&&vfHas(d)){if(!d.ifaces.some(f=>!f.vrf&&f.ip))return p('В глобальной таблице нет интерфейса с адресом. Для проверки внутри VRF: vrf ping <VRF> <ip>');return vfShadow(d,'',()=>_r(c))}
 // route / route del не должны путать глобальную таблицу с VRF
 if(w[0]==='route'&&vfHas(d)){if(w.length===1)return vfShadow(d,'',()=>_r(c));
  if(w[1]==='del'){const n=d.routes.length;d.routes=d.routes.filter(r=>r.vrf||r.net!==a[2]);ch();return p(n>d.routes.length?'OK':'Маршрут не найден в глобальной таблице (для VRF: vrf route <VRF> del <сеть>)')}}
 return _r(c)}}
CMDS.push(['vrf show · vrf add <имя> · vrf del <имя> · vrf assign <интерфейс> <VRF> · vrf unassign <интерфейс> · vrf route <VRF> add <сеть> <маска|/N> <шлюз> · vrf route <VRF> del <сеть> · vrf ping <VRF> <ip> · vrf check','VRF-lite: независимые таблицы маршрутизации на одном маршрутизаторе (одинаковые адреса у разных клиентов)','Разделяйте клиентов или службы на одном устройстве: у каждого VRF свои интерфейсы и маршруты, пакеты между таблицами не ходят. vrf check — аудит.','vrf add RED · vrf assign gi0/0 RED · vrf ping RED 172.16.0.10','Сеть']);
// --- шаблон, экзамен, справка ---
const vfScn=(cfg)=>({dev:[['pc','PC-RED',20,100],['pc','PC-BLUE',20,300],['rt','R1',240,200],['pc','SRV-RED',460,100],['pc','SRV-BLUE',460,300]],link:[['PC-RED',0,'R1',0],['PC-BLUE',0,'R1',1],['R1',2,'SRV-RED',0],['R1',3,'SRV-BLUE',0]],
 cfg:[['PC-RED','ip eth0 192.168.1.10 /24','gateway 192.168.1.1'],['PC-BLUE','ip eth0 192.168.1.10 /24','gateway 192.168.1.1'],['SRV-RED','ip eth0 172.16.0.10 /24','gateway 172.16.0.1'],['SRV-BLUE','ip eth0 172.16.1.10 /24','gateway 172.16.1.1'],
  cfg?['R1','vrf add RED','vrf add BLUE','ip gi0/0 192.168.1.1 /24','ip gi0/1 192.168.1.1 /24','ip gi0/2 172.16.0.1 /24','ip gi0/3 172.16.1.1 /24','vrf assign gi0/0 RED','vrf assign gi0/2 RED','vrf assign gi0/1 BLUE','vrf assign gi0/3 BLUE']:['R1']]});
TPL.push(Object.assign({n:'VRF-lite: два клиента с одинаковыми адресами на одном маршрутизаторе',d:'Клиенты RED и BLUE используют одну и ту же сеть 192.168.1.0/24 и даже одинаковые адреса ПК. Маршрутизатор R1 разводит их по VRF: каждый клиент видит только свой сервер. Проверьте vrf show, vrf check и vrf ping RED 172.16.0.10; затем попробуйте достучаться из RED до сервера BLUE (172.16.1.10).',hint:'vrf show; vrf check; vrf ping RED 172.16.0.10; режим симуляции покажет, в какой таблице ищется маршрут'},vfScn(true)));
if(typeof EXNET!=='undefined')EXNET.push({n:'VRF-lite: изолировать двух клиентов на одном маршрутизаторе',min:15,tag:'Маршрутизация',init:r=>({}),start:c=>{tplLoad(Object.assign({n:'VRF',hint:''},vfScn(false)))},
 text:c=>'Два клиента (PC-RED и PC-BLUE) подключены к одному маршрутизатору R1 и используют одинаковую сеть 192.168.1.0/24 с одним и тем же шлюзом 192.168.1.1. Адреса интерфейсов R1 не заданы. Создайте VRF RED и BLUE, назначьте интерфейсы (gi0/0 и gi0/2 — RED; gi0/1 и gi0/3 — BLUE), настройте адреса (gi0/0 и gi0/1 — 192.168.1.1/24; gi0/2 — 172.16.0.1/24; gi0/3 — 172.16.1.1/24). PC-RED должен видеть только SRV-RED (172.16.0.10), PC-BLUE — только SRV-BLUE (172.16.1.10).',
 crit:c=>{const R=byNm('R1'),A=byNm('PC-RED'),B=byNm('PC-BLUE'),g=(n)=>R&&R.ifaces.find(f=>f.n===n),pg=(x,ip)=>{computeRip();EX=[];return!!trip(x,ip).ok};
  return[['VRF RED и BLUE созданы',10,()=>!!R&&(R.vrfs||[]).includes('RED')&&(R.vrfs||[]).includes('BLUE')],
   ['gi0/0 и gi0/2 — в VRF RED',15,()=>!!g('gi0/0')&&!!g('gi0/2')&&g('gi0/0').vrf==='RED'&&g('gi0/2').vrf==='RED'],
   ['gi0/1 и gi0/3 — в VRF BLUE',15,()=>!!g('gi0/1')&&!!g('gi0/3')&&g('gi0/1').vrf==='BLUE'&&g('gi0/3').vrf==='BLUE'],
   ['PC-RED → SRV-RED',20,()=>pg(A,'172.16.0.10')],['PC-BLUE → SRV-BLUE',20,()=>pg(B,'172.16.1.10')],
   ['Изоляция: PC-RED не видит SRV-BLUE, PC-BLUE не видит SRV-RED',20,()=>pg(A,'172.16.0.10')&&pg(B,'172.16.1.10')&&!pg(A,'172.16.1.10')&&!pg(B,'172.16.0.10')]]}});
MAN.push(['Т78. VRF-lite: несколько таблиц маршрутизации на одном маршрутизаторе',`<p><b>Проблема.</b> Один маршрутизатор обслуживает нескольких клиентов или службы, а их адресные планы пересекаются (у всех «своя» сеть 192.168.1.0/24). В одной таблице маршрутизации это невозможно: две одинаковые подсети конфликтуют.</p>
<p><b>VRF</b> (Virtual Routing and Forwarding) – независимая виртуальная таблица маршрутизации. Интерфейс принадлежит ровно одной таблице; пакет, пришедший на интерфейс, ищет маршрут только в таблице этого интерфейса. Одинаковые адреса в разных VRF не конфликтуют, а трафик между VRF не ходит, пока вы сами не организуете «утечку» маршрутов. <i>VRF-lite</i> – упрощённый вариант без MPLS: таблицы живут на одном устройстве и разводятся по интерфейсам.</p>
<p><b>Команды Стектонии.</b> <code>vrf add RED</code>, <code>vrf assign gi0/0 RED</code>, <code>vrf route RED add 10.1.0.0 /24 172.16.0.2</code>, <code>vrf show</code>, <code>vrf ping RED 172.16.0.10</code>, <code>vrf check</code> (аудит), <code>vrf del RED</code>.</p>
<p><b>Типовые ошибки.</b> Интерфейс забыли назначить в VRF (остался в глобальной таблице); next-hop VRF-маршрута лежит в подсети интерфейса другого VRF; пинг с маршрутизатора без указания VRF (<code>ping</code> ищет в глобальной таблице, нужен <code>vrf ping</code>); ожидание связи между VRF.</p>
<p><b>Ограничения модели.</b> Динамические протоколы (RIP, OSPF, BGP, EIGRP) работают только в глобальной таблице; утечка маршрутов между VRF, RD/RT и MPLS не моделируются; консоли Cisco/Huawei/Eltex команд VRF не содержат – используйте синтаксис Стектонии. Режим симуляции и объяснения пути показывают, в какой таблице искался маршрут.</p>`]);
