// ================= v23c2: bash — выполнение и встроенные команды =================
function bTick(X){if(++X.steps>400000||Date.now()-X.t0>7000)throw new Error('превышен лимит выполнения (возможно, бесконечный цикл)')}
function bRunList(X,L,io){let c=0;for(const it of L.items){c=bRunNode(X,it.n,io);X.last=c;if(X.opts.e&&c!==0&&!X.nof&&it.n.k!=='func')throw{bx:'exit',n:c}}return c}
function bWithR(X,node,io,f){if(!node.redirs||!node.redirs.length)return f(io);const r=bRedir(X,node.redirs,io);return r?f(r):1}
function bRedir(X,rs,io){const o={inp:io.inp,out:io.out,err:io.err,tty:io.tty};for(const r of rs||[]){const fd=r.fd||(/^<{1,3}$|^<&$/.test(r.op)?'0':'1');
  if(r.op==='<<'||r.op==='<<-'){o.inp={t:r.quoted?(r.hd||''):bExpW(X,r.hd||'',io,'h'),p:0};continue}
  const tg=bExpW(X,r.target,io,'s');
  if(r.op==='<'){const f=sxNorm(X.cwd,tg,X.home),n=X.fs[f];if(!n||n.d){X.err(`bash: ${tg}: ${n?'Is a directory':'No such file or directory'}\n`);return null}o.inp={t:n.c||'',p:0};continue}
  if(r.op==='<<<'){o.inp={t:tg+'\n',p:0};continue}
  if(r.op==='>&'||r.op==='<&'){if(tg==='1'){if(fd==='2')o.err=o.out}else if(tg==='2'){if(fd==='1')o.out=o.err}else if(tg==='-'){}continue}
  let w;if(tg==='/dev/null')w=()=>{};else if(tg==='/dev/stderr')w=o.err;else if(tg==='/dev/stdout')w=o.out;else{const f=sxNorm(X.cwd,tg,X.home);if(!/>>/.test(r.op)){const e=sxWrite(X.fs,f,'');if(e){X.err(`bash: ${tg}: ${e}\n`);return null}}else if(!X.fs[f]){const e=sxWrite(X.fs,f,'');if(e){X.err(`bash: ${tg}: ${e}\n`);return null}}w=s=>{const e=sxWrite(X.fs,f,s,true);if(e)X.err(`bash: ${tg}: ${e}\n`)}}
  if(r.op[0]==='&'){o.out=w;o.err=w;o.tty=false}else if(fd==='2')o.err=w;else{o.out=w;o.tty=false}}return o}
