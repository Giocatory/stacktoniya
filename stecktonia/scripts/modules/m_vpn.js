// ===== m_vpn: углублённый VPN: параметры IPsec (IKE), WireGuard, монитор и аудит туннелей, MTU =====
const VPN_DEF={ike:2,enc:'aes256',hash:'sha256',dh:14,life:3600};
const VPN_ENC=['aes256','aes128','3des','des'],VPN_HASH=['sha256','sha384','sha1','md5'],VPN_DH=[2,5,14,19,20];
const vpnE=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const vpnP=t=>Object.assign({},VPN_DEF,t.p||{});
const VPN_OVH={gre:24,ipsec:73,wg:60};
function wgPub(priv){let h=2166136261,o=[];const s=String(priv||'');for(let r=0;r<32;r++){for(const c of s+r){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0}o.push(h&255)}return btoa(String.fromCharCode(...o)).replace(/=+$/,'')+'='}
function wgGen(){const a=new Uint8Array(32);for(let i=0;i<32;i++)a[i]=Math.floor(Math.random()*256);return btoa(String.fromCharCode(...a))}
function vpnMis(T,G,r){if(T.mode==='wg'){if(!T.peer)return'WireGuard: не задан открытый ключ пира — выполните wg peer <Tunnel> <публичный_ключ_соседа>';if(!G.peer)return`WireGuard: на ${r?r.name:'другом конце'} не задан открытый ключ пира`;
  if(T.peer!==wgPub(G.key))return`WireGuard: открытый ключ пира не совпадает с ключом ${r?r.name:'соседа'} — рукопожатие не выполнено`;if(G.peer!==wgPub(T.key))return`WireGuard: ${r?r.name:'сосед'} ждёт другой открытый ключ — рукопожатие не выполнено`;return null}
 const a=vpnP(T),b=vpnP(G),d=[];if(a.ike!==b.ike)d.push(`версия IKE: v${a.ike} ≠ v${b.ike}`);if(a.enc!==b.enc)d.push(`шифрование: ${a.enc} ≠ ${b.enc}`);if(a.hash!==b.hash)d.push(`хеш: ${a.hash} ≠ ${b.hash}`);if(a.dh!==b.dh)d.push(`группа DH: ${a.dh} ≠ ${b.dh}`);
 return d.length?'IKE: предложения (proposal) не совпадают — '+d.join('; ')+'. SA не установлена':null}
// ---------- аудит ----------
function vpnTuns(){const o=[];S.devs.forEach(d=>d.ifaces.forEach((f,i)=>{if(f.tun)o.push({d,f,i})}));return o}
function vpnAudit(){const R=[],T=vpnTuns();const add=(ok,t,dd)=>R.push({ok,t,d:dd||''});if(!T.length)return R;
 const down=T.filter(x=>!tunStatus(x.d,x.i).up);add(!down.length,'Все туннели подняты',down.map(x=>`${x.d.name} ${x.f.n}: ${tunStatus(x.d,x.i).why}`).join('; '));
 const gre=T.filter(x=>x.f.tun.mode==='gre');add(!gre.length,'Нет туннелей GRE без шифрования (трафик виден в пути)',gre.map(x=>`${x.d.name} ${x.f.n}`).join(', '));
 const ip=T.filter(x=>x.f.tun.mode==='ipsec');
 if(ip.length){const w=ip.filter(x=>{const p=vpnP(x.f.tun);return['3des','des'].includes(p.enc)||['md5','sha1'].includes(p.hash)||p.dh<14&&p.dh!==19&&p.dh!==20});add(!w.length,'Алгоритмы IPsec стойкие (AES, SHA-256+, DH 14+)',w.map(x=>{const p=vpnP(x.f.tun);return`${x.d.name} ${x.f.n}: ${p.enc}/${p.hash}/DH${p.dh}`}).join('; '));
  const v1=ip.filter(x=>vpnP(x.f.tun).ike===1);add(!v1.length,'Используется IKEv2',v1.map(x=>`${x.d.name} ${x.f.n}: IKEv1`).join(', '));
  const pk=ip.filter(x=>(x.f.tun.key||'').length<12);add(!pk.length,'Ключ (PSK) не короче 12 символов',pk.map(x=>`${x.d.name} ${x.f.n}: «${x.f.tun.key||''}»`).join('; '))}
 const wg=T.filter(x=>x.f.tun.mode==='wg');if(wg.length){const np=wg.filter(x=>!x.f.tun.peer);add(!np.length,'У всех WireGuard-туннелей задан ключ пира',np.map(x=>`${x.d.name} ${x.f.n}`).join(', '))}
 const noip=T.filter(x=>!x.f.ip);add(!noip.length,'На туннелях заданы адреса (иначе по ним не пойдёт трафик)',noip.map(x=>`${x.d.name} ${x.f.n}`).join(', '));
 return R}
