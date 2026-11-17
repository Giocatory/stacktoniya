// ===== v23e3: PowerShell — выполнение, конвейер, форматирование =====
function psVal2(S,n){if(n.t==='pipe'&&n.els.length===1&&n.els[0].t==='expr'&&!n.els[0].e.t.startsWith('incr'))return psEv(S,n.els[0].e);return psVal(S,n)}
function psErrOut(S,text){if(S.errCap)S.errCap.push(text);else if(!S.errSupp)S.err(text)}
function psFmtErr(rec){if(rec.cmd)return `${rec.cmd} : ${rec.msg}\n    + CategoryInfo          : ${rec.cat}: (${rec.target===undefined||rec.target===null?'':psStr(rec.target)}:String) [${rec.cmd}], ${rec.exc}\n    + FullyQualifiedErrorId : ${rec.id}\n`;return `${rec.msg}\n    + CategoryInfo          : ${rec.cat==='NotSpecified'&&rec.exc==='RuntimeException'&&rec.fromThrow!==false?'OperationStopped':rec.cat}: (${rec.fromThrow?psStr(rec.target):''}:${rec.fromThrow?'String':''}) [], ${rec.exc}\n    + FullyQualifiedErrorId : ${rec.id}\n`}
function psErr(S,cmd,msg,cat,exc,id,target){const rec=psRec(msg,cat,exc,target,cmd,id);const ea=String(S.eaCur||psGetVar(S,'ErrorActionPreference')||'Continue').toLowerCase();if(ea==='stop')throw{ps:'throw',v:rec};S.ok=false;S.errors.unshift(rec);if(ea!=='silentlycontinue'&&ea!=='ignore')psErrOut(S,psFmtErr(rec));return null}
// ---------- операторы ----------
const PSLN={path:'',ln:0};
function psRun(S,n,out){psTick(S);if(n&&n.ln)PSLN.ln=n.ln;switch(n.t){
 case'prog':case'block':case'blk':n.body.forEach(s=>psRun(S,s,out));return;
 case'phase':n.b.body.forEach(s=>psRun(S,s,out));return;
 case'nop':return;
 case'pipe':return psPipe(S,n,out);
 case'chain':{psRun(S,n.a,out);const ok=S.ok;if(n.op==='&&'?ok:!ok)psRun(S,n.b,out);return}
 case'assign':{let v=psVal2(S,n.r);if(n.op!=='='){const cur=psEv(S,n.l);v=psBin(S,n.op[0],cur,v)}psAssignTo(S,n.l,v);return}
 case'if':{if(psTruth(psVal2(S,n.c)))psRun(S,n.b,out);else if(n.e)psRun(S,n.e,out);return}
 case'while':{while(psTruth(psVal2(S,n.c))){psTick(S);try{psRun(S,n.b,out)}catch(e){if(e&&e.ps==='break')break;if(e&&e.ps==='continue')continue;throw e}}return}
 case'do':{do{psTick(S);try{psRun(S,n.b,out)}catch(e){if(e&&e.ps==='break')break;if(e&&e.ps==='continue'){}else throw e}const c=psTruth(psVal2(S,n.c));if(n.until?c:!c)break}while(true);return}
 case'for':{if(n.i)psRun(S,n.i,[]);while(!n.c||psTruth(psVal2(S,n.c))){psTick(S);try{psRun(S,n.b,out)}catch(e){if(e&&e.ps==='break')break;if(!(e&&e.ps==='continue'))throw e}if(n.u)psRun(S,n.u,[])}return}
 case'foreach':{const col=psEnum(psVal2(S,n.e)).slice();for(const x of col){psTick(S);psSetVar(S,n.v,x);try{psRun(S,n.b,out)}catch(e){if(e&&e.ps==='break')break;if(e&&e.ps==='continue')continue;throw e}}return}
 case'switch':{const v=psVal2(S,n.c);const items=psEnum(v);const cs=!!n.fl.casesensitive,rx=!!n.fl.regex,wc=!!n.fl.wildcard;let brk=false;for(const it of items){let matched=false;const sv=S.sc.vars.get('_');S.sc.vars.set('_',it);
   try{for(const c of n.cl){if(c.pat.t==='default')continue;let ok;if(c.pat.t==='sb')ok=psTruth(psInvoke(S,{__sb:1,b:c.pat.b},[],{_:it}));else{const pv=psEv(S,c.pat);ok=rx?psRx(pv,cs).test(psStr(it)):wc?psWild(psStr(pv),cs).test(psStr(it)):psEqv(it,pv,cs)}
     if(ok){matched=true;try{psRun(S,c.b,out)}catch(e){if(e&&e.ps==='break'){brk=true;break}throw e}}}
    if(!matched&&!brk){const d=n.cl.find(c=>c.pat.t==='default');if(d)try{psRun(S,d.b,out)}catch(e){if(!(e&&e.ps==='break'))throw e}}}
   finally{if(sv===undefined)S.sc.vars.del('_');else S.sc.vars.set('_',sv)}if(brk)break}return}
 case'func':S.funcs.set(n.name,n);return;
 case'try':{try{try{psRun(S,n.b,out)}catch(e){let rec=null;if(e&&e.ps==='throw')rec=e.v;else if(e&&(e.ps||e.cx||e.cs||e.bx))throw e;else if(e instanceof Error)rec=psRec(e.message,'NotSpecified','RuntimeException');else throw e;
     S.errors.unshift(rec);let handled=false;for(const c of n.catches){const tn=rec.exc;const ok=!c.types.length||c.types.some(t=>{const x=t.toLowerCase().replace(/^system\./,'').replace(/^management\.automation\./,'');return x==='exception'||x===String(tn).toLowerCase()||String(tn).toLowerCase().endsWith('.'+x.split('.').pop())||x.split('.').pop()===String(tn).toLowerCase().split('.').pop()});if(ok){handled=true;const sv=S.sc.vars.get('_');S.sc.vars.set('_',rec);try{psRun(S,c.b,out)}finally{if(sv===undefined)S.sc.vars.del('_');else S.sc.vars.set('_',sv)}break}}if(!handled)throw e}}finally{if(n.fin)psRun(S,n.fin,out)}return}
 case'return':{if(n.e){const v=psVal2(S,n.e);psEnum(v).forEach(x=>out.push(x))}throw{ps:'return'}}
 case'throw':{let v;if(n.e)v=psVal2(S,n.e);else v=S.sc.vars.get('_')||psGetVar(S,'_');let rec;if(isO(v)&&v.tn==='ErrorRecord')rec=v;else{const msg=v===null||v===undefined?'ScriptHalted':psStr(v);rec=psRec(msg,'OperationStopped','RuntimeException',msg,'','ScriptHalted');rec.fromThrow=true;rec.id=msg}throw{ps:'throw',v:rec}}
 case'break':throw{ps:'break'};case'continue':throw{ps:'continue'};
 case'exit':{const v=n.e?psVal2(S,n.e):0;throw{ps:'exit',n:psToNum(v,false)||0}}
 }
 // выражения как операторы
 const v=psEv(S,n);psEnum(v).forEach(x=>out.push(x))}
