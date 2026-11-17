/* ===== v8: «Трафик» — пинг между любыми устройствами, множественная отправка, таймеры, матрица связности ===== */
const JOBS=[];let jid=0;
const ipOf=x=>{const t=S.devs.find(d=>d.name.toLowerCase()===String(x).toLowerCase());return t?(srcIp(t)||(typeof addrOf6==='function'&&addrOf6(t))||x):x};
const targets=(src,list)=>{const o=[];String(list).split(/[,\s;]+/).filter(Boolean).forEach(x=>{if(x==='*')S.devs.forEach(t=>{if(t!==src&&srcIp(t))o.push({n:t.name,ip:srcIp(t)})});else{const t=S.devs.find(d=>d.name.toLowerCase()===x.toLowerCase());o.push({n:t?t.name:x,ip:t?(srcIp(t)||(typeof addrOf6==='function'&&addrOf6(t))||''):x})}});return o};
const lbl=()=>{const n=JOBS.filter(j=>j.run).length,b=$('#btf');if(b)b.textContent='Трафик'+(n?' ▶'+n:'')};
async function tick(j){const s=dv(j.src);if(!s){stopJob(j);return}if(j.busy)return;j.busy=true;j.done++;
 try{for(const t of targets(s,j.list)){const st=j.stats[t.n]=j.stats[t.n]||{sent:0,ok:0,hops:0,last:'',err:''},prev=st.last;st.sent++;
  if(!t.ip||(ip2n(t.ip)==null&&(typeof v6!=='function'||v6(t.ip)===null))){st.last='✖';st.err='у получателя нет IP-адреса или имя неизвестно'}
  else{const r=trip(s,t.ip),st2=EX.slice();
   if(r.ok){st.ok++;st.hops=r.tr.length;st.last='✔';st.err=''}else{const e=EX.filter(x=>x.err).pop();st.last='✖';st.err=e?e.x+(e.fix?' ➜ '+e.fix:''):'нет ответа'}
   if(j.anim&&!busy)await play(st2)}
  if(prev&&prev!==st.last)p(`◷ ${s.name} → ${t.n}: ${st.last==='✔'?'связь восстановилась':'связь потеряна — '+st.err}`)}}
 finally{j.busy=false}
 if(j.count&&j.done>=j.count)stopJob(j)}
function startJob(s,list,every,count,anim,j){if(!s||!list)return p('Укажите источник и получателей');
 if(!j){j={id:++jid,src:s.id,list,every,count,anim,run:true,done:0,stats:{},busy:false};JOBS.push(j)}else j.run=true;
 j.timer=setInterval(()=>tick(j),j.every*1000);tick(j);lbl();return j}
function stopJob(j){clearInterval(j.timer);j.run=false;lbl()}
async function multi(d,list){for(const t of targets(d,list))await sendData(d,t.ip||t.n)}

function trfHtml(){if(!JOBS.length)return'<p class="mt">Заданий пока нет.</p>';
 return JOBS.map(j=>{const s=dv(j.src)||{name:'?'};return`<div class="tk"><b>${esc(s.name)} → ${esc(j.list)}</b> <span class="mt">каждые ${j.every} с${j.count?', всего раундов: '+j.count:''} · выполнено раундов: ${j.done} · ${j.run?'▶ работает':'■ остановлено'}</span> <button data-x="tf_stop" data-j="${j.id}">${j.run?'Стоп':'Старт'}</button> <button data-x="tf_del" data-j="${j.id}">✕</button>
 <table class="t"><tr><th>Получатель</th><th>Отправлено</th><th>Доставлено</th><th>Потери</th><th>Переходов</th><th>Статус и причина</th></tr>${Object.entries(j.stats).map(([n,t])=>`<tr><td>${esc(n)}</td><td>${t.sent}</td><td>${t.ok}</td><td>${Math.round(100*(1-t.ok/t.sent))}%</td><td>${t.hops||'—'}</td><td class="${t.last==='✔'?'ok':'er'}">${t.last} ${esc(t.err)}</td></tr>`).join('')||'<tr><td colspan="6" class="mt">Ожидание первого раунда…</td></tr>'}</table></div>`}).join('')}
