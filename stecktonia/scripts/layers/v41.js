// ===== v41: линтер скриптов (подсказки по стилю и типичным ошибкам, как shellcheck) =====
const LNT={
 bash:[
  [/^(?!#!)/,0,'first','Нет строки #!/bin/bash в начале файла — укажите интерпретатор.','info'],
  [/(^|[^\\"'])\$\{?[A-Za-z_]\w*\}?(?=[^"']*$)(?<!["'])/,1,'unq','Переменная без кавычек: при пробелах в значении слово разобьётся. Пишите "$var".','warn',l=>/^\s*(echo|printf)\b.*"/.test(l)||/^\s*#/.test(l)||/\[\[|\(\(|=\$\(|^\s*\w+=/.test(l)||/"[^"]*\$/.test(l)?false:/\b(rm|cp|mv|cat|cd|mkdir|grep|ls|touch|wc|head|tail|sort|test)\b[^|;&]*\$[A-Za-z_{]/.test(l)],
  [/\[\s+\$[A-Za-z_]\w*\s+(=|==|-eq|-gt|-lt|-ne|-ge|-le)\s/,1,'tst','В [ ] переменная без кавычек: при пустом значении будет ошибка «unary operator expected». Пишите [ "$x" = … ].','warn'],
  [/`[^`]+`/,1,'bt','Обратные кавычки устарели — используйте $(команда).','info'],
  [/^\s*cd\s+[^|;&]+$/,1,'cd','После cd лучше проверять успех: cd каталог || exit 1.','warn'],
  [/\brm\s+-[a-zA-Z]*r[a-zA-Z]*f?\s+\$[A-Za-z_{]/,1,'rm','rm -rf с переменной без проверки опасен: пустая переменная удалит не то. Проверьте её и поставьте кавычки.','err'],
  [/\bfor\s+\w+\s+in\s+\$\(\s*ls\b/,1,'ls','Не разбирайте вывод ls в цикле — используйте шаблон: for f in *.txt.','warn'],
  [/\bcat\s+[^|;&<>]+\|\s*(grep|wc|sort|head|tail|awk)\b/,1,'cat','Лишний cat: grep шаблон файл вместо cat файл | grep шаблон.','info'],
  [/\bread\s+(?!-r)\w/,1,'read','read без -r портит обратные слеши; обычно пишут read -r var.','info'],
  [/\becho\s+-e\b/,1,'echo','echo -e ведёт себя по-разному в разных оболочках; для переносимости используйте printf.','info']],
 cmd:[
  [/^(?!\s*@?echo\s+off)/i,0,'first','В начале нет @echo off — каждая команда будет выводиться на экран.','info'],
  [/\bif\s+%~?\d\s*==/i,1,'q','Сравнение %1 без кавычек падает при пустом аргументе. Пишите if "%~1"=="…".','warn'],
  [/\bif\s+%\w+%\s*==/i,1,'q2','Сравнение %var% без кавычек падает при пустом значении. Пишите if "%var%"=="…".','warn'],
  [/\bset\s+\w+\s+=|\bset\s+\w+=.*\s+$/i,1,'sp','Пробел рядом с = в set попадает в имя или значение переменной: set x=5.','warn'],
  [/\bgoto\s+:?\w+\s*$/i,1,'goto','Проверьте, что метка существует и в конце скрипта есть goto :eof или exit /b — иначе выполнение «провалится» в следующий блок.','info',(l,all)=>{const m=/goto\s+:?(\w+)/i.exec(l);return!m||m[1].toLowerCase()==='eof'||!new RegExp('^\\s*:'+m[1]+'\\b','im').test(all)}],
  [/\bdel\s+(?!\/)[^\n]*\*/i,1,'del','del с маской без проверки опасно; добавьте /p для подтверждения или проверьте путь.','warn'],
  [/\bset\s+\/a\s+\w+\s*=\s*[^\n]*%[A-Za-z]\w*%[^\n]*%%/i,1,'pct','В set /a оператор остатка в .bat пишется %%.','warn']],
 ps:[
  [/\b(ls|dir|cat|type|rm|del|cp|copy|mv|move|echo|gc|ps|kill|sleep|cls|where|select|sort|foreach|%|\?)\s/,1,'alias','Псевдонимы удобны в консоли, но в скрипте лучше полные имена командлетов (Get-ChildItem, Get-Content, Remove-Item…).','info',l=>!/^\s*(#|"|')/.test(l)&&/^\s*(ls|dir|cat|type|rm|del|cp|copy|mv|move|gc|ps|kill|sleep|cls|where|select|sort)\s/.test(l)||/\|\s*(%|\?|foreach|where|select|sort)\s/.test(l)],
  [/\bRemove-Item\b[^|\n]*-Recurse[^|\n]*\$\w+/i,1,'rm','Remove-Item -Recurse с переменной: проверьте значение (Test-Path, не пусто) до удаления.','err'],
  [/\bWrite-Host\b/i,1,'wh','Write-Host не попадает в конвейер; для данных используйте Write-Output или просто выражение.','info'],
  [/\bif\s*\(\s*\$\w+\s*=[^=]/,1,'eq','В условии стоит присваивание «=», вероятно нужно сравнение -eq.','err'],
  [/\$\w+\s*=\s*Get-Content[^\n|]*\n/i,1,'gc','Get-Content читает файл построчно в массив; для одной строки результат может быть не массивом — оберните в @().','info',()=>false],
  [/-(gt|lt|ge|le|eq|ne)\s+['"]\d+['"]/i,1,'strcmp','Число в кавычках сравнивается как строка. Уберите кавычки или приведите тип: [int]$x.','warn'],
  [/\bfor(each)?\s*\([^)]*\)\s*\{\s*\}/i,1,'empty','Пустое тело цикла.','warn']]};
function lintRun(sh,src){const lines=src.replace(/\r/g,'').split('\n'),R=[];const rules=LNT[sh]||[];
 rules.forEach(([re,perLine,id,msg,lv,filt])=>{
  if(!perLine){if(re.test(lines.find(l=>l.trim()!=='')||''))R.push({ln:1,id,msg,lv});return}
  lines.forEach((l,i)=>{if(/^\s*(#|rem\b|::)/i.test(l))return;if(re.test(l)&&(!filt||filt(l,src)))R.push({ln:i+1,id,msg,lv})})});
 return R.sort((a,b)=>a.ln-b.ln)}
function sxuLint(){const ta=sxq('#sxed');if(ta)SXU.buf=ta.value;const sh=SXU.file&&sxShellOf(SXU.file);if(!sh)return;
 const R=lintRun(sh,SXU.buf||'');const o=sxq('#sxout');let pn=sxq('#sxlt');if(!pn){pn=document.createElement('div');pn.id='sxlt';pn.style.cssText='border:1px solid var(--bd);border-radius:6px;padding:8px;margin-top:6px;font-size:13px;background:var(--pn)';o.parentNode.insertBefore(pn,o.nextSibling)}
 const ic={err:'⛔',warn:'⚠️',info:'💡'};
 pn.innerHTML=`<div class="sxr"><b>🧹 Линтер: ${R.length?'замечаний '+R.length:'замечаний нет'}</b><span style="flex:1"></span><button id="ltx">Закрыть</button></div>`+(R.length?R.map(r=>`<div data-ln="${r.ln}" style="cursor:pointer;padding:2px 0">${ic[r.lv]} <b>строка ${r.ln}</b>: ${sxE(r.msg)}</div>`).join(''):'<div>Типичных проблем не найдено. Линтер проверяет только шаблонные случаи и не заменяет запуск и проверку.</div>');
 pn.querySelectorAll('[data-ln]').forEach(e=>e.onclick=()=>{const ln=+e.dataset.ln;SXU.errln=ln;const t=sxq('#sxed');if(t)t.scrollTop=Math.max(0,(ln-3)*19);sxuGut()});
 sxq('#ltx').onclick=()=>{pn.remove();SXU.errln=0;sxuGut()}}
{const _e=sxuEd;sxuEd=function(el){_e(el);const b=sxq('#sxrn');if(!b||!SXU.file||!sxShellOf(SXU.file)||sxq('#sxlb'))return;
 const x=document.createElement('button');x.id='sxlb';x.textContent='🧹 Линтер';x.title='Подсказки по типичным ошибкам и стилю';x.onclick=sxuLint;b.parentNode.insertBefore(x,b.nextSibling)}}
