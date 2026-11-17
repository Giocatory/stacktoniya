// ================= v23c4: sed и awk (подмножества) =================
function bSed(X,a,io){{const es=[],a2=[];for(let i=0;i<a.length;i++){if(a[i]==='-e'&&i+1<a.length)es.push(a[++i]);else a2.push(a[i])}if(es.length)a=[...a2,'-e',es.join('\n')]}const {f,v,r}=bFl(a,'e');let script=[];const files=[];if(v.e!==undefined){script=[v.e];files.push(...r)}else{if(!r.length){io.err('Usage: sed [OPTION]... {script-only-if-no-other-script} [input-file]...\n');return 1}script=[r[0]];files.push(...r.slice(1))}
 const src=script.join('\n');const ere=!!(f.E||f.r);const cmds=[];let i=0;
 const readDelim=(d)=>{let o='';while(i<src.length&&src[i]!==d){if(src[i]==='\\'&&i+1<src.length){if(src[i+1]===d){o+=d;i+=2;continue}o+=src[i]+src[i+1];i+=2;continue}o+=src[i++]}i++;return o};
 const parseCmds=(end)=>{const out=[];while(i<src.length){while(i<src.length&&/[\s;]/.test(src[i]))i++;if(i>=src.length||src[i]===end)break;const c={a1:null,a2:null,neg:false};
   const addr=()=>{if(src[i]==='$'){i++;return{t:'$'}}if(/\d/.test(src[i])){let n='';while(/\d/.test(src[i]||''))n+=src[i++];return{t:'n',n:+n}}if(src[i]==='/'){i++;const p=readDelim('/');return{t:'re',re:new RegExp(bre2js(p,ere))}}return null};
   c.a1=addr();if(c.a1&&src[i]===','){i++;c.a2=addr()}while(src[i]===' ')i++;if(src[i]==='!'){c.neg=true;i++}while(src[i]===' ')i++;const ch=src[i++];c.c=ch;
   if(ch==='{'){c.body=parseCmds('}');i++}
   else if(ch==='s'){const d=src[i++];const pat=readDelim(d);let rep=readDelim(d);let fl='';while(i<src.length&&/[gpiI0-9w]/.test(src[i]))fl+=src[i++];c.re=new RegExp(bre2js(pat,ere),(fl.includes('g')?'g':'')+(/[iI]/.test(fl)?'i':''));c.rep=rep;c.p=fl.includes('p');c.nth=+(fl.match(/\d+/)||[0])[0]}
   else if(ch==='y'){const d=src[i++];const s1=readDelim(d),s2=readDelim(d);c.map={};for(let k=0;k<s1.length;k++)c.map[s1[k]]=s2[k]}
   else if(ch==='a'||ch==='i'||ch==='c'){let t='';if(src[i]==='\\'){i++;if(src[i]==='\n')i++}while(src[i]===' ')i++;while(i<src.length&&src[i]!=='\n'){t+=src[i++]}c.t=t}
   out.push(c)}return out};
 try{cmds.push(...parseCmds(null))}catch(e){io.err('sed: -e expression #1: '+e.message+'\n');return 1}
 const quiet=!!f.n;let code=0;const procText=(t,name)=>{const L=bLinesOf(t);const out=[];let stop=false;const st=cmds.map(()=>({on:false}));
  const match=(c,k,ln,n,last)=>{if(!c.a1)return true;const t=ad=>ad.t==='$'?last:ad.t==='n'?ln===ad.n:ad.re.test(L[ln-1]);let m;if(!c.a2)m=t(c.a1);else{const s=st[cmds.indexOf(c)]||{};if(!s.on){if(t(c.a1)){s.on=true;if(c.a2.t==='n'&&ln>=c.a2.n)s.on=false;m=true}else m=false}else{m=true;if(t(c.a2)||(c.a2.t==='n'&&ln>=c.a2.n))s.on=false}}return c.neg?!m:m};
  for(let ln=1;ln<=L.length&&!stop;ln++){let ps=L[ln-1];let del=false;const last=ln===L.length;const pre=[],post=[];
   const run=(list)=>{for(const c of list){if(del||stop)return;if(!match(c,0,ln,0,last))continue;
     if(c.c==='{')run(c.body);else if(c.c==='s'){let cnt=0,did=false;ps=ps.replace(c.re,(...m)=>{cnt++;if(c.nth&&cnt!==c.nth)return m[0];did=true;const groups=m.slice(1,-2);return c.rep.replace(/\\(\d)|&|\\&|\\n/g,(x,d)=>x==='&'?m[0]:x==='\\&'?'&':x==='\\n'?'\n':(groups[d-1]||''))});if(did&&c.p)out.push(ps)}
     else if(c.c==='d'){del=true}else if(c.c==='p')out.push(ps);else if(c.c==='q'){stop=true}else if(c.c==='y'){ps=[...ps].map(x=>c.map[x]!==undefined?c.map[x]:x).join('')}else if(c.c==='='){out.push(String(ln))}
     else if(c.c==='a')post.push(c.t);else if(c.c==='i')pre.push(c.t);else if(c.c==='c'){pre.push(c.t);del=true}}};
   run(cmds);out.push(...pre);if(!del&&!quiet)out.push(ps);out.push(...post)}return out.length?out.join('\n')+'\n':''};
 if(f.i){files.forEach(p=>{const n=X.fs[bAbs(X,p)];if(!n||n.d){io.err(`sed: can't read ${p}: No such file or directory\n`);code=2;return}n.c=procText(n.c||'')});return code}
 bInp(X,io,files,'sed').forEach(x=>{if(x.err){code=2;return}io.out(procText(x.t))});return code}
