// ===== m_eltex (v96): учебная консоль маршрутизатора Eltex ESR — кандидат-конфигурация: изменения применяются по commit, фиксируются confirm =====
const elN=d=>d.name;
function elIf(d,s){const m=/^(?:gigabitethernet|gi|gig)\s*1\/0\/(\d+)$/i.exec(String(s||'').trim());if(!m)return-1;const i=+m[1]-1;return i>=0&&i<d.ifaces.length?i:-1}
const elPfx=x=>{const m=/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/.exec(x||'');if(!m||ip2n(m[1])==null||+m[2]>32)return null;return{ip:m[1],len:+m[2],mask:rdMask(+m[2])}};
const elSnap=d=>JSON.stringify({n:d.name,i:d.ifaces.map(f=>({ip:f.ip||'',mask:f.mask||'',off:!!f.off})),r:d.routes||[]});
function elRestore(d,s){const o=JSON.parse(s);d.name=o.n;o.i.forEach((x,k)=>{const f=d.ifaces[k];if(!f)return;f.ip=x.ip;f.mask=x.mask;f.off=x.off});d.routes=o.r;ch()}
function elApply(d,op){if(op.k==='host'){d.name=op.v}
 else if(op.k==='ip'){const f=d.ifaces[op.i];f.ip=op.ip;f.mask=op.mask}
 else if(op.k==='noip'){const f=d.ifaces[op.i];f.ip='';f.mask=''}
 else if(op.k==='sd')d.ifaces[op.i].off=!!op.off;
 else if(op.k==='route'){d.routes=(d.routes||[]).filter(r=>!(r.net===op.net&&r.mask===op.mask));d.routes.push({net:op.net,mask:op.mask,nh:op.nh})}
 else if(op.k==='noroute'){d.routes=(d.routes||[]).filter(r=>!(r.net===op.net&&r.mask===op.mask))}}
const elOpText=(d,o)=>o.k==='host'?'hostname '+o.v:o.k==='ip'?`interface gigabitethernet 1/0/${o.i+1}: ip address ${o.ip}/${plen(o.mask)}`:o.k==='noip'?`interface gigabitethernet 1/0/${o.i+1}: no ip address`:o.k==='sd'?`interface gigabitethernet 1/0/${o.i+1}: ${o.off?'shutdown':'no shutdown'}`:o.k==='route'?`ip route ${o.net}/${plen(o.mask)} ${o.nh}`:`no ip route ${o.net}/${plen(o.mask)}`;
function elRun(d){const L=['hostname '+d.name,''];d.ifaces.forEach((f,i)=>{if(f.ip||f.off){L.push('interface gigabitethernet 1/0/'+(i+1));if(f.ip)L.push('  ip address '+f.ip+'/'+plen(f.mask));if(f.off)L.push('  shutdown');L.push('  exit')}});
 (d.routes||[]).forEach(r=>L.push('ip route '+r.net+'/'+plen(r.mask)+' '+r.nh+(r.ad?' '+r.ad:'')));return L.join('\n')}
