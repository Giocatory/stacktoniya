// ===== m_cyber: кибер-учения Red / Blue: расследование инцидента по журналу и блокировка атакующего; разведка и подбор пароля =====
const CYW=['123456','password','qwerty','admin','letmein','111111','welcome','12345678','dragon','monkey'];
const CYU=['root','admin','user','test','oracle','guest'];
const cyRng=s=>{let a=(s*2654435761>>>0)||1;return()=>{a=(a*1664525+1013904223)>>>0;return a/4294967296}};
function cyBuild(mode,v){const r=cyRng(v*7919+(mode==='red'?5:11));const atk='203.0.113.'+(20+Math.floor(r()*200)),kind=v%2?'scan':'ssh',n=kind==='ssh'?17+Math.floor(r()*44):15+Math.floor(r()*26);
 const pwHard=v%2===0,pw=pwHard?['corp2024','Summer2025','Nov3mber'][Math.floor(r()*3)]:CYW[2+Math.floor(r()*8)],user='admin',extra=[21,8080,3306,5900][Math.floor(r()*4)];
 tplLoad({n:'Кибер-полигон',dev:[],link:[],cfg:[],hint:''});
 [['pc','Attacker',60,260],['rt','ISP',250,260],['rt','R1',450,260],['sw','SW1',630,260],['srv','Server',820,170],['pc','Admin',820,350]].forEach(([k,nm,x,y])=>addDev(k,x,y,nm));
 const L=(a,ai,b,bi)=>{link(byNm(a),ai,byNm(b),bi);const l=S.links[S.links.length-1];l.id=rid();l.ct='cat5e';l.len=10};
 L('Attacker',0,'ISP',0);L('ISP',1,'R1',1);L('R1',0,'SW1',0);L('SW1',1,'Server',0);L('SW1',2,'Admin',0);
 const X=(nm,...cs)=>cs.forEach(l=>execOn(byNm(nm),l));
 X('Attacker',`ip eth0 ${atk} /24`,'gateway 203.0.113.1');X('ISP','ip gi0/0 203.0.113.1 /24','ip gi0/1 198.51.100.1 /30','route add 192.168.10.0 255.255.255.0 198.51.100.2');
 X('R1','ip gi0/1 198.51.100.2 /30','ip gi0/0 192.168.10.1 /24','route add 0.0.0.0 0.0.0.0 198.51.100.1');
 X('Server','ip eth0 192.168.10.10 /24','gateway 192.168.10.1','service add tcp 22','service add tcp 80',...(mode==='red'?[`service add tcp ${extra}`]:[]));X('Admin','ip eth0 192.168.10.20 /24','gateway 192.168.10.1');
 S.cy={mode,v,kind,atk,n,pw,user,extra,hard:pwHard};
 if(mode==='blue'){const ad=byNm('Admin');let L2=[];const mon=['Nov  3 03:','Nov  3 04:'];
  if(kind==='ssh'){let t=0;for(let i=0;i<n;i++){t+=1+Math.floor(r()*3);L2.push(`${mon[0]}${String(Math.floor(t/60)%60).padStart(2,'0')}:${String(t%60).padStart(2,'0')} server sshd[${2100+i}]: Failed password for ${i%7===0?'invalid user ':''}${CYU[i%CYU.length]} from ${atk} port ${40000+Math.floor(r()*20000)} ssh2`)}
   for(let i=0;i<3;i++)L2.push(`Nov  3 04:1${i}:20 server sshd[3${i}00]: Failed password for admin from 192.168.10.20 port 51${i}22 ssh2`);L2.push('Nov  3 04:15:02 server sshd[3401]: Accepted password for admin from 192.168.10.20 port 51200 ssh2')}
  else{const ports=[];while(ports.length<n){const p=1+Math.floor(r()*10000);if(!ports.includes(p))ports.push(p)}ports.forEach((p,i)=>L2.push(`Nov  3 03:2${i%10}:${String(10+i).slice(-2)} server kernel: [UFW BLOCK] IN=eth0 SRC=${atk} DST=192.168.10.10 PROTO=TCP SPT=${50000+i} DPT=${p}`));
   for(let i=0;i<4;i++)L2.push(`Nov  3 04:0${i}:11 server kernel: [UFW ALLOW] IN=eth0 SRC=192.168.10.20 DST=192.168.10.10 PROTO=TCP SPT=4${i}000 DPT=80`)}
  L2.sort((a,b)=>a.slice(0,15)<b.slice(0,15)?-1:1);sxPutF(ad,SXH+'/'+(kind==='ssh'?'auth.log':'firewall.log'),L2.join('\n')+'\n')}
 sel=byNm(mode==='blue'?'Admin':'Attacker').id;ch();draw();side();out.textContent='';return S.cy}
