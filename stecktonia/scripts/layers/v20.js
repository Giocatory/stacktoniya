// ================= v20: экзаменационный режим — билеты, таймер, автооценка по критериям =================
const exRng=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const exIp=x=>/^\d+\.\d+\.\d+\.\d+$/.test(String(x))?x:(byNm(x)?srcIp(byNm(x)):null);
const exQ=f=>{QUIET++;try{return f()}catch(e){return false}finally{QUIET--}};
const exPing=(a,b)=>exQ(()=>{const A=byNm(a),ip=exIp(b);if(!A||!ip)return false;EX=[];return !!trip(A,ip).ok});
const exL4=(a,b,pt)=>exQ(()=>{const A=byNm(a),ip=exIp(b);if(!A||!ip)return false;EX=[];return !!l4(A,ip,'tcp',pt).ok});
const exNet=(ip,net,len)=>!!ip&&ip2n(ip)!=null&&((ip2n(ip)^ip2n(net))>>>(32-len))===0;
const exIf=(n,net,len,last)=>{const d=byNm(n);return d&&d.ifaces.find(f=>f.ip&&f.mask&&plen(f.mask)===len&&exNet(f.ip,net,len)&&(last==null||f.ip===net.replace(/\.0$/,'.'+last)))};
const exLk=(a,b)=>S.links.some(l=>{const A=dv(l.a),B=dv(l.b);return A&&B&&((A.name===a&&B.name===b)||(A.name===b&&B.name===a))});
const exT=(n,t)=>{const d=byNm(n);return !!d&&d.t===t};
const exLoad0=i=>{delete S.fault;delete S.fault2;return tplLoad(i==null?{n:'пустая схема',dev:[],link:[],cfg:[],hint:''}:TPL[i])};
const exAll=()=>pcConn();
const exSeeded=(r,f)=>{const m=Math.random;Math.random=r;try{return f()}finally{Math.random=m}};

