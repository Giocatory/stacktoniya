// ===== v29d: задания «Найди ошибку» (скрипт с одной внесённой ошибкой) =====
function dbgCands(src,sh,r){const M=[
 [/-gt\b/,'-lt'],[/-ge\b/,'-gt'],[/-le\b/,'-lt'],[/-eq\b/,'-ne'],[/\bGTR\b/,'LSS'],[/\bGEQ\b/,'GTR'],[/\bLSS\b/,'GTR'],[/<=/,'<'],[/\+=/,'-='],[/\+1\)/,'+2)'],[/\bn\+=1/,'n+=2'],
 [/% ?(\d)/,(m,d)=>m.replace(d,String(+d+1))],[/seq 1 /,'seq 0 '],[/\(1,1,/,'(0,1,'],[/i=1;/,'i=0;'],[/\$i = 1;/,'$i = 0;'],[/\$i = 2;/,'$i = 3;'],[/\bn=2;/,'n=3;'],[/\bd=2;/,'d=3;'],
 [/\becho\b/,'ecoh'],[/\bsort\b/,'sorrt'],[/\bgrep\b/,'gerp'],[/Get-Content/,'Get-Contnt'],[/ForEach-Object/,'ForEach-Objct'],[/Sort-Object/,'Sort-Objet'],
 [/(Сумма|Максимум|Чётных|Найдено|Итого|Простых|Скопировано): /,(m,w)=>w.slice(0,-1)+': '],[/\n(done|fi)\n/,'\n'],[/"\$@"/,'$1'],[/\$args\[0\]/,'$args[1]'],[/%~1/,'%~2'],[/\$1/,'$2'],[/\bshift\b/,'rem shift']
];const out=[];M.forEach(([re,rep])=>{const m=re.exec(src);if(!m)return;const res=src.slice(0,m.index)+m[0].replace(re,rep)+src.slice(m.index+m[0].length);if(res!==src)out.push(res)});
 for(let i=out.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
{const _m=rndMk;rndMk=function(rec){const t=_m(rec);if(!rec.dbg||rec.sh==='git'||!t.o)return t;const o=t.o,fname=t.file.slice(t.file.lastIndexOf('/')+1),pth=rec.sh==='bash'?fname:sxWin(t.file);
 t.dbg=1;t.t=t.t.replace('Случайное:','Отладка:');
 t.d=`В файле ${pth} лежит скрипт с одной ошибкой: он работает неверно или падает. Найдите ошибку и исправьте её, не переписывая скрипт целиком. Задача скрипта: ${o.d} Вариант №${rec.seed}.`;
 t.hint='Запустите скрипт на примере из условия, сравните вывод с ожидаемым; при падении смотрите номер строки в сообщении (в редакторе она подсвечивается).';
 const _p=t.prep;t.prep=d=>{_p(d);const r=exRng(rec.seed*31+7),c=dbgCands(t.sol,rec.sh,r);let pick=null;
  for(const s of c){sxPutF(d,t.file,s);let R;try{R=t.chk(d)}catch(e){R=[['x',false]]}if(R.some(x=>!x[1])){pick=s;break}}
  if(!pick){pick=t.sol.replace(/\n$/,'')+'\nexit 1\n'}sxPutF(d,t.file,pick);
  const t0=(o.tests&&o.tests[0])||{a:[],exp:o.run?o.run.exp:[]};const run=sxRunFresh(d,t.file,t0.a||[],'');const got=((run.o||'')+(run.e?'\n'+run.e:'')).replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean).slice(0,3).join(' / ')||'(пусто)';
  return`Создан файл ${pth} с ошибкой. Запуск «${(t0.a||[]).join(' ')||'без аргументов'}» сейчас даёт: ${got}. Ожидается: ${t0.exp.slice(0,3).join(' / ')}${t0.exp.length>3?' …':''}.`};return t}}
