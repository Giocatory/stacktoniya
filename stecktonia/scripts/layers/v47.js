// ===== v47: администрирование — systemctl/service, crontab + cronsim (виртуальное время), df, free, sudo; задания adm1–adm3 =====
const ADM_DEF=()=>({sshd:{s:'active',en:1,d:'OpenBSD Secure Shell server'},cron:{s:'active',en:1,d:'Regular background program processing daemon'},nginx:{s:'inactive',en:0,d:'A high performance web server and a reverse proxy server',conf:'apache2'},apache2:{s:'inactive',en:0,d:'The Apache HTTP Server'},postgresql:{s:'inactive',en:0,d:'PostgreSQL RDBMS'},docker:{s:'inactive',en:0,d:'Docker Application Container Engine'}});
function admSvc(d){if(!d.units){d.units=ADM_DEF();const has=p=>(d.svc||[]).some(x=>x.p==='tcp'&&x.n===p);if(has(80)){d.units.nginx.s='active';d.units.nginx.en=1}if(!has(22)){d.units.sshd.s='inactive';d.units.sshd.en=0}}if(!d.svcLog)d.svcLog={};return d.units}
function admLog(d,n,m){admSvc(d);(d.svcLog[n]=d.svcLog[n]||[]).push(m)}
function admTs(d){const t=new Date(Date.UTC(2026,9,17,12,0)+(d.cronT||0)*6e4);const p=n=>String(n).padStart(2,'0');return`${t.getUTCFullYear()}-${p(t.getUTCMonth()+1)}-${p(t.getUTCDate())} ${p(t.getUTCHours())}:${p(t.getUTCMinutes())}`}
function admUnit(a){return String(a||'').replace(/\.service$/,'')}
function admStatus(d,n){const u=admSvc(d)[n];const act=u.s==='active'?'active (running)':u.s==='failed'?'failed (Result: exit-code)':'inactive (dead)';
 return`${u.s==='active'?'●':u.s==='failed'?'×':'○'} ${n}.service - ${u.d}\n     Loaded: loaded (/lib/systemd/system/${n}.service; ${u.en?'enabled':'disabled'}; vendor preset: enabled)\n     Active: ${act}${u.s==='active'?' since '+admTs(d)+' MSK':''}\n`+((d.svcLog[n]||[]).slice(-3).map(x=>`${admTs(d).slice(5)} ${d.name} ${x}`).join('\n')||'')+'\n'}
