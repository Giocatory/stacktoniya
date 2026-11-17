// ===== m_pbr (v95): политика маршрутизации (PBR) — выбор следующего узла по адресу источника, до таблицы маршрутов =====
const pbNet=x=>{if(x==='any')return{n:'0.0.0.0',m:'0.0.0.0'};const m=/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/.exec(x||'');if(!m||ip2n(m[1])==null||+m[2]>32)return null;return{n:n2ip((ip2n(m[1])&((0xFFFFFFFF<<(32-+m[2]))>>>0))>>>0),m:rdMask(+m[2]),len:+m[2]}};
const pbText=r=>`источник ${r.sn==='0.0.0.0'&&r.sm==='0.0.0.0'?'любой':r.sn+'/'+plen(r.sm)}${r.dn?' → назначение '+(r.dn==='0.0.0.0'&&r.dm==='0.0.0.0'?'любое':r.dn+'/'+plen(r.dm)):''} → через ${r.nh}`;
function pbUp(d,nh){return d.ifaces.some((f,i)=>f.ip&&f.mask&&!f.off&&same(nh,f.ip,f.mask)&&peer(d,i))}
function pbFind(d,src,dst){return(d.pbr||[]).find(r=>same(src,r.sn,r.sm)&&(!r.dn||same(dst,r.dn,r.dm)))}
{const _d=deliver;deliver=function(d,dst,ttl,tr,first,src){
 if(d&&d.t==='rt'&&!first&&d.pbr&&d.pbr.length&&src&&!d.ifaces.some(f=>f.ip===dst)&&!d.ifaces.some((f,i)=>f.ip&&f.mask&&same(f.ip,dst,f.mask)&&peer(d,i))){
  const r=pbFind(d,src,dst);
  if(r){const k=d.pbr.indexOf(r)+1;
   if(!pbUp(d,r.nh))ex([d.id],`${d.name}: PBR правило ${k} подошло (${src}), но узел ${r.nh} недоступен — использую обычную таблицу маршрутов`,{});
   else{const old=d.routes;ex([d.id],`${d.name}: PBR правило ${k} — пакет от ${src} направляю через ${r.nh}, минуя таблицу маршрутов`);
    d.routes=[{net:dst,mask:'255.255.255.255',nh:r.nh,ad:0},...(old||[])];try{return _d(d,dst,ttl,tr,first,src)}finally{d.routes=old;if(old===undefined)delete d.routes}}}}
 return _d(d,dst,ttl,tr,first,src)}}
function pbShow(d,io){const L=d.pbr||[];if(!L.length)return io('Правил PBR нет. Пример: pbr add 192.168.1.20/32 via 10.0.13.2');L.forEach((r,i)=>io(`${i+1}. ${pbText(r)}${pbUp(d,r.nh)?'':'   ⚠ узел недоступен — правило не действует'}`));io('Правила проверяются по порядку; первое подошедшее решает. Применяется к транзитному трафику.')}
function pbCmd(d,a,io){const k=(a[1]||'').toLowerCase();
 if(!k||k==='show'||k==='list')return pbShow(d,io);
 if(k==='clear'){delete d.pbr;ch();return io('Правила PBR удалены')}
 if(k==='del'||k==='no'){const n=+a[2];if(!Number.isInteger(n)||!d.pbr||n<1||n>d.pbr.length)return io('Использование: pbr del <номер правила> (см. pbr show)');d.pbr.splice(n-1,1);if(!d.pbr.length)delete d.pbr;ch();return io('Правило '+n+' удалено')}
 if(k==='add'){const s=pbNet(a[2]);if(!s)return io('Использование: pbr add <источник сеть/длина|any> [to <назначение сеть/длина>] via <ip следующего узла>');
  let dn=null,i=3;if((a[i]||'').toLowerCase()==='to'){dn=pbNet(a[i+1]);if(!dn)return io('to: сеть/длина, например 192.168.9.0/24');i+=2}
  if((a[i]||'').toLowerCase()!=='via'||ip2n(a[i+1]||'')==null)return io('Нужно указать via <ip следующего узла>');const nh=a[i+1];
  if(!d.ifaces.some(f=>f.ip&&f.mask&&same(nh,f.ip,f.mask)))return io('% Узел '+nh+' не из подсети ни одного интерфейса маршрутизатора');
  if((d.pbr||[]).length>=20)return io('Не более 20 правил');
  const r={sn:s.n,sm:s.m,nh,...(dn?{dn:dn.n,dm:dn.m}:{})};if((d.pbr||[]).some(x=>x.sn===r.sn&&x.sm===r.sm&&x.dn===r.dn&&x.dm===r.dm))return io('Правило для этой пары уже есть (сначала pbr del)');
  (d.pbr=d.pbr||[]).push(r);ch();return io('PBR правило '+d.pbr.length+': '+pbText(r))}
 return io('Использование: pbr add … | pbr del N | pbr clear | pbr show')}
{const _r=run;run=function(c){const s=String(c).trim(),a=s.split(/\s+/),w=a.map(x=>x.toLowerCase()),d=sel&&dv(sel);
 if(d&&d.t==='rt'){
  if(w[0]==='pbr')return pbCmd(d,a,p);
  if(w[0]==='show'&&w[1]==='pbr')return pbShow(d,p);
  if(w[0]==='route'&&w[1]==='get'&&w[3]==='from'&&ip2n(a[2]||'')!=null&&ip2n(a[4]||'')!=null){const r=pbFind(d,a[4],a[2]);
   if(r)p(`PBR правило ${d.pbr.indexOf(r)+1} (${pbText(r)}) подходит для источника ${a[4]}${pbUp(d,r.nh)?': пакет уйдёт через '+r.nh+' мимо таблицы маршрутов':', но узел недоступен — будет использована таблица'}`);
   else p('PBR: для источника '+a[4]+' правил нет — решает таблица маршрутов');
   return _r('route get '+a[2])}}
 return _r(c)}}
