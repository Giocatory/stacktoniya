// ===== m_rchk (v110): аудит маршрутизации — next-hop вне подключённых сетей, несуществующий адрес, петли, отсутствие обратного пути =====
function rkOwner(ip){for(const d of (S.devs||[]))for(const f of Array.from(d.ifaces||[]))if(f&&f.ip===ip)return{d,f};return null}
function rkConn(d){return d.ifaces.filter(f=>f&&f.ip&&f.mask&&ip2n(f.ip)!=null&&ip2n(f.mask)!=null)}
function rkProblems(){const P=[],R=(S.devs||[]).filter(d=>d.t==='rt');
 for(const d of R){const seen=new Set(),C=rkConn(d);
  (Array.isArray(d.routes)?d.routes:[]).forEach(r=>{if(!r||ip2n(r.net)==null||ip2n(r.mask)==null||ip2n(r.nh)==null)return;const lbl=`${r.net}/${plen(r.mask)} через ${r.nh}`,key=r.net+'/'+r.mask+'>'+r.nh;
   if(seen.has(key)){P.push({k:'dup',t:`${d.name}: маршрут ${lbl} задан дважды`});return}seen.add(key);
   const own=C.find(f=>f.ip===r.nh);if(own){P.push({k:'self',t:`${d.name}: маршрут ${lbl} – next-hop это собственный адрес интерфейса ${own.n}`});return}
   const f=C.find(f=>same(r.nh,f.ip,f.mask));
   if(!f){P.push({k:'far',t:`${d.name}: маршрут ${lbl} – next-hop не лежит ни в одной подключённой сети (шлюз должен быть соседом из общей подсети)`});return}
   if(f.off){P.push({k:'off',t:`${d.name}: маршрут ${lbl} – интерфейс ${f.n} к next-hop отключён`});return}
   const o=rkOwner(r.nh);if(!o){P.push({k:'none',t:`${d.name}: маршрут ${lbl} – в подсети ${f.n} нет устройства с адресом ${r.nh}`});return}
   if(o.d.t!=='rt')return;
   let b=null;try{b=rgBest(rgCands(o.d,r.net))}catch(e){}
   if(b&&/^через /.test(b.via)){const nh2=b.via.slice(6);if(rkConn(d).some(x=>x.ip===nh2))P.push({k:'loop',t:`Петля: ${d.name} отправляет сеть ${r.net}/${plen(r.mask)} на ${o.d.name}, а ${o.d.name} возвращает её через ${nh2} (${d.name})`})}
   })}
 const hasHost=x=>(S.devs||[]).some(h=>h.t!=='rt'&&Array.from(h.ifaces||[]).some(g=>g&&g.ip&&g.mask&&same(g.ip,x.ip,x.mask))),comp={};let cid=0;
 R.forEach(a=>{if(comp[a.id])return;const q=[a];comp[a.id]=++cid;while(q.length){const u=q.pop();R.forEach(v=>{if(!comp[v.id]&&rkConn(u).some(x=>rkConn(v).some(y=>same(x.ip,y.ip,x.mask)&&same(y.ip,x.ip,y.mask)&&plen(x.mask)===plen(y.mask))))comp[v.id]=cid,q.push(v)})}});
 for(const y of R)for(const n of rkConn(y)){if(n.off||!hasHost(n))continue;const net=n2ip((ip2n(n.ip)&ip2n(n.mask))>>>0);
  for(const x of R){if(x===y||comp[x.id]!==comp[y.id])continue;if(rkConn(x).some(g=>same(net,g.ip,g.mask)&&plen(g.mask)===plen(n.mask)))continue;let bn=null;try{bn=rgBest(rgCands(x,net))}catch(e){}
   if(!bn){const nb=rkConn(x).map(g=>R.find(z=>z!==x&&rkConn(z).some(h=>h.ip!==g.ip&&same(h.ip,g.ip,g.mask)))).filter(Boolean);P.push({k:'back',t:`Нет маршрута: ${x.name} не знает сеть ${net}/${plen(n.mask)} (за ${y.name}) – пакеты в эту сеть и ответы из неё не пройдут. Добавьте на ${x.name}: route add ${net} /${plen(n.mask)} <адрес соседа>`+(nb.length===1?` (сосед – ${nb[0].name})`:'')})}}}
 const U=new Set();return P.filter(p=>{if(U.has(p.t))return false;U.add(p.t);return true})}
