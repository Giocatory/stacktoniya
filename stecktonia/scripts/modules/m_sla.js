// ===== m_sla (v91): IP SLA (icmp-echo) и track — маршрут действует, пока цель достижима =====
let SLA_IN=0;const SLA_C=new Map();
{const _t=trip;trip=function(){if(!SLA_IN)SLA_C.clear();return _t.apply(this,arguments)}}
function slaProbe(d,id){const s=d.sla&&d.sla[id];if(!s)return false;const sv={EX,REP,NAT},nl=typeof SPAN_LOG!=='undefined'?SPAN_LOG.length:0,so=srcIp,sip=s.src&&d.ifaces.some(f=>f.ip===s.src)?s.src:null;
 if(sip)srcIp=function(x){return x===d?sip:so(x)};SLA_IN++;let ok=false;
 try{ok=!!trip(d,s.dst).ok}catch(e){ok=false}finally{SLA_IN--;srcIp=so;EX=sv.EX;REP=sv.REP;NAT=sv.NAT;if(typeof SPAN_LOG!=='undefined')SPAN_LOG.length=nl}return ok}
function trackUp(d,n){if(SLA_IN>0)return true;const t=d.track&&d.track[n];if(!t)return true;const k=d.id+':'+n;if(SLA_C.has(k))return SLA_C.get(k);const v=slaProbe(d,t.sla);SLA_C.set(k,v);return v}
const slaOk=(d,n)=>{SLA_C.clear();return trackUp(d,n)};
function slaShow(d,io,what){const S1=Object.keys(d.sla||{}),T1=Object.keys(d.track||{});SLA_C.clear();
 if(what==='sla'){if(!S1.length)return io('IP SLA не настроен. Пример: sla 1 icmp-echo 192.168.2.10 ; track 1 sla 1 ; route add … track 1');
  return S1.forEach(n=>{const s=d.sla[n],ok=slaProbe(d,n);io(`IPSLA operation id: ${n}\n  Type of operation: icmp-echo\n  Target: ${s.dst}${s.src?'  Source: '+s.src:''}\n  Latest operation return code: ${ok?'OK':'Timeout'}`)})}
 if(!T1.length)return io('Объектов track нет. Пример: sla 1 icmp-echo 192.168.2.10 ; track 1 sla 1');
 T1.forEach(n=>{const t=d.track[n],up=trackUp(d,n),u=d.routes.filter(r=>r.track==n).map(r=>`${r.net}/${plen(r.mask)} via ${r.nh}`);io(`Track ${n}\n  IP SLA ${t.sla} reachability (цель ${d.sla&&d.sla[t.sla]?d.sla[t.sla].dst:'—'})\n  Reachability is ${up?'Up':'Down'}\n  Привязанные маршруты: ${u.join(', ')||'нет'}`)})}
