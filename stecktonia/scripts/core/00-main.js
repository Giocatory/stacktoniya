const $=s=>document.querySelector(s),cv=$('#cv'),out=$('#out');
const T={pc:{l:'Компьютер',p:'PC',i:''},sw:{l:'Коммутатор',p:'SW',i:''},rt:{l:'Маршрутизатор',p:'R',i:''}};
let S={devs:[],links:[],c:0,n:{pc:0,sw:0,rt:0}},tool='sel',sel=null,linkFrom=null,drag=null,fl=new Set(),hist=[],hi=0;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ip2n=s=>{const p=String(s).split('.');if(p.length!=4)return null;let n=0;for(const x of p){if(!/^\d+$/.test(x)||+x>255)return null;n=n*256+ +x}return n};
const n2ip=n=>[24,16,8,0].map(b=>(n>>>b)&255).join('.');
const nm=x=>{if(/^\/?\d{1,2}$/.test(x)){const c=+x.replace('/','');if(c>32)return null;return n2ip(c?(0xFFFFFFFF<<(32-c))>>>0:0)}return ip2n(x)!=null?x:null};
const same=(a,b,m)=>{a=ip2n(a);b=ip2n(b);m=ip2n(m);return a!=null&&b!=null&&m!=null&&((a&m)>>>0)===((b&m)>>>0)};
const plen=m=>{const n=ip2n(m);return n==null?0:n.toString(2).replace(/0/g,'').length};
const dv=id=>S.devs.find(d=>d.id===id);
let SVW=0;const save=()=>{try{localStorage.setItem('netlab',JSON.stringify(S));SVW=0}catch(e){if(!SVW){SVW=1;try{p('⚠ Автосохранение в браузере не удалось (нет места или запрещено). Сохраните схему вручную: Файл → Экспорт, иначе при закрытии вкладки она пропадёт.')}catch(_){}}}};
const p=t=>{if(typeof pAdd==='function')pAdd(t);else out.textContent+=t+'\n';out.scrollTop=out.scrollHeight;if(typeof onOut==='function')onOut(t)};
const ch=()=>{save();draw();side()};

function addDev(t,x,y,name){const id='d'+(++S.c);S.n[t]++;
 const n=t==='pc'?1:t==='sw'?8:4;
 const ifaces=[...Array(n)].map((_,i)=>({n:t==='pc'?'eth0':t==='sw'?'fa0/'+(i+1):'gi0/'+i,ip:'',mask:''}));
 const d={id,t,name:name||T[t].p+S.n[t],x,y,ifaces,gw:'',routes:[],mac:'00:'+[...Array(5)].map(()=>Math.floor(Math.random()*256).toString(16).padStart(2,'0')).join(':')};
 S.devs.push(d);ch();return d}
