/* ===== v9: неисправности, варианты, анализатор, отчёт, Cisco-подобный CLI, ARP/MAC ===== */
const rr=a=>a[Math.floor(Math.random()*a.length)];
const FAULTS=[
 ()=>{const l=S.devs.filter(x=>x.t==='pc'&&x.gw);if(!l.length)return;const x=rr(l);x.gw='';return`На ${x.name} пропал шлюз по умолчанию`},
 ()=>{const l=S.devs.filter(x=>x.ifaces.some(f=>f.ip&&f.mask&&!f.svi));if(!l.length)return;const x=rr(l),f=x.ifaces.find(f=>f.ip&&f.mask&&!f.svi),o=f.mask;f.mask='255.255.255.252';return`У ${x.name} на ${f.n} изменена маска (была ${o})`},
 ()=>{if(!S.links.length)return;const l=rr(S.links),d=dv(l.a);d.ifaces[l.ai].off=true;return`Выключен порт ${d.ifaces[l.ai].n} на ${d.name}`},
 ()=>{const l=S.devs.filter(x=>x.t==='rt'&&x.routes.length);if(!l.length)return;const x=rr(l),r=x.routes.pop();return`На ${x.name} удалён маршрут ${r.net}/${plen(r.mask)} через ${r.nh}`},
 ()=>{const l=S.devs.filter(x=>x.t==='sw'&&kind(x)==='msw'&&x.ifaces.some((f,i)=>!f.tr&&peer(x,i)));if(!l.length)return;const x=rr(l),f=rr(x.ifaces.filter((f,i)=>!f.tr&&peer(x,i)));f.v=(f.v||1)+10;return`На ${x.name} порт ${f.n} переведён в другой VLAN`}];

