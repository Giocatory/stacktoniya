// IPv6 углублённо: RA (флаги M/O/A, lifetime), SLAAC с DAD, DHCPv6, таблица соседей NDP, типы адресов, планирование префиксов, проверка схемы
const i6E=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let NDPC={},i6Q=false;
const i6If=(d,n)=>{const q=String(n||'').toLowerCase();return d.ifaces.find(f=>String(f.n).toLowerCase()===q)||null};
const i6Ra=f=>Object.assign({life:1800,m:0,o:0,a:1,off:0},f.ra||{});
const i6Pc=d=>d.ifaces.findIndex(x=>!x.radio);
function i6Type(N){
 if(N===0n)return'неопределённый адрес (::) — «адреса ещё нет», используется как источник при DAD';
 if(N===1n)return'loopback (::1) — сам узел';
 if((N>>120n)===0xffn){const sc={1:'интерфейса',2:'канала (link-local)',4:'администрации',5:'сайта',8:'организации',14:'глобальная'}[Number((N>>112n)&0xfn)]||'?';
  if((N>>24n)===((0xff02n<<104n)|(1n<<8n)|0xffn))return'multicast, solicited-node (ff02::1:ffXX:XXXX): по нему NDP ищет соседа вместо broadcast-ARP';
  if(N===(0xffn<<120n|2n<<112n|1n))return'multicast ff02::1 — все узлы канала (замена broadcast)';
  if(N===(0xffn<<120n|2n<<112n|2n))return'multicast ff02::2 — все маршрутизаторы канала (сюда уходит Router Solicitation)';
  if(N===(0xffn<<120n|2n<<112n|0x10002n))return'multicast ff02::1:2 — все серверы и агенты DHCPv6';
  return'multicast, область: '+sc}
 if(isLL(N))return'link-local (fe80::/10) — действует только в одном канале, нужен каждому интерфейсу, маршрутизаторами не пересылается';
 if((N>>121n)===0x7en)return'ULA (fc00::/7) — частный адрес, аналог 10.0.0.0/8 и 192.168.0.0/16, в Интернет не маршрутизируется';
 if((N>>96n)===0x20010db8n)return'документационный (2001:db8::/32) — для примеров и учебных схем, в реальных сетях не используется';
 if((N>>125n)===1n)return'глобальный unicast (2000::/3) — маршрутизируется в Интернете';
 return'зарезервированный или не назначенный диапазон'}
const i6Sol=N=>s6((0xff02n<<112n)|(1n<<32n)|(0xffn<<24n)|(N&0xffffffn));
function i6Info(x,o){const t=String(x||'').trim();if(!t){o('Использование: ipv6 info <адрес>[/длина]   пример: ipv6 info 2001:db8:1::10/64');return}
 const m=/^([^/\s]+)(?:\/(\d{1,3}))?$/.exec(t),N=m&&v6(m[1]);if(!m||N===null){o('Неверный IPv6-адрес: '+t);return}
 o(`Адрес: ${s6(N)}`);o('Тип: '+i6Type(N));
 if((N>>120n)!==0xffn&&N!==0n&&N!==1n)o('Solicited-node multicast: '+i6Sol(N));
 if(m[2]!==undefined){const l=+m[2];if(l>128){o('Длина префикса не больше 128');return}const net=N&m6(l),last=net|(((1n<<128n)-1n)>>BigInt(l));
  o(`Префикс: ${s6(net)}/${l}`);o(`Диапазон: ${s6(net)} … ${s6(last)}`);
  if(l<=64)o(`Подсетей /64 внутри: 2^${64-l}${l===64?' (одна)':''}`);else o(`Узлов (адресов) в сети: 2^${128-l}`+(l!==64&&l<128?'. Для SLAAC нужен именно /64':''));
  if(l===64)o('Идентификатор интерфейса — младшие 64 бита; для SLAAC он строится из MAC (EUI-64)')}}