function rtOpts(t){const o={ad:0,track:0,err:''};for(let i=0;i<t.length;i++){const x=t[i];if(/^track$/i.test(x)){o.track=+t[i+1];i++;if(!(Number.isInteger(o.track)&&o.track>=1&&o.track<=500))o.err='track: номер от 1 до 500'}else if(/^\d+$/.test(x)){o.ad=+x;if(!(o.ad>=1&&o.ad<=255))o.err='Административная дистанция — число от 1 до 255 (по умолчанию 1; больше 1 — «плавающий» резервный маршрут)'}else o.err='Неизвестный параметр маршрута: '+x}return o}
function devClean(d){const isIp=x=>typeof x==='string'&&/^\d+\.\d+\.\d+\.\d+$/.test(x)&&x.split('.').every(q=>+q<=255),
  isMask=x=>{if(!isIp(x))return false;const n=x.split('.').reduce((a,q)=>a*256+ +q,0),v=(~n)>>>0;return(v&(v+1))===0},
  isO=x=>x&&typeof x==='object'&&!Array.isArray(x),num=(x,a,b)=>Number.isInteger(x)&&x>=a&&x<=b,str=x=>typeof x==='string'&&x.length<200;
 d.routes=d.routes.filter(r=>isO(r)&&isIp(r.net)&&isMask(r.mask)&&typeof r.nh==='string');
 d.routes.forEach(r=>{if('ad' in r&&!num(r.ad,1,255))delete r.ad;if('track' in r&&!num(r.track,1,1000))delete r.track});
 const OBJ=(k,fn)=>{if(!(k in d))return;if(!isO(d[k])){delete d[k];return}for(const n of Object.keys(d[k])){const v=fn(d[k][n]);if(v===undefined)delete d[k][n];else d[k][n]=v}};
 if('redist' in d){d.redist=Array.isArray(d.redist)?d.redist.filter(r=>isO(r)&&['static','connected','ospf','rip','eigrp','default'].includes(r.from)&&['ospf','rip','eigrp'].includes(r.to)):[];
  d.redist.forEach(r=>{if('metric' in r&&!num(r.metric,1,16777214))delete r.metric;['only','pl','rm'].forEach(k=>{if(k in r&&!str(r[k]))delete r[k]})});if(!d.redist.length)delete d.redist}
 if('acl' in d){d.acl=Array.isArray(d.acl)?d.acl.filter(r=>isO(r)&&(r.a==='permit'||r.a==='deny')&&isIp(r.sn)&&isMask(r.sm)&&isIp(r.dn)&&isMask(r.dm)).slice(0,200):[];d.acl.forEach(r=>{if(!(r.pr===''||r.pr==='tcp'||r.pr==='udp'))r.pr='';if(!num(r.pt,0,65535))r.pt=0;if(!str(r.txt))delete r.txt});if(!d.acl.length)delete d.acl}
 if('acl6' in d){d.acl6=Array.isArray(d.acl6)?d.acl6.filter(r=>isO(r)&&(r.a==='permit'||r.a==='deny')&&str(r.sn)&&str(r.dn)&&num(r.sl,0,128)&&num(r.dl,0,128)).slice(0,200):[];if(!d.acl6.length)delete d.acl6}
 OBJ('pl',L=>Array.isArray(L)?L.filter(e=>isO(e)&&(e.act==='permit'||e.act==='deny')&&isIp(e.net)&&num(e.len,0,32)&&(!('ge' in e)||num(e.ge,0,32))&&(!('le' in e)||num(e.le,0,32))).slice(0,50):undefined);
 OBJ('rmap',L=>Array.isArray(L)?L.filter(e=>isO(e)&&num(e.seq,1,65535)&&(e.act==='permit'||e.act==='deny')&&(e.match==null||str(e.match))&&(!('metric' in e)||num(e.metric,0,16777214))).slice(0,50):undefined);
 if('pbr' in d){d.pbr=Array.isArray(d.pbr)?d.pbr.filter(r=>isO(r)&&isIp(r.sn)&&isMask(r.sm)&&isIp(r.nh)&&(('dn' in r)?isIp(r.dn)&&isMask(r.dm):true)).slice(0,20):[];if(!d.pbr.length)delete d.pbr}
 OBJ('sla',x=>isO(x)&&isIp(x.dst)?x:undefined);
 if('track' in d&&!isO(d.track))delete d.track;
 if('span' in d&&!isO(d.span))delete d.span;
 if('vm' in d&&!(isO(d.vm)&&typeof d.vm.m==='string'))delete d.vm;
 d.ifaces.forEach(f=>{if('bfd' in f){const b=f.bfd;if(!(isO(b)&&num(b.tx,50,999)&&num(b.rx,50,999)&&num(b.m,3,50)))delete f.bfd;else{b.ospf=!!b.ospf;b.static=!!b.static}}});
 if('mand' in d){const m=d.mand;if(!isO(m))delete d.mand;else{m.on=!!m.on;if(m.wr!=='blp'&&m.wr!=='equal')m.wr='blp';if(!isO(m.users))m.users={};for(const n of Object.keys(m.users)){const U=m.users[n];if(!(isO(U)&&num(U.l,0,3)&&num(U.i,0,63)&&num(U.c,0,65535)))delete m.users[n]}m.log=Array.isArray(m.log)?m.log.filter(str).slice(-50):[]}}
 if('vend' in d&&!['cisco','huawei','eltex'].includes(d.vend)){delete d.vend;delete d.vm}
 if('elx' in d){const e=d.elx;if(!isO(e)){delete d.elx}else{const K=['host','ip','noip','sd','route','noroute'];e.c=Array.isArray(e.c)?e.c.filter(o=>isO(o)&&K.includes(o.k)&&(o.k==='host'?/^[A-Za-z][A-Za-z0-9_-]{0,31}$/.test(o.v):o.k==='route'||o.k==='noroute'?isIp(o.net)&&isMask(o.mask)&&(o.k==='noroute'||isIp(o.nh)):num(o.i,0,d.ifaces.length-1)&&(o.k==='ip'?isIp(o.ip)&&isMask(o.mask):true))).slice(0,200):[];
   if(e.pend!=null){try{const q=JSON.parse(e.pend);if(!isO(q)||!Array.isArray(q.i)||!Array.isArray(q.r)||typeof q.n!=='string')throw 0}catch(_){e.pend=null}}else e.pend=null;e.conf=!!e.conf}}}
