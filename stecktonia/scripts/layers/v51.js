// ===== v51: удалённое администрирование — ssh host 'команда', scp, службы открывают порты; задания rm1–rm2 =====
const ADM_PORT={sshd:[22],nginx:[80],apache2:[80],postgresql:[5432]};
function admSync(d){admSvc(d);d.svc=Array.isArray(d.svc)?d.svc:[];
 for(const [u,ports] of Object.entries(ADM_PORT)){ports.forEach(pt=>{const i=d.svc.findIndex(s=>s.p==='tcp'&&s.n===pt);
  const on=Object.keys(ADM_PORT).some(o=>ADM_PORT[o].includes(pt)&&d.units[o]&&d.units[o].s==='active');
  if(on&&i<0)d.svc.push({p:'tcp',n:pt,u:u});else if(!on&&i>=0)d.svc.splice(i,1)})}}
{const a=BB.systemctl,b=BB.service;BB.systemctl=(X,A,io)=>{const r=a(X,A,io);admSync(X.d);return r};BB.service=(X,A,io)=>{const r=b(X,A,io);admSync(X.d);return r}}
function sshFind(h){h=String(h||'').toLowerCase();return S.devs.find(x=>x.name.toLowerCase()===h)||S.devs.find(x=>{const ip=srcIp(x);return ip&&ip===h})}
function sshConn(X,io,host,port,cmdName){const T=sshFind(host);const src=X.d;
 if(!T){io.err(`${cmdName}: Could not resolve hostname ${host}: Name or service not known\n`);return null}
 const ip=srcIp(T);if(!ip){io.err(`${cmdName}: connect to host ${host} port ${port}: No route to host\n`);return null}
 admSync(T);let r;try{r=T===src?{ok:true,state:'open'}:l4(src,ip,'tcp',port)}catch(e){io.err(`${cmdName}: ${e.message}\n`);return null}
 const st=r.state||(r.ok?'open':'unreach');
 if(st!=='open'){io.err(`${cmdName}: connect to host ${host} port ${port}: ${st==='closed'?'Connection refused':st==='unreach'?'No route to host':'Connection timed out'}\n`);return null}
 return T}
function sshLogin(X,io,T,host,user,cmdName){src=X.d;if(user&&user!=='student'){io.err(`${user}@${host}: Permission denied (publickey,password).\n`);return false}
 src.known=src.known||{};if(!src.known[T.id]){src.known[T.id]=1;io.err(`Warning: Permanently added '${host}' (ED25519) to the list of known hosts.\n`)}return true}
BB.ssh=(X,a,io)=>{let port=22,user=null,host=null;const rest=[];
 for(let i=0;i<a.length;i++){const x=a[i];if(x==='-p'){port=+a[++i]||22}else if(x==='-l'){user=a[++i]}else if(x==='-i'||x==='-o'||x==='-F'||x==='-J'){i++}else if(/^-[qvtTAXNy4]+$/.test(x)||x==='-vv'){}else if(host===null&&x[0]!=='-'){const m=/^(?:([^@]+)@)?(.+)$/.exec(x);user=m[1]||user;host=m[2]}else rest.push(x)}
 if(!host){io.err('usage: ssh [-p порт] [-l пользователь] [пользователь@]узел [команда]\n');return 255}
 const T=sshConn(X,io,host,port,'ssh');if(!T)return 255;if(!sshLogin(X,io,T,host,user,'ssh'))return 255;
 if(!rest.length){io.err('Стектония: интерактивный сеанс недоступен — задайте команду: ssh '+(user||'student')+'@'+host+" 'команда'\n");return 1}
 const cmd=rest.join(' ');const S2=sxSession(T,'bash');let buf='',errb='';const io2={out:s=>{buf+=s},err:s=>{errb+=s},inp:{t:'',p:0}};
 const X2=Object.assign({},S2,{cwd:S2.home,env:{...S2.env},arr:{},loc:[],funcs:{...S2.funcs},opts:{},last:0,traps:{},pos:['ssh'],sudo:0,fs:sxFs(T)});let c=0;
 try{c=bRunList(X2,bParse(cmd),io2)}catch(e){if(e&&e.bx==='exit')c=e.n;else if(e&&e.syn){errb+=`bash: ${e.message}\n`;c=2}else errb+=String(e&&e.message||e)+'\n',c=1}
 admSync(T);if(buf)io.out(buf);if(errb)io.err(errb);return c||0};
