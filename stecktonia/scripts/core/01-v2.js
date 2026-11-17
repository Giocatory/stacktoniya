/* ===== v2: VLAN/trunk, DHCP, DNS, NAT, ACL, RIP, анимация пакета, задания, экспорт ===== */
document.head.insertAdjacentHTML('beforeend','<style>#term{height:250px}#md{position:fixed;inset:0;background:#000a;display:flex;align-items:center;justify-content:center;z-index:9;padding:16px}#md[hidden]{display:none}#mb{background:var(--pn);color:var(--tx);border-radius:10px;max-width:760px;width:100%;max-height:88%;overflow:auto;padding:16px}#mb h3{margin:0 0 8px}.tk{border:1px solid var(--bd);border-radius:8px;padding:10px;margin:8px 0}.tk p{margin:4px 0;color:var(--mt)}#mb button,#side .b{font:inherit;border:1px solid var(--bd);background:var(--bg);color:var(--tx);border-radius:6px;padding:5px 10px;cursor:pointer}#mb textarea{width:100%;height:260px;font:12px ui-monospace,monospace;background:var(--bg);color:var(--tx);border:1px solid var(--bd)}.ok{color:var(--ok)}.er{color:var(--er)}</style>');
document.body.insertAdjacentHTML('beforeend','<div id="md" hidden><div id="mb"></div></div>');
$('#bs').insertAdjacentHTML('beforebegin','<button id="bt">Задания</button><button id="bx">Экспорт / импорт</button>');
let EX=[],REP=0,NAT=null,RIPT={},pk=null,busy=0;
const ex=(p,x,o)=>EX.push({p,x,rep:REP,...o}),wait=ms=>new Promise(r=>setTimeout(r,ms));
const net=x=>{if(x==='any')return{n:'0.0.0.0',m:'0.0.0.0'};const[a,b]=x.split('/'),m=nm(b||'32');return ip2n(a)!=null&&m?{n:a,m}:null};
const priv=a=>['10.0.0.0/8','172.16.0.0/12','192.168.0.0/16'].some(c=>{const[n,l]=c.split('/');return same(a,n,nm('/'+l))});
let CTX={p:'icmp',n:0},ZWHY='';
const zoneOf=(d,ip)=>{const f=d.ifaces.find(f=>f.ip&&f.mask&&same(f.ip,ip,f.mask));if(f)return f.zone||'inside';
 let best=-1,z='outside';for(const r of [...(d.routes||[]),...(RIPT[d.id]||[])]){if(!same(ip,r.net,r.mask))continue;const l=plen(r.mask);if(l<=best)continue;const g=d.ifaces.find(g=>g.ip&&g.mask&&same(g.ip,r.nh,g.mask));if(g){best=l;z=g.zone||'inside'}}return z};
const inACL=(d,s,t)=>{ZWHY='';
 if(!REP&&d.ifaces.some(f=>f.zone)){const a=zoneOf(d,s),b=zoneOf(d,t);if(a!==b&&!(a==='inside'||(a==='dmz'&&b==='outside')||(a==='outside'&&b==='dmz'&&(d.pub||[]).includes(CTX.p+'/'+CTX.n))||(d.zp||[]).some(z=>z.f===a&&z.t===b&&z.k===CTX.p+'/'+(CTX.p==='icmp'?0:CTX.n)))){ZWHY=`зоны: ${a} → ${b} запрещено`+(a==='outside'&&b==='dmz'?`; опубликовано: ${(d.pub||[]).join(', ')||'ничего'}`:'');return'deny'}}
 for(const r of d.acl||[])if(same(s,r.sn,r.sm)&&same(t,r.dn,r.dm)&&(!r.pr||r.pr===CTX.p)&&(!r.pt||r.pt===CTX.n))return r.a;return'permit'};

