// ===== v29: генератор случайных заданий по скриптам (bash / cmd / PowerShell) =====
const rndGet=()=>{try{return JSON.parse(localStorage.getItem('netlab_sxr')||'[]')}catch(e){return[]}};
const rndPut=a=>{try{localStorage.setItem('netlab_sxr',JSON.stringify(a.slice(-30)))}catch(e){}};
const RNW=['сеть','порт','хост','шлюз','маска','роутер','кабель','канал','пакет','адрес'];
const RNN=['Аня','Борис','Вера','Глеб','Дина','Егор','Жанна','Игорь','Лена','Макс','Нина','Олег'];
const rI=(r,a,b)=>a+Math.floor(r()*(b-a+1));
const rNums=(r,n)=>Array.from({length:n},()=>rI(r,1,99));
const RGEN=[
{id:'sum',t:'Сумма чисел',lvl:1,mk(r,sh){const A=n=>rNums(r,n),t=[A(rI(r,3,5)),A(rI(r,3,6)),A(rI(r,4,7))];const arg=sh==='bash'?'$1, $2, …  (все — "$@")':sh==='cmd'?'%1, %2, … (shift)':'$args';
 return{d:`Скрипт получает числа в аргументах (${arg}) и выводит одну строку «Сумма: S» — сумму всех чисел.`,hint:sh==='bash'?'for x in "$@"; do s=$((s+x)); done':sh==='cmd'?'метка, shift и set /a s+=%~1':'foreach ($x in $args) { $s += [int]$x }',
 tests:t.map((a,i)=>({a:a.map(String),h:i===2,exp:['Сумма: '+a.reduce((x,y)=>x+y,0)]})),files:[],
 sol:{bash:'s=0\nfor x in "$@"; do s=$((s+x)); done\necho "Сумма: $s"\n',cmd:'@echo off\nset s=0\n:l\nif "%~1"=="" goto e\nset /a s+=%~1\nshift\ngoto l\n:e\necho Сумма: %s%\n',ps:'$s = 0\nforeach ($x in $args) { $s += [int]$x }\n"Сумма: $s"\n'}[sh]}}},
{id:'max',t:'Максимальное число',lvl:1,mk(r,sh){const t=[rNums(r,rI(r,3,6)),rNums(r,rI(r,3,6)),rNums(r,rI(r,4,8))];
 return{d:'Скрипт получает числа в аргументах и выводит «Максимум: M» — наибольшее из них.',hint:'Заведите переменную с первым числом и сравнивайте с каждым следующим.',
 tests:t.map((a,i)=>({a:a.map(String),h:i===2,exp:['Максимум: '+Math.max(...a)]})),files:[],
 sol:{bash:'m=$1\nfor x in "$@"; do\n  if [ "$x" -gt "$m" ]; then m=$x; fi\ndone\necho "Максимум: $m"\n',cmd:'@echo off\nset m=%~1\n:l\nif "%~1"=="" goto e\nif %~1 GTR %m% set m=%~1\nshift\ngoto l\n:e\necho Максимум: %m%\n',ps:'$m = [int]$args[0]\nforeach ($x in $args) { if ([int]$x -gt $m) { $m = [int]$x } }\n"Максимум: $m"\n'}[sh]}}},
{id:'even',t:'Количество чётных',lvl:1,mk(r,sh){const t=[rNums(r,rI(r,4,7)),rNums(r,rI(r,4,7)),rNums(r,rI(r,5,9))];
 return{d:'Скрипт получает числа в аргументах и выводит «Чётных: K» — сколько среди них чётных.',hint:'Остаток от деления на 2: % в bash/PowerShell и в set /a (в .bat пишется %%).',
 tests:t.map((a,i)=>({a:a.map(String),h:i===2,exp:['Чётных: '+a.filter(x=>x%2===0).length]})),files:[],
 sol:{bash:'c=0\nfor x in "$@"; do\n  if (( x % 2 == 0 )); then c=$((c+1)); fi\ndone\necho "Чётных: $c"\n',cmd:'@echo off\nset c=0\n:l\nif "%~1"=="" goto e\nset /a m=%~1 %% 2\nif %m%==0 set /a c+=1\nshift\ngoto l\n:e\necho Чётных: %c%\n',ps:'$c = 0\nforeach ($x in $args) { if ([int]$x % 2 -eq 0) { $c++ } }\n"Чётных: $c"\n'}[sh]}}},
{id:'fizz',t:'Fizz-Buzz со случайными делителями',lvl:2,mk(r,sh){const A=rI(r,2,4),B=rI(r,5,7),ns=[rI(r,10,15),rI(r,12,20),rI(r,16,30)];
 const f=n=>{const o=[];for(let i=1;i<=n;i++){let s='';if(i%A===0)s+='Fizz';if(i%B===0)s+='Buzz';o.push(s||String(i))}return o};
 return{d:`Скрипт получает число N и выводит числа от 1 до N по одному в строке; кратные ${A} заменяются на Fizz, кратные ${B} — на Buzz, кратные обоим — на FizzBuzz.`,hint:'Соберите строку: если кратно A — «Fizz», если кратно B — добавить «Buzz»; если пусто — само число.',
 tests:ns.map((n,i)=>({a:[String(n)],h:i===2,exp:f(n)})),files:[],
 sol:{bash:`for ((i=1; i<=$1; i++)); do\n  o=""\n  if (( i % ${A} == 0 )); then o="Fizz"; fi\n  if (( i % ${B} == 0 )); then o="\${o}Buzz"; fi\n  if [ -z "$o" ]; then o=$i; fi\n  echo "$o"\ndone\n`,
  cmd:`@echo off\nsetlocal enabledelayedexpansion\nfor /l %%i in (1,1,%1) do (\n  set o=\n  set /a x=%%i %% ${A}\n  set /a y=%%i %% ${B}\n  if !x!==0 set o=Fizz\n  if !y!==0 set o=!o!Buzz\n  if "!o!"=="" set o=%%i\n  echo !o!\n)\n`,
  ps:`$n = [int]$args[0]\nfor ($i = 1; $i -le $n; $i++) {\n  $o = ''\n  if ($i % ${A} -eq 0) { $o = 'Fizz' }\n  if ($i % ${B} -eq 0) { $o += 'Buzz' }\n  if ($o -eq '') { $o = $i }\n  $o\n}\n`}[sh]}}},
{id:'table',t:'Таблица умножения',lvl:2,mk(r,sh){const K=rI(r,3,9),ms=[rI(r,3,5),rI(r,5,8),rI(r,8,12)];const f=m=>Array.from({length:m},(_,i)=>`${K} x ${i+1} = ${K*(i+1)}`);
 return{d:`Скрипт получает число M и выводит таблицу умножения числа ${K} от 1 до M в формате «${K} x 3 = ${K*3}», по строке на каждое.`,hint:'Цикл от 1 до M; результат считается арифметикой оболочки.',
 tests:ms.map((m,i)=>({a:[String(m)],h:i===2,exp:f(m)})),files:[],
 sol:{bash:`for i in $(seq 1 "$1"); do\n  echo "${K} x $i = $((${K} * i))"\ndone\n`,cmd:`@echo off\nsetlocal enabledelayedexpansion\nfor /l %%i in (1,1,%1) do (\n  set /a r=${K}*%%i\n  echo ${K} x %%i = !r!\n)\n`,ps:`for ($i = 1; $i -le [int]$args[0]; $i++) {\n  "${K} x $i = $(${K} * $i)"\n}\n`}[sh]}}},
{id:'count',t:'Подсчёт слова в файле',lvl:2,mk(r,sh){const gen=()=>Array.from({length:rI(r,10,16)},()=>RNW[rI(r,0,RNW.length-1)]);const w1=gen(),w2=gen(),w3=gen();const q=[RNW[rI(r,0,3)],RNW[rI(r,4,7)]];const cnt=(w,x)=>w.filter(y=>y===x).length;const fn=sh==='bash'?'words.txt':'words.txt';
 return{d:`В файле words.txt записаны слова, по одному в строке. Скрипт получает слово и выводит «Найдено: K» — сколько строк файла равны этому слову.`,hint:sh==='bash'?'grep -c -x "$1" words.txt  или цикл while read':sh==='cmd'?'for /f %%w in (words.txt) do if "%%w"=="%~1" set /a n+=1':'Get-Content words.txt | Where-Object { $_ -eq $w }  (слово сохраните в переменную заранее)',
 files:[{n:fn,c:w1.join('\n')+'\n'}],
 tests:[{a:[q[0]],h:false,exp:['Найдено: '+cnt(w1,q[0])]},{a:[q[1]],h:false,exp:['Найдено: '+cnt(w1,q[1])]},{a:[q[0]],h:true,files:[{n:fn,c:w2.join('\n')+'\n'}],exp:['Найдено: '+cnt(w2,q[0])]},{a:[q[1]],h:true,files:[{n:fn,c:w3.join('\n')+'\n'}],exp:['Найдено: '+cnt(w3,q[1])]}],
 sol:{bash:'n=$(grep -c -x "$1" words.txt)\necho "Найдено: $n"\n',cmd:'@echo off\nset n=0\nfor /f %%w in (words.txt) do if "%%w"=="%~1" set /a n+=1\necho Найдено: %n%\n',ps:'$w = $args[0]\n$n = @(Get-Content words.txt | Where-Object { $_ -eq $w }).Count\n"Найдено: $n"\n'}[sh]}}},
{id:'score',t:'Фильтр по баллам',lvl:3,mk(r,sh){const gen=()=>{const nm=RNN.slice().sort(()=>r()-.5).slice(0,rI(r,6,9));return nm.map(n=>[n,rI(r,2,5)*10+rI(r,0,9)])};const d1=gen(),d2=gen();const T=[rI(r,25,35),rI(r,35,45),rI(r,30,40)];const ex=(d,t)=>d.filter(x=>x[1]>=t).map(x=>x[0]);const ser=d=>d.map(x=>x.join(' ')).join('\n')+'\n';
 return{d:'В файле scores.txt в каждой строке «Имя балл». Скрипт получает порог T и выводит имена тех, у кого балл не меньше T, в порядке файла, по одному в строке.',hint:'Читайте файл построчно, разбивайте строку на два поля, сравнивайте число с порогом.',
 files:[{n:'scores.txt',c:ser(d1)}],
 tests:[{a:[String(T[0])],h:false,exp:ex(d1,T[0])},{a:[String(T[1])],h:false,exp:ex(d1,T[1])},{a:[String(T[2])],h:true,files:[{n:'scores.txt',c:ser(d2)}],exp:ex(d2,T[2])}],
 sol:{bash:'while read name score; do\n  if [ "$score" -ge "$1" ]; then echo "$name"; fi\ndone < scores.txt\n',cmd:'@echo off\nfor /f "tokens=1,2" %%a in (scores.txt) do if %%b GEQ %~1 echo %%a\n',ps:'$t = [int]$args[0]\nGet-Content scores.txt | ForEach-Object {\n  $p = $_ -split \' \'\n  if ([int]$p[1] -ge $t) { $p[0] }\n}\n'}[sh]}}},
{id:'copy',t:'Копирование файлов по расширению',lvl:3,mk(r,sh){const ex=['txt','log','cfg'][rI(r,0,2)],oth=['txt','log','cfg','dat'].filter(x=>x!==ex);const mine=Array.from({length:rI(r,2,4)},(_,i)=>`${RNW[(rI(r,0,9)+i)%10]}${i}.${ex}`),others=Array.from({length:rI(r,2,3)},(_,i)=>`${RNW[(rI(r,0,9)+i+3)%10]}${i}.${oth[rI(r,0,oth.length-1)]}`);
 return{d:`В каталоге src лежат файлы разных типов. Скрипт создаёт каталог dst, копирует в него все файлы *.${ex} из src (остальные не трогает) и выводит «Скопировано: N».`,hint:sh==='bash'?'mkdir -p dst; for f in src/*.'+ex+'; do cp "$f" dst/; … done':sh==='cmd'?'if not exist dst md dst; for %%f in (src\\*.'+ex+') do copy …':'New-Item -ItemType Directory -Force dst; Get-ChildItem src -Filter *.'+ex,
 files:[...mine,...others].map(n=>({n:'src/'+n,c:'data '+n+'\n'})),clean:['src','dst'],tests:[],
 run:{h:false,exp:['Скопировано: '+mine.length]},after:(d,base)=>{const fs=sxFs(d);const R=[];R.push(['создан каталог dst',!!(fs[base+'dst']&&fs[base+'dst'].d)]);R.push(['скопированы все *.'+ex+' ('+mine.length+')',mine.every(n=>!!fs[base+'dst/'+n])]);R.push(['лишние файлы не скопированы',others.every(n=>!fs[base+'dst/'+n])]);R.push(['исходные файлы остались в src',mine.concat(others).every(n=>!!fs[base+'src/'+n])]);return R},
 sol:{bash:`mkdir -p dst\nn=0\nfor f in src/*.${ex}; do\n  cp "$f" dst/\n  n=$((n+1))\ndone\necho "Скопировано: $n"\n`,cmd:`@echo off\nif not exist dst md dst\nset n=0\nfor %%f in (src\\*.${ex}) do (\n  copy "%%f" dst >nul\n  set /a n+=1\n)\necho Скопировано: %n%\n`,ps:`New-Item -ItemType Directory -Force dst | Out-Null\n$f = @(Get-ChildItem src -Filter *.${ex})\nforeach ($x in $f) { Copy-Item $x.FullName dst }\n"Скопировано: $($f.Count)"\n`}[sh]}}}
];
const rndExt={bash:'.sh',cmd:'.bat',ps:'.ps1'};
function rndMk(rec){const g=RGEN.find(x=>x.id===rec.g),o=g.mk(exRng(rec.seed),rec.sh);const base=rec.sh==='bash'?SXH+'/':SXW+'/',fname='task_'+g.id+rndExt[rec.sh],file=base+fname;
 const put=d=>{(o.clean||[]).forEach(c=>sxRm(sxFs(d),base+c,true));(o.files||[]).forEach(f=>sxPutF(d,base+f.n,f.c))};
 const shn={bash:'bash',cmd:'cmd/bat',ps:'PowerShell'}[rec.sh];const pth=rec.sh==='bash'?fname:sxWin(file);
 return{id:rec.id,sh:rec.sh,lvl:g.lvl,t:`Случайное: ${g.t} (№${rec.seed})`,d:`${o.d} Файл: ${pth}. Вариант №${rec.seed}: данные случайные, у каждого студента свои.`,hint:o.hint,sol:o.sol,custom:1,rnd:1,src:rec,o,file,base,
  prep:d=>{put(d);return'Созданы данные: '+((o.files||[]).map(f=>f.n).join(', ')||'не требуются')},
  chk:d=>{put(d);const R=[];const ex=sxRd(d,file)!==null;R.push([`файл ${fname} создан`,ex]);if(!ex)return R;
   if(o.run){const r=sxRunFresh(d,file,[],'');const txt=(r.o||'').replace(/\r/g,'').split('\n').map(s=>s.trim()).filter(Boolean);R.push(['вывод: '+o.run.exp.join(' / '),JSON.stringify(txt)===JSON.stringify(o.run.exp)]);o.after(d,base).forEach(x=>R.push(x))}
   (o.tests||[]).forEach((t,i)=>{(t.files||[]).forEach(f=>sxPutF(d,base+f.n,f.c));const x=sxChkRun(d,file,[{l:t.h?`скрытый тест ${i+1}`:`тест ${i+1}: ${t.a.join(' ')||'без аргументов'} → ${t.exp.length>3?t.exp.slice(0,3).join(' / ')+' …':t.exp.join(' / ')}`,a:t.a,lines:t.exp}]);R.push(x[1]);if(t.files)put(d)});return R}}}
