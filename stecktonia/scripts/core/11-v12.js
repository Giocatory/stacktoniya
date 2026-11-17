// ================= v12: камеры, NVR, СУБД, NAS, IP-АТС, PoE-коммутатор =================
Object.assign(IC,{
 cam:`<rect class="ib" x="5" y="13" width="29" height="16" rx="3"/><path class="is" d="M5 11h29"/><circle class="ib" cx="35" cy="21" r="8"/><circle class="iscr" cx="35" cy="21" r="4.600"/><circle class="iaf" cx="35" cy="21" r="1.800"/><circle class="io" cx="10" cy="18" r="1.500" style="fill:#e0443c"/><path class="is" d="M16 29v7"/><rect class="ib" x="8" y="36" width="16" height="4" rx="1.500"/>`,
 nvr:`<rect class="ib" x="3" y="14" width="42" height="22" rx="3"/><rect class="iscr" x="7" y="18" width="15" height="14" rx="1"/><path class="ia" d="M12 22l7 3-7 3z"/><path class="is" d="M26 20h15M26 25h15M26 30h9"/><circle cx="39" cy="31" r="2" fill="#e0443c"/><path class="is" d="M10 36v4M38 36v4"/>`,
 db:`<path class="ib" d="M8 11v27c0 3.500 7 6 16 6s16-2.500 16-6V11"/><ellipse class="ib" cx="24" cy="11" rx="16" ry="6"/><path class="is" d="M8 21c0 3.500 7 6 16 6s16-2.500 16-6M8 30c0 3.500 7 6 16 6s16-2.500 16-6"/><circle class="ig" cx="34" cy="23" r="1.300"/><circle class="ig" cx="34" cy="32" r="1.300"/>`,
 nas:`<rect class="ib" x="7" y="5" width="34" height="38" rx="3"/>${[0,1,2,3].map(i=>`<rect class="ip" x="11" y="${9+i*8.5}" width="22" height="6.500" rx="1"/><circle class="ig" cx="37" cy="${12.200+i*8.500}" r="1.200"/>`).join('')}`,
 pbx:`<rect class="ib" x="4" y="12" width="40" height="24" rx="3"/><path class="ia" d="M13 28c0-3 3-5.500 6-5.500h10c3 0 6 2.500 6 5.500v2h-4.500v-2.500h-13V30H13z"/><circle class="if" cx="35" cy="17" r="1.200"/><circle class="if" cx="30" cy="17" r="1.200"/><circle class="ig" cx="10" cy="17" r="1.300"/><path class="is" d="M14 36v4M34 36v4"/>`,
 poe:`<rect class="ib" x="3" y="16" width="42" height="22" rx="3"/>${[0,1,2,3,4,5,6,7].map(i=>`<rect class="ip" x="${5.800+i*4.800}" y="26" width="3.800" height="6" rx=".7"/><circle class="ig" cx="${7.700+i*4.800}" cy="21" r="1"/>`).join('')}<path d="M40.500 1l-7 8.500h4.200l-2.200 7 8.300-9.500h-4.200z" fill="#f2c200" stroke="var(--ic2)" stroke-width="1.100" stroke-linejoin="round"/><path class="ia" d="M11 44h26"/>`
});
Object.assign(CAT,{
 cam:{g:'Видеонаблюдение, питание и службы',l:'IP-камера (питание PoE)',p:'Cam',i:'',t:'pc',n:1},
 nvr:{l:'Видеорегистратор NVR',p:'NVR',i:'',t:'pc',n:1},
 db:{l:'Сервер СУБД',p:'DB',i:'',t:'pc',n:1},
 nas:{l:'Файловое хранилище NAS',p:'NAS',i:'',t:'pc',n:1},
 pbx:{l:'IP-АТС (телефония)',p:'PBX',i:'',t:'pc',n:1},
 poe:{l:'Коммутатор PoE (управляемый, 120 Вт)',p:'PoE',i:'',t:'sw',n:8}});
NOTE.cam='IP-камера: передаёт видеопоток по сети (RTSP, TCP/554). Питается по кабелю от PoE-коммутатора (или от адаптера питания). Без питания и без IP-адреса она «слепая» для сети. Подключите камеру к PoE-коммутатору, дайте адрес, добавьте её на видеорегистратор: addcam <камера>.';
NOTE.nvr='Видеорегистратор (NVR): сам подключается к камерам по RTSP (TCP/554), принимает потоки и пишет на диск. Команды: addcam, cams, storage — последняя считает, на сколько суток хватит диска.';
NOTE.db='Сервер СУБД (PostgreSQL / MySQL / SQL Server): принимает подключения клиентов на порт 5432 / 3306 / 1433. Настройки: db engine, db listen any|local, db user add. Клиент: sql <тип> <сервер> <логин> <пароль> «запрос». Хранить СУБД нужно во внутренней сети, а не в DMZ.';
NOTE.nas='Сетевое хранилище (NAS): общие папки по SMB (TCP/445) и NFS (TCP/2049). Команды: share add <имя> [кому], mount <узел> <папка> на клиенте.';
NOTE.pbx='IP-АТС (Asterisk-подобная): SIP-регистрация на UDP/5060, голос (RTP) идёт напрямую между телефонами. Телефоны: register <АТС> <номер>, call <номер>. Голос чувствителен к задержкам — см. QoS.';
NOTE.poe='Коммутатор PoE: питает камеры, точки доступа и IP-телефоны по витой паре (802.3af/at). Бюджет мощности ограничен (120 Вт): камера ≈ 7 Вт, точка доступа ≈ 12 Вт, телефон ≈ 4 Вт. Команда poe показывает расход по портам.';
// сервис: ссылка на зоны; хранилище нового типа
const DBP={pgsql:5432,mysql:3306,mssql:1433},DBN={pgsql:'PostgreSQL',mysql:'MySQL',mssql:'Microsoft SQL Server'};
const DBV={pgsql:'PostgreSQL 16.4 on x86_64-pc-linux-gnu',mysql:'8.0.39',mssql:'Microsoft SQL Server 2022 (16.0.4135)'};
function dbSync(d){const all=Object.values(DBP);d.svc=(d.svc||[]).filter(s=>!(s.p==='tcp'&&all.includes(s.n)));if(d.dbl!=='local'&&d.dbe)d.svc.push({p:'tcp',n:DBP[d.dbe]})}
const CAMRES={'720p':2,'1080p':4,'4mp':6,'4k':12};
const camMbit=d=>(CAMRES[d.res||'1080p']||4)*((d.codec||'h264')==='h265'?.5:1);
const byNm=n=>S.devs.find(x=>x.name.toLowerCase()===String(n||'').toLowerCase());
const devByIp=ip=>S.devs.find(x=>x.ifaces.some(f=>f.ip===ip));
const _ad12=addDev;
addDev=function(k,x,y,n){
 if(k==='poe'){S.n.poe=(S.n.poe||0)+1;const d=_ad12('msw',x,y,n||'PoE'+S.n.poe);d.ico='poe';d.poeW=120;ch();return d}
 const d=_ad12(k,x,y,n);let c=0;
 if(k==='cam'){d.poeReq=true;d.res='1080p';d.codec='h264';d.svc=[{p:'tcp',n:554},{p:'tcp',n:80}];c=1}
 if(k==='nvr'){d.cams=[];d.disk=4;d.svc=[{p:'tcp',n:80},{p:'tcp',n:8000}];c=1}
 if(k==='db'){d.dbe='pgsql';d.dbl='any';d.dbu=[{u:'app',pw:'secret',from:'any'}];d.dbs=['appdb'];dbSync(d);c=1}
 if(k==='nas'){d.shares=[{n:'public',from:'any'}];d.svc=[{p:'tcp',n:445},{p:'tcp',n:2049}];c=1}
 if(k==='pbx'){d.reg={};d.svc=[{p:'udp',n:5060}];c=1}
 if(k==='ipp'||k==='ph'||k==='tab'){d.svc=[{p:'udp',n:16384}];c=1}
 if(c)ch();return d};
// --- питание PoE ---
const PWR={cam:7,ap:12,ipp:4};
const needPoe=d=>(d.poeReq||d.pwr==='poe')&&d.pwr!=='adapter';
const _peer12=peer;
function poeScan(){S.devs.forEach(d=>{d.nopwr=false;delete d.poeUse});
 const ok=new Set();
 S.devs.filter(d=>d.poeW&&!d.off).forEach(sw=>{let used=0;sw.poeRows=[];
  sw.ifaces.forEach((f,i)=>{if(f.off||f.poeoff)return;const q=_peer12(sw,i);if(!q||!needPoe(q.d))return;const w=PWR[kind(q.d)]||5;
   if(used+w<=sw.poeW){used+=w;ok.add(q.d.id);sw.poeRows.push({p:f.n,d:q.d.name,w,ok:1})}else sw.poeRows.push({p:f.n,d:q.d.name,w,ok:0})});
  sw.poeUsed=used});
 S.devs.forEach(d=>{if(needPoe(d)&&!ok.has(d.id))d.nopwr=true})}
peer=function(d,i){const q=_peer12(d,i);if(q&&(d.nopwr||q.d.nopwr))return null;return q};
const _l2all12=l2all;
l2all=function(d,o){if(d.nopwr)return[];return _l2all12(d,o).filter(e=>!e.d.nopwr)};
const _trip12=trip;
trip=function(d,dst){poeScan();return _trip12(d,dst)};
const _draw12=draw;
draw=function(){poeScan();_draw12();
 cv.querySelectorAll('g[data-id]').forEach(g=>{const d=dv(g.dataset.id);if(!d||!d.nopwr)return;g.style.opacity='.55';
  g.insertAdjacentHTML('beforeend',`<text x="${d.x}" y="${d.y-27}" text-anchor="middle" font-size="10" font-weight="600" fill="var(--er)">нет питания PoE</text>`)})};
// --- видеопотоки камер в графике нагрузки ---
const _sl12=steadyLoad;
steadyLoad=function(){const o=_sl12();QUIET++;const pk0={...PK};
 try{S.devs.filter(n=>n.k==='nvr').forEach(n=>{const ip=srcIp(n);if(!ip)return;(n.cams||[]).forEach(nm_=>{const c=byNm(nm_);if(!c||c.nopwr)return;const r=trip(c,ip);if(!r.ok)return;legsOf(EX.filter(x=>!x.rep&&!x.err)).forEach(k=>{o[k]=(o[k]||0)+camMbit(c)})})})}
 finally{QUIET--;Object.keys(PK).forEach(k=>{if(k in pk0)PK[k]=pk0[k];else delete PK[k]})}return o};