// Генератор вариантов: топология + адресный план по фамилии/номеру
const rng=s=>{let h=1779033703^s.length;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19}let a=h>>>0;return()=>{a=a+1831565813|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
function genVariant(seed){const R=rng(seed),k=2+Math.floor(R()*2),b=10+Math.floor(R()*180);S={devs:[],links:[],c:0,n:{pc:0,sw:0,rt:0}};sel=null;const rs=[],lan=[];
 for(let i=0;i<k;i++){const x=150+i*280,r=addDev('rt',x,170,'R'+(i+1)),s=addDev('sw',x,320,'SW'+(i+1)),a=addDev('pc',x-50,450,'PC'+(2*i+1)),c=addDev('pc',x+50,450,'PC'+(2*i+2));rs.push(r);connect(r.id,s.id);connect(s.id,a.id);connect(s.id,c.id);lan.push(`192.168.${b+i*3+Math.floor(R()*3)}`)}
 const lk=[];for(let i=0;i<k-1;i++){connect(rs[i].id,rs[i+1].id);const l=S.links[S.links.length-1];lk.push({i,net:`10.${1+Math.floor(R()*250)}.${i}`,ia:rs[i].ifaces[l.ai].n,ib:rs[i+1].ifaces[l.bi].n})}
 let h=`<div class="tip"><b>Вариант «${esc(seed)}»</b><ul>`+lan.map((n,i)=>`<li>Сеть ${i+1}: <code>${n}.0/24</code>; шлюз <code>${n}.1</code> — интерфейс <code>gi0/0</code> маршрутизатора R${i+1}; PC${2*i+1} — <code>.10</code>, PC${2*i+2} — <code>.11</code></li>`).join('')+lk.map(l=>`<li>Связь R${l.i+1}–R${l.i+2}: <code>${l.net}.0/30</code>; R${l.i+1} (<code>${l.ia}</code>) — <code>${l.net}.1</code>, R${l.i+2} (<code>${l.ib}</code>) — <code>${l.net}.2</code></li>`).join('')+'</ul>Задача: настроить адреса, шлюзы и маршрутизацию (статические маршруты, RIP или OSPF), добиться связности всех ПК. Проверка — кнопка «Проверить выполнение».</div>';
 S.variant={seed,html:h};ch()}
function variantCheck(){const ps=S.devs.filter(d=>d.t==='pc');let ok=0,n=0;const bad=[];
 ps.forEach(a=>ps.forEach(b=>{if(a===b)return;n++;const r=trip(a,srcIp(b)||'0.0.0.0');if(r.ok)ok++;else{const e=EX.filter(x=>x.err).pop();bad.push(`${a.name} → ${b.name}: ${e?e.x:'нет связи'}`)}}));
 return`<p class="${ok===n?'ok':'er'}"><b>Связность: ${ok} из ${n} пар (${n?Math.round(100*ok/n):0}%)</b></p>${bad.length?'<ul class="er">'+bad.slice(0,12).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p class="ok">Все ПК видят друг друга. Задача выполнена.</p>'}`+(S.variant?S.variant.html:'')}

// Отчёт по заданиям
const REPT={};const _chk=check;
check=function(i){const t=REPT[i]=REPT[i]||{n:0,t0:Date.now(),ok:0};t.n++;_chk(i);if(!t.ok&&/выполнено/.test(($('#r'+i)||{}).textContent||''))t.ok=Math.max(1,Math.round((Date.now()-t.t0)/60000))};

// Анализатор пакетов (кадры по уровням)
function capture(s,ip){const r=trip(s,ip),sip=srcIp(s);let rows='',f=0,b=0;
 EX.filter(x=>!x.err&&x.p.length>1).forEach(st=>{const a=dv(st.p[0]),z=dv(st.p[st.p.length-1]),src=st.rep?ip:sip,dd=st.rep?sip:ip,ttl=64-(st.rep?b++:f++),nh=(z.ifaces.find(g=>g.ip)||{}).ip||'?';
  rows+=`<tr><td>ARP</td><td>${a.mac} → ff:ff:ff:ff:ff:ff</td><td>Who has ${nh}? Tell ${esc(a.name)}</td><td>Широковещательный запрос в своей сети</td></tr><tr><td>ARP</td><td>${z.mac} → ${a.mac}</td><td>${nh} is at ${z.mac}</td><td>Ответ ${esc(z.name)}</td></tr><tr><td>ICMP ${st.rep?'Echo reply (type 0)':'Echo request (type 8)'}</td><td>${a.mac} → ${z.mac}</td><td>IP ${src} → ${dd}, TTL ${ttl}, proto 1</td><td>${esc(st.x)}</td></tr>`});
 const e=EX.filter(x=>x.err).pop();
 return`<table class="t"><tr><th>Протокол</th><th>Ethernet (MAC отправителя → получателя)</th><th>IP / поля</th><th>Пояснение</th></tr>${rows}</table><p class="${r.ok?'ok':'er'}">${r.ok?'✔ Пакет доставлен, ответ вернулся.':'✖ '+esc(e?e.x:'нет связи')}</p><p class="mt">MAC на каждом участке свой (меняется при прохождении маршрутизатора), IP отправителя и получателя остаётся прежним, TTL уменьшается. Учебное упрощение: у устройства один MAC, NAT не отображается.</p>`}

// Cisco-подобный CLI, ARP и MAC-таблицы
const runCfg=d=>['hostname '+d.name,'!',...d.ifaces.flatMap(f=>[`interface ${f.n}`,f.ip?` ip address ${f.ip} ${f.mask}`:' no ip address',...(f.nat?[' ip nat outside']:[]),...(typeof ifCfg==='function'?ifCfg(f):[]),...(f.helper?[` ip helper-address ${f.helper}`]:[]),f.off?' shutdown':' no shutdown','!']),...(d.rip?['router rip','!']:[]),...(d.ospf?['router ospf 1','!']:[]),...d.routes.map(r=>`ip route ${r.net} ${r.mask} ${r.nh}${r.ad?' '+r.ad:''}${r.track?' track '+r.track:''}`),...(d.acl||[]).map(r=>'access-list '+r.txt),...(typeof cfgTail==='function'?cfgTail(d):[])].join('\n');
const cliPs=d=>{const c=d.cli||{};$('#ps').textContent=d.name+(c.m==='conf'?'(config)# ':c.m==='if'?'(config-if)# ':c.m==='priv'?'# ':'> ')};
const _side9=side;side=function(){_side9();const d=sel&&dv(sel);if(d)cliPs(d)};
const _run9=run;
run=function(c){const d=sel&&dv(sel),a=c.trim().split(/\s+/),cm=a[0].toLowerCase();if(!d||!c.trim())return _run9(c);
 if((cm==='arp'||(cm==='show'&&a[1]==='arp'))&&d.t!=='sw'){let n=0;d.ifaces.forEach((f,i)=>l2all(d,i).forEach(e=>{const g=e.d.ifaces[e.i];if(g.ip){n++;p(`${g.ip.padEnd(16)} ${e.d.mac}  ${f.n}`)}}));return n||p('ARP-таблица пуста: на канальном уровне нет соседей с IP')}
 if(d.t==='sw'&&cm==='show'&&/^mac/.test(a[1]||'')){let n=0;d.ifaces.forEach((f,i)=>behind(d,f).forEach(e=>{n++;p(`${e.mac}  ${f.n}  VLAN ${f.tr?'trunk':f.v||1}  ${e.name}`)}));return n||p('MAC-таблица пуста')}
 if(d.t==='rt'){const cl=d.cli=d.cli||{m:'user'},set=m=>{cl.m=m;cliPs(d)},f=d.ifaces.find(x=>x.n===cl.i);
  if(cm==='enable')return set('priv');
  if(cm==='configure'||(cm==='conf'&&a[1])){set('conf');return p('Вводите команды конфигурации, выход — exit или end.')}
  if(cm==='interface'&&cl.m==='conf'){const g=d.ifaces.find(x=>x.n.toLowerCase()===(a[1]||'').toLowerCase());if(!g)return p('% Нет интерфейса «'+a[1]+'»');cl.i=g.n;return set('if')}
  if(cm==='exit')return set(cl.m==='if'?'conf':cl.m==='conf'?'priv':'user');
  if(cm==='end')return set('priv');
  if(cl.m==='if'&&f){
   if(cm==='ip'&&a[1]==='address'){const m=nm(a[3]||'');if(ip2n(a[2]||'')==null||!m)return p('% ip address <ip> <маска>');f.ip=a[2];f.mask=m;return ch()}
   if(cm==='shutdown'){f.off=true;return ch()}if(cm==='no'&&a[1]==='shutdown'){f.off=false;return ch()}
   if(cm==='no'&&a[1]==='ip'&&a[2]==='address'){f.ip=f.mask='';return ch()}}
  if(cl.m==='conf'||cl.m==='if'){
   if(cm==='ip'&&a[1]==='route'){const m=nm(a[3]||'');if(ip2n(a[2]||'')==null||!m||ip2n(a[4]||'')==null)return p('% ip route <сеть> <маска> <шлюз> [дистанция]');const o=rtOpts(a.slice(5));if(o.err)return p('% '+o.err);d.routes.push({net:a[2],mask:m,nh:a[4],...(o.ad>1?{ad:o.ad}:{}),...(o.track?{track:o.track}:{})});return ch()}
   if(cm==='router'){if(a[1]==='rip')d.rip=true;else if(a[1]==='ospf')d.ospf=true;else return p('% router rip | router ospf <id>');return ch()}
   if(cm==='no'&&a[1]==='router'){if(a[2]==='rip')d.rip=false;if(a[2]==='ospf')d.ospf=false;return ch()}}
  if(cm==='show'){if(a[1]==='running-config'||a[1]==='run')return p(runCfg(d));if(a[1]==='ip'&&a[2]==='route')return _run9('route');if(a[1]==='ip'&&a[2]==='interface')return p(d.ifaces.map((g,i)=>`${g.n.padEnd(10)} ${(g.ip||'unassigned').padEnd(16)} ${g.off?'administratively down':peer(d,i)?'up':'down'}`).join('\n'))}}
 return _run9(c)};

// Панель инструментов
function toolsHtml(){const opt=S.devs.filter(d=>srcIp(d)).map(d=>`<option>${esc(d.name)}</option>`).join('');
 return`<h3>Инструменты преподавателя и анализа</h3>
<h4>Режим неисправности</h4><p class="mt">Случайная неисправность вносится в исправную схему (шлюз, маска, порт, маршрут, VLAN). Студент ищет причину матрицей связности («Трафик») и объяснениями ошибок. Откат — Ctrl+Z.</p><p><button data-x="tl_break">Сломать сеть</button> <button data-x="tl_show">Показать причину</button> <span id="tl_f" class="mt"></span></p>
<h4>Генератор вариантов</h4><p class="mt">Для каждого студента — своя топология и адресный план (по фамилии или номеру; одинаковый ввод даёт одинаковый вариант). Текущая схема заменяется (Ctrl+Z вернёт).</p><p><input id="tl_seed" placeholder="Фамилия или № варианта"> <button data-x="tl_gen">Создать вариант</button> <button data-x="tl_chk">Проверить выполнение</button></p><div id="tl_v">${S.variant?S.variant.html:''}</div>
<h4>Анализатор пакетов</h4><p><select id="tl_s">${opt}</select> → <select id="tl_d">${opt}</select> <button data-x="tl_cap">Захватить</button></p><div id="tl_c"></div>
<h4>Отчёт, адресация, журнал</h4><p><input id="tl_n" placeholder="ФИО студента"> <button data-x="tl_rep">Отчёт по заданиям</button> <button data-x="tl_adr">Таблица адресации</button> <button data-x="tl_log">Журнал консоли</button></p><div id="tl_o"></div>`}
md.addEventListener('click',e=>{const x=e.target.dataset.x;if(!x||!x.startsWith('tl_'))return;const o=$('#tl_o'),ta=t=>`<textarea id="tl_ta" readonly style="height:170px">${esc(t)}</textarea><p><button data-x="tl_cp">Копировать</button></p>`;
 if(x==='tl_break'){let t=null;for(const i of [0,1,2,3,4].sort(()=>Math.random()-.5)){t=FAULTS[i]();if(t)break}if(!t){$('#tl_f').textContent='Нечего ломать: задайте адреса и соедините устройства';return}S.fault=t;ch();$('#tl_f').textContent='Неисправность внесена. Найдите её!'}
 else if(x==='tl_show')$('#tl_f').textContent=S.fault||'Неисправность не вносилась';
 else if(x==='tl_gen'){genVariant($('#tl_seed').value.trim()||'0');$('#tl_v').innerHTML=S.variant.html}
 else if(x==='tl_chk')$('#tl_v').innerHTML=S.variant?variantCheck():'<p class="er">Сначала создайте вариант</p>';
 else if(x==='tl_cap'){const s=S.devs.find(d=>d.name===$('#tl_s').value);$('#tl_c').innerHTML=s?capture(s,ipOf($('#tl_d').value)):''}
 else if(x==='tl_rep')o.innerHTML=ta(`Отчёт: ${$('#tl_n').value||'—'}\nДата: ${new Date().toLocaleString('ru')}\n`+TASKS.map((k,i)=>{const t=REPT[i];return`${k.t}: `+(t?`попыток ${t.n}, `+(t.ok?`выполнено (≈${t.ok} мин от первой проверки)`:'не выполнено'):'не проверялось')}).join('\n'));
 else if(x==='tl_adr')o.innerHTML='<table class="t"><tr><th>Устройство</th><th>Интерфейс</th><th>IP</th><th>Маска</th><th>Шлюз</th></tr>'+S.devs.flatMap(d=>d.ifaces.filter(f=>f.ip).map(f=>`<tr><td>${esc(d.name)}</td><td>${f.n}</td><td>${f.ip}</td><td>${f.mask}</td><td>${d.t==='pc'?d.gw||'—':'—'}</td></tr>`)).join('')+'</table>';
 else if(x==='tl_log')o.innerHTML=ta(out.textContent);
 else if(x==='tl_cp'){const t=$('#tl_ta');t.select();try{navigator.clipboard.writeText(t.value)}catch(_){}}});
$('#bt').insertAdjacentHTML('beforebegin','<button id="btl">Инструменты</button>');
$('#btl').onclick=()=>openMd(toolsHtml());
MAN.splice(MAN.length-1,0,['Инструменты преподавателя и анализа, Cisco-подобный CLI',`<ul><li><b>Режим неисправности:</b> «Сломать сеть» вносит одну случайную неисправность; ищите по матрице связности и диагностике; «Показать причину» раскрывает ответ.</li><li><b>Генератор вариантов:</b> по фамилии создаёт уникальную схему и адресный план; «Проверить выполнение» считает процент связности ПК и называет причины.</li><li><b>Анализатор пакетов:</b> показывает кадры по участкам пути: ARP, Ethernet (MAC), IP (адреса, TTL), ICMP — видно, как MAC меняется на каждом участке, а IP остаётся.</li><li><b>Отчёт:</b> попытки и время по заданиям, текст можно скопировать. <b>Таблица адресации</b> и <b>журнал консоли</b> — для отчётов по практическим работам.</li></ul>
<p><b>CLI маршрутизатора в стиле Cisco:</b> <code>enable</code>, <code>configure terminal</code>, <code>interface gi0/0</code>, <code>ip address 192.168.1.1 255.255.255.0</code>, <code>no shutdown</code>, <code>exit</code>, <code>ip route 192.168.2.0 255.255.255.0 10.0.0.2</code>, <code>router rip</code> / <code>router ospf 1</code>, <code>end</code>, <code>show running-config</code>, <code>show ip route</code>, <code>show ip interface brief</code>. Приглашение меняется (<code>R1#</code>, <code>R1(config-if)#</code>). Короткие команды симулятора тоже работают.</p>
<p><b>Таблицы:</b> <code>arp</code> (хосты и маршрутизаторы) — IP→MAC соседей; <code>show mac</code> (коммутатор) — какие MAC за каким портом.</p>`]);
p('Новое: «Инструменты» (неисправности, варианты, анализатор, отчёт), Cisco-подобный CLI на маршрутизаторах, arp и show mac.');