const EXQ=[
{n:'Две подсети через маршрутизатор',min:25,tag:'Адресация, шлюзы',
 init:r=>({x:10+Math.floor(r()*200)}),
 start:c=>{exLoad0(null)},
 text:c=>`Постройте сеть с нуля. Подсеть А — 10.${c.x}.1.0/24: компьютер PC1 (адрес .10) и коммутатор SW1. Подсеть Б — 10.${c.x}.2.0/24: компьютер PC2 (адрес .10). Маршрутизатор R1 — шлюз обеих подсетей (адрес .1 в каждой). PC1 подключите к SW1, SW1 и PC2 — к R1. Настройте адреса, маски /24 и шлюзы, добейтесь ping в обе стороны.`,
 crit:c=>{const A=`10.${c.x}.1.0`,B=`10.${c.x}.2.0`;return[
  ['Созданы и названы как в задании: PC1, PC2 (компьютеры), SW1 (коммутатор), R1 (маршрутизатор)',10,()=>exT('PC1','pc')&&exT('PC2','pc')&&exT('SW1','sw')&&exT('R1','rt')],
  [`R1 имеет адреса 10.${c.x}.1.1/24 и 10.${c.x}.2.1/24`,15,()=>!!exIf('R1',A,24,1)&&!!exIf('R1',B,24,1)],
  [`PC1: адрес 10.${c.x}.1.10/24, шлюз 10.${c.x}.1.1`,10,()=>{const d=byNm('PC1');return !!d&&!!exIf('PC1',A,24,10)&&d.gw===`10.${c.x}.1.1`}],
  [`PC2: адрес 10.${c.x}.2.10/24, шлюз 10.${c.x}.2.1`,10,()=>{const d=byNm('PC2');return !!d&&!!exIf('PC2',B,24,10)&&d.gw===`10.${c.x}.2.1`}],
  ['Кабели: PC1–SW1, SW1–R1, R1–PC2',5,()=>exLk('PC1','SW1')&&exLk('SW1','R1')&&exLk('R1','PC2')],
  ['ping PC1 → PC2 проходит',25,()=>exPing('PC1','PC2')],
  ['ping PC2 → PC1 проходит',25,()=>exPing('PC2','PC1')]]}},
{n:'ACL на L3-коммутаторе',min:20,tag:'ACL, межвлановая маршрутизация',
 init:r=>({pt:[8080,443,22,3389][Math.floor(r()*4)]}),
 start:c=>{exLoad0(8);execOn(byNm('Server'),'service add tcp '+c.pt)},
 text:c=>`Загружена схема «Офис: два отдела на L3-коммутаторе». На Server работает служба TCP/${c.pt}. Запретите узлам сети VLAN 10 (PC1, PC2) доступ к Server только по порту TCP/${c.pt} с помощью ACL на L3SW1. Остальной трафик (ping) и доступ PC3 к этому порту должны работать.`,
 crit:c=>[
  ['На L3SW1 создано хотя бы одно правило ACL',10,()=>{const d=byNm('L3SW1');return !!d&&(d.acl||[]).length>0}],
  [`PC1 → Server:${c.pt} закрыт`,30,()=>!exL4('PC1','Server',c.pt)],
  [`PC2 → Server:${c.pt} закрыт`,15,()=>!exL4('PC2','Server',c.pt)],
  [`PC3 → Server:${c.pt} открыт (нет лишних запретов)`,20,()=>exL4('PC3','Server',c.pt)],
  ['ping PC1 → Server проходит',15,()=>exPing('PC1','Server')],
  ['ping PC1 → PC3 проходит',10,()=>exPing('PC1','PC3')]]},
{n:'Поиск неисправности',min:20,tag:'Диагностика',
 init:r=>({tp:r()<.5?8:9,seed:Math.floor(r()*1e9)}),
 start:c=>{exLoad0(c.tp);c.base=pcConn();c.nd=S.devs.length;c.nl=S.links.length;const rr=exRng(c.seed);
  const order=FLT.map((_,k)=>k).sort(()=>rr()-.5);let u=null,t=null,first=null;
  for(const k of order){exLoad0(c.tp);t=null;exSeeded(rr,()=>{t=FLT[k].f()});if(!t)continue;if(!first)first=[k,t];if(pcConn().ok<c.base.ok){u=FLT[k];break}}
  if(!u&&first){exLoad0(c.tp);exSeeded(rr,()=>{t=FLT[first[0]].f()});u=FLT[first[0]]}
  if(u){S.fault2={name:u.n,desc:t,hints:u.h,shown:0,reveal:false,base:c.base,res:''};S.fault=t;ch()}c.has=!!u},
 text:c=>`В рабочую схему внесена одна неисправность (шаблон «${TPL[c.tp].n}»). Найдите причину и устраните её так, чтобы связность между всеми компьютерами стала прежней. Не добавляйте и не удаляйте устройства и кабели. Подсказки открываются в окне «Аварии» и снижают баллы.`,
 crit:c=>[
  ['Связность всех пар компьютеров восстановлена',60,()=>{const k=pcConn();return !!c.has&&k.ok>=c.base.ok}],
  ['Число устройств и кабелей не изменилось',15,()=>S.devs.length===c.nd&&S.links.length===c.nl],
  ['Подсказки не использовались',10,()=>!!S.fault2&&S.fault2.shown===0],
  ['Причина не открывалась («Показать причину»)',15,()=>!!S.fault2&&!S.fault2.reveal]]},
{n:'Wi‑Fi: подключить второй смартфон',min:15,tag:'Wi‑Fi, DHCP',
 init:r=>({ss:'Class-'+(100+Math.floor(r()*900)),pw:String(10000000+Math.floor(r()*89999999))}),
 start:c=>{exLoad0(10);execOn(byNm('WR1'),`ssid ${c.ss} ${c.pw}`);execOn(byNm('Phone1'),`wifi ${c.ss} ${c.pw}`);execOn(byNm('Phone1'),'dhcp wlan0')},
 text:c=>`Wi‑Fi роутер WR1 раздаёт сеть «${c.ss}» (пароль ${c.pw}), в сети есть сервер Server (192.168.0.10). Добавьте смартфон Phone2, расположите его в зоне действия роутера, подключите к этой сети и получите адрес по DHCP. Проверьте ping Phone2 → Server и Phone2 → Phone1.`,
 crit:c=>[
  ['Устройство Phone2 добавлено',10,()=>!!byNm('Phone2')],
  [`Phone2 подключён к Wi‑Fi «${c.ss}»`,20,()=>{const d=byNm('Phone2');if(!d)return false;const i=d.ifaces.findIndex(f=>f.wifi);return i>=0&&wifiWhy(d,i)===true&&d.ifaces[i].ssid===c.ss}],
  ['Phone2 получил адрес 192.168.0.x по DHCP',20,()=>{const d=byNm('Phone2');return !!d&&exNet(srcIp(d),'192.168.0.0',24)}],
  ['ping Phone2 → Server проходит',30,()=>exPing('Phone2','Server')],
  ['Phone1 по-прежнему видит Server',10,()=>exPing('Phone1','Server')],
  ['ping Phone2 → Phone1 проходит',10,()=>exPing('Phone2','Phone1')]]},
{n:'Филиал без Интернета (OSPF + NAT)',min:25,tag:'Маршрутизация, NAT',
 init:r=>{const all=['nat','rb','ospf'],k=all.sort(()=>r()-.5).slice(0,2);if(!k.includes('nat'))k[1]='nat';return{br:k}},
 start:c=>{exLoad0(9);const ct=byNm('Center');if(c.br.includes('nat'))ct.ifaces.forEach(f=>{f.nat=false});
  if(c.br.includes('rb')){const d=byNm('R-B');d.routes=d.routes.filter(x=>x.net!=='0.0.0.0')}
  if(c.br.includes('ospf')){byNm('R-A').ospf=false}ch();c.nd=S.devs.length;c.nl=S.links.length},
 text:c=>`Схема «Три филиала» (центр Center, филиалы R-A и R-B, провайдер ISP, сайт Web 8.8.8.8). После изменений сети узлы не работают как раньше: сотрудникам нужны Интернет и связь между филиалами. Найдите две неисправности и устраните их, не добавляя новых устройств и не вводя лишних ACL.`,
 crit:c=>[
  ['PC-A выходит в Интернет (ping 8.8.8.8)',20,()=>exPing('PC-A','8.8.8.8')],
  ['PC-B выходит в Интернет (ping 8.8.8.8)',20,()=>exPing('PC-B','8.8.8.8')],
  ['ping PC-A → PC-B проходит',15,()=>exPing('PC-A','PC-B')],
  ['ping PC-B → PC-A проходит',15,()=>exPing('PC-B','PC-A')],
  ['На Center включён NAT на внешнем интерфейсе',10,()=>{const d=byNm('Center');return !!d&&d.ifaces.some(f=>f.nat)}],
  ['Устройства и кабели не добавлены/удалены',10,()=>S.devs.length===c.nd&&S.links.length===c.nl],
  ['Лишних правил ACL нет',10,()=>S.devs.every(d=>!(d.acl||[]).length)]]},
{n:'DMZ: опубликовать веб и закрыть базу',min:25,tag:'Межсетевой экран, зоны',
 init:r=>({}),
 start:c=>{exLoad0(11);const f=byNm('FW');f.pub=[];f.zp=[];ch()},
 text:c=>`Схема «Серверная»: веб-сервер Web в DMZ, база DB1 и ПК во внутренней сети, Internet — внешний узел. На межсетевом экране FW сняты публикация и разрешающие правила. Настройте FW так, чтобы: из Интернета был доступен только веб-сервер (TCP/80), внутренняя сеть могла открывать веб, а веб-сервер ходил в базу строго по порту TCP/5432. Из Интернета к базе и к другим портам Web доступа быть не должно.`,
 crit:c=>[
  ['Internet → Web:80 открыт',25,()=>exL4('Internet','Web',80)],
  ['Internet → DB1:5432 закрыт',20,()=>!exL4('Internet','DB1',5432)],
  ['Web → DB1:5432 открыт',25,()=>exL4('Web','DB1',5432)],
  ['PC1 → Web:80 открыт',10,()=>exL4('PC1','Web',80)],
  ['Internet → Web:22 закрыт',10,()=>!exL4('Internet','Web',22)],
  ['Web → DB1:22 закрыт (разрешён только 5432)',10,()=>!exL4('Web','DB1',22)]]},
{n:'Кольцо коммутаторов: корень STP и отказоустойчивость',min:15,tag:'STP',
 init:r=>({k:1+Math.floor(r()*3)}),
 start:c=>{exLoad0(13);stp();for(let i=0;i<3;i++){const d=byNm('SW'+c.k);if(d&&ROOT[d.id]===d.id)c.k=c.k%3+1}},
 text:c=>`Схема «Кольцо коммутаторов со STP». Сделайте коммутатор SW${c.k} корневым мостом (stp priority 4096), проверьте командой show stp. Убедитесь, что ПК остаются связаны при отказе любого из кольцевых кабелей.`,
 crit:c=>[
  [`На SW${c.k} задан приоритет 4096 или ниже (stp priority)`,20,()=>{const d=byNm('SW'+c.k);return !!d&&d.prio<=4096}],
  [`SW${c.k} — корневой мост`,40,()=>{stp();const d=byNm('SW'+c.k);return !!d&&ROOT[d.id]===d.id}],
  ['Все компьютеры видят друг друга',15,()=>{const k=pcConn();return k.n>0&&k.ok===k.n}],
  ['При отказе любого кольцевого кабеля связность сохраняется',25,()=>{let ok=true;const ls=S.links.filter(l=>dv(l.a).t==='sw'&&dv(l.b).t==='sw');if(!ls.length)return false;
   ls.forEach(l=>{const f=dv(l.a).ifaces[l.ai],o=f.off;f.off=true;try{stp();const k=pcConn();if(k.ok!==k.n)ok=false}finally{f.off=o;stp()}});return ok}]]}
];