function i6Split(a,o){const m=/^([^/\s]+)\/(\d{1,3})$/.exec(a[0]||''),nl=+String(a[1]||'').replace('/',''),cnt=a[2]?+a[2]:8;
 if(!m||v6(m[1])===null||!(nl>0)){o('Использование: v6split <префикс>/<длина> <новая длина> [сколько показать]   пример: v6split 2001:db8:abcd::/48 64 6');return}
 const l=+m[2],N=v6(m[1])&m6(l);if(nl<=l||nl>128){o(`Новая длина должна быть больше ${l} и не больше 128`);return}
 const tot=nl-l;o(`${s6(N)}/${l} делится на 2^${tot} подсетей /${nl}${tot<=20?' = '+(2**tot):''}`);
 const k=Math.min(cnt>0?cnt:8,tot>=20?64:2**tot);for(let i=0;i<k;i++)o(`  ${String(i+1).padStart(2)}. ${s6(N|(BigInt(i)<<BigInt(128-nl)))}/${nl}`);if(tot>=20||2**tot>k)o('  …');
 if(nl!==64)o(`Замечание: для хостовых сетей используют /64 (SLAAC, NDP), для point-to-point — /127 (RFC 6164) или /64.`)}
function i6Dup(d,addr){const N=v6(addr);return S.devs.find(x=>x!==d&&x.ifaces.some(g=>g.ip6&&v6(g.ip6)===N))}
function i6Routers(d,fi,withOff){return l2all(d,fi).filter(e=>e.d.t==='rt'&&e.d.v6r&&e.d.ifaces[e.i].ip6&&(withOff||!i6Ra(e.d.ifaces[e.i]).off)).sort((x,y)=>x.path.length-y.path.length)}
const i6Src=(d,f,how)=>{d.v6src=d.v6src||{};d.v6src[f.n]={how,addr:f.ip6}};
// ---------- SLAAC (с флагами RA и DAD) ----------
slaac=function(d,fi){const f=d.ifaces[fi];if(!f)return p('Нет такого интерфейса');p(`SLAAC (${f.n}): Router Solicitation → ff02::2 (все маршрутизаторы канала)`);
 const all=i6Routers(d,fi,true);
 if(!all.length)return p('✖ Router Advertisement не получен: в канале нет маршрутизатора с включённой маршрутизацией IPv6 (v6route on) и адресом IPv6 на интерфейсе.');
 const E=all.filter(e=>!i6Ra(e.d.ifaces[e.i]).off);
 if(!E.length){const q=all[0];return p(`✖ Router Advertisement не получен: на ${q.d.name} (${q.d.ifaces[q.i].n}) отправка RA выключена.\n   Исправление: на ${q.d.name} выполните  ra on ${q.d.ifaces[q.i].n}`)}
 const e=E[0],r=e.d,ri=r.ifaces[e.i],ra=i6Ra(ri),pl=ri.p6||64,net=v6(ri.ip6)&m6(pl);
 p(`Router Advertisement от ${r.name}: префикс ${s6(net)}/${pl}, флаги M=${ra.m} O=${ra.o} A=${ra.a}, время жизни маршрутизатора ${ra.life} с`);
 if(!ra.a)p('Флаг A (autonomous) сброшен: хост НЕ формирует SLAAC-адрес из этого префикса.'+(ra.m?' Флаг M установлен — адрес выдаёт DHCPv6, выполните: dhcp6':' Флаг M тоже сброшен — адрес автоматически получить нельзя (задайте вручную: ip6 …).'));
 else if(pl!==64)p(`✖ SLAAC работает только с префиксом /64, а у ${r.name} — /${pl}: адрес не сформирован`);
 else{const addr=s6(net|eui(d.mac)),dup=i6Dup(d,addr);
  p(`Адрес = префикс + идентификатор интерфейса EUI-64 из MAC ${d.mac}: ${addr}`);
  p(`DAD: Neighbor Solicitation для ${addr} с адреса :: → ${i6Sol(v6(addr))}`);
  if(dup)p(`✖ DAD: ответил ${dup.name} — адрес ${addr} уже занят. Адрес не назначен (состояние duplicate).`);
  else{f.ip6=addr;f.p6=64;i6Src(d,f,'SLAAC');p('DAD: ответа нет — адрес уникален, состояние preferred')}}
 if(ra.life>0){d.gw6=s6(ll6(r));d.gw6if=fi;p(`Шлюз по умолчанию: ${d.gw6} (link-local адрес маршрутизатора из поля Source RA)`)}
 else p('Время жизни маршрутизатора = 0: он не объявляет себя шлюзом по умолчанию — шлюз не изменён.');
 ch();flash([d,...e.path.map(dv)])};