function rndSync(){for(let i=SXT.length-1;i>=0;i--)if(SXT[i].rnd)SXT.splice(i,1);rndGet().forEach(rc=>{try{SXT.push(rndMk(rc))}catch(e){}})}
{const _s=sxcSync;sxcSync=function(){_s();rndSync()}}
sxcSync();
function sxuProg(){const pr=sxLsGet(),B=SXT.filter(t=>!t.rnd),n=B.filter(t=>pr[t.id]).length,rn=SXT.filter(t=>t.rnd&&pr[t.id]).length;sxq('#sxpg').textContent=`Заданий выполнено: ${n} из ${B.length}`+(rn?` · случайных: ${rn}`:'')}
function rndNew(gid,sh,dbg){const all=sh==='git'?GG:RGEN.filter(x=>!x.shells||x.shells.includes(sh));const g=(gid&&gid!=='any'&&(sh==='git'?GG:RGEN).find(x=>x.id===gid))||all[Math.floor(Math.random()*all.length)];if(g.shells&&!g.shells.includes(sh))sh=g.shells[0];const rec={id:'r'+Date.now().toString(36)+Math.floor(Math.random()*99),g:g.id,sh:sh||'bash',seed:1+Math.floor(Math.random()*99998),dbg:dbg&&sh!=='git'?1:0};const a=rndGet();a.push(rec);rndPut(a);sxcSync();return rec}
function rndExample(d,gid,sh){if(sh==='git')return rndExampleG(d,gid);const pool=RGEN.filter(x=>!x.shells||x.shells.includes(sh));const g=(gid&&gid!=='any'&&RGEN.find(x=>x.id===gid))||pool[Math.floor(Math.random()*pool.length)];if(g.shells&&!g.shells.includes(sh))sh=g.shells[0];const seed=1+Math.floor(Math.random()*99998),rec={id:'x',g:g.id,sh,seed};const t=rndMk(rec),o=t.o;const fname='rand_'+g.id+'_'+seed+rndExt[sh];const cm={bash:'# ',cmd:'rem ',ps:'# '}[sh];const t0=(o.tests&&o.tests[0])||{a:[],exp:o.run.exp};
 const hdr=[`Случайный скрипт: ${g.t} (№${seed})`,o.d.replace(/\n/g,' '),`Пример: ${sh==='bash'?'bash':sh==='cmd'?'bat':'ps1'} ${fname} ${t0.a.join(' ')}`.trim(),`Ожидаемый вывод: ${t0.exp.slice(0,4).join(' | ')}${t0.exp.length>4?' …':''}`];
 let body=t.sol;if(sh==='bash')body='#!/bin/bash\n'+hdr.map(x=>cm+x).join('\n')+'\n'+body;else if(sh==='cmd')body=body.replace(/^@echo off\n/,'')&&('@echo off\n'+hdr.map(x=>cm+x).join('\n')+'\n'+body.replace(/^@echo off\n/,''));else body=hdr.map(x=>cm+x).join('\n')+'\n'+body;
 (o.clean||[]).forEach(c=>sxRm(sxFs(d),t.base+c,true));(o.files||[]).forEach(f=>sxPutF(d,t.base+f.n,f.c));sxPutF(d,t.base+fname,body);return{path:t.base+fname,args:t0.a,exp:t0.exp}}
{const _tk=sxuTk;sxuTk=function(el){_tk(el);if(SXF)return;
 el.insertAdjacentHTML('afterbegin',`<div class="sxk"><h4>🎲 Случайные задания и примеры</h4><p>Генератор создаёт задание с новыми случайными данными и проверяет ваш скрипт на них (и на скрытых наборах). «Случайный скрипт» кладёт в редактор готовый рабочий пример со случайными данными — его можно запустить, изучить и изменить.</p><div class="sxr"><select id="rgg"><option value="any">любая тема</option>${RGEN.concat(GG).map(g=>`<option value="${g.id}">${sxE(g.t)}</option>`).join('')}</select><select id="rgs"><option value="bash">bash</option><option value="cmd">cmd/bat</option><option value="ps">PowerShell</option><option value="git">Git (репозиторий)</option></select></div><div class="sxr"><button class="pr" id="rgn">Новое случайное задание</button><button id="rge">Случайный скрипт в редактор</button><button id="rgd" title="Скрипт с одной ошибкой: найдите и исправьте">🐞 Найди ошибку</button><button id="rgc">Убрать случайные задания</button></div></div>`);
 const sh0=()=>sxq('#rgs').value,g0=()=>sxq('#rgg').value;
 sxq('#rgn').onclick=()=>{const rc=rndNew(g0(),sh0());SXU.topen=rc.id;sxuTk(el);sxuProg();const h=el.querySelector(`h4[data-k="${rc.id}"]`);if(h&&h.scrollIntoView)h.scrollIntoView()};
 sxq('#rgd').onclick=()=>{const rc=rndNew(g0(),sh0(),1);SXU.topen=rc.id;sxuTk(el);sxuProg();const h=el.querySelector(`h4[data-k="${rc.id}"]`);if(h&&h.scrollIntoView)h.scrollIntoView()};
 sxq('#rge').onclick=()=>{const x=rndExample(SXU.d,g0(),sh0());SXU.tab='ed';sxuLoad(x.path);SXU.ro='';SXU.ra=x;sxuAll();const a=sxq('#sxar');if(a)a.value=x.args.join(' ')};
 sxq('#rgc').onclick=()=>{rndPut([]);sxcSync();sxuTk(el);sxuProg()};
 el.querySelectorAll('button[data-a=edit]').forEach(b=>{const t=SXT.find(x=>x.id===b.dataset.k);if(t&&t.rnd)b.remove()});
 el.querySelectorAll('button[data-a=del]').forEach(b=>{const t=SXT.find(x=>x.id===b.dataset.k);if(t&&t.rnd)b.onclick=ev=>{ev.stopImmediatePropagation();rndPut(rndGet().filter(r=>r.id!==t.id));sxcSync();sxuTk(el);sxuProg()}})}}
p('Новое (v29): случайные задания по скриптам — «Скрипты → Задания → Новое случайное задание» (bash, cmd, PowerShell, 8 тем) и «Случайный скрипт в редактор».');
