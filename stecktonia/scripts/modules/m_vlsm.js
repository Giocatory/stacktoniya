// ===== m_vlsm (v103): калькулятор подсетей, распределение VLSM, тренажёр адресации с проверкой =====
const vsP=s=>{const m=/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/.exec(String(s||'').trim());if(!m||ip2n(m[1])==null)return null;const l=+m[2];if(l>32)return null;const mask=l?((0xFFFFFFFF<<(32-l))>>>0):0,ip=ip2n(m[1])>>>0;return{ip,l,mask,net:(ip&mask)>>>0,bc:((ip&mask)|(~mask>>>0))>>>0}};
const vsHosts=l=>l>=32?1:l===31?2:Math.pow(2,32-l)-2;
const vsPrefix=h=>{let k=2;while(Math.pow(2,k)-2<h)k++;return 32-k};
const vsBin=n=>[24,16,8,0].map(s=>((n>>>s)&255).toString(2).padStart(8,'0')).join('.');
const vsKind=ip=>{const a=ip>>>24,b=(ip>>>16)&255;return a===10||(a===172&&b>=16&&b<32)||(a===192&&b===168)?'частный (RFC 1918)':a===127?'loopback':a===169&&b===254?'link-local (APIPA)':a===100&&b>=64&&b<128?'общий CGNAT (100.64.0.0/10)':a>=224&&a<240?'multicast':a>=240?'зарезервирован':a===0?'«этот» адрес':'публичный'};
function vsCalc(s,io){const x=vsP(s);if(!x)return io('Использование: subcalc <ip>/<длина>   например subcalc 192.168.10.77/26');
 const wild=(~x.mask)>>>0,role=x.l<31&&x.ip===x.net?'адрес сети (хосту назначать нельзя)':x.l<31&&x.ip===x.bc?'широковещательный адрес (хосту назначать нельзя)':'адрес хоста';
 io(`Адрес:          ${n2ip(x.ip)}/${x.l} — ${role}`);io(`Маска:          ${n2ip(x.mask)}  (${vsBin(x.mask)})`);io(`Обратная маска: ${n2ip(wild)}`);
 io(`Сеть:           ${n2ip(x.net)}/${x.l}`);io(x.l<31?`Широковещат.:   ${n2ip(x.bc)}`:'Широковещат.:   нет (для /31 и /32 не используется)');
 io(x.l<31?`Хосты:          ${n2ip(x.net+1)} – ${n2ip(x.bc-1)}`:`Адреса:         ${n2ip(x.net)} – ${n2ip(x.bc)}`);io(`Число хостов:   ${vsHosts(x.l)}`+(x.l===31?' (канал точка-точка, RFC 3021)':''));io(`Тип:            ${vsKind(x.ip)}`)}
function vsAlloc(base,needs){const L=needs.map((h,i)=>({i,h,l:vsPrefix(h)})).sort((a,b)=>a.l-b.l||a.i-b.i),res=[];let cur=base.net;
 for(const x of L){const sz=Math.pow(2,32-x.l);cur=Math.ceil(cur/sz)*sz;if(cur+sz-1>base.bc){res.push({...x,fail:true});continue}res.push({...x,net:cur,bc:cur+sz-1});cur+=sz}return res}
function vsVlsm(a,io){const base=vsP(a[0]),needs=a.slice(1).map(x=>+x);
 if(!base||!needs.length||needs.length>32||needs.some(h=>!Number.isInteger(h)||h<1||h>1e9))return io('Использование: vlsm <сеть>/<длина> <хостов1> <хостов2> …   например vlsm 192.168.10.0/24 100 50 20 2');
 const R=vsAlloc(base,needs);io(`Распределение ${n2ip(base.net)}/${base.l} (хостов в сети: ${vsHosts(base.l)}). Сначала самые большие подсети:`);io('Треб. Подсеть            Маска            Диапазон хостов                 Свободно');
 let used=0;R.forEach(r=>{if(r.fail)return io(`${String(r.h).padEnd(5)} — не помещается: не хватает адресного пространства`);used+=Math.pow(2,32-r.l);
  io(`${String(r.h).padEnd(5)} ${(n2ip(r.net)+'/'+r.l).padEnd(18)} ${n2ip((0xFFFFFFFF<<(32-r.l))>>>0).padEnd(16)} ${(n2ip(r.net+1)+' – '+n2ip(r.bc-1)).padEnd(31)} ${vsHosts(r.l)-r.h}`)});
 const f=R.filter(r=>r.fail).length;if(f)io(`Итог: ${f} подсет${f===1?'ь':'ей'} не поместилось. Нужно блоков: ${needs.reduce((s,h)=>s+Math.pow(2,32-vsPrefix(h)),0)} адресов при доступных ${Math.pow(2,32-base.l)}. Выберите сеть покрупнее.`);
 else io(`Итог: занято ${used} из ${Math.pow(2,32-base.l)} адресов, свободно ${Math.pow(2,32-base.l)-used}. В таблице подсети идут от большей к меньшей; на схеме распределяйте их как нужно.`)}