function schemeFix(j){if(!j||typeof j!=='object'||Array.isArray(j)||!Array.isArray(j.devs))return null;
 const ids=new Set();
 for(const d of j.devs){if(!d||typeof d!=='object'||typeof d.id!=='string'||!T[d.t]||!Array.isArray(d.ifaces)||ids.has(d.id))return null;
  d.ifaces=Array.from(d.ifaces);  if(!d.ifaces.every(f=>f&&typeof f==='object'))return null;ids.add(d.id);d.ifaces.forEach((f,i)=>{if(typeof f.n!=='string')f.n='p'+i;if(typeof f.ip!=='string')f.ip='';if(typeof f.mask!=='string')f.mask=''});
  d.name=String(d.name==null?d.id:d.name);d.x=Number.isFinite(+d.x)?+d.x:0;d.y=Number.isFinite(+d.y)?+d.y:0;
  if(!Array.isArray(d.routes))d.routes=[];devClean(d);if(typeof d.gw!=='string')d.gw='';if(!/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(d.mac))d.mac='02:00:00:00:'+(j.devs.indexOf(d)>>8&255).toString(16).padStart(2,'0')+':'+(j.devs.indexOf(d)&255).toString(16).padStart(2,'0')}
 if(!Array.isArray(j.links))j.links=[];
 j.links=j.links.filter(l=>{if(!l||typeof l!=='object')return false;const A=j.devs.find(d=>d.id===l.a),B=j.devs.find(d=>d.id===l.b);
  return A&&B&&A!==B&&A.ifaces[l.ai]&&B.ifaces[l.bi]});
 j.links.forEach(l=>{if('ct' in l&&!(typeof CABLE!=='undefined'&&typeof l.ct==='string'&&Object.prototype.hasOwnProperty.call(CABLE,l.ct)))delete l.ct;if('len' in l&&!(Number.isFinite(+l.len)&&+l.len>=0&&+l.len<=1e5))l.len=10});
 if(!Number.isFinite(+j.c))j.c=j.devs.length;if(!j.n||typeof j.n!=='object')j.n={};
 for(const k in T)if(!Number.isFinite(+j.n[k]))j.n[k]=0;return j}
function schemeSet(j){const o=S;try{const v=schemeFix(j);if(!v)return false;S=v;sel=null;ch();draw();side();return true}catch(e){S=o;try{ch();draw();side()}catch(_){}return false}}
function link(a,ai,b,bi){S.links.push({a:a.id,ai,b:b.id,bi})}
function connect(a,b){if(a===b)return;const A=dv(a),B=dv(b);
 const ia=A.ifaces.findIndex((_,i)=>!peer(A,i)),ib=B.ifaces.findIndex((_,i)=>!peer(B,i));
 if(ia<0||ib<0){p('Нет свободных портов на '+(ia<0?A.name:B.name));return}
 link(A,ia,B,ib);p(`Кабель: ${A.name} ${A.ifaces[ia].n} ⇄ ${B.name} ${B.ifaces[ib].n}`);ch()}
function rm(id){S.devs=S.devs.filter(d=>d.id!==id);S.links=S.links.filter(l=>l.a!==id&&l.b!==id);if(sel===id)sel=null;ch()}