CMDS.push(['pbr add <источник сеть/длина|any> [to <сеть/длина>] via <ip> · pbr del N · pbr show · route get <ip> from <источник>','Политика маршрутизации (PBR): путь зависит от источника','Policy-based routing','Правило PBR направляет транзитные пакеты с заданным адресом источника (и, если указано, назначения) через указанный следующий узел, не глядя в таблицу маршрутов. Первое подошедшее правило решает; если узел недоступен, используется обычная таблица. Типовое применение: два провайдера, разные отделы идут через разные каналы. route get <ip> from <источник> показывает, сработает ли PBR.']);
const pbBase=pre=>({dev:[['pc','PC-A',40,120],['pc','PC-B',40,300],['sw','SW1',180,200],['rt','R1',320,200],['rt','R2',500,100],['rt','R3',500,300],['rt','R4',680,200],['srv','SRV',840,200]],
 link:[['PC-A',0,'SW1',0],['PC-B',0,'SW1',1],['SW1',2,'R1',0],['R1',1,'R2',0],['R1',2,'R3',0],['R2',1,'R4',0],['R3',1,'R4',1],['R4',2,'SRV',0]],
 cfg:[['PC-A','ip eth0 192.168.1.10 /24','gateway 192.168.1.1'],['PC-B','ip eth0 192.168.1.20 /24','gateway 192.168.1.1'],['SRV','ip eth0 192.168.9.10 /24','gateway 192.168.9.1'],
  ['R1','ip gi0/0 192.168.1.1 /24','ip gi0/1 10.0.12.1 /30','ip gi0/2 10.0.13.1 /30','route add 0.0.0.0 0.0.0.0 10.0.12.2',...(pre?['pbr add 192.168.1.20/32 via 10.0.13.2']:[])],
  ['R2','ip gi0/0 10.0.12.2 /30','ip gi0/1 10.0.24.1 /30','route add 192.168.9.0 /24 10.0.24.2','route add 192.168.1.0 /24 10.0.12.1'],
  ['R3','ip gi0/0 10.0.13.2 /30','ip gi0/1 10.0.34.1 /30','route add 192.168.9.0 /24 10.0.34.2','route add 192.168.1.0 /24 10.0.13.1'],
  ['R4','ip gi0/0 10.0.24.2 /30','ip gi0/1 10.0.34.2 /30','ip gi0/2 192.168.9.1 /24','route add 192.168.1.0 /24 10.0.24.1']]});
