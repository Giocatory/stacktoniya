// ===== m_bfd (v101): BFD — быстрое обнаружение отказа канала: сессии, согласование таймеров, время обнаружения, сравнение с OSPF =====
const BF_DEF={tx:300,rx:300,m:3},BF_PPS=100;
const bfMs=ms=>ms>=1000?(ms/1000).toLocaleString('ru-RU',{maximumFractionDigits:1})+' с':ms+' мс';
function bfNb(d,i){const f=d.ifaces[i];if(!f||!f.ip||!f.mask||f.tun)return null;for(const e of l2all(d,i)){const b=e.d,bf=b.ifaces[e.i];if(b!==d&&b.t==='rt'&&bf&&bf.ip&&same(f.ip,bf.ip,f.mask))return{b,bf,bi:e.i}}return null}
function bfSess(d,i){const f=d.ifaces[i];if(!f||!f.bfd)return null;const nb=bfNb(d,i);
 if(f.off)return{st:'AdminDown',why:'интерфейс отключён',nb};if(!nb){const q=peer(d,i);if(q&&q.d&&q.d.t==='rt'&&q.d.ifaces[q.i]&&q.d.ifaces[q.i].off)return{st:'Down',why:'интерфейс соседа отключён',nb};return{st:'Down',why:'в подсети нет соседнего маршрутизатора',nb}}
 if(nb.bf.off)return{st:'Down',why:'интерфейс соседа отключён',nb};
 if(!nb.bf.bfd)return{st:'Down',why:'на соседе '+nb.b.name+' ('+nb.bf.n+') BFD не включён',nb};
 const L=f.bfd,R=nb.bf.bfd,tx=Math.max(L.tx,R.rx),rxi=Math.max(R.tx,L.rx);
 return{st:'Up',nb,tx,rxi,det:R.m*rxi,detR:L.m*Math.max(L.tx,R.rx)}}
const bfOspf=(d,i)=>{try{return typeof ospfLinks==='function'&&d.ospf&&ospfLinks(d).some(x=>x.i===i&&!x.bad)}catch(e){return false}};
function bfParse(a,io){const o={};for(let k=0;k<a.length;k++){const w=(a[k]||'').toLowerCase();
 if(w==='interval'||w==='min_rx'||w==='multiplier'){const v=+a[k+1];const lim=w==='multiplier'?[3,50]:[50,999];if(!Number.isInteger(v)||v<lim[0]||v>lim[1]){io('% '+w+': целое от '+lim[0]+' до '+lim[1]+(w==='multiplier'?'':' мс'));return null}o[w]=v;k++}
 else if(w==='ospf')o.ospf=true;else if(w==='static')o.static=true;else{io('% Неизвестный параметр: '+a[k]);return null}}return o}
function bfSet(d,f,o){const old=f.bfd||{};f.bfd={tx:o.interval||old.tx||BF_DEF.tx,rx:o.min_rx||old.rx||BF_DEF.rx,m:o.multiplier||old.m||BF_DEF.m,ospf:o.ospf!==undefined?!!o.ospf:!!old.ospf,static:o.static!==undefined?!!o.static:!!old.static};ch()}
function bfIfByName(d,n){return d.ifaces.findIndex(f=>f.n.toLowerCase()===String(n||'').toLowerCase())}
function bfShow(d,io,detail){const L=[];d.ifaces.forEach((f,i)=>{if(f.bfd)L.push(i)});
 if(!L.length)return io('BFD не настроен. Пример: bfd gi0/1 interval 300 min_rx 300 multiplier 3 ospf');
 io('Интерфейс  Сосед            Состояние   Передача  Обнаружение  Клиенты');
 L.forEach(i=>{const f=d.ifaces[i],s=bfSess(d,i),cl=[f.bfd.ospf?'OSPF':'',f.bfd.static?'static':''].filter(Boolean).join(',')||'—';
  io((f.n.padEnd(10))+' '+(((s.nb&&s.nb.bf)?s.nb.bf.ip:'—').padEnd(16))+' '+s.st.padEnd(11)+' '+(s.tx?bfMs(s.tx):'—').padEnd(9)+' '+(s.det?bfMs(s.det):'—').padEnd(12)+' '+cl);
  if(detail){io(`   локально: interval ${f.bfd.tx} мс, min_rx ${f.bfd.rx} мс, multiplier ${f.bfd.m}`+(s.nb&&s.nb.bf.bfd?`; у соседа: ${s.nb.bf.bfd.tx}/${s.nb.bf.bfd.rx}/${s.nb.bf.bfd.m}`:''));if(s.st!=='Up')io('   причина: '+s.why);else if(f.bfd.ospf&&!bfOspf(d,i))io('   ⚠ клиент OSPF указан, но соседства OSPF на этом интерфейсе нет (ospf on?)')}})}