// L2 с учётом VLAN: access-порт = один VLAN, trunk несёт все
function l2all(d,out){const res=[],seen=new Set(),q=peer(d,out);if(!q)return res;const st=[{...q,v:null,path:[d.id]}];
 while(st.length){const{d:x,i,v,path}=st.pop(),k=x.id+':'+i+':'+v;if(seen.has(k))continue;seen.add(k);const np=[...path,x.id];
  if(x.t==='sw'){const f=x.ifaces[i],vv=f.tr?(v||1):(f.v||1);
   x.ifaces.forEach((g,j)=>{if(j===i||!(g.tr||(g.v||1)===vv))return;const n=peer(x,j);if(n)st.push({...n,v:g.tr?vv:null,path:np})})}
  else res.push({d:x,i,path:np})}
 return res}
l2find=(d,o,n)=>l2all(d,o).find(e=>e.d.ifaces[e.i].ip===n);

// RIP (упрощённо): маршрутизаторы обмениваются сетями с соседями, метрика = число переходов
function computeRip(){RIPT={};const rs=S.devs.filter(d=>d.t==='rt'&&d.rip);rs.forEach(r=>RIPT[r.id]=[]);
 const have=r=>[...r.ifaces.filter(f=>f.ip&&f.mask).map(f=>({net:n2ip((ip2n(f.ip)&ip2n(f.mask))>>>0),mask:f.mask,m:0})),...RIPT[r.id]];
 for(let it=0;it<16;it++)rs.forEach(a=>a.ifaces.forEach((f,i)=>{if(!f.ip)return;
  l2all(a,i).forEach(e=>{const b=e.d,nh=b.ifaces[e.i].ip;if(b.t!=='rt'||!b.rip||!nh)return;
   have(b).forEach(x=>{if(x.m>=15||have(a).some(y=>y.net===x.net&&y.mask===x.mask&&y.m<=x.m+1))return;
    RIPT[a.id]=RIPT[a.id].filter(y=>!(y.net===x.net&&y.mask===x.mask));RIPT[a.id].push({net:x.net,mask:x.mask,nh,m:x.m+1})})})}))}