function bRunNode(X,n,io){bTick(X);switch(n.k){
 case'simple':return bSimple(X,n,io);
 case'seq':return bRunList(X,n,io);
 case'andor':{let c;X.nof++;try{c=bRunNode(X,n.first,io)}finally{X.nof--}for(let i=0;i<n.rest.length;i++){const r=n.rest[i],last=i===n.rest.length-1;if((r.op==='&&'&&c===0)||(r.op==='||'&&c!==0)){if(!last)X.nof++;try{c=bRunNode(X,r.n,io)}finally{if(!last)X.nof--}X.last=c}}return c}
 case'pipe':{if(n.neg)X.nof++;let c=0,pf=0;try{let inp=io.inp;for(let i=0;i<n.cmds.length;i++){const last=i===n.cmds.length-1,buf=[];const io2={inp,out:last?io.out:s=>buf.push(s),err:io.err,tty:last?io.tty:false};c=bRunNode(X,n.cmds[i],io2);X.last=c;if(c!==0)pf=c;if(!last)inp={t:buf.join(''),p:0}}if(X.opts.pipefail&&pf)c=pf}finally{if(n.neg)X.nof--}return n.neg?(c===0?1:0):c}
 case'if':{for(const cd of n.conds){X.nof++;let c;try{c=bRunList(X,cd.c,io)}finally{X.nof--}if(c===0)return bRunList(X,cd.b,io)}return n.els?bRunList(X,n.els,io):0}
 case'while':return bWithR(X,n,io,io2=>{let c=0;for(;;){bTick(X);X.nof++;let k;try{k=bRunList(X,n.c,io2)}finally{X.nof--}if(n.until?k===0:k!==0)break;try{c=bRunList(X,n.b,io2)}catch(e){if(e&&e.bx==='brk'){if(e.n>1)throw{bx:'brk',n:e.n-1};break}if(e&&e.bx==='cont'){if(e.n>1)throw{bx:'cont',n:e.n-1};continue}throw e}}return c});
 case'for':return bWithR(X,n,io,io2=>{const items=n.items===null?X.pos.slice(1):n.items.flatMap(w=>bExpW(X,w,io2,'f'));let c=0;for(const it of items){bTick(X);bSet(X,n.v,it);try{c=bRunList(X,n.b,io2)}catch(e){if(e&&e.bx==='brk'){if(e.n>1)throw{bx:'brk',n:e.n-1};break}if(e&&e.bx==='cont'){if(e.n>1)throw{bx:'cont',n:e.n-1};continue}throw e}}return c});
 case'cfor':return bWithR(X,n,io,io2=>{let c=0;if(n.init.trim())bArith(X,n.init);for(;;){bTick(X);if(n.cond.trim()&&!bArith(X,n.cond))break;try{c=bRunList(X,n.b,io2)}catch(e){if(e&&e.bx==='brk'){if(e.n>1)throw{bx:'brk',n:e.n-1};break}if(e&&e.bx==='cont'){if(e.n>1)throw{bx:'cont',n:e.n-1}}else throw e}if(n.step.trim())bArith(X,n.step)}return c});
 case'case':return bWithR(X,n,io,io2=>{const w=bExpW(X,n.w,io2,'s');for(const cs of n.cases){for(const p of cs.pats){if(bPat(bExpW(X,bLit(p),io2,'s')).test(w))return bRunList(X,cs.b,io2)}}return 0});
 case'func':X.funcs[n.name]=n.b;return 0;
 case'group':return bWithR(X,n,io,io2=>bRunList(X,n.b,io2));
 case'sub':return bWithR(X,n,io,io2=>{const sv={env:{...X.env},cwd:X.cwd,pos:X.pos.slice(),arr:JSON.parse(JSON.stringify(X.arr)),loc:X.loc.map(x=>({...x}))};try{return bRunList(X,n.b,io2)}catch(e){if(e&&e.bx==='exit')return e.n;throw e}finally{X.env=sv.env;X.cwd=sv.cwd;X.pos=sv.pos;X.arr=sv.arr;X.loc=sv.loc}});
 case'arith':return bWithR(X,n,io,io2=>bArith(X,n.expr)!==0?0:1);
 case'db':return bDb(X,n.toks,io)?0:1}
 throw new Error('неизвестный узел '+n.k)}
