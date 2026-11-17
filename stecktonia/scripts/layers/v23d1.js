// ===== v23d1: cmd / bat — сессия, раскрытие переменных, разбор =====
const CMK='\u0002';
function cSess(d){const home=SXW;return{d,fs:sxFs(d),cwd:home,home,shell:'cmd',env:{USERNAME:'student',USERPROFILE:'C:\\Users\\student',COMPUTERNAME:String(d.name).toUpperCase(),OS:'Windows_NT',PATH:'C:\\Windows\\system32;C:\\Windows',TEMP:'C:\\Temp',TMP:'C:\\Temp',HOMEDRIVE:'C:',HOMEPATH:'\\Users\\student',SYSTEMROOT:'C:\\Windows',COMSPEC:'C:\\Windows\\system32\\cmd.exe',PATHEXT:'.COM;.EXE;.BAT;.CMD',PROMPT:'$P$G'},echo:true,delayed:false,stack:[],pos:['cmd'],last:0,inp:{t:'',p:0},out:()=>{},err:()=>{},steps:0,t0:Date.now(),vt:0,ask:null,fv:{},interactive:true,prog:null,depth:0}}
const cWin=p=>sxWin(p);
const cPrompt=X=>cWin(X.cwd)+'>';
function cPath(X,p){p=String(p).replace(/"/g,'');let a=sxNorm(X.cwd,p,X.home);const fs=X.fs;if(fs[a]||a==='/')return a;const segs=a.split('/').filter(Boolean);let cur='';for(const s of segs){const nx=cur+'/'+s;if(fs[nx]){cur=nx;continue}const lo=s.toLowerCase();const hit=sxLs(fs,cur||'/').find(k=>k.toLowerCase()===lo);cur=hit?cur+'/'+hit:nx}return cur||'/'}
function cTick(X){if(++X.steps>400000||Date.now()-X.t0>7000)throw{cx:'limit'}}
function cDate(X){const t=new Date(Date.now()+X.vt*1000);const z=n=>String(n).padStart(2,'0');return{d:`${z(t.getDate())}.${z(t.getMonth()+1)}.${t.getFullYear()}`,t:`${z(t.getHours())}:${z(t.getMinutes())}:${z(t.getSeconds())},${z(Math.floor(t.getMilliseconds()/10))}`,w:['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][t.getDay()],hm:`${z(t.getHours())}:${z(t.getMinutes())}`}}
function cGet(X,n){n=String(n).toUpperCase();switch(n){case'ERRORLEVEL':return String(X.last);case'CD':return cWin(X.cwd);case'DATE':{const t=cDate(X);return t.w+' '+t.d}case'TIME':return cDate(X).t;case'RANDOM':return String(Math.floor(Math.random()*32768));case'CMDEXTVERSION':return'2'}return X.env[n]}
function cVarExpr(X,inner,keep){let m,name=inner,mod=null;const k=inner.indexOf(':');if(k>0){name=inner.slice(0,k);mod=inner.slice(k+1)}
 const v=cGet(X,name);if(v===undefined)return keep?undefined:'';
 if(mod===null)return v;
 if((m=/^~(-?\d+)(?:,(-?\d+))?$/.exec(mod))){let s=+m[1],l=m[2]!==undefined?+m[2]:undefined;if(s<0)s=Math.max(0,v.length+s);if(l===undefined)return v.slice(s);if(l<0)return v.slice(s,v.length+l);return v.substr(s,l)}
 if((m=/^([^=]+)=([\s\S]*)$/.exec(mod))){let f=m[1];const rep=m[2];let re;try{re=new RegExp((f[0]==='*'?'^[\\s\\S]*?':'')+f.replace(/^\*/,'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi')}catch(e){return v}return v.replace(re,rep)}
 return v}
function cArg(X,mods,n){const v=X.pos[n]===undefined?'':X.pos[n];return mods?cMod(X,mods,v):v}
function cMod(X,mods,val){let v=String(val);if(mods.includes('~'))v=v.replace(/^"(.*)"$/,'$1');const L=mods.replace('~','');if(!L)return v;const full=cWin(cPath(X,v));const m=/^([A-Za-z]:)(.*\\)?([^\\]*)$/.exec(full)||['',  '', '', full];const base=m[3],dot=base.lastIndexOf('.');const nm=dot>0?base.slice(0,dot):base,ex=dot>0?base.slice(dot):'';
 if(/f/i.test(L))return full;let o='';if(/d/i.test(L))o+=m[1];if(/p/i.test(L))o+=m[2]||'';if(/n/i.test(L))o+=nm;if(/x/i.test(L))o+=ex;return o}
// раскрытие %...% (в момент чтения строки)
function cPct(X,s,batch){let o='';for(let i=0;i<s.length;i++){const c=s[i];if(c!=='%'){o+=c;continue}
  if(batch){if(s[i+1]==='%'){const m=/^%%(~[a-zA-Z]*)?([A-Za-z])/.exec(s.slice(i));if(m){o+=CMK+(m[1]||'')+m[2];i+=m[0].length-1;continue}o+='%';i++;continue}
   let m=/^%(~[a-zA-Z]*)?(\d)/.exec(s.slice(i));if(m){o+=cArg(X,m[1]||'',+m[2]);i+=m[0].length-1;continue}
   if(s[i+1]==='*'){o+=X.pos.slice(1).join(' ');i++;continue}}
  const j=s.indexOf('%',i+1);if(j<0){if(!batch)o+='%';continue}const inner=s.slice(i+1,j);
  if(!inner||/[\s"<>|&]/.test(inner)){o+=batch&&!inner?'':'%';continue}
  const v=cVarExpr(X,inner,!batch);if(v===undefined){o+='%';continue}o+=v;i=j}return o}
function cDelay(X,s){if(!X.delayed||s.indexOf('!')<0)return s;let o='';for(let i=0;i<s.length;i++){const c=s[i];if(c==='^'&&s[i+1]==='!'){o+='!';i++;continue}if(c!=='!'){o+=c;continue}const j=s.indexOf('!',i+1);if(j<0){continue}const inner=s.slice(i+1,j);if(!inner||/[\s"<>|&]/.test(inner)){o+='!';continue}o+=cVarExpr(X,inner,false);i=j}return o}
function cFor(X,s){const ks=Object.keys(X.fv);if(!ks.length)return s;let o=s.replace(/\u0002(~[a-zA-Z]*)?([A-Za-z])/g,(m,md,l)=>X.fv[l]===undefined?'%'+(md||'')+l:(md?cMod(X,md,X.fv[l]):X.fv[l]));
 if(X.interactive)o=o.replace(/%(~[a-zA-Z]*)?([A-Za-z])/g,(m,md,l)=>X.fv[l]===undefined?m:(md?cMod(X,md,X.fv[l]):X.fv[l]));return o}
const cX=(X,s)=>cDelay(X,cFor(X,s));
// ---------- разбор ----------
function cParse(src){let p=0;const n=src.length;let D=0;
 const ws=()=>{while(p<n&&(src[p]===' '||src[p]==='\t'||src[p]==='\r'))p++};
 const wsnl=()=>{while(p<n&&/[\s;,]/.test(src[p]))p++};
 const isTerm=c=>c==='&'||c==='|'||c==='\n';
 const synErr=m=>{throw{cs:1,message:m||'Синтаксическая ошибка команды.'}};
 const kw=w=>{const m=new RegExp('^'+w+'(?=[\\s(]|$)','i').exec(src.slice(p));return m?(p+=w.length,true):false};
 function stmts(inBlock){const items=[];for(;;){wsnl();if(p>=n)break;if(src[p]===')'&&D>0){if(inBlock)break;p++;continue}items.push(amp());ws();if(p<n&&src[p]===')'&&D>0&&!inBlock)p++}return{k:'seq',items}}
 function amp(){let a=andor();for(;;){ws();if(src[p]==='&'&&src[p+1]!=='&'){p++;ws();if(p>=n||src[p]==='\n'||(src[p]===')'&&D>0))return a;a={k:'amp',a,b:andor()}}else return a}}
 function andor(){let a=pipe();for(;;){ws();if(src[p]==='&'&&src[p+1]==='&'){p+=2;a={k:'and',a,b:pipe()}}else if(src[p]==='|'&&src[p+1]==='|'){p+=2;a={k:'or',a,b:pipe()}}else return a}}
 function pipe(){const cs=[cmd()];for(;;){ws();if(src[p]==='|'&&src[p+1]!=='|'){p++;cs.push(cmd())}else break}return cs.length>1?{k:'pipe',cmds:cs}:cs[0]}
 function cmd(){ws();let quiet=false;while(src[p]==='@'){quiet=true;p++}ws();
  if(src[p]==='('){p++;D++;const b=stmts(true);if(src[p]===')'){p++;D--}else{D--;synErr('Не хватает закрывающей скобки.')}const rd=redirs();return{k:'block',body:b,redirs:rd,quiet}}
  const save=p;if(kw('if')){return ifc(quiet)}p=save;if(kw('for')){return forc(quiet)}p=save;
  if(/^rem(?=\s|$)/i.test(src.slice(p,p+4))||src.startsWith('::',p)){while(p<n&&src[p]!=='\n')p++;return{k:'nop'}}
  return simple(quiet)}
 function readWord(){ws();let o='';while(p<n){const c=src[p];if(c==='"'){const j=src.indexOf('"',p+1);const e=j<0?n:j+1;o+=src.slice(p,e);p=e;continue}if(/\s/.test(c)||isTerm(c)||c==='<'||c==='>')break;if(c===')'&&D>0)break;o+=c;p++}return o}
  function redirs(){const out=[];for(;;){ws();let fd=null;if(/[0-9]/.test(src[p]||'')&&(src[p+1]==='>'||src[p+1]==='<')){fd=+src[p];p++}const c=src[p];if(c!=='>'&&c!=='<'){if(fd!==null)p--;break}
    if(c==='>'){let op='>';p++;if(src[p]==='>'){op='>>';p++}if(src[p]==='&'){p++;const d=src[p++];out.push({fd:fd===null?1:fd,dup:+d});continue}ws();out.push({fd:fd===null?1:fd,op,t:readWord()})}else{p++;ws();out.push({fd:0,op:'<',t:readWord()})}}return out}
 function simple(quiet){let t='';const rd=[];while(p<n){const c=src[p];
   if(c==='^'){if(p+1<n){t+=src[p+1];p+=2}else p++;continue}
   if(c==='"'){const j=src.indexOf('"',p+1);const e=j<0?n:j+1;t+=src.slice(p,e);p=e;continue}
   if(isTerm(c))break;if(c===')'&&D>0)break;
   if(c==='>'||c==='<'){let fd=null;const m=/(?:^|\s)([0-2])$/.exec(t);if(m){fd=+m[1];t=t.slice(0,t.length-1)}
     if(c==='>'){let op='>';p++;if(src[p]==='>'){op='>>';p++}if(src[p]==='&'){p++;const d=src[p++];rd.push({fd:fd===null?1:fd,dup:+d});continue}ws();rd.push({fd:fd===null?1:fd,op,t:readWord()})}else{p++;ws();rd.push({fd:0,op:'<',t:readWord()})}continue}
   t+=c;p++}return{k:'cmd',text:t,redirs:rd,quiet}}
 const OPS={equ:1,neq:1,lss:1,leq:1,gtr:1,geq:1};
 function operand(){ws();let o='';while(p<n){const c=src[p];if(c==='"'){const j=src.indexOf('"',p+1);const e=j<0?n:j+1;o+=src.slice(p,e);p=e;continue}if(/\s/.test(c)||c==='\n')break;if(c==='='&&src[p+1]==='=')break;if(c==='('&&!o)break;if(c===')'&&D>0)break;o+=c;p++}return o}
 function body(){ws();if(src[p]==='('){const b=cmd();return{b,blk:true}}return{b:amp(),blk:false}}
 function ifc(quiet){ws();let ci=false,neg=false;for(;;){if(/^\/i(?=\s)/i.test(src.slice(p,p+3))){ci=true;p+=2;ws();continue}if(kw('not')){neg=!neg;ws();continue}break}
  let cond;if(kw('exist')){cond={t:'exist',v:operand()}}else if(kw('defined')){cond={t:'def',v:operand()}}else if(kw('errorlevel')){cond={t:'err',v:operand()}}else if(kw('cmdextversion')){cond={t:'true',v:operand()}}
  else{const a=operand();ws();let op;if(src.startsWith('==',p)){op='==';p+=2}else{const w=readWord().toLowerCase();if(!OPS[w])synErr('Синтаксическая ошибка команды.');op=w}const b=operand();cond={t:'cmp',a,op,b}}
  const th=body();let el=null;if(th.blk){const sv=p;ws();if(kw('else')){ws();el=body().b}else p=sv}return{k:'if',neg,ci,cond,then:th.b,else:el,quiet}}
 function forc(quiet){ws();let kind='',opts='',root='';
  const m=/^\/([lfrdLFRD])/.exec(src.slice(p,p+2));if(m){kind=m[1].toLowerCase();p+=2;ws()}
  if(kind==='f'&&src[p]==='"'){const j=src.indexOf('"',p+1);opts=src.slice(p+1,j);p=j+1;ws()}else if(kind==='r'&&src[p]!==CMK&&src[p]!=='%'){root=readWord();ws()}
  let v;if(src[p]===CMK||src[p]==='%'){const mm=/^(?:\u0002|%)(~[a-zA-Z]*)?([A-Za-z])/.exec(src.slice(p,p+8));if(!mm)synErr();v=mm[2];p+=mm[0].length}else synErr('Синтаксическая ошибка команды.');
  ws();if(!kw('in'))synErr('Ожидалось слово in.');ws();if(src[p]!=='(')synErr('Ожидалась скобка.');p++;let set='';let q=false;while(p<n&&(src[p]!==')'||q)){if(src[p]==='"')q=!q;set+=src[p++]}p++;ws();if(!kw('do'))synErr('Ожидалось слово do.');const b=body().b;return{k:'for',kind,opts,root,v,set,body:b,quiet}}
 const r=stmts(false);if(p<n&&D>0)synErr();return r}