// ---------- команды ----------
function vpnShow(d,io,only){let n=0;d.ifaces.forEach((f,i)=>{if(!f.tun||(only&&f.n.toLowerCase()!==only.toLowerCase()))return;n++;const t=f.tun,s=tunStatus(d,i);io(`Интерфейс ${f.n}  ${t.mode==='wg'?'WireGuard':t.mode==='ipsec'?'IPsec':'GRE'}   ${t.local} → ${t.remote}   ${s.up?'UP':'DOWN'}`);
 if(!s.up)io('  причина: '+s.why);
 if(t.mode==='ipsec'){const p=vpnP(t);io(`  IKEv${p.ike}  шифрование ${p.enc}  хеш ${p.hash}  DH группа ${p.dh}  время жизни SA ${p.life} с  PSK ${t.key?'задан ('+t.key.length+' симв.)':'НЕ ЗАДАН'}`);io(`  SA: ${s.up?'установлена (IKE + ESP)':'не установлена'}`)}
 else if(t.mode==='wg'){io(`  открытый ключ: ${wgPub(t.key)}`);io(`  пир: ${t.peer||'— не задан —'}   порт 51820/udp`)}
 else io('  GRE: инкапсуляция без шифрования и аутентификации');
 const ov=VPN_OVH[t.mode]||24;io(`  MTU туннеля: ${1500-ov} (накладные расходы ${ov} байт); рекомендуемый TCP MSS: ${1500-ov-40}`)});if(!n)io(only?'Нет такого туннеля':'Туннелей нет')}
{const _r=run;run=function(c){const t=String(c).trim(),a=t.split(/\s+/),w=(a[0]||'').toLowerCase();const d=sel&&dv(sel);const o=s=>p(s);
 if(w==='vpncheck'||(w==='vpn'&&/^(check|audit|monitor|проверка)$/i.test(a[1]||''))){vpnOpen();return}
 if(d&&w==='show'&&/^crypto$/i.test(a[1]||'')){vpnShow(d,o,a[2]);return}
 if(d&&w==='ipsec'){if(d.t!=='rt'){p('Команда доступна на маршрутизаторе');return}const i=d.ifaces.findIndex(f=>f.tun&&f.n.toLowerCase()===String(a[1]||'').toLowerCase());if(i<0||d.ifaces[i].tun.mode!=='ipsec'){p('Использование: ipsec <TunnelN> [ike 1|2] [enc aes256|aes128|3des|des] [hash sha256|sha384|sha1|md5] [dh 2|5|14|19|20] [lifetime секунд]  (только для туннеля IPsec)');return}
  const tn=d.ifaces[i].tun;tn.p=Object.assign({},tn.p||{});const k=a.slice(2);if(!k.length){const q=vpnP(tn);p(`${d.ifaces[i].n}: IKEv${q.ike}, ${q.enc}, ${q.hash}, DH${q.dh}, SA ${q.life} с`);return}
  for(let j=0;j<k.length;j+=2){const kk=(k[j]||'').toLowerCase(),v=(k[j+1]||'').toLowerCase();
   if(kk==='ike'&&['1','2'].includes(v))tn.p.ike=+v;else if(kk==='enc'&&VPN_ENC.includes(v))tn.p.enc=v;else if(kk==='hash'&&VPN_HASH.includes(v))tn.p.hash=v;else if(kk==='dh'&&VPN_DH.includes(+v))tn.p.dh=+v;else if(kk==='lifetime'&&+v>=300)tn.p.life=+v;else{p('Неверный параметр «'+kk+' '+(v||'')+'». Допустимо: ike 1|2, enc '+VPN_ENC.join('|')+', hash '+VPN_HASH.join('|')+', dh '+VPN_DH.join('|')+', lifetime ≥300');return}}
  ch();const q=vpnP(tn);p(`${d.ifaces[i].n}: IKEv${q.ike}, ${q.enc}, ${q.hash}, DH${q.dh}${['3des','des'].includes(q.enc)||['md5','sha1'].includes(q.hash)||q.dh<14&&q.dh<19?' — ⚠ устаревшие алгоритмы':''}`);return}
 if(d&&w==='wg'){const s=(a[1]||'').toLowerCase();
  if(s==='genkey'){p(wgGen());return}if(s==='pubkey'){if(!a[2]){p('Использование: wg pubkey <закрытый_ключ>');return}p(wgPub(a[2]));return}
  if(s==='show'||!s){let n=0;d.ifaces.forEach((f,i)=>{if(f.tun&&f.tun.mode==='wg'){n++;vpnShow(d,o,f.n)}});if(!n)p('WireGuard-туннелей нет. Создайте: tunnel <local_ip> <remote_ip> wg');return}
  if(s==='peer'){const i=d.ifaces.findIndex(f=>f.tun&&f.tun.mode==='wg'&&f.n.toLowerCase()===String(a[2]||'').toLowerCase());if(i<0||!a[3]){p('Использование: wg peer <TunnelN> <открытый_ключ_пира>');return}d.ifaces[i].tun.peer=a[3];ch();p(`${d.ifaces[i].n}: ключ пира задан`);return}
  p('Команды: wg show | wg genkey | wg pubkey <ключ> | wg peer <TunnelN> <публичный_ключ>');return}
 return _r(c)}}
{const _at=addTunnel;addTunnel=function(d,local,remote,mode,key){if(mode!=='wg')return _at(d,local,remote,mode,key);
 if(d.t!=='rt')return'Туннели настраиваются на маршрутизаторе';if(ip2n(local||'')==null||ip2n(remote||'')==null)return'Использование: tunnel <local_ip> <remote_ip> wg';
 let k=0;while(d.ifaces.some(f=>f.n==='Tunnel'+k))k++;const priv=wgGen();d.ifaces.push({n:'Tunnel'+k,ip:'',mask:'',tun:{local,remote,mode:'wg',key:priv,peer:''}});ch();
 return`Создан Tunnel${k}: WIREGUARD ${local} → ${remote}. Открытый ключ этого узла: ${wgPub(priv)}. Передайте его соседу и задайте ключ соседа: wg peer Tunnel${k} <ключ_соседа>. Затем: ip Tunnel${k} <ip> <маска>.`}}
