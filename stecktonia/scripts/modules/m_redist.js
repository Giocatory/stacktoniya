// ===== m_redist (v92): редистрибуция маршрутов между протоколами (static/connected/ospf/rip/eigrp → ospf/rip/eigrp), default-information originate =====
const RD_P=['ospf','rip','eigrp'],RD_F=['connected','static','ospf','rip','eigrp','default'];
const rdFlag=(x,p)=>p==='ospf'?!!x.o:p==='eigrp'?!!x.e:p==='rip'?!(x.o||x.e||x.b):false;
const rdDomain=(d,p)=>p==='ospf'?!!d.ospf:p==='eigrp'?!!d.eigrp:p==='rip'?!!d.rip:false;
const rdNet=f=>n2ip((ip2n(f.ip)&ip2n(f.mask))>>>0);
const rdMask=n=>n<=0?'0.0.0.0':n2ip(((0xFFFFFFFF<<(32-n))>>>0));
function plMatch(a,name,net,mask){const L=(a.pl&&a.pl[name])||[],len=plen(mask);
 for(const e of L){const ge=e.ge||(e.le?e.len:e.len),le=e.le||(e.ge?32:e.len);if(len>=e.len&&len>=ge&&len<=le&&same(net,e.net,rdMask(e.len)))return e.act==='permit'}return false}
function rdFilter(a,r,net,mask){if(r.pl)return plMatch(a,r.pl,net,mask)?{mt:0}:null;
 if(r.rm){const R=((a.rmap&&a.rmap[r.rm])||[]).slice().sort((x,y)=>x.seq-y.seq);for(const c of R){if(c.match&&!plMatch(a,c.match,net,mask))continue;return c.act==='permit'?{mt:c.metric||0}:null}return null}
 return{mt:0}}
function rdSource(a,r,snap){const o=[],add=(net,mask)=>{if(r.only){const m=/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/.exec(r.only);if(m&&!(plen(mask)>=+m[2]&&same(net,m[1],n2ip(((0xFFFFFFFF<<(32-(+m[2])))>>>0)))))return}const fl=rdFilter(a,r,net,mask);if(!fl)return;if(!o.some(x=>x.net===net&&x.mask===mask))o.push({net,mask,mt:fl.mt})};
 if(r.from==='connected')a.ifaces.forEach(f=>{if(f.ip&&f.mask&&!f.off)add(rdNet(f),f.mask)});
 else if(r.from==='static'||r.from==='default')(a.routes||[]).forEach(x=>{if(x.track&&typeof trackUp==='function'&&!trackUp(a,x.track))return;if(r.from==='default'&&x.mask!=='0.0.0.0')return;add(x.net,x.mask)});
 else(snap[a.id]||[]).forEach(x=>{if(!x.x&&rdFlag(x,r.from))add(x.net,x.mask)});
 return o}
function rdPath(b,a,p,snap){let best=null;a.ifaces.forEach(g=>{if(!g.ip||!g.mask||g.off)return;let c=null;
 const dir=b.ifaces.find(f=>f.ip&&f.mask&&!f.off&&same(f.ip,g.ip,f.mask)&&f.mask===g.mask);
 if(dir)c={nh:g.ip,m:0};else{const e=(snap[b.id]||[]).find(x=>!x.x&&rdFlag(x,p)&&same(g.ip,x.net,x.mask));if(e)c={nh:e.nh,m:e.m}}
 if(c&&(!best||c.m<best.m))best=c});return best}