function admCtl(X,a,io,sudo){const d=X.d;const S=admSvc(d);a=a.filter(x=>!/^--(no-pager|now|quiet|full)$/.test(x)||x==='--now');const now=a.includes('--now');a=a.filter(x=>x!=='--now');const v=a[0];
 if(!v){io.err('systemctl: укажите команду: status, start, stop, restart, enable, disable, is-active, is-enabled, list-units\n');return 1}
 if(v==='list-units'||v==='list-unit-files'){const f=a.includes('--failed');const rows=Object.keys(S).filter(n=>!f||S[n].s==='failed').map(n=>`${(n+'.service').padEnd(22)} loaded ${S[n].s==='active'?'active running':S[n].s==='failed'?'failed failed ':'inactive dead'} ${S[n].d}`);io.out(rows.length?'UNIT                   LOAD   ACTIVE SUB     DESCRIPTION\n'+rows.join('\n')+`\n\n${rows.length} loaded units listed.\n`:'0 loaded units listed.\n');return 0}
 if(v==='daemon-reload'){return 0}
 const names=a.slice(1).filter(x=>x[0]!=='-').map(admUnit);if(!names.length){io.err(`Too few arguments.\n`);return 1}
 let rc=0;
 for(const n of names){const u=S[n];
  if(!u){io.err(v==='is-active'?'':`Unit ${n}.service could not be found.\n`);if(v==='is-active')io.out('inactive\n');rc=v==='status'?4:v==='is-active'?3:5;continue}
  switch(v){
   case'status':io.out(admStatus(d,n));if(u.s!=='active')rc=3;break;
   case'is-active':io.out(u.s+'\n');if(u.s!=='active')rc=3;break;
   case'is-enabled':io.out((u.en?'enabled':'disabled')+'\n');if(!u.en)rc=1;break;
   case'start':case'stop':case'restart':case'reload':case'enable':case'disable':{
    if(!sudo){io.err(`Failed to ${v} ${n}.service: Interactive authentication required.\nSee system logs and 'systemctl status ${n}.service' for details.\n`);rc=1;break}
    if(v==='enable'){u.en=1;io.out(`Created symlink /etc/systemd/system/multi-user.target.wants/${n}.service → /lib/systemd/system/${n}.service.\n`);if(!now)break}
    if(v==='disable'){u.en=0;io.out(`Removed /etc/systemd/system/multi-user.target.wants/${n}.service.\n`);if(!now)break}
    const st=v==='stop'||v==='disable';
    if(st){if(u.s==='active')admLog(d,n,`systemd[1]: Stopped ${u.d}.`);u.s='inactive';break}
    if(v==='reload'&&u.s!=='active'){io.err(`Failed to reload ${n}.service: Unit ${n}.service is not active.\n`);rc=1;break}
    if(u.conf&&S[u.conf]&&S[u.conf].s==='active'){u.s='failed';admLog(d,n,`${n}[1042]: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)`);admLog(d,n,`systemd[1]: ${n}.service: Failed with result 'exit-code'.`);io.err(`Job for ${n}.service failed because the control process exited with error code.\nSee "systemctl status ${n}.service" and "journalctl -xeu ${n}.service" for details.\n`);rc=1;break}
    u.s='active';admLog(d,n,`systemd[1]: Started ${u.d}.`);break}
   default:io.err(`Unknown command verb ${v}.\n`);return 1}}
 return rc}
BB.systemctl=(X,a,io)=>admCtl(X,a,io,!!X.sudo);
BB.service=(X,a,io)=>{const[n,v]=[admUnit(a[0]),a[1]];if(!n||!v){io.err('Использование: service <имя> {start|stop|restart|status}\n');return 1}if(v==='status'&&X.d)return admCtl(X,['status',n],io,!!X.sudo);return admCtl(X,[v,n],io,!!X.sudo)};
BB.sudo=(X,a,io)=>{if(!a.length){io.err('usage: sudo command\n');return 1}const was=X.sudo;X.sudo=1;try{return bCmd(X,a,io)}finally{X.sudo=was}};
BB.journalctl=(X,a,io)=>{const d=X.d;admSvc(d);let u=null,n=20;for(let i=0;i<a.length;i++){if(a[i]==='-u')u=admUnit(a[++i]);else if(a[i]==='-n')n=+a[++i]||20;else if(/^-u./.test(a[i]))u=admUnit(a[i].slice(2))}
 const all=u?(d.svcLog[u]||[]):Object.keys(d.svcLog).flatMap(k=>d.svcLog[k]);if(u&&!d.units[u]){io.err(`No journal files were found.\n`);return 1}
 io.out(all.length?all.slice(-n).map(x=>`${admTs(d).slice(5)} ${d.name} ${x}`).join('\n')+'\n':'-- No entries --\n');return 0};
