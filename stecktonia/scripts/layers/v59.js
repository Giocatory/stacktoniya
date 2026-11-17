// ===== v59: дополнительные сценарии ГИА (ДЭ): «Два офиса» (OSPF или статика) и «Офис с DMZ»; сценарий выбирается номером варианта =====
const SCN={fil:{n:'Филиал',tA:gAT,cA:gA,tB:gBT,cB:gB}};
const cmKind=c=>SCN[c.kind||'fil'];
function cmGeInitK(r,v){const kinds=['fil','two','dmz'],kind=kinds[((v||1)-1)%3],c=cmGeInit(r);c.kind=kind;if(kind==='two')c.rt=r()<.5?'ospf':'static';return c}
const cmBuildK=(devs,links,cfg,c,sxOn)=>{tplLoad({n:'ДЭ',dev:[],link:[],cfg:[],hint:''});devs.forEach(([k,n,x,y])=>addDev(k,x,y,n));
 links.forEach(([a,ai,b,bi])=>{link(byNm(a),ai,byNm(b),bi);const l=S.links[S.links.length-1];l.id=rid();l.ct='cat5e';l.len=10});
 Object.keys(cfg).forEach(n=>cfg[n].forEach(l=>execOn(byNm(n),l)));if(sxOn)cmSxPrep(c.sx,'Admin');sel=byNm('Admin').id;ch();draw();side()};
