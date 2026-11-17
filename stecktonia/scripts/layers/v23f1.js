// ===== v23f1: скрипты и Git — сессии, команды консоли, шаблон =====
const SXS={};
const sxEnd=d=>!!d&&d.t==='pc';
function sxSession(d,shell){const k=d.id+':'+shell;let s=SXS[k];if(!s||s.d!==d){s=SXS[k]=shell==='bash'?sxSess(d,'bash'):shell==='cmd'?cSess(d):psSess(d)}s.fs=sxFs(d);return s}
const sxShellOf=p=>/\.(sh|bash|py)$/i.test(p)?'bash':/\.(bat|cmd)$/i.test(p)?'cmd':/\.ps1$/i.test(p)?'ps':null;
const sxShellName={bash:'bash',cmd:'cmd',ps:'PowerShell'};
function sxPrompt(d,shell){const s=sxSession(d,shell);if(shell==='bash'){const h=s.home,c=s.cwd;return`student@${d.name}:${c===h?'~':c.startsWith(h+'/')?'~'+c.slice(h.length):c}$ `}if(shell==='cmd')return cWin(s.cwd)+'>';return'PS '+cWin(s.cwd)+'> '}
function sxAsk(){return(txt)=>{try{if(typeof prompt==='function'){const r=prompt(String(txt||'Ввод:'));return r===null?null:r}}catch(e){}return null}}
// выполнить строку в оболочке; возвращает {o,e,code}
function sxExec(d,shell,line,opt){opt=opt||{};const X=sxSession(d,shell);let o='',e='';const out=s=>{o+=s},err=s=>{e+=s};X.ask=opt.ask===undefined?null:opt.ask;X.cleared=false;let code=0;
 const inp={t:opt.stdin||'',p:0};
 if(shell==='bash'){X.out=out;X.err=err;X.inp=inp;code=bashExec(X,line)}
 else if(shell==='cmd'){code=cmdLine(X,line,{inp,out,err,tty:true});X.out=out}
 else{code=psLine(S_(X),line,{inp,out,err})}
 return{o,e,code,cleared:!!X.cleared||!!X.cleared}}
