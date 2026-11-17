// ================= v23a: файловая система устройств, арифметика, diff (основа для скриптов и git) =================
const SXH='/home/student',SXW='/c/Users/student';
function sxInit(d){const f={};['/','/home',SXH,'/tmp','/etc','/srv','/var','/var/log','/c','/c/Users',SXW,'/c/Temp','/c/Windows'].forEach(p=>f[p]={d:1});
 f[SXH+'/hello.sh']={c:'#!/bin/bash\necho "Привет, мир!"\n'};f['/etc/hostname']={c:d.name+'\n'};
 f[SXW+'/hello.bat']={c:'@echo off\necho Привет, мир!\n'};f[SXW+'/hello.ps1']={c:'Write-Host "Привет, мир!"\n'};return f}
const sxFs=d=>d.fs||(d.fs=sxInit(d));
function sxNorm(cwd,p,home){p=String(p);const m=p.match(/^([A-Za-z]):[\\/]?(.*)$/);if(m)p='/'+m[1].toLowerCase()+'/'+m[2];
 p=p.replace(/\\/g,'/');if(p==='~'||p.startsWith('~/'))p=(home||SXH)+p.slice(1);if(!p.startsWith('/'))p=cwd+'/'+p;
 const o=[];for(const s of p.split('/')){if(!s||s==='.')continue;if(s==='..')o.pop();else o.push(s)}return'/'+o.join('/')}
