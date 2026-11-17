// ===== m_ping (v87): расширенный ping (число, размер, DF, источник), MTU интерфейсов и MTU пути =====
const pgMtu=f=>f.mtu?+f.mtu:f.tun?1500-((typeof VPN_OVH!=='undefined'&&VPN_OVH[f.tun.mode])||24):1500;
function pgPath(d,tr){const ch=[d,...tr];let best={m:Infinity,a:null,b:null,fa:null,fb:null};
 for(let i=0;i<ch.length-1;i++){const A=ch[i],B=ch[i+1];let hit=null;
  for(const fa of A.ifaces){if(!fa.ip||!fa.mask||hit)continue;for(const fb of B.ifaces){if(fb.ip&&same(fa.ip,fb.ip,fa.mask)){hit=[fa,fb];break}}}
  if(!hit)continue;const m=Math.min(pgMtu(hit[0]),pgMtu(hit[1]));if(m<best.m)best={m,a:A,b:B,fa:hit[0],fb:hit[1]}}
 if(!best.a)best={m:1500,a:d,b:ch[1]||d,fa:d.ifaces[0]||{n:'?'},fb:{n:'?'}};return best}
function pgParse(a){const o={n:4,pay:null,df:false,src:null,err:null},t=a.slice(2);
 for(let i=0;i<t.length;i++){const r=t[i],k=r.toLowerCase(),v=t[i+1];
  if(r==='-n'||r==='-c'||k==='repeat'){o.n=+v;i++;if(!(Number.isInteger(o.n)&&o.n>=1&&o.n<=100))o.err='Число запросов — целое от 1 до 100'}
  else if(r==='-l'||r==='-s'){o.pay=+v;i++;if(!(Number.isInteger(o.pay)&&o.pay>=0&&o.pay<=65500))o.err='Размер данных — от 0 до 65500 байт'}
  else if(k==='size'){const z=+v;i++;if(!(Number.isInteger(z)&&z>=28&&z<=65535))o.err='size: размер датаграммы от 28 до 65535 байт';o.pay=z-28}
  else if(r==='-f'||k==='df-bit')o.df=true;
  else if(r==='-M'&&(v||'').toLowerCase()==='do'){o.df=true;i++}
  else if(r==='-S'||r==='-I'||k==='source'){o.src=v;i++}
  else if(k==='timeout'||r==='-w'||r==='-W')i++;
  else o.err='Неизвестный параметр ping: '+r}
 return o}
