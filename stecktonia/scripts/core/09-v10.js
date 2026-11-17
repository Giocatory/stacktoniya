/* ===== v10: L4, IPv6, зоны/DMZ, VPN, защита L2, IDS, syslog, NetFlow, графики, редактор заданий, заметки/зоны, кабели ===== */
document.head.insertAdjacentHTML('beforeend','<style>.mini{width:100%;font-size:12px;border-collapse:collapse}.mini td,.mini th{border:1px solid var(--bd);padding:2px 5px;text-align:left;vertical-align:top}.bar{height:8px;background:var(--ac);border-radius:3px}svg.spk{width:100%;height:46px;background:var(--bg);border-radius:4px}#side select{font:inherit;padding:4px;border:1px solid var(--bd);border-radius:5px;background:var(--bg);color:var(--tx);max-width:100%}#ctype,#adn{padding:5px 8px;border-radius:6px;background:var(--hd);color:inherit;border:1px solid #ffffff33;font:inherit;max-width:180px}#ctype option,#adn option{color:#14202b;background:#fff}#clen{width:58px;padding:5px;border-radius:6px;background:var(--hd);color:inherit;border:1px solid #ffffff33;font:inherit}.tabs button{margin:2px}#mb select,#mb input,#mb textarea{font:inherit;border:1px solid var(--bd);background:var(--bg);color:var(--tx);border-radius:5px;padding:4px}</style>');

// ---------- A. служебное ----------
let QUIET=0,PEND=null,ACC={},TBUSY=new Set(),TPREV={};
const FLOWS=[],LOGS=[],ALERTS=[],ALD={},TC=new Map(),TST={},LH={};
const isV6=s=>String(s).indexOf(':')>=0;
const quiet=f=>(...a)=>{QUIET++;try{return f(...a)}finally{QUIET--}};
const sec=(pref,text,ids)=>{PEND=ids||null;p(pref+' '+text)};
const dedupe=a=>a.filter((x,i)=>i===0||x!==a[i-1]);
const rid=()=>Math.random().toString(36).slice(2,8);
const nameOfIp=ip=>{const d=S.devs.find(x=>x.ifaces.some(f=>f.ip===ip||f.ip6===ip));return d?d.name:ip};
function onOut(t){const m=/^(‼|⚠|⊘|⊕)/.exec(String(t).trim());if(!m)return;const sev=m[1]==='‼'?2:m[1]==='⚠'?4:m[1]==='⊘'?5:6,ids=PEND||[];PEND=null;
 const L={t:Date.now(),sev,x:String(t).trim(),ids};LOGS.push(L);if(LOGS.length>1000)LOGS.shift();if(sev>=4)idsEvent(L)}

// ---------- B. кабели ----------
const CABLE={cat5e:{l:'Витая пара Cat5e',max:100,spd:1000,col:'var(--ok)'},cat6a:{l:'Витая пара Cat6a',max:100,spd:10000,col:'var(--ok)'},mmf:{l:'Оптика многомодовая',max:550,spd:10000,col:'#e08a00'},smf:{l:'Оптика одномодовая',max:10000,spd:100000,col:'#d9a400'}};
function cabCap(l){return(CABLE[l.ct||'cat5e']||CABLE.cat5e).spd}
function cableScan(){S.links.forEach(l=>{l.id=l.id||rid();const c=CABLE[l.ct||'cat5e']||CABLE.cat5e,len=+l.len||10,was=l.bad;l.bad=len>c.max?`длина ${len} м больше предельной для «${c.l}» (${c.max} м): сигнал затухает, связи нет`:'';
 if(l.bad&&!was&&dv(l.a)&&dv(l.b))sec('⚠',`Кабель ${dv(l.a).name}–${dv(l.b).name}: ${l.bad}`,[l.a,l.b])})}
const _cn10=connect;
connect=function(a,b){const n=S.links.length;_cn10(a,b);if(S.links.length>n){const l=S.links[S.links.length-1];l.id=l.id||rid();l.ct=($('#ctype')||{}).value||'cat5e';l.len=+(($('#clen')||{}).value)||10;cableScan();ch()}};

// ---------- C. IPv6 ----------
const v6=s=>{s=String(s==null?'':s).trim().toLowerCase();if(!/^[0-9a-f:]+$/.test(s)||s.indexOf(':')<0)return null;const dc=s.split('::');if(dc.length>2)return null;
 const sp=x=>x===''?[]:x.split(':'),h=sp(dc[0]),t=dc.length===2?sp(dc[1]):[];
 if(dc.length===1&&h.length!==8)return null;if(dc.length===2&&h.length+t.length>7)return null;
 const g=[...h,...Array(dc.length===2?8-h.length-t.length:0).fill('0'),...t];
 if(g.length!==8||g.some(x=>!/^[0-9a-f]{1,4}$/.test(x)))return null;
 return g.reduce((a,x)=>(a<<16n)|BigInt(parseInt(x,16)),0n)};
const s6=n=>{const g=[];for(let i=7;i>=0;i--)g.push(Number((n>>BigInt(i*16))&0xffffn).toString(16));
 let bs=-1,bl=0;for(let i=0;i<8;){if(g[i]==='0'){let j=i;while(j<8&&g[j]==='0')j++;if(j-i>bl&&j-i>=2){bs=i;bl=j-i}i=j}else i++}
 if(bs<0)return g.join(':');return g.slice(0,bs).join(':')+'::'+g.slice(bs+bl).join(':')};
const m6=l=>l<=0?0n:l>=128?(1n<<128n)-1n:(((1n<<128n)-1n)>>BigInt(128-l))<<BigInt(128-l);
const same6=(a,b,l)=>((a^b)&m6(l))===0n;
const eui=mac=>{const b=[...String(mac).split(':'),0,0,0,0,0,0].slice(0,6).map(x=>(parseInt(x,16)||0)&255);b[0]^=2;return[b[0],b[1],b[2],0xff,0xfe,b[3],b[4],b[5]].reduce((a,x)=>(a<<8n)|BigInt(x),0n)};
const ll6=d=>(0xfe80n<<112n)|eui(d.mac);
const isLL=N=>(N>>118n)===0x3fan;
function addrOf6(d){const f=d.ifaces.find(f=>f.ip6);return f?f.ip6:null}
function l2find6(d,o,nh){const N=v6(nh);return l2all(d,o).find(e=>{const x=e.d,f=x.ifaces[e.i];return(f&&f.ip6&&v6(f.ip6)===N)||(x.t!=='sw'&&ll6(x)===N)})}
function acl6deny(d,src,dst){const S6=v6(src),D6=v6(dst);for(const r of d.acl6||[]){if(same6(S6,v6(r.sn),r.sl)&&same6(D6,v6(r.dn),r.dl))return r.a==='deny'}return false}
function deliver6(d,dst,ttl,tr,first,src){const D=v6(dst),fail=(m,fx)=>{ex([d.id],m,{err:1,fix:fx});return{ok:0,m}};
 if(d.ifaces.some(f=>f.ip6&&v6(f.ip6)===D)||ll6(d)===D){ex([d.id],`${d.name}: адрес ${dst} принадлежит мне — пакет доставлен получателю`);return{ok:1,d}}
 if(!first&&d.t==='pc'&&!d.fwd)return fail(`${d.name}: получил пакет не для себя (${dst}) — ПК чужой трафик не маршрутизирует`,'Проверьте шлюз IPv6 и маршруты на предыдущем узле.');
 if(ttl<=0)return fail(`${d.name}: Hop Limit исчерпан — пакет ходит по кругу`,'Петля маршрутов IPv6: проверьте route6.');
 if(!first&&d.t==='rt'&&!d.v6r)return fail(`${d.name}: маршрутизация IPv6 выключена — пакет не пересылается`,'Включите маршрутизацию IPv6 на устройстве: v6route on (в Cisco — ipv6 unicast-routing).');
 let out=-1,nh=null,why='';
 if(isLL(D)){for(let i=0;i<d.ifaces.length&&out<0;i++){if(d.ifaces[i].off||d.ifaces[i].radio&&!peer(d,i))continue;if(peer(d,i)&&l2find6(d,i,dst)){out=i;nh=dst;why=`${dst} — link-local адрес (fe80::/10), он действует только внутри одного канала; использую интерфейс ${d.ifaces[i].n}`}}}
 if(out<0)d.ifaces.forEach((f,i)=>{if(out<0&&f.ip6&&same6(v6(f.ip6),D,f.p6||64)&&peer(d,i)){out=i;nh=dst;why=`${dst} лежит в префиксе интерфейса ${f.n} (connected) — шлюз не нужен, соседа ищу по NDP`}});
 if(out<0){let rs=[];
  if(d.t==='pc'){if(d.gw6)rs=[{net:0n,len:0,nh:d.gw6,k:'шлюз по умолчанию',i:d.gw6if}]}
  else rs=(d.routes6||[]).map(r=>({net:v6(r.net),len:r.len,nh:r.nh,k:r.k||'статический маршрут',i:r.i}));
  let best=-1;
  for(const r of rs){if(r.net===null||!same6(D,r.net,r.len)||r.len<=best)continue;const N=v6(r.nh);if(N===null)continue;let i=-1;
   if(isLL(N)){i=r.i!==undefined?r.i:-1;if(i>=0&&!peer(d,i))i=-1}else i=d.ifaces.findIndex((f,k)=>f.ip6&&same6(v6(f.ip6),N,f.p6||64)&&peer(d,k));
   if(i>=0){best=r.len;out=i;nh=r.nh;why=`${dst} вне моих префиксов → ${r.k} ${s6(r.net)}/${r.len} через ${r.nh}`}}}
 if(out<0)return fail(`${d.name}: нет маршрута IPv6 до ${dst}`,d.t==='pc'?(d.gw6?`Шлюз ${d.gw6} недоступен: проверьте кабель, VLAN и префикс интерфейса.`:'Адрес не из вашего префикса, а шлюз IPv6 не задан: gateway6 <адрес> либо slaac.'):'Добавьте route6 add <префикс>/<длина> <шлюз> для сети получателя.');
 if(!first&&d.t==='rt'&&acl6deny(d,src,dst))return fail(`${d.name}: ACL IPv6 запретил трафик ${src} → ${dst}, пакет отброшен`,'Проверьте правила: acl6, очистка: acl6 clear.');
 const t=l2find6(d,out,nh);
 if(!t)return fail(`${d.name}: NDP — сосед ${nh} не ответил на Neighbor Solicitation`,'Проверьте кабель, VLAN, префикс и длину префикса у обоих узлов, адрес шлюза.');
 const sw=t.path.slice(1,-1).map(id=>dv(id).name);
 ex(t.path,t.tun?`${d.name}: ${why}. Следующий узел — конец туннеля ${t.d.name}; пакет инкапсулируется в ${t.tun}.`:`${d.name}: ${why}. NDP: Neighbor Solicitation (вместо ARP) → Neighbor Advertisement от ${t.d.name}, MAC ${t.d.mac}.`+(sw.length?` Кадр прошёл через ${sw.join(', ')}.`:' Узлы соединены напрямую.'));
 tr.push(t.d);return deliver6(t.d,dst,ttl-1,tr,0,src)}
function srcFor6(d,dst){const D=v6(dst);if(D!==null&&isLL(D))return s6(ll6(d));const f=d.ifaces.find(f=>f.ip6&&D!==null&&same6(v6(f.ip6),D,f.p6||64))||d.ifaces.find(f=>f.ip6);return f?f.ip6:null}
function trip6(d,dst){computeRip();EX=[];REP=0;NAT=null;const tr=[],src=srcFor6(d,dst);
 if(!src){ex([d.id],`${d.name}: у меня нет IPv6-адреса — отправлять нечем`,{err:1,fix:'Задайте адрес: ip6 <адрес>/<длина> либо получите по slaac.'});return{ok:0,tr}}
 ex([d.id],`${d.name}: собираю IPv6-пакет ${src} → ${dst} (ICMPv6 echo, Hop Limit 64). Получатель в моём префиксе или нужен шлюз?`);
 const a=deliver6(d,dst,64,tr,1,src);if(!a.ok)return{ok:0,tr};REP=1;
 ex([a.d.id],`${a.d.name}: формирую ответ (ICMPv6 echo reply) для ${src}`);
 const r=deliver6(a.d,src,64,[],1,dst);if(!r.ok)return{ok:0,tr};
 return{ok:1,tr,a}}
function slaac(d,fi){const f=d.ifaces[fi];if(!f)return p('Нет такого интерфейса');p(`SLAAC (${f.n}): Router Solicitation → ff02::2 (все маршрутизаторы канала)`);
 const E=l2all(d,fi).filter(e=>e.d.t==='rt'&&e.d.v6r&&e.d.ifaces[e.i].ip6).sort((x,y)=>x.path.length-y.path.length);
 if(!E.length)return p('✖ Router Advertisement не получен: в канале нет маршрутизатора с включённой маршрутизацией IPv6 (v6route on) и адресом IPv6 на интерфейсе.');
 const e=E[0],r=e.d,ri=r.ifaces[e.i],pl=ri.p6||64;
 if(pl!==64)return p(`✖ SLAAC работает только с префиксом /64, а у ${r.name} — /${pl}`);
 const net=v6(ri.ip6)&m6(64),addr=s6(net|eui(d.mac));
 f.ip6=addr;f.p6=64;d.gw6=s6(ll6(r));d.gw6if=fi;ch();
 p(`Router Advertisement от ${r.name}: префикс ${s6(net)}/64, шлюз (link-local маршрутизатора) ${d.gw6}\nАдрес = префикс + идентификатор интерфейса EUI-64 из MAC ${d.mac}: ${addr}`);flash([d,...e.path.map(dv)])}
function v6lines(d){const o=[],ll=s6(ll6(d));if(d.t!=='sw'){d.ifaces.forEach(f=>{if(f.radio&&0)return;o.push(`${f.n.padEnd(8)} link-local ${ll}${f.ip6?`   global ${f.ip6}/${f.p6||64}`:''}`)});if(d.t==='pc')o.push('Шлюз IPv6: '+(d.gw6||'—'));else o.push('Маршрутизация IPv6: '+(d.v6r?'включена':'выключена'))}return o}
function parseP6(x){const m=/^([^/\s]+)\/(\d{1,3})$/.exec(String(x||'').trim());if(!m)return null;const n=v6(m[1]),l=+m[2];if(n===null||l<0||l>128)return null;return{a:s6(n),l}}

