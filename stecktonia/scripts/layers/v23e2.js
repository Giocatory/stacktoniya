// ===== v23e2: PowerShell — значения, операторы, вычисление =====
class PsM{constructor(){this.m=new Map()}get(k){const e=this.m.get(String(k).toLowerCase());return e?e.v:undefined}has(k){return this.m.has(String(k).toLowerCase())}set(k,v){const l=String(k).toLowerCase(),e=this.m.get(l);if(e)e.v=v;else this.m.set(l,{k:String(k),v})}del(k){return this.m.delete(String(k).toLowerCase())}keys(){return[...this.m.values()].map(e=>e.k)}entries(){return[...this.m.values()].map(e=>[e.k,e.v])}get size(){return this.m.size}}
const psH=()=>({__h:1,m:new PsM()});
const psO=(props,tn)=>{const o={__o:1,tn:tn||'PSCustomObject',m:new PsM()};if(props)for(const k of Object.keys(props))o.m.set(k,props[k]);return o};
const isH=v=>!!v&&v.__h===1,isO=v=>!!v&&v.__o===1,isSB=v=>!!v&&v.__sb===1,isDT=v=>!!v&&v.__dt===1,isRe=v=>!!v&&v.__re===1;
const PSMON=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],PSDAY=['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
function psNum(n){if(Number.isInteger(n))return String(n);if(!isFinite(n))return n>0?'∞':n<0?'-∞':'NaN';return String(+n.toPrecision(15))}
function psStr(v){if(v===null||v===undefined)return'';if(typeof v==='boolean')return v?'True':'False';if(typeof v==='number')return psNum(v);if(typeof v==='string')return v;
 if(Array.isArray(v))return v.map(psStr).join(' ');if(isDT(v))return psDt(v.d,'dd.MM.yyyy HH:mm:ss');if(isSB(v))return '{ '+(v.src||'...')+' }';if(isRe(v))return v.src;
 if(isH(v))return 'System.Collections.Hashtable';if(isO(v)){if(v.tn==='ErrorRecord')return psStr(v.m.get('Exception').m.get('Message'));if(v.m.has('FullName')&&v.tn&&/Info$/.test(v.tn))return psStr(v.m.get('FullName'));if(v.ts)return v.ts(v);if(v.tn==='PSCustomObject')return '@{'+v.m.entries().map(([k,x])=>k+'='+psStr(x)).join('; ')+'}';return v.tn}
 if(v.__type)return '[' +v.__type+']';return String(v)}
function psDt(d,f){const z=(n,l=2)=>String(n).padStart(l,'0');const tok={yyyy:()=>d.getFullYear(),yy:()=>z(d.getFullYear()%100),MMMM:()=>PSMON[d.getMonth()],MMM:()=>PSMON[d.getMonth()].slice(0,3),MM:()=>z(d.getMonth()+1),M:()=>d.getMonth()+1,dddd:()=>PSDAY[d.getDay()],ddd:()=>PSDAY[d.getDay()].slice(0,2),dd:()=>z(d.getDate()),d:()=>d.getDate(),HH:()=>z(d.getHours()),H:()=>d.getHours(),hh:()=>z(d.getHours()%12||12),h:()=>d.getHours()%12||12,mm:()=>z(d.getMinutes()),m:()=>d.getMinutes(),ss:()=>z(d.getSeconds()),s:()=>d.getSeconds(),fff:()=>z(d.getMilliseconds(),3),tt:()=>d.getHours()<12?'AM':'PM'};
 return String(f).replace(/yyyy|yy|MMMM|MMM|MM|M|dddd|ddd|dd|d|HH|H|hh|h|mm|m|ss|s|fff|tt|'[^']*'/g,m=>m[0]==="'"?m.slice(1,-1):tok[m]())}
const psEnum=v=>v===null||v===undefined?[]:Array.isArray(v)?v:[v];
function psTruth(v){if(v===null||v===undefined)return false;if(typeof v==='boolean')return v;if(typeof v==='number')return v!==0;if(typeof v==='string')return v.length>0;if(Array.isArray(v))return v.length>1?true:v.length===1?psTruth(v[0]):false;return true}
function psToNum(v,strict){if(typeof v==='number')return v;if(v===null||v===undefined)return 0;if(typeof v==='boolean')return v?1:0;if(typeof v==='string'){const s=v.trim();if(s==='')return 0;if(/^0x[0-9a-f]+$/i.test(s))return parseInt(s,16);if(/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(s.replace(',','.')))return parseFloat(s.replace(',','.'))}
 if(Array.isArray(v)&&v.length===1)return psToNum(v[0]);if(strict===false)return NaN;throw psThrow(`Невозможно преобразовать значение "${psStr(v)}" в тип "System.Int32". Ошибка: "Входная строка имела неверный формат."`,'InvalidArgument','RuntimeException',v)}
function psRec(msg,cat,exc,target,cmd,id){const e=psO({Message:msg,TypeName:exc},exc||'RuntimeException');const r=psO({Exception:e,CategoryInfo:cat||'NotSpecified',TargetObject:target===undefined?null:target,FullyQualifiedErrorId:id||exc||'RuntimeException'},'ErrorRecord');r.cmd=cmd||'';r.msg=msg;r.cat=cat||'NotSpecified';r.exc=exc||'RuntimeException';r.target=target;r.id=id||exc||'RuntimeException';return r}
const psThrow=(msg,cat,exc,target,cmd,id)=>({ps:'throw',v:psRec(msg,cat,exc,target,cmd,id)});
function psEqv(a,b,cs){if(typeof a==='string'){const s=psStr(b);return cs?a===s:a.toLowerCase()===s.toLowerCase()}if(typeof a==='number'){const n=psToNum(b,false);return a===n}if(typeof a==='boolean')return a===psTruth(b);if(a===null||a===undefined)return b===null||b===undefined;if(isDT(a))return isDT(b)&&a.d.getTime()===b.d.getTime();return a===b}
function psCmpv(a,b,cs){if(typeof a==='string'&&typeof b!=='number'){const x=cs?a:a.toLowerCase(),y=cs?psStr(b):psStr(b).toLowerCase();return x<y?-1:x>y?1:0}if(isDT(a)&&isDT(b))return a.d-b.d;const x=psToNum(a,false),y=psToNum(b,false);if(isNaN(x)||isNaN(y)){const s=psStr(a).toLowerCase(),t=psStr(b).toLowerCase();return s<t?-1:s>t?1:0}return x<y?-1:x>y?1:0}
function psWild(p,cs){let r='^';for(let i=0;i<p.length;i++){const c=p[i];if(c==='*')r+='.*';else if(c==='?')r+='.';else if(c==='['){const j=p.indexOf(']',i+1);if(j>0){r+=p.slice(i,j+1);i=j}else r+='\\['}else r+=c.replace(/[.+^${}()|\\]/g,'\\$&')}return new RegExp(r+'$',cs?'s':'si')}
function psRx(p,cs){try{return new RegExp(isRe(p)?p.src:psStr(p),cs?'':'i')}catch(e){throw psThrow(`Невозможно разобрать регулярное выражение "${psStr(p)}".`,'InvalidArgument','ArgumentException')}}
function psFormat(fmt,args){return String(fmt).replace(/\{\{|\}\}|\{(\d+)(?:,(-?\d+))?(?::([^}]*))?\}/g,(m,i,w,f)=>{if(m==='{{')return'{';if(m==='}}')return'}';let v=args[+i];if(+i>=args.length)throw psThrow('Индекс (на основе нуля) должен быть больше или равен нулю и меньше размера списка аргументов.','InvalidOperation','FormatException');let s=psFmt1(v,f);if(w){const k=Math.abs(+w);s=+w<0?s.padEnd(k):s.padStart(k)}return s})}
function psFmt1(v,f){if(f===undefined||f==='')return psStr(v);let m;if(isDT(v))return psDt(v.d,f);const n=typeof v==='number'?v:(typeof v==='string'&&!isNaN(parseFloat(v))?parseFloat(v):null);
 if(n!==null){if((m=/^([NnFfDdXxPpEe])(\d*)$/.exec(f))){const k=m[2]===''?null:+m[2],t=m[1].toUpperCase();if(t==='N')return psGrp(n.toFixed(k===null?2:k));if(t==='F')return n.toFixed(k===null?2:k);if(t==='D')return String(Math.trunc(n)).padStart(k||0,'0');if(t==='X'){const x=Math.trunc(n).toString(16);return(m[1]==='X'?x.toUpperCase():x).padStart(k||0,'0')}if(t==='P')return (n*100).toFixed(k===null?2:k)+' %';if(t==='E')return n.toExponential(k===null?6:k)}
  if(/^[#0,.%]+$/.test(f)){const pct=f.includes('%');let x=pct?n*100:n;const dec=(f.split('.')[1]||'').replace(/[^0#]/g,'').length;const req=(f.split('.')[1]||'').replace(/#/g,'').length;let s=Math.abs(x).toFixed(dec);if(dec>req&&s.includes('.')){let [a,b]=s.split('.');b=b.replace(/0+$/,'');while(b.length<req)b+='0';s=b?a+'.'+b:a}let [ip,fp]=s.split('.');const ipf=f.split('.')[0];const minI=(ipf.match(/0/g)||[]).length;ip=ip.padStart(minI,'0');if(ipf.includes(','))ip=psGrp(ip);return (x<0?'-':'')+ip+(fp?'.'+fp:'')+(pct?'%':'')}}
 return psStr(v)}
const psGrp=s=>{const [a,b]=s.split('.');return a.replace(/\B(?=(\d{3})+(?!\d))/g,'\u00a0')+(b!==undefined?','+b:'')};
// ---- кастинг ----
function psCast(type,v){let t=String(type).trim().toLowerCase().replace(/^system\./,'');const arr=/\[\]$/.test(t);if(arr){const el=t.replace(/\[\]$/,'');return psEnum(v).map(x=>psCast(el,x))}
 switch(t){case'int':case'int32':case'long':case'int64':case'int16':case'uint32':case'byte':{if(typeof v==='string'&&/\./.test(v.replace(',','.'))||typeof v==='number'){const x=psToNum(v);const f=Math.floor(x),d=x-f;return d===0.5?(f%2===0?f:f+1):Math.round(x)}return Math.round(psToNum(v))}
  case'double':case'float':case'single':case'decimal':return psToNum(v);
  case'string':return Array.isArray(v)?v.map(psStr).join(' '):psStr(v);
  case'bool':case'boolean':return psTruth(v);
  case'char':return typeof v==='number'?String.fromCharCode(v):psStr(v)[0]||'';
  case'datetime':return isDT(v)?v:psParseDt(psStr(v));
  case'void':return null;case'object':case'psobject':case'object[]':case'array':return t==='array'||t==='object[]'?psEnum(v):v;
  case'hashtable':return isH(v)?v:psH();
  case'pscustomobject':{if(isH(v)){const o=psO();v.m.entries().forEach(([k,x])=>o.m.set(k,x));return o}return v}
  case'regex':return{__re:1,src:psStr(v)};
  case'scriptblock':return v;
  case'collections.arraylist':case'system.collections.arraylist':case'arraylist':{const a=psEnum(v).slice();a.al=true;return a}
  case'ipaddress':case'net.ipaddress':{const s=psStr(v);if(!/^(\d{1,3}\.){3}\d{1,3}$/.test(s)||s.split('.').some(x=>+x>255))throw psThrow(`Не удается преобразовать значение "${s}" в тип "System.Net.IPAddress".`,'InvalidArgument','RuntimeException');return psO({IPAddressToString:s,AddressFamily:'InterNetwork'},'IPAddress')}
  case'switch':case'switchparameter':return psTruth(v);
  case'version':{const s=psStr(v);if(/^\d+(\.\d+){1,3}$/.test(s))return{__ver:s.split('.').map(Number),s};return v}case'xml':return v}
 return v}
function psParseDt(s){let m;if((m=/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(s)))return{__dt:1,d:new Date(+m[3],+m[2]-1,+m[1],+(m[4]||0),+(m[5]||0),+(m[6]||0))};
 if((m=/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(s)))return{__dt:1,d:new Date(+m[1],+m[2]-1,+m[3],+(m[4]||0),+(m[5]||0),+(m[6]||0))};
 throw psThrow(`Не удается привести значение "${s}" к типу "System.DateTime". Ошибка: "Не удалось распознать строку как допустимый объект DateTime."`,'InvalidArgument','RuntimeException')}
const psTn=v=>v===null||v===undefined?'$null':typeof v==='string'?'String':typeof v==='boolean'?'Boolean':typeof v==='number'?(Number.isInteger(v)?'Int32':'Double'):Array.isArray(v)?(v.al?'ArrayList':'Object[]'):isH(v)?'Hashtable':isDT(v)?'DateTime':isSB(v)?'ScriptBlock':isO(v)?v.tn:'Object';
// ---- бинарные операторы ----
function psBin(S,op,a,b){const cs=op[0]==='c'&&/^c(eq|ne|gt|ge|lt|le|like|notlike|match|notmatch|contains|notcontains|replace|split)$/.test(op);const base=/^[ci](eq|ne|gt|ge|lt|le|like|notlike|match|notmatch|contains|notcontains|replace|split)$/.test(op)?op.slice(1):op;
 const arrL=Array.isArray(a)&&['eq','ne','gt','ge','lt','le','like','notlike','match','notmatch'].includes(base);
 if(arrL){const out=[];a.forEach(x=>{S.matchesTmp=null;if(psTruth(psBin(S,op,x,b)))out.push(x)});return out}
 switch(base){
  case'+':if(Array.isArray(a)){const r=a.concat(Array.isArray(b)?b:[b]);if(a.al)r.al=true;return r}if(typeof a==='string')return a+psStr(b);if(a===null||a===undefined)return b;if(isH(a)&&isH(b)){const h=psH();a.m.entries().forEach(([k,v])=>h.m.set(k,v));b.m.entries().forEach(([k,v])=>{if(h.m.has(k))throw psThrow('Ключ уже существует.','InvalidOperation','ArgumentException');h.m.set(k,v)});return h}if(isDT(a)&&isO(b)&&b.tn==='TimeSpan')return{__dt:1,d:new Date(a.d.getTime()+psToNum(b.m.get('TotalMilliseconds')))};
   if(typeof a==='number'){if(typeof b==='string'&&isNaN(psToNum(b,false)))throw psThrow(`Невозможно преобразовать значение "${b}" в тип "System.Int32". Ошибка: "Входная строка имела неверный формат."`,'InvalidArgument','RuntimeException');return a+psToNum(b)}return psToNum(a)+psToNum(b);
  case'-':if(isDT(a)&&isDT(b))return psSpan(a.d-b.d);if(isDT(a)&&isO(b)&&b.tn==='TimeSpan')return{__dt:1,d:new Date(a.d.getTime()-psToNum(b.m.get('TotalMilliseconds')))};return psToNum(a)-psToNum(b);
  case'*':if(typeof a==='string'){const n=psToNum(b);return a.repeat(Math.max(0,n))}if(Array.isArray(a)){let r=[];for(let i=0;i<psToNum(b);i++)r=r.concat(a);return r}return psToNum(a)*psToNum(b);
  case'/':{const y=psToNum(b);if(y===0)throw psThrow('Попытка деления на ноль.','NotSpecified','RuntimeException',null,'','RuntimeException');return psToNum(a)/y}
  case'%':{const y=psToNum(b);if(y===0)throw psThrow('Попытка деления на ноль.','NotSpecified','RuntimeException');return psToNum(a)%y}
  case'eq':return psEqv(a,b,cs);case'ne':return!psEqv(a,b,cs);
  case'gt':return psCmpv(a,b,cs)>0;case'ge':return psCmpv(a,b,cs)>=0;case'lt':return psCmpv(a,b,cs)<0;case'le':return psCmpv(a,b,cs)<=0;
  case'like':return psWild(psStr(b),cs).test(psStr(a));case'notlike':return!psWild(psStr(b),cs).test(psStr(a));
  case'match':case'notmatch':{const m=psRx(b,cs).exec(psStr(a));if(base==='match'){if(m){const h=psH();m.forEach((x,i)=>h.m.set(String(i),x===undefined?'':x));if(m.groups)Object.keys(m.groups).forEach(k=>h.m.set(k,m.groups[k]));psSetVar(S,'Matches',h)}return!!m}return!m}
  case'contains':return psEnum(a).some(x=>psEqv(x,b,cs));case'notcontains':return!psEnum(a).some(x=>psEqv(x,b,cs));
  case'in':return psEnum(b).some(x=>psEqv(x,a,cs));case'notin':return!psEnum(b).some(x=>psEqv(x,a,cs));
  case'replace':{const arr=Array.isArray(b)?b:[b];const re=psRx(arr[0],cs);const rep=arr.length>1?psStr(arr[1]):'';const f=s=>psStr(s).replace(new RegExp(re.source,re.flags+'g'),rep.replace(/\$\{(\w+)\}/g,'$<$1>'));return Array.isArray(a)?a.map(f):f(a)}
  case'split':{const arr=Array.isArray(b)?b:[b];const re=arr[0];let parts=psStr(a).split(psRx(re,cs));if(arr.length>1&&+arr[1]>0){const n=+arr[1];const full=psStr(a);const rx=new RegExp(psRx(re,cs).source,psRx(re,cs).flags+'g');const out=[];let last=0,m,c=0;while((m=rx.exec(full))&&c<n-1){out.push(full.slice(last,m.index));last=m.index+m[0].length;c++;if(m[0]==='')rx.lastIndex++}out.push(full.slice(last));parts=out}return parts}
  case'join':return psEnum(a).map(psStr).join(psStr(b));
  case'is':case'isnot':{const t=String(b.__type||psStr(b)).toLowerCase().replace(/^system\./,'');const tn=psTn(a).toLowerCase();const r=t===tn||(t==='int'&&tn==='int32')||(t==='string'&&tn==='string')||(t==='array'&&Array.isArray(a))||(t==='object[]'&&Array.isArray(a))||(t==='hashtable'&&isH(a))||(t==='double'&&tn==='double')||(t==='bool'&&tn==='boolean')||(t==='datetime'&&isDT(a))||(t==='pscustomobject'&&isO(a))||t==='object'||(t==='scriptblock'&&isSB(a));return base==='is'?r:!r}
  case'as':{try{return psCast(b.__type||psStr(b),a)}catch(e){return null}}
  case'and':return psTruth(a)&&psTruth(b);case'or':return psTruth(a)||psTruth(b);case'xor':return psTruth(a)!==psTruth(b);
  case'band':return psToNum(a)&psToNum(b);case'bor':return psToNum(a)|psToNum(b);case'bxor':return psToNum(a)^psToNum(b);case'shl':return psToNum(a)<<psToNum(b);case'shr':return psToNum(a)>>psToNum(b);
  case'f':return psFormat(psStr(a),psEnum(b).length||b===null?psEnum(b):[b])}
 throw psThrow('Неизвестный оператор '+op,'ParserError','ParseException')}
function psSpan(ms){const o=psO({Days:Math.trunc(ms/864e5),Hours:Math.trunc(ms%864e5/36e5),Minutes:Math.trunc(ms%36e5/6e4),Seconds:Math.trunc(ms%6e4/1e3),Milliseconds:Math.trunc(ms%1e3),TotalDays:ms/864e5,TotalHours:ms/36e5,TotalMinutes:ms/6e4,TotalSeconds:ms/1e3,TotalMilliseconds:ms},'TimeSpan');o.ts=x=>{const z=(n,l=2)=>String(Math.abs(n)).padStart(l,'0');const d=x.m.get('Days');return (d?d+'.':'')+z(x.m.get('Hours'))+':'+z(x.m.get('Minutes'))+':'+z(x.m.get('Seconds'))};return o}
// ---- переменные ----
function psSc(S){return S.sc}
function psGetVar(S,name,sc){const l=String(name).toLowerCase();
 if(sc==='env'){const v=S.env.get(name);return v===undefined?null:v}
 switch(l){case'true':return true;case'false':return false;case'null':return null;case'?':return S.ok;case'lastexitcode':return S.lec===undefined?null:S.lec;case'pwd':return psPathObj(S,S.cwd);case'home':return cWin(S.home);case'pid':return 4242;case'error':return S.errors;case'pshome':return'C:\\Windows\\System32\\WindowsPowerShell\\v1.0';case'psversiontable':return psO({PSVersion:'5.1.19041.3693',PSEdition:'Desktop',BuildVersion:'10.0.19041.3693'});case'psscriptroot':return S.scriptDir||'';case'host':return psO({Name:'ConsoleHost',Version:'5.1.19041.3693'});case'pscommandpath':return S.scriptPath||null;case'erroractionpreference':{const v=lookup();return v===undefined?'Continue':v}case'input':{const v=lookup();return v===undefined?[]:v}}
 const v=sc==='global'||sc==='script'?S.root.vars.get(name):lookup();return v===undefined?null:v;
 function lookup(){for(let s=S.sc;s;s=s.parent){const x=s.vars.get(name);if(x!==undefined)return x}return undefined}}
function psSetVar(S,name,val,sc){if(sc==='env'){if(val===null||val===undefined)S.env.del(name);else S.env.set(name,psStr(val));return}
 if(sc==='global'||sc==='script'){S.root.vars.set(name,val);return}S.sc.vars.set(name,val)}
function psPathObj(S,p){const o=psO({Path:cWin(p),Drive:'C',Provider:'Microsoft.PowerShell.Core\\FileSystem'},'PathInfo');o.ts=x=>x.m.get('Path');return o}
// ---- вычисление ----
const psTick=S=>{if(++S.steps>400000||Date.now()-S.t0>7000)throw{ps:'limit'}};
function psVal(S,n){const out=[];psRun(S,n,out);return out.length===0?null:out.length===1?out[0]:out}
function psEv(S,n){switch(n.t){
 case'num':return n.v;case'str':return n.v;
 case'istr':return n.parts.map(p=>typeof p==='string'?p:psStr(psEv(S,p))).join('');
 case'var':return psGetVar(S,n.n,n.sc);
 case'sub':{const out=[];n.body.forEach(s=>psRun(S,s,out));return out.length===0?null:out.length===1?out[0]:out}
 case'asub':{const out=[];n.body.forEach(s=>psRun(S,s,out));return out}
 case'paren':if(n.e.t==='assign'){psRun(S,n.e,[]);return psEv(S,n.e.l)}return psVal2(S,n.e);
 case'hash':{const h=psH();n.pairs.forEach(([k,v])=>{const key=psEv(S,k);h.m.set(psStr(key),psVal(S,v))});return h}
 case'sb':return{__sb:1,b:n.b,src:n.src||''};
 case'arr':return n.items.map(i=>psEv(S,i));
 case'range':{const a=psEv(S,n.a),b=psEv(S,n.b);if(typeof a==='string'&&a.length===1&&typeof b==='string'&&b.length===1){const r=[];const x=a.charCodeAt(0),y=b.charCodeAt(0);for(let i=x;x<=y?i<=y:i>=y;i+=x<=y?1:-1)r.push(String.fromCharCode(i));return r}const x=Math.trunc(psToNum(a)),y=Math.trunc(psToNum(b));if(Math.abs(y-x)>1e6)throw psThrow('Диапазон слишком велик.','InvalidArgument','RuntimeException');const r=[];for(let i=x;x<=y?i<=y:i>=y;i+=x<=y?1:-1)r.push(i);return r}
 case'bin':{if(n.op==='and'){const a=psEv(S,n.a);return psTruth(a)?psTruth(psEv(S,n.b)):false}if(n.op==='or'){const a=psEv(S,n.a);return psTruth(a)?true:psTruth(psEv(S,n.b))}
  if((n.op==='is'||n.op==='isnot'||n.op==='as')&&n.b.t==='type')return psBin(S,n.op,psEv(S,n.a),{__type:n.b.n});return psBin(S,n.op,psEv(S,n.a),psEv(S,n.b))}
 case'not':return!psTruth(psEv(S,n.e));case'bnot':return~psToNum(psEv(S,n.e));
 case'neg':{const v=psEv(S,n.e);return-psToNum(v)}case'pos':return psToNum(psEv(S,n.e));
 case'usplit':return psStr(psEv(S,n.e)).trim().split(/\s+/).filter(x=>x!=='');
 case'ujoin':return psEnum(psEv(S,n.e)).map(psStr).join('');
 case'cast':{const v=psEv(S,n.e);if(String(n.type).toLowerCase()==='ordered'&&isH(v))return v;return psCast(n.type,v)}
 case'type':return{__type:n.n};
 case'idx':return psIndex(S,psEv(S,n.o),psEv(S,n.i));
 case'mem':return psMember(S,psEv(S,n.o),psStr(psEv(S,n.n)),n);
 case'call':{const o=psEv(S,n.o);return psMethod(S,o,psStr(psEv(S,n.n)),n.a.map(a=>psEv(S,a)))}
 case'smem':return psStatic(S,n.o.n,n.n,null);
 case'scall':return psStatic(S,n.o.n,n.n,n.a.map(a=>psEv(S,a)));
 case'incr':{const cur=psToNum(psEv(S,n.e)),nv=cur+n.d;psAssignTo(S,n.e,nv);return n.pre?nv:cur}
 default:return psVal(S,n)}}
function psIndex(S,o,i){if(o===null||o===undefined)return null;
 if(isH(o)){if(Array.isArray(i))return i.map(k=>o.m.get(psStr(k))===undefined?null:o.m.get(psStr(k)));const v=o.m.get(psStr(i));return v===undefined?null:v}
 if(typeof o==='string'){if(Array.isArray(i))return i.map(k=>o[psToNum(k)]);let k=psToNum(i);if(k<0)k+=o.length;return o[k]===undefined?null:o[k]}
 if(Array.isArray(o)){if(Array.isArray(i))return i.map(k=>psIndex(S,o,k));let k=psToNum(i);if(k<0)k+=o.length;return o[k]===undefined?null:o[k]}
 if(isO(o)){const v=o.m.get(psStr(i));return v===undefined?null:v}return null}
function psMember(S,o,name,n){const l=name.toLowerCase();if(o===null||o===undefined)return null;
 if(Array.isArray(o)){if(l==='count'||l==='length')return o.length;if(l==='rank')return 1;const r=[];o.forEach(x=>{const v=psMember(S,x,name,n);if(v!==null)r.push(...(Array.isArray(v)?[v]:[v]))});return r}
 if(typeof o==='string'){if(l==='length')return o.length;return null}
 if(isH(o)){if(l==='keys')return o.m.keys();if(l==='values')return o.m.entries().map(e=>e[1]);if(l==='count')return o.m.size;const v=o.m.get(name);return v===undefined?null:v}
 if(isO(o)){const v=o.m.get(name);if(v!==undefined)return v;if(l==='length'&&o.m.has('Length'))return o.m.get('Length');return null}
 if(isDT(o)){const d=o.d;switch(l){case'year':return d.getFullYear();case'month':return d.getMonth()+1;case'day':return d.getDate();case'hour':return d.getHours();case'minute':return d.getMinutes();case'second':return d.getSeconds();case'millisecond':return d.getMilliseconds();case'dayofweek':return['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];case'dayofyear':return Math.floor((d-new Date(d.getFullYear(),0,0))/864e5);case'date':return{__dt:1,d:new Date(d.getFullYear(),d.getMonth(),d.getDate())};case'ticks':return d.getTime()*1e4;case'timeofday':return psSpan(d.getHours()*36e5+d.getMinutes()*6e4+d.getSeconds()*1e3)}return null}
 if(typeof o==='number'||typeof o==='boolean')return null;return null}
function psMethod(S,o,name,a){const l=name.toLowerCase();const A=a;
 if(o&&o.__type){return psStatic(S,o.__type,name,a)}
 if(o===null||o===undefined)throw psThrow(`Вызов метода для выражения со значением NULL невозможен.`,'InvalidOperation','RuntimeException',null,'','InvokeMethodOnNull');
 if(l==='gettype')return psO({Name:psTn(o),FullName:'System.'+psTn(o),BaseType:'System.Object'},'Type');
 if(l==='tostring'&&!(isDT(o)||typeof o==='number'))return psStr(o);if(l==='equals')return psEqv(o,A[0],true);
 if(typeof o==='string'){switch(l){
  case'toupper':return o.toUpperCase();case'tolower':return o.toLowerCase();case'trim':return A.length?o.replace(new RegExp('^['+psStr(A[0]).replace(/[\]\\^-]/g,'\\$&')+']+|['+psStr(A[0]).replace(/[\]\\^-]/g,'\\$&')+']+$','g'),''):o.trim();case'trimstart':return A.length?o.replace(new RegExp('^['+psStr(A[0]).replace(/[\]\\^-]/g,'\\$&')+']+'),''):o.trimStart();case'trimend':return A.length?o.replace(new RegExp('['+psStr(A[0]).replace(/[\]\\^-]/g,'\\$&')+']+$'),''):o.trimEnd();
  case'substring':{const s=psToNum(A[0]),ln=A.length>1?psToNum(A[1]):o.length-s;if(s<0||s>o.length||ln<0||s+ln>o.length)throw psThrow('Исключение при вызове "Substring" с аргументами ('+A.length+'): "Индекс и длина должны указывать на позицию в строке."','NotSpecified','MethodInvocationException');return o.substr(s,ln)}
  case'replace':return o.split(psStr(A[0])).join(psStr(A[1]));case'contains':return o.includes(psStr(A[0]));case'startswith':return o.toLowerCase().startsWith(psStr(A[0]).toLowerCase())&&true;case'endswith':return o.toLowerCase().endsWith(psStr(A[0]).toLowerCase());
  case'indexof':return o.indexOf(psStr(A[0]),A[1]?psToNum(A[1]):0);case'lastindexof':return o.lastIndexOf(psStr(A[0]));case'padleft':return o.padStart(psToNum(A[0]),A[1]?psStr(A[1]):' ');case'padright':return o.padEnd(psToNum(A[0]),A[1]?psStr(A[1]):' ');
  case'insert':return o.slice(0,psToNum(A[0]))+psStr(A[1])+o.slice(psToNum(A[0]));case'remove':return A.length>1?o.slice(0,psToNum(A[0]))+o.slice(psToNum(A[0])+psToNum(A[1])):o.slice(0,psToNum(A[0]));
  case'split':{let seps=A.length?psEnum(A[0]).map(psStr):[' '];const rx=new RegExp(seps.map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'));let r=o.split(rx);if(A.length&&Array.isArray(A[0])&&false)r=r;return r}
  case'tochararray':return o.split('');case'compareto':return psCmpv(o,A[0],true);case'normalize':return o;case'isnullorempty':return o==='';
  case'getenumerator':return o.split('');case'chars':return o[psToNum(A[0])];case'tochararray ':return o.split('');case'length':return o.length}}
 if(Array.isArray(o)){switch(l){
  case'add':if(!o.al)throw psThrow('Исключение при вызове "Add" с аргументами: "Коллекция имела фиксированный размер."','NotSpecified','MethodInvocationException');o.push(A[0]);return o.length-1;
  case'addrange':psEnum(A[0]).forEach(x=>o.push(x));return null;case'remove':{if(!o.al)throw psThrow('Исключение при вызове "Remove": "Коллекция имела фиксированный размер."','NotSpecified','MethodInvocationException');const i=o.findIndex(x=>psEqv(x,A[0],true));if(i>=0)o.splice(i,1);return null}
  case'removeat':if(!o.al)throw psThrow('Коллекция имела фиксированный размер.','NotSpecified','MethodInvocationException');o.splice(psToNum(A[0]),1);return null;case'insert':o.splice(psToNum(A[0]),0,A[1]);return null;case'clear':o.length=0;return null;
  case'contains':return o.some(x=>psEqv(x,A[0],false));case'indexof':return o.findIndex(x=>psEqv(x,A[0],false));case'reverse':o.reverse();return null;case'sort':o.sort((x,y)=>psCmpv(x,y,false));return null;case'toarray':return o.slice();case'clone':return o.slice();
  case'getenumerator':return o;case'join':return o.map(psStr).join(psStr(A[0]));
  case'where':return o.filter(x=>psTruth(psInvoke(S,A[0],[],{_:x})));case'foreach':{const r=[];o.forEach(x=>{const v=psInvoke(S,A[0],[],{_:x});psEnum(v).forEach(y=>r.push(y))});return r}
  case'getlength':return o.length}}
 if(isH(o)){switch(l){case'containskey':return o.m.has(psStr(A[0]));case'containsvalue':return o.m.entries().some(e=>psEqv(e[1],A[0],false));case'add':if(o.m.has(psStr(A[0])))throw psThrow(`Исключение при вызове "Add" с аргументами: "Ключ уже существует."`,'NotSpecified','MethodInvocationException');o.m.set(psStr(A[0]),A[1]);return null;case'remove':o.m.del(psStr(A[0]));return null;case'clear':o.m.m.clear();return null;case'getenumerator':return o.m.entries().map(([k,v])=>psO({Key:k,Value:v,Name:k},'DictionaryEntry'));case'clone':{const h=psH();o.m.entries().forEach(([k,v])=>h.m.set(k,v));return h}case'keys':return o.m.keys();case'values':return o.m.entries().map(e=>e[1])}}
 if(isDT(o)){const d=o.d;const mk=x=>({__dt:1,d:x});switch(l){case'adddays':return mk(new Date(d.getTime()+psToNum(A[0])*864e5));case'addhours':return mk(new Date(d.getTime()+psToNum(A[0])*36e5));case'addminutes':return mk(new Date(d.getTime()+psToNum(A[0])*6e4));case'addseconds':return mk(new Date(d.getTime()+psToNum(A[0])*1e3));case'addmonths':{const x=new Date(d);x.setMonth(x.getMonth()+psToNum(A[0]));return mk(x)}case'addyears':{const x=new Date(d);x.setFullYear(x.getFullYear()+psToNum(A[0]));return mk(x)}case'tostring':return A.length?psDt(d,psStr(A[0])):psStr(o);case'toshortdatestring':return psDt(d,'dd.MM.yyyy');case'tolongdatestring':return psDt(d,'d MMMM yyyy \'г.\'');case'toshorttimestring':return psDt(d,'HH:mm');case'tolongtimestring':return psDt(d,'HH:mm:ss');case'compareto':return psCmpv(o,A[0]);}}
 if(typeof o==='number'){switch(l){case'tostring':return A.length?psFmt1(o,psStr(A[0])):psNum(o);case'compareto':return psCmpv(o,A[0]);case'gettype':return null}}
 if(isSB(o)){if(l==='invoke')return psInvokeVal(S,o,A);if(l==='invokereturnasis')return psInvokeVal(S,o,A)}
 if(isO(o)){if(o.tn==='MatchInfo'||o.tn==='Match'){}if(l==='tostring')return psStr(o);if(o.methods&&o.methods[l])return o.methods[l](o,A);const f=o.m.get(name);if(isSB(f))return psInvokeVal(S,f,A)}
 if(isRe(o)){const rx=new RegExp(o.src,'i');if(l==='ismatch')return rx.test(psStr(A[0]));if(l==='match')return psMatchObj(rx.exec(psStr(A[0])));if(l==='replace')return psStr(A[0]).replace(new RegExp(o.src,'gi'),psStr(A[1]))}
 throw psThrow(`Метод "${name}" не найден в объекте типа "${psTn(o)}". Проверьте тип объекта и повторите попытку.`,'InvalidOperation','RuntimeException',null,'','MethodNotFound')}
function psMatchObj(m){if(!m)return psO({Success:false,Value:'',Index:-1,Groups:[]},'Match');const g=m.map((x,i)=>psO({Success:x!==undefined,Value:x===undefined?'':x,Index:i},'Group'));return psO({Success:true,Value:m[0],Index:m.index,Groups:g,Length:m[0].length},'Match')}
function psStatic(S,type,name,a){const t=String(type).toLowerCase().replace(/^system\./,'').replace(/^io\./,'').replace(/^management\.automation\./,'');const l=name.toLowerCase();const A=a||[];
 const need=()=>{if(a===null)throw psThrow(`Статическое свойство "${name}" не найдено.`,'InvalidOperation','RuntimeException')};
 switch(t){
 case'math':switch(l){case'pi':return Math.PI;case'e':return Math.E;case'abs':return Math.abs(psToNum(A[0]));case'round':{const x=psToNum(A[0]),d=A.length>1?psToNum(A[1]):0;const k=Math.pow(10,d),y=x*k,f=Math.floor(y),df=y-f;const r=Math.abs(df-0.5)<1e-9?(f%2===0?f:f+1):Math.round(y);return r/k}case'floor':return Math.floor(psToNum(A[0]));case'ceiling':return Math.ceil(psToNum(A[0]));case'truncate':return Math.trunc(psToNum(A[0]));case'sqrt':return Math.sqrt(psToNum(A[0]));case'pow':return Math.pow(psToNum(A[0]),psToNum(A[1]));case'max':return Math.max(psToNum(A[0]),psToNum(A[1]));case'min':return Math.min(psToNum(A[0]),psToNum(A[1]));case'sin':return Math.sin(psToNum(A[0]));case'cos':return Math.cos(psToNum(A[0]));case'log':return Math.log(psToNum(A[0]));case'log10':return Math.log10(psToNum(A[0]));case'sign':return Math.sign(psToNum(A[0]))}break;
 case'string':switch(l){case'join':return (Array.isArray(A[1])?A[1]:A.slice(1)).map(psStr).join(psStr(A[0]));case'isnullorempty':return A[0]===null||A[0]===undefined||A[0]==='';case'isnullorwhitespace':return A[0]===null||A[0]===undefined||psStr(A[0]).trim()==='';case'format':return psFormat(psStr(A[0]),A.length===2&&Array.isArray(A[1])?A[1]:A.slice(1));case'concat':return A.map(psStr).join('');case'empty':return''}break;
 case'int':case'int32':case'double':case'long':case'int64':switch(l){case'parse':{const x=psToNum(A[0]);return t==='double'?x:Math.trunc(x)}case'tryparse':return !isNaN(psToNum(A[0],false));case'maxvalue':return t==='int'||t==='int32'?2147483647:t==='double'?1.7976931348623157e308:9007199254740991;case'minvalue':return t==='int'||t==='int32'?-2147483648:-9007199254740991}break;
 case'convert':switch(l){case'toint32':case'toint64':case'toint16':return psCast('int',A.length>1?parseInt(psStr(A[0]),psToNum(A[1])):A[0]);case'todouble':return psToNum(A[0]);case'tostring':return A.length>1?psToNum(A[0]).toString(psToNum(A[1])):psStr(A[0]);case'toboolean':return psTruth(A[0]);case'tobase64string':return btoa(psEnum(A[0]).map(x=>String.fromCharCode(x)).join(''));}break;
 case'datetime':switch(l){case'now':return{__dt:1,d:new Date(Date.now()+S.vt*1000)};case'today':{const d=new Date(Date.now()+S.vt*1000);return{__dt:1,d:new Date(d.getFullYear(),d.getMonth(),d.getDate())}}case'utcnow':return{__dt:1,d:new Date(Date.now()+S.vt*1000)};case'parse':return psParseDt(psStr(A[0]));case'daysinmonth':return new Date(psToNum(A[0]),psToNum(A[1]),0).getDate();case'isleapyear':{const y=psToNum(A[0]);return y%4===0&&(y%100!==0||y%400===0)}}break;
 case'environment':switch(l){case'machinename':return String(S.d.name).toUpperCase();case'username':return'student';case'newline':return'\n';case'osversion':return'Microsoft Windows NT 10.0.19045.0';case'currentdirectory':return cWin(S.cwd);case'getenvironmentvariable':return psGetVar(S,psStr(A[0]),'env');case'setenvironmentvariable':psSetVar(S,psStr(A[0]),A[1],'env');return null;case'is64bitoperatingsystem':return true;case'processorcount':return 4;case'exit':throw{ps:'exit',n:psToNum(A[0])}}break;
 case'path':switch(l){case'combine':return A.map(psStr).reduce((x,y)=>x===''?y:(/[\\\/]$/.test(x)?x+y:x+'\\'+y));case'getfilename':return psStr(A[0]).split(/[\\\/]/).pop();case'getextension':{const f=psStr(A[0]).split(/[\\\/]/).pop();const i=f.lastIndexOf('.');return i>0?f.slice(i):''}case'getfilenamewithoutextension':{const f=psStr(A[0]).split(/[\\\/]/).pop();const i=f.lastIndexOf('.');return i>0?f.slice(0,i):f}case'getdirectoryname':{const s=psStr(A[0]).replace(/[\\\/][^\\\/]*$/,'');return s}case'getfullpath':return cWin(cPath(S,psStr(A[0])));case'directoryseparatorchar':return'\\';case'gettemppath':return'C:\\Temp\\';case'ispathrooted':return/^([A-Za-z]:|[\\\/])/.test(psStr(A[0]))}break;
 case'file':{const p=A[0]!==undefined?cPath(S,psStr(A[0])):null;switch(l){case'exists':return!!(p&&S.fs[p]&&!S.fs[p].d);case'readalltext':{const n=S.fs[p];if(!n||n.d)throw psThrow(`Исключение при вызове "ReadAllText" с аргументами: "Не удалось найти файл '${cWin(p)}'."`,'NotSpecified','MethodInvocationException');return n.c||''}case'readalllines':{const n=S.fs[p];if(!n||n.d)throw psThrow(`Не удалось найти файл '${cWin(p)}'.`,'NotSpecified','MethodInvocationException');return cLines(n.c||'')}case'writealltext':sxWrite(S.fs,p,psStr(A[1]));return null;case'writealllines':sxWrite(S.fs,p,psEnum(A[1]).map(psStr).join('\n')+'\n');return null;case'appendalltext':sxWrite(S.fs,p,psStr(A[1]),true);return null;case'delete':delete S.fs[p];return null;case'copy':if(S.fs[p])S.fs[cPath(S,psStr(A[1]))]={c:S.fs[p].c};return null}break}
 case'directory':{const p=A[0]!==undefined?cPath(S,psStr(A[0])):null;switch(l){case'exists':return!!(p&&S.fs[p]&&S.fs[p].d);case'createdirectory':sxMk(S.fs,p,true);return psO({FullName:cWin(p)},'DirectoryInfo');case'getfiles':return sxLs(S.fs,p).filter(k=>!S.fs[p+'/'+k].d).map(k=>cWin(p+'/'+k));case'getdirectories':return sxLs(S.fs,p).filter(k=>S.fs[p+'/'+k].d).map(k=>cWin(p+'/'+k));case'getcurrentdirectory':return cWin(S.cwd);case'delete':sxRm(S.fs,p,true);return null}break}
 case'guid':if(l==='newguid'){const h=()=>Math.floor(Math.random()*65536).toString(16).padStart(4,'0');const o=psO({},'Guid');o.ts=()=>`${h()}${h()}-${h()}-${h()}-${h()}-${h()}${h()}${h()}`;const s=o.ts();o.ts=()=>s;return o}break;
 case'console':if(l==='writeline'){S.out(A.map(psStr).join(' ')+'\n');return null}if(l==='write'){S.out(A.map(psStr).join(' '));return null}if(l==='readline'){return psReadLine(S,'')}break;
 case'regex':switch(l){case'match':return psMatchObj(new RegExp(psStr(A[1]),A[2]?'':'i').exec(psStr(A[0])));case'ismatch':return new RegExp(psStr(A[1]),'i').test(psStr(A[0]));case'replace':return psStr(A[0]).replace(new RegExp(psStr(A[1]),'gi'),psStr(A[2]));case'split':return psStr(A[0]).split(new RegExp(psStr(A[1])));case'escape':return psStr(A[0]).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');case'matches':{const r=[];const rx=new RegExp(psStr(A[1]),'gi');let m;const s=psStr(A[0]);while((m=rx.exec(s))){r.push(psMatchObj(m));if(m[0]==='')rx.lastIndex++}return r}}break;
 case'array':switch(l){case'reverse':A[0].reverse();return null;case'sort':A[0].sort((x,y)=>psCmpv(x,y));return null;case'indexof':return A[0].findIndex(x=>psEqv(x,A[1]));case'empty':return[]}break;
 case'char':if(l==='isdigit')return/\d/.test(psStr(A[0]));if(l==='isletter')return/[a-zа-яё]/i.test(psStr(A[0]));if(l==='toupper')return psStr(A[0]).toUpperCase();if(l==='tolower')return psStr(A[0]).toLowerCase();break;
 case'timespan':if(l==='fromseconds')return psSpan(psToNum(A[0])*1e3);if(l==='fromminutes')return psSpan(psToNum(A[0])*6e4);if(l==='fromhours')return psSpan(psToNum(A[0])*36e5);if(l==='fromdays')return psSpan(psToNum(A[0])*864e5);break;
 case'net.dns':case'dns':if(l==='gethostaddresses'||l==='gethostentry'){const o=sxNet(S.d,'nslookup '+psStr(A[0]));const m=o.match(/\d+\.\d+\.\d+\.\d+/g);return m?m.map(x=>psCast('ipaddress',x)):[]}break;
 case'net.ipaddress':case'ipaddress':if(l==='parse')return psCast('ipaddress',A[0]);if(l==='tryparse')return/^(\d{1,3}\.){3}\d{1,3}$/.test(psStr(A[0]));break;
 case'bitconverter':break}
 throw psThrow(`Метод или свойство "${name}" не найдено в типе [${type}].`,'InvalidOperation','RuntimeException',null,'','MethodNotFound')}
function psReadLine(S,prompt){S.out(prompt);const q=S.inp;if(q&&q.p<q.t.length){let e=q.t.indexOf('\n',q.p);if(e<0)e=q.t.length;const l=q.t.slice(q.p,e).replace(/\r$/,'');q.p=Math.min(q.t.length,e+1);S.out(l+'\n');return l}if(S.ask){const r=S.ask(prompt);if(r!==null&&r!==undefined){S.out(r+'\n');return String(r)}}S.out('\n');return''}
// ---- присваивание ----
function psAssignTo(S,l,v){switch(l.t){
 case'var':psSetVar(S,l.n,v,l.sc);return;
 case'cast':psAssignTo(S,l.e,psCast(l.type,v));return;
 case'idx':{const o=psEv(S,l.o),i=psEv(S,l.i);if(isH(o)){o.m.set(psStr(i),v);return}if(Array.isArray(o)){let k=psToNum(i);if(k<0)k+=o.length;if(k>=o.length&&!o.al)throw psThrow('Индекс находился вне границ массива.','OperationStopped','IndexOutOfRangeException');o[k]=v;return}if(isO(o)){o.m.set(psStr(i),v);return}throw psThrow('Невозможно индексировать в объект данного типа.','InvalidOperation','RuntimeException')}
 case'mem':{const o=psEv(S,l.o),nm=psStr(psEv(S,l.n));if(isH(o)||isO(o)){o.m.set(nm,v);return}if(o===null||o===undefined)throw psThrow(`Свойство "${nm}" не может быть найдено в этом объекте. Убедитесь, что оно существует.`,'InvalidOperation','RuntimeException');throw psThrow(`Свойство "${nm}" не может быть найдено в этом объекте. Убедитесь, что оно существует и допускает установку значения.`,'InvalidOperation','RuntimeException')}
 }throw psThrow('Недопустимая левая часть присваивания.','ParserError','ParseException')}
// ---- скриптблоки и функции ----
function psInvokeVal(S,sb,args){const out=[];psInvokeSB(S,sb,args,null,out,true);return out.length===0?null:out.length===1?out[0]:out}
function psInvoke(S,sb,args,vars){const out=[];psInvokeSB(S,sb,args,vars,out,false);return out.length===0?null:out.length===1?out[0]:out}
function psInvokeSB(S,sb,args,vars,out,newScope){if(!isSB(sb))throw psThrow('Объект не является блоком скрипта.','InvalidArgument','RuntimeException');const sv=S.sc;let sc=sv;if(newScope){sc={vars:new PsM(),parent:sv};S.sc=sc}
 let old={};try{if(vars)for(const k in vars){old[k]=sc.vars.get(k);sc.vars.set(k,vars[k])}
  if(sb.b.params){psBindParams(S,sb.b.params,args.map(a=>({val:a})),sc)}else if(newScope){sc.vars.set('args',args)}
  try{sb.b.body.forEach(s=>psRun(S,s,out))}catch(e){if(e&&e.ps==='return'&&newScope){}else throw e}}
 finally{if(vars&&!newScope)for(const k in old){if(old[k]===undefined)sc.vars.del(k);else sc.vars.set(k,old[k])}S.sc=sv}}
function psBindParams(S,params,toks,sc){const used=new Set();const pos=[];const named={};let rest=[];
 for(let i=0;i<toks.length;i++){const t=toks[i];if(t.pn!==undefined){const low=t.pn.toLowerCase();const cands=params.filter(p=>p.name.toLowerCase()===low);const c=cands[0]||params.filter(p=>p.name.toLowerCase().startsWith(low))[0];if(!c){throw psThrow(`Не найден параметр, соответствующий имени параметра "${t.pn}".`,'InvalidArgument','ParameterBindingException',null,'','NamedParameterNotFound')}
   const isSw=/^switch/i.test(c.type||'');if(isSw){named[c.name]=t.has?psTruth(t.val):true}else{const nx=toks[i+1];if(t.has)named[c.name]=t.val;else if(nx&&nx.pn===undefined){named[c.name]=nx.val;i++}else throw psThrow(`Для параметра "${c.name}" отсутствует аргумент. Укажите аргумент типа "${c.type||'System.String'}" и повторите попытку.`,'InvalidArgument','ParameterBindingException')}}
  else pos.push(t.val)}
 let pi=0;params.forEach(p=>{let v;if(p.name in named)v=named[p.name];else if(!/^switch/i.test(p.type||'')&&pi<pos.length)v=pos[pi++];else if(p.def){v=psEv(S,p.def)}else v=/^switch/i.test(p.type||'')?false:null;if(p.type&&v!==null&&v!==undefined&&!/^switch/i.test(p.type))v=psCast(p.type,v);sc.vars.set(p.name,v)});
 rest=pos.slice(pi);sc.vars.set('args',rest)}
function psCallFunc(S,fn,toks,input,out){if(++S.depth>200){S.depth--;throw psThrow('Превышена максимальная глубина рекурсии (200).','InvalidOperation','ScriptCallDepthException')}const sv=S.sc;const sc={vars:new PsM(),parent:sv};S.sc=sc;
 try{sc.vars.set('input',input);psBindParams(S,fn.params,toks,sc);const body=fn.b.body;try{body.forEach(s=>psRun(S,s,out))}catch(e){if(!(e&&e.ps==='return'))throw e}}finally{S.sc=sv;S.depth--}}