// Доставка пакета с пошаговыми объяснениями (EX)
deliver=function(d,dst,ttl,tr,first,src){
 const fail=(m,fx)=>{ex([d.id],m,{err:1,fix:fx});return{ok:0,m}};
 if(d.ifaces.some(f=>f.ip===dst)){ex([d.id],`${d.name}: адрес ${dst} принадлежит мне — пакет доставлен получателю`);return{ok:1,d}}
 if(!first&&d.t==='pc'&&!d.fwd)return fail(`${d.name}: получил пакет не для себя (${dst}) — ПК чужой трафик не маршрутизирует${d.rogue?' (это узел злоумышленника: подмена шлюза DHCP или ARP-spoofing — трафик перехвачен)':''}`,d.rogue?'Защита: DHCP snooping, Dynamic ARP Inspection, port security на портах доступа.':'Проверьте шлюз и маршруты на предыдущем узле: пакет отправлен не тому устройству.');
 if(!first&&d.t==='pc'&&d.fwd)ex([d.id],`⚠ ${d.name}: узел злоумышленника пересылает чужой трафик дальше — атака «человек посередине» (MITM): жертва ничего не замечает`,{});
 if(ttl<=0)return fail(`${d.name}: TTL исчерпан — пакет ходит по кругу`,'Это петля маршрутов: два маршрутизатора возвращают пакет друг другу. Проверьте route и RIP.');
 let out=-1,nh=null,why='';
 d.ifaces.forEach((f,i)=>{if(out<0&&f.ip&&f.mask&&same(f.ip,dst,f.mask)&&peer(d,i)){out=i;nh=dst;why=`${dst} лежит в подсети интерфейса ${f.n} (connected) — шлюз не нужен, отправляю напрямую`}});
 if(out<0){const rs=d.t==='pc'?(d.gw?[{net:'0.0.0.0',mask:'0.0.0.0',nh:d.gw,k:'шлюз по умолчанию'}]:[]):[...(d.routes||[]).map(r=>({...r,k:'статический маршрут'})),...(RIPT[d.id]||[]).map(r=>({...r,k:(r.b?'BGP (AS-путь '+((r.path||[]).join(' ')||'—')+', длина ':r.e?(r.x?'EIGRP внешний (метрика ':'EIGRP (метрика '):r.o?(r.x?'OSPF внешний E2 (метрика ':'OSPF (стоимость '):'RIP (метрика ')+r.m+')'}))];let best=-1,bAd=999,bM=0;
  for(const r of rs){if(!same(dst,r.net,r.mask))continue;if(r.track&&typeof trackUp==='function'&&!trackUp(d,r.track))continue;const l=plen(r.mask),ad=r.ad||(r.k==='статический маршрут'||r.k==='шлюз по умолчанию'?1:r.b?20:r.e?(r.x?170:90):r.o?110:120),mt=r.m||0;if(l<best||(l===best&&(ad>bAd||(ad===bAd&&mt>=bM))))continue;const i=d.ifaces.findIndex((f,k)=>f.ip&&f.mask&&same(f.ip,r.nh,f.mask)&&peer(d,k));
   if(i>=0){best=l;bAd=ad;bM=mt;out=i;nh=r.nh;why=`${dst} вне моих подсетей → ${r.k} ${r.net}/${plen(r.mask)} через ${r.nh}${best>=0&&r.ad&&r.ad>1?` (плавающий маршрут, дистанция ${r.ad})`:''}`}}}
 if(out<0)return fail(`${d.name}: нет маршрута до ${dst}`,d.t==='pc'?(d.gw?`Шлюз ${d.gw} не из подсети ПК или нет кабеля — проверьте маску, адрес шлюза и кабель.`:'Адрес не из вашей подсети, а шлюз по умолчанию не задан: gateway <ip>.'):`Добавьте route add для сети получателя или включите rip on на соседних маршрутизаторах.`);
 let s=src;const of=d.ifaces[out];
 if(!first&&d.t==='rt'){if(inACL(d,src,dst)==='deny')return fail(`${d.name}: ${ZWHY?'межсетевой экран':'ACL'} запретил трафик ${src} → ${dst}${ZWHY?' ('+ZWHY+')':''}, пакет отброшен`,ZWHY?'Политика зон: inside → всё; dmz → outside; outside → dmz только опубликованные службы (команда publish tcp 80); остальное запрещено. Проверьте зоны интерфейсов (zone) и публикации.':'Это правило безопасности. Список: acl, очистка: acl clear.');
  if(of.nat&&priv(src)){s=of.ip;NAT={r:d,pub:s};ex([d.id],`${d.name}: NAT — меняю частный адрес источника ${src} на ${s}, чтобы внешняя сеть могла ответить`)}}
 const t=l2find(d,out,nh);
 if(!t)return fail(`${d.name}: ARP-запрос «у кого ${nh}?» остался без ответа — отправить кадр некому`,'Проверьте: кабель, один ли VLAN у портов коммутатора, верны ли IP/маска у соседа и адрес шлюза.');
 const sw=t.path.slice(1,-1).map(id=>dv(id).name);
 ex(t.path,t.tun?`${d.name}: ${why}. Следующий узел — конец туннеля ${t.d.name}: пакет инкапсулируется в ${t.tun} и передаётся через промежуточные узлы (${sw.join(', ')||'напрямую'}), промежуточные маршрутизаторы видят только внешний заголовок.`:`${d.name}: ${why}. ${t.d.name} ответил на ARP своим MAC ${t.d.mac}.`+(sw.length?` Кадр прошёл через ${sw.join(', ')} (коммутатор пересылает по MAC-таблице внутри VLAN).`:' Узлы соединены напрямую.'));
 tr.push(t.d);return deliver(t.d,dst,ttl-1,tr,0,s)};

function trip(d,dst){if(typeof isV6==='function'&&isV6(dst))return trip6(d,dst);computeRip();EX=[];REP=0;NAT=null;const sip=srcIp(d),tr=[];
 if(!sip){ex([d.id],`${d.name}: у меня нет IP-адреса — отправлять нечем`,{err:1,fix:'Задайте адрес: ip <адрес> <маска> или получите по DHCP.'});return{ok:0,tr}}
 ex([d.id],`${d.name}: собираю IP-пакет ${sip} → ${dst} (ICMP echo, TTL 64). Сначала решаю: получатель в моей подсети или нужен шлюз?`);
 const a=deliver(d,dst,64,tr,1,sip);if(!a.ok)return{ok:0,tr};const nat=NAT;REP=1;
 ex([a.d.id],`${a.d.name}: формирую ответ (echo reply) для ${nat?nat.pub+' — адрес после NAT':sip}`);
 const r=deliver(a.d,nat?nat.pub:sip,64,[],1,dst);if(!r.ok)return{ok:0,tr};
 if(nat){ex([nat.r.id],`${nat.r.name}: NAT — обратная трансляция ${nat.pub} → ${sip}`);return{ok:deliver(nat.r,sip,64,[],1,nat.pub).ok,tr,a}}
 return{ok:1,tr,a}}
