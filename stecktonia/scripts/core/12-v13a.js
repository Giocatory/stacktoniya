// ================= v13a: RADIUS/syslog-серверы, прокси+веб-фильтр, балансировщик, питание =================
Object.assign(IC,{
 rad:`<rect class="ib" x="6" y="5" width="30" height="13" rx="2.500"/><rect class="ib" x="6" y="21" width="30" height="13" rx="2.500"/><circle class="ig" cx="11" cy="11.500" r="1.600"/><circle class="ig" cx="11" cy="27.500" r="1.600"/><circle cx="37" cy="36" r="6" fill="none" stroke="#e0a800" stroke-width="2.600"/><path d="M41 40l5 5M44 43l2-2" stroke="#e0a800" stroke-width="2.400" stroke-linecap="round" fill="none"/>`,
 log:`<rect class="ib" x="6" y="4" width="28" height="12" rx="2.500"/><circle class="ig" cx="11" cy="10" r="1.600"/><rect class="ib" x="14" y="20" width="26" height="24" rx="2"/><path class="is" d="M19 26h16M19 31h16M19 36h10"/><path class="ia" d="M10 18v6"/>`,
 prx:`<path class="ib" d="M24 4l16 6v12c0 10-7 17-16 21C15 39 8 32 8 22V10z"/><path class="ia" d="M16 20h13M25 15l5 5-5 5M32 29H19M23 24l-5 5 5 5"/>`,
 lb:`<rect class="ib" x="3" y="17" width="16" height="14" rx="3"/><circle class="ig" cx="11" cy="24" r="2"/><path class="ia" d="M19 24h8M27 24l9-12M27 24h9M27 24l9 12"/><rect class="ip" x="36" y="6" width="9" height="9" rx="1.500"/><rect class="ip" x="36" y="19.500" width="9" height="9" rx="1.500"/><rect class="ip" x="36" y="33" width="9" height="9" rx="1.500"/>`,
 ups:`<rect class="ib" x="5" y="9" width="38" height="31" rx="4"/><rect class="iscr" x="10" y="15" width="22" height="12" rx="1.500"/><path d="M22 16l-5 6h4l-1 5 6-7h-4l1-4z" fill="#f2c200" stroke="var(--ic2)" stroke-width="1"/><circle class="ig" cx="37" cy="17" r="1.500"/><path class="is" d="M10 34h28M10 37h28"/>`
});
Object.assign(CAT,{
 rad:{g:'Серверы безопасности и сервисов',l:'RADIUS-сервер (AAA)',p:'RADIUS',i:'',t:'pc',n:1},
 log:{l:'Syslog-сервер (журналы)',p:'Syslog',i:'',t:'pc',n:1},
 prx:{l:'Прокси-сервер + веб-фильтр',p:'Proxy',i:'',t:'pc',n:1},
 lb:{l:'Балансировщик нагрузки',p:'LB',i:'',t:'pc',n:1},
 ups:{l:'ИБП (источник бесперебойного питания)',p:'UPS',i:'',t:'pc',n:0}});
NOTE.rad='RADIUS-сервер (AAA: аутентификация, авторизация, учёт). Коммутаторы и точки доступа спрашивают у него логин/пароль устройства (802.1X). Порт UDP/1812. Команды: radius user <логин> <пароль>, radius secret <общий секрет>, radlog. Общий секрет должен совпадать на коммутаторе (radius <ip> <секрет>) и на сервере.';
NOTE.log='Syslog-сервер собирает журналы со всех устройств (UDP/514) в одном месте: там их можно искать, сравнивать по времени и хранить, даже если сам коммутатор сгорел. На устройствах: syslog <ip сервера>. На сервере: logs.';
NOTE.prx='Прокси-сервер (Squid-подобный, TCP/3128) ходит в Интернет за клиентов: кэширует страницы, ведёт журнал и применяет веб-фильтр (чёрный/белый список доменов, категории). Клиентам: proxy <ip>, затем curl <сайт>. Чтобы клиенты не обходили прокси, на маршрутизаторе запрещают им прямой доступ (acl).';
NOTE.lb='Балансировщик нагрузки (reverse proxy / L4): клиенты обращаются к одному адресу (виртуальному), а запросы распределяются между серверами фермы. Мёртвый сервер исключается по проверке работоспособности (health check). Команды: lb add <сервер>, lb algo rr|lc|hash, lb status.';
NOTE.ups='ИБП: при пропадании сети питает защищённые устройства от аккумулятора. Время автономной работы = ёмкость × КПД / мощность нагрузки. Команды: ups add <устройство>, ups battery <Вт·ч>, ups va <ВА>, blackout <минут> — проверить аварию питания.';
const _ad13=addDev;
const WATT={pc:150,lap:60,srv:350,db:400,nas:70,pbx:40,nvr:60,lb:150,prx:150,prn:40,hub:10,sw:25,msw:45,l3:120,rt:50,wr:25,fw:80,ap:12,poe:60,cam:7,ipp:4,ph:0,tab:0,ids:200,atk:100};
addDev=function(k,x,y,n){
 if(k==='rad'||k==='log'){const d=_ad13('srv',x,y,n||(k==='rad'?'RADIUS':'Syslog')+((S.n[k]=(S.n[k]||0)+1)));d.ico=k;d.role=k;
  d.svc=(d.svc||[]).concat(k==='rad'?[{p:'udp',n:1812},{p:'udp',n:1813}]:[{p:'udp',n:514}]);if(k==='rad'){d.users={};d.rsecret=''}ch();return d}
 const d=_ad13(k,x,y,n);
 if(k==='prx'){d.svc=[{p:'tcp',n:3128}];d.flt={mode:'black',list:[],ssl:0};d.cache={};d.acc=[];d.pxs={hit:0,miss:0,deny:0};ch()}
 if(k==='lb'){d.svc=[{p:'tcp',n:80},{p:'tcp',n:443}];d.be=[];d.alg='rr';d.rri=0;d.cnt={};ch()}
 if(k==='ups'){d.va=1000;d.wh=216;d.pf=.6;d.load=[];ch()}
 return d};