const cmX=(...a)=>{const n=a.shift();a.forEach(l=>execOn(byNm(n),l))};
const ISPCFG={ISP:['ip gi0/0 203.0.113.1 /30','ip gi0/1 8.8.8.1 /24'],Web:['ip eth0 8.8.8.8 /24','gateway 8.8.8.1','service add tcp 80']};
const cmRtIf=(nm,n,ip,m)=>{const f=cmIf(nm,n);return !!f&&f.ip===ip&&f.mask===m};
const M24='255.255.255.0',M30='255.255.255.252';
// ---------- «Два офиса» ----------
SCN.two={n:'Два офиса',
 build:(c,sxOn)=>cmBuildK([['pc','Admin',80,100],['pc','PC2',80,240],['sw','SWH',250,170],['rt','RH',430,170],['rt','RB',630,170],['sw','SWB',810,170],['pc','BR1',960,100],['srv','BRS',960,240],['rt','ISP',430,380],['srv','Web',430,520]],
  [['Admin',0,'SWH',0],['PC2',0,'SWH',1],['SWH',2,'RH',0],['RH',1,'RB',0],['RB',1,'SWB',0],['BR1',0,'SWB',1],['BRS',0,'SWB',2],['RH',2,'ISP',0],['ISP',1,'Web',0]],
  Object.assign({RH:['ip gi0/2 203.0.113.2 /30','route add 0.0.0.0 0.0.0.0 203.0.113.1'],Admin:['service add tcp 22']},ISPCFG),c,sxOn),
 solve:(c,part)=>{const x=c.x,h=`10.${x}.1`,b=`10.${x}.2`,t=`10.${x}.100`;
  if(part==='A'||part==='all'){cmX('RH',`ip gi0/0 ${h}.1 /24`,`ip gi0/1 ${t}.1 /30`,'nat gi0/2 on');cmX('RB',`ip gi0/0 ${t}.2 /30`,`ip gi0/1 ${b}.1 /24`,`route add 0.0.0.0 0.0.0.0 ${t}.1`);
   if(c.rt==='ospf'){cmX('RH','ospf on');cmX('RB','ospf on')}else cmX('RH',`route add ${b}.0 255.255.255.0 ${t}.2`);
   cmX('Admin',`ip eth0 ${h}.10 /24`,`gateway ${h}.1`);cmX('BR1',`ip eth0 ${b}.10 /24`,`gateway ${b}.1`);cmX('BRS',`ip eth0 ${b}.20 /24`,`gateway ${b}.1`)}
  if(part==='B'||part==='all'){cmX('RH',`dhcp gi0/0 ${h}.100 20`,`acl deny ${b}.0/24 ${h}.0/24 tcp 22`,'acl permit any any');cmX('PC2','dhcp eth0');cmX('BRS','service add tcp 445',`dnsrec files ${b}.20`)}},
 tA:c=>`Комплексное задание «Два офиса»: головной офис (Admin, PC2, коммутатор SWH, маршрутизатор RH) и филиал (BR1, сервер BRS, коммутатор SWB, маршрутизатор RB) соединены кабелем RH–RB; RH подключён к провайдеру ISP (203.0.113.2/30, маршрут по умолчанию и сайт Web 8.8.8.8 уже настроены).
Модуль А. Адресация: сеть головного офиса 10.${c.x}.1.0/24 (шлюз RH gi0/0 — .1), сеть филиала 10.${c.x}.2.0/24 (шлюз RB gi0/1 — .1), канал RH–RB — 10.${c.x}.100.0/30 (RH — .1, RB — .2). Admin — .10 (шлюз .1), BR1 — .10, BRS — .20 (статически). Маршрутизация между офисами: ${c.rt==='ospf'?'протокол OSPF на RH и RB':'статические маршруты (RH — в сеть филиала, RB — маршрут по умолчанию)'}; на RB в любом случае нужен маршрут по умолчанию через RH. NAT на RH включите на интерфейсе в сторону провайдера (gi0/2). Хосты обоих офисов должны выходить в Интернет (8.8.8.8).`,
 tB:c=>`Модуль Б. Сервисы: на RH включите DHCP для сети головного офиса (пул — 10.${c.x}.1.100, 20 адресов) и получите адрес на PC2 (dhcp eth0); на BRS включите файловую службу (tcp/445) и DNS-запись files → адрес BRS. Безопасность: сотрудники филиала не должны подключаться по tcp/22 к компьютерам головного офиса (на Admin служба SSH включена); остальной трафик (ping, tcp/445 к BRS из головного офиса) блокировать нельзя.`,
 cA:c=>{const x=c.x,h=`10.${x}.1`,b=`10.${x}.2`,t=`10.${x}.100`;return[
  ['RH: gi0/0 — '+h+'.1 /24, gi0/1 — '+t+'.1 /30',10,()=>cmRtIf('RH','gi0/0',h+'.1',M24)&&cmRtIf('RH','gi0/1',t+'.1',M30)],
  ['RB: gi0/0 — '+t+'.2 /30, gi0/1 — '+b+'.1 /24',10,()=>cmRtIf('RB','gi0/0',t+'.2',M30)&&cmRtIf('RB','gi0/1',b+'.1',M24)],
  ['Admin настроен: '+h+'.10 /24, шлюз .1',10,()=>cmOkIp('Admin',h)],
  ['BR1 и BRS настроены: '+b+'.10 и '+b+'.20 /24, шлюз .1',10,()=>cmOkIp('BR1',b)&&cmOkIp('BRS',b)],
  [c.rt==='ospf'?'OSPF включён на RH и RB, на RB есть маршрут по умолчанию':'Статический маршрут на RH в сеть филиала через '+t+'.2, на RB — маршрут по умолчанию',10,()=>{const rh=byNm('RH'),rb=byNm('RB');if(!rb.routes.some(r=>r.net==='0.0.0.0'&&r.nh===t+'.1'))return false;return c.rt==='ospf'?!!rh.ospf&&!!rb.ospf:rh.routes.some(r=>r.net===b+'.0'&&r.nh===t+'.2')}],
  ['ping Admin → BRS (между офисами)',20,()=>cmPin('Admin','BRS')],
  ['ping BR1 → Admin',10,()=>cmPin('BR1','Admin')],
  ['NAT включён на RH (gi0/2)',10,()=>{const f=cmIf('RH','gi0/2');return !!f&&!!f.nat}],
  ['ping BR1 → 8.8.8.8 (Интернет из филиала)',10,()=>cmPin('BR1','8.8.8.8')]]},
 cB:c=>{const x=c.x,h=`10.${x}.1`,b=`10.${x}.2`;return[
  ['DHCP-пул на RH (gi0/0): начало '+h+'.100, не менее 10 адресов',15,()=>{const d=byNm('RH'),q=d&&d.dhcp&&d.dhcp['gi0/0'];return !!q&&q.first===h+'.100'&&q.n>=10}],
  ['PC2 получил адрес из пула и шлюз .1',15,()=>{const d=byNm('PC2');return !!d&&d.ifaces[0].ip.startsWith(h+'.')&&+d.ifaces[0].ip.split('.')[3]>=100&&d.gw===h+'.1'}],
  ['BRS слушает tcp/445',10,()=>{const d=byNm('BRS');return !!d&&(d.svc||[]).some(s=>s.p==='tcp'&&s.n===445)}],
  ['Admin подключается к BRS:445',15,()=>cmL4('Admin','BRS',445)],
  ['DNS-запись files → адрес BRS на BRS',10,()=>{const d=byNm('BRS');return !!d&&!!d.hosts&&d.hosts.files===b+'.20'}],
  ['ACL: BR1 → Admin:22 закрыт, при этом ping BR1 → Admin и Admin → BRS:445 проходят',35,()=>!cmL4('BR1','Admin',22)&&cmPin('BR1','Admin')&&cmL4('Admin','BRS',445)]]}};