// ---------- D. туннели GRE / IPsec ----------
function tunStatus(d,i){const key=d.id+':'+i;if(TC.has(key))return TC.get(key);
 if(TBUSY.has(key))return{up:false,why:'рекурсивная маршрутизация: путь до конца туннеля проходит через сам туннель — туннель падает и поднимается по кругу',path:[]};
 const f=d.ifaces[i],T=f.tun,res={up:false,why:'',path:[]};TBUSY.add(key);
 const sv={EX,REP,NAT,CTX};
 try{
  if(f.off)res.why='интерфейс выключен администратором';
  else if(!T.local||!d.ifaces.some(g=>g.ip===T.local&&!g.tun))res.why=`локальный адрес ${T.local||'—'} не принадлежит ни одному интерфейсу ${d.name}`;
  else{
   const r=S.devs.find(x=>x!==d&&x.ifaces.some(g=>g.ip===T.remote&&!g.tun));
   if(!r)res.why=`конец туннеля ${T.remote} не найден в сети`;
   else{
    CTX={p:T.mode==='ipsec'?'esp':T.mode==='wg'?'udp':'gre',n:0};EX=[];REP=0;NAT=null;
    const a=deliver(d,T.remote,64,[],1,T.local);
    if(!a.ok){const e=EX.filter(x=>x.err).pop();res.why='внешний путь до '+T.remote+' недоступен: '+(e?e.x:'нет маршрута')}
    else{
     const fwd=dedupe(EX.filter(x=>!x.err).flatMap(x=>x.p));
     EX=[];REP=1;const b=deliver(a.d,T.local,64,[],1,T.remote);
     if(!b.ok){const e=EX.filter(x=>x.err).pop();res.why='обратный путь от '+T.remote+' недоступен: '+(e?e.x:'нет маршрута')}
     else{
      let rf=r.ifaces.findIndex(g=>g.tun&&g.tun.local===T.remote&&g.tun.remote===T.local&&g.tun.mode===T.mode);if(rf<0)rf=r.ifaces.findIndex(g=>g.tun&&g.tun.local===T.remote&&g.tun.remote===T.local);
      if(rf<0)res.why=`на другом конце (${r.name}) туннель не настроен: нужен туннель с зеркальными local/remote`;
      else{const g=r.ifaces[rf];
       if(g.tun.mode!==T.mode)res.why=`режимы не совпадают: у нас ${T.mode.toUpperCase()}, у ${r.name} — ${g.tun.mode.toUpperCase()}`;
       else if(T.mode==='ipsec'&&(g.tun.key||'')!==(T.key||''))res.why='IPsec: ключи (PSK) не совпадают — фаза IKE не завершена, SA не установлена';
       else if((T.mode==='ipsec'||T.mode==='wg')&&typeof vpnMis==='function'&&vpnMis(T,g.tun,r))res.why=vpnMis(T,g.tun,r);
       else if(g.off)res.why='туннельный интерфейс на '+r.name+' выключен';
       else{res.up=true;res.rem={d:r,i:rf};res.path=fwd[0]===d.id?fwd:[d.id,...fwd]}}}}}}
 }finally{TBUSY.delete(key);EX=sv.EX;REP=sv.REP;NAT=sv.NAT;CTX=sv.CTX}
 TC.set(key,res);TST[key]=res;return res}
const _peer10=peer;
peer=function(d,i){const f=d.ifaces[i];if(f&&f.tun){if(f.off)return null;const s=tunStatus(d,i);return s.up?{d:s.rem.d,i:s.rem.i}:null}return _peer10(d,i)};
const _l2all10=l2all;
l2all=function(d,out){const f=d.ifaces[out];if(f&&f.tun){const s=tunStatus(d,out);return s.up?[{d:s.rem.d,i:s.rem.i,path:s.path.length>1?s.path:[d.id,s.rem.d.id],tun:f.tun.mode==='ipsec'?'IPsec (ESP)':f.tun.mode==='wg'?'WireGuard':'GRE'}]:[]}return _l2all10(d,out)};
function tunScan(){S.devs.forEach(d=>d.ifaces.forEach((f,i)=>{if(!f.tun)return;const key=d.id+':'+i,s=tunStatus(d,i),was=TPREV[key];
 if(was!==undefined&&was!==s.up)sec(s.up?'⊕':'⚠',`${d.name} ${f.n}: туннель ${f.tun.mode.toUpperCase()} ${s.up?'поднят':'упал — '+s.why}`,[d.id]);TPREV[key]=s.up}))}
function addTunnel(d,local,remote,mode,key){if(d.t!=='rt')return'Туннели настраиваются на маршрутизаторе';
 if(ip2n(local||'')==null||ip2n(remote||'')==null)return'Использование: tunnel <local_ip> <remote_ip> gre|ipsec [ключ]';
 if(!/^(gre|ipsec)$/.test(mode||''))return'Режим: gre или ipsec';let k=0;while(d.ifaces.some(f=>f.n==='Tunnel'+k))k++;
 d.ifaces.push({n:'Tunnel'+k,ip:'',mask:'',tun:{local,remote,mode,key:key||''}});ch();return`Создан Tunnel${k}: ${mode.toUpperCase()} ${local} → ${remote}. Задайте адрес: ip Tunnel${k} <ip> <маска> (на обоих концах из одной подсети, например /30).`}


// ---------- E. потоки, NetFlow, IDS ----------
function linkOfPair(a,b){return S.links.find(l=>(l.a===a&&l.b===b)||(l.a===b&&l.b===a))}
function legsOf(steps){const ks=[];steps.forEach(st=>{for(let i=0;i<st.p.length-1;i++){const l=linkOfPair(st.p[i],st.p[i+1]);
 if(l){l.id=l.id||rid();ks.push('k'+l.id)}else{const A=dv(st.p[i]),B=dv(st.p[i+1]),c=A&&B&&[A,B].find(x=>x.ifaces.some(g=>g.wifi));if(c)ks.push('w'+c.id)}}});return ks}
function recFlow(o){if(QUIET)return;o.t=Date.now();const steps=o.steps||[];delete o.steps;FLOWS.push(o);if(FLOWS.length>2000)FLOWS.shift();
 const bits=o.bytes*8;legsOf(steps).forEach(k=>{ACC[k]=(ACC[k]||0)+bits});idsFlow(o)}
const idsDevs=()=>S.devs.filter(d=>d.k==='ids');
function idsAlert(i,key,text,ids){const n=Date.now(),k=i.id+key;if(ALD[k]&&n-ALD[k]<30000)return;ALD[k]=n;ALERTS.push({id:i.id,t:n,x:text});sec('‼',`IDS ${i.name}: ${text}`,ids)}
function idsFlow(o){idsDevs().forEach(i=>{const q=peer(i,0);if(!q)return;const mon=q.d;if(!(o.path.includes(mon.id)||o.sid===mon.id||o.did===mon.id))return;
 const W=FLOWS.filter(x=>o.t-x.t<60000&&x.src===o.src);
 if(o.p!=='icmp'){
  const ports=new Set(W.filter(x=>x.dst===o.dst&&x.p!=='icmp').map(x=>x.p+'/'+x.n));
  if(ports.size>=5)idsAlert(i,'ps'+o.src+o.dst,`сканирование портов: ${nameOfIp(o.src)} → ${nameOfIp(o.dst)} (${ports.size} разных портов за минуту)`,[o.sid,o.did]);
  const bf=W.filter(x=>x.dst===o.dst&&x.p==='tcp'&&[21,22,23,3389].includes(x.n));
  if(bf.length>=5)idsAlert(i,'bf'+o.src+o.dst,`частые подключения к службам удалённого доступа ${nameOfIp(o.dst)} от ${nameOfIp(o.src)} (${bf.length} попыток) — похоже на подбор пароля`,[o.sid,o.did])}
 else{const ds=new Set(W.filter(x=>x.p==='icmp').map(x=>x.dst));if(ds.size>=5)idsAlert(i,'sw'+o.src,`ICMP-разведка: ${nameOfIp(o.src)} опросил ${ds.size} разных узлов`,[o.sid])}
 const dn=W.filter(x=>x.res==='denied');if(dn.length>=5)idsAlert(i,'dn'+o.src,`${dn.length} обращений от ${nameOfIp(o.src)} отклонены межсетевым экраном/ACL — попытки пробить защиту`,[o.sid])})}
function idsDomain(i){const s=new Set(),q=peer(i,0);if(q)s.add(q.d.id);try{l2all(i,0).forEach(e=>{s.add(e.d.id);e.path.forEach(x=>s.add(x))})}catch(_){}return s}
function idsEvent(L){if(L.x.startsWith('‼')||!L.ids.length)return;idsDevs().forEach(i=>{const dom=idsDomain(i);if(L.ids.some(x=>dom.has(x)))idsAlert(i,'ev'+L.x,'зафиксировано событие — '+L.x.replace(/^\S+\s+/,''),L.ids)})}

// ---------- F. L4: TCP/UDP, службы, порты ----------
const SVC={http:['tcp',80,'HTTP'],https:['tcp',443,'HTTPS'],ssh:['tcp',22,'SSH'],telnet:['tcp',23,'Telnet'],ftp:['tcp',21,'FTP'],smtp:['tcp',25,'SMTP'],rdp:['tcp',3389,'RDP'],mysql:['tcp',3306,'MySQL'],dns:['udp',53,'DNS'],ntp:['udp',123,'NTP'],snmp:['udp',161,'SNMP'],dhcp:['udp',67,'DHCP'],tftp:['udp',69,'TFTP'],syslog:['udp',514,'Syslog']};
const COMMON=[21,22,23,25,53,80,110,123,143,161,443,445,514,3306,3389,8080];
const portName=(p,n)=>{const e=Object.values(SVC).find(x=>x[0]===p&&x[1]===n);return e?e[2]:''};
const svcHas=(d,pr,n)=>(d.svc||[]).some(s=>s.p===pr&&s.n===n);
const hBlocked=(d,pr,n)=>(d.hblock||[]).includes(pr+'/'+n)||(typeof fwBlocks==='function'&&fwBlocks(d,pr,+n));
function parseSvc(a,b){const x=String(a||'').toLowerCase();if(SVC[x])return{p:SVC[x][0],n:SVC[x][1]};
 if(/^(tcp|udp)$/.test(x)&&/^\d+$/.test(b||'')&&+b>0&&+b<65536)return{p:x,n:+b};
 if(/^\d+$/.test(x)&&+x>0&&+x<65536)return{p:/^(tcp|udp)$/i.test(b||'')?b.toLowerCase():'tcp',n:+x};return null}
const addSvc=(d,s)=>{d.svc=d.svc||[];if(!svcHas(d,s.p,s.n))d.svc.push({p:s.p,n:s.n});ch()};
const connTab=(d,o)=>{d.conns=d.conns||[];d.conns.push({...o,t:Date.now()});if(d.conns.length>20)d.conns.shift()};
function l4(d,ip,pr,port){const sv=CTX;CTX={p:pr,n:port};let r;try{r=trip(d,ip)}finally{CTX=sv}
 const tcp=pr==='tcp',lab=`${pr.toUpperCase()}/${port}${portName(pr,port)?' '+portName(pr,port):''}`,R={ok:false,state:'',lab,r};
 EX.forEach(s=>{s.x=s.x.replace('(ICMP echo, TTL 64)',`(${tcp?'TCP SYN':'UDP-датаграмма'} → порт ${port}, TTL 64)`).replace('(ICMPv6 echo, Hop Limit 64)',`(${tcp?'TCP SYN':'UDP-датаграмма'} → порт ${port}, Hop Limit 64)`)});
 const fl=(res,pk,by,dev)=>{R.state=res;recFlow({src:srcIp(d)||srcFor6(d,ip)||'',dst:String(ip),p:pr,n:port,pkts:pk,bytes:by,res:res==='open'?'ok':res==='closed'?'refused':res==='unreach'?'unreach':res,sid:d.id,did:dev?dev.id:null,path:dedupe([...new Set(EX.filter(x=>!x.rep&&!x.err).flatMap(x=>x.p))]),steps:EX.filter(x=>!x.rep&&!x.err)})};
 if(!r.ok){const e=lastErr(),den=e&&/ACL|межсетевой/.test(e.x);
  R.msg=den?`◷ ${lab}: тайм-аут — ${tcp?'SYN':'датаграмма'} молча отброшен межсетевым экраном/ACL. Порт «фильтруется»: нет ни ответа, ни RST (так он отличается от закрытого порта).`:`✖ ${lab}: нет связи на уровне IP — ${e?e.x:'нет ответа'}`;
  fl(den?'denied':'unreach',tcp?3:1,tcp?222:100,null);connTab(d,{peer:ip,p:pr,n:port,st:den?'TIMEOUT':'UNREACH'});return R}
 const dev=r.a.d;
 if(hBlocked(dev,pr,port)){EX=EX.filter(s=>!s.rep);ex([dev.id],`${dev.name}: брандмауэр узла отбросил ${tcp?'SYN':'датаграмму'} на порт ${port} без ответа`,{err:1,fix:`Разрешите порт на узле: unblock ${pr} ${port}.`});
  R.msg=`◷ ${lab}: тайм-аут — пакет дошёл до ${dev.name}, но брандмауэр узла отбросил его без ответа (порт «фильтруется»).`;fl('filtered',tcp?3:1,tcp?222:100,dev);connTab(d,{peer:ip,p:pr,n:port,st:'TIMEOUT'});return R}
 const open=svcHas(dev,pr,port);
 EX.forEach(s=>{s.x=s.x.replace('(ICMP echo reply)','(ответ)').replace('(ICMPv6 echo reply)','(ответ)').replace('(echo reply)',`(${open?(tcp?'TCP SYN-ACK':'ответ службы по UDP'):(tcp?'TCP RST — порт закрыт':'ICMP Port Unreachable')})`)});
 if(open){ex([dev.id],tcp?`${dev.name}: порт ${port} слушает${portName(pr,port)?' ('+portName(pr,port)+')':''} — рукопожатие SYN → SYN-ACK → ACK завершено, соединение ESTABLISHED`:`${dev.name}: служба на UDP/${port} получила датаграмму и ответила`);
  R.ok=true;R.msg=tcp?`✔ ${lab}: соединение установлено (ESTABLISHED)`:`✔ ${lab}: служба ответила`;fl('open',tcp?8:2,tcp?760:200,dev);connTab(d,{peer:ip,p:pr,n:port,st:'ESTABLISHED',dir:'out'});connTab(dev,{peer:srcIp(d)||srcFor6(d,ip),p:pr,n:port,st:'ESTABLISHED',dir:'in'})}
 else{ex([dev.id],`${dev.name}: на порту ${pr.toUpperCase()}/${port} никто не слушает — ${tcp?'отправляю RST (connection refused)':'отправляю ICMP «порт недоступен»'}`,{err:1,fix:`Узел доступен, но служба не запущена. На сервере: service add ${pr} ${port} (или service add ${portName(pr,port).toLowerCase()||'<служба>'}).`});
  R.msg=`✖ ${lab}: порт закрыт (${tcp?'TCP RST — Connection refused':'ICMP Port Unreachable'}). Узел ${dev.name} доступен, но служба не слушает этот порт.`;fl('closed',2,tcp?120:160,dev);connTab(d,{peer:ip,p:pr,n:port,st:'REFUSED'})}
 return R}
async function sendL4(d,dst,pr,port){if(busy){p('Дождитесь окончания предыдущей анимации');return null}const ip=resolve(d,dst);if(!ip)return null;
 const R=l4(d,ip,pr,port),st=EX.slice();p(`\n▶ ${d.name} → ${dst}${ip!==dst?' ('+ip+')':''}  ${R.lab}`);
 busy=1;try{for(const s of st){await move(s.p,s.err,s.rep);p((s.err?'✖ ':s.rep?'↩ ':'• ')+s.x);if(s.fix)p('  ➜ Как исправить: '+s.fix)}}finally{busy=0}
 p(R.msg);return R}
function scanPorts(d,dst,spec){const ip=resolve(d,dst);if(!ip)return null;let ports=[];
 if(!spec||spec==='common')ports=COMMON.slice();else if(/^\d+-\d+$/.test(spec)){const[a,b]=spec.split('-').map(Number);for(let k=a;k<=Math.min(b,a+299);k++)if(k>0&&k<65536)ports.push(k)}
 else ports=spec.split(',').map(Number).filter(x=>x>0&&x<65536);
 if(!ports.length){p('Использование: scan <узел> [common | 1-200 | 22,80,443]');return null}
 const res={open:[],closed:0,filtered:[],unreach:0};
 ports.forEach(n=>{const R=l4(d,ip,'tcp',n);if(R.state==='open')res.open.push(n);else if(R.state==='closed')res.closed++;else if(R.state==='unreach')res.unreach++;else res.filtered.push(n)});
 p(`Сканирование ${dst}${ip!==dst?' ('+ip+')':''}: проверено ${ports.length} TCP-портов`);
 if(res.unreach===ports.length)p('✖ Узел недоступен на уровне IP: '+(lastErr()?lastErr().x:'нет ответа'));
 else{p(`  открыто: ${res.open.map(n=>n+(portName('tcp',n)?'/'+portName('tcp',n):'')).join(', ')||'—'}`);p(`  фильтруется (тайм-аут, чаще всего межсетевой экран): ${res.filtered.length?res.filtered.join(', '):'—'}`);p(`  закрыто (RST): ${res.closed}`)}
 return res}
