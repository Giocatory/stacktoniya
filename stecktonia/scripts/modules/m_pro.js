// ===== m_pro (v86): возможности «профессиональных» симуляторов — соседи CDP/LLDP, show version/clock/inventory/interfaces status =====
const prNet=d=>d&&(d.t==='rt'||d.t==='sw')&&d.k!=='hub';
function prNeighbors(d){const r=[];d.ifaces.forEach((f,i)=>{if(f.off)return;const q=peer(d,i);if(!q||!q.d||!prNet(q.d)||!prNet(d))return;const g=q.d.ifaces[q.i];if(g&&g.off)return;r.push({f,i,d:q.d,g})});return r}
const prCap=x=>x.t==='rt'?'R':'S',prPlat=x=>(x.t==='rt'?'Маршрутизатор':x.k==='l3'?'L3-коммутатор':'Коммутатор')+' (модель Стектонии)';
const prIp=x=>{const f=x.ifaces.find(g=>g.ip);return f?f.ip:'—'};
function prCdp(d,detail,proto,p){const N=prNeighbors(d);
 if(proto==='cdp'&&d.nocdp){p('% CDP не запущен на устройстве (cdp run)');return}
 if(!N.length){p(proto==='huawei'?'Соседей LLDP нет (соседи — маршрутизаторы и коммутаторы с включённым кабелем).':'Соседей нет. Соседями считаются маршрутизаторы и коммутаторы, соединённые рабочим кабелем (ПК и серверы CDP/LLDP не отправляют).');return}
 if(proto==='huawei'){p('Local Intf       Neighbor Dev            Neighbor Intf         Exptime(s)');N.forEach(n=>p(n.f.n.padEnd(17)+n.d.name.padEnd(24)+n.g.n.padEnd(22)+'120'));return}
 if(detail){N.forEach(n=>p(`-------------------------\nDevice ID: ${n.d.name}\nEntry address(es):\n  IP address: ${prIp(n.d)}\nPlatform: ${prPlat(n.d)},  Capabilities: ${prCap(n.d)==='R'?'Router':'Switch'}\nInterface: ${n.f.n},  Port ID (outgoing port): ${n.g.n}\nHoldtime: ${proto==='cdp'?'160':'120'} sec\nMAC: ${n.d.mac}`));return}
 if(proto==='cdp'){p('Capability Codes: R - Router, S - Switch, H - Host\n');p('Device ID'.padEnd(18)+'Local Intrfce'.padEnd(15)+'Holdtme'.padEnd(9)+'Capability'.padEnd(12)+'Platform'.padEnd(24)+'Port ID');N.forEach(n=>p(n.d.name.padEnd(18)+n.f.n.padEnd(15)+'160'.padEnd(9)+prCap(n.d).padEnd(12)+prPlat(n.d).slice(0,22).padEnd(24)+n.g.n))}
 else{p('Capability codes: (R) Router, (B) Bridge\n');p('Device ID'.padEnd(20)+'Local Intf'.padEnd(13)+'Hold-time'.padEnd(11)+'Capability'.padEnd(12)+'Port ID');N.forEach(n=>p(n.d.name.padEnd(20)+n.f.n.padEnd(13)+'120'.padEnd(11)+(n.d.t==='rt'?'R':'B').padEnd(12)+n.g.n));p('\nTotal entries displayed: '+N.length)}}
function prVersion(d,hw,p){const up=Math.max(1,Math.round((Date.now()-(window.PR_T0||(window.PR_T0=Date.now())))/60000));
 const L=[`${d.name} (${d.t==='rt'?'маршрутизатор':d.k==='l3'?'L3-коммутатор':'коммутатор'}) — учебная модель Стектонии, не реальная прошивка`,`Версия модели: Стектония v86`,`Время работы сессии: ${up} мин`,`Интерфейсов: ${d.ifaces.length}`,`MAC-адрес устройства: ${d.mac}`,`Пользовательская консоль: ${d.vend==='cisco'?'Cisco IOS (модель)':d.vend==='huawei'?'Huawei VRP (модель)':'обычная консоль Стектонии'}`];
 if(hw)L.unshift('VRP (R) software, учебная модель');p(L.join('\n'))}