function elCmd(d,c,s,a,w,io,_r){const E=d.elx=d.elx||{c:[],pend:null,conf:false},st=d.vm=d.vm||{m:'priv'},m=st.m,go=(mm,x)=>{d.vm=Object.assign({m:mm},x||{})};
 const native=cmd=>{const v=d.vend;delete d.vend;try{return _r(cmd)}finally{d.vend=v}};
 const unk=()=>io('% Unrecognized command: '+s);
 if(w[0]==='end'||(w[0]==='exit'&&m==='priv')){if(m!=='priv'){go('priv')}return}
 if(w[0]==='exit'){go(m==='if'?'conf':'priv');return}
 if(w[0]==='show'||w[0]==='do'&&w[1]==='show'){const x=(w[0]==='do'?w.slice(2):w.slice(1)).join(' ');
  if(/^running-config|^run/.test(x))return io(elRun(d));
  if(/^candidate-config|^cand/.test(x)){io(elRun(d));io('! Изменения кандидата, ещё не применённые ('+E.c.length+'):');E.c.forEach(o=>io('!  '+elOpText(d,o)));if(!E.c.length)io('!  (нет)');return}
  if(/^ip route|^route/.test(x))return native('route');
  if(/^ip interfaces?|^ip int|^interfaces?( status)?$/.test(x)){io('Interface             IP address        Status');d.ifaces.forEach((f,i)=>io(`gi1/0/${i+1}`.padEnd(22)+(f.ip?f.ip+'/'+plen(f.mask):'—').padEnd(18)+(f.off?'admin down':peer(d,i)?'up':'down')));return}
  if(/^version/.test(x))return io('Eltex ESR (учебная модель Стектонии) — упрощённый интерфейс командной строки');
  if(/^commit|^configuration changes/.test(x)){io(E.pend?'Есть неподтверждённое применение. Выполните confirm или rollback.':'Неподтверждённых изменений нет.');return}
  return io('% Unknown show request in educational model: '+s)}
 if(w[0]==='commit'){if(!E.c.length&&!E.pend)return io('Нет изменений для применения');
  if(E.pend)return io('Предыдущее применение не подтверждено: выполните confirm или rollback');
  E.pend=elSnap(d);let err=null;try{E.c.forEach(o=>elApply(d,o))}catch(e){err=e}if(err){elRestore(d,E.pend);E.pend=null;return io('% Ошибка применения, конфигурация возвращена')}
  E.c=[];E.conf=false;ch();return io('Configuration has been successfully committed\nВыполните confirm: на реальном устройстве без подтверждения в заданное время изменения откатываются.')}
 if(w[0]==='confirm'){if(!E.pend)return io('Нечего подтверждать');E.pend=null;E.conf=true;ch();return io('Configuration has been successfully confirmed')}
 if(w[0]==='rollback'||w[0]==='restore'){if(E.pend){elRestore(d,E.pend);E.pend=null;return io('Configuration has been rolled back to the previous state')}if(E.c.length){const n=E.c.length;E.c=[];return io('Кандидат-конфигурация очищена ('+n+')')}return io('Нечего откатывать')}
 if(w[0]==='save'){io('Running configuration saved to startup');return}
 if(m==='priv'){if(w[0]==='configure'||w[0]==='conf'){go('conf');return io('Entering configuration mode (изменения применяются командой commit)')}
  if(/^(ping|traceroute|tracert|trace|send|arp|help|clear|cls|iperf|nslookup)\b/i.test(s))return native(c);return unk()}
 if(m==='conf'){
  if(w[0]==='hostname'&&a[1]){if(!/^[A-Za-z][A-Za-z0-9_-]{0,31}$/.test(a[1]))return io('% Недопустимое имя узла');E.c.push({k:'host',v:a[1]});return}
  if(w[0]==='interface'){const i=elIf(d,a.slice(1).join(' '));if(i<0)return io('% Интерфейс не найден. Пример: interface gigabitethernet 1/0/1 (порты 1/0/1 … 1/0/'+d.ifaces.length+')');go('if',{i});return}
  if(w[0]==='ip'&&w[1]==='route'){const p=elPfx(a[2]);if(!p||ip2n(a[3]||'')==null)return io('% Использование: ip route <сеть/длина> <шлюз>   (например ip route 192.168.2.0/24 10.0.12.2; по умолчанию 0.0.0.0/0)');
   if(!d.ifaces.some(f=>f.ip&&f.mask&&same(a[3],f.ip,f.mask))&&!E.c.some(o=>o.k==='ip'&&same(a[3],o.ip,o.mask)))io('% Предупреждение: шлюз '+a[3]+' пока не из подсети интерфейса — маршрут заработает после настройки адреса');
   E.c.push({k:'route',net:n2ip((ip2n(p.ip)&ip2n(p.mask))>>>0),mask:p.mask,nh:a[3]});return}
  if(w[0]==='no'&&w[1]==='ip'&&w[2]==='route'){const p=elPfx(a[3]);if(!p)return io('% Использование: no ip route <сеть/длина>');E.c.push({k:'noroute',net:n2ip((ip2n(p.ip)&ip2n(p.mask))>>>0),mask:p.mask});return}
  return unk()}
 if(m==='if'){const i=st.i;
  if(w[0]==='ip'&&w[1]==='address'){const p=elPfx(a[2]);if(!p)return io('% Использование: ip address <адрес/длина>, например ip address 10.0.12.1/30');if(p.len>30||p.len<8)return io('% Длина префикса для интерфейса: от /8 до /30');E.c.push({k:'ip',i,ip:p.ip,mask:p.mask});return}
  if(w[0]==='no'&&w[1]==='ip'&&w[2]==='address'){E.c.push({k:'noip',i});return}
  if(w[0]==='shutdown'){E.c.push({k:'sd',i,off:true});return}
  if(w[0]==='no'&&w[1]==='shutdown'){E.c.push({k:'sd',i,off:false});return}
  if(w[0]==='description'||w[0]==='security-zone'||w[0]==='mtu')return;
  return unk()}}
{const _v=vcPs;vcPs=function(d){if(d&&d.vend==='eltex'){const el=$('#ps');if(!el)return;const s=d.vm||{m:'priv'};el.textContent=d.name+({priv:'# ',conf:'(config)# ',if:'(config-if-gi)# '}[s.m]||'# ');return}return _v(d)}}
{const _r=run;run=function(c){const d=sel&&dv(sel),s=String(c||'').trim();if(!d||!s)return _r(c);const a=s.split(/\s+/),w=a.map(x=>x.toLowerCase());
 if(w[0]==='cli'&&w[1]==='eltex'){if(d.t!=='rt')return p('Консоль Eltex ESR доступна на маршрутизаторах.');d.vend='eltex';d.vm={m:'priv'};d.elx=d.elx||{c:[],pend:null,conf:false};ch();vcPs(d);return p('Консоль Eltex ESR (учебное подмножество): configure → interface gigabitethernet 1/0/1 → ip address … → commit → confirm. Справка: show running-config, show candidate-config.')}
 if(w[0]==='cli'&&w[1]&&w[1]!=='eltex'&&d.vend==='eltex'){delete d.vend;delete d.vm}
 if(d.vend==='eltex'&&d.t==='rt'){elCmd(d,c,s,a,w,p,_r);vcPs(d);return}
 return _r(c)}}
