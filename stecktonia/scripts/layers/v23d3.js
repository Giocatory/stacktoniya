// ===== v23d3: cmd / bat — встроенные команды, запуск программ =====
const cNum=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'\u00a0');
function cInpLines(X,io,files,cmd){if(!files.length){const t=io.inp?io.inp.t.slice(io.inp.p):'';if(io.inp)io.inp.p=io.inp.t.length;return[{n:'',t}]}
 const r=[];files.forEach(f=>cGlob(X,f).forEach(p=>{const n=X.fs[p];if(!n||n.d){io.err(`${cmd==='find'?'Файл не найден - '+cWin(p).split('\\').pop().toUpperCase():'Не удается открыть '+f}\n`);return}r.push({n:cWin(p),t:String(n.c||'')})}));return r}
const cLines=t=>{const l=String(t).replace(/\r/g,'').split('\n');if(l.length&&l[l.length-1]==='')l.pop();return l};
function cFsRegex(pat,lit,ci){let src;if(lit)src=pat.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');else src=pat.replace(/\\</g,'\\b').replace(/\\>/g,'\\b').replace(/\\([.*\[\]^$\\])/g,'\\$1');try{return new RegExp(src,ci?'i':'')}catch(e){return null}}
const CB={
 echo:(X,raw,a,io)=>{if(raw==='\u0001'){io.out('\n');return 0}if(raw===''){io.out(X.echo?'ECHO включен.\n':'ECHO выключен.\n');return 0}if(/^off\s*$/i.test(raw)){X.echo=false;return 0}if(/^on\s*$/i.test(raw)){X.echo=true;return 0}if(raw==='/?'){io.out('Отображает сообщения или включает и отключает отображение команд.\n');return 0}io.out(raw+'\n');return 0},
 rem:()=>0,
 set:(X,raw,a,io)=>{raw=raw.replace(/^\s+/,'');
  if(/^\/a\b/i.test(raw)){let ex=raw.replace(/^\/a\s*/i,'');ex=ex.replace(/^"([\s\S]*)"\s*$/,'$1');let res=null,assigned=false;
   const parts=[];let dp=0,cur='';for(const ch of ex){if(ch==='(')dp++;if(ch===')')dp--;if(ch===','&&dp===0){parts.push(cur);cur=''}else cur+=ch}parts.push(cur);
   for(const e of parts){if(!e.trim())continue;if(/(^|[^=!<>])=(?!=)|[-+*\/%&|^]=|<<=|>>=/.test(e))assigned=true;try{res=sxArith(e,nm=>{const v=cGet(X,nm);const x=parseInt(v);return isNaN(x)?0:x},(nm,v)=>{X.env[nm.toUpperCase()]=String(v)})}catch(er){io.err('Недопустимое число. Числа ограничены 32-разрядной точностью.\n');return 1}}
   if(X.interactive||!assigned)io.out(String(res===null?0:res)+'\n');return 0}
  if(/^\/p\b/i.test(raw)){const m=/^\/p\s+"?([^=]+)=([^"]*)"?\s*$/i.exec(raw);if(!m){io.err('Синтаксическая ошибка команды.\n');return 1}const nm=m[1].trim().toUpperCase();io.out(m[2]);let line=null;const q=io.inp;if(q&&q.p<q.t.length){let e=q.t.indexOf('\n',q.p);if(e<0)e=q.t.length;line=q.t.slice(q.p,e).replace(/\r$/,'');q.p=Math.min(q.t.length,e+1);io.out(line+'\n')}else if(X.ask){const r=X.ask(m[2]);if(r!==null&&r!==undefined){line=String(r);io.out(line+'\n')}}
   if(line===null){X.last=1;return 1}if(line==='')delete X.env[nm];else X.env[nm]=line;return 0}
  if(!raw){Object.keys(X.env).sort().forEach(k=>io.out(`${k}=${X.env[k]}\n`));return 0}
  let body=raw;const mq=/^"([\s\S]*)"\s*$/.exec(raw);if(mq)body=mq[1];
  const eq=body.indexOf('=');if(eq<0){const pre=body.toUpperCase();const ks=Object.keys(X.env).filter(k=>k.startsWith(pre)).sort();if(!ks.length){io.err(`Переменная среды ${body} не определена\n`);return 1}ks.forEach(k=>io.out(`${k}=${X.env[k]}\n`));return 0}
  const nm=body.slice(0,eq).trim().toUpperCase(),val=body.slice(eq+1);if(!nm){io.err('Синтаксическая ошибка команды.\n');return 1}if(val==='')delete X.env[nm];else X.env[nm]=val;return 0},
 setlocal:(X,raw)=>{X.stack.push({env:{...X.env},cwd:X.cwd,delayed:X.delayed,fv:{...X.fv}});if(/enabledelayedexpansion/i.test(raw))X.delayed=true;else if(/disabledelayedexpansion/i.test(raw))X.delayed=false;return 0},
 endlocal:(X)=>{const f=X.stack.pop();if(f){X.env=f.env;X.delayed=f.delayed}return 0},
 cd:(X,raw,a,io)=>{let t=raw.replace(/^\s*\/d\s*/i,'').trim();if(!t){io.out(cWin(X.cwd)+'\n');return 0}t=cUnq(t);if(/^[A-Za-z]:$/.test(t)){const dd='/'+t[0].toLowerCase();if(X.fs[dd]){X.cwd=dd;return 0}io.err('Системе не удается найти указанный диск.\n');return 1}
  const p=cPath(X,t);if(!X.fs[p]||!X.fs[p].d){io.err((X.fs[p]?'Неверное имя папки.':C_ERR_PATH)+'\n');return 1}X.cwd=p;return 0},
 pushd:(X,raw,a,io)=>{X.dstack=X.dstack||[];const p=cPath(X,cUnq(raw.trim()));if(!X.fs[p]||!X.fs[p].d){io.err(C_ERR_PATH+'\n');return 1}X.dstack.push(X.cwd);X.cwd=p;return 0},
 popd:(X)=>{if(X.dstack&&X.dstack.length)X.cwd=X.dstack.pop();return 0},
 cls:(X)=>{X.cleared=true;return 0},
 title:()=>0,color:()=>0,prompt:()=>0,attrib:()=>0,
 ver:(X,r,a,io)=>{io.out('\nMicrosoft Windows [Version 10.0.19045.3693]\n');return 0},
 vol:(X,r,a,io)=>{io.out(' Том в устройстве C не имеет метки.\n Серийный номер тома: 1A2B-3C4D\n');return 0},
 path:(X,r,a,io)=>{io.out('PATH='+X.env.PATH+'\n');return 0},
 hostname:(X,r,a,io)=>{io.out(X.d.name+'\n');return 0},
 whoami:(X,r,a,io)=>{io.out(String(X.d.name).toLowerCase()+'\\student\n');return 0},
 date:(X,r,a,io)=>{if(/\/t/i.test(r)){const t=cDate(X);io.out(t.w+' '+t.d+'\n');return 0}io.out('Текущая дата: '+cDate(X).w+' '+cDate(X).d+'\n');return 0},
 time:(X,r,a,io)=>{if(/\/t/i.test(r)){io.out(cDate(X).hm+'\n');return 0}io.out('Текущее время: '+cDate(X).t+'\n');return 0},
 timeout:(X,r,a,io)=>{const m=/\/t\s+(-?\d+)/i.exec(r)||/^\s*(-?\d+)/.exec(r);const s=m?+m[1]:0;X.vt+=Math.max(0,s);io.out(`\nОжидание ${Math.max(0,s)} секунд, для продолжения нажмите любую клавишу ...${/\/nobreak/i.test(r)?'':''}\n`);return 0},
 pause:(X,r,a,io)=>{io.out('Для продолжения нажмите любую клавишу . . . ');const q=io.inp;if(q&&q.p<q.t.length){const e=q.t.indexOf('\n',q.p);q.p=e<0?q.t.length:e+1}else if(X.ask)X.ask('Для продолжения нажмите любую клавишу . . . ');io.out('\n');return 0},
 choice:(X,r,a,io)=>{const cm=/\/c\s+(\S+)/i.exec(r);const keys=(cm?cm[1]:'YN').toUpperCase();const mm=/\/m\s+("[^"]*"|\S+)/i.exec(r);const nn=/\/n/i.test(r);io.out((mm?cUnq(mm[1])+' ':'')+(nn?'':'['+keys.split('').join(',')+']?')+'\n');let ch='';const q=io.inp;if(q&&q.p<q.t.length){ch=q.t[q.p];q.p++;if(ch==='\n'||ch==='\r'){ch='';}}else if(X.ask){ch=String(X.ask('Выбор ['+keys.split('').join(',')+']')||'')[0]||''}
  ch=ch.toUpperCase();const d=/\/d\s+(\S)/i.exec(r);let i=keys.indexOf(ch);if(i<0&&d)i=keys.indexOf(d[1].toUpperCase());if(i<0){return 255}io.out(keys[i]+'\n');return i+1},
 exit:(X,raw)=>{const b=/\/b/i.test(raw);const m=/(-?\d+)\s*$/.exec(raw);throw{cx:'exit',n:m?+m[1]:(b?X.last:0),b}},
 goto:(X,raw)=>{let l=cUnq(raw.trim().split(/\s/)[0]||'').replace(/^:/,'').toLowerCase();if(!l){throw{cs:1,message:'Синтаксическая ошибка команды.'}}throw{cx:'goto',label:l}},
 call:(X,raw,a,io)=>{const t=raw.trim();if(!t)return 0;if(t[0]===':'){const m=/^:(\S+)\s*([\s\S]*)$/.exec(t);return cCallLabel(X,m[1].toLowerCase(),cSplitQ(m[2]),io)}
  const ex=cPct(X,t,!X.interactive);X.inCall=true;try{return cLineExec(X,ex,io,true)}finally{X.inCall=false}},
 shift:(X,raw)=>{const m=/\/(\d)/.exec(raw);const k=m?+m[1]:1;if(k<=0||k>9)return 0;const head=X.pos.slice(0,k),tail=X.pos.slice(k+1);X.pos=[...head,...tail];return 0},
 start:(X,raw,a,io)=>{const t=raw.trim().replace(/^"[^"]*"\s*/,'');return t?cLineExec(X,t,io):0},
 cmd:(X,raw,a,io)=>{const m=/\/[ckCK]\s*([\s\S]*)$/.exec(raw);if(!m)return 0;return cLineExec(X,cUnq(m[1].trim()),io)},
 dir:(X,raw,a,io)=>{const bare=/\/b/i.test(raw),sub=/\/s/i.test(raw),onlyD=/\/a:?-?d/i.test(raw)&&!/\/a:?-d/i.test(raw);const pats=a.filter(x=>x[0]!=='/');const targets=pats.length?pats:['.'];let code=0;
  const lst=(dir,names)=>{const rows=names.map(k=>({k,n:X.fs[(dir==='/'?'':dir)+'/'+k]})).filter(r=>r.n&&(!onlyD||r.n.d));return rows};
  const stamp=cDate(X);const show=(dir,names,showDots)=>{const rows=lst(dir,names);if(bare){rows.forEach(r=>io.out((sub?cWin((dir==='/'?'':dir)+'/'+r.k):r.k)+'\n'));return rows}
   io.out(`\n Содержимое папки ${cWin(dir)}\n\n`);if(showDots&&dir.split('/').length>2){io.out(`${stamp.d}  ${stamp.hm}    <DIR>          .\n${stamp.d}  ${stamp.hm}    <DIR>          ..\n`)}
   let nf=0,nd=0,sz=0;rows.sort((x,y)=>(y.n.d?1:0)-(x.n.d?1:0)||x.k.localeCompare(y.k)).forEach(r=>{if(r.n.d){nd++;io.out(`${stamp.d}  ${stamp.hm}    <DIR>          ${r.k}\n`)}else{nf++;sz+=String(r.n.c||'').length;io.out(`${stamp.d}  ${stamp.hm} ${cNum(String(r.n.c||'').length).padStart(17)} ${r.k}\n`)}});
   io.out(`${String(nf).padStart(15)} файлов ${cNum(sz).padStart(14)} байт\n${String(nd+(showDots?2:0)).padStart(15)} папок  ${cNum(100000000).padStart(14)} байт свободно\n`);return rows};
  if(!bare)io.out(' Том в устройстве C не имеет метки.\n Серийный номер тома: 1A2B-3C4D\n');
  for(const t of targets){const g=cGlob(X,t);let any=false;for(const p of g){const nd=X.fs[p];if(!nd){continue}any=true;if(nd.d&&!/[*?]/.test(t.replace(/^.*[\\\/]/,''))){const walk=d=>{show(d,sxLs(X.fs,d),true);if(sub)sxLs(X.fs,d).forEach(k=>{const q=(d==='/'?'':d)+'/'+k;if(X.fs[q].d)walk(q)})};walk(p)}else{const dir=p.slice(0,p.lastIndexOf('/'))||'/';show(dir,[p.slice(p.lastIndexOf('/')+1)],false)}}
   if(!any){io.err((bare?'':'')+'Файл не найден\n');code=1}}return code},
 type:(X,raw,a,io)=>{let c=0;const fl=a.filter(x=>x[0]!=='/');if(!fl.length){io.err('Синтаксическая ошибка команды.\n');return 1}fl.forEach(f=>{cGlob(X,f).forEach(p=>{const n=X.fs[p];if(!n){io.err('Не удается найти указанный файл - '+f+'\n');c=1;return}if(n.d){io.err(`${cWin(p)}\nДоступ запрещен.\n`);c=1;return}io.out(String(n.c||''));if(n.c&&!String(n.c).endsWith('\n'))io.out('\n')})});return c},
 more:(X,raw,a,io)=>{cInpLines(X,io,a.filter(x=>x[0]!=='/')).forEach(x=>{io.out(x.t)});return 0},
 md:(X,raw,a,io)=>{let c=0;a.filter(x=>x[0]!=='/').forEach(f=>{const p=cPath(X,f);if(X.fs[p]){io.err(`Подпапка или файл ${f} уже существует.\n`);c=1;return}const e=sxMk(X.fs,p,true);if(e){io.err(C_ERR_PATH+'\n');c=1}});return c},
 rd:(X,raw,a,io)=>{const rec=/\/s/i.test(raw),q=/\/q/i.test(raw);let c=0;a.filter(x=>x[0]!=='/').forEach(f=>{const p=cPath(X,f);const n=X.fs[p];if(!n){io.err(C_ERR_PATH+'\n');c=1;return}if(!n.d){io.err('Неверное имя папки.\n');c=1;return}if(!rec&&sxLs(X.fs,p).length){io.err('Папка не пуста.\n');c=1;return}if(X.cwd===p||X.cwd.startsWith(p+'/')){io.err('Процесс не может получить доступ к файлу, так как этот файл занят другим процессом.\n');c=1;return}sxRm(X.fs,p,true)});return c},
 del:(X,raw,a,io)=>{let c=0;const sub=/\/s/i.test(raw);a.filter(x=>x[0]!=='/').forEach(f=>{let list=cGlob(X,f);if(sub){const out=[];const base=list.length&&!/[*?]/.test(f)?[]:[];}let any=false;list.forEach(p=>{const n=X.fs[p];if(!n)return;if(n.d){sxLs(X.fs,p).forEach(k=>{const q=p+'/'+k;if(!X.fs[q].d){delete X.fs[q];any=true}});any=true;return}delete X.fs[p];any=true});if(!any){io.err('Не удается найти '+cWin(cPath(X,f))+'\n');c=1}});return c},
 copy:(X,raw,a,io)=>{const fl=a.filter(x=>x[0]!=='/');if(fl.length<1){io.err('Синтаксическая ошибка команды.\n');return 1}
  let srcs,dst;if(fl.length===1){srcs=[fl[0]];dst='.'}else{srcs=fl.slice(0,-1);dst=fl[fl.length-1]}
  let plus=srcs.join(' ').includes('+')?srcs.join('').split('+'):null;let cnt=0;const dp=cPath(X,dst);
  if(plus){let acc='';let ok=true;plus.forEach(f=>{const n=X.fs[cPath(X,f)];if(!n||n.d){io.err(C_ERR_NF+'\n');ok=false}else acc+=String(n.c||'')});if(!ok){io.out('        Скопировано файлов:         0.\n');return 1}const tgt=X.fs[dp]&&X.fs[dp].d?dp+'/'+plus[0].split(/[\\\/]/).pop():dp;sxWrite(X.fs,tgt,acc);io.out('        Скопировано файлов:         1.\n');return 0}
  let code=0;srcs.forEach(s=>{if(/^nul$/i.test(s)){const t=X.fs[dp]&&X.fs[dp].d?dp+'/nul':dp;sxWrite(X.fs,t,'');cnt++;return}const g=cGlob(X,s);const ex=g.filter(p=>X.fs[p]&&!X.fs[p].d);if(!ex.length){io.err(C_ERR_NF+'\n');code=1;return}ex.forEach(p=>{let t=dp;if(X.fs[dp]&&X.fs[dp].d)t=dp+'/'+p.slice(p.lastIndexOf('/')+1);else if(fl.length===1)t=X.cwd+'/'+p.slice(p.lastIndexOf('/')+1);if(t===p){io.err('Невозможно скопировать файл сам в себя.\n');code=1;return}const e=sxWrite(X.fs,t,X.fs[p].c||'');if(e){io.err(C_ERR_PATH+'\n');code=1}else cnt++})});
  io.out(`        Скопировано файлов: ${String(cnt).padStart(9)}.\n`);return code},
 xcopy:(X,raw,a,io)=>{const fl=a.filter(x=>x[0]!=='/');if(fl.length<2){io.err('Недопустимое число параметров\n');return 4}const rec=/\/[se]/i.test(raw);const sp=cPath(X,fl[0]);let dp=cPath(X,fl[1]);let cnt=0;
  const copyTree=(s,d)=>{sxMk(X.fs,d,true);sxLs(X.fs,s).forEach(k=>{const a1=s+'/'+k,b1=d+'/'+k;if(X.fs[a1].d){if(rec)copyTree(a1,b1)}else{X.fs[b1]={c:X.fs[a1].c};io.out(cWin(a1)+'\n');cnt++}})};
  const nd=X.fs[sp];if(!nd){const g=cGlob(X,fl[0]).filter(p=>X.fs[p]&&!X.fs[p].d);if(!g.length){io.err('Не удается найти файл: '+fl[0]+'\n');return 4}sxMk(X.fs,dp,true);g.forEach(p=>{X.fs[dp+'/'+p.slice(p.lastIndexOf('/')+1)]={c:X.fs[p].c};io.out(cWin(p)+'\n');cnt++})}
  else if(nd.d){copyTree(sp,dp)}else{if(X.fs[dp]&&X.fs[dp].d)dp+='/'+sp.slice(sp.lastIndexOf('/')+1);X.fs[dp]={c:nd.c};io.out(cWin(sp)+'\n');cnt++}
  io.out(`Скопировано файлов: ${cnt}\n`);return 0},
 robocopy:(X,raw,a,io)=>{const fl=a.filter(x=>x[0]!=='/');if(fl.length<2){io.err('Ошибка: недопустимый параметр\n');return 16}const sp=cPath(X,fl[0]),dp=cPath(X,fl[1]);if(!X.fs[sp]||!X.fs[sp].d){io.err(`Ошибка 2 (0x00000002) Чтение исходного каталога ${cWin(sp)}\\\nСистема не может найти указанный файл.\n`);return 16}
  let cnt=0;const rec=/\/(s|e|mir)/i.test(raw);const walk=(s,d)=>{sxMk(X.fs,d,true);sxLs(X.fs,s).forEach(k=>{const a1=s+'/'+k,b1=d+'/'+k;if(X.fs[a1].d){if(rec)walk(a1,b1)}else{if(!X.fs[b1]||X.fs[b1].c!==X.fs[a1].c){X.fs[b1]={c:X.fs[a1].c};cnt++;io.out(`\t\t    1\t${cWin(a1)}\n`)}}})};walk(sp,dp);io.out(`\n               Всего    Скопировано\n   Файлов: ${String(cnt).padStart(9)}  ${String(cnt).padStart(9)}\n`);return cnt?1:0},
 move:(X,raw,a,io)=>{const fl=a.filter(x=>x[0]!=='/');if(fl.length<2){io.err('Синтаксическая ошибка команды.\n');return 1}const dp=cPath(X,fl[1]);let c=0,cnt=0;cGlob(X,fl[0]).forEach(p=>{if(!X.fs[p]){io.err(C_ERR_NF+'\n');c=1;return}let t=dp;if(X.fs[dp]&&X.fs[dp].d)t=dp+'/'+p.slice(p.lastIndexOf('/')+1);const e=sxCp(X.fs,p,t,true,true);if(e){io.err(C_ERR_NF+'\n');c=1}else cnt++});io.out(`        Перемещено файлов:     ${String(cnt).padStart(3)}.\n`);return c},
 ren:(X,raw,a,io)=>{const fl=a.filter(x=>x[0]!=='/');if(fl.length<2){io.err('Синтаксическая ошибка команды.\n');return 1}const p=cPath(X,fl[0]);if(!X.fs[p]){io.err(C_ERR_NF+'\n');return 1}const nn=fl[1].replace(/\\/g,'/');if(/\//.test(nn)){io.err('Синтаксическая ошибка команды.\n');return 1}const t=p.slice(0,p.lastIndexOf('/'))+'/'+nn;if(X.fs[t]){io.err('Файл с таким именем уже существует, либо файл не найден.\n');return 1}const e=sxCp(X.fs,p,t,true,true);return e?1:0},
 find:(X,raw,a,io)=>{const m=/"([^"]*)"/.exec(raw);if(!m){io.err('FIND: Неправильный формат параметра\n');return 2}const pat=m[1];const rest=raw.replace(/"[^"]*"/,'');const fl=cSplitQ(rest).filter(x=>x[0]!=='/');const ci=/\/i/i.test(rest),cnt=/\/c/i.test(rest),inv=/\/v/i.test(rest),num=/\/n/i.test(rest);let any=false;
  cInpLines(X,io,fl,'find').forEach(x=>{const ls=cLines(x.t);let k=0;if(x.n&&!cnt)io.out(`\n---------- ${x.n.toUpperCase()}\n`);else if(x.n)io.out(`\n---------- ${x.n.toUpperCase()}: `);ls.forEach((l,i)=>{const h=pat===''?false:ci?l.toLowerCase().includes(pat.toLowerCase()):l.includes(pat);if(h!==inv){k++;any=true;if(!cnt)io.out((num?`[${i+1}]`:'')+l+'\n')}});if(cnt)io.out(k+'\n')});return any?0:1},
 findstr:(X,raw,a,io)=>{const flags={};const pats=[];const files=[];const toks=[];raw.replace(/(\/c:"[^"]*"|\/c:\S+|"[^"]*"|\S+)/g,m=>toks.push(m));
  let hasC=false;toks.forEach(t=>{let m;if((m=/^\/c:"?([^"]*)"?$/i.exec(t))){hasC=true;pats.push(m[1])}else if(/^\/[a-z]$/i.test(t)||/^\/[a-z]:/i.test(t)){flags[t[1].toLowerCase()]=1}else if(!hasC&&!pats.length&&!flags._p){flags._p=1;const p=cUnq(t);p.split(/\s+/).filter(Boolean).forEach(x=>pats.push(x))}else files.push(cUnq(t))});
  if(!pats.length){io.err('FINDSTR: Не указана строка поиска.\n');return 2}const lit=!flags.r;const res=pats.map(p=>cFsRegex(p,lit,flags.i)).filter(Boolean);let found=false;
  let fl=files;if(flags.s){const ex=[];files.forEach(f=>{const i=Math.max(f.lastIndexOf('\\'),f.lastIndexOf('/'));const base=i>=0?f.slice(0,i+1):'',np=f.slice(i+1);(function rec(d){for(const k of sxLs(X.fs,d)){const q=(d==='/'?'':d)+'/'+k;if(X.fs[q].d)rec(q)}cGlob({...X,cwd:d},np).forEach(q=>{if(X.fs[q]&&!X.fs[q].d)ex.push(q)})})(cPath(X,base||'.'))});fl=ex.map(cWin)}
  const multi=fl.length>1||flags.s;cInpLines(X,io,fl,'findstr').forEach(x=>{cLines(x.t).forEach((l,i)=>{const h=res.some(r=>r.test(l));if(h!==!!flags.v){found=true;if(flags.m){return}io.out((multi&&x.n?x.n+':':'')+(flags.n?(i+1)+':':'')+l+'\n')}});if(flags.m&&found)io.out(x.n+'\n')});return found?0:1},
 sort:(X,raw,a,io)=>{const rev=/\/r/i.test(raw);const L=[];cInpLines(X,io,a.filter(x=>x[0]!=='/')).forEach(x=>L.push(...cLines(x.t)));L.sort((p,q)=>p.toLowerCase()<q.toLowerCase()?-1:p.toLowerCase()>q.toLowerCase()?1:0);if(rev)L.reverse();L.forEach(l=>io.out(l+'\n'));return 0},
 fc:(X,raw,a,io)=>{const fl=a.filter(x=>x[0]!=='/');if(fl.length<2){io.err('FC: Неправильный формат параметра\n');return 2}const A=X.fs[cPath(X,fl[0])],B=X.fs[cPath(X,fl[1])];if(!A||!B){io.err(`FC: не удается открыть ${!A?fl[0]:fl[1]} - Системе не удается найти указанный файл\n`);return 2}io.out(`Сравнение файлов ${fl[0]} и ${fl[1]}\n`);if(A.c===B.c){io.out('FC: различия не найдены\n\n');return 0}const la=cLines(A.c||''),lb=cLines(B.c||'');const n=Math.max(la.length,lb.length);for(let i=0;i<n;i++)if(la[i]!==lb[i]){io.out(`***** ${fl[0]}\n${la[i]===undefined?'':la[i]}\n***** ${fl[1]}\n${lb[i]===undefined?'':lb[i]}\n*****\n\n`)}return 1},
 tree:(X,raw,a,io)=>{const files=/\/f/i.test(raw);const root=cPath(X,a.filter(x=>x[0]!=='/')[0]||'.');io.out('Структура папок тома\nСерийный номер тома: 1A2B-3C4D\n'+cWin(root)+'\n');const walk=(d,pre)=>{const ks=sxLs(X.fs,d).filter(k=>files||X.fs[(d==='/'?'':d)+'/'+k].d);ks.forEach((k,i)=>{const q=(d==='/'?'':d)+'/'+k,last=i===ks.length-1;io.out(pre+(last?'└───':'├───')+k+'\n');if(X.fs[q].d)walk(q,pre+(last?'    ':'│   '))})};walk(root,'');return 0},
 where:(X,raw,a,io)=>{let c=1;a.forEach(n=>{const f=cFindBat(X,n);if(f){io.out(cWin(f)+'\n');c=0}else if(CB[n.toLowerCase()]&&C_EXT.has(n.toLowerCase())){io.out('C:\\Windows\\System32\\'+n+'.exe\n');c=0}});if(c)io.err('ИНФОРМАЦИЯ: не удается найти файлы по заданным шаблонам.\n');return c},
 mklink:()=>0,assoc:()=>0,reg:()=>0,
 tasklist:(X,r,a,io)=>{io.out('Имя образа                     PID Имя сессии     № сеанса       Память\n========================= ======== ================ =========== ============\nSystem                           4 Services                   0        144 КБ\nexplorer.exe                  4120 Console                    1     82 340 КБ\ncmd.exe                       5212 Console                    1      3 912 КБ\n');return 0},
 taskkill:(X,r,a,io)=>{io.out('УСПЕХ: Процесс завершен.\n');return 0},
 net:(X,raw,a,io)=>{const s=(a[0]||'').toLowerCase();if(s==='user'){io.out(`\nУчетные записи пользователей для \\\\${String(X.d.name).toUpperCase()}\n\n-------------------------------------------------------------------------------\nAdministrator            student                  Guest\nКоманда выполнена успешно.\n\n`);return 0}io.out('Команда выполнена успешно.\n');return 0}
};
CB.chdir=CB.cd;CB.mkdir=CB.md;CB.rmdir=CB.rd;CB.erase=CB.del;CB.rename=CB.ren;
// сетевые и внешние
['ping','tracert','nslookup','ipconfig','curl','wget','arp','netstat','route','telnet','ssh'].forEach(nm=>{CB[nm]=(X,raw,a,io)=>{let ln=nm+' '+raw.trim();if(nm==='ping'||nm==='tracert'){let tg=null;for(let i=0;i<a.length;i++){const x=a[i];if(/^[-\/](n|w|l|i|t|s|j|k|r|c|W|m|H|S|R)$/.test(x)&&!/^[-\/](t|a|4|6)$/.test(x)){i++;continue}if(/^[-\/]/.test(x))continue;tg=x;break}ln=nm+(tg?' '+tg:'')}
 const o=sxNet(X.d,ln);io.out(o.endsWith('\n')||!o?o:o+'\n');return sxNetCode(nm,o)}});
CB.git=(X,raw,a,io)=>gitRun(X.d,X.cwd,a,{out:s=>io.out(s.replace(/(^|[\s'"(])\/([a-z])\//g,(m,p,l)=>p+l.toUpperCase()+':/')),err:io.err});
CB.powershell=CB.pwsh=(X,raw,a,io)=>{if(typeof psMain==='function')return psMain(X,raw,a,io);io.err('PowerShell недоступен\n');return 1};
// ---------- программы ----------
function cProgram(src){src=String(src).replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').replace(/\^\n/g,'');const items=[],labels={};const n=src.length;let i=0,line=1;
 while(i<n){let j=i;while(j<n&&(src[j]===' '||src[j]==='\t'))j++;if(src[j]==='\n'){i=j+1;line++;continue}
  const rest=src.slice(j,j+400);let m;
  if((m=/^@?\s*(::[^\n]*)/.exec(rest))||(m=/^@?\s*rem(?:\s[^\n]*)?(?=\n|$)/i.exec(rest))){i=j+m[0].length;continue}
  if((m=/^:([^\s:][^\s]*)[^\n]*/.exec(rest))){const lb=m[1].toLowerCase();if(!(lb in labels))labels[lb]=items.length;i=j+m[0].length;continue}
  const echoLine=/^@?\s*echo(?=[\s.:\\/(]|$)/i.test(rest);let D=0,q=false,k=j;for(;k<n;k++){const ch=src[k];if(ch==='"'&&(!echoLine||D>0))q=!q;if(q)continue;if(ch==='^'){k++;continue}if(!echoLine||D>0){if(ch==='(')D++;else if(ch===')'&&D>0)D--}if(ch==='\n'&&D<=0)break}
  items.push({text:src.slice(j,k),line});for(let t=j;t<k;t++)if(src[t]==='\n')line++;i=k+1;line++}
 return{items,labels}}
function cExec(X,prog,start,io,sub){let pc=start;const saveProg=X.prog;X.prog=prog;try{
 while(pc<prog.items.length){const it=prog.items[pc++];cTick(X);
  let ex=cPct(X,it.text,true);if(X.echo&&!/^\s*@/.test(it.text)){X.out&&io.out(cPrompt(X)+ex.replace(/^\s+/,'')+'\n')}
  let ast;try{ast=cParse(ex)}catch(e){if(e&&e.cs){io.err((e.message||'Синтаксическая ошибка команды.')+'\n');X.last=1;continue}throw e}
  try{cRun(X,ast,io)}catch(e){
   if(e&&e.cx==='goto'){if(e.label==='eof')return X.last;if(e.label in prog.labels){pc=prog.labels[e.label];continue}io.err(`Не удается найти метку перехода - ${e.label}\n`);X.last=1;return 1}
   if(e&&e.cx==='exit'){if(e.b||sub){X.last=e.n;return e.n}throw e}
   if(e&&e.cs){io.err(e.message+'\n');X.last=1;continue}throw e}}
 return X.last}finally{X.prog=saveProg}}
function cCallLabel(X,label,args,io){const prog=X.prog;if(!prog||!(label in prog.labels)){if(label==='eof')return X.last;io.err(`Не удается найти метку перехода - ${label}\n`);X.last=1;return 1}
 if(++X.depth>80){X.depth--;io.err('Слишком глубокая вложенность вызовов call.\n');X.last=1;return 1}const sv=X.pos;X.pos=[':'+label,...args];const st=X.stack.length;
 try{return cExec(X,prog,prog.labels[label],io,true)}finally{X.pos=sv;X.depth--;while(X.stack.length>st){const f=X.stack.pop();X.env=f.env;X.delayed=f.delayed}}}
function cBat(X,path,args,io,asCall){const n=X.fs[path];if(!n||n.d){io.err(C_ERR_NF+'\n');return 1}
 const prog=cProgram(n.c);if(++X.depth>80){X.depth--;io.err('Слишком глубокая вложенность вызовов.\n');return 1}const sv={pos:X.pos,echo:X.echo,inter:X.interactive,st:X.stack.length,fv:X.fv};X.pos=[cWin(path),...args];X.interactive=false;X.fv={};
 try{return cExec(X,prog,0,io,true)}catch(e){if(e&&e.cx==='exit'){X.last=e.n;return e.n}throw e}finally{X.pos=sv.pos;X.echo=sv.echo;X.interactive=sv.inter;X.fv=sv.fv;X.depth--;while(X.stack.length>sv.st){const f=X.stack.pop();X.env=f.env;X.delayed=f.delayed}}}
// выполнить одну командную строку (интерактивно или из call/for)
function cLineExec(X,line,io,fromCall){const inter=X.interactive;const ex=fromCall&&!inter?line:cPct(X,line,false);let ast;try{ast=cParse(fromCall?ex:ex)}catch(e){if(e&&e.cs){io.err(e.message+'\n');return 1}throw e}
 try{return cRun(X,ast,io)}catch(e){if(e&&e.cx==='exit'&&e.chain)return e.n;if(e&&e.cx==='goto'&&X.prog){throw e}throw e}}
// верхний уровень: введённая строка
function cCap(io){let n=0;const o=io.out;return Object.assign({},io,{out:s=>{n+=s.length;if(n>120000)throw{cx:'limit'};o(s)}})}
function cmdLine(X,line,io){io=cCap(io);X.steps=0;X.t0=Date.now();X.cleared=false;X.interactive=true;let c=0;
 try{const ex=cPct(X,line,false);const ast=cParse(ex);c=cRun(X,ast,io)}
 catch(e){if(e&&e.cx==='limit'){io.err('\nПревышен лимит выполнения (возможно, бесконечный цикл) — команда прервана.\n');c=1}else if(e&&e.cs){io.err(e.message+'\n');c=1}else if(e&&e.cx==='exit'){c=e.n;X.exited=!e.b}else if(e&&e.cx==='goto'){io.err('Не удается найти метку перехода - '+e.label+'\n');c=1}else throw e}
 return c}
// запуск файла .bat/.cmd как программы
function cmdFile(X,path,args,io){io=cCap(io);X.steps=0;X.t0=Date.now();X.cleared=false;const f=cFindBat(X,path)||cPath(X,path);let c=0;
 try{c=cBat(X,f,args||[],io,false)}catch(e){if(e&&e.cx==='limit'){io.err('\nПревышен лимит выполнения (возможно, бесконечный цикл) — скрипт прерван.\n');c=1}else if(e&&e.cs){io.err(e.message+'\n');c=1}else if(e&&e.cx==='exit'){c=e.n}else throw e}
 X.last=c;return c}
