// ===== v53: пользователи и группы — /etc/passwd, /etc/group, /etc/shadow, sudoers; useradd/usermod/userdel/groupadd/groupdel/gpasswd/passwd/chpasswd/su/sudo/id/groups/getent/visudo; проверка прав по владельцу и группе; задания usr1–usr4 =====
let V53U=null; // от чьего имени сейчас выполняются команды (null → student)
const acEff=()=>V53U||'student';
const acSys=p=>!(p===SXH||p.startsWith(SXH+'/')||p==='/tmp'||p.startsWith('/tmp/')||p==='/c'||p.startsWith('/c/'));
const acHash=s=>{let h=5381;for(const c of String(s))h=((h<<5)+h+c.charCodeAt(0))>>>0;return'$6$netlab$'+h.toString(16).padStart(8,'0').repeat(4)};
function acInit(d){const fs=sxFs(d);if(d.acInit&&fs['/etc/passwd'])return;d.acInit=1;
 const put=(p,c,m,g)=>{if(!fs[p])fs[p]={c,m,o:'root',g:g||'root'}};
 put('/etc/passwd','root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nnobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin\nstudent:x:1000:1000:Student:/home/student:/bin/bash\n',0o644);
 put('/etc/group','root:x:0:\ndaemon:x:1:\nadm:x:4:\nsudo:x:27:student\nwww-data:x:33:\nshadow:x:42:\nusers:x:100:\ndocker:x:999:student\nstudent:x:1000:\n',0o644);
 put('/etc/shadow','root:*:19000:0:99999:7:::\ndaemon:*:19000:0:99999:7:::\nwww-data:*:19000:0:99999:7:::\nnobody:*:19000:0:99999:7:::\nstudent:'+acHash('student')+':19000:0:99999:7:::\n',0o640,'shadow');
 put('/etc/sudoers','Defaults\tenv_reset\nroot\tALL=(ALL:ALL) ALL\n%sudo\tALL=(ALL:ALL) ALL\n@includedir /etc/sudoers.d\n',0o440);
 if(!fs['/etc/sudoers.d'])fs['/etc/sudoers.d']={d:1,m:0o755,o:'root',g:'root'};
 for(const k of Object.keys(fs)){if(acSys(k)&&fs[k].o===undefined){fs[k].o='root';fs[k].g='root'}}
 if(fs['/tmp']&&fs['/tmp'].m===undefined)fs['/tmp'].m=0o777}
function acDB(d){acInit(d);const fs=sxFs(d);const L=p=>String((fs[p]&&fs[p].c)||'').split('\n').filter(l=>l.trim()&&l[0]!=='#');
 const us=L('/etc/passwd').map(l=>{const f=l.split(':');return{n:f[0],uid:+f[2],gid:+f[3],gecos:f[4]||'',home:f[5]||'',sh:f[6]||''}});
 const gs=L('/etc/group').map(l=>{const f=l.split(':');return{n:f[0],gid:+f[2],m:(f[3]||'').split(',').filter(Boolean)}});
 const sh={};L('/etc/shadow').forEach(l=>{const f=l.split(':');sh[f[0]]=f[1]});return{us,gs,sh}}
function acSave(d,db){const fs=sxFs(d);const w=(p,c)=>{fs[p]={...(fs[p]||{o:'root',g:'root',m:0o644}),c}};
 w('/etc/passwd',db.us.map(u=>[u.n,'x',u.uid,u.gid,u.gecos,u.home,u.sh].join(':')).join('\n')+'\n');
 w('/etc/group',db.gs.map(g=>[g.n,'x',g.gid,g.m.join(',')].join(':')).join('\n')+'\n');
 w('/etc/shadow',db.us.map(u=>`${u.n}:${db.sh[u.n]===undefined?'!':db.sh[u.n]}:${Math.floor(Date.now()/864e5)}:0:99999:7:::`).join('\n')+'\n')}
function acGroupsOf(db,n){const u=db.us.find(x=>x.n===n);const r=[];if(u){const pg=db.gs.find(g=>g.gid===u.gid);if(pg)r.push(pg)}db.gs.forEach(g=>{if(g.m.includes(n)&&!r.includes(g))r.push(g)});return r}
// проверка права доступа: bit 4=r, 2=w, 1=x; по цепочке каталогов нужен x
function acOk(X,p,bit,u){u=u||acEff();if(u==='root')return true;const fs=X.fs,db=acDB(X.d);const gr=acGroupsOf(db,u);
 const ck=(q,b)=>{const n=fs[q];if(!n)return true;const o=n.o||(acSys(q)?'root':'student');const g=n.g||o;const m=bModeNum(n);const c=u===o?(m>>6)&7:(gr.some(x=>x.n===g)?(m>>3)&7:m&7);return(c&b)===b};
 const parts=p.split('/').filter(Boolean);let cur='';for(let i=0;i<parts.length-1;i++){cur+='/'+parts[i];if(!ck(cur,1))return false}return ck(p,bit)}
