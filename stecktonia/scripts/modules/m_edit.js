// ===== m_edit: текстовые редакторы nano и vim/vi в терминале (учебные модели) =====
const NED={on:false,mode:'',X:null,file:'',abs:'',orig:'',cmdBuf:'',vm:'n',cnt:'',reg:'',regLine:false,undo:[],last:'',srch:'',pend:'',msg:'',cut:''};
document.head.insertAdjacentHTML('beforeend',`<style>
#ned{position:fixed;inset:0;background:#000c;z-index:14;display:flex;align-items:center;justify-content:center;padding:8px}#ned[hidden]{display:none}
#nedp{background:#0b1117;color:#d6e2ec;border:1px solid #2a3a48;border-radius:10px;width:min(960px,100%);height:min(640px,100%);display:flex;flex-direction:column;overflow:hidden;font:14px ui-monospace,Consolas,monospace}
#nedt{background:#d6e2ec;color:#0b1117;padding:2px 10px;display:flex;justify-content:space-between}
#nedw{flex:1;display:flex;min-height:0}#nedn{padding:8px 6px;color:#6e8294;text-align:right;overflow:hidden;white-space:pre;user-select:none;border-right:1px solid #2a3a48}
#neda{flex:1;background:transparent;color:inherit;border:0;outline:0;resize:none;padding:8px;font:inherit;white-space:pre;overflow:auto;line-height:1.35}#nedn{line-height:1.35}
#nedm{padding:2px 10px;min-height:22px;color:#ffd866}#nedb{background:#16212b;padding:4px 10px;display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12.5px}#nedb button{background:none;border:0;color:#d6e2ec;font:inherit;cursor:pointer;padding:0}#nedb b{background:#d6e2ec;color:#0b1117;padding:0 3px;margin-right:4px}
#nedc{background:#0b1117;color:#fff;border:0;border-top:1px solid #2a3a48;outline:0;padding:3px 10px;font:inherit;width:100%}
</style>`);
document.body.insertAdjacentHTML('beforeend','<div id="ned" hidden><div id="nedp" role="dialog" aria-label="Редактор"><div id="nedt"><b id="nedh"></b><span id="nedf"></span></div><div id="nedw"><div id="nedn"></div><textarea id="neda" spellcheck="false" wrap="off"></textarea></div><div id="nedm"></div><input id="nedc" hidden><div id="nedb"></div></div></div>');
const edq=i=>document.getElementById(i);
function edMsg(t){NED.msg=t;edq('nedm').textContent=t}
function edNum(){const n=edq('neda').value.split('\n').length;edq('nedn').textContent=Array.from({length:n},(_,i)=>i+1).join('\n');edq('nedn').style.minWidth=(String(n).length+1)+'ch';edq('nedn').scrollTop=edq('neda').scrollTop}
function edLC(){const t=edq('neda'),v=t.value,p=t.selectionStart,u=v.slice(0,p).split('\n');return{l:u.length,c:u[u.length-1].length+1}}
function edDirty(){return edq('neda').value!==NED.orig}
function edStat(){const{l,c}=edLC();edq('nedf').textContent=(NED.mode==='vim'?`${NED.vm==='i'?'-- ВСТАВКА --':NED.vm==='c'?':':'-- КОМАНДЫ --'}  `:'')+`${NED.file}${edDirty()?' [изменён]':''}  ${l},${c}`;edNum()}
function edBar(){const nano=[['^O','Сохранить','o'],['^X','Выход','x'],['^K','Вырезать строку','k'],['^U','Вставить','u'],['^W','Поиск','w'],['^G','Справка','g']];
 edq('nedb').innerHTML=NED.mode==='nano'?nano.map(x=>`<button data-ed="${x[2]}"><b>${x[0]}</b>${x[1]}</button>`).join(''):'<span>Esc — команды · i — вставка · :w сохранить · :q выйти · :wq сохранить и выйти · :q! без сохранения · dd, yy, p, u, /текст, gg, G</span>';
 edq('nedb').querySelectorAll('button').forEach(e=>e.setAttribute('data-nohelp','1'))}