function resolve(d,n){if(ip2n(n)!=null||(typeof isV6==='function'&&isV6(n)&&v6(n)!==null))return n;if(!d.dns){p(`Имя «${n}» не разрешить: DNS-сервер не задан (команда dns <ip>)`);return null}
 EX=[];const a=deliver(d,d.dns,64,[],1,srcIp(d));if(!a.ok){p('DNS-сервер '+d.dns+' недоступен: '+a.m);return null}
 const ip=(a.d.hosts||{})[n.toLowerCase()];if(!ip){p(`DNS: имя «${n}» не найдено на сервере ${a.d.name}`);return null}p(`DNS: ${n} = ${ip} (ответил ${a.d.name})`);return ip}
const lastErr=()=>EX.filter(x=>x.err).pop();
ping=function(d,dst){const ip=resolve(d,dst);if(!ip)return;p(`Обмен пакетами с ${ip}:`);let ok=0,pa=[d];
 for(let k=0;k<4;k++){const r=trip(d,ip);if(r.ok){ok++;pa=[d,...r.tr];p(`Ответ от ${ip}: время<${1+r.tr.length*2}мс TTL=${64-r.tr.length}`)}else p(lastErr()?lastErr().x:'Нет ответа')}
 p(`Отправлено 4, получено ${ok}, потеряно ${4-ok}. Подробный разбор с анимацией: send ${dst}`);if(ok)flash(pa)};
tracert=function(d,dst){const ip=resolve(d,dst);if(!ip)return;const r=trip(d,ip);p(`Трассировка до ${ip}:`);r.tr.forEach((x,i)=>p(`${String(i+1).padStart(3)}  ${x.name}`));p(r.ok?'Готово.':(lastErr()?lastErr().x:'Нет ответа'))};

// Анимация пакета + пояснения
const _draw=draw;draw=function(){_draw();if(pk)cv.insertAdjacentHTML('beforeend',`<circle cx="${pk.x}" cy="${pk.y}" r="8" fill="${pk.c}" stroke="#fff" stroke-width="2"/>`)};
async function move(path,err,rep){const c=err?'var(--er)':rep?'var(--ok)':'var(--ac)',P=path.map(dv).filter(Boolean);
 for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1],t0=performance.now();
  await new Promise(r=>{const f=t=>{const k=Math.min(1,(t-t0)/380);pk={x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k,c};draw();k<1?requestAnimationFrame(f):r()};requestAnimationFrame(f)})}
 const L=P[P.length-1];if(L){pk={x:L.x,y:L.y,c};if(!err)fl=new Set([L.id]);draw();await wait(err?900:350);fl.clear()}pk=null;draw()}
async function sendData(d,dst){if(busy)return;if(!dst)return p('Укажите получателя: send <ip|имя>');const ip=resolve(d,dst);if(!ip)return;busy=1;
 const R=trip(d,ip),st=EX.slice();p(`\n▶ ${d.name} отправляет пакет на ${dst}${ip!==dst?' ('+ip+')':''}`);
 for(const s of st){await move(s.p,s.err,s.rep);p((s.err?'✖ ':s.rep?'↩ ':'• ')+s.x);if(s.fix)p('  ➜ Как исправить: '+s.fix)}
 p(R.ok?'✔ Пакет доставлен, ответ вернулся: связность подтверждена.':'✘ Пакет не дошёл — причина и способ исправления указаны выше.');busy=0}