function rdApply(){const rs=S.devs.filter(d=>d.t==='rt'&&d.redist&&d.redist.length);if(!rs.length)return;const snap={};S.devs.forEach(d=>{if(RIPT[d.id])snap[d.id]=RIPT[d.id].slice()});
 rs.forEach(a=>a.redist.forEach(r=>{if(!rdDomain(a,r.to))return;const pre=rdSource(a,r,snap);if(!pre.length)return;
  S.devs.forEach(b=>{if(b===a||b.t!=='rt'||!rdDomain(b,r.to))return;const path=rdPath(b,a,r.to,snap);if(!path)return;const L=RIPT[b.id]=RIPT[b.id]||[];
   pre.forEach(n=>{if(b.ifaces.some(f=>f.ip&&f.mask&&f.mask===n.mask&&rdNet(f)===n.net))return;
    const ex=L.find(x=>x.net===n.net&&x.mask===n.mask&&rdFlag(x,r.to));if(ex&&!ex.x)return;
    const mm=n.mt||r.metric,m=r.to==='ospf'?(mm||20):path.m+(mm||1);if(ex){if(ex.m<=m)return;L.splice(L.indexOf(ex),1)}
    const e={net:n.net,mask:n.mask,nh:path.nh,m,x:1};if(r.to==='ospf')e.o=1;if(r.to==='eigrp')e.e=1;L.push(e)})})}))}
{const _c=computeRip;computeRip=function(){_c();rdApply()}}
function rdShow(d,io){const L=d.redist||[];if(!L.length)return io('Редистрибуция не настроена. Пример: redistribute static ospf  |  redistribute ospf rip metric 2  |  redistribute default ospf');
 L.forEach(r=>io(`redistribute ${r.from} → ${r.to}${r.metric?' метрика '+r.metric:''}${r.only?' только '+r.only:''}${r.pl?' prefix-list '+r.pl:''}${r.rm?' route-map '+r.rm:''}${rdDomain(d,r.to)?'':'   ⚠ на устройстве не включён '+r.to+' — правило не действует'}`))}
function rdSet(d,from,to,a,io,opts){if(!RD_F.includes(from)||!RD_P.includes(to))return io('Использование: redistribute <connected|static|ospf|rip|eigrp|default> <ospf|rip|eigrp> [metric N] [only сеть/длина] [prefix-list ИМЯ] [route-map ИМЯ]');
 if(from===to)return io('Источник и приёмник совпадают');let metric=0,only='',pl='',rm='';
 for(let i=0;i<opts.length;i++){const k=opts[i].toLowerCase();if(k==='metric'){metric=+opts[++i];if(!(Number.isInteger(metric)&&metric>=1&&metric<=16777214))return io('metric: целое от 1 до 16777214')}else if(k==='only'){only=opts[++i]||'';if(!/^\d+\.\d+\.\d+\.\d+\/\d+$/.test(only))return io('only: сеть/длина, например 10.9.0.0/16')}else if(k==='prefix-list'){pl=opts[++i]||'';if(!pl)return io('prefix-list: укажите имя')}else if(k==='route-map'){rm=opts[++i]||'';if(!rm)return io('route-map: укажите имя')}else if(k==='subnets');else return io('Неизвестный параметр: '+opts[i])}
 d.redist=(d.redist||[]).filter(r=>!(r.from===from&&r.to===to));d.redist.push({from,to,...(metric?{metric}:{}),...(only?{only}:{}),...(pl?{pl}:{}),...(rm?{rm}:{})});ch();
 io(`redistribute ${from} → ${to}`+(rdDomain(d,to)?'':`\n  ⚠ на ${d.name} не включён ${to} (${to==='ospf'?'ospf on':to==='rip'?'rip on':'eigrp on <AS>'}): правило начнёт действовать после включения`)+(from==='connected'||from==='static'?'':'')) }
function rdDel(d,from,to,io){const n=(d.redist||[]).length;d.redist=(d.redist||[]).filter(r=>!(r.from===from&&r.to===to));if(!d.redist.length)delete d.redist;ch();io(n!==(d.redist||[]).length?`redistribute ${from} → ${to} удалена`:'Такого правила нет')}
{const _r=run;run=function(c){const s=String(c).trim(),a=s.split(/\s+/),w=a.map(x=>x.toLowerCase()),d=sel&&dv(sel);
 if(d&&d.t==='rt'){const st=d.vm||{};
  if(d.vend==='cisco'&&st.m==='router'&&st.p){
   if(w[0]==='redistribute'&&a[1])return rdSet(d,w[1],st.p,a,p,a.slice(2).filter(x=>!/^(subnets|include-connected)$/i.test(x)));
   if(w[0]==='default-information'&&w[1]==='originate')return rdSet(d,'default',st.p,a,p,[]);
   if(w[0]==='no'&&w[1]==='redistribute'&&a[2])return rdDel(d,w[2],st.p,p);
   if(w[0]==='no'&&w[1]==='default-information')return rdDel(d,'default',st.p,p)}
  if(w[0]==='redistribute'&&(a[1]&&a[2]))return rdSet(d,w[1],w[2],a,p,a.slice(3));
  if(w[0]==='redistribute'&&!a[1])return rdShow(d,p);
  if(w[0]==='no'&&w[1]==='redistribute'&&a[3])return rdDel(d,w[2],w[3],p);
  if(w[0]==='show'&&/^(redistribute|redistribution)$/.test(w[1]||''))return rdShow(d,p)}
 return _r(c)}}