function slaCmd(d,a,io){const k=a[0].toLowerCase();
 if(k==='sla'){const n=a[1];if(!/^\d{1,3}$/.test(n||''))return io('Использование: sla <1–999> icmp-echo <ip> [source <ip>] | sla <n> off | show sla');
  if(a[2]==='off'){if(d.sla)delete d.sla[n];ch();return io('IP SLA '+n+' удалён')}
  if(a[2]!=='icmp-echo'||!/^\d+\.\d+\.\d+\.\d+$/.test(a[3]||''))return io('Использование: sla <n> icmp-echo <ip> [source <ip>]');
  let src=null;if(a[4]==='source'){src=a[5];if(!d.ifaces.some(f=>f.ip===src))return io('Адрес источника не принадлежит устройству')}
  (d.sla=d.sla||{})[n]={dst:a[3],...(src?{src}:{})};ch();return io(`IP SLA ${n}: icmp-echo ${a[3]} — проверка выполняется в момент выбора маршрута`)}
 if(k==='track'){const n=a[1];if(!/^\d{1,3}$/.test(n||''))return io('Использование: track <n> sla <m> | track <n> off | show track');
  if(a[2]==='off'){if(d.track)delete d.track[n];ch();return io('track '+n+' удалён')}
  const sl=/^ip$/i.test(a[2])?a[4]:a[3];const kw=/^ip$/i.test(a[2])?a[3]:a[2];if(!/^sla$/i.test(kw||'')||!/^\d+$/.test(sl||''))return io('Использование: track <n> sla <m> [reachability]');
  if(!d.sla||!d.sla[sl])return io('% IP SLA '+sl+' не настроен');(d.track=d.track||{})[n]={sla:sl};ch();return io(`track ${n}: IP SLA ${sl} reachability`)}}
{const _r=run;run=function(c){const s=String(c).trim(),a=s.split(/\s+/),d=sel&&dv(sel);
 if(d&&d.t==='rt'){const st=d.vm||{};
  if(d.vend==='cisco'&&st.m==='sla'){const w=a.map(x=>x.toLowerCase());
   if(w[0]==='icmp-echo'&&/^\d+\.\d+\.\d+\.\d+$/.test(a[1]||'')){let src=null;if(w[2]==='source-ip')src=a[3];(d.sla=d.sla||{})[st.n]={dst:a[1],...(src&&d.ifaces.some(f=>f.ip===src)?{src}:{})};ch();return}
   if(['frequency','timeout','threshold','tag','request-data-size','tos'].includes(w[0]))return;
   if(w[0]==='exit'){d.vm={m:'conf'};vcPs&&vcPs(d);return}if(w[0]==='end'){d.vm={m:'priv'};vcPs&&vcPs(d);return}
   return p('% Допустимо в режиме ip sla: icmp-echo <ip> [source-ip <ip>], frequency, timeout, exit')}
  if(d.vend==='cisco'&&st.m==='conf'){const w=a.map(x=>x.toLowerCase());
   if(w[0]==='ip'&&w[1]==='sla'&&/^\d+$/.test(a[2]||'')&&!w[3]){d.vm={m:'sla',n:a[2]};vcPs&&vcPs(d);return}
   if(w[0]==='ip'&&w[1]==='sla'&&w[2]==='schedule')return;
   if(w[0]==='track'&&/^\d+$/.test(a[1]||'')&&/^(ip|sla)$/.test(w[2]||''))return slaCmd(d,a,p);
   if(w[0]==='no'&&w[1]==='track'&&/^\d+$/.test(a[2]||''))return slaCmd(d,['track',a[2],'off'],p);
   if(w[0]==='no'&&w[1]==='ip'&&w[2]==='sla'&&/^\d+$/.test(a[3]||''))return slaCmd(d,['sla',a[3],'off'],p)}
  if(/^(sla|track)$/i.test(a[0]))return slaCmd(d,a,p);
  if(/^(show|sh)$/i.test(a[0])){const w=a.slice(1).join(' ').toLowerCase();
   if(w==='track'||w==='tracks')return slaShow(d,p,'track');
   if(w==='sla'||/^ip sla (statistics|configuration|summary)/.test(w))return slaShow(d,p,'sla')}}
 return _r(c)}}
CMDS.push(['sla','sla <n> icmp-echo <ip> [source <ip>] · track <n> sla <m> · route add … track <n> · show track · show sla; Cisco: ip sla N / icmp-echo / track N ip sla M reachability / ip route … track N','Отслеживание достижимости (IP SLA + track)','Статический маршрут с track действует, только пока проверка IP SLA (icmp-echo) успешна. Так маршрутизатор переключается на резервный путь, когда обрывается связь за соседним узлом, а не только собственный кабель.']);
const slaScn=()=>{const b=prFloat(true);b.cfg=b.cfg.map(x=>x.slice());
 const r1=b.cfg.find(x=>x[0]==='R1'),r4=b.cfg.find(x=>x[0]==='R4');
 const i1=r1.findIndex(c=>c==='route add 192.168.2.0 /24 10.0.12.2'),i4=r4.findIndex(c=>c==='route add 192.168.1.0 /24 10.0.24.1');
 return{dev:b.dev,link:b.link,cfg:b.cfg,i1,i4,r1,r4}};
