// ===== v23d2: cmd / bat — выполнение =====
const C_ERR_NF='Системе не удается найти указанный файл.',C_ERR_PATH='Системе не удается найти указанный путь.';
function cUnq(s){return String(s).replace(/^"(.*)"$/,'$1')}
function cSplit(s){const r=[];s.replace(/"([^"]*)"|([^\s]+)/g,(m,q,w)=>r.push(q!==undefined?q:w));return r}
function cSplitQ(s){const r=[];const re=/(?:[^\s"]|"[^"]*")+/g;let m;while((m=re.exec(s)))r.push(m[0].replace(/"/g,''));return r}
function cGlob(X,pat){pat=String(pat).replace(/"/g,'');const i=Math.max(pat.lastIndexOf('\\'),pat.lastIndexOf('/'));const dp=i>=0?pat.slice(0,i+1):'',np=i>=0?pat.slice(i+1):pat;
 if(!/[*?]/.test(np))return[cPath(X,pat)];const dir=cPath(X,dp||'.');let rx;try{rx=new RegExp('^'+np.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*\.\*/g,'*').replace(/\*/g,'.*').replace(/\?/g,'.')+'$','i')}catch(e){return[]}
 return sxLs(X.fs,dir).filter(k=>rx.test(k)).map(k=>(dir==='/'?'':dir)+'/'+k)}
function cRedirSetup(X,rds,io){let out=io.out,err=io.err,inp=io.inp;const fin=[];let ttyOut=io.tty;
 for(const r of rds){if(r.dup!==undefined){if(r.fd===2&&r.dup===1)err=out;else if(r.fd===1&&r.dup===2)out=err;continue}
  const t=cUnq(cX(X,r.t));if(r.op==='<'){if(/^nul$/i.test(t)){inp={t:'',p:0};continue}const f=cPath(X,t),n=X.fs[f];if(!n||n.d){io.err(C_ERR_NF+'\n');return null}inp={t:String(n.c||''),p:0};continue}
  if(/^(nul|con)$/i.test(t)){if(/^nul$/i.test(t)){if(r.fd===2)err=()=>{};else out=()=>{}}continue}
  const f=cPath(X,t);const buf=[];const app=r.op==='>>';if(r.fd===2)err=s=>buf.push(s);else out=s=>buf.push(s);ttyOut=false;
  fin.push(()=>{const old=app?(X.fs[f]&&!X.fs[f].d?X.fs[f].c:''):'';const e=sxWrite(X.fs,f,old+buf.join(''));if(e)io.err(C_ERR_PATH+'\n')})}
 return{io:{inp,out,err,tty:ttyOut},fin:()=>fin.forEach(f=>f())}}
function cCond(X,n){const c=n.cond;let r;const ci=n.ci;
 if(c.t==='exist'){const p=cUnq(cX(X,c.v));const g=cGlob(X,p);r=g.some(f=>X.fs[f])}
 else if(c.t==='def')r=cGet(X,cX(X,c.v))!==undefined;
 else if(c.t==='err')r=X.last>=(parseInt(cX(X,c.v))||0);
 else if(c.t==='true')r=true;
 else{let a=cX(X,c.a),b=cX(X,c.b);if(ci){a=a.toLowerCase();b=b.toLowerCase()}
  if(c.op==='=='){r=a===b}else{const na=Number(cUnq(a)),nb=Number(cUnq(b));const num=a!==''&&b!==''&&!isNaN(na)&&!isNaN(nb);const x=num?na:cUnq(a),y=num?nb:cUnq(b);r=c.op==='equ'?x===y:c.op==='neq'?x!==y:c.op==='lss'?x<y:c.op==='leq'?x<=y:c.op==='gtr'?x>y:x>=y}}
 return n.neg?!r:r}
function cRun(X,n,io){cTick(X);
 switch(n.k){
  case'nop':return 0;
  case'seq':{let c=0;for(const it of n.items)c=cRun(X,it,io);return c}
  case'amp':cRun(X,n.a,io);return cRun(X,n.b,io);
  case'and':{const c=cRun(X,n.a,io);return c===0?cRun(X,n.b,io):c}
  case'or':{const c=cRun(X,n.a,io);return c!==0?cRun(X,n.b,io):c}
  case'pipe':{let inp=io.inp,c=0;for(let i=0;i<n.cmds.length;i++){const last=i===n.cmds.length-1,buf=[];c=cRun(X,n.cmds[i],{inp,out:last?io.out:s=>buf.push(s),err:io.err,tty:last?io.tty:false});if(!last)inp={t:buf.join(''),p:0}}return c}
  case'block':{const rs=cRedirSetup(X,n.redirs||[],io);if(!rs)return 1;try{return cRun(X,n.body,rs.io)}finally{rs.fin()}}
  case'if':{if(cCond(X,n))return cRun(X,n.then,io);return n.else?cRun(X,n.else,io):0}
  case'for':return cFor_(X,n,io);
  case'cmd':return cSimple(X,n,io)}
 throw new Error('неизвестный узел '+n.k)}
function cSimple(X,n,io){const rs=cRedirSetup(X,n.redirs,io);if(!rs)return 1;try{return cCmd(X,cX(X,n.text).replace(/^\s+/,''),rs.io)}finally{rs.fin()}}
const C_EXT=new Set(['ping','tracert','nslookup','ipconfig','curl','find','findstr','sort','git','powershell','pwsh','xcopy','robocopy','fc','net','arp','netstat','route','whoami','hostname','choice','timeout','where','telnet','ssh','tree','attrib','more','wget']);
function cCmd(X,text,io){if(!text)return 0;let name,rest;const callMode=X.inCall;X.inCall=false;
 let m=/^(echo)([.:\\\/(])(.*)$/is.exec(text);
 if(m){name=m[1];rest=m[2]+m[3]}else if((m=/^(cd|chdir)(\.\.|\\)(.*)$/is.exec(text))){name=m[1];rest=m[2]+m[3]}else{m=/^([^\s\/"=,;<>|&]+)([\s\S]*)$/.exec(text);if(!m){io.err('Синтаксическая ошибка команды.\n');return 1}name=m[1];rest=m[2]}
 if(/^[\\.]|[\\:]/.test(name)){const m2=/^(\S+)([\s\S]*)$/.exec(text);name=m2[1];rest=m2[2]}
 const ln=name.toLowerCase();
 // для echo: ровно один пробел после имени пропускается
 let raw=ln==='echo'&&/^[ \t]/.test(rest)?rest.slice(1):rest.replace(/^\s+/,'');
 if(ln==='echo'&&/^[.:\\\/(]/.test(rest)&&!/^[ \t]/.test(rest)){raw=rest.slice(1);if(raw==='')raw='\u0001'}
 const args=cSplitQ(rest);const f=CB[ln];let c;
 if(f){try{c=f(X,raw,args,io)}catch(e){if(e&&(e.cx||e.cs))throw e;io.err(`${name}: ${e.message}\n`);c=1}if(c===undefined)c=0;if(C_EXT.has(ln)||c!==0)X.last=c;return c}
 // запуск .bat/.cmd
 const bf=cFindBat(X,name);if(bf){const c2=cBat(X,bf,cSplitQ(rest),io,false);X.last=c2;if(!X.interactive&&!callMode)throw{cx:'exit',n:c2,b:false,chain:true};return c2}
 io.err(`"${name}" не является внутренней или внешней командой,\nисполняемой программой или пакетным файлом.\n`);X.last=9009;return 9009}
function cFindBat(X,name){const nm=cUnq(name);const cands=/\.(bat|cmd)$/i.test(nm)?[nm]:[nm+'.bat',nm+'.cmd'];for(const c of cands){const p=cPath(X,c);if(X.fs[p]&&!X.fs[p].d)return p}return null}
// ---------- for ----------
function cFor_(X,n,io){const old=X.fv[n.v];let c=0;const body=v=>{X.fv[n.v]=v;cTick(X);c=cRun(X,n.body,io)};
 try{const set=cX(X,n.set);
  if(n.kind==='l'){const [a,s,b]=set.split(',').map(x=>parseInt(x.trim()));if(!isNaN(a)&&!isNaN(s)&&!isNaN(b)&&s!==0){for(let i=a;s>0?i<=b:i>=b;i+=s)body(String(i))}return c}
  if(n.kind==='f')return cForF(X,n,set,io,body);
  if(n.kind==='r'){const root=n.root?cPath(X,cUnq(cX(X,n.root))):X.cwd;const items=cSplitQ(set).length?cSplitQ(set):['*'];const all=[];(function rec(d){for(const k of sxLs(X.fs,d)){const p=(d==='/'?'':d)+'/'+k;if(X.fs[p].d)rec(p)}items.forEach(it=>{const rxs=cGlob({...X,cwd:d},it);rxs.forEach(f=>{if(X.fs[f]&&!X.fs[f].d)all.push(f)})})})(root);all.forEach(f=>body(cWin(f)));return c}
  const items=[];set.replace(/"([^"]*)"|([^\s,;=]+)/g,(m,q,w)=>items.push(q!==undefined?{q:1,v:'"'+q+'"'}:{v:w}));
  for(const it of items){if(!it.q&&/[*?]/.test(it.v)){const g=cGlob(X,it.v).filter(f=>X.fs[f]&&(n.kind==='d'?X.fs[f].d:!X.fs[f].d));const bare=!/[\\\/]/.test(it.v);g.forEach(f=>body(bare?f.slice(f.lastIndexOf('/')+1):cWin(f)))}else if(n.kind!=='d')body(it.v);else body(it.v)}return c
 }finally{if(old===undefined)delete X.fv[n.v];else X.fv[n.v]=old}}
function cForF(X,n,set,io,body){let tokens='1',delims=' \t',skip=0,eol=';',usebq=false;const o=n.opts||'';
 let m;if((m=/tokens=([^\s]+)/i.exec(o)))tokens=m[1];if((m=/delims=((?:(?!\s(?:tokens|skip|eol|usebackq)=).)*)/i.exec(o)))delims=m[1];if((m=/skip=(\d+)/i.exec(o)))skip=+m[1];if((m=/eol=(.)/i.exec(o)))eol=m[1];usebq=/usebackq/i.test(o);
 let lines=[];const s=set.trim();const run=cmd=>{let buf='';cLineExec(X,cmd,{inp:{t:'',p:0},out:t=>buf+=t,err:io.err});return buf};
 if(!usebq&&s[0]==='"'&&s[s.length-1]==='"'&&s.length>1)lines=[s.slice(1,-1)];
 else if(!usebq&&s[0]==="'"&&s[s.length-1]==="'"&&s.length>1)lines=run(s.slice(1,-1)).split('\n');
 else if(usebq&&s[0]==='`'&&s[s.length-1]==='`')lines=run(s.slice(1,-1)).split('\n');
 else if(usebq&&s[0]==="'"&&s[s.length-1]==="'")lines=[s.slice(1,-1)];
 else{const files=[];s.replace(/"([^"]*)"|(\S+)/g,(mm,q,w)=>files.push(q!==undefined?q:w));for(const fl of files){const g=cGlob(X,fl);for(const f of g){const nd=X.fs[f];if(!nd||nd.d){io.err(`Системе не удается найти указанный файл.\n`);continue}lines.push(...String(nd.c||'').split('\n'))}}}
 lines=lines.map(l=>l.replace(/\r$/,''));if(lines.length&&lines[lines.length-1]==='')lines.pop();
 lines=lines.slice(skip);const sel=[];let star=false;tokens.split(',').forEach(t=>{if(t==='*'){star=true;sel.push('*')}else if(/^\d+-\d+$/.test(t)){const [a,b]=t.split('-').map(Number);for(let i=a;i<=b;i++)sel.push(i)}else if(/^\d+\*$/.test(t)){sel.push(+t.slice(0,-1));sel.push('*')}else if(/^\d+$/.test(t))sel.push(+t)});
 const dl=new Set(delims.split(''));
 for(const ln of lines){if(!ln.length||(eol&&ln[0]===eol))continue;
  // разбор по разделителям
  const parts=[];let i=0;const L=ln;let restAfter=[];while(i<L.length){while(i<L.length&&dl.has(L[i]))i++;if(i>=L.length)break;let j=i;while(j<L.length&&!dl.has(L[j]))j++;parts.push({v:L.slice(i,j),s:i});i=j}
  const vals=[];let maxTok=0;sel.forEach(t=>{if(t!=='*')maxTok=Math.max(maxTok,t)});
  sel.forEach(t=>{if(t==='*'){const idx=maxTok;const startPart=parts[idx];vals.push(startPart?L.slice(startPart.s):'')}else vals.push(parts[t-1]?parts[t-1].v:undefined)});
  if(vals.every(x=>x===undefined||x===''))if(!parts.length)continue;
  const first=n.v.charCodeAt(0);const saved={};vals.forEach((v,k)=>{const ch=String.fromCharCode(first+k);saved[ch]=X.fv[ch];if(v!==undefined)X.fv[ch]=v;else delete X.fv[ch]});
  try{body(vals[0]===undefined?'':vals[0]);}finally{Object.keys(saved).forEach(ch=>{if(ch!==n.v){if(saved[ch]===undefined)delete X.fv[ch];else X.fv[ch]=saved[ch]}})}
  // body() выставляет X.fv[n.v]; остальные переменные задали выше
 }return 0}