CMDS.push(['redistribute','redistribute <connected|static|ospf|rip|eigrp|default> <ospf|rip|eigrp> [metric N] [only сеть/длина] · no redistribute … · show redistribute; Cisco (router ospf|rip): redistribute <источник> [metric N], default-information originate','Редистрибуция маршрутов между протоколами','Граничный маршрутизатор (ASBR) передаёт в один протокол маршруты, полученные из другого источника: static, connected, ospf, rip, eigrp. В таблицах такие маршруты помечаются как внешние: O E2 (OSPF, метрика задаётся при редистрибуции, по умолчанию 20), D EX (EIGRP, AD 170).']);
const rdBase=(pre)=>({dev:[['pc','PC-A',40,200],['rt','R1',200,200],['rt','R2',380,200],['rt','R3',560,200],['pc','PC-B',720,200]],link:[['PC-A',0,'R1',0],['R1',1,'R2',0],['R2',1,'R3',0],['R3',1,'PC-B',0]],
 cfg:[['PC-A','ip eth0 192.168.1.10 /24','gateway 192.168.1.1'],['PC-B','ip eth0 192.168.2.10 /24','gateway 192.168.2.1'],
 ['R1','ip gi0/0 192.168.1.1 /24','ip gi0/1 10.0.12.1 /30','ospf on'],['R2','ip gi0/0 10.0.12.2 /30','ip gi0/1 10.0.23.1 /30','ospf on','rip on',...(pre?['redistribute rip ospf','redistribute ospf rip']:[])],
 ['R3','ip gi0/0 10.0.23.2 /30','ip gi0/1 192.168.2.1 /24','rip on']]});
TPL.push(Object.assign({n:'Редистрибуция: OSPF и RIP через граничный маршрутизатор',d:'R1 работает по OSPF, R3 — по RIP, R2 участвует в обоих протоколах (ASBR). Без редистрибуции стороны не знают сетей друг друга; на R2 настроена взаимная редистрибуция.',hint:'Проверьте route на R1 (O E2 к 192.168.2.0/24) и на R3 (R к 192.168.1.0/24). Затем на R2 выполните no redistribute rip ospf и посмотрите, как изменятся таблицы и ping. Сравните метрики O E2 (по умолчанию 20) и RIP.'},rdBase(true)));
if(typeof EXNET!=='undefined')EXNET.push({n:'Редистрибуция: объединить OSPF и RIP',min:20,tag:'Маршрутизация',init:r=>({}),start:c=>{tplLoad(Object.assign({n:'RD',hint:''},rdBase(false)));p('R1 работает по OSPF, R3 по RIP, R2 — в обоих. Связи между PC-A и PC-B нет. Настройте редистрибуцию на R2.')},
 text:c=>'Левая часть сети (R1) использует OSPF, правая (R3) — RIP, граничный маршрутизатор R2 участвует в обоих протоколах. PC-A и PC-B не видят друг друга. Настройте на R2 взаимную редистрибуцию (redistribute ospf rip и redistribute rip ospf) так, чтобы связь работала в обе стороны. Протоколы на R1 и R3 менять нельзя.',
 crit:c=>{const R1=byNm('R1'),R2=byNm('R2'),R3=byNm('R3'),A=byNm('PC-A'),B=byNm('PC-B');const has=(f,t)=>(R2.redist||[]).some(r=>r.from===f&&r.to===t);
  return[['На R2 настроена редистрибуция rip → ospf',20,()=>has('rip','ospf')],['На R2 настроена редистрибуция ospf → rip',20,()=>has('ospf','rip')],
  ['PC-A → PC-B',25,()=>{EX=[];return!!trip(A,'192.168.2.10').ok}],['PC-B → PC-A',25,()=>{EX=[];return!!trip(B,'192.168.1.10').ok}],
  ['Протоколы на R1 (только OSPF) и R3 (только RIP) не изменены',10,()=>R1.ospf&&!R1.rip&&R3.rip&&!R3.ospf]]}});