function bfFail(d,io,ifn){const idx=ifn?[bfIfByName(d,ifn)]:d.ifaces.map((f,i)=>i).filter(i=>d.ifaces[i].ip&&!d.ifaces[i].tun&&bfNb(d,i));
 if(ifn&&idx[0]<0)return io('Нет интерфейса '+ifn);if(!idx.length)return io('Нет интерфейсов с соседними маршрутизаторами');
 idx.forEach(i=>{const f=d.ifaces[i],nb=bfNb(d,i);if(!nb){io(f.n+': нет соседнего маршрутизатора');return}const s=bfSess(d,i),osp=bfOspf(d,i);
  io(`Отказ канала ${d.name} ${f.n} ↔ ${nb.b.name} ${nb.bf.n} (интерфейсы остаются в состоянии up, пакеты не проходят — «тихий» отказ, например через коммутатор или медиаконвертер)`);
  let slow=null,why;
  if(osp){slow=ospfDead(f)*1000;why=`OSPF разорвёт соседство по Dead Interval = ${bfMs(slow)} (hello ${ospfHello(f)} с)`}
  else{why='без динамического протокола и без track отказ вообще не будет обнаружен: статический маршрут останется в таблице, трафик пропадёт до вмешательства администратора'}
  io('  t = 0: отказ');io('  Без BFD: '+why);
  if(!s||s.st!=='Up'){io('  С BFD: сессия '+(s?s.st+' ('+s.why+')':'не настроена')+' — быстрого обнаружения нет. Настройте BFD на обеих сторонах: bfd '+f.n+' interval 300 min_rx 300 multiplier 3 ospf');return}
  const cl=f.bfd.ospf&&osp,det=s.det;io(`  С BFD: обнаружение через ${bfMs(det)} (${s.nb.bf.bfd.m} × ${bfMs(s.rxi)})`+(cl?'; BFD сообщает OSPF — соседство разрывается сразу, маршруты через соседа удаляются':'; но клиент '+(osp?'OSPF не зарегистрирован (добавьте ospf в команду bfd)':'не зарегистрирован — маршрутизация о отказе не узнает')));
  if(slow&&cl){io(`  Схождение быстрее в ${Math.round(slow/det)} раз; при потоке ${BF_PPS} пакетов/с потеряно ≈ ${Math.round(det/1000*BF_PPS)} вместо ≈ ${Math.round(slow/1000*BF_PPS)} пакетов`)}})}
{const _r=run;run=function(c){const s=String(c||'').trim(),a=s.split(/\s+/),w=a.map(x=>x.toLowerCase()),d=sel&&dv(sel);if(!d||d.t!=='rt')return _r(c);
 const cis=d.vend==='cisco',st=d.vm||{};
 if(cis&&st.m==='if'){const i=bfIfByName(d,st.n),f=d.ifaces[i];
  if(f&&w[0]==='bfd'&&w[1]==='interval'){const o=bfParse(a.slice(1),p);if(!o)return;if(!(o.interval&&o.min_rx&&o.multiplier))return p('% Формат: bfd interval <мс> min_rx <мс> multiplier <N>');bfSet(d,f,o);return}
  if(f&&w[0]==='ip'&&w[1]==='ospf'&&w[2]==='bfd'){if(!f.bfd)return p('% Сначала задайте таймеры: bfd interval 300 min_rx 300 multiplier 3');bfSet(d,f,{ospf:true});return}
  if(f&&w[0]==='no'&&w[1]==='bfd'){delete f.bfd;ch();return}
  if(f&&w[0]==='no'&&w[1]==='ip'&&w[2]==='ospf'&&w[3]==='bfd'){if(f.bfd)bfSet(d,f,{ospf:false});return}}
 if(w[0]==='show'&&w[1]==='bfd'&&(!w[2]||/^neighbors?$/.test(w[2])||w[2]==='summary')){return bfShow(d,p,/detail/.test(w[3]||w[2]||''))}
 if(!cis||st.m==='user'||st.m==='priv'||!d.vend){
  if(w[0]==='bfd'){const sub=w[1]||'';
   if(sub==='show'||!sub)return bfShow(d,p,true);
   if(sub==='fail')return bfFail(d,p,a[2]);
   const i=bfIfByName(d,a[1]);if(i<0)return p('Использование: bfd <интерфейс> [interval мс] [min_rx мс] [multiplier N] [ospf] [static] | bfd <интерфейс> off | bfd show | bfd fail [интерфейс]');
   const f=d.ifaces[i];if(!f.ip)return p('На интерфейсе '+f.n+' нет IP-адреса');
   if((w[2]||'')==='off'){delete f.bfd;ch();return p('BFD на '+f.n+' выключен')}
   const o=bfParse(a.slice(2),p);if(!o)return;bfSet(d,f,o);const s=bfSess(d,i);p(`BFD на ${f.n}: interval ${f.bfd.tx} мс, min_rx ${f.bfd.rx} мс, multiplier ${f.bfd.m}${f.bfd.ospf?', клиент OSPF':''}${f.bfd.static?', клиент static':''}. Сессия: ${s.st}${s.st==='Up'?', время обнаружения '+bfMs(s.det):' — '+s.why}`);return}}
 return _r(c)}}