// ---------- «Офис с DMZ» ----------
SCN.dmz={n:'Офис с DMZ',
 build:(c,sxOn)=>cmBuildK([['pc','Admin',80,100],['pc','PC2',80,240],['srv','DB',80,380],['sw','SW1',260,240],['rt','R1',450,240],['srv','Portal',450,430],['rt','ISP',650,240],['srv','Web',850,240]],
  [['Admin',0,'SW1',0],['PC2',0,'SW1',1],['DB',0,'SW1',2],['SW1',3,'R1',0],['Portal',0,'R1',2],['R1',1,'ISP',0],['ISP',1,'Web',0]],
  Object.assign({R1:['ip gi0/1 203.0.113.2 /30','route add 0.0.0.0 0.0.0.0 203.0.113.1']},ISPCFG),c,sxOn),
 solve:(c,part)=>{const x=c.x,l=`10.${x}.1`,z=`10.${x}.2`;
  if(part==='A'||part==='all'){cmX('R1',`ip gi0/0 ${l}.1 /24`,`ip gi0/2 ${z}.1 /24`,'nat gi0/1 on');[['Admin',10],['PC2',11],['DB',20]].forEach(([n,h])=>cmX(n,`ip eth0 ${l}.${h} /24`,`gateway ${l}.1`));cmX('Portal',`ip eth0 ${z}.10 /24`,`gateway ${z}.1`)}
  if(part==='B'||part==='all'){cmX('Portal','service add tcp 80','service add tcp 22',`dnsrec portal ${z}.10`);cmX('R1',`acl permit ${l}.10/32 ${z}.0/24 tcp 22`,`acl deny any ${z}.0/24 tcp 22`,'acl permit any any')}},
 tA:c=>`Комплексное задание «Офис с DMZ»: внутренняя сеть (Admin, PC2, сервер БД DB через коммутатор SW1) и демилитаризованная зона (веб-портал Portal) подключены к маршрутизатору R1 (gi0/0 — внутренняя сеть, gi0/2 — DMZ, gi0/1 — провайдер ISP: адрес 203.0.113.2/30 и маршрут по умолчанию настроены, сайт Web — 8.8.8.8).
Модуль А. Адресация: внутренняя сеть 10.${c.x}.1.0/24 (шлюз R1 gi0/0 — .1), DMZ 10.${c.x}.2.0/24 (шлюз R1 gi0/2 — .1). Admin — .10, PC2 — .11, DB — .20 (внутренняя сеть), Portal — .10 (DMZ), шлюзы — .1. Включите NAT на интерфейсе в сторону провайдера (gi0/1): внутренние узлы и Portal должны выходить в Интернет (8.8.8.8).`,
 tB:c=>`Модуль Б. Сервисы: на Portal включите веб (tcp/80) и SSH (tcp/22), создайте DNS-запись portal → адрес Portal. Безопасность: доступ к Portal по tcp/22 разрешён только компьютеру Admin (${`10.${c.x}.1.10`}); веб (tcp/80) и ping должны быть доступны всем внутренним узлам. Правила настраиваются на R1.`,
 cA:c=>{const x=c.x,l=`10.${x}.1`,z=`10.${x}.2`;return[
  ['R1: gi0/0 — '+l+'.1 /24 и gi0/2 — '+z+'.1 /24',20,()=>cmRtIf('R1','gi0/0',l+'.1',M24)&&cmRtIf('R1','gi0/2',z+'.1',M24)],
  ['Admin и PC2 настроены: .10 и .11 /24, шлюз .1',10,()=>cmOkIp('Admin',l)&&cmOkIp('PC2',l)],
  ['DB настроен: '+l+'.20 /24, шлюз .1',5,()=>cmOkIp('DB',l)],
  ['Portal настроен: '+z+'.10 /24, шлюз .1',5,()=>cmOkIp('Portal',z)],
  ['ping Admin ↔ PC2 (одна сеть)',5,()=>cmPin('Admin','PC2')],
  ['ping Admin → Portal (внутренняя сеть → DMZ)',15,()=>cmPin('Admin','Portal')],
  ['ping Admin → DB',5,()=>cmPin('Admin','DB')],
  ['NAT включён на R1 (gi0/1)',10,()=>{const f=cmIf('R1','gi0/1');return !!f&&!!f.nat}],
  ['ping Admin → 8.8.8.8 (Интернет через NAT)',20,()=>cmPin('Admin','8.8.8.8')],
  ['ping Portal → 8.8.8.8',5,()=>cmPin('Portal','8.8.8.8')]]},
 cB:c=>{const x=c.x,z=`10.${x}.2`;return[
  ['Portal слушает tcp/80',10,()=>{const d=byNm('Portal');return !!d&&(d.svc||[]).some(s=>s.p==='tcp'&&s.n===80)}],
  ['Portal слушает tcp/22',10,()=>{const d=byNm('Portal');return !!d&&(d.svc||[]).some(s=>s.p==='tcp'&&s.n===22)}],
  ['DNS-запись portal → адрес Portal на Portal',10,()=>{const d=byNm('Portal');return !!d&&!!d.hosts&&d.hosts.portal===z+'.10'}],
  ['Admin открывает веб Portal (tcp/80)',15,()=>cmL4('Admin','Portal',80)],
  ['Admin подключается к Portal по tcp/22',15,()=>cmL4('Admin','Portal',22)],
  ['PC2 → Portal:22 закрыт, при этом PC2 → Portal:80 открыт',25,()=>cmL4('PC2','Portal',80)&&!cmL4('PC2','Portal',22)],
  ['ping PC2 → Portal проходит (ACL не блокирует остальное)',15,()=>cmPin('PC2','Portal')]]}};
