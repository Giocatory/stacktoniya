// ===== m_siem: журналы и SIEM: сбор журналов узлов, разбор, правила корреляции, оповещения, рекомендации =====
const SIEM={thr:{ssh:10,scan:10},ev:[],srcs:[]};
const siemMon={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
function siemTs(l){const m=l.match(/^([A-Z][a-z]{2})\s+(\d+)\s+(\d\d):(\d\d):(\d\d)/);if(!m)return null;return((siemMon[m[1]]||0)*31+ +m[2])*86400+ +m[3]*3600+ +m[4]*60+ +m[5]}
function siemParse(line,src){const ts=siemTs(line);let m;
 if((m=line.match(/Failed password for (?:invalid user )?(\S+) from (\d+\.\d+\.\d+\.\d+)/)))return{ts,src,k:'ssh_fail',user:m[1],ip:m[2],line};
 if((m=line.match(/Accepted \w+ for (\S+) from (\d+\.\d+\.\d+\.\d+)/)))return{ts,src,k:'ssh_ok',user:m[1],ip:m[2],line};
 if((m=line.match(/\[UFW (BLOCK|ALLOW)\].*SRC=(\d+\.\d+\.\d+\.\d+).*DPT=(\d+)/)))return{ts,src,k:m[1]==='BLOCK'?'fw_block':'fw_allow',ip:m[2],port:+m[3],line};
 return{ts,src,k:'other',line}}
function siemCollect(){const ev=[],srcs=[];S.devs.forEach(d=>{if(!d||!sxEnd(d))return;let fs;try{fs=sxFs(d)}catch(e){return}Object.keys(fs).forEach(k=>{if(/\.log$/.test(k)&&fs[k]&&!fs[k].d){const t=String(fs[k].c||'').split('\n').filter(Boolean);if(t.length){srcs.push(`${d.name}:${k.replace(/^.*\/home\/student\//,'~/')} (${t.length})`);t.forEach(l=>ev.push(siemParse(l,d.name+':'+k.replace(/^.*\//,''))))}}})});
 if(S.cy&&S.cy.ev&&S.cy.ev.length){srcs.push(`Server:/var/log/auth.log, виртуальный (${S.cy.ev.length})`);S.cy.ev.forEach(l=>ev.push(siemParse(l,'Server:auth.log')))}
 return{ev,srcs}}
function siemAnalyze(ev){const A=[],by=(f)=>{const o={};ev.filter(f).forEach(e=>{(o[e.ip]=o[e.ip]||[]).push(e)});return o};
 const span=L=>{const t=L.map(e=>e.ts).filter(x=>x!=null);return t.length?Math.max(...t)-Math.min(...t):0};
 const fail=by(e=>e.k==='ssh_fail'),ok=by(e=>e.k==='ssh_ok'),blk=by(e=>e.k==='fw_block'||e.k==='fw_allow');
 Object.entries(fail).forEach(([ip,L])=>{const n=L.length;if(n>=SIEM.thr.ssh){const sev=ok[ip]?'critical':n>=SIEM.thr.ssh*3?'high':'medium',users=[...new Set(L.map(e=>e.user))];
  A.push({sev:ok[ip]?'critical':sev,rule:ok[ip]?'Успешный вход после подбора пароля':'Подбор пароля SSH',ip,n,info:`${n} неудачных попыток за ${span(L)} с; перебирали учётные записи: ${users.slice(0,5).join(', ')}${users.length>5?'…':''}${ok[ip]?'; затем ВХОД УСПЕШЕН — сбросьте пароль и проверьте систему':''}`,act:`Заблокировать ${ip}: acl deny ${ip}/32 any tcp 22; включить блокировку после N неудач (fail2ban), отключить вход root и пароли в пользу ключей.`})}});
 Object.entries(blk).forEach(([ip,L])=>{const ports=new Set(L.filter(e=>e.k==='fw_block').map(e=>e.port));if(ports.size>=SIEM.thr.scan)A.push({sev:ports.size>=SIEM.thr.scan*2?'high':'medium',rule:'Сканирование портов',ip,n:ports.size,info:`${ports.size} различных закрытых портов за ${span(L)} с`,act:`Заблокировать ${ip} на периметре (acl deny ${ip}/32 any …), проверить, какие порты должны быть открыты, включить оповещения о сканировании.`})});
 const ord={critical:0,high:1,medium:2};return A.sort((a,b)=>ord[a.sev]-ord[b.sev]||b.n-a.n)}
const siemSevT={critical:'Критический',high:'Высокий',medium:'Средний'};
document.head.insertAdjacentHTML('beforeend',`<style>
#sm{position:fixed;inset:0;background:#000b;z-index:13;display:flex;align-items:center;justify-content:center;padding:8px}#sm[hidden]{display:none}
#smp{background:var(--pn);color:var(--tx);border:1px solid var(--bd);border-radius:12px;width:min(1100px,100%);height:min(760px,100%);display:flex;flex-direction:column;overflow:hidden}
#smp .pb{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:8px 12px;border-bottom:1px solid var(--bd)}#smp .bd{flex:1;overflow:auto;padding:10px 12px}
#smp table{border-collapse:collapse;width:100%;font-size:13px}#smp td,#smp th{border:1px solid var(--bd);padding:4px 8px;text-align:left;vertical-align:top}
.sv-critical{background:#c6282833}.sv-high{background:#ff9e6433}.sv-medium{background:#f0d86033}
.sbar{display:inline-block;height:10px;background:var(--ac);vertical-align:middle;border-radius:3px}
</style>`);
document.body.insertAdjacentHTML('beforeend','<div id="sm" hidden><div id="smp" role="dialog" aria-label="SIEM"></div></div>');
function siemOpen(){const R=siemCollect();SIEM.ev=R.ev;SIEM.srcs=R.srcs;const A=siemAnalyze(R.ev);SIEM.alerts=A;
 const cnt={};R.ev.filter(e=>e.ip).forEach(e=>{cnt[e.ip]=(cnt[e.ip]||0)+1});const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,8),mx=top.length?top[0][1]:1;
 const o=document.getElementById('smp');o.innerHTML=`<div class="pb"><b>Журналы и SIEM</b><span class="mt">Событий: ${R.ev.length} · источников: ${R.srcs.length}</span><span style="flex:1"></span><label>Порог SSH <input id="sm_t1" type="number" min="2" value="${SIEM.thr.ssh}" style="width:56px"></label><label>Порог портов <input id="sm_t2" type="number" min="2" value="${SIEM.thr.scan}" style="width:56px"></label><button data-x="sm_re">Пересчитать</button><button data-x="sm_dl">Скачать отчёт</button><button data-x="sm_cl">Закрыть</button></div>
<div class="bd"><h3 style="margin:.2em 0">Оповещения (${A.length})</h3>${A.length?`<table><tr><th>Важность</th><th>Правило</th><th>Источник атаки</th><th>Подробности</th><th>Что делать</th></tr>${A.map(a=>`<tr class="sv-${a.sev}"><td><b>${siemSevT[a.sev]}</b></td><td>${asgEsc(a.rule)}</td><td><code>${asgEsc(a.ip)}</code></td><td>${asgEsc(a.info)}</td><td>${asgEsc(a.act)}</td></tr>`).join('')}</table>`:'<p class="ok">Подозрительной активности по текущим порогам не найдено.</p>'}
<h3>Самые активные адреса</h3>${top.length?`<table>${top.map(([ip,n])=>`<tr><td><code>${ip}</code></td><td>${n}</td><td><span class="sbar" style="width:${Math.max(4,Math.round(300*n/mx))}px"></span></td></tr>`).join('')}</table>`:'<p class="mt">Нет данных.</p>'}
<h3>Источники журналов</h3><p class="mt">${R.srcs.length?R.srcs.map(asgEsc).join('<br>'):'Журналы не найдены: положите *.log в домашний каталог компьютера или запустите сценарий «Кибер-учения».'}</p>
<p class="mt">SIEM собирает журналы компьютеров схемы (файлы *.log), разбирает записи sshd и межсетевого экрана и применяет правила корреляции: подбор пароля, сканирование портов, успешный вход после подбора. Учебная модель.</p></div>`;
 document.getElementById('sm').hidden=false;o.querySelectorAll('button,input,h3,table').forEach(e=>e.setAttribute('data-nohelp','1'))}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-x^="sm_"]');if(!b)return;const x=b.dataset.x;
 if(x==='sm_cl'){document.getElementById('sm').hidden=true;return}
 if(x==='sm_re'){SIEM.thr.ssh=Math.max(2,+document.getElementById('sm_t1').value||10);SIEM.thr.scan=Math.max(2,+document.getElementById('sm_t2').value||10);return siemOpen()}
 if(x==='sm_dl'){const A=SIEM.alerts||[];const t=`Отчёт SIEM Стектония, ${new Date().toLocaleString('ru-RU')}\nСобытий: ${SIEM.ev.length}\n\n`+(A.length?A.map((a,i)=>`${i+1}. [${siemSevT[a.sev]}] ${a.rule}: ${a.ip}\n   ${a.info}\n   Действие: ${a.act}`).join('\n\n'):'Оповещений нет')+'\n';const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+t],{type:'text/plain;charset=utf-8'}));a.download='отчёт_SIEM.txt';document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(a.href)},500)}},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const w=document.getElementById('sm');if(w&&!w.hidden){w.hidden=true;e.stopPropagation()}}},true);