function dhcp(d){const f=d.ifaces[0];p('DHCP Discover: ПК рассылает широковещательный запрос (0.0.0.0 → 255.255.255.255)');
 const e=l2all(d,0).find(e=>e.d.t==='rt'&&(e.d.dhcp||{})[e.d.ifaces[e.i].n]);
 if(!e)return p('✖ Ответа нет. Нужен DHCP-сервер в том же широковещательном домене (VLAN): на маршрутизаторе «dhcp <интерфейс> <первый_ip> <число>». Проверьте кабели и VLAN.');
 const r=e.d,ri=r.ifaces[e.i],pool=r.dhcp[ri.n];let ip=null;
 for(let k=0;k<pool.n;k++){const c=n2ip(ip2n(pool.first)+k);if(!S.devs.some(x=>x!==d&&x.ifaces.some(g=>g.ip===c))){ip=c;break}}
 if(!ip)return p('✖ DHCP: пул адресов исчерпан');
 f.ip=ip;f.mask=ri.mask;d.gw=ri.ip;ch();p(`DHCP Offer от ${r.name}: ${ip}\nDHCP Request → DHCP Ack: получен ${ip}, маска ${ri.mask}, шлюз ${ri.ip}`);flash([d,...e.path.map(dv)])}

const _run=run;run=function(c){const d=sel&&dv(sel),a=c.trim().split(/\s+/),cm=a[0].toLowerCase();if(!d||!c.trim())return _run(c);
 if(cm==='send')return sendData(d,a[1]||'');
 if(d.t==='sw'){if(cm==='show')return d.ifaces.forEach((f,i)=>p(`${f.n}  ${f.tr?'trunk':'access VLAN '+(f.v||1)}  ${peer(d,i)?'link up':'нет кабеля'}`));
  if(cm==='port'){const f=d.ifaces.find(x=>x.n===a[1]);if(!f||!/^(access|trunk)$/.test(a[2]||''))return p('Использование: port fa0/1 access <vlan> | port fa0/1 trunk');f.tr=a[2]==='trunk';if(!f.tr)f.v=+a[3]||1;ch();return p('OK')}return _run(c)}
 if(d.t==='pc'){if(cm==='dhcp')return dhcp(d);
  if(cm==='dns'){if(ip2n(a[1]||'')==null)return p('Использование: dns <ip сервера>');d.dns=a[1];return p('OK')}
  if(cm==='dnsrec'){if(!a[1]||ip2n(a[2]||'')==null)return p('Использование: dnsrec <имя> <ip> (этот ПК станет DNS-сервером)');(d.hosts=d.hosts||{})[a[1].toLowerCase()]=a[2];return p('Запись добавлена')}
  if(cm==='nslookup')return void resolve(d,a[1]||'')}
 if(d.t==='rt'){
  if(cm==='dhcp'){const i=d.ifaces.findIndex(x=>x.n.toLowerCase()===(a[1]||'').toLowerCase()),n=+a[3];if(i<0||!d.ifaces[i].ip||ip2n(a[2]||'')==null||!n)return p('Использование: dhcp <интерфейс с IP> <первый_ip> <количество>');(d.dhcp=d.dhcp||{})[d.ifaces[i].n]={first:a[2],n};ch();return p('DHCP-пул включён на '+d.ifaces[i].n)}
  if(cm==='rip'){d.rip=a[1]!=='off';ch();return p('RIP '+(d.rip?'включён: сети соседей будут изучены автоматически':'выключен'))}
  if(cm==='nat'){const f=d.ifaces.find(x=>x.n.toLowerCase()===(a[1]||'').toLowerCase());if(!f)return p('Использование: nat <внешний интерфейс> on|off');f.nat=a[2]!=='off';ch();return p('NAT '+(f.nat?'включён':'выключен')+' на '+f.n)}
  if(cm==='acl'){if(a[1]==='clear'){d.acl=[];ch();return p('ACL очищен')}
   if(!a[1])return p((d.acl||[]).map((r,i)=>`${i+1}. ${r.txt}`).join('\n')||'Правил нет (всё разрешено)');
   const s=net(a[2]||''),t=net(a[3]||'');if(!/^(permit|deny)$/.test(a[1])||!s||!t)return p('Использование: acl permit|deny <сеть/N|any> <сеть/N|any> [tcp|udp <порт>]   (пример: acl deny 10.0.1.0/24 10.0.2.0/24 tcp 22)');
   (d.acl=d.acl||[]).push({a:a[1],sn:s.n,sm:s.m,dn:t.n,dm:t.m,pr:/^(tcp|udp)$/.test(a[4]||'')?a[4]:'',pt:+a[5]||0,txt:`${a[1]} ${a[2]} → ${a[3]}${a[4]?' '+a[4]+(a[5]?'/'+a[5]:''):''}`});ch();return p('Правило добавлено. Проверяются по порядку, первое совпавшее срабатывает; если ничего не подошло — разрешено.')}}
 return _run(c)};