CMDS.push(['bfd <интерфейс> [interval мс] [min_rx мс] [multiplier N] [ospf] [static] · bfd <интерфейс> off · bfd show · bfd fail [интерфейс] · show bfd neighbors [detail]; Cisco: bfd interval … min_rx … multiplier … и ip ospf bfd в режиме интерфейса','BFD — быстрое обнаружение отказа канала: сессия с соседом, согласование таймеров, время обнаружения; bfd fail показывает, насколько быстрее схождение, чем по таймерам OSPF','Быстрое обнаружение отказа BFD','Сессия BFD поднимается, когда настроена с обеих сторон. Время обнаружения = множитель соседа × согласованный интервал приёма (максимум из интервала передачи соседа и вашего min_rx). Клиенты (ospf, static) получают уведомление об отказе за доли секунды вместо десятков секунд по Dead Interval. Учебная модель: пределы 50–999 мс и множитель 3–50; пакеты BFD не моделируются, а bfd fail только объясняет отказ и не меняет состояние схемы.']);
const bfBase=pre=>({dev:[['pc','PC-A',40,200],['rt','R1',220,200],['rt','R2',420,200],['pc','PC-B',600,200]],link:[['PC-A',0,'R1',0],['R1',1,'R2',0],['R2',1,'PC-B',0]],
 cfg:[['PC-A','ip eth0 192.168.1.10 /24','gateway 192.168.1.1'],['PC-B','ip eth0 192.168.2.10 /24','gateway 192.168.2.1'],
  ['R1','ip gi0/0 192.168.1.1 /24','ip gi0/1 10.0.12.1 /30','ospf on',...(pre?['bfd gi0/1 interval 300 min_rx 300 multiplier 3 ospf']:[])],
  ['R2','ip gi0/0 10.0.12.2 /30','ip gi0/1 192.168.2.1 /24','ospf on']]});