function matrix(){const ds=S.devs.filter(d=>srcIp(d));if(ds.length<2)return'<p class="er">Нужно минимум два устройства с IP-адресом.</p>';const fails=[];
 let h='<table class="t"><tr><th>от ↓ / к →</th>'+ds.map(d=>`<th>${esc(d.name)}</th>`).join('')+'</tr>';
 ds.forEach(a=>{h+=`<tr><th>${esc(a.name)}</th>`;ds.forEach(b=>{if(a===b){h+='<td>—</td>';return}const r=trip(a,srcIp(b)),e=EX.filter(x=>x.err).pop();
  if(!r.ok)fails.push(`${a.name} → ${b.name}: ${e?e.x:'нет связи'}`);h+=`<td class="${r.ok?'ok':'er'}" title="${r.ok?'доставлено':esc(e?e.x:'нет связи')}">${r.ok?'✔':'✖'}</td>`});h+='</tr>'});
 return h+`</table><p class="mt">✔ пакет дошёл и ответ вернулся; ✖ — нет (причина — во всплывающей подсказке и ниже). Сравните с задуманной политикой: кто с кем должен и не должен общаться.</p>`+(fails.length?`<ul class="er">${fails.slice(0,25).map(f=>'<li>'+esc(f)+'</li>').join('')}</ul>`:'<p class="ok">Связность полная.</p>')}
function trfForm(){const ds=S.devs.filter(d=>d.t==='pc'||d.t==='rt'),opt=ds.map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join(''),sid=sel&&dv(sel)?sel:'';
 return`<h3>Трафик: проверка связности, множественная отправка, таймеры</h3><p class="mt">Источником может быть любое устройство — выбирать его на схеме не нужно. Получатели — имена устройств или IP-адреса.</p>
 <h4>1. Быстрая проверка «кто → кому»</h4><p><select id="tf_s">${opt}</select> → <select id="tf_d">${S.devs.filter(d=>srcIp(d)).map(d=>`<option>${esc(d.name)}</option>`).join('')}</select> <button data-x="tf_ping">Ping</button> <button data-x="tf_tr">Трассировка</button> <button data-x="tf_send">Пакет с анимацией</button></p><pre id="tf_o" style="background:#0a1117;color:#cfdce8;padding:8px;border-radius:6px;min-height:20px;white-space:pre-wrap;font:12px ui-monospace,monospace"></pre>
 <h4>2. Отправка нескольким получателям и по таймеру</h4><p>Источник <select id="tf_js">${opt}</select> получатели <input id="tf_jl" placeholder="PC2, PC3, 10.0.0.1 или * (всем)" style="width:230px"> каждые <input id="tf_je" value="5" style="width:44px"> с, раундов <input id="tf_jc" value="0" style="width:44px"> (0 — без конца) <label><input type="checkbox" id="tf_ja"> анимация</label> <button data-x="tf_add">Запустить</button></p>
 <p class="mt">Задания работают в фоне, пока открыта страница: закройте окно и ломайте сеть — в консоли появится сообщение, когда связь пропадёт или восстановится.</p><div id="trf">${trfHtml()}</div>
 <h4>3. Матрица связности (все со всеми)</h4><p><button data-x="tf_mx">Проверить IPv4</button> <button data-x="tf_mx6">Проверить IPv6</button></p><div id="tf_m"></div>`}
md.addEventListener('click',e=>{const t=e.target,x=t.dataset.x;if(!x||!x.startsWith('tf_'))return;const j=JOBS.find(q=>q.id===+t.dataset.j);
 if(x==='tf_ping'||x==='tf_tr'){const s=dv($('#tf_s').value);if(!s)return;const b=out.textContent.length;(x==='tf_ping'?ping:tracert)(s,ipOf($('#tf_d').value));$('#tf_o').textContent=out.textContent.slice(b)}
 else if(x==='tf_send'){const s=dv($('#tf_s').value);if(!s)return;md.hidden=true;sel=s.id;side();draw();sendData(s,ipOf($('#tf_d').value))}
 else if(x==='tf_add'){const l=$('#tf_jl').value.trim(),s=dv($('#tf_js').value);if(!l||!s)return;startJob(s,l,Math.max(1,+$('#tf_je').value||5),Math.max(0,+$('#tf_jc').value||0),$('#tf_ja').checked);$('#trf').innerHTML=trfHtml()}
 else if(x==='tf_stop'&&j){j.run?stopJob(j):startJob(null,j.list,0,0,0,j);$('#trf').innerHTML=trfHtml()}
 else if(x==='tf_del'&&j){stopJob(j);JOBS.splice(JOBS.indexOf(j),1);$('#trf').innerHTML=trfHtml()}
 else if(x==='tf_mx')$('#tf_m').innerHTML=matrix()});