// ---- cron ----
function cronField(f,lo,hi){const s=new Set();for(const part of String(f).split(',')){const m=/^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(part);if(!m)return null;let a,b;if(m[1]==='*'){a=lo;b=hi}else if(m[1].includes('-')){[a,b]=m[1].split('-').map(Number)}else{a=+m[1];b=m[2]?hi:a}const st=m[2]?+m[2]:1;if(!st||st>hi-lo+1||a<lo||b>hi||a>b)return null;for(let i=a;i<=b;i+=st)s.add(i)}return s}
function cronParse(txt){const jobs=[],errs=[];const MAC={'@hourly':'0 * * * *','@daily':'0 0 * * *','@midnight':'0 0 * * *','@weekly':'0 0 * * 0','@monthly':'0 0 1 * *','@yearly':'0 0 1 1 *','@annually':'0 0 1 1 *'};
 String(txt||'').split('\n').forEach((l0,i)=>{let l=l0.trim();if(!l||l[0]==='#'||/^[A-Za-z_][A-Za-z0-9_]*=/.test(l))return;const mm=/^(@\w+)\s+(.*)$/.exec(l);if(mm&&MAC[mm[1]])l=MAC[mm[1]]+' '+mm[2];
  const p=l.split(/\s+/);if(p.length<6){errs.push({ln:i+1,m:'bad minute'});return}const F=[[0,59,'minute'],[0,23,'hour'],[1,31,'day-of-month'],[1,12,'month'],[0,7,'day-of-week']];let bad=null;const S=[];
  for(let k=0;k<5;k++){const r=cronField(p[k],F[k][0],F[k][1]);if(!r){bad=F[k][2];break}S.push(r)}if(bad){errs.push({ln:i+1,m:'bad '+bad});return}
  if(S[4].has(7))S[4].add(0);jobs.push({m:S[0],h:S[1],dom:S[2],mon:S[3],dow:S[4],domStar:p[2]==='*',dowStar:p[4]==='*',cmd:p.slice(5).join(' ')})});return{jobs,errs}}
function cronFires(j,t){const m=t.getUTCMinutes(),h=t.getUTCHours(),dm=t.getUTCDate(),mo=t.getUTCMonth()+1,dw=t.getUTCDay();if(!j.m.has(m)||!j.h.has(h)||!j.mon.has(mo))return false;
 const a=j.dom.has(dm),b=j.dow.has(dw);return j.domStar||j.dowStar?(a&&b):(a||b)}
BB.crontab=(X,a,io)=>{const d=X.d;if(a.includes('-l')){if(!d.cron){io.err('no crontab for student\n');return 1}io.out(d.cron.endsWith('\n')?d.cron:d.cron+'\n');return 0}
 if(a.includes('-r')){if(!d.cron){io.err('no crontab for student\n');return 1}d.cron='';return 0}
 if(a.includes('-e')){io.err('crontab -e: интерактивный редактор в Стектонии недоступен. Запишите задания в файл и установите: crontab файл (или printf \'…\' | crontab -)\n');return 1}
 const f=a.filter(x=>x!=='-'&&x[0]!=='-');const src=bInp(X,io,f,'crontab');let t='';for(const x of src){if(x.err)return 1;t+=x.t}
 const r=cronParse(t);if(r.errs.length){r.errs.forEach(e=>io.err(`"${f[0]||'-'}":${e.ln}: ${e.m}\n`));io.err("errors in crontab file, can't install.\n");return 1}d.cron=t;if(!/\n$/.test(d.cron))d.cron+='\n';return 0};
BB.cronsim=(X,a,io)=>{const d=X.d;let n=parseInt(a[0],10);if(!(n>0))n=1;if(n>10080){io.err('cronsim: не более 10080 минут (неделя)\n');return 1}
 if(!d.cron){io.err('cronsim: у пользователя нет crontab (crontab -l)\n');return 1}const r=cronParse(d.cron);const svc=admSvc(d);if(svc.cron.s!=='active'){io.err('cronsim: служба cron не запущена (systemctl status cron)\n');return 1}
 io.out(`Виртуальное время: ${admTs(d)} → +${n} мин\n`);let runs=0;
 for(let i=0;i<n;i++){d.cronT=(d.cronT||0)+1;const t=new Date(Date.UTC(2026,9,17,12,0)+d.cronT*6e4);
  r.jobs.forEach(j=>{if(!cronFires(j,t))return;runs++;const stamp=admTs(d);let buf='';const io2={out:s=>{buf+=s},err:s=>{buf+=s},inp:{t:'',p:0}};
   const X2=Object.assign({},X,{cwd:X.home,env:{...X.env},arr:{},loc:[],funcs:{...X.funcs},opts:{},last:0,traps:{},pos:['cron'],sudo:0});
   try{bRunList(X2,bParse(j.cmd),io2)}catch(e){buf+=String(e&&e.message||e)+'\n'}
   try{sxWrite(sxFs(d),'/var/log/cron.log',`${stamp} CRON: (student) CMD (${j.cmd})\n`,true)}catch(e){}
   io.out(`[${stamp}] ${j.cmd}\n`+(buf?buf.split('\n').filter((x,k,A)=>x||k<A.length-1).map(x=>'    '+x).join('\n')+'\n':''))})}
 io.out(`Запусков: ${runs}\n`);return 0};