function prStatus(d,p){if(d.t!=='sw'&&!d.ifaces.some(f=>f.svi))return false;p('Port'.padEnd(10)+'Name'.padEnd(14)+'Status'.padEnd(13)+'Vlan'.padEnd(8)+'Duplex'.padEnd(9)+'Speed Type');
 d.ifaces.filter(f=>!f.svi).forEach((f,i)=>{const up=!f.off&&!!peer(d,d.ifaces.indexOf(f));p(f.n.padEnd(10)+String(f.desc||'').slice(0,12).padEnd(14)+(f.off?'disabled':up?'connected':'notconnect').padEnd(13)+String(f.tr?'trunk':f.v||1).padEnd(8)+(up?'a-full':'auto').padEnd(9)+(up?'a-'+(f.spd||1000):'auto')+' 10/100/1000BaseTX')});return true}
{const _r=run;run=function(c){const s=String(c).trim(),m=/^(show|sh|display|dis)\s+(.*)$/i.exec(s),d=sel&&dv(sel);
 if(m&&d&&(d.t==='rt'||d.t==='sw')){const a=m[2].toLowerCase().replace(/\s+/g,' '),hw=/^dis/i.test(m[1])||d.vend==='huawei';
  let x;
  if((x=/^cdp neighbors?( detail)?$/.exec(a))){prCdp(d,!!x[1],'cdp',p);return}
  if((x=/^lldp neighbors?( detail| brief)?$/.exec(a))){prCdp(d,x[1]===' detail',hw?'huawei':'lldp',p);return}
  if((x=/^lldp neighbor( brief)?$/.exec(a))){prCdp(d,false,hw?'huawei':'lldp',p);return}
  if(a==='version'){prVersion(d,hw,p);return}
  if(a==='clock'){p(new Date().toString().replace(/ GMT.*$/,'')+' (виртуальное время браузера)');return}
  if(a==='inventory'){p(`NAME: "${d.name}", DESCR: "${prPlat(d)}"\nPID: Stacktoniya-${d.t==='rt'?'RT':'SW'}-${d.ifaces.length}P, SN: ${d.mac.replace(/:/g,'').toUpperCase()}`);return}
  if(/^interfaces? status$/.test(a)){if(!prStatus(d,p))p('% show interfaces status — команда коммутатора');return}}
 return _r(c)}}
CMDS.push(['cdp','show cdp neighbors [detail] | show lldp neighbors [detail] | display lldp neighbor brief','Соседние устройства (CDP/LLDP)','Показывает, к каким маршрутизаторам и коммутаторам подключено устройство: имя, локальный и удалённый порт, платформа. Данные берутся из схемы: соседом считается устройство с рабочим кабелем и включёнными портами. ПК и серверы протоколы обнаружения не отправляют.']);
CMDS.push(['version','show version | show clock | show inventory | show interfaces status','Сведения об устройстве','Версия учебной модели, MAC-адрес, число портов, время сессии; для коммутатора — состояние портов (connected / notconnect / disabled), VLAN и скорость.']);
// ---- шаблон и экзаменационное задание: резервный канал с плавающим статическим маршрутом ----
const prFloat=(fl)=>({dev:[['pc','PC-A',60,200],['pc','PC-B',860,200],['rt','R1',230,200],['rt','R2',420,110],['rt','R3',420,290],['rt','R4',620,200]],
 link:[['PC-A',0,'R1',0],['R1',1,'R2',0],['R1',2,'R3',0],['R2',1,'R4',0],['R3',1,'R4',1],['R4',2,'PC-B',0]],
 cfg:[['PC-A','ip eth0 192.168.1.10 /24','gateway 192.168.1.1'],['PC-B','ip eth0 192.168.2.10 /24','gateway 192.168.2.1'],
  ['R1','ip gi0/0 192.168.1.1 /24','ip gi0/1 10.0.12.1 /30','ip gi0/2 10.0.13.1 /30','route add 192.168.2.0 /24 10.0.12.2',...(fl?['route add 192.168.2.0 /24 10.0.13.2 200']:[])],
  ['R2','ip gi0/0 10.0.12.2 /30','ip gi0/1 10.0.24.1 /30','route add 192.168.2.0 /24 10.0.24.2','route add 192.168.1.0 /24 10.0.12.1'],
  ['R3','ip gi0/0 10.0.13.2 /30','ip gi0/1 10.0.34.1 /30','route add 192.168.2.0 /24 10.0.34.2','route add 192.168.1.0 /24 10.0.13.1'],
  ['R4','ip gi0/0 10.0.24.2 /30','ip gi0/1 10.0.34.2 /30','ip gi0/2 192.168.2.1 /24','route add 192.168.1.0 /24 10.0.24.1',...(fl?['route add 192.168.1.0 /24 10.0.34.1 200']:[])]]});