setInterval(()=>{const b=$('#trf');if(b&&!md.hidden)b.innerHTML=trfHtml()},1000);
$('#bt').insertAdjacentHTML('beforebegin','<button id="btf">Трафик</button>');
$('#btf').onclick=()=>openMd(trfForm());

// консоль
const _run8=run;
run=function(c){const a=c.trim().split(/\s+/),cm=a[0].toLowerCase(),d=sel&&dv(sel),byName=n=>S.devs.find(x=>x.name.toLowerCase()===(n||'').toLowerCase());
 if((cm==='ping'||cm==='tracert')&&a[2]){const s=byName(a[1]);if(!s)return p(`Нет устройства «${a[1]}». Использование: ${cm} <источник> <получатель>`);return(cm==='ping'?ping:tracert)(s,ipOf(a[2]))}
 if(cm==='send'&&a[2]){const s=byName(a[1]);if(!s)return p(`Нет устройства «${a[1]}». Использование: send [источник] <получатели>`);return multi(s,a.slice(2).join(','))}
 if(d&&cm==='send'&&/[,*]/.test(a[1]||''))return multi(d,a[1]);
 if(cm==='every'){if(!d)return p('Выберите источник на схеме');const n=+a[1];if(!(n>0)||!a[3])return p('Использование: every <сек> <раундов|0> <получатели через запятую или *>');startJob(d,a[3],n,+a[2]||0,false);return p(`Таймер запущен: ${d.name} → ${a[3]} каждые ${n} с (stopall — остановить)`)}
 if(cm==='jobs')return p(JOBS.map(j=>`#${j.id} ${(dv(j.src)||{}).name} → ${j.list}, каждые ${j.every} с, ${j.run?'работает':'стоп'}, раундов ${j.done}`).join('\n')||'Заданий нет');
 if(cm==='stopall'){JOBS.forEach(stopJob);return p('Все таймеры остановлены')}
 return _run8(c)};
MAN.splice(MAN.length-1,0,['Трафик: проверка связности, множественная и периодическая отправка',`<p>Кнопка <b>«Трафик»</b> открывает инструменты, которые не требуют выбирать источник на схеме.</p>
<ul><li><b>Быстрая проверка:</b> выберите «кто → кому» и нажмите Ping, «Трассировка» или «Пакет с анимацией».</li><li><b>Множественная отправка:</b> в поле получателей через запятую — имена или IP (<code>PC2, PC3, 10.0.0.1</code>); <code>*</code> — всем устройствам с IP. Для каждого получателя считаются отправленные и доставленные пакеты, потери, число переходов и причина ошибки.</li><li><b>Таймер:</b> задайте интервал и число раундов (0 — без конца). Задания работают в фоне; при потере или восстановлении связи в консоль приходит сообщение — удобно, когда вы меняете настройки и наблюдаете эффект (отключили порт, убрали маршрут, включили ACL).</li><li><b>Матрица связности:</b> все со всеми одним нажатием; ✖ объясняются подсказкой. Сверяйте с планом: что должно работать, а что должно быть запрещено (например, гости не должны видеть серверы).</li></ul>
<p><b>Команды:</b> <code>ping PC1 PC3</code> (пинг от одного устройства к другому), <code>tracert PC1 PC3</code>, <code>send PC2,PC3</code> или <code>send PC1 PC2,PC3</code> (анимация по очереди), <code>every 5 0 PC2,PC3</code> (каждые 5 с без конца), <code>jobs</code>, <code>stopall</code>.</p>
<div class="tip"><b>Зачем это инженеру:</b> проверка по матрице после каждого изменения — основа приёмки сети: настроить сеть мало, нужно доказать, что разрешённое работает, а запрещённое — заблокировано.</div>`]);
p('Новое: кнопка «Трафик» (пинг между любыми устройствами, рассылка, таймеры, матрица связности), команды ping A B, send a,b, every, jobs, stopall.');