function psPipe(S,n,out){let items=[];for(let i=0;i<n.els.length;i++){const el=n.els[i];let res;
  if(el.t==='expr'){const e=el.e;if(e.t==='incr'&&!e.pre&&n.els.length===1){psEv(S,e);items=[];continue}const v=psEv(S,e);res=i>0?items:psEnum(v)}else res=psCmd(S,el,items);items=res}
 items.forEach(x=>out.push(x))}
// ---------- команды ----------
const PSALIAS={ls:'Get-ChildItem',dir:'Get-ChildItem',gci:'Get-ChildItem',cat:'Get-Content',gc:'Get-Content',type:'Get-Content',echo:'Write-Output',write:'Write-Output',cd:'Set-Location',sl:'Set-Location',chdir:'Set-Location',pwd:'Get-Location',gl:'Get-Location',cp:'Copy-Item',copy:'Copy-Item',cpi:'Copy-Item',mv:'Move-Item',move:'Move-Item',mi:'Move-Item',rm:'Remove-Item',del:'Remove-Item',erase:'Remove-Item',rmdir:'Remove-Item',ri:'Remove-Item',ren:'Rename-Item',rni:'Rename-Item',cls:'Clear-Host',clear:'Clear-Host',select:'Select-Object',sort:'Sort-Object',where:'Where-Object','?':'Where-Object',foreach:'ForEach-Object','%':'ForEach-Object',group:'Group-Object',measure:'Measure-Object',ft:'Format-Table',fl:'Format-List',sleep:'Start-Sleep',ps:'Get-Process',gps:'Get-Process',gsv:'Get-Service',gm:'Get-Member',iex:'Invoke-Expression',sls:'Select-String',ac:'Add-Content',sc:'Set-Content',gi:'Get-Item',ni:'New-Item',man:'Get-Help',help:'Get-Help',kill:'Stop-Process',spps:'Stop-Process',gcm:'Get-Command',gv:'Get-Variable',sv:'Set-Variable',rv:'Remove-Variable',pushd:'Push-Location',popd:'Pop-Location',curl:'Invoke-WebRequest',wget:'Invoke-WebRequest',iwr:'Invoke-WebRequest',irm:'Invoke-RestMethod',oh:'Out-Host',gdr:'Get-PSDrive',rvpa:'Resolve-Path',h:'Get-History',r:'Invoke-History',epcsv:'Export-Csv',ipcsv:'Import-Csv',measure:'Measure-Object',mkdir:'New-Directory',md:'New-Directory',tee:'Tee-Object',write:'Write-Output',gdt:'Get-Date',date:'Get-Date',ise:'Clear-Host'};
const PSNATIVE=new Set(['ping','tracert','nslookup','ipconfig','arp','netstat','route','telnet','ssh','git','whoami','hostname','tasklist','ver','find','findstr','more','tree','fc','xcopy','robocopy','net','attrib','choice','timeout','where','cmd','taskkill','vol','assoc','mklink']);
function psCmd(S,el,input){if(!el.redirs||!el.redirs.length)return psCmd0(S,el,input);
 let fileT=null,app=false,suppOut=false,suppErr=false,merge=false;for(const r of el.redirs){if(r.dup){if(r.fd==='2'||r.fd==='*')merge=true;continue}const t=psEv(S,r.t);const nul=/^\$?null$/i.test(psStr(t));if(r.fd==='2')suppErr=nul||suppErr;else if(r.fd==='*'){suppErr=nul;suppOut=nul}else{if(nul)suppOut=true;else{fileT=psStr(t);app=r.app}}}
 const svE=S.errSupp,svC=S.errCap;if(suppErr)S.errSupp=true;if(merge)S.errCap=[];let res;try{res=psCmd0(S,el,input);if(merge&&S.errCap.length)res=res.concat(S.errCap.join('').split('\n').filter((x,i,a)=>x!==''||i<a.length-1).map(x=>x))}finally{S.errSupp=svE;S.errCap=svC}
 if(suppOut)return[];if(fileT){const p=cPath(S,fileT);const old=app&&S.fs[p]&&!S.fs[p].d?S.fs[p].c:'';const e=sxWrite(S.fs,p,old+psFmtText(S,res)+(res.length?'\n':''));if(e)psErr(S,'Out-File','Не удается найти часть пути "'+cWin(p)+'".','OpenError','DirectoryNotFoundException','FileOpenFailure,Microsoft.PowerShell.Commands.OutFileCommand');return[]}return res}