// ---------- DHCPv6 ----------
function i6Dhcp(d,fi,force){const f=d.ifaces[fi];if(!f)return p('Нет такого интерфейса');
 const all=i6Routers(d,fi,true),E=all.filter(e=>!i6Ra(e.d.ifaces[e.i]).off);
 if(!E.length)return p('✖ Router Advertisement не получен (нет маршрутизатора IPv6 или RA выключен): клиент не знает префикс и флаги M/O. Хост с DHCPv6 всё равно начинает с RA.');
 const e=E[0],r=e.d,ri=r.ifaces[e.i],ra=i6Ra(ri),pl=ri.p6||64,net=v6(ri.ip6)&m6(pl);
 p(`RA от ${r.name}: M=${ra.m} O=${ra.o} A=${ra.a}`);
 if(!ra.m&&!ra.o&&!force)return p('M=0 и O=0: клиент DHCPv6 не запускается (адрес по SLAAC). Принудительно: dhcp6 force');
 const stateless=!ra.m&&!force;
 p(stateless?`O=1, M=0: Information-Request (без адреса, только параметры) → ff02::1:2, UDP 547`:`M=1: Solicit → ff02::1:2, UDP 547`);
 const sv=ri.d6;if(!sv){p(`✖ Ответа нет: на ${r.name} (${ri.n}) не включён сервер DHCPv6.\n   Исправление: на ${r.name} выполните  dhcp6 on ${ri.n} [число адресов] [DNS]`);return}
 if(stateless){d.v6dns=sv.dns||'';p(`Reply от ${r.name}: DNS ${sv.dns||'не задан'}. Адрес не выдаётся (stateless).`);ch();return}
 sv.leases=sv.leases||{};let addr=sv.leases[d.mac];
 if(!addr){const used=new Set(Object.values(sv.leases).map(x=>String(v6(x))));S.devs.forEach(x=>x.ifaces.forEach(g=>{if(g.ip6)used.add(String(v6(g.ip6)))}));
  for(let k=0;k<sv.count;k++){const c=s6(net|BigInt(sv.first+k));if(!used.has(String(v6(c)))){addr=c;break}}
  if(!addr){p(`✖ Пул DHCPv6 на ${r.name} исчерпан (${sv.count} адресов). Увеличьте: dhcp6 on ${ri.n} <больше>`);return}}
 p(`Advertise ← ${r.name}: предложен адрес ${addr}`);p('Request → Reply: адрес закреплён за DUID клиента (аренда)');
 const dup=i6Dup(d,addr);p(`DAD: Neighbor Solicitation для ${addr}`);
 if(dup){p(`✖ DAD: адрес занят устройством ${dup.name}. Клиент отправляет Decline — адрес не назначен.`);return}
 sv.leases[d.mac]=addr;f.ip6=addr;f.p6=pl;i6Src(d,f,'DHCPv6');d.v6dns=sv.dns||'';
 p(`Адрес ${addr}/${pl} назначен. Префикс /${pl} клиент берёт из RA, а не из DHCPv6.`);
 if(ra.life>0){d.gw6=s6(ll6(r));d.gw6if=fi;p(`Шлюз ${d.gw6} получен из RA: DHCPv6 шлюз не передаёт.`)}else p('RA с lifetime 0 — шлюз по умолчанию не получен.');
 ch();flash([d,...e.path.map(dv)])}
// ---------- NDP-кэш ----------
{const _f=l2find6;l2find6=function(d,o,nh){const r=_f(d,o,nh);if(r&&!i6Q)NDPC[d.id+'|'+r.d.id]={t:Date.now(),a:nh,i:o,m:r.d.mac};return r}}
function i6Ndp(d,o){const L=Object.keys(NDPC).filter(k=>k.startsWith(d.id+'|')&&dv(k.split('|')[1])).map(k=>({...NDPC[k],x:dv(k.split('|')[1])}));
 o('Таблица соседей IPv6 (NDP-кэш) — '+d.name);if(!L.length){o('(пусто: соседи появляются после обмена Neighbor Solicitation/Advertisement; запустите ping или ndp discover)');return}
 o('Адрес                              MAC                Интерфейс  Состояние   Устройство');
 L.forEach(x=>{const st=Date.now()-x.t<30000?'REACHABLE':'STALE';o(`${String(x.a).padEnd(34)} ${x.m}  ${String((d.ifaces[x.i]||{}).n||'').padEnd(9)}  ${st.padEnd(10)}  ${x.x.name}`)})}
