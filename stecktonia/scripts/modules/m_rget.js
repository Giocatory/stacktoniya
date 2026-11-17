// ===== m_rget (v94): «route get <ip>» — объяснение выбора маршрута: кандидаты, длина префикса, AD, метрика =====
function rgCands(d,ip){const o=[],nhUp=nh=>d.ifaces.some(f=>f.ip&&f.mask&&!f.off&&same(nh,f.ip,f.mask));
 d.ifaces.forEach(f=>{if(f.ip&&f.mask&&!f.off&&same(ip,f.ip,f.mask))o.push({net:rdNet(f),mask:f.mask,src:'подключённая сеть',ad:0,m:0,via:'напрямую, '+f.name})});
 (d.routes||[]).forEach(r=>{if(!same(ip,r.net,r.mask))return;const dn=r.track&&typeof trackUp==='function'&&!trackUp(d,r.track)?'track '+r.track+' в состоянии Down':!nhUp(r.nh)?'интерфейс к '+r.nh+' отключён или адрес не в подключённой сети':'';
  o.push({net:r.net,mask:r.mask,src:'статический'+(r.ad?' (плавающий)':''),ad:r.ad||1,m:0,via:'через '+r.nh,down:dn})});
 (RIPT[d.id]||[]).forEach(r=>{if(!same(ip,r.net,r.mask))return;
  const s=r.b?['BGP',20]:r.o?[r.x?'OSPF внешний E2':'OSPF',110]:r.e?[r.x?'EIGRP внешний':'EIGRP',r.x?170:90]:['RIP',120];
  o.push({net:r.net,mask:r.mask,src:s[0],ad:s[1],m:r.m||0,via:'через '+r.nh,down:nhUp(r.nh)?'':'интерфейс к '+r.nh+' отключён'})});
 return o}
function rgBest(L){let b=null;for(const c of L){if(c.down)continue;if(!b||plen(c.mask)>plen(b.mask)||plen(c.mask)===plen(b.mask)&&(c.ad<b.ad||c.ad===b.ad&&c.m<b.m))b=c}return b}
function rgGet(d,ip,io){if(ip2n(ip||'')==null)return io('Использование: route get <ip>');
 if(d.t!=='rt')return io('route get доступен на маршрутизаторе');
 const L=rgCands(d,ip);io(`Выбор маршрута на ${d.name} к ${ip}:`);
 if(!L.length){const g=(d.routes||[]).length?'':'';return io('  Подходящих маршрутов нет — пакет будет отброшен (Destination Net Unreachable).'+g)}
 const b=rgBest(L);
 L.slice().sort((x,y)=>plen(y.mask)-plen(x.mask)||x.ad-y.ad||x.m-y.m).forEach(c=>{
  let why='';if(c.down)why='  ✗ не используется: '+c.down;else if(c===b)why='  ← ВЫБРАН';else if(plen(c.mask)<plen(b.mask))why=`  ✗ префикс короче (/${plen(c.mask)} < /${plen(b.mask)})`;else if(c.ad>b.ad)why=`  ✗ AD ${c.ad} больше, чем ${b.ad}`;else why=`  ✗ метрика ${c.m} больше, чем ${b.m}`;
  io(`  ${c.net}/${plen(c.mask)}  ${c.src}  [AD ${c.ad}, метрика ${c.m}]  ${c.via}${why}`)});
 if(!b)io('  Все подходящие маршруты недоступны — пакет будет отброшен.');
 else io(`Правило: 1) самый длинный префикс, 2) меньшая административная дистанция, 3) меньшая метрика. Итог: ${b.net}/${plen(b.mask)} ${b.via}.`)}
{const _r=run;run=function(c){const s=String(c).trim(),a=s.split(/\s+/),w=a.map(x=>x.toLowerCase()),d=sel&&dv(sel);
 if(d&&d.t==='rt'){
  if(w[0]==='route'&&w[1]==='get')return rgGet(d,a[2],p);
  if(w[0]==='show'&&w[1]==='ip'&&w[2]==='route'&&/^\d+\.\d+\.\d+\.\d+$/.test(a[3]||''))return rgGet(d,a[3],p)}
 return _r(c)}}
CMDS.push(['route get <ip> · show ip route <ip>','route get <ip> — показать, какой маршрут будет выбран для адреса и почему другие отброшены','Объяснение выбора маршрута','Выводит все подходящие маршруты к адресу (подключённые, статические, OSPF/RIP/EIGRP/BGP) и отмечает выбранный: сначала самый длинный префикс, затем меньшая административная дистанция, затем меньшая метрика. Маршруты с track в состоянии Down помечаются как неиспользуемые.']);
MAN.push(['Т63. Как маршрутизатор выбирает маршрут: route get',`<p><b>Три правила выбора.</b> Для адреса назначения маршрутизатор отбирает все маршруты, чьи сети его содержат, и выбирает один: 1) <b>самый длинный префикс</b> (/24 важнее /16 и маршрута по умолчанию); 2) при равных префиксах – <b>меньшая административная дистанция</b> (подключённая 0, статический 1, eBGP 20, EIGRP 90, OSPF 110, RIP 120, внешний EIGRP 170); 3) при равных AD – <b>меньшая метрика</b>.</p>
<p><b>Команда.</b> <code>route get 192.168.2.10</code> (Cisco: <code>show ip route 192.168.2.10</code>) перечисляет все подходящие маршруты, помечает выбранный и для каждого невыбранного называет причину: короче префикс, больше AD, больше метрика или отключён по track. Так удобно разбирать плавающие статические маршруты, редистрибуцию и конфликты статики с динамикой.</p>
<p><b>Типовые ошибки.</b> Ожидают, что победит «более точный по смыслу» маршрут, хотя решает длина префикса; забывают, что динамический маршрут с меньшей AD обходит статический с AD 200.</p>`]);