TPL.push(Object.assign({n:'Резервный канал: плавающий статический маршрут',d:'Два пути между офисами: основной через R2 и резервный через R3. Резервные маршруты заданы с большей административной дистанцией (200) и «просыпаются» только при отказе основного пути.',hint:'Проверьте ping PC-A → PC-B и tracert (путь через R2). Таблица route на R1 показывает [AD 200] у резервного маршрута. Удалите R2 (отказ) — трафик пойдёт через R3.'},prFloat(true)));
if(typeof EXNET!=='undefined')EXNET.push({n:'Резервирование: плавающие статические маршруты',min:20,tag:'Маршрутизация',init:r=>({}),start:c=>{tplLoad(Object.assign({n:'Резерв',hint:''},prFloat(false)));p('Основной путь работает через R2. Добавьте резервный путь через R3 так, чтобы при отказе R2 связь сохранилась.')},
 text:c=>'Офисы соединены двумя путями: основной (через R2) и резервный (через R3). Резервного маршрута нет: при отказе R2 связь пропадёт. Добавьте на R1 и R4 резервные статические маршруты через R3 с административной дистанцией 200 (route add … 200) и не трогайте основные. Основной путь должен остаться через R2.',
 crit:c=>{const fb=n=>{const keep=JSON.stringify(S);try{const R2=byNm('R2');S.links=S.links.filter(l=>l.a!==R2.id&&l.b!==R2.id);S.devs=S.devs.filter(d=>d!==R2);return n()}finally{S=JSON.parse(keep)}};
  return[['На R1 есть маршрут к 192.168.2.0/24 через 10.0.13.2 с дистанцией > 1',20,()=>byNm('R1').routes.some(r=>r.net==='192.168.2.0'&&r.nh==='10.0.13.2'&&r.ad>1)],
  ['На R4 есть обратный маршрут к 192.168.1.0/24 через 10.0.34.1 с дистанцией > 1',20,()=>byNm('R4').routes.some(r=>r.net==='192.168.1.0'&&r.nh==='10.0.34.1'&&r.ad>1)],
  ['Основной путь не изменился: PC-A → PC-B идёт через R2',20,()=>{EX=[];const r=trip(byNm('PC-A'),'192.168.2.10');return!!r.ok&&(r.tr||[]).some(x=>x.name==='R2')&&!(r.tr||[]).some(x=>x.name==='R3')}],
  ['При отказе R2 пинг PC-A → PC-B проходит через R3',25,()=>fb(()=>{EX=[];const r=trip(byNm('PC-A'),'192.168.2.10');return!!r.ok&&(r.tr||[]).some(x=>x.name==='R3')})],
  ['При отказе R2 обратный пинг PC-B → PC-A проходит',15,()=>fb(()=>exnPing('PC-B','PC-A'))]]}});
MAN.push(['Т55. Выбор маршрута, плавающие маршруты и соседи CDP/LLDP',`<p><b>Как маршрутизатор выбирает маршрут.</b> 1) Самый длинный совпавший префикс (/30 важнее /24, /24 важнее 0.0.0.0/0). 2) При равных префиксах — меньшая <i>административная дистанция</i> (AD, доверие к источнику): connected 0, static 1, eBGP 20, EIGRP 90, OSPF 110, RIP 120. 3) При равных AD — меньшая метрика протокола.</p>
<p><b>Плавающий статический маршрут.</b> Резервный статический маршрут с AD выше основного: <code>route add 192.168.2.0 /24 10.0.13.2 200</code> (Cisco: <code>ip route 192.168.2.0 255.255.255.0 10.0.13.2 200</code>, Huawei: <code>ip route-static … preference 200</code>). Пока основной путь существует, резервный не используется; когда основной next-hop исчезает (кабель, питание, отказ узла), в работу вступает резервный. Обратный путь нужно резервировать отдельно на удалённом маршрутизаторе. Динамический протокол (OSPF, AD 110) «перебивает» плавающий маршрут с AD 200 — для резерва поверх OSPF ставят AD больше 110.</p>
<p><b>Ограничение модели:</b> отказ определяется по пропаданию next-hop (кабель/устройство), без IP SLA, BFD и отслеживания доступности.</p>
<p><b>Соседи CDP и LLDP.</b> <code>show cdp neighbors [detail]</code>, <code>show lldp neighbors</code>, Huawei <code>display lldp neighbor brief</code> показывают соседние маршрутизаторы и коммутаторы: имя, локальный и удалённый порт, платформу, адрес. Так проверяют, что кабель включён в нужный порт, и восстанавливают схему по факту. CDP — протокол Cisco, LLDP — стандарт IEEE 802.1AB. Рядом: <code>show version</code>, <code>show clock</code>, <code>show inventory</code>, <code>show interfaces status</code> (коммутатор: connected / notconnect / disabled, VLAN, скорость).</p>`]);