// ---------- окно монитора ----------
document.head.insertAdjacentHTML('beforeend','<style>.vpx table{width:100%;border-collapse:collapse;font-size:12.5px}.vpx td,.vpx th{border:1px solid var(--bd);padding:3px 5px;text-align:left}.vpx .okk{color:#1f9d57}.vpx .nok{color:#d64545}.vpx .row{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.vpx .note{color:var(--mt);font-size:12.5px}</style>');
function vpnPanel(){const T=vpnTuns(),A=vpnAudit();const ok=A.filter(x=>x.ok).length;
 const rows=T.map(x=>{const s=tunStatus(x.d,x.i),t=x.f.tun,q=vpnP(t);return`<tr><td>${vpnE(x.d.name)}</td><td>${vpnE(x.f.n)}</td><td>${t.mode==='wg'?'WireGuard':t.mode==='ipsec'?'IPsec':'GRE'}</td><td>${t.local} → ${t.remote}</td><td>${t.mode==='ipsec'?`IKEv${q.ike} ${q.enc}/${q.hash}/DH${q.dh}`:t.mode==='wg'?(t.peer?'ключ пира задан':'нет ключа пира'):'нет шифрования'}</td><td class="${s.up?'okk':'nok'}">${s.up?'UP':'DOWN'}</td></tr>`}).join('');
 return`<div class="vpx" id="vpx"><h3 data-nohelp="1">VPN: монитор и аудит туннелей</h3>${T.length?`<table><tr><th>Узел</th><th>Интерфейс</th><th>Тип</th><th>Концы</th><th>Параметры</th><th>Состояние</th></tr>${rows}</table>`:'<p>На схеме нет туннелей. Создайте командой <code>tunnel &lt;local&gt; &lt;remote&gt; gre|ipsec|wg</code> на маршрутизаторе или нажмите «Учебная неисправность».</p>'}
<div class="row"><button data-vpb="fix" data-nohelp="1">Привести IPsec к AES-256/SHA-256/DH14/IKEv2</button><button data-vpb="scn" data-nohelp="1">Учебная неисправность: два филиала, IKE не совпадает</button></div>
<h4 data-nohelp="1">Аудит: выполнено ${ok} из ${A.length}</h4>${A.map(x=>`<div class="${x.ok?'okk':'nok'}">${x.ok?'✔':'✖'} ${vpnE(x.t)}${x.d?`<div class="note">${vpnE(x.d)}</div>`:''}</div>`).join('')||'<div class="note">Нет данных.</div>'}
<p class="note">Подсказка: подробности по узлу — команда <code>show crypto</code> на маршрутизаторе; параметры IPsec — <code>ipsec Tunnel0 enc aes256 hash sha256 dh 14 ike 2</code>.</p></div>`}
function vpnOpen(){openMd(vpnPanel())}
function vpnRefresh(){const x=document.getElementById('vpx');if(!x||md.hidden)return;mb.innerHTML=vpnPanel()+'<p><button data-x="close">Закрыть</button></p>'}
function vpnScenario(){const i=TPL.findIndex(t=>/IPsec VPN/.test(t.n||''));if(i<0){p('Шаблон с IPsec не найден');return}tplLoad(TPL[i]);const T=vpnTuns().filter(x=>x.f.tun.mode==='ipsec');if(T.length<2){p('В шаблоне нет пары IPsec-туннелей');return}
 T.forEach(x=>{x.f.tun.p=null});T[1].f.tun.p={ike:1,enc:'3des',hash:'md5',dh:2};ch();p('Учебная неисправность: на одном из маршрутизаторов заданы устаревшие параметры IPsec (3DES/MD5/DH2/IKEv1). Найдите причину: show crypto, VPN-монитор.')}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-vpb]');if(!b)return;if(b.dataset.vpb==='fix'){vpnTuns().filter(x=>x.f.tun.mode==='ipsec').forEach(x=>{x.f.tun.p=null});ch()}else vpnScenario();vpnRefresh()});