let VS_T=null;
function vsNew(lvl){const lv={'легко':[3,[2,30]],'средне':[4,[2,100]],'сложно':[5,[2,200]]}[lvl]||[4,[2,100]];
 for(let t=0;t<200;t++){const base=lvl==='сложно'?vsP(`172.16.${Math.floor(Math.random()*16)*4}.0/22`):vsP(`192.168.${1+Math.floor(Math.random()*200)}.0/24`),needs=Array.from({length:lv[0]},()=>lv[1][0]+Math.floor(Math.random()*(lv[1][1]-lv[1][0]+1)));
  if(vsAlloc(base,needs).every(r=>!r.fail))return{base,needs}}return{base:vsP('192.168.1.0/24'),needs:[50,20,10]}}
function vsTask(a,io){const s=(a[0]||'').toLowerCase();
 if(!s||s==='new'||['легко','средне','сложно'].includes(s)){VS_T=vsNew(['легко','средне','сложно'].includes(s)?s:(a[1]||'').toLowerCase());
  io(`Задача. Сеть ${n2ip(VS_T.base.net)}/${VS_T.base.l}. Нужно разбить её на подсети под требуемое число хостов:`);VS_T.needs.forEach((h,i)=>io(`  ${i+1}) ${h} хостов`));
  return io('Ответ: subtask answer <сеть/длина> … по одной подсети на каждое требование в том же порядке (минимально возможной длины, без пересечений). Подсказки: subcalc, vlsm; решение: subtask show.')}
 if(!VS_T)return io('Задачи ещё нет. Начните: subtask new [легко|средне|сложно]');
 if(s==='show'){io('Эталонное решение (один из вариантов):');const R=vsAlloc(VS_T.base,VS_T.needs).sort((a,b)=>a.i-b.i);return R.forEach(r=>io(`  ${r.i+1}) ${VS_T.needs[r.i]} хостов → ${n2ip(r.net)}/${r.l}`))}
 if(s==='answer'){const ans=a.slice(1).map(vsP),n=VS_T.needs.length;if(ans.length!==n||ans.some(x=>!x))return io(`Нужно ${n} подсетей в формате a.b.c.d/N, по порядку требований. Пример: subtask answer 192.168.1.0/26 …`);
  let ok=0;ans.forEach((x,i)=>{const h=VS_T.needs[i],need=vsPrefix(h),why=[];
   if(x.ip!==x.net)why.push('адрес не является адресом сети');if(x.net<VS_T.base.net||x.bc>VS_T.base.bc)why.push('выходит за пределы исходной сети');
   if(x.l>need)why.push(`мала: /${x.l} даёт ${vsHosts(x.l)} хостов, нужно ${h}`);else if(x.l<need)why.push(`слишком велика: достаточно /${need} (${vsHosts(need)} хостов)`);
   ans.forEach((y,j)=>{if(j!==i&&x.net<=y.bc&&y.net<=x.bc&&(j>i||!why.length))if(j>i)why.push(`пересекается с подсетью ${j+1}`)});
   if(!why.length)ok++;io(`  ${i+1}) ${n2ip(x.ip)}/${x.l}: `+(why.length?'✖ '+why.join('; '):'✔'))});
  return io(ok===n?`Верно: ${ok} из ${n}. Задача решена.`:`Верно: ${ok} из ${n}. Исправьте ответ и проверьте снова (subtask show — эталон).`)}
 io('Использование: subtask new [легко|средне|сложно] | subtask answer <сеть/N> … | subtask show')}
{const _r=run;run=function(c){const a=String(c||'').trim().split(/\s+/),w=(a[0]||'').toLowerCase();
 if(w==='subcalc')return vsCalc(a[1],p);if(w==='vlsm')return vsVlsm(a.slice(1),p);if(w==='subtask')return vsTask(a.slice(1),p);return _r(c)}}
