// ===== v50: межсетевой экран узла — ufw и iptables (правила влияют на connect/curl/scan/ssh/git push); задания fw1–fw3 =====
const FWSV={ssh:[22,'tcp'],http:[80,'tcp'],https:[443,'tcp'],ftp:[21,'tcp'],smtp:[25,'tcp'],dns:[53,'any'],mysql:[3306,'tcp'],postgresql:[5432,'tcp'],telnet:[23,'tcp'],rdp:[3389,'tcp'],mssql:[1433,'tcp']};
function fwOf(d){if(!d.fw)d.fw={ipt:[],iptPol:'ACCEPT',ufw:[],ufwOn:false,ufwDef:'deny'};return d.fw}
function fwBlocks(d,pr,n){const f=d.fw;if(!f)return false;const L=[...f.ipt,...(f.ufwOn?f.ufw:[])];
 for(const r of L){if((r.p==='any'||r.p===pr)&&r.lo<=n&&n<=r.hi)return r.act!=='ACCEPT'}
 if(f.iptPol==='DROP')return true;return !!(f.ufwOn&&f.ufwDef!=='allow')}
const fwPN=(lo,hi)=>lo===hi?String(lo):lo+':'+hi;
const fwName=n=>{const e=Object.entries(FWSV).find(x=>x[1][0]===n);return e?e[0]:String(n)};
// ---- ufw ----
function ufwSpec(t){t=String(t||'').toLowerCase();let m=/^(\d+)(?::(\d+))?(?:\/(tcp|udp))?$/.exec(t);if(m){const lo=+m[1],hi=m[2]?+m[2]:lo;if(lo<1||hi>65535||lo>hi)return null;return{lo,hi,p:m[3]||'any'}}
 if(FWSV[t])return{lo:FWSV[t][0],hi:FWSV[t][0],p:FWSV[t][1]};return null}
const ufwTo=r=>fwPN(r.lo,r.hi)+(r.p==='any'?'':'/'+r.p);
BB.ufw=(X,a,io)=>{const d=X.d,f=fwOf(d);const root=!!X.sudo;a=a.filter(x=>x!=='--force');const v=(a[0]||'').toLowerCase();
 if(!v||v==='--help'||v==='help'){io.out('Использование: ufw status [numbered|verbose] | enable | disable | reset | default allow|deny incoming | allow|deny|reject <порт[/tcp|/udp]|служба> | delete <№ | правило>\n');return v?0:1}
 if(!root){io.err('ERROR: You need to be root to run this script\n');return 1}
 if(v==='status'){if(!f.ufwOn){io.out('Status: inactive\n');return 0}const num=a[1]==='numbered',vb=a[1]==='verbose';
  let o='Status: active\n'+(vb?`Logging: on (low)\nDefault: ${f.ufwDef} (incoming), allow (outgoing), disabled (routed)\nNew profiles: skip\n`:'')+'\n';
  if(!f.ufw.length)return io.out(o.replace(/\n$/,'')+'\n'),0;const w=27;o+=(num?'     ':'')+'To'.padEnd(w)+'Action      From\n'+(num?'     ':'')+'--'.padEnd(w)+'------      ----\n';
  f.ufw.forEach((r,i)=>{o+=(num?`[${String(i+1).padStart(2)}] `:'')+ufwTo(r).padEnd(w)+({ACCEPT:'ALLOW',DROP:'DENY',REJECT:'REJECT'}[r.act]).padEnd(12)+'Anywhere\n'});io.out(o);return 0}
 if(v==='enable'){f.ufwOn=true;io.out('Firewall is active and enabled on system startup\n');return 0}
 if(v==='disable'){f.ufwOn=false;io.out('Firewall stopped and disabled on system startup\n');return 0}
 if(v==='reset'){f.ufw=[];f.ufwOn=false;f.ufwDef='deny';io.out('Resetting all rules to installed defaults\n');return 0}
 if(v==='default'){const w=(a[1]||'').toLowerCase();if(!/^(allow|deny|reject)$/.test(w)||(a[2]||'incoming')!=='incoming'&&!/^(outgoing|routed)$/.test(a[2])){io.err('ERROR: Invalid syntax\n');return 1}if((a[2]||'incoming')==='incoming')f.ufwDef=w==='allow'?'allow':'deny';io.out(`Default ${(a[2]||'incoming')} policy changed to '${w}'\n(be sure to update your rules accordingly)\n`);return 0}
 if(v==='delete'){const x=a.slice(1);let i=-1;if(/^\d+$/.test(x[0]||''))i=+x[0]-1;else{const act={allow:'ACCEPT',deny:'DROP',reject:'REJECT'}[(x[0]||'').toLowerCase()];const sp=ufwSpec(x[1]);if(act&&sp)i=f.ufw.findIndex(r=>r.act===act&&r.lo===sp.lo&&r.hi===sp.hi&&r.p===sp.p)}
  if(i<0||i>=f.ufw.length){io.err((/^\d+$/.test(x[0]||'')?'ERROR: Could not delete non-existent rule\n':'Could not delete non-existent rule\n'));return 1}f.ufw.splice(i,1);io.out('Rule deleted\n');return 0}
 if(/^(allow|deny|reject|limit)$/.test(v)){const sp=ufwSpec(a[1]);if(!sp){io.err(`ERROR: Could not find a profile matching '${a[1]||''}'\n`);return 1}if(a.length>2){io.err('ERROR: в Стектонии поддерживается только простой вид: ufw allow|deny <порт[/протокол]|служба>\n');return 1}
  const act=v==='deny'?'DROP':v==='reject'?'REJECT':'ACCEPT';if(f.ufw.some(r=>r.act===act&&r.lo===sp.lo&&r.hi===sp.hi&&r.p===sp.p)){io.out('Skipping adding existing rule\n');return 0}f.ufw.push({act,...sp});io.out(f.ufwOn?'Rule added\n':'Rules updated\n');return 0}
 io.err(`ERROR: Invalid syntax\n`);return 1};