MAN.push(['Т61. Редистрибуция маршрутов между протоколами',`<p><b>Проблема.</b> Протоколы динамической маршрутизации не обмениваются маршрутами друг с другом: если часть сети работает по OSPF, а часть по RIP или EIGRP, их маршрутизаторы не знают сетей друг друга. Узел, участвующий в обоих протоколах, называется <b>ASBR</b> (граничный маршрутизатор автономной системы); он может <i>редистрибутировать</i> (передавать) маршруты из одного источника в другой.</p>
<p><b>Источники:</b> connected (подключённые сети), static (статические), ospf, rip, eigrp, а также маршрут по умолчанию (default-information originate). <b>Приёмники:</b> ospf, rip, eigrp. Маршруты, полученные таким образом, считаются внешними: в OSPF — <b>O E2</b> (метрика назначается при редистрибуции, по умолчанию 20, внутренняя стоимость не прибавляется), в EIGRP — <b>D EX</b> с административной дистанцией 170, в RIP метрика — число переходов.</p>
<p><b>Команды Стектонии.</b> <code>redistribute &lt;источник&gt; &lt;приёмник&gt; [metric N] [only сеть/длина]</code>, <code>no redistribute … </code>, <code>show redistribute</code>; Cisco, в режиме <code>router ospf</code> / <code>router rip</code>: <code>redistribute &lt;источник&gt; [metric N] [subnets]</code>, <code>default-information originate</code>. Протокол-приёмник должен быть включён на ASBR (<code>ospf on</code>, <code>rip on</code>, <code>eigrp on &lt;AS&gt;</code>).</p>
<p><b>Типовые ошибки.</b> Настроена редистрибуция только в одну сторону (прямой путь есть, обратного нет); не включён протокол-приёмник на ASBR; взаимная редистрибуция в двух точках без фильтров даёт петли (в Стектонии взаимная редистрибуция в одной точке безопасна: маршруты берутся только из внутренних записей); забыли метрику для RIP/EIGRP.</p>
<p><b>Ограничения модели.</b> Нет route-map, prefix-list, тегов и типов E1/E2 (только E2); фильтр only задаёт один префикс; стоимости и метрики упрощены.</p>`]);

// ===== v93: prefix-list и route-map для фильтрации редистрибуции =====
function rdPlAdd(d,name,act,pfx,opts,io,seq){const m=/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/.exec(pfx||'');if(!m||ip2n(m[1])==null||+m[2]>32)return io('Использование: prefix-list ИМЯ permit|deny a.b.c.d/длина [ge N] [le N]');
 const len=+m[2];let ge=0,le=0;for(let i=0;i<opts.length;i++){const k=(opts[i]||'').toLowerCase(),v=+opts[i+1];if(k==='ge'||k==='le'){if(!Number.isInteger(v)||v<len||v>32)return io(k+': целое от '+len+' до 32');if(k==='ge')ge=v;else le=v;i++}else return io('Неизвестный параметр: '+opts[i])}
 if(ge&&le&&ge>le)return io('ge не может быть больше le');
 const net=n2ip((ip2n(m[1])&((0xFFFFFFFF<<(32-len))>>>0))>>>0),L=((d.pl=d.pl||{})[name]=d.pl[name]||[]);
 if(L.some(e=>e.act===act&&e.net===net&&e.len===len&&(e.ge||0)===ge&&(e.le||0)===le))return io('Такая запись уже есть');
 if(L.length>=50)return io('В списке не более 50 записей');L.push({act,net,len,...(ge?{ge}:{}),...(le?{le}:{})});ch();io(`prefix-list ${name}: ${act} ${net}/${len}${ge?' ge '+ge:''}${le?' le '+le:''}`)}
function rdPlShow(d,io){const K=Object.keys(d.pl||{});if(!K.length)return io('prefix-list не настроены. Пример: prefix-list BR permit 172.16.0.0/16 le 24');
 K.forEach(k=>{io('prefix-list '+k+':');d.pl[k].forEach((e,i)=>io(`  seq ${(i+1)*5} ${e.act} ${e.net}/${e.len}${e.ge?' ge '+e.ge:''}${e.le?' le '+e.le:''}`));io('  (в конце неявный deny any)')})}