function i6Discover(d,o){o('ping ff02::1 (все узлы канала): Echo Request → все, Echo Reply с link-local адресами');let n=0;
 d.ifaces.forEach((f,i)=>{if(f.off||f.radio&&!peer(d,i)||!peer(d,i))return;l2all(d,i).filter(e=>e.d.t!=='sw').forEach(e=>{NDPC[d.id+'|'+e.d.id]={t:Date.now(),a:s6(ll6(e.d)),i,m:e.d.mac};n++})});o(`Откликнулись узлов: ${n}. Результат: ndp`)}
// ---------- команды ----------
{const _r=run;run=function(c){const t=String(c).trim(),a=t.split(/\s+/),w=(a[0]||'').toLowerCase(),w1=(a[1]||'').toLowerCase(),w2=(a[2]||'').toLowerCase();const d=sel&&dv(sel);const o=s=>p(s);
 if(w==='v6check'||w==='ipv6check'||(w==='ipv6'&&/^(check|monitor)$/.test(w1))){i6Open();return}
 if(w==='v6info'||(w==='ipv6'&&w1==='info')){i6Info(a.slice(w==='v6info'?1:2).join(''),o);return}
 if(w==='v6split'){i6Split(a.slice(1),o);return}
 if(d&&d.t!=='sw'){
  if(w==='ndp'&&(!w1||w1==='show')||(w==='show'&&w1==='ipv6'&&/^neighbors?$/.test(w2))||(w==='show'&&w1==='ndp')){i6Ndp(d,o);return}
  if(w==='ndp'&&w1==='clear'){Object.keys(NDPC).forEach(k=>{if(k.startsWith(d.id+'|'))delete NDPC[k]});o('NDP-кэш очищен');return}
  if(w==='ndp'&&w1==='discover'){i6Discover(d,o);return}
  if(w==='ndp'){o('Использование: ndp | ndp discover | ndp clear   (или show ipv6 neighbors)');return}}
 if(d&&d.t==='pc'){
  if(w==='dhcp6'){if(w1==='show'){o('Источники адресов IPv6:');d.ifaces.forEach(f=>{const s=(d.v6src||{})[f.n];o(`  ${f.n}: ${f.ip6?f.ip6+'/'+(f.p6||64)+'  ('+(s&&s.addr===f.ip6?s.how:'вручную')+')':'—'}`)});o('DNS (из DHCPv6): '+(d.v6dns||'—'));return}
   i6Dhcp(d,i6Pc(d),w1==='force');return}}
 if(d&&d.t==='rt'){
  if(w==='ra'){const f=i6If(d,a[2]);
   if(w1==='show'||!w1){o('Router Advertisement на '+d.name+(d.v6r?'':'  (ipv6 unicast-routing выключен — RA не рассылаются)'));d.ifaces.forEach(f=>{if(!f.ip6)return;const r=i6Ra(f);o(`  ${f.n.padEnd(8)} ${r.off?'RA ВЫКЛ':'RA вкл '}  префикс ${s6(v6(f.ip6)&m6(f.p6||64))}/${f.p6||64}  M=${r.m} O=${r.o} A=${r.a}  lifetime ${r.life} с`)});return}
   if(w1==='on'||w1==='off'){if(!f){o('Использование: ra on|off <интерфейс>');return}f.ra=Object.assign(f.ra||{},{off:w1==='off'?1:0});if(!f.ra.off)delete f.ra.off;ch();o(`${f.n}: RA ${w1==='off'?'выключен':'включён'}`);return}
   if(w1==='flag'){const k=(a[3]||'').toUpperCase(),v=(a[4]||'').toLowerCase();if(!f||!/^[MOA]$/.test(k)||!/^(on|off)$/.test(v)){o('Использование: ra flag <интерфейс> M|O|A on|off   (M — адрес по DHCPv6, O — прочие параметры по DHCPv6, A — SLAAC разрешён)');return}f.ra=Object.assign(f.ra||{},{[k.toLowerCase()]:v==='on'?1:0});ch();o(`${f.n}: флаг ${k}=${v==='on'?1:0}`);return}
   if(w1==='lifetime'){if(!f||!/^\d+$/.test(a[3]||'')||+a[3]>9000){o('Использование: ra lifetime <интерфейс> <0–9000 секунд>   (0 — маршрутизатор не шлюз по умолчанию)');return}f.ra=Object.assign(f.ra||{},{life:+a[3]});ch();o(`${f.n}: lifetime ${a[3]} с`);return}
   o('Команды RA: ra show | ra on|off <ifc> | ra flag <ifc> M|O|A on|off | ra lifetime <ifc> <с>');return}
  if(w==='dhcp6'||(w==='show'&&w1==='ipv6'&&w2==='dhcp')){if(w==='show'||w1==='show'||!w1){o('Серверы DHCPv6 на '+d.name);let n=0;d.ifaces.forEach(f=>{if(!f.d6)return;n++;o(`  ${f.n}: пул ${s6(v6(f.ip6)&m6(f.p6||64)|BigInt(f.d6.first))} … +${f.d6.count-1}, DNS ${f.d6.dns||'—'}`);Object.keys(f.d6.leases||{}).forEach(m=>o(`      аренда ${f.d6.leases[m]}  (MAC ${m})`))});if(!n)o('  (не включены; dhcp6 on <ifc> [число адресов] [DNS])');return}
   const f=i6If(d,a[2]);if(w1==='on'){if(!f||!f.ip6){o('Использование: dhcp6 on <интерфейс с IPv6-адресом> [число адресов, по умолчанию 20] [DNS]');return}if(a[3]&&!(+a[3]>0)){o('Число адресов — положительное число');return}f.d6={first:256,count:+a[3]||20,dns:a[4]||'',leases:(f.d6&&f.d6.leases)||{}};ch();o(`${f.n}: сервер DHCPv6, пул ::100 … ::${(256+f.d6.count-1).toString(16)}. Не забудьте ra flag ${f.n} M on — иначе клиенты не будут спрашивать адрес.`);return}
   if(w1==='off'){if(!f){o('Использование: dhcp6 off <интерфейс>');return}delete f.d6;ch();o(f.n+': сервер DHCPv6 выключен');return}
   if(w1==='clear'){d.ifaces.forEach(f=>{if(f.d6)f.d6.leases={}});ch();o('Аренды сброшены');return}
   o('Команды: dhcp6 on <ifc> [число] [DNS] | dhcp6 off <ifc> | dhcp6 show | dhcp6 clear');return}}
 const before=S.devs.map(x=>x.ifaces.map(f=>f.ip6).join('|')).join('/');
 const res=_r(c);
 if(w==='ip6'||(w==='ipv6'&&w1==='address')||w==='slaac'&&false){const dd=sel&&dv(sel);if(dd){dd.ifaces.forEach(f=>{const s=(dd.v6src||{})[f.n];if(s&&s.addr!==f.ip6)delete dd.v6src[f.n];if(f.ip6){const x=i6Dup(dd,f.ip6);if(x)p(`⚠ DAD: адрес ${f.ip6} уже используется на ${x.name}. Узлы с одинаковым адресом работать не будут.`)}})}}
 return res}}