BB.scp=(X,a,io)=>{const args=a.filter((x,i)=>!(x[0]==='-')&&a[i-1]!=='-P'&&a[i-1]!=='-i'&&a[i-1]!=='-o');let port=22;const pi=a.indexOf('-P');if(pi>=0)port=+a[pi+1]||22;const rec=a.includes('-r');
 if(args.length<2){io.err('usage: scp [-r] [-P порт] источник цель  (удалённый путь: пользователь@узел:путь)\n');return 1}
 const parse=s=>{const m=/^(?:([^@\/:]+)@)?([^:\/]+):(.*)$/.exec(s);return m?{u:m[1]||null,h:m[2],p:m[3]}:null};
 const src=args[0],dst=args[1],rs=parse(src),rd=parse(dst);if(rs&&rd){io.err('Стектония: копирование между двумя удалёнными узлами не поддерживается\n');return 1}
 if(!rs&&!rd){io.err('scp: нужен удалённый путь вида пользователь@узел:путь\n');return 1}
 const rem=rs||rd;const T=sshConn(X,io,rem.h,port,'scp');if(!T)return 1;if(!sshLogin(X,io,T,rem.h,rem.u,'scp'))return 1;
 const fsL=sxFs(X.d),fsR=sxFs(T),S2=sxSession(T,'bash');
 const absR=p=>{p=p||'.';return sxNorm(S2.home,p,S2.home)};
 const copy=(fa,pa,fb,pb)=>{const n=fa[pa];if(!n){return`scp: ${pa}: No such file or directory`}
  if(n.d){if(!rec)return`scp: ${pa.replace(/^.*\//,'')}: not a regular file`;const e=sxMk(fb,pb,true);if(e&&e!=='File exists')return`scp: ${pb}: ${e}`;const pre=pa+'/';for(const k of Object.keys(fa).filter(k=>k.startsWith(pre))){const t=pb+'/'+k.slice(pre.length);if(fa[k].d)sxMk(fb,t,true);else{sxMk(fb,t.slice(0,t.lastIndexOf('/')),true);fb[t]={c:fa[k].c,m:fa[k].m}}}return null}
  let t=pb;if(fb[t]&&fb[t].d)t=t+'/'+pa.replace(/^.*\//,'');const par=t.slice(0,t.lastIndexOf('/'))||'/';if(!fb[par]||!fb[par].d)return`scp: ${t}: No such file or directory`;fb[t]={c:n.c,m:n.m};return null};
 let err;if(rd){err=copy(fsL,sxNorm(X.cwd,src,X.home),fsR,absR(rd.p||'.'))}else{err=copy(fsR,absR(rs.p),fsL,sxNorm(X.cwd,dst,X.home))}
 if(err){io.err(err+'\n');return 1}const sh=(rd?src:rs.p).replace(/^.*\//,'');io.err('');io.out(`${sh}`.padEnd(40)+'100%\n');return 0};
// ---- задания ----
const rmSrv=()=>S.devs.find(x=>x.role==='git');
admTask({id:'rm1',lvl:2,t:'Удалённый деплой: scp и ssh',d:'С выбранного ПК (PC1) разверните сайт на сервере Git1 (командой по SSH, без интерактивного входа). В ~/site лежит index.html. 1) Скопируйте его на сервер в каталог ~/www командой scp (сначала создайте каталог на сервере: ssh student@<IP Git1> "mkdir -p ~/www"). 2) Запустите на сервере веб-сервер: ssh student@<IP Git1> "sudo systemctl start nginx". 3) Убедитесь, что порт 80 сервера доступен: connect <IP Git1> tcp 80. IP сервера: команда ipconfig на Git1 или вкладка Git.',
 hint:'ssh student@IP "mkdir -p ~/www" · scp ~/site/index.html student@IP:~/www/index.html · ssh student@IP "sudo systemctl start nginx" · проверка: ssh student@IP "ls ~/www; systemctl is-active nginx". Первое подключение выводит предупреждение о known hosts — это нормально.',
 prep:d=>{const s=rmSrv();if(!s)return'В схеме нет Git-сервера: загрузите шаблон «Практикум: скрипты и Git».';sxPutF(d,SXH+'/site/index.html','<h1>Сайт колледжа</h1>\n');s.units=ADM_DEF();s.svc=(s.svc||[]).filter(x=>!x.u);const fs=sxFs(s);sxRm(fs,SXH+'/www',true);d.known={};return'Создан ~/site/index.html; на сервере '+s.name+' веб-сервер nginx остановлен, каталога ~/www нет.'},
 sol:()=>{const s=rmSrv();const ip=s&&srcIp(s);return`ssh student@${ip} "mkdir -p ~/www"\nscp ~/site/index.html student@${ip}:~/www/index.html\nssh student@${ip} "sudo systemctl start nginx"\n`},
 chk:d=>{const s=rmSrv();if(!s)return[['Git-сервер есть в схеме',false]];admSync(s);const f=sxFs(s)[SXH+'/www/index.html'];let st='-';try{st=l4(d,srcIp(s),'tcp',80).state}catch(e){}return[['файл index.html скопирован на сервер (~/www)',!!f&&/Сайт колледжа/.test(f.c||'')],['nginx на сервере запущен',s.units.nginx.s==='active'],['порт 80 сервера доступен с ПК',st==='open']]}});
admTask({id:'rm2',lvl:3,t:'Удалённая диагностика: упавший nginx на сервере',d:'На сервере Git1 не работает веб-сервер nginx, пользователи жалуются на недоступность сайта. Не заходя на сервер физически, выполните диагностику и ремонт по SSH с PC1: найдите причину (systemctl status nginx, journalctl -u nginx через ssh student@<IP> "команда"), устраните её и добейтесь, чтобы nginx работал и был включён в автозапуск, а порт 80 отвечал.',
 hint:'ssh student@IP "journalctl -u nginx" покажет, что порт 80 занят apache2. Исправление: ssh student@IP "sudo systemctl stop apache2; sudo systemctl disable apache2; sudo systemctl start nginx; sudo systemctl enable nginx"',
 prep:d=>{const s=rmSrv();if(!s)return'В схеме нет Git-сервера: загрузите шаблон «Практикум: скрипты и Git».';s.units=ADM_DEF();s.svcLog={};const U=s.units;U.apache2.s='active';U.apache2.en=1;U.nginx.s='failed';admLog(s,'apache2','systemd[1]: Started '+U.apache2.d+'.');admLog(s,'nginx','nginx[1042]: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)');admLog(s,'nginx',"systemd[1]: nginx.service: Failed with result 'exit-code'.");s.svc=(s.svc||[]).filter(x=>!x.u);admSync(s);d.known={};return'На сервере '+s.name+' nginx упал: порт 80 занял apache2.'},
 sol:()=>{const s=rmSrv();const ip=s&&srcIp(s);return`ssh student@${ip} "sudo systemctl stop apache2; sudo systemctl disable apache2; sudo systemctl start nginx; sudo systemctl enable nginx"\n`},
 chk:d=>{const s=rmSrv();if(!s)return[['Git-сервер есть в схеме',false]];admSync(s);const U=s.units;let st='-';try{st=l4(d,srcIp(s),'tcp',80).state}catch(e){}return[['nginx на сервере запущен',U.nginx.s==='active'],['nginx включён в автозапуск',!!U.nginx.en],['apache2 остановлен и отключён',U.apache2.s!=='active'&&!U.apache2.en],['порт 80 сервера доступен с ПК',st==='open']]}});
ADMC.push('ssh','scp');
CMDS.push(['scp','ssh [пользователь@]узел \'команда\' · scp [-r] источник пользователь@узел:путь','Удалённое выполнение команд и копирование файлов по SSH','Из терминала bash: ssh student@10.0.0.10 "systemctl status nginx" выполняет команду на другом узле схемы (интерактивный вход недоступен) и возвращает вывод и код возврата. scp копирует файл или каталог (-r) на узел и обратно. Условия: у узла есть IP, работает sshd (порт 22), межсетевой экран не закрывает порт; пользователь — student. Без связи — «Connection timed out» / «Connection refused». Службы systemd открывают порты: запущенный nginx слушает 80, sshd — 22.','Скрипты и Git']);
if(typeof exSyncCustom==='function')exSyncCustom();
p('Новое (v51): ssh узел "команда" и scp между узлами схемы, службы открывают порты; задания rm1–rm2.');
MAN.push(['Т27. Удалённое администрирование: ssh и scp',`<h3>ssh и scp между узлами схемы</h3>
<p>В терминале bash узла можно выполнять команды на другом узле схемы: <code>ssh student@10.0.0.10 "systemctl status nginx"</code>. Интерактивный вход в симуляторе недоступен — всегда указывайте команду в кавычках; вывод и код возврата приходят обратно. Допустимо несколько команд: <code>ssh student@IP "cd /srv; ls; cat notes.txt"</code>. Имя узла можно писать вместо IP (<code>student@Git1</code>).</p>
<p>Условия подключения: у узла есть IP, запущена служба sshd (порт 22: <code>sudo systemctl start sshd</code>), межсетевой экран не закрывает порт, пользователь — <code>student</code> (root входить не может: «Permission denied»). Типовые ошибки: <i>Connection timed out</i> — порт закрыт фильтром или нет маршрута; <i>Connection refused</i> — sshd не запущен; <i>Could not resolve hostname</i> — неверное имя. При первом подключении выводится предупреждение о known hosts — это нормально.</p>
<p><b>scp</b> копирует файлы: <code>scp ~/site/index.html student@10.0.0.10:~/www/index.html</code> (на узел), <code>scp student@10.0.0.10:~/log.txt ~/log.txt</code> (с узла), <code>scp -r каталог student@IP:~/</code> (каталог). Каталог назначения на узле должен существовать (создайте его: <code>ssh student@IP "mkdir -p ~/www"</code>).</p>
<p>Службы systemd открывают порты: запущенный nginx слушает 80, sshd — 22, postgresql — 5432; после <code>sudo systemctl stop nginx</code> порт 80 закрывается. Поэтому после удалённого деплоя можно проверить результат с клиента: <code>connect IP tcp 80</code>. Задания: «Удалённый деплой: scp и ssh», «Удалённая диагностика: упавший nginx на сервере».</p>
<p class="mt">Ограничения: нет интерактивного сеанса, ключей и паролей (вход проверяется только по имени пользователя), нет копирования между двумя удалёнными узлами, пересылка портов и туннели не поддерживаются.</p>`]);
{const m=MAN.find(x=>/Скрипты \(bash/.test(x[0]));if(m)m[1]=m[1].replace(/\d+ заданий/,SXT.length+' заданий')}