// ---- владельцы новых файлов ----
{const _w=sxWrite;sxWrite=function(fs,p,c,app){const had=!!fs[p];const e=_w(fs,p,c,app);if(!e&&!had&&fs[p]&&!fs[p].d){if(V53U){fs[p].o=V53U;fs[p].g=V53U}else if(acSys(p)){fs[p].o='root';fs[p].g='root'}}return e}}
{const _m=sxMk;sxMk=function(fs,p,par){const had=!!fs[p];const e=_m(fs,p,par);if(!e&&!had&&fs[p]&&fs[p].d){if(V53U){fs[p].o=V53U;fs[p].g=V53U}else if(acSys(p)){fs[p].o='root';fs[p].g='root'}}return e}}
// ---- проверка прав в командах ----
const acArgs=a=>a.filter(x=>x&&x[0]!=='-');
const acP=(X,x)=>sxNorm(X.cwd,x,X.home);
function acWrapR(name){const o=BB[name];if(typeof o!=='function')return;BB[name]=(X,a,io)=>{if(acEff()!=='root'){acInit(X.d);for(const x of acArgs(a)){const p=acP(X,x),n=X.fs[p];if(n&&!n.d&&!acOk(X,p,4)){io.err(`${name}: ${x}: Permission denied\n`);return 1}}}return o(X,a,io)}}
['cat','head','tail','grep','wc','sort','uniq','cut','less','more','nl','tac','sed','awk','diff','cmp','od','xxd','strings','md5sum','sha1sum','sha256sum','source'].forEach(acWrapR);
{const o=BB.ls;BB.ls=(X,a,io)=>{if(acEff()!=='root'){acInit(X.d);const ps=acArgs(a);for(const x of(ps.length?ps:['.'])){const p=acP(X,x),n=X.fs[p];if(n&&n.d&&!acOk(X,p,4)){io.err(`ls: cannot open directory '${x}': Permission denied\n`);return 2}}}return o(X,a,io)}}
{const o=BB.cd;BB.cd=(X,a,io)=>{if(acEff()!=='root'&&a[0]&&a[0]!=='-'){acInit(X.d);const p=acP(X,a[0]),n=X.fs[p];if(n&&n.d&&!acOk(X,p,1)){io.err(`bash: cd: ${a[0]}: Permission denied\n`);return 1}}return o(X,a,io)}}
const acPar=p=>p.slice(0,p.lastIndexOf('/'))||'/';
function acCanCreate(X,p){const n=X.fs[p];if(n)return acOk(X,p,2);return acOk(X,acPar(p),3)}
function acWrapW(name,msg,pick){const o=BB[name];if(typeof o!=='function')return;BB[name]=(X,a,io)=>{if(acEff()!=='root'){acInit(X.d);for(const x of pick(acArgs(a))){const p=acP(X,x);if(!pick.rm?!acCanCreate(X,p):!(X.fs[p]?acOk(X,acPar(p),3):true)){io.err(msg(x)+'\n');return 1}}}return o(X,a,io)}}
{const mk=(name,msg,rm)=>{const f=l=>l;f.rm=rm;acWrapW(name,msg,f)};
 mk('touch',x=>`touch: cannot touch '${x}': Permission denied`);mk('mkdir',x=>`mkdir: cannot create directory '${x}': Permission denied`);mk('tee',x=>`tee: ${x}: Permission denied`);
 mk('rm',x=>`rm: cannot remove '${x}': Permission denied`,true);mk('rmdir',x=>`rmdir: failed to remove '${x}': Permission denied`,true)}
{const wrap2=(name,msg)=>{const o=BB[name];if(typeof o!=='function')return;BB[name]=(X,a,io)=>{if(acEff()!=='root'){acInit(X.d);const r=acArgs(a);if(r.length>=2){const dst=r[r.length-1],dp=acP(X,dst);const dn=X.fs[dp];for(const s of r.slice(0,-1)){const sp=acP(X,s),sn=X.fs[sp];if(sn&&!sn.d&&name==='cp'&&!acOk(X,sp,4)){io.err(`cp: cannot open '${s}' for reading: Permission denied\n`);return 1}
  if(name==='mv'&&sn&&!acOk(X,acPar(sp),3)){io.err(`mv: cannot move '${s}' to '${dst}': Permission denied\n`);return 1}
  const tp=dn&&dn.d?dp+'/'+sp.split('/').pop():dp;if(!acCanCreate(X,tp)){io.err(msg(dst)+'\n');return 1}}}}return o(X,a,io)}};
 wrap2('cp',x=>`cp: cannot create regular file '${x}': Permission denied`);wrap2('mv',x=>`mv: cannot move to '${x}': Permission denied`)}
