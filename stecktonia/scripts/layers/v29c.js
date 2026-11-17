// ===== v29c: ещё темы случайных заданий =====
RGEN.push(
{id:'csvsum',t:'Сумма по CSV-файлу',lvl:3,mk(r,sh){const gen=()=>Array.from({length:rI(r,4,7)},(_,i)=>[RNW[(i*3+rI(r,0,2))%10],rI(r,1,9),rI(r,5,60)]);const d1=gen(),d2=gen();const ser=d=>d.map(x=>x.join(';')).join('\n')+'\n';const tot=d=>d.reduce((s,x)=>s+x[1]*x[2],0);
 return{d:'В файле sales.csv в каждой строке «товар;количество;цена» (разделитель — точка с запятой, без заголовка). Скрипт выводит «Итого: S» — сумму количество×цена по всем строкам.',hint:sh==='bash'?"awk -F';' '{ s += $2*$3 } END { print ... }'":sh==='cmd'?'for /f "tokens=2,3 delims=;" %%a in (sales.csv) do set /a s+=%%a*%%b':'$p = $line -split \';\'; $s += [int]$p[1] * [int]$p[2]',
  files:[{n:'sales.csv',c:ser(d1)}],tests:[{a:[],h:false,exp:['Итого: '+tot(d1)]},{a:[],h:true,files:[{n:'sales.csv',c:ser(d2)}],exp:['Итого: '+tot(d2)]}],
  sol:{bash:"awk -F';' '{ s += $2 * $3 } END { print \"Итого: \" s }' sales.csv\n",cmd:'@echo off\nset s=0\nfor /f "tokens=2,3 delims=;" %%a in (sales.csv) do set /a s+=%%a*%%b\necho Итого: %s%\n',ps:'$s = 0\nforeach ($l in Get-Content sales.csv) {\n  $p = $l -split \';\'\n  $s += [int]$p[1] * [int]$p[2]\n}\n"Итого: $s"\n'}[sh]}}},
{id:'toplog',t:'Самый частый IP в журнале',lvl:3,shells:['bash','ps'],mk(r,sh){const mkd=()=>{const ips=Array.from({length:4},(_,i)=>`10.${rI(r,0,9)}.${rI(r,0,9)}.${i+rI(r,1,50)*4}`);const cnt=[rI(r,6,9),rI(r,4,5),rI(r,2,3),1];let L=[];ips.forEach((ip,i)=>{for(let k=0;k<cnt[i];k++)L.push(`${ip} - GET /p${rI(r,1,9)}`)});L.sort(()=>r()-.5);return{c:L.join('\n')+'\n',top:ips[0]}};const a=mkd(),b=mkd();
  return{d:'В файле access.log в каждой строке первое поле — IP-адрес клиента. Скрипт выводит один адрес — тот, что встречается чаще всех.',hint:sh==='bash'?"awk '{print $1}' | sort | uniq -c | sort -rn | head -1":'Group-Object, Sort-Object Count -Descending, Select-Object -First 1',
  files:[{n:'access.log',c:a.c}],tests:[{a:[],h:false,exp:[a.top]},{a:[],h:true,files:[{n:'access.log',c:b.c}],exp:[b.top]}],
  sol:{bash:"awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -1 | awk '{print $2}'\n",ps:'$g = Get-Content access.log | ForEach-Object { ($_ -split \' \')[0] } | Group-Object | Sort-Object Count -Descending\n$g[0].Name\n'}[sh]}}},
{id:'prime',t:'Количество простых чисел',lvl:3,mk(r,sh){const ns=[rI(r,15,25),rI(r,26,40),rI(r,50,80)];const pc=n=>{let c=0;for(let k=2;k<=n;k++){let p=true;for(let d=2;d*d<=k;d++)if(k%d===0){p=false;break}if(p)c++}return c};
 return{d:'Скрипт получает число N и выводит «Простых: K» — сколько простых чисел от 2 до N включительно.',hint:'Двойной цикл: для каждого n ищите делитель d, начиная с 2.',
  files:[],tests:ns.map((n,i)=>({a:[String(n)],h:i===2,exp:['Простых: '+pc(n)]})),
  sol:{bash:'c=0\nfor ((n=2; n<=$1; n++)); do\n  p=1\n  for ((d=2; d*d<=n; d++)); do\n    if (( n % d == 0 )); then p=0; break; fi\n  done\n  c=$((c+p))\ndone\necho "Простых: $c"\n',cmd:'@echo off\nsetlocal enabledelayedexpansion\nset c=0\nfor /l %%n in (2,1,%1) do (\n  set p=1\n  for /l %%d in (2,1,%%n) do (\n    if %%d LSS %%n (\n      set /a r=%%n %% %%d\n      if !r!==0 set p=0\n    )\n  )\n  if !p!==1 set /a c+=1\n)\necho Простых: !c!\n',ps:'$c = 0\nfor ($n = 2; $n -le [int]$args[0]; $n++) {\n  $p = $true\n  for ($d = 2; $d * $d -le $n; $d++) { if ($n % $d -eq 0) { $p = $false; break } }\n  if ($p) { $c++ }\n}\n"Простых: $c"\n'}[sh]}}},
{id:'subnet',t:'Список адресов подсети',lvl:1,mk(r,sh){const P=`192.168.${rI(r,1,200)}`,ns=[rI(r,3,6),rI(r,5,9),rI(r,8,14)];const f=n=>Array.from({length:n},(_,i)=>`${P}.${i+1}`);
 return{d:`Скрипт получает число N и выводит адреса ${P}.1 … ${P}.N, по одному в строке.`,hint:'Цикл от 1 до N и конкатенация префикса сети с номером хоста.',
  files:[],tests:ns.map((n,i)=>({a:[String(n)],h:i===2,exp:f(n)})),
  sol:{bash:`for i in $(seq 1 "$1"); do\n  echo "${P}.$i"\ndone\n`,cmd:`@echo off\nfor /l %%i in (1,1,%1) do echo ${P}.%%i\n`,ps:`1..[int]$args[0] | ForEach-Object { "${P}.$_" }\n`}[sh]}}},
{id:'sortn',t:'Сортировка чисел',lvl:2,shells:['bash','ps'],mk(r,sh){const g=()=>{const s=new Set();while(s.size<rI(r,5,8))s.add(rI(r,1,150));return[...s].sort(()=>r()-.5)};const t=[g(),g(),g()];
 return{d:'Скрипт получает различные числа в аргументах и выводит их по возрастанию, по одному в строке.',hint:sh==='bash'?"printf '%s\\n' \"$@\" | sort -n":'$args | ForEach-Object { [int]$_ } | Sort-Object',
  files:[],tests:t.map((a,i)=>({a:a.map(String),h:i===2,exp:a.slice().sort((x,y)=>x-y).map(String)})),
  sol:{bash:"printf '%s\\n' \"$@\" | sort -n\n",ps:'$args | ForEach-Object { [int]$_ } | Sort-Object\n'}[sh]}}},
{id:'rev',t:'Аргументы в обратном порядке',lvl:1,shells:['bash','ps'],mk(r,sh){const g=()=>RNW.slice().sort(()=>r()-.5).slice(0,rI(r,3,6));const t=[g(),g(),g()];
 return{d:'Скрипт получает слова в аргументах и выводит их в обратном порядке, по одному в строке.',hint:sh==='bash'?'for ((i=$#; i>0; i--)); do echo "${!i}"; done':'for ($i = $args.Count - 1; $i -ge 0; $i--) { $args[$i] }',
  files:[],tests:t.map((a,i)=>({a,h:i===2,exp:a.slice().reverse()})),
  sol:{bash:'for ((i=$#; i>0; i--)); do\n  echo "${!i}"\ndone\n',ps:'for ($i = $args.Count - 1; $i -ge 0; $i--) { $args[$i] }\n'}[sh]}}}
);