function netstat(d){const L=[];(d.svc||[]).forEach(s=>L.push(`LISTEN       ${s.p}/${s.n}  ${portName(s.p,s.n)}`));p(L.join('\n')||'Слушающих служб нет (добавьте: service add http)');
 (d.conns||[]).slice(-10).forEach(c=>p(`${(c.st||'').padEnd(12)} ${c.dir==='in'?'← ':'→ '}${c.peer}  ${c.p}/${c.n}`))}

// ---------- G. межсетевой экран: зоны и публикации ----------
const ZONES=['inside','dmz','outside'];
function pubParse(a,b){const x=String(a||'').toLowerCase();if(x==='icmp'||x==='gre'||x==='esp')return x+'/0';const s=parseSvc(x,b);return s?s.p+'/'+s.n:null}
function ifCfg(f){const o=[];if(f.ip6)o.push(` ipv6 address ${f.ip6}/${f.p6||64}`);if(f.zone)o.push(` zone-member security ${f.zone}`);
 if(f.tun){o.push(` tunnel source ${f.tun.local}`,` tunnel destination ${f.tun.remote}`,` tunnel mode ${f.tun.mode==='ipsec'?'ipsec ipv4':'gre ip'}`);if(f.tun.key)o.push(` tunnel protection psk ${f.tun.key}`)}
 if(f.trust)o.push(' ip dhcp snooping trust');if(f.bg)o.push(' spanning-tree bpduguard enable');return o}
function cfgTail(d){const o=[];if(d.v6r)o.push('ipv6 unicast-routing');(d.routes6||[]).forEach(r=>o.push(`ipv6 route ${r.net}/${r.len} ${r.nh}`));(d.acl6||[]).forEach(r=>o.push(`ipv6 access-list ${r.a} ${r.sn}/${r.sl} ${r.dn}/${r.dl}`));(d.pub||[]).forEach(x=>o.push('zone-policy publish '+x));
 if(d.snoop)o.push('ip dhcp snooping');if(d.dai)o.push('ip arp inspection');if(d.storm)o.push('storm-control broadcast level 20');return o}


// ---------- H. защита L2: DHCP snooping, DAI, BPDU guard, storm control; атаки ----------
const dhcpSrvOk=e=>(e.d.t==='rt'||e.d.k==='srv'||e.d.k==='atk')&&(e.d.dhcp||{})[e.d.ifaces[e.i].n];
function snoopBlock(e){for(const id of e.path.slice(1,-1)){const sw=dv(id);if(!sw||!sw.snoop)continue;const port=sw.ifaces.find(g=>behind(sw,g).some(x=>x.id===e.d.id));if(port&&!port.trust)return{sw,port:port.n}}return null}
function snoopBind(cl,ip,e){e.path.slice(1,-1).forEach(id=>{const sw=dv(id);if(!sw||!sw.snoop)return;const g=sw.ifaces.find(x=>behind(sw,x).some(y=>y.id===cl.id));if(g){sw.bind=sw.bind||{};sw.bind[cl.mac]={ip,port:g.n,vlan:g.tr?'trunk':g.v||1}}})}
function daiBlock(att,e,claim){for(const id of e.path.slice(1,-1)){const sw=dv(id);if(!sw||!sw.dai)continue;const g=sw.ifaces.find(x=>behind(sw,x).some(y=>y.id===att.id));if(!g||g.trust)continue;const b=(sw.bind||{})[att.mac];if(!b||b.ip!==claim)return{sw,port:g.n}}return null}
dhcp=function(d,fi=0){const f=d.ifaces[fi];if(!f)return;EX=[];REP=0;
 p(`DHCP Discover (${f.n}): широковещательный запрос 0.0.0.0 → 255.255.255.255`);
 const E=l2all(d,fi),cand=E.filter(dhcpSrvOk).sort((x,y)=>x.path.length-y.path.length||(x.d.name<y.d.name?-1:1));
 const lease=(r,ri,pl,e)=>{let ip=null;for(let k=0;k<pl.n;k++){const c=n2ip(ip2n(pl.first)+k);if(!S.devs.some(x=>x!==d&&x.ifaces.some(g=>g.ip===c))){ip=c;break}}return ip};
 if(cand.length){const keep=[];
  cand.forEach(e=>{const b=snoopBlock(e);if(b)sec('⚠',`DHCP snooping: ${b.sw.name} отбросил DHCP Offer от ${e.d.name}${e.d.rogue?' — поддельный DHCP-сервер':''} (порт ${b.port} не доверенный)`,[e.d.id,b.sw.id,d.id]);else keep.push(e)});
  if(!keep.length)return p('✖ Ответа нет: все DHCP-серверы отфильтрованы DHCP snooping. Отметьте доверенным порт, ведущий к настоящему серверу: trust <порт>.');
  const e=keep[0],r=e.d,ri=r.ifaces[e.i],pl=r.dhcp[ri.n],ip=lease(r,ri,pl,e);
  if(!ip)return p('✖ DHCP: пул адресов исчерпан');
  f.ip=ip;f.mask=ri.mask;d.gw=pl.gw||((r.t==='rt'||r.k==='atk')?ri.ip:d.gw);if(pl.dns)d.dns=pl.dns;snoopBind(d,ip,e);ch();
  p(`DHCP Offer от ${r.name}${keep.length>1?` (ответил первым; серверов в сети: ${keep.length})`:''}: ${ip}\nDHCP Request → Ack: адрес ${ip}, маска ${ri.mask}, шлюз ${d.gw||'—'}${pl.dns?', DNS '+pl.dns:''}`);
  if(r.rogue)sec('⚠',`${d.name} получил настройки от ПОДДЕЛЬНОГО DHCP-сервера ${r.name}: шлюз ${d.gw} принадлежит злоумышленнику — трафик будет перехвачен`,[d.id,r.id]);
  flash([d,...e.path.map(dv)]);return}
 const rl=E.find(e=>e.d.t==='rt'&&e.d.ifaces[e.i].helper&&e.d.ifaces[e.i].ip);
 if(!rl)return p('✖ Ответа нет. Нужен DHCP-сервер в том же широковещательном домене (тот же VLAN/Wi‑Fi сеть): «dhcp <интерфейс> <первый_ip> <число>» на маршрутизаторе или сервере. Проверьте кабели, VLAN, Wi‑Fi.');
 const r=rl.d,ri=r.ifaces[rl.i];p(`DHCP Discover (${f.n}): ${r.name} с «ip helper ${ri.helper}» ретранслирует запрос серверу unicast-ом (giaddr=${ri.ip})`);
 computeRip();EX=[];const a=deliver(r,ri.helper,64,[],1,ri.ip);if(!a.ok)return p('✖ Ретранслятор не достучался до DHCP-сервера: '+a.m);
 const sv=a.d,sc=(sv.scopes||[]).find(s=>same(ri.ip,s.net,s.mask));if(!sc)return p(`✖ На ${sv.name} нет области (scope) для сети ${ri.ip}. Команда: dhcp scope <сеть> <маска> <первый_ip> <число> [шлюз] [dns]`);
 const ip=lease(sv,ri,sc);if(!ip)return p('✖ Пул области исчерпан');REP=1;
 const b=deliver(sv,ri.ip,64,[],1,ri.helper);if(!b.ok)return p('✖ Ответ сервера не вернулся к ретранслятору: '+b.m+' (серверу нужен маршрут обратно к сети клиентов)');
 f.ip=ip;f.mask=sc.mask;d.gw=sc.gw||ri.ip;if(sc.dns)d.dns=sc.dns;ch();p(`DHCP Offer/Ack от ${sv.name} через ${r.name}: ${ip}, маска ${sc.mask}, шлюз ${d.gw}`);flash([d,r,sv]);
 const st=EX.slice();if(st.length)play(st)};

let SPN='';
const _l2f10=l2find;
l2find=function(d,o,n){const sp=(S.spoof||[]).find(s=>s.claim===n&&(s.victim===d.id||(s.victim==='*'&&s.att!==d.id)));
 if(sp){const att=dv(sp.att);if(att&&att!==d){const e=l2all(d,o).find(x=>x.d===att);
  if(e){const b=daiBlock(att,e,sp.claim);
   if(b){const k=att.id+n+b.sw.id;if(SPN!==k){SPN=k;sec('⚠',`Dynamic ARP Inspection: ${b.sw.name} отбросил поддельный ARP от ${att.name}: он заявляет ${n}, но в таблице привязок DHCP snooping такой записи для его MAC нет`,[att.id,b.sw.id,d.id])}return _l2f10(d,o,n)}
   const k2=att.id+n+d.id;if(SPN!==k2){SPN=k2;sec('⚠',`ARP-spoofing: ${att.name} (MAC ${att.mac}) выдаёт себя за ${n} — ${d.name} теперь отправляет трафик на MAC злоумышленника`,[att.id,d.id])}return e}}}
 return _l2f10(d,o,n)};
function bgScan(){S.devs.filter(d=>d.t==='sw'&&kind(d)==='msw').forEach(sw=>sw.ifaces.forEach((f,i)=>{if(!f.bg||f.off)return;const q=peer(sw,i);
 if(q&&((q.d.t==='sw'&&!['hub','ap'].includes(q.d.k))||q.d.k==='l3')){f.off=true;f.errd=true;sec('⚠',`BPDU guard: на порт ${f.n} (${sw.name}) пришёл BPDU от коммутатора ${q.d.name}. Порт переведён в err-disabled — чужой коммутатор не повлияет на топологию STP`,[sw.id,q.d.id])}}))}
function stormScan(){if(!S.nostp)return;stp();if(!S.loops)return;const keep=S.nostp;S.nostp=false;stp();const bl=[...BLK];S.nostp=keep;stp();
 for(const key of bl){const[id,ix]=key.split(':'),sw=dv(id),f=sw&&sw.ifaces[+ix];if(f&&(f.storm||sw.storm)&&!f.off){f.off=true;f.errd=true;sec('⚠',`Storm control: на порту ${f.n} (${sw.name}) превышен порог широковещательного трафика (петля без STP). Порт отключён (err-disabled), шторм остановлен`,[sw.id]);stp();break}}}
const scans=()=>{cableScan();bgScan();stormScan()};

// ---------- I. обёртки trip / draw / addDev ----------
const _trip10=trip;
trip=function(d,dst){TC.clear();scans();const r=_trip10(d,dst);
 if(!QUIET&&CTX.p==='icmp'){const e=lastErr(),den=!r.ok&&e&&/ACL|межсетевой/.test(e.x),stp2=EX.filter(x=>!x.rep&&!x.err);
  recFlow({src:isV6(dst)?(srcFor6(d,dst)||''):(srcIp(d)||''),dst:String(dst),p:'icmp',n:0,pkts:r.ok?2:1,bytes:r.ok?196:98,res:r.ok?'ok':den?'denied':'unreach',sid:d.id,did:r.a?r.a.d.id:null,path:dedupe([...new Set(stp2.flatMap(x=>x.p))]),steps:stp2})}
 return r};
matrix=quiet(matrix);qosCalc=quiet(qosCalc);monHtml=quiet(monHtml);variantCheck=quiet(variantCheck);
Object.assign(CAT,{ids:{l:'Датчик IDS',p:'IDS',i:'',t:'pc',n:1},atk:{l:'Узел злоумышленника',p:'Attacker',i:'',t:'pc',n:1}});
NOTE.ids='Датчик IDS (система обнаружения вторжений): подключите его к коммутатору или маршрутизатору — он видит трафик, проходящий через это устройство, и сообщает о сканировании портов, подборе пароля, разведке и атаках на L2.';
NOTE.atk='Узел злоумышленника (учебная модель): умеет поднимать поддельный DHCP-сервер, подделывать ARP (arpspoof), пересылать чужой трафик (forward on) и сканировать порты (scan). Используется, чтобы показать атаки и проверить защиту.';
NOTE.fw='Межсетевой экран: у интерфейсов есть зоны (outside — внешняя, inside — внутренняя, dmz — публичные серверы). inside → везде; dmz → outside; outside → dmz только опубликованные службы (publish tcp 80); всё остальное запрещено.';
const _ad10=addDev;
addDev=function(k,x,y,n){const d=_ad10(k,x,y,n);let c=0;
 if(k==='atk'){d.rogue=true;c=1}
 if(k==='fw'){['outside','inside','dmz'].forEach((z,i)=>{if(d.ifaces[i])d.ifaces[i].zone=z});d.v6r=true;c=1}
 if(k==='wr'||k==='rt'||k==='l3'){d.v6r=false;if(k==='wr')d.v6r=true;c=1}
 if(k==='prn'){d.svc=[{p:'tcp',n:9100}];c=1}
 if(c)ch();return d};
$('#ad').insertAdjacentHTML('beforeend','<optgroup label="Безопасность"><option value="ids">Датчик IDS</option><option value="atk">Узел злоумышленника</option></optgroup>');
$('header [data-t="cab"]').insertAdjacentHTML('afterend',`<select id="ctype" title="Тип кабеля для новых соединений">${Object.entries(CABLE).map(([k,c])=>`<option value="${k}">${c.l}</option>`).join('')}</select><input id="clen" value="10" title="Длина кабеля, м" aria-label="Длина кабеля, м"><span title="метров">м</span>`);