// команда brute теперь оставляет следы в виртуальном auth.log Server (если запущен сценарий)
{const _r=run;run=function(c){const a=String(c).trim().split(/\s+/),cm=a[0].toLowerCase();
 if(cm==='brute'&&S.cy&&sel&&dv(sel)&&dv(sel).t==='pc'&&a[1]==='192.168.10.10'){const A=dv(sel),ip=srcIp(A)||'0.0.0.0';const before=(S.cy.ev||[]).length;const r=_r(c);const t=out.textContent;const tries=(t.match(/\[ATTEMPT\]/g)||[]).length;const n=Math.max(tries,1);S.cy.ev=S.cy.ev||[];
  const pc=S.cy.pw,found=/password: /.test(t.slice(-300));const T0=(S.cy.ev.length?0:0);const total=found?Math.max(0,(a[3]?12:CYW.indexOf(pc)+1||10)-1):(a[3]?12:10);
  for(let i=0;i<total&&S.cy.ev.length<400;i++){const s=(S.cy.ev.length%55);S.cy.ev.push(`Nov  3 12:${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')} server sshd[${5000+S.cy.ev.length}]: Failed password for ${a[2]} from ${ip} port ${41000+i} ssh2`)}
  if(found)S.cy.ev.push(`Nov  3 12:00:58 server sshd[5999]: Accepted password for ${a[2]} from ${ip} port 41999 ssh2`);return r}
 return _r(c)}}