CMDS.push(['cli eltex','Консоль Eltex ESR (учебное подмножество): configure, interface gigabitethernet 1/0/N, ip address a.b.c.d/n, ip route сеть/длина шлюз, commit, confirm, rollback, show running-config|candidate-config|ip route|ip interfaces','Консоль российского маршрутизатора Eltex ESR','Изменения вносятся в кандидат-конфигурацию и начинают действовать только после commit; после проверки связи их нужно зафиксировать командой confirm, иначе (на реальном устройстве по таймеру) произойдёт откат. rollback отменяет неподтверждённое применение или очищает кандидат. Это упрощённая модель; точный синтаксис и параметры — по документации производителя. cli native возвращает обычную консоль.','Консоль']);
const elBase=()=>({dev:[['pc','PC-A',40,200],['rt','R1',220,200],['rt','R2',420,200],['pc','PC-B',600,200]],link:[['PC-A',0,'R1',0],['R1',1,'R2',0],['R2',1,'PC-B',0]],
 cfg:[['PC-A','ip eth0 192.168.1.10 /24','gateway 192.168.1.1'],['PC-B','ip eth0 192.168.2.10 /24','gateway 192.168.2.1']]});
TPL.push(Object.assign({n:'Консоль Eltex ESR: адресация и маршрут (пустые маршрутизаторы)',d:'Два чистых маршрутизатора R1 и R2 между PC-A и PC-B. Настройте их в консоли Eltex ESR (cli eltex): адреса на интерфейсах и статические маршруты, затем commit и confirm.',hint:'На R1: cli eltex, configure, interface gigabitethernet 1/0/1, ip address 192.168.1.1/24, exit, interface gigabitethernet 1/0/2, ip address 10.0.12.1/30, exit, ip route 192.168.2.0/24 10.0.12.2, commit, confirm. Повторите на R2 и проверьте ping PC-A → PC-B. Попробуйте не делать commit и посмотрите show candidate-config.'},elBase()));
if(typeof EXNET!=='undefined')EXNET.push({n:'Eltex ESR: настроить два маршрутизатора через commit',min:20,tag:'Консоли',init:r=>({}),start:c=>{tplLoad(Object.assign({n:'ELX',hint:''},elBase()));['R1','R2'].forEach(n=>{const d=byNm(n);d.vend='eltex';d.vm={m:'priv'};d.elx={c:[],pend:null,conf:false}});vcPs(byNm('R1'));p('R1 и R2 уже в консоли Eltex ESR. Настройте адреса и статические маршруты, примените (commit) и подтвердите (confirm).')},
 text:c=>'Между PC-A (192.168.1.10/24) и PC-B (192.168.2.10/24) установлены маршрутизаторы Eltex ESR R1 и R2, связанные сетью 10.0.12.0/30 (R1 — 10.0.12.1, R2 — 10.0.12.2). Порты: gi1/0/1 — к ПК, gi1/0/2 — к другому маршрутизатору. Настройте адреса интерфейсов (шлюзы ПК 192.168.1.1 и 192.168.2.1) и статические маршруты на обоих маршрутизаторах, выполните commit и confirm на каждом. Связь PC-A — PC-B должна работать.',
 crit:c=>{const R1=byNm('R1'),R2=byNm('R2'),A=byNm('PC-A'),ip=(d,i,x)=>d.ifaces[i]&&d.ifaces[i].ip===x;
  return[['Адреса интерфейсов R1 применены (192.168.1.1/24, 10.0.12.1/30)',20,()=>ip(R1,0,'192.168.1.1')&&ip(R1,1,'10.0.12.1')&&plen(R1.ifaces[1].mask)===30],
  ['Адреса интерфейсов R2 применены (10.0.12.2/30, 192.168.2.1/24)',20,()=>ip(R2,0,'10.0.12.2')&&ip(R2,1,'192.168.2.1')&&plen(R2.ifaces[1].mask)===24],
  ['PC-A → PC-B',30,()=>{EX=[];return!!trip(A,'192.168.2.10').ok}],
  ['Изменения подтверждены (confirm) на обоих маршрутизаторах, кандидат пуст',30,()=>[R1,R2].every(d=>d.elx&&d.elx.conf&&!d.elx.pend&&!d.elx.c.length)]]}});