p('Новое: send <ip|имя> — пакет с анимацией и разбором; port/show (коммутатор); dhcp, dns, dnsrec, nslookup, rip, nat, acl. Кнопки «Задания» и «Экспорт / импорт» — сверху.');

const _side=side;side=function(){_side();const d=sel&&dv(sel);if(!d)return;let h='';
 if(d.t==='sw')h+='<h4>VLAN и trunk</h4><p class="mt">Access-порт принадлежит одному VLAN, trunk несёт все. Узлы из разных VLAN — разные широковещательные домены: друг к другу только через маршрутизатор.</p>'+d.ifaces.map((f,i)=>`<div class="rt"><span>${f.n}</span><span><input data-v="${i}" value="${f.v||1}" style="width:52px;display:inline" ${f.tr?'disabled':''}> <label style="display:inline"><input type="checkbox" data-tr="${i}" ${f.tr?'checked':''} style="width:auto;display:inline"> trunk</label></span></div>`).join('');
 if(d.t==='rt')h+=`<h4>Службы</h4><label><input type="checkbox" data-rip style="width:auto;display:inline" ${d.rip?'checked':''}> RIP — учить сети у соседей</label>`+d.ifaces.map((f,i)=>`<label><input type="checkbox" data-nat="${i}" style="width:auto;display:inline" ${f.nat?'checked':''}> NAT наружу на ${f.n}</label>`).join('')+`<div class="mt">ACL: ${(d.acl||[]).map(r=>r.txt).join('; ')||'нет'}<br>DHCP: ${Object.keys(d.dhcp||{}).join(', ')||'нет'}</div>`;
 if(d.t!=='sw')h+=`<h4>Отправить данные</h4><input id="sd" placeholder="IP или имя получателя"><button class="b" id="sb" style="margin-top:6px;width:100%">Отправить и показать путь</button><p class="mt">Пакет пройдёт по схеме шаг за шагом; в консоли — объяснение каждого шага или причина ошибки.</p>`;
 $('#side').insertAdjacentHTML('beforeend',h)};
$('#side').addEventListener('change',e=>{const t=e.target,d=dv(sel),D=t.dataset;if(!d)return;
 if(D.v!==undefined){d.ifaces[+D.v].v=Math.max(1,Math.min(4094,+t.value||1));ch()}else if(D.tr!==undefined){d.ifaces[+D.tr].tr=t.checked;ch()}
 else if(D.rip!==undefined){d.rip=t.checked;ch()}else if(D.nat!==undefined){d.ifaces[+D.nat].nat=t.checked;ch()}});
$('#side').addEventListener('click',e=>{if(e.target.id==='sb'&&sel)sendData(dv(sel),$('#sd').value.trim())});

const md=$('#md'),mb=$('#mb'),openMd=h=>{mb.innerHTML=h+'<p><button data-x="close">Закрыть</button></p>';md.hidden=false};
md.addEventListener('click',e=>{const t=e.target;if(t===md||t.dataset.x==='close')md.hidden=true;if(t.dataset.chk!==undefined)check(+t.dataset.chk);
 if(t.dataset.x==='imp'){try{const j=JSON.parse($('#jx').value);if(!schemeSet(j))throw 0;md.hidden=true;p('Схема загружена')}catch(_){$('#je').textContent='Не удалось прочитать JSON'}}
 if(t.dataset.x==='cp'){try{navigator.clipboard.writeText($('#jx').value)}catch(_){}$('#jx').select()}});