// ---------- J. консоль ----------
function rmIface(d,idx){const f=d.ifaces[idx];if(!f)return;d.ifaces.splice(idx,1);S.links.forEach(l=>{if(l.a===d.id&&l.ai>idx)l.ai--;if(l.b===d.id&&l.bi>idx)l.bi--});if(d.gw6if!==undefined&&d.gw6if>idx)d.gw6if--;ch()}
const fmtLog=L=>`${new Date(L.t).toLocaleTimeString('ru')} [${L.sev}] ${L.x.replace(/^\S+\s+/,'')}`;
function nfRows(obs){const m=new Map();FLOWS.filter(f=>!obs||f.path.includes(obs)||f.sid===obs||f.did===obs).forEach(f=>{const k=[f.src,f.dst,f.p,f.n].join('|'),e=m.get(k)||{src:f.src,dst:f.dst,p:f.p,n:f.n,pkts:0,bytes:0,ok:0,bad:0,t0:f.t,t1:f.t};e.pkts+=f.pkts;e.bytes+=f.bytes;f.res==='ok'?e.ok++:e.bad++;e.t1=f.t;m.set(k,e)});return[...m.values()].sort((a,b)=>b.bytes-a.bytes)}
const _run10=run;
run=function(c){const d=sel&&dv(sel),a=c.trim().split(/\s+/),cm=a[0].toLowerCase();if(!c.trim())return _run10(c);
 const byName=n=>S.devs.find(x=>x.name.toLowerCase()===String(n||'').toLowerCase());
 if(cm==='syslog'){const n=+a[1]||20;return p(LOGS.slice(-n).map(fmtLog).join('\n')||'Журнал пуст')}
 if(cm==='netflow'){const o=a[1]?byName(a[1]):null;if(a[1]==='clear'){FLOWS.length=0;return p('Статистика потоков сброшена')}const r=nfRows(o?o.id:null).slice(0,15);
  return p((o?`NetFlow с точки наблюдения ${o.name}:\n`:'NetFlow по всей сети:\n')+(r.map(x=>`${nameOfIp(x.src)} → ${nameOfIp(x.dst)}  ${x.p}${x.n?'/'+x.n:''}  пакетов ${x.pkts}  байт ${x.bytes}  успешно ${x.ok}, ошибок ${x.bad}`).join('\n')||'Потоков пока нет'))}
 if(cm==='ping6'&&d)return _run10('ping'+c.trim().slice(5));
 if(!d)return _run10(c);
 const K=kind(d),ifn=n=>d.ifaces.find(f=>f.n.toLowerCase()===String(n||'').toLowerCase());
 if(d.t==='sw'&&K!=='msw'&&/^(snooping|trust|dai|bpduguard|storm)$/.test(cm))return p('Это неуправляемое устройство: защита L2 недоступна. Возьмите управляемый коммутатор.');
 if(d.t!=='sw'){
  if(cm==='ipconfig'){_run10(c);return p(v6lines(d).join('\n'))}
  if((cm==='ipv6'&&a.length===1)||(cm==='show'&&a[1]==='ipv6'&&(a[2]==='interface'||a[2]==='int')))return p(v6lines(d).join('\n'));
  if(cm==='ip6'){const f=a[2]?ifn(a[1]):(d.t==='pc'?d.ifaces.find(x=>!x.radio):null),val=a[2]||a[1];
   if(!f)return p(d.t==='rt'?'Укажите интерфейс: ip6 gi0/0 2001:db8:1::1/64':'Нет такого интерфейса');
   if(val==='none'){f.ip6='';f.p6=0;ch();return p('OK')}const pp=parseP6(val);if(!pp||pp.l<1)return p('Использование: ip6 [интерфейс] <адрес>/<длина> | none   (пример: ip6 2001:db8:1::10/64)');
   f.ip6=pp.a;f.p6=pp.l;ch();return p('OK: '+pp.a+'/'+pp.l)}
  if(cm==='gateway6'){if(d.t!=='pc')return p('Шлюз IPv6 задаётся на ПК; на маршрутизаторе — route6 add ::/0 <шлюз>');
   if(a[1]==='none'){d.gw6='';d.gw6if=undefined;ch();return p('OK')}const N=v6(a[1]);if(N===null)return p('Использование: gateway6 <адрес> [интерфейс]   (для link-local шлюза интерфейс обязателен)');
   d.gw6=s6(N);if(isLL(N)){const f=ifn(a[2]);d.gw6if=f?d.ifaces.indexOf(f):d.ifaces.findIndex(x=>!x.radio)}else d.gw6if=undefined;ch();return p('OK')}
  if(cm==='slaac'){if(d.t!=='pc')return p('SLAAC выполняют хосты; маршрутизатор рассылает Router Advertisement сам (v6route on)');
   const i=a[1]?d.ifaces.indexOf(ifn(a[1])):d.ifaces.findIndex(x=>!x.radio);return slaac(d,i)}
  if(cm==='v6route'){if(d.t!=='rt')return p('Только на маршрутизаторе');d.v6r=a[1]!=='off';ch();return p('Маршрутизация IPv6 '+(d.v6r?'включена: пакеты пересылаются, Router Advertisement рассылаются':'выключена'))}
  if(cm==='ipv6'&&a[1]==='unicast-routing'&&d.t==='rt'){d.v6r=true;ch();return p('OK')}
  if(cm==='ipv6'&&a[1]==='address'&&a[2]){const f=ifn(a[2]),pp=parseP6(a[3]);if(!f||!pp||pp.l<1)return p('Использование: ipv6 address <интерфейс> <адрес>/<длина>');f.ip6=pp.a;f.p6=pp.l;ch();return p('OK: '+pp.a+'/'+pp.l)}
  if(cm==='ipv6'&&a[1]==='route'&&d.t==='rt')return run(d,'route6 add '+a.slice(2).join(' '));
  if(cm==='route6'||(cm==='show'&&a[1]==='ipv6'&&a[2]==='route')){if(d.t!=='rt')return p('route6 доступен на маршрутизаторе');
   if(cm==='route6'&&a[1]==='add'){const pp=parseP6(a[2]),N=v6(a[3]);if(!pp||N===null)return p('Использование: route6 add <префикс>/<длина> <шлюз>   (пример: route6 add 2001:db8:2::/64 2001:db8:12::2; ::/0 — по умолчанию)');
    (d.routes6=d.routes6||[]).push({net:s6(v6(pp.a)&m6(pp.l)),len:pp.l,nh:s6(N)});ch();return p('OK')}
   if(cm==='route6'&&a[1]==='del'){const pp=parseP6(a[2]);if(!pp)return p('Использование: route6 del <префикс>/<длина>');const n=(d.routes6||[]).length;d.routes6=(d.routes6||[]).filter(r=>!(r.net===s6(v6(pp.a)&m6(pp.l))&&r.len===pp.l));ch();return p(n>d.routes6.length?'OK':'Маршрут не найден')}
   d.ifaces.forEach(f=>f.ip6&&p(`C  ${s6(v6(f.ip6)&m6(f.p6||64))}/${f.p6||64}  напрямую, ${f.n}`));(d.routes6||[]).forEach(r=>p(`S  ${r.net}/${r.len}  через ${r.nh}`));return}
  if(cm==='acl6'){if(d.t!=='rt')return p('acl6 — на маршрутизаторе');
   if(a[1]==='clear'){d.acl6=[];ch();return p('ACL IPv6 очищен')}
   if(!a[1])return p((d.acl6||[]).map((r,i)=>`${i+1}. ${r.a} ${r.sn}/${r.sl} → ${r.dn}/${r.dl}`).join('\n')||'Правил нет (всё разрешено)');
   const s=a[2]==='any'?{a:'::',l:0}:parseP6(a[2]),t=a[3]==='any'?{a:'::',l:0}:parseP6(a[3]);
   if(!/^(permit|deny)$/.test(a[1])||!s||!t)return p('Использование: acl6 permit|deny <префикс/длина|any> <префикс/длина|any>');
   (d.acl6=d.acl6||[]).push({a:a[1],sn:s.a,sl:s.l,dn:t.a,dl:t.l});ch();return p('Правило добавлено (проверяются по порядку; без совпадения — разрешено)')}
  if(cm==='service'){
   if(a[1]==='add'){const s=parseSvc(a[2],a[3]);if(!s)return p('Использование: service add <http|ssh|dns|…>  или  service add tcp|udp <порт>');addSvc(d,s);return p(`Служба запущена: ${s.p.toUpperCase()}/${s.n} ${portName(s.p,s.n)}`)}
   if(a[1]==='del'){const s=parseSvc(a[2],a[3]);if(!s)return p('Использование: service del <служба|порт>');d.svc=(d.svc||[]).filter(x=>!(x.p===s.p&&x.n===s.n));ch();return p('Служба остановлена')}
   return p((d.svc||[]).map(s=>`${s.p}/${s.n}  ${portName(s.p,s.n)}`).join('\n')||'Служб нет. Примеры: service add http, service add tcp 8080')}
  if(cm==='block'||cm==='unblock'){const s=parseSvc(a[1],a[2]);if(!s)return p(`Использование: ${cm} <служба | tcp|udp порт>`);const k=s.p+'/'+s.n;d.hblock=(d.hblock||[]).filter(x=>x!==k);if(cm==='block')d.hblock.push(k);ch();return p(cm==='block'?`Брандмауэр узла: ${k} блокируется (пакеты отбрасываются без ответа)`:`Брандмауэр узла: ${k} разрешён`)}
  if(cm==='connect'){if(!a[1]||!a[2])return p('Использование: connect <узел> <служба|порт> [tcp|udp]   (пример: connect Server http)');const s=parseSvc(a[2],a[3]);if(!s)return p('Неизвестная служба или порт');return sendL4(d,a[1],s.p,s.n)}
  if(cm==='curl'||cm==='wget'){const m=/^(?:(https?):\/\/)?(\[[^\]]+\]|[^:/]+)(?::(\d+))?/.exec(a[1]||'');if(!m)return p('Использование: curl [http://|https://]<узел>[:порт]');return sendL4(d,m[2].replace(/^\[|\]$/g,''),'tcp',m[3]?+m[3]:m[1]==='https'?443:80)}
  if(cm==='ssh'){if(!a[1])return p('Использование: ssh <узел>');return sendL4(d,a[1].replace(/^.*@/,''),'tcp',22)}
  if(cm==='telnet'){if(!a[1])return p('Использование: telnet <узел> [порт]');return sendL4(d,a[1],'tcp',+a[2]||23)}
  if(cm==='scan'){if(!a[1])return p('Использование: scan <узел> [common | 1-200 | 22,80,443]');return void scanPorts(d,a[1],a[2])}
  if(cm==='netstat')return netstat(d);
  if(d.t==='rt'){
   if(cm==='zone'){const f=ifn(a[1]);if(!f||!(ZONES.includes(a[2]||'')||a[2]==='none'))return p('Использование: zone <интерфейс> inside|dmz|outside|none');f.zone=a[2]==='none'?'':a[2];ch();return p(`${f.n}: зона ${a[2]}`)}
   if(cm==='publish'||cm==='unpublish'){const k=pubParse(a[1],a[2]);if(!k)return p(`Использование: ${cm} tcp 80 | udp 53 | http | icmp | gre | esp`);d.pub=(d.pub||[]).filter(x=>x!==k);if(cm==='publish')d.pub.push(k);ch();return p(cm==='publish'?`Опубликовано (outside → dmz): ${k}`:'Публикация снята: '+k)}
   if(cm==='show'&&a[1]==='zones'){d.ifaces.forEach(f=>p(`${f.n.padEnd(8)} ${f.zone||'— без зоны'}`));return p('Опубликовано: '+((d.pub||[]).join(', ')||'ничего'))}
   if(cm==='tunnel'){if(a[1]==='del'){const i=d.ifaces.findIndex(f=>f.tun&&f.n.toLowerCase()===String(a[2]).toLowerCase());if(i<0)return p('Нет такого туннеля');rmIface(d,i);return p('Туннель удалён')}
    return p(addTunnel(d,a[1],a[2],a[3],a[4]))}
   if(cm==='show'&&a[1]==='tunnels'){let n=0;d.ifaces.forEach((f,i)=>{if(!f.tun)return;n++;const s=tunStatus(d,i);p(`${f.n}  ${f.tun.mode.toUpperCase()}  ${f.tun.local} → ${f.tun.remote}  ${s.up?'UP':'DOWN — '+s.why}`)});return n||p('Туннелей нет')}
  }
  if(K==='atk'){
   if(cm==='arpspoof'){if(a[1]==='off'){S.spoof=(S.spoof||[]).filter(s=>s.att!==d.id);ch();return p('ARP-spoofing остановлен')}
    const v=a[1]==='*'?'*':(byName(a[1])||{}).id;if(!v||ip2n(a[2]||'')==null)return p('Использование: arpspoof <жертва|*> <подделываемый IP>   |   arpspoof off');
    (S.spoof=S.spoof||[]).push({att:d.id,victim:v,claim:a[2]});ch();return p(`ARP-spoofing запущен: ${d.name} объявляет себя владельцем ${a[2]} для ${a[1]==='*'?'всех узлов канала':a[1]}`)}
   if(cm==='forward'){d.fwd=a[1]==='on';ch();return p('Пересылка чужого трафика '+(d.fwd?'включена: атака превращается в MITM — жертва не замечает перехвата':'выключена: перехваченный трафик пропадает (отказ в обслуживании)'))}
   if(cm==='dhcp'&&a.length>=4){const m=setPool(d,a[1],a[2],+a[3],a[4],a[5]);ch();return p('Поддельный DHCP-сервер: '+m)}}
  if(K==='ids'&&cm==='show'&&a[1]==='ids'){return p(ALERTS.filter(x=>x.id===d.id).slice(-15).map(x=>new Date(x.t).toLocaleTimeString('ru')+' '+x.x).join('\n')||'Тревог нет')}
 }
 if(K==='msw'){
  if(cm==='snooping'){d.snoop=a[1]!=='off';ch();return p('DHCP snooping '+(d.snoop?'включён: DHCP-ответы принимаются только с доверенных портов (trust <порт>), выданные адреса попадают в таблицу привязок':'выключен'))}
  if(cm==='trust'){const f=ifn(a[1]);if(!f)return p('Использование: trust <порт> [off]');f.trust=a[2]!=='off';ch();return p(`${f.n}: ${f.trust?'доверенный':'недоверенный'}`)}
  if(cm==='dai'){d.dai=a[1]!=='off';ch();return p('Dynamic ARP Inspection '+(d.dai?'включён: ARP проверяется по таблице привязок snooping (недоверенные порты)':'выключен'))}
  if(cm==='bpduguard'){const on=a[2]!=='off';if(a[1]==='all'){d.ifaces.forEach(f=>{if(!f.radio)f.bg=on});ch();return p('BPDU guard '+(on?'включён':'выключен')+' на всех портах')}const f=ifn(a[1]);if(!f)return p('Использование: bpduguard <порт|all> on|off');f.bg=on;ch();return p(`BPDU guard на ${f.n}: ${on?'включён':'выключен'}`)}
  if(cm==='storm'){if(a[1]==='on'||a[1]==='off'){d.storm=a[1]==='on';ch();return p('Storm control '+(d.storm?'включён на всех портах':'выключен'))}const f=ifn(a[1]);if(!f)return p('Использование: storm on|off  или  storm <порт> on|off');f.storm=a[2]!=='off';ch();return p(`Storm control на ${f.n}: ${f.storm?'включён':'выключен'}`)}
  if(cm==='show'&&a[1]==='snooping'){p('DHCP snooping: '+(d.snoop?'включён':'выключен')+', DAI: '+(d.dai?'включён':'выключен'));d.ifaces.forEach(f=>f.trust&&p('  доверенный порт '+f.n));Object.entries(d.bind||{}).forEach(([m,b])=>p(`  привязка ${m}  ${b.ip}  порт ${b.port}  VLAN ${b.vlan}`));return}}
 return _run10(c)};

// ---------- K. панель устройства ----------
const itm=id=>[...(S.notes||[]),...(S.zones||[])].find(z=>z.id===id);
const COL=[['#ffe27a','жёлтый'],['#7ad1ff','голубой'],['#9be39b','зелёный'],['#ffb0b0','красный'],['#d6b3ff','фиолетовый']];
function noteSide(it){const isZ=it.id[0]==='z';$('#ps').textContent='> ';
 $('#side').innerHTML=`<h3>${isZ?'Зона':'Заметка'}</h3>${isZ?`<label>Название<input data-n="t" value="${esc(it.t)}"></label><label>Ширина<input data-n="w" value="${it.w}"></label><label>Высота<input data-n="h" value="${it.h}"></label>`:`<label>Текст<textarea data-n="t" style="width:100%;height:90px;font:inherit;border:1px solid var(--bd);background:var(--bg);color:var(--tx);border-radius:5px">${esc(it.t)}</textarea></label>`}<label>Цвет<select data-n="c">${COL.map(([c,n])=>`<option value="${c}" ${it.c===c?'selected':''}>${n}</option>`).join('')}</select></label><p class="mt">${isZ?'Зона — рамка для группировки (отдел, этаж, DMZ). Перетаскивайте за верхнюю полосу.':'Перетащите заметку мышью. Пишите здесь адресный план, пояснения, задачи.'}</p><button class="dng" data-n="del">Удалить</button>`}