function edSave(){const X=NED.X,v=edq('neda').value,t=v.endsWith('\n')||v===''?v:v+'\n';const e=sxWrite(X.fs,NED.abs,t);if(e){edMsg('Ошибка записи: '+e);return false}NED.orig=edq('neda').value;edMsg(`Записано строк: ${t.split('\n').length-1}`);try{if(typeof sxuTree==='function')sxuTree()}catch(er){}edStat();return true}
function edClose(){NED.on=false;edq('ned').hidden=true;edq('nedc').hidden=true}
function edOpen(mode,X,a,io){const f=a.filter(x=>x[0]!=='-')[0];if(!f){io.err((mode==='nano'?'nano':'vim')+': укажите имя файла\n');return 1}const abs=bAbs(X,f),n=X.fs[abs];if(n&&n.d){io.err(`${mode}: ${f}: это каталог\n`);return 1}
 Object.assign(NED,{on:true,mode,X,file:f,abs,vm:'n',cnt:'',pend:'',undo:[],msg:''});const txt=n?String(n.c||''):'';NED.orig=txt;edq('neda').value=txt;edq('neda').readOnly=mode==='vim';edq('nedh').textContent=mode==='nano'?'GNU nano (учебная модель)':'VIM — Vi IMproved (учебная модель)';edBar();
 edq('ned').hidden=false;edq('nedc').hidden=true;edMsg(n?'':(mode==='nano'?'Новый файл':`"${f}" [новый файл]`));edq('neda').setSelectionRange(0,0);edq('neda').focus();edStat();io.out(`${mode}: редактор открыт (${f}). Закройте его, чтобы вернуться в терминал.\n`);return 0}
// ---- nano ----
function nanoKey(e){const k=e.key.toLowerCase();if(e.ctrlKey&&!e.shiftKey){
  if(k==='o'){e.preventDefault();edSave();return}
  if(k==='x'){e.preventDefault();if(edDirty()){edAsk('Сохранить изменения? (Y — да, N — нет, Esc — отмена)',y=>{if(y){if(edSave())edClose()}else edClose()})}else edClose();return}
  if(k==='k'){e.preventDefault();const t=edq('neda'),v=t.value,p=t.selectionStart,s=v.lastIndexOf('\n',p-1)+1;let en=v.indexOf('\n',p);en=en<0?v.length:en+1;NED.cut=v.slice(s,en);t.value=v.slice(0,s)+v.slice(en);t.setSelectionRange(s,s);edStat();return}
  if(k==='u'){e.preventDefault();const t=edq('neda'),p=t.selectionStart;const s=t.value.lastIndexOf('\n',p-1)+1;t.value=t.value.slice(0,s)+NED.cut+t.value.slice(s);t.setSelectionRange(s+NED.cut.length,s+NED.cut.length);edStat();return}
  if(k==='w'){e.preventDefault();edAsk('Искать: ',null,true);return}
  if(k==='g'){e.preventDefault();edMsg('Справка: ^O записать, ^X выйти, ^K вырезать строку, ^U вставить, ^W поиск');return}}}