// разрешения между зонами (минимальные привилегии)
const camState=(nvr,c)=>{if(!c)return{ok:false,msg:'камера удалена со схемы'};if(c.nopwr)return{ok:false,msg:'нет питания: порт PoE выключен, бюджет исчерпан или коммутатор без PoE (power adapter — внешний адаптер)'};
 const ip=srcIp(c);if(!ip)return{ok:false,msg:'у камеры нет IP-адреса'};const nip=srcIp(nvr);if(!nip)return{ok:false,msg:'у регистратора нет IP-адреса'};
 QUIET++;try{const R=l4(nvr,ip,'tcp',554);return{ok:R.ok,msg:R.ok?'поток RTSP идёт':R.msg.replace(/^[✔✖◷]\s*/,'')}}finally{QUIET--}};
draw();side();


// ================= v12: расширение консоли =================
// [команда, синтаксис, что делает, зачем (теория), пример, категория]
const CMDS=[
['ipconfig','ipconfig','Показывает IP-адрес, маску, шлюз, MAC, DNS, IPv6 всех интерфейсов','Первый шаг диагностики: убедиться, что у узла вообще есть адрес и он из нужной подсети. Адрес 169.254.x.x означает, что DHCP не ответил.','ipconfig','Настройка'],
['ip','ip [интерфейс] <ip> <маска|/N>','Задаёт IP-адрес интерфейсу (ip none — сбросить)','Адрес + маска определяют подсеть: узел считает «своими» только адреса из неё, остальные отправляет шлюзу.','ip eth0 192.168.1.10 /24','Настройка'],
['gateway','gateway <ip>','Шлюз по умолчанию (ПК)','Куда отправлять пакеты для чужих подсетей. Шлюз обязан быть из той же подсети, что и узел.','gateway 192.168.1.1','Настройка'],
['dns','dns <ip>','Адрес DNS-сервера узла','Нужен, чтобы ping, curl и connect понимали имена.','dns 192.168.1.2','Настройка'],
['dnsrec','dnsrec <имя> <ip>','Делает узел DNS-сервером и добавляет запись A','Простейшая модель DNS-зоны: имя → адрес.','dnsrec web.lab 10.0.0.5','Настройка'],
['dhcp','dhcp  |  dhcp <интерфейс> <первый_ip> <число>','На клиенте — получить адрес; на роутере/сервере — создать пул','Клиент рассылает Discover; сервер отвечает Offer/Ack. Пул — диапазон адресов, который сервер выдаёт.','dhcp gi0/0 192.168.1.100 50','Настройка'],
['route','route | route add <сеть> <маска|/N> <шлюз> | route del <сеть>','Таблица маршрутов, добавление и удаление статических маршрутов','Маршрутизатор выбирает запись с самым длинным совпавшим префиксом; без записи пакет отбрасывается.','route add 10.2.0.0 /24 10.0.12.2','Маршрутизация'],
['rip','rip on|off','Включает протокол RIP','Distance Vector: обмен таблицами с соседями, метрика — число переходов (макс. 15).','rip on','Маршрутизация'],
['ospf','ospf on|off | ospf cost <интерфейс> <стоимость>','Включает OSPF и задаёт стоимость интерфейса','Link State: все знают карту сети и считают кратчайший путь (Дейкстра). Путь с меньшей суммой cost побеждает.','ospf cost gi0/1 10','Маршрутизация'],
['nat','nat <внешний интерфейс> on|off','Включает трансляцию адресов на внешнем интерфейсе','Скрывает частные адреса за одним внешним (PAT).','nat gi0/1 on','Маршрутизация'],
['acl','acl permit|deny <сеть/N|any> <сеть/N|any> [tcp|udp <порт>] | acl | acl clear','Правила фильтрации маршрутизатора','Правила проверяются сверху вниз до первого совпадения; ставьте частные выше общих.','acl deny 10.0.1.0/24 10.0.2.0/24 tcp 22','Безопасность'],
['ping','ping <узел|ip>','Проверка связности (ICMP echo) с анимацией через send','Проверяет весь путь туда и обратно: маршруты, ARP, ACL, живость узла.','ping 10.0.0.2','Диагностика'],
['tracert','tracert <узел|ip>','Показывает маршрутизаторы на пути','Использует TTL: каждый маршрутизатор уменьшает его, при 0 отвечает ICMP Time Exceeded.','tracert 8.8.8.8','Диагностика'],
['send','send <узел|ip>','Пакет с анимацией и пошаговым разбором','Показывает, как кадр проходит каждый узел и где останавливается.','send Server1','Диагностика'],
['arp','arp','ARP-таблица (какие MAC известны узлу)','ARP сопоставляет IP и MAC в одной подсети. Нет ответа — нет связи на L2.','arp','Диагностика'],
['nslookup','nslookup <имя>','Разрешение имени через DNS','Проверяет, что DNS доступен и знает имя.','nslookup web.lab','Диагностика'],
['connect','connect <узел> <служба|порт> [tcp|udp]','Подключение к службе (TCP-рукопожатие или UDP)','Проверка уровня L4: порт открыт, закрыт (RST) или фильтруется (тишина).','connect Server http','Диагностика'],
['curl','curl [http://|https://]<узел>[:порт]','HTTP-запрос к узлу','Проверка веб-службы целиком: сеть + порт + служба.','curl web.lab','Диагностика'],
['scan','scan <узел> [common | 1-200 | 22,80]','Сканирование TCP-портов','Разведка: какие службы доступны. Результат: открыт / закрыт / фильтруется.','scan 10.0.0.5','Диагностика'],
['netstat','netstat','Слушающие порты и соединения узла','Показывает, какие службы запущены и кто к ним подключён.','netstat','Диагностика'],
['service','service add <служба|порт> | service del <…>','Запускает/останавливает службу на узле','Порт открыт только если на нём слушает служба.','service add http','Службы'],
['block','block <tcp|udp> <порт>  |  unblock …','Брандмауэр узла: молча отбрасывать порт','Локальный firewall: пакет доходит до узла, но порт «фильтруется».','block tcp 80','Безопасность'],
['zone','zone <интерфейс> inside|dmz|outside','Зона безопасности интерфейса (межсетевой экран)','inside доверенная, dmz — публичные серверы, outside — Интернет.','zone gi0/0 outside','Безопасность'],
['publish','publish <tcp|udp> <порт>  |  unpublish …','Разрешает порт из outside в dmz','Публикация службы наружу — только то, что нужно.','publish tcp 443','Безопасность'],
['tunnel','tunnel <local_ip> <remote_ip> gre|ipsec [ключ]','Создаёт туннель VPN','GRE — просто туннель; IPsec — с шифрованием, требует совпадения ключей.','tunnel 198.51.100.1 203.0.113.1 ipsec k1','Безопасность'],
['syslog','syslog [N]','Журнал событий безопасности','Центральный журнал — основа расследований.','syslog 30','Безопасность'],
['netflow','netflow [узел|clear]','Статистика потоков','Кто с кем и сколько общался; помогает найти аномалии.','netflow','Диагностика'],
['diag','diag [узел|ip]','Автодиагностика выбранного узла «снизу вверх»','Показывает, на каком уровне ломается: питание → канал → IP → шлюз → цель → DNS.','diag Server1','Диагностика'],
['iperf','iperf <узел|ip> [-u] [-t сек]','Измерение пропускной способности до узла','Узким местом пути является самый медленный линк (скорость порта, тип и длина кабеля, Wi‑Fi, загрузка другими потоками). TCP ограничен ещё окном: окно/RTT.','iperf Server1','Диагностика'],
['nc','nc <узел> <порт>','Подключение к порту TCP (netcat)','Универсальная проверка порта: то же, что connect.','nc 10.0.0.5 5432','Диагностика'],
['nmap','nmap <узел> [порты]','Алиас scan','Разведка портов.','nmap 10.0.0.5','Диагностика'],
['inventory','inventory','Список всех устройств: тип, адреса, MAC, состояние','Инвентаризация сети — основа документации.','inventory','Обзор'],
['links','links','Список кабелей: порты, тип, длина, скорость, состояние','Физическая топология и ограничения среды.','links','Обзор'],
['find','find <имя|ip|mac>','Поиск устройства на схеме','Быстро находит и подсвечивает узел.','find 10.0.0.5','Обзор'],
['addrtable','addrtable','Таблица адресации (для отчёта и печати)','Документация сети: устройство, интерфейс, IP/маска, шлюз.','addrtable','Обзор'],
['on','on <устройство> <команда>','Выполнить команду на другом устройстве, не переключая выбор','Удобно для проверок «со стороны» без кликов по схеме.','on PC1 ping 10.0.0.2','Обзор'],
['select','select <устройство>','Выбрать устройство из консоли','Консоль работает от имени выбранного устройства.','select R1','Обзор'],
['history','history','История введённых команд (↑ ↓ — перебор, Tab — дополнение)','Повторять команды быстрее.','history','Обзор'],
['man','man <команда>   |   help <команда>   |   help all','Описание команды: синтаксис, смысл, теория и пример','Чтобы не просто вводить команды, а понимать, зачем они.','man iperf','Обзор'],
['addcam','addcam <камера|ip>  |  delcam <камера>  |  cams','Видеорегистратор: подключение камер и состояние потоков','NVR сам обращается к камере по RTSP (TCP/554). Нет потока — смотрите питание PoE, IP, маршрут, ACL.','addcam Cam1','Видеонаблюдение'],
['storage','storage  |  disk <ТБ>','Расчёт глубины архива видеорегистратора','Глубина = ёмкость диска / суммарный битрейт камер. H.265 вдвое экономнее H.264.','storage','Видеонаблюдение'],
['res','res 720p|1080p|4mp|4k  ·  codec h264|h265  ·  power poe|adapter','Параметры камеры и тип питания','Разрешение и кодек определяют битрейт; PoE-камера без PoE-порта не включится.','res 4mp','Видеонаблюдение'],
['poe','poe | poe budget <Вт> | poe off|on <порт>','Питание по Ethernet: расход по портам, бюджет, отключение порта','Сумма потребления потребителей PoE не должна превышать бюджет коммутатора.','poe','Видеонаблюдение'],
['db','db | db engine pgsql|mysql|mssql | db listen any|local | db user add <логин> <пароль> [откуда] | db user del <логин> | db create <имя>','Настройка сервера СУБД','СУБД принимает клиентов на порт (5432/3306/1433). listen local — слушает только сам сервер; «откуда» — кому разрешён вход (any, IP или сеть/N).','db user add web s3cret 172.16.0.0/24','СУБД'],
['sql','sql <pgsql|mysql|mssql> <сервер> <логин> <пароль> [запрос]','Клиент СУБД: подключение, вход, запрос','Показывает цепочку: сеть → порт → доступ по адресу → пароль → запрос. На каждом шаге своя ошибка.','sql pgsql 10.0.1.5 app secret SELECT version()','СУБД'],
['share','share add <имя> [кому]  |  shares','Общие папки NAS','Доступ к папке ограничивается адресом клиента.','share add docs 10.0.1.0/24','СУБД'],
['mount','mount <узел> <папка>','Подключение сетевой папки (SMB/445)','Проверка: сеть → порт 445 → папка → право доступа.','mount NAS1 docs','СУБД'],
['register','register <АТС> <номер>  ·  call <номер>','IP-телефония: регистрация телефона на АТС и звонок','SIP (UDP/5060) — сигнализация через АТС; голос RTP идёт напрямую между телефонами в обе стороны.','register PBX1 101','Телефония'],
['allow','allow <из_зоны> <в_зону> <tcp|udp|icmp> <порт> | allow list | allow del <N>','Разрешение между зонами межсетевого экрана','По умолчанию dmz → inside запрещено; открывают только нужный порт (минимальные привилегии).','allow dmz inside tcp 5432','Безопасность']
];
const CMDNAMES=[...new Set([...CMDS.map(c=>c[0]),'help','clear','hostname','ping6','ifconfig','traceroute','dig','host','mysql','psql','sqlcmd','call','delcam','cams','disk','codec','power','unblock','unpublish','shares','whoami','date','topology','ssh','telnet','wget','jobs','every','stopall','show','shutdown','portsec','ssid','wifi','snooping','trust','dai','bpduguard','storm','arpspoof','forward','slaac','route6','ip6','gateway6','v6route','acl6','netflow','dot1x','radius','snmp','snmpget','snmpwalk','svi','helper','speed','channel','stp'])].sort();
function manText(n){const c=CMDS.find(x=>x[0]===n||x[1].split(/[\s|]/)[0]===n);if(!c)return null;
 return `${c[0].toUpperCase()}  —  ${c[2]}\n  Синтаксис: ${c[1]}\n  Зачем:     ${c[3]}\n  Пример:    ${c[4]}`}