// ---- df / free ----
BB.df=(X,a,io)=>{const fs=sxFs(X.d);let b=0;for(const k in fs)if(fs[k]&&!fs[k].d&&typeof fs[k].c==='string')b+=fs[k].c.length;const used=6400000+Math.ceil(b/1024),tot=20971520,hu=a.some(x=>/^-\w*h/.test(x));
 const row=(f,t,u,m)=>hu?`${f.padEnd(12)}${(t/1048576).toFixed(0)+'G'}`.padEnd(18)+`${(u/1048576).toFixed(1)+'G'}`.padStart(6)+`${((t-u)/1048576).toFixed(1)+'G'}`.padStart(7)+`${Math.round(u*100/t)+'%'}`.padStart(5)+' '+m:`${f.padEnd(12)}${String(t).padStart(10)}${String(u).padStart(10)}${String(t-u).padStart(10)}${(Math.round(u*100/t)+'%').padStart(5)} ${m}`;
 io.out((hu?'Filesystem      Size  Used Avail Use% Mounted on\n':'Filesystem     1K-blocks      Used Available Use% Mounted on\n')+[row('/dev/sda1',tot,used,'/'),row('/dev/sda2',1048576,262144,'/boot'),row('tmpfs',2097152,1024,'/run')].join('\n')+'\n');return 0};
BB.free=(X,a,io)=>{const h=a.includes('-h'),g=a.includes('-g');const u=v=>h?(v/1024).toFixed(1)+'Gi':g?Math.round(v/1024):v;io.out(`               total        used        free      shared  buff/cache   available\nMem:     ${String(u(7940)).padStart(10)}${String(u(1820)).padStart(12)}${String(u(4010)).padStart(12)}${String(u(34)).padStart(12)}${String(u(2110)).padStart(12)}${String(u(5870)).padStart(12)}\nSwap:    ${String(u(2048)).padStart(10)}${String(u(0)).padStart(12)}${String(u(2048)).padStart(12)}\n`);return 0};
// ---- задания ----
function admTask(o){const t={id:o.id,sh:'bash',lvl:o.lvl,t:o.t,d:o.d,hint:o.hint,adm:1,term:1,prep:o.prep,chk:o.chk};if(typeof o.sol==='function')Object.defineProperty(t,'sol',{get:o.sol,enumerable:true,configurable:true});else t.sol=o.sol;SXT.push(t);return t}
const admSt=(d,n)=>admSvc(d)[n];
admTask({id:'adm1',lvl:2,t:'Сервис: nginx не запускается',d:'Веб-сервер nginx упал и не стартует. Найдите причину (systemctl status nginx, journalctl -u nginx) и добейтесь, чтобы nginx работал и запускался при загрузке. Помните: управлять службами может только root (sudo). «Подготовить среду» создаёт неисправность.',
 hint:'journalctl -u nginx: порт 80 занят — работает apache2. Остановите и отключите apache2 (sudo systemctl stop apache2; sudo systemctl disable apache2), затем sudo systemctl start nginx и sudo systemctl enable nginx.',
 prep:d=>{d.units=ADM_DEF();d.svcLog={};const S=d.units;S.apache2.s='active';S.apache2.en=1;S.nginx.s='failed';S.nginx.en=0;admLog(d,'apache2','systemd[1]: Started '+S.apache2.d+'.');admLog(d,'nginx','nginx[1042]: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)');admLog(d,'nginx',"systemd[1]: nginx.service: Failed with result 'exit-code'.");return'Среда подготовлена: nginx в состоянии failed, apache2 занял порт 80.'},
 sol:'sudo systemctl stop apache2\nsudo systemctl disable apache2\nsudo systemctl start nginx\nsudo systemctl enable nginx\n',
 chk:d=>[['nginx запущен (active)',admSt(d,'nginx').s==='active'],['nginx включён в автозапуск',!!admSt(d,'nginx').en],['apache2 остановлен',admSt(d,'apache2').s!=='active'],['apache2 убран из автозапуска',!admSt(d,'apache2').en]]});