function peer(d,i){for(const l of S.links){if(l.bad)continue;if(l.a===d.id&&l.ai===i)return{d:dv(l.b),i:l.bi};if(l.b===d.id&&l.bi===i)return{d:dv(l.a),i:l.ai}}return null}
// L2: ищем в широковещательном домене (через коммутаторы) интерфейс с IP == nh
function l2find(d,out,nh){const st=[],seen=new Set();const q0=peer(d,out);if(q0)st.push(q0);
 while(st.length){const{d:x,i}=st.pop(),k=x.id+':'+i;if(seen.has(k))continue;seen.add(k);
  if(x.t==='sw'){x.ifaces.forEach((_,j)=>{if(j!==i){const q=peer(x,j);if(q)st.push(q)}})}
  else if(x.ifaces[i].ip===nh)return{d:x,i}}
 return null}
// L3: доставка пакета (маршрутизация по connected / static / default gw)
function deliver(d,dst,ttl,tr,first){
 if(d.ifaces.some(f=>f.ip===dst))return{ok:1,d};
 if(!first&&d.t==='pc')return{ok:0,m:`${d.name}: пакет отброшен (ПК не маршрутизирует)`};
 if(ttl<=0)return{ok:0,m:`Превышено время жизни пакета (TTL) на ${d.name}`};
 let out=-1,nh=null;
 d.ifaces.forEach((f,i)=>{if(out<0&&f.ip&&f.mask&&same(f.ip,dst,f.mask)&&peer(d,i)){out=i;nh=dst}});
 if(out<0){const rs=d.t==='pc'?(d.gw?[{net:'0.0.0.0',mask:'0.0.0.0',nh:d.gw}]:[]):d.routes;let best=-1;
  for(const r of rs){if(!same(dst,r.net,r.mask))continue;const l=plen(r.mask);if(l<=best)continue;
   const i=d.ifaces.findIndex((f,k)=>f.ip&&f.mask&&same(f.ip,r.nh,f.mask)&&peer(d,k));
   if(i>=0){best=l;out=i;nh=r.nh}}}
 if(out<0)return{ok:0,m:`${d.name}: заданный узел недоступен (нет маршрута до ${dst})`};
 const t=l2find(d,out,nh);
 if(!t)return{ok:0,m:`${d.name}: узел ${nh} не отвечает на ARP`};
 tr.push(t.d);return deliver(t.d,dst,ttl-1,tr,0)}
function flash(ds){fl=new Set(ds.map(x=>x.id));draw();setTimeout(()=>{fl.clear();draw()},1100)}
function srcIp(d){return(d.ifaces.find(f=>f.ip)||{}).ip}
function ping(d,dst){if(ip2n(dst)==null)return p('Неверный IP-адрес');const sip=srcIp(d);if(!sip)return p('У устройства не задан IP-адрес');
 p(`Обмен пакетами с ${dst}:`);let ok=0,path=[d];
 for(let k=0;k<4;k++){const tr=[],a=deliver(d,dst,64,tr,1);
  if(!a.ok){p(a.m);continue}
  const r=deliver(a.d,sip,64,[],1);path=[d,...tr];
  if(r.ok){ok++;p(`Ответ от ${dst}: время<${1+tr.length*2}мс TTL=${64-tr.length}`)}else p(`Ответ не вернулся: ${r.m}`)}
 p(`Отправлено 4, получено ${ok}, потеряно ${4-ok}`);if(ok)flash(path)}
function tracert(d,dst){if(ip2n(dst)==null)return p('Неверный IP-адрес');if(!srcIp(d))return p('У устройства не задан IP-адрес');
 const tr=[],a=deliver(d,dst,64,tr,1);p(`Трассировка маршрута до ${dst}:`);
 tr.forEach((x,i)=>p(`${String(i+1).padStart(3)}  ${x.name}${x.ifaces.some(f=>f.ip===dst)?' ('+dst+')':''}`));
 p(a.ok?'Трассировка завершена.':a.m);flash([d,...tr])}