function helpAll(){const g={};CMDS.forEach(c=>(g[c[5]]=g[c[5]]||[]).push(c));
 return Object.keys(g).map(k=>`── ${k} ──\n`+g[k].map(c=>`  ${c[0].padEnd(10)} ${c[2]}`).join('\n')).join('\n')+'\n\nПодробности: man <команда>. Несколько команд в строке: ip eth0 10.0.0.1 /24 ; gateway 10.0.0.254. Выполнить на другом устройстве: on PC1 ping 10.0.0.2. Tab — дополнение, ↑ ↓ — история.'}
// --- вспомогательные функции для команд ---
const rv=(d,h)=>{if(ip2n(h)!=null||(typeof isV6==='function'&&isV6(h)))return h;const t=byNm(h);if(t&&srcIp(t)){p(`(узел «${t.name}» найден на схеме: ${srcIp(t)}; в реальной сети имя разрешил бы DNS)`);return srcIp(t)}return resolve(d,h)};
function pathLinks(d,ip){QUIET++;try{const r=trip(d,ip);if(!r.ok)return{ok:false,r};return{ok:true,r,keys:legsOf(EX.filter(x=>!x.rep&&!x.err))}}finally{QUIET--}}
const keyName=k=>{if(k[0]==='k'){const l=S.links.find(x=>'k'+x.id===k);if(!l)return k;const A=dv(l.a),B=dv(l.b);return A&&B?`${A.name}–${B.name}`:k}const c=dv(k.slice(1));return c?`Wi‑Fi ${c.name}`:k};
function capOfAny(k,steady){if(k[0]==='k')return capOfKey(k)||1000;const c=dv(k.slice(1));if(!c)return 72;const i=c.ifaces.findIndex(g=>g.wifi&&g.ssid),f=c.ifaces[i],ap=f&&apOf(c,f),b=ap&&wband(ap,c);return b==='5'?300:72}
function iperf(d,host,udp,t){const ip=rv(d,host);if(!ip)return;const pl=pathLinks(d,ip);
 if(!pl.ok){const e=lastErr();return p('✖ iperf: сервер недоступен — '+(e?e.x:'нет маршрута'))}
 if(!pl.keys.length)return p('Узел находится на этом же устройстве или путь не содержит линков: измерять нечего.');const dev=devByIp(ip),steady=steadyLoad();let min=Infinity,bn='',rows=[];
 pl.keys.forEach(k=>{const cap=capOfAny(k),use=steady[k]||0,av=Math.max(.1,cap-use);rows.push(`   ${keyName(k).padEnd(22)} ${String(cap).padStart(5)} Мбит/с, занято потоками ${use.toFixed(1)} → свободно ${av.toFixed(1)}`);if(av<min){min=av;bn=keyName(k)}});
 const hops=Math.max(1,pl.keys.length),rtt=hops*.5*2,win=65535*8/(rtt/1000)/1e6,tcpv=Math.min(min*.94,win);
 p(`iperf ${udp?'UDP':'TCP'}: ${d.name} → ${dev?dev.name:ip} (${ip}), ${t} с`);p(`Путь по линкам (${hops}):\n`+rows.join('\n'));
 if(udp){const off=100,got=Math.min(off,min*.96),loss=Math.max(0,(off-got)/off*100);p(`Отправлено: ${off} Мбит/с. Принято: ${got.toFixed(1)} Мбит/с, потери ${loss.toFixed(1)} %`);p(loss>1?`UDP не имеет контроля перегрузки: всё, что не вместилось в «узкое место» (${bn}), потеряно. Для голоса и видео это слышно сразу.`:'Потерь нет: линки пути вместили поток.')}
 else{p(`Результат: ≈ ${tcpv.toFixed(1)} Мбит/с (узкое место: ${bn}, свободно ${min.toFixed(1)} Мбит/с; предел окна TCP 64 КБ при RTT ≈ ${rtt.toFixed(1)} мс — ${win.toFixed(0)} Мбит/с)`);
  p(tcpv<min*.9?'Скорость ограничена окном TCP, а не каналом: масштабирование окна или меньший RTT поднимут её.':'Скорость ограничена самым медленным линком. Улучшите его (скорость порта, кабель Cat6a/оптика, EtherChannel) или разгрузите потоки.')}}
function diag(d,tg){const L=[],ok=m=>L.push('✔ '+m),bad=(m,f)=>{L.push('✖ '+m);if(f)L.push('   ➜ '+f);return 1};
 QUIET++;try{L.push(`Диагностика ${d.name} (снизу вверх: питание → канал → адрес → шлюз → цель → DNS):`);
 if(d.t==='sw'){const up=d.ifaces.filter((f,i)=>peer(d,i)).length;L.push(`  Коммутатор: портов с линком ${up} из ${d.ifaces.length}. Проверьте VLAN/trunk (show), STP, port security, err-disabled порты.`);return p(L.join('\n'))}
 if(d.nopwr)return p(L.concat('✖ Нет питания: камере нужен PoE-порт с достаточным бюджетом или внешний адаптер.','   ➜ Подключите к коммутатору PoE, проверьте poe, либо power adapter.').join('\n'));
 const nics=d.ifaces.map((f,i)=>({f,i})).filter(x=>!x.f.radio);const up=nics.filter(x=>peer(d,x.i)&&!x.f.off);
 if(!up.length){const w=nics.find(x=>x.f.wifi&&x.f.ssid);bad('нет рабочего канала: ни один интерфейс не подключён к сети',nics.some(x=>x.f.off)?'интерфейс выключен — no shutdown <интерфейс>':w?'Wi‑Fi: '+wifiWhy(d,w.i):'проверьте кабель, порт на другом конце, длину кабеля и тип, питание');return p(L.join('\n'))}
 ok('канал есть: '+up.map(x=>x.f.n+' → '+peer(d,x.i).d.name).join(', '));
 const ip=srcIp(d);
 if(d.t==='rt'){const ifs=d.ifaces.filter(f=>f.ip&&!f.radio);ifs.length?ok('интерфейсы с адресами: '+ifs.map(f=>f.n+' '+f.ip).join(', ')):bad('на маршрутизаторе нет ни одного адреса','ip gi0/0 <ip> <маска>');
  const rt=(d.routes||[]).length;L.push((rt?'✔ ':'• ')+`статических маршрутов: ${rt}${d.rip?', RIP вкл.':''}${d.ospf?', OSPF вкл.':''}`);
  if(tg){const tip=rv(d,tg);if(tip){const r=trip(d,tip);r.ok?ok(`${tip} достижим`):bad(`${tip} недостижим: ${(lastErr()||{}).x||'нет маршрута'}`,(lastErr()||{}).fix)}}return p(L.join('\n'))}
 if(!ip)return p(L.concat(bad('IP-адрес не задан','ip eth0 <ip> <маска> или dhcp')).join('\n'));
 const f=d.ifaces.find(g=>g.ip);ip.startsWith('169.254.')?bad(`адрес ${ip} — APIPA: DHCP не ответил`,'проверьте VLAN, DHCP-пул, helper, DHCP snooping'):ok(`IP ${ip}/${f.mask?plen(f.mask):'?'}`);
 if(d.gw){same(d.gw,ip,f.mask)?ok(`шлюз ${d.gw} из той же подсети`):bad(`шлюз ${d.gw} НЕ из подсети ${ip}/${plen(f.mask)}`,'шлюз должен быть из подсети узла');
  const g=trip(d,d.gw);g.ok?ok('шлюз отвечает'):bad('шлюз не отвечает: '+((lastErr()||{}).x||''),(lastErr()||{}).fix)}else L.push('• шлюз не задан — доступна только своя подсеть');
 let tip=null;if(tg)tip=rv(d,tg);else{const o=S.devs.find(x=>x!==d&&srcIp(x));tip=o&&srcIp(o)}
 if(tip){const r=trip(d,tip),e=lastErr();r.ok?ok(`цель ${tip} достижима (туда и обратно)`):bad(`цель ${tip} недостижима: ${e?e.x:'нет ответа'}`,e&&e.fix)}
 if(d.dns){const r=trip(d,d.dns);r.ok?ok(`DNS ${d.dns} доступен`):bad(`DNS ${d.dns} недоступен`,'проверьте маршрут до DNS-сервера')}
 const bads=L.filter(x=>x[0]==='✖').length;L.push(bads?`Итог: найдено проблем — ${bads}. Исправляйте сверху вниз: нижний уровень ломает всё выше.`:'Итог: проблем не найдено.');p(L.join('\n'))}
 finally{QUIET--}}