(function(){const dd=document.querySelector('#mbar .mi[data-k="n"] .mdd');if(!dd||document.getElementById('bvpn'))return;const b=document.createElement('button');b.id='bvpn';b.type='button';b.textContent='VPN: монитор и аудит';b.setAttribute('role','menuitem');b.setAttribute('data-nohelp','1');b.setAttribute('data-d','Туннели GRE, IPsec и WireGuard: состояние, параметры, аудит безопасности');b.onclick=vpnOpen;dd.appendChild(b)})();
if(typeof QH_ID!=='undefined')QH_ID.bvpn=['VPN: монитор','Все туннели схемы с состоянием и параметрами, аудит безопасности (шифрование, алгоритмы, ключи, адреса) и учебная неисправность IKE.'];
MAN.push(['Т49. VPN: IPsec, WireGuard, аудит',`<p>К туннелям GRE и IPsec (Т16) добавлены параметры IKE, туннели WireGuard, диагностика и аудит. Меню «Сеть → VPN: монитор и аудит» (команда <code>vpncheck</code>).</p>
<h3>Параметры IPsec</h3><p>Команда на маршрутизаторе: <code>ipsec Tunnel0 ike 2 enc aes256 hash sha256 dh 14 lifetime 3600</code>. Чтобы SA установилась, оба конца должны согласовать версию IKE, шифрование, хеш и группу Диффи-Хеллмана (и PSK). При несовпадении туннель DOWN, а причина называет различающиеся параметры. Значения по умолчанию — IKEv2, AES-256, SHA-256, DH 14. DES, 3DES, MD5, SHA-1 и группы DH 2/5 считаются устаревшими — аудит отмечает их.</p>
<h3>WireGuard</h3><p><code>tunnel &lt;local&gt; &lt;remote&gt; wg</code> создаёт туннель и ключевую пару, показывает открытый ключ. Обменяйтесь открытыми ключами между узлами и задайте ключ соседа: <code>wg peer Tunnel0 &lt;ключ&gt;</code>; адреса — как у любого туннеля (<code>ip Tunnel0 10.9.9.1 255.255.255.252</code>). Команды: <code>wg show</code>, <code>wg genkey</code>, <code>wg pubkey &lt;ключ&gt;</code>. Ключи в модели — учебные значения (не настоящая криптография Curve25519), но порядок действий соответствует реальному.</p>
<h3>Диагностика</h3><p><code>show crypto [TunnelN]</code>: состояние, параметры, причина отказа, MTU туннеля и рекомендуемый TCP MSS. Накладные расходы: GRE 24 байта, WireGuard 60, IPsec (ESP) около 73 — отсюда уменьшенный MTU и типовая проблема «пинг идёт, а большие страницы не открываются».</p>
<h3>Аудит</h3><p>Проверки: все ли туннели подняты, нет ли GRE без шифрования, стойкие ли алгоритмы, IKEv2, длина PSK (от 12 символов), задан ли ключ пира WireGuard, есть ли адреса на туннелях. Кнопка «Учебная неисправность» строит схему двух филиалов с несовпадающими параметрами IKE.</p><p><b>Ограничения:</b> модель не вычисляет настоящие рукопожатия; нет клиентских VPN (remote access, OpenVPN/L2TP), маршрутизации по политикам и NAT-T, ESP-шифрование трафика не моделируется на уровне байтов.</p>`]);