// ---- iptables ----
const IPT_ROOT='iptables v1.8.7 (nf_tables): Could not fetch rule set generation id: Permission denied (you must be root)\n';
function iptParse(args){const o={p:'all',lo:null,hi:null,act:null,m:[]};for(let i=0;i<args.length;i++){const x=args[i];
  if(x==='-p'||x==='--protocol'){o.p=(args[++i]||'').toLowerCase()}else if(x==='--dport'||x==='--destination-port'||x==='--dports'){const m=/^(\d+)(?:[:-](\d+))?$/.exec(args[++i]||'');if(!m)return{err:'iptables v1.8.7: invalid port/service `'+(args[i]||'')+"' specified"};o.lo=+m[1];o.hi=m[2]?+m[2]:+m[1]}
  else if(x==='-j'||x==='--jump'){o.act=(args[++i]||'').toUpperCase()}else if(x==='-s'||x==='--source'||x==='-d'||x==='--destination'||x==='-i'||x==='-o'){return{err:`Стектония: параметр ${x} не поддерживается (правила действуют на любые адреса); уберите его`}}
  else if(x==='-m'||x==='--match'||x==='--state'||x==='--ctstate'||x==='--sport'){if(x!=='-m'&&x!=='--match')i++;else i++}}
 return o}
BB.iptables=(X,a,io)=>{const d=X.d,f=fwOf(d);if(!X.sudo){io.err(IPT_ROOT);return 4}
 let n=false,ln=false,list=false,S=false,cmd=null,chain=null,rest=[];
 for(let i=0;i<a.length;i++){const x=a[i];if(x==='-n')n=true;else if(x==='--line-numbers')ln=true;else if(x==='-t'){i++}else if(/^-[AIDFPLSX]$/.test(x)&&!cmd){cmd=x;if(x!=='-F'&&x!=='-L'&&x!=='-S'||a[i+1]&&a[i+1][0]!=='-')chain=a[++i]}else if(/^-(nL|Ln|vL|Lv|vnL|nvL|Lnv|Lvn)$/.test(x)){cmd='-L';n=/n/.test(x)}else rest.push(x)}
 if(!cmd){io.err('iptables v1.8.7: no command specified\nTry `iptables -h\' or \'iptables --help\' for more information.\n');return 2}
 const known=/^(INPUT|OUTPUT|FORWARD)$/;if(chain&&!known.test(chain)&&cmd!=='-F'){io.err(`iptables: No chain/target/match by that name.\n`);return 1}
 const inp=!chain||chain==='INPUT';
 if(cmd==='-F'){if(inp)f.ipt=[];return 0}
 if(cmd==='-P'){const pol=(rest[0]||'').toUpperCase();if(!/^(ACCEPT|DROP)$/.test(pol)){io.err('iptables: Bad policy name. Run `dmesg\' for more information.\n');return 1}if(inp)f.iptPol=pol;return 0}
 if(cmd==='-L'||cmd==='-S'){const R=f.ipt;if(cmd==='-S'){let o=`-P INPUT ${f.iptPol}\n-P FORWARD ACCEPT\n-P OUTPUT ACCEPT\n`;R.forEach(r=>{o+=`-A INPUT${r.p!=='any'?' -p '+r.p+(r.dp?' -m '+r.p:''):''}${r.dp?' --dport '+(r.lo===r.hi?r.lo:r.lo+':'+r.hi):''} -j ${r.act}\n`});io.out(o);return 0}
  const row=(r,i)=>(ln?String(i+1).padEnd(4):'')+r.act.padEnd(11)+(r.p==='any'?'all':r.p).padEnd(5)+'--  '+(n?'0.0.0.0/0':'anywhere').padEnd(21)+(n?'0.0.0.0/0':'anywhere').padEnd(21)+(r.dp?`${r.p} dpt${r.lo===r.hi?':':'s:'}${r.lo===r.hi?(n?r.lo:fwName(r.lo)):fwPN(r.lo,r.hi)}`:'');
  const head=(ln?'num ':'')+'target     prot opt source               destination';
  io.out(`Chain INPUT (policy ${f.iptPol})\n${head}\n${R.map(row).join('\n')}${R.length?'\n':''}\nChain FORWARD (policy ACCEPT)\n${head}\n\nChain OUTPUT (policy ACCEPT)\n${head}\n`);return 0}
 if(cmd==='-D'&&/^\d+$/.test(rest[0]||'')){const i=+rest[0]-1;if(!inp)return 0;if(i<0||i>=f.ipt.length){io.err('iptables: Index of deletion too big.\n');return 1}f.ipt.splice(i,1);return 0}
 let idx=null;if(cmd==='-I'&&/^\d+$/.test(rest[0]||'')){idx=+rest[0]-1;rest=rest.slice(1)}
 const o=iptParse(rest);if(o.err){io.err(o.err+'\n');return 2}
 if(!o.act||!/^(ACCEPT|DROP|REJECT)$/.test(o.act)){io.err(`iptables v1.8.7: Couldn't load target \`${o.act||''}':No such file or directory\n`);return 2}
 if(o.lo!==null&&!/^(tcp|udp)$/.test(o.p)){io.err('iptables v1.8.7: unknown option "--dport"\nTry `iptables -h\' or \'iptables --help\' for more information.\n');return 2}
 if(!inp)return 0;
 const toStore={act:o.act,p:o.p==='all'?'any':o.p,lo:o.lo===null?0:o.lo,hi:o.lo===null?65535:o.hi,dp:o.lo!==null};
 if(cmd==='-A')f.ipt.push(toStore);
 else if(cmd==='-I')f.ipt.splice(idx===null?0:Math.max(0,Math.min(idx,f.ipt.length)),0,toStore);
 else if(cmd==='-D'){const k=f.ipt.findIndex(r=>r.act===toStore.act&&r.p===toStore.p&&r.lo===toStore.lo&&r.hi===toStore.hi);if(k<0){io.err('iptables: Bad rule (does a matching rule exist in that chain?).\n');return 1}f.ipt.splice(k,1)}
 return 0};