function cyText(c){if(!c)return'';if(c.mode==='blue')return c.kind==='ssh'
 ?`Синяя команда. Вы — администратор Admin. Сервер Server (192.168.10.10) подвергается подбору паролей по SSH. Журнал auth.log лежит в домашнем каталоге Admin (${SXH}/auth.log). 1) Найдите IP-адрес атакующего и число его неудачных попыток входа. Запишите их в файл ${SXH}/incident.txt (например: «203.0.113.77 41»). 2) Заблокируйте атакующего на маршрутизаторе R1 так, чтобы он не мог подключаться к Server по tcp/22 (подсказка: acl deny <IP>/32 any tcp 22, затем acl permit any any). 3) Не нарушайте работу: Admin по-прежнему входит по SSH, а сайт Server (tcp/80) открыт для всех, включая внешних пользователей.`
 :`Синяя команда. Вы — администратор Admin. Сервер Server (192.168.10.10) сканируют. Журнал firewall.log лежит в домашнем каталоге Admin (${SXH}/firewall.log). 1) Найдите IP-адрес сканера и число различных портов, на которые он стучался. Запишите их в ${SXH}/incident.txt (например: «203.0.113.77 29»). 2) Заблокируйте сканер на R1 так, чтобы он не открывал ни tcp/22, ни tcp/80 на Server (подсказка: acl deny <IP>/32 any tcp 22, acl deny <IP>/32 any tcp 80, затем acl permit any any). 3) Не нарушайте работу: Admin по-прежнему подключается к Server по SSH и открывает сайт.`;
 return`Красная команда (учебное тестирование на проникновение в своей лаборатории). Вы — Attacker (203.0.113.x). Цель — Server (192.168.10.10). 1) Разведка: командой scan 192.168.10.10 найдите открытые порты и запишите их в файл ${SXH}/pentest.txt. 2) Подбор пароля: команда brute 192.168.10.10 admin [файл-словарь] перебирает пароли службы SSH (встроенный словарь — 10 слабых паролей${c.hard?'; здесь пароль в нём не найдётся: составьте свой словарь по подсказке «компания и год» и передайте файлом':''}). Найденный пароль допишите в pentest.txt. 3) Отчёт: в pentest.txt должны быть все открытые порты и найденный пароль. Законно только в лаборатории!`}
function cyEval(){const c=S.cy;if(!c)return null;const R=[];const rd=(nm,p)=>{const d=byNm(nm);return d?sxRd(d,SXH+'/'+p):null};
 if(c.mode==='blue'){const inc=rd('Admin','incident.txt')||'';R.push(['В incident.txt указан IP атакующего '+c.atk,inc.includes(c.atk)]);R.push([`В incident.txt указано число ${c.kind==='ssh'?'неудачных попыток':'портов'} (${c.n})`,new RegExp('(^|[^\\d])'+c.n+'([^\\d]|$)').test(inc.replace(c.atk,''))]);
  R.push(['Атакующий не может открыть tcp/22 на Server',!cmL4('Attacker','Server',22)]);
  if(c.kind==='scan')R.push(['Сканер не может открыть и веб (tcp/80) на Server',!cmL4('Attacker','Server',80)]);
  R.push(['Admin по-прежнему подключается к Server по tcp/22 и tcp/80',cmL4('Admin','Server',22)&&cmL4('Admin','Server',80)]);
  if(c.kind==='ssh')R.push(['Сайт Server (tcp/80) остаётся доступен внешним пользователям',cmL4('Attacker','Server',80)]);
  R.push(['Связность Admin ↔ Интернет не нарушена',cmPin('Admin','Attacker')||cmPin('Admin','ISP')])}
 else{const t=rd('Attacker','pentest.txt')||'';[22,80,c.extra].forEach(p=>R.push(`Открытый порт ${p} указан в pentest.txt`,new RegExp('(^|[^\\d])'+p+'([^\\d]|$)').test(t))&&0);
  [22,80,c.extra].forEach(p=>R.push([`Открытый порт ${p} указан в pentest.txt`,new RegExp('(^|[^\\d])'+p+'([^\\d]|$)').test(t)]));R.push(['Найденный пароль указан в pentest.txt',t.includes(c.pw)])}
 const clean=R.filter(x=>Array.isArray(x));return clean}
function cyPanel(msg){const c=S.cy;let h='<h3>Кибер-учения: Red / Blue</h3>';
 h+=`<p><label>Вариант <input id="cy_v" type="number" min="1" max="99" value="${c?c.v:1}" style="width:60px"></label> <button data-x="cy_blue"><b>Синяя команда: расследование</b></button> <button data-x="cy_red"><b>Красная команда: проникновение</b></button></p>`;
 if(c){const R=cyEval();h+=`<p class="mt">Сценарий: <b>${c.mode==='blue'?'синяя команда':'красная команда'}</b>, вариант ${c.v}.</p><p>${asgEsc(cyText(c))}</p><ul>${R.map(x=>`<li>${x[1]?'✅':'⬜'} ${asgEsc(x[0])}</li>`).join('')}</ul><p><b>Выполнено: ${R.filter(x=>x[1]).length} из ${R.length}</b></p><p><button data-x="cy_chk">Проверить</button></p>`}
 else h+=`<p class="mt">Выберите роль. Схема «Кибер-полигон» (Attacker — ISP — R1 — SW1 — Server, Admin) строится автоматически; номер варианта меняет адрес атакующего, журнал и пароль.</p>`;
 h+=(msg?`<p class="mt">${asgEsc(msg)}</p>`:'')+'<p class="mt">Учебная модель в собственной лаборатории: атаки только имитируются.</p>';openMd(h)}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-x^="cy_"]');if(!b)return;const x=b.dataset.x,v=Math.max(1,Math.min(99,+((document.getElementById('cy_v')||{}).value)||1));
 if(x==='cy_blue'||x==='cy_red'){cyBuild(x==='cy_blue'?'blue':'red',v);return cyPanel('Схема построена')}if(x==='cy_chk')return cyPanel('Проверено: '+new Date().toLocaleTimeString('ru-RU'))},true);