const _side10=side;
side=function(){_side10();const it=sel&&itm(sel);if(it){noteSide(it);return}
 const d=sel&&dv(sel);if(!d)return;const K=kind(d);let h='';
 const my=S.links.filter(l=>l.a===d.id||l.b===d.id);
 if(my.length)h+='<h4>Кабели</h4>'+my.map(l=>{l.id=l.id||rid();const o=dv(l.a===d.id?l.b:l.a),pi=l.a===d.id?l.ai:l.bi,c=CABLE[l.ct||'cat5e'];
  return`<div class="rt" style="flex-wrap:wrap;gap:3px"><span>${d.ifaces[pi]?d.ifaces[pi].n:'?'} → ${esc(o.name)}</span><span><select data-a="ct" data-l="${l.id}">${Object.entries(CABLE).map(([k,v])=>`<option value="${k}" ${(l.ct||'cat5e')===k?'selected':''}>${v.l}</option>`).join('')}</select> <input data-a="cl" data-l="${l.id}" value="${l.len||10}" style="width:54px;display:inline" title="длина, м"> м</span><div class="mt ${l.bad?'er':''}" style="width:100%">${l.bad?'✖ '+esc(l.bad):`предел ${c.max} м, до ${c.spd>=1000?c.spd/1000+' Гбит/с':c.spd+' Мбит/с'}`}</div></div>`}).join('');
 if(d.t!=='sw'){
  h+='<h4>IPv6</h4><div class="mt">link-local: '+s6(ll6(d))+'</div>'+d.ifaces.map((f,i)=>f.radio?'':`<label>${f.n}<input data-a="ip6" data-i="${i}" value="${f.ip6?f.ip6+'/'+(f.p6||64):''}" placeholder="2001:db8:1::10/64"></label>`).join('');
  if(d.t==='pc')h+=`<label>Шлюз IPv6<input data-a="gw6" value="${esc(d.gw6||'')}" placeholder="fe80::… или 2001:db8:1::1"></label><button class="b" data-a="slaac" style="width:100%">Получить адрес по SLAAC</button>`;
  if(d.t==='rt')h+=`<label><input type="checkbox" data-a="v6r" ${d.v6r?'checked':''} style="width:auto;display:inline"> Маршрутизация IPv6 (ipv6 unicast-routing)</label><div class="mt">Маршруты IPv6: ${(d.routes6||[]).map(r=>r.net+'/'+r.len+' → '+r.nh).join('; ')||'нет'} (route6 add)</div>`;
  h+='<h4>Службы (слушающие порты)</h4>'+(d.svc||[]).map((s,i)=>`<div class="rt"><span>${s.p}/${s.n} ${portName(s.p,s.n)}</span><button class="xb" data-a="svcdel" data-i="${i}">✕</button></div>`).join('')+`<div class="rr" style="grid-template-columns:1fr auto"><select id="sv_k">${Object.entries(SVC).map(([k,v])=>`<option value="${k}">${v[2]} (${v[0]}/${v[1]})</option>`).join('')}</select><button data-a="svcadd">+</button></div><label>Брандмауэр узла: блокировать<input data-a="hb" value="${esc((d.hblock||[]).join(', '))}" placeholder="tcp/22, udp/53"></label>`}
 if(d.t==='rt'){
  h+='<h4>Межсетевой экран: зоны</h4>'+d.ifaces.map((f,i)=>f.radio||f.tun?'':`<label>${f.n}<select data-a="zone" data-i="${i}"><option value="">— без зоны</option>${ZONES.map(z=>`<option ${f.zone===z?'selected':''}>${z}</option>`).join('')}</select></label>`).join('')+`<label>Опубликовано (outside → dmz)<input data-a="pub" value="${esc((d.pub||[]).join(', '))}" placeholder="tcp/80, tcp/443, icmp/0"></label><div class="mt">Политика зон включается, когда зона задана хотя бы у одного интерфейса. Для VPN через экран опубликуйте gre/0 или esp/0.</div>`;
  const tun=d.ifaces.map((f,i)=>f.tun?{f,i}:null).filter(Boolean);
  h+='<h4>VPN-туннели (GRE / IPsec)</h4>'+tun.map(({f,i})=>{const s=tunStatus(d,i);return`<div class="rt" style="flex-wrap:wrap"><span><b>${f.n}</b> ${f.tun.mode.toUpperCase()} ${f.tun.local} → ${f.tun.remote}</span><button class="xb" data-a="tundel" data-i="${i}">✕</button><div class="mt ${s.up?'ok':'er'}" style="width:100%">${s.up?'● поднят':'✖ '+esc(s.why)}</div></div>`}).join('')+`<input id="tn_l" placeholder="local IP (свой внешний адрес)"><input id="tn_r" placeholder="remote IP (внешний адрес другого конца)" style="margin-top:4px"><select id="tn_m" style="margin-top:4px;width:100%"><option value="gre">GRE</option><option value="ipsec">IPsec (с ключом PSK)</option></select><input id="tn_k" placeholder="ключ PSK (для IPsec)" style="margin-top:4px"><button class="b" data-a="tunadd" style="margin-top:6px;width:100%">Создать туннель</button>`}
 if(K==='msw'){
  h+=`<h4>Защита L2</h4><label><input type="checkbox" data-a="snoop" ${d.snoop?'checked':''} style="width:auto;display:inline"> DHCP snooping (против чужих DHCP-серверов)</label><label><input type="checkbox" data-a="dai" ${d.dai?'checked':''} style="width:auto;display:inline"> Dynamic ARP Inspection (против ARP-spoofing)</label><label><input type="checkbox" data-a="storm" ${d.storm?'checked':''} style="width:auto;display:inline"> Storm control (все порты)</label>`+d.ifaces.map((f,i)=>f.radio?'':`<label style="display:inline-block;margin-right:8px"><b>${f.n}</b> <input type="checkbox" data-a="trust" data-i="${i}" ${f.trust?'checked':''} style="width:auto;display:inline"> trusted <input type="checkbox" data-a="bg" data-i="${i}" ${f.bg?'checked':''} style="width:auto;display:inline"> BPDU guard</label>`).join('')+`<div class="mt">trusted — порт к настоящему DHCP-серверу, маршрутизатору или другому коммутатору. BPDU guard включают на портах доступа (к ПК). Привязок DHCP snooping: ${Object.keys(d.bind||{}).length}.</div>`}
 if(K==='atk')h+=`<h4>Атаки (учебная модель)</h4><label><input type="checkbox" data-a="fwd" ${d.fwd?'checked':''} style="width:auto;display:inline"> Пересылать перехваченный трафик (MITM)</label><select id="as_v" style="width:100%"><option value="*">все узлы канала</option>${S.devs.filter(x=>x!==d&&x.t==='pc').map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select><input id="as_c" placeholder="подделываемый IP (например, шлюз)" style="margin-top:4px"><button class="b" data-a="spoof" style="margin-top:6px;width:100%">Запустить ARP-spoofing</button><div class="mt">Активно: ${(S.spoof||[]).filter(s=>s.att===d.id).map(s=>s.claim).join(', ')||'нет'} <button class="xb" data-a="spoofoff">Остановить</button></div><div class="mt">Поддельный DHCP: <code>dhcp eth0 192.168.1.200 20</code> (по умолчанию шлюз клиентам — адрес злоумышленника). Разведка: <code>scan &lt;узел&gt;</code>.</div>`;
 if(K==='ids'){const q=peer(d,0);h+=`<h4>Датчик IDS</h4><div class="mt">Наблюдает за устройством: ${q?esc(q.d.name):'— (подключите к коммутатору или маршрутизатору)'}</div>`+(ALERTS.filter(x=>x.id===d.id).slice(-8).reverse().map(x=>`<div class="mt er">${new Date(x.t).toLocaleTimeString('ru')} ${esc(x.x)}</div>`).join('')||'<div class="mt">Тревог нет</div>')}
 $('#side').insertAdjacentHTML('beforeend',h)};
$('#side').addEventListener('change',e=>{const t=e.target,a=t.dataset.a,nn=t.dataset.n;
 if(nn){const it=itm(sel);if(!it)return;if(nn==='t')it.t=t.value.slice(0,400);else if(nn==='c')it.c=t.value;else if(nn==='w')it.w=Math.max(60,+t.value||it.w);else if(nn==='h')it.h=Math.max(40,+t.value||it.h);ch();return}
 if(!a)return;
 if(a==='ct'||a==='cl'){const l=S.links.find(x=>x.id===t.dataset.l);if(!l)return;if(a==='ct')l.ct=t.value;else l.len=Math.max(1,+t.value||10);cableScan();ch();return}
 const d=dv(sel);if(!d)return;const i=+t.dataset.i,f=d.ifaces[i];
 if(a==='ip6'){if(t.value.trim()===''){f.ip6='';f.p6=0}else{const pp=parseP6(t.value);if(!pp||pp.l<1){p('Неверный IPv6-адрес. Формат: 2001:db8:1::10/64');return}f.ip6=pp.a;f.p6=pp.l}ch()}
 else if(a==='gw6'){const v=t.value.trim();if(!v){d.gw6='';d.gw6if=undefined}else{const N=v6(v);if(N===null){p('Неверный адрес шлюза IPv6');return}d.gw6=s6(N);d.gw6if=isLL(N)?d.ifaces.findIndex(x=>!x.radio):undefined}ch()}
 else if(a==='v6r'){d.v6r=t.checked;ch()}
 else if(a==='hb'){d.hblock=t.value.split(/[,\s]+/).filter(x=>/^(tcp|udp)\/\d+$/.test(x));ch()}
 else if(a==='zone'){f.zone=t.value;ch()}
 else if(a==='pub'){d.pub=t.value.split(/[,\s]+/).filter(x=>/^((tcp|udp)\/\d+|(icmp|gre|esp)\/0)$/.test(x));ch()}
 else if(a==='snoop'||a==='dai'||a==='storm'||a==='fwd'){d[a]=t.checked;ch()}
 else if(a==='trust'||a==='bg'){f[a]=t.checked;ch()}});
$('#side').addEventListener('click',e=>{const t=e.target,a=t.dataset.a,nn=t.dataset.n;
 if(nn==='del'){const id=sel;S.notes=(S.notes||[]).filter(z=>z.id!==id);S.zones=(S.zones||[]).filter(z=>z.id!==id);sel=null;ch();return}
 if(!a)return;const d=sel&&dv(sel);if(!d)return;
 if(a==='slaac')slaac(d,d.ifaces.findIndex(x=>!x.radio));
 else if(a==='svcadd'){const s=SVC[$('#sv_k').value];if(s)addSvc(d,{p:s[0],n:s[1]})}
 else if(a==='svcdel'){(d.svc||[]).splice(+t.dataset.i,1);ch()}
 else if(a==='tunadd')p(addTunnel(d,$('#tn_l').value.trim(),$('#tn_r').value.trim(),$('#tn_m').value,$('#tn_k').value.trim()));
 else if(a==='tundel')rmIface(d,+t.dataset.i);
 else if(a==='spoof')run(`arpspoof ${$('#as_v').value==='*'?'*':dv($('#as_v').value).name} ${$('#as_c').value.trim()}`);
 else if(a==='spoofoff')run('arpspoof off')});


// ---------- L. заметки, зоны, авто-раскладка, отрисовка ----------
function autoLayout(){const D=S.devs;if(!D.length)return p('Схема пуста');const adj={};D.forEach(d=>adj[d.id]=new Set());
 S.links.forEach(l=>{if(adj[l.a]&&adj[l.b]){adj[l.a].add(l.b);adj[l.b].add(l.a)}});
 D.forEach(d=>d.ifaces.forEach((f,i)=>{if(f.wifi||f.tun){const q=peer(d,i);if(q){adj[d.id].add(q.d.id);adj[q.d.id].add(d.id)}}}));
 const rank=d=>d.t==='rt'?0:d.t==='sw'?1:2,roots=[...D].sort((a,b)=>rank(a)-rank(b)||adj[b.id].size-adj[a.id].size),seen=new Set(),comps=[];
 roots.forEach(r=>{if(seen.has(r.id))return;const layers=[];let cur=[r.id];seen.add(r.id);while(cur.length){layers.push(cur);const nx=[];cur.forEach(u=>[...adj[u]].forEach(v=>{if(!seen.has(v)){seen.add(v);nx.push(v)}}));cur=nx}comps.push(layers)});
 let y0=80;const W=Math.max(760,(cv.getBoundingClientRect().width||900)-60);
 comps.forEach(layers=>{const px={};layers.forEach((L,li)=>{const arr=L.slice();if(li>0)arr.sort((a,b)=>{const m=id=>{const ns=[...adj[id]].filter(x=>px[x]!==undefined);return ns.length?ns.reduce((s,x)=>s+px[x],0)/ns.length:0};return m(a)-m(b)});
  const n=arr.length;arr.forEach((id,k)=>{const x=Math.round(W*(k+1)/(n+1))+20,d=dv(id);d.x=x;d.y=y0+li*130;px[id]=x})});y0+=layers.length*130+30});
 ch();p('Устройства расставлены по уровням: маршрутизаторы сверху, коммутаторы ниже, конечные узлы внизу. Отмена — Ctrl+Z.')}