const admJobs=d=>cronParse(d.cron||'');
admTask({id:'adm2',lvl:2,t:'Cron: резервная копия каждые 5 минут',d:'В домашнем каталоге лежит backup.sh. Настройте crontab пользователя так, чтобы backup.sh запускался каждые 5 минут (а не каждую минуту и не раз в час). Проверьте установку: crontab -l; проверьте работу: cronsim 10. Вывод скрипта можно дописывать в ~/backup.log.',
 hint:'Формат строки: минута час день месяц день_недели команда. «Каждые 5 минут» — */5. Пример: printf \'*/5 * * * * $HOME/backup.sh >> $HOME/backup.log 2>&1\\n\' | crontab -',
 prep:d=>{d.cron='';d.cronT=0;d.units=ADM_DEF();sxPutF(d,SXH+'/backup.sh','#!/bin/bash\necho "резервная копия $(date +%H:%M)"\n');return'Создан ~/backup.sh; crontab пуст.'},
 sol:"chmod +x ~/backup.sh\nprintf '*/5 * * * * $HOME/backup.sh >> $HOME/backup.log 2>&1\\n' | crontab -\n",
 chk:d=>{const r=admJobs(d),js=r.jobs.filter(j=>/backup\.sh/.test(j.cmd));const at=(m,h)=>js.some(j=>cronFires(j,new Date(Date.UTC(2026,9,19,h||3,m))));return[['crontab установлен без ошибок',!!d.cron&&r.errs.length===0],['есть задание с backup.sh',js.length>0],['запуск в :00, :05, :10 и :55',at(0)&&at(5)&&at(10)&&at(55)],['нет запуска в :01 и :07',!at(1)&&!at(7)]]}});
admTask({id:'adm3',lvl:3,t:'Cron: ночной отчёт по будням в 03:30',d:'Создайте crontab, который запускает ~/report.sh в 03:30 только по будням (понедельник–пятница). По выходным и в другое время запускаться не должен. Затем проверьте cronsim 1440.',
 hint:'Поля: 30 3 * * 1-5 команда. День недели: 0 или 7 — воскресенье, 1 — понедельник. Установка: crontab файл или printf … | crontab -',
 prep:d=>{d.cron='';d.cronT=0;d.units=ADM_DEF();sxPutF(d,SXH+'/report.sh','#!/bin/bash\necho "отчёт готов"\n');return'Создан ~/report.sh; crontab пуст.'},
 sol:"printf '30 3 * * 1-5 $HOME/report.sh\\n' | crontab -\n",
 chk:d=>{const r=admJobs(d),js=r.jobs.filter(j=>/report\.sh/.test(j.cmd));const at=(day,h,m)=>js.some(j=>cronFires(j,new Date(Date.UTC(2026,9,day,h,m))));/* 19.10.2026 — понедельник, 23 — пятница, 24 — суббота, 25 — воскресенье */return[['crontab установлен без ошибок',!!d.cron&&r.errs.length===0],['есть задание с report.sh',js.length>0],['понедельник и пятница 03:30 — запуск',at(19,3,30)&&at(23,3,30)],['суббота и воскресенье — нет запуска',!at(24,3,30)&&!at(25,3,30)],['другое время — нет запуска',!at(19,3,31)&&!at(19,4,30)]]}});
if(typeof exSyncCustom==='function')exSyncCustom();
p('Новое (v47): администрирование — systemctl/service/journalctl, sudo, crontab + cronsim (виртуальное время), df, free; задания adm1–adm3.');