function bDb(X,toks,io){let p=0;const W=t=>typeof t==='string'?bExpW(X,t,io,'s'):null;const isOp=v=>toks[p]&&typeof toks[p]==='object'&&toks[p].op===v;
 function or(){let a=and();while(isOp('||')){p++;const b=and();a=a||b}return a}
 function and(){let a=not();while(isOp('&&')){p++;const b=not();a=a&&b}return a}
 function not(){if(toks[p]==='!'){p++;return!not()}return prim()}
 function prim(){if(isOp('(')){p++;const v=or();if(isOp(')'))p++;return v}const t=toks[p++];if(typeof t!=='string')throw bErr('syntax error in conditional expression');
  if(/^-[a-zA-Z]$/.test(t)&&toks[p]!==undefined&&!(typeof toks[p]==='object')&&!['==','!=','=~','=','-eq','-ne','-lt','-gt','-le','-ge'].includes(toks[p]+'')||(/^-[a-zA-Z]$/.test(t)&&toks[p]!==undefined&&typeof toks[p]==='string'&&!['==','!=','=~','=','<','>','-eq','-ne','-lt','-gt','-le','-ge'].includes(toks[p]))){const a=W(toks[p++]);return bUnary(X,t,a)}
  const l=W(t);if(typeof toks[p]==='string'&&['==','!=','=','=~','<','>','-eq','-ne','-lt','-gt','-le','-ge'].includes(toks[p])){const op=toks[p++],rawR=toks[p++],r=W(rawR);
   if(op==='==')return bPat(r).test(l);if(op==='!=')return!bPat(r).test(l);if(op==='=')return l===r;if(op==='<')return l<r;if(op==='>')return l>r;
   if(op==='=~'){let re;try{re=new RegExp(r.replace(/\[\[:(\w+):\]\]/g,'[[:$1:]]').replace(/\[:alpha:\]/g,'a-zA-Z').replace(/\[:digit:\]/g,'0-9').replace(/\[:alnum:\]/g,'a-zA-Z0-9').replace(/\[:space:\]/g,'\\s').replace(/\[:upper:\]/g,'A-Z').replace(/\[:lower:\]/g,'a-z'))}catch(e){return false}const m=re.exec(l);X.arr.BASH_REMATCH=m?[...m].map(x=>x===undefined?'':x):[];return!!m}
   const a=parseInt(l,10),b=parseInt(r,10);return op==='-eq'?a===b:op==='-ne'?a!==b:op==='-lt'?a<b:op==='-gt'?a>b:op==='-le'?a<=b:a>=b}
  return l!==''}
 return or()}