// ---------- проверка схемы ----------
function i6Problems(){const P=[];i6Q=true;try{const seen={};
 S.devs.forEach(d=>d.ifaces.forEach(f=>{if(f.ip6){const k=String(v6(f.ip6));(seen[k]=seen[k]||[]).push(d.name+' '+f.n)}}));
 Object.keys(seen).forEach(k=>{if(seen[k].length>1)P.push(`Дубликат адреса ${s6(BigInt(k))}: ${seen[k].join(' и ')} (DAD)`)});
 S.devs.filter(d=>d.t==='rt').forEach(d=>{
  if(d.ifaces.some(f=>f.ip6)&&!d.v6r)P.push(`${d.name}: адреса IPv6 заданы, но маршрутизация IPv6 выключена (ipv6 unicast-routing) — пакеты не пересылаются, RA не рассылаются`);
  d.ifaces.forEach((f,i)=>{if(!f.ip6)return;const ra=i6Ra(f),hosts=l2all(d,i).some(e=>e.d.t==='pc');if(!hosts)return;
   if(d.v6r&&ra.off)P.push(`${d.name} ${f.n}: RA выключен — хосты не получат адрес и шлюз автоматически`);
   if(ra.a&&(f.p6||64)!==64&&!ra.off)P.push(`${d.name} ${f.n}: префикс /${f.p6} — SLAAC работает только с /64`);
   if(!ra.a&&!ra.m&&!ra.off)P.push(`${d.name} ${f.n}: A=0 и M=0 — автоматически адрес получить невозможно`);
   if(ra.m&&!f.d6)P.push(`${d.name} ${f.n}: установлен флаг M, но сервер DHCPv6 не включён (dhcp6 on ${f.n})`);
   if(f.d6&&!ra.m&&!ra.o)P.push(`${d.name} ${f.n}: сервер DHCPv6 включён, но в RA нет ни M, ни O — клиенты его не используют`);
   if(ra.life===0&&!ra.off)P.push(`${d.name} ${f.n}: lifetime 0 — хосты не получат шлюз по умолчанию`)});
  (d.routes6||[]).forEach(r=>{const N=v6(r.nh);if(N!==null&&!isLL(N)&&!d.ifaces.some(f=>f.ip6&&same6(v6(f.ip6),N,f.p6||64)))P.push(`${d.name}: маршрут ${r.net}/${r.len} через ${r.nh} — шлюз не лежит ни в одной подключённой сети`)})});
 S.devs.filter(d=>d.t==='pc').forEach(d=>{const fi=i6Pc(d),f=d.ifaces[fi];if(!f)return;const R=i6Routers(d,fi,true);
  if(f.ip6&&!d.gw6&&R.length)P.push(`${d.name}: есть адрес ${f.ip6}, но нет шлюза IPv6 — выход за пределы своей сети невозможен (slaac или gateway6)`);
  if(!f.ip6&&R.length)P.push(`${d.name}: адреса IPv6 нет, хотя в канале есть маршрутизатор — slaac или dhcp6`);
  if(f.ip6&&(f.p6||64)!==64&&R.length)P.push(`${d.name}: длина префикса /${f.p6} не совпадает с /64 в RA`);
  if(d.gw6){const N=v6(d.gw6);if(N===null)P.push(`${d.name}: шлюз «${d.gw6}» — не IPv6-адрес`);else if(!isLL(N)&&f.ip6&&!same6(v6(f.ip6),N,f.p6||64))P.push(`${d.name}: шлюз ${d.gw6} вне префикса ${f.ip6}/${f.p6||64}`);
   else{const gi=d.gw6if!==undefined?d.gw6if:fi;if(peer(d,gi)&&!l2find6(d,gi,d.gw6))P.push(`${d.name}: шлюз ${d.gw6} не отвечает на Neighbor Solicitation (проверьте кабель, VLAN, адрес)`)}}})
 }finally{i6Q=false}return P}