function rdRmAdd(d,name,act,a,io){let seq=null,i=0;if(/^\d+$/.test(a[0]||'')){seq=+a[0];i=1}
 const R=((d.rmap=d.rmap||{})[name]=d.rmap[name]||[]);let match=null,metric=0;
 for(;i<a.length;i++){const k=(a[i]||'').toLowerCase();if(k==='match'){let j=i+1;if(/^ip$/i.test(a[j]||''))j++;if(/^address$/i.test(a[j]||''))j++;if(/^prefix-list$/i.test(a[j]||''))j++;match=a[j];i=j;if(!match)return io('match: укажите имя prefix-list')}
  else if(k==='set'&&/^metric$/i.test(a[i+1]||'')){metric=+a[i+2];if(!Number.isInteger(metric)||metric<1||metric>16777214)return io('set metric: целое от 1 до 16777214');i+=2}else return io('Использование: route-map ИМЯ permit|deny [seq] [match ИМЯ_PL] [set metric N]')}
 if(seq==null)seq=R.length?Math.max(...R.map(x=>x.seq))+10:10;
 if(seq<1||seq>65535)return io('seq: 1–65535');
 let e=R.find(x=>x.seq===seq);if(!e){e={seq,act};R.push(e)}e.act=act;if(match!==null)e.match=match;if(metric)e.metric=metric;ch();return {name,seq}}
function rdRmShow(d,io){const K=Object.keys(d.rmap||{});if(!K.length)return io('route-map не настроены. Пример: route-map FILT permit match BR set metric 100');
 K.forEach(k=>{d.rmap[k].slice().sort((x,y)=>x.seq-y.seq).forEach(e=>{io(`route-map ${k} ${e.act} ${e.seq}`);io('  match prefix-list '+(e.match||'(любой маршрут)'));if(e.metric)io('  set metric '+e.metric);if(e.match&&!(d.pl&&d.pl[e.match]))io('  ⚠ prefix-list '+e.match+' не создан — условие не выполняется')})});io('(в конце неявный deny)')}
{const _r=run;run=function(c){const s=String(c).trim(),a=s.split(/\s+/),w=a.map(x=>x.toLowerCase()),d=sel&&dv(sel);
 if(d&&d.t==='rt'){const st=d.vm||{},cis=d.vend==='cisco';
  if(cis&&st.m==='rmap'){const R=((d.rmap||{})[st.n]||[]).find(x=>x.seq===st.s);
   if(w[0]==='match'&&w[1]==='ip'&&w[2]==='address'&&w[3]==='prefix-list'&&a[4]){if(R){R.match=a[4];ch()}return}
   if(w[0]==='set'&&w[1]==='metric'){const v=+a[2];if(!Number.isInteger(v)||v<1||v>16777214)return p('% metric: целое от 1 до 16777214');if(R){R.metric=v;ch()}return}
   if(w[0]==='exit'){d.vm={m:'conf'};vcPs&&vcPs(d);return}if(w[0]==='end'){d.vm={m:'priv'};vcPs&&vcPs(d);return}
   return p('% Допустимо в режиме route-map: match ip address prefix-list ИМЯ, set metric N, exit')}
  if(cis&&st.m==='conf'){
   if(w[0]==='ip'&&w[1]==='prefix-list'&&a[2]){let i=3,seq=null;if(w[i]==='seq'){i+=2}const act=w[i];if(act!=='permit'&&act!=='deny')return p('% ip prefix-list ИМЯ [seq N] permit|deny сеть/длина [ge N] [le N]');return rdPlAdd(d,a[2],act,a[i+1],a.slice(i+2),p)}
   if(w[0]==='no'&&w[1]==='ip'&&w[2]==='prefix-list'&&a[3]){if(d.pl)delete d.pl[a[3]];ch();return}
   if(w[0]==='route-map'&&a[1]&&(w[2]==='permit'||w[2]==='deny')){const r=rdRmAdd(d,a[1],w[2],a.slice(3).filter(x=>/^\d+$/.test(x)).slice(0,1),p);if(r){d.vm={m:'rmap',n:r.name,s:r.seq};vcPs&&vcPs(d)}return}
   if(w[0]==='no'&&w[1]==='route-map'&&a[2]){if(d.rmap)delete d.rmap[a[2]];ch();return}}
  if(!cis||st.m==='user'||st.m==='priv'){
   if(w[0]==='prefix-list'&&a[1]&&(w[2]==='permit'||w[2]==='deny'))return rdPlAdd(d,a[1],w[2],a[3],a.slice(4),p);
   if(w[0]==='no'&&w[1]==='prefix-list'&&a[2]){const had=d.pl&&d.pl[a[2]];if(d.pl)delete d.pl[a[2]];ch();return p(had?'prefix-list '+a[2]+' удалён':'Такого списка нет')}
   if(w[0]==='route-map'&&a[1]&&(w[2]==='permit'||w[2]==='deny')){const r=rdRmAdd(d,a[1],w[2],a.slice(3),p);if(r)p(`route-map ${r.name}: правило ${r.seq} сохранено`);return}
   if(w[0]==='no'&&w[1]==='route-map'&&a[2]){const had=d.rmap&&d.rmap[a[2]];if(d.rmap)delete d.rmap[a[2]];ch();return p(had?'route-map '+a[2]+' удалён':'Такой карты нет')}}
  if(/^(show|sh)$/.test(w[0])){const x=w.slice(1).join(' ');
   if(/^(ip )?prefix-list/.test(x))return rdPlShow(d,p);if(/^route-map/.test(x))return rdRmShow(d,p)}}
 return _r(c)}}