TPL.push(Object.assign({n:'Политика маршрутизации: PBR по источнику',d:'Офис с двумя каналами (через R2 и через R3) к серверу SRV. По умолчанию весь трафик идёт через R2; правило PBR на R1 направляет трафик PC-B (192.168.1.20) через R3.',hint:'Выполните ping SRV с PC-A и с PC-B в режиме симуляции или командой send и сравните путь. На R1: show pbr, route get 192.168.9.10 from 192.168.1.20. Удалите правило (pbr del 1) и проверьте, как изменился путь.'},pbBase(true)));
if(typeof EXNET!=='undefined')EXNET.push({n:'PBR: бухгалтерия через второго провайдера',min:20,tag:'Маршрутизация',init:r=>({}),start:c=>{tplLoad(Object.assign({n:'PBR',hint:''},pbBase(false)));p('Весь трафик офиса уходит через R2. Настройте на R1 политику маршрутизации.')},
 text:c=>'Трафик компьютера PC-B (192.168.1.20, бухгалтерия) к серверу SRV должен идти через второго провайдера (R3, адрес 10.0.13.2), а трафик остальных (PC-A) — по-прежнему через R2. Таблицу маршрутов R1 не менять, воспользуйтесь командой pbr на R1. Связь с SRV должна работать у обоих компьютеров.',
 crit:c=>{const R1=byNm('R1'),R2=byNm('R2'),R3=byNm('R3'),A=byNm('PC-A'),B=byNm('PC-B');const via=(s,r)=>{EX=[];const t=trip(s,'192.168.9.10');return{ok:!!t.ok,thru:EX.some(e=>e.p&&e.p.includes(r.id))}};
  const has=()=>(R1.pbr||[]).some(r=>r.sn==='192.168.1.20'&&r.nh==='10.0.13.2');
  return[['На R1 есть правило PBR: источник 192.168.1.20 → через 10.0.13.2',30,has],['Трафик PC-B к SRV идёт через R3',30,()=>{const v=via(B,R3);return v.ok&&v.thru}],
  ['Трафик PC-A к SRV идёт через R2, не через R3',20,()=>{if(!has())return false;const v=via(A,R2);const w=via(A,R3);return v.ok&&v.thru&&!w.thru}],
  ['Связь с SRV работает у обоих ПК, маршруты R1 не изменены',20,()=>{if(!has())return false;return via(A,R2).ok&&via(B,R3).ok&&(R1.routes||[]).length===1}]]}});
MAN.push(['Т64. Политика маршрутизации (PBR)',`<p><b>Идея.</b> Обычная маршрутизация смотрит только на адрес назначения. <b>Политика маршрутизации</b> (policy-based routing, PBR) позволяет учитывать адрес источника: трафик определённого отдела или узла направляется через выбранный канал, независимо от таблицы маршрутов. Типовой пример – два провайдера: бухгалтерия идёт через основной канал, остальные – через резервный или более дешёвый.</p>
<p><b>Как работает в Стектонии.</b> Правило PBR проверяется на маршрутизаторе <i>до</i> таблицы маршрутов и только для транзитного трафика (не для пакетов самого маршрутизатора). Правила проверяются по порядку, первое подошедшее решает. Если указанный следующий узел недоступен (интерфейс отключён, нет кабеля), правило не действует и используется обычная таблица. Если назначение находится в подсети самого маршрутизатора, PBR не вмешивается.</p>
<p><b>Команды.</b> <code>pbr add 192.168.1.20/32 via 10.0.13.2</code>, <code>pbr add 192.168.1.0/24 to 192.168.9.0/24 via 10.0.12.2</code>, <code>pbr show</code>, <code>pbr del N</code>, <code>pbr clear</code>; проверка без отправки пакета – <code>route get 192.168.9.10 from 192.168.1.20</code>.</p>
<p><b>Типовые ошибки.</b> Не добавили обратный маршрут на другом пути (ответ идёт асимметрично и блокируется межсетевым экраном); указали адрес узла не из подсети интерфейса; ожидают, что PBR применяется к трафику самого маршрутизатора; порядок правил: более общее правило перекрывает более точное.</p>
<p><b>Ограничения модели.</b> Нет route-map и ACL для условий PBR (только источник и назначение), нет set interface, set ip default next-hop и проверок достижимости через track; консоль Cisco ip policy не поддерживается.</p>`]);