function slaBuild(track){const b=slaScn();if(track){b.r1[b.i1]='route add 192.168.2.0 /24 10.0.12.2 track 1';b.r1.push('sla 1 icmp-echo 192.168.2.10','track 1 sla 1');b.r4[b.i4]='route add 192.168.1.0 /24 10.0.24.1 track 1';b.r4.push('sla 1 icmp-echo 192.168.1.10','track 1 sla 1')}return{dev:b.dev,link:b.link,cfg:b.cfg}}
TPL.push(Object.assign({n:'Отказоустойчивый шлюз: IP SLA и track',d:'Основной путь через R2 отслеживается проверкой IP SLA до удалённого узла. Если за R2 пропадает связь (порт R2 к R4), track падает и включается резервный путь через R3, даже когда кабель к R2 исправен.',hint:'Проверьте ping PC-A → PC-B (путь через R2), show track на R1. Затем выключите порт R2 к R4 (на R2: shutdown gi0/1) и повторите ping: track перейдёт в Down и трафик пойдёт через R3. Сравните с версией без track.'},slaBuild(true)));
if(typeof EXNET!=='undefined')EXNET.push({n:'Отказоустойчивость: IP SLA и track',min:20,tag:'Маршрутизация',init:r=>({}),
 start:c=>{tplLoad(Object.assign({n:'SLA',hint:''},slaBuild(false)));const R2=byNm('R2');R2.ifaces[1].off=true;ch();p('Порт R2 gi0/1 (к R4) неисправен, но R1 и R4 об этом не знают и продолжают слать трафик на R2. Настройте IP SLA и track.')},
 text:c=>'Между офисами два пути: основной через R2 и резервный через R3 (плавающие маршруты с AD 200 уже настроены). Порт R2 к R4 вышел из строя, но кабели к R2 исправны, поэтому основные маршруты остаются активными и связь не работает. Настройте на R1 проверку IP SLA (icmp-echo до 192.168.2.10) и на R4 (до 192.168.1.10), привяжите к ним track 1 и свяжите основные статические маршруты с track 1 (route add … track 1). Резервные маршруты не менять.',
 crit:c=>{const R1=byNm('R1'),R4=byNm('R4'),A=byNm('PC-A'),B=byNm('PC-B');
  const bound=(d,net,nh)=>d.routes.some(r=>r.net===net&&r.nh===nh&&r.track&&d.track&&d.track[r.track]&&d.sla&&d.sla[d.track[r.track].sla]);
  return[['R1: основной маршрут к 192.168.2.0/24 привязан к track с IP SLA',20,()=>bound(R1,'192.168.2.0','10.0.12.2')],
  ['R4: основной маршрут к 192.168.1.0/24 привязан к track с IP SLA',20,()=>bound(R4,'192.168.1.0','10.0.24.1')],
  ['PC-A → PC-B проходит через R3',35,()=>{EX=[];const r=trip(A,'192.168.2.10');return!!r.ok&&(r.tr||[]).some(x=>x.name==='R3')}],
  ['Обратный ping PC-B → PC-A проходит',15,()=>{EX=[];return!!trip(B,'192.168.1.10').ok}],
  ['Резервные маршруты (AD 200) сохранены',10,()=>R1.routes.some(r=>r.ad===200&&r.nh==='10.0.13.2')&&R4.routes.some(r=>r.ad===200&&r.nh==='10.0.34.1')]]}});
MAN.push(['Т60. IP SLA и track: отказоустойчивые маршруты',`<p><b>Проблема плавающих маршрутов.</b> Резервный статический маршрут включается, только когда <i>основной next-hop исчезает локально</i> (кабель, порт). Если неисправность дальше — за соседним маршрутизатором, — next-hop остаётся доступным, основной маршрут действует, а трафик пропадает.</p>
<p><b>Решение: IP SLA + track.</b> IP SLA периодически посылает проверочный ICMP-запрос до удалённой цели; объект track следит за результатом; статический маршрут, привязанный к track, действует, только пока цель отвечает. Когда проверка не проходит, маршрут выводится из таблицы и вступает резервный.</p>
<p><b>Команды Стектонии.</b> <code>sla 1 icmp-echo 192.168.2.10 [source ip]</code>, <code>track 1 sla 1</code>, <code>route add 192.168.2.0 /24 10.0.12.2 track 1</code>, проверка <code>show track</code>, <code>show sla</code>; в таблице <code>route</code> у привязанного маршрута отображается <code>[track 1: up|DOWN]</code>. Синтаксис Cisco: <code>ip sla 1</code> → <code>icmp-echo 192.168.2.10</code> → <code>exit</code>; <code>ip sla schedule 1 life forever start-time now</code>; <code>track 1 ip sla 1 reachability</code>; <code>ip route 192.168.2.0 255.255.255.0 10.0.12.2 track 1</code>.</p>
<p><b>Практика.</b> Шаблон «Отказоустойчивый шлюз: IP SLA и track»: выключите порт R2 к R4 и сравните поведение с версией без track.</p>
<p><b>Ограничения модели.</b> Проверка выполняется в момент выбора маршрута (без таймеров frequency/timeout и задержек track); других типов проверок (http, udp-jitter) и логических условий нет.</p>`]);
