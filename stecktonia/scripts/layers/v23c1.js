// ================= v23c1: bash — лексер, разбор, раскрытие слов, выполнение =================
function sxSess(d,shell){const home=shell==='bash'?SXH:SXW;return{d,fs:sxFs(d),cwd:home,home,shell:shell||'bash',env:{HOME:home,USER:'student',LOGNAME:'student',PWD:home,PATH:'/usr/local/bin:/usr/bin:/bin',HOSTNAME:d.name,SHELL:'/bin/bash',IFS:' \t\n',OLDPWD:'',LANG:'ru_RU.UTF-8'},arr:{},funcs:{},pos:['bash'],loc:[],last:0,opts:{},inp:{t:'',p:0},out:()=>{},err:()=>{},steps:0,t0:Date.now(),nof:0,ask:null,vt:0}}
const bErr=m=>{const e=new Error(m);e.syn=1;return e};
function bMatchP(s,i){let d=0;const n=s.length;for(;i<n;i++){const c=s[i];if(c==='\\'){i++;continue}if(c==="'"){const j=s.indexOf("'",i+1);i=j<0?n:j;continue}if(c==='"'){i++;while(i<n&&s[i]!=='"'){if(s[i]==='\\')i++;else if(s[i]==='$'&&s[i+1]==='('){i=bMatchP(s,i+1)-1}i++}continue}
  if(c==='(')d++;else if(c===')'){d--;if(d===0)return i+1}}return n}