function pgSrc(d,s){if(!s)return null;const f=d.ifaces.find(x=>x.ip===s)||d.ifaces.find(x=>x.n.toLowerCase()===s.toLowerCase()&&x.ip);return f?f.ip:false}
function prPing(d,a,cisco){const o=pgParse(a);if(o.err)return p(o.err);const ip=resolve(d,a[1]);if(!ip)return;
 if(o.pay===null)o.pay=cisco?72:32;const size=o.pay+28;
 let sip=null;if(o.src){sip=pgSrc(d,o.src);if(sip===false)return p(`Адрес или интерфейс источника «${o.src}» не принадлежит ${d.name} (или без IP)`)}
 const so=srcIp;if(sip)srcIp=function(x){return x===d?sip:so(x)};
 let ok=0,fr=0,mm=0,fail=0,pa=[d],res=[];
 try{for(let k=0;k<o.n;k++){const r=trip(d,ip);if(!r.ok){fail++;res.push(['.',lastErr()?lastErr().x:'Нет ответа']);continue}
   const P=pgPath(d,r.tr);pa=[d,...r.tr];
   if(size>P.m){if(o.df){mm++;res.push(['M',`Требуется фрагментация (пакет ${size} байт > MTU ${P.m} на участке ${P.a.name} ${P.fa.n} → ${P.b.name} ${P.fb.n}), но установлен флаг DF — ICMP «Fragmentation needed» (тип 3, код 4)`]);continue}
    fr++;ok++;res.push(['!',`Ответ от ${ip}: байт=${o.pay} время<${1+r.tr.length*2}мс TTL=${64-r.tr.length} (пакет фрагментирован: MTU ${P.m}, фрагментов ${Math.ceil((size-20)/(((P.m-20)>>3)<<3))})`]);continue}
   ok++;res.push(['!',`Ответ от ${ip}: байт=${o.pay} время<${1+r.tr.length*2}мс TTL=${64-r.tr.length}`])}}
 finally{srcIp=so}
 if(cisco){p(`Type escape sequence to abort.\nSending ${o.n}, ${size}-byte ICMP Echos to ${ip}, timeout is 2 seconds:${o.df?'\nPacket sent with the DF bit set':''}${sip?'\nPacket sent with a source address of '+sip:''}`);p(res.map(x=>x[0]).join(''));
  p(`Success rate is ${Math.round(ok*100/o.n)} percent (${ok}/${o.n})`+(ok?`, round-trip min/avg/max = 1/${1+pa.length}/${2+pa.length*2} ms`:''));const ms=res.find(x=>x[0]==='M');if(ms)p('M — '+ms[1])}
 else{p(`Обмен пакетами с ${ip} по ${o.pay} байт(а)${sip?' (источник '+sip+')':''}${o.df?', DF':''}:`);res.forEach(x=>p(x[1]));
  p(`Отправлено ${o.n}, получено ${ok}, потеряно ${o.n-ok}${fr?`, фрагментировано ${fr}`:''}.`+(mm?' Совет: уменьшите размер (ping … -l <число>) или измените MTU на проблемном участке.':''))}
 if(ok)flash(pa)}
{const _r=run;run=function(c){const s=String(c).trim(),a=s.split(/\s+/),d=sel&&dv(sel);
 if(d&&(d.t==='rt'||d.t==='sw'||d.t==='pc')){
  if(/^ping$/i.test(a[0])&&a[1]&&/^(-[a-zA-Z]|repeat|size|df-bit|source|timeout)$/i.test(a[2]||'')&&!byNm(a[1]))return prPing(d,a,d.vend==='cisco');
  if(d.vend==='cisco'&&d.vm&&d.vm.m==='if'&&/^(ip )?mtu \d+$/i.test(s)){const f=d.ifaces.find(x=>x.n===d.vm.n),n=+a[a.length-1];if(f&&n>=68&&n<=9000){if(n===1500)delete f.mtu;else f.mtu=n;ch()}else p('% MTU 68–9000');return}
  if(/^mtu$/i.test(a[0])&&d.t!=='pc'){if(!a[1])return p('Использование: mtu <интерфейс> <68–9000> (без числа — показать); пример: mtu gi0/1 1400');
   const f=d.ifaces.find(x=>x.n.toLowerCase()===a[1].toLowerCase());if(!f)return p('Нет такого интерфейса: '+a[1]);
   if(a[2]===undefined)return p(`${f.n}: MTU ${pgMtu(f)}`);const n=+a[2];if(!(Number.isInteger(n)&&n>=68&&n<=9000))return p('MTU — целое число от 68 до 9000');
   if(n===1500)delete f.mtu;else f.mtu=n;ch();return p(`${f.n}: MTU ${n}`)}
}
 return _r(c)}}
CMDS.push(['ping','ping <узел|ip> [-n N|-c N|repeat N] [-l|-s байт|size датаграмма] [-f|-M do|df-bit] [-S|-I|source ip|интерфейс]','Расширенный ping: число запросов, размер, запрет фрагментации (DF), адрес источника','Определяет MTU пути: ping 10.0.0.2 -l 1472 -f проходит при MTU 1500 и даёт «Требуется фрагментация» при меньшем MTU на участке. В консоли Cisco вывод в виде !!!!! / M / . и Success rate. Команда mtu <интерфейс> <число> задаёт MTU интерфейса.']);
// ---- экзаменационное задание и инструкция ----
const pgScn=()=>({dev:[['pc','PC-A',60,200],['rt','R1',260,200],['rt','R2',460,200],['pc','PC-B',660,200]],link:[['PC-A',0,'R1',0],['R1',1,'R2',0],['R2',1,'PC-B',0]],
 cfg:[['PC-A','ip eth0 192.168.1.10 /24','gateway 192.168.1.1'],['PC-B','ip eth0 192.168.2.10 /24','gateway 192.168.2.1'],['R1','ip gi0/0 192.168.1.1 /24','ip gi0/1 10.0.0.1 /30','route add 192.168.2.0 /24 10.0.0.2'],['R2','ip gi0/0 10.0.0.2 /30','ip gi0/1 192.168.2.1 /24','route add 192.168.1.0 /24 10.0.0.1','mtu gi0/0 1400']]});