['rad','log','prx','lb','ups'].forEach(k=>$('#ad').insertAdjacentHTML('beforeend',`<option value="${k}">${CAT[k].l}</option>`));
$('#adp').innerHTML=(()=>{let h='';for(const k in CAT){const c=CAT[k];if(c.g)h+=`<h5>${c.g}</h5>`;h+=`<button type="button" data-k="${k}">${icoSvg(k,30)}<span>${c.l}</span></button>`}return h})();
// ---- «мёртвые» (без питания) устройства: авария питания ----
const _peer13=peer;
peer=function(d,i){const q=_peer13(d,i);if(q&&(d.dead||q.d.dead))return null;return q};
const _l2all13=l2all;
l2all=function(d,o){if(d.dead)return[];return _l2all13(d,o).filter(e=>!e.d.dead)};
const _ps13=poeScan;
poeScan=function(){const t=S.devs.filter(d=>d.dead&&d.poeW&&!d.off);t.forEach(d=>d.off=true);try{_ps13()}finally{t.forEach(d=>d.off=false)}};
// ---- журнал syslog ----
const SLG=[];
const SEVN={2:'crit',4:'warning',5:'notice',6:'info'};
function slog(id,x,sev){SLG.push({t:Date.now(),id,x,sev:sev||6});if(SLG.length>600)SLG.shift()}
const _oo13=onOut;
onOut=function(t){const ids=PEND;_oo13(t);const m=/^(‼|⚠|⊘|⊕)\s*/.exec(String(t).trim());if(!m)return;
 const x=String(t).trim().slice(m[0].length),sev=m[1]==='‼'?2:m[1]==='⚠'?4:m[1]==='⊘'?5:6;let snd=null;
 const lw=x.toLowerCase();
 for(const id of (ids||[])){const d=dv(id);if(d&&d.sysl){snd=d;break}}
 if(!snd){let bi=1e9;S.devs.forEach(d=>{if(!d.sysl)return;const i=lw.search(new RegExp('(^|[^a-zа-я0-9])'+d.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^a-zа-я0-9]|$)'));if(i>=0&&i<bi){bi=i;snd=d}})}
 if(snd)slog(snd.id,x,sev)};
const hhmm=t=>new Date(t).toLocaleTimeString('ru-RU');
const ipsOf=d=>d.ifaces.filter(f=>f.ip).map(f=>f.ip);
function syslogRecv(srv){const out=[],ok={};
 QUIET++;const sx=EX,sr=REP;
 try{SLG.forEach(e=>{const s=dv(e.id);if(!s||!s.sysl||!ipsOf(srv).includes(s.sysl))return;
  if(!(s.id in ok)){const ip=srcIp(s);ok[s.id]=ip?_l4_13(s,s.sysl,'udp',514).ok:(s.t==='sw'&&s.ifaces.some((_,i)=>l2all(s,i).some(e=>e.d===srv)))}
  if(ok[s.id])out.push({...e,s})})}
 finally{QUIET--;EX=sx;REP=sr}
 return out}
const fmtSlg=e=>`${hhmm(e.t)} ${e.s.name} ${SEVN[e.sev]||'info'}: ${e.x}`;
// ---- прокси и веб-фильтр ----
const PXCAT={social:['facebook.com','vk.com','instagram.com','ok.ru','tiktok.com','twitter.com'],video:['youtube.com','rutube.ru','netflix.com','twitch.tv'],games:['steampowered.com','epicgames.com','roblox.com','dota2.com'],ads:['doubleclick.net','adservice.google.com','ads.example.com'],adult:['adult.example','xxx.example']};
const PXCN={social:'социальные сети',video:'видеохостинги',games:'игры',ads:'реклама и трекеры',adult:'«для взрослых»'};
function pxDecide(prx,host,path,https){const f=prx.flt||{mode:'black',list:[],ssl:0};host=String(host).toLowerCase();path=path||'/';
 const dm=dom=>host===dom||host.endsWith('.'+dom);let hit=null;
 for(const e of f.list){if(e.startsWith('cat:')){const c=e.slice(4);if((PXCAT[c]||[]).some(dm)){hit={r:e,w:`категория «${PXCN[c]||c}»`};break}}
  else if(e.startsWith('url:')){const u=e.slice(4);if(path.toLowerCase().includes(u.toLowerCase())&&(!https||f.ssl)){hit={r:e,w:`часть адреса «${u}»`};break}}
  else if(dm(e.toLowerCase())){hit={r:e,w:`домен ${e}`};break}}
 if(f.mode==='white'){const allowed=f.list.some(e=>!e.startsWith('url:')&&(e.startsWith('cat:')?(PXCAT[e.slice(4)]||[]).some(dm):dm(e.toLowerCase())));
  return allowed?{block:false,w:hit?hit.w:''}:{block:true,w:'сайт не входит в белый список (разрешено только перечисленное)'}}
 return hit?{block:true,w:hit.w}:{block:false}}
async function pxCurl(d,url){
 const m=/^(?:(https?):\/\/)?(\[[^\]]+\]|[^:/]+)(?::(\d+))?(\/.*)?$/.exec(url||'');if(!m)return p('Использование: curl [http://|https://]<сайт>[:порт][/путь]');
 const https=m[1]==='https',host=m[2],port=m[3]?+m[3]:https?443:80,path=m[4]||'/';
 p(`${d.name} использует прокси ${d.proxy}: запрос ${url} уйдёт на прокси, а не напрямую к сайту`);
 const R1=await sendL4(d,d.proxy,'tcp',3128);if(!R1)return;
 if(!R1.ok)return p('✖ Прокси не отвечает — HTTP-запрос не отправлен. Проверьте адрес прокси, маршрут и правила ACL для порта 3128.');
 const prx=R1.r.a.d;if(prx.k!=='prx')return p(`✖ На ${d.proxy} (${prx.name}) нет прокси-сервера: это не устройство «Прокси-сервер».`);
 const dec=pxDecide(prx,host,path,https),ts=hhmm(Date.now());prx.acc=prx.acc||[];prx.pxs=prx.pxs||{hit:0,miss:0,deny:0};
 const key=host+':'+port+path;
 if(dec.block){prx.pxs.deny++;prx.acc.push(`${ts} ${srcIp(d)} TCP_DENIED/403 ${https?'CONNECT':'GET'} ${host}${https?':'+port:path}`);if(prx.acc.length>200)prx.acc.shift();ch();
  sec('⊘',`Веб-фильтр ${prx.name}: клиенту ${d.name} запрещён доступ к ${host} — ${dec.w}`,[prx.id,d.id]);
  return p(`HTTP/1.1 403 Forbidden  (X-Squid-Error: ERR_ACCESS_DENIED)\n✖ ${host} заблокирован веб-фильтром прокси ${prx.name}: ${dec.w}. Запрос до сайта вообще не отправлялся.`)}
 if(!https&&(prx.cache||{})[key]){prx.pxs.hit++;prx.acc.push(`${ts} ${srcIp(d)} TCP_HIT/200 GET ${host}${path}`);ch();return p(`HTTP/1.1 200 OK  (X-Cache: HIT from ${prx.name})\n✔ Страница ${host}${path} отдана из кэша прокси — на сайт никто не ходил, канал в Интернет не нагружен.`)}
 p(`Прокси ${prx.name}: фильтр пропустил ${host}, иду на сайт сам (от своего адреса ${srcIp(prx)||'?'})`);
 const R2=await sendL4(prx,host,'tcp',port);
 if(R2&&R2.ok){prx.pxs.miss++;if(!https){prx.cache=prx.cache||{};prx.cache[key]=1}prx.acc.push(`${ts} ${srcIp(d)} TCP_MISS/200 ${https?'CONNECT':'GET'} ${host}${https?':'+port:path}`);if(prx.acc.length>200)prx.acc.shift();ch();
  p(`HTTP/1.1 200 OK  (X-Cache: MISS from ${prx.name})\n✔ Ответ сайта получен прокси и передан клиенту ${d.name}.${https?' (HTTPS: прокси видит только имя сайта, содержимое зашифровано)':' Страница сохранена в кэше.'}`)}
 else{prx.acc.push(`${ts} ${srcIp(d)} TCP_MISS/502 GET ${host}${path}`);ch();p(`HTTP/1.1 502 Bad Gateway\n✖ Прокси ${prx.name} не смог открыть ${host}: проверьте DNS на прокси (dns <ip>) и его выход в Интернет.`)}}
// ---- балансировщик ----
const _l4_13=l4;
function lbOrder(lb,cip){const be=(lb.be||[]).map(byNm).filter(Boolean);if(!be.length)return[];
 let i0=0;if(lb.alg==='rr')i0=(lb.rri||0)%be.length;else if(lb.alg==='hash')i0=(ip2n(cip||'0.0.0.0')||0)%be.length;
 else{const c=n=>(lb.cnt||{})[n]||0;return be.slice().sort((a,b)=>c(a.name)-c(b.name))}
 return be.slice(i0).concat(be.slice(0,i0))}
const LBALG={rr:'по кругу (round robin)',lc:'наименьшее число обслуженных запросов (least connections)',hash:'по хэшу IP клиента (один клиент — один сервер)'};
l4=function(d,ip,pr,port){const R=_l4_13(d,ip,pr,port);const lb=R.ok&&R.r&&R.r.a&&R.r.a.d;if(!lb||lb.k!=='lb'||d===lb)return R;
 const EX1=EX.slice(),cands=lbOrder(lb,srcIp(d)),dead=[];let ch_=null;
 QUIET++;try{for(const b of cands){const bi=srcIp(b);if(bi&&_l4_13(lb,bi,pr,port).ok){ch_=b;break}dead.push(b)}}finally{QUIET--}
 EX=[];REP=0;
 if(!ch_){ex([lb.id],`${lb.name}: ни один сервер фермы не ответил на проверку порта ${port} — отвечаю клиенту 503`,{err:1,fix:cands.length?'Проверьте серверы фермы: питание, кабель, служба на порту (service add tcp '+port+'), ACL между балансировщиком и серверами.':'Добавьте серверы в ферму: lb add <сервер>.'});
  EX=[...EX1.filter(s=>!s.rep),...EX];R.ok=false;R.state='closed';R.msg=`✖ ${R.lab}: 503 Service Unavailable — на балансировщике ${lb.name} ${cands.length?'нет живых серверов (все не прошли health check)':'не настроена ферма серверов'}`;return R}
 const i=lbOrder(lb,srcIp(d)).findIndex(x=>x===ch_);if(lb.alg==='rr'){const be=(lb.be||[]);lb.rri=((lb.rri||0)+Math.max(0,cands.indexOf(ch_))+1)%Math.max(1,be.length)}
 lb.cnt=lb.cnt||{};lb.cnt[ch_.name]=(lb.cnt[ch_.name]||0)+1;
 const R2=_l4_13(lb,srcIp(ch_),pr,port),EX2=EX.slice();
 const sx=(()=>{EX=[];REP=0;ex([lb.id],`${lb.name}: балансировщик (${LBALG[lb.alg]||lb.alg}) выбирает сервер ${ch_.name}${dead.length?`; ${dead.map(x=>x.name).join(', ')} не прошёл health check и пропущен`:''}. Клиент видит только адрес балансировщика ${srcIp(lb)}, а запрос пересылается на ${srcIp(ch_)}`);return EX[0]})();
 EX=[...EX1.filter(s=>!s.rep),sx,...EX2.filter(s=>!s.rep),...EX2.filter(s=>s.rep),...EX1.filter(s=>s.rep)];
 R.be=ch_;R.msg+=`\n  ↳ Запрос обработал сервер фермы ${ch_.name} (${srcIp(ch_)}); всего он обслужил: ${lb.cnt[ch_.name]}`;return R};


// ================= v13b: VRRP/HSRP и BGP =================
// ---------- VRRP / HSRP ----------
const vrAlive=(d,v)=>{if(d.dead||d.off)return false;const i=d.ifaces.findIndex(f=>f.n===v.i);if(i<0)return false;const f=d.ifaces[i];return !!(f.ip&&!f.off&&peer(d,i))};
const vrEff=(d,v)=>{let p=v.pr;if(v.trk){const i=d.ifaces.findIndex(f=>f.n===v.trk);const f=d.ifaces[i];if(!f||f.off||!peer(d,i))p-=v.dec||20}return Math.max(0,p)};
function vrrpGroups(){const G={};
 S.devs.filter(d=>d.t==='rt'&&(d.vrrp||[]).length).forEach(d=>d.vrrp.forEach(v=>{const k=v.vip;(G[k]=G[k]||{vip:k,g:v.g,proto:v.proto,m:[]}).m.push({d,v,al:vrAlive(d,v),ef:vrEff(d,v)})}));
 S.vrm=S.vrm||{};
 return Object.values(G).map(g=>{const al=g.m.filter(x=>x.al);
  const ipn=x=>ip2n((x.d.ifaces.find(f=>f.n===x.v.i)||{}).ip||'0.0.0.0')||0;
  al.sort((a,b)=>b.ef-a.ef||ipn(b)-ipn(a));const H=al[0]||null,cur=al.find(x=>x.d.id===S.vrm[g.vip]);
  let M=H;if(cur&&H&&cur!==H&&!H.v.pre&&cur.ef>=0)M=cur;
  const prev=S.vrm[g.vip];
  if((M?M.d.id:null)!==(prev||null)){S.vrm[g.vip]=M?M.d.id:null;
   if(prev!==undefined&&!g._q){const pd=dv(prev);const P=g.proto==='hsrp'?'HSRP':'VRRP';
    if(M)sec('⚠',`${P}: группа ${g.g} (${g.vip}) — новый ${g.proto==='hsrp'?'Active':'MASTER'}: ${M.d.name}${pd?`, прежний ${pd.name} ${pd.dead||pd.off?'выключен':'потерял связь или приоритет'}`:''}. Клиенты продолжают работать с тем же шлюзом ${g.vip}`,[M.d.id,...(pd?[pd.id]:[])]);
    else sec('‼',`${P}: группа ${g.g} (${g.vip}) — не осталось ни одного живого маршрутизатора, шлюз недоступен`,g.m.map(x=>x.d.id))}}
  return{...g,al,M,m:g.m}})}
const vrMaster=vip=>{const g=vrrpGroups().find(x=>x.vip===vip);return g&&g.M?g.M:null};
const _l2f13=l2find;
l2find=function(d,o,n){const r=_l2f13(d,o,n);if(r||!n)return r;
 const M=vrMaster(n);if(!M)return null;const i=M.d.ifaces.findIndex(f=>f.n===M.v.i);
 const e=l2all(d,o).find(x=>x.d===M.d&&x.i===i);return e||null};
const _dl13=deliver;
deliver=function(d,dst,ttl,tr,first,src){
 if(!d.ifaces.some(f=>f.ip===dst)&&(d.vrrp||[]).some(v=>v.vip===dst)){const M=vrMaster(dst);
  if(M&&M.d===d){ex([d.id],`${d.name}: ${dst} — виртуальный адрес группы ${M.v.proto==='hsrp'?'HSRP':'VRRP'} ${M.v.g}, а я сейчас ${M.v.proto==='hsrp'?'Active':'MASTER'} — пакет доставлен мне`);return{ok:1,d}}}
 return _dl13(d,dst,ttl,tr,first,src)};
function vrrpText(){const gs=vrrpGroups();if(!gs.length)return'VRRP/HSRP не настроен. Пример на двух маршрутизаторах: vrrp gi0/0 1 192.168.1.1 priority 120   и   vrrp gi0/0 1 192.168.1.1 priority 100';
 return gs.map(g=>{const P=g.proto==='hsrp'?'HSRP':'VRRP';return`${P}, группа ${g.g}, виртуальный адрес ${g.vip}\n`+g.m.map(x=>{const st=!x.al?'DOWN (недоступен)':x===g.M?(g.proto==='hsrp'?'ACTIVE':'MASTER'):(g.proto==='hsrp'?'STANDBY':'BACKUP');
   return`  ${x.d.name.padEnd(8)} ${x.v.i.padEnd(7)} приоритет ${x.v.pr}${x.ef!==x.v.pr?` → ${x.ef} (track ${x.v.trk} упал)`:''}  ${x.v.pre?'preempt':'без preempt'}  ${st}`}).join('\n')}).join('\n')}
// ---------- BGP ----------
const BGPT={};
const bgpAdv=(d,x)=>{const b=d.bgp,have=d.ifaces.some(f=>f.ip&&f.mask&&!f.off&&(ip2n(f.ip)&ip2n(f.mask))>>>0===ip2n(x.net)&&f.mask===x.mask)||(d.routes||[]).some(r=>r.net===x.net&&r.mask===x.mask)||(RIPT[d.id]||[]).some(r=>r.net===x.net&&r.mask===x.mask&&!r.b);return have};
function bgpSess(d){// статус каждого соседа
 return(d.bgp.nb||[]).map(nb=>{const r={nb,st:'Idle',why:'',peer:null,ebgp:nb.as!==d.bgp.as};
  if(d.dead||d.off){r.why='маршрутизатор выключен';return r}
  let found=null,fi=-1;
  d.ifaces.forEach((f,i)=>{if(!found&&f.ip&&f.mask&&!f.off&&same(f.ip,nb.ip,f.mask)){const t=l2find(d,i,nb.ip);if(t){found=t;fi=i}}});
  if(!found&&!r.ebgp){const sx=EX,sr=REP;EX=[];try{const a=deliver(d,nb.ip,64,[],1);if(a.ok&&a.d)found={d:a.d}}finally{EX=sx;REP=sr}}
  if(!found){r.why=r.ebgp?'сосед не отвечает: eBGP работает только между напрямую соединёнными узлами (адрес соседа должен быть в подсети своего интерфейса и интерфейс подключён)':'сосед iBGP недоступен по маршрутам';return r}
  const b=found.d;if(!b.bgp||!b.bgp.as){r.why=`на ${b.name} BGP не включён (bgp as)`;return r}
  if(b.bgp.as!==nb.as){r.why=`AS не совпадает: вы указали remote-as ${nb.as}, а у ${b.name} AS ${b.bgp.as}`;return r}
  const my=(fi>=0?[d.ifaces[fi].ip]:ipsOf(d)),back=(b.bgp.nb||[]).find(x=>my.includes(x.ip));
  if(!back){r.why=`${b.name} не настроил обратного соседа ${my[0]||''} (сессия двусторонняя: neighbor нужен на обеих сторонах)`;return r}
  if(back.as!==d.bgp.as){r.why=`${b.name} ожидает от нас AS ${back.as}, а у нас AS ${d.bgp.as}`;return r}
  r.st='Established';r.peer=b;r.back=back;return r})}
function bgpCompute(){
 S.devs.forEach(d=>{if(RIPT[d.id])RIPT[d.id]=RIPT[d.id].filter(x=>!x.b)});Object.keys(BGPT).forEach(k=>delete BGPT[k]);
 const R=S.devs.filter(d=>d.t==='rt'&&d.bgp&&d.bgp.as);if(!R.length)return;
 const sess={};R.forEach(d=>sess[d.id]=bgpSess(d));
 const best={};R.forEach(d=>{best[d.id]={};(d.bgp.nets||[]).forEach(x=>{if(bgpAdv(d,x))best[d.id][x.net+'/'+x.mask]={net:x.net,mask:x.mask,path:[],lp:100,orig:1,ebgp:0,from:null}})});
 const cmp=(a,b)=>(b.lp-a.lp)||(a.path.length-b.path.length)||((b.ebgp?1:0)-(a.ebgp?1:0))||(ip2n(a.nh||'0.0.0.0')-ip2n(b.nh||'0.0.0.0'));
 let cand={};
 for(let it=0;it<R.length+4;it++){const nc={};R.forEach(d=>nc[d.id]={});
  R.forEach(a=>sess[a.id].forEach(s=>{if(s.st!=='Established')return;const b=s.peer,bs=sess[b.id]&&sess[b.id].find(x=>x.peer===a&&x.nb===s.back);if(!bs||bs.st!=='Established')return;
   const ebgp=a.bgp.as!==b.bgp.as,routes=Object.values(best[a.id]).slice();
   if(s.nb.dflt&&!routes.some(r=>r.net==='0.0.0.0'))routes.push({net:'0.0.0.0',mask:'0.0.0.0',path:[],lp:100,orig:1,ebgp:0,from:null});
   routes.forEach(r=>{if(r.from&&r.from===b.id)return;if(!ebgp&&r.from&&!r.ebgp&&!r.orig&&r.viaI)return;
    const path=ebgp?[...Array(1+(s.nb.pre||0)).fill(a.bgp.as),...r.path]:r.path.slice();
    if(ebgp&&path.includes(b.bgp.as))return;
    const lp=ebgp?(bs.nb.lp||100):r.lp,k=r.net+'/'+r.mask;
    (nc[b.id][k]=nc[b.id][k]||[]).push({net:r.net,mask:r.mask,path,lp,ebgp,from:a.id,viaI:!ebgp,nh:bs.nb.ip,nbn:a.name})})}));
  const nb={};let chg=false;R.forEach(d=>{nb[d.id]={};Object.keys(best[d.id]).forEach(k=>{if(best[d.id][k].orig)nb[d.id][k]=best[d.id][k]});
   Object.entries(nc[d.id]).forEach(([k,l])=>{l.sort(cmp);if(!nb[d.id][k])nb[d.id][k]=l[0]})});
  const sg=o=>JSON.stringify(Object.keys(o).sort().map(id=>Object.keys(o[id]).sort().map(k=>k+(o[id][k].from||'')+o[id][k].path.join('.'))));
  chg=sg(nb)!==sg(best);Object.assign(best,nb);cand=nc;if(!chg)break}
 R.forEach(d=>{BGPT[d.id]={sess:sess[d.id],best:best[d.id],cand:cand[d.id]||{}};
  RIPT[d.id]=RIPT[d.id]||[];
  Object.entries(best[d.id]).forEach(([k,r])=>{if(r.orig)return;
   const nh=r.nh;if(r.ebgp)RIPT[d.id]=RIPT[d.id].filter(x=>!(x.net===r.net&&x.mask===r.mask));else if(RIPT[d.id].some(x=>x.net===r.net&&x.mask===r.mask))return;
   RIPT[d.id].push({net:r.net,mask:r.mask,nh,m:r.path.length,b:1,path:r.path.slice(),ebgp:r.ebgp})})})}
const _cr13=computeRip;
computeRip=function(){_cr13();bgpCompute()};
function bgpText(d,full){if(!d.bgp||!d.bgp.as)return'BGP не включён. Начните с команды: bgp as <номер AS>   (например bgp as 65001)';
 computeRip();const T=BGPT[d.id];if(!T)return'BGP: нет данных';
 let h=`BGP: локальная AS ${d.bgp.as}\nСоседи:\n`+(T.sess.map(s=>`  ${s.nb.ip.padEnd(15)} AS ${String(s.nb.as).padEnd(6)} ${s.ebgp?'eBGP':'iBGP'}  ${s.st}${s.st==='Established'?` (${s.peer.name})`:' — '+s.why}${s.nb.lp&&s.nb.lp!==100?`  local-pref ${s.nb.lp}`:''}${s.nb.pre?`  prepend ×${s.nb.pre}`:''}${s.nb.dflt?'  default-originate':''}`).join('\n')||'  нет (bgp neighbor <ip> remote-as <AS>)');
 h+='\nАнонсируемые сети:\n'+((d.bgp.nets||[]).map(x=>`  ${x.net}/${plen(x.mask)}${bgpAdv(d,x)?'':'  — НЕ анонсируется: такой сети нет в таблице маршрутизации (BGP анонсирует только то, что уже есть у маршрутизатора)'}`).join('\n')||'  нет (bgp network <сеть> <маска>)');
 if(full){h+='\n\nТаблица BGP (*> — лучший путь, * — запасной):\n';const ks=new Set([...Object.keys(T.best),...Object.keys(T.cand)]);
  if(!ks.size)h+='  пусто';
  ks.forEach(k=>{const b=T.best[k],l=(T.cand[k]||[]);const net=k.replace(/\/.*/,'')+'/'+plen(k.replace(/^[^/]*\//,''));
   if(b&&b.orig)h+=`  *> ${net.padEnd(18)} локальный (network)\n`;
   l.forEach(r=>{const isb=b&&!b.orig&&b.from===r.from&&b.path.join()===r.path.join();h+=`  ${isb?'*>':'* '} ${net.padEnd(18)} через ${r.nh.padEnd(15)} (${r.nbn})  local-pref ${r.lp}  AS-путь ${r.path.join(' ')||'—'}  ${r.ebgp?'e':'i'}${isb?'':b&&b.orig?'  (своя сеть приоритетнее)':'  — проиграл: '+(b&&b.lp!==r.lp?'ниже local-pref':b&&b.path.length!==r.path.length?'длиннее AS-путь':'позже по порядку (меньше адрес соседа побеждает)')}\n`})})}
 return h.trimEnd()}


// ================= v13c: питание/ИБП, команды, панели, шаблоны, задания, теория =================
const wattOf=d=>{if(d.t==='sw'&&d.k==='ups')return 0;if(needPoe(d)&&!d.nopwr)return 0;const w=WATT[d.role||kind(d)];return(w==null?100:w)+(d.poeW?(d.poeUsed||0):0)};
function upsInfo(u){poeScan();const L=(u.load||[]).map(byNm).filter(Boolean),P=L.reduce((s,x)=>s+wattOf(x),0),cap=Math.round(u.va*u.pf),
 usable=u.wh*.85*.8,rt=P>0?Math.round(usable/P*60):Infinity;return{L,P,cap,over:P>cap,rt,usable:Math.round(usable),need:Math.ceil(P/u.pf/100)*100}}
const upsOf=d=>S.devs.find(u=>u.k==='ups'&&(u.load||[]).includes(d.name));
function blackout(min){poeScan();const rows=[];
 S.devs.forEach(d=>{d.dead=false});
 S.devs.forEach(d=>{if(d.k==='ups')return;if(needPoe(d)){return}
  const u=upsOf(d);let live=false,why;
  if(!u)why='не подключено к ИБП — выключилось сразу';
  else{const i=upsInfo(u);if(i.over)why=`ИБП ${u.name} перегружен (${i.P} Вт при допустимых ${i.cap} Вт) — ушёл в защиту`;else if(i.rt<min)why=`ИБП ${u.name} держит ${i.rt} мин, а авария ${min} мин — батарея села`;else{live=true;why=`работает от ${u.name} (запас ${i.rt} мин ≥ ${min})`}}
  d.dead=!live;rows.push([d,live,why])});
 S.blk=min;ch();
 rows.forEach(([d,l,w])=>{if(!l)slog(d.id,`питание пропало: ${w}`,2)});
 return rows}
function blackoutEnd(){S.devs.forEach(d=>d.dead=false);delete S.blk;ch()}
function upsText(u){const i=upsInfo(u);return`${u.name}: ${u.va} ВА (${i.cap} Вт при cosφ ${u.pf}), аккумулятор ${u.wh} Вт·ч\nЗащищает: ${i.L.map(x=>`${x.name} ${wattOf(x)} Вт`).join(', ')||'— никого (ups add <устройство>)'}\nНагрузка: ${i.P} Вт ${i.over?'— ПЕРЕГРУЗКА (допустимо '+i.cap+' Вт)':'из '+i.cap+' Вт ('+Math.round(i.P/i.cap*100)+' %)'}\nПолезная энергия = ${u.wh} × 0,85 (КПД инвертора) × 0,8 (допустимая глубина разряда) = ${i.usable} Вт·ч\nВремя автономной работы = ${i.usable} / ${i.P||'?'} × 60 = ${i.rt===Infinity?'∞':i.rt+' мин'}\nНужная мощность ИБП с запасом: не менее ${i.need} ВА (нагрузка / cosφ, округлено)`}
// ---- команды ----
const _run13=run;
const segOf=(d)=>d.ifaces.filter(f=>f.ip);
run=function(c){const s=c.trim();if(!s)return _run13(c);
 if(s.includes(';')&&!/["']/.test(s))return _run13(c);
 const a=s.split(/\s+/),cm=a[0].toLowerCase(),d=sel&&dv(sel),K=d?kind(d):'';
 if(!d)return _run13(c);
 const usage=u=>p('Использование: '+u);
 // syslog / logs (любое устройство)
 if(cm==='syslog'&&K!=='ups'){if(!a[1]){return p(d.sysl?`Журнал отправляется на syslog-сервер ${d.sysl} (UDP/514)`:'Syslog не настроен. Пример: syslog 192.168.1.6')}
  if(a[1]==='off'){delete d.sysl;ch();return p('Отправка журнала выключена')}if(ip2n(a[1])==null)return usage('syslog <ip сервера>|off');d.sysl=a[1];ch();return p(`Журнал ${d.name} будет отправляться на ${a[1]} (UDP/514). Важно: путь до сервера должен быть открыт и для ACL.`)}
 if(cm==='logs'){const n=+a[1]||30;if(d.role==='log'||K==='log'){const r=syslogRecv(d);return p(`Syslog-сервер ${d.name}: принято ${r.length} сообщений (показаны последние ${Math.min(n,r.length)})\n`+(r.slice(-n).map(fmtSlg).join('\n')||'пока пусто: на устройствах выполните syslog '+(srcIp(d)||'<ip этого сервера>')+', затем что-нибудь произойдёт (сканирование, ошибка 802.1X, смена мастера VRRP…)'))}
  const r=SLG.filter(e=>e.id===d.id).slice(-n).map(e=>`${hhmm(e.t)} ${d.name} ${SEVN[e.sev]||'info'}: ${e.x}`);return p(r.join('\n')||'Локальный журнал пуст (сюда попадают события безопасности, VRRP, BGP, питание)')}
 // RADIUS
 if(K==='msw'&&cm==='radius'&&a[2]&&ip2n(a[1]||'')!=null){d.rsec=a[2]}
 if(d.k==='srv'&&cm==='radius'&&a[1]==='secret'){d.rsecret=a[2]||'';ch();return p(d.rsecret?'Общий секрет задан. Он должен совпадать на коммутаторе: radius <ip> <секрет>':'Секрет сброшен (проверка секрета выключена)')}
 if(d.k==='srv'&&cm==='radius'&&a[1]==='users')return p(Object.keys(d.users||{}).map(u=>'  '+u).join('\n')||'Пользователей нет: radius user <логин> <пароль>');
 if(d.k==='srv'&&cm==='radlog'){const r=SLG.concat().length,txt=[];
  S.devs.filter(x=>x.t==='sw').forEach(sw=>{if(radiusSrv(sw)===d)(S.devs).forEach(cl=>{if(!cl.dx||!cl.dx.u)return;const us=d.users||{};const okU=Object.prototype.hasOwnProperty.call(us,cl.dx.u),ok=okU&&us[cl.dx.u]===cl.dx.p&&(!d.rsecret||d.rsecret===(sw.rsec||''));
    sw.ifaces.filter(f=>f.dx&&!f.off).forEach(f=>{if(behind(sw,f).includes(cl))txt.push(`Access-${ok?'Accept':'Reject'}  пользователь=${cl.dx.u}  клиент(NAS)=${sw.name} ${f.n}  устройство=${cl.name}${ok?'':'  причина: '+(!okU?'нет такого пользователя':us[cl.dx.u]!==cl.dx.p?'неверный пароль':'не совпал общий секрет')}`)})})});
  return p(txt.join('\n')||'Запросов нет: включите dot1x <порт> on на коммутаторе и задайте dot1x <логин> <пароль> на клиенте')}
 // прокси
 if(cm==='proxy'&&K!=='prx'){if(!a[1])return p(d.proxy?'Прокси: '+d.proxy:'Прокси не задан. Пример: proxy 192.168.1.5');if(a[1]==='off'){delete d.proxy;ch();return p('Прокси отключён: curl идёт напрямую')}if(ip2n(a[1])==null)return usage('proxy <ip прокси>|off');d.proxy=a[1];ch();return p(`Клиент ${d.name} теперь ходит в Интернет через прокси ${a[1]}:3128. Проверка: curl <сайт>`)}
 if((cm==='curl'||cm==='wget')&&d.proxy&&a[1]){return pxCurl(d,a[1])}
 if(K==='prx'&&cm==='filter'){const f=d.flt=d.flt||{mode:'black',list:[],ssl:0},sub=(a[1]||'').toLowerCase();
  if(!sub||sub==='list')return p(`Режим: ${f.mode==='white'?'белый список (разрешено только перечисленное)':'чёрный список (запрещено перечисленное)'}; проверка пути в HTTPS (ssl-bump): ${f.ssl?'вкл':'выкл'}\nПравила:\n`+(f.list.map((x,i)=>`  ${i+1}. ${x}`).join('\n')||'  нет')+`\nКатегории: ${Object.keys(PXCAT).map(k=>k+' ('+PXCN[k]+')').join(', ')}`);
  if(sub==='mode'){if(!/^(black|white)$/.test(a[2]||''))return usage('filter mode black|white');f.mode=a[2];ch();return p('Режим: '+(f.mode==='white'?'белый список':'чёрный список'))}
  if(sub==='ssl'){f.ssl=a[2]==='on'?1:0;ch();return p('Инспекция HTTPS (ssl-bump): '+(f.ssl?'включена — прокси подменяет сертификат и видит путь; на клиентах нужен корневой сертификат':'выключена — для HTTPS прокси видит только имя сайта'))}
  if(sub==='add'){const v=(a[2]||'').toLowerCase();if(!v)return usage('filter add <домен> | cat:<категория> | url:<часть адреса>');if(v.startsWith('cat:')&&!PXCAT[v.slice(4)])return p('Нет такой категории. Есть: '+Object.keys(PXCAT).join(', '));if(!f.list.includes(v))f.list.push(v);ch();return p('Правило добавлено: '+v)}
  if(sub==='del'){const i=+a[2]-1;if(!(i>=0&&i<f.list.length))return usage('filter del <номер из filter list>');f.list.splice(i,1);ch();return p('Правило удалено')}
  if(sub==='log')return p((d.acc||[]).slice(-30).join('\n')||'Журнал доступа пуст');
  if(sub==='stats'){const x=d.pxs||{hit:0,miss:0,deny:0},t=x.hit+x.miss;return p(`Запросов: ${t+x.deny}; из кэша ${x.hit}, с сайта ${x.miss}, заблокировано ${x.deny}; эффективность кэша ${t?Math.round(x.hit/t*100):0} %`)}
  if(sub==='cache'){d.cache={};ch();return p('Кэш очищен')}
  return usage('filter [list|mode|add|del|ssl|log|stats|cache clear]')}
 // балансировщик
 if(K==='lb'&&cm==='lb'){const sub=(a[1]||'status').toLowerCase();d.be=d.be||[];
  if(sub==='add'){const t=byNm(a[2]);if(!t)return usage('lb add <имя сервера>');if(!d.be.includes(t.name))d.be.push(t.name);ch();return p(`${t.name} добавлен в ферму ${d.name}`)}
  if(sub==='del'){d.be=d.be.filter(x=>x.toLowerCase()!==(a[2]||'').toLowerCase());ch();return p('Удалён из фермы')}
  if(sub==='algo'){if(!LBALG[a[2]])return usage('lb algo rr|lc|hash   (rr — по кругу, lc — наименее загруженный, hash — по IP клиента)');d.alg=a[2];ch();return p('Алгоритм: '+LBALG[a[2]])}
  if(sub==='reset'){d.cnt={};d.rri=0;ch();return p('Счётчики сброшены')}
  if(sub==='status'){QUIET++;const sx=EX;let rows;try{rows=d.be.map(n=>{const b=byNm(n),ip=b&&srcIp(b);const h80=ip&&_l4_13(d,ip,'tcp',80).ok;return`  ${n.padEnd(8)} ${(ip||'—').padEnd(15)} health(tcp/80): ${h80?'UP':'DOWN'}  обслужено запросов: ${(d.cnt||{})[n]||0}`})}finally{QUIET--;EX=sx}
   return p(`Балансировщик ${d.name}, адрес сервиса ${srcIp(d)||'—'}, порты: ${(d.svc||[]).map(x=>x.n).join(', ')}\nАлгоритм: ${LBALG[d.alg]}\nФерма:\n`+(rows.join('\n')||'  пусто (lb add <сервер>)'))}
  return usage('lb add|del|algo|status|reset')}
 // VRRP / HSRP
 if(d.t==='rt'&&(cm==='vrrp'||cm==='hsrp'||(cm==='show'&&a[1]==='vrrp'))){
  if(cm==='show'||!a[1]||a[1]==='show')return p(vrrpText());
  if(a[1]==='off'){d.vrrp=[];ch();return p('VRRP/HSRP на маршрутизаторе отключён')}
  if(a[1]==='del'){d.vrrp=(d.vrrp||[]).filter(v=>!(v.i===a[2]&&String(v.g)===String(a[3])));ch();return p('Удалено')}
  const f=d.ifaces.find(x=>x.n.toLowerCase()===a[1].toLowerCase()),g=+a[2],vip=a[3];
  if(!f||!(g>0&&g<256)||ip2n(vip||'')==null)return usage(`${cm} <интерфейс> <группа 1-255> <виртуальный ip> [priority N] [preempt|nopreempt] [track <интерфейс>]`);
  if(!f.ip||!same(f.ip,vip,f.mask))return p(`Виртуальный адрес ${vip} должен быть из подсети интерфейса ${f.n} (${f.ip||'IP не задан'}).`);
  if(f.ip===vip)return p('Виртуальный адрес не должен совпадать с реальным адресом интерфейса');
  const v={i:f.n,g,vip,proto:cm,pr:100,pre:cm==='vrrp'};
  for(let k=4;k<a.length;k++){const w=a[k].toLowerCase();if(w==='priority'||w==='prio'){v.pr=Math.max(1,Math.min(254,+a[++k]||100))}else if(w==='preempt')v.pre=true;else if(w==='nopreempt')v.pre=false;else if(w==='track'){if(!a[k+1])break;const t=d.ifaces.find(x=>x.n===a[k+1]);if(!t)return p('Нет интерфейса для track: '+a[k+1]);v.trk=t.n;k++}}
  d.vrrp=(d.vrrp||[]).filter(x=>!(x.i===v.i&&x.g===v.g));d.vrrp.push(v);ch();
  return p(`${cm.toUpperCase()}: ${d.name} ${f.n} группа ${g}, виртуальный адрес ${vip}, приоритет ${v.pr}${v.pre?', preempt':''}${v.trk?', track '+v.trk+' (−20 при падении)':''}.\nНа ПК шлюзом укажите ${vip}. Кто сейчас ${cm==='hsrp'?'Active':'MASTER'} — команда: vrrp show`)}
 // BGP
 if(d.t==='rt'&&cm==='bgp'){const sub=(a[1]||'show').toLowerCase();
  if(sub==='as'){const n=+a[2];if(!(n>0&&n<4294967295))return usage('bgp as <номер AS 1-4294967294>  (частные: 64512–65534)');d.bgp=d.bgp||{nb:[],nets:[]};d.bgp.as=n;ch();return p(`BGP включён, локальная AS ${n}${n>=64512&&n<=65534?' (частная)':' (публичная)'}`)}
  if(sub==='off'){delete d.bgp;ch();return p('BGP выключен')}
  if(!d.bgp||!d.bgp.as)return p('Сначала включите BGP: bgp as <номер>');
  if(sub==='show'||sub==='summary')return p(bgpText(d,false));
  if(sub==='routes'||sub==='table')return p(bgpText(d,true));
  if(sub==='neighbor'){const ip=a[2];if(ip2n(ip||'')==null)return usage('bgp neighbor <ip> remote-as <AS> | localpref N | prepend N | default-originate | del');let n=d.bgp.nb.find(x=>x.ip===ip);const op=(a[3]||'').toLowerCase();
   if(op==='del'){d.bgp.nb=d.bgp.nb.filter(x=>x.ip!==ip);ch();return p('Сосед удалён')}
   if(op==='remote-as'||/^\d+$/.test(op)){const as=+(op==='remote-as'?a[4]:op);if(!(as>0))return usage('bgp neighbor <ip> remote-as <AS>');if(n)n.as=as;else d.bgp.nb.push({ip,as});ch();return p(`Сосед ${ip}, AS ${as} (${as===d.bgp.as?'iBGP — внутри одной AS':'eBGP — между разными AS'}). Сессия поднимется, когда то же самое настроят на другой стороне: bgp show`)}
   if(!n)return p('Сначала объявите соседа: bgp neighbor '+ip+' remote-as <AS>');
   if(op==='localpref'){n.lp=Math.max(0,+a[4]||100);ch();return p(`local-pref для маршрутов от ${ip}: ${n.lp} (больше — предпочтительнее; по умолчанию 100)`)}
   if(op==='prepend'){n.pre=Math.max(0,Math.min(6,+a[4]||0));ch();return p(`При отправке ${ip} номер нашей AS повторяется ${1+n.pre} раз(а): путь через нас кажется длиннее — внешний мир будет предпочитать другого провайдера`)}
   if(op==='default-originate'){n.dflt=a[4]!=='off';ch();return p(`Соседу ${ip} ${n.dflt?'отправляется':'больше не отправляется'} маршрут по умолчанию 0.0.0.0/0`)}
   return usage('bgp neighbor <ip> remote-as|localpref|prepend|default-originate|del')}
  if(sub==='network'){if(a[2]==='del'){d.bgp.nets=d.bgp.nets.filter(x=>x.net!==a[3]);ch();return p('Сеть убрана из анонсов')}
   const m=nm(a[3]||'');if(ip2n(a[2]||'')==null||!m)return usage('bgp network <сеть> <маска|/N>');const n0=n2ip((ip2n(a[2])&ip2n(m))>>>0);if(!d.bgp.nets.some(x=>x.net===n0&&x.mask===m))d.bgp.nets.push({net:n0,mask:m});ch();return p(`Сеть ${n0}/${plen(m)} будет анонсироваться соседям (если она есть в таблице маршрутизации)`)}
  return usage('bgp as|neighbor|network|show|routes|off')}
 // ИБП
 if(K==='ups'&&cm==='ups'){const sub=(a[1]||'status').toLowerCase();
  if(sub==='add'){const t=byNm(a[2]);if(!t||t.k==='ups')return usage('ups add <имя устройства>');S.devs.forEach(u=>{if(u.k==='ups')u.load=(u.load||[]).filter(x=>x!==t.name)});d.load.push(t.name);ch();return p(`${t.name} подключён к ${d.name}`)}
  if(sub==='del'){d.load=(d.load||[]).filter(x=>x.toLowerCase()!==(a[2]||'').toLowerCase());ch();return p('Отключено')}
  if(sub==='battery'){const n=+a[2];if(!(n>0))return usage('ups battery <ёмкость в Вт·ч>   (12 В × 9 А·ч = 108 Вт·ч на один аккумулятор)');d.wh=n;ch();return p('Ёмкость аккумулятора: '+n+' Вт·ч')}
  if(sub==='va'){const n=+a[2];if(!(n>0))return usage('ups va <мощность в ВА>');d.va=n;ch();return p('Мощность ИБП: '+n+' ВА')}
  if(sub==='pf'){const n=+a[2];if(!(n>0&&n<=1))return usage('ups pf 0.6..1');d.pf=n;ch();return p('Коэффициент мощности: '+n)}
  return p(upsText(d))}
 if(cm==='blackout'||cm==='power'){if(a[1]==='end'||a[1]==='restore'||a[1]==='on'){blackoutEnd();return p('Питание восстановлено, все устройства включились.')}
  const m=+a[1];if(!(m>0))return p('Использование: blackout <минут>  — авария электросети на столько минут;  blackout end — подать питание.\nУстройства без ИБП гаснут сразу; с ИБП работают, пока хватает батареи.');
  const rows=blackout(m);return p(`Авария питания на ${m} мин. Результат:\n`+rows.map(([x,l,w])=>`  ${l?'✔':'✖'} ${x.name.padEnd(10)} ${w}`).join('\n')+'\nВернуть питание: blackout end')}
 return _run13(c)};
// ---- рисование: бейджи ----
const _draw13=draw;
draw=function(){_draw13();
 const gs=S.devs.some(d=>d.vrrp&&d.vrrp.length)?vrrpGroups():[];
 cv.querySelectorAll('g[data-id]').forEach(g=>{const d=dv(g.dataset.id);if(!d)return;let t='';
  if(d.dead){g.style.opacity='.45';t+=`<text x="${d.x}" y="${d.y-27}" text-anchor="middle" font-size="10" font-weight="600" fill="var(--er)">нет питания</text>`}
  gs.forEach(gr=>{const m=gr.m.find(x=>x.d===d);if(!m)return;const st=!m.al?'DOWN':gr.M===m?(gr.proto==='hsrp'?'ACTIVE':'MASTER'):(gr.proto==='hsrp'?'STANDBY':'BACKUP');
   t+=`<text x="${d.x}" y="${d.y+68}" text-anchor="middle" font-size="10" font-weight="700" fill="${st==='MASTER'||st==='ACTIVE'?'var(--ok)':st==='DOWN'?'var(--er)':'var(--mt)'}">${gr.proto.toUpperCase()} ${st}</text>`});
  if(d.bgp&&d.bgp.as&&BGPT[d.id]){const e=BGPT[d.id].sess.filter(x=>x.st==='Established').length;t+=`<text x="${d.x}" y="${d.y-(d.dead?48:36)}" text-anchor="middle" font-size="10" font-weight="600" fill="var(--ac)">AS ${d.bgp.as} · BGP ${e}/${BGPT[d.id].sess.length}</text>`}
  if(d.k==='ups'){const i=upsInfo(d);t+=`<text x="${d.x}" y="${d.y+68}" text-anchor="middle" font-size="10" font-weight="600" fill="${i.over?'var(--er)':'var(--mt)'}">${i.P} Вт · ${i.rt===Infinity?'∞':i.rt+' мин'}</text>`}
  if(t)g.insertAdjacentHTML('beforeend',t)})};
// ---- панель устройства ----
const _side13=side;
side=function(){_side13();const d=sel&&dv(sel);if(!d||itm(sel))return;const K=kind(d);let h='';
 const inp=(id,v,ph,w)=>`<input id="${id}" value="${esc(v||'')}" placeholder="${ph}" style="${w||'width:100%'};margin-top:4px">`;
 const btn=(q,t)=>`<button class="xb" data-q="${esc(q)}" style="margin-top:4px">${t}</button>`;
 const sl=(id,o)=>`<select id="${id}" style="width:100%;margin-top:4px">${o.map(x=>`<option>${esc(x)}</option>`).join('')}</select>`;
 if(K!=='ups')h+=`<h4>Журнал (syslog)</h4>${inp('q_sl',d.sysl,'IP syslog-сервера')}<div class="xr">${btn('syslog {q_sl}','Отправлять журнал')}${btn('syslog off','Выкл.')}</div>`;
 if(d.role==='log')h+=`<h4>Syslog-сервер</h4><div class="mt">Принимает UDP/514. Сообщения от устройств, у которых указан этот адрес.</div>${btn('logs 40','Показать принятые')}`;
 if(d.role==='rad')h+=`<h4>RADIUS</h4><label>Общий секрет<input id="q_sec" value="${esc(d.rsecret||'')}" placeholder="пусто — не проверять"></label>${btn('radius secret {q_sec}','Задать секрет')}${btn('radlog','Журнал запросов')}`;
 if(K==='prx'){const f=d.flt||{mode:'black',list:[],ssl:0};h+=`<h4>Веб-фильтр</h4><select data-qs="filter mode" style="width:100%"><option value="black" ${f.mode==='black'?'selected':''}>Чёрный список (запретить перечисленное)</option><option value="white" ${f.mode==='white'?'selected':''}>Белый список (разрешить только перечисленное)</option></select>`+f.list.map((x,i)=>`<div class="rt"><span>${esc(x)}</span><button class="xb" data-q="filter del ${i+1}">✕</button></div>`).join('')+`${inp('q_fv','','домен, cat:social, url:/games')}${btn('filter add {q_fv}','Добавить правило')}<label style="display:block;margin-top:4px"><input type="checkbox" data-qc="filter ssl" ${f.ssl?'checked':''} style="width:auto;display:inline"> Инспекция HTTPS (ssl-bump)</label><div class="xr">${btn('filter log','Журнал')}${btn('filter stats','Статистика')}${btn('filter cache clear','Очистить кэш')}</div>`}
 if(K==='lb'){h+=`<h4>Ферма серверов</h4>`+(d.be||[]).map(n=>`<div class="rt"><span>${esc(n)} · ${(d.cnt||{})[n]||0} запр.</span><button class="xb" data-q="lb del ${esc(n)}">✕</button></div>`).join('')+sl('q_lbs',S.devs.filter(x=>x!==d&&x.t==='pc'&&!(d.be||[]).includes(x.name)&&!['ups','cam'].includes(x.k)).map(x=>x.name))+btn('lb add {q_lbs}','Добавить в ферму')+`<label>Алгоритм<select data-qs="lb algo" style="width:100%">${Object.keys(LBALG).map(k=>`<option value="${k}" ${d.alg===k?'selected':''}>${LBALG[k]}</option>`).join('')}</select></label><div class="xr">${btn('lb status','Состояние')}${btn('lb reset','Сбросить счётчики')}</div>`}
 if(d.t==='rt'){const gs=vrrpGroups().filter(g=>g.m.some(x=>x.d===d));
  h+=`<h4>Резервный шлюз (VRRP / HSRP)</h4>`+gs.map(g=>{const m=g.m.find(x=>x.d===d);return`<div class="rt"><span>${g.proto.toUpperCase()} ${g.g} ${g.vip} · пр. ${m.v.pr} · <b>${!m.al?'DOWN':g.M===m?'MASTER':'BACKUP'}</b></span><button class="xb" data-q="vrrp del ${m.v.i} ${g.g}">✕</button></div>`}).join('')+
  `<div class="xr"><select id="q_vp"><option>vrrp</option><option>hsrp</option></select>${sl('q_vi',d.ifaces.filter(f=>f.ip).map(f=>f.n))}</div><div class="xr">${inp('q_vg','1','группа','width:30%')}${inp('q_vv','','виртуальный IP','width:68%')}</div><div class="xr">${inp('q_vr','100','приоритет','width:45%')}${inp('q_vt','','track: интерфейс','width:50%')}</div>${btn('{q_vp} {q_vi} {q_vg} {q_vv} priority {q_vr} preempt track {q_vt}','Задать группу')}`;
  h+=`<h4>BGP</h4>`+(d.bgp&&d.bgp.as?`<div class="mt" style="white-space:pre-wrap">${esc(bgpText(d,false))}</div>`:'<div class="mt">Не включён.</div>')+`<div class="xr">${inp('q_ba',d.bgp?d.bgp.as:'','AS','width:30%')}${btn('bgp as {q_ba}','Включить')}${btn('bgp routes','Таблица BGP')}</div><div class="xr">${inp('q_bn','','IP соседа','width:55%')}${inp('q_br','','его AS','width:40%')}</div>${btn('bgp neighbor {q_bn} remote-as {q_br}','Добавить соседа')}<div class="xr">${inp('q_bw','','сеть/маска, напр. 203.0.113.0/24','width:100%')}</div>${btn('bgp network {q_bw}','Анонсировать сеть')}`}
 if(K==='ups'){const i=upsInfo(d);h+=`<h4>ИБП</h4><div class="mt" style="white-space:pre-wrap">${esc(upsText(d))}</div>`+(d.load||[]).map(n=>`<div class="rt"><span>${esc(n)}</span><button class="xb" data-q="ups del ${esc(n)}">✕</button></div>`).join('')+sl('q_us',S.devs.filter(x=>x.k!=='ups'&&!needPoe(x)).map(x=>x.name))+btn('ups add {q_us}','Подключить к ИБП')+`<div class="xr">${inp('q_uw',d.wh,'Вт·ч','width:48%')}${inp('q_uv',d.va,'ВА','width:48%')}</div><div class="xr">${btn('ups battery {q_uw}','Батарея, Вт·ч')}${btn('ups va {q_uv}','Мощность, ВА')}</div><h4>Авария питания</h4>${inp('q_um','30','минут')}<div class="xr">${btn('blackout {q_um}','Отключить сеть')}${btn('blackout end','Подать питание')}</div>`}
 if(h)$('#side').insertAdjacentHTML('beforeend',h)};
$('#side').addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('[data-q]');if(!t)return;const d=dv(sel);if(!d)return;
 const c=t.dataset.q.replace(/\{(\w+)\}/g,(_,id)=>{const el=$('#'+id);return el?el.value.trim():''}).replace(/\s+/g,' ').trim();execOn(d,c);side()});
$('#side').addEventListener('change',e=>{const t=e.target,d=dv(sel);if(!d)return;if(t.dataset.qs){execOn(d,t.dataset.qs+' '+t.value);side()}else if(t.dataset.qc){execOn(d,t.dataset.qc+' '+(t.checked?'on':'off'));side()}});
// ---- CMDS/Tab ----
CMDS.push(
['syslog','syslog <ip сервера>|off','Отправлять журнал устройства на syslog-сервер','Централизованный журнал: события всех устройств в одном месте, их можно сопоставлять по времени. Передаётся по UDP/514 без гарантии доставки.','syslog 192.168.1.6','Безопасность'],
['logs','logs [N]','Журнал: на syslog-сервере — принятое, на других — локальные события','Расследование инцидента начинается с журналов.','logs 40','Безопасность'],
['radius','radius <ip> [секрет] | radius secret <s> | radius user <логин> <пароль> | radius users','Настройка RADIUS: на коммутаторе — адрес сервера и общий секрет, на сервере — пользователи','AAA: аутентификация (кто), авторизация (что можно), учёт. Общий секрет защищает обмен коммутатор ↔ сервер.','radius 192.168.1.5 s3cret','Безопасность'],
['radlog','radlog','Журнал запросов к RADIUS-серверу (Accept/Reject)','Показывает, почему устройство не пустили в сеть.','radlog','Безопасность'],
['proxy','proxy <ip прокси>|off','Клиенту: ходить в Интернет через прокси','Прокси — посредник: фильтрует, кэширует, ведёт журнал.','proxy 192.168.1.5','Службы'],
['filter','filter list|mode black|white|add <правило>|del N|ssl on|log|stats|cache clear','Веб-фильтр прокси-сервера','Правила: домен, cat:категория, url:часть. Чёрный список — запретить перечисленное, белый — только перечисленное.','filter add cat:social','Службы'],
['lb','lb add <сервер>|del|algo rr|lc|hash|status|reset','Настройка балансировщика нагрузки','Один адрес для клиентов, много серверов за ним; недоступные исключаются по health check.','lb add Web1','Службы'],
['vrrp','vrrp <интерфейс> <группа> <виртуальный ip> [priority N] [preempt|nopreempt] [track <интерфейс>] | vrrp show | vrrp del <if> <группа>','Резервный шлюз: два маршрутизатора делят один виртуальный адрес','Клиенты не знают о сбое: шлюз остаётся тем же адресом, MASTER переходит к резервному.','vrrp gi0/0 1 192.168.1.1 priority 120 track gi0/1','Маршрутизация'],
['hsrp','hsrp <интерфейс> <группа> <виртуальный ip> [priority N] [preempt] [track <if>]','То же, что VRRP, в терминах Cisco (Active/Standby, preempt по умолчанию выключен)','HSRP — фирменный протокол Cisco; VRRP — открытый стандарт (RFC 5798).','hsrp gi0/0 1 192.168.1.1 priority 110 preempt','Маршрутизация'],
['bgp','bgp as <N> | neighbor <ip> remote-as <AS> | neighbor <ip> localpref|prepend|default-originate | network <сеть> <маска> | show | routes','BGP: обмен маршрутами между автономными системами','BGP — протокол Интернета. Выбор пути: local-pref → короткий AS-путь → eBGP → меньший адрес соседа.','bgp neighbor 198.51.100.1 remote-as 100','Маршрутизация'],
['ups','ups | ups add <устройство> | ups battery <Вт·ч> | ups va <ВА>','Параметры и расчёт времени работы ИБП','Время = Вт·ч × КПД × глубина разряда / нагрузка (Вт).','ups add Server1','Питание'],
['blackout','blackout <минут> | blackout end','Авария электросети: кто выживет на ИБП','Проверка, хватит ли батареи, пока включится генератор или починят линию.','blackout 30','Питание']);
CMDS.forEach(c=>{if(!CMDNAMES.includes(c[0]))CMDNAMES.push(c[0])});
['power','radlog'].forEach(x=>{if(!CMDNAMES.includes(x))CMDNAMES.push(x)});


// ================= v13d: шаблоны схем, задания, теория =================
const TPL=[];
function tplLoad(t){const keep=pSnap();
 S.devs=[];S.links=[];S.c=0;S.n={pc:0,sw:0,rt:0};S.flows=[];S.notes=[];S.zones=[];delete S.vrm;delete S.blk;sel=null;
 const D={};t.dev.forEach(([k,n,x,y])=>{D[n]=addDev(k,x,y,n)});
 t.link.forEach(([a,ai,b,bi])=>{link(D[a],ai,D[b],bi);const l=S.links[S.links.length-1];l.id=rid();l.ct='cat5e';l.len=10});
 const bad=[];const _dr=draw,_sd=side;draw=function(){};side=function(){};
 try{t.cfg.forEach(([n,...cs])=>cs.forEach(c=>{const o0=out.textContent.length;execOn(D[n],c);const o=out.textContent.slice(o0);if(/Использование|Неверн|Нет такого|не удалось|Сначала/.test(o))bad.push(n+': '+c+' → '+o.trim().split('\n')[0])}));}finally{draw=_dr;side=_sd}
 pRst(keep);ch();draw();side();
 p(`Загружен шаблон «${t.n}». Это можно отменить кнопкой ↶ (Ctrl+Z). ${t.hint}`);
 if(bad.length)p('⚠ Шаблон загружен не полностью: '+bad.join('; '));return bad}
const pcs=(n,ip,gw)=>[n,`ip eth0 ${ip} /24`,`gateway ${gw}`];
TPL.push({n:'Малый офис с выходом в Интернет',d:'Два ПК, коммутатор, маршрутизатор с NAT, маршрутизатор провайдера и сайт в Интернете (DNS на сайте). Основа для большинства лабораторных.',hint:'Проверьте: на PC1 выполните ping 8.8.8.8 и curl news.example.',
 dev:[['pc','PC1',90,120],['pc','PC2',90,280],['sw','SW1',230,200],['rt','R1',390,200],['rt','ISP',560,200],['srv','Web',730,200]],
 link:[['PC1',0,'SW1',0],['PC2',0,'SW1',1],['SW1',2,'R1',0],['R1',1,'ISP',0],['ISP',1,'Web',0]],
 cfg:[pcs('PC1','192.168.1.10','192.168.1.1'),pcs('PC2','192.168.1.11','192.168.1.1'),['PC1','dns 8.8.8.8'],['PC2','dns 8.8.8.8'],
  ['R1','ip gi0/0 192.168.1.1 /24','ip gi0/1 203.0.113.2 /30','route add 0.0.0.0 0.0.0.0 203.0.113.1','nat gi0/1 on'],['ISP','ip gi0/0 203.0.113.1 /30','ip gi0/1 8.8.8.1 /24'],
  ['Web','ip eth0 8.8.8.8 /24','gateway 8.8.8.1','service add tcp 80','dnsrec news.example 8.8.8.8']]});
TPL.push({n:'Резервный шлюз VRRP (два маршрутизатора)',d:'Клиентская сеть с двумя шлюзами R1 (MASTER) и R2 (BACKUP), общий виртуальный адрес 192.168.1.1, OSPF до ядра и сервера. Отключите R1 — связь сохранится.',hint:'Выполните ping 10.9.0.10 с PC1, затем на R1 выключите питание: blackout 1 (или отключите кабель) и повторите. На R1 выполните vrrp show.',
 dev:[['pc','PC1',80,120],['pc','PC2',80,300],['sw','SW1',230,210],['rt','R1',400,110],['rt','R2',400,310],['rt','Core',590,210],['srv','Server',780,210]],
 link:[['PC1',0,'SW1',0],['PC2',0,'SW1',1],['SW1',2,'R1',0],['SW1',3,'R2',0],['R1',1,'Core',0],['R2',1,'Core',1],['Core',2,'Server',0]],
 cfg:[pcs('PC1','192.168.1.10','192.168.1.1'),pcs('PC2','192.168.1.11','192.168.1.1'),
  ['R1','ip gi0/0 192.168.1.2 /24','ip gi0/1 10.0.1.1 /30','ospf on','vrrp gi0/0 1 192.168.1.1 priority 120 preempt track gi0/1'],
  ['R2','ip gi0/0 192.168.1.3 /24','ip gi0/1 10.0.2.1 /30','ospf on','vrrp gi0/0 1 192.168.1.1 priority 100 preempt'],
  ['Core','ip gi0/0 10.0.1.2 /30','ip gi0/1 10.0.2.2 /30','ip gi0/2 10.9.0.1 /24','ospf on'],['Server','ip eth0 10.9.0.10 /24','gateway 10.9.0.1','service add tcp 80']]});
TPL.push({n:'Два провайдера и BGP (отказоустойчивый выход)',d:'Клиент (AS 65001) подключён к двум провайдерам (AS 100 и AS 200), которые связаны с «Интернетом» (AS 300). Основной канал — через AS 100 (local-pref 200).',hint:'На CR: bgp show, bgp routes. Затем отключите кабель CR—ISP-A (shutdown gi0/1) и убедитесь, что связь осталась через ISP-B.',
 dev:[['pc','PC1',60,240],['rt','CR',230,240],['rt','ISP-A',410,120],['rt','ISP-B',410,360],['rt','NET',600,240],['srv','Web',780,240]],
 link:[['PC1',0,'CR',0],['CR',1,'ISP-A',0],['CR',2,'ISP-B',0],['ISP-A',1,'NET',0],['ISP-B',1,'NET',1],['NET',2,'Web',0]],
 cfg:[pcs('PC1','203.0.113.10','203.0.113.1'),
  ['CR','ip gi0/0 203.0.113.1 /24','ip gi0/1 198.51.100.2 /30','ip gi0/2 192.0.2.2 /30','bgp as 65001','bgp neighbor 198.51.100.1 remote-as 100','bgp neighbor 198.51.100.1 localpref 200','bgp neighbor 192.0.2.1 remote-as 200','bgp network 203.0.113.0 /24'],
  ['ISP-A','ip gi0/0 198.51.100.1 /30','ip gi0/1 10.1.0.1 /30','bgp as 100','bgp neighbor 198.51.100.2 remote-as 65001','bgp neighbor 198.51.100.2 default-originate','bgp neighbor 10.1.0.2 remote-as 300'],
  ['ISP-B','ip gi0/0 192.0.2.1 /30','ip gi0/1 10.2.0.1 /30','bgp as 200','bgp neighbor 192.0.2.2 remote-as 65001','bgp neighbor 192.0.2.2 default-originate','bgp neighbor 10.2.0.2 remote-as 300'],
  ['NET','ip gi0/0 10.1.0.2 /30','ip gi0/1 10.2.0.2 /30','ip gi0/2 8.8.8.1 /24','bgp as 300','bgp neighbor 10.1.0.1 remote-as 100','bgp neighbor 10.2.0.1 remote-as 200','bgp network 8.8.8.0 /24'],
  ['Web','ip eth0 8.8.8.8 /24','gateway 8.8.8.1','service add tcp 80']]});
TPL.push({n:'Ферма веб-серверов с балансировщиком',d:'Клиенты обращаются к LB1 (192.168.10.100), запросы распределяются между Web1–Web3. Выключите один сервер и посмотрите на health check.',hint:'С PC1 несколько раз: connect 192.168.10.100 80. На LB1: lb status. Смените алгоритм: lb algo hash.',
 dev:[['pc','PC1',70,130],['pc','PC2',70,290],['sw','SW1',250,210],['lb','LB1',430,210],['srv','Web1',620,100],['srv','Web2',620,210],['srv','Web3',620,320]],
 link:[['PC1',0,'SW1',0],['PC2',0,'SW1',1],['SW1',2,'LB1',0],['LB1',0,'SW1',2]].slice(0,3).concat([['SW1',3,'Web1',0],['SW1',4,'Web2',0],['SW1',5,'Web3',0]]),
 cfg:[['PC1','ip eth0 192.168.10.10 /24'],['PC2','ip eth0 192.168.10.11 /24'],['LB1','ip eth0 192.168.10.100 /24','lb add Web1','lb add Web2','lb add Web3'],
  ['Web1','ip eth0 192.168.10.11 /24','service add tcp 80'],['Web2','ip eth0 192.168.10.12 /24','service add tcp 80'],['Web3','ip eth0 192.168.10.13 /24','service add tcp 80']]});
TPL.push({n:'Прокси-сервер и веб-фильтр',d:'Офисная сеть: клиенты ходят в Интернет через Proxy1, фильтр блокирует соцсети. Задание: запретите прямой выход в обход прокси (acl на R1).',hint:'На PC1: curl news.example (пройдёт), curl vk.com (403). Повторите первый запрос — страница придёт из кэша.',
 dev:[['pc','PC1',70,130],['pc','PC2',70,290],['sw','SW1',230,210],['prx','Proxy1',230,60],['rt','R1',400,210],['srv','Inet',600,210]],
 link:[['PC1',0,'SW1',0],['PC2',0,'SW1',1],['Proxy1',0,'SW1',2],['SW1',3,'R1',0],['R1',1,'Inet',0]],
 cfg:[pcs('PC1','192.168.1.10','192.168.1.1'),pcs('PC2','192.168.1.11','192.168.1.1'),['PC1','proxy 192.168.1.5'],['PC2','proxy 192.168.1.5'],
  ['Proxy1','ip eth0 192.168.1.5 /24','gateway 192.168.1.1','dns 8.8.8.8','filter add cat:social','filter add cat:games'],
  ['R1','ip gi0/0 192.168.1.1 /24','ip gi0/1 8.8.8.2 /24'],['Inet','ip eth0 8.8.8.8 /24','gateway 8.8.8.2','service add tcp 80','service add tcp 443','dnsrec news.example 8.8.8.8','dnsrec vk.com 8.8.8.8']]});
TPL.push({n:'Видеонаблюдение на PoE с ИБП',d:'PoE-коммутатор, две камеры, регистратор и ИБП, защищающий коммутатор и регистратор. Посчитайте автономность и проверьте аварию питания.',hint:'На UPS1: ups. Затем blackout 30 — и посмотрите, кто выжил. blackout end — вернуть питание.',
 dev:[['cam','Cam1',90,110],['cam','Cam2',90,320],['poe','PoE1',270,210],['nvr','NVR1',460,210],['ups','UPS1',460,360]],
 link:[['Cam1',0,'PoE1',0],['Cam2',0,'PoE1',1],['PoE1',2,'NVR1',0]],
 cfg:[['Cam1','ip eth0 192.168.50.11 /24'],['Cam2','ip eth0 192.168.50.12 /24'],['NVR1','ip eth0 192.168.50.5 /24','addcam Cam1','addcam Cam2'],['UPS1','ups add PoE1','ups add NVR1']]});
TPL.push({n:'Сеть с 802.1X, RADIUS и syslog',d:'Коммутатор с проверкой подключаемых устройств через RADIUS и сбором журналов на Syslog-сервер. Один ПК с верными учётными данными, второй — с неверными.',hint:'Выполните ping 192.168.1.5 с PC1 и PC2. На RADIUS1: radlog, на Syslog1: logs.',
 dev:[['pc','PC1',70,110],['pc','PC2',70,310],['msw','MSW1',260,210],['rad','RADIUS1',470,110],['log','Syslog1',470,310]],
 link:[['PC1',0,'MSW1',0],['PC2',0,'MSW1',1],['MSW1',2,'RADIUS1',0],['MSW1',3,'Syslog1',0]],
 cfg:[['PC1','ip eth0 192.168.1.10 /24','dot1x ivanov 12345'],['PC2','ip eth0 192.168.1.11 /24','dot1x guest wrongpass'],
  ['RADIUS1','ip eth0 192.168.1.5 /24','radius user ivanov 12345','radius secret lab2026'],['Syslog1','ip eth0 192.168.1.6 /24'],
  ['MSW1','radius 192.168.1.5 lab2026','dot1x fa0/1 on','dot1x fa0/2 on','syslog 192.168.1.6']]});
TPL.push({n:'Периметр: межсетевой экран и DMZ',d:'Зоны inside / dmz / outside, веб-сервер в DMZ с опубликованным портом 80, клиент во внутренней сети и узел в Интернете.',hint:'Из Internet: connect 172.16.0.10 80 — проходит, connect 192.168.1.10 22 — нет. Откройте dmz → inside только то, что нужно (allow).',
 dev:[['pc','PC1',70,160],['rt','FW',300,210],['srv','Web',500,320],['srv','Internet',650,110]],
 link:[['PC1',0,'FW',0],['FW',1,'Web',0],['FW',2,'Internet',0]],
 cfg:[pcs('PC1','192.168.1.10','192.168.1.1'),['Web','ip eth0 172.16.0.10 /24','gateway 172.16.0.1','service add tcp 80'],['Internet','ip eth0 198.51.100.10 /24','gateway 198.51.100.1'],
  ['FW','ip gi0/0 192.168.1.1 /24','ip gi0/1 172.16.0.1 /24','ip gi0/2 198.51.100.1 /24','zone gi0/0 inside','zone gi0/1 dmz','zone gi0/2 outside','publish tcp 80']]});
function tplHtml(){return`<h3>Шаблоны готовых схем</h3><p class="mt">Выберите шаблон — текущая схема заменится готовой, настроенной по лучшей практике. Загрузку можно отменить (↶ / Ctrl+Z). Каждый шаблон — отправная точка: изучите, сломайте, починить, доработайте.</p>`+TPL.map((t,i)=>`<div class="tip" style="margin:8px 0"><b>${esc(t.n)}</b><br>${esc(t.d)}<br><button data-x="tpl_${i}" style="margin-top:6px">Загрузить шаблон</button></div>`).join('')}
$('#baddr').insertAdjacentHTML('afterend','<button id="btpl" title="Готовые схемы для лабораторных">Шаблоны</button>');
$('#btpl').onclick=()=>openMd(tplHtml());
md.addEventListener('click',e=>{const x=e.target.dataset.x;if(x&&x.startsWith('tpl_')){const t=TPL[+x.slice(4)];if(t){md.hidden=true;tplLoad(t)}}});
// ---- задания ----
const withDown=(fn)=>{try{return fn()}finally{ch()}};
TASKS.push(
{t:'18. Резервный шлюз VRRP',d:'Загрузите шаблон «Резервный шлюз VRRP» (кнопка «Шаблоны») либо постройте сами: ПК PC1 с шлюзом 192.168.1.1, два маршрутизатора R1 и R2 в одной сети (адреса .2 и .3) с общим виртуальным адресом 192.168.1.1 (vrrp gi0/0 1 192.168.1.1 priority …), за ними сервер Server. Результат: при выключении любого из маршрутизаторов PC1 по-прежнему достаёт Server. Теория: клиенты знают только виртуальный адрес; MASTER выбирается по приоритету; track снижает приоритет при потере uplink.',c:[['PC1','Server',1]],fn:()=>{const r1=byNm('R1'),r2=byNm('R2'),pc=byNm('PC1'),sv=byNm('Server');if(!r1||!r2||!pc||!sv)return[false,'нужны устройства PC1, R1, R2, Server'];if(!(r1.vrrp||[]).length||!(r2.vrrp||[]).length)return[false,'настройте vrrp на обоих маршрутизаторах'];
  const res=[];for(const x of [r1,r2]){const o=x.dead;x.dead=true;let ok;try{EX=[];ok=!!trip(pc,srcIp(sv)).ok}finally{x.dead=o}res.push([x.name,ok])}ch();const bad=res.filter(r=>!r[1]);return[!bad.length,bad.length?`при отказе ${bad.map(b=>b[0]).join(', ')} связь пропала: проверьте шлюз на ПК (виртуальный адрес), маршруты до сервера (ospf on) и приоритеты`:'связь переживает отказ каждого из маршрутизаторов']}},
{t:'19. Два провайдера и BGP',d:'Загрузите шаблон «Два провайдера и BGP». Убедитесь, что на CR обе сессии Established. Результат: PC1 достаёт сайт Web (8.8.8.8), а при отключении основного канала (CR—ISP-A, shutdown gi0/1) связь сохраняется через ISP-B. Затем сделайте основным канал B: уберите localpref у A и задайте его у B. Теория: eBGP, AS-путь, local-pref влияет на исходящий трафик, prepend — на входящий.',c:[['PC1','Web',1]],fn:()=>{const cr=byNm('CR'),pc=byNm('PC1'),w=byNm('Web');if(!cr||!pc||!w)return[false,'нужны устройства CR, PC1, Web (шаблон «Два провайдера и BGP»)'];computeRip();const T=BGPT[cr.id];if(!T)return[false,'на CR не настроен BGP'];const up=T.sess.filter(s=>s.st==='Established').length;if(up<2)return[false,`сессий BGP поднято ${up} из ${T.sess.length}: bgp show покажет причину`];
  const fs=cr.ifaces.filter(f=>f.n!=='gi0/0');const old=fs.map(f=>f.off);let ok;try{fs[0].off=true;computeRip();EX=[];const a=trip(pc,srcIp(w)).ok;fs[0].off=old[0];fs[1].off=true;computeRip();EX=[];const b=trip(pc,srcIp(w)).ok;ok=a&&b}finally{fs.forEach((f,i)=>f.off=old[i]);computeRip();ch()}return[!!ok,ok?'обе сессии подняты, связь переживает отказ любого из провайдеров':'при отказе одного из каналов связь пропала: у второго провайдера должен быть default-originate и сессия']}},
{t:'20. Балансировка нагрузки',d:'Загрузите шаблон «Ферма веб-серверов». Результат: 6 запросов с PC1 на адрес LB1 распределяются минимум на 2 разных сервера, а при выключенном Web2 (или без службы на нём) клиенты всё равно получают ответ. Теория: виртуальный адрес, алгоритмы (rr, lc, hash), health check.',c:[['PC1','LB1',1,'tcp',80]],fn:()=>{const lb=byNm('LB1'),pc=byNm('PC1');if(!lb||!pc)return[false,'нужны LB1 и PC1'];if((lb.be||[]).length<2)return[false,'в ферме должно быть минимум 2 сервера (lb add)'];const used=new Set(),sx=EX;QUIET++;try{for(let i=0;i<6;i++){const R=l4(pc,srcIp(lb),'tcp',80);if(R.be)used.add(R.be.name)}
  if(used.size<2)return[false,'запросы идут только на один сервер: '+[...used].join(', ')+' (проверьте алгоритм и службы на серверах)'];const w=byNm((lb.be||[])[1]);if(!w)return[false,'сервер фермы не найден'];const o=w.dead;w.dead=true;let ok=0;try{for(let i=0;i<4;i++)if(l4(pc,srcIp(lb),'tcp',80).ok)ok++}finally{w.dead=o}
  return[ok===4,ok===4?'запросы распределяются ('+[...used].join(', ')+') и переживают отказ сервера':'при отказе сервера часть запросов потерялась: проверьте health check/ферму']}finally{QUIET--;EX=sx;ch()}}},
{t:'21. Прокси и веб-фильтр',d:'Загрузите шаблон «Прокси-сервер и веб-фильтр». Результат: клиенты ходят через прокси; соцсети (vk.com) заблокированы фильтром, news.example доступен; клиентам запрещён обход прокси — на R1 правило acl deny 192.168.1.0/24 8.8.8.0/24 tcp 80, но с исключением для прокси (подсказка: сначала acl permit 192.168.1.5/32 8.8.8.0/24 tcp 80). Теория: прокси как точка контроля; без блокировки прямого доступа фильтр обходится.',c:[['PC1','Proxy1',1,'tcp',3128],['Proxy1','Inet',1,'tcp',80],['PC1','Inet',0,'tcp',80]],fn:()=>{const px=byNm('Proxy1'),pc=byNm('PC1');if(!px||!pc)return[false,'нужны Proxy1 и PC1'];const a=pxDecide(px,'vk.com','/',false),b=pxDecide(px,'news.example','/',false);if(!a.block)return[false,'vk.com должен блокироваться (filter add cat:social)'];if(b.block)return[false,'news.example не должен блокироваться'];return[true,'фильтр блокирует соцсети и пропускает новостной сайт']}},
{t:'22. AAA: RADIUS и syslog',d:'Загрузите шаблон «Сеть с 802.1X, RADIUS и syslog». Результат: PC1 проходит 802.1X, а PC2 — нет; MSW1 отправляет журнал на Syslog1, и на сервере видно событие об отказе для PC2. Теория: AAA, общий секрет, централизованное журналирование (UDP/514).',c:[['PC1','RADIUS1',1],['PC2','RADIUS1',0]],fn:()=>{const sl=byNm('Syslog1'),sw=byNm('MSW1');if(!sl||!sw)return[false,'нужны Syslog1 и MSW1'];if(sw.sysl!==srcIp(sl))return[false,'на MSW1 выполните syslog <ip Syslog1>'];dxPrev=new Set();dxScan();const r=syslogRecv(sl).filter(e=>/802\.1X/.test(e.x));return[r.length>0,r.length?`на Syslog1 принято сообщений 802.1X: ${r.length}`:'на Syslog1 пока нет сообщений 802.1X: запустите ping с PC2 и проверьте путь до сервера']}},
{t:'23. ИБП: расчёт автономности',d:'Постройте (или загрузите шаблон «Видеонаблюдение на PoE с ИБП»): ИБП UPS1 защищает PoE-коммутатор и NVR. Результат: автономная работа не менее 30 минут при нагрузке в пределах мощности ИБП (без перегруза); подберите ёмкость батареи (ups battery) и мощность (ups va). Затем проверьте командой blackout 30. Теория: T = Вт·ч × 0,85 × 0,8 / P × 60.',c:[],fn:()=>{const u=S.devs.find(x=>x.k==='ups');if(!u)return[false,'добавьте на схему ИБП'];const i=upsInfo(u);if(!i.L.length)return[false,'подключите устройства: ups add <имя>'];if(i.over)return[false,`перегрузка: нагрузка ${i.P} Вт, ИБП тянет ${i.cap} Вт — увеличьте ups va`];return[i.rt>=30,`время работы ${i.rt===Infinity?'∞':i.rt+' мин'}${i.rt>=30?'':' — нужно ≥ 30: увеличьте ёмкость батареи (ups battery)'}`]}});
syncTasks();
// ---- исправление исходного кода: метки BGP, секрет RADIUS (см. сборку) ----
// ---- теория ----
const TH3=[];
TH3.push(['Т22. Резервный шлюз: VRRP и HSRP',`
<h4>Проблема единой точки отказа</h4>
<p>У каждого компьютера в сети задан <b>один</b> шлюз по умолчанию. Если маршрутизатор-шлюз выйдет из строя, сеть потеряет выход наружу, даже когда рядом стоит исправный второй маршрутизатор: клиенты не умеют сами переключаться. Решение — <b>протокол резервирования первого перехода (FHRP)</b>.</p>
<h4>Как это работает</h4>
<ol><li>Два (или больше) маршрутизатора объединяются в <b>группу</b> и делят <b>виртуальный IP-адрес</b> и виртуальный MAC (VRRP: 00-00-5E-00-01-<i>группа</i>, HSRP: 00-00-0C-07-AC-<i>группа</i>).</li><li>Клиенты настроены на виртуальный адрес как на шлюз и ничего не знают о резерве.</li><li>Один маршрутизатор — <b>MASTER</b> (в HSRP — Active) — отвечает на ARP по виртуальному адресу и пересылает трафик. Остальные — BACKUP (Standby), слушают его «приветствия» (VRRP Advertisement, по умолчанию раз в секунду, групповой адрес 224.0.0.18).</li><li>Если приветствия прекращаются (≈3 интервала), следующий по приоритету становится MASTER и рассылает gratuitous ARP — клиентский ARP-кэш обновляется без вмешательства.</li></ol>
<table class="t"><tr><th></th><th>VRRP</th><th>HSRP</th></tr><tr><td>Стандарт</td><td>открытый, RFC 5798</td><td>фирменный Cisco</td></tr><tr><td>Роли</td><td>Master / Backup</td><td>Active / Standby / Listen</td></tr><tr><td>Приоритет по умолчанию</td><td>100 (владелец адреса — 255)</td><td>100</td></tr><tr><td>Preempt</td><td>включён по умолчанию</td><td>выключен по умолчанию</td></tr></table>
<h4>Preempt и track</h4>
<p><b>Preempt</b> — разрешает маршрутизатору с более высоким приоритетом отобрать роль у текущего MASTER после своего возвращения. Без него роль остаётся у того, кто её уже держит (меньше «дёрганья» при нестабильном канале). <b>Track</b> — отслеживание интерфейса: если упал uplink master-маршрутизатора, его приоритет уменьшается (в симуляторе на 20), и роль переходит к резервному, у которого связь с ядром есть. Без track master с оборванным uplink оставался бы шлюзом, через который ничего не доходит.</p>
<div class="tip"><b>Про обратный путь.</b> Резервирование шлюза решает только исходящий трафик клиентов. Ядро должно знать, куда слать ответы: используйте динамическую маршрутизацию (OSPF) либо статический маршрут на виртуальный адрес.</div>
<p><b>В симуляторе:</b> <code>vrrp gi0/0 1 192.168.1.1 priority 120 preempt track gi0/1</code> на R1 и такая же команда с приоритетом 100 на R2; <code>vrrp show</code> — кто MASTER. Выключите R1 (<code>blackout</code> или shutdown интерфейса) и повторите ping: в журнале появится запись о смене MASTER.</p>`]);
TH3.push(['Т23. BGP и подключение к двум провайдерам',`
<h4>Зачем нужен BGP</h4>
<p>Интернет состоит из десятков тысяч <b>автономных систем (AS)</b> — сетей под единым управлением, каждая со своим номером (ASN). Внутри AS используют IGP (OSPF, RIP) — они ищут кратчайший путь. Между AS работает <b>BGP</b> (RFC 4271), в котором важнее <b>политика</b>: кому и какие маршруты анонсировать, через кого предпочитать выход.</p>
<h4>Основные понятия</h4>
<ul><li><b>eBGP</b> — между разными AS (обычно соседи соединены напрямую), <b>iBGP</b> — внутри одной AS. Маршруты, узнанные от iBGP-соседа, другому iBGP-соседу не передаются — поэтому iBGP требует «полной сетки» (или route reflector).</li><li><b>AS-путь (AS_PATH)</b> — список AS, через которые прошёл маршрут. При передаче через eBGP добавляется своя AS; если в пути уже есть своя AS — маршрут отбрасывается (защита от петель).</li><li><b>Сессия</b> устанавливается по TCP/179 и должна быть настроена с обеих сторон: адрес соседа и его ASN должны совпасть.</li><li><b>network</b> — какие префиксы анонсировать; анонсируется только то, что уже есть в таблице маршрутизации.</li></ul>
<h4>Выбор лучшего пути (упрощённо)</h4>
<ol><li>Наибольший <b>local-pref</b> (по умолчанию 100; действует только внутри своей AS — рычаг <i>исходящего</i> трафика).</li><li>Наименьшая длина <b>AS-пути</b>.</li><li>eBGP предпочтительнее iBGP.</li><li>Меньший адрес соседа (в реальности есть ещё MED, router-id и др.).</li></ol>
<h4>Схема «клиент — два провайдера» (multihoming)</h4>
<table class="t"><tr><th>Цель</th><th>Инструмент</th></tr><tr><td>Исходящий трафик через основного провайдера</td><td>выше local-pref на сессии с основным</td></tr><tr><td>Входящий трафик через основного</td><td>AS-path prepend на сессии с резервным (путь «кажется» длиннее)</td></tr><tr><td>Резервирование</td><td>вторая сессия; при падении первой маршруты исчезают, остаётся запасной путь</td></tr><tr><td>Не стать транзитом между провайдерами</td><td>анонсировать только свои префиксы (network), а не всё подряд</td></tr></table>
<p>Клиент часто получает от провайдера просто маршрут по умолчанию (<code>default-originate</code>) — тогда таблица маленькая, но сохраняется выбор канала по local-pref.</p>
<div class="tip"><b>Упрощения симулятора:</b> eBGP только между напрямую соединёнными узлами; iBGP по умолчанию использует адрес соседа как next-hop (аналог next-hop-self); нет таймеров, MED, community и фильтров маршрутов. Для понимания принципа выбора пути этого достаточно.</div>
<p><b>В симуляторе:</b> шаблон «Два провайдера и BGP». <code>bgp show</code> — соседи и причины, если сессия не поднимается; <code>bgp routes</code> — таблица с объяснением, почему маршрут проиграл; <code>bgp neighbor … prepend 2</code> — удлинить путь.</p>`]);
TH3.push(['Т24. Балансировка нагрузки и отказоустойчивость сервисов',`
<h4>Зачем</h4>
<p>Один сервер ограничен по производительности и является точкой отказа. <b>Балансировщик</b> принимает запросы по одному адресу и распределяет их между фермой серверов; сломавшийся сервер автоматически исключается.</p>
<h4>Уровни балансировки</h4>
<table class="t"><tr><th>Уровень</th><th>Что видит</th><th>Пример</th></tr><tr><td>L4 (TCP/UDP)</td><td>IP и порты</td><td>LVS, HAProxy в режиме tcp</td></tr><tr><td>L7 (HTTP)</td><td>URL, заголовки, cookie</td><td>nginx, HAProxy http — разные пути на разные серверы, терминация TLS</td></tr><tr><td>DNS</td><td>имя</td><td>несколько A-записей, GeoDNS</td></tr></table>
<h4>Алгоритмы</h4>
<ul><li><b>Round robin</b> — по кругу; просто и справедливо при однородных запросах.</li><li><b>Least connections</b> — на сервер с наименьшим числом активных соединений; лучше при запросах разной длительности (в симуляторе — по числу обслуженных).</li><li><b>IP-hash</b> — клиент всегда попадает на один сервер; полезно, если сессия хранится на сервере (sticky session).</li><li>Взвешенные варианты — для серверов разной мощности.</li></ul>
<h4>Health check</h4>
<p>Балансировщик периодически проверяет серверы: TCP-подключение к порту, HTTP-запрос с кодом 200. Не прошёл проверку — исключается; вернулся — включается. Если не прошёл никто, клиент получает <b>503 Service Unavailable</b>.</p>
<h4>Подводные камни</h4>
<ul><li>Сам балансировщик — новая точка отказа: его резервируют парой (VRRP!) — это связывает темы Т22 и Т24.</li><li>Состояние сессий: хранить в общей БД/кэше, а не на сервере.</li><li>Реальный IP клиента серверам нужен для журналов — передаётся в заголовке X-Forwarded-For.</li></ul>
<p><b>В симуляторе:</b> шаблон «Ферма веб-серверов»; <code>connect 192.168.10.100 80</code> несколько раз, <code>lb status</code>; выключите службу на одном сервере — health check его исключит.</p>`]);
TH3.push(['Т25. Прокси-сервер и веб-фильтр',`
<h4>Роль прокси</h4>
<p>Прямой proxy стоит между клиентами и Интернетом. Клиент отправляет запрос ему, а прокси от своего имени обращается к сайту. Это даёт <b>контроль</b> (фильтрация и журнал «кто, куда, когда»), <b>экономию канала</b> (кэш) и <b>скрытие</b> адресов клиентов. Классический продукт — Squid (порт 3128).</p>
<h4>Способы фильтрации</h4>
<table class="t"><tr><th>Способ</th><th>Как</th><th>Ограничение</th></tr><tr><td>Чёрный список</td><td>запрещено перечисленное (домены, категории)</td><td>всегда найдётся новый сайт, которого нет в списке</td></tr><tr><td>Белый список</td><td>разрешено только перечисленное</td><td>строже, но неудобно; для школ, киосков, АСУ</td></tr><tr><td>По категориям</td><td>базы категорий (соцсети, игры, реклама)</td><td>нужны обновляемые базы</td></tr><tr><td>По URL/содержимому</td><td>часть адреса, ключевые слова</td><td>в HTTPS путь зашифрован</td></tr></table>
<h4>HTTPS</h4>
<p>При HTTPS клиент отправляет прокси запрос <code>CONNECT host:443</code> — прокси видит <b>только имя сайта</b>; блокировать по домену он может, по пути — нет. Чтобы видеть содержимое, применяют <b>инспекцию TLS (ssl-bump)</b>: прокси подменяет сертификат своим, а на клиентах устанавливают корневой сертификат организации. Это юридически и этически чувствительно: нужно уведомлять пользователей и исключать банки и медицину.</p>
<h4>Как не дать обойти</h4>
<p>Если разрешён прямой выход в Интернет, любой пользователь отключит прокси в настройках браузера. Поэтому на маршрутизаторе/МЭ разрешают выход в Интернет <b>только прокси-серверу</b> (acl permit для его адреса, deny для остальных). Альтернатива — <b>прозрачный прокси</b>: МЭ незаметно перенаправляет порт 80 на прокси.</p>
<p><b>В симуляторе:</b> шаблон «Прокси-сервер и веб-фильтр»; <code>curl vk.com</code> — 403, <code>curl news.example</code> — 200, повтор — из кэша; <code>filter log</code>, <code>filter stats</code> (эффективность кэша).</p>`]);
TH3.push(['Т26. AAA: RADIUS и централизованный журнал (syslog)',`
<h4>AAA</h4>
<ul><li><b>Authentication</b> — кто вы (логин/пароль, сертификат).</li><li><b>Authorization</b> — что вам можно (VLAN, права).</li><li><b>Accounting</b> — что вы делали (когда вошёл, сколько передал).</li></ul>
<h4>RADIUS</h4>
<p>Протокол клиент-серверной аутентификации (RFC 2865, UDP 1812/1813). «Клиентом» RADIUS является не пользователь, а <b>NAS</b> — коммутатор, точка доступа, VPN-шлюз: он передаёт серверу данные пользователя и получает <b>Access-Accept</b> или <b>Access-Reject</b>. Сервер хранит учётные записи в одном месте (или обращается к каталогу — LDAP/AD). Обмен NAS ↔ сервер защищён <b>общим секретом</b> — он должен совпадать с обеих сторон, иначе сервер молча отбрасывает запросы.</p>
<p>Вместе с <b>802.1X</b> порт коммутатора остаётся закрытым, пока подключаемое устройство не пройдёт проверку; прошедшему можно назначить VLAN по результату проверки.</p>
<h4>Syslog</h4>
<p>Устройства передают события на центральный сервер (UDP/514 или TCP/TLS 6514). Уровни важности: 0 emergency … 4 warning, 5 notice, 6 info, 7 debug. Централизация нужна, потому что: журналы нескольких устройств сопоставляются по времени (нужна синхронизация — NTP!), злоумышленник не может стереть следы на устройстве, а срок хранения часто задан требованиями (в РФ — например, 152-ФЗ, приказы ФСТЭК).</p>
<div class="tip"><b>UDP не гарантирует доставку.</b> Если сервер журналов недоступен, события теряются. В симуляторе сообщения попадают на сервер, только если сейчас есть путь до него (и не мешают ACL).</div>
<p><b>В симуляторе:</b> шаблон «Сеть с 802.1X, RADIUS и syslog»; <code>radlog</code> на RADIUS1; <code>logs</code> на Syslog1; измените секрет на сервере — все устройства потеряют доступ.</p>`]);
TH3.push(['Т27. Бесперебойное питание: ИБП и расчёт автономности',`
<h4>Виды ИБП</h4>
<table class="t"><tr><th>Тип</th><th>Принцип</th><th>Применение</th></tr><tr><td>Off-line (standby)</td><td>в норме питает сеть напрямую, при сбое переключается (≈5–10 мс)</td><td>домашние ПК</td></tr><tr><td>Line-interactive</td><td>плюс стабилизатор напряжения (AVR)</td><td>офис, малые серверные, сетевое оборудование</td></tr><tr><td>On-line (двойное преобразование)</td><td>нагрузка всегда питается от инвертора</td><td>серверные, ЦОД, медицина</td></tr></table>
<h4>Расчёт</h4>
<p>1) <b>Нагрузка P (Вт)</b> — сумма реальных мощностей устройств (не ВА!). 2) <b>Мощность ИБП</b> указывают в ВА; активная мощность = ВА × cosφ (для line-interactive ≈ 0,6–0,7, для on-line ≈ 0,9). ИБП на 1000 ВА с cosφ = 0,6 тянет только 600 Вт. 3) Нужно брать <b>запас 20–30 %</b>.</p>
<p><b>Время автономной работы</b> = Е × η × k / P × 60 (мин), где Е — энергия батарей (Вт·ч) = напряжение × ёмкость (А·ч), η ≈ 0,85 — КПД инвертора, k ≈ 0,8 — допустимая глубина разряда. Пример: два аккумулятора 12 В × 9 А·ч = 216 Вт·ч; нагрузка 150 Вт → 216 × 0,85 × 0,8 / 150 × 60 ≈ <b>59 мин</b>. На практике время падает нелинейно с ростом нагрузки и с возрастом батарей (срок службы AGM-аккумуляторов 3–5 лет).</p>
<h4>Практика</h4>
<ul><li>Подключайте к ИБП то, что нельзя терять: серверы, коммутаторы, роутеры, регистраторы. Принтеры и обогреватели — нет.</li><li>PoE-коммутатор питает камеры и точки доступа — их мощность входит в нагрузку коммутатора.</li><li>Для длительных отключений — дизель-генератор (ИБП держит нагрузку, пока он запустится) и <b>корректное завершение работы</b> серверов по сигналу ИБП (USB/SNMP, NUT/apcupsd).</li><li>Сеть передачи данных тоже нужно защищать: ИБП у сервера бесполезен, если выключился коммутатор между клиентами и сервером.</li></ul>
<p><b>В симуляторе:</b> шаблон «Видеонаблюдение на PoE с ИБП»; <code>ups</code> — расчёт, <code>blackout 30</code> — авария на 30 минут: устройства без ИБП гаснут сразу, остальные — пока хватает батареи.</p>`]);
{const i21=MAN.findIndex(x=>x[0].startsWith('Т21'));if(i21>=0){MAN[i21]=['Т21. Консоль: команды (по категориям)',(()=>{const g={};CMDS.forEach(c=>(g[c[5]]=g[c[5]]||[]).push(c));return `<p class="mt">В консоли: <code>help all</code> — список, <code>man &lt;команда&gt;</code> — подробности, Tab — дополнение, ↑ ↓ — история, несколько команд через <code>;</code>, <code>on &lt;устройство&gt; &lt;команда&gt;</code> — выполнить на другом узле.</p>`+Object.keys(g).map(k=>`<h4>${k}</h4><table class="t"><tr><th>Команда</th><th>Что делает</th><th>Пример</th></tr>${g[k].map(c=>`<tr><td><code>${esc(c[1])}</code></td><td>${esc(c[2])}<br><span class="mt">${esc(c[3])}</span></td><td><code>${esc(c[4])}</code></td></tr>`).join('')}</table>`).join('')})()]}}
{const at=MAN.findIndex(x=>x[0].startsWith('Т21')||x[0].startsWith('17.'));const i17=MAN.findIndex(x=>x[0].startsWith('17.'));MAN.splice(i17<0?MAN.length-1:i17,0,...TH3)}
p('Новое (v13): RADIUS- и syslog-серверы, прокси с веб-фильтром, балансировщик, VRRP/HSRP, BGP, ИБП и авария питания; кнопка «Шаблоны». Команды: help all.');
draw();side();
