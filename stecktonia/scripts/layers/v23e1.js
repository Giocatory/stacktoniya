// ===== v23e1: PowerShell — разбор =====
function psParse(src){let p=0;const n=src.length;src=String(src).replace(/\r\n?/g,'\n');const N=src.length;
 let noC=false;const withC=(v,fn)=>{const sv=noC;noC=v;try{return fn()}finally{noC=sv}};
 const syn=m=>{let l=1,c=1,pp=p;if(pp>=src.length){pp=src.length;while(pp>0&&/\s/.test(src[pp-1]))pp--}for(let k=0;k<pp&&k<src.length;k++){if(src[k]==='\n'){l++;c=1}else c++}throw{ps:'parse',message:m,pos:p,line:l,col:c}};
 const lineAt=q=>{let l=1;for(let k=0;k<q&&k<src.length;k++)if(src[k]==='\n')l++;return l};
 const ws=()=>{for(;;){const c=src[p];if(c===' '||c==='\t'){p++;continue}if(c==='`'&&src[p+1]==='\n'){p+=2;continue}if(c==='#'){while(p<N&&src[p]!=='\n')p++;continue}if(c==='<'&&src[p+1]==='#'){const j=src.indexOf('#>',p+2);p=j<0?N:j+2;continue}break}};
 const wsnl=()=>{for(;;){ws();if(p<N&&(src[p]==='\n'||src[p]===';')){p++;continue}break}};
 const wsl=()=>{for(;;){ws();if(src[p]==='\n'){p++;continue}break}};
 const peekRe=re=>{const m=re.exec(src.slice(p,p+80));return m};
 const kw=w=>{const m=new RegExp('^'+w+'(?![\\w-])','i').exec(src.slice(p,p+w.length+2));if(m){p+=w.length;return true}return false};
 const OPRE=/^-(?:[ci]?(?:eq|ne|gt|ge|lt|le|like|notlike|match|notmatch|contains|notcontains|in|notin|replace|split)|is|isnot|as|and|or|xor|band|bor|bxor|shl|shr|join|f)(?![\w-])/i;
 const isOp=()=>OPRE.test(src.slice(p,p+14));
 // ---- программа ----
 function program(){const body=[];let params=null;wsnl();if(/^param\s*\(/i.test(src.slice(p,p+10))){kw('param');params=paramList()}
  for(;;){wsnl();if(p>=N)break;body.push(stmt())}return{t:'prog',body,params}}
 function block(){ws();if(src[p]!=='{')syn('Ожидалась открывающая фигурная скобка { .');p++;const body=[];let params=null;wsnl();if(/^param\s*\(/i.test(src.slice(p,p+10))){kw('param');params=paramList()}
  for(;;){wsnl();if(p>=N)syn('Отсутствует закрывающая фигурная скобка } в блоке операторов.');if(src[p]==='}'){p++;break}body.push(stmt())}return{t:'block',body,params}}
 function paramList(){ws();if(src[p]!=='(')syn('Ожидалась скобка (');p++;const ps=[];for(;;){wsl();if(src[p]===')'){p++;break}
   let type=null;while(src[p]==='['){const j=balanced('[',']');const t=src.slice(p+1,j-1);p=j;if(!/^(Parameter|CmdletBinding|Alias|Validate|Allow|ValidateSet)/i.test(t))type=t;wsl()}
   if(src[p]!=='$')syn('Ожидалось имя параметра.');p++;const m=/^\w+/.exec(src.slice(p));p+=m[0].length;wsl();let def=null;if(src[p]==='='){p++;wsl();def=withC(true,expr)}ps.push({name:m[0],type,def});wsl();if(src[p]===','){p++;continue}wsl();if(src[p]===')'){p++;break}syn('Ожидалась запятая или закрывающая скобка в списке параметров.')}return ps}
 function balanced(o,c){let d=0,q=null;for(let j=p;j<N;j++){const ch=src[j];if(q){if(ch===q)q=null;continue}if(ch==='"'||ch==="'"){q=ch;continue}if(ch===o)d++;else if(ch===c){d--;if(d===0)return j+1}}syn('Не найдена закрывающая скобка '+c)}
 // ---- операторы ----
 function stmt(){ws();const s0=p,n0=stmt1();if(n0&&typeof n0==='object'&&n0.ln===undefined)n0.ln=lineAt(s0);return n0}
 function stmt1(){ws();const s=p;
  if(kw('if')){return ifs()}if(kw('while')){ws();const c=paren();const b=block();return{t:'while',c,b}}
  if(kw('do')){const b=block();wsl();let until=false;if(kw('while')){}else if(kw('until'))until=true;else syn('Ожидалось while или until.');ws();const c=paren();return{t:'do',b,c,until}}
  if(kw('for')){ws();if(src[p]!=='(')syn('Ожидалась (');p++;wsl();const i=src[p]===';'?null:stmt();wsnl();const c=src[p]===';'?null:pipelineStmt();wsnl();let u=null;wsl();if(src[p]!==')')u=stmt();wsl();if(src[p]!==')')syn('Ожидалась )');p++;const b=block();return{t:'for',i,c,u,b}}
  if(kw('foreach')){ws();if(src[p]==='-'){p=s;return pipelineStmt()}if(src[p]!=='(')syn('Ожидалась (');p++;wsl();if(src[p]!=='$')syn('Ожидалась переменная цикла.');p++;const m=/^\w+/.exec(src.slice(p));p+=m[0].length;wsl();if(!kw('in'))syn('Ожидалось in.');wsl();const e=stmt();wsl();if(src[p]!==')')syn('Ожидалась )');p++;const b=block();return{t:'foreach',v:m[0],e,b}}
  if(kw('switch')){return sw()}
  if(kw('function')||kw('filter')){ws();const m=/^[\w:.-]+/.exec(src.slice(p));if(!m)syn('Ожидалось имя функции.');p+=m[0].length;ws();let params=null;if(src[p]==='('){params=paramList()}const b=block();if(!params&&b.params)params=b.params;return{t:'func',name:m[0],params:params||[],b}}
  if(kw('try')){const b=block();const catches=[];let fin=null;for(;;){wsl();if(kw('catch')){ws();const types=[];while(src[p]==='['){const j=balanced('[',']');types.push(src.slice(p+1,j-1));p=j;ws();if(src[p]===','){p++;ws()}}catches.push({types,b:block()})}else if(kw('finally')){fin=block()}else break}if(!catches.length&&!fin)syn('В операторе try отсутствует блок catch или finally.');return{t:'try',b,catches,fin}}
  if(kw('return')){ws();let e=null;if(p<N&&!/[\n;}]/.test(src[p]))e=pipelineStmt();return{t:'return',e}}
  if(kw('throw')){ws();let e=null;if(p<N&&!/[\n;}]/.test(src[p]))e=pipelineStmt();return{t:'throw',e}}
  if(kw('break')){return{t:'break'}}if(kw('continue')){return{t:'continue'}}
  if(kw('exit')){ws();let e=null;if(p<N&&!/[\n;}]/.test(src[p]))e=pipelineStmt();return{t:'exit',e}}
  if(kw('class')||kw('enum')||kw('workflow'))syn('Классы и перечисления в этом симуляторе не поддерживаются.');
  if(/^using\s/i.test(src.slice(p,p+6))){while(p<N&&src[p]!=='\n')p++;return{t:'nop'}}
  if(/^(begin|process|end)\s*\{/i.test(src.slice(p,p+10))){const m=/^\w+/.exec(src.slice(p))[0];p+=m.length;return{t:'phase',name:m.toLowerCase(),b:block()}}
  return pipelineStmt()}
 function paren(){ws();if(src[p]!=='(')syn('Ожидалась ( .');p++;wsl();const e=stmt();wsl();if(src[p]!==')')syn('Ожидалась ) .');p++;return e}
 function ifs(){ws();const c=paren();const b=block();let e=null;wsl();const sv=p;if(kw('elseif')){e={t:'blk',body:[ifs()]}}else if(kw('else')){e=block()}else p=sv;return{t:'if',c,b,e}}
 function sw(){ws();const fl={};while(src[p]==='-'){const m=/^-(\w+)/.exec(src.slice(p));p+=m[0].length;fl[m[1].toLowerCase()]=1;ws()}const c=paren();wsl();if(src[p]!=='{')syn('Ожидалась {');p++;const cl=[];for(;;){wsnl();if(src[p]==='}'){p++;break}if(p>=N)syn('Отсутствует }');let pat;if(kw('default'))pat={t:'default'};else if(src[p]==='{'){pat={t:'sb',b:block()}}else pat=unary();cl.push({pat,b:block()})}return{t:'switch',fl,c,cl}}
 // конвейер / присваивание
 function pipelineStmt(){ws();const first=pipeline();ws();
  const m=/^(\+=|-=|\*=|\/=|%=|=)(?!=)/.exec(src.slice(p,p+2));
  if(m&&first.t==='pipe'&&first.els.length===1&&first.els[0].t==='expr'&&isLval(first.els[0].e)){p+=m[0].length;wsl();const rhs=stmt();return{t:'assign',op:m[1],l:first.els[0].e,r:rhs}}
  return first}
 const isLval=e=>e.t==='var'||e.t==='idx'||e.t==='mem'||e.t==='cast'&&isLval(e.e);
 function pipeline(){const els=[elem()];for(;;){ws();if(src[p]==='|'&&src[p+1]!=='|'){p++;wsl();els.push(elem())}else if(src[p]==='&'&&src[p+1]==='&'){p+=2;wsl();const r=pipeline();return{t:'chain',op:'&&',a:{t:'pipe',els},b:r}}else if(src[p]==='|'&&src[p+1]==='|'){p+=2;wsl();const r=pipeline();return{t:'chain',op:'||',a:{t:'pipe',els},b:r}}else break}return{t:'pipe',els}}
 function elem(){ws();const c=src[p];
  if(c==='&'||(c==='.'&&/\s/.test(src[p+1]||''))){const dot=c==='.';p++;ws();const target=primaryPostfix();return command({t:'expr',e:target},dot)}
  if(c==='$'||c==='('||c==='@'||c==='"'||c==="'"||c==='{'||(c==='['&&/^\[[\w.,\[\]` ]+\]\s*(::|[$"'(@\w-])/.test(src.slice(p,p+120)))||/[0-9]/.test(c)||(c==='.'&&/\d/.test(src[p+1]||''))||c==='!'||(c==='-'&&(/^-(not|bnot|split|join)(?![\w])/i.test(src.slice(p,p+6))||/^-[\d$(.]/.test(src.slice(p,p+2))))||c==='+'){return{t:'expr',e:expr()}}
  return command(null,false)}
 // ---- команда ----
 function command(callee,dot){let name=null;if(!callee){const m=/^[^\s|;(){}`"'$,]+(?:`.[^\s|;(){}`"'$,]*)*/.exec(src.slice(p));if(!m)syn('Неожиданный символ: '+(src[p]||'конец'));name=m[0];p+=name.length}
  const args=[],redirs=[];
  for(;;){ws();const c=src[p];if(p>=N||c==='\n'||c===';'||c==='|'||c==='}'||c===')')break;if(c==='&'&&src[p+1]==='&')break;if(c==='&'&&src[p+1]!=='&'){syn('Оператор амперсанд (&) зарезервирован для будущего использования; заключите его в двойные кавычки.')}
   const rm=/^(\*|\d)?>>?(&\d)?/.exec(src.slice(p,p+5));
   if(rm&&(c==='>'||/^(\*|\d)>/.test(src.slice(p,p+2)))){p+=rm[0].length;if(rm[2]){redirs.push({fd:rm[1]||'1',dup:rm[2].slice(1),app:false});continue}ws();const tg=argItem();redirs.push({fd:rm[1]||'1',t:tg,app:/>>/.test(rm[0])});continue}
   if(c==='-'&&/^-[A-Za-z]/.test(src.slice(p,p+2))){const m=/^-([\w-]+)(:)?/.exec(src.slice(p));p+=m[0].length;if(m[2]){ws();args.push({pn:m[1],v:argItem()})}else{args.push({pn:m[1],raw:m[0]})}continue}
   if(c==='-'&&src[p+1]==='-'&&/^\s$/.test(src[p+2]||' ')){p+=2;args.push({v:{t:'str',v:'--'}});continue}
   args.push({v:argList()})}
  return{t:'cmd',name,callee,dot,args,redirs}}
 function argList(){const first=argItem();ws();if(src[p]!==',')return first;const items=[first];while(src[p]===','){p++;wsl();items.push(argItem());ws()}return{t:'arr',items}}
 function argItem(){const c=src[p];
  if(c==='$'||c==='('||c==='@'||c==='{'||c==='"'||c==="'"){const st=p;let e=primaryPostfix(true);
    // $x\file — склеенная строка
    if(src[p]&&!/[\s|;)}]/.test(src[p])&&src[p]!==','&&c==='$'){const rest=/^[^\s|;)}]*/.exec(src.slice(p))[0];if(rest){p+=rest.length;return strInterp(src.slice(st,p),true)}}
    return e}
  if(c==='['&&/^\[[\w.,\[\]` ]+\]/.test(src.slice(p,p+80))){return primaryPostfix(true)}
  const m=/^[^\s|;(){}`,]+(?:`.[^\s|;(){}`,]*)*/.exec(src.slice(p));if(!m)syn('Неожиданный символ в аргументе: '+(src[p]||''));p+=m[0].length;let w=m[0];
  if(/^-?\d+(\.\d+)?$/.test(w))return{t:'num',v:parseFloat(w)};if(/^0x[0-9a-f]+$/i.test(w))return{t:'num',v:parseInt(w,16)};
  if(/\$/.test(w)&&!/^['"]/.test(w))return strInterp(w,true);return{t:'str',v:w.replace(/`(.)/g,'$1')}}
 // ---- выражения ----
 function expr(){return logical()}
 function logical(){let a=bitwise();for(;;){ws();const m=/^-(and|or|xor)(?![\w-])/i.exec(src.slice(p,p+6));if(!m)return a;p+=m[0].length;wsl();a={t:'bin',op:m[1].toLowerCase(),a,b:bitwise()}}}
 function bitwise(){let a=compare();for(;;){ws();const m=/^-(band|bor|bxor|shl|shr)(?![\w-])/i.exec(src.slice(p,p+7));if(!m)return a;p+=m[0].length;wsl();a={t:'bin',op:m[1].toLowerCase(),a,b:compare()}}}
 function compare(){let a=additive();for(;;){ws();const m=/^-([ci]?(?:eq|ne|gt|ge|lt|le|like|notlike|match|notmatch|contains|notcontains|in|notin|replace|split)|isnot|is|as|join)(?![\w-])/i.exec(src.slice(p,p+14));if(!m)return a;p+=m[0].length;wsl();a={t:'bin',op:m[1].toLowerCase(),a,b:additive()}}}
 function additive(){let a=mult();for(;;){ws();const c=src[p];if((c==='+'||c==='-')&&src[p+1]!=='='&&!(c==='-'&&(OPRE.test(src.slice(p,p+14))))&&!(c==='+'&&src[p+1]==='+')&&!(c==='-'&&src[p+1]==='-')){p++;wsl();a={t:'bin',op:c,a,b:mult()}}else return a}}
 function mult(){let a=fmt();for(;;){ws();const c=src[p];if((c==='*'||c==='/'||c==='%')&&src[p+1]!=='='){p++;wsl();a={t:'bin',op:c,a,b:fmt()}}else return a}}
 function fmt(){let a=range();for(;;){ws();if(/^-f(?![\w-])/i.test(src.slice(p,p+3))){p+=2;wsl();a={t:'bin',op:'f',a,b:range()}}else return a}}
 function range(){let a=comma();ws();if(src[p]==='.'&&src[p+1]==='.'){p+=2;wsl();return{t:'range',a,b:comma()}}return a}
 function comma(){const a=unary();ws();if(!noC&&src[p]===','){const items=[a];while(src[p]===','){p++;wsl();items.push(unary());ws()}return{t:'arr',items}}return a}
 function unary(){ws();const c=src[p];
  if(c==='!'){p++;return{t:'not',e:unary()}}
  if(/^-(not|bnot)(?![\w-])/i.test(src.slice(p,p+6))){const b=/^-bnot/i.test(src.slice(p,p+6));p+=b?5:4;return{t:b?'bnot':'not',e:unary()}}
  if(/^-(split|join)(?![\w-])/i.test(src.slice(p,p+7))){const op=/^-split/i.test(src.slice(p,p+7))?'usplit':'ujoin';p+=6;wsl();return{t:op,e:unary()}}
  if(c==='-'&&src[p+1]!=='-'&&!/^-(\d|\.\d)/.test(src.slice(p,p+3))){p++;return{t:'neg',e:unary()}}
  if(c==='+'&&src[p+1]!=='+'){p++;return{t:'pos',e:unary()}}
  if((c==='+'&&src[p+1]==='+')||(c==='-'&&src[p+1]==='-')){p+=2;const e=unary();return{t:'incr',pre:true,d:c==='+'?1:-1,e}}
  if(c==='['){const m=/^\[([^\]\n]*(?:\[[^\]]*\][^\]\n]*)*)\](?=\s*(?:::|[$"'(@\w+-]|\[))/.exec(src.slice(p,p+200));if(m&&!(/^\s*::/.test(src.slice(p+m[0].length)))&&!/^\[\d/.test(src.slice(p))){p+=m[0].length;ws();return{t:'cast',type:m[1],e:unary()}}}
  return primaryPostfix(false)}
 function primaryPostfix(argMode){let e=primary();for(;;){const c=src[p];
   if(c==='.'&&src[p+1]!=='.'){p++;let name;if(src[p]==='$'){const m=/^\$(\w+)/.exec(src.slice(p));p+=m[0].length;name={t:'var',n:m[1]}}else if(src[p]==='"'||src[p]==="'"){name=primary()}else{const m=/^[\w]+/.exec(src.slice(p));if(!m)syn('Ожидалось имя члена после точки.');p+=m[0].length;name={t:'str',v:m[0]}}
     if(src[p]==='('){p++;const a=callArgs();e={t:'call',o:e,n:name,a}}else e={t:'mem',o:e,n:name};continue}
   if(c===':'&&src[p+1]===':'){p+=2;const m=/^\w+/.exec(src.slice(p));if(!m)syn('Ожидалось имя члена после ::');p+=m[0].length;if(src[p]==='('){p++;const a=callArgs();e={t:'scall',o:e,n:m[0],a}}else e={t:'smem',o:e,n:m[0]};continue}
   if(c==='['&&!(argMode&&false)){p++;wsl();const i=expr();wsl();if(src[p]!==']')syn('Ожидалась ]');p++;e={t:'idx',o:e,i};continue}
   if(c==='+'&&src[p+1]==='+'){p+=2;e={t:'incr',pre:false,d:1,e};continue}if(c==='-'&&src[p+1]==='-'){p+=2;e={t:'incr',pre:false,d:-1,e};continue}
   break}return e}
 function callArgs(){const a=[];wsl();if(src[p]===')'){p++;return a}for(;;){wsl();a.push(withC(true,expr));wsl();if(src[p]===','){p++;continue}if(src[p]===')'){p++;break}syn('Ожидалась ) в вызове метода.')}return a}
 function primary(){ws();const c=src[p];if(p>=N)syn('Неожиданный конец выражения.');
  if(c==='$'){
   if(src[p+1]==='('){p+=2;const body=[];withC(false,()=>{for(;;){wsnl();if(src[p]===')'){p++;break}if(p>=N)syn('Отсутствует закрывающая скобка )');body.push(stmt())}});return{t:'sub',body}}
   if(src[p+1]==='{'){const j=src.indexOf('}',p);const nm=src.slice(p+2,j);p=j+1;return{t:'var',n:nm}}
   const m=/^\$(?:(global|script|local|private|env):)?(\w+|\?|\$|\^)/i.exec(src.slice(p));if(!m)syn('Неожиданный символ $');p+=m[0].length;return{t:'var',n:m[2],sc:m[1]?m[1].toLowerCase():null}}
  if(c==='@'){if(src[p+1]==='('){p+=2;const body=[];withC(false,()=>{for(;;){wsnl();if(src[p]===')'){p++;break}if(p>=N)syn('Отсутствует )');body.push(stmt())}});return{t:'asub',body}}
   if(src[p+1]==='{'){p+=2;const pairs=[];for(;;){wsnl();if(src[p]==='}'){p++;break}if(p>=N)syn('Отсутствует } в литерале хеш-таблицы.');let k;if(src[p]==='"'||src[p]==="'")k=primary();else if(src[p]==='$')k=primary();else{const m=/^[\w.-]+/.exec(src.slice(p));if(!m)syn('Ожидался ключ хеш-таблицы.');p+=m[0].length;k={t:'str',v:m[0]}}ws();if(src[p]!=='=')syn('Ожидалось = в литерале хеш-таблицы.');p++;wsl();pairs.push([k,stmt()])}return{t:'hash',pairs}}
   const hm=/^@(["'])\n/.exec(src.slice(p,p+3));if(hm){const q=hm[1];const start=p+3;const end=src.indexOf('\n'+q+'@',start-1);if(end<0)syn('Незавершённая here-строка.');const text=src.slice(start,end<start?start:end);p=end+3;return q==="'"?{t:'str',v:text}:strInterp(text,false,true)}
   syn('Неожиданный символ @')}
  if(c==='('){p++;wsl();const e=withC(false,stmt);wsl();if(src[p]!==')')syn('Отсутствует закрывающая скобка ) в выражении.');p++;return{t:'paren',e}}
  if(c==='{'){const b=withC(false,block);return{t:'sb',b}}
  if(c==="'"){let o='';p++;for(;;){if(p>=N)syn('Строка не имеет завершающего символа '+"'");if(src[p]==="'"){if(src[p+1]==="'"){o+="'";p+=2;continue}p++;break}o+=src[p++]}return{t:'str',v:o}}
  if(c==='"'){let j=p+1;let raw='';for(;;){if(j>=N)syn('Строка не имеет завершающего символа "');const ch=src[j];if(ch==='`'){raw+=ch+(src[j+1]||'');j+=2;continue}if(ch==='"'){if(src[j+1]==='"'){raw+='""';j+=2;continue}break}if(ch==='$'&&src[j+1]==='('){let d=0,k=j+1,q=null;for(;k<N;k++){const x=src[k];if(q){if(x===q)q=null;continue}if(x==='"'||x==="'"){q=x;continue}if(x==='(')d++;else if(x===')'){d--;if(d===0)break}}raw+=src.slice(j,k+1);j=k+1;continue}raw+=ch;j++}p=j+1;return strInterp(raw,false)}
  if(c==='['){const m=/^\[([^\]\n]*(?:\[[^\]]*\][^\]\n]*)*)\]/.exec(src.slice(p,p+200));if(m){p+=m[0].length;return{t:'type',n:m[1]}}syn('Неожиданный символ [')}
  const nm=/^(?:0x[0-9a-fA-F]+|(?:\d+(?:\.(?!\.)\d*)?|\.\d+)(?:[eE][+-]?\d+)?)(kb|mb|gb|tb)?/i.exec(src.slice(p,p+40));
  if(nm&&(/\d|\./.test(c))){p+=nm[0].length;let v=/^0x/i.test(nm[0])?parseInt(nm[0].replace(/(kb|mb|gb|tb)$/i,''),16):parseFloat(nm[0]);const sf=(nm[1]||'').toLowerCase();if(sf)v*={kb:1024,mb:1048576,gb:1073741824,tb:1099511627776}[sf];return{t:'num',v}}
  if(c==='-'&&/^-\d|^-\./.test(src.slice(p,p+3))){p++;const e=primary();if(e.t==='num')return{t:'num',v:-e.v};return{t:'neg',e}}
  const w=/^[A-Za-z_][\w.:-]*/.exec(src.slice(p));if(w){p+=w[0].length;return{t:'str',v:w[0],bare:true}}
  syn('Неожиданный символ: '+c)}
 // интерполяция строк
 function strInterp(raw,cmdArg,here){const parts=[];let cur='';for(let i=0;i<raw.length;i++){const c=raw[i];
   if(c==='"'&&cmdArg&&i===0){continue}if(c==='"'&&cmdArg&&i===raw.length-1)continue;
   if(c==='`'){const x=raw[++i];cur+=({n:'\n',t:'\t',r:'\r','0':'\0',a:'\x07',b:'\b',e:'\x1b'})[x]!==undefined?({n:'\n',t:'\t',r:'\r','0':'\0',a:'\x07',b:'\b',e:'\x1b'})[x]:(x===undefined?'':x);continue}
   if(c==='"'&&raw[i+1]==='"'&&!here){cur+='"';i++;continue}
   if(c==='$'){const rest=raw.slice(i+1);
    if(rest[0]==='('){let d=0,k=i+1,q=null;for(;k<raw.length;k++){const x=raw[k];if(q){if(x===q)q=null;continue}if(x==='"'||x==="'"){q=x;continue}if(x==='(')d++;else if(x===')'){d--;if(d===0)break}}const inner=raw.slice(i+2,k);if(cur){parts.push(cur);cur=''}parts.push({t:'sub',body:psParse(inner).body});i=k;continue}
    if(rest[0]==='{'){const j=rest.indexOf('}');if(j>0){if(cur){parts.push(cur);cur=''}parts.push({t:'var',n:rest.slice(1,j)});i+=j+1;continue}}
    const m=/^(?:(global|script|local|private|env):)?(\w+|\?|\$|\^)/i.exec(rest);if(m){if(cur){parts.push(cur);cur=''}parts.push({t:'var',n:m[2],sc:m[1]?m[1].toLowerCase():null});i+=m[0].length;continue}}
   cur+=c}
  if(cur)parts.push(cur);if(!parts.length)return{t:'str',v:''};if(parts.length===1&&typeof parts[0]==='string')return{t:'str',v:parts[0]};return{t:'istr',parts}}
 return program()}