$('#bx').onclick=()=>openMd(`<h3>Экспорт и импорт схемы</h3><p class="mt">Скопируйте текст и сохраните в файл. Чтобы открыть сохранённую схему, вставьте текст и нажмите «Загрузить».</p><textarea id="jx">${esc(JSON.stringify(S))}</textarea><p><button data-x="cp">Копировать</button> <button data-x="imp">Загрузить схему</button> <span id="je" class="er"></span></p>`);
const TASKS=[
{t:'1. Локальная сеть: коммутатор и два ПК',d:'Назовите ПК PC1 и PC2, добавьте коммутатор, соедините кабелями. Адреса: 192.168.10.10 и .11, маска /24. Теория: узлы одной подсети общаются напрямую, коммутатор пересылает кадры по MAC-адресам, шлюз не нужен.',c:[['PC1','PC2',1]]},
{t:'2. Две сети и маршрутизатор',d:'PC1 192.168.1.10/24, PC2 192.168.2.10/24, маршрутизатор R1 с адресами 192.168.1.1 и 192.168.2.1 на двух интерфейсах; на ПК укажите шлюзы. Теория: разные подсети соединяет только маршрутизатор — он и есть шлюз.',c:[['PC1','PC2',1],['PC2','PC1',1]]},
{t:'3. Сегментация VLAN',d:'PC1 и PC2 на одном коммутаторе, адреса из одной подсети, но порты в VLAN 10 и 20 (port fa0/1 access 10). Пинг должен не проходить. Теория: VLAN разделяет широковещательные домены — так изолируют отделы.',c:[['PC1','PC2',0]]},
{t:'4. Филиалы: RIP и ACL',d:'Три сети: PC1 и PC2 за R1, PC3 за R2, R1—R2 по сети /30. Включите rip on на обоих (без статических маршрутов). Затем на R2: acl deny <сеть PC2>/24 <сеть PC3>/24 — PC2 не должен достучаться до PC3, а PC1 должен. Теория: динамическая маршрутизация и политики безопасности.',c:[['PC1','PC3',1],['PC2','PC3',0]]},
{t:'5. Сервисы: DHCP и DNS',d:'Маршрутизатор R1 раздаёт адреса (dhcp gi0/0 192.168.1.100 20), PC1 получает адрес командой dhcp. Сервер — ПК Server с dnsrec. Проверка: PC1 достучится до Server. Теория: DHCP выдаёт адреса автоматически, DNS переводит имена в IP.',c:[['PC1','Server',1]]}];
$('#bt').onclick=()=>openMd('<h3>Задания</h3><p class="mt">Стройте схему, называйте устройства как в задании, затем нажмите «Проверить». Проверка отправляет тестовые пакеты и объясняет, что не так.</p>'+TASKS.map((k,i)=>`<div class="tk"><b>${k.t}</b><p>${k.d}</p><button data-chk="${i}">Проверить</button><div id="r${i}"></div></div>`).join(''));
function check(i){const k=TASKS[i];let h='',all=1;
 k.c.forEach(([a,b,e])=>{const f=n=>S.devs.find(d=>d.name.toLowerCase()===n.toLowerCase()),A=f(a),B=f(b);if(!A||!B){all=0;h+=`<p class="er">✘ Нет устройства «${!A?a:b}» — назовите его так в панели справа</p>`;return}
  const bip=srcIp(B);EX=[];const r=bip?trip(A,bip):{ok:0},good=!!r.ok===!!e,er=lastErr();if(!good)all=0;
  h+=`<p class="${good?'ok':'er'}">${good?'✔':'✘'} ${a} → ${b}: ${r.ok?'пакет дошёл':'не дошёл'} (ожидалось: ${e?'дойдёт':'будет заблокирован'})${good?'':'<br>'+esc(e?(er?er.x+'. '+(er.fix||''):`у ${b} нет IP-адреса`):'Пакет прошёл, а должен быть остановлен: проверьте VLAN портов или правила acl.')}</p>`});
 $('#r'+i).innerHTML=h+(all?'<p class="ok"><b>Задание выполнено</b></p>':'<p class="mt">Пока не всё. Исправьте схему и проверьте снова.</p>')}
side();draw();