let edAsking=null;
function edAsk(prompt,cb,text){edMsg(prompt);edAsking={cb,text};if(text){const c=edq('nedc');c.hidden=false;c.value='';c.focus()}}
// ---- vim ----
function vLines(){return edq('neda').value.split('\n')}
function vSet(v,p){const t=edq('neda');t.value=v;t.setSelectionRange(p,p);edStat()}
function vPush(){NED.undo.push([edq('neda').value,edq('neda').selectionStart]);if(NED.undo.length>100)NED.undo.shift()}
function vLineStart(p){return edq('neda').value.lastIndexOf('\n',p-1)+1}
function vLineEnd(p){const v=edq('neda').value,e=v.indexOf('\n',p);return e<0?v.length:e}
function vMove(p){const t=edq('neda');t.setSelectionRange(p,p);edStat()}
function vNormal(e){const t=edq('neda'),v=t.value;let p=t.selectionStart;const k=e.key;
 if(k==='Escape'){NED.cnt='';NED.pend='';return}
 if(/^[0-9]$/.test(k)&&!(k==='0'&&!NED.cnt)){NED.cnt+=k;return}
 const n=Math.max(1,+NED.cnt||1);NED.cnt='';
 const rep=f=>{for(let i=0;i<n;i++)f()};
 if(NED.pend==='d'){NED.pend='';if(k==='d'){vPush();const L=v.split('\n');const{l}=edLC();const cut=L.slice(l-1,l-1+n);NED.reg=cut.join('\n')+'\n';NED.regLine=true;L.splice(l-1,n);const nv=L.join('\n');vSet(nv,Math.min(nv.length,L.slice(0,l-1).join('\n').length+(l>1?1:0)));edMsg(cut.length>1?`удалено строк: ${cut.length}`:'')}return}
 if(NED.pend==='y'){NED.pend='';if(k==='y'){const L=v.split('\n'),{l}=edLC();NED.reg=L.slice(l-1,l-1+n).join('\n')+'\n';NED.regLine=true;edMsg(`скопировано строк: ${Math.min(n,L.length-l+1)}`)}return}
 if(NED.pend==='g'){NED.pend='';if(k==='g'){if(n>1&&!NED.pend){const L=v.split('\n');vMove(L.slice(0,Math.min(n,L.length)-1).join('\n').length+(n>1?1:0))}else vMove(0)}return}
 switch(k){
  case 'i':NED.vm='i';t.readOnly=false;edStat();return;
  case 'a':NED.vm='i';t.readOnly=false;vMove(Math.min(vLineEnd(p),p+1));return;
  case 'I':NED.vm='i';t.readOnly=false;vMove(vLineStart(p));return;
  case 'A':NED.vm='i';t.readOnly=false;vMove(vLineEnd(p));return;
  case 'o':vPush();NED.vm='i';t.readOnly=false;{const e2=vLineEnd(p);vSet(v.slice(0,e2)+'\n'+v.slice(e2),e2+1)}return;
  case 'O':vPush();NED.vm='i';t.readOnly=false;{const s=vLineStart(p);vSet(v.slice(0,s)+'\n'+v.slice(s),s)}return;
  case 'h':case 'ArrowLeft':rep(()=>{if(p>vLineStart(p))p--});vMove(p);return;
  case 'l':case 'ArrowRight':rep(()=>{if(p<vLineEnd(p)-0&&p+1<=vLineEnd(p)-(vLineEnd(p)>vLineStart(p)?1:0))p++});vMove(p);return;
  case 'j':case 'ArrowDown':rep(()=>{const e2=vLineEnd(p);if(e2<v.length){const c=p-vLineStart(p),s2=e2+1,e3=vLineEnd(s2);p=Math.min(s2+c,e3)}});vMove(p);return;
  case 'k':case 'ArrowUp':rep(()=>{const s=vLineStart(p);if(s>0){const c=p-s,ps=vLineStart(s-1);p=Math.min(ps+c,s-1)}});vMove(p);return;
  case '0':vMove(vLineStart(p));return;case '$':vMove(Math.max(vLineStart(p),vLineEnd(p)-(vLineEnd(p)>vLineStart(p)?1:0)));return;
  case '^':{const s=vLineStart(p);const m=v.slice(s,vLineEnd(p)).match(/^\s*/)[0].length;vMove(s+m);return}
  case 'G':{const L=v.split('\n');const ln=+((e.__cnt)||0);vMove(n>1?L.slice(0,Math.min(n,L.length)-1).join('\n').length+1:v.lastIndexOf('\n')+1);return}
  case 'g':case 'd':case 'y':NED.pend=k;if(n>1)NED.cnt=String(n);return;
  case 'w':rep(()=>{const m=v.slice(p).match(/^\S*\s*/);p+=Math.max(1,m[0].length)});vMove(Math.min(p,v.length));return;
  case 'b':rep(()=>{const m=v.slice(0,p).match(/\S+\s*$/);p=m?p-m[0].length:0});vMove(p);return;
  case 'x':vPush();rep(()=>{const cv=edq('neda').value;if(p<vLineEnd(p)){edq('neda').value=cv.slice(0,p)+cv.slice(p+1)}});vSet(edq('neda').value,p);return;
  case 'p':if(NED.reg){vPush();if(NED.regLine){const e2=vLineEnd(p);const ins=NED.reg;const nv=v.slice(0,e2)+'\n'+ins.replace(/\n$/,'')+v.slice(e2);vSet(nv,e2+1)}else vSet(v.slice(0,p+1)+NED.reg+v.slice(p+1),p+1)}return;
  case 'P':if(NED.reg){vPush();if(NED.regLine){const s=vLineStart(p);const nv=v.slice(0,s)+NED.reg+v.slice(s);vSet(nv,s)}else vSet(v.slice(0,p)+NED.reg+v.slice(p),p)}return;
  case 'u':{const u=NED.undo.pop();if(u)vSet(u[0],Math.min(u[1],u[0].length));else edMsg('Уже самое старое изменение');return}
  case 'n':if(NED.srch){const i=v.indexOf(NED.srch,p+1);const j=i<0?v.indexOf(NED.srch):i;if(j>=0)vMove(j);else edMsg('E486: не найдено: '+NED.srch)}return;
  case ':':case '/':{NED.vm='c';const c=edq('nedc');c.hidden=false;c.value=k;c.focus();edStat();return}
  default:return}}
