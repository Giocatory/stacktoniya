// ===== m_py: учебный интерпретатор подмножества Python 3 (python / python3) =====
const PY=(()=>{
class F{constructor(v){this.v=v}}
class T extends Array{}
class D{constructor(){this.m=new Map()}get size(){return this.m.size}}
class St{constructor(){this.m=new Map()}get size(){return this.m.size}}
class ExcT{constructor(n,b){this.name=n;this.base=b}}
class Exc{constructor(t,msg,args){this.t=t;this.msg=msg;this.args=args||[msg]}}
class PyErr extends Error{constructor(e){super('py');this.e=e}}
class Brk{}class Cnt{}class Ret{constructor(v){this.v=v}}class Exit{constructor(c){this.c=c}}
class Fn{constructor(n,ps,body,cl){this.name=n;this.ps=ps;this.body=body;this.cl=cl}}
class Cls{constructor(n,bases,env){this.name=n;this.bases=bases;this.env=env}}
class Inst{constructor(c){this.c=c;this.a=new Map()}}
class Bound{constructor(f,s){this.f=f;this.s=s}}
class Sup{constructor(c,i){this.c=c;this.i=i}}
class FileO{constructor(p,mode,X){this.p=p;this.mode=mode;this.X=X;this.pos=0;this.closed=false}}
const EXC={Exception:'',BaseException:'',ArithmeticError:'Exception',ZeroDivisionError:'ArithmeticError',ValueError:'Exception',TypeError:'Exception',KeyError:'LookupError',IndexError:'LookupError',LookupError:'Exception',NameError:'Exception',AttributeError:'Exception',OSError:'Exception',FileNotFoundError:'OSError',PermissionError:'OSError',IOError:'OSError',RuntimeError:'Exception',NotImplementedError:'RuntimeError',AssertionError:'Exception',StopIteration:'Exception',ImportError:'Exception',ModuleNotFoundError:'ImportError',SyntaxError:'Exception',IndentationError:'SyntaxError',KeyboardInterrupt:'BaseException',SystemExit:'BaseException',EOFError:'Exception',RecursionError:'RuntimeError',OverflowError:'ArithmeticError',UnicodeError:'ValueError'};
const EXT={};for(const n in EXC)EXT[n]=new ExcT(n,EXC[n]);
const err=(t,m)=>new PyErr(new Exc(EXT[t],m));
const isSub=(n,t)=>{while(n){if(n===t)return true;n=EXC[n]}return false};
const mkT=a=>{const t=new T();a.forEach(x=>t.push(x));return t};
const isNum=x=>typeof x==='number'||x instanceof F||typeof x==='boolean';
const nv=x=>x instanceof F?x.v:typeof x==='boolean'?+x:x;
const isInt=x=>typeof x==='number'||typeof x==='boolean';
const tn=x=>x===null?'NoneType':typeof x==='boolean'?'bool':typeof x==='number'?'int':x instanceof F?'float':typeof x==='string'?'str':x instanceof T?'tuple':Array.isArray(x)?'list':x instanceof D?'dict':x instanceof St?'set':x instanceof Inst?x.c.name:x instanceof Fn||typeof x==='function'?'function':'object';
const key=x=>typeof x==='string'?'s'+x:x===null?'N':typeof x==='boolean'?'n'+(+x):typeof x==='number'?'n'+x:x instanceof F?(Number.isInteger(x.v)?'n'+x.v:'f'+x.v):x instanceof T?'t('+x.map(key).join(',')+')':'o'+rp(x);
const dget=(d,k)=>d.m.get(key(k));
const dset=(d,k,v)=>{d.m.set(key(k),[k,v])};
const fr=v=>{if(Number.isNaN(v))return'nan';if(!Number.isFinite(v))return v>0?'inf':'-inf';if(Number.isInteger(v)&&Math.abs(v)<1e16)return v.toFixed(1);let s=String(v);if(/e/.test(s)){s=s.replace(/e([+-])(\d)$/,'e$10$2');if(!/e[+-]/.test(s))s=s.replace('e','e+')}return s};
const q=s=>{const u=s.includes("'")&&!s.includes('"')?'"':"'";return u+s.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/\t/g,'\\t').replace(/\r/g,'\\r').replace(new RegExp(u,'g'),'\\'+u)+u};
function rp(x,seen){if(typeof x==='string')return q(x);if(x instanceof Inst){const m=fnd(x.c,'__repr__');if(m)return String(call(new Bound(m,x),[],{}));return `<__main__.${x.c.name} object>`}if(x instanceof Exc)return x.t.name+'('+x.args.map(rp).join(', ')+')';return st(x,true)}
function st(x,inner){if(x===null||x===undefined)return'None';if(x===true)return'True';if(x===false)return'False';if(typeof x==='number')return String(x);if(x instanceof F)return fr(x.v);if(typeof x==='string')return x;
 if(x instanceof T)return '('+x.map(rp).join(', ')+(x.length===1?',':'')+')';if(Array.isArray(x))return '['+x.map(rp).join(', ')+']';
 if(x instanceof D)return '{'+[...x.m.values()].map(([k,v])=>rp(k)+': '+rp(v)).join(', ')+'}';if(x instanceof St)return x.size?'{'+[...x.m.values()].map(rp).join(', ')+'}':'set()';
 if(x instanceof Exc)return x.args.length===1?st(x.args[0]):x.args.length?st(mkT(x.args)):'';
 if(x instanceof Inst){const m=fnd(x.c,'__str__');if(m)return String(call(new Bound(m,x),[],{}));if(isExcInst(x))return x.a.get('args')&&x.a.get('args').length?st(x.a.get('args')[0]):'';return rp(x)}
 if(x instanceof Fn)return `<function ${x.name}>`;if(x instanceof Cls)return `<class '__main__.${x.name}'>`;if(x instanceof ExcT)return `<class '${x.name}'>`;if(x instanceof FileO)return `<_io.TextIOWrapper name='${x.p}'>`;if(typeof x==='function')return '<built-in function>';if(x&&x.mod)return `<module '${x.mod}'>`;return String(x)}
const tr=x=>{if(x===null||x===false||x===0||x==='')return false;if(x instanceof F)return x.v!==0;if(Array.isArray(x))return x.length>0;if(x instanceof D||x instanceof St)return x.size>0;if(x instanceof Inst){const m=fnd(x.c,'__bool__')||0;if(m)return tr(call(new Bound(m,x),[],{}));const l=fnd(x.c,'__len__');if(l)return tr(call(new Bound(l,x),[],{}))}return true};
function eq(a,b){if(isNum(a)&&isNum(b))return nv(a)===nv(b);if(typeof a==='string'||typeof b==='string')return a===b;if(a===null||b===null)return a===b;if(Array.isArray(a)&&Array.isArray(b)){if((a instanceof T)!==(b instanceof T)||a.length!==b.length)return false;return a.every((x,i)=>eq(x,b[i]))}
 if(a instanceof D&&b instanceof D){if(a.size!==b.size)return false;for(const[k,[kk,v]]of a.m){const o=b.m.get(k);if(!o||!eq(v,o[1]))return false}return true}if(a instanceof St&&b instanceof St)return a.size===b.size&&[...a.m.keys()].every(k=>b.m.has(k));
 if(a instanceof Inst){const m=fnd(a.c,'__eq__');if(m)return tr(call(new Bound(m,a),[b],{}))}return a===b}
function cmp(a,b){if(isNum(a)&&isNum(b))return nv(a)<nv(b)?-1:nv(a)>nv(b)?1:0;if(typeof a==='string'&&typeof b==='string')return a<b?-1:a>b?1:0;if(Array.isArray(a)&&Array.isArray(b)){for(let i=0;i<Math.min(a.length,b.length);i++){const c=cmp(a[i],b[i]);if(c)return c}return a.length-b.length<0?-1:a.length>b.length?1:0}
 if(a instanceof Inst){const m=fnd(a.c,'__lt__');if(m)return tr(call(new Bound(m,a),[b],{}))?-1:1}
 throw err('TypeError',`'<' not supported between instances of '${tn(a)}' and '${tn(b)}'`)}
function fnd(c,n){if(!c)return null;const v=c.env.v.get(n);if(v!==undefined)return v;for(const b of c.bases)if(b instanceof Cls){const r=fnd(b,n);if(r)return r}return null}
function isExcInst(x){return x instanceof Inst&&clsExc(x.c)}
function clsExc(c){for(const b of c.bases){if(b instanceof ExcT)return b;if(b instanceof Cls){const r=clsExc(b);if(r)return r}}return null}
function isinst(v,t){if(Array.isArray(t)&&t instanceof T)return t.some(x=>isinst(v,x));if(t instanceof ExcT){if(v instanceof Exc)return isSub(v.t.name,t.name);if(v instanceof Inst){const b=clsExc(v.c);return !!b&&isSub(b.name,t.name)}return false}
 if(t instanceof Cls){if(!(v instanceof Inst))return false;const w=c=>c===t||c.bases.some(b=>b instanceof Cls&&w(b));return w(v.c)}
 const n=t&&t.pyname;if(n==='int')return isInt(v)&&typeof v!=='boolean'||false;if(n==='bool')return typeof v==='boolean';if(n==='float')return v instanceof F;if(n==='str')return typeof v==='string';if(n==='list')return Array.isArray(v)&&!(v instanceof T);if(n==='tuple')return v instanceof T;if(n==='dict')return v instanceof D;if(n==='set')return v instanceof St;return false}
// ---------- числа/операции ----------
function arith(op,a,b){
 if(op==='+'){if(typeof a==='string'&&typeof b==='string')return a+b;if(Array.isArray(a)&&Array.isArray(b)){const r=a instanceof T?new T():[];a.forEach(x=>r.push(x));b.forEach(x=>r.push(x));return r}}
 if(op==='*'){if(typeof a==='string'&&isInt(b))return a.repeat(Math.max(0,b));if(isInt(a)&&typeof b==='string')return b.repeat(Math.max(0,a));if(Array.isArray(a)&&isInt(b)){const r=a instanceof T?new T():[];for(let i=0;i<b;i++)a.forEach(x=>r.push(x));return r}if(Array.isArray(b)&&isInt(a))return arith('*',b,a)}
 if(op==='%'&&typeof a==='string')return pctFmt(a,b);
 if(op==='|'&&a instanceof St&&b instanceof St){const r=new St();for(const[k,v]of a.m)r.m.set(k,v);for(const[k,v]of b.m)r.m.set(k,v);return r}
 if(op==='&'&&a instanceof St&&b instanceof St){const r=new St();for(const[k,v]of a.m)if(b.m.has(k))r.m.set(k,v);return r}
 if(op==='-'&&a instanceof St&&b instanceof St){const r=new St();for(const[k,v]of a.m)if(!b.m.has(k))r.m.set(k,v);return r}
 if(a instanceof Inst){const nm={'+':'__add__','-':'__sub__','*':'__mul__','/':'__truediv__','%':'__mod__','//':'__floordiv__'}[op];const m=nm&&fnd(a.c,nm);if(m)return call(new Bound(m,a),[b],{})}
 if(!isNum(a)||!isNum(b))throw err('TypeError',`unsupported operand type(s) for ${op}: '${tn(a)}' and '${tn(b)}'`);
 const fl=a instanceof F||b instanceof F,x=nv(a),y=nv(b);let r;
 switch(op){case '+':r=x+y;break;case '-':r=x-y;break;case '*':r=x*y;break;
  case '/':if(y===0)throw err('ZeroDivisionError','division by zero');return new F(x/y);
  case '//':if(y===0)throw err('ZeroDivisionError',fl?'float floor division by zero':'integer division or modulo by zero');r=Math.floor(x/y);break;
  case '%':if(y===0)throw err('ZeroDivisionError',fl?'float modulo':'integer division or modulo by zero');r=x-Math.floor(x/y)*y;break;
  case '**':if(!fl&&y<0)return new F(Math.pow(x,y));r=Math.pow(x,y);break;
  case '&':r=x&y;break;case '|':r=x|y;break;case '^':r=x^y;break;case '<<':r=x*Math.pow(2,y);break;case '>>':r=Math.floor(x/Math.pow(2,y));break;default:throw err('TypeError','bad operator '+op)}
 return fl?new F(r):r}
function pctFmt(s,a){const args=a instanceof T?[...a]:[a];let i=0;return s.replace(/%(?:\(([^)]+)\))?([-+ 0#]*)(\d+)?(?:\.(\d+))?([sdifrxXoceEgG%])/g,(m,nm,fl,w,pr,t)=>{if(t==='%')return'%';let v=nm?dget(args[0],nm)[1]:args[i++];if(v===undefined)throw err('TypeError','not enough arguments for format string');let o;if(t==='s')o=st(v);else if(t==='r')o=rp(v);else if(t==='d'||t==='i')o=String(Math.trunc(nv(v)));else if(t==='f')o=nv(v).toFixed(pr===undefined?6:+pr);else if(t==='x')o=Math.trunc(nv(v)).toString(16);else if(t==='X')o=Math.trunc(nv(v)).toString(16).toUpperCase();else if(t==='o')o=Math.trunc(nv(v)).toString(8);else if(t==='c')o=typeof v==='string'?v:String.fromCharCode(v);else o=String(nv(v));if(pr!==undefined&&t==='s')o=o.slice(0,+pr);if(fl.includes('+')&&nv(v)>=0&&/[dif]/.test(t))o='+'+o;if(w){w=+w;o=fl.includes('-')?o.padEnd(w):(fl.includes('0')&&t!=='s'?o.padStart(w,'0'):o.padStart(w))}return o})}
function fmtv(v,spec){if(!spec)return st(v);const m=spec.match(/^(?:(.)?([<>^=]))?([+\- ])?(#)?(0)?(\d+)?([,_])?(?:\.(\d+))?([bcdeEfFgGnosxX%])?$/);if(!m)throw err('ValueError','Invalid format specifier');let[,fill,al,sg,,z,w,cm,pr,t]=m;let s;const n=isNum(v);
 if(t&&'bdoxXn'.includes(t)&&!isInt(v))throw err('ValueError',`Unknown format code '${t}' for object of type '${tn(v)}'`);
 if(n&&t!=='s'){const x=nv(v);const neg=x<0;const ax=Math.abs(x);if(t==='d'||t==='n')s=String(ax);else if(t==='f'||t==='F')s=ax.toFixed(pr===undefined?6:+pr);else if(t==='e'||t==='E'){s=ax.toExponential(pr===undefined?6:+pr).replace(/e([+-])(\d)$/,'e$10$2');if(t==='E')s=s.toUpperCase()}else if(t==='x')s=Math.trunc(ax).toString(16);else if(t==='X')s=Math.trunc(ax).toString(16).toUpperCase();else if(t==='b')s=Math.trunc(ax).toString(2);else if(t==='o')s=Math.trunc(ax).toString(8);else if(t==='%')s=(ax*100).toFixed(pr===undefined?6:+pr)+'%';else if(t==='g'||t==='G'||(!t&&pr!==undefined))s=String(+ax.toPrecision(pr===undefined?6:Math.max(1,+pr)));else s=st(v instanceof F?new F(ax):ax);
  if(m[4]&&t&&'xXbo'.includes(t))s=({x:'0x',X:'0X',b:'0b',o:'0o'})[t]+s;if(cm){const[a,b]=s.split('.');s=a.replace(/\B(?=(\d{3})+(?!\d))/g,cm===','?',':'_')+(b!==undefined?'.'+b:'')}
  const sign=neg?'-':sg==='+'?'+':sg===' '?' ':'';if(z&&!al){fill='0';al='='}al=al||'>';const W=+w||0;const body=s;if(al==='='){s=sign+(fill||' ').repeat(Math.max(0,W-sign.length-body.length))+body}else{s=sign+body;const pad=Math.max(0,W-s.length);s=al==='<'?s+(fill||' ').repeat(pad):al==='^'?(fill||' ').repeat(pad>>1)+s+(fill||' ').repeat(pad-(pad>>1)):(fill||' ').repeat(pad)+s}return s}
 s=st(v);if(pr!==undefined)s=s.slice(0,+pr);const W=+w||0,pad=Math.max(0,W-s.length);al=al||'<';fill=fill||' ';return al==='>'?fill.repeat(pad)+s:al==='^'?fill.repeat(pad>>1)+s+fill.repeat(pad-(pad>>1)):s+fill.repeat(pad)}
// ---------- лексер ----------
const KW=new Set(['and','or','not','in','is','if','else','elif','for','while','def','return','break','continue','pass','import','from','as','try','except','finally','raise','with','lambda','class','del','global','nonlocal','assert','None','True','False','yield']);
function lex(src){const L=[];let i=0,ln=1,depth=0,cur=null,atStart=true,ind=0;const n=src.length;src=src.replace(/\r\n?/g,'\n');
 const push=t=>{if(!cur){cur={ind,toks:[],ln};}cur.toks.push(t)};
 const endLine=()=>{if(cur){L.push(cur);cur=null}};
 while(i<n){const c=src[i];
  if(atStart&&depth===0){let k=0;while(src[i]===' '||src[i]==='\t'){k+=src[i]==='\t'?4:1;i++}if(src[i]==='\n'||src[i]==='#'||i>=n){while(i<n&&src[i]!=='\n')i++;i++;ln++;continue}ind=k;atStart=false;continue}
  if(c==='\n'){ln++;i++;if(depth===0){endLine();atStart=true}continue}
  if(c===' '||c==='\t'){i++;continue}if(c==='#'){while(i<n&&src[i]!=='\n')i++;continue}
  if(c==='\\'&&src[i+1]==='\n'){i+=2;ln++;continue}
  const pm=src.slice(i).match(/^([rRfFbBuU]{1,2})(['"])/);
  if(c==='"'||c==="'"||pm){let pre='';if(pm){pre=pm[1].toLowerCase();i+=pre.length}const qc=src[i];const tri=src.substr(i,3)===qc.repeat(3);i+=tri?3:1;let s='';const raw=pre.includes('r');
   while(true){if(i>=n)throw new SyntaxErr('unterminated string literal',ln);const ch=src[i];if(tri?src.substr(i,3)===qc.repeat(3):ch===qc){i+=tri?3:1;break}
    if(ch==='\n'){if(!tri)throw new SyntaxErr('unterminated string literal',ln);ln++}
    if(ch==='\\'&&!raw){const e=src[i+1];const mp={n:'\n',t:'\t',r:'\r','\\':'\\',"'":"'",'"':'"','0':'\0',a:'\x07',b:'\b'};if(e==='x'){s+=String.fromCharCode(parseInt(src.substr(i+2,2),16));i+=4}else if(e==='u'){s+=String.fromCharCode(parseInt(src.substr(i+2,4),16));i+=6}else if(e==='\n'){i+=2;ln++}else if(e in mp){s+=mp[e];i+=2}else{s+='\\'+e;i+=2}}else{s+=ch;i++}}
   push({t:'str',v:s,f:pre.includes('f'),ln});continue}
  if(/[0-9]/.test(c)||(c==='.'&&/[0-9]/.test(src[i+1]||''))){const m=src.slice(i).match(/^(0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\d[\d_]*\.?[\d_]*|\.\d[\d_]*)(?:[eE][+-]?\d+)?)/);const s=m[0].replace(/_/g,'');i+=m[0].length;if(/^0[xXbBoO]/.test(s))push({t:'num',v:Number(s),ln});else if(/[.eE]/.test(s))push({t:'num',v:new F(parseFloat(s)),ln});else push({t:'num',v:parseInt(s,10),ln});continue}
  if(/[A-Za-z_\u0400-\u04FF]/.test(c)){const m=src.slice(i).match(/^[\w\u0400-\u04FF]+/);i+=m[0].length;push({t:KW.has(m[0])?'kw':'name',v:m[0],ln});continue}
  const ops=['**=','//=','>>=','<<=','...','==','!=','<=','>=','+=','-=','*=','/=','%=','&=','|=','^=','->','**','//','<<','>>',':=','(',')','[',']','{','}',',',':','.',';','=','+','-','*','/','%','<','>','&','|','^','~','@'];
  const op=ops.find(o=>src.startsWith(o,i));if(!op)throw new SyntaxErr(`invalid character '${c}'`,ln);i+=op.length;
  if('([{'.includes(op))depth++;else if(')]}'.includes(op))depth--;
  if(op===';'&&depth===0){endLine();continue}push({t:'op',v:op,ln})}
 endLine();return L}
class SyntaxErr extends Error{constructor(m,ln){super(m);this.ln=ln}}
// ---------- парсер выражений ----------
class P{constructor(toks,ln){this.t=toks;this.p=0;this.ln=ln}
 get k(){return this.t[this.p]}eof(){return this.p>=this.t.length}
 is(v){const k=this.k;return k&&(k.t==='op'||k.t==='kw')&&k.v===v}
 eat(v){if(this.is(v)){this.p++;return true}return false}
 need(v){if(!this.eat(v))throw new SyntaxErr(`invalid syntax (ожидалось '${v}')`,this.ln)}
 name(){const k=this.k;if(!k||k.t!=='name')throw new SyntaxErr('invalid syntax',this.ln);this.p++;return k.v}
 testlist(){const first=this.starred();if(!this.is(','))return first.t==='star'?{t:'tup',a:[first]}:first;const a=[first];while(this.eat(',')){if(this.eof()||this.is('=')||this.is(')')||this.is(':')||this.is(']'))break;a.push(this.starred())}return{t:'tup',a}}
 starred(){if(this.eat('*'))return{t:'star',e:this.bor()};return this.test()}
 test(){if(this.is('lambda')){this.p++;const ps=this.params(':');this.need(':');return{t:'lam',ps,b:this.test()}}
  const c=this.or();if(this.is('if')){this.p++;const cond=this.or();this.need('else');return{t:'cond',c:cond,a:c,b:this.test()}}return c}
 or(){let l=this.and();while(this.eat('or'))l={t:'or',l,r:this.and()};return l}
 and(){let l=this.not();while(this.eat('and'))l={t:'and',l,r:this.not()};return l}
 not(){if(this.eat('not'))return{t:'not',e:this.not()};return this.cmpx()}
 cmpx(){let l=this.bor();const ops=[];while(true){let o=null;const k=this.k;if(!k)break;if(k.t==='op'&&['==','!=','<','>','<=','>='].includes(k.v)){o=k.v;this.p++}else if(this.is('in')){o='in';this.p++}else if(this.is('not')&&this.t[this.p+1]&&this.t[this.p+1].v==='in'){o='not in';this.p+=2}else if(this.is('is')){this.p++;o=this.eat('not')?'is not':'is'}else break;ops.push([o,this.bor()])}return ops.length?{t:'cmp',l,ops}:l}
 bin(sub,set){let l=sub.call(this);while(this.k&&this.k.t==='op'&&set.includes(this.k.v)){const o=this.k.v;this.p++;l={t:'bin',o,l,r:sub.call(this)}}return l}
 bor(){return this.bin(this.bxor,['|'])}bxor(){return this.bin(this.band,['^'])}band(){return this.bin(this.shift,['&'])}shift(){return this.bin(this.arith,['<<','>>'])}arith(){return this.bin(this.term,['+','-'])}term(){return this.bin(this.unary,['*','/','//','%','@'])}
 unary(){if(this.k&&this.k.t==='op'&&['-','+','~'].includes(this.k.v)){const o=this.k.v;this.p++;return{t:'un',o,e:this.unary()}}return this.pow()}
 pow(){const b=this.postfix();if(this.eat('**'))return{t:'bin',o:'**',l:b,r:this.unary()};return b}
 postfix(){let e=this.atom();while(true){if(this.eat('(')){const args=this.args();this.need(')');e={t:'call',f:e,args,ln:this.k?this.k.ln:this.ln}}else if(this.eat('[')){e={t:'idx',e,i:this.subs()};this.need(']')}else if(this.eat('.')){e={t:'attr',e,n:this.t[this.p++].v}}else break}return e}
 subs(){const parse1=()=>{let a=null,b=null,c=null,sl=false;if(!this.is(':'))a=this.test();if(this.eat(':')){sl=true;if(!this.is(':')&&!this.is(']')&&!this.is(','))b=this.test();if(this.eat(':')){if(!this.is(']')&&!this.is(','))c=this.test()}}return sl?{t:'slice',a,b,c}:a};const f=parse1();if(!this.is(','))return f;const a=[f];while(this.eat(',')){if(this.is(']'))break;a.push(parse1())}return{t:'tup',a}}
 args(){const a=[];while(!this.is(')')){if(this.eat('**')){a.push({kw:null,e:this.test()})}else if(this.eat('*')){a.push({star:true,e:this.test()})}else if(this.k.t==='name'&&this.t[this.p+1]&&this.t[this.p+1].v==='='&&this.t[this.p+1].t==='op'){const n=this.k.v;this.p+=2;a.push({kw:n,e:this.test()})}else{const e=this.test();if(this.is('for')){a.push({e:{t:'gen',e,c:this.comp()}})}else a.push({e})}if(!this.eat(','))break}return a}
 params(end){const ps=[];while(!this.is(end)){if(this.eat('**')){ps.push({n:this.name(),kw:true})}else if(this.eat('*')){if(this.k.t==='name')ps.push({n:this.name(),star:true});else ps.push({n:null,star:true})}else{const n=this.name();let d;if(end===')'&&this.eat(':'))this.test();if(this.eat('='))d=this.test();ps.push({n,d})}if(!this.eat(','))break}return ps}
 comp(){const cl=[];while(this.is('for')){this.p++;const tg=this.targets();this.need('in');const it=this.or();const ifs=[];while(this.is('if')){this.p++;ifs.push(this.or())}cl.push({tg,it,ifs})}return cl}
 targets(){const a=[];do{a.push(this.k.v==='*'?(this.p++,{t:'star',e:this.bor()}):this.bor())}while(this.eat(','));return a.length===1?a[0]:{t:'tup',a}}
 atom(){const k=this.k;if(!k)throw new SyntaxErr('unexpected EOF',this.ln);this.p++;
  if(k.t==='num')return{t:'const',v:k.v};
  if(k.t==='str'){const parts=[];let cur=k;while(true){if(cur.f)parts.push(...fparts(cur.v,this.ln));else parts.push(cur.v);const nx=this.k;if(nx&&nx.t==='str'){this.p++;cur=nx}else break}if(parts.every(x=>typeof x==='string'))return{t:'const',v:parts.join('')};return{t:'fs',parts}}
  if(k.t==='name')return{t:'name',n:k.v};
  if(k.t==='kw'){if(k.v==='None')return{t:'const',v:null};if(k.v==='True')return{t:'const',v:true};if(k.v==='False')return{t:'const',v:false};throw new SyntaxErr('invalid syntax',this.ln)}
  if(k.v==='('){if(this.eat(')'))return{t:'tup',a:[]};const f=this.starred();if(this.is('for')){const c=this.comp();this.need(')');return{t:'gen',e:f,c}}if(this.is(',')){const a=[f];while(this.eat(',')){if(this.is(')'))break;a.push(this.starred())}this.need(')');return{t:'tup',a}}this.need(')');return f.t==='star'?{t:'tup',a:[f]}:{t:'par',e:f}}
  if(k.v==='['){if(this.eat(']'))return{t:'list',a:[]};const f=this.starred();if(this.is('for')){const c=this.comp();this.need(']');return{t:'lcomp',e:f,c}}const a=[f];while(this.eat(',')){if(this.is(']'))break;a.push(this.starred())}this.need(']');return{t:'list',a}}
  if(k.v==='{'){if(this.eat('}'))return{t:'dict',a:[]};if(this.eat('**')){const a=[{sp:this.bor()}];while(this.eat(',')){if(this.is('}'))break;a.push(this.dentry())}this.need('}');return{t:'dict',a}}const f=this.test();if(this.eat(':')){const v=this.test();if(this.is('for')){const c=this.comp();this.need('}');return{t:'dcomp',k:f,v,c}}const a=[{k:f,v}];while(this.eat(',')){if(this.is('}'))break;a.push(this.dentry())}this.need('}');return{t:'dict',a}}
   if(this.is('for')){const c=this.comp();this.need('}');return{t:'scomp',e:f,c}}const a=[f];while(this.eat(',')){if(this.is('}'))break;a.push(this.test())}this.need('}');return{t:'set',a}}
  if(k.v==='...')return{t:'const',v:null};
  throw new SyntaxErr('invalid syntax',this.ln)}
 dentry(){if(this.eat('**'))return{sp:this.bor()};const k=this.test();this.need(':');return{k,v:this.test()}}}
function fparts(s,ln){const out=[];let lit='',i=0;while(i<s.length){const c=s[i];if(c==='{'){if(s[i+1]==='{'){lit+='{';i+=2;continue}let d=1,j=i+1;while(j<s.length&&d){if(s[j]==='{')d++;else if(s[j]==='}')d--;else if(s[j]==='"'||s[j]==="'"){const qq=s[j];j++;while(j<s.length&&s[j]!==qq)j++}j++}if(d)throw new SyntaxErr("f-string: expecting '}'",ln);let inner=s.slice(i+1,j-1);if(lit){out.push(lit);lit=''}
   let spec=null,conv=null,depth=0,cut=-1;for(let x=0;x<inner.length;x++){const ch=inner[x];if('([{'.includes(ch))depth++;else if(')]}'.includes(ch))depth--;else if(ch==='"'||ch==="'"){const qq=ch;x++;while(x<inner.length&&inner[x]!==qq)x++}else if(depth===0&&ch===':'){cut=x;break}else if(depth===0&&ch==='!'&&inner[x+1]!=='='){conv=inner[x+1];inner=inner.slice(0,x)+inner.slice(x+2);x--;}}
   let ex=inner;if(cut>=0){ex=inner.slice(0,cut);spec=inner.slice(cut+1)}let eqs=false;if(/=\s*$/.test(ex)&&!/[=!<>]=\s*$/.test(ex)){eqs=ex;ex=ex.replace(/=\s*$/,'')}
   const toks=lex(ex.trim());if(!toks.length)throw new SyntaxErr('f-string: empty expression',ln);const pp=new P(toks[0].toks,ln);const e=pp.testlist();if(eqs)out.push(eqs);out.push({e,conv,spec:spec===null?null:(spec.includes('{')?fparts(spec,ln):spec)});i=j;continue}
  if(c==='}'&&s[i+1]==='}'){lit+='}';i+=2;continue}lit+=c;i++}if(lit)out.push(lit);return out}
// ---------- парсер операторов ----------
function parseBlock(L,i,ind){const out=[];while(i<L.length&&L[i].ind===ind){const r=parseStmt(L,i);out.push(r.s);i=r.i}if(i<L.length&&L[i].ind>ind)throw new SyntaxErr('unexpected indent',L[i].ln);return{b:out,i}}
function body(L,i,p,ind,ln){if(!p.eof()){const r=simple(p,ln);return{b:[r],i:i+1}}if(i+1>=L.length||L[i+1].ind<=ind)throw new SyntaxErr('expected an indented block',ln);return parseBlock(L,i+1,L[i+1].ind)}
function parseStmt(L,i){const ln=L[i].ln,ind=L[i].ind,p=new P(L[i].toks,ln),k=p.k;
 if(k.t==='kw'){
  if(k.v==='if'){p.p++;const arms=[];let c=p.test();p.need(':');let r=body(L,i,p,ind,ln);arms.push([c,r.b]);i=r.i;let els=null;
   while(i<L.length&&L[i].ind===ind&&L[i].toks[0].t==='kw'&&(L[i].toks[0].v==='elif'||L[i].toks[0].v==='else')){const q2=new P(L[i].toks,L[i].ln);if(q2.eat('elif')){const c2=q2.test();q2.need(':');r=body(L,i,q2,ind,L[i].ln);arms.push([c2,r.b]);i=r.i}else{q2.p++;q2.need(':');r=body(L,i,q2,ind,L[i].ln);els=r.b;i=r.i;break}}
   return{s:{t:'if',arms,els,ln},i}}
  if(k.v==='while'){p.p++;const c=p.test();p.need(':');const r=body(L,i,p,ind,ln);let els=null,ii=r.i;if(ii<L.length&&L[ii].ind===ind&&L[ii].toks[0].v==='else'){const q2=new P(L[ii].toks,L[ii].ln);q2.p++;q2.need(':');const r2=body(L,ii,q2,ind,L[ii].ln);els=r2.b;ii=r2.i}return{s:{t:'while',c,b:r.b,els,ln},i:ii}}
  if(k.v==='for'){p.p++;const tg=p.targets();p.need('in');const it=p.testlist();p.need(':');const r=body(L,i,p,ind,ln);let els=null,ii=r.i;if(ii<L.length&&L[ii].ind===ind&&L[ii].toks[0].v==='else'){const q2=new P(L[ii].toks,L[ii].ln);q2.p++;q2.need(':');const r2=body(L,ii,q2,ind,L[ii].ln);els=r2.b;ii=r2.i}return{s:{t:'for',tg,it,b:r.b,els,ln},i:ii}}
  if(k.v==='def'){p.p++;const n=p.name();p.need('(');const ps=p.params(')');p.need(')');if(p.eat('->'))p.test();p.need(':');const r=body(L,i,p,ind,ln);return{s:{t:'def',n,ps,b:r.b,ln},i:r.i}}
  if(k.v==='class'){p.p++;const n=p.name();let bases=[];if(p.eat('(')){while(!p.is(')')){bases.push(p.test());if(!p.eat(','))break}p.need(')')}p.need(':');const r=body(L,i,p,ind,ln);return{s:{t:'class',n,bases,b:r.b,ln},i:r.i}}
  if(k.v==='try'){p.p++;p.need(':');let r=body(L,i,p,ind,ln);const node={t:'try',b:r.b,ex:[],els:null,fin:null,ln};i=r.i;
   while(i<L.length&&L[i].ind===ind&&L[i].toks[0].t==='kw'&&['except','else','finally'].includes(L[i].toks[0].v)){const q2=new P(L[i].toks,L[i].ln),w=q2.k.v;q2.p++;if(w==='except'){let ty=null,as=null;if(!q2.is(':')){ty=q2.test();if(q2.eat('as'))as=q2.name()}q2.need(':');r=body(L,i,q2,ind,L[i].ln);node.ex.push({ty,as,b:r.b})}else{q2.need(':');r=body(L,i,q2,ind,L[i].ln);if(w==='else')node.els=r.b;else node.fin=r.b}i=r.i}
   if(!node.ex.length&&!node.fin)throw new SyntaxErr("expected 'except' or 'finally' block",ln);return{s:node,i}}
  if(k.v==='with'){p.p++;const items=[];do{const e=p.test();let as=null;if(p.eat('as'))as=p.bor();items.push({e,as})}while(p.eat(','));p.need(':');const r=body(L,i,p,ind,ln);return{s:{t:'with',items,b:r.b,ln},i:r.i}}
 }
 return{s:simple(p,ln),i:i+1}}
function simple(p,ln){const k=p.k;
 if(k.t==='kw'){const w=k.v;
  if(w==='pass'){p.p++;return{t:'pass',ln}}if(w==='break'){p.p++;return{t:'break',ln}}if(w==='continue'){p.p++;return{t:'cont',ln}}
  if(w==='return'){p.p++;return{t:'ret',e:p.eof()?null:p.testlist(),ln}}
  if(w==='raise'){p.p++;let e=null,c=null;if(!p.eof()){e=p.test();if(p.eat('from'))c=p.test()}return{t:'raise',e,ln}}
  if(w==='global'||w==='nonlocal'){p.p++;const n=[];do{n.push(p.name())}while(p.eat(','));return{t:'global',n,ln}}
  if(w==='del'){p.p++;const e=p.testlist();return{t:'del',e,ln}}
  if(w==='assert'){p.p++;const c=p.test();let m=null;if(p.eat(','))m=p.test();return{t:'assert',c,m,ln}}
  if(w==='import'){p.p++;const a=[];do{let n=p.name();while(p.eat('.'))n+='.'+p.name();let as=null;if(p.eat('as'))as=p.name();a.push([n,as])}while(p.eat(','));return{t:'import',a,ln}}
  if(w==='from'){p.p++;let n=p.name();while(p.eat('.'))n+='.'+p.name();p.need('import');const a=[];if(p.eat('*'))a.push(['*',null]);else{const par=p.eat('(');do{if(p.is(')'))break;const x=p.name();let as=null;if(p.eat('as'))as=p.name();a.push([x,as])}while(p.eat(','));if(par)p.need(')')}return{t:'from',m:n,a,ln}}
  if(w==='yield')throw new SyntaxErr('yield/генераторы не поддерживаются в учебном интерпретаторе',ln)}
 const e=p.testlist();
 if(p.is(':')&&e.t==='name'){p.p++;p.test();if(p.eat('=')){return{t:'assign',tg:[e],e:p.testlist(),ln}}return{t:'pass',ln}}
 if(p.k&&p.k.t==='op'&&/^(\+|-|\*|\/|\/\/|%|\*\*|&|\||\^|<<|>>)=$/.test(p.k.v)){const o=p.k.v.slice(0,-1);p.p++;return{t:'aug',o,tg:e,e:p.testlist(),ln}}
 if(p.is('=')){const tgs=[e];let val;while(p.eat('=')){val=p.testlist();if(p.is('='))tgs.push(val)}if(!p.eof())throw new SyntaxErr('invalid syntax',ln);return{t:'assign',tg:tgs,e:val,ln}}
 if(!p.eof())throw new SyntaxErr('invalid syntax',ln);return{t:'expr',e,ln}}
// ---------- среда ----------
class Env{constructor(p,glob){this.v=new Map();this.p=p;this.g=null;this.root=glob||this}
 get(n){let e=this;while(e){if(e.v.has(n))return e.v.get(n);e=e.p}if(BI.has(n))return BI.get(n);throw err('NameError',`name '${n}' is not defined`)}
 set(n,v){if(this.g&&this.g.has(n))this.root.v.set(n,v);else this.v.set(n,v)}}
let CX=null;const BI=new Map();let steps=0;let depthC=0;
const tick=()=>{if(++steps>3000000)throw err('RuntimeError','слишком долгое выполнение (возможен бесконечный цикл) — прервано')};
function iter(x){if(Array.isArray(x))return x.slice();if(typeof x==='string')return[...x];if(x instanceof D)return[...x.m.values()].map(a=>a[0]);if(x instanceof St)return[...x.m.values()];if(x instanceof FileO)return fileLines(x);if(x&&x.rng){const r=[];const{a,b,c}=x.rng;if(c>0)for(let i=a;i<b;i+=c)r.push(i);else for(let i=a;i>b;i+=c)r.push(i);return r}if(Array.isArray(x.it))return x.it;if(x instanceof Inst){const m=fnd(x.c,'__iter__');if(m){const o=call(new Bound(m,x),[],{});if(Array.isArray(o))return o;if(o instanceof Inst){const nx=fnd(o.c,'__next__'),r=[];try{while(true){r.push(call(new Bound(nx,o),[],{}));tick()}}catch(e){if(e instanceof PyErr&&e.e.t.name==='StopIteration')return r;throw e}}}}throw err('TypeError',`'${tn(x)}' object is not iterable`)}
function* lazyRange(r){const{a,b,c}=r;if(c>0)for(let i=a;i<b;i+=c)yield i;else for(let i=a;i>b;i+=c)yield i}
function bind(t,v,env){if(t.t==='name')env.set(t.n,v);else if(t.t==='tup'||t.t==='list'){const a=iter(v);const si=t.a.findIndex(x=>x.t==='star');if(si<0){if(a.length!==t.a.length)throw err('ValueError',a.length>t.a.length?`too many values to unpack (expected ${t.a.length})`:`not enough values to unpack (expected ${t.a.length}, got ${a.length})`);t.a.forEach((x,i)=>bind(x,a[i],env))}else{const after=t.a.length-si-1;t.a.slice(0,si).forEach((x,i)=>bind(x,a[i],env));bind(t.a[si].e,a.slice(si,a.length-after),env);t.a.slice(si+1).forEach((x,i)=>bind(x,a[a.length-after+i],env))}}
 else if(t.t==='par')bind(t.e,v,env);
 else if(t.t==='idx'){const o=ev(t.e,env),i=ev(t.i,env);setItem(o,i,v)}else if(t.t==='attr'){const o=ev(t.e,env);if(o instanceof Inst)o.a.set(t.n,v);else throw err('AttributeError',`'${tn(o)}' object has no attribute '${t.n}'`)}else throw new SyntaxErr('cannot assign to expression',0)}
function setItem(o,i,v){if(o instanceof D)dset(o,i,v);else if(Array.isArray(o)&&!(o instanceof T)){if(!isInt(i))throw err('TypeError','list indices must be integers');let j=i<0?o.length+i:i;if(j<0||j>=o.length)throw err('IndexError','list assignment index out of range');o[j]=v}else if(o instanceof Inst){const m=fnd(o.c,'__setitem__');if(m)call(new Bound(m,o),[i,v],{});else throw err('TypeError',`'${o.c.name}' object does not support item assignment`)}else throw err('TypeError',`'${tn(o)}' object does not support item assignment`)}
function getItem(o,i){if(i&&typeof i==='object'&&i.slice&&typeof i.slice==='object'){const L=typeof o==='string'?o.length:o.length;let{a,b,c}=i.slice;c=c===null?1:c;if(c===0)throw err('ValueError','slice step cannot be zero');const n=L;let s,e;if(c>0){s=a===null?0:a<0?Math.max(0,n+a):Math.min(a,n);e=b===null?n:b<0?Math.max(0,n+b):Math.min(b,n)}else{s=a===null?n-1:a<0?n+a:Math.min(a,n-1);e=b===null?-1:b<0?n+b:Math.min(b,n-1)}const idx=[];if(c>0)for(let k=s;k<e;k+=c)idx.push(k);else for(let k=s;k>e;k+=c)idx.push(k);if(typeof o==='string')return idx.map(k=>o[k]).join('');const r=o instanceof T?new T():[];idx.forEach(k=>r.push(o[k]));return r}
 if(o instanceof D){const r=dget(o,i);if(!r)throw new PyErr(new Exc(EXT.KeyError,rp(i),[i]));return r[1]}
 if(typeof o==='string'||Array.isArray(o)){if(!isInt(i))throw err('TypeError',`${typeof o==='string'?'string':Array.isArray(o)&&!(o instanceof T)?'list':'tuple'} indices must be integers, not '${tn(i)}'`);const j=i<0?o.length+i:i;if(j<0||j>=o.length)throw err('IndexError',typeof o==='string'?'string index out of range':(o instanceof T?'tuple':'list')+' index out of range');return o[j]}
 if(o instanceof Inst){const m=fnd(o.c,'__getitem__');if(m)return call(new Bound(m,o),[i],{})}
 if(o&&o.rng)return getItem(iter(o),i);throw err('TypeError',`'${tn(o)}' object is not subscriptable`)}
function contains(c,x){if(typeof c==='string'){if(typeof x!=='string')throw err('TypeError',"'in <string>' requires string as left operand");return c.includes(x)}if(c instanceof D)return !!dget(c,x);if(c instanceof St)return c.m.has(key(x));if(c&&c.rng)return iter(c).some(y=>y===x);if(Array.isArray(c))return c.some(y=>eq(y,x));if(c instanceof Inst){const m=fnd(c.c,'__contains__');if(m)return tr(call(new Bound(m,c),[x],{}))}throw err('TypeError',`argument of type '${tn(c)}' is not iterable`)}
function runComp(cl,env,fn,i=0){if(i===cl.length){fn(env);return}const c=cl[i];for(const v of iter(ev(c.it,env))){tick();bind(c.tg,v,env);if(c.ifs.every(f=>tr(ev(f,env))))runComp(cl,env,fn,i+1)}}
function ev(n,env){switch(n.t){
 case 'const':return n.v;case 'par':return ev(n.e,env);case 'name':return env.get(n.n);
 case 'fs':{let s='';for(const p of n.parts){if(typeof p==='string')s+=p;else{let v=ev(p.e,env);if(p.conv==='r')v=rp(v);else if(p.conv==='s')v=st(v);const sp=p.spec===null?'':typeof p.spec==='string'?p.spec:p.spec.map(x=>typeof x==='string'?x:fmtv(ev(x.e,env),x.spec)).join('');s+=fmtv(v,sp)}}return s}
 case 'tup':{const r=new T();for(const x of n.a){if(x.t==='star')iter(ev(x.e,env)).forEach(y=>r.push(y));else r.push(ev(x,env))}return r}
 case 'list':{const r=[];for(const x of n.a){if(x.t==='star')iter(ev(x.e,env)).forEach(y=>r.push(y));else r.push(ev(x,env))}return r}
 case 'set':{const r=new St();for(const x of n.a){const v=ev(x,env);r.m.set(key(v),v)}return r}
 case 'dict':{const r=new D();for(const e of n.a){if(e.sp){const o=ev(e.sp,env);for(const[,[k,v]]of o.m)dset(r,k,v)}else dset(r,ev(e.k,env),ev(e.v,env))}return r}
 case 'lcomp':case 'gen':{const r=[];const e2=new Env(env,env.root);runComp(n.c,e2,e3=>r.push(ev(n.e,e3)));return r}
 case 'scomp':{const r=new St();const e2=new Env(env,env.root);runComp(n.c,e2,e3=>{const v=ev(n.e,e3);r.m.set(key(v),v)});return r}
 case 'dcomp':{const r=new D();const e2=new Env(env,env.root);runComp(n.c,e2,e3=>dset(r,ev(n.k,e3),ev(n.v,e3)));return r}
 case 'lam':return new Fn('<lambda>',n.ps,[{t:'ret',e:n.b}],env);
 case 'cond':return tr(ev(n.c,env))?ev(n.a,env):ev(n.b,env);
 case 'or':{const l=ev(n.l,env);return tr(l)?l:ev(n.r,env)}case 'and':{const l=ev(n.l,env);return tr(l)?ev(n.r,env):l}case 'not':return !tr(ev(n.e,env));
 case 'un':{const v=ev(n.e,env);if(n.o==='-'){if(v instanceof Inst){const m=fnd(v.c,'__neg__');if(m)return call(new Bound(m,v),[],{})}if(!isNum(v))throw err('TypeError',`bad operand type for unary -: '${tn(v)}'`);return v instanceof F?new F(-v.v):-nv(v)}if(n.o==='+')return v;return ~nv(v)}
 case 'bin':return arith(n.o,ev(n.l,env),ev(n.r,env));
 case 'cmp':{let l=ev(n.l,env);for(const[o,rn]of n.ops){const r=ev(rn,env);let ok;switch(o){case '==':ok=eq(l,r);break;case '!=':ok=!eq(l,r);break;case '<':ok=cmp(l,r)<0;break;case '>':ok=cmp(l,r)>0;break;case '<=':ok=cmp(l,r)<=0;break;case '>=':ok=cmp(l,r)>=0;break;case 'in':ok=contains(r,l);break;case 'not in':ok=!contains(r,l);break;case 'is':ok=l===r||(isNum(l)&&isNum(r)&&nv(l)===nv(r)&&typeof l===typeof r);break;case 'is not':ok=!(l===r||(isNum(l)&&isNum(r)&&nv(l)===nv(r)&&typeof l===typeof r));break}if(!ok)return false;l=r}return true}
 case 'slice':{const g=x=>x===null?null:nv(ev(x,env));return{slice:{a:g(n.a),b:g(n.b),c:g(n.c)}}}
 case 'idx':return getItem(ev(n.e,env),ev(n.i,env));
 case 'attr':return getAttr(ev(n.e,env),n.n);
 case 'call':{const f=ev(n.f,env);const args=[],kw={};for(const a of n.args){if(a.star)iter(ev(a.e,env)).forEach(x=>args.push(x));else if(a.kw===null){const d=ev(a.e,env);for(const[,[k,v]]of d.m)kw[k]=v}else if(a.kw)kw[a.kw]=ev(a.e,env);else args.push(ev(a.e,env))}
  if(n.f.t==='name'&&n.f.n==='super'&&!args.length){const fe=env.get('__class__'),self=env.get('self');return new Sup(fe,self)}
  CX.line=n.ln;return call(f,args,kw)}
 case 'star':throw new SyntaxErr("can't use starred expression here",0)}
 throw new Error('node '+n.t)}
function call(f,args,kw){tick();
 if(f instanceof Fn){if(++depthC>400){depthC=0;throw err('RecursionError','maximum recursion depth exceeded')}const e=new Env(f.cl,f.cl.root);try{let ai=0;const ps=f.ps;for(const p of ps){if(p.kw){const o=new D();for(const k in kw)if(!ps.some(q=>q.n===k))dset(o,k,kw[k]);e.v.set(p.n,o)}else if(p.star){if(p.n)e.v.set(p.n,mkT(args.slice(ai)));ai=args.length}else{if(ai<args.length){if(p.n in kw)throw err('TypeError',`${f.name}() got multiple values for argument '${p.n}'`);e.v.set(p.n,args[ai++])}else if(p.n in kw)e.v.set(p.n,kw[p.n]);else if(p.d)e.v.set(p.n,p.dv!==undefined?p.dv:(p.dv=ev(p.d,f.cl)));else{const miss=ps.filter(q=>!q.kw&&!q.star&&q.d===undefined&&!e.v.has(q.n)).map(q=>`'${q.n}'`);throw err('TypeError',`${f.name}() missing ${miss.length} required positional argument${miss.length>1?'s':''}: ${miss.join(' and ')}`)}}}
   if(ai<args.length)throw err('TypeError',`${f.name}() takes ${ps.filter(q=>!q.kw&&!q.star).length} positional argument${ps.length!==1?'s':''} but ${args.length} ${args.length===1?'was':'were'} given`);
   for(const k in kw)if(!ps.some(q=>q.n===k||q.kw))throw err('TypeError',`${f.name}() got an unexpected keyword argument '${k}'`);
   try{exec(f.body,e)}catch(x){if(x instanceof Ret)return x.v;throw x}return null}finally{depthC--}}
 if(f instanceof Bound)return call(f.f,[f.s,...args],kw);
 if(typeof f==='function')return f(args,kw);
 if(f instanceof Cls){const o=new Inst(f);const ini=fnd(f,'__init__');if(ini)call(new Bound(ini,o),args,kw);else if(clsExc(f))o.a.set('args',args);return o}
 if(f instanceof ExcT){return new Exc(f,args.length===1?st(args[0]):args.map(st).join(', '),args)}
 if(f instanceof Inst){const m=fnd(f.c,'__call__');if(m)return call(new Bound(m,f),args,kw)}
 throw err('TypeError',`'${tn(f)}' object is not callable`)}
function getAttr(o,n){
 if(o instanceof Inst){if(o.a.has(n))return o.a.get(n);const m=fnd(o.c,n);if(m)return m instanceof Fn?new Bound(m,o):m;if(isExcInst(o)&&n==='args')return mkT([]);throw err('AttributeError',`'${o.c.name}' object has no attribute '${n}'`)}
 if(o instanceof Sup){for(const b of o.c.bases||[]){const m=b instanceof Cls?fnd(b,n):null;if(m)return new Bound(m,o.i)}if(n==='__init__')return()=>null;throw err('AttributeError',`super has no attribute '${n}'`)}
 if(o instanceof Cls){const m=fnd(o,n);if(m)return m;throw err('AttributeError',`type object '${o.name}' has no attribute '${n}'`)}
 if(o instanceof Exc){if(n==='args')return mkT(o.args);if(n==='__class__')return o.t}
 if(o&&o.mod){const v=o.attrs[n];if(v===undefined)throw err('AttributeError',`module '${o.mod}' has no attribute '${n}'`);return v}
 const M=methods(o,n);if(M)return M;
 if(o instanceof F&&n==='is_integer')return()=>Number.isInteger(o.v);
 if(o instanceof Fn&&n==='__name__')return o.name;
 throw err('AttributeError',`'${tn(o)}' object has no attribute '${n}'`)}
const sortList=(a,kw)=>{const kf=kw.key,rv=kw.reverse&&tr(kw.reverse);const w=a.map(x=>[kf?call(kf,[x],{}):x,x]);w.sort((x,y)=>cmp(x[0],y[0]));if(rv)w.reverse();return w.map(x=>x[1])};
function methods(o,n){
 if(typeof o==='string'){const s=o;const M={
  upper:()=>s.toUpperCase(),lower:()=>s.toLowerCase(),title:()=>s.toLowerCase().replace(/(^|[^a-zа-я])([a-zа-я])/g,(m,a,b)=>a+b.toUpperCase()),capitalize:()=>s.charAt(0).toUpperCase()+s.slice(1).toLowerCase(),swapcase:()=>[...s].map(c=>c===c.toUpperCase()?c.toLowerCase():c.toUpperCase()).join(''),
  strip:a=>a[0]?s.replace(new RegExp('^['+esc(a[0])+']+|['+esc(a[0])+']+$','g'),''):s.trim(),lstrip:a=>a[0]?s.replace(new RegExp('^['+esc(a[0])+']+'),''):s.trimStart(),rstrip:a=>a[0]?s.replace(new RegExp('['+esc(a[0])+']+$'),''):s.trimEnd(),
  split:(a,kw)=>{const sep=a[0]!==undefined?a[0]:kw.sep!==undefined?kw.sep:null,mx=a[1]!==undefined?a[1]:kw.maxsplit!==undefined?kw.maxsplit:-1;if(sep===null){const parts=s.trim()?s.trim().split(/\s+/):[];if(mx>=0&&parts.length>mx+1){const r=[];let rest=s.trimStart();for(let i=0;i<mx;i++){const m=rest.match(/^(\S+)\s+/);r.push(m[1]);rest=rest.slice(m[0].length)}r.push(rest.trimEnd());return r}return parts}if(sep==='')throw err('ValueError','empty separator');const parts=s.split(sep);if(mx>=0&&parts.length>mx+1)return[...parts.slice(0,mx),parts.slice(mx).join(sep)];return parts},
  rsplit:a=>{const sep=a[0],mx=a[1]===undefined?-1:a[1];if(sep===undefined)return s.trim().split(/\s+/);const p=s.split(sep);if(mx>=0&&p.length>mx+1)return[p.slice(0,p.length-mx).join(sep),...p.slice(p.length-mx)];return p},
  splitlines:()=>s.split(/\r?\n/).filter((x,i,a)=>!(i===a.length-1&&x==='')),join:a=>iter(a[0]).map(x=>{if(typeof x!=='string')throw err('TypeError',`sequence item: expected str instance, ${tn(x)} found`);return x}).join(s),
  replace:a=>a[2]!==undefined&&a[2]>=0?(()=>{let r=s,c=0,out='',i=0;while(c<a[2]){const j=r.indexOf(a[0],i);if(j<0)break;out+=r.slice(i,j)+a[1];i=j+a[0].length;c++}return out+r.slice(i)})():s.split(a[0]).join(a[1]),
  startswith:a=>Array.isArray(a[0])?a[0].some(x=>s.startsWith(x)):s.startsWith(a[0]),endswith:a=>Array.isArray(a[0])?a[0].some(x=>s.endsWith(x)):s.endsWith(a[0]),
  find:a=>s.indexOf(a[0],a[1]||0),rfind:a=>s.lastIndexOf(a[0]),index:a=>{const i=s.indexOf(a[0]);if(i<0)throw err('ValueError','substring not found');return i},count:a=>a[0]===''?s.length+1:s.split(a[0]).length-1,
  isdigit:()=>/^\d+$/.test(s),isnumeric:()=>/^\d+$/.test(s),isalpha:()=>/^[A-Za-z\u0400-\u04FF]+$/.test(s),isalnum:()=>/^[A-Za-z0-9\u0400-\u04FF]+$/.test(s),isspace:()=>/^\s+$/.test(s),isupper:()=>/[A-ZА-Я]/.test(s)&&s===s.toUpperCase(),islower:()=>/[a-zа-я]/.test(s)&&s===s.toLowerCase(),
  zfill:a=>{const neg=s[0]==='-'||s[0]==='+';return neg?s[0]+s.slice(1).padStart(a[0]-1,'0'):s.padStart(a[0],'0')},center:a=>{const w=a[0],f=a[1]||' ',p=Math.max(0,w-s.length),l=p>>1;return f.repeat(l+(p&w&1?1:0)*0)+s+f.repeat(p-l)},ljust:a=>s.padEnd(a[0],a[1]||' '),rjust:a=>s.padStart(a[0],a[1]||' '),
  partition:a=>{const i=s.indexOf(a[0]);return i<0?mkT([s,'','']):mkT([s.slice(0,i),a[0],s.slice(i+a[0].length)])},rpartition:a=>{const i=s.lastIndexOf(a[0]);return i<0?mkT(['','',s]):mkT([s.slice(0,i),a[0],s.slice(i+a[0].length)])},
  format:(a,kw)=>{let ai=0;return s.replace(/\{\{|\}\}|\{([^{}:!]*)(?:!([rs]))?(?::([^{}]*))?\}/g,(m,nm,cv,sp)=>{if(m==='{{')return'{';if(m==='}}')return'}';let v;if(nm===''||nm===undefined)v=a[ai++];else{const parts=nm.split(/[.\[]/);v=/^\d+$/.test(parts[0])?a[+parts[0]]:kw[parts[0]];if(v===undefined)throw err('KeyError',rp(parts[0]));for(const pt of parts.slice(1)){const kk=pt.replace(']','');v=/^\d+$/.test(kk)?getItem(v,+kk):v instanceof D?getItem(v,kk):getAttr(v,kk)}}if(cv==='r')v=rp(v);return fmtv(v,sp||'')})},
  encode:()=>[...new TextEncoder().encode(s)],isidentifier:()=>/^[A-Za-z_]\w*$/.test(s),removeprefix:a=>s.startsWith(a[0])?s.slice(a[0].length):s,removesuffix:a=>s.endsWith(a[0])&&a[0]?s.slice(0,-a[0].length):s,expandtabs:()=>s.replace(/\t/g,'        ')};return M[n]?(a,kw)=>M[n](a||[],kw||{}):null}
 if(Array.isArray(o)&&!(o instanceof T)){const a=o;const M={append:x=>{a.push(x[0]);return null},extend:x=>{iter(x[0]).forEach(y=>a.push(y));return null},pop:x=>{if(!a.length)throw err('IndexError','pop from empty list');const i=x[0]===undefined?a.length-1:(x[0]<0?a.length+x[0]:x[0]);if(i<0||i>=a.length)throw err('IndexError','pop index out of range');return a.splice(i,1)[0]},insert:x=>{let i=x[0];if(i<0)i=Math.max(0,a.length+i);a.splice(Math.min(i,a.length),0,x[1]);return null},remove:x=>{const i=a.findIndex(y=>eq(y,x[0]));if(i<0)throw err('ValueError','list.remove(x): x not in list');a.splice(i,1);return null},
  sort:(x,kw)=>{const r=sortList(a,kw);r.forEach((v,i)=>a[i]=v);return null},reverse:()=>{a.reverse();return null},index:x=>{const i=a.findIndex(y=>eq(y,x[0]));if(i<0)throw err('ValueError',`${rp(x[0])} is not in list`);return i},count:x=>a.filter(y=>eq(y,x[0])).length,copy:()=>a.slice(),clear:()=>{a.length=0;return null}};return M[n]?(x,kw)=>M[n](x||[],kw||{}):null}
 if(o instanceof T){const M={index:x=>{const i=o.findIndex(y=>eq(y,x[0]));if(i<0)throw err('ValueError','tuple.index(x): x not in tuple');return i},count:x=>o.filter(y=>eq(y,x[0])).length};return M[n]?(x)=>M[n](x||[]):null}
 if(o instanceof D){const M={get:x=>{const r=dget(o,x[0]);return r?r[1]:(x[1]===undefined?null:x[1])},keys:()=>[...o.m.values()].map(a=>a[0]),values:()=>[...o.m.values()].map(a=>a[1]),items:()=>[...o.m.values()].map(a=>mkT([a[0],a[1]])),
  pop:x=>{const k=key(x[0]);if(o.m.has(k)){const v=o.m.get(k)[1];o.m.delete(k);return v}if(x[1]!==undefined)return x[1];throw new PyErr(new Exc(EXT.KeyError,rp(x[0]),[x[0]]))},update:(x,kw)=>{if(x[0]instanceof D)for(const[,[k,v]]of x[0].m)dset(o,k,v);else if(x[0])iter(x[0]).forEach(p=>dset(o,p[0],p[1]));for(const k in kw)dset(o,k,kw[k]);return null},setdefault:x=>{const r=dget(o,x[0]);if(r)return r[1];dset(o,x[0],x[1]===undefined?null:x[1]);return x[1]===undefined?null:x[1]},copy:()=>{const r=new D();for(const[k,v]of o.m)r.m.set(k,[...v]);return r},clear:()=>{o.m.clear();return null},popitem:()=>{const ks=[...o.m.keys()];if(!ks.length)throw err('KeyError','popitem(): dictionary is empty');const v=o.m.get(ks[ks.length-1]);o.m.delete(ks[ks.length-1]);return mkT(v)}};return M[n]?(x,kw)=>M[n](x||[],kw||{}):null}
 if(o instanceof St){const M={add:x=>{o.m.set(key(x[0]),x[0]);return null},remove:x=>{if(!o.m.delete(key(x[0])))throw err('KeyError',rp(x[0]));return null},discard:x=>{o.m.delete(key(x[0]));return null},pop:()=>{const k=o.m.keys().next().value;const v=o.m.get(k);o.m.delete(k);return v},union:x=>arith('|',o,mkSet(iter(x[0]))),intersection:x=>arith('&',o,mkSet(iter(x[0]))),difference:x=>arith('-',o,mkSet(iter(x[0]))),issubset:x=>[...o.m.keys()].every(k=>mkSet(iter(x[0])).m.has(k)),issuperset:x=>iter(x[0]).every(v=>o.m.has(key(v))),update:x=>{iter(x[0]).forEach(v=>o.m.set(key(v),v));return null},copy:()=>mkSet(iter(o)),clear:()=>{o.m.clear();return null}};return M[n]?(x)=>M[n](x||[]):null}
 if(o instanceof FileO){const M={read:()=>{const t=fileText(o);const r=t.slice(o.pos);o.pos=t.length;return r},readline:()=>{const t=fileText(o);if(o.pos>=t.length)return'';let e=t.indexOf('\n',o.pos);e=e<0?t.length:e+1;const r=t.slice(o.pos,e);o.pos=e;return r},readlines:()=>fileLines(o),write:x=>{if(!/[wax]/.test(o.mode))throw err('OSError','not writable');const e=sxWrite(o.X.fs,o.p,String(x[0]),true);if(e)throw err('OSError',e);return String(x[0]).length},writelines:x=>{iter(x[0]).forEach(l=>sxWrite(o.X.fs,o.p,l,true));return null},close:()=>{o.closed=true;return null},__enter__:()=>o,__exit__:()=>null};return M[n]?(x)=>M[n](x||[]):null}
 return null}
const esc=s=>s.replace(/[\]\\^-]/g,'\\$&');
const mkSet=a=>{const r=new St();a.forEach(v=>r.m.set(key(v),v));return r};
const fileText=f=>{const n=f.X.fs[f.p];return n?String(n.c||''):''};
const fileLines=f=>{const t=fileText(f).slice(f.pos);f.pos=fileText(f).length;return t.match(/[^\n]*\n|[^\n]+$/g)||[]};
// ---------- исполнение ----------
function exec(b,env){for(const s of b){CX.line=s.ln;run1(s,env)}}
function run1(s,env){tick();switch(s.t){
 case 'expr':{const v=ev(s.e,env);if(CX.repl&&v!==null)CX.out(rp(v)+'\n');return}
 case 'assign':{const v=ev(s.e,env);for(const t of s.tg)bind(t,v,env);return}
 case 'aug':{const t=s.tg;if(t.t==='name'){env.set(t.n,augv(s.o,env.get(t.n),ev(s.e,env)))}else if(t.t==='idx'){const o=ev(t.e,env),i=ev(t.i,env);setItem(o,i,augv(s.o,getItem(o,i),ev(s.e,env)))}else if(t.t==='attr'){const o=ev(t.e,env);o.a.set(t.n,augv(s.o,getAttr(o,t.n),ev(s.e,env)))}return}
 case 'if':{for(const[c,b]of s.arms)if(tr(ev(c,env))){exec(b,env);return}if(s.els)exec(s.els,env);return}
 case 'while':{let brk=false;while(tr(ev(s.c,env))){tick();try{exec(s.b,env)}catch(x){if(x instanceof Brk){brk=true;break}if(x instanceof Cnt)continue;throw x}}if(!brk&&s.els)exec(s.els,env);return}
 case 'for':{let brk=false;const it=ev(s.it,env);const src=it&&it.rng?lazyRange(it.rng):iter(it);for(const v of src){tick();bind(s.tg,v,env);try{exec(s.b,env)}catch(x){if(x instanceof Brk){brk=true;break}if(x instanceof Cnt)continue;throw x}}if(!brk&&s.els)exec(s.els,env);return}
 case 'def':{env.set(s.n,new Fn(s.n,s.ps,s.b,env));return}
 case 'class':{const bases=s.bases.map(b=>ev(b,env));const e2=new Env(env,env.root);const c=new Cls(s.n,bases,e2);e2.v.set('__class__',c);exec(s.b,e2);env.set(s.n,c);return}
 case 'ret':throw new Ret(s.e?ev(s.e,env):null);case 'break':throw new Brk();case 'cont':throw new Cnt();case 'pass':return;
 case 'global':env.g=env.g||new Set();s.n.forEach(n=>env.g.add(n));return;
 case 'del':{const ts=s.e.t==='tup'?s.e.a:[s.e];for(const t of ts){if(t.t==='idx'){const o=ev(t.e,env),i=ev(t.i,env);if(o instanceof D){if(!o.m.delete(key(i)))throw new PyErr(new Exc(EXT.KeyError,rp(i),[i]))}else if(Array.isArray(o)){const j=i<0?o.length+i:i;if(j<0||j>=o.length)throw err('IndexError','list assignment index out of range');o.splice(j,1)}}else if(t.t==='name')env.v.delete(t.n)}return}
 case 'assert':if(!tr(ev(s.c,env)))throw new PyErr(new Exc(EXT.AssertionError,s.m?st(ev(s.m,env)):'',s.m?[ev(s.m,env)]:[]));return;
 case 'raise':{if(!s.e){if(CX.cur)throw CX.cur;throw err('RuntimeError','No active exception to reraise')}let v=ev(s.e,env);if(v instanceof ExcT)v=call(v,[],{});if(!(v instanceof Exc)&&!isExcInst(v))throw err('TypeError','exceptions must derive from BaseException');throw new PyErr(v)}
 case 'try':{try{try{exec(s.b,env)}catch(x){if(!(x instanceof PyErr)){if(x instanceof RangeError)x=err('RecursionError','maximum recursion depth exceeded');else throw x}const e=x.e;let done=false;for(const h of s.ex){const ok=h.ty===null||(()=>{const t=ev(h.ty,env);return isinst(e,t)})();if(ok){if(h.as)env.set(h.as,e);const prev=CX.cur;CX.cur=x;try{exec(h.b,env)}finally{CX.cur=prev}done=true;break}}if(!done)throw x;return}if(s.els)exec(s.els,env)}finally{if(s.fin)exec(s.fin,env)}return}
 case 'with':{const objs=[];try{for(const it of s.items){const o=ev(it.e,env);const en=o instanceof FileO?o:o instanceof Inst?call(new Bound(fnd(o.c,'__enter__'),o),[],{}):o;objs.push(o);if(it.as)bind(it.as,en,env)}exec(s.b,env)}finally{objs.forEach(o=>{if(o instanceof FileO)o.closed=true;else if(o instanceof Inst){const m=fnd(o.c,'__exit__');if(m)call(new Bound(m,o),[null,null,null],{})}})}return}
 case 'import':{for(const[n,as]of s.a){const m=mod(n);env.set(as||n.split('.')[0],as?m:mod(n.split('.')[0]))}return}
 case 'from':{const m=mod(s.m);for(const[n,as]of s.a){if(n==='*'){for(const k in m.attrs)env.set(k,m.attrs[k])}else{const v=m.attrs[n];if(v===undefined)throw err('ImportError',`cannot import name '${n}' from '${s.m}'`);env.set(as||n,v)}}return}}
 throw new Error('stmt '+s.t)}
function augv(o,a,b){if(o==='+'&&Array.isArray(a)&&!(a instanceof T)){iter(b).forEach(x=>a.push(x));return a}return arith(o,a,b)}
// ---------- встроенные ----------
const bi=(n,f)=>{f.pyname=n;BI.set(n,f);return f};
function toInt(x,base){if(typeof x==='string'){const s=x.trim().replace(/_/g,'');const re=base&&base!==10?null:/^[+-]?\d+$/;if(base&&base!==10){const v=parseInt(s,base);if(Number.isNaN(v)||s==='')throw err('ValueError',`invalid literal for int() with base ${base}: ${q(x)}`);return v}if(!re.test(s))throw err('ValueError',`invalid literal for int() with base 10: ${q(x)}`);return parseInt(s,10)}if(x instanceof F){if(!Number.isFinite(x.v))throw err('OverflowError','cannot convert float infinity to integer');return Math.trunc(x.v)}if(isNum(x))return +x;throw err('TypeError',`int() argument must be a string or a real number, not '${tn(x)}'`)}
bi('int',(a)=>a.length?toInt(a[0],a[1]):0);
bi('float',a=>{if(!a.length)return new F(0);const x=a[0];if(typeof x==='string'){const s=x.trim().toLowerCase();if(s==='inf'||s==='infinity')return new F(Infinity);if(s==='-inf')return new F(-Infinity);if(s==='nan')return new F(NaN);if(!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/.test(s.replace(/_/g,'')))throw err('ValueError',`could not convert string to float: ${q(x)}`);return new F(parseFloat(s))}if(isNum(x))return new F(nv(x));throw err('TypeError',`float() argument must be a string or a real number, not '${tn(x)}'`)});
bi('str',a=>a.length?st(a[0]):'');bi('repr',a=>rp(a[0]));bi('bool',a=>a.length?tr(a[0]):false);
bi('list',a=>a.length?iter(a[0]):[]);bi('tuple',a=>mkT(a.length?iter(a[0]):[]));bi('set',a=>mkSet(a.length?iter(a[0]):[]));bi('frozenset',a=>mkSet(a.length?iter(a[0]):[]));
bi('dict',(a,kw)=>{const d=new D();if(a[0]){if(a[0] instanceof D)for(const[,[k,v]]of a[0].m)dset(d,k,v);else iter(a[0]).forEach(p=>{const x=iter(p);dset(d,x[0],x[1])})}for(const k in kw)dset(d,k,kw[k]);return d});
bi('len',a=>{const x=a[0];if(typeof x==='string'||Array.isArray(x))return x.length;if(x instanceof D||x instanceof St)return x.size;if(x&&x.rng)return iter(x).length;if(x instanceof Inst){const m=fnd(x.c,'__len__');if(m)return call(new Bound(m,x),[],{})}throw err('TypeError',`object of type '${tn(x)}' has no len()`)});
bi('range',a=>{let s=0,e,c=1;if(a.length===1)e=a[0];else{s=a[0];e=a[1];if(a.length>2)c=a[2]}for(const v of [s,e,c])if(!isInt(v))throw err('TypeError',`'${tn(v)}' object cannot be interpreted as an integer`);if(c===0)throw err('ValueError','range() arg 3 must not be zero');return{rng:{a:s,b:e,c}}});
bi('print',(a,kw)=>{const sep=kw.sep!==undefined&&kw.sep!==null?kw.sep:' ',end=kw.end!==undefined&&kw.end!==null?kw.end:'\n';const s=a.map(st).join(sep)+end;if(kw.file&&kw.file.stderr)CX.err(s);else CX.out(s);return null});
bi('input',a=>{if(a[0]!==undefined)CX.out(st(a[0]));const l=CX.readline();if(l===null)throw err('EOFError','EOF when reading a line');return l});
bi('sum',(a,kw)=>{let t=a[1]!==undefined?a[1]:kw.start!==undefined?kw.start:0;for(const x of iter(a[0]))t=arith('+',t,x);return t});
const mm=(n,sg)=>bi(n,(a,kw)=>{const arr=a.length===1?iter(a[0]):a;if(!arr.length){if(kw.default!==undefined)return kw.default;throw err('ValueError',`${n}() arg is an empty sequence`)}let best=arr[0],bk=kw.key?call(kw.key,[best],{}):best;for(const x of arr.slice(1)){const k=kw.key?call(kw.key,[x],{}):x;if(cmp(k,bk)*sg>0){best=x;bk=k}}return best});mm('min',-1);mm('max',1);
bi('abs',a=>a[0] instanceof F?new F(Math.abs(a[0].v)):Math.abs(nv(a[0])));
bi('sorted',(a,kw)=>sortList(iter(a[0]),kw));bi('reversed',a=>iter(a[0]).reverse());
bi('enumerate',(a,kw)=>{const s=a[1]!==undefined?a[1]:kw.start||0;return{it:iter(a[0]).map((x,i)=>mkT([i+s,x]))}});
bi('zip',a=>{const l=a.map(iter);const n=Math.min(...l.map(x=>x.length));return{it:Array.from({length:l.length?n:0},(_,i)=>mkT(l.map(x=>x[i])))}});
bi('map',a=>({it:a.length>2?(()=>{const l=a.slice(1).map(iter);const n=Math.min(...l.map(x=>x.length));return Array.from({length:n},(_,i)=>call(a[0],l.map(x=>x[i]),{}))})():iter(a[1]).map(x=>call(a[0],[x],{}))}));
bi('filter',a=>({it:iter(a[1]).filter(x=>a[0]===null?tr(x):tr(call(a[0],[x],{})))}));
bi('any',a=>iter(a[0]).some(tr));bi('all',a=>iter(a[0]).every(tr));
bi('round',a=>{const x=nv(a[0]);if(a[1]===undefined){const r=Math.round(x),d=Math.abs(x%1);const rr=d===0.5?2*Math.round(x/2):r;return rr}const m=Math.pow(10,a[1]);const v=Math.round(x*m)/m;return a[0] instanceof F?new F(+v.toFixed(Math.max(0,a[1]))):v});
bi('divmod',a=>mkT([arith('//',a[0],a[1]),arith('%',a[0],a[1])]));bi('pow',a=>a[2]!==undefined?Number((BigInt(a[0])**BigInt(a[1]))%BigInt(a[2])):arith('**',a[0],a[1]));
bi('ord',a=>a[0].codePointAt(0));bi('chr',a=>String.fromCodePoint(a[0]));bi('hex',a=>(a[0]<0?'-0x':'0x')+Math.abs(a[0]).toString(16));bi('bin',a=>(a[0]<0?'-0b':'0b')+Math.abs(a[0]).toString(2));bi('oct',a=>'0o'+a[0].toString(8));
bi('isinstance',a=>isinst(a[0],a[1]));bi('type',a=>{const x=a[0];const n=tn(x);return BI.get(n)||{pyname:n,toString:()=>n}});
bi('callable',a=>a[0] instanceof Fn||typeof a[0]==='function'||a[0] instanceof Bound||a[0] instanceof Cls);
bi('hasattr',a=>{try{getAttr(a[0],a[1]);return true}catch(e){if(e instanceof PyErr)return false;throw e}});bi('getattr',a=>{try{return getAttr(a[0],a[1])}catch(e){if(e instanceof PyErr&&a.length>2)return a[2];throw e}});bi('setattr',a=>{a[0].a.set(a[1],a[2]);return null});
bi('format',a=>fmtv(a[0],a[1]||''));bi('id',a=>1000);bi('iter',a=>({it:iter(a[0])}));bi('next',a=>{const o=a[0];if(o&&o.it){if(!o.it.length){if(a.length>1)return a[1];throw err('StopIteration','')}return o.it.shift()}throw err('TypeError','not an iterator')});
bi('exit',a=>{throw new Exit(a[0]===undefined?0:a[0])});BI.set('quit',BI.get('exit'));bi('super',()=>null);
bi('open',(a,kw)=>{const X=CX.X;const mode=a[1]||kw.mode||'r';const p=bAbs(X,a[0]);const n=X.fs[p];if(/r/.test(mode)&&!/\+/.test(mode)){if(!n)throw err('FileNotFoundError',`[Errno 2] No such file or directory: ${q(a[0])}`);if(n.d)throw err('OSError',`[Errno 21] Is a directory: ${q(a[0])}`)}else if(/w/.test(mode)){const e=sxWrite(X.fs,p,'');if(e)throw err('FileNotFoundError',`[Errno 2] No such file or directory: ${q(a[0])}`)}else if(/[ax]/.test(mode)&&!n){const e=sxWrite(X.fs,p,'');if(e)throw err('FileNotFoundError',`[Errno 2] No such file or directory: ${q(a[0])}`)}return new FileO(p,mode,X)});
for(const k in EXT){BI.set(k,EXT[k])}BI.set('IOError',EXT.OSError);BI.set('int',BI.get('int'));
const BN=['int','float','str','bool','list','tuple','set','dict'];
// ---------- модули ----------
function mod(n){const M=MODS[n];if(!M)throw err('ModuleNotFoundError',`No module named '${n}'`);return{mod:n,attrs:typeof M==='function'?M():M}}
const rx=(p,fl)=>{let f='g';if(fl&2||fl===2)f+='i';if(fl&8)f+='m';if(fl&16)f+='s';let pp=p.replace(/\(\?P<(\w+)>/g,'(?<$1>').replace(/\(\?P=(\w+)\)/g,'\\k<$1>');try{return new RegExp(pp,f)}catch(e){throw err('ValueError','re.error: '+e.message)}};
const matchO=m=>m?{mod:'re.Match',attrs:{group:a=>a[0]===undefined||a[0]===0?m[0]:(typeof a[0]==='string'?(m.groups||{})[a[0]]:m[a[0]])??null,groups:()=>mkT(m.slice(1).map(x=>x===undefined?null:x)),start:()=>m.index,end:()=>m.index+m[0].length,span:()=>mkT([m.index,m.index+m[0].length]),groupdict:()=>{const d=new D();for(const k in(m.groups||{}))dset(d,k,m.groups[k]);return d}}}:null;
// методы модулей принимают (args,kw)
const wrapM=o=>{const r={};for(const k in o)r[k]=typeof o[k]==='function'?o[k]:o[k];return r};
const MODS={
 sys:()=>({argv:CX.argv,exit:a=>{throw new Exit(a[0]===undefined?0:a[0])},platform:'linux',version:'3.11 (Stacktoniya)',stdout:{mod:'stdout',attrs:{write:a=>{CX.out(st(a[0]));return null},flush:()=>null}},stderr:{mod:'stderr',stderr:true,attrs:{write:a=>{CX.err(st(a[0]));return null},flush:()=>null}},stdin:{mod:'stdin',attrs:{read:()=>{let r='',l;while((l=CX.readline())!==null)r+=l+'\n';return r},readline:()=>{const l=CX.readline();return l===null?'':l+'\n'},readlines:()=>{const r=[];let l;while((l=CX.readline())!==null)r.push(l+'\n');return r}}},path:[],maxsize:9007199254740991}),
 os:()=>({getcwd:()=>CX.X.cwd,listdir:a=>{const X=CX.X,p=a[0]?bAbs(X,a[0]):X.cwd;const n=X.fs[p];if(!n)throw err('FileNotFoundError',`[Errno 2] No such file or directory: ${q(a[0]||'.')}`);if(!n.d)throw err('OSError','[Errno 20] Not a directory');const pre=p==='/'?'/':p+'/';return Object.keys(X.fs).filter(k=>k!==p&&k.startsWith(pre)&&!k.slice(pre.length).includes('/')).map(k=>k.slice(pre.length)).sort()},getenv:a=>{const v=CX.X.env&&CX.X.env[a[0]];return v===undefined?(a[1]===undefined?null:a[1]):v},environ:(()=>{const d=new D();const e=CX.X.env||{};for(const k in e)dset(d,k,String(e[k]));return d})(),sep:'/',linesep:'\n',name:'posix',remove:a=>{const X=CX.X,p=bAbs(X,a[0]);if(!X.fs[p])throw err('FileNotFoundError',`[Errno 2] No such file or directory: ${q(a[0])}`);delete X.fs[p];return null},mkdir:a=>{const e=sxWrite&&null;CX.X.fs[bAbs(CX.X,a[0])]={d:true,m:0o755};return null},system:()=>0,
  path:{mod:'os.path',attrs:{exists:a=>!!CX.X.fs[bAbs(CX.X,a[0])],isfile:a=>{const n=CX.X.fs[bAbs(CX.X,a[0])];return !!n&&!n.d},isdir:a=>{const n=CX.X.fs[bAbs(CX.X,a[0])];return !!n&&!!n.d},join:a=>a.reduce((x,y)=>y.startsWith('/')?y:(x===''||x.endsWith('/')?x+y:x+'/'+y),''),basename:a=>a[0].replace(/\/+$/,'').split('/').pop(),dirname:a=>a[0].includes('/')?(a[0].replace(/\/[^/]*$/,'')||'/'):'',splitext:a=>{const m=a[0].match(/^(.*?)(\.[^./]*)?$/);return mkT([m[1],m[2]||''])},getsize:a=>{const n=CX.X.fs[bAbs(CX.X,a[0])];if(!n)throw err('FileNotFoundError','[Errno 2] No such file or directory');return String(n.c||'').length},abspath:a=>bAbs(CX.X,a[0])}}}),
 re:()=>({IGNORECASE:2,I:2,MULTILINE:8,M:8,DOTALL:16,S:16,
  findall:a=>[...a[1].matchAll(rx(a[0],a[2]||0))].map(m=>m.length===1?m[0]:m.length===2?(m[1]??''):mkT(m.slice(1).map(x=>x??''))),
  match:a=>{const r=rx(a[0],a[2]||0);r.lastIndex=0;const m=r.exec(a[1]);return m&&m.index===0?matchO(m):null},search:a=>matchO(rx(a[0],a[2]||0).exec(a[1])),fullmatch:a=>{const m=new RegExp('^(?:'+a[0]+')$',(a[2]&2?'i':'')).exec(a[1]);return matchO(m)},
  sub:(a,kw)=>{const r=rx(a[0],a[3]||kw.flags||0);const rep=a[1];const cnt=a[2]||kw.count||0;let c=0;return a[1+1]!==undefined&&typeof a[2]==='string'?a[2]:a[2]!==undefined&&typeof a[2]==='string'?'':(()=>{const s=a[2];return null})()},
  split:a=>a[1].split(rx(a[0],0)).map(x=>x===undefined?null:x),escape:a=>a[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),compile:a=>({mod:'re.Pattern',attrs:{findall:b=>MODS.re().findall([a[0],b[0],a[1]]),match:b=>MODS.re().match([a[0],b[0],a[1]]),search:b=>MODS.re().search([a[0],b[0],a[1]]),sub:b=>MODS.re().sub([a[0],b[0],b[1]]),split:b=>MODS.re().split([a[0],b[0]])}})}),
 json:()=>({dumps:(a,kw)=>jdump(a[0],kw.indent!==undefined&&kw.indent!==null?kw.indent:null,0,kw.sort_keys&&tr(kw.sort_keys)),loads:a=>{try{return jconv(JSON.parse(a[0]))}catch(e){throw err('ValueError','JSONDecodeError: '+e.message)}},dump:(a)=>{CX.X&&0;return null},load:a=>jconv(JSON.parse(a[0].X?fileText(a[0]):'null'))}),
 math:()=>({pi:new F(Math.PI),e:new F(Math.E),inf:new F(Infinity),nan:new F(NaN),sqrt:a=>{if(nv(a[0])<0)throw err('ValueError','math domain error');return new F(Math.sqrt(nv(a[0])))},floor:a=>Math.floor(nv(a[0])),ceil:a=>Math.ceil(nv(a[0])),pow:a=>new F(Math.pow(nv(a[0]),nv(a[1]))),log:a=>{if(nv(a[0])<=0)throw err('ValueError','math domain error');return new F(a[1]!==undefined?Math.log(nv(a[0]))/Math.log(nv(a[1])):Math.log(nv(a[0])))},log2:a=>new F(Math.log2(nv(a[0]))),log10:a=>new F(Math.log10(nv(a[0]))),sin:a=>new F(Math.sin(nv(a[0]))),cos:a=>new F(Math.cos(nv(a[0]))),tan:a=>new F(Math.tan(nv(a[0]))),fabs:a=>new F(Math.abs(nv(a[0]))),factorial:a=>{let r=1;for(let i=2;i<=a[0];i++)r*=i;return r},gcd:a=>{let x=Math.abs(a[0]),y=Math.abs(a[1]);while(y)[x,y]=[y,x%y];return x},isqrt:a=>Math.floor(Math.sqrt(a[0])),trunc:a=>Math.trunc(nv(a[0])),exp:a=>new F(Math.exp(nv(a[0]))),hypot:a=>new F(Math.hypot(...a.map(nv)))}),
 time:()=>({time:()=>new F(Date.now()/1000),sleep:()=>null,strftime:a=>new Date().toISOString().slice(0,19).replace('T',' '),perf_counter:()=>new F(performance.now()/1000)}),
 random:()=>({seed:a=>{rngS=(a[0]|0)||1;return null},random:()=>new F(rnd()),randint:a=>a[0]+Math.floor(rnd()*(a[1]-a[0]+1)),choice:a=>{const l=iter(a[0]);if(!l.length)throw err('IndexError','Cannot choose from an empty sequence');return l[Math.floor(rnd()*l.length)]},shuffle:a=>{const l=a[0];for(let i=l.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[l[i],l[j]]=[l[j],l[i]]}return null},sample:a=>{const l=iter(a[0]);MODS.random().shuffle([l]);return l.slice(0,a[1])},uniform:a=>new F(nv(a[0])+rnd()*(nv(a[1])-nv(a[0])))}),
 collections:()=>({Counter:a=>{const d=new D();if(a[0])iter(a[0]).forEach(x=>{const r=dget(d,x);dset(d,x,(r?r[1]:0)+1)});return d},defaultdict:a=>new D(),OrderedDict:a=>BI.get('dict')(a,{})}),
 ipaddress:()=>({ip_address:a=>{const s=a[0];if(!/^(\d{1,3}\.){3}\d{1,3}$/.test(s)||s.split('.').some(x=>+x>255))throw err('ValueError',`${q(s)} does not appear to be an IPv4 or IPv6 address`);const o=new Inst(IPC);o.a.set('s',s);return o}}),
 subprocess:()=>({run:()=>{throw err('OSError','subprocess недоступен в учебной среде: используйте команды терминала')}}),
 datetime:()=>({datetime:{mod:'datetime.datetime',attrs:{now:()=>({mod:'dt',attrs:{strftime:a=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return a[0].replace(/%Y/g,d.getFullYear()).replace(/%m/g,p(d.getMonth()+1)).replace(/%d/g,p(d.getDate())).replace(/%H/g,p(d.getHours())).replace(/%M/g,p(d.getMinutes())).replace(/%S/g,p(d.getSeconds()))},isoformat:()=>new Date().toISOString().slice(0,19)}})}}}),
 string:()=>({ascii_lowercase:'abcdefghijklmnopqrstuvwxyz',ascii_uppercase:'ABCDEFGHIJKLMNOPQRSTUVWXYZ',digits:'0123456789',ascii_letters:'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',punctuation:'!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'}),
 hashlib:()=>({md5:a=>hashO(a,'md5'),sha256:a=>hashO(a,'sha256')}),
 argparse:()=>{throw err('ImportError','argparse не поддерживается: используйте sys.argv')}};
let rngS=12345;const rnd=()=>{rngS=(rngS*1103515245+12345)&0x7fffffff;return rngS/0x80000000};
const IPC=new Cls('IPv4Address',[],new Env(null));IPC.env.v.set('__str__',new Fn('__str__',[{n:'self'}],[{t:'ret',e:{t:'call',f:{t:'name',n:'__ipstr'},args:[{e:{t:'name',n:'self'}}]}}],new Env(null)));
BI.set('__ipstr',a=>a[0].a.get('s'));
function hashO(a,k){return{mod:'hash',attrs:{hexdigest:()=>{let h=0x811c9dc5,s=String(a[0]);const out=[];for(let r=0;r<(k==='md5'?4:8);r++){h=0x811c9dc5^r;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,0x01000193)}out.push((h>>>0).toString(16).padStart(8,'0'))}return out.join('')+''}}}}
function jdump(v,ind,lvl,sk){const nl=ind!==null?'\n'+' '.repeat(ind*(lvl+1)):'',nl0=ind!==null?'\n'+' '.repeat(ind*lvl):'',sp=ind!==null?',':', ',kv=': ';if(v===null)return'null';if(v===true)return'true';if(v===false)return'false';if(typeof v==='number')return String(v);if(v instanceof F)return fr(v.v);if(typeof v==='string')return JSON.stringify(v);
 if(Array.isArray(v))return v.length?'['+nl+v.map(x=>jdump(x,ind,lvl+1,sk)).join(sp+(ind!==null?nl:''))+nl0+']':'[]';
 if(v instanceof D){let es=[...v.m.values()];if(sk)es.sort((a,b)=>cmp(a[0],b[0]));return es.length?'{'+nl+es.map(([k,x])=>JSON.stringify(st(k))+kv+jdump(x,ind,lvl+1,sk)).join(sp+(ind!==null?nl:''))+nl0+'}':'{}'}throw err('TypeError',`Object of type ${tn(v)} is not JSON serializable`)}
function jconv(x){if(x===null||typeof x==='string'||typeof x==='boolean')return x;if(typeof x==='number')return Number.isInteger(x)?x:new F(x);if(Array.isArray(x))return x.map(jconv);const d=new D();for(const k in x)dset(d,k,jconv(x[k]));return d}
// re.sub — отдельно, с функцией-заменой
MODS.re_=null;const reMod=MODS.re;MODS.re=()=>{const m=reMod();m.sub=(a,kw)=>{const[p,rep,s]=a;const fl=a[4]||kw.flags||0;const cnt=a[3]!==undefined?a[3]:kw.count||0;const r=rx(p,fl);let c=0;return s.replace(r,(...m2)=>{if(cnt&&c>=cnt)return m2[0];c++;const gi=m2.findIndex(x=>typeof x==='number');const groups=m2.slice(0,gi);if(typeof rep==='string')return rep.replace(/\\(\d)/g,(z,d)=>groups[+d]??'').replace(/\\g<(\w+)>/g,(z,d)=>groups[+d]??'');const mo=matchO(Object.assign(groups.slice(),{index:m2[gi],groups:typeof m2[m2.length-1]==='object'?m2[m2.length-1]:undefined}));return st(call(rep,[mo],{}))})};return m};
// ---------- запуск ----------
function fmtErr(e,file,src){const lines=src.split('\n');const ln=e.line||CX.line||1;let t=`Traceback (most recent call last):\n  File "${file}", line ${ln}, in <module>\n`;const sl=(lines[ln-1]||'').trim();if(sl)t+=`    ${sl}\n`;const x=e.e;const nm=x instanceof Exc?x.t.name:(clsExc(x.c)?x.c.name:'Exception');const msg=st(x);return t+nm+(msg?': '+msg:'')+'\n'}
function run(src,o){CX={X:o.X,argv:o.argv,line:1,out:o.out,err:o.err,readline:o.readline,repl:false,cur:null};steps=0;depthC=0;
 let lines;try{lines=lex(src);const g=new Env(null);g.v.set('__name__','__main__');
  const prog=parseBlock(lines,0,lines.length?lines[0].ind:0);if(prog.i<lines.length)throw new SyntaxErr('unindent does not match any outer indentation level',lines[prog.i].ln);
  try{exec(prog.b,g)}catch(x){if(x instanceof Exit){return typeof x.c==='number'?x.c:(x.c===null?0:(o.err(st(x.c)+'\n'),1))}if(x instanceof RangeError)x=err('RecursionError','maximum recursion depth exceeded');if(x instanceof PyErr){o.err(fmtErr(x,o.file,src));return 1}if(x instanceof Ret||x instanceof Brk||x instanceof Cnt){o.err(`  File "${o.file}", line ${CX.line}\nSyntaxError: '${x instanceof Ret?'return':x instanceof Brk?'break':'continue'}' outside ${x instanceof Ret?'function':'loop'}\n`);return 1}throw x}return 0}
 catch(x){if(x instanceof SyntaxErr){o.err(`  File "${o.file}", line ${x.ln||1}\n    ${(src.split('\n')[(x.ln||1)-1]||'').trim()}\nSyntaxError: ${x.message}\n`);return 1}throw x}}
return{run,lex,ev,st,rp}})();
(function(){
const ADMC2=['python','python3','python3.11'];ADMC2.forEach(c=>{if(!ADMC.includes(c))ADMC.push(c)});
const pyCmd=(X,a,io)=>{let code=null,file=null,args=[];let i=0;
 if(a[0]==='-V'||a[0]==='--version'){io.out('Python 3.11.2 (учебная модель Стектонии)\n');return 0}
 if(a[0]==='-c'){code=a[1];args=['-c',...a.slice(2)];if(code===undefined){io.err('Argument expected for the -c option\n');return 2}}
 else if(a[0]&&a[0]!=='-'){file=a[0];args=a.slice();const p=bAbs(X,file);const n=X.fs[p];if(!n){io.err(`python3: can't open file '${p}': [Errno 2] No such file or directory\n`);return 2}if(n.d){io.err(`python3: can't open file '${p}': [Errno 21] Is a directory\n`);return 2}code=String(n.c||'')}
 else{const q=io.inp;if(!q){io.err('python3: интерактивный режим не поддерживается; запустите скрипт: python3 файл.py или python3 -c "код"\n');return 2}code=q.t.slice(q.p);q.p=q.t.length;args=['-']}
 const inp=io.inp&&(io.inp!==X.inp||io.inp.t.length)?io.inp:null;
 const readline=()=>{if(inp){if(inp.p>=inp.t.length)return null;let e=inp.t.indexOf('\n',inp.p);if(e<0)e=inp.t.length;const l=inp.t.slice(inp.p,e);inp.p=e+1;return l}if(typeof X.ask==='function'){const r=X.ask('');return r}return null};
 let buf='';const out=s=>{io.out(s)};
 try{return PY.run(code,{X,argv:args,file:file||'<string>',out,err:s=>io.err(s),readline})}catch(e){io.err('python3: внутренняя ошибка интерпретатора: '+e.message+'\n');return 1}};
BB.python=pyCmd;BB.python3=pyCmd;BB['python3.11']=pyCmd;
MAN.push(['Т44. Интерпретатор Python',`<p>В терминале bash работают команды <code>python3 файл.py [аргументы]</code>, <code>python3 -c "код"</code>, <code>python3 -V</code> и запуск скрипта из ввода (<code>echo 'print(1)' | python3</code>). Файлы читаются и пишутся в файловой системе узла, поэтому скрипты можно создавать в редакторе (<code>nano</code>, <code>vim</code>) или окне «Скрипты».</p>
<h3>Что поддерживается</h3><p>Типы: int, float, str, bool, None, list, tuple, dict, set. Операторы if/elif/else, for, while (с else), break/continue, def (значения по умолчанию, *args, **kwargs), lambda, class (методы, наследование, __init__, __str__, super()), try/except/else/finally, raise, assert, with, del, global. Выражения: включения списков/словарей/множеств, срезы, распаковка, f-строки с форматами (<code>{x:>8.2f}</code>), форматирование <code>%</code> и <code>str.format</code>. Встроенные: print, input, len, range, sorted, enumerate, zip, map, filter, sum, min, max, open и др. Модули: sys, os (+os.path), re, json, math, random, time, datetime, collections (Counter), string, ipaddress (ip_address), hashlib.</p>
<h3>Ошибки</h3><p>Ошибка выводится в стиле Python: <code>Traceback…</code>, строка, текст исключения (ZeroDivisionError, KeyError, IndexError, ValueError и т. д.); можно перехватывать через <code>try/except</code>. Синтаксические ошибки показывают номер и текст строки.</p>
<h3>Ограничения</h3><p>Это подмножество: целые числа — обычные 64-битные дробные (точны до 2<sup>53</sup>), нет генераторов (<code>yield</code>), декораторов, <code>import</code> сторонних пакетов, <code>subprocess</code>, сети, интерактивного режима REPL; <code>re</code> использует синтаксис регулярных выражений браузера. Слишком долгие циклы прерываются.</p>`]);
})();