// ---- awk ----
class AwkSN{constructor(s){this.s=s}toString(){return this.s}}
function bAwk(X,a,io){const {f,v,r}=bFl(a,'Fvf');let prog;const files=r.slice();if(v.f){const n=X.fs[bAbs(X,v.f)];if(!n){io.err(`awk: fatal: can't open source file '${v.f}'\n`);return 2}prog=n.c}else{if(!files.length){io.err('usage: awk [-F fs][-v var=value] [prog | -f progfile][file ...]\n');return 2}prog=files.shift()}
 let out='';const emit=s=>{out+=s};const G={};let arrays={};let FS=v.F!==undefined?(v.F==='t'?'\t':bEsc(v.F)):' ',OFS=' ',ORS='\n',NR=0,NF=0,FNR=0,FILENAME='';let F=[''];
 if(v.v!==undefined){const m=/^(\w+)=([\s\S]*)$/.exec(v.v);if(m)G[m[1]]=new AwkSN(m[2])}
 // --- лексер ---
 const toks=[];{const s=prog;let i=0,prevOperand=false;const push=(t,x)=>{toks.push({t,x});prevOperand=(t==='num'||t==='str'||t==='id'||t==='re'||(t==='op'&&(x===')'||x===']')))||(t==='kw'&&false)};
  while(i<s.length){const c=s[i];if(c===' '||c==='\t'||c==='\r'){i++;continue}if(c==='\\'&&s[i+1]==='\n'){i+=2;continue}if(c==='#'){while(i<s.length&&s[i]!=='\n')i++;continue}if(c==='\n'){push('nl');prevOperand=false;i++;continue}
   if(/\d/.test(c)||(c==='.'&&/\d/.test(s[i+1]||''))){let m=/^(\d+\.?\d*([eE][-+]?\d+)?|\.\d+)/.exec(s.slice(i));push('num',parseFloat(m[0]));i+=m[0].length;continue}
   if(c==='"'){let o='';i++;while(i<s.length&&s[i]!=='"'){if(s[i]==='\\'){const n=s[i+1];o+=n==='n'?'\n':n==='t'?'\t':n==='"'?'"':n==='\\'?'\\':n==='/'?'/':'\\'+n;i+=2}else o+=s[i++]}i++;push('str',o);continue}
   if(c==='/'&&!prevOperand){let o='';i++;while(i<s.length&&s[i]!=='/'){if(s[i]==='\\'&&s[i+1]==='/'){o+='/';i+=2;continue}if(s[i]==='\\'){o+=s[i]+s[i+1];i+=2;continue}o+=s[i++]}i++;push('re',o);continue}
   const m=/^[A-Za-z_]\w*/.exec(s.slice(i));if(m){const w=m[0];i+=w.length;if(['BEGIN','END','if','else','while','for','in','print','printf','next','exit','delete','function','return','do','getline'].includes(w))push('kw',w);else if(s[i]==='('&&!['length'].includes(w)||w==='length')push('fn',w);else push('id',w);toks[toks.length-1].t==='kw'&&(prevOperand=false);continue}
   const o3=s.slice(i,i+3),o2=s.slice(i,i+2);let op=['**='].includes(o3)?o3:['&&','||','==','!=','<=','>=','+=','-=','*=','/=','%=','^=','++','--','!~','**'].includes(o2)?o2:c;i+=op.length;if(op==='**')op='^';push('op',op)}toks.push({t:'eof'})}
 let p=0;const pk=()=>toks[p],isOp=x=>toks[p].t==='op'&&toks[p].x===x,isKw=x=>toks[p].t==='kw'&&toks[p].x===x;const synerr=()=>{throw Object.assign(new Error('syntax error at source line 1 near '+(toks[p].x!==undefined?toks[p].x:toks[p].t)),{awk:1})};
 const eat=x=>{if(!isOp(x))synerr();p++};const skipNl=()=>{while(toks[p].t==='nl'||isOp(';'))p++};
 // --- разбор выражений ---
 function expr(){return ternary()}
 function ternary(){const c=oror();if(isOp('?')){p++;const a=ternary();eat(':');const b=ternary();return{k:'tern',c,a,b}}if(toks[p].t==='op'&&['=','+=','-=','*=','/=','%=','^='].includes(toks[p].x)&&(c.k==='var'||c.k==='idx'||c.k==='fld')){const op=toks[p++].x;const rhs=ternary();return{k:'asg',op,l:c,r:rhs}}return c}
 function oror(){let a=andand();while(isOp('||')){p++;a={k:'or',a,b:andand()}}return a}
 function andand(){let a=inn();while(isOp('&&')){p++;a={k:'and',a,b:inn()}}return a}
 function inn(){let a=match();while(isKw('in')){p++;const n=toks[p++].x;a={k:'in',a,n}}return a}
 function match(){let a=cmp();while(isOp('~')||isOp('!~')){const neg=toks[p++].x==='!~';a={k:'match',a,b:cmp(),neg}}return a}
 function cmp(){let a=concat();while(toks[p].t==='op'&&['<','>','<=','>=','==','!='].includes(toks[p].x)&&!(noGt&&toks[p].x==='>')){const op=toks[p++].x;a={k:'cmp',op,a,b:concat()}}return a}
 let noGt=false;
 function startsOperand(){const t=toks[p];return t.t==='num'||t.t==='str'||t.t==='id'||t.t==='fn'||t.t==='re'||(t.t==='op'&&['$','(','!','-','+','++','--'].includes(t.x)&&!['-','+'].includes(t.x))}
 function concat(){let a=add();while(startsOperand()&&!(toks[p].t==='op'&&toks[p].x==='!'&&false)){a={k:'cat',a,b:add()}}return a}
 function add(){let a=mul();while(isOp('+')||isOp('-')){const op=toks[p++].x;a={k:'bin',op,a,b:mul()}}return a}
 function mul(){let a=unary();while(isOp('*')||isOp('/')||isOp('%')){const op=toks[p++].x;a={k:'bin',op,a,b:unary()}}return a}
 function unary(){if(isOp('!')){p++;return{k:'not',a:unary()}}if(isOp('-')){p++;return{k:'neg',a:unary()}}if(isOp('+')){p++;return{k:'pos',a:unary()}}return pow()}
 function pow(){const a=post();if(isOp('^')){p++;return{k:'bin',op:'^',a,b:unary()}}return a}
 function post(){let a=prim();if((isOp('++')||isOp('--'))&&(a.k==='var'||a.k==='idx'||a.k==='fld')){const op=toks[p++].x;return{k:'post',op,l:a}}return a}
 function prim(){const t=toks[p++];if(t.t==='num')return{k:'num',v:t.x};if(t.t==='str')return{k:'str',v:t.x};if(t.t==='re')return{k:'re',v:t.x};
  if(t.t==='op'){if(t.x==='('){const e=expr();eat(')');return{k:'grp',e}}if(t.x==='$'){const e=pow2();return{k:'fld',e}}if(t.x==='++'||t.x==='--'){const l=prim();return{k:'pre',op:t.x,l}}}
  if(t.t==='id'){if(isOp('[')){p++;const e=exprList();eat(']');return{k:'idx',n:t.x,e}}return{k:'var',n:t.x}}
  if(t.t==='fn'){let args=[];if(isOp('(')){p++;if(!isOp(')'))args=exprList(true);eat(')')}return{k:'call',n:t.x,args}}
  p--;synerr()}
 function pow2(){const t=toks[p];if(t.t==='num'){p++;return{k:'num',v:t.x}}if(t.t==='op'&&t.x==='('){p++;const e=expr();eat(')');return e}if(t.t==='id'){p++;if(isOp('[')){p++;const e=exprList();eat(']');return{k:'idx',n:t.x,e}}return{k:'var',n:t.x}}if(isOp('++')||isOp('--')){p++;return{k:'pre',op:toks[p-1].x,l:prim()}}synerr()}
 function exprList(arr){const l=[expr()];while(isOp(',')){p++;skipNlOnly();l.push(expr())}return arr?l:(l.length>1?{k:'subsep',l}:l[0])}
 const skipNlOnly=()=>{while(toks[p].t==='nl')p++};
 // --- операторы ---
 function stmt(){skipNl();const t=toks[p];if(t.t==='op'&&t.x==='{'){p++;const b=[];while(true){skipNl();if(isOp('}')){p++;break}if(toks[p].t==='eof')synerr();b.push(stmt())}return{k:'blk',b}}
  if(t.t==='kw'){const w=t.x;
   if(w==='if'){p++;eat('(');const c=expr();eat(')');const a=stmt();skipNl();let b=null;if(isKw('else')){p++;b=stmt()}return{k:'if',c,a,b}}
   if(w==='while'){p++;eat('(');const c=expr();eat(')');return{k:'while',c,b:stmt()}}
   if(w==='for'){p++;eat('(');if(toks[p].t==='id'&&toks[p+1].t==='kw'&&toks[p+1].x==='in'){const v=toks[p].x;p+=2;const n=toks[p++].x;eat(')');return{k:'forin',v,n,b:stmt()}}let init=null,cond=null,inc=null;if(!isOp(';'))init=simpleStmt();eat(';');if(!isOp(';'))cond=expr();eat(';');if(!isOp(')'))inc=simpleStmt();eat(')');return{k:'for',init,cond,inc,b:stmt()}}
   if(w==='next'){p++;return{k:'next'}}if(w==='exit'){p++;let e=null;if(!endStmt())e=expr();return{k:'exit',e}}
   if(w==='delete'){p++;const n=toks[p++].x;let e=null;if(isOp('[')){p++;e=exprList();eat(']')}return{k:'del',n,e}}
   if(w==='print'||w==='printf'){p++;let args=[];if(!endStmt()&&!isOp('>')){noGt=true;try{args=exprList(true)}finally{noGt=false}}let red=null;if(isOp('>')||(isOp('>')&&false)){p++;red=concat()}return{k:w,args,red}}}
  return simpleStmt()}
 const endStmt=()=>toks[p].t==='nl'||toks[p].t==='eof'||isOp(';')||isOp('}');
 function simpleStmt(){const e=expr();return{k:'expr',e}}
 const items=[];skipNl();while(toks[p].t!=='eof'){let it={pat:null,act:null,kind:'main'};if(isKw('BEGIN')){p++;it.kind='begin'}else if(isKw('END')){p++;it.kind='end'}else if(!isOp('{')){it.pat=expr();if(isOp(',')){p++;it.pat2=expr()}}
  if(isOp('{'))it.act=stmt();else if(it.kind==='main'){it.act=null}else synerr();items.push(it);skipNl()}
 // --- интерпретатор ---
 const isNumLike=s=>/^\s*[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?\s*$/.test(s);const num=x=>typeof x==='number'?x:x instanceof AwkSN?(isNumLike(x.s)?parseFloat(x.s):parseFloat(x.s)||0):(parseFloat(x)||0);
 const n2s=n=>Number.isInteger(n)?String(n):String(+n.toPrecision(6));const str=x=>typeof x==='number'?n2s(x):x instanceof AwkSN?x.s:x===undefined?'':String(x);
 const truthy=x=>typeof x==='number'?x!==0:x instanceof AwkSN?(isNumLike(x.s)?parseFloat(x.s)!==0:x.s!==''):x!=='';
 const isNumeric=x=>typeof x==='number'||(x instanceof AwkSN&&isNumLike(x.s));
 const getVar=n=>{switch(n){case'NR':return NR;case'NF':return NF;case'FNR':return FNR;case'FS':return FS;case'OFS':return OFS;case'ORS':return ORS;case'FILENAME':return FILENAME}return G[n]===undefined?'':G[n]};
 const setVar=(n,x)=>{switch(n){case'NF':{const k=Math.max(0,num(x));F=F.slice(0,k+1);while(F.length<k+1)F.push('');NF=k;F[0]=F.slice(1).join(OFS);return}case'FS':FS=str(x);return;case'OFS':OFS=str(x);return;case'ORS':ORS=str(x);return;case'NR':NR=num(x);return}G[n]=x};
 const splitRec=line=>{let parts;if(FS===' ')parts=line.trim()===''?[]:line.trim().split(/\s+/);else if(FS.length===1&&!/[.*+?^${}()|[\]\\]/.test(FS))parts=line.split(FS);else parts=line.split(new RegExp(FS.length===1?'\\'+FS:bre2js(FS,true)));return parts};
 const setRec=line=>{F=[line,...splitRec(line).map(x=>new AwkSN(x))];NF=F.length-1};
 const rebuild=()=>{F[0]=F.slice(1).map(str).join(OFS)};
 const fld=i=>{i=Math.floor(i);if(i<0)throw Object.assign(new Error('attempt to access field '+i),{awk:1});if(i===0)return new AwkSN(F[0] instanceof AwkSN?F[0].s:F[0]);return F[i]===undefined?'':F[i]};
 const reOf=x=>{const s=x&&x.k==='re'?x.v:null;return s};
 const reCache={};const mkre=(s,fl)=>{const k=s+'/'+fl;return reCache[k]||(reCache[k]=new RegExp(bre2js(s,true),fl))};
 class NextS{}class ExitS{constructor(c){this.c=c}}
 const cmpv=(op,x,y)=>{let c;if(isNumeric(x)&&isNumeric(y)){const a=num(x),b=num(y);c=a<b?-1:a>b?1:0}else{const a=str(x),b=str(y);c=a<b?-1:a>b?1:0}return op==='<'?c<0:op==='>'?c>0:op==='<='?c<=0:op==='>='?c>=0:op==='=='?c===0:c!==0};
 const key=e=>e.k==='subsep'?e.l.map(x=>str(ev(x))).join('\x1c'):str(ev(e));
 const arr=n=>arrays[n]||(arrays[n]={});
 const lval=(l,x)=>{if(l.k==='var')setVar(l.n,x);else if(l.k==='idx')arr(l.n)[key(l.e)]=x;else if(l.k==='fld'){const i=Math.floor(num(ev(l.e)));if(i===0){setRec(str(x))}else{while(F.length<=i)F.push('');F[i]=x;NF=Math.max(NF,i);rebuild()}}};
 const cur=l=>l.k==='var'?getVar(l.n):l.k==='idx'?(arr(l.n)[key(l.e)]===undefined?'':arr(l.n)[key(l.e)]):ev(l);
 let steps=0;
 function ev(e){if(++steps>2e6)throw Object.assign(new Error('превышен лимит выполнения'),{awk:1});switch(e.k){
  case'num':return e.v;case'str':return e.v;case'grp':return ev(e.e);case'var':return getVar(e.n);case'idx':{const a=arr(e.n),k=key(e.e);return a[k]===undefined?'':a[k]}
  case'fld':return fld(num(ev(e.e)));case're':return mkre(e.v,'').test(str(fld(0)))?1:0;
  case'asg':{let x=ev(e.r);if(e.op!=='='){const a=num(cur(e.l)),b=num(x);x=e.op==='+='?a+b:e.op==='-='?a-b:e.op==='*='?a*b:e.op==='/='?a/b:e.op==='%='?a%b:Math.pow(a,b)}lval(e.l,x);return x}
  case'pre':{const x=num(cur(e.l))+(e.op==='++'?1:-1);lval(e.l,x);return x}case'post':{const o=num(cur(e.l));lval(e.l,o+(e.op==='++'?1:-1));return o}
  case'tern':return truthy(ev(e.c))?ev(e.a):ev(e.b);case'or':return truthy(ev(e.a))||truthy(ev(e.b))?1:0;case'and':return truthy(ev(e.a))&&truthy(ev(e.b))?1:0;case'not':return truthy(ev(e.a))?0:1;case'neg':return-num(ev(e.a));case'pos':return num(ev(e.a));
  case'cat':return str(ev(e.a))+str(ev(e.b));case'cmp':return cmpv(e.op,ev(e.a),ev(e.b))?1:0;
  case'match':{const s=str(ev(e.a));const re=e.b.k==='re'?mkre(e.b.v,''):mkre(str(ev(e.b)),'');const m=re.test(s);return(e.neg?!m:m)?1:0}
  case'in':return Object.prototype.hasOwnProperty.call(arr(e.n),str(ev(e.a)))?1:0;
  case'bin':{const x=num(ev(e.a)),y=num(ev(e.b));if(e.op==='+')return x+y;if(e.op==='-')return x-y;if(e.op==='*')return x*y;if(e.op==='/'){if(y===0)throw Object.assign(new Error('division by zero'),{awk:1});return x/y}if(e.op==='%')return x%y;return Math.pow(x,y)}
  case'subsep':return e.l.map(x=>str(ev(x))).join('\x1c');
  case'call':{const A=e.args,s=i=>str(ev(A[i]));switch(e.n){case'length':return A.length?(A[0].k==='var'&&arrays[A[0].n]?Object.keys(arrays[A[0].n]).length:s(0).length):str(fld(0)).length;
    case'substr':{const t=s(0);let st=Math.round(num(ev(A[1])));let ln=A[2]?Math.round(num(ev(A[2]))):Infinity;if(st<1){ln+=st-1;st=1}return ln<=0?'':t.substr(st-1,ln===Infinity?undefined:ln)}
    case'index':return s(0).indexOf(s(1))+1;case'tolower':return s(0).toLowerCase();case'toupper':return s(0).toUpperCase();case'int':return Math.trunc(num(ev(A[0])));case'sqrt':return Math.sqrt(num(ev(A[0])));case'sin':return Math.sin(num(ev(A[0])));case'cos':return Math.cos(num(ev(A[0])));case'exp':return Math.exp(num(ev(A[0])));case'log':return Math.log(num(ev(A[0])));case'rand':return Math.random();case'srand':return 0;
    case'sprintf':return bPrintf(s(0),A.slice(1).map(x=>{const v=ev(x);return typeof v==='number'?v:str(v)}));
    case'split':{const t=s(0),a=arr(A[1].n);for(const k in a)delete a[k];let sep=A[2]?(A[2].k==='re'?A[2].v:s(2)):FS;let parts;if(sep===' ')parts=t.trim()===''?[]:t.trim().split(/\s+/);else if(sep==='')parts=[...t];else parts=t.split(A[2]&&A[2].k==='re'?mkre(sep,''):sep.length===1&&!/[.*+?^${}()|[\]\\]/.test(sep)?sep:mkre(sep,''));parts.forEach((x,i)=>a[i+1]=new AwkSN(x));return parts.length}
    case'sub':case'gsub':{const re=A[0].k==='re'?mkre(A[0].v,e.n==='gsub'?'g':''):mkre(s(0),e.n==='gsub'?'g':'');const rep=s(1);const tgt=A[2]||{k:'fld',e:{k:'num',v:0}};const t=str(ev(tgt));let c=0;const nt=t.replace(re,(m)=>{c++;return rep.replace(/\\&|&/g,x=>x==='&'?m:'&')});if(c)lval(tgt,nt);return c}
    case'match':{const m=(A[1].k==='re'?mkre(A[1].v,''):mkre(s(1),'')).exec(s(0));G.RSTART=m?m.index+1:0;G.RLENGTH=m?m[0].length:-1;return G.RSTART}
    default:throw Object.assign(new Error('function '+e.n+' is not defined'),{awk:1})}}}
  throw Object.assign(new Error('unknown expr '+e.k),{awk:1})}
 const outTo=(red,s)=>{if(!red){emit(s);return}const t=str(ev(red));if(t==='/dev/stderr')io.err(s);else if(t==='/dev/stdout')emit(s);else{const e=sxWrite(X.fs,bAbs(X,t),s,!!awkFiles[t]);awkFiles[t]=1}};const awkFiles={};
 function ex(s){if(++steps>2e6)throw Object.assign(new Error('превышен лимит выполнения'),{awk:1});switch(s.k){
  case'blk':s.b.forEach(ex);break;case'expr':ev(s.e);break;
  case'print':{const vals=s.args.length?s.args.map(x=>{const v=ev(x);return typeof v==='number'?n2s(v):str(v)}):[str(fld(0))];outTo(s.red,vals.join(OFS)+ORS);break}
  case'printf':{const v=s.args.map(x=>ev(x));outTo(s.red,bPrintf(str(v[0]),v.slice(1).map(x=>typeof x==='number'?x:str(x))));break}
  case'if':if(truthy(ev(s.c)))ex(s.a);else if(s.b)ex(s.b);break;
  case'while':while(truthy(ev(s.c)))ex(s.b);break;
  case'for':if(s.init)ex(s.init);while(!s.cond||truthy(ev(s.cond))){ex(s.b);if(s.inc)ex(s.inc)}break;
  case'forin':for(const k of Object.keys(arr(s.n))){setVar(s.v,/^-?\d+(\.\d+)?$/.test(k)?new AwkSN(k):k);ex(s.b)}break;
  case'next':throw new NextS();case'exit':throw new ExitS(s.e?num(ev(s.e)):0);
  case'del':if(s.e)delete arr(s.n)[key(s.e)];else arrays[s.n]={};break}}
 let code=0;const rangeOn=items.map(()=>false);
 try{items.filter(x=>x.kind==='begin').forEach(it=>ex(it.act));
  const hasMain=items.some(x=>x.kind==='main'),hasEnd=items.some(x=>x.kind==='end');
  if(hasMain||hasEnd){const ins=bInp(X,io,files.filter(x=>!/^\w+=/.test(x)),'awk');
   outer:for(const x of ins){if(x.err){code=2;continue}FILENAME=x.n==='-'?'':x.n;FNR=0;for(const line of bLinesOf(x.t)){NR++;FNR++;setRec(line);
     try{items.forEach((it,k)=>{if(it.kind!=='main')return;let hit;if(!it.pat)hit=true;else if(it.pat2){if(!rangeOn[k]){if(truthy(ev(it.pat))){rangeOn[k]=true;hit=true;if(truthy(ev(it.pat2)))rangeOn[k]=false}else hit=false}else{hit=true;if(truthy(ev(it.pat2)))rangeOn[k]=false}}else hit=truthy(ev(it.pat));if(!hit)return;if(it.act)ex(it.act);else emit(str(fld(0))+ORS)})}catch(e){if(e instanceof NextS)continue;throw e}}}}
  items.filter(x=>x.kind==='end').forEach(it=>ex(it.act))}catch(e){if(e instanceof ExitS){code=e.c;try{items.filter(x=>x.kind==='end').forEach(it=>ex(it.act))}catch(e2){if(!(e2 instanceof ExitS))throw e2}}else if(e&&e.awk){io.err('awk: '+e.message+'\n');code=2}else throw e}
 io.out(out);return code}