const HELP=`Команды (для выбранного ПК или маршрутизатора):
  ipconfig                          — настройки интерфейсов
  ip [интерфейс] <ip> <маска|/N>    — задать IP (ip eth0 192.168.1.10 /24; ip none — сбросить)
  gateway <ip>                      — шлюз по умолчанию (ПК)
  route                             — таблица маршрутов (маршрутизатор)
  route add <сеть> <маска|/N> <шлюз>, route del <сеть>
  hostname <имя>
  ping <ip>, tracert <ip>
  clear, help
Схема: «+ ПК/Коммутатор/Маршрутизатор» → клик по полю; «Кабель» → клик по двум устройствам.`;
function run(c){const d=sel&&dv(sel),a=c.trim().split(/\s+/),cm=a[0].toLowerCase();if(!c.trim())return;
 if(cm==='clear'){out.textContent='';return}if(cm==='help')return p(HELP);
 if(!d)return p('Выберите устройство на схеме');
 if(d.t==='sw')return p(`Коммутатор неуправляемый: подключайте устройства кабелями (занято портов: ${d.ifaces.filter((_,i)=>peer(d,i)).length}/${d.ifaces.length})`);
 if(cm==='ipconfig'){d.ifaces.forEach((f,i)=>p(`${f.n} [${peer(d,i)?'link up':'нет кабеля'}]  IP ${f.ip||'—'}  маска ${f.mask||'—'}`));if(d.t==='pc')p('Шлюз: '+(d.gw||'—'));return p('MAC: '+d.mac)}
 if(cm==='ip'){let r=a.slice(1),f=d.ifaces.find(x=>x.n.toLowerCase()===(r[0]||'').toLowerCase());
  if(f)r.shift();else if(d.t==='rt')return p('Укажите интерфейс: ip gi0/0 10.0.0.1 255.255.255.0');else f=d.ifaces[0];
  if(r[0]==='none'){f.ip=f.mask=''}else{const m=nm(r[1]||'');if(ip2n(r[0]||'')==null||!m)return p('Использование: ip [интерфейс] <ip> <маска|/N>');f.ip=r[0];f.mask=m}
  ch();return p('OK')}
 if(cm==='gateway'){if(d.t!=='pc')return p('Шлюз задаётся на ПК; на маршрутизаторе — route add');
  if(a[1]==='none'){d.gw=''}else if(ip2n(a[1]||'')==null)return p('Использование: gateway <ip>');else d.gw=a[1];ch();return p('OK')}
 if(cm==='route'){if(d.t!=='rt')return p('route доступен на маршрутизаторе');
  if(a[1]==='add'){const m=nm(a[3]||'');if(ip2n(a[2]||'')==null||!m||ip2n(a[4]||'')==null)return p('Использование: route add <сеть> <маска|/N> <шлюз> [дистанция 1–255] [track N]');const o=rtOpts(a.slice(5));if(o.err)return p(o.err);d.routes.push({net:a[2],mask:m,nh:a[4],...(o.ad>1?{ad:o.ad}:{}),...(o.track?{track:o.track}:{})});ch();return p('OK')}
  if(a[1]==='del'){const n=d.routes.length;d.routes=d.routes.filter(r=>r.net!==a[2]);ch();return p(n>d.routes.length?'OK':'Маршрут не найден')}
  d.ifaces.forEach(f=>f.ip&&p(`C  ${n2ip((ip2n(f.ip)&ip2n(f.mask))>>>0)}/${plen(f.mask)}  напрямую, ${f.n}`));
  d.routes.forEach(r=>p(`S  ${r.net}/${plen(r.mask)}  через ${r.nh}${r.ad?`  [AD ${r.ad}]`:''}${r.track?`  [track ${r.track}: ${typeof trackUp==='function'&&!trackUp(d,r.track)?'DOWN — маршрут не используется':'up'}]`:''}`));return}
 if(cm==='hostname'){if(!a[1])return p(d.name);d.name=a[1];return ch()}
 if(cm==='ping')return ping(d,a[1]||'');if(cm==='tracert')return tracert(d,a[1]||'');
 p('Неизвестная команда. help — список команд.')}