MAN.push(['Т65. Консоль Eltex ESR: кандидат-конфигурация, commit и confirm',`<p><b>Зачем.</b> Eltex ESR – российские маршрутизаторы, применяемые в программах импортозамещения; их консоль отличается от Cisco и Huawei. Главное отличие – <b>двухэтапное применение настроек</b>: команды вносятся в <i>кандидат-конфигурацию</i> (candidate), начинают действовать после <code>commit</code> и закрепляются после <code>confirm</code>. Если подтверждение не выполнено, устройство возвращает прежнюю конфигурацию – это защищает от потери управления при ошибке удалённой настройки.</p>
<p><b>Команды Стектонии (учебное подмножество).</b> <code>cli eltex</code>, <code>configure</code>, <code>hostname ИМЯ</code>, <code>interface gigabitethernet 1/0/N</code>, <code>ip address 10.0.12.1/30</code>, <code>shutdown</code> / <code>no shutdown</code>, <code>ip route 192.168.2.0/24 10.0.12.2</code>, <code>commit</code>, <code>confirm</code>, <code>rollback</code>, <code>show running-config</code>, <code>show candidate-config</code>, <code>show ip route</code>, <code>show ip interfaces</code>. Адреса записываются с длиной префикса через дробь, а не маской. Порты нумеруются 1/0/1, 1/0/2 … и соответствуют портам устройства по порядку.</p>
<p><b>Типовые ошибки.</b> Забыли commit (изменения лежат в кандидате и не действуют); не выполнили confirm; ввели маску вместо длины префикса; указали порт, которого нет; шлюз маршрута не из подсети настроенного интерфейса.</p>
<p><b>Ограничения модели.</b> Это упрощённая модель: нет таймера автоматического отката, зон безопасности, NAT и динамических протоколов в консоли Eltex, а точный синтаксис и параметры команд следует сверять с документацией производителя. Консоль доступна на маршрутизаторах; коммутаторы Eltex MES используют синтаксис, близкий к Cisco (cli cisco).</p>`]);
