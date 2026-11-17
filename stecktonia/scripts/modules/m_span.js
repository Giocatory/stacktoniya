// ===== m_span (v90): SPAN (зеркалирование портов), журнал кадров и команда sniff на узле-анализаторе =====
const SPAN_LOG=[];let SPAN_SEQ=0;
{const _t=trip;trip=function(){const ref=EX,n0=EX.length;const r=_t.apply(this,arguments);try{const e=EX===ref?EX.slice(n0):EX.slice();if(e.length){SPAN_LOG.push({q:++SPAN_SEQ,ev:e.map(x=>({p:x.p,x:x.x,rep:x.rep,err:x.err}))});if(SPAN_LOG.length>200)SPAN_LOG.shift()}}catch(_){}return r}}
const spIf=(d,n)=>d.ifaces.findIndex(f=>f.n.toLowerCase()===String(n||'').toLowerCase());
const spNeighbor=(d,n)=>{const i=spIf(d,n);const q=i<0?null:peer(d,i);return q&&q.d};
function spSessions(){const o=[];S.devs.forEach(d=>{if(d.t==='sw'&&d.span)Object.keys(d.span).forEach(k=>o.push({d,k,s:d.span[k]}))});return o}
function spProto(ev){const t=ev.map(e=>e.x).join(' ');return/ICMP/.test(t)?'ICMP':/TCP|HTTP/i.test(t)?'TCP':/UDP|DNS/i.test(t)?'UDP':'IP'}
function spCapture(H){const out=[],ss=spSessions().filter(x=>x.s.dst&&spNeighbor(x.d,x.s.dst)===H);
 SPAN_LOG.forEach(en=>{const rows=simAug(en.ev),pr=spProto(en.ev);rows.forEach(r=>{if(r.kind!=='hop')return;const a=r.ds,why=[];
  if(a[0]===H||a[a.length-1]===H)why.push('кадр моего узла');
  ss.forEach(x=>{const k=a.indexOf(x.d);if(k<=0||k>=a.length-1)return;(x.s.src||[]).forEach(s=>{const nb=spNeighbor(x.d,s.n);if(nb===a[k-1]&&s.dir!=='tx')why.push(`SPAN ${x.d.name} сессия ${x.k}: ${s.n} rx`);else if(nb===a[k+1]&&s.dir!=='rx')why.push(`SPAN ${x.d.name} сессия ${x.k}: ${s.n} tx`)})});
  if(why.length)out.push({q:en.q,r,pr,why:why[why.length-1],span:why.some(w=>/^SPAN/.test(w))})})});
 return out}
function spShow(d,io){const k=d.span?Object.keys(d.span):[];if(!k.length){io('Сессий SPAN нет. Пример: span 1 source fa0/1 both  →  span 1 destination fa0/3');return}
 k.forEach(n=>{const s=d.span[n];io(`Сессия ${n}\n  источники: ${(s.src||[]).map(x=>x.n+' ('+x.dir+')').join(', ')||'— не заданы —'}\n  порт-приёмник: ${s.dst||'— не задан —'}`+(s.dst&&!(spNeighbor(d,s.dst))?'\n  ⚠ к порту-приёмнику не подключён кабель с анализатором':''))})}
function spCmd(d,a,io){const n=a[1];const s0=d.span=d.span||{};
 if(!n)return spShow(d,io);if(!/^[1-4]$/.test(n))return io('Номер сессии 1–4');
 if(a[2]==='off'){delete s0[n];if(!Object.keys(s0).length)delete d.span;ch();return io('Сессия '+n+' удалена')}
 const sess=s0[n]=s0[n]||{src:[],dst:''};
 if(/^(source|src)$/i.test(a[2]||'')){const i=spIf(d,a[3]);if(i<0)return io('Нет порта '+(a[3]||''));const dir=(a[4]||'both').toLowerCase();if(!['rx','tx','both'].includes(dir))return io('Направление: rx, tx или both');
  if(sess.dst&&sess.dst.toLowerCase()===d.ifaces[i].n.toLowerCase())return io('Порт-источник не может быть портом-приёмником');
  sess.src=sess.src.filter(x=>x.n!==d.ifaces[i].n);sess.src.push({n:d.ifaces[i].n,dir});ch();return io(`Сессия ${n}: источник ${d.ifaces[i].n} (${dir})`)}
 if(/^(destination|dest|dst)$/i.test(a[2]||'')){const i=spIf(d,a[3]);if(i<0)return io('Нет порта '+(a[3]||''));if(sess.src.some(x=>x.n===d.ifaces[i].n))return io('Порт-приёмник не может быть источником');
  sess.dst=d.ifaces[i].n;ch();return io(`Сессия ${n}: порт-приёмник ${sess.dst}. Подключите к нему анализатор (IDS, ПК с sniff). Обычный трафик через этот порт в реальных коммутаторах не передаётся.`)}
 if(!Object.keys(sess).length||(!sess.src.length&&!sess.dst))delete s0[n];io('Использование: span <1–4> source <порт> [rx|tx|both] | span <1–4> destination <порт> | span <1–4> off | span (показать)')}