function bMatchB(s,i){let d=0;const n=s.length;for(;i<n;i++){const c=s[i];if(c==='\\'){i++;continue}if(c==='{')d++;else if(c==='}'){d--;if(d===0)return i+1}}return n}
function bLex(s){const T=[],n=s.length;let i=0,dbr=false;const pend=[];const isWs=c=>c===' '||c==='\t'||c==='\r';
 const nlp=[];for(let k=0;k<n;k++)if(s[k]==='\n')nlp.push(k);const lineAt=q=>{let lo=0,hi=nlp.length;while(lo<hi){const m=(lo+hi)>>1;if(nlp[m]<q)lo=m+1;else hi=m}return lo+1};const _tp=T.push.bind(T);T.push=function(o){if(o&&o.ln===undefined)o.ln=lineAt(i);return _tp(o)};
 const wordEnd=st=>{let i=st;while(i<n){const c=s[i];if(isWs(c)||c==='\n')break;if(c==='|'||c==='&'||c===';'||c===')'||((c==='<'||c==='>')&&!dbr))break;
   if(c==='('){if(s[i-1]==='='&&/^[A-Za-z_]\w*\+?=$/.test(s.slice(st,i))){i=bMatchP(s,i);continue}break}
   if(c==='\\'){i+=2;continue}if(c==="'"){const j=s.indexOf("'",i+1);i=j<0?n:j+1;continue}
   if(c==='"'){i++;while(i<n&&s[i]!=='"'){if(s[i]==='\\'){i+=2;continue}if(s[i]==='$'&&s[i+1]==='('){i=bMatchP(s,i+1);continue}if(s[i]==='$'&&s[i+1]==='{'){i=bMatchB(s,i+1);continue}if(s[i]==='`'){const j=s.indexOf('`',i+1);i=j<0?n:j+1;continue}i++}i++;continue}
   if(c==='$'&&s[i+1]==='('){i=bMatchP(s,i+1);continue}if(c==='$'&&s[i+1]==='{'){i=bMatchB(s,i+1);continue}if(c==='`'){const j=s.indexOf('`',i+1);i=j<0?n:j+1;continue}i++}return i};
 while(i<n){const c=s[i];if(isWs(c)){i++;continue}if(c==='\\'&&s[i+1]==='\n'){i+=2;continue}if(c==='#'){while(i<n&&s[i]!=='\n')i++;continue}
  if(c==='\n'){T.push({t:'nl'});i++;for(const h of pend){const lines=[];while(i<n){let j=s.indexOf('\n',i);if(j<0)j=n;let ln=s.slice(i,j);i=Math.min(n,j+1);const cmp=h.strip?ln.replace(/^\t+/,''):ln;if(cmp===h.delim)break;lines.push(h.strip?ln.replace(/^\t+/,''):ln)}h.tok.body=lines.length?lines.join('\n')+'\n':''}pend.length=0;continue}
  if(c==='('&&s[i+1]==='('){const e=bMatchP(s,i);const inner=s.slice(i,e);if(inner.endsWith('))')){T.push({t:'arith',v:inner.slice(2,-2)});i=e;continue}}
  if(dbr&&T.length&&T[T.length-1].t==='w'&&T[T.length-1].v==='=~'){let j=i,dp=0;while(j<n){const ch=s[j];if(ch==='\\'){j+=2;continue}if(ch==="'"){const k=s.indexOf("'",j+1);j=k<0?n:k+1;continue}if(ch==='"'){j++;while(j<n&&s[j]!=='"'){if(s[j]==='\\')j++;j++}j++;continue}if(ch==='('){dp++}else if(ch===')'){if(dp>0)dp--;else break}else if(dp===0&&(/\s/.test(ch)))break;j++}if(j>i){T.push({t:'w',v:s.slice(i,j)});i=j;continue}}
  if(!dbr||!(c==='<'||c==='>')){
   let m;if(s.startsWith('&&',i)){T.push({t:'op',v:'&&'});i+=2;continue}if(s.startsWith('||',i)){T.push({t:'op',v:'||'});i+=2;continue}
   if(s.startsWith(';;',i)){T.push({t:'op',v:';;'});i+=2;continue}
   if((m=/^(\d?)(&>>|&>|>>|>&|>\||>|<<<|<<-|<<|<&|<)/.exec(s.slice(i,i+5)))&&(m[1]===''||/[<>]/.test(m[2][0]))){const op=m[2]==='>|'?'>':m[2];const tok={t:'op',v:m[1]+op,r:1};T.push(tok);i+=m[0].length;
    if(op==='<<'||op==='<<-'){while(isWs(s[i]))i++;const e=wordEnd(i),raw=s.slice(i,e);i=e;tok.hd=1;tok.quoted=/['"\\]/.test(raw);tok.delim=raw.replace(/['"\\]/g,'');T.push({t:'w',v:raw,hdw:1});pend.push({tok,delim:tok.delim,strip:op==='<<-'})}continue}
   if(c==='|'||c==='&'||c===';'||c==='('||c===')'){T.push({t:'op',v:c});i++;continue}}
  const e=wordEnd(i);const w=s.slice(i,e);if(e===i){throw bErr(`syntax error near unexpected token \`${s[i]}'`)}i=e;T.push({t:'w',v:w});if(w==='[[')dbr=true;else if(w===']]')dbr=false}
 return T}
const B_ASG=/^([A-Za-z_]\w*)(\[[^\]]*\])?(\+?)=([\s\S]*)$/;
function bParse(src){const T=bLex(src);let p=0;const pk=()=>T[p],isW=v=>T[p]&&T[p].t==='w'&&T[p].v===v,isOp=v=>T[p]&&T[p].t==='op'&&T[p].v===v;
 const skipNl=()=>{while(T[p]&&(T[p].t==='nl'||(T[p].t==='op'&&T[p].v===';')))p++};
 const unexp=()=>{const t=T[p];const e=bErr(t?`syntax error near unexpected token \`${t.t==='nl'?'newline':t.v}'`:'syntax error: unexpected end of file');const l=T[T.length-1];e.ln=t?t.ln:(l?l.ln+(l.t==='nl'?1:0):1);return e};
 const expectW=v=>{skipNl();if(!isW(v))throw unexp();p++};
 function list(ends){const items=[];skipNl();while(T[p]){const t=T[p];if(t.t==='w'&&ends.includes(t.v))break;if(t.t==='op'&&(t.v===')'||t.v===';;'))break;const n=andor();let bg=false;if(isOp('&')){bg=true;p++}else if(isOp(';')||(T[p]&&T[p].t==='nl'))p++;else if(T[p]&&!(T[p].t==='w'&&ends.includes(T[p].v))&&!(T[p].t==='op'&&(T[p].v===')'||T[p].v===';;')))throw unexp();items.push({n,bg});skipNl()}return{k:'seq',items}}
 function andor(){const first=pipe(),rest=[];while(isOp('&&')||isOp('||')){const op=T[p++].v;while(T[p]&&T[p].t==='nl')p++;rest.push({op,n:pipe()})}return rest.length?{k:'andor',first,rest}:first}
 function pipe(){let neg=false;if(isW('!')){neg=true;p++}const cmds=[cmd()];while(isOp('|')){p++;while(T[p]&&T[p].t==='nl')p++;cmds.push(cmd())}return cmds.length>1||neg?{k:'pipe',cmds,neg}:cmds[0]}
 function reds(node){node.redirs=node.redirs||[];while(T[p]&&T[p].t==='op'&&T[p].r){const o=T[p++],m=/^(\d?)(.*)$/.exec(o.v);const tg=T[p];if(!tg||tg.t!=='w')throw unexp();p++;node.redirs.push({fd:m[1],op:m[2],target:tg.v,hd:o.body,quoted:o.quoted,tok:o})}return node}
 function cmd(){const t=T[p];if(!t)throw unexp();
  if(t.t==='arith'){p++;return reds({k:'arith',expr:t.v})}
  if(t.t==='op'&&t.v==='('){p++;const b=list([]);if(!isOp(')'))throw unexp();p++;return reds({k:'sub',b})}
  if(t.t==='w'){const v=t.v;
   if(v==='if'){p++;const conds=[];let c=list(['then']);expectW('then');let b=list(['elif','else','fi']);conds.push({c,b});let els=null;for(;;){if(isW('elif')){p++;c=list(['then']);expectW('then');b=list(['elif','else','fi']);conds.push({c,b})}else if(isW('else')){p++;els=list(['fi'])}else break}expectW('fi');return reds({k:'if',conds,els})}
   if(v==='while'||v==='until'){p++;const c=list(['do']);expectW('do');const b=list(['done']);expectW('done');return reds({k:'while',c,b,until:v==='until'})}
   if(v==='for'){p++;if(T[p]&&T[p].t==='arith'){const parts=T[p++].v.split(';');skipNl();expectW('do');const b=list(['done']);expectW('done');return reds({k:'cfor',init:parts[0]||'',cond:parts[1]||'',step:parts[2]||'',b})}
    const nm=T[p++];if(!nm||nm.t!=='w')throw unexp();let items=null;if(T[p]&&T[p].t==='nl')p++;if(isW('in')){p++;items=[];while(T[p]&&T[p].t==='w'&&!(T[p].v==='do'&&false)){items.push(T[p++].v)}}skipNl();expectW('do');const b=list(['done']);expectW('done');return reds({k:'for',v:nm.v,items,b})}
   if(v==='case'){p++;const w=T[p++];if(!w)throw unexp();skipNl();expectW('in');skipNl();const cases=[];while(T[p]&&!isW('esac')){if(isOp('('))p++;const pats=[];while(T[p]&&T[p].t==='w'){pats.push(T[p++].v);if(isOp('|'))p++;else break}if(!isOp(')'))throw unexp();p++;const b=list(['esac']);if(isOp(';;'))p++;cases.push({pats,b});skipNl()}expectW('esac');return reds({k:'case',w:w.v,cases})}
   if(v==='function'){p++;const nm=T[p++].v;if(isOp('(')){p++;if(!isOp(')'))throw unexp();p++}skipNl();const b=cmd();return{k:'func',name:nm,b}}
   if(v==='{'){p++;const b=list(['}']);expectW('}');return reds({k:'group',b})}
   if(v==='[['){p++;const toks=[];while(T[p]&&!isW(']]')){toks.push(T[p].t==='w'?T[p].v:{op:T[p].v});p++}if(!isW(']]'))throw unexp();p++;return{k:'db',toks}}
   if(T[p+1]&&T[p+1].t==='op'&&T[p+1].v==='('&&T[p+2]&&T[p+2].t==='op'&&T[p+2].v===')'&&/^[A-Za-z_][\w.-]*$/.test(v)){p+=3;skipNl();const b=cmd();return{k:'func',name:v,b}}
  }
  return simple()}
 function simple(){const node={k:'simple',words:[],assigns:[],redirs:[],ln:T[p]&&T[p].ln};
  for(;;){const t=T[p];if(!t)break;if(t.t==='op'&&t.r){const o=T[p++],m=/^(\d?)(.*)$/.exec(o.v);const tg=T[p];if(!tg||tg.t!=='w')throw unexp();p++;node.redirs.push({fd:m[1],op:m[2],target:tg.v,hd:o.body,quoted:o.quoted,tok:o});continue}
   if(t.t!=='w')break;if(!node.words.length){const m=B_ASG.exec(t.v);if(m){p++;node.assigns.push({name:m[1],idx:m[2]?m[2].slice(1,-1):null,app:m[3]==='+',val:m[4]});continue}}
   node.words.push(t.v);p++}
  if(!node.words.length&&!node.assigns.length&&!node.redirs.length)throw unexp();return node}
 const prog=list([]);if(p<T.length)throw unexp();return prog}
// ---------- переменные ----------
function bGet(X,n){switch(n){case'?':return String(X.last);case'#':return String(X.pos.length-1);case'$':return'4242';case'!':return'';case'0':return X.pos[0];case'-':return'';case'RANDOM':return String(Math.floor(Math.random()*32768));case'LINENO':return'1';case'SECONDS':return String(Math.floor((Date.now()-X.t0)/1000)+X.vt);case'EPOCHSECONDS':return String(Math.floor(Date.now()/1000)+X.vt);case'PWD':return X.cwd}
 if(/^\d+$/.test(n))return X.pos[+n]!==undefined?X.pos[+n]:'';for(let i=X.loc.length-1;i>=0;i--)if(n in X.loc[i])return String(X.loc[i][n]);
 if(X.env[n]!==undefined)return String(X.env[n]);const a=X.arr[n];if(a)return Array.isArray(a)?String(a[0]===undefined?'':a[0]):'';return''}
function bIsSet(X,n){if(/^\d+$/.test(n))return X.pos[+n]!==undefined;for(let i=X.loc.length-1;i>=0;i--)if(n in X.loc[i])return true;return X.env[n]!==undefined||!!X.arr[n]}
function bSet(X,n,v){if(X.ro&&X.ro[n]){throw Object.assign(new Error(n+': readonly variable'),{})}for(let i=X.loc.length-1;i>=0;i--)if(n in X.loc[i]){X.loc[i][n]=v;return}X.env[n]=v;if(n==='PWD')X.cwd=v}
const bTrim=s=>String(s).replace(/\n+$/,'');
function bBrace(s){let dq=false,sq=false,d=0,st=-1;for(let i=0;i<s.length;i++){const c=s[i];if(c==='\\'){i++;continue}if(c==="'"&&!dq)sq=!sq;else if(c==='"'&&!sq)dq=!dq;if(sq||dq)continue;if(c==='$'&&s[i+1]==='{'){i=bMatchB(s,i+1)-1;continue}if(c==='$'&&s[i+1]==='('){i=bMatchP(s,i+1)-1;continue}
  if(c==='{'){if(d===0)st=i;d++}else if(c==='}'&&d>0){d--;if(d===0){const body=s.slice(st+1,i),pre=s.slice(0,st),post=s.slice(i+1);let parts=null;
    const rg=/^(-?\d+)\.\.(-?\d+)(?:\.\.(-?\d+))?$/.exec(body),rc=/^([a-zA-Z])\.\.([a-zA-Z])$/.exec(body);
    if(rg){const a=+rg[1],b=+rg[2],stp=Math.abs(+rg[3]||1)||1,w=/^-?0\d/.test(rg[1])||/^-?0\d/.test(rg[2])?Math.max(rg[1].length,rg[2].length):0;parts=[];if(a<=b)for(let x=a;x<=b;x+=stp)parts.push(String(x).padStart(w,'0'));else for(let x=a;x>=b;x-=stp)parts.push(String(x).padStart(w,'0'))}
    else if(rc){const a=rc[1].charCodeAt(0),b=rc[2].charCodeAt(0);parts=[];if(a<=b)for(let x=a;x<=b;x++)parts.push(String.fromCharCode(x));else for(let x=a;x>=b;x--)parts.push(String.fromCharCode(x))}
    else{let dd=0,cur='';parts=[];let q1=false,q2=false;for(let k=0;k<body.length;k++){const ch=body[k];if(ch==='\\'){cur+=ch+(body[k+1]||'');k++;continue}if(ch==="'"&&!q2)q1=!q1;else if(ch==='"'&&!q1)q2=!q2;if(!q1&&!q2){if(ch==='{')dd++;else if(ch==='}')dd--;else if(ch===','&&dd===0){parts.push(cur);cur='';continue}}cur+=ch}parts.push(cur);if(parts.length<2)parts=null}
    if(parts){let out=[];parts.forEach(x=>out.push(...bBrace(pre+x+post)));return out}d=0}}}return[s]}
// ---------- раскрытие слов ----------
function bSubst(X,src,io){const buf=[],io2={inp:io.inp,out:s=>buf.push(s),err:io.err};const sv={env:{...X.env},cwd:X.cwd,pos:X.pos.slice(),arr:JSON.parse(JSON.stringify(X.arr)),funcs:X.funcs};
 try{const ast=bParse(src);X.last=bRunList(X,ast,io2)}finally{X.env=sv.env;X.cwd=sv.cwd;X.pos=sv.pos;X.arr=sv.arr}return bTrim(buf.join(''))}
function bArith(X,e){if(/\$\(|`/.test(e))e=bExpW(X,e,{inp:{t:'',p:0},out:()=>{},err:X.err},'s');e=e.replace(/\$\{?([A-Za-z_]\w*|\d+|[?#])\}?/g,(m,n)=>{const v=bGet(X,n);return v===''?'0':v});const AM={};let ai=0;e=e.replace(/([A-Za-z_]\w*)\[([^\]]*)\]/g,(m,nm,ix)=>{let arr=X.arr[nm];if(!arr&&/[^\d\s+\-*\/()]/.test(ix)&&false)arr={};if(!arr)arr=X.arr[nm]=[];let k;if(Array.isArray(arr)){k=bArith(X,ix);if(k<0)k+=arr.length}else k=ix.trim();const t='A__'+(ai++);AM[t]={arr,k};return t});try{return sxArith(e,n=>{if(AM[n]){const x=AM[n].arr[AM[n].k];return x===undefined||x===''?'0':String(x)}return bGet(X,n)},(n,v)=>{if(AM[n])AM[n].arr[AM[n].k]=String(v);else bSet(X,n,String(v))})}catch(err){throw Object.assign(new Error(e.trim()+': '+err.message),{})}}
function bPat(p){let r='^';for(let i=0;i<p.length;i++){const c=p[i];if(c==='*')r+='[\\s\\S]*';else if(c==='?')r+='[\\s\\S]';else if(c==='['){const j=p.indexOf(']',i+2);if(j<0)r+='\\[';else{let b=p.slice(i+1,j);if(b[0]==='!')b='^'+b.slice(1);b=b.replace(/\[:alpha:\]/g,'a-zA-Z').replace(/\[:digit:\]/g,'0-9').replace(/\[:alnum:\]/g,'a-zA-Z0-9').replace(/\[:upper:\]/g,'A-Z').replace(/\[:lower:\]/g,'a-z').replace(/\[:space:\]/g,'\\s');r+='['+b+']';i=j}}else if(c==='\\'){r+=(p[i+1]||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');i++}else r+=c.replace(/[.+^${}()|\\]/g,'\\$&')}return new RegExp(r+'$')}
function bParam(X,c,io,q){let m=/^(!?)(#?)([A-Za-z_]\w*|\d+|[@*#?$!-])(?:\[([^\]]*)\])?([\s\S]*)$/.exec(c);if(!m)throw new Error('${'+c+'}: bad substitution');let [,ind,len,name,sub,rest]=m;
 if(len&&rest===''&&name==='#'){return{v:String(X.pos.length-1)}}
 const arrv=()=>{const a=X.arr[name];if(!a)return null;return a};
 let val,isArr=false,vals=null;
 const keysMode=ind&&(sub==='@'||sub==='*')&&arrv();if(ind&&!keysMode){const nn=bGet(X,name);name=nn;sub=undefined}
 if(keysMode){const a=arrv();vals=Array.isArray(a)?a.map((x,i)=>x===undefined?null:String(i)).filter(x=>x!==null):Object.keys(a);isArr=true;val=vals.join(' ')}else if(sub!==undefined&&sub!==null){const a=arrv();if(sub==='@'||sub==='*'){vals=a?(Array.isArray(a)?a:Object.values(a)):(bIsSet(X,name)?[bGet(X,name)]:[]);isArr=true;val=vals.join(' ')}
  else if(a){let k=Array.isArray(a)?bArith(X,sub):bExpW(X,sub,io,'s');if(Array.isArray(a)&&k<0)k+=a.length;val=a[k]===undefined?'':String(a[k])}else{val=sub==='0'?bGet(X,name):''}}
 else if(name==='@'||name==='*'){vals=X.pos.slice(1);isArr=true;val=vals.join(' ')}else val=bGet(X,name);
 if(len){return{v:String(isArr?vals.length:val.length)}}
 const unset=isArr?vals.length===0:!bIsSet(X,name)&&(sub===undefined||sub===null);const empty=isArr?vals.length===0:val==='';
 const ex=s=>bExpW(X,s,io,'s');
 if(rest===''){if(isArr&&q&&(name==='@'||sub==='@'))return{v:val,fields:vals};return{v:val}}
 let mm;
 if((mm=/^(:?)([-=+?])([\s\S]*)$/.exec(rest))){const colon=mm[1]==='\:',op=mm[2],w=mm[3];const bad=colon?empty:unset;
  if(op==='-')return{v:bad?ex(w):val};if(op==='='){if(bad){const nv=ex(w);bSet(X,name,nv);return{v:nv}}return{v:val}}if(op==='+')return{v:bad?'':ex(w)};if(op==='?'){if(bad)throw new Error(name+': '+(ex(w)||'parameter null or not set'));return{v:val}}}
 if((mm=/^(##|#|%%|%)([\s\S]*)$/.exec(rest))){const pat=ex(mm[2]);const re=bPat(pat);let best=null;
  if(mm[1][0]==='#'){for(let i=0;i<=val.length;i++){if(re.test(val.slice(0,i))){best=i;if(mm[1]==='#')break}}return{v:best===null?val:val.slice(best)}}
  else{for(let i=val.length;i>=0;i--){if(re.test(val.slice(i))){best=i;if(mm[1]==='%')break}}return{v:best===null?val:val.slice(0,best)}}}
 if((mm=/^(\/\/|\/#|\/%|\/)([\s\S]*)$/.exec(rest))){const k=mm[2].indexOf('/');const pat=ex(k<0?mm[2]:mm[2].slice(0,k)),rep=k<0?'':ex(mm[2].slice(k+1));if(pat==='')return{v:val};const src=bPat(pat).source.replace(/^\^/,'').replace(/\$$/,'');let re=new RegExp(mm[1]==='/#'?'^'+src:mm[1]==='/%'?src+'$':src,mm[1]==='//'?'g':'');return{v:val.replace(re,()=>rep)}}
 if((mm=/^:([^:]*)(?::([\s\S]*))?$/.exec(rest))){let off=bArith(X,mm[1]||'0'),ln=mm[2]!==undefined?bArith(X,mm[2]):undefined;if(isArr){let a=vals.slice(off<0?Math.max(0,vals.length+off):off,ln===undefined?undefined:(off<0?vals.length+off:off)+ln);return{v:a.join(' '),fields:q?a:undefined}}if(off<0)off=Math.max(0,val.length+off);return{v:ln===undefined?val.slice(off):val.slice(off,ln<0?val.length+ln:off+ln)}}
 if(rest==='^^')return{v:val.toUpperCase()};if(rest===',,')return{v:val.toLowerCase()};if(rest==='^')return{v:val.charAt(0).toUpperCase()+val.slice(1)};if(rest===',')return{v:val.charAt(0).toLowerCase()+val.slice(1)};
 throw new Error('${'+c+'}: bad substitution')}
function bDollar(X,raw,i,io,q){const nx=raw[i+1];
 if(raw[i]==='`'){let j=i+1;while(j<raw.length&&raw[j]!=='`'){if(raw[j]==='\\')j++;j++}return{v:bSubst(X,raw.slice(i+1,j).replace(/\\`/g,'`'),io),i:j+1}}
 if(nx==='('){const e=bMatchP(raw,i+1);const inner=raw.slice(i+2,e-1);if(raw[i+2]==='('&&inner.endsWith(')')){const e2=bMatchP(inner,0);if(e2===inner.length)return{v:String(bArith(X,inner.slice(1,-1))),i:e}}return{v:bSubst(X,inner,io),i:e}}
 if(nx==='{'){const e=bMatchB(raw,i+1);const r=bParam(X,raw.slice(i+2,e-1),io,q);r.i=e;return r}
 if(nx===undefined)return{v:'$',i:i+1};
 if(/[A-Za-z_]/.test(nx)){let j=i+1;while(j<raw.length&&/\w/.test(raw[j]))j++;return{v:bGet(X,raw.slice(i+1,j)),i:j}}
 if(/\d/.test(nx))return{v:bGet(X,nx),i:i+2};
 if(nx==='@'||nx==='*'){const v=X.pos.slice(1);return q&&nx==='@'?{v:v.join(' '),fields:v,i:i+2}:{v:v.join(' '),i:i+2}}
 if('?#$!-'.includes(nx))return{v:bGet(X,nx),i:i+2};
 return{v:'$',i:i+1}}