function draw(){let h='';
 S.links.forEach((l,k)=>{const a=dv(l.a),b=dv(l.b);if(!a||!b)return;
  const at=t=>[a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t];const[x1,y1]=at(.2),[x2,y2]=at(.8);
  h+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="var(--ok)" stroke-width="2"/><line data-l="${k}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="transparent" stroke-width="14"/>`+
  `<text x="${x1}" y="${y1-4}" font-size="10" fill="var(--mt)" text-anchor="middle">${a.ifaces[l.ai].n}</text><text x="${x2}" y="${y2-4}" font-size="10" fill="var(--mt)" text-anchor="middle">${b.ifaces[l.bi].n}</text>`});
 S.devs.forEach(d=>{const f=fl.has(d.id),s=sel===d.id||linkFrom===d.id,ip=(d.ifaces.find(x=>x.ip)||{}).ip;
  h+=`<g data-id="${d.id}" style="cursor:pointer"><rect x="${d.x-28}" y="${d.y-22}" width="56" height="44" rx="8" fill="${f?'var(--ok)':'var(--pn)'}" stroke="${s?'var(--ac)':'var(--bd)'}" stroke-width="${s?3:1.5}"/>`+
  `<text x="${d.x}" y="${d.y+8}" text-anchor="middle" font-size="24">${T[d.t].i}</text><text x="${d.x}" y="${d.y+38}" text-anchor="middle" font-size="12" fill="var(--tx)">${esc(d.name)}</text>`+
  (ip?`<text x="${d.x}" y="${d.y+51}" text-anchor="middle" font-size="10" fill="var(--mt)">${ip}</text>`:'')+`</g>`});
 cv.innerHTML=h}

function side(){const d=sel&&dv(sel),el=$('#side');$('#ps').textContent=d?d.name+'> ':'> ';
 if(!d){el.innerHTML='<p class="mt">Выберите устройство, чтобы настроить его. Добавляйте устройства кнопками сверху, соединяйте инструментом «Кабель». Консоль внизу — как у настоящего узла: введите <b>help</b>.</p>';return}
 let h=`<h3>${T[d.t].l}</h3><label>Имя<input data-k="name" value="${esc(d.name)}"></label><div class="mt">MAC ${d.mac}</div>`;
 if(d.t==='sw')h+='<h4>Порты</h4>'+d.ifaces.map((f,i)=>{const q=peer(d,i);return`<div class="rt"><span>${f.n}</span><span>${q?'→ '+esc(q.d.name)+' '+q.d.ifaces[q.i].n:'свободен'}</span></div>`}).join('');
 else h+=d.ifaces.map((f,i)=>`<fieldset><legend>${f.n} ${peer(d,i)?'● link up':'○ нет кабеля'}</legend><input data-k="ip" data-i="${i}" placeholder="IP-адрес" value="${f.ip}"><input data-k="mask" data-i="${i}" placeholder="Маска (255.255.255.0 или /24)" value="${f.mask}"></fieldset>`).join('');
 if(d.t==='pc')h+=`<label>Шлюз по умолчанию<input data-k="gw" value="${d.gw}"></label>`;
 if(d.t==='rt')h+='<h4>Статические маршруты</h4>'+d.routes.map((r,i)=>`<div class="rt"><span>${r.net}/${plen(r.mask)} → ${r.nh}</span><button class="xb" data-del="${i}">✕</button></div>`).join('')+`<div class="rr"><input id="rn" placeholder="Сеть"><input id="rm" placeholder="/24"><input id="rh" placeholder="Шлюз"><button id="ra">+</button></div>`;
 h+='<button class="dng" id="dd">Удалить устройство</button>';el.innerHTML=h}

$('#side').addEventListener('change',e=>{const t=e.target,d=dv(sel),k=t.dataset.k;if(!d||!k)return;const v=t.value.trim();
 if(k==='name'){d.name=v||d.name}
 else if(k==='gw'){if(v&&ip2n(v)==null)return p('Неверный шлюз');d.gw=v}
 else{const f=d.ifaces[+t.dataset.i];if(k==='ip'){if(v&&ip2n(v)==null)return p('Неверный IP-адрес');f.ip=v}else{const m=v?nm(v):'';if(v&&!m)return p('Неверная маска');f.mask=m||''}}
 ch()});
$('#side').addEventListener('click',e=>{const d=dv(sel),t=e.target;if(!d)return;
 if(t.id==='dd')rm(d.id);
 else if(t.dataset.del!==undefined){d.routes.splice(+t.dataset.del,1);ch()}
 else if(t.id==='ra'){const n=$('#rn').value.trim(),m=nm($('#rm').value.trim()),h=$('#rh').value.trim();if(ip2n(n)==null||!m||ip2n(h)==null)return p('Маршрут: сеть, маска (/24) и шлюз — корректные значения');d.routes.push({net:n,mask:m,nh:h});ch()}});

