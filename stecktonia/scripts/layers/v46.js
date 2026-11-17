// ===== v46: админские и DevOps-темы случайных заданий (журналы, диск, ротация, сервисы, .env, версии) =====
const RUSR=['root','admin','deploy','git','backup','ubuntu','oracle','test'];
const RSVC=['nginx','sshd','postgres','redis','docker','cron','chronyd','fail2ban','mysql','named'];
RGEN.push(
{id:'authfail',t:'Журнал auth.log: IP с подбором пароля',lvl:3,shells:['bash','ps'],mk(r,sh){
 const gen=()=>{const ips=[];while(ips.length<5){const ip='10.0.'+rI(r,0,3)+'.'+rI(r,11,99);if(!ips.includes(ip))ips.push(ip)}
  const cnt=[rI(r,5,8),rI(r,3,4),rI(r,2,3),rI(r,1,2),1];const L=[];let t=0;
  ips.forEach((ip,i)=>{for(let k=0;k<cnt[i];k++)L.push(`Oct 17 10:${String(rI(r,10,59))}:${String(rI(r,10,59))} srv sshd[${rI(r,1000,9999)}]: Failed password for ${RUSR[rI(r,0,7)]} from ${ip} port ${rI(r,30000,60000)} ssh2`)});
  for(let k=0;k<rI(r,2,4);k++)L.push(`Oct 17 10:${rI(r,10,59)}:${rI(r,10,59)} srv sshd[${rI(r,1000,9999)}]: Accepted password for ${RUSR[rI(r,0,7)]} from ${ips[rI(r,0,4)]} port ${rI(r,30000,60000)} ssh2`);
  L.sort(()=>r()-.5);return{c:L.join('\n')+'\n',ips,cnt}};
 const ex=(g,n)=>g.ips.map((ip,i)=>[ip,g.cnt[i]]).filter(x=>x[1]>=n).sort((a,b)=>a[0]<b[0]?-1:1).map(x=>`${x[0]}: ${x[1]}`);
 const a=gen(),b=gen();const n1=rI(r,2,3),n2=rI(r,3,Math.min(4,a.cnt[0])),n3=rI(r,2,4);
 return{d:'В файле auth.log — журнал sshd. Строки «Failed password … from IP port …» — неудачные входы (есть и «Accepted password» — успешные, их считать не нужно). Скрипт получает порог N и выводит по одной строке «IP: K» для каждого адреса, у которого неудачных входов не меньше N, в порядке возрастания адреса (как строки).',
  hint:sh==='bash'?"grep 'Failed password' | awk '{print $(NF-3)}' | sort | uniq -c, затем while read c ip":'Where-Object { $_ -match "Failed password" } | ForEach-Object { ($_ -split " ")[-4] } | Group-Object',
  files:[{n:'auth.log',c:a.c}],tests:[{a:[String(n1)],h:false,exp:ex(a,n1)},{a:[String(n2)],h:false,exp:ex(a,n2)},{a:[String(n3)],h:true,files:[{n:'auth.log',c:b.c}],exp:ex(b,n3)}],
  sol:{bash:"grep 'Failed password' auth.log | awk '{print $(NF-3)}' | sort | uniq -c | while read c ip; do\n  if [ \"$c\" -ge \"$1\" ]; then echo \"$ip: $c\"; fi\ndone\n",ps:'$n = [int]$args[0]\nGet-Content auth.log |\n  Where-Object { $_ -match \'Failed password\' } |\n  ForEach-Object { ($_ -split \' \')[-4] } |\n  Group-Object |\n  Where-Object { $_.Count -ge $n } |\n  Sort-Object Name |\n  ForEach-Object { "$($_.Name): $($_.Count)" }\n'}[sh]}}},
{id:'diskwarn',t:'Мониторинг диска: разделы выше порога',lvl:2,mk(r,sh){
 const gen=()=>{const m=['/','/boot','/var','/home','/srv','/tmp','/opt'].sort(()=>r()-.5).slice(0,rI(r,4,6));return m.map(x=>[x,rI(r,8,97)])};
 const ser=d=>d.map(x=>x.join(' ')).join('\n')+'\n';const exp=(d,t)=>{const l=d.filter(x=>x[1]>=t).map(x=>`ТРЕВОГА: ${x[0]} ${x[1]}%`);return l.length?l:['Все разделы в норме']};
 const a=gen(),b=gen();const hi=Math.max(...a.map(x=>x[1])),t1=Math.max(10,hi-rI(r,5,25)),t2=101,t3=rI(r,40,80);
 return{d:'В файле df.txt в каждой строке «раздел занято_%» (например, «/var 91»). Скрипт получает порог N и выводит для каждого раздела с занятостью не меньше N строку «ТРЕВОГА: раздел P%» (в порядке файла). Если таких нет, выводит «Все разделы в норме».',
  hint:sh==='bash'?'while read m u; do if [ "$u" -ge "$1" ]; then …; fi; done < df.txt и флаг «был ли хоть один»':sh==='cmd'?'for /f "tokens=1,2" %%a in (df.txt) do if %%b GEQ %~1 …; флаг set bad=1; процент в echo пишется как %%':'foreach по Get-Content df.txt, -split, флаг $bad',
  files:[{n:'df.txt',c:ser(a)}],tests:[{a:[String(t1)],h:false,exp:exp(a,t1)},{a:[String(t2)],h:false,exp:exp(a,t2)},{a:[String(t3)],h:true,files:[{n:'df.txt',c:ser(b)}],exp:exp(b,t3)}],
  sol:{bash:'bad=0\nwhile read m u; do\n  if [ "$u" -ge "$1" ]; then\n    echo "ТРЕВОГА: $m $u%"\n    bad=1\n  fi\ndone < df.txt\nif [ "$bad" -eq 0 ]; then echo "Все разделы в норме"; fi\n',cmd:'@echo off\nset bad=0\nfor /f "tokens=1,2" %%a in (df.txt) do (\n  if %%b GEQ %~1 (\n    echo ТРЕВОГА: %%a %%b%%\n    set bad=1\n  )\n)\nif %bad%==0 echo Все разделы в норме\n',ps:'$t = [int]$args[0]\n$bad = $false\nforeach ($l in Get-Content df.txt) {\n  $p = $l -split \' \'\n  if ([int]$p[1] -ge $t) {\n    "ТРЕВОГА: $($p[0]) $($p[1])%"\n    $bad = $true\n  }\n}\nif (-not $bad) { "Все разделы в норме" }\n'}[sh]}}},
{id:'rotate',t:'Ротация журналов: оставить последние N',lvl:3,mk(r,sh){
 const keep=rI(r,2,4),total=rI(r,keep+2,keep+5),day=rI(r,1,9);const names=Array.from({length:total},(_,i)=>`app-2026-10-${String(day+i).padStart(2,'0')}.log`);const del=total-keep;
 return{d:`В каталоге logs лежат ежедневные журналы вида app-2026-10-ДД.log. Скрипт оставляет только ${keep} самых новых файлов (по имени: чем больше дата, тем новее), остальные удаляет и выводит «Удалено: M».`,
  hint:sh==='bash'?'сколько файлов всего → сколько удалить; цикл по logs/* (список отсортирован по имени), счётчик i':sh==='cmd'?'считайте файлы for %%f in (logs\\*), затем второй цикл с !i! и set /a (enabledelayedexpansion)':'Get-ChildItem logs | Sort-Object Name; цикл for по первым ($Count - '+keep+') элементам; Remove-Item',
  files:names.map(n=>({n:'logs/'+n,c:'log '+n+'\n'})),clean:['logs'],tests:[],
  run:{h:false,exp:['Удалено: '+del]},after:(d,base)=>{const fs=sxFs(d);const R=[];const left=names.slice(del),gone=names.slice(0,del);R.push([`осталось ровно ${keep} файлов`,Object.keys(fs).filter(k=>k.startsWith(base+'logs/')&&!fs[k].d).length===keep]);R.push(['остались самые новые',left.every(n=>!!fs[base+'logs/'+n])]);R.push(['старые удалены',gone.every(n=>!fs[base+'logs/'+n])]);return R},
  sol:{bash:`total=$(ls logs | wc -l)\ndel=$((total-${keep}))\ni=0\nfor f in logs/*; do\n  if [ "$i" -lt "$del" ]; then rm "$f"; fi\n  i=$((i+1))\ndone\necho "Удалено: $del"\n`,cmd:`@echo off\nsetlocal enabledelayedexpansion\nset total=0\nfor %%f in (logs\\*) do set /a total+=1\nset /a del=total-${keep}\nset i=0\nfor %%f in (logs\\*) do (\n  if !i! LSS %del% del "%%f"\n  set /a i+=1\n)\necho Удалено: %del%\n`,ps:`$f = @(Get-ChildItem logs | Sort-Object Name)\n$del = $f.Count - ${keep}\nfor ($i = 0; $i -lt $del; $i++) { Remove-Item $f[$i].FullName }\n"Удалено: $del"\n`}[sh]}}},
{id:'svcstat',t:'Состояние сервисов: упавшие',lvl:2,mk(r,sh){
 const gen=()=>RSVC.slice().sort(()=>r()-.5).slice(0,rI(r,5,8)).map(n=>[n,['active','active','failed','inactive'][rI(r,0,3)]]);const ser=d=>d.map(x=>x.join(' ')).join('\n')+'\n';
 const ex=d=>{const f=d.filter(x=>x[1]==='failed').map(x=>x[0]);return[...f,'Проблем: '+f.length]};let a=gen(),b=gen();if(!a.some(x=>x[1]==='failed'))a[0][1]='failed';
 return{d:'В файле services.txt в каждой строке «сервис состояние» (active, inactive или failed). Скрипт выводит имена сервисов в состоянии failed (по одному в строке, в порядке файла), а последней строкой — «Проблем: K».',
  hint:sh==='bash'?'while read n s; do if [ "$s" = "failed" ]; …; done < services.txt':sh==='cmd'?'for /f "tokens=1,2" %%a in (services.txt) do if "%%b"=="failed" …':'foreach ($l in Get-Content services.txt) { $p = $l -split " "; … }',
  files:[{n:'services.txt',c:ser(a)}],tests:[{a:[],h:false,exp:ex(a)},{a:[],h:true,files:[{n:'services.txt',c:ser(b)}],exp:ex(b)}],
  sol:{bash:'k=0\nwhile read n s; do\n  if [ "$s" = "failed" ]; then\n    echo "$n"\n    k=$((k+1))\n  fi\ndone < services.txt\necho "Проблем: $k"\n',cmd:'@echo off\nset k=0\nfor /f "tokens=1,2" %%a in (services.txt) do (\n  if "%%b"=="failed" (\n    echo %%a\n    set /a k+=1\n  )\n)\necho Проблем: %k%\n',ps:'$k = 0\nforeach ($l in Get-Content services.txt) {\n  $p = $l -split \' \'\n  if ($p[1] -eq \'failed\') {\n    $p[0]\n    $k++\n  }\n}\n"Проблем: $k"\n'}[sh]}}},
{id:'envexport',t:'Файл .env → команды export',lvl:3,mk(r,sh){
 const KS=['DB_HOST','DB_PORT','APP_ENV','LOG_LEVEL','REDIS_URL','API_KEY','TZ','WORKERS'],VS=['db1.local','5432','prod','debug','redis://10.0.0.5:6379','k-'+rI(r,100,999),'Europe/Moscow',String(rI(r,2,16))];
 const gen=()=>{const idx=KS.map((_,i)=>i).sort(()=>r()-.5).slice(0,rI(r,4,6));const L=[];const kv=[];idx.forEach((i,n)=>{if(n===1)L.push('# основные параметры');if(n===3)L.push('');L.push(KS[i]+'='+VS[i]);kv.push([KS[i],VS[i]])});return{c:L.join('\n')+'\n',exp:kv.map(x=>`export ${x[0]}="${x[1]}"`)}};
 const a=gen(),b=gen();
 return{d:'В файле app.env строки вида «КЛЮЧ=значение»; встречаются строки-комментарии (начинаются с #, внутри нет знака «=») и пустые строки. Скрипт выводит для каждой настройки команду export в формате: export КЛЮЧ="значение" (в порядке файла); комментарии и пустые строки пропускает.',
  hint:sh==='bash'?'grep -v для комментариев и пустых строк, затем while IFS="=" read -r k v':sh==='cmd'?'for /f "tokens=1,* delims==" %%a in (app.env) do if not "%%b"=="" echo export %%a="%%b"':'foreach по Get-Content; пропуск через continue; $l -split "=", 2',
  files:[{n:'app.env',c:a.c}],tests:[{a:[],h:false,exp:a.exp},{a:[],h:true,files:[{n:'app.env',c:b.c}],exp:b.exp}],
  sol:{bash:"grep -v '^#' app.env | grep -v '^$' | while IFS='=' read -r k v; do\n  echo \"export $k=\\\"$v\\\"\"\ndone\n",cmd:'@echo off\nfor /f "tokens=1,* delims==" %%a in (app.env) do if not "%%b"=="" echo export %%a="%%b"\n',ps:'foreach ($l in Get-Content app.env) {\n  if ($l -match \'^\\s*#\' -or $l.Trim() -eq \'\') { continue }\n  $p = $l -split \'=\', 2\n  \'export \' + $p[0] + \'="\' + $p[1] + \'"\'\n}\n'}[sh]}}},
{id:'semver',t:'Самая новая версия из тегов',lvl:3,shells:['bash','ps'],mk(r,sh){
 const gen=()=>{const s=new Set();while(s.size<rI(r,5,8))s.add(`v${rI(r,0,3)}.${rI(r,0,12)}.${rI(r,0,15)}`);const L=[...s];const key=v=>v.slice(1).split('.').map(Number);const top=L.slice().sort((x,y)=>{const a=key(x),b=key(y);return a[0]-b[0]||a[1]-b[1]||a[2]-b[2]}).pop();return{c:L.join('\n')+'\n',top}};
 const a=gen(),b=gen();
 return{d:'В файле tags.txt по одному тегу в строке в формате vMAJOR.MINOR.PATCH (например, v1.9.0 и v1.10.2). Скрипт выводит самый новый тег — сравнение числовое по трём частям (v1.10.0 новее v1.9.0).',
  hint:sh==='bash'?'sort -V tags.txt | tail -1  (или sort -t. с числовыми ключами)':'Sort-Object { [version]($_ -replace "^v","") } | Select-Object -Last 1',
  files:[{n:'tags.txt',c:a.c}],tests:[{a:[],h:false,exp:[a.top]},{a:[],h:true,files:[{n:'tags.txt',c:b.c}],exp:[b.top]}],
  sol:{bash:'sort -V tags.txt | tail -1\n',ps:'Get-Content tags.txt |\n  Sort-Object { [version]($_ -replace \'^v\', \'\') } |\n  Select-Object -Last 1\n'}[sh]}}}
);
// [version] в PowerShell: строка превращается в сравнимый объект
{const _ps=psStr,_pc=psCmpv;
psStr=function(v){return v&&v.__ver?v.s:_ps(v)};
psCmpv=function(a,b,cs){if(a&&a.__ver&&b&&b.__ver){for(let i=0;i<4;i++){const x=a.__ver[i]??-1,y=b.__ver[i]??-1;if(x!==y)return x<y?-1:1}return 0}return _pc(a,b,cs)}}