function spSniff(H,a,io){if(a[1]==='clear'){SPAN_LOG.length=0;return io('Журнал захвата очищен')}const n=Math.min(100,+a[1]||30);const c=spCapture(H);
 const ss=spSessions().filter(x=>x.s.dst&&spNeighbor(x.d,x.s.dst)===H);
 io(ss.length?`Анализатор ${H.name} на зеркальном порту: ${ss.map(x=>x.d.name+' сессия '+x.k+' ('+x.s.dst+')').join('; ')}`:`${H.name}: зеркального порта нет — коммутатор доставляет только кадры, адресованные этому узлу (и широковещательные). Для анализа чужого трафика настройте SPAN: span 1 source <порт> / span 1 destination <порт> на коммутаторе.`);
 if(!c.length)return io('Кадров нет. Сгенерируйте трафик (ping с других узлов) и повторите sniff.');
 io('№    Путь                         MAC источник → назначение                  IP источник → назначение              Прот. TTL  Причина');
 c.slice(-n).forEach(x=>{const r=x.r;io(String(x.q).padEnd(5)+r.ds.map(z=>z.name).join('>').slice(0,28).padEnd(29)+(r.smac+' → '+r.dmac).padEnd(42)+(r.sip+' → '+r.dip).padEnd(37)+x.pr.padEnd(6)+String(r.ttl).padEnd(4)+x.why)});
 io(`Всего кадров: ${c.length}${c.some(x=>x.span)?'':' (зеркальных нет — только свои)'}`)}
{const _r=run;run=function(c){const s=String(c).trim(),a=s.split(/\s+/),d=sel&&dv(sel);
 if(d&&d.t==='sw'){
  if(/^span$/i.test(a[0]))return spCmd(d,a,p);
  if(/^(show|sh)$/i.test(a[0])&&/^(span|monitor)$/i.test(a[1]||''))return spShow(d,p);
  if(/^monitor$/i.test(a[0])&&/^session$/i.test(a[1]||'')){const m=a.slice(0,3);const w=a.slice(3).filter(x=>!/^interface$/i.test(x));return spCmd(d,['span',a[2],...w],p)}
  if(/^no$/i.test(a[0])&&/^monitor$/i.test(a[1]||'')&&/^session$/i.test(a[2]||''))return spCmd(d,['span',a[3],'off'],p)}
 if(d&&d.t==='pc'&&/^sniff$/i.test(a[0]))return spSniff(d,a,p);
 return _r(c)}}
CMDS.push(['span','span <1–4> source <порт> [rx|tx|both] · span <1–4> destination <порт> · span <1–4> off · show span (коммутатор); Cisco: monitor session N source|destination interface …','Зеркалирование портов (SPAN)','Коммутатор копирует кадры исходного порта на порт-приёмник, к которому подключён анализатор (IDS, ПК). Без SPAN узел видит только свой трафик.']);
CMDS.push(['sniff','sniff [N] · sniff clear (ПК-анализатор)','Просмотр захваченных кадров на узле','Показывает кадры, которые получил узел: свои и (если на коммутаторе настроен SPAN на его порт) зеркальные, с MAC, IP, протоколом и TTL.']);
// ---- шаблон, задание, инструкция ----
const spScn=()=>({dev:[['pc','PC-A',60,120],['pc','PC-B',60,300],['sw','SW1',260,210],['pc','PC-IDS',460,210],['rt','R1',460,60]],link:[['PC-A',0,'SW1',0],['PC-B',0,'SW1',1],['PC-IDS',0,'SW1',2],['R1',0,'SW1',3]],
 cfg:[['PC-A','ip eth0 192.168.1.10 /24','gateway 192.168.1.1'],['PC-B','ip eth0 192.168.1.20 /24','gateway 192.168.1.1'],['PC-IDS','ip eth0 192.168.1.250 /24','gateway 192.168.1.1'],['R1','ip gi0/0 192.168.1.1 /24']]});