const sxWin=p=>{const m=p.match(/^\/([a-z])(\/.*)?$/);return m?m[1].toUpperCase()+':'+(m[2]||'\\').replace(/\//g,'\\'):p};
function sxLs(fs,p){const pre=p==='/'?'/':p+'/',r=[];for(const k in fs){if(k.length>pre.length&&k.startsWith(pre)&&!k.slice(pre.length).includes('/'))r.push(k.slice(pre.length))}return r.sort((a,b)=>a.localeCompare(b,'en'))}
const sxDir=(fs,p)=>!!(fs[p]&&fs[p].d);
function sxWrite(fs,p,c,app){const par=p.slice(0,p.lastIndexOf('/'))||'/';if(!sxDir(fs,par))return'No such file or directory';if(fs[p]&&fs[p].d)return'Is a directory';c=String(c);
 const nc=(app&&fs[p]?fs[p].c:'')+c;if(nc.length>300000)return'File too large';fs[p]={...(fs[p]||{}),c:nc};return null}
function sxMk(fs,p,par){if(fs[p])return par&&fs[p].d?null:'File exists';const up=p.slice(0,p.lastIndexOf('/'))||'/';if(!fs[up]){if(!par)return'No such file or directory';const e=sxMk(fs,up,true);if(e)return e}else if(!fs[up].d)return'Not a directory';fs[p]={d:1};return null}
function sxRm(fs,p,rec){const n=fs[p];if(!n)return'No such file or directory';if(n.d){if(!rec)return'Is a directory';const pre=p+'/';for(const k of Object.keys(fs))if(k===p||k.startsWith(pre))delete fs[k]}else delete fs[p];return null}
function sxCp(fs,a,b,rec,mv){const n=fs[a];if(!n)return'No such file or directory';let dst=b;if(sxDir(fs,b))dst=(b==='/'?'':b)+'/'+a.slice(a.lastIndexOf('/')+1);
 if(n.d){if(!rec&&!mv)return'-r not specified; omitting directory';if(dst===a||dst.startsWith(a+'/'))return'cannot copy a directory into itself';const pre=a+'/',add={};for(const k of Object.keys(fs))if(k===a||k.startsWith(pre))add[dst+k.slice(a.length)]=JSON.parse(JSON.stringify(fs[k]));
  const up=dst.slice(0,dst.lastIndexOf('/'))||'/';if(!sxDir(fs,up))return'No such file or directory';Object.assign(fs,add);if(mv)sxRm(fs,a,true);return null}
 const up=dst.slice(0,dst.lastIndexOf('/'))||'/';if(!sxDir(fs,up))return'No such file or directory';if(fs[dst]&&fs[dst].d)return'Is a directory';fs[dst]={...n};if(mv)delete fs[a];return null}
const sxWild=s=>{let r='^';for(let i=0;i<s.length;i++){const c=s[i];if(c==='*')r+='[^/]*';else if(c==='?')r+='[^/]';else if(c==='['){const j=s.indexOf(']',i+2);if(j<0)r+='\\[';else{let b=s.slice(i+1,j);if(b[0]==='!')b='^'+b.slice(1);r+='['+b+']';i=j}}else r+=c.replace(/[.+^${}()|\\]/g,'\\$&')}return new RegExp(r+'$')};
function sxGlob(fs,cwd,pat,home){if(!/[*?\[]/.test(pat))return[pat];const abs=pat.startsWith('/'),segs=pat.split('/').filter(s=>s!=='');let cur=[abs?'/':''];
 for(const s of segs){const nx=[];for(const base of cur){const pre=base===''?'':(base==='/'?'/':base+'/');
  if(!/[*?\[]/.test(s)){if(fs[sxNorm(cwd,pre+s,home)])nx.push(pre+s);continue}
  const re=sxWild(s),dir=sxNorm(cwd,base===''?'.':base,home);for(const n of sxLs(fs,dir)){if(n.startsWith('.')&&!s.startsWith('.'))continue;if(re.test(n))nx.push(pre+n)}}cur=nx}
 return cur.length?cur:[pat]}
// ---- арифметика (bash $(( )), cmd set /a): целые числа ----
function sxArith(src,get,set){const T=[];const re=/\s*(0x[0-9a-fA-F]+|\d+|[A-Za-z_]\w*|\*\*|<<=|>>=|\+\+|--|&&|\|\||==|!=|<=|>=|<<|>>|[+\-*\/%&|^]=|[-+*\/%<>=!~?:()&|^,])/y;let m,pos=0;
 while(pos<src.length&&/\S/.test(src.slice(pos))){re.lastIndex=pos;m=re.exec(src);if(!m)throw new Error('syntax error in expression (error token is "'+src.slice(pos).trim().slice(0,12)+'")');T.push(m[1]);pos=re.lastIndex}
 let i=0;const pk=()=>T[i],nx=()=>T[i++];const num=v=>{if(typeof v==='number')return v;const s=String(v==null?'':v).trim();if(s==='')return 0;if(/^-?\d+$/.test(s))return parseInt(s,10);if(/^0x/i.test(s))return parseInt(s,16);return 0};
 const isId=t=>/^[A-Za-z_]\w*$/.test(t||'');
 function asg(){const st=i;if(isId(pk())){const n=T[i];const o=T[i+1];if(['=','+=','-=','*=','/=','%=','<<=','>>=','&=','|=','^='].includes(o)){i+=2;const r=asg();let v=r;if(o!=='='){const a=num(get(n));v=o==='+='?a+r:o==='-='?a-r:o==='*='?a*r:o==='/='?Math.trunc(a/(r||(()=>{throw new Error('division by 0')})())):o==='%='?a%r:o==='<<='?a<<r:o==='>>='?a>>r:o==='&='?a&r:o==='|='?a|r:a^r}set(n,v);return v}}i=st;return tern()}
 function tern(){const c=lor();if(pk()==='?'){nx();const a=asg();if(nx()!==':')throw new Error('expected :');const b=asg();return c?a:b}return c}
 function lor(){let a=land();while(pk()==='||'){nx();const b=land();a=(a||b)?1:0}return a}
 function land(){let a=bor();while(pk()==='&&'){nx();const b=bor();a=(a&&b)?1:0}return a}
 function bor(){let a=bxor();while(pk()==='|'){nx();a=a|bxor()}return a}
 function bxor(){let a=band();while(pk()==='^'){nx();a=a^band()}return a}
 function band(){let a=eq();while(pk()==='&'){nx();a=a&eq()}return a}
 function eq(){let a=rel();while(pk()==='=='||pk()==='!='){const o=nx(),b=rel();a=(o==='=='?a===b:a!==b)?1:0}return a}
 function rel(){let a=sh();while(['<','>','<=','>='].includes(pk())){const o=nx(),b=sh();a=(o==='<'?a<b:o==='>'?a>b:o==='<='?a<=b:a>=b)?1:0}return a}
 function sh(){let a=add();while(pk()==='<<'||pk()==='>>'){const o=nx(),b=add();a=o==='<<'?a<<b:a>>b}return a}
 function add(){let a=mul();while(pk()==='+'||pk()==='-'){const o=nx(),b=mul();a=o==='+'?a+b:a-b}return a}
 function mul(){let a=pw();while(pk()==='*'||pk()==='/'||pk()==='%'){const o=nx(),b=pw();if((o==='/'||o==='%')&&b===0)throw new Error('division by 0 (error token is "'+b+'")');a=o==='*'?a*b:o==='/'?Math.trunc(a/b):a%b}return a}
 function pw(){const a=un();if(pk()==='**'){nx();return Math.pow(a,pw())}return a}
 function un(){const t=pk();if(t==='!'){nx();return un()?0:1}if(t==='~'){nx();return~un()}if(t==='-'){nx();return-un()}if(t==='+'){nx();return un()}
  if((t==='++'||t==='--')&&isId(T[i+1])){nx();const n=nx(),v=num(get(n))+(t==='++'?1:-1);set(n,v);return v}return post()}
 function post(){const t=nx();if(t==null)throw new Error('syntax error: operand expected');if(t==='('){const v=cm();if(nx()!==')')throw new Error('missing )');return v}
  if(isId(t)){const v=num(get(t));if(pk()==='++'||pk()==='--'){const o=nx();set(t,v+(o==='++'?1:-1))}return v}if(/^0x/i.test(t))return parseInt(t,16);if(/^\d+$/.test(t))return/^0\d/.test(t)?parseInt(t,8):parseInt(t,10);throw new Error('syntax error: unexpected "'+t+'"')}
 function cm(){let v=asg();while(pk()===','){nx();v=asg()}return v}
 const v=cm();if(i<T.length)throw new Error('syntax error in expression (error token is "'+T[i]+'")');return v}
// ---- diff / LCS ----
function sxMatch(a,b){const n=a.length,m=b.length;let s=0;while(s<n&&s<m&&a[s]===b[s])s++;let e=0;while(e<n-s&&e<m-s&&a[n-1-e]===b[m-1-e])e++;
 const A=a.slice(s,n-e),B=b.slice(s,m-e),N=A.length,M=B.length;const mp=new Array(n).fill(-1);for(let i=0;i<s;i++)mp[i]=i;for(let k=0;k<e;k++)mp[n-1-k]=m-1-k;
 if(N&&M){if(N*M>3e6){return mp}const w=M+1,L=new Uint16Array((N+1)*w);for(let i=N-1;i>=0;i--)for(let j=M-1;j>=0;j--)L[i*w+j]=A[i]===B[j]?L[(i+1)*w+j+1]+1:Math.max(L[(i+1)*w+j],L[i*w+j+1]);
  let i=0,j=0;while(i<N&&j<M){if(A[i]===B[j]){mp[s+i]=s+j;i++;j++}else if(L[(i+1)*w+j]>=L[i*w+j+1])i++;else j++}}return mp}
function sxEdits(a,b){const mp=sxMatch(a,b),r=[];let j=0;for(let i=0;i<a.length;i++){if(mp[i]<0){r.push({t:'-',s:a[i],i});continue}while(j<mp[i]){r.push({t:'+',s:b[j],j});j++}r.push({t:' ',s:a[i],i,j});j=mp[i]+1}while(j<b.length){r.push({t:'+',s:b[j],j});j++}return r}
const sxLines=t=>{if(t==='')return[];const l=String(t).split('\n');if(l[l.length-1]==='')l.pop();return l};
function sxUdiff(ta,tb,na,nb,ctx){ctx=ctx==null?3:ctx;const a=sxLines(ta),b=sxLines(tb),E=sxEdits(a,b);if(!E.some(x=>x.t!==' '))return'';
 // позиции в старом и новом
 let ai=0,bi=0;E.forEach(x=>{x.ai=ai;x.bi=bi;if(x.t!=='+')ai++;if(x.t!=='-')bi++});
 const ch=[];E.forEach((x,k)=>{if(x.t!==' ')ch.push(k)});const hunks=[];let cur=null;
 ch.forEach(k=>{const lo=Math.max(0,k-ctx),hi=Math.min(E.length-1,k+ctx);if(cur&&lo<=cur.hi+1)cur.hi=hi;else{cur={lo,hi};hunks.push(cur)}});
 let o='--- '+na+'\n+++ '+nb+'\n';hunks.forEach(h=>{const sl=E.slice(h.lo,h.hi+1);const oa=sl.filter(x=>x.t!=='+').length,ob=sl.filter(x=>x.t!=='-').length;const sa=sl[0].ai+(oa?1:0),sb=sl[0].bi+(ob?1:0);
  o+=`@@ -${oa===1?sa:sa+','+oa} +${ob===1?sb:sb+','+ob} @@\n`+sl.map(x=>x.t+x.s).join('\n')+'\n'});return o}
// трёхстороннее слияние (diff3) по строкам: {text, conflict}
function sxMerge3(base,ours,theirs,ln1,ln2){const B=sxLines(base),O=sxLines(ours),T=sxLines(theirs),mo=sxMatch(B,O),mt=sxMatch(B,T);
 const out=[];let conflict=false,bi=0,oi=0,ti=0;
 const anchors=[];for(let i=0;i<B.length;i++)if(mo[i]>=0&&mt[i]>=0)anchors.push(i);anchors.push(-1);
 for(const a of anchors){const be=a<0?B.length:a,oe=a<0?O.length:mo[a],te=a<0?T.length:mt[a];
  const bs=B.slice(bi,be),os=O.slice(oi,oe),ts=T.slice(ti,te),eq=(x,y)=>x.length===y.length&&x.every((v,k)=>v===y[k]);
  if(eq(os,bs))out.push(...ts);else if(eq(ts,bs)||eq(os,ts))out.push(...os);else{conflict=true;out.push('<<<<<<< '+(ln1||'HEAD'),...os,'=======',...ts,'>>>>>>> '+(ln2||'other'))}
  if(a>=0){out.push(B[a]);bi=a+1;oi=mo[a]+1;ti=mt[a]+1}}
 return{text:out.length?out.join('\n')+'\n':'',conflict}}
const sxHash=(s,n)=>{let h1=0x811c9dc5,h2=0x9e3779b1;s=String(s);for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h1=Math.imul(h1^c,16777619);h2=Math.imul(h2^c,2246822519)^(h1>>>13)}
 let r='';let a=h1>>>0,b=h2>>>0;while(r.length<(n||40)){a=Math.imul(a^(b>>>15),2654435761)>>>0;b=Math.imul(b^(a>>>13),1597334677)>>>0;r+=a.toString(16).padStart(8,'0')+b.toString(16).padStart(8,'0')}return r.slice(0,n||40)};
// ---- мост к сетевой части симулятора ----
const SXNET=['ping','tracert','traceroute','nslookup','dig','host','curl','wget','ipconfig','ifconfig','arp','netstat','nc','telnet','ssh','nmap','iperf','route','tracepath'];
function sxNet(d,line){const keep=pSnap(),so=sel;out.textContent='';let r='';try{sel=d.id;let c=line;if(/^(traceroute|tracepath)\b/.test(c))c=c.replace(/^\w+/,'tracert');execOn(d,c);r=out.textContent}catch(e){r='error: '+e.message}finally{pRst(keep);sel=so}return r}
