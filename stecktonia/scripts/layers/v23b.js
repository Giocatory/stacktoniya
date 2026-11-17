// ================= v23b: симулятор git и Git-сервер =================
function gNow(){const t=Math.max(Date.now(),(gNow.l||0)+1000);gNow.l=t;return t}
const gShort=id=>String(id).slice(0,7);
const gNewRepo=(bare,b)=>({bare:!!bare,cfg:{},head:b||'main',det:null,refs:{},rrefs:{},remotes:{},objs:{},idx:{},stash:[],tags:{},up:{},merging:null,conflicts:{},prot:[],reb:null});
function gFind(d,cwd){const fs=sxFs(d);let p=cwd;for(;;){const r=d.gdb&&d.gdb[p];if(r&&(r.bare||(fs[p+'/.git']&&fs[p+'/.git'].d)))return{root:p,r};if(p==='/')return null;p=p.slice(0,p.lastIndexOf('/'))||'/'}}
const gHead=r=>r.det||r.refs[r.head]||null;
const gTreeOf=(r,id)=>id&&r.objs[id]?r.objs[id].tree:{};
function gAnc(r,id){const s=new Set(),q=id?[id]:[];while(q.length){const x=q.pop();if(s.has(x)||!r.objs[x])continue;s.add(x);q.push(...r.objs[x].p)}return s}
function gBase(r,a,b){const A=gAnc(r,a),B=gAnc(r,b);let best=null;for(const x of A)if(B.has(x)){if(!best||r.objs[x].ts>r.objs[best].ts)best=x}return best}
function gRev(r,s){if(!s)return null;const m=s.match(/^(.*?)((?:[~^]\d*)*)$/),base=m[1],suf=m[2];let id=null;
 if(base==='HEAD'||base==='@')id=gHead(r);else if(r.refs[base]!==undefined)id=r.refs[base];else if(r.rrefs[base]!==undefined)id=r.rrefs[base];else if(r.tags[base])id=r.tags[base].id;
 else if(/^[0-9a-f]{4,40}$/.test(base)){const c=Object.keys(r.objs).filter(k=>k.startsWith(base));if(c.length===1)id=c[0]}
 if(!id||!r.objs[id])return null;
 for(const t of suf.match(/[~^]\d*/g)||[]){const n=t.length>1?+t.slice(1):1;if(t[0]==='~'){for(let i=0;i<n;i++){id=r.objs[id].p[0];if(!id)return null}}else{id=r.objs[id].p[n-1];if(!id)return null}}return id}
function gWork(d,root){const fs=sxFs(d),W={},pre=root==='/'?'/':root+'/';for(const k in fs){if(!k.startsWith(pre)||fs[k].d)continue;const rel=k.slice(pre.length);if(rel==='.git'||rel.startsWith('.git/'))continue;W[rel]=fs[k].c||''}return W}
function gRules(d,root){const f=sxFs(d)[root+'/.gitignore'];if(!f)return[];return String(f.c).split('\n').map(s=>s.trim()).filter(s=>s&&!s[0]!=='#'&&s[0]!=='#').map(s=>{let neg=false,dir=false,anch=false;if(s[0]==='!'){neg=true;s=s.slice(1)}if(s.endsWith('/')){dir=true;s=s.slice(0,-1)}if(s.startsWith('/')){anch=true;s=s.slice(1)}else if(s.includes('/'))anch=true;return{neg,dir,anch,re:sxWild(s)}})}
function gIgnored(rules,rel){const parts=rel.split('/');let ig=false;for(const ru of rules){let hit=false;for(let i=0;i<parts.length;i++){if(ru.dir&&i===parts.length-1)continue;const sub=parts.slice(0,i+1).join('/');if(ru.anch?ru.re.test(sub):ru.re.test(parts[i])){hit=true;break}}if(hit)ig=!ru.neg}return ig}
const gDate=ts=>{const t=new Date(ts),D=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],z=-t.getTimezoneOffset(),a=Math.abs(z),p2=n=>String(n).padStart(2,'0');
 return`${D[t.getDay()]} ${M[t.getMonth()]} ${t.getDate()} ${p2(t.getHours())}:${p2(t.getMinutes())}:${p2(t.getSeconds())} ${t.getFullYear()} ${z<0?'-':'+'}${p2(Math.floor(a/60))}${p2(a%60)}`};
const gCfg=(G,k)=>G.r.cfg[k]!==undefined?G.r.cfg[k]:(G.d.gcfg||{})[k];
function gIdent(G){const n=gCfg(G,'user.name'),e=gCfg(G,'user.email');return n&&e?`${n} <${e}>`:null}
const gNoIdent=G=>`Author identity unknown\n\n*** Please tell me who you are.\n\nRun\n\n  git config --global user.email "you@example.com"\n  git config --global user.name "Your Name"\n\nto set your account's default identity.\nOmit --global to set the identity only in this repository.\n\nfatal: unable to auto-detect email address (got '${G.d.name.toLowerCase()}@${G.d.name.toLowerCase()}.(none)')`;
function gStatus(G){const {d,root,r}=G,H=gTreeOf(r,gHead(r)),I=r.idx,W=gWork(d,root),rules=gRules(d,root);const st={staged:[],unstaged:[],untracked:[],unmerged:[]};
 for(const p of new Set([...Object.keys(H),...Object.keys(I)])){if(r.conflicts[p])continue;if(H[p]===undefined)st.staged.push([p,'new file']);else if(I[p]===undefined)st.staged.push([p,'deleted']);else if(H[p]!==I[p])st.staged.push([p,'modified'])}
 for(const p of Object.keys(I)){if(r.conflicts[p]){st.unmerged.push(p);continue}if(W[p]===undefined)st.unstaged.push([p,'deleted']);else if(W[p]!==I[p])st.unstaged.push([p,'modified'])}
 const dirs=new Set();for(const p of Object.keys(W)){if(I[p]!==undefined||r.conflicts[p])continue;if(gIgnored(rules,p))continue;const parts=p.split('/');let shown=p;if(parts.length>1){const top=parts[0];if(!Object.keys(I).some(k=>k.startsWith(top+'/'))){shown=top+'/'}}if(!dirs.has(shown)){dirs.add(shown);st.untracked.push(shown)}}
 const srt=a=>a.sort((x,y)=>String(x[0]||x).localeCompare(String(y[0]||y),'en'));srt(st.staged);srt(st.unstaged);st.untracked.sort();st.unmerged.sort();return st}
function gTrack(G){const r=G.r,b=r.head,u=r.up[b];if(!u||r.det)return'';const uid=r.rrefs[u];if(uid===undefined)return`Your branch is based on '${u}', but the upstream is gone.\n`;const h=gHead(r),A=gAnc(r,h),B=gAnc(r,uid);let ah=0,bh=0;A.forEach(x=>{if(!B.has(x))ah++});B.forEach(x=>{if(!A.has(x))bh++});
 if(!ah&&!bh)return`Your branch is up to date with '${u}'.\n`;if(ah&&!bh)return`Your branch is ahead of '${u}' by ${ah} commit${ah>1?'s':''}.\n  (use "git push" to publish your local commits)\n`;
 if(!ah&&bh)return`Your branch is behind '${u}' by ${bh} commit${bh>1?'s':''}, and can be fast-forwarded.\n  (use "git pull" to update your local branch)\n`;return`Your branch and '${u}' have diverged,\nand have ${ah} and ${bh} different commits each, respectively.\n  (use "git pull" to merge the remote branch into yours)\n`}