TPL.push(Object.assign({n:'SPAN: анализатор трафика (IDS) на зеркальном порту',d:'Коммутатор SW1 соединяет PC-A, PC-B, PC-IDS и маршрутизатор. PC-IDS по умолчанию видит только свой трафик; нужно настроить зеркалирование.',hint:'Выберите PC-A и выполните ping 192.168.1.20, затем на PC-IDS команду sniff: чужих кадров нет. Настройте на SW1 span 1 source <порт PC-A> both и span 1 destination <порт PC-IDS>, повторите ping и sniff.'},spScn()));
if(typeof EXNET!=='undefined')EXNET.push({n:'SPAN: подключить IDS к зеркальному порту',min:15,tag:'Безопасность',init:r=>({}),start:c=>{tplLoad(Object.assign({n:'SPAN',hint:''},spScn()));p('PC-IDS должен видеть трафик PC-A. Настройте SPAN на SW1 (команда span). Проверка: sniff на PC-IDS.')},
 text:c=>'Сервер безопасности PC-IDS подключён к коммутатору SW1, но не видит трафик других узлов. Настройте зеркалирование: источник — порт, к которому подключён PC-A (направление both), приёмник — порт, к которому подключён PC-IDS. Обычная связь узлов не должна нарушиться.',
 crit:c=>{const SW=byNm('SW1'),A=byNm('PC-A'),B=byNm('PC-B'),I=byNm('PC-IDS');const pa=SW.ifaces.findIndex((f,i)=>{const q=peer(SW,i);return q&&q.d===A}),pi=SW.ifaces.findIndex((f,i)=>{const q=peer(SW,i);return q&&q.d===I});
  const seen=(who,pred)=>{SPAN_LOG.length=0;EX=[];trip(A,'192.168.1.20');return spCapture(I).some(pred)};
  return[['Создана сессия SPAN с портом-приёмником к PC-IDS',30,()=>Object.values(SW.span||{}).some(s=>s.dst&&s.dst===(SW.ifaces[pi]||{}).n)],
  ['Источник зеркалирования — порт PC-A',20,()=>Object.values(SW.span||{}).some(s=>(s.src||[]).some(x=>x.n===(SW.ifaces[pa]||{}).n))],
  ['PC-IDS видит чужие кадры ping PC-A → PC-B (зеркало)',35,()=>seen(I,x=>x.span&&x.r.sip==='192.168.1.10'&&x.r.dip==='192.168.1.20')],
  ['Связь PC-A ↔ PC-B сохранилась',15,()=>{EX=[];return!!trip(A,'192.168.1.20').ok&&!!trip(B,'192.168.1.10').ok}]]}});
MAN.push(['Т59. SPAN: зеркалирование портов и анализ трафика',`<p><b>Проблема.</b> Коммутатор доставляет кадр только на порт получателя, поэтому подключённый к нему анализатор (IDS, ПК с Wireshark) чужого трафика не видит — в отличие от старых концентраторов. <b>SPAN</b> (Switched Port Analyzer, «зеркалирование портов») копирует кадры выбранных портов на порт-приёмник, к которому подключают анализатор.</p>
<p><b>Настройка.</b> На коммутаторе: <code>span 1 source fa0/1 both</code> (направления <code>rx</code> — входящие, <code>tx</code> — исходящие, <code>both</code> — оба), <code>span 1 destination fa0/3</code>, проверка <code>show span</code>, удаление <code>span 1 off</code>. Синтаксис Cisco: <code>monitor session 1 source interface fa0/1 both</code>, <code>monitor session 1 destination interface fa0/3</code>. Источник не может быть приёмником.</p>
<p><b>Анализ.</b> На узле-анализаторе команда <code>sniff [N]</code> показывает кадры: путь, MAC источника и назначения, IP, протокол, TTL и причину попадания в захват (свой кадр или зеркало SPAN). Без SPAN в списке только собственный трафик узла.</p>
<p><b>Где применяют.</b> IDS/IPS и системы мониторинга безопасности, разбор инцидентов, диагностика сетевых проблем. Для безопасности важно: порт-приёмник защищают от посторонних подключений, а доступ к зеркалу ограничивают — на нём виден весь трафик, в том числе незашифрованный.</p>
<p><b>Ограничения модели.</b> Зеркалируются кадры ping и других передач, построенные по событиям модели; ARP-кадры отдельно не показываются; порт-приёмник сохраняет обычную коммутацию; нет RSPAN/ERSPAN, фильтров VLAN и потери кадров при перегрузке.</p>`]);