$('#ad').insertAdjacentHTML('afterend','<select id="adn" aria-label="Разметка схемы"><option value="">Разметка…</option><option value="note">Заметка</option><option value="zone">Зона (рамка)</option><option value="layout">Авто-раскладка</option></select>');
$('#adn').onchange=e=>{const v=e.target.value;if(!v)return;if(v==='layout'){autoLayout();e.target.value='';return}tool=v;linkFrom=null;document.querySelectorAll('header [data-t]').forEach(x=>x.classList.remove('on'));$('#ad').value='';draw()};
document.querySelectorAll('header [data-t]').forEach(b=>b.addEventListener('click',()=>{$('#adn').value=''}));
$('#ad').addEventListener('change',()=>{$('#adn').value=''});
cv.addEventListener('pointerdown',e=>{const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
 if((tool==='note'||tool==='zone')&&!e.target.closest('[data-id]')){const id=(tool==='note'?'n':'z')+(++S.c);
  if(tool==='note')(S.notes=S.notes||[]).push({id,x,y,t:'Заметка',c:COL[0][0]});else(S.zones=S.zones||[]).push({id,x:Math.max(0,x-90),y:Math.max(0,y-20),w:240,h:140,t:'Зона',c:COL[1][0]});
  sel=id;tool='sel';document.querySelectorAll('header [data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t==='sel'));$('#adn').value='';ch();return}
 const n=e.target.closest('[data-nid]');
 if(n&&tool==='sel'){const it=itm(n.dataset.nid);if(!it)return;sel=it.id;drag={d:it,dx:x-it.x,dy:y-it.y};cv.setPointerCapture(e.pointerId);side();draw()}});
function capOfKey(k){if(k[0]==='k'){const l=S.links.find(x=>'k'+x.id===k);if(!l||!dv(l.a)||!dv(l.b))return 0;return Math.min(dv(l.a).ifaces[l.ai].spd||1000,dv(l.b).ifaces[l.bi].spd||1000,cabCap(l))}
 const c=dv(k.slice(1));if(!c)return 0;const i=c.ifaces.findIndex(f=>f.wifi&&f.ssid),q=i>=0?peer(c,i):null;return q?(typeof wfCap==='function'?wfCap(q.d,c):(wband(q.d,c)==='5'?300:72)):72}
const fmtRate=m=>m<1?(m*1000).toFixed(1)+' кбит/с':m.toFixed(m<10?2:1)+' Мбит/с';
const utilCol=u=>u>=.8?'var(--er)':u>=.5?'#e08a00':'var(--ok)';
const _draw10=draw;
draw=function(){if(!pk){TC.clear();scans()}
 _draw10();let under='',over='';
 (S.zones||[]).forEach(z=>{const s=sel===z.id;under+=`<g><rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="10" fill="${z.c}" fill-opacity=".07" stroke="${z.c}" stroke-width="${s?3:1.5}" stroke-dasharray="7 5" pointer-events="none"/><rect data-nid="${z.id}" x="${z.x}" y="${z.y}" width="${z.w}" height="22" rx="8" fill="${z.c}" fill-opacity=".3" style="cursor:move"/><text x="${z.x+8}" y="${z.y+15}" font-size="12" font-weight="600" fill="var(--tx)" pointer-events="none">${esc(z.t)}</text></g>`});
 S.links.forEach(l=>{const A=dv(l.a),B=dv(l.b);if(!A||!B)return;const ct=l.ct||'cat5e',c=CABLE[ct]||CABLE.cat5e,mx=(A.x+B.x)/2,my=(A.y+B.y)/2;
  if(l.bad)over+=`<line pointer-events="none" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="var(--er)" stroke-width="3" stroke-dasharray="3 5"/><text pointer-events="none" x="${mx}" y="${my+26}" font-size="11" fill="var(--er)" text-anchor="middle">${l.len} м &gt; ${c.max} м — связи нет</text>`;
  else{if(ct!=='cat5e'&&ct!=='cat6a')over+=`<line pointer-events="none" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="${c.col}" stroke-width="3" opacity=".85"/>`;
   if(S.heat){const L=LH['k'+l.id],last=L&&L[L.length-1],cap=capOfKey('k'+l.id)||1000;if(last){const u=(last.tr+last.fl)/cap;over+=`<line pointer-events="none" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="${utilCol(u)}" stroke-width="${3+Math.min(5,u*6)}" opacity=".9"/><text pointer-events="none" x="${mx}" y="${my-6}" font-size="11" font-weight="600" fill="${utilCol(u)}" text-anchor="middle">${Math.round(u*100)}%</text>`}}
   over+=`<text pointer-events="none" x="${mx}" y="${my+13}" font-size="9" fill="var(--mt)" text-anchor="middle">${c.l.replace('Витая пара ','').replace('Оптика ','опт. ')} · ${l.len||10} м</text>`}});
 S.devs.forEach(c=>c.ifaces.forEach((f,i)=>{if(!f.tun)return;const q=peer(c,i);if(q&&c.id<q.d.id){const st=TST[c.id+':'+i],pa=(st&&st.path||[]).map(dv).filter(Boolean);
  if(pa.length>1)over+=`<polyline pointer-events="none" fill="none" stroke="#a259ff" stroke-width="3" stroke-dasharray="2 6" opacity=".8" points="${pa.map(x=>x.x+','+(x.y-6)).join(' ')}"/>`;
  over+=`<text pointer-events="none" x="${(c.x+q.d.x)/2}" y="${(c.y+q.d.y)/2-20}" font-size="11" font-weight="600" fill="#a259ff" text-anchor="middle">${f.tun.mode.toUpperCase()}-туннель</text>`}}));
 (S.notes||[]).forEach(n=>{const lines=String(n.t).split('\n'),w=Math.max(70,Math.max(...lines.map(s=>s.length))*7+16),h=lines.length*15+12,s=sel===n.id;
  over+=`<g data-nid="${n.id}" style="cursor:move"><rect x="${n.x}" y="${n.y}" width="${w}" height="${h}" rx="4" fill="${n.c}" stroke="${s?'var(--ac)':'#00000033'}" stroke-width="${s?3:1}"/>${lines.map((s2,i)=>`<text x="${n.x+8}" y="${n.y+18+i*15}" font-size="12" fill="#14202b" pointer-events="none">${esc(s2)}</text>`).join('')}</g>`});
 S.devs.forEach(d=>{if(d.rogue)over+=`<text pointer-events="none" x="${d.x+24}" y="${d.y-24}" font-size="11" fill="var(--er)">⚠ атакующий</text>`});
 cv.insertAdjacentHTML('afterbegin',under);cv.insertAdjacentHTML('beforeend',over);if(!pk)tunScan()};

// ---------- M. окна: журнал, NetFlow, нагрузка ----------
const lvl={2:'критично',4:'предупреждение',5:'уведомление',6:'информация'};
function logTable(min){const rows=LOGS.filter(l=>l.sev<=min).slice(-200).reverse();return`<table class="t"><tr><th>Время</th><th>Уровень</th><th>Событие</th></tr>${rows.map(l=>`<tr><td>${new Date(l.t).toLocaleTimeString('ru')}</td><td class="${l.sev<=2?'er':''}">${l.sev} · ${lvl[l.sev]}</td><td>${esc(l.x.replace(/^\S+\s+/,''))}</td></tr>`).join('')||'<tr><td colspan="3" class="mt">Событий нет</td></tr>'}</table>`}
const logHtml=()=>`<h3>Журнал событий (syslog)</h3><p class="mt">Сюда попадают события безопасности и сети: port security, DHCP snooping, DAI, BPDU guard, storm control, состояние туннелей, перегрузка кабелей и тревоги IDS. Уровни как в syslog: 2 — тревога IDS, 4 — предупреждение, 5 — уведомление, 6 — информация.</p><p><button data-x="lg_f6">Все</button> <button data-x="lg_f5">Уведомления и выше</button> <button data-x="lg_f4">Предупреждения и выше</button> <button data-x="lg_f2">Тревоги IDS</button> <button data-x="lg_cp">Экспорт в текст</button> <button data-x="lg_clr">Очистить</button></p><div id="lg_t">${logTable(6)}</div><div id="lg_x"></div>`;
function nfTable(rows){const tot=rows.reduce((s,r)=>s+r.bytes,0)||1,src={};rows.forEach(r=>src[r.src]=(src[r.src]||0)+r.bytes);
 return`<table class="t"><tr><th>Источник</th><th>Получатель</th><th>Протокол / порт</th><th>Пакетов</th><th>Байт</th><th>Успешно / ошибок</th></tr>${rows.slice(0,40).map(r=>`<tr><td>${esc(nameOfIp(r.src))}</td><td>${esc(nameOfIp(r.dst))}</td><td>${r.p}${r.n?'/'+r.n+' '+esc(portName(r.p,r.n)):''}</td><td>${r.pkts}</td><td>${r.bytes}<div class="bar" style="width:${Math.max(2,100*r.bytes/tot)}%"></div></td><td>${r.ok} / ${r.bad}</td></tr>`).join('')||'<tr><td colspan="6" class="mt">Потоков пока нет: отправьте ping, connect, curl или запустите таймер</td></tr>'}</table>`+
 (Object.keys(src).length?'<p class="mt"><b>Главные источники трафика:</b> '+Object.entries(src).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>esc(nameOfIp(k))+' — '+Math.round(100*v/tot)+'%').join(', ')+'</p>':'')}
const nfHtml=obs=>`<h3>NetFlow: потоки через точку наблюдения</h3><p class="mt">Каждая отправка (ping, send, connect, curl, scan, таймеры) создаёт запись потока: кто, кому, протокол и порт, пакеты, байты, результат. Размеры — учебная оценка. Выберите устройство, и вы увидите потоки, прошедшие через него, — как экспорт NetFlow с маршрутизатора или коммутатора.</p><p>Точка наблюдения: <select id="nf_o"><option value="">вся сеть</option>${S.devs.map(d=>`<option value="${d.id}" ${obs===d.id?'selected':''}>${esc(d.name)}</option>`).join('')}</select> <button data-x="nf_go">Показать</button> <button data-x="nf_csv">CSV</button> <button data-x="nf_clr">Сбросить</button></p><div id="nf_t">${nfTable(nfRows(obs||null))}</div><div id="nf_x"></div>`;
function spark(a){const W=300,H=46,n=60,pts=a.slice(-n).map(x=>x.tr+x.fl),mx=Math.max(...pts,.0001),X=i=>W-(pts.length-1-i)*W/(n-1),Y=v=>H-3-(v/mx)*(H-8);
 if(pts.length<2)return`<svg class="spk" viewBox="0 0 ${W} ${H}"></svg>`;const ln=pts.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)).join(' ');
 return`<svg class="spk" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${ln} L${W} ${H} L${X(0).toFixed(1)} ${H} Z" fill="var(--ac)" opacity=".15"/><path d="${ln}" fill="none" stroke="var(--ac)" stroke-width="1.6"/></svg>`}
function loadRows(){const keys=[];S.links.forEach(l=>{l.id=l.id||rid();keys.push('k'+l.id)});S.devs.forEach(d=>{if(d.ifaces.some((f,i)=>f.wifi&&peer(d,i)))keys.push('w'+d.id)});
 const nm=k=>{if(k[0]==='k'){const l=S.links.find(x=>'k'+x.id===k);return l&&dv(l.a)&&dv(l.b)?`${dv(l.a).name} ↔ ${dv(l.b).name}`:k}return 'Wi‑Fi: '+(dv(k.slice(1))||{name:k}).name};
 const rows=keys.map(k=>{const a=LH[k]||[],last=a[a.length-1]||{tr:0,fl:0},now=last.tr+last.fl,pk2=Math.max(0,...a.map(x=>x.tr+x.fl)),cap=capOfKey(k)||1,u=now/cap;return{k,n:nm(k),now,pk2,cap,u,a}}).sort((x,y)=>y.u-x.u||y.now-x.now);
 return`<table class="t"><tr><th>Линк</th><th>Скорость</th><th>Сейчас</th><th>Пик (1 мин)</th><th>Загрузка</th><th style="width:34%">График</th></tr>${rows.map(r=>`<tr><td>${esc(r.n)}</td><td>${fmtRate(r.cap)}</td><td>${fmtRate(r.now)}</td><td>${fmtRate(r.pk2)}</td><td style="color:${utilCol(r.u)}"><b>${Math.round(r.u*100)}%</b></td><td>${spark(r.a)}</td></tr>`).join('')||'<tr><td colspan="6" class="mt">Нет линков</td></tr>'}</table>`}
const loadHtml=()=>`<h3>Нагрузка на линки</h3><p class="mt">График за последнюю минуту (шаг 1 с). Складывается тестовый трафик (ping, send, connect, scan, таймеры) и постоянные потоки из окна «QoS». Загрузка считается от скорости линка с учётом типа кабеля и команд speed. Пакеты ping очень малы — чтобы увидеть заметную нагрузку, создайте потоки в окне «QoS» (например, видео 800 Мбит/с).</p><p><label><input type="checkbox" id="ld_h" ${S.heat?'checked':''} style="width:auto"> Показывать загрузку цветом на схеме</label></p><div id="lg">${loadRows()}</div>`;
function steadyLoad(){const o={};if(!(S.flows||[]).length)return o;QUIET++;const pk0={...PK};
 try{(S.flows||[]).forEach(f=>{const s=dv(f.src);if(!s)return;const t=S.devs.find(x=>x.name.toLowerCase()===String(f.dst).toLowerCase()),ip=t?(srcIp(t)||addrOf6(t)):f.dst;if(!ip)return;const r=trip(s,ip);if(!r.ok)return;legsOf(EX.filter(x=>!x.rep&&!x.err)).forEach(k=>{o[k]=(o[k]||0)+f.mbit})})}
 finally{QUIET--;Object.keys(PK).forEach(k=>{if(k in pk0)PK[k]=pk0[k];else delete PK[k]})}return o}
function sampleLoad(){const steady=steadyLoad(),now=Date.now(),keys=new Set([...Object.keys(ACC),...Object.keys(steady)]);
 S.links.forEach(l=>keys.add('k'+(l.id=l.id||rid())));S.devs.forEach(d=>{if(d.ifaces.some(f=>f.wifi&&f.ssid))keys.add('w'+d.id)});
 keys.forEach(k=>{const a=LH[k]=LH[k]||[];a.push({t:now,tr:(ACC[k]||0)/1e6,fl:steady[k]||0});if(a.length>90)a.shift()});ACC={}}
setInterval(()=>{try{sampleLoad()}catch(_){}},1000);
setInterval(()=>{const el=$('#lg');if(el&&!md.hidden)el.innerHTML=loadRows()},2000);
md.addEventListener('change',e=>{if(e.target.id==='ld_h'){S.heat=e.target.checked;ch()}});
md.addEventListener('click',e=>{const x=e.target.dataset.x;if(!x)return;
 if(/^lg_f\d$/.test(x))$('#lg_t').innerHTML=logTable(+x.slice(4));
 else if(x==='lg_clr'){LOGS.length=0;ALERTS.length=0;$('#lg_t').innerHTML=logTable(6)}
 else if(x==='lg_cp')$('#lg_x').innerHTML=`<textarea readonly style="width:100%;height:170px">${esc(LOGS.map(fmtLog).join('\n'))}</textarea>`;
 else if(x==='nf_go')$('#nf_t').innerHTML=nfTable(nfRows($('#nf_o').value||null));
 else if(x==='nf_clr'){FLOWS.length=0;$('#nf_t').innerHTML=nfTable([])}
 else if(x==='nf_csv')$('#nf_x').innerHTML=`<textarea readonly style="width:100%;height:150px">${esc('источник,получатель,протокол,порт,пакетов,байт,успешно,ошибок\n'+nfRows($('#nf_o').value||null).map(r=>[nameOfIp(r.src),nameOfIp(r.dst),r.p,r.n,r.pkts,r.bytes,r.ok,r.bad].join(',')).join('\n'))}</textarea>`});
$('#bt').insertAdjacentHTML('beforebegin','<button id="blg">Журнал</button><button id="bnf">NetFlow</button><button id="bld">Нагрузка</button>');
$('#blg').onclick=()=>openMd(logHtml());$('#bnf').onclick=()=>openMd(nfHtml(''));$('#bld').onclick=()=>openMd(loadHtml());


// ---------- N. задания: проверка с портами, редактор, пользовательские задания ----------
let CT=[];try{CT=JSON.parse(localStorage.getItem('netlab_ct')||'[]')}catch(_){CT=[]}
const saveCT=()=>{try{localStorage.setItem('netlab_ct',JSON.stringify(CT))}catch(_){}};
function syncTasks(){for(let i=TASKS.length-1;i>=0;i--)if(TASKS[i].custom)TASKS.splice(i,1);CT.forEach((k,i)=>TASKS.push({...k,custom:true,ci:i}))}
check=function(i){const k=TASKS[i];if(!k)return;const t=REPT[i]=REPT[i]||{n:0,t0:Date.now(),ok:0};t.n++;let h='',all=1;QUIET++;
 try{
  (k.c||[]).forEach(([a,b,e,pr,pt])=>{const f=n=>S.devs.find(d=>d.name.toLowerCase()===String(n).toLowerCase()),A=f(a),B=f(b);
   if(!A){all=0;h+=`<p class="er">✘ Нет устройства «${esc(a)}» — назовите его так в панели справа</p>`;return}
   if(!B&&ip2n(b)==null&&v6(b)===null){all=0;h+=`<p class="er">✘ Нет устройства «${esc(b)}» — назовите его так в панели справа</p>`;return}
   const bip=B?((k.v6?addrOf6(B):null)||srcIp(B)||addrOf6(B)):b,lab=pr?`${String(pr).toUpperCase()}/${pt} `:'';let ok=false,why='';
   if(!bip)why=`у ${b} нет IP-адреса`;
   else if(pr){const R=l4(A,bip,pr,+pt);ok=R.ok;why=R.msg||''}
   else{const r=trip(A,bip);ok=!!r.ok;const er=lastErr();why=er?er.x+(er.fix?'. '+er.fix:''):''}
   const good=ok===!!e;if(!good)all=0;
   h+=`<p class="${good?'ok':'er'}">${good?'✔':'✘'} ${esc(a)} → ${esc(b)} ${lab}: ${ok?'дошло':'не дошло'} (ожидалось: ${e?'дойдёт':'будет заблокировано'})${good?'':'<br>'+esc(e?why:'Прошло, а должно блокироваться: проверьте VLAN, зоны, acl, брандмауэр узла.')}</p>`});
  if(k.fn){const[r,m]=k.fn();if(!r)all=0;h+=`<p class="${r?'ok':'er'}">${r?'✔':'✘'} ${esc(m)}</p>`}
 }finally{QUIET--}
 const el=$('#r'+i);if(el)el.innerHTML=h+(all?'<p class="ok"><b>Задание выполнено</b></p>':'<p class="mt">Пока не всё. Исправьте схему и проверьте снова.</p>');
 if(all&&!t.ok)t.ok=Math.max(1,Math.round((Date.now()-t.t0)/60000));return all};