function vExec(line){const c=line.trim();NED.vm='n';edq('nedc').hidden=true;edq('neda').focus();
 if(c[0]==='/'){const s=c.slice(1);NED.srch=s;const t=edq('neda'),i=t.value.indexOf(s,t.selectionStart+1),j=i<0?t.value.indexOf(s):i;if(s&&j>=0){vMove(j);edMsg('')}else edMsg('E486: не найдено: '+s);return}
 const m=c.match(/^:(\d+)$/);if(m){const L=vLines(),n=Math.min(+m[1],L.length);vMove(L.slice(0,n-1).join('\n').length+(n>1?1:0));return}
 const cmd=c.slice(1);
 if(cmd==='w'||/^w\s/.test(cmd)){edSave();return}
 if(cmd==='wq'||cmd==='x'){if(edSave())edClose();return}
 if(cmd==='q'){if(edDirty())edMsg('E37: Нет записи с момента последнего изменения (добавьте ! для обхода)');else edClose();return}
 if(cmd==='q!'){edClose();return}
 if(cmd==='set nu'||cmd==='set number'){edMsg('Номера строк показаны слева всегда');return}
 edMsg('E492: не команда редактора: '+cmd)}
document.addEventListener('keydown',e=>{if(!NED.on)return;const t=e.target;
 if(t&&t.id==='nedc'){if(e.key==='Enter'){e.preventDefault();e.stopPropagation();const val=t.value;if(edAsking){const a=edAsking;edAsking=null;t.hidden=true;edq('neda').focus();if(a.text){const s=val,tx=edq('neda'),i=tx.value.indexOf(s,tx.selectionStart+1),j=i<0?tx.value.indexOf(s):i;if(s&&j>=0){tx.setSelectionRange(j,j+s.length);edMsg('')}else edMsg('[ «'+s+'» не найдено ]')}return}vExec(val)}else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();t.hidden=true;NED.vm='n';edAsking=null;edq('neda').focus();edStat()}return}
 if(edAsking&&!edAsking.text){const k=e.key.toLowerCase();e.preventDefault();e.stopPropagation();if(k==='escape'||k==='c'&&e.ctrlKey){edAsking=null;edMsg('Отменено');return}if(k==='y'||k==='н'||k==='n'||k==='т'){const a=edAsking;edAsking=null;a.cb(k==='y'||k==='н')}return}
 if(e.key==='Escape'&&NED.mode==='nano'){return}
 if(NED.mode==='nano'){nanoKey(e);if(e.defaultPrevented)e.stopPropagation();return}
 if(NED.mode==='vim'){if(NED.vm==='i'){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();NED.vm='n';edq('neda').readOnly=true;const p=edq('neda').selectionStart;if(p>vLineStart(p))vMove(p-1);NED.last='';return}vPush2(e);return}
  if(e.ctrlKey||e.metaKey||e.altKey)return;if(['Shift','Control','Alt','Meta','Tab','F5','F12'].includes(e.key))return;e.preventDefault();e.stopPropagation();vNormal(e)}},true);
