// ===== v24: экзамен по скриптам и Git, раздел в отчёте =====
const sxqMk=t=>({sx:1,id:t.id,n:'Скрипты: '+t.t,min:t.lvl===1?15:t.lvl===2?20:30,tag:({bash:'bash',cmd:'cmd/bat',ps:'PowerShell',git:'Git'})[t.sh],
 init:r=>({}),
 start:c=>{const i=TPL.findIndex(x=>/скрипты и Git/.test(x.n));exLoad0(i);const d=sxTD();if(d&&t.prep)try{t.prep(d)}catch(e){}},
 text:c=>`${t.d} Рабочее место: компьютер PC1, окно «Скрипты». Схема загружена из шаблона «Практикум: скрипты и Git» (Git-сервер Git1, 10.0.0.10, репозиторий team/app).`,
 crit:c=>{let R;try{R=t.chk(sxTD())}catch(e){R=[['Проверка не выполнена',false]]}const n=R.length,b=Math.floor(100/n);return R.map(([l,ok],k)=>[l,b+(k===0?100-b*n:0),()=>ok])}});
{const _s=exSyncCustom;exSyncCustom=function(){_s();SXT.forEach(t=>EXQ.push(sxqMk(t)))}}
{const _b=exBuild;exBuild=function(name,variant,mode,strict){if(mode!=='scripts')return _b(name,variant,mode,strict);
 exSyncCustom();const r=exRng(variant*7919+29),pick=a=>a.splice(Math.floor(r()*a.length),1)[0];const idx=sh=>EXQ.map((q,i)=>q.sx&&(sh?q.tag==='Git':q.tag!=='Git')?i:-1).filter(i=>i>=0);
 const A=idx(false),G=idx(true);const ids=[pick(A),pick(A),pick(G)];const t=ids.map(q=>({q,ctx:{},att:0,res:null,spent:0}));
 return{name:name||'',variant,strict:!!strict,tasks:t,cur:0,final:null,t0:Date.now()}}}
{const _m=exMenu;exMenu=function(){exSyncCustom();return _m().replace('<option value="ticket">','<option value="scripts">Билет по скриптам и Git — 3 задания (2 скрипта + Git)</option><option value="ticket">')}}
{const _r=run;run=function(c){const a=c.trim().split(/\s+/);if(a[0].toLowerCase()==='exam'&&(a[1]||'').toLowerCase()==='start'&&a[2]==='scripts'){exSyncCustom();exStart(a.slice(4).join(' '),+a[3]||1,'scripts',false);return p(`Экзамен по скриптам и Git начат: вариант ${+a[3]||1}, заданий ${EXS.tasks.length}. Откройте «Скрипты» на PC1.`)}return _r(c)}}
{const _rh=reportHtml;reportHtml=function(name){let h=_rh(name);const pr=sxLsGet(),n=SXT.filter(t=>pr[t.id]).length;
 const dd=S.devs.filter(x=>sxEnd(x)&&x.fs&&Object.keys(x.fs).some(k=>/^\/(home\/student|c\/Users\/student)\//.test(k)&&!x.fs[k].d&&!/hello\.(sh|bat|ps1)$/.test(k)&&!/\/\.git\//.test(k)));
 const sec=`<h2>7а. Скрипты и Git</h2><p>Выполнено заданий по скриптам и Git: ${n} из ${SXT.length}.</p>`+(n?'<table><tr><th>Задание</th><th>Оболочка</th></tr>'+SXT.filter(t=>pr[t.id]).map(t=>`<tr><td>${esc(t.t)}</td><td>${t.sh==='ps'?'PowerShell':t.sh}</td></tr>`).join('')+'</table>':'')+dd.map(x=>{const fl=Object.keys(x.fs).filter(k=>/^\/(home\/student|c\/Users\/student)\//.test(k)&&!x.fs[k].d&&!/\/\.git\//.test(k)&&!/hello\.(sh|bat|ps1)$/.test(k)).slice(0,25);const repos=Object.keys(x.gdb||{}).filter(k=>!x.gdb[k].bare);return`<p><b>${esc(x.name)}</b>: файлов — ${fl.length}${repos.length?'; репозитории: '+repos.map(esc).join(', '):''}</p><pre>${esc(fl.map(sxWin).join('\n'))}</pre>`}).join('');
 return h.replace('<h2>8. Журнал',sec+'<h2>8. Журнал')}}
exSyncCustom();
p('Новое (v24): экзамен «Билет по скриптам и Git» (exam start scripts), раздел о скриптах и Git в отчёте.');