// ---- задания ----
function fwHosts(d){const pc2=S.devs.find(x=>x.name==='PC2'&&x.id!==d.id)||S.devs.find(x=>x.id!==d.id&&x.t==='pc');return pc2}
const svcHas2=(d,p,n)=>(d.svc||[]).some(x=>x.p===p&&x.n===n);
const fwOpen=(d,p)=>svcHas2(d,'tcp',p)&&!fwBlocks(d,'tcp',p),fwShut=(d,p)=>svcHas2(d,'tcp',p)&&fwBlocks(d,'tcp',p);
function fwPrep(d,extra){d.fw=undefined;d.svc=[{p:'tcp',n:22},{p:'tcp',n:80},{p:'tcp',n:3306}];if(extra)extra(fwOf(d));return'Среда подготовлена: на этом узле запущены службы SSH (22), HTTP (80) и MySQL (3306); проверяется, какие порты доступны снаружи.'}
admTask({id:'fw1',lvl:2,t:'Файрвол ufw: только SSH и HTTP',d:'Узел (выбранный ПК) работает как сервер: слушает 22 (SSH), 80 (HTTP) и 3306 (MySQL). Настройте ufw так, чтобы снаружи были доступны только SSH и HTTP: запретите входящие по умолчанию, разрешите 22/tcp и 80/tcp и включите межсетевой экран. Все команды ufw выполняются с sudo.',
 hint:'sudo ufw default deny incoming · sudo ufw allow 22/tcp · sudo ufw allow 80/tcp · sudo ufw enable · проверка: sudo ufw status. Важно: разрешите SSH ДО включения, иначе потеряете удалённый доступ.',
 prep:d=>fwPrep(d),sol:'sudo ufw default deny incoming\nsudo ufw allow 22/tcp\nsudo ufw allow 80/tcp\nsudo ufw enable\n',
 chk:d=>[['ufw включён',!!(d.fw&&d.fw.ufwOn)],['порт 22 (SSH) доступен снаружи',fwOpen(d,22)],['порт 80 (HTTP) доступен снаружи',fwOpen(d,80)],['порт 3306 (MySQL) закрыт фильтром',fwShut(d,3306)]]});