const S_=x=>x;
// запустить файл
function sxRunFile(d,path,args,opt){opt=opt||{};const sh=sxShellOf(path);if(!sh)return{o:'',e:'Неизвестный тип файла (поддерживаются .sh, .bat, .cmd, .ps1)\n',code:126};
 const X=sxSession(d,sh);let o='',e='';const out=s=>{o+=s},err=s=>{e+=s};X.ask=opt.ask===undefined?null:opt.ask;const inp={t:opt.stdin||'',p:0};let code=0;args=args||[];
 const q=s=>"'"+String(s).replace(/'/g,"'\\''")+"'";
 if(sh==='bash'){X.out=out;X.err=err;X.inp=inp;code=bashExec(X,(/\.py$/i.test(path)?'python3 ':'bash ')+q(path)+args.map(a=>' '+q(a)).join(''))}
 else if(sh==='cmd'){code=cmdFile(X,path,args,{inp,out,err,tty:true})}
 else{code=psFile(X,path,args,{inp,out,err})}
 return{o,e,code}}
// свежая сессия для проверок (не трогает рабочие каталоги студента)
function sxFresh(d,shell){const s=shell==='bash'?sxSess(d,'bash'):shell==='cmd'?cSess(d):psSess(d);s.fs=sxFs(d);return s}
function sxRunFresh(d,path,args,stdin){const sh=sxShellOf(path);const X=sxFresh(d,sh);let o='',e='';const out=s=>{o+=s},err=s=>{e+=s};const inp={t:stdin||'',p:0};let code=0;const q=s=>"'"+String(s).replace(/'/g,"'\\''")+"'";
 try{if(sh==='bash'){X.out=out;X.err=err;X.inp=inp;code=bashExec(X,(/\.py$/i.test(path)?'python3 ':'bash ')+q(path)+(args||[]).map(a=>' '+q(a)).join(''))}else if(sh==='cmd')code=cmdFile(X,path,args||[],{inp,out,err,tty:true});else code=psFile(X,path,args||[],{inp,out,err})}catch(x){e+=String(x&&x.message||x)}
 return{o,e,code}}
// ---- консоль ----
function sxPrint(text){const l=String(text).split('\n');if(l.length&&l[l.length-1]==='')l.pop();l.forEach(x=>p(x))}
function sxConsole(d,shell,rest,isFileCapable){const ask=sxAsk();
 if(!sxEnd(d)){p('Скрипты доступны на компьютерах и серверах (не на коммутаторах и маршрутизаторах).');return}
 if(!rest.length){p(`Оболочка ${sxShellName[shell]}: укажите команду или файл. Пример: ${shell==='bash'?'bash -c "echo привет" | bash hello.sh':shell==='cmd'?'cmd /c "echo привет" | bat hello.bat':'powershell -Command "Get-Date" | ps1 hello.ps1'}. Полноценное окно с редактором, терминалом и Git: команда scripts.`);return}
 let r;const f0=rest[0];
 if(shell==='bash'&&(f0==='-c')){r=sxExec(d,'bash',rest.slice(1).join(' ').replace(/^(["'])([\s\S]*)\1$/,'$2'),{ask})}
 else if(shell==='cmd'&&/^\/[ck]$/i.test(f0)){r=sxExec(d,'cmd',rest.slice(1).join(' ').replace(/^"([\s\S]*)"$/,'$1'),{ask})}
 else if(shell==='ps'&&/^-(c|command)$/i.test(f0)){r=sxExec(d,'ps',rest.slice(1).join(' ').replace(/^(["'])([\s\S]*)\1$/,'$2'),{ask})}
 else{const args=rest.slice(shell==='ps'&&/^-(f|file)$/i.test(f0)?2:1);const file=shell==='ps'&&/^-(f|file)$/i.test(f0)?rest[1]:f0;const X=sxSession(d,shell);const ap=sxNorm(X.cwd,String(file).replace(/\\/g,'/'),X.home);
  let path=ap;if(shell==='cmd'){const b=cFindBat(X,file);if(b)path=b}if(!X.fs[path]||X.fs[path].d){p(`${sxShellName[shell]}: ${file}: файл не найден`);return}r=sxRunFile(d,path,args,{ask})}
 if(r.o)sxPrint(r.o);if(r.e)sxPrint(r.e)}
{const _run23=run;run=function(c){const s=c.trim();if(!s)return _run23(c);const a=s.split(/\s+/),cm=a[0].toLowerCase(),d=sel&&dv(sel);
  const restStr=s.slice(a[0].length).trim();const rest=(restStr.match(/"[^"]*"|'[^']*'|\S+/g)||[]).map(x=>/^["'][\s\S]*["']$/.test(x)&&!/^-c$/.test(x)&&false?x.slice(1,-1):x);
  const unq=x=>x.replace(/^(["'])([\s\S]*)\1$/,'$2');
  if(cm==='scripts'||cm==='edit'){if(!d)return p('Сначала выберите устройство (компьютер или сервер).');if(!sxEnd(d))return p('Скрипты доступны на компьютерах и серверах.');sxOpen(d,cm==='edit'&&rest[0]?unq(rest[0]):null);return}
  if(cm==='stask'){return sxTaskCmd(rest.map(unq))}
  if(cm==='repo'){if(!d)return p('Сначала выберите Git-сервер.');if(d.role!=='git')return p('Команда repo работает на Git-сервере (добавьте устройство «Git-сервер»).');return sxPrint(repoCmd(d,rest.map(unq)))}
  if(['bash','sh'].includes(cm)){if(!d)return p('Сначала выберите устройство.');const r2=rest.length?rest:[];const rr=r2.map((x,i)=>i===1&&r2[0]==='-c'?x:unq(x));if(rr[0]==='-c')return sxConsole(d,'bash',['-c',rr.slice(1).join(' ')]);return sxConsole(d,'bash',rr)}
  if(['bat','cmd'].includes(cm)){if(!d)return p('Сначала выберите устройство.');if(cm==='cmd'&&!rest.length)return sxConsole(d,'cmd',[]);return sxConsole(d,'cmd',/^\/[ck]$/i.test(rest[0]||'')?[rest[0],rest.slice(1).join(' ')]:rest.map(unq))}
  if(['ps1','powershell','pwsh'].includes(cm)){if(!d)return p('Сначала выберите устройство.');return sxConsole(d,'ps',/^-(c|command)$/i.test(rest[0]||'')?[rest[0],rest.slice(1).join(' ')]:rest.map(unq))}
  if(cm==='git'){if(!d)return p('Сначала выберите устройство.');if(!sxEnd(d)&&d.role!=='git')return p('git доступен на компьютерах и серверах.');const X=sxSession(d,'bash');const io={out:x=>{},err:x=>{}};let o='',e='';const args=rest.map(unq);const code=gitRun(d,X.cwd,args,{out:x=>o+=x,err:x=>e+=x});if(o)sxPrint(o);if(e)sxPrint(e);return}
  return _run23(c)}}
CMDS.push(['scripts','scripts | edit <файл>','Окно «Скрипты»: редактор, терминал (bash/cmd/PowerShell), Git и задания','Открывает окно для выбранного компьютера или сервера: дерево файлов, редактор с запуском, терминал трёх оболочек, панель Git с историей и задания с автопроверкой. Файлы хранятся на устройстве и сохраняются вместе со схемой.','scripts','Скрипты и Git']);
CMDS.push(['bash','bash <файл.sh> [арг…] | bash -c "команды"','Запуск bash-скрипта или команды на выбранном ПК','Интерпретатор — упрощённый подмножество bash (переменные, массивы, циклы, функции, case, here-doc, конвейеры, sed/awk/grep, git и сетевые утилиты).','bash -c "echo привет; ls"','Скрипты и Git']);
CMDS.push(['bat','bat <файл.bat> [арг…] | cmd /c "команда"','Запуск bat/cmd-файла или команды cmd','Подмножество cmd: set, if/for/goto/call, %1, %~dp0, !var! при enabledelayedexpansion, find/findstr, dir/copy/move/del, ping и др.','bat hello.bat','Скрипты и Git']);
CMDS.push(['ps1','ps1 <файл.ps1> [арг…] | powershell -Command "…"','Запуск PowerShell-скрипта или команды','Подмножество PowerShell: переменные, массивы, хеш-таблицы, функции, try/catch, конвейер (Where/Select/Sort/Group/Measure), Get-ChildItem, Get-Content, Test-Connection и др.','powershell -Command "Get-Date"','Скрипты и Git']);
CMDS.push(['git','git <команда> …','Git на выбранном ПК: init, add, commit, branch, merge, push, pull…','Рабочий каталог — текущий каталог оболочки bash. Удалённые репозитории — на Git-сервере схемы, доступность проверяется настоящими пакетами (ping/TCP 22).','git status','Скрипты и Git']);
CMDS.push(['repo','repo create|list|protect|unprotect|show|delete <имя>','Управление репозиториями на Git-сервере','Создаёт «голые» репозитории в /srv/git, защищает ветки и показывает содержимое.','repo create team/app','Скрипты и Git']);
CMDS.push(['stask','stask list | check <№>','Задания по скриптам и Git: список и проверка из консоли','То же, что вкладка «Задания» в окне «Скрипты».','stask list','Скрипты и Git']);
['scripts','edit','bash','sh','bat','cmd','ps1','powershell','pwsh','git','repo','stask'].forEach(n=>{if(!CMDNAMES.includes(n))CMDNAMES.push(n)});
// ---- шаблон ----
TPL.push({n:'Практикум: скрипты и Git (два ПК и Git-сервер)',d:'Два компьютера и сервер Git в одной сети. Откройте окно «Скрипты» (кнопка или команда scripts), решайте задания по bash, cmd, PowerShell и Git; репозиторий team/app уже создан на сервере.',hint:'Выберите PC1 и выполните scripts. Адрес сервера: 10.0.0.10, репозиторий ssh://git@10.0.0.10/team/app.git.',
 dev:[['pc','PC1',120,160],['pc','PC2',120,330],['sw','SW1',320,245],['git','Git1',520,245]],link:[['PC1',0,'SW1',0],['PC2',0,'SW1',1],['Git1',0,'SW1',2]],
 cfg:[['PC1','ip eth0 10.0.0.1 /24'],['PC2','ip eth0 10.0.0.2 /24'],['Git1','ip eth0 10.0.0.10 /24','repo create team/app']]});

MAN.push(['Т23. Скрипты (bash, cmd, PowerShell) и Git',`<h3>Скрипты и Git</h3><p>Кнопка <b>Скрипты</b> (команда <code>scripts</code>) открывает окно для выбранного компьютера: дерево файлов, редактор (Ctrl+S — сохранить, Ctrl+Enter — запустить), терминал bash / cmd / PowerShell, панель Git и 25 заданий с автопроверкой.</p><p>Файлы хранятся на устройстве и сохраняются вместе со схемой. Домашний каталог bash — <code>/home/student</code>, Windows — <code>C:\\Users\\student</code> (тот же диск, путь <code>/c/Users/student</code>).</p><p>Запуск из консоли: <code>bash file.sh</code>, <code>bat file.bat</code>, <code>ps1 file.ps1</code>, <code>bash -c "ls"</code>. Git работает на ПК и сервере: <code>git init/add/commit/branch/merge/push/pull/clone/revert/tag…</code>. «Удалённым репозиторием» служит устройство <b>Git-сервер</b> (команда <code>repo create team/app</code>, адрес <code>ssh://git@IP/team/app.git</code>); push и clone идут по настоящей схеме сети, поэтому без кабеля или IP они не работают.</p><p>Задания: <code>stask list</code>, <code>stask prep N</code>, <code>stask check N</code>.</p><p class="mt">Интерпретаторы — упрощённые подмножества, не настоящие оболочки; хеши коммитов условные, <code>sleep</code> виртуальный.</p>`]);