function inventory(){const r=S.devs.map(d=>{const c=CAT[kind(d)]||{l:d.t};const ips=d.ifaces.filter(f=>f.ip).map(f=>f.ip+(f.mask?'/'+plen(f.mask):'')).join(', ')||'—';return`${d.name.padEnd(10)} ${c.l.replace(/ \(.*$/,'').padEnd(24)} ${ips.padEnd(34)} ${d.mac}${d.nopwr?'  [нет питания]':''}${d.off?'  [выкл]':''}`});return r.join('\n')||'Схема пуста'}
function linksText(){const r=S.links.map(l=>{const A=dv(l.a),B=dv(l.b);if(!A||!B)return'';const c=CABLE[l.ct||'cat5e']||CABLE.cat5e,sp=capOfKey('k'+(l.id=l.id||rid()));return`${(A.name+' '+A.ifaces[l.ai].n).padEnd(16)} ⇄ ${(B.name+' '+B.ifaces[l.bi].n).padEnd(16)} ${c.l.padEnd(22)} ${String(l.len||10).padStart(5)} м  ${String(sp).padStart(6)} Мбит/с  ${l.bad?'✖ '+l.bad:'ok'}`}).filter(Boolean);return r.join('\n')||'Кабелей нет'}
function addrRows(){const o=[];S.devs.forEach(d=>d.ifaces.forEach(f=>{if(f.radio&&!f.ip)return;if(!f.ip&&!f.ip6&&d.t==='sw')return;o.push({d:d.name,i:f.n,ip:f.ip||'',m:f.mask?'/'+plen(f.mask):'',gw:d.t==='pc'?(d.gw||''):'',v6:f.ip6?f.ip6+'/'+(f.p6||64):'',v:d.t==='sw'?'':(f.svi?'VLAN '+f.svi:'')})}));return o}
function addrHtml(){const r=addrRows();return`<h3>Таблица адресации</h3><p class="mt">Документация сети: так обычно оформляют отчёт по лабораторной работе. Кнопка «Печать» — только эта таблица.</p><table class="t" id="addr_t"><tr><th>Устройство</th><th>Интерфейс</th><th>IPv4</th><th>Маска</th><th>Шлюз</th><th>IPv6</th></tr>${r.map(x=>`<tr><td>${esc(x.d)}</td><td>${esc(x.i)}</td><td>${x.ip||'—'}</td><td>${x.m||'—'}</td><td>${x.gw||'—'}</td><td>${x.v6||'—'}</td></tr>`).join('')||'<tr><td colspan="6">Нет адресов</td></tr>'}</table><p><button data-x="ad_print">Печать</button> <button data-x="ad_csv">CSV</button></p><div id="addr_x"></div>`}
// --- СУБД / NAS / телефония ---
function sqlRun(d,a){const[eng,host,u,pw,...qq]=a;if(!DBP[eng]||!host||!u||pw==null)return p('Использование: sql <pgsql|mysql|mssql> <сервер> <логин> <пароль> [запрос]   (пример: sql pgsql 10.0.1.5 app secret SELECT version())');
 const ip=rv(d,host);if(!ip)return;const R=l4(d,ip,'tcp',DBP[eng]);const st=EX.slice();p(`${d.name}: подключение к ${DBN[eng]} на ${ip}:${DBP[eng]}`);
 if(!R.ok){p(R.msg);const dev=R.r&&R.r.a?R.r.a.d:null;if(R.state==='closed'&&dev){if(dev.k==='db'&&dev.dbl==='local')p('  ➜ СУБД слушает только 127.0.0.1 (bind-address / listen_addresses). На сервере: db listen any — и ограничьте доступ db user … <откуда>.');else if(dev.k==='db')p(`  ➜ На ${dev.name} работает ${DBN[dev.dbe]} (порт ${DBP[dev.dbe]}), а вы подключаетесь как к ${DBN[eng]}.`);else p('  ➜ Это не сервер СУБД или служба не запущена.')}else if(R.state==='denied'||R.state==='filtered')p('  ➜ Порт закрыт фильтром: проверьте ACL, зоны (allow …) и брандмауэр узла.');return}
 const dev=R.r.a.d;if(!dev.dbu){p('Порт открыт, но служба не отвечает как СУБД (учебная модель: используйте узел «Сервер СУБД»).');return}
 const cip=srcIp(d),acc=dev.dbu.find(x=>x.u===u);const fromOk=x=>!x||x==='any'||(x.includes('/')?(()=>{const n=net(x);return n&&same(cip,n.n,n.m)})():x===cip);
 const fail=(m,why)=>{dev.fails=(dev.fails||0)+1;p('✖ '+m);if(why)p('  ➜ '+why);sec('⚠',`СУБД ${dev.name}: неудачный вход ${u}@${cip}${dev.fails>=5?` — ${dev.fails} неудач подряд: подбор пароля (brute force)`:''}`,[dev.id,d.id])};
 if(acc&&!fromOk(acc.from)){const ms={pgsql:`FATAL: no pg_hba.conf entry for host "${cip}", user "${u}", database "${(dev.dbs||[])[0]||'postgres'}"`,mysql:`ERROR 1130 (HY000): Host '${cip}' is not allowed to connect to this MySQL server`,mssql:`Login failed for user '${u}'. Клиентский адрес ${cip} не разрешён`};
  return fail(ms[eng],`Сеть и порт в порядке, но учётная запись «${u}» разрешена только с «${acc.from}». Правка: db user add ${u} <пароль> <откуда> (принцип наименьших привилегий — не any).`)}
 if(!acc||acc.pw!==pw){const ms={pgsql:`FATAL: password authentication failed for user "${u}"`,mysql:`ERROR 1045 (28000): Access denied for user '${u}'@'${cip}' (using password: YES)`,mssql:`Msg 18456: Login failed for user '${u}'.`};return fail(ms[eng],acc?'Неверный пароль.':`Учётной записи «${u}» нет. Создайте: db user add ${u} <пароль> [откуда].`)}
 if(dev.dbe!==eng){return p('Служба на этом порту — другой СУБД.')}
 p(`✔ Аутентификация пройдена (${u}@${dev.name}). Сеть, порт, доступ по адресу и пароль — всё верно.`);
 const q=qq.join(' ').replace(/^["']|["']$/g,'').trim(),lq=q.toLowerCase().replace(/;$/,'');
 if(!q)return p('Сессия открыта и закрыта (запрос не задан).');
 if(/^select\s+version\(\)/.test(lq))return p(DBV[eng]);
 if(/^select\s+(now\(\)|current_timestamp|getdate\(\))/.test(lq))return p(new Date().toISOString().replace('T',' ').slice(0,19));
 if(/^select\s+1$/.test(lq))return p('?column?\n   1\n(1 строка)');
 if(/^(show databases|\\l|select name from sys\.databases)/.test(lq))return p('Базы данных:\n  '+(dev.dbs||[]).join('\n  '));
 const cd=/^create database\s+([a-z0-9_]+)/.exec(lq);if(cd){(dev.dbs=dev.dbs||[]).push(cd[1]);ch();return p('CREATE DATABASE — выполнено')}
 p('Запрос принят. (Учебная модель понимает: SELECT version(), SELECT now(), SELECT 1, SHOW DATABASES, CREATE DATABASE <имя>.)')}
function mountRun(d,host,sh){if(!host||!sh)return p('Использование: mount <узел> <папка>');const ip=rv(d,host);if(!ip)return;const R=l4(d,ip,'tcp',445);p(`${d.name}: подключение к ${ip}:445 (SMB)`);if(!R.ok){p(R.msg);return}
 const dev=R.r.a.d,s=(dev.shares||[]).find(x=>x.n.toLowerCase()===sh.toLowerCase());if(!s)return p(`✖ Сетевой путь не найден: на ${dev.name} нет папки «${sh}».${(dev.shares||[]).length?' Есть: '+dev.shares.map(x=>x.n).join(', '):''}`);
 const cip=srcIp(d),okf=!s.from||s.from==='any'||(()=>{const n=net(s.from);return n&&same(cip,n.n,n.m)})();if(!okf){sec('⚠',`NAS ${dev.name}: отказано в доступе к «${s.n}» для ${cip}`,[dev.id,d.id]);return p(`✖ Отказано в доступе: папка «${s.n}» разрешена только для ${s.from}.`)}
 p(`✔ Папка \\\\${dev.name}\\${s.n} подключена`)}
function pbxFor(d,host){const ip=rv(d,host);if(!ip)return null;const dev=devByIp(ip);return{ip,dev}}
function regRun(d,host,ext){if(!host||!ext)return p('Использование: register <АТС> <номер>   (пример: register PBX1 101)');const x=pbxFor(d,host);if(!x)return;const R=l4(d,x.ip,'udp',5060);
 if(!R.ok){p(`✖ REGISTER не дошёл до АТС: ${R.msg.replace(/^[✔✖◷]\s*/,'')}`);return}const pbx=x.dev;if(!pbx||!pbx.reg)return p('На этом адресе нет АТС (добавьте «IP-АТС»).');
 if(pbx.reg[ext]&&pbx.reg[ext]!==d.id)return p(`✖ Номер ${ext} уже зарегистрирован на другом телефоне.`);pbx.reg[ext]=d.id;d.ext=ext;d.pbx=pbx.id;addSvc(d,{p:'udp',n:16384});ch();p(`✔ ${d.name}: REGISTER → 200 OK, номер ${ext} зарегистрирован на ${pbx.name} (SIP, UDP/5060)`)}
function callRun(d,ext){if(!d.ext||!d.pbx)return p('Сначала зарегистрируйтесь: register <АТС> <номер>');const pbx=dv(d.pbx);if(!pbx)return p('АТС удалена');if(!ext)return p('Использование: call <номер>');const cid=pbx.reg&&pbx.reg[ext],callee=cid&&dv(cid);
 if(!callee)return p(`✖ Номер ${ext} не зарегистрирован на ${pbx.name}: абонент недоступен (в SIP — ответ 404 Not Found).`);
 const pip=srcIp(pbx),a=srcIp(d),b=srcIp(callee);QUIET++;let r1,r2,r3,r4;try{r1=l4(d,pip,'udp',5060);r2=trip(pbx,b);addSvc(callee,{p:'udp',n:16384});addSvc(d,{p:'udp',n:16384});r3=l4(d,b,'udp',16384);r4=l4(callee,a,'udp',16384)}finally{QUIET--}
 p(`Звонок ${d.name} (${d.ext}) → ${callee.name} (${ext}) через ${pbx.name}:`);
 p((r1.ok?'✔':'✖')+' INVITE: телефон → АТС (UDP/5060)'+(r1.ok?'':' — '+r1.msg));if(!r1.ok)return;
 p((r2.ok?'✔':'✖')+` INVITE: АТС → ${callee.name}`+(r2.ok?'':' — вызываемый телефон недоступен для АТС'));if(!r2.ok)return;
 p((r3.ok?'✔':'✖')+` Голос (RTP UDP/16384): ${d.name} → ${callee.name}`+(r3.ok?'':' — '+r3.msg));p((r4.ok?'✔':'✖')+` Голос (RTP UDP/16384): ${callee.name} → ${d.name}`+(r4.ok?'':' — '+r4.msg));
 if(r3.ok&&r4.ok)p('✔ Разговор установлен, звук в обе стороны. Для качества голоса нужен QoS (приоритет DSCP EF) и малые потери: проверьте iperf -u.');
 else if(r3.ok||r4.ok)p('⚠ Односторонняя слышимость: сигнализация прошла через АТС, а один из потоков голоса блокируется (ACL, межсетевой экран, NAT или маршрут в одну сторону). Классический симптом: «я вас слышу, а вы меня нет».');
 else p('✖ Сигнализация есть, голоса нет: медиапоток (RTP) между телефонами не проходит — проверьте маршруты и фильтры для UDP.')}


// ================= v12: обработчик команд =================
const _run12=run;
const execOn=(d,c)=>{const old=sel;sel=d.id;try{run(c)}finally{sel=old}};
const FIRSTCAM=(nvr)=>S.devs.find(x=>x.k==='cam'&&!(nvr.cams||[]).includes(x.name));
run=function(c){const s=c.trim();if(!s)return _run12(c);
 if(s.includes(';')&&!/["']/.test(s)){s.split(';').map(x=>x.trim()).filter(Boolean).forEach((x,i)=>{if(i)p(`${sel&&dv(sel)?dv(sel).name:''}> ${x}`);run(x)});return}
 const a=s.split(/\s+/),cm=a[0].toLowerCase(),d=sel&&dv(sel),K=d?kind(d):'';
 const need=()=>{if(!d){p('Выберите устройство на схеме или командой select <имя>');return true}return false};
 if(cm==='on'){const t=byNm(a[1]);if(!t||a.length<3)return p('Использование: on <устройство> <команда>   (пример: on PC1 ping 10.0.0.2)');return execOn(t,a.slice(2).join(' '))}
 if(cm==='select'){const t=byNm(a[1]);if(!t)return p('Нет такого устройства. Список: inventory');sel=t.id;side();draw();return p('Выбрано: '+t.name)}
 if(cm==='man'||cm==='commands'||(cm==='help'&&a[1])){if(cm==='commands'||a[1]==='all')return p(helpAll());const t=manText((a[1]||'').toLowerCase());return p(t||(a[1]?`Для «${a[1]}» нет описания. Все команды: help all`:'Использование: man <команда>'))}
 if(cm==='help'){_run12(c);return p('\nЕщё: help all — все команды по категориям; man <команда> — зачем и как; diag — автодиагностика; iperf — скорость; inventory, links, find — обзор схемы.')}
 const AL={ifconfig:'ipconfig',traceroute:'tracert',tracepath:'tracert',mtr:'tracert',dig:'nslookup',host:'nslookup',mysql:'sql mysql',psql:'sql pgsql',sqlcmd:'sql mssql'};
 if(AL[cm])return run(AL[cm]+(a.length>1?' '+a.slice(1).join(' '):''));
 if(cm==='ip'&&['a','addr','address','link'].includes((a[1]||'').toLowerCase())&&a.length<=3)return run('ipconfig');
 if(cm==='ip'&&['r','route'].includes((a[1]||'').toLowerCase())&&a.length<=3)return run('route');
 if(cm==='ip'&&['n','neigh','neighbor'].includes((a[1]||'').toLowerCase())&&a.length<=3)return run('arp');
 if(cm==='nmap'||cm==='nc'||cm==='ncat'||cm==='netcat'){const r=a.slice(1).filter(x=>!x.startsWith('-'));return run((cm==='nmap'?'scan ':'connect ')+r.join(' '))}
 if(cm==='history')return p(hist.slice(-40).map((x,i,ar)=>`${String(hist.length-ar.length+i+1).padStart(4)}  ${x}`).join('\n')||'История пуста');
 if(cm==='whoami')return p('student@stacktoniya'+(d?` (устройство: ${d.name})`:''));
 if(cm==='date')return p(new Date().toLocaleString('ru-RU'));
 if(cm==='inventory'||cm==='devices')return p(inventory());
 if(cm==='links')return p(linksText());
 if(cm==='find'){const q=(a[1]||'').toLowerCase();if(!q)return p('Использование: find <имя|ip|mac>');const r=S.devs.filter(x=>x.name.toLowerCase().includes(q)||x.mac.toLowerCase().includes(q)||x.ifaces.some(f=>(f.ip||'').includes(q)||(f.ip6||'').toLowerCase().includes(q)));
  if(!r.length)return p('Ничего не найдено');p(r.map(x=>`${x.name}  ${(CAT[kind(x)]||{l:''}).l}  ${x.ifaces.filter(f=>f.ip).map(f=>f.ip).join(', ')||'—'}  ${x.mac}`).join('\n'));flash(r);return}
 if(cm==='addrtable'){const r=addrRows();return p(r.map(x=>`${x.d.padEnd(10)} ${x.i.padEnd(8)} ${(x.ip?x.ip+x.m:'—').padEnd(20)} ${x.gw?'шлюз '+x.gw:''} ${x.v6}`).join('\n')||'Адресов нет')}
 if(cm==='diag'){if(need())return;return diag(d,a[1])}
 if(cm==='iperf'){if(need())return;const h=a.slice(1).find(x=>!x.startsWith('-')&&!/^\d+$/.test(x)),ti=a.indexOf('-t');if(!h)return p('Использование: iperf <узел|ip> [-u] [-t сек]');return iperf(d,h,a.includes('-u'),ti>0&&+a[ti+1]>0?+a[ti+1]:10)}
 if(cm==='sql'){if(need())return;return sqlRun(d,a.slice(1))}
 if(cm==='mount'){if(need())return;return mountRun(d,a[1],a[2])}
 if(cm==='register'){if(need())return;return regRun(d,a[1],a[2])}
 if(cm==='call'){if(need())return;return callRun(d,a[1])}
 if(cm==='shares'&&d&&d.shares)return p(d.shares.map(x=>`${x.n}  (доступ: ${x.from||'any'})`).join('\n')||'Папок нет');
 if(cm==='share'&&d&&K==='nas'){if(a[1]!=='add'||!a[2])return p('Использование: share add <имя> [кому: any|сеть/N|ip]');const f=a[3]||'any';if(f!=='any'&&!net(f))return p('Неверное значение «кому»: any, IP или сеть/N');d.shares=d.shares||[];d.shares=d.shares.filter(x=>x.n!==a[2]);d.shares.push({n:a[2],from:f});ch();return p(`Папка «${a[2]}» создана (доступ: ${f})`)}
 // --- камеры, NVR ---
 if(cm==='res'&&K==='cam'){if(!CAMRES[a[1]])return p('Использование: res 720p|1080p|4mp|4k');d.res=a[1];ch();return p(`Разрешение ${a[1]}, битрейт ≈ ${camMbit(d)} Мбит/с`)}
 if(cm==='codec'&&K==='cam'){if(!/^h26[45]$/.test(a[1]||''))return p('Использование: codec h264|h265');d.codec=a[1];ch();return p(`Кодек ${a[1].toUpperCase()}, битрейт ≈ ${camMbit(d)} Мбит/с`)}
 if(cm==='power'&&d&&(K==='cam'||K==='ap'||K==='ipp')){if(!/^(poe|adapter)$/.test(a[1]||''))return p('Использование: power poe|adapter');d.pwr=a[1];if(a[1]==='poe')d.poeReq=true;ch();poeScan();return p(a[1]==='poe'?'Питание: PoE от коммутатора. Подключите к порту PoE-коммутатора.':'Питание: внешний адаптер (PoE не требуется).')}
 if(cm==='poe'&&d){if(!d.poeW)return p('Это не PoE-коммутатор (возьмите «Коммутатор PoE»)');poeScan();
  if(a[1]==='budget'){if(!(+a[2]>0))return p('Использование: poe budget <Вт>');d.poeW=+a[2];ch();poeScan();return p('Бюджет PoE: '+d.poeW+' Вт')}
  if(a[1]==='off'||a[1]==='on'){const f=d.ifaces.find(x=>x.n===a[2]);if(!f)return p('Использование: poe on|off <порт>');f.poeoff=a[1]==='off';ch();return p(`PoE на ${f.n} ${f.poeoff?'выключен':'включён'}`)}
  return p(`PoE: бюджет ${d.poeW} Вт, занято ${d.poeUsed||0} Вт\n`+((d.poeRows||[]).map(r=>`  ${r.p.padEnd(7)} ${r.d.padEnd(10)} ${String(r.w).padStart(3)} Вт  ${r.ok?'питание есть':'✖ бюджет исчерпан'}`).join('\n')||'  Потребителей PoE нет (камеры, точки, IP-телефоны)'))}
 if(K==='nvr'&&d){
  if(cm==='addcam'){const t=byNm(a[1])||devByIp(a[1]||'');if(!t||t.k!=='cam')return p('Использование: addcam <камера|ip>   (имя или адрес IP-камеры)');d.cams=d.cams||[];if(!d.cams.includes(t.name))d.cams.push(t.name);ch();const st=camState(d,t);return p(`Камера ${t.name} добавлена. ${st.ok?'✔ поток RTSP идёт':'✖ '+st.msg}`)}
  if(cm==='delcam'){d.cams=(d.cams||[]).filter(x=>x.toLowerCase()!==String(a[1]).toLowerCase());ch();return p('Камера удалена из регистратора')}
  if(cm==='cams'){return p(`Камеры ${d.name}:\n`+((d.cams||[]).map(n=>{const t=byNm(n),st=camState(d,t);return`  ${n.padEnd(8)} ${(t&&srcIp(t)||'—').padEnd(15)} ${t?(t.res||'1080p')+' '+(t.codec||'h264').toUpperCase():''}  ${t?camMbit(t).toFixed(1):'?'} Мбит/с  ${st.ok?'✔ '+st.msg:'✖ '+st.msg}`}).join('\n')||'  Камер нет: addcam <камера>'))}
  if(cm==='disk'){if(!(+a[1]>0))return p('Использование: disk <ТБ>');d.disk=+a[1];ch();return p('Диск: '+d.disk+' ТБ')}
  if(cm==='storage'){const cs=(d.cams||[]).map(byNm).filter(Boolean),tot=cs.reduce((s,x)=>s+camMbit(x),0);if(!cs.length)return p('Нет камер: addcam <камера>');const gbDay=tot*1e6*86400/8/1e9,days=(d.disk||4)*1000/gbDay;
   return p(`Камер: ${cs.length}, суммарный битрейт ${tot.toFixed(1)} Мбит/с\nЗапись: ${gbDay.toFixed(0)} ГБ в сутки (формула: Мбит/с × 86400 / 8 / 1000)\nДиск ${d.disk||4} ТБ → глубина архива ≈ ${days.toFixed(1)} суток${days<30?'. Для 30 суток нужно '+(gbDay*30/1000).toFixed(1)+' ТБ: уменьшите разрешение, перейдите на H.265 (вдвое меньше) или добавьте диски.':' — достаточно для архива в 30 суток.'}`)}}
 // --- СУБД ---
 if(cm==='db'&&K==='db'&&d){const sub=(a[1]||'').toLowerCase();
  if(sub==='engine'){if(!DBP[a[2]])return p('Использование: db engine pgsql|mysql|mssql');d.dbe=a[2];dbSync(d);ch();return p(`Запущена ${DBN[d.dbe]}, порт TCP/${DBP[d.dbe]}`)}
  if(sub==='listen'){if(!/^(any|local)$/.test(a[2]||''))return p('Использование: db listen any|local');d.dbl=a[2];dbSync(d);ch();return p(a[2]==='local'?'СУБД слушает только 127.0.0.1: из сети недоступна (безопасно для БД на одном сервере с приложением).':'СУБД слушает все интерфейсы: порт открыт для сети — ограничьте доступ учётными записями по адресу.')}
  if(sub==='user'){if(a[2]==='add'){if(!a[3]||!a[4])return p('Использование: db user add <логин> <пароль> [откуда: any|ip|сеть/N]');const f=a[5]||'any';if(f!=='any'&&!net(f))return p('Неверное «откуда»');d.dbu=(d.dbu||[]).filter(x=>x.u!==a[3]);d.dbu.push({u:a[3],pw:a[4],from:f});ch();return p(`Учётная запись ${a[3]} создана, разрешена с: ${f}${f==='any'?'  (слишком широко — лучше указать адрес приложения)':''}`)}
   if(a[2]==='del'){d.dbu=(d.dbu||[]).filter(x=>x.u!==a[3]);ch();return p('Учётная запись удалена')}}
  if(sub==='create'){if(!a[2])return p('Использование: db create <имя>');(d.dbs=d.dbs||[]).push(a[2]);ch();return p('База создана: '+a[2])}
  return p(`${DBN[d.dbe]}, порт TCP/${DBP[d.dbe]}, слушает: ${d.dbl==='local'?'только localhost':'сеть'}\nБазы: ${(d.dbs||[]).join(', ')||'—'}\nУчётные записи:\n`+((d.dbu||[]).map(x=>`  ${x.u}  пароль ${'*'.repeat(x.pw.length)}  доступ с: ${x.from}`).join('\n')||'  нет'))}
 // --- межсетевой экран: разрешения между зонами ---
 if(cm==='allow'&&d&&d.t==='rt'){d.zp=d.zp||[];
  if(!a[1]||a[1]==='list')return p(d.zp.map((z,i)=>`${i+1}. ${z.f} → ${z.t}: ${z.k}`).join('\n')||'Разрешений нет: по умолчанию dmz → inside, outside → inside запрещены. Пример: allow dmz inside tcp 5432');
  if(a[1]==='del'){d.zp.splice((+a[2]||0)-1,1);ch();return p('Удалено')}
  const f=a[1],t=a[2],pr=(a[3]||'').toLowerCase(),pt=pr==='icmp'?0:+a[4];
  if(!ZONES.includes(f)||!ZONES.includes(t)||f===t||!/^(tcp|udp|icmp)$/.test(pr)||(pr!=='icmp'&&!(pt>0&&pt<65536)))return p('Использование: allow <из_зоны> <в_зону> <tcp|udp|icmp> <порт>   (зоны: inside, dmz, outside; пример: allow dmz inside tcp 5432)');
  if(f==='outside'&&t==='dmz')return p('Для outside → dmz используйте publish (публикация службы).');
  d.zp.push({f,t,k:pr+'/'+pt});ch();return p(`Разрешено: ${f} → ${t}, ${pr.toUpperCase()}${pt?'/'+pt:''}. Всё остальное между этими зонами по-прежнему запрещено.`)}
 return _run12(c)};
// Tab-дополнение
$('#in').addEventListener('keydown',e=>{if(e.key!=='Tab')return;e.preventDefault();const i=e.target,v=i.value,sp=v.lastIndexOf(' '),pre=v.slice(sp+1),head=v.slice(0,sp+1);
 const pool=sp<0?CMDNAMES:S.devs.map(x=>x.name),c=pool.filter(x=>x.toLowerCase().startsWith(pre.toLowerCase()));if(!c.length)return;
 if(c.length===1){i.value=head+c[0]+' ';return}let cp=c[0];c.forEach(x=>{while(!x.toLowerCase().startsWith(cp.toLowerCase()))cp=cp.slice(0,-1)});
 if(cp.length>pre.length)i.value=head+cp;else p('  '+c.join('  '))});
// межзонные разрешения учитываются межсетевым экраном — см. правку inACL


// ================= v12: панель устройства, кнопки, задания, теория =================
document.head.insertAdjacentHTML('beforeend','<style>@media print{body>*:not(#md){display:none!important}#md{position:static!important;background:none!important;display:block!important;padding:0!important}#mb{max-height:none!important;overflow:visible!important;box-shadow:none!important;color:#000!important;background:#fff!important;max-width:none!important}#mb button,#mb p.mt{display:none!important}}.xr{display:grid;grid-template-columns:1fr auto;gap:4px;margin-top:4px}.xr input,.xr select{margin:0!important}</style>');
$('#adp').innerHTML=(()=>{let h='';for(const k in CAT){const c=CAT[k];if(c.g)h+=`<h5>${c.g}</h5>`;h+=`<button type="button" data-k="${k}">${icoSvg(k,30)}<span>${c.l}</span></button>`}return h})();
['cam','nvr','db','nas','pbx','poe'].forEach(k=>$('#ad').insertAdjacentHTML('beforeend',`<option value="${k}">${CAT[k].l}</option>`));
const _side12=side;
side=function(){_side12();const d=sel&&dv(sel);if(!d||itm(sel))return;const K=kind(d);let h='';
 const sl=(a,v,o)=>`<select data-a="${a}" style="width:100%">${o.map(([k,t])=>`<option value="${k}" ${String(v)===k?'selected':''}>${t}</option>`).join('')}</select>`;
 if(K==='cam'){const m=camMbit(d);h+=`<h4>Камера</h4><label>Разрешение${sl('x_res',d.res||'1080p',[['720p','720p (HD)'],['1080p','1080p (Full HD)'],['4mp','4 Мп'],['4k','4K (8 Мп)']])}</label><label>Кодек${sl('x_codec',d.codec||'h264',[['h264','H.264'],['h265','H.265 (вдвое экономнее)']])}</label><label>Питание${sl('x_pwr',d.pwr||'poe',[['poe','PoE от коммутатора'],['adapter','Внешний адаптер']])}</label><div class="mt">Битрейт ≈ ${m} Мбит/с · ≈ ${(m*1e6*86400/8/1e9).toFixed(0)} ГБ/сутки.</div>${d.nopwr?'<div class="mt er">Нет питания: подключите к порту PoE-коммутатора (проверьте бюджет) или выберите внешний адаптер.</div>':''}`}
 if(K==='ap'||K==='ipp')h+=`<h4>Питание</h4>${sl('x_pwr',d.pwr||'adapter',[['adapter','Внешний адаптер'],['poe','PoE от коммутатора']])}${d.nopwr?'<div class="mt er">Нет питания PoE.</div>':''}`;
 if(K==='nvr'){const cs=(d.cams||[]);h+=`<h4>Камеры регистратора</h4>`+(cs.map(n=>{const t=byNm(n),st=camState(d,t);return`<div class="rt" style="flex-wrap:wrap"><span>${esc(n)}</span><button class="xb" data-a="x_delcam" data-n="${esc(n)}">✕</button><div class="mt ${st.ok?'ok':'er'}" style="width:100%">${st.ok?'✔ ':'✖ '}${esc(st.msg)}</div></div>`}).join('')||'<div class="mt">Камер нет</div>');
  const free=S.devs.filter(x=>x.k==='cam'&&!cs.includes(x.name));h+=`<div class="xr"><select id="x_cam">${free.map(x=>`<option>${esc(x.name)}</option>`).join('')||'<option value="">нет свободных камер</option>'}</select><button class="b" data-a="x_addcam">Добавить</button></div><label>Диск, ТБ<input data-a="x_disk" value="${d.disk||4}"></label><button class="b" data-a="x_storage" style="width:100%">Рассчитать глубину архива</button>`}
 if(K==='db'){h+=`<h4>Сервер СУБД</h4><label>Тип${sl('x_dbe',d.dbe,Object.keys(DBP).map(k=>[k,DBN[k]+' ('+DBP[k]+')']))}</label><label>Слушает${sl('x_dbl',d.dbl,[['any','все интерфейсы (доступна из сети)'],['local','только localhost']])}</label><h4>Учётные записи</h4>`+(d.dbu||[]).map(x=>`<div class="rt"><span>${esc(x.u)} ← ${esc(x.from)}</span><button class="xb" data-a="x_dbudel" data-n="${esc(x.u)}">✕</button></div>`).join('')+`<div class="xr" style="grid-template-columns:1fr 1fr"><input id="x_u" placeholder="логин"><input id="x_p" placeholder="пароль"></div><div class="xr"><input id="x_f" placeholder="откуда: any, ip или сеть/N" value="any"><button class="b" data-a="x_dbuadd">Создать</button></div><div class="mt">Базы: ${esc((d.dbs||[]).join(', ')||'—')}</div>`}
 if(K==='nas'){h+=`<h4>Общие папки</h4>`+(d.shares||[]).map(x=>`<div class="rt"><span>${esc(x.n)} ← ${esc(x.from)}</span><button class="xb" data-a="x_shdel" data-n="${esc(x.n)}">✕</button></div>`).join('')+`<div class="xr"><input id="x_sn" placeholder="имя папки"><button class="b" data-a="x_shadd">Создать</button></div><input id="x_sf" placeholder="кому: any или сеть/N" value="any" style="margin-top:4px">`}
 if(K==='pbx'){h+=`<h4>Регистрации SIP</h4>`+(Object.entries(d.reg||{}).map(([e,id])=>`<div class="rt"><span>${esc(e)}</span><span>${dv(id)?esc(dv(id).name):'—'}</span></div>`).join('')||'<div class="mt">Нет. На телефоне: register '+esc(d.name)+' 101</div>')}
 if(d.poeW){poeScan();h+=`<h4>Питание PoE</h4><label>Бюджет, Вт<input data-a="x_poew" value="${d.poeW}"></label><div class="mt">Занято ${d.poeUsed||0} из ${d.poeW} Вт</div>`+(d.poeRows||[]).map(r=>`<div class="rt"><span>${r.p} ${esc(r.d)}</span><span class="${r.ok?'ok':'er'}">${r.w} Вт ${r.ok?'':'✖'}</span></div>`).join('')}
 if(d.ext)h+=`<h4>Телефония</h4><div class="mt">Номер ${esc(d.ext)} · АТС ${dv(d.pbx)?esc(dv(d.pbx).name):'—'}</div>`;
 if(d.t==='rt'&&d.ifaces.some(f=>f.zone)){h+=`<h4>Разрешения между зонами</h4>`+((d.zp||[]).map((z,i)=>`<div class="rt"><span>${z.f} → ${z.t} ${z.k}</span><button class="xb" data-a="x_zpdel" data-i="${i}">✕</button></div>`).join('')||'<div class="mt">Нет (dmz → inside запрещено)</div>')+`<div class="xr" style="grid-template-columns:1fr 1fr auto auto"><select id="z_f">${ZONES.map(z=>`<option>${z}</option>`).join('')}</select><select id="z_t">${ZONES.map((z,i)=>`<option ${i===0?'selected':''}>${z}</option>`).join('')}</select><select id="z_p"><option>tcp</option><option>udp</option></select><input id="z_n" placeholder="порт" style="width:60px"></div><button class="b" data-a="x_zpadd" style="width:100%;margin-top:4px">Разрешить</button>`}
 if(h)$('#side').insertAdjacentHTML('beforeend',h)};
$('#side').addEventListener('change',e=>{const t=e.target,a=t.dataset.a;if(!a||a[0]!=='x'||a[1]!=='_')return;const d=dv(sel);if(!d)return;const v=t.value.trim();
 if(a==='x_res')execOn(d,'res '+v);else if(a==='x_codec')execOn(d,'codec '+v);else if(a==='x_pwr')execOn(d,'power '+v);else if(a==='x_disk')execOn(d,'disk '+v);else if(a==='x_poew')execOn(d,'poe budget '+v);
 else if(a==='x_dbe')execOn(d,'db engine '+v);else if(a==='x_dbl')execOn(d,'db listen '+v)});
$('#side').addEventListener('click',e=>{const t=e.target,a=t.dataset.a;if(!a||a[0]!=='x'||a[1]!=='_')return;const d=dv(sel);if(!d)return;
 if(a==='x_addcam'){const v=$('#x_cam').value;if(v)execOn(d,'addcam '+v)}else if(a==='x_delcam')execOn(d,'delcam '+t.dataset.n);else if(a==='x_storage')execOn(d,'storage');
 else if(a==='x_dbuadd')execOn(d,`db user add ${$('#x_u').value.trim()||'user'} ${$('#x_p').value.trim()||'pass'} ${$('#x_f').value.trim()||'any'}`);else if(a==='x_dbudel')execOn(d,'db user del '+t.dataset.n);
 else if(a==='x_shadd'){const n=$('#x_sn').value.trim();if(n)execOn(d,`share add ${n} ${$('#x_sf').value.trim()||'any'}`)}else if(a==='x_shdel'){d.shares=(d.shares||[]).filter(x=>x.n!==t.dataset.n);ch()}
 else if(a==='x_zpadd')execOn(d,`allow ${$('#z_f').value} ${$('#z_t').value} ${$('#z_p').value} ${$('#z_n').value.trim()}`);else if(a==='x_zpdel')execOn(d,'allow del '+(+t.dataset.i+1))});
// кнопка «Адресация»
$('#bld').insertAdjacentHTML('afterend','<button id="baddr" title="Таблица адресации: документация и печать">Адресация</button>');
$('#baddr').onclick=()=>openMd(addrHtml());
md.addEventListener('click',e=>{const x=e.target.dataset.x;if(x==='ad_print')window.print();else if(x==='ad_csv'){const r=addrRows();$('#addr_x').innerHTML=`<textarea readonly style="width:100%;height:150px">${esc('Устройство;Интерфейс;IPv4;Маска;Шлюз;IPv6\n'+r.map(x=>[x.d,x.i,x.ip,x.m,x.gw,x.v6].join(';')).join('\n'))}</textarea>`}});
// проверка прав доступа в СУБД и NAS без вывода (для заданий)
const dbCanLogin=(c,dev)=>{const ip=srcIp(c);return(dev.dbu||[]).some(x=>x.from==='any'||(x.from.includes('/')?(()=>{const n=net(x.from);return n&&same(ip,n.n,n.m)})():x.from===ip))};
const shareAllows=(c,nas,name)=>{const s=(nas.shares||[]).find(x=>x.n.toLowerCase()===name);if(!s)return false;const ip=srcIp(c);return!s.from||s.from==='any'||(()=>{const n=net(s.from);return n&&same(ip,n.n,n.m)})()};
const nmv=n=>byNm(n);
TASKS.push(
{t:'14. Видеонаблюдение на PoE',d:'Постройте: PoE-коммутатор PoE1, две IP-камеры Cam1 и Cam2 (питание PoE) и видеорегистратор NVR1. Все в одной подсети (напр. 192.168.50.0/24: камеры .11 и .12, NVR1 .5). Добавьте камеры на регистратор: addcam Cam1, addcam Cam2. Проверка: у камер есть питание, NVR1 получает потоки RTSP (TCP/554), а глубина архива при диске 4 ТБ — не менее 30 суток (подсказка: res/codec и команда storage). Теория: PoE даёт питание по витой паре в пределах бюджета; поток = разрешение × кодек; архив = диск / битрейт.',c:[['NVR1','Cam1',1,'tcp',554],['NVR1','Cam2',1,'tcp',554]],fn:()=>{const n=nmv('NVR1');if(!n)return[false,'нет устройства NVR1'];const cs=(n.cams||[]).map(nmv).filter(Boolean);if(cs.length<2)return[false,'добавьте обе камеры на регистратор: addcam Cam1, addcam Cam2'];if(cs.some(c=>c.nopwr))return[false,'у одной из камер нет питания PoE'];const g=cs.reduce((s,c)=>s+camMbit(c),0)*1e6*86400/8/1e9,days=(n.disk||4)*1000/g;return[days>=30,`глубина архива ≈ ${days.toFixed(1)} суток${days>=30?'':' — нужно ≥ 30: уменьшите разрешение, включите H.265 или увеличьте диск'}`]}},
{t:'15. Трёхзвенная архитектура: веб + СУБД',d:'Постройте: межсетевой экран FW (зоны outside/inside/dmz), ПК PC1 (inside), веб-сервер Web (dmz, служба http), сервер СУБД DB (inside), узел Internet (outside). Публикуйте только http (publish tcp 80). Веб-серверу нужна база: откройте точечно dmz → inside порт СУБД (allow dmz inside tcp 5432) и создайте учётную запись, разрешённую только с адреса Web (db user add web секрет <ip Web>), удалите запись «app ← any». Результат: из Интернета к DB не достучаться; Web достучится до DB по 5432; вход в СУБД не открыт всем. Теория: СУБД — во внутренней сети; между зонами — минимум разрешений; учётные записи привязываются к адресу.',c:[['Internet','Web',1,'tcp',80],['Internet','DB',0,'tcp',5432],['Web','DB',1,'tcp',5432],['PC1','Web',1,'tcp',80]],fn:()=>{const w=nmv('Web'),db=nmv('DB');if(!w||!db)return[false,'назовите устройства Web и DB'];if((db.dbu||[]).some(x=>x.from==='any'))return[false,'остались учётные записи с доступом «any»: db user del app, затем создайте запись с адресом Web'];return[dbCanLogin(w,db),'Web может войти в СУБД по адресу (учётная запись разрешена с его IP)']}},
{t:'16. IP-телефония: звонок через АТС',d:'Постройте: IP-АТС PBX1, два IP-телефона IPphone1 и IPphone2, коммутатор; задайте адреса одной подсети. Зарегистрируйте телефоны: на IPphone1 — register PBX1 101, на IPphone2 — register PBX1 102. Позвоните: call 102. Результат: сигнализация SIP (UDP/5060) доходит до АТС, голос (RTP, UDP/16384) идёт между телефонами в обе стороны. Теория: SIP — только управление звонком; голос — отдельный поток напрямую; односторонняя слышимость — признак фильтра или маршрута в одну сторону.',c:[['IPphone1','PBX1',1,'udp',5060],['IPphone2','PBX1',1,'udp',5060],['IPphone1','IPphone2',1,'udp',16384],['IPphone2','IPphone1',1,'udp',16384]],fn:()=>{const p1=nmv('PBX1');if(!p1||!p1.reg)return[false,'нет АТС PBX1'];const n=Object.keys(p1.reg).length;return[n>=2,`зарегистрировано телефонов: ${n} (нужно 2: register PBX1 <номер>)`]}},
{t:'17. Файловое хранилище с ограничением доступа',d:'Постройте две подсети через маршрутизатор: в первой ПК PC1, во второй NAS1 и ПК PC2 (или PC2 в третьей подсети). Создайте папку docs, доступную только сети PC1: share add docs <сеть/N>. Результат: PC1 подключает папку (mount NAS1 docs), PC2 получает отказ в доступе. Теория: SMB (TCP/445) — права по пользователю и по адресу; принцип наименьших привилегий.',c:[['PC1','NAS1',1,'tcp',445],['PC2','NAS1',1,'tcp',445]],fn:()=>{const n=nmv('NAS1'),a=nmv('PC1'),b=nmv('PC2');if(!n||!a||!b)return[false,'назовите устройства PC1, PC2, NAS1'];return[shareAllows(a,n,'docs')&&!shareAllows(b,n,'docs'),'папка docs разрешена для PC1 и запрещена для PC2']}}
);
syncTasks();
// ---------- теория ----------
const TH2=[];
TH2.push(['Т18. Видеонаблюдение по IP: потоки, PoE, расчёт архива',`
<h4>Из чего состоит система</h4>
<p><b>IP-камера</b> кодирует видео (H.264/H.265) и отдаёт поток по сети; <b>NVR</b> (сетевой видеорегистратор) сам обращается к камере по протоколу <b>RTSP</b> (TCP/554) или принимает поток, пишет его на диск и обслуживает просмотр. Камеры и регистратор выделяют в отдельный VLAN (безопасность и предсказуемая нагрузка), а доступ к просмотру разрешают только оператору.</p>
<h4>Расчёт битрейта и архива</h4>
<table class="t"><tr><th>Разрешение</th><th>Типичный битрейт H.264</th><th>H.265</th></tr><tr><td>720p</td><td>2 Мбит/с</td><td>1</td></tr><tr><td>1080p</td><td>4 Мбит/с</td><td>2</td></tr><tr><td>4 Мп</td><td>6 Мбит/с</td><td>3</td></tr><tr><td>4K (8 Мп)</td><td>12 Мбит/с</td><td>6</td></tr></table>
<p><b>Объём в сутки (ГБ) = Мбит/с × 86 400 / 8 / 1000.</b> Камера 4 Мбит/с даёт 4 × 86 400 / 8 / 1000 = <b>43,2 ГБ/сутки</b>. 16 таких камер — 64 Мбит/с и ≈ 691 ГБ/сутки; архив 30 суток = ≈ 20,7 ТБ. Перевод на H.265 сокращает это вдвое. Запись по движению снижает объём ещё сильнее, но не гарантирует полноту архива.</p>
<div class="tip"><b>Не забудьте про сеть.</b> 64 Мбит/с — это нагрузка на uplink коммутатора доступа и на порт регистратора. Три десятка камер 4К уже не помещаются в канал 100 Мбит/с. Смотрите график нагрузки на линки: потоки камер видны там постоянно.</div>
<h4>PoE (питание по Ethernet)</h4>
<p>Коммутатор подаёт питание по тем же парам, что и данные. Бюджет мощности коммутатора делится между потребителями: камера ≈ 7 Вт (до 15 Вт для PTZ), точка Wi-Fi ≈ 12–25 Вт, IP-телефон ≈ 4 Вт. Если сумма превышает бюджет, часть устройств не включится. Расстояние — по общим правилам витой пары (100 м). Стандарты — 802.3af (15,4 Вт), at (30 Вт), bt (60/90 Вт).</p>
<h4>Безопасность камер</h4>
<ul><li>Заводские пароли — главный источник взломов; меняйте сразу.</li><li>Камера не должна «смотреть» в Интернет напрямую: просмотр — через VPN или регистратор.</li><li>Отдельный VLAN, ACL: камеры → регистратор, оператор → регистратор; запрещено камеры → пользователи.</li></ul>
<p><b>В симуляторе:</b> подключите камеру к «Коммутатору PoE», задайте адреса, на регистраторе: <code>addcam Cam1</code>, <code>cams</code> (состояние потоков), <code>storage</code> (глубина архива). Откройте <code>poe</code> на коммутаторе — расход по портам. Подключите камеру к обычному коммутатору — она потеряет питание («нет питания PoE»); <code>diag Cam1</code> объяснит причину.</p>`]);
TH2.push(['Т19. Серверы СУБД: порты, доступ, трёхзвенная архитектура',`
<h4>Роль СУБД в сети</h4>
<p>База данных — самый ценный и самый уязвимый компонент информационной системы: именно её данные нужны злоумышленнику. Поэтому клиенты (пользователи) <b>никогда</b> не обращаются к СУБД напрямую: между ними стоит приложение (веб-сервер, сервер приложений).</p>
<table class="t"><tr><th>Зона</th><th>Что стоит</th><th>Кто с кем общается</th></tr><tr><td>Интернет / клиенты</td><td>браузеры</td><td>→ веб-сервер (443)</td></tr><tr><td>DMZ</td><td>веб-сервер / прокси</td><td>→ сервер приложений или СУБД по одному порту</td></tr><tr><td>Внутренняя сеть (отдельный VLAN)</td><td>СУБД</td><td>принимает только от приложения; администраторы — из выделенной сети</td></tr></table>
<h4>Порты и протоколы</h4>
<table class="t"><tr><th>СУБД</th><th>Порт TCP</th><th>Сообщение при отказе в доступе</th></tr><tr><td>PostgreSQL</td><td>5432</td><td><code>FATAL: no pg_hba.conf entry for host …</code> (адрес не разрешён) / <code>password authentication failed</code> (пароль)</td></tr><tr><td>MySQL / MariaDB</td><td>3306</td><td><code>ERROR 1130 Host … is not allowed</code> / <code>ERROR 1045 Access denied</code></td></tr><tr><td>Microsoft SQL Server</td><td>1433</td><td><code>Login failed for user</code> (Msg 18456)</td></tr></table>
<h4>Цепочка проверок при подключении клиента</h4>
<ol><li><b>Сеть:</b> маршрут туда и обратно (ping).</li><li><b>Фильтры:</b> ACL и межсетевой экран пропускают порт; зоны разрешают направление.</li><li><b>Порт слушает:</b> СУБД запущена и привязана к нужному интерфейсу (<code>listen_addresses</code> / <code>bind-address</code>); при <code>localhost</code> снаружи порт закрыт (RST).</li><li><b>Доступ по адресу:</b> правила вида «пользователь app — только с 172.16.0.10» (pg_hba.conf, GRANT … TO 'app'@'host').</li><li><b>Аутентификация:</b> логин и пароль (в промышленных системах — ещё TLS и сертификаты).</li><li><b>Права:</b> на каждую БД, таблицу, операцию — минимально необходимые.</li></ol>
<p>Поэтому ошибка подключения всегда читается «по уровням»: <i>timeout</i> — фильтр/маршрут; <i>connection refused</i> — порт закрыт; <i>access denied</i> — сеть и порт в порядке, проблема в правах.</p>
<h4>Защита</h4>
<ul><li>Учётные записи с доступом «откуда угодно» (<code>%</code>, <code>0.0.0.0/0</code>) — антипаттерн.</li><li>Одна учётная запись на приложение, у администратора — отдельная и из отдельной сети.</li><li>TLS на соединении, шифрование резервных копий, отключение удалённого входа для суперпользователя.</li><li>Мониторинг неудачных входов (подбор пароля): 5 неудач подряд — сигнал тревоги.</li><li>Резервные копии по правилу 3-2-1: три копии, на двух носителях, одна — вне площадки. Репликация не заменяет резервное копирование (ошибочное удаление реплицируется мгновенно).</li><li>SQL-инъекции предотвращаются в приложении (параметризованные запросы), а не сетью; сетевая защита лишь уменьшает последствия.</li></ul>
<p><b>В симуляторе:</b> <code>db</code> — состояние, <code>db listen local</code> — закрыть порт для сети, <code>db user add web секрет 172.16.0.10</code> — запись только для веб-сервера, на клиенте: <code>sql pgsql 10.0.1.5 web секрет SELECT version()</code>. На межсетевом экране: <code>allow dmz inside tcp 5432</code> — единственное разрешение между зонами.</p>`]);
TH2.push(['Т20. IP-телефония и общие папки: SIP, RTP, QoS, SMB',`
<h4>Как устроен звонок</h4>
<ol><li><b>Регистрация (SIP REGISTER, UDP/5060):</b> телефон сообщает АТС: «номер 101 — это я, мой адрес 10.0.0.21».</li><li><b>INVITE:</b> звонящий просит АТС соединить с 102; АТС пересылает приглашение второму телефону.</li><li><b>Согласование:</b> стороны обмениваются адресами и портами для голоса и кодеками (SDP).</li><li><b>Голос (RTP, UDP, порты 10000–20000):</b> идёт <i>напрямую</i> между телефонами, а не через АТС; для каждого направления — отдельный поток.</li><li><b>BYE</b> завершает звонок.</li></ol>
<div class="tip"><b>Одностороннее аудио</b> — «я вас слышу, а вы меня нет». Сигнализация (через АТС) проходит, а один из потоков RTP блокируется: ACL или межсетевой экран, NAT без проброса медиапортов, несимметричный маршрут. Решения: разрешить диапазон RTP, SIP ALG или медиасервер на АТС, внимательно проверить маршрут в обе стороны.</div>
<h4>Расчёт полосы и требования к сети</h4>
<table class="t"><tr><th>Кодек</th><th>Битрейт речи</th><th>С учётом заголовков IP/UDP/RTP (20 мс)</th></tr><tr><td>G.711 (ИКМ)</td><td>64 кбит/с</td><td>≈ 80 кбит/с; с Ethernet ≈ 87 кбит/с на разговор в одну сторону</td></tr><tr><td>G.729</td><td>8 кбит/с</td><td>≈ 24 кбит/с</td></tr></table>
<p>Пример: пакет 20 мс при G.711 = 160 байт речи + 12 RTP + 8 UDP + 20 IP = 200 байт; 50 пакетов/с × 200 × 8 = 80 кбит/с. 50 одновременных разговоров G.711 ≈ 4,4 Мбит/с в каждую сторону.</p>
<p>Требования: односторонняя задержка ≤ 150 мс, джиттер ≤ 30 мс, потери ≤ 1 %. Для этого голосовой трафик маркируют <b>DSCP EF (46)</b> и ставят в приоритетную очередь (QoS); телефоны размещают в отдельном voice VLAN и питают по PoE.</p>
<h4>NAS и общие папки</h4>
<p><b>SMB</b> (TCP/445) — файловый доступ в сетях Windows, <b>NFS</b> (TCP/2049) — в Unix. Доступ ограничивают по пользователю, группе и адресу клиента. Никогда не публикуйте SMB в Интернет (атаки шифровальщиков идут через 445). Резервная копия — на отдельное устройство; снимки (snapshots) помогают откатиться после вирусов.</p>
<p><b>В симуляторе:</b> <code>register PBX1 101</code> на телефоне, <code>call 102</code>; <code>iperf -u</code> показывает потери UDP на узком месте. Для NAS: <code>share add docs 10.0.1.0/24</code>, клиент: <code>mount NAS1 docs</code>.</p>`]);
TH2.push(['Т21. Консоль: новые команды (по категориям)',(()=>{const g={};CMDS.forEach(c=>(g[c[5]]=g[c[5]]||[]).push(c));return `<p class="mt">В консоли: <code>help all</code> — список, <code>man &lt;команда&gt;</code> — подробности, Tab — дополнение, ↑ ↓ — история, несколько команд через <code>;</code>, <code>on &lt;устройство&gt; &lt;команда&gt;</code> — выполнить на другом узле.</p>`+Object.keys(g).map(k=>`<h4>${k}</h4><table class="t"><tr><th>Команда</th><th>Что делает</th><th>Пример</th></tr>${g[k].map(c=>`<tr><td><code>${esc(c[1])}</code></td><td>${esc(c[2])}<br><span class="mt">${esc(c[3])}</span></td><td><code>${esc(c[4])}</code></td></tr>`).join('')}</table>`).join('')})()]);
{const at=MAN.findIndex(x=>x[0].startsWith('17.'));MAN.splice(at<0?MAN.length-1:at,0,...TH2)}
p('Новое: IP-камера, видеорегистратор, сервер СУБД, NAS, IP-АТС, PoE-коммутатор; команды diag, iperf, sql, mount, call, poe, allow, inventory, find, on, man и др. (help all).');
draw();side();