if(typeof EXNET!=='undefined')EXNET.push({n:'MTU: найти узкое место',min:15,tag:'Диагностика',init:r=>({}),start:c=>{tplLoad(Object.assign({n:'MTU',hint:''},pgScn()));p('Обычный ping проходит, но пакеты размером 1500 с запретом фрагментации (ping … -l 1472 -f) не доходят. Найдите участок и исправьте.')},
 text:c=>'Между PC-A и PC-B обычный ping работает, но ping 192.168.2.10 -l 1472 -f (пакет 1500 байт с запретом фрагментации) не проходит. Найдите с помощью расширенного ping и команды mtu интерфейс с уменьшенным MTU и приведите путь к MTU 1500. Адреса, маршруты и состояние интерфейсов менять нельзя.',
 crit:c=>{const P=()=>{EX=[];const r=trip(byNm('PC-A'),'192.168.2.10');return r.ok?pgPath(byNm('PC-A'),r.tr):null};
  return[['Связь PC-A → PC-B работает',20,()=>{EX=[];return!!trip(byNm('PC-A'),'192.168.2.10').ok}],
  ['MTU пути между офисами равен 1500 (ping -l 1472 -f проходит)',50,()=>{const x=P();return!!x&&x.m>=1500}],
  ['Интерфейсы включены, адреса не изменены',15,()=>{const a=byNm('R1'),b=byNm('R2');return!a.ifaces[1].off&&!b.ifaces[0].off&&a.ifaces[1].ip==='10.0.0.1'&&b.ifaces[0].ip==='10.0.0.2'}],
  ['MTU не поднят выше 1500 и не снижен у других интерфейсов',15,()=>S.devs.every(d=>d.ifaces.every(f=>!f.mtu||+f.mtu===1500))]]}});
MAN.push(['Т56. Расширенный ping и MTU пути',`<p><b>Зачем.</b> Обычный ping отправляет маленькие пакеты и не замечает уменьшенный MTU на одном из участков (туннель, PPPoE, ошибка настройки). Такие сбои проявляются как «сайт частично открывается» или «зависает передача файлов». Расширенный ping с запретом фрагментации (DF) находит проблемный участок.</p>
<p><b>Параметры.</b> Число запросов: <code>-n N</code> (Windows), <code>-c N</code> (Linux), <code>repeat N</code> (Cisco). Размер данных: <code>-l</code> / <code>-s</code> (байты данных); Cisco <code>size</code> — размер всей датаграммы (данные + 28 байт заголовков IP и ICMP). Запрет фрагментации: <code>-f</code>, <code>-M do</code>, <code>df-bit</code>. Источник: <code>-S ip</code>, <code>-I ip|интерфейс</code>, <code>source ip|интерфейс</code>.</p>
<p><b>Как искать.</b> Максимальные данные без фрагментации при MTU 1500 — 1472 байта (1500 − 20 IP − 8 ICMP). Если <code>ping -l 1472 -f</code> даёт «Требуется фрагментация», Стектония называет участок и его MTU; на Cisco в строке ответа появляется <code>M</code>. Без DF большой пакет проходит, но фрагментируется. MTU интерфейса: <code>mtu gi0/1 1400</code> (Cisco: <code>ip mtu 1400</code> в режиме интерфейса); без числа команда показывает значение. Для туннелей MTU вычисляется из накладных расходов GRE (24), IPsec (73), WireGuard (60).</p>
<p><b>Ограничение модели:</b> MTU пути считается по интерфейсам маршрутизируемых участков (L3); PMTUD, ICMP-сообщения, MSS clamping и фрагментация на уровне L2 не моделируются подробно.</p>`]);