// ---------- состояние и логика ----------
let EXS=null,EXT=null;
const exEval=t=>{const cs=EXQ[t.q].crit(t.ctx);let sum=0,max=0;const list=cs.map(([x,p,f])=>{let ok=false;try{ok=!!f()}catch(e){}max+=p;if(ok)sum+=p;return{t:x,p,ok}});return{sum,max,list}};
const exGrade=pc=>pc>=90?5:pc>=75?4:pc>=50?3:2;
const exFmt=s=>{s=Math.max(0,Math.round(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
function exBuild(name,variant,mode,strict){const t=[];
 if(mode==='ticket'){const r=exRng(variant*7919+13),ids=EXQ.map((_,i)=>i).sort(()=>r()-.5).slice(0,3);ids.forEach(q=>t.push({q}))}
 else t.push({q:+mode});
 t.forEach(x=>{const r=exRng(variant*104729+x.q*31+7);x.ctx=EXQ[x.q].init(r);x.att=0;x.res=null;x.spent=0});
 return{name:name||'',variant,strict:!!strict,tasks:t,cur:0,final:null,t0:Date.now()}}
function exLoad(i){const x=EXS.tasks[i];EXS.cur=i;EXQ[x.q].start(x.ctx);x.t0=Date.now();x.last=null;exTick();exPanel()}
function exStart(name,variant,mode,strict){if(EXT)clearInterval(EXT);EXS=exBuild(name,variant,mode,strict);exLoad(0);EXT=setInterval(exTick,1000);return EXS}
function exLeft(){const x=EXS&&EXS.tasks[EXS.cur];return x?EXQ[x.q].min*60-(Date.now()-x.t0)/1000:0}
function exTick(){if(!EXS||EXS.final)return;const l=exLeft(),h=$('#exh');if(h)h.textContent=(l<0?'−':'')+exFmt(Math.abs(l));if(h)h.style.color=l<60?'#e5484d':'';if(l<=-0.5&&!EXS.final)exFinish(true)}
function exCheck(){const x=EXS.tasks[EXS.cur];x.att++;x.last=exEval(x);exPanel()}
function exFinish(timeout){if(!EXS||EXS.final)return;const x=EXS.tasks[EXS.cur];x.res=exEval(x);x.spent=Math.min(EXQ[x.q].min*60,(Date.now()-x.t0)/1000);x.timeout=!!timeout;
 if(EXS.cur<EXS.tasks.length-1){exLoad(EXS.cur+1);p(`Экзамен: задание ${EXS.cur} завершено, загружено задание ${EXS.cur+1} из ${EXS.tasks.length}.`);return}
 let sum=0,max=0;EXS.tasks.forEach(t=>{sum+=t.res.sum;max+=t.res.max});const pc=Math.round(100*sum/max);EXS.final={sum,max,pc,grade:exGrade(pc),at:new Date().toLocaleString('ru-RU')};
 if(EXT)clearInterval(EXT);EXT=null;exPanel();openMd(exResultHtml())}
function exStop(){if(EXT)clearInterval(EXT);EXT=null;EXS=null;exPanel()}
function exResultHtml(){const f=EXS.final;if(!f)return'';
 const rows=EXS.tasks.map((t,i)=>`<tr><td>${i+1}. ${esc(EXQ[t.q].n)}${t.timeout?' <i>(время вышло)</i>':''}</td><td>${t.res.sum} из ${t.res.max}</td><td>${exFmt(t.spent)} из ${EXQ[t.q].min}:00</td><td>${t.att}</td></tr>`).join('');
 const det=EXS.tasks.map((t,i)=>`<h4>${i+1}. ${esc(EXQ[t.q].n)} — ${t.res.sum}/${t.res.max}</h4><p class="mt">${esc(EXQ[t.q].text(t.ctx))}</p><ul>${t.res.list.map(c=>`<li class="${c.ok?'ok':'er'}">${c.ok?'✔':'✖'} ${esc(c.t)} <i>(${c.ok?c.p:0}/${c.p})</i></li>`).join('')}</ul>`).join('');
 return`<h3>Результат экзамена</h3><p><b>${esc(EXS.name||'студент')}</b>, вариант ${EXS.variant}${EXS.strict?', строгий режим':''}</p><p style="font-size:20px"><b>Баллы: ${f.sum} из ${f.max} (${f.pc}%) — оценка ${f.grade}</b></p><table><tr><th>Задание</th><th>Баллы</th><th>Время</th><th>Проверок</th></tr>${rows}</table><p class="mt">Шкала: 90% и выше — «5», 75–89% — «4», 50–74% — «3», ниже 50% — «2».</p><p><button data-x="ex_rep"><b>Скачать отчёт с результатами</b></button> <button data-x="ex_new">Новый экзамен</button></p>${det}`}
function exSection(){if(!EXS||!EXS.final)return'';const f=EXS.final;
 return`<h2>Результаты экзамена</h2><p><b>${esc(EXS.name||'студент')}</b>, вариант ${EXS.variant}${EXS.strict?', строгий режим':''}. Итог: <b>${f.sum} из ${f.max} (${f.pc}%) — оценка ${f.grade}</b> (${esc(f.at)}).</p>`+
 EXS.tasks.map((t,i)=>`<h3>${i+1}. ${esc(EXQ[t.q].n)} — ${t.res.sum}/${t.res.max}</h3><p>${esc(EXQ[t.q].text(t.ctx))}</p><p>Время: ${exFmt(t.spent)} из ${EXQ[t.q].min}:00; проверок: ${t.att}${t.timeout?'; время вышло':''}</p><ul>${t.res.list.map(c=>`<li class="${c.ok?'ok':'er'}">${c.ok?'✔':'✖'} ${esc(c.t)} (${c.ok?c.p:0}/${c.p})</li>`).join('')}</ul>`).join('')}
{const _rh20=reportHtml;reportHtml=function(n){let h=_rh20(n||(EXS&&EXS.name)||'');const s=exSection();return s?h.replace('<h2>1. Схема сети</h2>',s+'<h2>1. Схема сети</h2>'):h}}

// ---------- панель на схеме ----------
document.head.insertAdjacentHTML('beforeend','<style>#exm{position:fixed;left:10px;top:64px;width:330px;max-height:68vh;overflow:auto;z-index:20;background:var(--pn);border:1px solid var(--bd);border-radius:10px;box-shadow:0 4px 18px rgba(0,0,0,.3);font-size:13px}#exm .eh{display:flex;gap:8px;align-items:center;padding:6px 10px;cursor:pointer;position:sticky;top:0;background:var(--pn);border-bottom:1px solid var(--bd)}#exm .eh b{flex:1}#exm .eh span{font-variant-numeric:tabular-nums;font-weight:700}#exm .eb{padding:8px 10px}#exm.min .eb{display:none}#exm li{margin:2px 0}#exm .ok{color:#2e9e5b}#exm .er{color:#e5484d}#exm button{margin:2px 2px 2px 0}</style>');
document.body.insertAdjacentHTML('beforeend','<div id="exm" hidden></div>');
function exPanel(){const el=$('#exm');if(!EXS||EXS.final){el.hidden=true;el.innerHTML='';return}
 const x=EXS.tasks[EXS.cur],q=EXQ[x.q],keep=el.classList.contains('min');
 const cs=q.crit(x.ctx),L=x.last;
 const crit=`<ul style="padding-left:18px;margin:4px 0">${cs.map(([t,p],i)=>{if(L&&!EXS.strict){const c=L.list[i];return`<li class="${c.ok?'ok':'er'}">${c.ok?'✔':'✖'} ${esc(t)} <i>(${p})</i></li>`}return`<li>${esc(t)} <i>(${p})</i></li>`}).join('')}</ul>`;
 el.hidden=false;el.className=keep?'min':'';
 el.innerHTML=`<div class="eh" data-x="ex_min"><b>Экзамен · задание ${EXS.cur+1} из ${EXS.tasks.length}</b><span id="exh">${exFmt(exLeft())}</span><span>▾</span></div><div class="eb"><p><b>${esc(q.n)}</b></p><p>${esc(q.text(x.ctx))}</p><p class="mt">Критерии оценки (баллы):</p>${crit}${L&&!EXS.strict?`<p><b>Предварительно: ${L.sum} из ${L.max}</b></p>`:''}${EXS.strict?'<p class="mt">Строгий режим: результат виден только после завершения билета.</p>':''}<p>${EXS.strict?'':'<button data-x="ex_chk">Проверить</button>'}<button data-x="ex_fin"><b>${EXS.cur<EXS.tasks.length-1?'Завершить задание':'Завершить экзамен'}</b></button><button data-x="ex_stop">Прервать</button></p></div>`}
$('#exm').addEventListener('pointerdown',e=>e.stopPropagation());
$('#exm').addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(!b)return;const k=b.dataset.x;
 if(k==='ex_min')$('#exm').classList.toggle('min');else if(k==='ex_chk')exCheck();else if(k==='ex_fin'){if(confirm('Завершить это задание? Вернуться к нему будет нельзя.'))exFinish(false)}
 else if(k==='ex_stop'){if(confirm('Прервать экзамен без оценки?'))exStop()}});

// ---------- окно запуска ----------
function exMenu(){const v=1+Math.floor(Math.random()*99);
 return`<h3>Экзамен и контрольные задания</h3><p class="mt">Каждое задание загружает готовую или пустую схему, ставит условие со случайными (но воспроизводимыми по номеру варианта) числами, включает таймер и оценивает результат по списку критериев с баллами. Оценка: 90% и выше — «5», 75–89% — «4», 50–74% — «3», ниже — «2». Один и тот же номер варианта всегда даёт те же задания и числа — удобно для преподавателя.</p>
<p>ФИО: <input id="ex_n" value="${esc(EXS?EXS.name:'')}" style="width:220px"> &nbsp; Вариант: <input id="ex_v" type="number" min="1" max="9999" value="${v}" style="width:70px"></p>
<p>Режим: <select id="ex_m"><option value="ticket">Билет — 3 задания по номеру варианта</option>${EXQ.map((q,i)=>`<option value="${i}">Одно задание: ${esc(q.n)} (${q.min} мин)</option>`).join('')}</select></p>
<p><label><input type="checkbox" id="ex_s"> Строгий режим (без кнопки «Проверить», критерии видны, а результат — только в конце)</label></p>
<p><button data-x="ex_go"><b>Начать</b></button></p>
<h4>Банк заданий</h4><table><tr><th>№</th><th>Задание</th><th>Тема</th><th>Время</th></tr>${EXQ.map((q,i)=>`<tr><td>${i+1}</td><td>${esc(q.n)}</td><td>${esc(q.tag)}</td><td>${q.min} мин</td></tr>`).join('')}</table><p class="mt">Начало задания заменяет текущую схему — сохраните свою работу кнопкой «Экспорт/импорт». Запуск можно отменить Ctrl+Z.</p>`}
$('#bfl').insertAdjacentHTML('afterend','<button id="bex" title="Экзаменационные задания с таймером и автоматической оценкой">Экзамен</button>');
$('#bex').onclick=()=>openMd(EXS&&EXS.final?exResultHtml():exMenu());
md.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-x]'),k=b&&b.dataset.x;if(!k||!k.startsWith('ex_'))return;
 if(k==='ex_go'){const nm=($('#ex_n').value||'').trim(),v=Math.max(1,Math.min(9999,+$('#ex_v').value||1)),m=$('#ex_m').value,s=$('#ex_s').checked;
  if(EXS&&!EXS.final&&!confirm('Идёт экзамен. Начать новый?'))return;
  exStart(nm,v,m,s);md.hidden=true}
 else if(k==='ex_rep'){reportDownload(EXS?EXS.name:'')}
 else if(k==='ex_new'){EXS=null;openMd(exMenu())}});
{const _run20=run;run=function(c){const s=c.trim(),a=s.split(/\s+/);if(a[0].toLowerCase()==='exam'){const v=(a[1]||'').toLowerCase();
  if(v==='list')return p(EXQ.map((q,i)=>`${i}  ${q.n} (${q.min} мин, ${q.tag})`).join('\n'));
  if(v==='start'){const m=a[2]==null?'ticket':a[2],vr=+a[3]||1,nm=a.slice(4).join(' ');if(m!=='ticket'&&!(+m>=0&&+m<EXQ.length))return p('Использование: exam start ticket|<номер> <вариант> [ФИО]');exStart(nm,vr,m,false);return p(`Экзамен начат: вариант ${vr}, заданий ${EXS.tasks.length}. Условие — в панели слева.`)}
  if(!EXS||EXS.final)return p('Экзамен не идёт. exam list — банк заданий; exam start ticket|<номер> <вариант> [ФИО]');
  if(v==='check'){const x=EXS.tasks[EXS.cur];x.att++;x.last=exEval(x);exPanel();return p(`Предварительно: ${x.last.sum} из ${x.last.max}\n`+x.last.list.map(c=>(c.ok?'✔ ':'✖ ')+c.t).join('\n'))}
  if(v==='finish'){exFinish(false);return p(EXS.final?`Экзамен завершён: ${EXS.final.sum}/${EXS.final.max}, оценка ${EXS.final.grade}`:'Задание завершено, загружено следующее')}
  if(v==='stop'){exStop();return p('Экзамен прерван')}
  return p(`Задание ${EXS.cur+1}/${EXS.tasks.length}, осталось ${exFmt(exLeft())}. exam check | finish | stop`)}
 return _run20(c)}}
CMDS.push(['exam','exam list | start ticket|<№> <вариант> [ФИО] | check | finish | stop','Экзаменационный режим: билеты, таймер, оценка по критериям','Экзамен проверяет результат по списку критериев с баллами; по номеру варианта числа в условии всегда одинаковы.','exam start ticket 7 Иванов И.И.','Обзор']);
if(!CMDNAMES.includes('exam'))CMDNAMES.push('exam');
p('Новое (v20): кнопка «Экзамен» — билеты из 7 типовых заданий с таймером, вариантами и автоматической оценкой по критериям (команда exam).');