(function(){const dd=document.querySelector('#mbar .mi[data-k="n"] .mdd');if(!dd||document.getElementById('bsiem'))return;const b=document.createElement('button');b.id='bsiem';b.type='button';b.textContent='Журналы и SIEM';b.setAttribute('role','menuitem');b.setAttribute('data-nohelp','1');b.setAttribute('data-d','Сбор журналов, правила корреляции, оповещения о подборе пароля и сканировании');b.onclick=siemOpen;dd.appendChild(b)})();
if(typeof QH_ID!=='undefined')QH_ID.bsiem=['Журналы и SIEM','Собирает журналы *.log компьютеров схемы, разбирает их и показывает оповещения: подбор пароля SSH, сканирование портов, успешный вход после подбора. Пороги можно менять.'];
MAN.push(['Т42. Журналы и SIEM',`<p>Пункт «Сеть → Журналы и SIEM» собирает файлы <code>*.log</code> всех компьютеров схемы (например <code>auth.log</code> и <code>firewall.log</code> из сценариев «Кибер-учения»), разбирает записи sshd и межсетевого экрана и применяет правила корреляции:</p><ul><li><b>подбор пароля SSH</b> — много неудачных входов с одного адреса;</li><li><b>сканирование портов</b> — один адрес стучится на много различных закрытых портов;</li><li><b>успешный вход после подбора</b> — признак взлома, важность «Критический».</li></ul><p>Для каждого оповещения показаны важность, адрес источника, подробности и рекомендуемые действия (например, готовая команда <code>acl deny … /32 any tcp 22</code>). Пороги чувствительности меняются в верхней строке, отчёт скачивается текстом. Во время красной команды команда <code>brute</code> оставляет следы в виртуальном журнале сервера, и SIEM видит собственную «атаку».</p><p>Ограничения: разбираются только форматы sshd и UFW из учебных журналов; корреляция упрощена (по адресу источника и счётчикам); времена условные.</p>`]);