admTask({id:'fw2',lvl:2,t:'iptables: закрыть порт MySQL',d:'На узле запущены SSH (22), HTTP (80) и MySQL (3306). Базой должны пользоваться только локально, поэтому порт 3306 нужно закрыть для внешних подключений, не трогая остальные порты. Используйте iptables: добавьте в цепочку INPUT правило, отбрасывающее TCP-пакеты на порт 3306. Проверьте список: iptables -L -n.',
 hint:'sudo iptables -A INPUT -p tcp --dport 3306 -j DROP · просмотр: sudo iptables -L -n --line-numbers',
 prep:d=>fwPrep(d),sol:'sudo iptables -A INPUT -p tcp --dport 3306 -j DROP\n',
 chk:d=>[['порт 3306 (MySQL) закрыт фильтром',fwShut(d,3306)],['порт 22 (SSH) по-прежнему доступен',fwOpen(d,22)],['порт 80 (HTTP) по-прежнему доступен',fwOpen(d,80)]]});
admTask({id:'fw3',lvl:3,t:'iptables: порядок правил',d:'Администратор хотел открыть сайт, но порт 80 недоступен: в цепочке INPUT сначала стоит правило DROP для порта 80, а разрешающее ACCEPT добавлено после него. iptables применяет первое подошедшее правило. Исправьте цепочку так, чтобы HTTP (80) работал, а порт 3306 оставался закрытым. Изучите правила командой iptables -L -n --line-numbers.',
 hint:'Правила проверяются сверху вниз. Удалите ошибочное: sudo iptables -D INPUT 1 (номер из --line-numbers) или вставьте разрешающее выше: sudo iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT',
 prep:d=>fwPrep(d,f=>{f.ipt.push({act:'DROP',p:'tcp',lo:80,hi:80,dp:true},{act:'ACCEPT',p:'tcp',lo:80,hi:80,dp:true},{act:'DROP',p:'tcp',lo:3306,hi:3306,dp:true})}),
 sol:'sudo iptables -D INPUT 1\n',
 chk:d=>[['порт 80 (HTTP) доступен снаружи',fwOpen(d,80)],['порт 3306 (MySQL) остался закрыт',fwShut(d,3306)],['порт 22 (SSH) доступен',fwOpen(d,22)]]});