let _vp=0;function vPush2(e){if(e.key.length===1||e.key==='Enter'||e.key==='Backspace'){if(Date.now()-_vp>800){vPush()}_vp=Date.now()}}
document.addEventListener('input',e=>{if(NED.on&&e.target.id==='neda')edStat()});document.addEventListener('keyup',e=>{if(NED.on&&e.target.id==='neda')edStat()});document.addEventListener('click',e=>{if(NED.on&&e.target.id==='neda')edStat();const b=e.target.closest&&e.target.closest('#nedb [data-ed]');if(b){const k=b.dataset.ed;nanoKey({ctrlKey:true,shiftKey:false,key:k,preventDefault(){},defaultPrevented:false})}});
document.addEventListener('scroll',e=>{if(e.target&&e.target.id==='neda')edq('nedn').scrollTop=e.target.scrollTop},true);
['nano','pico','vim','vi','view'].forEach(c=>{if(!ADMC.includes(c))ADMC.push(c)});
// регистрация команд
BB.nano=(X,a,io)=>edOpen('nano',X,a,io);BB.pico=BB.nano;BB.vim=(X,a,io)=>edOpen('vim',X,a,io);BB.vi=BB.vim;BB.view=BB.vim;
MAN.push(['Т43. Редакторы nano и vim',`<p>В терминалах bash (консоль узла и окно «Скрипты») работают учебные модели редакторов: <code>nano файл</code>, <code>vim файл</code>, <code>vi файл</code>. Редактор открывается поверх терминала; файл читается из файловой системы узла и записывается обратно (новый файл создаётся при сохранении).</p>
<h3>nano</h3><p>Обычный текстовый ввод. Внизу — подсказки: Ctrl+O записать, Ctrl+X выйти (при несохранённых изменениях спросит «Y/N»), Ctrl+K вырезать строку, Ctrl+U вставить, Ctrl+W поиск, Ctrl+G справка. Подсказки кликабельны.</p>
<h3>vim / vi</h3><p>Два режима, как в настоящем vim. После открытия вы в режиме <b>команд</b>: перемещение <code>h j k l</code>, <code>0 ^ $</code>, <code>w b</code>, <code>gg</code>, <code>G</code>, число перед командой (например <code>3dd</code>, <code>5j</code>), удаление строки <code>dd</code>, копирование <code>yy</code>, вставка <code>p</code>/<code>P</code>, удаление символа <code>x</code>, отмена <code>u</code>, поиск <code>/текст</code> и <code>n</code>. Клавиши <code>i a I A o O</code> включают режим <b>вставки</b>, <code>Esc</code> возвращает в режим команд. Команды двоеточия: <code>:w</code>, <code>:q</code>, <code>:wq</code>, <code>:x</code>, <code>:q!</code>, <code>:N</code> (перейти к строке N). <code>:q</code> с несохранёнными изменениями выдаёт ошибку E37, как в настоящем vim.</p>
<p>Ограничения: это подмножество, а не полноценные редакторы: нет визуального режима, макросов, регистров, подстановки <code>:s</code>, нескольких окон, подсветки синтаксиса. Браузер резервирует часть сочетаний (например Ctrl+W), поэтому для nano используйте кликабельные подсказки.</p>`]);