function bExpW(X,raw,io,mode){mode=mode||'f';if(mode==='f'){const bs=bBrace(raw);if(bs.length>1||bs[0]!==raw){const r=[];bs.forEach(b=>r.push(...bExpW(X,b,io,'f2')));return r}}
 const split=mode==='f'||mode==='f2';const fields=[];let cur='',has=false,glob=false;const pushF=()=>{if(has||cur!==''){fields.push({s:cur,g:glob})}cur='';has=false;glob=false};
 const addU=s=>{if(!split){cur+=s;return}const parts=s.split(/[ \t\n]+/);parts.forEach((t,k)=>{if(k>0)pushF();if(t!==''){cur+=t;if(/[*?\[]/.test(t))glob=true}})};
 let i=0;const n=raw.length;
 while(i<n){const c=raw[i];
  if(c==='\\'){const nx=raw[i+1];if(nx===undefined){cur+='\\';i++}else{if(mode==='h'&&!'$`\\\n'.includes(nx))cur+='\\'+nx;else if(nx!=='\n')cur+=nx;has=true;i+=2}continue}
  if(c==="'"&&mode!=='h'){const j=raw.indexOf("'",i+1);cur+=raw.slice(i+1,j<0?n:j);has=true;i=j<0?n:j+1;continue}
  if(c==='"'&&mode!=='h'){i++;has=true;while(i<n&&raw[i]!=='"'){const ch=raw[i];if(ch==='\\'&&'$`"\\\n'.includes(raw[i+1]||'\u0000')){if(raw[i+1]!=='\n')cur+=raw[i+1];i+=2;continue}
    if(ch==='$'||ch==='`'){const r=bDollar(X,raw,i,io,true);if(r.fields&&split){r.fields.forEach((f,k)=>{if(k>0)pushF();cur+=f;has=true});if(!r.fields.length&&false)has=false}else cur+=r.v;i=r.i;continue}cur+=ch;i++}i++;continue}
  if(c==='$'||c==='`'){const r=bDollar(X,raw,i,io,false);addU(r.v);i=r.i;continue}
  if(c==='~'&&i===0&&mode!=='h'&&/^~(\/|$)/.test(raw)){cur+=X.home;i++;continue}
  if(/[*?\[]/.test(c)&&mode!=='h')glob=true;cur+=c;i++}
 pushF();
 if(mode==='s'||mode==='h')return fields.length?fields.map(f=>f.s).join(' '):'';
 const res=[];fields.forEach(f=>{if(f.g){const g=sxGlob(X.fs,X.cwd,f.s,X.home);res.push(...g)}else res.push(f.s)});return res}
const bExp1=(X,raw,io,here)=>bExpW(X,raw,io,here?'h':'s');