const tasksHtml=()=>'<h3>Задания</h3><p class="mt">Стройте схему, называйте устройства как в задании, затем нажмите «Проверить». Проверка отправляет тестовые пакеты (ICMP, TCP, UDP) и объясняет, что не так. Свои задания создаются в «Инструменты → Редактор заданий».</p>'+TASKS.map((k,i)=>`<div class="tk"><b>${esc(k.t)}</b>${k.custom?' <span class="mt">(авторское)</span>':''}<p>${esc(k.d)}</p><button data-chk="${i}">Проверить</button>${k.start?` <button data-x="ct_load" data-i="${k.ci}">Загрузить стартовую схему</button>`:''}<div id="r${i}"></div></div>`).join('');
$('#bt').onclick=()=>openMd(tasksHtml());
let ED={t:'',d:'',c:[{a:'',b:'',e:'1',pr:'icmp',pt:''}],start:false};
function edSync(){if(!$('#ed_t'))return;ED.t=$('#ed_t').value;ED.d=$('#ed_d').value;ED.start=$('#ed_s').checked;
 ED.c=[...document.querySelectorAll('#ed_c .ed_r')].map(r=>({a:r.querySelector('.a').value,b:r.querySelector('.b').value,e:r.querySelector('.e').value,pr:r.querySelector('.pr').value,pt:r.querySelector('.pt').value}))}
const edHtml=()=>`<h3>Редактор заданий</h3><p class="mt">Создайте своё задание: условие и проверки «кто → кому, должно ли дойти». Студенты увидят его в окне «Задания» и смогут проверить себя автоматически. Задания хранятся в браузере; их можно выгрузить текстом и передать группе. Имена устройств в проверках должны совпадать с именами на схеме студента.</p>
<p><input id="ed_t" placeholder="Название задания" style="width:100%" value="${esc(ED.t)}"></p><p><textarea id="ed_d" placeholder="Условие и теория: что построить, какие адреса, зачем" style="width:100%;height:90px">${esc(ED.d)}</textarea></p>
<div id="ed_c">${ED.c.map((r,i)=>`<div class="ed_r" style="margin:4px 0"><input class="a" placeholder="откуда (имя)" value="${esc(r.a)}" style="width:110px"> → <input class="b" placeholder="куда (имя или IP)" value="${esc(r.b)}" style="width:130px"> <select class="e"><option value="1" ${r.e==='1'?'selected':''}>должно дойти</option><option value="0" ${r.e==='0'?'selected':''}>должно блокироваться</option></select> <select class="pr"><option ${r.pr==='icmp'?'selected':''}>icmp</option><option ${r.pr==='tcp'?'selected':''}>tcp</option><option ${r.pr==='udp'?'selected':''}>udp</option></select> порт <input class="pt" value="${esc(r.pt)}" style="width:60px"> <button data-x="ed_rm" data-i="${i}">✕</button></div>`).join('')}</div>
<p><button data-x="ed_row">+ Проверка</button> <label><input type="checkbox" id="ed_s" ${ED.start?'checked':''}> приложить текущую схему как стартовую (студент загрузит её кнопкой)</label></p><p><button data-x="ed_save">Сохранить задание</button> <span id="ed_m" class="mt"></span></p>
<h4>Мои задания</h4>${CT.map((k,i)=>`<div class="tk"><b>${esc(k.t)}</b> <span class="mt">проверок: ${k.c.length}${k.start?', есть стартовая схема':''}</span> <button data-x="ed_del" data-i="${i}">Удалить</button></div>`).join('')||'<p class="mt">Пока нет</p>'}
<p><button data-x="ed_exp">Экспорт заданий</button> <button data-x="ed_imp">Импорт (вставьте текст ниже)</button></p><textarea id="ed_x" style="width:100%;height:100px" placeholder="Здесь текст для экспорта/импорта"></textarea>`;
md.addEventListener('click',e=>{const t=e.target,x=t.dataset.x;if(!x||!/^(ed_|ct_)/.test(x))return;
 if(x==='ct_load'){const k=CT[+t.dataset.i];if(k&&k.start){try{if(!schemeSet(JSON.parse(k.start)))throw 0;md.hidden=true;p('Загружена стартовая схема задания «'+k.t+'»')}catch(_){p('Не удалось загрузить схему')}}return}
 edSync();
 if(x==='ed_row'){ED.c.push({a:'',b:'',e:'1',pr:'icmp',pt:''});openMd(edHtml())}
 else if(x==='ed_rm'){ED.c.splice(+t.dataset.i,1);if(!ED.c.length)ED.c.push({a:'',b:'',e:'1',pr:'icmp',pt:''});openMd(edHtml())}
 else if(x==='ed_save'){const rows=ED.c.filter(r=>r.a.trim()&&r.b.trim());if(!ED.t.trim()||!rows.length){$('#ed_m').textContent='Нужны название и хотя бы одна проверка (откуда и куда)';$('#ed_m').className='mt er';return}
  CT.push({t:ED.t.trim(),d:ED.d.trim(),c:rows.map(r=>[r.a.trim(),r.b.trim(),+r.e,r.pr==='icmp'?'':r.pr,+r.pt||0]),start:ED.start?JSON.stringify(S):''});saveCT();syncTasks();
  ED={t:'',d:'',c:[{a:'',b:'',e:'1',pr:'icmp',pt:''}],start:false};openMd(edHtml());$('#ed_m').textContent='Задание сохранено — оно появилось в окне «Задания»';$('#ed_m').className='mt ok'}
 else if(x==='ed_del'){CT.splice(+t.dataset.i,1);saveCT();syncTasks();openMd(edHtml())}
 else if(x==='ed_exp')$('#ed_x').value=JSON.stringify(CT);
 else if(x==='ed_imp'){try{const j=JSON.parse($('#ed_x').value);if(!Array.isArray(j))throw 0;j.forEach(k=>{if(k&&k.t&&Array.isArray(k.c))CT.push({t:String(k.t),d:String(k.d||''),c:k.c,start:k.start||''})});saveCT();syncTasks();openMd(edHtml())}catch(_){$('#ed_m').textContent='Не удалось прочитать текст (нужен JSON, выгруженный кнопкой «Экспорт»)';$('#ed_m').className='mt er'}}});

// ---------- O. инструменты: службы и порты ----------
const _th10=toolsHtml;
toolsHtml=function(){const ps=S.devs.filter(d=>d.t==='pc'||d.t==='rt').map(d=>`<option>${esc(d.name)}</option>`).join('');
 return _th10()+`<h4>Службы и порты (TCP/UDP)</h4><p class="mt">Подключение к службе на узле: пакет пройдёт по схеме, а в консоли будет разбор — открыт порт, закрыт (RST) или отфильтрован (тайм-аут).</p><p><select id="tl2_s">${ps}</select> → <input id="tl2_d" placeholder="узел (имя или IP)" style="width:150px"> <select id="tl2_k">${Object.entries(SVC).map(([k,v])=>`<option value="${k}">${v[2]} ${v[0]}/${v[1]}</option>`).join('')}</select> <button data-x="tl2_con">Подключиться</button> <button data-x="tl2_scan">Сканировать порты</button></p><pre id="tl2_o" style="background:#0a1117;color:#cfdce8;padding:8px;border-radius:6px;min-height:20px;white-space:pre-wrap;font:12px ui-monospace,monospace"></pre>
<h4>Безопасность и анализ</h4><p><button data-x="tl2_log">Журнал (syslog)</button> <button data-x="tl2_nf">NetFlow</button> <button data-x="tl2_ld">Нагрузка на линки</button> <button data-x="tl2_ed">Редактор заданий</button></p>`};
md.addEventListener('click',e=>{const x=e.target.dataset.x;if(!x||!x.startsWith('tl2_'))return;
 if(x==='tl2_log')return openMd(logHtml());if(x==='tl2_nf')return openMd(nfHtml(''));if(x==='tl2_ld')return openMd(loadHtml());if(x==='tl2_ed')return openMd(edHtml());
 const s=S.devs.find(d=>d.name===$('#tl2_s').value),dst=$('#tl2_d').value.trim();if(!s||!dst){$('#tl2_o').textContent='Укажите отправителя и узел назначения';return}
 if(x==='tl2_con'){const v=SVC[$('#tl2_k').value];md.hidden=true;sel=s.id;side();draw();sendL4(s,dst,v[0],v[1])}
 else if(x==='tl2_scan'){const b=out.textContent.length;scanPorts(s,dst,'common');$('#tl2_o').textContent=out.textContent.slice(b)}});

// ---------- P. готовые задания 10–13 ----------
TASKS.push(
{t:'10. DMZ и межсетевой экран',d:'Постройте: ПК PC1 во внутренней сети (зона inside), веб-сервер Web в DMZ (зона dmz, служба http, порт 80), узел Internet во внешней сети (outside); между ними межсетевой экран FW (3 интерфейса, зоны уже стоят по умолчанию). Опубликуйте http: publish tcp 80. Результат: из Интернета доступен только веб-сервер и только по HTTP, внутренняя сеть из Интернета и из DMZ недоступна, а PC1 ходит и в DMZ, и наружу. Теория: зоны безопасности и DMZ; публикуются только нужные службы.',c:[['Internet','Web',1,'tcp',80],['Internet','Web',0,'tcp',22],['Internet','PC1',0,'tcp',80],['PC1','Web',1,'tcp',80],['PC1','Internet',1,'icmp',0],['Web','PC1',0,'tcp',80]]},
{t:'11. IPv6 и SLAAC',d:'Маршрутизатор R1 (v6route on) с адресом 2001:db8:1::1/64 на интерфейсе в сторону ПК. ПК PC1 и PC2 в одной сети получают адреса автоматически (slaac) и пингуют друг друга по IPv6, а также PC1 достучится до PC3 в другой сети 2001:db8:2::/64 за R1. Теория: адрес = префикс /64 + идентификатор EUI-64 из MAC; вместо ARP работает NDP; без ipv6 unicast-routing маршрутизатор пакеты не пересылает.',v6:1,c:[['PC1','PC2',1],['PC2','PC1',1],['PC1','PC3',1]]},
{t:'12. VPN между филиалами (GRE / IPsec)',d:'Два офиса с частными сетями (PC1 в офисе A, PC2 в офисе B), между маршрутизаторами RA и RB — «Интернет» (маршрутизатор ISP), который не знает частных сетей. Настройте туннель между внешними адресами RA и RB (tunnel <local> <remote> ipsec ключ), дайте туннелям адреса /30 и пропишите маршруты к частным сетям через туннель. Результат: PC1 ↔ PC2 работает, а между PC1 и ISP частных адресов нет. Теория: туннель инкапсулирует трафик, IPsec добавляет шифрование; оба конца должны совпадать по режиму и ключу.',c:[['PC1','PC2',1],['PC2','PC1',1]]},
{t:'13. Защита от поддельного DHCP',d:'В сети: управляемый коммутатор MSW1, DHCP-маршрутизатор R1 (пул на интерфейсе в сторону коммутатора), клиент PC1 и узел злоумышленника Attacker1 с поддельным DHCP-сервером (dhcp eth0 <первый адрес> 20 в той же подсети). Без защиты PC1 может получить шлюз злоумышленника. Включите на MSW1 DHCP snooping (snooping on) и отметьте доверенным порт к R1 (trust <порт>). Проверка обновит адрес у PC1 и убедится, что шлюз выдал настоящий сервер.',fn:()=>{const c=S.devs.find(d=>d.name==='PC1'),a=S.devs.find(d=>d.name==='Attacker1');if(!c||!a)return[0,'Нужны устройства PC1 и Attacker1'];c.ifaces[0].ip='';c.ifaces[0].mask='';c.gw='';dhcp(c,0);const bad=a.ifaces.some(f=>f.ip&&f.ip===c.gw);return c.gw&&!bad?[1,'Клиент получил шлюз '+c.gw+' от настоящего сервера']:[0,c.gw?'Клиент получил шлюз '+c.gw+' — это адрес злоумышленника':'Клиент не получил адрес (проверьте доверенный порт к настоящему DHCP-серверу)']},c:[]}
);
syncTasks();