// ---------- диспетчеризация ----------
{const _b=cmGeBuild,_s=cmGeSolve;cmGeBuild=function(c,sxOn){const k=SCN[c.kind||'fil'];return k.build?k.build(c,sxOn):_b(c,sxOn)};
 cmGeSolve=function(c,part){const k=SCN[c.kind||'fil'];return k.solve?k.solve(c,part):_s(c,part)}}
CMX['ГИА · А: Сетевая инфраструктура («Филиал»)'].text=c=>cmKind(c).tA(c);CMX['ГИА · А: Сетевая инфраструктура («Филиал»)'].crit=c=>cmKind(c).cA(c);
CMX['ГИА · Б: Сервисы и безопасность («Филиал»)'].text=c=>cmKind(c).tB(c);CMX['ГИА · Б: Сервисы и безопасность («Филиал»)'].crit=c=>cmKind(c).cB(c);
CMX['ГИА · В: Администрирование ОС («Филиал»)'].text=c=>`Модуль В. Администрирование ОС: на компьютере Admin (окно «Скрипты») выполните задания:\n${cmSxText(c.sx)}`;
CMP.ge.desc=CMP.ge.desc.replace('одно комплексное задание «Филиал» на единой схеме','одно комплексное задание на единой схеме (сценарий задаёт номер варианта: 1, 4, 7… — «Филиал», 2, 5, 8… — «Два офиса», 3, 6, 9… — «Офис с DMZ»)');
CMP.ge.mods[0].about='адресация, маршрутизация, NAT (состав зависит от сценария)';CMP.ge.mods[1].about='DHCP, DNS, службы, ACL (состав зависит от сценария)';