CMDS.push(['subcalc <ip>/<N> · vlsm <сеть>/<N> <хостов> … · subtask new [легко|средне|сложно] | answer <сеть/N> … | show','Калькулятор подсетей, распределение VLSM и тренажёр адресации с проверкой ответа','Подсети и VLSM','subcalc показывает маску, сеть, широковещательный адрес, диапазон хостов и тип адреса. vlsm распределяет сеть под заданное число хостов (сначала самые большие подсети, выравнивание по границам). subtask выдаёт случайную задачу и проверяет ответ: минимальная длина префикса, нет выхода за сеть и пересечений.']);
const vsBase=()=>({dev:[['pc','PC-A',40,200],['rt','R1',220,200],['rt','R2',420,200],['pc','PC-B',600,200]],link:[['PC-A',0,'R1',0],['R1',1,'R2',0],['R2',1,'PC-B',0]],cfg:[['R1','ospf on'],['R2','ospf on']]});
TPL.push(Object.assign({n:'VLSM: три сети из одного блока',d:'Из сети 192.168.20.0/24 нужно выделить подсеть для 60 хостов (PC-A), для 25 хостов (PC-B) и /30 для канала между маршрутизаторами. Адресов на схеме пока нет, OSPF включён.',hint:'Выполните vlsm 192.168.20.0/24 60 25 2, назначьте адреса интерфейсам (ip gi0/0 … /26) и компьютерам, затем проверьте ping PC-A → PC-B и subcalc для каждого адреса. Рядом потренируйтесь: subtask new средне.'},vsBase()));
if(typeof EXNET!=='undefined')EXNET.push({n:'VLSM: разметить сеть по требованиям',min:20,tag:'Адресация',init:r=>({}),start:c=>{tplLoad(Object.assign({n:'VLSM',hint:''},vsBase()));p('Схема без адресов. Разметьте сеть 192.168.20.0/24 и настройте узлы.')},
 text:c=>'Из блока 192.168.20.0/24 выделите подсети минимально возможной длины: для сети PC-A (R1 gi0/0) нужно 60 хостов, для сети PC-B (R2 gi0/1) – 25 хостов, для канала R1 gi0/1 – R2 gi0/0 – /30. Подсети не должны пересекаться. Назначьте адреса интерфейсам и компьютерам (шлюзы – адреса маршрутизаторов), OSPF уже включён. PC-A и PC-B должны пинговать друг друга. Рассчитать разбиение поможет vlsm.',
 crit:c=>{const R1=byNm('R1'),R2=byNm('R2'),A=byNm('PC-A'),B=byNm('PC-B'),ic=(d,n)=>d.ifaces.find(f=>f.n===n),g=(d,n)=>{const f=ic(d,n);return f&&f.ip&&f.mask?vsP(f.ip+'/'+plen(f.mask)):null},
  nets=()=>[g(R1,'gi0/0'),g(R1,'gi0/1'),g(R2,'gi0/0'),g(R2,'gi0/1')],blk=B0=>vsP('192.168.20.0/24'),
  inB=x=>x&&x.net>=blk().net&&x.bc<=blk().bc;
  return[['Сеть PC-A: подсеть /26 (60 хостов)',20,()=>{const x=g(R1,'gi0/0'),f=ic(A,'eth0');return!!x&&x.l===26&&inB(x)&&!!f&&!!f.ip&&same(f.ip,n2ip(x.net),n2ip(x.mask))}],
  ['Сеть PC-B: подсеть /27 (25 хостов)',20,()=>{const x=g(R2,'gi0/1'),f=ic(B,'eth0');return!!x&&x.l===27&&inB(x)&&!!f&&!!f.ip&&same(f.ip,n2ip(x.net),n2ip(x.mask))}],
  ['Канал между маршрутизаторами: /30, один блок на обоих концах',15,()=>{const x=g(R1,'gi0/1'),y=g(R2,'gi0/0');return!!x&&!!y&&x.l===30&&y.l===30&&x.net===y.net&&x.ip!==y.ip&&inB(x)}],
  ['Подсети в пределах 192.168.20.0/24 и не пересекаются',15,()=>{const L=[g(R1,'gi0/0'),g(R1,'gi0/1'),g(R2,'gi0/1')];return L.every(inB)&&L.every((x,i)=>L.every((y,j)=>i===j||x.bc<y.net||y.bc<x.net))}],
  ['PC-A → PC-B',30,()=>{const f=ic(B,'eth0');if(!f||!f.ip||!nets().every(Boolean))return false;computeRip();EX=[];return!!trip(A,f.ip).ok}]]}});
MAN.push(['Т71. Подсети и VLSM',`<p><b>Зачем.</b> Адресное пространство ограничено, а сети разного размера. VLSM (маски переменной длины) позволяет выделить каждой сети блок под её размер, а не одинаковые куски.</p>
<p><b>Порядок решения.</b> 1) Для каждой сети найти минимальную длину префикса: хостов должно хватать (2<sup>k</sup> − 2 ≥ N, где k – число бит хоста; два адреса – сеть и широковещательный – хостам не отдаются). 2) Расположить блоки от большого к маленькому и выровнять по своей границе (блок /26 начинается с адреса, кратного 64). 3) Проверить, что всё поместилось и ничего не пересекается. 4) Каналы точка-точка между маршрутизаторами – /30 (или /31).</p>
<p><b>Команды Стектонии.</b> <code>subcalc 192.168.10.77/26</code> – маска, сеть, широковещательный, диапазон, тип адреса; <code>vlsm 192.168.10.0/24 100 50 20 2</code> – таблица распределения; <code>subtask new средне</code> – случайная задача, ответ командой <code>subtask answer сеть/N …</code>, эталон – <code>subtask show</code>. Есть шаблон «VLSM: три сети из одного блока» и экзаменационное задание «VLSM: разметить сеть по требованиям».</p>
<p><b>Типовые ошибки.</b> Забывают вычесть адреса сети и широковещательный; берут префикс «с запасом» и не помещаются; не выравнивают блок по границе; назначают хосту адрес сети или широковещательный; пересекают подсети.</p>
<p><b>Ограничения.</b> Поддерживается IPv4; вариантов эталонного распределения может быть несколько, тренажёр проверяет условия, а не совпадение с одним ответом.</p>`]);