function psCmd0(S,el,input){let name=null;const out=[];
 const toks=[];for(const a of el.args){if(a.pn!==undefined){const t={pn:a.pn};if(a.v){t.val=psEv(S,a.v);t.has=true}else t.raw=a.raw;toks.push(t)}else toks.push({val:psEv(S,a.v)})}
 if(el.callee){const v=psEv(S,el.callee.e);if(isSB(v)){const t=toks.map(x=>x.pn!==undefined?x:x.val);if(el.dot)psInvokeSB(S,v,toks.filter(x=>x.pn===undefined).map(x=>x.val),null,out,false);else psInvokeSB(S,v,toks.filter(x=>x.pn===undefined).map(x=>x.val),null,out,true);return out}name=psStr(v)}else name=el.name.replace(/`(.)/g,'$1');
 // общие параметры
 let ea=null;for(let i=toks.length-1;i>=0;i--){const t=toks[i];if(t.pn!==undefined&&/^(ea|erroraction)$/i.test(t.pn)){ea=psStr(t.has?t.val:(toks[i+1]&&toks[i+1].pn===undefined?toks[i+1].val:''));toks.splice(i,t.has?1:2)}else if(t.pn!==undefined&&/^(wa|warningaction|verbose|vb|debug|db|whatif|wi|confirm|cf|ev|errorvariable|ov|outvariable|ob|outbuffer|pv|iv|infa|informationaction)$/i.test(t.pn)){toks.splice(i,/^(wa|warningaction|ev|errorvariable|ov|outvariable|ob|outbuffer|pv|iv|infa|informationaction)$/i.test(t.pn)&&!t.has?2:1)}}
 const svEa=S.eaCur;S.eaCur=ea||null;S.ok=true;
 try{let ln=name.toLowerCase();if(PSALIAS[ln]&&!S.funcs.has(name))ln=PSALIAS[ln].toLowerCase();
  const fn=S.funcs.get(name)||S.funcs.get(ln);
  if(fn){psCallFunc(S,fn,toks,input,out);return out}
  const def=PSCMD[ln];if(def){const A=psBind(def,toks);A.toks=toks;A.name=PSCANON[ln]||name;def.fn(S,A,input,out);return out}
  if(ln==='powershell'||ln==='pwsh'||ln==='powershell.exe'){const so=S.out,se=S.err,sx=S.exited;let o='',e='';const args=[];toks.forEach(t=>{if(t.pn!==undefined)args.push('-'+t.pn);else psEnum(t.val).forEach(x=>args.push(psStr(x)))});S.psS=S;try{psMain(S,'',args,{inp:S.inp,out:x=>o+=x,err:x=>e+=x})}finally{S.out=so;S.err=se;S.exited=sx}if(e)psErrOut(S,e);const l=o.split('\n');if(l.length&&l[l.length-1]==='')l.pop();return l}
  if(PSNATIVE.has(ln)){return psNative(S,ln,toks,input)}
  if(/\.ps1$/i.test(name)||/\.(bat|cmd)$/i.test(name)||/[\\\/]/.test(name)){const p=cPath(S,name);const nd=S.fs[p];
   if(nd&&!nd.d){if(/\.ps1$/i.test(p)){psRunFile(S,p,toks,out,el.dot);return out}if(/\.(bat|cmd)$/i.test(p)){return psNative(S,'__bat',toks,input,p)}if(/\.sh$/i.test(p)){S.err('Файл .sh не исполняется в PowerShell.\n');return out}}
   if(!nd||!nd.d)throw psThrow(`Имя "${name}" не распознано как имя командлета, функции, файла сценария или выполняемой программы. Проверьте правильность написания имени, а также наличие и правильность пути, после чего повторите попытку.`,'ObjectNotFound','CommandNotFoundException',name,name,'CommandNotFoundException')}
  const bf=cFindBat(S,name);if(bf&&false)return out;
  throw psThrow(`Имя "${name}" не распознано как имя командлета, функции, файла сценария или выполняемой программы. Проверьте правильность написания имени, а также наличие и правильность пути, после чего повторите попытку.`,'ObjectNotFound','CommandNotFoundException',name,name,'CommandNotFoundException')}
 finally{S.eaCur=svEa}}
function psBind(def,toks){const A={n:{},pos:[],rest:[]};const all=[...def.pos,...def.sw,...(def.p||[])];const swset=new Set(def.sw.map(x=>x.toLowerCase()));
 const canon=pn=>{const l=pn.toLowerCase();let c=all.find(x=>x.toLowerCase()===l);if(!c&&def.al&&def.al[l])c=def.al[l];if(!c){c=all.find(x=>x.toLowerCase().startsWith(l))}return c||pn};
 for(let i=0;i<toks.length;i++){const t=toks[i];if(t.pn!==undefined){const c=canon(t.pn),l=c.toLowerCase();if(swset.has(l))A.n[l]=t.has?psTruth(t.val):true;else if(t.has)A.n[l]=t.val;else{const nx=toks[i+1];if(nx&&nx.pn===undefined){A.n[l]=nx.val;i++}else A.n[l]=true}}else A.pos.push(t.val)}
 let pi=0;def.pos.forEach(nm=>{if(!(nm.toLowerCase() in A.n)&&pi<A.pos.length)A.n[nm.toLowerCase()]=A.pos[pi++]});A.rest=A.pos.slice(pi);
 A.get=(...ns)=>{for(const x of ns){const v=A.n[x.toLowerCase()];if(v!==undefined)return v}return undefined};A.sw=n=>!!A.n[n.toLowerCase()];return A}
function psNative(S,ln,toks,input,batPath){const cx=S.cx||(S.cx=cSess(S.d));cx.fs=S.fs;cx.cwd=S.cwd;cx.env=Object.assign({},cx.env);cx.interactive=false;
 const args=[];toks.forEach(t=>{if(t.pn!==undefined){args.push((t.raw||('-'+t.pn)).replace(/:$/,''));if(t.has)psEnum(t.val).forEach(x=>args.push(psStr(x)))}else psEnum(t.val).forEach(x=>args.push(psStr(x)))});
 const raw=args.map(a=>/\s/.test(a)?'"'+a+'"':a).join(' ');let o='',e='';const io={inp:{t:input.map(psStr).join('\n')+(input.length?'\n':''),p:0},out:s=>o+=s,err:s=>e+=s,tty:false};let c=0;
 try{if(ln==='__bat'){c=cBat(cx,batPath,args,io,false)}else c=CB[ln](cx,raw,args,io)||0}catch(er){if(er&&(er.cx==='exit')){c=er.n}else throw er}
 S.lec=c;S.ok=c===0;if(e)psErrOut(S,e);const lines=o.split('\n');if(lines.length&&lines[lines.length-1]==='')lines.pop();return lines}
function psRunFile(S,path,toks,out,dot){const nd=S.fs[path];let prog;try{prog=psParse(nd.c||'')}catch(e){if(e&&e.ps==='parse'){psErrOut(S,`${cWin(path)} : ${e.message}\nAt ${cWin(path)}:${e.line||1} char:${e.col||1}\n    + CategoryInfo          : ParserError: (:) [], ParseException\n    + FullyQualifiedErrorId : ParseError\n`);S.ok=false;return}throw e}
 const sv=S.sc,sd=S.scriptDir,sp=S.scriptPath;const sc=dot?sv:{vars:new PsM(),parent:sv};S.sc=sc;S.scriptDir=cWin(path.slice(0,path.lastIndexOf('/'))||'/');S.scriptPath=cWin(path);
 try{if(prog.params)psBindParams(S,prog.params,toks,sc);else sc.vars.set('args',toks.filter(t=>t.pn===undefined).map(t=>t.val).concat(toks.filter(t=>t.pn!==undefined).map(t=>'-'+t.pn)));
  try{prog.body.forEach(s=>psRun(S,s,out))}catch(e){if(e&&e.ps==='return'){}else if(e&&e.ps==='exit'){S.lec=e.n;S.ok=e.n===0}else throw e}}finally{S.sc=sv;S.scriptDir=sd;S.scriptPath=sp}}
// ---------- форматирование вывода ----------
function psCell(v){if(v===null||v===undefined)return'';if(Array.isArray(v))return v.map(psCell).join(', ');if(isDT(v))return psDt(v.d,'dd.MM.yyyy HH:mm:ss');return psStr(v)}
function psProps(o){if(isH(o))return o.m.keys();return o.m.keys()}
function psFmtText(S,items){const lines=[];let i=0;const flush=s=>lines.push(s);
 const isPrim=v=>!(isO(v)||isH(v)||(v&&v.__fmt));
 while(i<items.length){const v=items[i];
  if(v&&v.__fmt){i++;const its=v.items;if(!its.length)continue;const props=v.props||(isH(its[0])?['Name','Value']:psProps(its[0]));const rows=its.map(x=>props.map(pn=>psFmtProp(x,pn)));if(v.__fmt==='list'){const w=Math.max(...props.map(p=>p.length));its.forEach((x,k)=>{props.forEach((p,j)=>flush(p.padEnd(w)+' : '+rows[k][j]));flush('')});if(its.length&&lines[lines.length-1]!=='')flush('')}else psTable(props,rows,its,flush,v.hide);continue}
  if(isPrim(v)){if(isDT(v))flush(psDt(v.d,"dddd, d MMMM yyyy 'г.' H:mm:ss"));else if(Array.isArray(v))flush(psCell(v));else flush(psStr(v));i++;continue}
  // группа однотипных объектов
  let j=i;const key=o=>isH(o)?'#hash':isO(o)?(o.tn+'|'+o.m.keys().join(',')):'?';const k0=key(v);const grp=[];while(j<items.length&&items[j]&&!items[j].__fmt&&!isPrim(items[j])&&key(items[j])===k0){grp.push(items[j]);j++}i=j;
  if(isH(grp[0])){grp.forEach(h=>{const ents=h.m.entries();const w=Math.max(30,...ents.map(e=>e[0].length+1));flush('');flush('Name'.padEnd(w)+' Value');flush('-'.repeat(4).padEnd(w)+' -----');ents.forEach(([k,x])=>flush(String(k).padEnd(w)+' '+psCell(x)));flush('')});continue}
  const tn=grp[0].tn;if(tn==='FileInfo'||tn==='DirectoryInfo'){psFileTable(grp,flush);continue}
  const props=psProps(grp[0]);if(props.length>4&&tn!=='MatchInfo'||grp[0].forceList){const w=Math.max(...props.map(p=>p.length));grp.forEach(x=>{props.forEach(p=>flush(p.padEnd(w)+' : '+psFmtProp(x,p)));flush('')});continue}
  if(tn==='MatchInfo'){grp.forEach(x=>flush(psStr(x)));continue}
  psTable(props,grp.map(x=>props.map(p=>psFmtProp(x,p))),grp,flush)}
 return lines.join('\n')}
function psFmtProp(x,p){if(isH(x)&&!x.m.has(p)){const e=x.m.entries();return''}const v=isH(x)||isO(x)?x.m.get(p):undefined;return psCell(v)}
function psTable(props,rows,its,flush,hide){const num=props.map((p,j)=>its.every(x=>{const v=isO(x)||isH(x)?x.m.get(props[j]):undefined;return typeof v==='number'||v===null||v===undefined})&&its.some(x=>typeof(isO(x)||isH(x)?x.m.get(props[j]):undefined)==='number'));
 const w=props.map((p,j)=>Math.max(p.length,...rows.map(r=>r[j].length)));const fmt=(r,hdr)=>r.map((c,j)=>num[j]?c.padStart(w[j]):c.padEnd(w[j])).join(' ').replace(/\s+$/,'');
 flush('');if(!hide){flush(fmt(props));flush(props.map((p,j)=>(num[j]?'-'.repeat(p.length).padStart(w[j]):'-'.repeat(p.length).padEnd(w[j]))).join(' ').replace(/\s+$/,''))}rows.forEach(r=>flush(fmt(r)));flush('')}
function psFileTable(grp,flush){const byDir=new Map();grp.forEach(x=>{const d=psStr(x.m.get('DirectoryName')||'');if(!byDir.has(d))byDir.set(d,[]);byDir.get(d).push(x)});
 for(const [d,xs] of byDir){flush('');flush('');flush('    Каталог: '+d);flush('');flush('');flush('Mode                LastWriteTime         Length Name');flush('----                -------------         ------ ----');
  xs.forEach(x=>{const t=x.m.get('LastWriteTime');const dt=t&&t.d?t.d:new Date();const len=x.m.get('PSIsContainer')?'':String(x.m.get('Length'));flush(`${x.m.get('Mode')}        ${psDt(dt,'dd.MM.yyyy')}     ${psDt(dt,'HH:mm')}${len.padStart(15)} ${x.m.get('Name')}`)});flush('')}}
// ---------- верхний уровень ----------
function psSess(d){const home=SXW;const S={d,fs:sxFs(d),cwd:home,home,shell:'ps',env:new PsM(),root:null,sc:null,funcs:new PsM(),errors:[],ok:true,lec:undefined,steps:0,t0:Date.now(),vt:0,out:()=>{},err:()=>{},inp:{t:'',p:0},ask:null,depth:0,dstack:[],svc:null,interactive:true};
 S.root={vars:new PsM(),parent:null};S.sc=S.root;const E={USERNAME:'student',USERPROFILE:'C:\\Users\\student',COMPUTERNAME:String(d.name).toUpperCase(),OS:'Windows_NT',PATH:'C:\\Windows\\system32;C:\\Windows',TEMP:'C:\\Temp',TMP:'C:\\Temp',HOMEDRIVE:'C:',HOMEPATH:'\\Users\\student',SYSTEMROOT:'C:\\Windows',USERDOMAIN:String(d.name).toUpperCase()};Object.keys(E).forEach(k=>S.env.set(k,E[k]));return S}
function psPrintErr(S,rec){const t=psFmtErr(rec);S.err(t)}
function psExecTop(S,src,io){S.out=io.out;S.err=io.err;if(io.inp)S.inp=io.inp;S.steps=0;S.t0=Date.now();
 {let n=0;const o=io.out;S.out=s=>{n+=s.length;if(n>120000)throw{ps:'limit'};o(s)}}
 let prog;try{prog=psParse(src)}catch(e){if(e&&e.ps==='parse'){S.err(`${e.message}\n    + CategoryInfo          : ParserError: (:) [], ParseException\n    + FullyQualifiedErrorId : ParseError\n`);S.ok=false;return 1}throw e}
 try{if(prog.params)psBindParams(S,prog.params,[],S.sc);
  for(const st of prog.body){const out=[];try{psRun(S,st,out)}catch(e){
    if(e&&e.ps==='throw'){const rec=e.v;if(rec.fromThrow===undefined&&!rec.cmd)rec.fromThrow=false;S.errors.unshift(rec);S.ok=false;if(out.length)S.out(psFmtText(S,out)+'\n');S.err(psFmtErr(rec));continue}
    if(e&&(e.ps==='break'||e.ps==='continue'||e.ps==='return'))continue;
    if(e&&e.ps==='exit'){S.lec=e.n;S.exited=true;return e.n}
    if(e&&e.ps==='limit'){S.err('\nПревышен лимит выполнения (возможно, бесконечный цикл) — скрипт прерван.\n');S.ok=false;return 1}
    if(e&&e.ps==='parse'){S.err(e.message+'\n');S.ok=false;continue}
    if(e instanceof Error){S.err('Внутренняя ошибка: '+e.message+'\n');S.ok=false;continue}throw e}
   if(out.length){const t=psFmtText(S,out);if(t!=='')S.out(t+'\n')}}}
 catch(e){if(e&&e.ps==='limit'){S.err('\nПревышен лимит вывода — скрипт прерван.\n');return 1}throw e}
 return S.ok===false?1:(S.lec||0)}
function psLine(S,line,io){S.interactive=true;return psExecTop(S,line,io)}
function psFile(S,path,args,io){const p=cPath(S,path);const nd=S.fs[p];if(!nd||nd.d){io.err(`Файл ${path} не найден.\n`);return 1}const toks=(args||[]).map(a=>({val:a}));
 const src=`& ${"'"+cWin(p).replace(/'/g,"''")+"'"} ${(args||[]).map(a=>/^-[A-Za-z]/.test(a)?a:"'"+String(a).replace(/'/g,"''")+"'").join(' ')}`;return psExecTop(S,src,io)}
// запуск из cmd/bash: powershell -Command "..." | -File x.ps1 | x.ps1
function psMain(X,raw,a,io){const S=X.psS||(X.psS=psSess(X.d));S.fs=X.fs;S.cwd=X.cwd;let cmd=null,file=null,fargs=[];for(let i=0;i<a.length;i++){const x=a[i];if(/^-(c|command)$/i.test(x)){cmd=a.slice(i+1).join(' ');break}if(/^-(f|file)$/i.test(x)){file=a[i+1];fargs=a.slice(i+2);break}if(/^-(nologo|noprofile|noninteractive|executionpolicy|ep|windowstyle|nop)$/i.test(x)){if(/^-(executionpolicy|ep|windowstyle)$/i.test(x))i++;continue}if(!cmd&&!file){if(/\.ps1$/i.test(x)){file=x;fargs=a.slice(i+1)}else cmd=a.slice(i).join(' ');break}}
 let c=0;if(file)c=psFile(S,file,fargs,io);else if(cmd)c=psLine(S,cmd,io);else{io.out('Windows PowerShell\n(интерактивный режим доступен в окне «Скрипты»)\n')}X.cwd=S.cwd;return c}