cv.addEventListener('pointerdown',e=>{const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,g=e.target.closest('[data-id]'),ln=e.target.closest('[data-l]');
 if(tool.startsWith('add:')&&!g){const d=addDev(tool.slice(4),x,y);sel=d.id;side();draw();return}
 if(tool==='del'){if(g)rm(g.dataset.id);else if(ln){S.links.splice(+ln.dataset.l,1);ch()}return}
 if(tool==='cab'){if(!g)return;if(!linkFrom)linkFrom=g.dataset.id;else{connect(linkFrom,g.dataset.id);linkFrom=null}draw();return}
 if(g){const d=dv(g.dataset.id);sel=d.id;drag={d,dx:x-d.x,dy:y-d.y};cv.setPointerCapture(e.pointerId)}else sel=null;side();draw()});
cv.addEventListener('pointermove',e=>{if(!drag)return;const r=cv.getBoundingClientRect();drag.d.x=Math.max(30,e.clientX-r.left-drag.dx);drag.d.y=Math.max(30,e.clientY-r.top-drag.dy);draw()});
cv.addEventListener('pointerup',()=>{if(drag){drag=null;save()}});

document.querySelectorAll('header [data-t]').forEach(b=>b.onclick=()=>{tool=b.dataset.t;linkFrom=null;document.querySelectorAll('header [data-t]').forEach(x=>x.classList.toggle('on',x===b));draw()});
$('#bc').onclick=()=>{S={devs:[],links:[],c:0,n:{pc:0,sw:0,rt:0}};sel=null;ch()};
$('#bs').onclick=()=>{S={devs:[],links:[],c:0,n:{pc:0,sw:0,rt:0}};sel=null;sample();ch();p('Загружен пример: две сети, соединённые двумя маршрутизаторами. Выберите PC1 и выполните: ping 192.168.2.10')};
$('#in').addEventListener('keydown',e=>{const i=e.target;
 if(e.key==='Enter'){const c=i.value;i.value='';pEcho(`${sel&&dv(sel)?dv(sel).name:''}> ${c}`);if(c.trim()){hist.push(c);hi=hist.length}run(c)}
 else if(e.key==='ArrowUp'&&hi>0){i.value=hist[--hi]||'';e.preventDefault()}
 else if(e.key==='ArrowDown'){i.value=hist[++hi]||'';if(hi>hist.length)hi=hist.length;e.preventDefault()}});

function sample(){const m=(t,x,y,n,cf)=>{const d=addDev(t,x,y,n);Object.assign(d,cf||{});return d};
 const set=(d,i,ip,mk)=>{d.ifaces[i].ip=ip;d.ifaces[i].mask=mk};
 const p1=m('pc',90,90,'PC1',{gw:'192.168.1.1'}),p2=m('pc',90,260,'PC2',{gw:'192.168.1.1'}),s1=m('sw',230,175,'SW1'),
  r1=m('rt',390,175,'R1'),r2=m('rt',590,175,'R2'),s2=m('sw',750,175,'SW2'),p3=m('pc',880,90,'PC3',{gw:'192.168.2.1'}),p4=m('pc',880,260,'PC4',{gw:'192.168.2.1'});
 set(p1,0,'192.168.1.10','255.255.255.0');set(p2,0,'192.168.1.11','255.255.255.0');set(p3,0,'192.168.2.10','255.255.255.0');set(p4,0,'192.168.2.11','255.255.255.0');
 set(r1,0,'192.168.1.1','255.255.255.0');set(r1,1,'10.0.0.1','255.255.255.252');set(r2,0,'10.0.0.2','255.255.255.252');set(r2,1,'192.168.2.1','255.255.255.0');
 r1.routes=[{net:'192.168.2.0',mask:'255.255.255.0',nh:'10.0.0.2'}];r2.routes=[{net:'192.168.1.0',mask:'255.255.255.0',nh:'10.0.0.1'}];
 link(p1,0,s1,0);link(p2,0,s1,1);link(s1,2,r1,0);link(r1,1,r2,0);link(r2,1,s2,0);link(s2,1,p3,0);link(s2,2,p4,0)}

try{const j=localStorage.getItem('netlab');if(j){const v=schemeFix(JSON.parse(j));if(v)S=v}}catch(e){}
if(!S.devs||!S.devs.length){S={devs:[],links:[],c:0,n:{pc:0,sw:0,rt:0}};sample();save()}
draw();side();p('Стектония — сетевой симулятор. Введите help.');