function bUnary(X,op,a){const f=sxNorm(X.cwd,a,X.home),n=X.fs[f];switch(op){case'-e':case'-a':return!!n;case'-f':return!!n&&!n.d;case'-d':return!!n&&!!n.d;case'-s':return!!n&&(n.d||(n.c||'').length>0);case'-r':case'-w':return!!n;case'-x':return!!n&&(n.d||/^#!/.test(n.c||'')||/\.(sh|bash)$/.test(f));case'-L':case'-h':return false;case'-z':return a==='';case'-n':return a!=='';case'-v':return bIsSet(X,a)}return false}
function bTestArgs(X,a){a=a.slice();if(a.length===0)return false;let p=0;const pk=()=>a[p];
 function or(){let v=and();while(pk()==='-o'){p++;const w=and();v=v||w}return v}
 function and(){let v=nt();while(pk()==='-a'){p++;const w=nt();v=v&&w}return v}
 function nt(){if(pk()==='!'){p++;return!nt()}return prim()}
 function prim(){if(pk()==='('){p++;const v=or();if(pk()===')')p++;return v}const t=a[p++];
  if(a[p]!==undefined&&['=','==','!=','-eq','-ne','-lt','-gt','-le','-ge','<','>'].includes(a[p])&&a[p+1]!==undefined){const op=a[p++],r=a[p++];if(op==='='||op==='==')return t===r;if(op==='!=')return t!==r;if(op==='<')return t<r;if(op==='>')return t>r;const x=parseInt(t,10),y=parseInt(r,10);if(isNaN(x)||isNaN(y))throw new Error('integer expression expected');return op==='-eq'?x===y:op==='-ne'?x!==y:op==='-lt'?x<y:op==='-gt'?x>y:op==='-le'?x<=y:x>=y}
  if(/^-[a-zA-Z]$/.test(t)&&a[p]!==undefined)return bUnary(X,t,a[p++]);return t!==undefined&&t!==''}
 return or()}
function bAssign(X,a,io){const v=a.val;
 if(a.idx===null&&v.startsWith('(')&&v.endsWith(')')){const items=bLex(v.slice(1,-1)).filter(t=>t.t==='w').flatMap(t=>bExpW(X,t.v,io,'f'));const old=X.arr[a.name];if(a.app&&Array.isArray(old))old.push(...items);else{if(items.length&&items.every(x=>/^\[[^\]]+\]=/.test(x))){const o={};items.forEach(x=>{const m=/^\[([^\]]+)\]=([\s\S]*)$/.exec(x);o[m[1]]=m[2]});X.arr[a.name]=o}else X.arr[a.name]=items}delete X.env[a.name];return}
 const val=bExpW(X,v,io,'s');
 if(a.idx!==null){let arr=X.arr[a.name];if(!arr){arr=X.arr[a.name]=[];}const k=Array.isArray(arr)?bArith(X,a.idx):bExpW(X,a.idx,io,'s');arr[k]=a.app?(arr[k]||'')+val:val;return}
 let nv=val;if(X.ints&&X.ints[a.name])nv=String(bArith(X,val));if(a.app){const old=bGet(X,a.name);nv=X.ints&&X.ints[a.name]?String((+old||0)+(+nv||0)):old+nv}
 if(X.arr[a.name]&&Array.isArray(X.arr[a.name])&&!X.env[a.name]){X.arr[a.name][0]=nv;return}bSet(X,a.name,nv)}
function bSimple(X,n,io){bTick(X);if(n.ln)X.ln=n.ln;
 if(n.words.length>1&&/^(declare|local|typeset|readonly|export)$/.test(n.words[0])){const keep=[];const arrs=[];n.words.forEach((w,i)=>{const m=i>0&&/^([A-Za-z_]\w*)=\(([\s\S]*)\)$/.exec(w);if(m){arrs.push({name:m[1],val:'('+m[2]+')'});keep.push(m[1])}else keep.push(w)});if(arrs.length){const isA=n.words.some(w=>/^-\w*A/.test(w));n=Object.assign({},n,{words:keep});arrs.forEach(a=>{bAssign(X,{name:a.name,idx:null,val:a.val,app:false},io);if(isA&&Array.isArray(X.arr[a.name])&&!X.arr[a.name].length)X.arr[a.name]={}})}}
const argv=[];n.words.forEach(w=>argv.push(...bExpW(X,w,io,'f')));const r=bRedir(X,n.redirs,io);if(!r)return 1;
 if(!argv.length){n.assigns.forEach(a=>bAssign(X,a,io));return n.assigns.some(a=>/\$\(|`/.test(a.val))?X.last:0}
 const saved={};n.assigns.forEach(a=>{saved[a.name]=X.env[a.name];bAssign(X,a,io)});
 try{return bCmd(X,argv,r)}finally{n.assigns.forEach(a=>{if(saved[a.name]===undefined)delete X.env[a.name];else X.env[a.name]=saved[a.name]})}}
function sxNetCode(name,o){if(name==='ping')return/Ответ от|Reply from|bytes from|time=/.test(o)&&!/потеряно 4|100% loss|100% потер/.test(o)?0:1;if(/nslookup|dig|host/.test(name))return/не найден|NXDOMAIN|can't find|не удалось/i.test(o)?1:0;if(/curl|wget/.test(name))return/не удалось|refused|timed out|unreach|недоступ|ошибка|failed|не отвечает|отказ/i.test(o)?7:0;return 0}
function bCall(X,name,args,io){X.pos2=X.pos;const sv=X.pos;X.pos=[sv[0],...args];X.loc.push({});if(X.loc.length>60)throw new Error('слишком глубокая рекурсия');let c=0;try{c=bRunNode(X,X.funcs[name],io)}catch(e){if(e&&e.bx==='ret')c=e.n;else throw e}finally{X.loc.pop();X.pos=sv}return c}
function bScript(X,path,args,io,asSource){const f=sxNorm(X.cwd,path,X.home),n=X.fs[f];if(!n){io.err(`bash: ${path}: No such file or directory\n`);return 127}if(n.d){io.err(`bash: ${path}: Is a directory\n`);return 126}
 let src=String(n.c||'').replace(/\r/g,'');const sb=/^#!\s*(\S+)(?:\s+(\S+))?/.exec(src);if(sb&&!asSource&&!/(ba)?sh$|env$/.test(sb[1])){io.err(`bash: ${path}: интерпретатор ${sb[1]} не поддерживается (поддерживаются bash/sh, а PowerShell и cmd запускаются своими командами)\n`);return 126}
 if(asSource){try{return bRunList(X,bParse(src),io)}catch(e){if(e&&e.syn){io.err(`bash: ${path}: ${e.message}\n`);return 2}throw e}}
 const X2=Object.assign({},X,{sname:path,ln:1,pos:[path,...args],loc:[],funcs:{...X.funcs},env:{...X.env},arr:JSON.parse(JSON.stringify(X.arr)),opts:{},last:0,traps:{}});let c=0;
 try{c=bRunList(X2,bParse(src),io);if(X2.traps.EXIT){const t=X2.traps.EXIT;delete X2.traps.EXIT;bRunList(X2,bParse(t),io)}}catch(e){if(e&&e.bx==='exit')c=e.n;else if(e&&e.bx==='ret')c=e.n;else if(e&&e.syn){io.err(`${path}: ${e.ln?'line '+e.ln+': ':''}${e.message}\n`);c=2}else if(e&&e.bx){c=0}else throw e}finally{X.steps=X2.steps;X.vt=X2.vt}return c}
function bCmd(X,argv,io){const name=argv[0],a=argv.slice(1);if(X.opts.x)X.err('+ '+argv.join(' ')+'\n');
 if(name&&name.includes('/')&&!X.funcs[name]&&!BB[name]){const nn=X.fs[sxNorm(X.cwd,name,X.home)];if(nn&&!nn.d&&nn.m!==undefined&&!(nn.m&0o111)){io.err(`${X.sname?X.sname+': line '+(X.ln||1)+': ':'bash: '}${name}: Permission denied\n`);return 126}}
 if(X.funcs[name])return bCall(X,name,a,io);
 if(BB[name]){try{return BB[name](X,a,io)||0}catch(e){if(e&&(e.bx||e.syn))throw e;io.err(`bash: ${name}: ${e.message}\n`);return 1}}
 if(name==='git'){const c=gitRun(X.d,X.cwd,a,io);return c}
 if(name==='ci'&&typeof nciCmd==='function'){const t=nciCmd(X.d,a);io.out(t+'\n');return/не найден|Неизвестная|Использование|Файл не найден|✘|нет такой|Нет такой/.test(t)?1:0}
 if(SXNET.includes(name)){let ln=argv.join(' ');if(/^(ping|tracert|traceroute|tracepath)$/.test(name)){const vs=/^(-c|-W|-w|-i|-s|-t|-I|-m|-n|\/n|\/w|\/l|\/i|\/t)$/i;let tg=null;for(let i=1;i<argv.length;i++){const x=argv[i];if(/^(-[cWwistIm]|\/[nwli])$/i.test(x)&&(x==='-c'||x==='-W'||x==='-w'||x==='-i'||x==='-s'||x==='-t'||x==='-I'||x==='-m'||/^\/[nwli]$/i.test(x))){i++;continue}if(/^[-\/]/.test(x))continue;tg=x;break}ln=name+(tg?' '+tg:'')}const o=sxNet(X.d,ln);io.out(o.endsWith('\n')||!o?o:o+'\n');return sxNetCode(name,o)}
 if(name.includes('/')){return bScript(X,name,a,io)}
 io.err(X.sname?`${X.sname}: line ${X.ln||1}: ${name}: command not found\n`:`bash: ${name}: command not found\n`);return 127}
// ---------- вспомогательные ----------
const bEsc=s=>{let o='';for(let i=0;i<s.length;i++){if(s[i]!=='\\'){o+=s[i];continue}const c=s[++i];if(c==='n')o+='\n';else if(c==='t')o+='\t';else if(c==='r')o+='\r';else if(c==='\\')o+='\\';else if(c==='a')o+='\x07';else if(c==='e')o+='\x1b';else if(c==='c')return o;else if(c==='0'){const m=/^[0-7]{1,3}/.exec(s.slice(i+1));if(m){o+=String.fromCharCode(parseInt(m[0],8));i+=m[0].length}else o+='\0'}else if(c==='x'){const m=/^[0-9a-fA-F]{1,2}/.exec(s.slice(i+1));if(m){o+=String.fromCharCode(parseInt(m[0],16));i+=m[0].length}else o+='\\x'}else o+='\\'+(c===undefined?'':c)}return o};
function bPrintf(fmt,args){let ai=0,out='';const next=()=>ai<args.length?args[ai++]:undefined;
 const once=()=>{let used=false,o='';for(let i=0;i<fmt.length;i++){const c=fmt[i];if(c==='\\'){const m=/^\\(?:[0-7]{1,3}|x[0-9a-fA-F]{1,2}|.)/.exec(fmt.slice(i));o+=bEsc(m[0]);i+=m[0].length-1;continue}
   if(c!=='%'){o+=c;continue}if(fmt[i+1]==='%'){o+='%';i++;continue}const m=/^%([-+ 0#]*)(\d+|\*)?(?:\.(\d+|\*))?([sdiouxXfeEgGcb])/.exec(fmt.slice(i));if(!m){o+=c;continue}i+=m[0].length-1;
   let w=m[2]==='*'?+next():m[2]?+m[2]:0,pr=m[3]==='*'?+next():m[3]!==undefined?+m[3]:null;const fl=m[1],cv=m[4];used=true;let v=next();let s;
   if(cv==='s'){s=v===undefined?'':String(v);if(pr!==null)s=s.slice(0,pr)}else if(cv==='b'){s=bEsc(v===undefined?'':String(v))}else if(cv==='c'){s=v===undefined?'':String(v)[0]}
   else if(cv==='d'||cv==='i'){let x=v===undefined?0:parseInt(v,/^0x/i.test(v)?16:10);if(isNaN(x))x=0;s=String(x);if(fl.includes('+')&&x>=0)s='+'+s}
   else if(cv==='u'||cv==='o'||cv==='x'||cv==='X'){let x=v===undefined?0:parseInt(v,10);if(isNaN(x))x=0;s=cv==='o'?x.toString(8):cv==='u'?String(x):x.toString(16);if(cv==='X')s=s.toUpperCase();if(fl.includes('#')&&cv!=='u'&&cv!=='o')s=(cv==='x'?'0x':'0X')+s}
   else{let x=v===undefined?0:parseFloat(v);if(isNaN(x))x=0;s=cv==='f'?x.toFixed(pr===null?6:pr):cv==='e'||cv==='E'?x.toExponential(pr===null?6:pr):String(+x.toPrecision(pr||6));if(fl.includes('+')&&x>=0)s='+'+s}
   if(s.length<w){if(fl.includes('-'))s=s.padEnd(w);else if(fl.includes('0')&&cv!=='s')s=(/^[-+]/.test(s)?s[0]:'')+s.replace(/^[-+]/,'').padStart(w-(/^[-+]/.test(s)?1:0),'0');else s=s.padStart(w)}o+=s}return{o,used}};
 do{const r=once();out+=r.o;if(!r.used)break}while(ai<args.length);return out}
function bre2js(p,ere){const cls=x=>x.replace(/\[:alpha:\]/g,'a-zA-Z').replace(/\[:digit:\]/g,'0-9').replace(/\[:alnum:\]/g,'a-zA-Z0-9').replace(/\[:space:\]/g,'\\s').replace(/\[:upper:\]/g,'A-Z').replace(/\[:lower:\]/g,'a-z').replace(/\[:punct:\]/g,'!-\\/:-@\\[-`{-~');
 if(ere)return cls(p);let o='',inb=false;for(let i=0;i<p.length;i++){const c=p[i];if(inb){o+=c;if(c===']')inb=false;continue}if(c==='['){inb=true;o+=c;if(p[i+1]==='^'){o+='^';i++}if(p[i+1]===']'){o+='\\]';i++}continue}
  if(c==='\\'){const n=p[i+1];if(n&&'(){}|+?'.includes(n)){o+=n;i++}else{o+=c+(n||'');i++}}else if('(){}|+?'.includes(c))o+='\\'+c;else o+=c}return cls(o)}
function bFl(a,withVal){const f={},v={},r=[];for(let i=0;i<a.length;i++){const x=a[i];if(x==='--'){r.push(...a.slice(i+1));break}
  if(/^--[\w-]+/.test(x)){const m=/^--([\w-]+)(?:=([\s\S]*))?$/.exec(x);f[m[1]]=1;if(m[2]!==undefined)v[m[1]]=m[2];continue}
  if(x.length>1&&x[0]==='-'&&!/^-\d/.test(x)){for(let k=1;k<x.length;k++){const ch=x[k];if(withVal&&withVal.includes(ch)){const rest=x.slice(k+1);v[ch]=rest!==''?rest:a[++i];f[ch]=1;break}f[ch]=1}continue}r.push(x)}return{f,v,r}}
const bInp=(X,io,files,cmd)=>{if(files.length===0){const q=io.inp;if(!q)return[{n:'-',t:''}];const t=q.t.slice(q.p);q.p=q.t.length;return[{n:'-',t}]}
 return files.map(f=>{if(f==='-'){const q=io.inp;const t=q?q.t.slice(q.p):'';if(q)q.p=q.t.length;return{n:'-',t}}const p=sxNorm(X.cwd,f,X.home),n=X.fs[p];if(!n){io.err(`${cmd}: ${f}: No such file or directory\n`);return{n:f,err:1}}if(n.d){io.err(`${cmd}: ${f}: Is a directory\n`);return{n:f,err:1}}return{n:f,t:n.c||''}})};
const bLinesOf=t=>{if(t==='')return[];const l=t.split('\n');if(l[l.length-1]==='')l.pop();return l};
const bDate=(X,fmt,ts)=>{const d=new Date((ts||Date.now())+X.vt*1000),p=(n,w)=>String(n).padStart(w||2,'0'),D=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],M=['January','February','March','April','May','June','July','August','September','October','November','December'];
 if(!fmt)return`${D[d.getDay()].slice(0,3)} ${M[d.getMonth()].slice(0,3)} ${String(d.getDate()).padStart(2,' ')} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())} ${d.getFullYear()}`;
 return fmt.replace(/%([a-zA-Z%])/g,(m,c)=>({Y:d.getFullYear(),m:p(d.getMonth()+1),d:p(d.getDate()),H:p(d.getHours()),M:p(d.getMinutes()),S:p(d.getSeconds()),y:p(d.getFullYear()%100),j:p(Math.floor((d-new Date(d.getFullYear(),0,0))/864e5),3),A:D[d.getDay()],a:D[d.getDay()].slice(0,3),B:M[d.getMonth()],b:M[d.getMonth()].slice(0,3),s:Math.floor(d/1000),F:`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`,T:`${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`,e:String(d.getDate()).padStart(2,' '),u:d.getDay()||7,w:d.getDay(),Z:'MSK',z:'+0300','%':'%',n:'\n',t:'\t'}[c]??m))};

function bLit(p){if(typeof p!=='string')return p;const g=t=>t.replace(/[*?]/g,'[$&]').replace(/\[(?!\*\]|\?\])/g,'[[]');return p.replace(/\\([*?\[])/g,(m,c)=>c==='['?'[[]':'['+c+']').replace(/"([^"$`]*)"|'([^']*)'/g,(m,a,b)=>{const t=a!==undefined?a:b;return m[0]+t.replace(/[*?]/g,'[$&]')+m[0]})}