ADMC.push('ufw','iptables');
CMDS.push(['ufw','ufw status [numbered|verbose] | enable | disable | reset | default deny incoming | allow|deny <порт[/tcp]|служба> | delete <№>','Межсетевой экран узла (ufw)','Работает на выбранном ПК/сервере с sudo. Правила ufw действуют на входящие TCP/UDP-подключения к этому узлу и видны командам connect, curl, scan, ssh, git push с других узлов. Политика по умолчанию при включении — deny incoming; не забудьте разрешить SSH (ufw allow 22/tcp). Правила применяются сверху вниз, первое подошедшее решает.','Безопасность']);
CMDS.push(['iptables','iptables -A|-I [№]|-D <№|правило> INPUT -p tcp --dport N -j ACCEPT|DROP|REJECT · -L [-n] [--line-numbers] · -S · -F · -P INPUT DROP','Правила iptables для входящих пакетов узла','Работает с sudo. Поддержаны цепочка INPUT, протоколы tcp/udp/all, --dport (порт или диапазон a:b), действия ACCEPT/DROP/REJECT. Первое подошедшее правило решает; если не подошло ни одно — действует политика (-P). Не поддерживаются -s/-d, состояния conntrack, цепочки OUTPUT/FORWARD (правила в них игнорируются), ICMP-фильтрация.','Безопасность']);
if(typeof exSyncCustom==='function')exSyncCustom();
p('Новое (v50): межсетевой экран узла — ufw и iptables, правила влияют на connect/curl/scan/ssh/git push; задания fw1–fw3.');
MAN.push(['Т26. Межсетевой экран узла: ufw и iptables',`<h3>Брандмауэр на узле (ufw, iptables)</h3>
<p>Команды выполняются с <code>sudo</code> на выбранном ПК или сервере (в консоли или в терминале bash окна «Скрипты»). Правила действуют на <b>входящие</b> TCP/UDP-подключения к этому узлу и влияют на <code>connect</code>, <code>curl</code>, <code>scan</code>, <code>ssh</code> и <code>git push/clone</code> с других узлов. Закрытый порт «фильтруется»: ответа нет, подключение завершается тайм-аутом (так он отличается от закрытого порта, который отвечает RST).</p>
<p><b>ufw</b> — простой интерфейс: <code>sudo ufw default deny incoming</code>, <code>sudo ufw allow 22/tcp</code>, <code>sudo ufw allow http</code>, <code>sudo ufw deny 3306</code>, <code>sudo ufw enable</code>, <code>sudo ufw status numbered</code>, <code>sudo ufw delete 2</code>, <code>sudo ufw disable</code>, <code>sudo ufw reset</code>. После <code>enable</code> входящие по умолчанию запрещены — сначала разрешите SSH, иначе отрежете себе удалённый доступ (в симуляторе это видно по тайм-ауту <code>git push</code>).</p>
<p><b>iptables</b> — низкоуровневый интерфейс: <code>sudo iptables -A INPUT -p tcp --dport 3306 -j DROP</code> (в конец цепочки), <code>-I INPUT 1 …</code> (вставить первым), <code>-D INPUT 2</code> (удалить по номеру), <code>-L -n --line-numbers</code> (список), <code>-S</code> (в виде команд), <code>-F</code> (очистить), <code>-P INPUT DROP</code> (политика по умолчанию). Правила проверяются сверху вниз, срабатывает первое подошедшее; если подошедшего нет — политика цепочки. Поэтому разрешающее правило, стоящее после запрещающего, не действует.</p>
<p>Задания: «Файрвол ufw: только SSH и HTTP», «iptables: закрыть порт MySQL», «iptables: порядок правил».</p>
<p class="mt">Ограничения: только входящие TCP/UDP на порты узла; нет фильтрации по адресам (<code>-s</code>, <code>-d</code>), состояний соединений, цепочек OUTPUT/FORWARD, ICMP; REJECT ведёт себя как DROP.</p>`]);
{const m=MAN.find(x=>/Скрипты \(bash/.test(x[0]));if(m)m[1]=m[1].replace(/\d+ заданий/,SXT.length+' заданий')}
