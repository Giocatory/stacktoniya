// ===== v63: ещё 27 заданий по скриптам (bash 19, cmd 4, PowerShell 4) =====
{const T=(id,lvl,sh,t,f,d,hint,sol,tests,files)=>{const B=sh==='bash'?SXB:SXWD,P=sh==='bash'?SXB:sxWin(SXW)+'\\';
  SXT.push({id,sh,lvl,t,d:d.replace(/@@/g,P),hint,sol,
  prep:files?(dd=>{Object.keys(files).forEach(k=>sxPutF(dd,B+k,files[k]));return'Созданы файлы: '+Object.keys(files).map(k=>P+k).join(', ')}):undefined,
  chk:dd=>{if(files)Object.keys(files).forEach(k=>{if(sxRd(dd,B+k)!==files[k])sxPutF(dd,B+k,files[k])});if(files&&sh==='bash')Object.keys(sxFs(dd)).filter(k=>/\.bak$/.test(k)&&k.startsWith(B+'ren/')).forEach(k=>delete sxFs(dd)[k]);const R=sxChkRun(dd,B+f,tests.map(x=>({...x})));return R}})};
 // ---------- bash ----------
 T('b22',1,'bash','Строки и слова файла (wc)','count.sh','В @@text.txt — текст. Создайте @@count.sh: выводит «строк: N, слов: M» для этого файла.','wc -l < f; wc -w < f',
  '#!/bin/bash\nf=$HOME/text.txt\necho "строк: $(wc -l < $f), слов: $(wc -w < $f)"\n',[{l:'для text.txt из задания',lines:['строк: 3, слов: 7']}],{'text.txt':'один два\nтри четыре пять\nшесть семь\n'});
 T('b23',1,'bash','Палиндром','pal.sh','Создайте @@pal.sh: принимает слово и выводит «да», если оно читается одинаково в обе стороны, иначе «нет».','rev',
  '#!/bin/bash\nif [ "$1" = "$(echo "$1" | rev)" ]; then echo да; else echo нет; fi\n',[{l:'шалаш → да',a:['шалаш'],lines:['да']},{l:'сервер → нет',a:['сервер'],lines:['нет']},{l:'level → да',a:['level'],lines:['да']}]);
 T('b24',1,'bash','Таблица умножения','mult.sh','Создайте @@mult.sh: по числу N выводит строки «N x i = результат» для i от 1 до 10.','for i in $(seq 1 10)',
  '#!/bin/bash\nfor i in $(seq 1 10); do\n  echo "$1 x $i = $(( $1 * i ))"\ndone\n',[{l:'N=7: «7 x 1 = 7», «7 x 5 = 35», «7 x 10 = 70»',a:['7'],has:['7 x 1 = 7','7 x 10 = 70','7 x 5 = 35']},{l:'N=3: «3 x 9 = 27»',a:['3'],has:['3 x 9 = 27']}]);
 T('b25',2,'bash','Журнал: уровни ERROR и WARN','levels.sh','В @@app.log — строки вида «УРОВЕНЬ сообщение». Создайте @@levels.sh: выводит две строки «ERROR: n» и «WARN: m» (сколько строк каждого уровня).','grep -c "^ERROR" файл',
  '#!/bin/bash\nf=$HOME/app.log\necho "ERROR: $(grep -c "^ERROR" $f)"\necho "WARN: $(grep -c "^WARN" $f)"\n',[{l:'для app.log из задания',lines:['ERROR: 2','WARN: 3']}],{'app.log':'INFO start\nERROR disk\nWARN cpu\nWARN mem\nINFO ok\nERROR net\nWARN temp\n'});
 T('b26',2,'bash','Массовое переименование','bak.sh','В каталоге @@ren лежат файлы .txt. Создайте @@bak.sh: переименовывает каждый *.txt в *.bak (mv) и выводит «Переименовано: N».','for f in ren/*.txt; do mv "$f" "${f%.txt}.bak"; done',
  '#!/bin/bash\nn=0\nfor f in $HOME/ren/*.txt; do\n  mv "$f" "${f%.txt}.bak"\n  n=$((n+1))\ndone\necho "Переименовано: $n"\n',[{l:'выводит «Переименовано: 3»',has:['Переименовано: 3']}],{'ren/a.txt':'1\n','ren/b.txt':'2\n','ren/c.txt':'3\n'});
 T('b27',2,'bash','Сумма столбца CSV (awk)','total.sh','В @@sales.csv — строки «товар,количество». Создайте @@total.sh: выводит «Всего: N» — сумму количеств.','awk -F, \'{s+=$2} END{print s}\'',
  '#!/bin/bash\nawk -F, \'{s+=$2} END{print "Всего: " s}\' $HOME/sales.csv\n',[{l:'для sales.csv из задания → «Всего: 27»',lines:['Всего: 27']}],{'sales.csv':'болт,10\nгайка,12\nшайба,5\n'});
 T('b28',2,'bash','Уникальные пользователи','uniq.sh','В @@visits.log — по одному имени в строке (с повторами). Создайте @@uniq.sh: выводит «Уникальных: N».','sort -u | wc -l',
  '#!/bin/bash\necho "Уникальных: $(sort -u $HOME/visits.log | wc -l)"\n',[{l:'для visits.log из задания → «Уникальных: 3»',lines:['Уникальных: 3']}],{'visits.log':'anna\nigor\nanna\nvera\nigor\nanna\n'});
 T('b29',2,'bash','Числа Фибоначчи','fib.sh','Создайте @@fib.sh: по числу N выводит первые N чисел Фибоначчи через пробел в одной строке (1 1 2 3 5 …).','a=1;b=1; цикл',
  '#!/bin/bash\na=1; b=1; out=""\nfor ((i=0;i<$1;i++)); do\n  out="$out $a"\n  t=$((a+b)); a=$b; b=$t\ndone\necho $out\n',[{l:'N=7 → 1 1 2 3 5 8 13',a:['7'],lines:['1 1 2 3 5 8 13']},{l:'N=1 → 1',a:['1'],lines:['1']}]);
 T('b30',2,'bash','Простое число','prime.sh','Создайте @@prime.sh: принимает число и выводит «простое» или «составное» (для чисел ≥ 2).','перебор делителей до sqrt',
  '#!/bin/bash\nn=$1; p=1\nfor ((i=2;i*i<=n;i++)); do\n  if [ $((n%i)) -eq 0 ]; then p=0; break; fi\ndone\nif [ $p -eq 1 ]; then echo простое; else echo составное; fi\n',[{l:'13 → простое',a:['13'],lines:['простое']},{l:'15 → составное',a:['15'],lines:['составное']},{l:'2 → простое',a:['2'],lines:['простое']},{l:'49 → составное',a:['49'],lines:['составное']}]);
 T('b31',1,'bash','Максимум из аргументов','max.sh','Создайте @@max.sh: выводит наибольшее из переданных чисел (их может быть любое количество).','for x in "$@"',
  '#!/bin/bash\nm=$1\nfor x in "$@"; do\n  if [ $x -gt $m ]; then m=$x; fi\ndone\necho $m\n',[{l:'3 9 4 → 9',a:['3','9','4'],lines:['9']},{l:'-5 -2 -9 → -2',a:['-5','-2','-9'],lines:['-2']},{l:'42 → 42',a:['42'],lines:['42']}]);
 T('b32',2,'bash','Смена порта через sed с копией','port.sh','В @@web.conf есть строка «Listen 80». Создайте @@port.sh: сохраняет копию @@web.conf.bak и заменяет порт на 8080 прямо в файле (sed -i).','cp; sed -i',
  '#!/bin/bash\ncp $HOME/web.conf $HOME/web.conf.bak\nsed -i \'s/^Listen 80$/Listen 8080/\' $HOME/web.conf\n',[{l:'скрипт запускается без ошибок'}],{'web.conf':'ServerName site\nListen 80\nKeepAlive on\n'});
 SXT[SXT.length-1].chk=dd=>{sxPutF(dd,SXB+'web.conf','ServerName site\nListen 80\nKeepAlive on\n');const R=sxChkRun(dd,SXB+'port.sh',[{l:'скрипт запускается без ошибок'}]);const c=sxRd(dd,SXB+'web.conf'),b=sxRd(dd,SXB+'web.conf.bak');R.push(['в web.conf порт 8080',!!c&&/Listen 8080/.test(c)&&!/Listen 80\n/.test(c)]);R.push(['копия web.conf.bak содержит исходное «Listen 80»',!!b&&/Listen 80\n/.test(b)]);return R};
 T('b33',1,'bash','Разворот строки','rv.sh','Создайте @@rv.sh: выводит переданный аргумент задом наперёд.','rev',
  '#!/bin/bash\necho "$1" | rev\n',[{l:'abc → cba',a:['abc'],lines:['cba']},{l:'Stacktoniya → ayinotkcatS',a:['Stacktoniya'],lines:['ayinotkcatS']}]);
 T('b34',3,'bash','Проверка IP-адреса','isip.sh','Создайте @@isip.sh: выводит «верный», если аргумент — корректный IPv4-адрес (четыре числа 0–255 через точки), иначе «неверный».','[[ =~ ]] и проверка октетов',
  '#!/bin/bash\nip=$1\nif [[ $ip =~ ^([0-9]{1,3})\\.([0-9]{1,3})\\.([0-9]{1,3})\\.([0-9]{1,3})$ ]]; then\n  ok=1\n  for o in ${BASH_REMATCH[1]} ${BASH_REMATCH[2]} ${BASH_REMATCH[3]} ${BASH_REMATCH[4]}; do\n    if [ $o -gt 255 ]; then ok=0; fi\n  done\nelse\n  ok=0\nfi\nif [ $ok -eq 1 ]; then echo верный; else echo неверный; fi\n',[{l:'192.168.1.10 → верный',a:['192.168.1.10'],lines:['верный']},{l:'256.1.1.1 → неверный',a:['256.1.1.1'],lines:['неверный']},{l:'10.0.0 → неверный',a:['10.0.0'],lines:['неверный']},{l:'abc → неверный',a:['abc'],lines:['неверный']}]);
 T('b35',2,'bash','Сколько раз слово встречается','cnt.sh','В @@poem.txt — текст. Создайте @@cnt.sh: принимает слово и выводит, сколько раз оно встречается в файле (не строк, а вхождений; регистр не важен).','grep -oi слово | wc -l',
  '#!/bin/bash\ngrep -oi "$1" $HOME/poem.txt | wc -l\n',[{l:'«сеть» → 4',a:['сеть'],lines:['4']},{l:'«порт» → 1',a:['порт'],lines:['1']}],{'poem.txt':'Сеть и сеть, сеть да порт\nкаждая СЕТЬ нужна\n'});
 T('b36',3,'bash','Меню команд из stdin','menu.sh','Создайте @@menu.sh: читает слово из stdin (read) и по нему (case) выводит: start → «Запуск», stop → «Остановка», status → «Работает», иначе «Неизвестная команда».','read c; case "$c" in …',
  '#!/bin/bash\nread c\ncase "$c" in\n  start) echo Запуск;;\n  stop) echo Остановка;;\n  status) echo Работает;;\n  *) echo Неизвестная команда;;\nesac\n',[{l:'start → Запуск',in:'start\n',lines:['Запуск']},{l:'stop → Остановка',in:'stop\n',lines:['Остановка']},{l:'status → Работает',in:'status\n',lines:['Работает']},{l:'abc → Неизвестная команда',in:'abc\n',lines:['Неизвестная команда']}]);
 T('b37',3,'bash','Права для конфигов','perm.sh','В каталоге @@etc лежат файлы *.conf и *.txt. Создайте @@perm.sh: устанавливает права 640 только на *.conf и выводит «Изменено: N».','chmod 640',
  '#!/bin/bash\nn=0\nfor f in $HOME/etc/*.conf; do\n  chmod 640 "$f"\n  n=$((n+1))\ndone\necho "Изменено: $n"\n',[{l:'выводит «Изменено: 2»',has:['Изменено: 2']}],{'etc/a.conf':'a\n','etc/b.conf':'b\n','etc/c.txt':'c\n'});
 T('b38',2,'bash','Взрослые из CSV с разделителем ;','adult.sh','В @@people.txt — строки «имя;возраст». Создайте @@adult.sh: выводит имена тех, кому 18 и больше, по одному в строке в порядке файла (IFS=; read).','while IFS=";" read -r n a',
  '#!/bin/bash\nwhile IFS=";" read -r n a; do\n  if [ "$a" -ge 18 ]; then echo "$n"; fi\ndone < $HOME/people.txt\n',[{l:'для people.txt из задания: Антон, Вера',lines:['Антон','Вера']}],{'people.txt':'Антон;19\nБорис;16\nВера;18\nГлеб;17\n'});
 T('b39',2,'bash','Сортировка по числовому полю','top.sh','В @@scores.csv — строки «имя,баллы». Создайте @@top.sh: выводит три строки с наибольшими баллами (от большего к меньшему).','sort -t, -k2 -nr | head -3',
  '#!/bin/bash\nsort -t, -k2 -nr $HOME/scores.csv | head -3\n',[{l:'для scores.csv из задания',lines:['ира,95','петя,88','коля,70']}],{'scores.csv':'коля,70\nира,95\nмаша,41\nпетя,88\nсаша,59\n'});
 T('b40',3,'bash','Отчёт через heredoc','rep.sh','Создайте @@rep.sh: принимает имя и создаёт файл @@report.txt из трёх строк через heredoc: «Отчёт», «Автор: <имя>», «Статус: готов». Затем выводит «Создан report.txt».','cat > f <<EOF',
  '#!/bin/bash\ncat > $HOME/report.txt <<EOF\nОтчёт\nАвтор: $1\nСтатус: готов\nEOF\necho "Создан report.txt"\n',[{l:'вывод «Создан report.txt»',a:['Анна'],has:['Создан report.txt']}]);
 SXT[SXT.length-1].chk=dd=>{const R=sxChkRun(dd,SXB+'rep.sh',[{l:'вывод «Создан report.txt»',a:['Анна'],has:['Создан report.txt']}]);const c=sxRd(dd,SXB+'report.txt');R.push(['report.txt: «Автор: Анна» и «Статус: готов»',!!c&&/Отчёт\nАвтор: Анна\nСтатус: готов/.test(c)]);return R};
 // ---------- cmd ----------
 T('c6',1,'cmd','bat: файл существует?','ex.bat','Создайте @@ex.bat: принимает имя файла и выводит «Найден», если файл есть, иначе «Не найден».','if exist "%~1" (…) else (…)',
  '@echo off\nif exist "%~1" (\n  echo Найден\n) else (\n  echo Не найден\n)\n',[{l:'ex.bat ex.bat → Найден',a:['ex.bat'],lines:['Найден']},{l:'ex.bat nofile.zzz → Не найден',a:['nofile.zzz'],lines:['Не найден']}]);
 T('c7',2,'cmd','bat: подсчёт файлов по маске','cnt.bat','В каталоге @@docs лежат файлы. Создайте @@cnt.bat: считает файлы *.txt (for) и выводит «Файлов: N».','for %%f in (docs\\*.txt) do set /a n+=1',
  '@echo off\nset n=0\nfor %%f in (docs\\*.txt) do set /a n+=1\necho Файлов: %n%\n',[{l:'выводит «Файлов: 3»',lines:['Файлов: 3']}],{'docs/a.txt':'1\n','docs/b.txt':'2\n','docs/c.txt':'3\n','docs/d.log':'4\n'});
 T('c8',2,'cmd','bat: меньшее из двух чисел','min.bat','Создайте @@min.bat: принимает два числа и выводит меньшее.','if %1 LSS %2',
  '@echo off\nif %1 LSS %2 (\n  echo %1\n) else (\n  echo %2\n)\n',[{l:'7 3 → 3',a:['7','3'],lines:['3']},{l:'2 9 → 2',a:['2','9'],lines:['2']}]);
 T('c9',2,'cmd','bat: возведение в степень','pow.bat','Создайте @@pow.bat: принимает основание и показатель и выводит результат (цикл for /l и set /a).','set /a r*=%1',
  '@echo off\nset r=1\nfor /l %%i in (1,1,%2) do set /a r*=%1\necho %r%\n',[{l:'2 10 → 1024',a:['2','10'],lines:['1024']},{l:'5 3 → 125',a:['5','3'],lines:['125']}]);
 // ---------- PowerShell ----------
 T('p7',1,'ps','PowerShell: сумма массива','sum.ps1','Создайте @@sum.ps1 с параметром -N: выводит сумму чисел от 1 до N (используйте диапазон 1..$N).','(1..$N | Measure-Object -Sum).Sum',
  'param([int]$N)\n$s = 0\nforeach ($i in 1..$N) { $s += $i }\nWrite-Output $s\n',[{l:'-N 10 → 55',a:['-N','10'],lines:['55']},{l:'-N 100 → 5050',a:['-N','100'],lines:['5050']}]);
 T('p8',2,'ps','PowerShell: чётные из диапазона','even.ps1','Создайте @@even.ps1 с параметром -N: выводит чётные числа от 1 до N через пробел в одной строке.','Where-Object { $_ % 2 -eq 0 }',
  'param([int]$N)\n$r = @()\nforeach ($i in 1..$N) { if ($i % 2 -eq 0) { $r += $i } }\nWrite-Output ($r -join " ")\n',[{l:'-N 10 → 2 4 6 8 10',a:['-N','10'],lines:['2 4 6 8 10']},{l:'-N 5 → 2 4',a:['-N','5'],lines:['2 4']}]);
 T('p9',2,'ps','PowerShell: функция','fn.ps1','Создайте @@fn.ps1: функция Get-Square возвращает квадрат числа; скрипт с параметром -N выводит «N в квадрате = результат».','function Get-Square($x) { $x * $x }',
  'param([int]$N)\nfunction Get-Square($x) { return $x * $x }\n$r = Get-Square $N\nWrite-Output "$N в квадрате = $r"\n',[{l:'-N 6 → «6 в квадрате = 36»',a:['-N','6'],lines:['6 в квадрате = 36']},{l:'-N 11 → «11 в квадрате = 121»',a:['-N','11'],lines:['11 в квадрате = 121']}]);
 T('p10',2,'ps','PowerShell: длина слов','len.ps1','Создайте @@len.ps1: для каждого слова из массива @("сеть","маршрутизатор","порт") выводит «слово: длина» (foreach).','$w.Length',
  '$words = @("сеть","маршрутизатор","порт")\nforeach ($w in $words) { Write-Output "${w}: $($w.Length)" }\n',[{l:'три строки «слово: длина»',lines:['сеть: 4','маршрутизатор: 13','порт: 4']}]);
}
{const m=MAN.find(x=>/Скрипты \(bash/.test(x[0]));if(m)m[1]=m[1].replace(/\d+ заданий/,SXT.length+' заданий')}
// пулы конкурсных модулей расширены новыми заданиями (больше вариативности В и Г)
SXPOOL.b.push('b26','b32','b37','b28','b25','b22');
SXPOOL.g.push('b27','b29','b35','b36','b38','b39','b40','b34','b21','b16');
SXPOOL.ge.push('b22','b28','b38','b26');
MAN.push(['Т36. Ещё 27 заданий по скриптам',`<h3>Что добавлено</h3><p>В окне «Скрипты → Задания» теперь ${SXT.length} заданий: к прежним добавлены 19 по bash (wc, awk, sed -i, getopts-подобные аргументы, regex проверка IP, case и read, heredoc, IFS, сортировка по полю, chmod, массовое переименование), 4 по cmd (exist, for по маске, if LSS, степень) и 4 по PowerShell (param, foreach, функции, -join). Все проверяются автоматически несколькими запусками с разными данными.</p>
<p>Новые bash-задания также попали в пулы модулей «В. Администрирование Linux» и «Г. DevOps» режима «Профессионалы» и модуля «В» режима ГИА — варианты стали разнообразнее.</p>`]);