document.head.insertAdjacentHTML('beforeend','<style>.i6x table{width:100%;border-collapse:collapse;font-size:12.5px}.i6x td,.i6x th{border:1px solid var(--bd);padding:3px 5px;text-align:left;word-break:break-all}.i6x .okk{color:#1f9d57}.i6x .nok{color:#d64545}.i6x .row{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.i6x .note{font-size:12.5px;opacity:.85}</style>');
function i6Panel(){const P=i6Problems(),rows=[];
 S.devs.filter(d=>d.t==='pc'||d.t==='rt').forEach(d=>{const ifs=d.ifaces.filter(f=>d.t==='rt'?f.ip6:(!f.radio||f.ip6));ifs.forEach((f,k)=>{const s=(d.v6src||{})[f.n],how=f.ip6?(s&&s.addr===f.ip6?s.how:'вручную'):'—';
  rows.push(`<tr><td>${k?'':i6E(d.name)}</td><td>${i6E(f.n)}</td><td>${s6(ll6(d))}</td><td>${f.ip6?i6E(f.ip6)+'/'+(f.p6||64):'—'}</td><td>${how}</td><td>${d.t==='pc'?(d.gw6?i6E(d.gw6):'—'):(d.v6r?(i6Ra(f).off?'RA выкл':'RA M'+i6Ra(f).m+' O'+i6Ra(f).o+' A'+i6Ra(f).a):'IPv6 выкл')}</td></tr>`)})});
 return`<div class="i6x" id="i6x"><h3 data-nohelp="1">IPv6: адреса, RA, DHCPv6 и проверка</h3>${rows.length?`<table><tr><th>Узел</th><th>Интерфейс</th><th>Link-local</th><th>Глобальный адрес</th><th>Источник</th><th>Шлюз / RA</th></tr>${rows.join('')}</table>`:'<p>На схеме нет ПК и маршрутизаторов.</p>'}
<div class="row"><button data-i6b="auto" data-nohelp="1">Получить адреса всем ПК (SLAAC, затем DHCPv6)</button><button data-i6b="scn" data-nohelp="1">Загрузить схему и ввести неисправности</button><button data-i6b="fix" data-nohelp="1">Сбросить RA и DHCPv6 к умолчанию</button></div>
<h4 data-nohelp="1">${P.length?'Найдено проблем: '+P.length:'Проблем не найдено'}</h4>${P.map(x=>`<div class="nok">✖ ${i6E(x)}</div>`).join('')||'<div class="okk">✔ Адресация IPv6 согласована</div>'}
<p class="note">Команды: <code>ra show</code>, <code>ra flag gi0/0 M on</code>, <code>dhcp6 on gi0/0</code>, <code>slaac</code>, <code>dhcp6</code>, <code>ndp</code>, <code>ndp discover</code>, <code>ipv6 info 2001:db8::1/64</code>, <code>v6split 2001:db8:abcd::/48 64 5</code>.</p></div>`}
function i6Open(){openMd(i6Panel())}
function i6Refresh(){if(!document.getElementById('i6x')||md.hidden)return;mb.innerHTML=i6Panel()+'<p><button data-x="close">Закрыть</button></p>'}
TPL.push({n:'IPv6: RA, SLAAC и DHCPv6',d:'Маршрутизатор R1 с двумя сетями IPv6: в первой (PC1, PC2 через коммутатор) адреса по SLAAC, во второй (PC3) — по DHCPv6 (флаг M, пул адресов на R1).',hint:'Проверьте: ra show и dhcp6 show на R1, ndp на PC1 после ping, ping 2001:db8:2::… с PC1. Затем «Меню → Сеть → IPv6: проверка» — кнопка с неисправностями.',
 dev:[['pc','PC1',90,110],['pc','PC2',90,290],['sw','SW1',250,200],['rt','R1',420,200],['pc','PC3',600,200]],
 link:[['PC1',0,'SW1',0],['PC2',0,'SW1',1],['SW1',2,'R1',0],['R1',1,'PC3',0]],
 cfg:[['R1','ipv6 unicast-routing','ip6 gi0/0 2001:db8:1::1/64','ip6 gi0/1 2001:db8:2::1/64','ra flag gi0/1 M on','ra flag gi0/1 A off','dhcp6 on gi0/1 20 2001:db8:2::53'],['PC1','slaac'],['PC2','slaac'],['PC3','dhcp6']]});