// перенаправление > и >>
{const _r=bRedir;bRedir=function(X,rs,io){if(acEff()!=='root'&&rs&&rs.length){acInit(X.d);for(const r of rs){if(!/^(&>>?|\d*>>?|>\|)$/.test(r.op||''))continue;let tg;try{tg=bExpW(X,r.target,io,'s')}catch(e){continue}
  if(!tg||/^\/dev\//.test(tg))continue;const p=sxNorm(X.cwd,tg,X.home);if(X.fs[p]&&X.fs[p].d)continue;if(!acCanCreate(X,p)){X.err(`bash: ${tg}: Permission denied\n`);return null}}}return _r(X,rs,io)}}
// ---- chmod / chown / chgrp ----
{const o=BB.chmod;BB.chmod=(X,a,io)=>{if(acEff()!=='root'){acInit(X.d);const r=acArgs(a);for(const x of r.slice(1)){const p=acP(X,x),n=X.fs[p];if(n&&(n.o||(acSys(p)?'root':'student'))!==acEff()){io.err(`chmod: changing permissions of '${x}': Operation not permitted\n`);return 1}}}return o(X,a,io)}}
{const o=BB.chown;BB.chown=(X,a,io)=>{const r=acArgs(a);if(r.length>=2&&acEff()==='root'){const db=acDB(X.d);const m=/^([^:.]*)(?:[:.](.*))?$/.exec(r[0]);if(m){if(m[1]&&!db.us.some(u=>u.n===m[1])){io.err(`chown: invalid user: ‘${r[0]}’\n`);return 1}if(m[2]&&!db.gs.some(g=>g.n===m[2])){io.err(`chown: invalid group: ‘${r[0]}’\n`);return 1}}}
 const was=X.sudo;if(acEff()==='root')X.sudo=1;try{return o(X,a,io)}finally{X.sudo=was}}}
BB.chgrp=(X,a,io)=>{let rec=false;const r=[];a.forEach(x=>{if(x==='-R')rec=true;else if(x[0]!=='-')r.push(x)});if(r.length<2){io.err('chgrp: пропущен операнд\n');return 1}
 const db=acDB(X.d),g=r[0],me=acEff();if(!db.gs.some(x=>x.n===g)){io.err(`chgrp: invalid group: ‘${g}’\n`);return 1}let code=0;
 for(const x of r.slice(1)){const f=bAbs(X,x),n=X.fs[f];if(!n){io.err(`chgrp: cannot access '${x}': No such file or directory\n`);code=1;continue}
  const own=n.o||(acSys(f)?'root':'student');if(me!=='root'&&(own!==me||!acGroupsOf(db,me).some(y=>y.n===g))){io.err(`chgrp: changing group of '${x}': Operation not permitted\n`);code=1;continue}
  const set=k=>{X.fs[k].g=g};set(f);if(rec&&n.d){const pre=f+'/';Object.keys(X.fs).filter(k=>k.startsWith(pre)).forEach(set)}}return code};
// ---- id / whoami / groups / getent ----
BB.whoami=(X,a,io)=>{io.out(acEff()+'\n');return 0};
BB.id=(X,a,io)=>{const db=acDB(X.d),fl={},r=[];a.forEach(x=>{if(/^-[a-zA-Z]+$/.test(x))for(const c of x.slice(1))fl[c]=1;else r.push(x)});const n=r[0]||acEff(),u=db.us.find(x=>x.n===n);
 if(!u){io.err(`id: ‘${n}’: no such user\n`);return 1}const gs=acGroupsOf(db,n),pg=db.gs.find(g=>g.gid===u.gid);
 if(fl.u){io.out((fl.n?u.n:u.uid)+'\n');return 0}if(fl.g){io.out((fl.n?(pg?pg.n:u.gid):u.gid)+'\n');return 0}if(fl.G){io.out(gs.map(g=>fl.n?g.n:g.gid).join(' ')+'\n');return 0}
 io.out(`uid=${u.uid}(${u.n}) gid=${u.gid}(${pg?pg.n:u.gid}) groups=${gs.map(g=>g.gid+'('+g.n+')').join(',')}\n`);return 0};
BB.groups=(X,a,io)=>{const db=acDB(X.d),n=a[0]||acEff();if(!db.us.some(x=>x.n===n)){io.err(`groups: ‘${n}’: no such user\n`);return 1}io.out((a[0]?n+' : ':'')+acGroupsOf(db,n).map(g=>g.n).join(' ')+'\n');return 0};
BB.getent=(X,a,io)=>{const db=acDB(X.d),[dbn,key]=a;const pw=u=>[u.n,'x',u.uid,u.gid,u.gecos,u.home,u.sh].join(':'),gr=g=>[g.n,'x',g.gid,g.m.join(',')].join(':');
 if(dbn==='passwd'){const l=db.us.filter(u=>!key||u.n===key||String(u.uid)===key);if(!l.length)return 2;io.out(l.map(pw).join('\n')+'\n');return 0}
 if(dbn==='group'){const l=db.gs.filter(g=>!key||g.n===key||String(g.gid)===key);if(!l.length)return 2;io.out(l.map(gr).join('\n')+'\n');return 0}
 if(dbn==='shadow'){if(acEff()!=='root')return 2;const l=db.us.filter(u=>!key||u.n===key);if(!l.length)return 2;io.out(l.map(u=>`${u.n}:${db.sh[u.n]}:::::::`).join('\n')+'\n');return 0}
 io.err(`Unknown database: ${dbn||''}\n`);return 1};
// ---- управление учётными записями (только root) ----
const acNeed=(io,cmd,pw)=>{if(acEff()==='root')return true;io.err(pw?`${cmd}: Permission denied.\n`:`${cmd}: Permission denied.\n`+(cmd==='useradd'||cmd==='usermod'||cmd==='userdel'||cmd==='groupadd'||cmd==='groupdel'?`${cmd}: cannot lock /etc/${/group/.test(cmd)?'group':'passwd'}; try again later.\n`:''));return false};
const acName=n=>/^[a-z_][a-z0-9_-]{0,31}\$?$/.test(n);
const acFreeId=(list,key,from,to,down)=>{const s=new Set(list.map(x=>x[key]));if(down){for(let i=to;i>=from;i--)if(!s.has(i))return i}else for(let i=from;i<=to;i++)if(!s.has(i))return i;return null};
function acHome(X,u,name,gname){const fs=X.fs;if(fs[u.home]&&fs[u.home].d)return;const par=acPar(u.home);if(!fs[par]){sxMk(fs,par,true)}fs[u.home]={d:1,m:0o755,o:name,g:gname};
 [['.bash_logout','# ~/.bash_logout: выполняется при выходе из оболочки\n'],['.bashrc','# ~/.bashrc: настройки интерактивной оболочки\nalias ll=\'ls -l\'\n'],['.profile','# ~/.profile: настройки входа\n']].forEach(([f,c])=>{fs[u.home+'/'+f]={c,m:0o644,o:name,g:gname}})}
BB.useradd=(X,a,io)=>{if(!acNeed(io,'useradd'))return 1;const d=X.d,db=acDB(d);let home=null,sh=null,g=null,G=null,c='',uid=null,sys=false,mk=false,noG=false,name=null;
 for(let i=0;i<a.length;i++){const x=a[i];
  if(x==='-m'||x==='--create-home')mk=true;else if(x==='-M')mk=false;else if(x==='-r'||x==='--system')sys=true;else if(x==='-N')noG=true;else if(x==='-U')noG=false;
  else if(x==='-s')sh=a[++i];else if(x==='-d')home=a[++i];else if(x==='-g')g=a[++i];else if(x==='-G')G=a[++i];else if(x==='-c')c=a[++i]||'';else if(x==='-u')uid=+a[++i];
  else if(['-p','-k','-b','-e','-f','-K'].includes(x)){i++}else if(x[0]==='-'&&x.length>1){io.err(`useradd: неизвестный параметр '${x}'\n`);return 1}else name=x}
 if(!name){io.err('Usage: useradd [options] LOGIN\n');return 2}if(!acName(name)){io.err(`useradd: invalid user name '${name}'\n`);return 3}
 if(db.us.some(u=>u.n===name)){io.err(`useradd: user '${name}' already exists\n`);return 9}
 if(uid!==null&&db.us.some(u=>u.uid===uid)){io.err(`useradd: UID ${uid} is not unique\n`);return 4}
 if(uid===null)uid=sys?acFreeId(db.us,'uid',100,999,true):acFreeId(db.us,'uid',1000,59999);
 let gid,gn=name;
 if(g!==null){const gg=db.gs.find(x=>x.n===g||String(x.gid)===g);if(!gg){io.err(`useradd: group '${g}' does not exist\n`);return 6}gid=gg.gid;gn=gg.n}
 else if(noG){gid=100;gn='users'}
 else{if(db.gs.some(x=>x.n===name)){io.err(`useradd: group ${name} exists - if you want to add this user to that group, use -g.\n`);return 9}
  gid=!db.gs.some(x=>x.gid===uid)?uid:(sys?acFreeId(db.gs,'gid',100,999,true):acFreeId(db.gs,'gid',1000,59999));db.gs.push({n:name,gid,m:[]})}
 const sup=[];if(G){for(const gx of G.split(',').filter(Boolean)){const gg=db.gs.find(x=>x.n===gx||String(x.gid)===gx);if(!gg){io.err(`useradd: group '${gx}' does not exist\n`);return 6}sup.push(gg)}}
 const u={n:name,uid,gid,gecos:c,home:home||'/home/'+name,sh:sh||'/bin/sh'};db.us.push(u);sup.forEach(gg=>{if(!gg.m.includes(name))gg.m.push(name)});db.sh[name]='!';acSave(d,db);
 if(mk)acHome(X,u,name,gn);return 0};
BB.usermod=(X,a,io)=>{if(!acNeed(io,'usermod'))return 1;const d=X.d,db=acDB(d);let app=false,G=null,g=null,sh=null,c=null,home=null,mv=false,lock=false,unlock=false,nl=null,uid=null,name=null;
 for(let i=0;i<a.length;i++){const x=a[i];if(x==='-a'||x==='--append')app=true;else if(x==='-G'||x==='--groups')G=a[++i]||'';else if(x==='-aG'||x==='-Ga'){app=true;G=a[++i]||''}else if(x==='-g')g=a[++i];else if(x==='-s')sh=a[++i];else if(x==='-c')c=a[++i]||'';else if(x==='-d')home=a[++i];else if(x==='-m')mv=true;else if(x==='-L'||x==='--lock')lock=true;else if(x==='-U'||x==='--unlock')unlock=true;else if(x==='-l')nl=a[++i];else if(x==='-u')uid=+a[++i];
  else if(x[0]==='-'&&x.length>1){io.err(`usermod: неизвестный параметр '${x}'\n`);return 1}else name=x}
 if(!name){io.err('Usage: usermod [options] LOGIN\n');return 2}if(app&&G===null){io.err('usermod: option -a requires option -G\n');return 2}
 const u=db.us.find(x=>x.n===name);if(!u){io.err(`usermod: user '${name}' does not exist\n`);return 6}
 if(unlock){const h=db.sh[name]===undefined?'!':db.sh[name];if(/^!*$/.test(h)){io.err("usermod: unlocking the user's password would result in a passwordless account.\nYou should set a password with usermod -p to unlock this user's password.\n");return 1}}
 let gl=null;if(G!==null){gl=[];for(const gx of G.split(',').filter(Boolean)){const gg=db.gs.find(x=>x.n===gx||String(x.gid)===gx);if(!gg){io.err(`usermod: group '${gx}' does not exist\n`);return 6}gl.push(gg)}}
 if(g!==null){const gg=db.gs.find(x=>x.n===g||String(x.gid)===g);if(!gg){io.err(`usermod: group '${g}' does not exist\n`);return 6}u.gid=gg.gid}
 if(nl&&db.us.some(x=>x.n===nl)){io.err(`usermod: user '${nl}' already exists\n`);return 9}
 if(uid!==null){if(db.us.some(x=>x.uid===uid&&x!==u)){io.err(`usermod: UID '${uid}' already exists\n`);return 4}u.uid=uid}
 if(gl){if(!app)db.gs.forEach(x=>{x.m=x.m.filter(y=>y!==name)});gl.forEach(gg=>{if(!gg.m.includes(name))gg.m.push(name)})}
 if(sh!==null)u.sh=sh;if(c!==null)u.gecos=c;
 if(home!==null){const old=u.home;u.home=home;if(mv&&old!==home&&X.fs[old]){const par=acPar(home);if(!X.fs[par])sxMk(X.fs,par,true);Object.keys(X.fs).filter(k=>k===old||k.startsWith(old+'/')).forEach(k=>{X.fs[home+k.slice(old.length)]=X.fs[k];delete X.fs[k]})}}
 if(lock){const h=db.sh[name]===undefined?'':db.sh[name];if(h[0]!=='!')db.sh[name]='!'+h}if(unlock)db.sh[name]=String(db.sh[name]).replace(/^!/,'');
 if(nl){db.gs.forEach(x=>{x.m=x.m.map(y=>y===name?nl:y)});db.sh[nl]=db.sh[name];delete db.sh[name];u.n=nl}
 acSave(d,db);return 0};
BB.userdel=(X,a,io)=>{if(!acNeed(io,'userdel'))return 1;const d=X.d,db=acDB(d);let rm=false,name=null;a.forEach(x=>{if(x==='-r'||x==='--remove')rm=true;else if(x[0]!=='-')name=x});if(!name){io.err('Usage: userdel [options] LOGIN\n');return 2}
 const u=db.us.find(x=>x.n===name);if(!u){io.err(`userdel: user '${name}' does not exist\n`);return 6}
 db.us=db.us.filter(x=>x!==u);delete db.sh[name];db.gs.forEach(g=>{g.m=g.m.filter(y=>y!==name)});
 const pg=db.gs.find(g=>g.gid===u.gid);if(pg&&pg.n===name&&!db.us.some(x=>x.gid===pg.gid))db.gs=db.gs.filter(g=>g!==pg);
 acSave(d,db);if(rm&&u.home&&u.home!=='/'){Object.keys(X.fs).filter(k=>k===u.home||k.startsWith(u.home+'/')).forEach(k=>{delete X.fs[k]})}return 0};
BB.groupadd=(X,a,io)=>{if(!acNeed(io,'groupadd'))return 1;const d=X.d,db=acDB(d);let gid=null,sys=false,name=null;for(let i=0;i<a.length;i++){const x=a[i];if(x==='-g')gid=+a[++i];else if(x==='-r')sys=true;else if(x[0]!=='-')name=x}
 if(!name){io.err('Usage: groupadd [options] GROUP\n');return 2}if(!acName(name)){io.err(`groupadd: '${name}' is not a valid group name\n`);return 3}
 if(db.gs.some(g=>g.n===name)){io.err(`groupadd: group '${name}' already exists\n`);return 9}if(gid!==null&&db.gs.some(g=>g.gid===gid)){io.err(`groupadd: GID '${gid}' already exists\n`);return 4}
 if(gid===null)gid=sys?acFreeId(db.gs,'gid',100,999,true):acFreeId(db.gs,'gid',1000,59999);db.gs.push({n:name,gid,m:[]});acSave(d,db);return 0};
BB.groupdel=(X,a,io)=>{if(!acNeed(io,'groupdel'))return 1;const d=X.d,db=acDB(d),name=acArgs(a)[0];if(!name){io.err('Usage: groupdel [options] GROUP\n');return 2}
 const g=db.gs.find(x=>x.n===name);if(!g){io.err(`groupdel: group '${name}' does not exist\n`);return 6}const pu=db.us.find(u=>u.gid===g.gid);if(pu){io.err(`groupdel: cannot remove the primary group of user '${pu.n}'\n`);return 8}
 db.gs=db.gs.filter(x=>x!==g);acSave(d,db);return 0};
BB.gpasswd=(X,a,io)=>{if(!acNeed(io,'gpasswd',1))return 1;const d=X.d,db=acDB(d);const op=a[0];if(!['-a','-d'].includes(op)||a.length<3){io.err('Usage: gpasswd -a ПОЛЬЗОВАТЕЛЬ ГРУППА | gpasswd -d ПОЛЬЗОВАТЕЛЬ ГРУППА\n');return 2}
 const[un,gn]=[a[1],a[2]];const u=db.us.find(x=>x.n===un);if(!u){io.err(`gpasswd: user '${un}' does not exist\n`);return 3}const g=db.gs.find(x=>x.n===gn);if(!g){io.err(`gpasswd: group '${gn}' does not exist\n`);return 3}
 if(op==='-a'){io.out(`Adding user ${un} to group ${gn}\n`);if(!g.m.includes(un))g.m.push(un)}else{if(!g.m.includes(un)){io.err(`gpasswd: user '${un}' is not a member of '${gn}'\n`);return 3}io.out(`Removing user ${un} from group ${gn}\n`);g.m=g.m.filter(y=>y!==un)}
 acSave(d,db);return 0};
BB.passwd=(X,a,io)=>{const d=X.d,db=acDB(d),fl=a.filter(x=>x[0]==='-'),nm=a.filter(x=>x[0]!=='-'),me=acEff(),t=nm[0]||me;
 if(t!==me&&me!=='root'){io.err(`passwd: You may not view or modify password information for ${t}.\n`);return 1}
 const u=db.us.find(x=>x.n===t);if(!u){io.err(`passwd: user '${t}' does not exist\n`);return 1}const h=db.sh[t]===undefined?'!':db.sh[t];
 if(fl.includes('-S')){const dt=new Date(),ds=String(dt.getMonth()+1).padStart(2,'0')+'/'+String(dt.getDate()).padStart(2,'0')+'/'+dt.getFullYear();io.out(`${t} ${h[0]==='!'||h[0]==='*'?'L':h===''?'NP':'P'} ${ds} 0 99999 7 -1\n`);return 0}
 if(fl.some(x=>['-l','-u','-d'].includes(x))){if(me!=='root'){io.err('passwd: Permission denied.\n');return 1}
  if(fl.includes('-l')){if(h[0]!=='!')db.sh[t]='!'+h}else if(fl.includes('-u')){const r=h.replace(/^!/,'');if(r===''){io.err('passwd: unlocking the account would result in a passwordless account.\nYou should set a password with usermod -p to unlock this account.\n');return 1}db.sh[t]=r}else db.sh[t]='';
  acSave(d,db);io.out('passwd: password expiry information changed.\n');return 0}
 io.err("Стектония: passwd запрашивает пароль интерактивно — в скрипте задайте его так: echo 'имя:пароль' | sudo chpasswd\n");return 1};
BB.chpasswd=(X,a,io)=>{if(!acNeed(io,'chpasswd',1))return 1;const d=X.d,db=acDB(d);const t=io.inp?String(io.inp.t||'').slice(io.inp.p||0):'';if(io.inp)io.inp.p=(io.inp.t||'').length;let code=0,n=0;
 t.split('\n').forEach((l,i)=>{if(!l.trim())return;n++;const k=l.indexOf(':');if(k<0){io.err(`chpasswd: line ${n}: missing new password\n`);code=1;return}const un=l.slice(0,k),pw=l.slice(k+1);
  if(!db.us.some(x=>x.n===un)){io.err(`chpasswd: line ${n}: user '${un}' does not exist\n`);code=1;return}db.sh[un]=acHash(pw)});
 if(!code)acSave(d,db);else{io.err('chpasswd: error detected, changes ignored\n')}return code};
// ---- sudoers ----
function acRules(d){const fs=sxFs(d);acInit(d);const files=['/etc/sudoers',...Object.keys(fs).filter(k=>k.startsWith('/etc/sudoers.d/')&&!fs[k].d&&!/[.~]/.test(k.split('/').pop())).sort()];const rules=[],errs=[];
 for(const f of files){String(fs[f]&&fs[f].c||'').split('\n').forEach((l0,i)=>{const l=l0.replace(/\s+#.*$/,'').trim();if(!l||(l[0]==='#'&&!/^#include/.test(l)))return;
  if(/^(Defaults\b|@include\w*|#include\w*|(User|Runas|Host|Cmnd)_Alias\b)/.test(l))return;
  const m=/^(%?[A-Za-z_][\w.\-]*|ALL)\s+([\w.\-*]+)\s*=\s*(?:\(([^)]*)\)\s*)?((?:(?:NOPASSWD|PASSWD|NOEXEC|SETENV):\s*)*)(.+)$/.exec(l);
  if(!m){errs.push({f,ln:i+1});return}const cmds=m[5].split(',').map(s=>s.trim());
  if(cmds.some(c=>!/^(!?ALL|!?\/\S*(\s.*)?)$/.test(c))){errs.push({f,ln:i+1});return}
  rules.push({f,who:m[1],host:m[2],runaRaw:m[3]===undefined?'root':m[3].trim(),runas:(m[3]===undefined?'root':m[3]).split(':')[0].trim()||'root',nopw:/NOPASSWD/.test(m[4]),cmds})})}
 return{rules,errs,files}}
function acWho(db,r,user,d){if(r.host!=='ALL'&&r.host!==d.name)return false;if(r.who==='ALL')return true;if(r.who[0]==='%')return acGroupsOf(db,user).some(g=>g.n===r.who.slice(1));return r.who===user}
function acCmdMatch(c,cmd){const t=c.trim().split(/\s+/),base=x=>String(x).split('/').pop();if(t[0]==='ALL')return true;if(base(t[0])!==base(cmd[0]))return false;if(t.length===1)return true;const ra=t.slice(1),ca=cmd.slice(1);return ra.length===ca.length&&ra.every((x,i)=>x===ca[i])}
function acSudo(d,user,runas,cmd){const db=acDB(d),R=acRules(d);let any=false,ok=false,nopw=false;
 for(const r of R.rules){if(!acWho(db,r,user,d))continue;any=true;if(!(r.runas==='ALL'||r.runas===runas))continue;
  for(const c of r.cmds){const neg=c[0]==='!',cc=neg?c.slice(1):c;if(acCmdMatch(cc,cmd)){ok=!neg;nopw=r.nopw}}}
 return{ok,nopw,any}}
BB.sudo=(X,a,io)=>{const d=X.d;let user=null,list=false,i=0,login=false;
 for(;i<a.length;i++){const x=a[i];if(x==='-u'||x==='--user')user=a[++i];else if(/^--user=/.test(x))user=x.slice(7);else if(x==='-l'||x==='--list')list=true;else if(x==='-i'||x==='-s'||x==='--login')login=true;else if(['-n','-E','-H','-S','-k','-b','-P','-v','-K'].includes(x)){}
  else if(x==='--'){i++;break}else if(x[0]==='-'&&x.length>1){io.err(`sudo: invalid option -- '${x.replace(/^-+/,'')}'\n`);return 1}else break}
 const cmd=a.slice(i),me=acEff(),db=acDB(d),runas=user||'root';
 if(!cmd.length&&!list){if(login){io.err(`Стектония: интерактивная оболочка недоступна — выполните команду: sudo ${user?'-u '+user+' ':''}команда\n`);return 1}io.err('usage: sudo command\n');return 1}
 if(user&&!db.us.some(u=>u.n===user)){io.err(`sudo: unknown user ${user}\n`);return 1}
 if(list){const R=acRules(d),mine=R.rules.filter(r=>acWho(db,r,me,d));if(!mine.length&&me!=='root'){io.out(`User ${me} is not allowed to run sudo on ${d.name}.\n`);return 1}
  io.out(`Matching Defaults entries for ${me} on ${d.name}:\n    env_reset, mail_badpass, secure_path=/usr/local/sbin\\:/usr/local/bin\\:/usr/sbin\\:/usr/bin\\:/sbin\\:/bin\n\nUser ${me} may run the following commands on ${d.name}:\n`);
  mine.forEach(r=>io.out(`    (${r.runaRaw.replace(/\s*:\s*/,' : ')}) ${r.nopw?'NOPASSWD: ':''}${r.cmds.join(', ')}\n`));return 0}
 if(me!=='root'){const r=acSudo(d,me,runas,cmd);if(!r.ok){if(!r.any)io.err(`${me} is not in the sudoers file.  This incident will be reported.\n`);else io.err(`Sorry, user ${me} is not allowed to execute '${cmd[0][0]==='/'?cmd.join(' '):'/usr/bin/'+cmd.join(' ')}' as ${runas} on ${d.name}.\n`);return 1}}
 const was=X.sudo,wasU=V53U;X.sudo=runas==='root'?1:0;V53U=runas;try{return bCmd(X,cmd,io)}finally{X.sudo=was;V53U=wasU}};
BB.su=(X,a,io)=>{const d=X.d;let login=false,cmd=null,shell=null,user=null;
 for(let i=0;i<a.length;i++){const x=a[i];if(x==='-'||x==='-l'||x==='--login')login=true;else if(x==='-c'||x==='--command')cmd=a[++i];else if(x==='-s'||x==='--shell')shell=a[++i];else if(x==='-p'||x==='-m'){}else if(x[0]==='-'&&x.length>1){io.err(`su: invalid option -- '${x.replace(/^-+/,'')}'\n`);return 1}else user=x}
 user=user||'root';const db=acDB(d),u=db.us.find(x=>x.n===user);if(!u){io.err(`su: user ${user} does not exist or the user entry does not contain all the required fields\n`);return 1}
 const me=acEff();if(me!=='root'&&me!==user){io.err('su: Authentication failure\n');return 1}
 if(!shell&&/(nologin|\/false)$/.test(u.sh)){io.err('This account is currently not available.\n');return 1}
 if(cmd===null||cmd===undefined){io.err(`Стектония: интерактивная оболочка недоступна — выполните команду от имени ${user}: su - ${user} -c 'команда'\n`);return 1}
 const sv={cwd:X.cwd,home:X.home,sudo:X.sudo,U:V53U,USER:X.env.USER,LOGNAME:X.env.LOGNAME,HOME:X.env.HOME};
 V53U=user;X.sudo=user==='root'?1:0;X.env.USER=X.env.LOGNAME=user;X.home=X.env.HOME=u.home;if(login)X.cwd=X.fs[u.home]?u.home:'/';let c=0;
 try{c=bRunList(X,bParse(cmd),io)}catch(e){if(e&&e.bx==='exit')c=e.n;else if(e&&e.syn){io.err(`bash: ${e.message}\n`);c=2}else{io.err(String(e&&e.message||e)+'\n');c=1}}
 finally{X.cwd=sv.cwd;X.home=sv.home;X.sudo=sv.sudo;V53U=sv.U;X.env.USER=sv.USER;X.env.LOGNAME=sv.LOGNAME;X.env.HOME=sv.HOME}return c||0};
BB.visudo=(X,a,io)=>{const d=X.d;if(!a.some(x=>/^-c/.test(x))){io.err("Стектония: интерактивный редактор недоступен — запишите правило: echo 'пользователь ALL=(ALL) ALL' | sudo tee /etc/sudoers.d/имя, затем sudo chmod 440 /etc/sudoers.d/имя и проверьте: sudo visudo -c\n");return 1}
 if(acEff()!=='root'){io.err('visudo: /etc/sudoers: Permission denied\n');return 1}const R=acRules(d),fs=sxFs(d);let bad=false;
 const fi=a.indexOf('-f')>=0?a[a.indexOf('-f')+1]:(a.find(x=>/^-cf$/.test(x))?a[a.indexOf('-cf')+1]:null);const files=fi?[sxNorm(X.cwd,fi,X.home)]:R.files;
 for(const f of files){const es=R.errs.filter(e=>e.f===f);if(!fs[f]){io.err(`visudo: ${f}: No such file or directory\n`);bad=true;continue}
  if(es.length){bad=true;es.forEach(e=>io.out(`>>> ${f}: syntax error near line ${e.ln} <<<\n`));io.out(`parse error in ${f} near line ${es[0].ln}\n`);continue}
  if(f!=='/etc/sudoers'&&f.startsWith('/etc/sudoers.d/')&&bModeNum(fs[f])!==0o440){io.err(`visudo: ${f}: bad permissions, should be mode 0440\n`);bad=true;continue}
  io.out(`${f}: parsed OK\n`)}return bad?1:0};
// CI-раннер работает как служебная учётная запись с правом записи в /srv
{const _c=nciRunPipeline;nciRunPipeline=function(...a){const w=V53U;V53U='root';try{return _c.apply(this,a)}finally{V53U=w}}}
// ---- консоль: команды администрирования учётных записей ----
['useradd','usermod','userdel','groupadd','groupdel','gpasswd','passwd','chpasswd','su','id','groups','getent','visudo','chgrp'].forEach(c=>{if(!ADMC.includes(c))ADMC.push(c)});
// ---- задания ----
const acRaw=(d,p)=>{const n=sxFs(d)[p];return n?String(n.c||''):''};
const acHas=(d,p)=>!!sxFs(d)[p];
function acSetup(d,list){const db=acDB(d);list.forEach(([n,gr,sh])=>{if(db.us.some(u=>u.n===n))return;const uid=acFreeId(db.us,'uid',1000,59999);db.gs.push({n,gid:uid,m:[]});db.us.push({n,uid,gid:uid,gecos:'',home:'/home/'+n,sh:sh||'/bin/bash'});db.sh[n]=acHash('x'+n);(gr||[]).forEach(g=>{const gg=db.gs.find(x=>x.n===g);if(gg&&!gg.m.includes(n))gg.m.push(n)});
  const fs=sxFs(d);if(!fs['/home/'+n]){fs['/home/'+n]={d:1,m:0o755,o:n,g:n}}});acSave(d,db)}
function acPurge(d,names){const db=acDB(d),fs=sxFs(d);names.forEach(n=>{db.us=db.us.filter(u=>u.n!==n);delete db.sh[n];db.gs.forEach(g=>{g.m=g.m.filter(y=>y!==n)});db.gs=db.gs.filter(g=>g.n!==n||g.gid<0);Object.keys(fs).filter(k=>k==='/home/'+n||k.startsWith('/home/'+n+'/')).forEach(k=>delete fs[k])});acSave(d,db)}
admTask({id:'usr1',lvl:1,t:'Пользователи: учётная запись для деплоя',d:'Создайте системного пользователя deploy: домашний каталог /home/deploy, оболочка /bin/bash, комментарий «CI deploy» и дополнительная группа docker. Пароль не задавайте — вход по паролю должен остаться закрытым. Подсказка: по умолчанию useradd выдаёт оболочку /bin/sh и не создаёт домашний каталог.',
 hint:'sudo useradd -m -s /bin/bash -c "CI deploy" -G docker deploy · проверьте: id deploy, getent passwd deploy, ls /home',
 prep:d=>{acPurge(d,['deploy']);return'Пользователя deploy в системе нет.'},
 sol:'sudo useradd -m -s /bin/bash -c "CI deploy" -G docker deploy\n',
 chk:d=>{const db=acDB(d),u=db.us.find(x=>x.n==='deploy'),dk=db.gs.find(g=>g.n==='docker');return[['пользователь deploy создан',!!u],['домашний каталог /home/deploy существует',!!u&&u.home==='/home/deploy'&&acHas(d,'/home/deploy')],['оболочка /bin/bash',!!u&&u.sh==='/bin/bash'],['комментарий «CI deploy»',!!u&&u.gecos==='CI deploy'],['состоит в группе docker',!!dk&&dk.m.includes('deploy')],['пароль не задан (учётная запись заблокирована)',!!u&&/^!*$/.test(db.sh.deploy||'!')]]}});
admTask({id:'usr2',lvl:2,t:'sudoers: оператор перезапускает nginx',d:'Дежурный оператор ops должен уметь выполнять sudo systemctl restart nginx без пароля — и ничего больше (ни stop, ни чтения чужих файлов). Создайте файл /etc/sudoers.d/ops с правилом, задайте ему права 440 и проверьте синтаксис: sudo visudo -c. Добавлять ops в группу sudo нельзя. Запись «sudo echo … > файл» не сработает: перенаправление выполняет ваша оболочка, а не root — используйте tee.',
 hint:"echo 'ops ALL=(root) NOPASSWD: /usr/bin/systemctl restart nginx' | sudo tee /etc/sudoers.d/ops · sudo chmod 440 /etc/sudoers.d/ops · sudo visudo -c · sudo -l -U ops (в учебной модели: проверьте правило командой visudo -c)",
 prep:d=>{acPurge(d,['ops']);acSetup(d,[['ops',[],'/bin/bash']]);delete sxFs(d)['/etc/sudoers.d/ops'];return'Создан пользователь ops без особых прав.'},
 sol:"echo 'ops ALL=(root) NOPASSWD: /usr/bin/systemctl restart nginx' | sudo tee /etc/sudoers.d/ops\nsudo chmod 440 /etc/sudoers.d/ops\nsudo visudo -c\n",
 chk:d=>{const db=acDB(d),fs=sxFs(d),f=fs['/etc/sudoers.d/ops'],R=acRules(d),r=acSudo(d,'ops','root',['systemctl','restart','nginx']);return[['файл /etc/sudoers.d/ops создан',!!f],['ops может перезапустить nginx через sudo',r.ok],['без запроса пароля (NOPASSWD)',r.ok&&r.nopw],['ops не может останавливать службы',!acSudo(d,'ops','root',['systemctl','stop','nginx']).ok],['ops не может читать /etc/shadow через sudo',!acSudo(d,'ops','root',['cat','/etc/shadow']).ok],['права файла 440',!!f&&bModeNum(f)===0o440],['синтаксис sudoers корректен',R.errs.length===0],['ops не в группе sudo',!(db.gs.find(g=>g.n==='sudo')||{m:[]}).m.includes('ops')]]}});
admTask({id:'usr3',lvl:3,t:'Увольнение: блокировка учётной записи',d:'Сотрудник temp уволен. Закройте ему вход: заблокируйте пароль, замените оболочку на /usr/sbin/nologin, уберите из групп sudo и docker. Учётную запись и домашний каталог удалять нельзя — файлы нужны для передачи дел.',
 hint:'sudo usermod -L -s /usr/sbin/nologin temp · sudo gpasswd -d temp sudo · sudo gpasswd -d temp docker · проверьте: sudo passwd -S temp (статус L), id temp',
 prep:d=>{acPurge(d,['temp']);acSetup(d,[['temp',['sudo','docker'],'/bin/bash']]);sxWrite(sxFs(d),'/home/temp/notes.txt','передача дел: сервер резервных копий\n');sxFs(d)['/home/temp/notes.txt'].o='temp';sxFs(d)['/home/temp/notes.txt'].g='temp';return'Создан пользователь temp (группы sudo, docker, оболочка bash, пароль задан).'},
 sol:'sudo usermod -L -s /usr/sbin/nologin temp\nsudo gpasswd -d temp sudo\nsudo gpasswd -d temp docker\n',
 chk:d=>{const db=acDB(d),u=db.us.find(x=>x.n==='temp'),mem=g=>(db.gs.find(x=>x.n===g)||{m:[]}).m.includes('temp');return[['учётная запись temp сохранена',!!u],['пароль заблокирован (!)',(db.sh.temp||'')[0]==='!'],['оболочка /usr/sbin/nologin',!!u&&u.sh==='/usr/sbin/nologin'],['удалён из группы sudo',!mem('sudo')],['удалён из группы docker',!mem('docker')],['файлы в /home/temp на месте',acHas(d,'/home/temp/notes.txt')]]}});
admTask({id:'usr4',lvl:3,t:'Группа и общий каталог команды',d:'Сотрудники alice и bob работают над проектом, carol — нет. Создайте группу devs, добавьте в неё alice и bob, создайте каталог /srv/project: владелец root, группа devs, права 770 (владелец и группа — всё, остальным — ничего). Проверьте: sudo su - alice -c "touch /srv/project/a.txt" работает, а sudo su - carol -c "ls /srv/project" отвечает «Permission denied».',
 hint:'sudo groupadd devs · sudo usermod -aG devs alice · sudo usermod -aG devs bob · sudo mkdir /srv/project · sudo chown root:devs /srv/project · sudo chmod 770 /srv/project',
 prep:d=>{acPurge(d,['alice','bob','carol']);const db=acDB(d);db.gs=db.gs.filter(g=>g.n!=='devs');acSave(d,db);acSetup(d,[['alice'],['bob'],['carol']]);sxRm(sxFs(d),'/srv/project',true);return'Созданы пользователи alice, bob, carol; группы devs и каталога /srv/project нет.'},
 sol:'sudo groupadd devs\nsudo usermod -aG devs alice\nsudo usermod -aG devs bob\nsudo mkdir /srv/project\nsudo chown root:devs /srv/project\nsudo chmod 770 /srv/project\n',
 chk:d=>{const db=acDB(d),fs=sxFs(d),g=db.gs.find(x=>x.n==='devs'),n=fs['/srv/project'],X={fs,d};return[['группа devs создана',!!g],['в devs состоят alice и bob',!!g&&g.m.includes('alice')&&g.m.includes('bob')],['carol в группу не добавлена',!!g&&!g.m.includes('carol')],['каталог /srv/project: владелец root, группа devs',!!n&&n.d&&(n.o||'root')==='root'&&n.g==='devs'],['права каталога 770',!!n&&bModeNum(n)===0o770],['alice может создавать файлы в каталоге',!!n&&acOk(X,'/srv/project/x',3,'alice')===true&&acOk(X,'/srv/project',2,'alice')],['carol не может войти в каталог',!!n&&!acOk(X,'/srv/project',4,'carol')]]}});
// ---- справка ----
CMDS.push(['useradd','useradd [-m] [-s оболочка] [-c комментарий] [-G группы] [-g группа] [-u uid] имя · usermod [-aG группы] [-s] [-L|-U] [-l новое] имя · userdel [-r] имя','Учётные записи пользователей','Только root (sudo). useradd без -m не создаёт домашний каталог, а оболочка по умолчанию /bin/sh — укажите -m -s /bin/bash. usermod -aG добавляет в группы (без -a группы заменяются!), -L блокирует пароль, -U разблокирует. Данные хранятся в /etc/passwd, /etc/group, /etc/shadow — их можно читать (cat; shadow — только root). userdel -r удаляет и домашний каталог.','Администрирование']);
CMDS.push(['groupadd','groupadd [-g gid] группа · groupdel группа · gpasswd -a|-d пользователь группа · id [пользователь] · groups [пользователь] · getent passwd|group [имя]','Группы и состав групп','groupadd создаёт группу, gpasswd -a/-d добавляет и убирает пользователя, id и groups показывают принадлежность. Группа нужна для общего доступа: chown root:группа каталог и chmod 770 каталог. Основную группу пользователя удалить нельзя.','Администрирование']);
CMDS.push(['su','su [-] [пользователь] -c \'команда\' · sudo [-u пользователь] команда · sudo -l · visudo -c','Смена пользователя и sudoers','su из-под обычного пользователя запрашивает пароль целевого — в модели это «Authentication failure»; root переключается без пароля: sudo su - alice -c \'id\'. Интерактивная оболочка недоступна, только -c. sudo проверяет /etc/sudoers и /etc/sudoers.d/*: правило «ops ALL=(root) NOPASSWD: /usr/bin/systemctl restart nginx» даёт ровно одну команду. Файл правил — права 440; проверка: sudo visudo -c. Перенаправление «sudo echo x > /etc/f» не работает (его выполняет ваша оболочка) — используйте | sudo tee.','Администрирование']);
MAN.push(['Т29. Пользователи, группы и sudoers',`<h3>Учётные записи в Стектонии</h3>
<p>У каждого Linux-узла схемы есть свои файлы <code>/etc/passwd</code> (пользователи), <code>/etc/group</code> (группы) и <code>/etc/shadow</code> (пароли, читает только root). Они — единственный источник истины: команды <code>useradd</code>, <code>usermod</code>, <code>userdel</code>, <code>groupadd</code>, <code>groupdel</code>, <code>gpasswd</code>, <code>passwd</code>, <code>chpasswd</code> изменяют именно их, и результат видно через <code>cat /etc/passwd</code>, <code>getent</code>, <code>id</code>, <code>groups</code>. Менять учётные записи может только root, то есть через <code>sudo</code>. Работают в терминале bash и в консоли.</p>
<p><b>Создание.</b> <code>sudo useradd -m -s /bin/bash -c "Иван" -G docker ivan</code>: <code>-m</code> создаёт /home/ivan, <code>-s</code> задаёт оболочку (по умолчанию /bin/sh!), <code>-G</code> — дополнительные группы. Пароль: <code>echo 'ivan:Секрет1' | sudo chpasswd</code> (интерактивный <code>passwd</code> недоступен). Без пароля учётная запись заблокирована (в shadow «!»). <code>sudo passwd -S ivan</code> — статус (L заблокирован, P пароль есть, NP пустой).</p>
<p><b>Изменение.</b> <code>sudo usermod -aG группа ivan</code> — добавить в группу (<b>без -a группы заменяются</b>, частая ошибка); <code>-s</code> — оболочка; <code>-L</code>/<code>-U</code> — заблокировать/разблокировать; <code>-l новое</code> — переименовать; <code>sudo userdel -r ivan</code> — удалить вместе с домашним каталогом. Увольнение сотрудника: заблокировать (<code>usermod -L</code>), оболочка <code>/usr/sbin/nologin</code>, убрать из привилегированных групп — но не удалять сразу.</p>
<p><b>Права по владельцу и группе.</b> Теперь команды учитывают, кто их запускает: <code>cat</code>, <code>ls</code>, <code>cd</code>, <code>touch</code>, <code>mkdir</code>, <code>rm</code>, <code>cp</code>, <code>mv</code>, <code>tee</code> и перенаправление <code>&gt;</code> проверяют биты r/w/x для владельца, группы или «остальных»; на пути к файлу нужен бит x у каждого каталога. root обходит проверки. Новые файлы получают владельца — того, кто их создал (<code>sudo touch f</code> → root). <code>chown</code> меняет владельца (root), <code>chgrp группа файл</code> — группу, <code>chmod</code> — только владелец или root. Проверка от имени другого пользователя: <code>sudo su - alice -c 'cat /srv/project/a.txt'</code> или <code>sudo -u alice ls /srv/project</code>.</p>
<p><b>su и sudo.</b> <code>su - alice -c 'команда'</code> выполняет команду от alice (<code>-</code> — войти в её домашний каталог). Обычный пользователь не знает чужого пароля — «Authentication failure»; root входит без пароля, поэтому <code>sudo su - alice -c 'id'</code>. Учётные записи с оболочкой nologin: «This account is currently not available.» <code>sudo -u пользователь команда</code> — одна команда от другого пользователя; <code>sudo -l</code> — что разрешено вам. Если вас нет в sudoers: «… is not in the sudoers file.»</p>
<p><b>sudoers.</b> Права на sudo задают /etc/sudoers и файлы /etc/sudoers.d/*. Формат: <code>кто где=(от_чьего_имени) [NOPASSWD:] команды</code>. Примеры: <code>%admins ALL=(ALL:ALL) ALL</code> — группе admins всё; <code>ops ALL=(root) NOPASSWD: /usr/bin/systemctl restart nginx</code> — оператору ровно одна команда без пароля; <code>!команда</code> — запрет. По умолчанию sudo имеет группа sudo. Файлы правил должны иметь права 440; проверка синтаксиса — <code>sudo visudo -c</code>. Ловушка: <code>sudo echo x &gt; /etc/файл</code> завершается «Permission denied», потому что перенаправление выполняет ваша оболочка; правильно — <code>echo x | sudo tee /etc/файл</code>.</p>
<p><b>Задания:</b> «учётная запись для деплоя», «оператор перезапускает nginx (sudoers)», «увольнение: блокировка учётной записи», «группа и общий каталог команды».</p>
<p class="mt">Ограничения: пароли не вводятся (нет интерактивных passwd/su/sudo-запроса), хэши условные; нет PAM, срока действия паролей, ACL, setuid/setgid и sticky-битов, newgrp; <code>ssh</code> и <code>scp</code> по-прежнему работают только от пользователя student; учитываются права на чтение, запись и вход в каталоги в командах, перечисленных выше, остальные команды проверку не выполняют; sudo не запрашивает пароль.</p>`]);
{const m=MAN.find(x=>/Скрипты \(bash/.test(x[0]));if(m)m[1]=m[1].replace(/\d+ заданий/,SXT.length+' заданий')}
if(typeof exSyncCustom==='function')exSyncCustom();
p('Новое (v53): пользователи и группы — useradd/usermod/userdel/groupadd/gpasswd/passwd/su/sudo/id/visudo, /etc/passwd, /etc/group, sudoers, права по владельцу и группе; задания usr1–usr4.');