CMDS.push(['prefix-list','prefix-list ИМЯ permit|deny сеть/длина [ge N] [le N] · no prefix-list ИМЯ · show prefix-list; Cisco: ip prefix-list ИМЯ permit|deny сеть/длина [ge][le]','Список префиксов (фильтр сетей)','Перечень сетей, которые разрешено (permit) или запрещено (deny) пропускать. Без ge/le совпадает только точная длина префикса; 172.16.0.0/16 le 24 — любые сети внутри 172.16.0.0/16 длиной от /16 до /24. Записи проверяются сверху вниз, в конце неявный deny. Применяется в redistribute … prefix-list ИМЯ или внутри route-map.']);
CMDS.push(['route-map','route-map ИМЯ permit|deny [seq] [match ИМЯ_PL] [set metric N] · no route-map ИМЯ · show route-map · redistribute … route-map ИМЯ; Cisco: route-map ИМЯ permit 10 → match ip address prefix-list … / set metric …','Карта маршрутов (фильтр и изменение метрики)','Последовательность правил: первое подошедшее решает судьбу маршрута (permit — пропустить и применить set, deny — отбросить). Правило без match подходит ко всем маршрутам. Если ничего не подошло, маршрут отбрасывается. Используется для фильтрации редистрибуции.']);
const rdFB=(pre)=>({dev:[['pc','PC-A',40,200],['rt','R1',200,200],['rt','R2',380,200],['pc','PC-B',560,200]],link:[['PC-A',0,'R1',0],['R1',1,'R2',0],['R2',1,'PC-B',0]],
 cfg:[['PC-A','ip eth0 192.168.1.10 /24','gateway 192.168.1.1'],['PC-B','ip eth0 192.168.2.10 /24','gateway 192.168.2.1'],
 ['R1','ip gi0/0 192.168.1.1 /24','ip gi0/1 10.0.12.1 /30','ospf on'],
 ['R2','ip gi0/0 10.0.12.2 /30','ip gi0/1 192.168.2.1 /24','ospf on','route add 172.16.10.0 /24 192.168.2.10','route add 172.16.20.0 /24 192.168.2.10','route add 10.99.0.0 /16 192.168.2.10',...(pre?['prefix-list BR permit 172.16.0.0/16 le 24','route-map FILT permit 10 match BR set metric 100','redistribute static ospf route-map FILT']:[])]]});