function gBranchHdr(G){const r=G.r;if(r.det)return'## HEAD (no branch)\n';if(!gHead(r))return`## No commits yet on ${r.head}\n`;const t=gTrack(G)||'';const m=/'([^']+)'/.exec(t);if(!m)return`## ${r.head}\n`;let x='';let q;if((q=/ahead of '[^']+' by (\d+)/.exec(t)))x=` [ahead ${q[1]}]`;else if((q=/behind '[^']+' by (\d+)/.exec(t)))x=` [behind ${q[1]}]`;else if((q=/have (\d+) and (\d+) different/.exec(t)))x=` [ahead ${q[1]}, behind ${q[2]}]`;return`## ${r.head}...${m[1]}${x}\n`}
function gStatusText(G,short,br){const r=G.r,st=gStatus(G);if(short){let o=br?gBranchHdr(G):'';const m={'new file':'A','modified':'M','deleted':'D'};const all={};st.staged.forEach(([p,k])=>all[p]=[m[k],' ']);st.unstaged.forEach(([p,k])=>{all[p]=[(all[p]||[' '])[0],m[k]]});
  st.unmerged.forEach(p=>all[p]=['U','U']);Object.keys(all).sort().forEach(p=>{o+=all[p][0]+all[p][1]+' '+p+'\n'});st.untracked.forEach(p=>o+='?? '+p+'\n');return o}
 let o=r.det?`HEAD detached at ${gShort(r.det)}\n`:`On branch ${r.head}\n`+gTrack(G);
 if(r.reb)o+=`interactive rebase in progress; onto ${gShort(r.reb.onto)}\n`;
 if(!gHead(r)&&!r.det)o+='\nNo commits yet\n';
 if(r.merging&&st.unmerged.length)o+='You have unmerged paths.\n  (fix conflicts and run "git commit")\n  (use "git merge --abort" to abort the merge)\n';else if(r.merging)o+='All conflicts fixed but you are still merging.\n  (use "git commit" to conclude merge)\n';
 if(st.staged.length)o+='\nChanges to be committed:\n  (use "git restore --staged <file>..." to unstage)\n'+st.staged.map(([p,k])=>`\t${(k+':').padEnd(12)}${p}`).join('\n')+'\n';
 if(st.unmerged.length)o+='\nUnmerged paths:\n  (use "git add <file>..." to mark resolution)\n'+st.unmerged.map(p=>`\tboth modified:   ${p}`).join('\n')+'\n';
 if(st.unstaged.length)o+='\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n  (use "git restore <file>..." to discard changes in working directory)\n'+st.unstaged.map(([p,k])=>`\t${(k+':').padEnd(12)}${p}`).join('\n')+'\n';
 if(st.untracked.length)o+='\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)\n'+st.untracked.map(p=>'\t'+p).join('\n')+'\n';
 if(!st.staged.length&&!st.unmerged.length){if(st.unstaged.length)o+='\nno changes added to commit (use "git add" and/or "git commit -a")\n';else if(st.untracked.length)o+='\nnothing added to commit but untracked files present (use "git add" to track)\n';else o+=gHead(r)||r.det?'\nnothing to commit, working tree clean\n':'\nnothing to commit (create/copy files and use "git add" to track)\n'}
 return o}
// запись в рабочий каталог
function gPut(G,p,c){const fs=sxFs(G.d),full=G.root+'/'+p,up=full.slice(0,full.lastIndexOf('/'));sxMk(fs,up,true);sxWrite(fs,full,c)}
function gDel(G,p){const fs=sxFs(G.d);delete fs[G.root+'/'+p];let up=(G.root+'/'+p);up=up.slice(0,up.lastIndexOf('/'));while(up.length>G.root.length&&sxDir(fs,up)&&!sxLs(fs,up).length){delete fs[up];up=up.slice(0,up.lastIndexOf('/'))}}
function gSetState(G,tree,old){const r=G.r;const paths=new Set([...Object.keys(old||{}),...Object.keys(tree)]);for(const p of paths){if(tree[p]===undefined){gDel(G,p);delete r.idx[p]}else{gPut(G,p,tree[p]);r.idx[p]=tree[p]}}}
function gSetDiff(G,N,H){const ch=[...new Set([...Object.keys(H),...Object.keys(N)])].filter(p=>H[p]!==N[p]);gSetState(G,Object.fromEntries(ch.filter(p=>N[p]!==undefined).map(p=>[p,N[p]])),Object.fromEntries(ch.filter(p=>H[p]!==undefined).map(p=>[p,H[p]])))}
function gDirty(G,paths){const W=gWork(G.d,G.root),H=gTreeOf(G.r,gHead(G.r)),I=G.r.idx;return paths.filter(p=>W[p]!==I[p]||I[p]!==H[p])}
function gNewCommit(G,msg,parents,tree,author,ts){const r=G.r,o={tree:{...tree},p:parents,m:msg,a:author,ts:ts||gNow()};const id=sxHash(JSON.stringify(o)+Math.random());r.objs[id]=o;return id}
function gStat(A,B){let ins=0,del=0,lines=[];const paths=[...new Set([...Object.keys(A),...Object.keys(B)])].sort();let n=0;
 paths.forEach(p=>{if(A[p]===B[p])return;n++;const e=sxEdits(sxLines(A[p]||''),sxLines(B[p]||''));const i=e.filter(x=>x.t==='+').length,dd=e.filter(x=>x.t==='-').length;ins+=i;del+=dd;lines.push(` ${p} | ${i+dd} ${'+'.repeat(Math.min(i,30))}${'-'.repeat(Math.min(dd,30))}`)});
 if(!n)return'';const w=Math.max(...lines.map(l=>l.indexOf('|')));lines=lines.map(l=>{const k=l.indexOf('|');return l.slice(0,k).padEnd(w)+l.slice(k)});
 return lines.join('\n')+`\n ${n} file${n>1?'s':''} changed${ins?`, ${ins} insertion${ins>1?'s':''}(+)`:''}${del?`, ${del} deletion${del>1?'s':''}(-)`:''}\n`}
function gDiffText(A,B,paths,nameOnly,stat){let o='';const ps=[...new Set([...Object.keys(A),...Object.keys(B)])].sort().filter(p=>(!paths||!paths.length||paths.some(q=>p===q||p.startsWith(q.replace(/\/$/,'')+'/')))&&A[p]!==B[p]);
 if(nameOnly)return ps.join('\n')+(ps.length?'\n':'');if(stat){const a={},b={};ps.forEach(p=>{if(A[p]!==undefined)a[p]=A[p];if(B[p]!==undefined)b[p]=B[p]});return gStat(a,b)}
 ps.forEach(p=>{const ha=sxHash(A[p]||'',7),hb=sxHash(B[p]||'',7);o+=`diff --git a/${p} b/${p}\n`;
  if(A[p]===undefined)o+=`new file mode 100644\nindex 0000000..${hb}\n`;else if(B[p]===undefined)o+=`deleted file mode 100644\nindex ${ha}..0000000\n`;else o+=`index ${ha}..${hb} 100644\n`;
  o+=sxUdiff(A[p]===undefined?'':A[p],B[p]===undefined?'':B[p],A[p]===undefined?'/dev/null':'a/'+p,B[p]===undefined?'/dev/null':'b/'+p)});return o}
function gDeco(r){const m={};const add=(id,s)=>{if(id)(m[id]=m[id]||[]).push(s)};const h=gHead(r);if(r.det)add(h,'HEAD');else add(h,'HEAD -> '+r.head);Object.keys(r.refs).forEach(b=>{if(!(b===r.head&&!r.det))add(r.refs[b],b)});Object.keys(r.rrefs).forEach(b=>add(r.rrefs[b],b));Object.keys(r.tags).forEach(t=>add(r.tags[t].id,'tag: '+t));return m}
function gLogIds(r,starts,excl){const ex=new Set();(excl||[]).forEach(e=>gAnc(r,e).forEach(x=>ex.add(x)));const seen=new Set(),ids=[];starts.forEach(s=>gAnc(r,s).forEach(x=>{if(!ex.has(x)&&!seen.has(x)){seen.add(x);ids.push(x)}}));return ids.sort((a,b)=>r.objs[b].ts-r.objs[a].ts)}
// ---- сеть: разбор адреса и связь с сервером ----
function gUrl(u){let m;if((m=u.match(/^ssh:\/\/(?:[^@\/]+@)?([^\/:]+)(?::(\d+))?\/(.*)$/)))return{k:'ssh',host:m[1],port:+m[2]||22,path:m[3]};
 if((m=u.match(/^https?:\/\/([^\/:]+)(?::(\d+))?\/(.*)$/)))return{k:'http',host:m[1],port:+m[2]||(u.startsWith('https')?443:80),path:m[3]};
 if((m=u.match(/^git:\/\/([^\/:]+)(?::(\d+))?\/(.*)$/)))return{k:'git',host:m[1],port:+m[2]||9418,path:m[3]};
 if((m=u.match(/^(?:[^@\/:]+@)?([^\/:]{2,}):(.*)$/)))return{k:'ssh',host:m[1],port:22,path:m[2]};return{k:'local',path:u}}
function gHostIp(d,h){if(/^\d+\.\d+\.\d+\.\d+$/.test(h))return h;const x=byNm(h);if(x&&srcIp(x))return srcIp(x);const o=sxNet(d,'nslookup '+h),m=o.match(/(\d+\.\d+\.\d+\.\d+)\s*$/m)||o.match(/Address[^\d]*(\d+\.\d+\.\d+\.\d+)/);return m?m[1]:null}
function gRemote(G,url,write){const d=G.d,U=gUrl(url);let srv=d,fail=null;
 if(U.k!=='local'){const ip=gHostIp(d,U.host);if(!ip){return{err:U.k==='ssh'?`ssh: Could not resolve hostname ${U.host}: Name or service not known\nfatal: Could not read from remote repository.\n\nPlease make sure you have the correct access rights\nand the repository exists.`:`fatal: unable to access '${url}': Could not resolve host: ${U.host}`}}
  srv=devByIp(ip);QUIET++;let R;try{EX=[];R=l4(d,ip,'tcp',U.port)}catch(e){R={ok:false,state:'unreach'}}finally{QUIET--}
  if(!R.ok||!srv){const why=R.state==='closed'?'Connection refused':R.state==='unreach'?'No route to host':'Connection timed out';
   return{err:U.k==='ssh'?`ssh: connect to host ${U.host} port ${U.port}: ${why}\nfatal: Could not read from remote repository.\n\nPlease make sure you have the correct access rights\nand the repository exists.`:`fatal: unable to access '${url}': Failed to connect to ${U.host} port ${U.port}: ${why}`}}
  let p=U.path.replace(/^\/+/,'');if(!p.endsWith('.git'))p+='.git';const key='/srv/git/'+p,rr=srv.gdb&&srv.gdb[key];
  if(!rr||!rr.bare)return{err:U.k==='ssh'?`fatal: '${U.path}' does not appear to be a git repository\nfatal: Could not read from remote repository.\n\nPlease make sure you have the correct access rights\nand the repository exists.`:`fatal: repository '${url}' not found`};
  return{r:rr,srv,key}}
 const key=sxNorm(G.cwd,U.path),rr=d.gdb&&(d.gdb[key]||d.gdb[key+'/.git']);const k2=d.gdb&&d.gdb[key]?key:null;
 if(!k2)return{err:`fatal: '${U.path}' does not appear to be a git repository`};return{r:d.gdb[k2],srv:d,key:k2}}
function gCopyObjs(from,to){let n=0;for(const id in from.objs)if(!to.objs[id]){to.objs[id]=from.objs[id];n++}return n}
function gMergeTrees(B,O,T,l1,l2){const res={},conf=[];for(const p of new Set([...Object.keys(B),...Object.keys(O),...Object.keys(T)])){const b=B[p],o=O[p],t=T[p];
 if(o===t){if(o!==undefined)res[p]=o;continue}if(b===o){if(t!==undefined)res[p]=t;continue}if(b===t){if(o!==undefined)res[p]=o;continue}
 if(o===undefined||t===undefined){res[p]=o===undefined?t:o;conf.push({p,k:'modify/delete'});continue}
 const m=sxMerge3(b===undefined?'':b,o,t,l1,l2);res[p]=m.text;if(m.conflict)conf.push({p,k:'content'})}return{res,conf}}
function gApplyMerge(G,M,oldTree,msgs){const r=G.r;const cs={};M.conf.forEach(c=>cs[c.p]=1);
 for(const p of new Set([...Object.keys(oldTree),...Object.keys(M.res)])){if(M.res[p]===undefined){gDel(G,p);delete r.idx[p]}else{gPut(G,p,M.res[p]);if(!cs[p])r.idx[p]=M.res[p]}}
 r.conflicts={};M.conf.forEach(c=>{r.conflicts[c.p]=1;msgs.push(`CONFLICT (${c.k==='content'?'content':'modify/delete'}): Merge conflict in ${c.p}`)})}
const gHelp=`usage: git [--version] <command> [<args>]

start a working area:   init, clone
work on the current change:   add, mv, restore, rm
examine the history and state:   diff, log, show, status
grow, mark and tweak your history:   branch, commit, merge, rebase, reset, switch, tag, cherry-pick, revert, stash
collaborate:   fetch, pull, push, remote
other:   config, clean, checkout`;
function gitRun(d,cwd,a,io){const cmd=a[0];a=a.slice(1);const Q=['init','commit','clone','checkout','switch','merge','push','pull','fetch','reset','stash','add','rebase','cherry-pick','revert','branch','tag'].includes(cmd)&&a.some(x=>x==='-q'||x==='--quiet'||(/^-[a-z]+$/.test(x)&&x.length>2&&x.includes('q')&&cmd==='commit'));const O=s=>{if(!Q)io.out(s)},E=s=>io.err(s);
 if(!cmd||cmd==='help'||cmd==='--help'){O(gHelp+'\n');return 0}
 if(cmd==='--version'||cmd==='version'){O('git version 2.43.0 (Stacktoniya simulator)\n');return 0}
 const G0={d,cwd,io};d.gdb=d.gdb||{};
 if(cmd==='config'){let glob=false,rest=[];a.forEach(x=>{if(x==='--global'||x==='--system')glob=true;else if(x==='--local'){}else rest.push(x)});const f=gFind(d,cwd);const store=glob||!f?(d.gcfg=d.gcfg||{}):f.r.cfg;
  if(rest[0]==='--list'||rest[0]==='-l'){const all={...(d.gcfg||{}),...(f?f.r.cfg:{})};Object.keys(all).sort().forEach(k=>O(k+'='+all[k]+'\n'));return 0}
  if(rest[0]==='--unset'){delete store[rest[1]];return 0}if(rest[0]==='--get')rest.shift();
  if(rest.length===1){const v=f&&f.r.cfg[rest[0]]!==undefined?f.r.cfg[rest[0]]:(d.gcfg||{})[rest[0]];if(v===undefined)return 1;O(v+'\n');return 0}
  if(rest.length>=2){store[rest[0].toLowerCase()===rest[0]?rest[0]:rest[0]]=rest.slice(1).join(' ');return 0}E('usage: git config [--global] <name> [<value>]\n');return 129}
 if(cmd==='init'){let bare=false,br=null,dir=null;for(let i=0;i<a.length;i++){if(a[i]==='--bare')bare=true;else if(a[i]==='-b'||a[i]==='--initial-branch')br=a[++i];else if(a[i].startsWith('--initial-branch='))br=a[i].split('=')[1];else if(a[i][0]!=='-')dir=a[i]}
  const root=dir?sxNorm(cwd,dir):cwd,fs=sxFs(d);const e=sxMk(fs,root,true);if(e&&e!=='File exists'){E(`fatal: cannot mkdir ${dir}: ${e}\n`);return 128}
  if(d.gdb[root]){O(`Reinitialized existing Git repository in ${root}${bare?'':'/.git'}/\n`);return 0}
  d.gdb[root]=gNewRepo(bare,br||(d.gcfg&&d.gcfg['init.defaultbranch'])||'main');if(!bare)fs[root+'/.git']={d:1};O(`Initialized empty Git repository in ${root}${bare?'':'/.git'}/\n`);return 0}
 if(cmd==='clone'){const url=a.find(x=>x[0]!=='-');const rest=a.filter(x=>x[0]!=='-'&&x!==url);if(!url){E('fatal: You must specify a repository to clone.\n');return 129}
  let name=rest[0]||url.replace(/\/+$/,'').split(/[\/:]/).pop().replace(/\.git$/,'');const root=sxNorm(cwd,name),fs=sxFs(d);
  if(fs[root]&&sxLs(fs,root).length){E(`fatal: destination path '${name}' already exists and is not an empty directory.\n`);return 128}
  O(`Cloning into '${name}'...\n`);const G={d,cwd,io,r:gNewRepo(false)};const R=gRemote(G,url);if(R.err){E(R.err+'\n');return 128}
  sxMk(fs,root,true);fs[root+'/.git']={d:1};const r=gNewRepo(false,R.r.head);d.gdb[root]=r;r.cfg={};r.remotes.origin={url};const n=gCopyObjs(R.r,r);
  Object.keys(R.r.refs).forEach(b=>r.rrefs['origin/'+b]=R.r.refs[b]);Object.keys(R.r.tags).forEach(t=>r.tags[t]=R.r.tags[t]);
  const hid=R.r.refs[R.r.head];if(hid){r.refs[r.head]=hid;r.up[r.head]='origin/'+r.head;const G2={d,cwd:root,root,io,r};gSetState(G2,gTreeOf(r,hid),{});O(`remote: Enumerating objects: ${n+2}, done.\nremote: Total ${n+2} (delta 0), reused 0 (delta 0)\nReceiving objects: 100% (${n+2}/${n+2}), done.\n`)}else E('warning: You appear to have cloned an empty repository.\n');return 0}
 const F=gFind(d,cwd);if(!F){E('fatal: not a git repository (or any of the parent directories): .git\n');return 128}
 const G={d,cwd,io,root:F.root,r:F.r},r=F.r,fs=sxFs(d);
 const needWork=()=>{if(r.bare){E('fatal: this operation must be run in a work tree\n');return true}return false};
 const relp=p=>{const full=sxNorm(cwd,p);return full===G.root?'':full.startsWith(G.root+'/')?full.slice(G.root.length+1):null};
 const expand=(ps,allowGone)=>{const W=gWork(d,G.root),res=new Set();for(const p of ps){if(p==='.'||p===':/'||p===''){Object.keys(W).forEach(k=>res.add(k));if(allowGone)Object.keys(r.idx).forEach(k=>res.add(k));continue}
   const rp=relp(p);if(rp===null)return{err:`fatal: ${p}: '${p}' is outside repository at '${G.root}'`};let hit=0;
   const globs=/[*?\[]/.test(p)?sxGlob(fs,cwd,p).map(x=>sxNorm(cwd,x)).filter(x=>fs[x]).map(x=>x.slice(G.root.length+1)):[rp];
   globs.forEach(g=>{if(W[g]!==undefined){res.add(g);hit++}else{const pre=g+'/';Object.keys(W).forEach(k=>{if(k.startsWith(pre)){res.add(k);hit++}});if(allowGone){Object.keys(r.idx).forEach(k=>{if(k===g||k.startsWith(pre)){res.add(k);hit++}})}}});
   if(!hit)return{err:`fatal: pathspec '${p}' did not match any files`}}return{set:[...res]}};
 const dirtyMsg=(ps,what)=>`error: Your local changes to the following files would be overwritten by ${what}:\n${ps.map(x=>'\t'+x).join('\n')}\n`+(what==='checkout'?'Please commit your changes or stash them before you switch branches.\nAborting\n':'Please commit your changes or stash them before you merge.\nAborting\n');
 const commitMade=(id,msg,root0,parentTree)=>{const o=r.objs[id],t=o.tree;let s=`[${r.det?'detached HEAD':r.head}${root0?' (root-commit)':''} ${gShort(id)}] ${msg.split('\n')[0]}\n`;const st=gStat(parentTree,t);if(st){const ls=st.split('\n');s+=ls[ls.length-2]+'\n'}
  Object.keys(t).sort().forEach(p=>{if(parentTree[p]===undefined)s+=` create mode 100644 ${p}\n`});Object.keys(parentTree).sort().forEach(p=>{if(t[p]===undefined)s+=` delete mode 100644 ${p}\n`});return s};
 const advance=id=>{if(r.det)r.det=id;else r.refs[r.head]=id};
 const finishPick=(msgIn)=>{ };
 switch(cmd){
 case'status':{if(needWork())return 128;const sh=a.some(x=>x==='-s'||x==='--short'||/^-[a-z]*s[a-z]*$/.test(x)&&!x.startsWith('--')),br=a.some(x=>x==='-b'||x==='--branch'||/^-[a-z]*b[a-z]*$/.test(x)&&!x.startsWith('--'));O(gStatusText(G,sh||br&&false||sh,br&&sh));return 0}
 case'add':{if(needWork())return 128;const all=a.includes('-A')||a.includes('--all')||a.includes('-u')||a.includes('--update'),upd=a.includes('-u')||a.includes('--update');let ps=a.filter(x=>x[0]!=='-');if(!ps.length){if(all)ps=['.'];else{E('Nothing specified, nothing added.\nhint: Maybe you wanted to say \'git add .\'?\n');return 0}}
  const ex=expand(ps,true);if(ex.err){E(ex.err+'\n');return 128}const W=gWork(d,G.root),rules=gRules(d,G.root);const ign=[];
  ex.set.forEach(p=>{if(W[p]===undefined){if(r.idx[p]!==undefined){delete r.idx[p];delete r.conflicts[p]}return}if(upd&&r.idx[p]===undefined)return;if(r.idx[p]===undefined&&gIgnored(rules,p)){ign.push(p);return}r.idx[p]=W[p];delete r.conflicts[p]});
  if(ign.length&&!ps.includes('.')){E('The following paths are ignored by one of your .gitignore files:\n'+ign.join('\n')+'\nhint: Use -f if you really want to add them.\n');return 1}return 0}
 case'rm':{if(needWork())return 128;const cached=a.includes('--cached'),ps=a.filter(x=>x[0]!=='-');if(!ps.length){E('usage: git rm [<options>] [--] <file>...\n');return 129}
  for(const p of ps){const rp=relp(p);const keys=Object.keys(r.idx).filter(k=>k===rp||k.startsWith(rp+'/'));if(!keys.length){E(`fatal: pathspec '${p}' did not match any files\n`);return 128}
   if(keys.length>1&&!a.includes('-r')&&fs[sxNorm(cwd,p)]&&fs[sxNorm(cwd,p)].d){E(`fatal: not removing '${p}' recursively without -r\n`);return 128}
   keys.forEach(k=>{delete r.idx[k];if(!cached)gDel(G,k);O(`rm '${k}'\n`)})}return 0}
 case'mv':{if(needWork())return 128;const ps=a.filter(x=>x[0]!=='-');if(ps.length!==2){E('usage: git mv <source> <destination>\n');return 129}const s=relp(ps[0]),t=relp(ps[1]);if(r.idx[s]===undefined){E(`fatal: not under version control, source=${ps[0]}, destination=${ps[1]}\n`);return 128}
  const c=fs[G.root+'/'+s].c;gDel(G,s);gPut(G,t,c);r.idx[t]=r.idx[s];delete r.idx[s];return 0}
 case'commit':{if(needWork())return 128;let msgs=[],all=false,amend=false,empty=false;for(let i=0;i<a.length;i++){const x=a[i];if(x==='-m')msgs.push(a[++i]);else if(x.startsWith('-m')&&x.length>2&&x[1]==='m'&&x[2]!=='-')msgs.push(x.slice(2));else if(x==='-a'||x==='--all')all=true;else if(/^-[aqsv]*m[aqsv]*$/.test(x)&&x.length>2&&x.indexOf('m')===x.length-1||x==='-am'||x==='-ma'){if(x.includes('a'))all=true;msgs.push(a[++i])}else if(x==='--amend')amend=true;else if(x==='--allow-empty')empty=true;else if(x.startsWith('--message='))msgs.push(x.slice(10))}
  const id0=gIdent(G);if(!id0){E(gNoIdent(G)+'\n');return 128}
  if(r.reb&&Object.keys(r.conflicts).length||(r.merging&&Object.keys(r.conflicts).length)){E('error: Committing is not possible because you have unmerged files.\nhint: Fix them up in the work tree, and then use \'git add/rm <file>\'\nhint: as appropriate to mark resolution and make a commit.\nfatal: Exiting because of an unresolved conflict.\n');return 128}
  if(all){const W=gWork(d,G.root);Object.keys(r.idx).forEach(p=>{if(W[p]===undefined)delete r.idx[p];else r.idx[p]=W[p]})}
  const hid=gHead(r),H=gTreeOf(r,hid);const same=JSON.stringify(Object.keys(H).sort().map(k=>[k,H[k]]))===JSON.stringify(Object.keys(r.idx).sort().map(k=>[k,r.idx[k]]));
  if(same&&!r.merging&&!amend&&!empty&&!(r.reb&&r.reb.pick)){const t=gStatusText(G);O(t);return 1}
  let msg=msgs.filter(x=>x!=null).join('\n\n');
  if(r.reb&&r.reb.cur!==undefined&&r.reb.pick){const c=r.objs[r.reb.pick];if(!msg)msg=c.m;const nid=gNewCommit(G,msg,[r.reb.cur],r.idx,c.a);r.reb.cur=nid;r.det=nid;r.conflicts={};O(commitMade(nid,msg,false,H));r.reb.pick=null;return gRebaseGo(G)}
  if(r.merging&&r.merging.single){msg=msg||r.merging.msg;const nid=gNewCommit(G,msg,[hid],r.idx,r.merging.author||id0);advance(nid);const m=r.merging;r.merging=null;r.conflicts={};O(commitMade(nid,msg,false,H));return 0}
  if(!msg&&r.merging)msg=`Merge branch '${r.merging.name}'`;
  if(!msg&&!amend){E('Aborting commit due to empty commit message.\n');return 1}
  if(amend){const c=r.objs[hid];if(!c){E('fatal: You have nothing to amend.\n');return 128}const nid=gNewCommit(G,msg||c.m,c.p,r.idx,c.a);advance(nid);O(commitMade(nid,msg||c.m,false,gTreeOf(r,c.p[0])));return 0}
  const parents=hid?[hid]:[];if(r.merging)parents.push(r.merging.id);const nid=gNewCommit(G,msg,parents,r.idx,id0);advance(nid);r.merging=null;O(commitMade(nid,msg,!hid,H));return 0}
 case'log':{let one=false,graph=false,allr=false,n=Infinity,range=null,ps=[],stat=false,nm=false,fmt=null,au=null;
  for(let i=0;i<a.length;i++){const x=a[i];if(x==='--oneline')one=true;else if(x==='--graph')graph=true;else if(x==='--all')allr=true;else if(x==='--stat')stat=true;else if(x==='--name-only')nm=true;else if(x==='-n')n=+a[++i];else if(/^-\d+$/.test(x))n=+x.slice(1);else if(x.startsWith('--max-count='))n=+x.split('=')[1];else if(x.startsWith('--pretty=')||x.startsWith('--format=')){fmt=x.split('=')[1];if(fmt==='oneline')one=true}else if(x.startsWith('--author='))au=x.split('=')[1];else if(x==='--'){ps=a.slice(i+1);break}else if(x[0]!=='-')range=x}
  let starts=[],excl=[];if(range){if(range.includes('..')){const[x,y]=range.split('..');const ix=gRev(r,x||'HEAD'),iy=gRev(r,y||'HEAD');if(!ix||!iy){E(`fatal: ambiguous argument '${range}': unknown revision or path not in the working tree.\n`);return 128}excl=[ix];starts=[iy]}else{const i=gRev(r,range);if(!i){E(`fatal: ambiguous argument '${range}': unknown revision or path not in the working tree.\n`);return 128}starts=[i]}}
  else if(allr){starts=[...Object.values(r.refs),...Object.values(r.rrefs),...Object.values(r.tags).map(t=>t.id)];if(gHead(r))starts.push(gHead(r))}else{if(!gHead(r)){E(`fatal: your current branch '${r.head}' does not have any commits yet\n`);return 128}starts=[gHead(r)]}
  let ids=gLogIds(r,starts,excl);if(au)ids=ids.filter(i=>r.objs[i].a.includes(au));if(ps.length)ids=ids.filter(i=>{const c=r.objs[i],pt=gTreeOf(r,c.p[0]);return ps.some(q=>{const rq=relp(q);return c.tree[rq]!==pt[rq]})});ids=ids.slice(0,n);const deco=gDeco(r);
  ids.forEach((id,k)=>{const c=r.objs[id],dc=deco[id]?` (${deco[id].join(', ')})`:'';const pre=graph?'* ':'';
   if(one){O(pre+(fmt&&fmt!=='oneline'?fmt.replace('%h',gShort(id)).replace('%H',id).replace('%s',c.m.split('\n')[0]).replace('%an',c.a.replace(/ <.*/,'')):gShort(id)+dc+' '+c.m.split('\n')[0])+'\n');return}
   O(`${pre}commit ${id}${dc}\n`+(c.p.length>1?`Merge: ${c.p.map(gShort).join(' ')}\n`:'')+`Author: ${c.a}\nDate:   ${gDate(c.ts)}\n\n${c.m.split('\n').map(l=>'    '+l).join('\n')}\n`);
   if(stat||nm){const t=gDiffText(gTreeOf(r,c.p[0]),c.tree,null,nm,stat);if(t)O('\n'+t)}if(k<ids.length-1)O('\n')});return 0}
 case'show':{const id=gRev(r,a.find(x=>x[0]!=='-')||'HEAD');if(!id){E('fatal: ambiguous argument: unknown revision or path not in the working tree.\n');return 128}const c=r.objs[id],dc=gDeco(r)[id];
  O(`commit ${id}${dc?` (${dc.join(', ')})`:''}\n`+(c.p.length>1?`Merge: ${c.p.map(gShort).join(' ')}\n`:'')+`Author: ${c.a}\nDate:   ${gDate(c.ts)}\n\n${c.m.split('\n').map(l=>'    '+l).join('\n')}\n\n`+gDiffText(gTreeOf(r,c.p[0]),c.tree));return 0}
 case'diff':{if(needWork())return 128;const staged=a.includes('--staged')||a.includes('--cached'),stat=a.includes('--stat'),nm=a.includes('--name-only');let ps=[],revs=[];const di=a.indexOf('--');const pre=di>=0?a.slice(0,di):a;if(di>=0)ps=a.slice(di+1);pre.forEach(x=>{if(x[0]!=='-'){if(x.includes('..'))revs.push(...x.split('..'));else if(gRev(r,x))revs.push(x);else ps.push(x)}});
  ps=ps.map(p=>relp(p)).filter(x=>x!==null&&x!=='');let A,B;const H=gTreeOf(r,gHead(r));
  if(revs.length>=2){const i1=gRev(r,revs[0]),i2=gRev(r,revs[1]);if(!i1||!i2){E('fatal: bad revision\n');return 128}A=gTreeOf(r,i1);B=gTreeOf(r,i2)}
  else if(revs.length===1){const i1=gRev(r,revs[0]);A=gTreeOf(r,i1);B=staged?r.idx:gWork(d,G.root);if(!staged){const W=B,X={};Object.keys(W).forEach(p=>{if(A[p]!==undefined||r.idx[p]!==undefined)X[p]=W[p]});B=X}}
  else if(staged){A=H;B=r.idx}else{A=r.idx;const W=gWork(d,G.root),X={};Object.keys(W).forEach(p=>{if(r.idx[p]!==undefined)X[p]=W[p]});B=X}
  O(gDiffText(A,B,ps,nm,stat));return 0}
 case'branch':{const flags=a.filter(x=>x[0]==='-'),ps=a.filter(x=>x[0]!=='-');
  if(flags.some(f=>f==='-d'||f==='-D'||f==='--delete')){const force=flags.includes('-D');for(const b of ps){if(b===r.head&&!r.det){E(`error: Cannot delete branch '${b}' checked out at '${G.root}'\n`);return 1}if(r.refs[b]===undefined){E(`error: branch '${b}' not found.\n`);return 1}
    if(!force&&!gAnc(r,gHead(r)).has(r.refs[b])){E(`error: The branch '${b}' is not fully merged.\nIf you are sure you want to delete it, run 'git branch -D ${b}'.\n`);return 1}O(`Deleted branch ${b} (was ${gShort(r.refs[b])}).\n`);delete r.refs[b];delete r.up[b]}return 0}
  if(flags.some(f=>f==='-m'||f==='-M')){const [o,n]=ps.length===2?ps:[r.head,ps[0]];if(r.refs[o]===undefined&&!(o===r.head)){E(`error: refname refs/heads/${o} not found\n`);return 1}if(r.refs[n]!==undefined){E(`fatal: a branch named '${n}' already exists\n`);return 128}if(r.refs[o]!==undefined){r.refs[n]=r.refs[o];delete r.refs[o]}if(r.up[o]){r.up[n]=r.up[o];delete r.up[o]}if(r.head===o)r.head=n;return 0}
  const up=flags.find(f=>f==='-u'||f.startsWith('--set-upstream-to'));if(up){const u=up.includes('=')?up.split('=')[1]:ps[0];const b=up.includes('=')?(ps[0]||r.head):(ps[1]||r.head);if(r.rrefs[u]===undefined){E(`fatal: the requested upstream branch '${u}' does not exist\n`);return 128}r.up[b]=u;O(`branch '${b}' set up to track '${u}'.\n`);return 0}
  if(ps.length){const b=ps[0];if(r.refs[b]!==undefined){E(`fatal: a branch named '${b}' already exists\n`);return 128}const st=ps[1]?gRev(r,ps[1]):gHead(r);if(!st){E(`fatal: not a valid object name: '${ps[1]||'HEAD'}'\n`);return 128}r.refs[b]=st;return 0}
  const lines=[];const vv=flags.includes('-vv')||flags.includes('-v');const rem=flags.includes('-a')||flags.includes('-r')||flags.includes('--all');
  if(!flags.includes('-r')){if(r.det)lines.push(`* (HEAD detached at ${gShort(r.det)})`);Object.keys(r.refs).sort().forEach(b=>{let s=(b===r.head&&!r.det?'* ':'  ')+b;if(vv){const c=r.objs[r.refs[b]];s+=` ${gShort(r.refs[b])}${r.up[b]?` [${r.up[b]}]`:''} ${c?c.m.split('\n')[0]:''}`}lines.push(s)})}
  if(rem)Object.keys(r.rrefs).sort().forEach(b=>lines.push('  remotes/'+b));O(lines.join('\n')+(lines.length?'\n':''));return 0}
 case'checkout':case'switch':{if(needWork())return 128;let create=null,start=null,ps=[],dd=a.indexOf('--');
  const pre=dd>=0?a.slice(0,dd):a;if(dd>=0)ps=a.slice(dd+1);for(let i=0;i<pre.length;i++){const x=pre[i];if(x==='-b'||x==='-c'||x==='-B'||x==='--create'){create=pre[++i]}else if(x[0]!=='-'){if(start===null)start=x;else ps.push(x)}}
  if(cmd==='checkout'&&dd<0&&!create&&start&&!r.refs[start]&&!r.rrefs['origin/'+start]&&!gRev(r,start)){ps=[start,...ps];start=null}
  if(ps.length&&cmd==='checkout'){const src=start&&gRev(r,start)&&dd>=0?gTreeOf(r,gRev(r,start)):r.idx;const exs=ps;for(const p of exs){const rp=relp(p);const keys=p==='.'?Object.keys(src):Object.keys(src).filter(k=>k===rp||k.startsWith(rp+'/'));if(!keys.length){E(`error: pathspec '${p}' did not match any file(s) known to git\n`);return 1}keys.forEach(k=>{gPut(G,k,src[k]);if(src===r.idx){}else r.idx[k]=src[k]})}return 0}
  let target=null,bname=null,newb=false;
  if(create){bname=create;if(r.refs[bname]!==undefined&&!a.includes('-B')){E(`fatal: a branch named '${bname}' already exists\n`);return 128}target=start?gRev(r,start):gHead(r);if(!target&&gHead(r)){E(`fatal: invalid reference: ${start}\n`);return 128}newb=true}
  else if(start){if(r.refs[start]!==undefined){bname=start;target=r.refs[start]}else if(r.rrefs['origin/'+start]!==undefined){bname=start;target=r.rrefs['origin/'+start];newb=true;r.up[start]='origin/'+start}else{target=gRev(r,start);if(!target){E(cmd==='switch'?`fatal: invalid reference: ${start}\n`:`error: pathspec '${start}' did not match any file(s) known to git\n`);return 1}}}
  else{E('fatal: missing branch or commit argument\n');return 128}
  if(bname&&!newb&&bname===r.head&&!r.det){O(`Already on '${bname}'\n`);return 0}
  if(target){const H=gTreeOf(r,gHead(r)),N=gTreeOf(r,target);const ch=[...new Set([...Object.keys(H),...Object.keys(N)])].filter(p=>H[p]!==N[p]);const dirty=gDirty(G,ch);if(dirty.length){O('');E(dirtyMsg(dirty,'checkout'));return 1}gSetState(G,Object.fromEntries(ch.filter(p=>N[p]!==undefined).map(p=>[p,N[p]])),Object.fromEntries(ch.filter(p=>H[p]!==undefined).map(p=>[p,H[p]])))}
  if(newb||(create&&bname))r.refs[bname]=target;
  if(bname){r.head=bname;r.det=null;O(newb&&create?`Switched to a new branch '${bname}'\n`:`Switched to branch '${bname}'\n`+gTrack(G))}else{r.det=target;O(`Note: switching to '${start}'.\n\nYou are in 'detached HEAD' state. You can look around, make experimental\nchanges and commit them, and you can discard any commits you make in this\nstate without impacting any branches by switching back to a branch.\n\nHEAD is now at ${gShort(target)} ${r.objs[target].m.split('\n')[0]}\n`)}return 0}
 case'restore':{if(needWork())return 128;const staged=a.includes('--staged')||a.includes('-S'),wt=a.includes('--worktree')||a.includes('-W')||!staged;let srcId=null;const ps=[];a.forEach(x=>{if(x.startsWith('--source='))srcId=gRev(r,x.slice(9));else if(x[0]!=='-')ps.push(x)});if(!ps.length){E('fatal: you must specify path(s) to restore\n');return 128}
  const H=srcId?gTreeOf(r,srcId):gTreeOf(r,gHead(r));for(const p of ps){const rp=p==='.'?'':relp(p);const keys=[...new Set([...Object.keys(r.idx),...Object.keys(H),...Object.keys(gWork(d,G.root))])].filter(k=>rp===''||k===rp||k.startsWith(rp+'/'));
   if(!keys.length){E(`error: pathspec '${p}' did not match any file(s) known to git\n`);return 1}
   keys.forEach(k=>{if(staged){if(H[k]===undefined)delete r.idx[k];else r.idx[k]=H[k]}if(wt){const src=staged?r.idx:(srcId?H:r.idx);if(src[k]===undefined)gDel(G,k);else gPut(G,k,src[k])}})}return 0}
 case'reset':{if(needWork())return 128;let mode='mixed',rev=null,ps=[];a.forEach(x=>{if(x==='--soft')mode='soft';else if(x==='--hard')mode='hard';else if(x==='--mixed')mode='mixed';else if(x[0]!=='-'){if(rev===null&&gRev(r,x))rev=x;else ps.push(x)}});
  const hid=gHead(r);if(ps.length){const H=gTreeOf(r,rev?gRev(r,rev):hid);ps.forEach(p=>{const rp=relp(p);Object.keys({...r.idx,...H}).filter(k=>k===rp||k.startsWith(rp+'/')).forEach(k=>{if(H[k]===undefined)delete r.idx[k];else r.idx[k]=H[k]})});return 0}
  const tid=rev?gRev(r,rev):hid;if(!tid){E(`fatal: ambiguous argument '${rev}': unknown revision or path not in the working tree.\n`);return 128}
  const oldW=gWork(d,G.root);if(mode!=='soft'){const N=gTreeOf(r,tid);if(mode==='hard'){const old={...r.idx,...gTreeOf(r,hid)};gSetState(G,N,old)}else{r.idx={...N}}}
  advance(tid);r.merging=null;r.conflicts={};if(mode==='hard')O(`HEAD is now at ${gShort(tid)} ${r.objs[tid].m.split('\n')[0]}\n`);else if(mode==='mixed'){const st=gStatus(G);if(st.unstaged.length){O('Unstaged changes after reset:\n'+st.unstaged.map(([p,k])=>(k==='deleted'?'D':'M')+'\t'+p).join('\n')+'\n')}}return 0}
 case'merge':{if(needWork())return 128;if(a.includes('--abort')){if(!r.merging){E('fatal: There is no merge to abort (MERGE_HEAD missing).\n');return 128}const H=gTreeOf(r,gHead(r));gSetState(G,H,{...r.idx,...gWork(d,G.root)});r.merging=null;r.conflicts={};return 0}
  const noff=a.includes('--no-ff'),ffonly=a.includes('--ff-only'),mi=a.indexOf('-m');const msgArg=mi>=0?a[mi+1]:null;const nm=a.filter((x,i)=>x[0]!=='-'&&!(mi>=0&&i===mi+1))[0];if(!nm){E('fatal: No remote for the current branch.\n');return 128}
  const tid=gRev(r,nm);if(!tid){E(`merge: ${nm} - not something we can merge\n`);return 1}const hid=gHead(r);
  if(r.merging){E('fatal: You have not concluded your merge (MERGE_HEAD exists).\nPlease, commit your changes before you merge.\n');return 128}
  if(!hid){gSetState(G,gTreeOf(r,tid),{});advance(tid);return 0}
  if(gAnc(r,hid).has(tid)){O('Already up to date.\n');return 0}
  const H=gTreeOf(r,hid),T=gTreeOf(r,tid);
  if(gAnc(r,tid).has(hid)&&!noff){const ch=[...new Set([...Object.keys(H),...Object.keys(T)])].filter(p=>H[p]!==T[p]);const dirty=gDirty(G,ch);if(dirty.length){E(dirtyMsg(dirty,'merge'));return 1}
   O(`Updating ${gShort(hid)}..${gShort(tid)}\nFast-forward\n`+gStat(H,T));gSetDiff(G,T,H);advance(tid);return 0}
  if(ffonly){E('fatal: Not possible to fast-forward, aborting.\n');return 128}
  const id0=gIdent(G);if(!id0){E(gNoIdent(G)+'\n');return 128}
  const base=gBase(r,hid,tid),B=gTreeOf(r,base);const M=gMergeTrees(B,H,T,'HEAD',nm);const ch=[...new Set([...Object.keys(H),...Object.keys(M.res)])].filter(p=>H[p]!==M.res[p]);const dirty=gDirty(G,ch);if(dirty.length){E(dirtyMsg(dirty,'merge'));return 1}
  const msgs=[];Object.keys(M.res).forEach(p=>{if(H[p]!==undefined&&H[p]!==M.res[p]&&T[p]!==undefined&&B[p]!==T[p])msgs.push('Auto-merging '+p)});
  gApplyMerge(G,M,H,msgs);if(M.conf.length){O(msgs.filter(x=>!/^Auto/.test(x)||true).join('\n')+'\nAutomatic merge failed; fix conflicts and then commit the result.\n');r.merging={id:tid,name:nm};return 1}
  const msg=msgArg||`Merge branch '${nm}'`;const nid=gNewCommit(G,msg,[hid,tid],r.idx,id0);advance(nid);O(`Merge made by the 'ort' strategy.\n`+gStat(H,r.idx));return 0}
 case'tag':{const ps=a.filter(x=>x[0]!=='-'),fl=a.filter(x=>x[0]==='-');if(fl.includes('-d')){ps.forEach(t=>{if(!r.tags[t])E(`error: tag '${t}' not found.\n`);else{O(`Deleted tag '${t}' (was ${gShort(r.tags[t].id)})\n`);delete r.tags[t]}});return 0}
  if(!ps.length){O(Object.keys(r.tags).sort().join('\n')+(Object.keys(r.tags).length?'\n':''));return 0}let m=null;const mi=a.indexOf('-m');if(mi>=0){m=a[mi+1];ps.splice(ps.indexOf(m),1)}
  if(r.tags[ps[0]]){E(`fatal: tag '${ps[0]}' already exists\n`);return 128}const id=ps[1]?gRev(r,ps[1]):gHead(r);if(!id){E('fatal: Failed to resolve HEAD as a valid ref.\n');return 128}r.tags[ps[0]]={id,m};return 0}
 case'stash':{if(needWork())return 128;const sub=a[0]&&a[0][0]!=='-'?a[0]:'push';
  if(sub==='push'||sub==='save'){const H=gTreeOf(r,gHead(r)),W=gWork(d,G.root),snap={};Object.keys(r.idx).forEach(p=>{if(W[p]!==undefined&&W[p]!==H[p])snap[p]=W[p];else if(W[p]===undefined&&H[p]!==undefined)snap[p]=null});const stg=JSON.stringify(r.idx)!==JSON.stringify(H);
   if(!Object.keys(snap).length&&!stg){O('No local changes to save\n');return 0}const mi=a.indexOf('-m');const m=mi>=0?a[mi+1]:null;Object.keys(r.idx).forEach(p=>{if(snap[p]===undefined&&r.idx[p]!==H[p])snap[p]=r.idx[p]});
   r.stash.unshift({snap,m,base:gHead(r),br:r.head});gSetState(G,H,{...r.idx,...W});const hc=r.objs[gHead(r)];O(`Saved working directory and index state ${m?'On '+r.head+': '+m:'WIP on '+r.head+': '+gShort(gHead(r))+' '+hc.m.split('\n')[0]}\n`);return 0}
  if(sub==='list'){r.stash.forEach((s,i)=>O(`stash@{${i}}: ${s.m?'On '+s.br+': '+s.m:'WIP on '+s.br+': '+gShort(s.base)+' '+(r.objs[s.base]?r.objs[s.base].m.split('\n')[0]:'')}\n`));return 0}
  if(sub==='clear'){r.stash=[];return 0}if(sub==='drop'){r.stash.shift();return 0}
  if(sub==='pop'||sub==='apply'){const s=r.stash[0];if(!s){E('No stash entries found.\n');return 1}const dirty=gDirty(G,Object.keys(s.snap));if(dirty.length){E(dirtyMsg(dirty,'merge'));return 1}Object.keys(s.snap).forEach(p=>{if(s.snap[p]===null)gDel(G,p);else gPut(G,p,s.snap[p])});if(sub==='pop')r.stash.shift();O(gStatusText(G));return 0}
  E(`error: unknown subcommand: ${sub}\n`);return 129}
 case'remote':{const sub=a[0];if(!sub||sub==='-v'){Object.keys(r.remotes).forEach(n=>{if(sub==='-v')O(`${n}\t${r.remotes[n].url} (fetch)\n${n}\t${r.remotes[n].url} (push)\n`);else O(n+'\n')});return 0}
  if(sub==='add'){if(r.remotes[a[1]]){E(`error: remote ${a[1]} already exists.\n`);return 3}r.remotes[a[1]]={url:a[2]};return 0}
  if(sub==='remove'||sub==='rm'){if(!r.remotes[a[1]]){E(`error: No such remote: '${a[1]}'\n`);return 2}delete r.remotes[a[1]];Object.keys(r.rrefs).forEach(k=>{if(k.startsWith(a[1]+'/'))delete r.rrefs[k]});return 0}
  if(sub==='set-url'){if(!r.remotes[a[1]]){E(`error: No such remote '${a[1]}'\n`);return 2}r.remotes[a[1]].url=a[2];return 0}
  if(sub==='rename'){r.remotes[a[2]]=r.remotes[a[1]];delete r.remotes[a[1]];return 0}
  if(sub==='show'){const rm=r.remotes[a[1]||'origin'];if(!rm){E(`fatal: '${a[1]}' does not appear to be a git repository\n`);return 128}O(`* remote ${a[1]||'origin'}\n  Fetch URL: ${rm.url}\n  Push  URL: ${rm.url}\n`);return 0}
  E(`error: Unknown subcommand: ${sub}\n`);return 129}
 case'fetch':case'pull':case'push':return gitNet(G,cmd,a);
 case'clean':{if(needWork())return 128;const f=a.includes('-f')||a.includes('--force'),dr=a.includes('-n')||a.includes('--dry-run');if(!f&&!dr){E('fatal: clean.requireForce defaults to true and neither -i, -n, nor -f given; refusing to clean\n');return 128}
  const st=gStatus(G);st.untracked.forEach(p=>{const isd=p.endsWith('/');if(isd&&!a.some(x=>/^-\w*d/.test(x)))return;if(dr)O(`Would remove ${p}\n`);else{if(isd)Object.keys(fs).filter(k=>k.startsWith(G.root+'/'+p)).forEach(k=>delete fs[k]);else gDel(G,p);O(`Removing ${p}\n`)}});return 0}
 case'cherry-pick':case'revert':{if(needWork())return 128;if(a.includes('--abort')){const H=gTreeOf(r,gHead(r));gSetState(G,H,{...r.idx,...gWork(d,G.root)});r.merging=null;r.conflicts={};return 0}
  const id=gRev(r,a.find(x=>x[0]!=='-'));if(!id){E(`fatal: bad revision '${a.find(x=>x[0]!=='-')}'\n`);return 128}const id0=gIdent(G);if(!id0){E(gNoIdent(G)+'\n');return 128}const c=r.objs[id],hid=gHead(r),H=gTreeOf(r,hid);
  const dirty=gDirty(G,Object.keys(H));if(dirty.length&&false){return 1}
  const rev=cmd==='revert',B=rev?c.tree:gTreeOf(r,c.p[0]),T=rev?gTreeOf(r,c.p[0]):c.tree;const M=gMergeTrees(B,H,T,'HEAD',(rev?'parent of ':'')+gShort(id));const msgs=[];gApplyMerge(G,M,H,msgs);
  const msg=rev?`Revert "${c.m.split('\n')[0]}"\n\nThis reverts commit ${id}.`:c.m;
  if(M.conf.length){O(msgs.join('\n')+`\nerror: could not ${rev?'revert':'apply'} ${gShort(id)}... ${c.m.split('\n')[0]}\nhint: After resolving the conflicts, mark them with "git add <file>" and run "git commit".\n`);r.merging={single:true,msg,author:rev?id0:c.a,id,name:gShort(id)};return 1}
  const nid=gNewCommit(G,msg,[hid],r.idx,rev?id0:c.a);advance(nid);O(commitMade(nid,msg,false,H));return 0}
 case'rebase':{if(needWork())return 128;if(a.includes('--abort')){if(!r.reb){E('fatal: No rebase in progress?\n');return 128}const rb=r.reb;r.det=null;r.refs[rb.branch]=rb.orig;r.head=rb.branch;gSetState(G,gTreeOf(r,rb.orig),{...r.idx,...gWork(d,G.root)});r.reb=null;r.conflicts={};return 0}
  if(a.includes('--continue')){if(!r.reb){E('fatal: No rebase in progress?\n');return 128}if(Object.keys(r.conflicts).length){E('error: Committing is not possible because you have unmerged files.\n');return 128}
   if(r.reb.pick){const c=r.objs[r.reb.pick];const nid=gNewCommit(G,c.m,[r.reb.cur],r.idx,c.a);r.reb.cur=nid;r.det=nid;r.reb.pick=null}return gRebaseGo(G)}
  const up=gRev(r,a.find(x=>x[0]!=='-'));if(!up){E(`fatal: invalid upstream '${a.find(x=>x[0]!=='-')||''}'\n`);return 128}return gRebaseStart(G,up)}
 default:E(`git: '${cmd}' is not a git command. See 'git --help'.\n`);return 1}}
function gRebaseStart(G,up){const r=G.r,hid=gHead(r),O=G.io.out,E=G.io.err;if(r.det){E('fatal: cannot rebase: you are not on a branch\n');return 128}if(!gIdent(G)){E(gNoIdent(G)+'\n');return 128}
 if(gAnc(r,up).has(hid)&&hid!==up){const H=gTreeOf(r,hid);gSetDiff(G,gTreeOf(r,up),H);r.refs[r.head]=up;O(`Successfully rebased and updated refs/heads/${r.head}.\n`);return 0}
 if(gAnc(r,hid).has(up)){O(`Current branch ${r.head} is up to date.\n`);return 0}
 const upA=gAnc(r,up),todo=[];let x=hid;while(x&&!upA.has(x)){todo.unshift(x);x=r.objs[x].p[0]}
 const dirty=gDirty(G,Object.keys(gTreeOf(r,hid)));if(dirty.length){E('error: cannot rebase: You have unstaged changes.\nerror: Please commit or stash them.\n');return 1}
 r.reb={branch:r.head,orig:hid,onto:up,todo,cur:up,pick:null};r.det=up;return gRebaseGo(G)}
function gRebaseGo(G){const r=G.r,rb=r.reb,O=G.io.out;
 while(rb.todo.length){const id=rb.todo.shift(),c=r.objs[id];const cur=gTreeOf(r,rb.cur),B=gTreeOf(r,c.p[0]),M=gMergeTrees(B,cur,c.tree,'HEAD',gShort(id)+' ('+c.m.split('\n')[0]+')');
  if(M.conf.length){const msgs=[];gSetState(G,cur,{...r.idx});gApplyMerge(G,M,cur,msgs);rb.pick=id;O(msgs.join('\n')+`\nerror: could not apply ${gShort(id)}... ${c.m.split('\n')[0]}\nhint: Resolve all conflicts manually, mark them as resolved with\nhint: "git add/rm <conflicted_files>", then run "git rebase --continue".\nhint: To abort and get back to the state before "git rebase", run "git rebase --abort".\n`);return 1}
  const nid=gNewCommit(G,c.m,[rb.cur],M.res,c.a);rb.cur=nid;r.det=nid}
 gSetState(G,gTreeOf(r,rb.cur),{...r.idx,...gWork(G.d,G.root)});r.refs[rb.branch]=rb.cur;r.head=rb.branch;r.det=null;r.reb=null;r.conflicts={};O(`Successfully rebased and updated refs/heads/${r.head}.\n`);return 0}
function gitNet(G,cmd,a){const r=G.r,O=G.io.out,E=G.io.err;if(r.bare&&cmd==='pull'){E('fatal: this operation must be run in a work tree\n');return 128}
 let rn=null,br=null,setup=false,force=false,del=false,rebase=false,tags=false;const ps=[];a.forEach(x=>{if(x==='-u'||x==='--set-upstream')setup=true;else if(x==='-f'||x==='--force'||x==='--force-with-lease')force=true;else if(x==='--delete'||x==='-d')del=true;else if(x==='--rebase'||x==='-r')rebase=true;else if(x==='--tags')tags=true;else if(x[0]!=='-')ps.push(x)});
 rn=ps[0]||(r.up[r.head]?r.up[r.head].split('/')[0]:'origin');br=ps[1];
 if(cmd==='pull'&&!ps.length&&!r.up[r.head]&&r.remotes.origin===undefined){E('fatal: No remote repository specified.  Please, specify either a URL or a\nremote name from which new revisions should be fetched.\n');return 1}
 const rm=r.remotes[rn];if(!rm){E(`fatal: '${rn}' does not appear to be a git repository\nfatal: Could not read from remote repository.\n\nPlease make sure you have the correct access rights\nand the repository exists.\n`);return 128}
 const R=gRemote(G,rm.url);if(R.err){E(R.err+'\n');return 128}const rr=R.r;
 const doFetch=()=>{const n=gCopyObjs(rr,r);let s='';const lines=[];Object.keys(rr.refs).forEach(b=>{const key=rn+'/'+b,old=r.rrefs[key];if(old===rr.refs[b])return;r.rrefs[key]=rr.refs[b];lines.push(old===undefined?` * [new branch]      ${b.padEnd(10)} -> ${key}`:`   ${gShort(old)}..${gShort(rr.refs[b])}  ${b.padEnd(10)} -> ${key}`)});
  Object.keys(r.rrefs).forEach(k=>{if(k.startsWith(rn+'/')&&rr.refs[k.slice(rn.length+1)]===undefined){delete r.rrefs[k]}});Object.keys(rr.tags).forEach(t=>{if(!r.tags[t]){r.tags[t]=rr.tags[t];lines.push(` * [new tag]         ${t} -> ${t}`)}});
  if(lines.length)O(`remote: Enumerating objects: ${n+2}, done.\nFrom ${rm.url}\n`+lines.join('\n')+'\n');return n};
 if(cmd==='fetch'){doFetch();return 0}
 if(cmd==='pull'){doFetch();let up=br?rn+'/'+br:r.up[r.head];if(!up){E(`There is no tracking information for the current branch.\nPlease specify which branch you want to merge with.\nSee git-pull(1) for details.\n\n    git pull <remote> <branch>\n\nIf you wish to set tracking information for this branch you can do so with:\n\n    git branch --set-upstream-to=${rn}/<branch> ${r.head}\n`);return 1}
  if(r.rrefs[up]===undefined){E(`fatal: couldn't find remote ref ${br||r.head}\n`);return 128}
  const mi={out:G.io.out,err:G.io.err};if(!gHead(r)){gSetState(G,gTreeOf(r,r.rrefs[up]),{});r.refs[r.head]=r.rrefs[up];r.up[r.head]=up;O(`Branch '${r.head}' set up to track remote branch.\n`);return 0}
  if(rebase)return gRebaseStart(G,r.rrefs[up]);return gitRun(G.d,G.cwd,['merge',up],mi)}
 // push
 let bname=br||r.head;const refspec=br&&br.includes(':')?br.split(':'):null;if(refspec){bname=refspec[1];}
 if(!ps.length&&!r.up[r.head]&&!tags){E(`fatal: The current branch ${r.head} has no upstream branch.\nTo push the current branch and set the remote as upstream, use\n\n    git push --set-upstream ${rn} ${r.head}\n\nTo have this happen automatically for branches without a tracking\nupstream, see 'push.autoSetupRemote' in 'git help config'.\n`);return 128}
 if(!ps.length&&r.up[r.head])bname=r.up[r.head].slice(rn.length+1);
 if(del||(refspec&&!refspec[0])){const b=refspec?refspec[1]:ps[1];if(rr.refs[b]===undefined){E(`error: unable to delete '${b}': remote ref does not exist\nerror: failed to push some refs to '${rm.url}'\n`);return 1}delete rr.refs[b];delete r.rrefs[rn+'/'+b];O(`To ${rm.url}\n - [deleted]         ${b}\n`);return 0}
 if(tags){let n=0;Object.keys(r.tags).forEach(t=>{if(!rr.tags[t]){rr.tags[t]=r.tags[t];n++;O(`To ${rm.url}\n * [new tag]         ${t} -> ${t}\n`)}});gCopyObjs(r,rr);if(!n)O('Everything up-to-date\n');return 0}
 const local=refspec?refspec[0]:(br&&!br.includes(':')?br:r.head);const lid=gRev(r,local);if(!lid){E(`error: src refspec ${local} does not match any\nerror: failed to push some refs to '${rm.url}'\n`);return 1}
 const rid=rr.refs[bname];
 if(rid===lid){O('Everything up-to-date\n');if(setup){r.up[r.head]=rn+'/'+bname;O(`branch '${r.head}' set up to track '${rn}/${bname}'.\n`)}return 0}
 if(rr.prot&&rr.prot.includes(bname)){E(`remote: error: GH006: Protected branch update failed for refs/heads/${bname}.\nTo ${rm.url}\n ! [remote rejected] ${local} -> ${bname} (protected branch hook declined)\nerror: failed to push some refs to '${rm.url}'\n`);return 1}
 if(rid&&!gAnc(r,lid).has(rid)&&!force){const known=r.objs[rid];E(`To ${rm.url}\n ! [rejected]        ${local} -> ${bname} (${known?'non-fast-forward':'fetch first'})\nerror: failed to push some refs to '${rm.url}'\nhint: Updates were rejected because ${known?'the tip of your current branch is behind':'the remote contains work that you do not'}\nhint: ${known?'its remote counterpart. If you want to integrate the remote changes,':'have locally. This is usually caused by another repository pushing to'}\nhint: ${known?"use 'git pull' before pushing again.":'the same ref. If you want to integrate the remote changes, use'}\n${known?'':"hint: 'git pull' before pushing again.\n"}hint: See the 'Note about fast-forwards' in 'git push --help' for details.\n`);return 1}
 const n=gCopyObjs(r,rr);rr.refs[bname]=lid;if(!rr.head||rr.refs[rr.head]===undefined)rr.head=bname;r.rrefs[rn+'/'+bname]=lid;if(setup||r.up[r.head]===undefined&&false)r.up[r.head]=rn+'/'+bname;
 O(`Enumerating objects: ${n+2}, done.\nCounting objects: 100% (${n+2}/${n+2}), done.\nWriting objects: 100% (${n+2}/${n+2}), ${200+n*90} bytes | ${200+n*90}.00 KiB/s, done.\nTotal ${n+2} (delta 0), reused 0 (delta 0)\nTo ${rm.url}\n ${rid===undefined?'* [new branch]     ':(force&&!gAnc(r,lid).has(rid)?'+ ':'  ')+gShort(rid)+'..'+gShort(lid)} ${local} -> ${bname}\n`.replace('       ','  '));
 if(setup)O(`branch '${r.head}' set up to track '${rn}/${bname}'.\n`);return 0}
// ---- Git-сервер как устройство ----
Object.assign(IC,{git:`<rect class="ib" x="6" y="8" width="36" height="32" rx="3"/><circle class="ig" cx="16" cy="32" r="3"/><circle class="ig" cx="16" cy="16" r="3"/><circle class="ig" cx="32" cy="22" r="3"/><path class="ia" d="M16 19v10M16 29c0-6 16-2 16-4"/>`});
Object.assign(CAT,{git:{l:'Git-сервер (репозитории)',p:'Git',i:'',t:'pc',n:1}});
NOTE.git='Git-сервер хранит «удалённые» репозитории (как GitHub/GitLab/Gitea на вашем сервере). Доступ по SSH (TCP/22), HTTP (80) и git:// (9418). Создать репозиторий: repo create team/project; защитить ветку: repo protect team/project main. Клиенты: git clone ssh://git@<ip>/team/project.git. Если ACL или маршрут режут порт 22 — push/pull/clone не работают, как и в реальной сети.';
Object.assign(WATT,{git:300});
const _ad23=addDev;addDev=function(k,x,y,n){if(k==='git'){const d=_ad23('srv',x,y,n||'Git'+((S.n.git=(S.n.git||0)+1)));d.ico='git';d.role='git';d.svc=(d.svc||[]).concat([{p:'tcp',n:22},{p:'tcp',n:80},{p:'tcp',n:443},{p:'tcp',n:9418}]);d.gdb={};ch();return d}return _ad23(k,x,y,n)};
$('#ad').insertAdjacentHTML('beforeend',`<option value="git">${CAT.git.l}</option>`);
$('#adp').innerHTML=(()=>{let h='';for(const k in CAT){const c=CAT[k];if(c.g)h+=`<h5>${c.g}</h5>`;h+=`<button type="button" data-k="${k}">${icoSvg(k,30)}<span>${c.l}</span></button>`}return h})();
function repoCmd(d,a){const o=[];const so=s=>o.push(s);d.gdb=d.gdb||{};const fs=sxFs(d);const key=n=>{n=String(n||'').replace(/^\/+/,'');if(!n.endsWith('.git'))n+='.git';return'/srv/git/'+n};
 const sub=(a[0]||'').toLowerCase();
 if(sub==='create'||sub==='new'){if(!a[1])return'Использование: repo create <группа/проект>';const k=key(a[1]);if(d.gdb[k])return'Репозиторий уже существует: '+k;sxMk(fs,k,true);d.gdb[k]=gNewRepo(true,'main');ch();return`Создан пустой репозиторий ${a[1]}. Адрес для клиентов: ssh://git@${srcIp(d)||'<ip>'}/${String(a[1]).replace(/\.git$/,'')}.git`}
 if(sub==='list'||!sub){const k=Object.keys(d.gdb).filter(x=>d.gdb[x].bare);return k.length?k.map(x=>{const r=d.gdb[x];return`${x.replace('/srv/git/','')}  веток: ${Object.keys(r.refs).length}  коммитов: ${Object.keys(r.objs).length}${r.prot.length?'  защищены: '+r.prot.join(','):''}`}).join('\n'):'Репозиториев нет. repo create <группа/проект>'}
 if(sub==='protect'||sub==='unprotect'){const k=key(a[1]),r=d.gdb[k];if(!r)return'Нет такого репозитория';const b=a[2]||'main';r.prot=r.prot.filter(x=>x!==b);if(sub==='protect')r.prot.push(b);ch();return sub==='protect'?`Ветка ${b} защищена: push в неё отклоняется`:`Защита ветки ${b} снята`}
 if(sub==='delete'||sub==='rm'){const k=key(a[1]);if(!d.gdb[k])return'Нет такого репозитория';delete d.gdb[k];sxRm(fs,k,true);ch();return'Репозиторий удалён'}
 if(sub==='show'){const r=d.gdb[key(a[1])];if(!r)return'Нет такого репозитория';return Object.keys(r.refs).map(b=>`${b} ${gShort(r.refs[b])} ${r.objs[r.refs[b]]?r.objs[r.refs[b]].m.split('\n')[0]:''}`).join('\n')||'пусто'}
 return'Использование: repo create|list|protect|unprotect|show|delete <группа/проект> [ветка]'}