function i6Scenario(){const i=TPL.findIndex(t=>/^IPv6: RA, SLAAC/.test(t.n||''));if(i<0){p('Шаблон IPv6 не найден');return}tplLoad(TPL[i]);
 const r=byNm('R1'),p1=byNm('PC1'),p2=byNm('PC2'),p3=byNm('PC3');
 r.ifaces[0].ra={m:1,a:0};p1.ifaces[0].ip6='';p1.ifaces[0].p6=0;p1.gw6='';p2.ifaces[0].ip6='';p2.ifaces[0].p6=0;p2.gw6='';
 p3.ifaces[0].ip6='2001:db8:2::1';p3.ifaces[0].p6=64;p3.gw6='';delete p3.v6src;r.ifaces[1].ra={m:1,a:0,life:0};r.ifaces[1].d6.leases={};ch();
 p('Учебная неисправность IPv6: PC1 и PC2 не получают адрес; PC3 не пингует R1 и не выходит в другую сеть. Найдите причины: «Меню → Сеть → IPv6: проверка», ra show и dhcp6 show на R1, slaac / dhcp6 / ndp на ПК.')}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-i6b]');if(!b)return;const k=b.dataset.i6b;
 if(k==='auto'){S.devs.filter(d=>d.t==='pc').forEach(d=>{const fi=i6Pc(d);if(fi<0||d.ifaces[fi].ip6)return;slaac(d,fi);if(!d.ifaces[fi].ip6)i6Dhcp(d,fi,false)})}
 else if(k==='fix'){S.devs.filter(d=>d.t==='rt').forEach(d=>d.ifaces.forEach(f=>{delete f.ra}));ch()}else i6Scenario();i6Refresh()});