{const m=MAN.find(x=>/Т31/.test(x[0]));if(m)m[1]=m[1].replace('Одно комплексное задание «Филиал» на единой схеме','Одно комплексное задание на единой схеме; сценарий задаёт номер варианта: 1, 4, 7… — «Филиал», 2, 5, 8… — «Два офиса» (OSPF или статика, DHCP, ACL между офисами), 3, 6, 9… — «Офис с DMZ». Ниже описан сценарий «Филиал»: схема')}
MAN.push(['Т33. Консоли Cisco IOS и Huawei VRP',`<h3>Вендорные консоли</h3>
<p>Выберите маршрутизатор или коммутатор и введите <code>cli cisco</code> или <code>cli huawei</code>. Приглашение примет привычный вид, а команды будут изменять ту же модель устройства. <code>cli native</code> возвращает обычную консоль Стектонии.</p>
<table class="t"><tr><th>Действие</th><th>Cisco IOS</th><th>Huawei VRP</th></tr>
<tr><td>Режим настройки</td><td><code>enable</code>, <code>configure terminal</code></td><td><code>system-view</code></td></tr>
<tr><td>Выход на уровень выше / из настройки</td><td><code>exit</code> / <code>end</code></td><td><code>quit</code> / <code>return</code></td></tr>
<tr><td>Интерфейс</td><td><code>interface gi0/0</code> или <code>interface vlan 10</code></td><td><code>interface GigabitEthernet0/0/0</code> или <code>interface Vlanif10</code></td></tr>
<tr><td>Адрес</td><td><code>ip address 10.0.0.1 255.255.255.0</code></td><td><code>ip address 10.0.0.1 24</code></td></tr>
<tr><td>Включить / выключить порт</td><td><code>no shutdown</code> / <code>shutdown</code></td><td><code>undo shutdown</code> / <code>shutdown</code></td></tr>
<tr><td>Статический маршрут</td><td><code>ip route 0.0.0.0 0.0.0.0 10.0.0.2</code></td><td><code>ip route-static 0.0.0.0 0 10.0.0.2</code></td></tr>
<tr><td>VLAN и порт доступа</td><td><code>vlan 10</code>; <code>switchport mode access</code>; <code>switchport access vlan 10</code></td><td><code>vlan batch 10</code>; <code>port link-type access</code>; <code>port default vlan 10</code></td></tr>
<tr><td>NAT на внешнем интерфейсе</td><td><code>ip nat outside</code></td><td><code>nat outbound 2000</code></td></tr>
<tr><td>ACL</td><td><code>access-list 101 deny tcp A W B W eq 22</code></td><td><code>acl number 3000</code>; <code>rule 5 deny tcp source A W destination B W destination-port eq 22</code></td></tr>
<tr><td>DHCP</td><td><code>ip dhcp pool P</code>; <code>network</code>; <code>default-router</code>; <code>dns-server</code></td><td><code>ip pool P</code>; <code>network … mask …</code>; <code>gateway-list</code>; <code>dns-list</code></td></tr>
<tr><td>Просмотр</td><td><code>show running-config</code>, <code>show ip route</code>, <code>show ip interface brief</code>, <code>show vlan brief</code></td><td><code>display current-configuration</code>, <code>display ip routing-table</code>, <code>display ip interface brief</code>, <code>display vlan</code></td></tr></table>
<p class="mt">Поддерживается подмножество команд: полноценных образов Cisco IOS и Huawei VRP в платформе нет. Неизвестная команда даёт сообщение «% Invalid input» (Cisco) или «Error: Unrecognized command» (Huawei); ping, traceroute и справка работают как обычно. Лабораторные 33 и 34 в методичке.</p>`]);
if(typeof QH_ID!=='undefined'){}
p('Новое (v56–v59): строка меню; ГИА — три сценария (Филиал, Два офиса, Офис с DMZ), дополнение заказчика, консоли Cisco IOS и Huawei VRP (команда cli cisco | cli huawei).');
