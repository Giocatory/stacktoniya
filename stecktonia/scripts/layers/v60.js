// ===== v60: расширение терминала: process substitution, mapfile, bc, jq, tar/gzip/zip, comm/join/paste/column, base64/xxd, ps/kill, ss/ip, du, tree и др.; визуализатор конвейера flow =====
// ---------- process substitution <(cmd) -> временный файл ----------
let bPsN=0;
function bPsub(src){if(!/<\(/.test(src))return src;let o='',i=0,q=null;
 while(i<src.length){const c=src[i];
  if(q){o+=c;if(c==='\\'&&q==='"'){o+=src[++i]||'';}else if(c===q)q=null;i++;continue}
  if(c==="'"||c==='"'){q=c;o+=c;i++;continue}
  if(c==='<'&&src[i+1]==='('&&src[i-1]!=='<'){let d=1,j=i+2;while(j<src.length&&d>0){if(src[j]==='(')d++;else if(src[j]===')')d--;j++}const inner=src.slice(i+2,j-1),f='/tmp/.ps'+(++bPsN);o+='$({ '+bPsub(inner)+' ; } > '+f+' ; echo '+f+')';i=j;continue}
  o+=c;i++}
 return o}
// flow без кавычек: flow cat a | sort  ->  flow 'cat a | sort'
const bFlowQ=src=>/(^|\n)\s*flow\s/.test(src)?src.split('\n').map(l=>{const m=/^(\s*)flow\s+(?!['"])(.+)$/.exec(l);return m?m[1]+"flow '"+m[2].replace(/'/g,"'\\''")+"'":l}).join('\n'):src;
{const _bp=bParse;bParse=function(src){return _bp(bPsub(bFlowQ(src)))}}
// ---------- вспомогательное ----------
const vtFiles=(X,paths)=>{const out=[],walk=(p,rel)=>{const n=X.fs[p];if(!n)return;if(n.d){out.push({rel:rel+'/',d:1});sxLs(X.fs,p).forEach(x=>walk((p==='/'?'':p)+'/'+x,rel+'/'+x))}else out.push({rel,c:n.c||'',m:n.m})};
 paths.forEach(a=>{const p=bAbs(X,a);if(!X.fs[p]){X.err(`${a}: Cannot stat: No such file or directory\n`);return}walk(p,a.replace(/^\.\//,'').replace(/\/$/,''))});return out};
const vtHuman=b=>b<1024?b+'':b<10240?(Math.round(b/102.4)/10).toFixed(1)+'K':b<1048576?(Math.max(.1,Math.round(b/102.4)/10)+'K'):(Math.round(b/104857.6)/10+'M');
const vtMk=(X,path,c)=>{const p=bAbs(X,path);sxMk(X.fs,p.slice(0,p.lastIndexOf('/'))||'/',true);X.fs[p]={c}};
const vtArc=(kind,z,files)=>'\u0001NLARC\u0001'+JSON.stringify({kind,z,files});
const vtParse=t=>{if(!t||!t.startsWith('\u0001NLARC\u0001'))return null;try{return JSON.parse(t.slice(7))}catch(e){return null}};
// ---------- bc ----------
function vtBc(src,lib){const V={scale:lib?20:0},out=[];
 const num=(v,s)=>({v,s}),trunc=(x,s)=>{const k=Math.pow(10,s);return Math.trunc(x*k+(x<0?-1e-9:1e-9))/k};
 const fmt=r=>{let t=trunc(r.v,r.s).toFixed(r.s);if(/^-?0\./.test(t))t=t.replace('0.','.');return t};
 const stmts=src.split(/[\n;]/).map(s=>s.trim()).filter(Boolean);
 for(const st of stmts){let i=0;const s=st;const ws=()=>{while(s[i]===' ')i++};
  const pe=()=>{let l=pa();ws();while(s[i]==='+'||s[i]==='-'){const op=s[i++];const r=pa();l=num(op==='+'?l.v+r.v:l.v-r.v,Math.max(l.s,r.s));ws()}return l};
  const pa=()=>{let l=pm();ws();while(s[i]==='*'||s[i]==='/'||s[i]==='%'){const op=s[i++];const r=pm();if(op==='*')l=num(l.v*r.v,Math.min(l.s+r.s,Math.max(V.scale,l.s,r.s)));else if(op==='/'){if(r.v===0)throw new Error('Runtime error (func=(main), adr=0): Divide by zero');l=num(trunc(l.v/r.v,V.scale),V.scale)}else{if(r.v===0)throw new Error('Runtime error: Divide by zero');l=num(l.v-trunc(l.v/r.v,V.scale)*r.v,Math.max(l.s,r.s+V.scale))}ws()}return l};
  const pm=()=>{let b=pu();ws();if(s[i]==='^'){i++;const e=pm();b=num(Math.pow(b.v,Math.trunc(e.v)),Math.min(b.s*Math.abs(Math.trunc(e.v)),Math.max(V.scale,b.s)))}return b};
  const pu=()=>{ws();if(s[i]==='-'){i++;const r=pu();return num(-r.v,r.s)}if(s[i]==='+'){i++;return pu()}return pt()};
  const pt=()=>{ws();if(s[i]==='('){i++;const r=pe();ws();i++;return r}
   let m=/^(\d*\.?\d*)/.exec(s.slice(i));if(m&&m[1]&&/\d/.test(m[1])){i+=m[1].length;return num(parseFloat(m[1]),(m[1].split('.')[1]||'').length)}
   m=/^([a-z_]\w*)/.exec(s.slice(i));if(m){i+=m[1].length;ws();if(s[i]==='('){i++;const a=pe();ws();i++;if(m[1]==='sqrt'){if(a.v<0)throw new Error('Runtime error: square root of negative number');return num(trunc(Math.sqrt(a.v),Math.max(V.scale,a.s)),Math.max(V.scale,a.s))}if(m[1]==='length')return num(String(a.v).replace(/[-.]/g,'').length,0);if(m[1]==='s')return num(trunc(Math.sin(a.v),V.scale),V.scale);if(m[1]==='c')return num(trunc(Math.cos(a.v),V.scale),V.scale);if(m[1]==='l')return num(trunc(Math.log(a.v),V.scale),V.scale);if(m[1]==='e')return num(trunc(Math.exp(a.v),V.scale),V.scale);if(m[1]==='a')return num(trunc(Math.atan(a.v),V.scale),V.scale);throw new Error('Function '+m[1]+' not defined')}
    if(m[1]==='scale')return num(V.scale,0);return V[m[1]]||num(0,0)}
   throw new Error('syntax error')};
  const as=/^([a-z_]\w*)\s*=\s*(.+)$/.exec(s);
  if(as){i=0;const sub=as[2];const r=vtBc2(sub,V);if(as[1]==='scale')V.scale=Math.max(0,Math.trunc(r.v));else V[as[1]]=r;continue}
  const r=pe();out.push(fmt(r))}
 return out.join('\n')}
function vtBc2(expr,V){const r=vtBc(expr.replace(/^/,''),false);return{v:parseFloat(r)||0,s:(r.split('.')[1]||'').length}}
// ---------- jq ----------
function vtJq(prog,input,opt){
 const tok=[];{let i=0;const s=prog;while(i<s.length){const c=s[i];if(/\s/.test(c)){i++;continue}
  if(c==='"'){let j=i+1,t='';while(j<s.length&&s[j]!=='"'){if(s[j]==='\\'){j++;t+={n:'\n',t:'\t'}[s[j]]||s[j]}else t+=s[j];j++}tok.push({t:'s',v:t});i=j+1;continue}
  let m=/^(==|!=|<=|>=|\.\.|[|,\[\](){}:.<>+\-*\/])/.exec(s.slice(i));if(m){tok.push({t:'p',v:m[1]});i+=m[1].length;continue}
  m=/^\d+(\.\d+)?/.exec(s.slice(i));if(m){tok.push({t:'n',v:+m[0]});i+=m[0].length;continue}
  m=/^[A-Za-z_]\w*/.exec(s.slice(i));if(m){tok.push({t:'w',v:m[0]});i+=m[0].length;continue}throw new Error('jq: error: syntax error near '+s.slice(i,i+8))}}
 let p=0;const pk=()=>tok[p],nx=()=>tok[p++],isP=v=>pk()&&pk().t==='p'&&pk().v===v;
 const pPipe=()=>{let l=pComma();while(isP('|')){nx();l={k:'pipe',a:l,b:pComma()}}return l};
 const pComma=()=>{let l=pOr();while(isP(',')){nx();l={k:'comma',a:l,b:pOr()}}return l};
 const pOr=()=>{let l=pAnd();while(pk()&&pk().t==='w'&&pk().v==='or'){nx();l={k:'or',a:l,b:pAnd()}}return l};
 const pAnd=()=>{let l=pCmp();while(pk()&&pk().t==='w'&&pk().v==='and'){nx();l={k:'and',a:l,b:pCmp()}}return l};
 const pCmp=()=>{let l=pAdd();if(pk()&&pk().t==='p'&&/^(==|!=|<=|>=|<|>)$/.test(pk().v)){const op=nx().v;l={k:'cmp',op,a:l,b:pAdd()}}return l};
 const pAdd=()=>{let l=pPost();while(pk()&&pk().t==='p'&&/^[+\-*\/]$/.test(pk().v)){const op=nx().v;l={k:'ar',op,a:l,b:pPost()}}return l};
 const pPost=()=>{let t=pTerm();for(;;){if(isP('.')&&tok[p+1]&&tok[p+1].t==='w'){nx();t={k:'pipe',a:t,b:{k:'idx',key:nx().v}}}else if(isP('[')){nx();if(isP(']')){nx();t={k:'pipe',a:t,b:{k:'each'}}}else{const e=pPipe();nx();t={k:'pipe',a:t,b:{k:'idxe',e}}}}else break}return t};
 const pTerm=()=>{const t=nx();if(!t)throw new Error('jq: error: unexpected end');
  if(t.t==='p'){
   if(t.v==='.'){if(pk()&&pk().t==='w'&&!/^(and|or)$/.test(pk().v)){return{k:'idx',key:nx().v}}if(pk()&&pk().t==='s')return{k:'idx',key:nx().v};if(isP('[')){nx();if(isP(']')){nx();return{k:'each'}}const e=pPipe();nx();return{k:'idxe',e}}return{k:'id'}}
   if(t.v==='..')return{k:'rec'};
   if(t.v==='('){const e=pPipe();nx();return e}
   if(t.v==='['){if(isP(']')){nx();return{k:'arr',e:null}}const e=pPipe();nx();return{k:'arr',e}}
   if(t.v==='{'){const ents=[];while(!isP('}')){let key;const a=nx();if(a.t==='w'||a.t==='s')key=a.v;else throw new Error('jq: error: object key');let val;if(isP(':')){nx();val=pOr()}else val={k:'idx',key};ents.push([key,val]);if(isP(','))nx()}nx();return{k:'obj',ents}}
   if(t.v==='-'){return{k:'neg',e:pPost()}}}
  if(t.t==='s')return{k:'lit',v:t.v};if(t.t==='n')return{k:'lit',v:t.v};
  if(t.t==='w'){if(t.v==='true')return{k:'lit',v:true};if(t.v==='false')return{k:'lit',v:false};if(t.v==='null')return{k:'lit',v:null};
   if(isP('(')){nx();const args=[];if(!isP(')')){args.push(pPipe());while(isP(';')){nx()}}nx();return{k:'fn',n:t.v,args}}
   return{k:'fn',n:t.v,args:[]}}
  throw new Error('jq: error: syntax error')};
 const ast=pPipe();if(p<tok.length)throw new Error('jq: error: syntax error');
 const tr=v=>!(v===false||v===null||v===undefined),cmp=(a,b)=>JSON.stringify(a)===JSON.stringify(b)?0:(typeof a==='number'&&typeof b==='number'||typeof a==='string'&&typeof b==='string')?(a<b?-1:1):String(JSON.stringify(a))<String(JSON.stringify(b))?-1:1;
 const ev=(n,v)=>{switch(n.k){
  case'id':return[v];case'rec':{const o=[],w=x=>{o.push(x);if(Array.isArray(x))x.forEach(w);else if(x&&typeof x==='object')Object.values(x).forEach(w)};w(v);return o}
  case'lit':return[n.v];case'idx':return[v===null||v===undefined?null:(typeof v==='object'?(v[n.key]===undefined?null:v[n.key]):(()=>{throw new Error('jq: error: Cannot index '+typeof v+' with "'+n.key+'"')})())];
  case'idxe':return ev(n.e,v).map(k=>Array.isArray(v)?(v[k<0?v.length+k:k]===undefined?null:v[k<0?v.length+k:k]):(v&&v[k]!==undefined?v[k]:null));
  case'each':if(Array.isArray(v))return v.slice();if(v&&typeof v==='object')return Object.values(v);throw new Error('jq: error: Cannot iterate over '+(v===null?'null':typeof v));
  case'pipe':return ev(n.a,v).flatMap(x=>ev(n.b,x));case'comma':return ev(n.a,v).concat(ev(n.b,v));
  case'arr':return[n.e?ev(n.e,v):[]];
  case'obj':{let rs=[{}];n.ents.forEach(([k,e])=>{const vs=ev(e,v);rs=rs.flatMap(o=>vs.map(x=>Object.assign({},o,{[k]:x})))});return rs}
  case'neg':return ev(n.e,v).map(x=>-x);
  case'cmp':return ev(n.a,v).flatMap(a=>ev(n.b,v).map(b=>{const c=cmp(a,b);return n.op==='=='?c===0:n.op==='!='?c!==0:n.op==='<'?c<0:n.op==='>'?c>0:n.op==='<='?c<=0:c>=0}));
  case'and':return ev(n.a,v).flatMap(a=>tr(a)?ev(n.b,v).map(tr):[false]);case'or':return ev(n.a,v).flatMap(a=>tr(a)?[true]:ev(n.b,v).map(tr));
  case'ar':return ev(n.a,v).flatMap(a=>ev(n.b,v).map(b=>{if(n.op==='+')return a===null?b:b===null?a:Array.isArray(a)?a.concat(b):typeof a==='object'&&typeof a!=='string'?Object.assign({},a,b):a+b;if(n.op==='-')return a-b;if(n.op==='*')return a*b;return a/b}));
  case'fn':{const a0=n.args[0];switch(n.n){
   case'length':return[v===null?0:typeof v==='number'?Math.abs(v):Array.isArray(v)||typeof v==='string'?v.length:Object.keys(v).length];
   case'keys':return[Array.isArray(v)?v.map((_,i)=>i):Object.keys(v).sort()];case'values':return[v];
   case'map':return[(Array.isArray(v)?v:Object.values(v)).flatMap(x=>ev(a0,x))];
   case'select':return ev(a0,v).filter(tr).map(()=>v);
   case'add':return[Array.isArray(v)?v.reduce((a,b)=>a===null?b:ev({k:'ar',op:'+',a:{k:'lit',v:a},b:{k:'lit',v:b}},null)[0],null):null];
   case'sort':return[v.slice().sort(cmp)];case'unique':return[v.slice().sort(cmp).filter((x,i,ar)=>i===0||cmp(x,ar[i-1])!==0)];case'reverse':return[Array.isArray(v)?v.slice().reverse():[...String(v)].reverse().join('')];
   case'first':return[v[0]===undefined?null:v[0]];case'last':return[v.length?v[v.length-1]:null];case'not':return[!tr(v)];
   case'tostring':return[typeof v==='string'?v:JSON.stringify(v)];case'tonumber':return[typeof v==='number'?v:parseFloat(v)];
   case'has':return ev(a0,v).map(k=>Array.isArray(v)?k<v.length:v!==null&&Object.prototype.hasOwnProperty.call(v,k));
   case'type':return[v===null?'null':Array.isArray(v)?'array':typeof v];case'empty':return[];
   case'sort_by':return[v.slice().sort((x,y)=>cmp(ev(a0,x)[0],ev(a0,y)[0]))];case'group_by':{const g={};v.forEach(x=>{const k=JSON.stringify(ev(a0,x)[0]);(g[k]=g[k]||[]).push(x)});return[Object.values(g)]};
   case'min':return[v.length?v.slice().sort(cmp)[0]:null];case'max':return[v.length?v.slice().sort(cmp)[v.length-1]:null];
   case'to_entries':return[Object.keys(v).map(k=>({key:k,value:v[k]}))];case'ascii_downcase':return[String(v).toLowerCase()];case'ascii_upcase':return[String(v).toUpperCase()];
   case'contains':return ev(a0,v).map(x=>typeof v==='string'?v.includes(x):JSON.stringify(v).includes(JSON.stringify(x)));
   default:throw new Error('jq: error: '+n.n+'/'+n.args.length+' is not defined')}}}
  throw new Error('jq: error: unsupported')};
 return ev(ast,input)}
// ---------- процессы ----------
const vtProcs=d=>{if(!d.procs)d.procs=[{pid:1,user:'root',cpu:0,mem:.3,cmd:'/sbin/init'},{pid:412,user:'root',cpu:0,mem:.2,cmd:'/usr/sbin/sshd -D'},{pid:430,user:'root',cpu:0,mem:.1,cmd:'/usr/sbin/cron -f'},{pid:1203,user:'student',cpu:0.1,mem:.2,cmd:'-bash'}];return d.procs};
// ---------- команды ----------
Object.assign(BB,{
 egrep:(X,a,io)=>BB.grep(X,['-E',...a],io),fgrep:(X,a,io)=>BB.grep(X,['-F',...a],io),
 mapfile:(X,a,io)=>{const {f,r}=bFl(a,'nuCcdO');const name=r[0]||'MAPFILE';let t=bInp(X,io,[],'mapfile')[0].t;let L=t===''?[]:t.split('\n');if(L.length&&L[L.length-1]==='')L.pop();if(!f.t)L=L.map(x=>x+'\n');X.arr[name]=L;delete X.env[name];return 0},
 readarray:(X,a,io)=>BB.mapfile(X,a,io),
 bc:(X,a,io)=>{const {f,r}=bFl(a);let src=r.length?r.map(x=>{const n=X.fs[bAbs(X,x)];return n?n.c:x}).join('\n'):bInp(X,io,[],'bc')[0].t;try{const o=vtBc(src,f.l);if(o)io.out(o+'\n');return 0}catch(e){io.err('(standard_in) 1: '+e.message+'\n');return 1}},
 factor:(X,a,io)=>{const L=a.length?a:bLinesOf(bInp(X,io,[],'factor')[0].t).flatMap(x=>x.trim().split(/\s+/));L.forEach(s=>{let n=+s;if(!Number.isInteger(n)||n<1){io.err(`factor: ‘${s}’ is not a valid positive integer\n`);return}const o=[];let m=n;for(let p=2;p*p<=m;p++)while(m%p===0){o.push(p);m/=p}if(m>1||!o.length)o.push(m);io.out(n+': '+o.join(' ')+'\n')});return 0},
 base64:(X,a,io)=>{const {f,v,r}=bFl(a,'w');let t=bInp(X,io,r,'base64').map(x=>x.t).join('');
  if(f.d||f.decode){try{io.out(decodeURIComponent(escape(atob(t.replace(/\s+/g,'')))));}catch(e){io.err('base64: invalid input\n');return 1}return 0}
  const b=btoa(unescape(encodeURIComponent(t)));const w=v.w!==undefined?+v.w:76;io.out(w>0?b.replace(new RegExp('(.{'+w+'})','g'),'$1\n').replace(/\n$/,'')+'\n':b+'\n');return 0},
 xxd:(X,a,io)=>{const {r}=bFl(a);const t=bInp(X,io,r,'xxd').map(x=>x.t).join('');const B=[...new TextEncoder().encode(t)];for(let i=0;i<B.length;i+=16){const ch=B.slice(i,i+16),h=[];for(let k=0;k<16;k+=2)h.push(ch.slice(k,k+2).map(x=>x.toString(16).padStart(2,'0')).join(''));io.out(i.toString(16).padStart(8,'0')+': '+h.join(' ').padEnd(39)+'  '+ch.map(x=>x>=32&&x<127?String.fromCharCode(x):'.').join('')+'\n')}return 0},
 hexdump:(X,a,io)=>BB.xxd(X,a.filter(x=>x!=='-C'),io),
 od:(X,a,io)=>{const {f,v,r}=bFl(a,'tNAj');const B=[...new TextEncoder().encode(bInp(X,io,r,'od').map(x=>x.t).join(''))];const asc=v.t==='c'||f.c;for(let i=0;i<B.length;i+=16){const ch=B.slice(i,i+16);io.out((f.A||v.A==='n'?'':i.toString(8).padStart(7,'0')+' ')+ch.map(x=>asc?(x===10?' \\n':x>=32&&x<127?'  '+String.fromCharCode(x):' '+x.toString(8).padStart(3,'0')):' '+x.toString(16).padStart(2,'0')).join('')+'\n')}return 0},
 strings:(X,a,io)=>{const {r}=bFl(a);bInp(X,io,r,'strings').forEach(x=>{if(!x.err)(x.t.match(/[\x20-\x7e]{4,}/g)||[]).forEach(s=>io.out(s+'\n'))});return 0},
 file:(X,a,io)=>{a.filter(x=>x[0]!=='-').forEach(x=>{const p=bAbs(X,x),n=X.fs[p];io.out(x+': '+(!n?'cannot open (No such file or directory)':n.d?'directory':!(n.c||'')?'empty':vtParse(n.c)?(vtParse(n.c).z?'gzip compressed data':vtParse(n.c).kind==='zip'?'Zip archive data':'POSIX tar archive'):/^#!.*(ba)?sh/.test(n.c)?'Bourne-Again shell script, ASCII text executable':/^[\x09\x0a\x0d\x20-\x7e\u0400-\u04ff]*$/.test(n.c)?'ASCII text':'data')+'\n')});return 0},
 comm:(X,a,io)=>{const f={},r=[];a.forEach(x=>{if(/^-[123]+$/.test(x))x.slice(1).split('').forEach(c=>f[c]=1);else r.push(x)});const [A,B]=bInp(X,io,r.slice(0,2),'comm').map(x=>bLinesOf(x.t||''));let i=0,j=0;const o=[];while(i<A.length||j<B.length){if(j>=B.length||(i<A.length&&A[i]<B[j])){if(!f[1])o.push(A[i]);i++}else if(i>=A.length||B[j]<A[i]){if(!f[2])o.push((f[1]?'':'\t')+B[j]);j++}else{if(!f[3])o.push((f[1]?'':'\t')+(f[2]?'':'\t')+A[i]);i++;j++}}if(o.length)io.out(o.join('\n')+'\n');return 0},
 join:(X,a,io)=>{const {v,r}=bFl(a,'t12');const sep=v.t!==undefined?v.t:/\s+/,k1=(+v[1]||1)-1,k2=(+v[2]||1)-1;const [A,B]=bInp(X,io,r.slice(0,2),'join').map(x=>bLinesOf(x.t||'').map(l=>l.split(sep)));const o=[];A.forEach(x=>B.forEach(y=>{if(x[k1]===y[k2])o.push([x[k1],...x.filter((_,i)=>i!==k1),...y.filter((_,i)=>i!==k2)].join(v.t!==undefined?v.t:' '))}));if(o.length)io.out(o.join('\n')+'\n');return 0},
 paste:(X,a,io)=>{const {f,v,r}=bFl(a,'d');const d=v.d!==undefined?v.d:'\t';const F=bInp(X,io,r,'paste').map(x=>bLinesOf(x.t||''));if(f.s){F.forEach(L=>io.out(L.join(d)+'\n'));return 0}const n=Math.max(0,...F.map(x=>x.length));for(let i=0;i<n;i++)io.out(F.map(x=>x[i]===undefined?'':x[i]).join(d)+'\n');return 0},
 column:(X,a,io)=>{const {f,v,r}=bFl(a,'so');const L=bLinesOf(bInp(X,io,r,'column').map(x=>x.t).join(''));if(!f.t){io.out(L.join('\n')+'\n');return 0}const sep=v.s!==undefined?new RegExp('['+v.s.replace(/[\]\\^-]/g,'\\$&')+']'):/\s+/;const rows=L.map(l=>l.split(sep));const w=[];rows.forEach(rw=>rw.forEach((c,i)=>w[i]=Math.max(w[i]||0,[...c].length)));rows.forEach(rw=>io.out(rw.map((c,i)=>i===rw.length-1?c:c+' '.repeat(w[i]-[...c].length)).join('  ')+'\n'));return 0},
 fold:(X,a,io)=>{const {f,v,r}=bFl(a,'w');const w=+v.w||80;bLinesOf(bInp(X,io,r,'fold').map(x=>x.t).join('')).forEach(l=>{if(!l){io.out('\n');return}for(let i=0;i<l.length;i+=w)io.out(l.slice(i,i+w)+'\n')});return 0},
 shuf:(X,a,io)=>{const {f,v,r}=bFl(a,'ni');let L;if(v.i){const m=/^(\d+)-(\d+)$/.exec(v.i);if(!m){io.err('shuf: invalid input range\n');return 1}L=[];for(let k=+m[1];k<=+m[2];k++)L.push(String(k))}else L=bLinesOf(bInp(X,io,r,'shuf').map(x=>x.t).join(''));for(let i=L.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[L[i],L[j]]=[L[j],L[i]]}if(v.n)L=L.slice(0,+v.n);if(L.length)io.out(L.join('\n')+'\n');return 0},
 cal:(X,a,io)=>{const now=new Date(X.d&&X.d.vtime?X.d.vtime:Date.now());let m=now.getMonth()+1,y=now.getFullYear();const n=a.filter(x=>/^\d+$/.test(x)).map(Number);if(n.length===1)y=n[0];if(n.length>=2){m=n[0];y=n[1]}const names=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];const first=(new Date(y,m-1,1).getDay()+6)%7,days=new Date(y,m,0).getDate();const t=names[m-1]+' '+y;io.out(' '.repeat(Math.max(0,Math.floor((20-t.length)/2)))+t+'\nПн Вт Ср Чт Пт Сб Вс\n');let line='   '.repeat(first);for(let dd=1;dd<=days;dd++){line+=String(dd).padStart(2)+' ';if((first+dd)%7===0){io.out(line.trimEnd()+'\n');line=''}}if(line.trim())io.out(line.trimEnd()+'\n');return 0},
 realpath:(X,a,io)=>{a.filter(x=>x[0]!=='-').forEach(x=>io.out(bAbs(X,x)+'\n'));return 0},readlink:(X,a,io)=>{a.filter(x=>x[0]!=='-').forEach(x=>{const n=X.fs[bAbs(X,x)];io.out((n&&n.lnk?n.lnk:bAbs(X,x))+'\n')});return 0},
 ln:(X,a,io)=>{const {f,r}=bFl(a);if(r.length<2){io.err('ln: missing file operand\n');return 1}const src=bAbs(X,r[0]),n=X.fs[src]||{c:''};if(!X.fs[src]&&!f.s){io.err(`ln: failed to access '${r[0]}': No such file or directory\n`);return 1}X.fs[bAbs(X,r[1])]=Object.assign({},n,{lnk:f.s?r[0]:undefined});return 0},
 nohup:(X,a,io)=>bCmd(X,a,io),less:(X,a,io)=>BB.cat(X,a,io),more:(X,a,io)=>BB.cat(X,a,io),
 time:(X,a,io)=>{const c=bCmd(X,a,io);io.err('\nreal\t0m0.002s\nuser\t0m0.001s\nsys\t0m0.001s\n');return c},
 timeout:(X,a,io)=>{const {r}=bFl(a);const lim=parseFloat(r[0]),cmd=r.slice(1);if(!cmd.length){io.err('timeout: missing operand\n');return 125}if(cmd[0]==='sleep'&&parseFloat(cmd[1])>lim)return 124;return bCmd(X,cmd,io)},
 tree:(X,a,io)=>{const p=bAbs(X,a.filter(x=>x[0]!=='-')[0]||'.');if(!X.fs[p]){io.err(`${a[0]} [error opening dir]\n`);return 2}let nd=0,nf=0;io.out((a.filter(x=>x[0]!=='-')[0]||'.')+'\n');const rec=(q,pre)=>{const names=sxLs(X.fs,q).filter(x=>!x.startsWith('.'));names.forEach((x,i)=>{const last=i===names.length-1,c=(q==='/'?'':q)+'/'+x,isd=X.fs[c]&&X.fs[c].d;io.out(pre+(last?'└── ':'├── ')+x+'\n');if(isd){nd++;rec(c,pre+(last?'    ':'│   '))}else nf++})};rec(p,'');io.out(`\n${nd} directories, ${nf} files\n`);return 0},
 du:(X,a,io)=>{const {f,r}=bFl(a);const sz=p=>{const n=X.fs[p];if(!n)return 0;if(!n.d)return Math.ceil(bBytes(n.c||'')/4096)*4096;return 4096+sxLs(X.fs,p).reduce((s,x)=>s+sz((p==='/'?'':p)+'/'+x),0)};const fm=b=>f.h?vtHuman(b):String(Math.max(4,Math.ceil(b/1024)));
  (r.length?r:['.']).forEach(x=>{const p=bAbs(X,x);if(!X.fs[p]){io.err(`du: cannot access '${x}': No such file or directory\n`);return}if(f.s||!X.fs[p].d)io.out(fm(sz(p))+'\t'+x+'\n');else{const rec=(q,l)=>{sxLs(X.fs,q).forEach(c=>{const cp=(q==='/'?'':q)+'/'+c;if(X.fs[cp].d)rec(cp,l+'/'+c)});io.out(fm(sz(q))+'\t'+l+'\n')};rec(p,x)}});return 0},
 ps:(X,a,io)=>{const P=vtProcs(X.d),{f,r}=bFl(a);const full=f.a||f.e||f.u||f.f||/aux|ef|-A/.test(a.join(' '))||a.includes('aux')||a.includes('-ef');const all=a.some(x=>/^(aux|-?ef|-?e|-A|-?ax|-aux)$/.test(x))||full;
  if(a.some(x=>/^(aux|-aux|u|ax)$/.test(x))){io.out('USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\n');P.forEach(p=>io.out(p.user.padEnd(10)+String(p.pid).padStart(5)+' '+p.cpu.toFixed(1).padStart(4)+' '+p.mem.toFixed(1).padStart(4)+'  12345  6789 ?        S    10:00   0:00 '+p.cmd+'\n'));return 0}
  if(all){io.out('UID          PID  PPID  C STIME TTY          TIME CMD\n');P.forEach(p=>io.out(p.user.padEnd(8)+String(p.pid).padStart(8)+String(p.pid===1?0:1).padStart(6)+'  0 10:00 ?        00:00:00 '+p.cmd+'\n'));return 0}
  io.out('    PID TTY          TIME CMD\n');P.filter(p=>p.user==='student').forEach(p=>io.out(String(p.pid).padStart(7)+' pts/0    00:00:00 '+p.cmd.replace(/^-/,'')+'\n'));io.out(String(4000+P.length).padStart(7)+' pts/0    00:00:00 ps\n');return 0},
 top:(X,a,io)=>{const P=vtProcs(X.d).slice().sort((x,y)=>y.cpu-x.cpu);io.out(`top - 10:00:00 up 3 days,  1 user,  load average: ${(P.reduce((s,p)=>s+p.cpu,0)/100).toFixed(2)}, 0.05, 0.01\nTasks: ${P.length} total\n    PID USER      %CPU %MEM COMMAND\n`);P.forEach(p=>io.out(String(p.pid).padStart(7)+' '+p.user.padEnd(8)+p.cpu.toFixed(1).padStart(6)+p.mem.toFixed(1).padStart(5)+' '+p.cmd.split(' ')[0].split('/').pop()+'\n'));return 0},
 pgrep:(X,a,io)=>{const {f,r}=bFl(a);const P=vtProcs(X.d).filter(p=>(f.f?p.cmd:p.cmd.split(' ')[0].split('/').pop().replace(/^-/,'')).includes(r[0]||'\u0000'));if(!P.length)return 1;P.forEach(p=>io.out(f.l?p.pid+' '+p.cmd.split(' ')[0].split('/').pop()+'\n':p.pid+'\n'));return 0},
 pkill:(X,a,io)=>{const {f,r}=bFl(a,'s');const P=vtProcs(X.d),n=r[0]||'\u0000',hit=P.filter(p=>p.pid!==1&&p.cmd.split(' ')[0].split('/').pop().replace(/^-/,'').includes(n));if(!hit.length)return 1;X.d.procs=P.filter(p=>!hit.includes(p));return 0},
 kill:(X,a,io)=>{const {r}=bFl(a.filter(x=>!/^-\d+$|^-[A-Z]+$/.test(x)));const P=vtProcs(X.d);let c=0;r.forEach(s=>{const pid=+s,pr=P.find(p=>p.pid===pid);if(!pr){io.err(`bash: kill: (${s}) - No such process\n`);c=1;return}if(pid===1){io.err('bash: kill: (1) - Operation not permitted\n');c=1;return}X.d.procs=vtProcs(X.d).filter(p=>p.pid!==pid)});return c},
 ss:(X,a,io)=>{const d=X.d,u=a.join(' ').includes('u'),svc=(d.svc||[]).filter(s=>u?s.p==='udp':s.p==='tcp');io.out('State   Recv-Q  Send-Q   Local Address:Port    Peer Address:Port\n');svc.forEach(s=>io.out('LISTEN  0       128            0.0.0.0:'+String(s.n).padEnd(10)+'0.0.0.0:*\n'));return 0},
 ip:(X,a,io)=>{const d=X.d,w=a.join(' ');if(/^(-br\s+)?(a|addr|address)/.test(w)){d.ifaces.forEach((f,i)=>{if(/-br/.test(w))io.out(f.n.padEnd(10)+(f.off?'DOWN':'UP').padEnd(8)+(f.ip?f.ip+'/'+vcLen(f.mask):'')+'\n');else{io.out(`${i+1}: ${f.n}: <BROADCAST,MULTICAST,${f.off?'':'UP,LOWER_UP'}> mtu 1500 state ${f.off?'DOWN':'UP'}\n    link/ether ${d.mac}\n`+(f.ip?`    inet ${f.ip}/${vcLen(f.mask)} scope global ${f.n}\n`:''))}});return 0}
  if(/^(r|route)/.test(w)){(d.routes||[]).forEach(r=>io.out((r.net==='0.0.0.0'?'default':r.net+'/'+vcLen(r.mask))+' via '+r.nh+'\n'));if(d.gw)io.out('default via '+d.gw+'\n');d.ifaces.forEach(f=>{if(f.ip&&f.mask)io.out(vcNetOf(f.ip,f.mask)+'/'+vcLen(f.mask)+' dev '+f.n+' proto kernel scope link src '+f.ip+'\n')});return 0}
  io.err('Usage: ip [ -br ] address | route\n');return 1},
 envsubst:(X,a,io)=>{const t=bInp(X,io,[],'envsubst')[0].t;io.out(t.replace(/\$\{?([A-Za-z_]\w*)\}?/g,(m,n)=>bGet(X,n)));return 0},
 jq:(X,a,io)=>{const {f,r}=bFl(a);const prog=r[0];if(prog===undefined){io.err('Usage: jq [OPTIONS] FILTER [FILE...]\n');return 2}const txt=bInp(X,io,r.slice(1),'jq').map(x=>x.t).join('\n');let data;try{data=txt.trim()?txt.trim().split(/\n(?=[{\[])/).length>1&&!/^\s*[\[{][\s\S]*[\]}]\s*$/.test(txt.trim().split('\n').join(''))?JSON.parse(txt):JSON.parse(txt):null}catch(e){io.err('jq: error (at <stdin>:0): '+e.message+'\n');return 2}
  try{const out=vtJq(prog,data);out.forEach(x=>io.out((f.r&&typeof x==='string'?x:f.c?JSON.stringify(x):JSON.stringify(x,null,2))+'\n'));return f.e&&(!out.length||out[out.length-1]===null||out[out.length-1]===false)?1:0}catch(e){io.err(e.message+'\n');return 5}},
 tar:(X,a,io)=>{let ops='',file=null,dir=null,paths=[];for(let i=0;i<a.length;i++){const x=a[i];if(i===0&&!x.startsWith('-')&&/^[cxtvfzjC]+$/.test(x)){ops=x;if(/f/.test(x))file=a[++i];if(/C/.test(x))dir=a[++i];continue}
   if(/^-[cxtvzjf]+$/.test(x)){ops+=x.slice(1);if(/f/.test(x))file=a[++i];continue}if(x==='-C'){dir=a[++i];continue}if(x.startsWith('--file=')){file=x.slice(7);continue}if(x==='-f'){file=a[++i];continue}paths.push(x)}
  const v=/v/.test(ops),z=/z/.test(ops);if(!file){io.err('tar: Refusing to read archive contents from terminal (missing -f option?)\n');return 2}
  if(/c/.test(ops)){if(!paths.length){io.err('tar: Cowardly refusing to create an empty archive\n');return 2}const fl=vtFiles(X,paths),files={};fl.forEach(x=>{if(v)io.out(x.rel+(x.d?'':'')+'\n');if(x.d)files[x.rel]={d:1};else files[x.rel]={c:x.c,m:x.m}});vtMk(X,file,vtArc('tar',z,files));return 0}
  const n=X.fs[bAbs(X,file)];if(!n){io.err(`tar: ${file}: Cannot open: No such file or directory\n`);return 2}const A=vtParse(n.c);if(!A){io.err('tar: This does not look like a tar archive\n');return 2}
  if(/t/.test(ops)){Object.keys(A.files).forEach(k=>io.out(k+'\n'));return 0}
  if(/x/.test(ops)){const base=dir?bAbs(X,dir):X.cwd;Object.keys(A.files).forEach(k=>{if(v)io.out(k+'\n');const p=(base==='/'?'':base)+'/'+k.replace(/\/$/,'');if(A.files[k].d)sxMk(X.fs,p,true);else{sxMk(X.fs,p.slice(0,p.lastIndexOf('/'))||'/',true);X.fs[p]={c:A.files[k].c,m:A.files[k].m}}});return 0}
  io.err('tar: You must specify one of the -c, -t, -x options\n');return 2},
 gzip:(X,a,io)=>{const {f,r}=bFl(a);let c=0;r.forEach(x=>{const p=bAbs(X,x),n=X.fs[p];if(!n||n.d){io.err(`gzip: ${x}: No such file or directory\n`);c=1;return}if(f.d){const A=vtParse(n.c);if(!A||!x.endsWith('.gz')){io.err(`gzip: ${x}: not in gzip format\n`);c=1;return}X.fs[p.replace(/\.gz$/,'')]={c:A.files.data.c};if(!f.k)delete X.fs[p];return}X.fs[p+'.gz']={c:vtArc('gz',true,{data:{c:n.c||''}})};if(!f.k)delete X.fs[p]});return c},
 gunzip:(X,a,io)=>BB.gzip(X,['-d',...a],io),zcat:(X,a,io)=>{a.forEach(x=>{const n=X.fs[bAbs(X,x)],A=n&&vtParse(n.c);if(A&&A.files.data)io.out(A.files.data.c)});return 0},
 zip:(X,a,io)=>{const {f,r}=bFl(a);const out=r[0];if(!out||r.length<2){io.err('zip error: Nothing to do!\n');return 12}const fl=vtFiles(X,r.slice(1)).filter(x=>!x.d||f.r),files={};fl.forEach(x=>{io.out('  adding: '+x.rel+' (deflated)\n');files[x.rel]=x.d?{d:1}:{c:x.c,m:x.m}});vtMk(X,/\.zip$/.test(out)?out:out+'.zip',vtArc('zip',true,files));return 0},
 unzip:(X,a,io)=>{const {f,v,r}=bFl(a,'d');const n=X.fs[bAbs(X,r[0]||'')];if(!n){io.err(`unzip: cannot find or open ${r[0]}\n`);return 9}const A=vtParse(n.c);if(!A){io.err('unzip: not a zip file\n');return 9}if(f.l){Object.keys(A.files).forEach(k=>io.out('  '+String((A.files[k].c||'').length).padStart(8)+'  '+k+'\n'));return 0}const base=v.d?bAbs(X,v.d):X.cwd;Object.keys(A.files).forEach(k=>{io.out('  inflating: '+k+'\n');const p=(base==='/'?'':base)+'/'+k.replace(/\/$/,'');if(A.files[k].d)sxMk(X.fs,p,true);else{sxMk(X.fs,p.slice(0,p.lastIndexOf('/'))||'/',true);X.fs[p]={c:A.files[k].c}}});return 0}
});
// ---------- визуализатор конвейера flow ----------
function flSplit(s){const o=[];let cur='',q=null,d=0;for(let i=0;i<s.length;i++){const c=s[i];if(q){cur+=c;if(c==='\\'&&q==='"'){cur+=s[++i]||''}else if(c===q)q=null;continue}
 if(c==="'"||c==='"'){q=c;cur+=c;continue}if(c==='('||c==='{')d++;if(c===')'||c==='}')d--;
 if(c==='|'&&s[i+1]==='|'){cur+='||';i++;continue}if(c==='|'&&d===0){o.push(cur.trim());cur='';continue}cur+=c}o.push(cur.trim());return o.filter(Boolean)}
let FLOWLAST=null;
function flowHtml(st,anim){const esc2=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]);const css=`<style>.fl{display:flex;flex-direction:column;align-items:stretch;gap:0;margin:8px 0}.fl .st{border:1px solid var(--bd);border-radius:12px;padding:10px 14px;background:linear-gradient(135deg,rgba(80,140,255,.10),rgba(0,200,160,.06));${anim?'opacity:0;transform:translateY(10px);animation:flin .45s forwards':''}}.fl .st code{font-size:13px;font-weight:700}.fl .hd{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}.fl .bd{font-size:12px;border-radius:999px;padding:1px 9px;background:var(--ac);color:#fff}.fl .pv{margin:6px 0 0;font:12px/1.35 ui-monospace,Consolas,monospace;white-space:pre-wrap;max-height:170px;overflow:auto;background:rgba(0,0,0,.18);border-radius:8px;padding:6px 8px}.fl .rm{text-decoration:line-through;opacity:.45;color:#e5484d}.fl .nw{color:#2e9e5b}.fl .ar{align-self:center;height:26px;width:2px;background:repeating-linear-gradient(var(--ac) 0 6px,transparent 6px 12px);${anim?'opacity:0;animation:flin .3s forwards':''};position:relative}.fl .ar:after{content:"▼";position:absolute;left:-6px;bottom:-9px;font-size:11px;color:var(--ac)}@keyframes flin{to{opacity:1;transform:none}}</style>`;
 let h=css+'<div class="fl">';st.forEach((s,i)=>{const delay=(i*.55).toFixed(2);const prev=i?st[i-1].lines:null;let body;
  const sub=prev&&s.lines.length<=prev.length&&s.lines.every(l=>prev.includes(l));
  if(sub&&prev.length<=14){const cnt={};s.lines.forEach(l=>cnt[l]=(cnt[l]||0)+1);body=prev.map(l=>{if(cnt[l]){cnt[l]--;return'<span class="nw">'+esc2(l)+'</span>'}return'<span class="rm">'+esc2(l)+'</span>'}).join('\n')}
  else{const L=s.lines.slice(0,14).map(l=>esc2(l));body=L.join('\n')+(s.lines.length>14?'\n… ещё '+(s.lines.length-14)+' строк':'')||'(пусто)'}
  h+=(i?`<div class="ar" style="animation-delay:${(i*.55-.2).toFixed(2)}s"></div>`:'')+`<div class="st" style="animation-delay:${delay}s"><div class="hd"><span>Стадия ${i+1}: <code>${esc2(s.cmd)}</code></span><span class="bd">${prev?prev.length+' → ':''}${s.lines.length} строк</span></div><div class="pv">${body}</div>${s.err?'<div class="er">'+esc2(s.err)+'</div>':''}</div>`});
 return h+'</div>'}
BB.flow=(X,a,io)=>{const line=a.join(' ').trim();if(!line){io.out('Использование: flow cat access.log | sort | uniq -c   (показывает результат после каждой стадии конвейера)\n');return 0}
 const parts=flSplit(line);if(parts.length<1)return 0;const st=[];
 for(let k=1;k<=parts.length;k++){const buf=[],errb=[];const inp=io.inp?{t:io.inp.t,p:io.inp.p}:{t:'',p:0};let code=0;const sv={env:{...X.env},cwd:X.cwd,pos:X.pos.slice(),arr:JSON.parse(JSON.stringify(X.arr))};
  try{code=bRunList(X,bParse(parts.slice(0,k).join(' | ')),{inp,out:s=>buf.push(s),err:s=>errb.push(s),tty:false})}catch(e){errb.push(e.message||String(e))}finally{X.env=sv.env;X.cwd=sv.cwd;X.pos=sv.pos;X.arr=sv.arr}
  st.push({cmd:parts[k-1],lines:bLinesOf(buf.join('')),err:errb.join('').trim(),code})}
 FLOWLAST=st;try{openMd('<h3>Конвейер: как данные проходят по стадиям</h3><p class="mt">Каждая карточка — результат конвейера, остановленного на этой стадии. Зачёркнутые строки отфильтрованы стадией.</p>'+flowHtml(st,true)+'<p><button data-x="fl_again">▶ Повторить анимацию</button></p>')}catch(e){}
 io.out(st.map((s,i)=>`Стадия ${i+1}: ${s.cmd} → ${s.lines.length} строк`).join('\n')+'\n(подробная визуализация — в окне)\n');return 0};
md.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-x="fl_again"]');if(b&&FLOWLAST)openMd('<h3>Конвейер: как данные проходят по стадиям</h3>'+flowHtml(FLOWLAST,true)+'<p><button data-x="fl_again">▶ Повторить анимацию</button></p>')});
// ---------- подсказки: описания новых команд ----------
CMDS.push(['flow','flow <конвейер через |>','Визуализатор конвейера: результат после каждой стадии','В скриптовом терминале: flow cat access.log | grep 404 | sort | uniq -c. Открывается окно с анимацией: у каждой стадии — число строк на входе и выходе и первые строки; отфильтрованные строки зачёркнуты. Помогает понять, что делает каждая часть конвейера.','Консоль']);
if(!CMDNAMES.includes('flow'))CMDNAMES.push('flow');

// bash script -d x: параметры после имени скрипта не должны разбираться как опции bash
{const _b=BB.bash;BB.bash=function(X,a,io){let i=0;while(i<a.length&&a[i][0]==='-'&&a[i]!=='-c'&&a[i]!=='--'&&!/^-[a-zA-Z]*c/.test(a[i]))i++;if(i<a.length&&a[i]!=='-c'&&!/^-/.test(a[i])&&a.slice(0,i).every(x=>/^-[xeuvn]+$|^-o$/.test(x)||true)&&(a[i].includes('/')||X.fs[bAbs(X,a[i])]))return bScript(X,a[i],a.slice(i+1),io);return _b(X,a,io)};BB.sh=function(X,a,io){return BB.bash(X,a,io)}}
// обычная консоль узла (ПК/сервер) принимает и новые, и базовые команды оболочки
['ls','cat','grep','egrep','sort','uniq','wc','head','tail','find','awk','sed','cut','tr','tee','xargs','diff','mkdir','touch','cp','mv','rm','echo','pwd','tac','rev','nl','basename','dirname','jq','bc','tar','gzip','gunzip','zip','unzip','ps','top','pgrep','pkill','kill','ss','du','tree','base64','xxd','comm','paste','column','shuf','cal','flow','file','strings','realpath','factor','od','fold','join','timeout'].forEach(c=>{if(!ADMC.includes(c))ADMC.push(c)});