TPL.push(Object.assign({n:'BFD: быстрое обнаружение отказа канала',d:'R1 и R2 соединены каналом с OSPF. На R1 BFD уже включён, на R2 нет: сессия не поднимается. Настройте BFD на R2 и сравните время обнаружения отказа с таймерами OSPF.',hint:'На R1: show bfd neighbors detail (причина Down), затем на R2: bfd gi0/0 interval 300 min_rx 300 multiplier 3 ospf. Выполните bfd fail gi0/1 на R1 и сравните время схождения. Измените multiplier и интервал и снова посмотрите время обнаружения. Попробуйте разные таймеры на сторонах (например, min_rx 500 на R2) и объясните, как они согласуются.'},bfBase(true)));
if(typeof EXNET!=='undefined')EXNET.push({n:'BFD: обнаружение отказа не дольше секунды',min:20,tag:'Маршрутизация',init:r=>({}),start:c=>{tplLoad(Object.assign({n:'BFD',hint:''},bfBase(false)));p('R1 и R2 соединены каналом, OSPF работает. Настройте BFD на обоих маршрутизаторах.')},
 text:c=>'Канал между R1 (10.0.12.1) и R2 (10.0.12.2) должен обнаруживать отказ не дольше 1 секунды и сообщать об этом OSPF. Настройте BFD на обоих маршрутизаторах (интерфейсы, смотрящие на этот канал) с подходящими таймерами и зарегистрируйте OSPF клиентом. Связь PC-A — PC-B должна работать. Проверьте результат командами show bfd neighbors detail и bfd fail.',
 crit:c=>{const R1=byNm('R1'),R2=byNm('R2'),A=byNm('PC-A'),I1=R1.ifaces.findIndex(f=>f.ip==='10.0.12.1'),I2=R2.ifaces.findIndex(f=>f.ip==='10.0.12.2'),S1=()=>I1<0?null:bfSess(R1,I1),S2=()=>I2<0?null:bfSess(R2,I2);
  return[['BFD включён на обоих маршрутизаторах',20,()=>I1>=0&&I2>=0&&!!R1.ifaces[I1].bfd&&!!R2.ifaces[I2].bfd],
  ['Сессия BFD в состоянии Up',20,()=>{const a=S1(),b=S2();return!!a&&!!b&&a.st==='Up'&&b.st==='Up'}],
  ['Время обнаружения отказа не больше 1 с в обе стороны',30,()=>{const a=S1(),b=S2();return!!a&&!!b&&a.st==='Up'&&b.st==='Up'&&a.det<=1000&&b.det<=1000}],
  ['OSPF зарегистрирован клиентом BFD на обеих сторонах',20,()=>I1>=0&&I2>=0&&!!R1.ifaces[I1].bfd&&R1.ifaces[I1].bfd.ospf&&!!R2.ifaces[I2].bfd&&R2.ifaces[I2].bfd.ospf],
  ['PC-A → PC-B',10,()=>{const a=S1();if(!a||a.st!=='Up')return false;computeRip();EX=[];return!!trip(A,'192.168.2.10').ok}]]}});
MAN.push(['Т69. BFD: быстрое обнаружение отказа канала',`<p><b>Проблема.</b> Протоколы маршрутизации замечают потерю соседа по таймерам: у OSPF по умолчанию Hello 10 с и Dead Interval 40 с. Если канал «тихо» перестал передавать пакеты, а интерфейсы остались в состоянии up (например, между маршрутизаторами стоит коммутатор или медиаконвертер), трафик теряется десятки секунд. Статический маршрут без track не заметит отказ вообще.</p>
<p><b>BFD</b> (Bidirectional Forwarding Detection) – лёгкий протокол, который с соседом обменивается короткими пакетами с интервалом в десятки или сотни миллисекунд. Если подряд не пришло заданное число пакетов (<i>multiplier</i>), сессия объявляется упавшей, и BFD сразу уведомляет зарегистрированные протоколы (OSPF, статические маршруты). Время обнаружения равно множителю соседа, умноженному на согласованный интервал приёма: максимум из интервала передачи соседа и вашего min_rx. Например, 3 × 300 мс = 900 мс вместо 40 с.</p>
<p><b>Команды Стектонии.</b> <code>bfd gi0/1 interval 300 min_rx 300 multiplier 3 ospf</code> (на обоих концах), <code>bfd gi0/1 off</code>, <code>show bfd neighbors detail</code>, <code>bfd fail gi0/1</code> – временная шкала отказа и сравнение с таймерами OSPF. Cisco: в режиме интерфейса <code>bfd interval 300 min_rx 300 multiplier 3</code> и <code>ip ospf bfd</code>, показ – <code>show bfd neighbors details</code>.</p>
<p><b>Типовые ошибки.</b> BFD включён только на одной стороне (сессия Down); не зарегистрирован клиент OSPF (BFD работает, а OSPF о нём не знает); слишком агрессивные таймеры дают ложные срабатывания при кратковременных потерях и нагружают процессор; разные min_rx и interval у сторон – время обнаружения определяется согласованием.</p>
<p><b>Ограничения модели.</b> Пакеты BFD не моделируются: состояние сессии определяется конфигурацией и состоянием интерфейсов; команда bfd fail только объясняет последствия отказа и не меняет схему. Пределы 50–999 мс и множитель 3–50 соответствуют типичным значениям, в реальных платформах зависят от оборудования.</p>`]);
