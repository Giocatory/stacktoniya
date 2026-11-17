// ===== m_ansible: учебная модель Ansible (ansible, ansible-playbook, inventory, YAML-плейбуки) =====
const ANS=(()=>{
// ---------- YAML (подмножество) ----------
function ysc(s){s=s.trim();if(s===''||s==='~'||s==='null')return null;if(/^(true|yes|on)$/i.test(s))return true;if(/^(false|no|off)$/i.test(s))return false;if(/^-?\d+$/.test(s))return parseInt(s,10);if(/^-?\d*\.\d+$/.test(s))return parseFloat(s);
 if(s[0]==='"'&&s[s.length-1]==='"'&&s.length>1)return s.slice(1,-1).replace(/\\n/g,'\n').replace(/\\t/g,'\t').replace(/\\"/g,'"').replace(/\\\\/g,'\\');if(s[0]==="'"&&s[s.length-1]==="'"&&s.length>1)return s.slice(1,-1).replace(/''/g,"'");
 if(s[0]==='['&&s[s.length-1]===']')return splitTop(s.slice(1,-1)).filter(x=>x.trim()!=='').map(ysc);
 if(s[0]==='{'&&s[s.length-1]==='}'&&!/^\{\{/.test(s)){const o={};splitTop(s.slice(1,-1)).filter(x=>x.trim()).forEach(p=>{const m=p.match(/^\s*([^:]+?)\s*:\s*(.*)$/);if(m)o[ysc(m[1])]=ysc(m[2])});return o}
 return s}
function splitTop(s){const r=[];let d=0,q=null,cur='';for(const c of s){if(q){cur+=c;if(c===q)q=null;continue}if(c==='"'||c==="'"){q=c;cur+=c;continue}if('[{'.includes(c))d++;if(']}'.includes(c))d--;if(c===','&&d===0){r.push(cur);cur=''}else cur+=c}r.push(cur);return r}
function stripC(l){let q=null;for(let i=0;i<l.length;i++){const c=l[i];if(q){if(c===q)q=null}else if(c==='"'||c==="'")q=c;else if(c==='#'&&(i===0||/\s/.test(l[i-1])))return l.slice(0,i)}return l}
function yaml(text){const raw=text.replace(/\r/g,'').split('\n');const L=[];raw.forEach((l,n)=>{if(/^\s*\t/.test(l)&&l.trim())throw new Error(`строка ${n+1}: табуляция в отступе — в YAML используйте пробелы`);const t=stripC(l).replace(/\s+$/,'');if(!t.trim()||/^---\s*$/.test(t)||/^\.\.\.\s*$/.test(t))return;L.push({ind:t.match(/^ */)[0].length,s:t.trim(),n:n+1,raw:l})});
 let i=0;const KEY=/^("[^"]*"|'[^']*'|[^\s:'"\[\]{}-][^:]*?|-[^\s:][^:]*?):(?:\s+(.*)|)$/;
 function node(ind){if(i>=L.length)return null;const l=L[i];if(l.s==='-'||l.s.startsWith('- '))return list(l.ind);return map(l.ind)}
 function block(ind,fold){const out=[];let bi=null;while(i<L.length&&L[i].ind>ind){if(bi===null)bi=L[i].ind;out.push(' '.repeat(Math.max(0,L[i].ind-bi))+L[i].s);i++}return fold?out.join(' ')+'\n':out.join('\n')+'\n'}
 function list(ind){const a=[];while(i<L.length&&L[i].ind===ind&&(L[i].s==='-'||L[i].s.startsWith('- '))){const l=L[i];const rest=l.s==='-'?'':l.s.slice(2).trim();if(rest===''){i++;a.push(i<L.length&&L[i].ind>ind?node(L[i].ind):null)}else if(KEY.test(rest)&&!/^["'\[{]/.test(rest)||/^["'][^"']*["']\s*:\s/.test(rest)){const off=l.s.length-rest.length;L[i]={ind:ind+off,s:rest,n:l.n};a.push(map(ind+off))}else{i++;a.push(ysc(rest))}}return a}
 function map(ind){const o={};while(i<L.length&&L[i].ind===ind&&!(L[i].s==='-'||L[i].s.startsWith('- '))){const l=L[i];const m=KEY.exec(l.s);if(!m)throw new Error(`строка ${l.n}: не удалось разобрать «${l.s}» (ожидалось «ключ: значение»)`);let k=ysc(m[1]);k=String(k);let v=m[2];i++;
   if(v===undefined||v===''){if(i<L.length&&(L[i].ind>ind||(L[i].ind===ind&&(L[i].s==='-'||L[i].s.startsWith('- ')))))o[k]=node(L[i].ind);else o[k]=null}
   else if(/^[|>][+-]?$/.test(v))o[k]=block(ind,v[0]==='>');else o[k]=ysc(v)}
  if(i<L.length&&L[i].ind>ind)throw new Error(`строка ${L[i].n}: неверный отступ`);return o}
 const r=node(L.length?L[0].ind:0);if(i<L.length)throw new Error(`строка ${L[i].n}: неверный отступ`);return r}
// ---------- Jinja (подмножество) ----------
const vget=(vars,p)=>{let v=vars;for(const k of p.split('.')){if(v===undefined||v===null)return undefined;v=v[k]}return v};
function lit(s,vars){s=s.trim();if(/^'.*'$|^".*"$/.test(s))return s.slice(1,-1);if(/^-?\d+(\.\d+)?$/.test(s))return +s;if(/^(true|false)$/i.test(s))return s.toLowerCase()==='true';if(/^\[.*\]$/.test(s))return ysc(s);return vget(vars,s)}
function expr(e,vars){const parts=splitPipe(e);let v=lit(parts[0],vars);for(const f of parts.slice(1)){const m=f.trim().match(/^(\w+)(?:\((.*)\))?$/);if(!m)continue;const a=m[2]!==undefined?splitTop(m[2]).map(x=>lit(x,vars)):[];switch(m[1]){case 'default':case 'd':if(v===undefined||v===null||v==='')v=a[0];break;case 'upper':v=String(v).toUpperCase();break;case 'lower':v=String(v).toLowerCase();break;case 'length':case 'count':v=v==null?0:v.length;break;case 'int':v=parseInt(v,10)||0;break;case 'trim':v=String(v).trim();break;case 'join':v=(v||[]).join(a[0]===undefined?'':a[0]);break;case 'string':v=String(v);break;case 'first':v=(v||[])[0];break;case 'last':v=(v||[]).slice(-1)[0];break;case 'replace':v=String(v).split(a[0]).join(a[1]);break;case 'basename':v=String(v).split('/').pop();break;case 'bool':v=/^(true|yes|1)$/i.test(String(v));break;case 'sort':v=(v||[]).slice().sort();break;case 'unique':v=[...new Set(v||[])];break}}return v}
function splitPipe(s){const r=[];let q=null,cur='',d=0;for(const c of s){if(q){cur+=c;if(c===q)q=null;continue}if(c==='"'||c==="'"){q=c;cur+=c;continue}if('([{'.includes(c))d++;if(')]}'.includes(c))d--;if(c==='|'&&d===0){r.push(cur);cur=''}else cur+=c}r.push(cur);return r}
function render(x,vars){if(typeof x==='string'){const one=x.match(/^\s*\{\{\s*(.*?)\s*\}\}\s*$/);if(one&&!/\}\}/.test(one[1])){const v=expr(one[1],vars);if(v===undefined)throw new Error(`The task includes an option with an undefined variable. The error was: '${one[1].split('|')[0].trim().split('.')[0]}' is undefined`);return v}
  return x.replace(/\{\{\s*(.*?)\s*\}\}/g,(m,e)=>{const v=expr(e,vars);if(v===undefined)throw new Error(`The task includes an option with an undefined variable. The error was: '${e.split('|')[0].trim().split('.')[0]}' is undefined`);return typeof v==='object'?JSON.stringify(v):String(v)})}
 if(Array.isArray(x))return x.map(y=>render(y,vars));if(x&&typeof x==='object'){const o={};for(const k in x)o[k]=render(x[k],vars);return o}return x}
function cond(c,vars){if(c===undefined||c===null)return true;if(Array.isArray(c))return c.every(x=>cond(x,vars));if(typeof c==='boolean')return c;let s=String(c);
 s=s.replace(/([A-Za-z_][\w.]*)\s+is\s+not\s+defined/g,'(!__d("$1"))').replace(/([A-Za-z_][\w.]*)\s+is\s+defined/g,'(__d("$1"))').replace(/([A-Za-z_][\w.]*)\s+not\s+in\s+([A-Za-z_][\w.]*|\[[^\]]*\])/g,'!__in($1,$2)').replace(/(\S+)\s+in\s+(\[[^\]]*\]|[A-Za-z_][\w.]*)/g,'__in($1,$2)');
 s=s.replace(/'[^']*'|"[^"]*"|[A-Za-z_][\w.]*|\S/g,t=>{if(/^['"]/.test(t))return t;if(/^(and)$/.test(t))return'&&';if(t==='or')return'||';if(t==='not')return'!';if(/^(True|true)$/.test(t))return'true';if(/^(False|false)$/.test(t))return'false';if(t==='None'||t==='null')return'null';if(/^__(d|in)$/.test(t))return t;if(/^[A-Za-z_]/.test(t))return t==='__d'?t:`__v("${t}")`;return t});
 s=s.replace(/__v\("(__d|__in)"\)/g,'$1');
 try{return !!new Function('__v','__d','__in',`return (${s})`)(n=>{const v=vget(vars,n);return v===undefined?(()=>{throw new Error(`The conditional check '${c}' failed. The error was: '${n}' is undefined`)})():v},n=>vget(vars,n)!==undefined,(a,b)=>{if(typeof b==='string')return String(b).includes(a);return(b||[]).includes(a)})}catch(e){if(/conditional check/.test(e.message))throw e;throw new Error(`The conditional check '${c}' failed: ${e.message}`)}}
// ---------- инвентарь ----------
function parseInv(text){const groups={all:[]};const hv={};let cur='ungrouped',kind='h';groups.ungrouped=[];text.split(/\r?\n/).forEach(l=>{l=l.replace(/\s*[#;].*$/,'').trim();if(!l)return;let m=l.match(/^\[([^\]:]+)(?::(children|vars))?\]$/);if(m){cur=m[1];kind=m[2]||'h';if(!groups[cur])groups[cur]=[];return}
  if(kind==='vars')return;if(kind==='children'){(groups[cur]=groups[cur]||[]).push({g:l});return}
  const t=l.split(/\s+/);const h=t[0];const vv={};t.slice(1).forEach(x=>{const k=x.split('=');vv[k[0]]=k.slice(1).join('=').replace(/^['"]|['"]$/g,'')});hv[h]=Object.assign(hv[h]||{},vv);if(!groups[cur].includes(h))groups[cur].push(h);if(!groups.all.includes(h))groups.all.push(h)});
 const expand=(g,seen=[])=>{if(seen.includes(g))return[];const r=[];(groups[g]||[]).forEach(x=>{if(typeof x==='string')r.push(x);else r.push(...expand(x.g,[...seen,g]))});return[...new Set(r)]};
 const res={};Object.keys(groups).forEach(g=>{res[g]=expand(g)});res.all=[...new Set([...res.all,...Object.keys(res).flatMap(g=>res[g])])];return{groups:res,hv}}
function pattern(inv,pat){const out=[];String(pat).split(/[,:]/).forEach(p=>{p=p.trim();if(!p)return;if(p==='all'||p==='*')out.push(...inv.groups.all);else if(inv.groups[p])out.push(...inv.groups[p]);else if(inv.hv[p]||p==='localhost')out.push(p);else if(/[*?]/.test(p)){const re=new RegExp('^'+p.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*').replace(/\?/g,'.')+'$');out.push(...inv.groups.all.filter(h=>re.test(h)))}else out.push(...[p].filter(h=>false))});return[...new Set(out)]}
return{yaml,render,cond,parseInv,pattern,expr,splitTop}})();
(function(){
const ADMC3=['ansible','ansible-playbook','ansible-inventory'];ADMC3.forEach(c=>{if(!ADMC.includes(c))ADMC.push(c)});
const R_ROOT=/^\/(etc|var|usr|opt|root|srv|boot)(\/|$)/;
const modeOf=m=>m===undefined||m===null?null:parseInt(String(m),8);
function remote(T,cmd,root){const S2=sxSession(T,'bash');let buf='',errb='';const io2={out:s=>{buf+=s},err:s=>{errb+=s},inp:{t:'',p:0}};const X2=Object.assign({},S2,{cwd:S2.home,env:{...S2.env},arr:{},loc:[],funcs:{...S2.funcs},opts:{},last:0,traps:{},pos:['ansible'],sudo:root?1:0,fs:sxFs(T)});let c=0;
 const U0=typeof V53U!=='undefined'?V53U:null;if(root&&typeof V53U!=='undefined')V53U='root';
 try{c=bRunList(X2,bParse(cmd),io2)}catch(e){if(e&&e.bx==='exit')c=e.n;else if(e&&e.syn){errb+=`bash: ${e.message}\n`;c=2}else{errb+=String(e&&e.message||e)+'\n';c=1}}finally{if(typeof V53U!=='undefined')V53U=U0}try{admSync(T)}catch(e){}return{rc:c||0,out:buf,err:errb}}
const q=s=>"'"+String(s).replace(/'/g,"'\\''")+"'";
function argStr(s){const o={};const re=/([\w]+)=("[^"]*"|'[^']*'|\S+)/g;let m;let rest=s;while((m=re.exec(s))){o[m[1]]=m[2].replace(/^["']|["']$/g,'');rest=rest.replace(m[0],'')}return o}
// ---------- модули ----------
function runModule(name,a,c){name=String(name).replace(/^ansible\.(builtin|posix)\./,'');const {T,X,become,ctlFs}=c;const fs=sxFs(T);
 const deny=p=>R_ROOT.test(p)&&!become?{failed:true,msg:`[Errno 13] Permission denied: '${p}'`}:null;
 const dirOf=p=>p.slice(0,p.lastIndexOf('/'))||'/';
 switch(name){
  case 'ping':return{changed:false,ping:a.data||'pong'};
  case 'debug':return{changed:false,debug:true,msg:a.var!==undefined?undefined:(a.msg!==undefined?a.msg:'Hello world!'),varName:a.var,val:a.var!==undefined?ANS_VAR(c.vars,a.var):undefined};
  case 'set_fact':return{changed:false,facts:a};
  case 'command':case 'shell':case 'raw':{let cmd=typeof a==='string'?a:(a._raw||a.cmd||'');if(!cmd)return{failed:true,msg:'no command given'};
   if(a.creates&&fs[sxNorm('/',String(a.creates),'/')])return{changed:false,skipped_msg:`skipped, since ${a.creates} exists`,rc:0,stdout:'',stdout_lines:[]};
   if(a.chdir)cmd='cd '+q(a.chdir)+' && '+cmd;const r=remote(T,cmd,become);const lines=r.out.replace(/\n$/,'').split('\n').filter((x,i,arr)=>!(arr.length===1&&x===''));
   return{changed:true,rc:r.rc,stdout:r.out.replace(/\n$/,''),stderr:r.err.replace(/\n$/,''),stdout_lines:lines,failed:r.rc!==0,msg:r.rc!==0?'non-zero return code':undefined}}
  case 'copy':case 'template':{const dest=a.dest;if(!dest)return{failed:true,msg:'missing required arguments: dest'};const d0=deny(dest);if(d0)return d0;
   let content;if(a.content!==undefined)content=String(a.content);else if(a.src){const sp=bAbs(X,String(a.src));const n=ctlFs[sp];if(!n||n.d)return{failed:true,msg:`Could not find or access '${a.src}'`};content=String(n.c||'')}else return{failed:true,msg:'src or content required'};
   if(name==='template')content=ANS.render(content,c.vars);let p=dest;if(fs[p]&&fs[p].d)p=p.replace(/\/$/,'')+'/'+(a.src?String(a.src).split('/').pop():'file');
   if(!fs[dirOf(p)]||!fs[dirOf(p)].d)return{failed:true,msg:`Destination directory ${dirOf(p)} does not exist`};
   const old=fs[p]&&!fs[p].d?String(fs[p].c||''):null;const mo=modeOf(a.mode);let ch=false;if(old!==content){const e=sxWrite(fs,p,content);if(e)return{failed:true,msg:e};ch=true}
   if(mo!==null&&fs[p].m!==mo){fs[p].m=mo;ch=true}return{changed:ch,dest:p}}
  case 'file':{const p=a.path||a.dest||a.name;if(!p)return{failed:true,msg:'missing required arguments: path'};const d0=deny(p);if(d0)return d0;const st=a.state||'file';const mo=modeOf(a.mode);let ch=false;
   if(st==='directory'){if(!fs[p]){const e=sxMk(fs,p,true);if(e)return{failed:true,msg:e};ch=true}else if(!fs[p].d)return{failed:true,msg:`${p} already exists and is not a directory`};if(mo!==null&&fs[p].m!==mo){fs[p].m=mo;ch=true}else if(mo!==null&&fs[p].m===undefined){fs[p].m=mo;ch=true}return{changed:ch,path:p}}
   if(st==='touch'){if(!fs[p]){const e=sxWrite(fs,p,'');if(e)return{failed:true,msg:e};ch=true}if(mo!==null){fs[p].m=mo}return{changed:ch||true,path:p}}
   if(st==='absent'){if(fs[p]){Object.keys(fs).filter(k=>k===p||k.startsWith(p+'/')).forEach(k=>delete fs[k]);ch=true}return{changed:ch,path:p}}
   if(!fs[p])return{failed:true,msg:`file (${p}) is absent, use state=touch|directory to create`};if(mo!==null&&fs[p].m!==mo){fs[p].m=mo;ch=true}return{changed:ch,path:p}}
  case 'lineinfile':{const p=a.path||a.dest;if(!p)return{failed:true,msg:'missing required arguments: path'};const d0=deny(p);if(d0)return d0;if(!fs[p]){if(a.create&&/^(yes|true)$/i.test(String(a.create))){const e=sxWrite(fs,p,'');if(e)return{failed:true,msg:e}}else return{failed:true,msg:`Destination ${p} does not exist !`}}
   let lines=String(fs[p].c||'').split('\n');if(lines[lines.length-1]==='')lines.pop();const st=a.state||'present';const re=a.regexp?new RegExp(a.regexp):null;let ch=false;
   if(st==='absent'){const nl=lines.filter(l=>re?!re.test(l):l!==a.line);if(nl.length!==lines.length){lines=nl;ch=true}}
   else{if(a.line===undefined)return{failed:true,msg:'one of the following is required: line'};const line=String(a.line);let idx=re?(()=>{let k=-1;lines.forEach((l,i)=>{if(re.test(l))k=i});return k})():lines.indexOf(line);
    if(idx>=0){if(lines[idx]!==line){lines[idx]=line;ch=true}}else{lines.push(line);ch=true}}
   if(ch){const e=sxWrite(fs,p,lines.join('\n')+(lines.length?'\n':''));if(e)return{failed:true,msg:e}}return{changed:ch,msg:ch?(st==='absent'?'line removed':'line added/replaced'):''}}
  case 'service':case 'systemd':{const n=a.name;if(!n)return{failed:true,msg:'missing required arguments: name'};const u=admSvc(T);const unit=u[String(n).replace(/\.service$/,'')];if(!unit)return{failed:true,msg:`Could not find the requested service ${n}: host`};if(!become)return{failed:true,msg:`Failed to start ${n}.service: Interactive authentication required.`};let ch=false;const st=a.state;
   if(st==='started'&&unit.s!=='active'){remote(T,`systemctl start ${n}`,true);ch=true}else if(st==='stopped'&&unit.s==='active'){remote(T,`systemctl stop ${n}`,true);ch=true}else if(st==='restarted'||st==='reloaded'){remote(T,`systemctl restart ${n}`,true);ch=true}
   if(a.enabled!==undefined){const want=/^(yes|true|1)$/i.test(String(a.enabled));if(!!unit.en!==want){remote(T,`systemctl ${want?'enable':'disable'} ${n}`,true);ch=true}}return{changed:ch,name:n,state:unit.s}}
  case 'user':{const n=a.name;if(!n)return{failed:true,msg:'missing required arguments: name'};if(!become)return{failed:true,msg:'useradd: Permission denied.'};const st=a.state||'present';const ex=remote(T,`id ${q(n)}`,true).rc===0;
   if(st==='absent'){if(!ex)return{changed:false};remote(T,`userdel ${q(n)}`,true);return{changed:true}}
   if(ex){if(a.groups){const gl=Array.isArray(a.groups)?a.groups.join(','):String(a.groups);const cur=remote(T,`id -nG ${q(n)}`,true).out.trim().split(/\s+/);const need=gl.split(',').filter(g=>g&&!cur.includes(g));if(need.length){const r=remote(T,`usermod -aG ${q(need.join(','))} ${q(n)}`,true);if(r.rc)return{failed:true,msg:r.err.trim()||'usermod failed'};return{changed:true}}}return{changed:false}}
   const r=remote(T,`useradd ${a.shell?'-s '+q(a.shell)+' ':''}${a.groups?'-G '+q(Array.isArray(a.groups)?a.groups.join(','):a.groups)+' ':''}${q(n)}`,true);if(r.rc)return{failed:true,msg:r.err.trim()||'useradd failed'};return{changed:true,name:n}}
  case 'group':{const n=a.name;if(!become)return{failed:true,msg:'groupadd: Permission denied.'};const ex=remote(T,`getent group ${q(n)}`,true).rc===0;if((a.state||'present')==='absent'){if(!ex)return{changed:false};remote(T,`groupdel ${q(n)}`,true);return{changed:true}}if(ex)return{changed:false};const r=remote(T,`groupadd ${q(n)}`,true);if(r.rc)return{failed:true,msg:r.err.trim()};return{changed:true}}
  case 'apt':case 'yum':case 'dnf':case 'package':{if(!become)return{failed:true,msg:'This command has to be run under the root user.'};T.pkgs=T.pkgs||[];let names=a.name;if(typeof names==='string')names=names.split(',').map(x=>x.trim());names=names||[];const st=a.state||'present';let ch=false;
   names.forEach(n=>{const i=T.pkgs.indexOf(n);if(st==='absent'){if(i>=0){T.pkgs.splice(i,1);ch=true}}else if(i<0){T.pkgs.push(n);ch=true}});return{changed:ch,msg:ch?(st==='absent'?'packages removed':'packages installed'):'already the newest version'}}
  case 'fail':return{failed:true,msg:a.msg||'Failed as requested from task'};
  case 'assert':{const th=Array.isArray(a.that)?a.that:[a.that];for(const t of th){if(!ANS.cond(t,c.vars))return{failed:true,msg:a.fail_msg||`Assertion failed: ${t}`}}return{changed:false,msg:a.success_msg||'All assertions passed'}}
  case 'stat':{const p=a.path;const n=fs[p];return{changed:false,stat:{exists:!!n,isdir:!!(n&&n.d),size:n&&!n.d?String(n.c||'').length:0}}}
  case 'wait_for':return{changed:false,elapsed:0};
  case 'pause':return{changed:false};
 }
 return{failed:true,msg:`no action detected in task (модуль «${name}» не поддерживается в учебной модели Ansible)`}}
function ANS_VAR(vars,n){const v=vars&&n.split('.').reduce((o,k)=>o==null?undefined:o[k],vars);return v}
window.ANS_VAR=ANS_VAR;
// ---------- вспомогательные ----------
function loadInv(X,io,path){let cand=path?[path]:[X.cwd+'/inventory',X.cwd+'/inventory.ini',X.cwd+'/hosts',X.home+'/inventory',X.home+'/inventory.ini','/etc/ansible/hosts'];
 if(path&&path.includes(',')&&!X.fs[bAbs(X,path)]){const hosts=path.split(',').map(s=>s.trim()).filter(Boolean);return ANS.parseInv(hosts.join('\n'))}
 for(const c of cand){const p=bAbs(X,c);const n=X.fs[p];if(n&&!n.d)return ANS.parseInv(String(n.c||''))}
 if(path){io.err(`ERROR! The inventory file '${path}' was not found\n`);return null}
 io.err('[WARNING]: No inventory was parsed, only implicit localhost is available\n');return ANS.parseInv('localhost')}
function hostInfo(inv,h,X){const hv=inv.hv[h]||{};const target=hv.ansible_host||h;return{h,hv,target,local:h==='localhost'||target==='localhost'||target==='127.0.0.1'}}
function connect(X,hi){if(hi.local)return{T:X.d};const T=sshFind(hi.target);const port=+hi.hv.ansible_port||22;if(!T)return{err:`Failed to connect to the host via ssh: ssh: Could not resolve hostname ${hi.target}: Name or service not known`};
 let msg='';const io2={err:s=>{msg+=s},out:()=>{}};const r=sshConn(X,io2,hi.target,port,'ssh');if(!r){const m=msg.replace(/^ssh: /,'').trim();return{err:'Failed to connect to the host via ssh: '+m}}
 const user=hi.hv.ansible_user;if(user&&user!=='student')return{err:`Failed to connect to the host via ssh: ${user}@${hi.target}: Permission denied (publickey,password).`};return{T}}
const jsn=o=>{const s=JSON.stringify(o,null,4);return s};
// ---------- ansible (ad-hoc) ----------
BB.ansible=(X,a,io)=>{let pat=null,mod='command',args='',invp=null,become=false;const ev={};
 for(let i=0;i<a.length;i++){const x=a[i];if(x==='-i'||x==='--inventory')invp=a[++i];else if(x==='-m'||x==='--module-name')mod=a[++i];else if(x==='-a'||x==='--args')args=a[++i];else if(x==='-b'||x==='--become')become=true;else if(x==='-e'||x==='--extra-vars'){const kv=argStr(a[++i]||'');Object.assign(ev,kv)}else if(x==='--version'){io.out('ansible [core 2.15.0] (учебная модель Стектонии)\n');return 0}else if(x==='-u'||x==='-K'||x==='-k'||x==='-f'){if(x==='-u'||x==='-f')i++}else if(x[0]!=='-'&&pat===null)pat=x}
 if(!pat){io.err('usage: ansible <узлы|группа|all> -m модуль [-a "аргументы"] [-i инвентарь] [-b]\n');return 2}
 const inv=loadInv(X,io,invp);if(!inv)return 4;const hosts=ANS.pattern(inv,pat);if(!hosts.length){io.err(`[WARNING]: Could not match supplied host pattern, ignoring: ${pat}\nERROR! Specified hosts and/or --limit does not match any hosts\n`);return 1}
 let bad=0;const ctl=sxFs(X.d);
 hosts.forEach(h=>{const hi=hostInfo(inv,h,X);const cn=connect(X,hi);if(cn.err){io.out(`${h} | UNREACHABLE! => ${jsn({changed:false,msg:cn.err,unreachable:true})}\n`);bad=Math.max(bad,4);return}
  let ma;if(/^(command|shell|raw)$/.test(mod))ma={_raw:args};else if(!args)ma={};else ma=argStr(args);
  const vars={inventory_hostname:h,ansible_host:hi.target,...hi.hv,...ev};let r;try{r=runModule(mod,ma,{T:cn.T,X,become,ctlFs:ctl,vars})}catch(e){r={failed:true,msg:e.message}}
  if(r.failed){io.out(`${h} | FAILED! => ${jsn({changed:false,msg:r.msg,...(r.rc!==undefined?{rc:r.rc,stdout:r.stdout}:{})})}\n`);bad=Math.max(bad,2);return}
  if(/^(command|shell|raw)$/.test(mod)){io.out(`${h} | ${r.changed?'CHANGED':'SUCCESS'} | rc=${r.rc} >>\n${r.stdout}${r.stdout?'\n':''}`)}
  else{const o={...r};delete o.debug;io.out(`${h} | ${r.changed?'CHANGED':'SUCCESS'} => ${jsn({changed:!!r.changed,...(()=>{const z={...r};delete z.changed;return z})()})}\n`)}});
 return bad};
// ---------- ansible-playbook ----------
BB['ansible-playbook']=(X,a,io)=>{let invp=null,file=null,become0=false;const ev={};let check=false,limit=null;
 for(let i=0;i<a.length;i++){const x=a[i];if(x==='-i'||x==='--inventory')invp=a[++i];else if(x==='-e'||x==='--extra-vars')Object.assign(ev,argStr(a[++i]||''));else if(x==='-b'||x==='--become')become0=true;else if(x==='--check'||x==='-C')check=true;else if(x==='-l'||x==='--limit')limit=a[++i];else if(x==='--syntax-check')check='syntax';else if(x==='--version'){io.out('ansible-playbook [core 2.15.0] (учебная модель Стектонии)\n');return 0}else if(x[0]!=='-'&&!file)file=x}
 if(!file){io.err('usage: ansible-playbook [-i инвентарь] [-e "k=v"] [-b] [--syntax-check] [-l узлы] плейбук.yml\n');return 1}
 const p=bAbs(X,file);const n=X.fs[p];if(!n||n.d){io.err(`ERROR! the playbook: ${file} could not be found\n`);return 1}
 let pb;try{pb=ANS.yaml(String(n.c||''))}catch(e){io.err(`ERROR! We were unable to read either as JSON nor YAML, these are the errors we got from each:\nYAML: ${e.message}\n`);return 4}
 if(!Array.isArray(pb)||!pb.every(x=>x&&typeof x==='object'&&!Array.isArray(x))){io.err('ERROR! A playbook must be a list of plays, got a '+(Array.isArray(pb)?'list of non-plays':typeof pb)+' instead\n');return 4}
 for(const pl of pb){if(!pl.hosts){io.err(`ERROR! the field 'hosts' is required but was not set\n`);return 4}if(pl.tasks!==undefined&&!Array.isArray(pl.tasks)&&pl.tasks!==null){io.err("ERROR! A malformed block was encountered while loading tasks: 'tasks' must be a list\n");return 4}}
 if(check==='syntax'){io.out(`\nplaybook: ${file}\n`);return 0}
 const inv=loadInv(X,io,invp);if(!inv)return 4;const ctl=sxFs(X.d);const KEYS=new Set(['name','when','loop','with_items','register','notify','become','vars','ignore_errors','changed_when','failed_when','tags','args','loop_control','become_user','delegate_to','no_log','environment','block']);
 const stars=(s)=>s+' '+'*'.repeat(Math.max(3,70-s.length))+'\n';const recap={};let rcode=0;
 for(const pl of pb){const hosts0=ANS.pattern(inv,pl.hosts).filter(h=>!limit||ANS.pattern(inv,limit).includes(h));io.out('\n'+stars(`PLAY [${pl.name||pl.hosts}]`));
  if(!hosts0.length){io.err(`[WARNING]: Could not match supplied host pattern, ignoring: ${pl.hosts}\n`);continue}
  const state={};const live=[];const pv=Object.assign({},pl.vars||{},ev);
  const plBecome=pl.become!==undefined?/^(yes|true)$/i.test(String(pl.become)):become0;
  hosts0.forEach(h=>{recap[h]=recap[h]||{ok:0,changed:0,unreachable:0,failed:0,skipped:0,rescued:0,ignored:0}});
  if(pl.gather_facts===undefined||pl.gather_facts===true){io.out('\n'+stars('TASK [Gathering Facts]'));hosts0.forEach(h=>{const hi=hostInfo(inv,h,X);const cn=connect(X,hi);if(cn.err){io.out(`fatal: [${h}]: UNREACHABLE! => {"changed": false, "msg": ${JSON.stringify(cn.err)}, "unreachable": true}\n`);recap[h].unreachable++;rcode=Math.max(rcode,4);return}state[h]={T:cn.T,vars:{inventory_hostname:h,ansible_hostname:cn.T.name,ansible_host:hi.target,inventory_hostname_short:h,...hi.hv,...pv,ansible_os_family:'Debian',ansible_distribution:'Debian'},notified:[],hi};live.push(h);recap[h].ok++;io.out(`ok: [${h}]\n`)})}
  else hosts0.forEach(h=>{const hi=hostInfo(inv,h,X);const cn=connect(X,hi);if(cn.err){io.out(`fatal: [${h}]: UNREACHABLE! => {"changed": false, "msg": ${JSON.stringify(cn.err)}, "unreachable": true}\n`);recap[h].unreachable++;rcode=Math.max(rcode,4);return}state[h]={T:cn.T,vars:{inventory_hostname:h,ansible_host:hi.target,...hi.hv,...pv},notified:[],hi};live.push(h)});
  const dead=new Set();
  const doTask=(t,kind)=>{const nm=t.name||Object.keys(t).find(k=>!KEYS.has(k))||'task';io.out('\n'+stars(`${kind==='h'?'RUNNING HANDLER':'TASK'} [${nm}]`));
   for(const h of live){if(dead.has(h))continue;const S2=state[h];const mk=Object.keys(t).find(k=>!KEYS.has(k));
    if(!mk){io.out(`fatal: [${h}]: FAILED! => {"msg": "no module specified in task"}\n`);recap[h].failed++;dead.add(h);rcode=Math.max(rcode,2);continue}
    const tv=Object.assign({},S2.vars,t.vars||{});let items=[null];let isLoop=false;
    try{const lp=t.loop!==undefined?t.loop:t.with_items;if(lp!==undefined){isLoop=true;items=ANS.render(lp,tv);if(!Array.isArray(items))items=[items]}}catch(e){io.out(`fatal: [${h}]: FAILED! => {"msg": ${JSON.stringify(e.message)}}\n`);recap[h].failed++;dead.add(h);rcode=Math.max(rcode,2);continue}
    const results=[];let anyCh=false,anyFail=false,allSkip=true;
    for(const it of items){const v=Object.assign({},tv);if(isLoop)v.item=it;const suffix=isLoop?` => (item=${typeof it==='object'?JSON.stringify(it):it})`:'';
     try{if(t.when!==undefined&&!ANS.cond(t.when,v)){io.out(`skipping: [${h}]${isLoop?` => (item=${typeof it==='object'?JSON.stringify(it):it})`:''}\n`);results.push({skipped:true});continue}allSkip=false;
      let args=t[mk];let ma;if(typeof args==='string'){ma=/^(command|shell|raw|ansible\.builtin\.(command|shell|raw))$/.test(mk)?{_raw:ANS.render(args,v)}:argStr(ANS.render(args,v))}else ma=ANS.render(args||{},v);if(t.args)Object.assign(ma,ANS.render(t.args,v));
      if(typeof t[mk]==='object'&&t[mk]&&/^(command|shell|raw)$/.test(mk.replace(/^ansible\.builtin\./,''))&&t[mk].cmd===undefined&&t[mk]._raw===undefined&&t[mk].free_form)ma._raw=t[mk].free_form;
      const bc=t.become!==undefined?/^(yes|true)$/i.test(String(t.become)):plBecome;let r;
      if(check===true&&!/^(ping|debug|set_fact|assert|stat|fail)$/.test(mk.replace(/^ansible\.builtin\./,''))){r={changed:true,check:true}}else r=runModule(mk,ma,{T:S2.T,X,become:bc,ctlFs:ctl,vars:v});
      if(t.changed_when!==undefined)r.changed=ANS.cond(t.changed_when,Object.assign({},v,{result:r},t.register?{[t.register]:r}:{}));
      if(t.failed_when!==undefined)r.failed=ANS.cond(t.failed_when,Object.assign({},v,{result:r},t.register?{[t.register]:r}:{}));
      results.push(r);if(r.facts)Object.assign(S2.vars,ANS.render(r.facts,v));
      if(r.failed){anyFail=true;io.out(`fatal: [${h}]: FAILED! => ${JSON.stringify({changed:!!r.changed,msg:r.msg,...(r.rc!==undefined?{rc:r.rc,stdout:r.stdout,stderr:r.stderr}:{}),...(isLoop?{item:it}:{})})}${t.ignore_errors?'\n...ignoring':''}\n`);}
      else if(r.debug){io.out(`ok: [${h}]${isLoop?` => (item=${typeof it==='object'?JSON.stringify(it):it})`:' =>'} ${r.varName!==undefined?JSON.stringify({[r.varName]:r.val},null,4):JSON.stringify({msg:r.msg},null,4)}\n`)}
      else{io.out(`${r.changed?'changed':'ok'}: [${h}]${suffix}\n`);if(r.changed)anyCh=true}
     }catch(e){anyFail=true;results.push({failed:true,msg:e.message});io.out(`fatal: [${h}]: FAILED! => {"msg": ${JSON.stringify(e.message)}}${t.ignore_errors?'\n...ignoring':''}\n`)}}
    if(t.register){const last=results.length===1&&!isLoop?results[0]:{results,changed:results.some(r=>r.changed),failed:results.some(r=>r.failed)};S2.vars[t.register]=last}
    if(anyFail){if(t.ignore_errors){recap[h].ignored++;recap[h].ok++}else{recap[h].failed++;dead.add(h);rcode=Math.max(rcode,2)}}
    else if(allSkip)recap[h].skipped++;else{recap[h].ok++;if(anyCh){recap[h].changed++;(Array.isArray(t.notify)?t.notify:t.notify?[t.notify]:[]).forEach(nn=>{if(!S2.notified.includes(nn))S2.notified.push(nn)})}}}};
  const flat=[];(pl.tasks||[]).forEach(t=>{if(t&&t.block&&Array.isArray(t.block))t.block.forEach(b=>flat.push(b));else flat.push(t)});
  for(const t of flat)doTask(t,'t');
  const hs=pl.handlers||[];hs.forEach(hd=>{const need=live.filter(h=>!dead.has(h)&&state[h].notified.includes(hd.name));if(!need.length)return;const sub=live;const saved=live.slice();live.length=0;need.forEach(h=>live.push(h));doTask(hd,'h');live.length=0;saved.forEach(h=>live.push(h))})}
 io.out('\n'+stars('PLAY RECAP'));const w=Math.max(...Object.keys(recap).map(h=>h.length),8);
 Object.keys(recap).forEach(h=>{const r=recap[h];io.out(`${h.padEnd(w)} : ok=${r.ok}    changed=${r.changed}    unreachable=${r.unreachable}    failed=${r.failed}    skipped=${r.skipped}    rescued=${r.rescued}    ignored=${r.ignored}\n`)});
 return rcode};
BB['ansible-inventory']=(X,a,io)=>{let invp=null;for(let i=0;i<a.length;i++)if(a[i]==='-i')invp=a[++i];const inv=loadInv(X,io,invp);if(!inv)return 4;
 if(a.includes('--graph')){const walk=g=>{io.out(`@${g}:\n`);(inv.groups[g]||[]).forEach(h=>io.out(`  |--${h}\n`))};Object.keys(inv.groups).filter(g=>g!=='all'&&g!=='ungrouped'&&inv.groups[g].length).forEach(walk);return 0}
 io.out(JSON.stringify({groups:inv.groups,hosts:inv.hv},null,2)+'\n');return 0};
MAN.push(['Т46. Ansible (учебная модель)',`<p>В терминале bash работают команды <code>ansible</code>, <code>ansible-playbook</code> и <code>ansible-inventory</code>. Они управляют узлами схемы по SSH-модели Стектонии (нужны связность, запущенная служба <code>sshd</code> и правила межсетевого экрана, как в Т27), а результат виден в файловой системе, службах и пользователях этих узлов.</p>
<h3>Инвентарь</h3><p>INI-файл (<code>inventory</code> в текущем или домашнем каталоге, либо <code>-i файл</code>): группы <code>[web]</code>, узлы по имени устройства на схеме, параметры <code>ansible_host=IP</code>, <code>ansible_user</code>, группы групп <code>[all:children]</code>. Узел <code>localhost</code> — локальное подключение.</p>
<h3>Разовые команды</h3><p><code>ansible all -m ping</code>, <code>ansible web -m shell -a "uptime"</code>, <code>ansible web -b -m service -a "name=nginx state=started"</code>. Ключ <code>-b</code> — выполнить с повышением прав (become).</p>
<h3>Плейбуки</h3><p>YAML: список «игр» с <code>hosts</code>, <code>become</code>, <code>vars</code>, <code>tasks</code>, <code>handlers</code>. В задачах: <code>name</code>, модуль, <code>when</code>, <code>loop</code>/<code>with_items</code>, <code>register</code>, <code>notify</code>, <code>ignore_errors</code>, <code>changed_when</code>, <code>failed_when</code>, подстановки <code>{{ переменная }}</code> с фильтрами default, upper, lower, length, join и др. Модули: ping, command, shell, copy, template, file, lineinfile, service/systemd, user, group, apt/yum/package, debug, set_fact, assert, fail, stat. Ключи: <code>--syntax-check</code>, <code>--check</code> (без изменений), <code>-e "k=v"</code>, <code>-l узел</code>.</p>
<h3>Идемпотентность</h3><p>Главная идея Ansible: повторный запуск ничего не меняет. В итоге <code>PLAY RECAP</code> первый запуск покажет <code>changed=N</code>, второй — <code>changed=0</code>. Если вместо этого каждый раз «changed», задача написана не идемпотентно (например, модуль <code>shell</code>).</p>
<h3>Ограничения</h3><p>Это учебная модель: нет ролей, <code>include</code>, <code>block/rescue</code> (блок раскрывается как обычные задачи), vault, реальной установки пакетов (apt/yum только ведут список пакетов узла), сложных Jinja-выражений и фильтров, асинхронных задач; параллельности по узлам нет, узлы обрабатываются по очереди.</p>`]);
})();