// ---------- Q. инструкция: новые разделы ----------
MAN.splice(MAN.length-1,0,
['TCP и UDP: порты и службы',`<p>IP-адрес находит <b>узел</b>, а <b>порт</b> (число 1–65535) — конкретную <b>службу</b> на нём: веб-сервер слушает TCP/80, SSH — TCP/22, DNS — UDP/53. Пара «адрес + порт» и есть точка подключения.</p>
<ul><li><b>TCP</b> — с установлением соединения: рукопожатие SYN → SYN-ACK → ACK, потом обмен данными. Надёжен (повторы, порядок), нужен вебу, почте, SSH.</li><li><b>UDP</b> — без соединений: отправил датаграмму и всё; быстро, но без гарантий. Нужен DNS, DHCP, голосу и видео.</li></ul>
<h4>Три исхода TCP-подключения — важнейший приём диагностики</h4>
<table class="t"><tr><th>Что вы увидели</th><th>Что это значит</th></tr>
<tr><td><b>Соединение установлено</b></td><td>Узел доступен, порт открыт, служба слушает.</td></tr>
<tr><td><b>Порт закрыт (RST, Connection refused)</b></td><td>Пакет дошёл, узел ответил «здесь никто не слушает». Проблема не в сети, а в том, что служба не запущена или неверный порт.</td></tr>
<tr><td><b>Тайм-аут (порт «фильтруется»)</b></td><td>Ответа нет вообще: пакет молча отброшен межсетевым экраном, ACL или брандмауэром узла. Проблема в политике безопасности.</td></tr></table>
<p><b>Команды.</b> На сервере: <code>service add http</code>, <code>service add tcp 8080</code>, <code>service</code> (список), <code>service del http</code>. На клиенте: <code>connect Server http</code>, <code>curl Server</code>, <code>curl https://Server</code>, <code>ssh Server</code>, <code>telnet Server 23</code>, <code>netstat</code> (слушающие порты и подключения). Брандмауэр самого узла: <code>block tcp 22</code> / <code>unblock tcp 22</code>. ACL на маршрутизаторе теперь понимает порты: <code>acl deny 192.168.1.0/24 192.168.2.0/24 tcp 80</code> (запретить только веб).</p>
<p><b>Сканер портов</b> (<code>scan Server</code>, <code>scan Server 1-200</code>, <code>scan Server 22,80,443</code>) показывает открытые, закрытые и отфильтрованные порты. Так находят «лишние» службы при аудите — и так же действует злоумышленник; IDS (см. раздел ниже) увидит такое сканирование.</p>
<div class="tip"><b>Принцип наименьших привилегий:</b> на сервере должны слушать только нужные порты; снаружи доступны только опубликованные.</div>`],
['IPv6: адреса, SLAAC, NDP',`<p>В IPv4 адресов 2<sup>32</sup> (≈4,3 млрд) — их не хватило, поэтому NAT. В <b>IPv6</b> адрес 128-битный: 8 групп по 4 шестнадцатеричных цифры, нули можно сокращать (<code>::</code> один раз): <code>2001:0db8:0001:0000:0000:0000:0000:0010</code> = <code>2001:db8:1::10</code>. Префикс записывают так же, как маску в IPv4: <code>2001:db8:1::/64</code>. Адреса из <code>2001:db8::/32</code> зарезервированы для документации — ими удобно учиться.</p>
<table class="t"><tr><th>Тип</th><th>Пример</th><th>Смысл</th></tr><tr><td>Глобальный unicast</td><td>2000::/3</td><td>Маршрутизируется в Интернете</td></tr><tr><td>Link-local</td><td>fe80::/10</td><td>Только внутри одного канала; есть на каждом интерфейсе всегда; шлюзом часто служит именно он</td></tr><tr><td>Multicast</td><td>ff02::1, ff02::2</td><td>Вместо широковещания: все узлы, все маршрутизаторы</td></tr></table>
<p><b>Что изменилось по сравнению с IPv4:</b> широковещания нет; вместо ARP работает <b>NDP</b> (Neighbor Solicitation / Advertisement); маска только в виде длины префикса (обычно /64 для сети); узел может сам получить адрес — <b>SLAAC</b>: маршрутизатор рассылает Router Advertisement с префиксом, а хост добавляет идентификатор интерфейса <b>EUI-64</b>, построенный из MAC-адреса (в середину вставляется ff:fe, инвертируется седьмой бит).</p>
<p><b>Настройка в симуляторе.</b> ПК: <code>ip6 2001:db8:1::10/64</code>, <code>gateway6 2001:db8:1::1</code>, либо автоматически <code>slaac</code>. Маршрутизатор: <code>v6route on</code> (аналог <code>ipv6 unicast-routing</code> — <b>без него IPv6-пакеты не пересылаются</b>, частая ошибка), <code>ip6 gi0/0 2001:db8:1::1/64</code>, <code>route6 add 2001:db8:2::/64 2001:db8:12::2</code>, <code>acl6 deny 2001:db8:1::/64 2001:db8:2::/64</code>. Просмотр: <code>ipv6</code>, <code>route6</code>. Проверка: <code>ping 2001:db8:2::10</code> или <code>ping6 …</code>; кнопка «Проверить IPv6» в окне «Трафик» строит матрицу связности.</p>
<p>В Cisco-стиле: <code>ipv6 unicast-routing</code>, в режиме интерфейса <code>ipv6 address 2001:db8:1::1/64</code>, <code>ipv6 route 2001:db8:2::/64 2001:db8:12::2</code>.</p>`],
['Межсетевой экран: зоны безопасности и DMZ',`<p>Межсетевой экран (МЭ) разделяет сеть на <b>зоны доверия</b> и пропускает трафик между ними по правилам. Три классические зоны:</p>
<ul><li><b>inside</b> — внутренняя сеть (сотрудники, внутренние серверы), самая доверенная;</li><li><b>dmz</b> — «демилитаризованная зона» для публичных серверов (веб, почта): к ним обращаются из Интернета, поэтому они наиболее рискованны;</li><li><b>outside</b> — Интернет, не доверенная.</li></ul>
<table class="t"><tr><th>Откуда → куда</th><th>Политика</th></tr><tr><td>inside → любая зона</td><td>разрешено</td></tr><tr><td>dmz → outside</td><td>разрешено (обновления, ответы)</td></tr><tr><td>outside → dmz</td><td>только <b>опубликованные</b> службы (publish)</td></tr><tr><td>outside → inside, dmz → inside</td><td>запрещено</td></tr></table>
<p><b>Зачем DMZ.</b> Если веб-сервер взломают, злоумышленник окажется в DMZ, а не во внутренней сети: из DMZ в inside доступ закрыт. Это называют <i>сдерживанием ущерба</i>.</p>
<p><b>Настройка.</b> Выберите устройство «Межсетевой экран» (интерфейсы: gi0/0 — outside, gi0/1 — inside, gi0/2 — dmz; можно менять в панели или командой <code>zone gi0/2 dmz</code>). Публикация: <code>publish tcp 80</code>, <code>publish tcp 443</code>, <code>publish icmp</code>; снять: <code>unpublish tcp 80</code>; просмотр: <code>show zones</code>. Проверка: с узла внешней сети <code>connect Web http</code> должен работать, а <code>connect Web ssh</code> и любые обращения к inside — давать тайм-аут («фильтруется»). Политика зон включается, если зона задана хотя бы у одного интерфейса маршрутизатора; обычные ACL (<code>acl</code>) работают поверх неё.</p>
<div class="tip"><b>Типичные ошибки:</b> забыли опубликовать порт (из Интернета тайм-аут); опубликовали лишнее (SSH наружу); поместили внутренние серверы в DMZ; перепутали зоны интерфейсов.</div>`],
['VPN: туннели GRE и IPsec',`<p><b>Туннель</b> позволяет соединить две частные сети через чужую (Интернет), как будто они соединены кабелем: исходный пакет упаковывается в новый, внешний. Промежуточные маршрутизаторы видят только внешний заголовок и ничего не знают о частных адресах внутри.</p>
<ul><li><b>GRE</b> — простая инкапсуляция (IP-протокол 47): умеет переносить разный трафик (в том числе маршрутизацию OSPF), но <b>не шифрует</b>.</li><li><b>IPsec</b> — шифрование и проверка целостности (протокол ESP, 50; обмен ключами IKE, UDP/500). Стороны сначала договариваются (устанавливают <b>SA</b>) — для этого нужны общие параметры и ключ (PSK).</li></ul>
<p><b>Как настроить в симуляторе.</b> На маршрутизаторе каждого офиса: <code>tunnel &lt;local_внешний_ip&gt; &lt;remote_внешний_ip&gt; gre</code> или <code>… ipsec &lt;ключ&gt;</code>; затем адрес туннельного интерфейса: <code>ip Tunnel0 10.99.0.1 /30</code> (на другом конце <code>10.99.0.2</code>), затем маршрут к частной сети другого офиса <b>через туннель</b>: <code>route add 192.168.2.0 /24 10.99.0.2</code> (или включите OSPF/RIP на туннеле). Состояние: <code>show tunnels</code> или панель устройства.</p>
<p><b>Почему туннель не поднимается</b> (симулятор называет причину): нет пути между внешними адресами; на другом конце туннель не настроен (нужны зеркальные local/remote); режимы GRE и IPsec не совпали; ключи IPsec разные; межсетевой экран не пропускает GRE/ESP (опубликуйте <code>publish gre</code> или <code>publish esp</code>); <b>рекурсивная маршрутизация</b> — маршрут до конца туннеля указывает в сам туннель (классическая ошибка: туннель то поднимается, то падает).</p>
<div class="tip"><b>Важно:</b> маршрут в частную сеть должен смотреть в туннель, а маршрут до внешнего адреса партнёра — в Интернет, не наоборот.</div>`],
['Атаки на L2 и защита: DHCP snooping, DAI, BPDU guard, storm control',`<p>Доступ к кабелю или розетке в офисе — это доступ к сети, поэтому на коммутаторах доступа включают защитные механизмы. Для демонстрации есть <b>узел злоумышленника</b> (в списке «Безопасность»).</p>
<table class="t"><tr><th>Атака</th><th>Что делает злоумышленник</th><th>Защита</th></tr>
<tr><td>Поддельный DHCP-сервер</td><td>Отвечает клиентам быстрее настоящего сервера и выдаёт свой шлюз и DNS — трафик идёт через него</td><td><b>DHCP snooping</b>: ответы сервера принимаются только с доверенных (trusted) портов</td></tr>
<tr><td>ARP-spoofing</td><td>Объявляет «этот IP — мой MAC» (обычно подменяет адрес шлюза): жертва шлёт трафик ему</td><td><b>Dynamic ARP Inspection</b>: ARP сверяется с таблицей привязок IP–MAC, собранной snooping</td></tr>
<tr><td>Чужой коммутатор в порт доступа</td><td>Подключает коммутатор с приоритетом 0 и становится корнем STP — трафик меняет путь</td><td><b>BPDU guard</b>: порт доступа выключается при появлении BPDU</td></tr>
<tr><td>Шторм (петля)</td><td>Подключает кабель «кольцом», широковещательный трафик парализует сеть</td><td><b>STP</b> и <b>storm control</b> (отключает порт при превышении порога)</td></tr>
<tr><td>Подключение постороннего устройства</td><td>Втыкает свой ноутбук / мини-хаб</td><td><b>Port security</b>, <b>802.1X</b></td></tr></table>
<p><b>Практика.</b> (1) Поддельный DHCP: на атакующем <code>dhcp eth0 192.168.1.200 20</code> (пул из той же подсети, шлюз клиентам по умолчанию — сам злоумышленник); на клиенте <code>dhcp</code> — клиент берёт адрес у более близкого сервера. Защита на управляемом коммутаторе: <code>snooping on</code> и <code>trust &lt;порт к настоящему серверу&gt;</code>, затем снова <code>dhcp</code> на клиенте. (2) ARP-spoofing: на атакующем <code>arpspoof PC1 192.168.1.1</code> (подделать шлюз для PC1); <code>forward on</code> превращает атаку в «человек посередине» (MITM, трафик доходит, но через злоумышленника), без forward — перехваченный трафик пропадает. Защита: <code>snooping on</code>, <code>dai on</code>, <code>trust</code> на порт к маршрутизатору. (3) <code>bpduguard all on</code> на портах доступа; затем подключите чужой коммутатор — порт уйдёт в err-disabled. (4) <code>storm on</code> на коммутаторах; выключите STP кнопкой сверху и замкните кольцо: порт отключится, шторм остановится. Просмотр привязок: <code>show snooping</code>.</p>
<div class="tip"><b>Модель упрощена:</b> DAI проверяет только подделки ARP, а легитимный ARP не проверяет; BPDU guard срабатывает на прямое подключение коммутатора.</div>`],
['IDS и журнал событий (syslog)',`<p><b>IDS</b> (Intrusion Detection System) — система обнаружения вторжений: она не блокирует, а <b>замечает</b> подозрительное поведение и сообщает. Добавьте «Датчик IDS» (список «Безопасность») и подключите его кабелем к коммутатору или маршрутизатору — он видит трафик, проходящий через это устройство, и события L2 в своём сегменте.</p>
<table class="t"><tr><th>Признак (сигнатура)</th><th>Порог в симуляторе</th></tr><tr><td>Сканирование портов</td><td>≥5 разных портов одного узла от одного источника за минуту</td></tr><tr><td>Подбор пароля</td><td>≥5 подключений к SSH/Telnet/FTP/RDP одного узла за минуту</td></tr><tr><td>ICMP-разведка</td><td>≥5 разных узлов за минуту</td></tr><tr><td>Обход межсетевого экрана</td><td>≥5 отклонённых МЭ/ACL обращений от одного источника</td></tr><tr><td>События L2</td><td>ARP-spoofing, поддельный DHCP, BPDU guard и т. п. в сегменте датчика</td></tr></table>
<p>Попробуйте: <code>scan Server</code> с узла злоумышленника — датчик выдаст тревогу. Автоматические проверки (матрица связности, задания) тревоги не вызывают. Мониторинг всей сети через <code>send *</code> по таймеру похож на разведку — такие «ложные срабатывания» реальны, и IDS настраивают.</p>
<p><b>Журнал (syslog)</b> — кнопка «Журнал»: все события безопасности и сети с уровнем важности (2 — тревога IDS, 4 — предупреждение, 5 — уведомление, 6 — информация), фильтр по уровню, экспорт текстом. Команда <code>syslog [N]</code> выводит последние события в консоль. Журнал нужен для расследования инцидентов: что, где, когда произошло.</p>`],
['NetFlow и графики нагрузки на линки',`<p><b>NetFlow</b> — учёт потоков: для каждого «разговора» (источник, получатель, протокол, порт) накапливаются пакеты и байты. Он отвечает на вопросы «кто больше всех грузит канал?» и «кто с кем общается?» — основа учёта трафика и расследований. В кнопке «NetFlow» выберите точку наблюдения (весь трафик или только прошедший через выбранное устройство), смотрите таблицу и главных источников, выгружайте CSV. Размеры пакетов — учебная оценка. Консоль: <code>netflow [устройство]</code>, <code>netflow clear</code>.</p>
<p><b>Нагрузка на линки</b> — кнопка «Нагрузка»: по каждому линку график за минуту, текущая и пиковая скорость, процент от пропускной способности (с учётом типа кабеля и <code>speed</code>). Постоянные потоки (например, видео 800 Мбит/с) задаются в окне «QoS», тестовые отправки добавляются сами. Галочка «Показывать загрузку цветом на схеме» окрашивает линки: зелёный — норма, оранжевый — выше 50%, красный — выше 80%.</p>
<div class="tip"><b>Зачем:</b> загрузка 70–80% на магистрали — повод расширять канал; перекос в NetFlow подсказывает, где нужен QoS.</div>`],
['Кабели, заметки, зоны, авто-раскладка, редактор заданий',`<p><b>Кабели.</b> Рядом с кнопкой «Кабель» выберите тип и длину нового соединения. Cat5e и Cat6a — «медь», предел <b>100 м</b> (Cat5e до 1 Гбит/с, Cat6a до 10); оптика многомодовая — до 550 м, одномодовая — до 10 км. Если длина больше предела, сигнал затухает: связь пропадает, линия краснеет, в панели и журнале причина. Тип и длину можно менять в панели устройства; скорость кабеля ограничивает линк (влияет на STP, QoS, нагрузку).</p>
<p><b>Заметки и зоны.</b> Список «Разметка…»: «Заметка» — стикер с текстом (адресный план, пояснения), «Зона» — рамка для группировки (отдел, этаж, DMZ). Кликните по полю, затем редактируйте текст, цвет и размер в панели; перетаскивайте мышью (зону — за верхнюю полосу). <b>Авто-раскладка</b> расставляет устройства по уровням: маршрутизаторы сверху, коммутаторы ниже, конечные узлы внизу (отмена — Ctrl+Z).</p>
<p><b>Редактор заданий</b> (Инструменты → «Редактор заданий»). Преподаватель задаёт название, условие, список проверок «откуда → куда, протокол и порт, должно дойти или блокироваться» и, при желании, прикладывает текущую схему как стартовую (например, схему с неисправностью). Студенты видят задание в окне «Задания», проверяют себя кнопкой и загружают стартовую схему. Задания выгружаются текстом и передаются группе (Экспорт / Импорт). Отчёт о выполнении — в «Инструменты → Отчёт по заданиям».</p>`]);
(()=>{const m=MAN.find(x=>x[0].startsWith('19.'));if(m)m[1]=m[1].replace(/<p><b>Ограничения[\s\S]*<\/p>\s*$/,'<p><b>Ограничения (это учебная модель):</b> трафик — это ICMP-пакеты и условные TCP/UDP-подключения без реальных сегментов, окон и повторных передач; NAT без таблицы портов; IPv6: нет DHCPv6, OSPFv3/RIPng, DNS-записей AAAA, ACL и зон только для IPv4/ICMPv6-упрощённо; STP и OSPF упрощены (без BPDU/LSA); IPsec моделируется как согласование режима и ключа, без шифрования; DAI проверяет только подделки ARP; IDS — несколько простых сигнатур; NetFlow и нагрузка — по учебной оценке размеров пакетов; Wi‑Fi — расстояние и диапазон без помех. Принципы при этом соответствуют реальным сетям — в настоящем оборудовании команды отличаются (Cisco, Eltex, MikroTik и др.), поэтому после симулятора изучайте документацию конкретного вендора.</p>')})();
p('Новое: TCP/UDP и службы (connect, curl, scan, service), IPv6 (ip6, slaac, route6), зоны/DMZ (zone, publish), VPN (tunnel), защита L2 (snooping, dai, bpduguard, storm), IDS, журнал, NetFlow, нагрузка, кабели, заметки/зоны, редактор заданий.');
draw();side();


// ---------- матрица IPv6 ----------
function matrix6(){const ds=S.devs.filter(d=>(d.t==='pc'||d.t==='rt')&&srcFor6&&d.ifaces.some(f=>f.ip6));if(ds.length<2)return'<p class="er">Нужно минимум два устройства с адресом IPv6 (команда ip6 или SLAAC).</p>';
 let h='<table class="t"><tr><th>от ↓ / к →</th>'+ds.map(d=>`<th>${esc(d.name)}</th>`).join('')+'</tr>';
 ds.forEach(a=>{h+=`<tr><th>${esc(a.name)}</th>`;ds.forEach(b=>{if(a===b){h+='<td>—</td>';return}const t=b.ifaces.find(f=>f.ip6&&!isLL(v6(f.ip6)))||b.ifaces.find(f=>f.ip6);const r=trip(a,t.ip6),e=EX.filter(x=>x.err).pop();
  h+=`<td class="${r.ok?'ok':'er'}" title="${r.ok?'доставлено':esc(e?e.x:'нет связи')}">${r.ok?'✔':'✖'}</td>`});h+='</tr>'});
 return h+'</table><p class="mt">Проверка по глобальным адресам IPv6.</p>'}
matrix6=quiet(matrix6);
md.addEventListener('click',e=>{if(e.target.dataset.x==='tf_mx6')$('#tf_m').innerHTML=matrix6()});