function rkCheck(io){const P=rkProblems();if(!P.length)return io('Проблем статической маршрутизации не найдено: next-hop доступны, петель и потерянных обратных путей нет. Динамические маршруты и ACL этой проверкой не охватываются.');io('Найдено проблем маршрутизации: '+P.length);P.forEach(x=>io('  ✖ '+x.t));io('Проверьте результат: route get <ip>, ping, matrix run.')}
{const _r=run;run=function(c){const a=String(c||'').trim().split(/\s+/),w=a.map(x=>x.toLowerCase());if(w[0]==='route'&&w[1]==='check'&&a.length===2)return rkCheck(p);return _r(c)}}
CMDS.push(['route check','Аудит статической маршрутизации: недоступный next-hop, несуществующий адрес, петли, дубликаты и отсутствие обратного пути','Аудит маршрутов','route check проверяет статические маршруты всех маршрутизаторов схемы: лежит ли next-hop в подключённой сети, не отключён ли интерфейс, есть ли такое устройство, нет ли петли между соседями и знает ли сосед сети за маршрутизатором (обратный путь). Для найденной проблемы подсказывает исправление.']);
const rkScn=()=>({dev:[['pc','PC-A',20,200],['rt','R1',180,200],['rt','R2',340,200],['rt','R3',500,200],['pc','PC-B',660,200]],link:[['PC-A',0,'R1',0],['R1',1,'R2',0],['R2',1,'R3',0],['R3',1,'PC-B',0]],
 cfg:[['PC-A','ip eth0 192.168.1.10 /24','gateway 192.168.1.1'],['PC-B','ip eth0 192.168.2.10 /24','gateway 192.168.2.1'],
  ['R1','ip gi0/0 192.168.1.1 /24','ip gi0/1 10.0.12.1 /30','route add 192.168.2.0 /24 10.0.12.2'],
  ['R2','ip gi0/0 10.0.12.2 /30','ip gi0/1 10.0.23.1 /30','route add 192.168.2.0 /24 10.0.23.3','route add 192.168.1.0 /24 10.0.12.1'],
  ['R3','ip gi0/0 10.0.23.2 /30','ip gi0/1 192.168.2.1 /24','route add 192.168.1.0 /24 10.0.12.1']]});
TPL.push(Object.assign({n:'Маршруты: найти ошибки статической маршрутизации',d:'Цепочка из трёх маршрутизаторов со статическими маршрутами между сетями 192.168.1.0/24 и 192.168.2.0/24. PC-A и PC-B не связываются: в маршрутах ошибки. Найдите их командой route check.',hint:'Выполните route check, затем route get 192.168.2.10 на каждом маршрутизаторе. Исправьте маршруты (route del … и route add …) и снова выполните route check и ping.'},rkScn()));
if(typeof EXNET!=='undefined')EXNET.push({n:'Маршруты: исправить статическую маршрутизацию',min:15,tag:'Маршрутизация',init:r=>({}),start:c=>{tplLoad(Object.assign({n:'Маршруты',hint:''},rkScn()));p('PC-A и PC-B не связываются. Найдите и исправьте ошибки в статических маршрутах.')},
 text:c=>'Между сетями 192.168.1.0/24 (PC-A) и 192.168.2.0/24 (PC-B) три маршрутизатора со статическими маршрутами. Найдите ошибки командой route check и исправьте их, чтобы PC-A и PC-B пинговали друг друга. Использовать маршрут по умолчанию (0.0.0.0/0) нельзя: нужны маршруты на конкретные сети.',
 crit:c=>{const A=byNm('PC-A'),B=byNm('PC-B'),R=['R1','R2','R3'].map(byNm),def=()=>R.some(r=>(r.routes||[]).some(x=>x.net==='0.0.0.0'&&plen(x.mask)===0)),pg=(x,y)=>{computeRip();EX=[];return!!trip(x,y.ifaces[0].ip).ok};
  return[['PC-A → PC-B',30,()=>pg(A,B)],['PC-B → PC-A',30,()=>pg(B,A)],['route check не находит проблем',30,()=>rkProblems().length===0&&R.every(r=>(r.routes||[]).length>0)],['Маршруты на конкретные сети, без маршрута по умолчанию',10,()=>!def()&&pg(A,B)]]}});
MAN.push(['Т77. Аудит статической маршрутизации: route check',`<p><b>Типовые ошибки.</b> 1) <i>Next-hop вне подключённых сетей</i> – адрес шлюза должен лежать в одной подсети с интерфейсом маршрутизатора. 2) <i>Несуществующий адрес next-hop</i> – в подсети нет устройства с таким адресом (опечатка). 3) <i>Отключённый интерфейс</i> к next-hop. 4) <i>Петля</i>: два соседа отправляют друг другу пакеты для одной сети. 5) <i>Нет обратного пути</i>: пакет дошёл, но ответ вернуться не может, потому что сосед не знает сеть за маршрутизатором. 6) Дубликаты.</p>
<p><b>Правило.</b> Статическая маршрутизация – двусторонняя: на каждом маршрутизаторе нужен маршрут к каждой удалённой сети и в обе стороны.</p>
<p><b>Команда.</b> <code>route check</code> – проверить статические маршруты всех маршрутизаторов и получить подсказку исправления; затем <code>route get &lt;ip&gt;</code>, ping, <code>matrix run</code>. Есть шаблон «Маршруты: найти ошибки статической маршрутизации» и экзаменационное задание «Маршруты: исправить статическую маршрутизацию».</p>
<p><b>Ограничения.</b> Проверяются статические маршруты; динамические протоколы, ACL, NAT и PBR не анализируются.</p>`]);