TPL.push(Object.assign({n:'Фильтрация редистрибуции: prefix-list и route-map',d:'R2 редистрибутирует в OSPF статические сети, но route-map FILT пропускает только сети из 172.16.0.0/16 (длина до /24) и назначает им метрику 100. Служебная сеть 10.99.0.0/16 отбрасывается (сеть 192.168.2.0/24 R1 узнаёт и так, как внутреннюю: на R2 включён ospf).',hint:'На R1 выполните route: должны быть O E2 для 172.16.10.0/24 и 172.16.20.0/24, но не для 10.99.0.0/16. Выполните show route-map и show prefix-list на R2. Добавьте в prefix-list BR запись permit 10.99.0.0/16 и снова проверьте route на R1.'},rdFB(true)));
if(typeof EXNET!=='undefined')EXNET.push({n:'Фильтрация: пропустить только сети филиалов',min:25,tag:'Маршрутизация',init:r=>({}),start:c=>{tplLoad(Object.assign({n:'RF',hint:''},rdFB(false)));p('R2 знает статические сети 172.16.10.0/24, 172.16.20.0/24 (филиалы) и 10.99.0.0/16 (служебная). Настройте редистрибуцию static → ospf так, чтобы R1 узнал сети филиалов, но не 10.99.0.0/16.')},
 text:c=>'Граничный маршрутизатор R2 должен передавать в OSPF статические сети филиалов 172.16.10.0/24 и 172.16.20.0/24, но не служебную сеть 10.99.0.0/16. Создайте prefix-list и/или route-map на R2 и примените их в redistribute static ospf. На R1 настройки менять нельзя. Связь PC-A — PC-B должна работать.',
 crit:c=>{const R1=byNm('R1'),R2=byNm('R2'),A=byNm('PC-A');const has=(n,m)=>{computeRip();return(RIPT[R1.id]||[]).some(r=>r.net===n&&r.mask===m)};
  return[['R1 узнал сети филиалов 172.16.10.0/24 и 172.16.20.0/24',45,()=>has('172.16.10.0','255.255.255.0')&&has('172.16.20.0','255.255.255.0')],
  ['R1 не получил служебную сеть 10.99.0.0/16 (при этом сети филиалов переданы)',25,()=>has('172.16.10.0','255.255.255.0')&&!has('10.99.0.0','255.255.0.0')],
  ['PC-A → PC-B',20,()=>{computeRip();EX=[];return has('172.16.10.0','255.255.255.0')&&!!trip(A,'192.168.2.10').ok}],
  ['Фильтр задан через prefix-list или route-map',10,()=>(R2.redist||[]).some(r=>r.pl||r.rm)]]}});
MAN.push(['Т62. Фильтрация редистрибуции: prefix-list и route-map',`<p><b>Зачем фильтровать.</b> Редистрибуция без ограничений передаёт соседнему протоколу всё подряд, включая служебные и внутренние сети, и при двух граничных узлах создаёт петли. Поэтому в реальных сетях её почти всегда сопровождают фильтром.</p>
<p><b>prefix-list</b> — упорядоченный список правил «разрешить/запретить сеть». Без ge/le правило совпадает только с точной длиной префикса; <code>172.16.0.0/16 le 24</code> совпадает с любыми сетями внутри /16 длиной от /16 до /24; <code>ge 24 le 28</code> задаёт диапазон длин. Первое совпавшее правило решает, в конце неявный deny.</p>
<p><b>route-map</b> — последовательность правил с номерами (seq). В правиле: условие <code>match</code> (здесь — prefix-list), решение permit/deny и действие <code>set metric N</code>. Правило без match подходит всем маршрутам. Если ни одно правило не подошло, маршрут отбрасывается.</p>
<p><b>Команды Стектонии.</b> <code>prefix-list ИМЯ permit 172.16.0.0/16 le 24</code>, <code>route-map FILT permit 10 match ИМЯ set metric 100</code>, <code>redistribute static ospf route-map FILT</code> (или <code>prefix-list ИМЯ</code>), <code>show prefix-list</code>, <code>show route-map</code>, <code>no prefix-list</code>, <code>no route-map</code>. Cisco: <code>ip prefix-list ИМЯ permit …</code>, <code>route-map ИМЯ permit 10</code> → <code>match ip address prefix-list ИМЯ</code>, <code>set metric N</code>; в режиме <code>router ospf</code> — <code>redistribute static route-map ИМЯ</code>.</p>
<p><b>Типовые ошибки.</b> Забыли ge/le (проходит только точная длина); prefix-list не создан (route-map отбрасывает всё); при deny-правиле нет завершающего permit; правило применено не к тому источнику (connected и static фильтруются отдельно).</p>
<p><b>Ограничения модели.</b> Условия match только по prefix-list; нет set tag, set metric-type, match по тегам и интерфейсам; нет фильтров distribute-list.</p>`]);