// команда brute (имитация подбора пароля SSH)
{const _r=run;run=function(c){const a=String(c).trim().split(/\s+/),cm=a[0].toLowerCase();
 if(cm==='brute'){const d=sel&&dv(sel);if(!d||d.t!=='pc')return p('brute запускается на компьютере (например Attacker).');if(a.length<3)return p('Использование: brute <IP> <пользователь> [файл-словарь]. Имитация подбора пароля SSH для учебной лаборатории.');
  const ip=a[1],user=a[2];let W=CYW.slice();if(a[3]){const f=sxRd(d,a[3].startsWith('/')?a[3]:SXH+'/'+a[3]);if(f===null)return p('Словарь не найден: '+a[3]);W=f.split('\n').map(s=>s.trim()).filter(Boolean)}
  if(!cmL4(d.name,ipOf(ip)&&(S.devs.find(x=>srcIp(x)===ipOf(ip))||{}).name,22))return p(`brute: ${ip}:22 — соединение не установлено (порт закрыт или заблокирован)`);
  const cy=S.cy;p(`[ssh] цель ${ip}:22, пользователь ${user}, паролей в словаре: ${W.length}`);
  if(!cy||user!==cy.user||ip!=='192.168.10.10'){W.forEach((w,i)=>{if(i<3)p(`[ATTEMPT] ${i+1} из ${W.length}: ${w}`)});return p('Подходящих паролей не найдено (0 из '+W.length+')')}
  for(let i=0;i<W.length;i++){if(W[i]===cy.pw){p(`[ATTEMPT] ${i+1} из ${W.length}: ${W[i]}`);return p(`[22][ssh] host: ${ip}   login: ${user}   password: ${W[i]}`)}if(i<4)p(`[ATTEMPT] ${i+1} из ${W.length}: ${W[i]}`)}
  return p('Подходящих паролей не найдено (0 из '+W.length+'). Попробуйте другой словарь.')}
 return _r(c)}}
(function(){const dd=document.querySelector('#mbar .mi[data-k="p"] .mdd');if(!dd||document.getElementById('bcyb'))return;const b=document.createElement('button');b.id='bcyb';b.type='button';b.textContent='Кибер-учения (Red / Blue)';b.setAttribute('role','menuitem');b.setAttribute('data-nohelp','1');b.setAttribute('data-d','Расследование атаки по журналу и блокировка; разведка и подбор пароля');b.onclick=()=>cyPanel();dd.appendChild(b)})();
if(typeof QH_ID!=='undefined')QH_ID.bcyb=['Кибер-учения','Готовые сценарии: синяя команда расследует атаку по журналу и блокирует атакующего, красная команда проводит разведку и подбор пароля в своей лаборатории. Есть автопроверка.'];
MAN.push(['Т41. Кибер-учения: красная и синяя команда',`<h3>Синяя команда (защита)</h3><p>Пункт «Практика → Кибер-учения (Red / Blue)», кнопка «Синяя команда». Строится схема «Кибер-полигон»: Attacker — ISP — R1 — SW1 — Server и Admin. На Admin лежит журнал (<code>auth.log</code> с подбором пароля SSH или <code>firewall.log</code> со сканированием портов). Нужно найти IP атакующего и число попыток (портов), записать их в <code>incident.txt</code>, заблокировать атакующего на R1 списком доступа (<code>acl deny &lt;IP&gt;/32 any tcp 22</code> и <code>acl permit any any</code>) и не нарушить работу: Admin и внешний сайт Server остаются доступны. Проверка — по поведению сети.</p>
<h3>Красная команда (атака в лаборатории)</h3><p>Кнопка «Красная команда»: вы работаете на Attacker. <code>scan 192.168.10.10</code> находит открытые порты, <code>brute 192.168.10.10 admin [словарь]</code> имитирует подбор пароля SSH по встроенному списку слабых паролей или по вашему файлу-словарю. В файле <code>pentest.txt</code> нужно указать все открытые порты и найденный пароль. Если сервер заблокировал ваш адрес (синяя команда), подбор не проходит.</p>
<p>Номер варианта меняет адрес атакующего, размер журнала, набор портов и пароль. Все атаки только имитируются внутри симулятора; используйте знания лишь в собственной лаборатории.</p>`]);