(function(){const dd=document.querySelector('#mbar .mi[data-k="n"] .mdd');if(!dd||document.getElementById('bi6c'))return;const b=document.createElement('button');b.id='bi6c';b.type='button';b.textContent='IPv6: RA, SLAAC, DHCPv6, проверка';b.setAttribute('role','menuitem');b.setAttribute('data-nohelp','1');b.setAttribute('data-d','Адреса IPv6, источники, флаги RA, DHCPv6, проверка согласованности, учебная неисправность');b.onclick=i6Open;dd.appendChild(b)})();
if(typeof QH_ID!=='undefined')QH_ID.bi6c=['IPv6: проверка','Сводная таблица адресов IPv6 по схеме, источник каждого адреса (SLAAC, DHCPv6, вручную) и список проблем: дубликаты, RA, DHCPv6, шлюзы.'];
MAN.push(['Т51. IPv6: RA, SLAAC, DHCPv6, NDP',`<p>Меню «Сеть → IPv6: RA, SLAAC, DHCPv6, проверка» (команда <code>v6check</code>) показывает адреса IPv6 всех узлов, способ их получения и найденные проблемы. Шаблон «IPv6: RA, SLAAC и DHCPv6» собирает рабочую схему, кнопка в окне вносит неисправности.</p>
<h3>Router Advertisement</h3><p>Маршрутизатор с <code>ipv6 unicast-routing</code> рассылает RA на интерфейсах с адресом. Параметры: <code>ra on|off ifc</code>; <code>ra flag ifc A on|off</code> — можно ли строить адрес по SLAAC; <code>M</code> — адрес выдаёт DHCPv6; <code>O</code> — по DHCPv6 только прочие параметры (DNS); <code>ra lifetime ifc 0</code> — маршрутизатор не будет шлюзом по умолчанию. Просмотр: <code>ra show</code>.</p>
<h3>SLAAC и DAD</h3><p><code>slaac</code> на ПК: Router Solicitation → RA → адрес = префикс /64 + EUI-64 из MAC. Перед назначением выполняется DAD — проверка дубликата; при совпадении адрес не назначается. Шлюз берётся из RA (link-local адрес маршрутизатора).</p>
<h3>DHCPv6</h3><p>На маршрутизаторе: <code>dhcp6 on gi0/1 20 2001:db8:2::53</code> (пул из 20 адресов и DNS), <code>dhcp6 show</code>. На ПК: <code>dhcp6</code> — клиент действует по флагам RA: при M=1 проходит Solicit → Advertise → Request → Reply, при O=1 и M=0 — Information-Request (stateless). Шлюз и длину префикса DHCPv6 не передаёт — они приходят только в RA. Это частая ошибка: сервер DHCPv6 есть, а RA выключен или lifetime 0.</p>
<h3>NDP</h3><p><code>ndp</code> (или <code>show ipv6 neighbors</code>) — кэш соседей: адрес, MAC, интерфейс, состояние REACHABLE/STALE. Записи появляются после ping; <code>ndp discover</code> — аналог ping ff02::1; <code>ndp clear</code> — очистка.</p>
<h3>Справочные команды</h3><p><code>ipv6 info &lt;адрес&gt;[/длина]</code> — тип адреса (link-local, ULA, документационный, multicast…), solicited-node адрес, диапазон префикса. <code>v6split 2001:db8:abcd::/48 64 6</code> — нарезка префикса на подсети.</p>
<p><b>Ограничения:</b> нет OSPFv3 и динамической маршрутизации IPv6 (только статические маршруты), нет временных (privacy) адресов, DHCPv6 Prefix Delegation, реальных таймеров аренды и lifetime, RA Guard и фильтрации RA на коммутаторах. Имитация упрощена; DUID заменён MAC-адресом.</p>`]);
