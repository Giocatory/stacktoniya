// ===== v57: строка меню как в десктоп-программах (Файл · Правка · Сеть · Практика · Справка) с выпадающими списками =====
// Кнопки не пересоздаются, а переносятся в выпадающие панели: обработчики и id сохраняются, весь прежний код работает как раньше.
const MENUS=[
 ['Файл','f',[['bs','Пример','Загрузить учебный пример схемы'],['btpl','Шаблоны','Готовые схемы для лабораторных работ'],['bpl','План','Нарисовать план помещения и строить сеть по нему'],['-'],['bx','Экспорт/импорт','Сохранить схему в файл или загрузить из файла'],['brpf','Отчёт','Отчёт со схемой, адресацией и проверками'],['baddr','Адресация','Таблица адресации: документация и печать'],['-'],['bc','Очистить','Удалить все устройства и кабели']]],
 ['Правка','e',[['bu','↶ Отменить','Ctrl+Z'],['br','↷ Вернуть','Ctrl+Y']]],
 ['Сеть','n',[['bstp','STP','Протокол остовного дерева: включить или выключить'],['bq','QoS','Приоритизация трафика'],['-'],['bm','Мониторинг','Опрос устройств, SNMP, оповещения'],['btf','Трафик','Счётчики и захват трафика'],['bnf','NetFlow','Потоки и статистика по ним'],['bld','Нагрузка','Нагрузка на каналы'],['blg','Журнал','События сети и устройств'],['btl','Инструменты','Калькулятор подсетей, ping, трассировка и др.']]],
 ['Практика','p',[['bt','Задания','Задания лабораторных с автоматической проверкой'],['bsx','Скрипты','Редактор скриптов: bash, bat, PowerShell, Git'],['bfl','Аварии','Внести неисправность для тренировки поиска'],['bex','Экзамен','Экзаменационные задания с таймером'],['-','Режимы подготовки'],['bge','ГИА · ДЭ','Демонстрационный экзамен: единый сценарий, 3 модуля, 180 мин'],['bpr','Профессионалы','Чемпионатный формат: 4 модуля, дополнение заказчика, рейтинг']]],
 ['Справка','h',[['bh','Инструкция','Описание команд, возможностей и лабораторных'],['qhbtn','Подсказки «?»','Режим значков «?»: все / только ключевые / выключены']]]];
document.head.insertAdjacentHTML('beforeend',`<style>
#mbar{display:flex;gap:2px;align-items:center}
#mbar .mi{position:relative}
#mbar .mt{background:transparent;color:inherit;border:1px solid transparent!important;border-radius:6px;padding:4px 12px!important;font-size:13px!important;cursor:pointer;font-weight:600}
#mbar .mt:hover,#mbar .mi.open .mt{background:#ffffff26}
#mbar .mt u{text-decoration:underline;text-underline-offset:2px}
#mbar .mdd{display:none;position:absolute;left:0;top:100%;margin-top:3px;min-width:290px;background:var(--pn);color:var(--tx);border:1px solid var(--bd);border-radius:10px;box-shadow:0 8px 26px rgba(0,0,0,.35);padding:5px;z-index:60}
#mbar .mi.open .mdd{display:block}
#mbar .mdd button{display:flex!important;flex-direction:column;align-items:flex-start;width:100%;text-align:left;background:transparent!important;color:var(--tx)!important;border:0!important;border-radius:6px;padding:6px 12px!important;font-size:13px!important;cursor:pointer}
#mbar .mdd button:hover,#mbar .mdd button:focus{background:var(--ac)!important;color:#fff!important;outline:0}
#mbar .mdd button[data-d]::after{content:attr(data-d);font-size:11px;opacity:.65;font-weight:400;margin-top:1px}
#mbar .mdd hr{border:0;border-top:1px solid var(--bd);margin:4px 6px}
#mbar .mdd .mh{font-size:11px;opacity:.6;padding:4px 12px 1px;text-transform:uppercase;letter-spacing:.04em}
header .brk{flex-basis:100%;height:0;margin:0;padding:0}
#mbar+#mfill{flex:1}
@media(max-width:760px){#mbar .mt{padding:4px 7px!important}#mbar .mdd{min-width:240px}}
</style>`);
function mnInit(){const hd=document.querySelector('header');if(!hd||document.getElementById('mbar'))return;
 const bar=document.createElement('nav');bar.id='mbar';bar.setAttribute('role','menubar');const brand=hd.querySelector('b');brand.after(bar);
 const sp=document.createElement('span');sp.id='mfill';sp.className='sp';bar.after(sp);
 MENUS.forEach(([name,key,items])=>{const mi=document.createElement('div');mi.className='mi';mi.dataset.k=key;
  const mt=document.createElement('button');mt.className='mt';mt.type='button';mt.setAttribute('aria-haspopup','true');mt.setAttribute('aria-expanded','false');mt.innerHTML='<u>'+name.slice(0,1)+'</u>'+name.slice(1);mt.setAttribute('data-nohelp','1');mt.title=name;
  const dd=document.createElement('div');dd.className='mdd';dd.setAttribute('role','menu');
  items.forEach(it=>{if(it[0]==='-'){if(it[1]){const h=document.createElement('div');h.className='mh';h.textContent=it[1];dd.appendChild(h)}else dd.appendChild(document.createElement('hr'));return}
   const b=document.getElementById(it[0]);if(!b)return;b.setAttribute('role','menuitem');b.setAttribute('data-nohelp','1');if(it[2])b.setAttribute('data-d',it[2]);
   if(b.id!=='qhbtn'&&b.id!=='bstp'&&!b.textContent.trim())b.textContent=it[1];dd.appendChild(b)});
  mi.append(mt,dd);bar.appendChild(mi)});
 // вторая строка — панель инструментов
 const brk=document.createElement('span');brk.className='brk';const th=document.getElementById('bth');if(th)sp.after(th);(th||sp).after(brk);
 mnFit();}
const mnOpen=()=>document.querySelector('#mbar .mi.open');
function mnClose(){document.querySelectorAll('#mbar .mi.open').forEach(m=>{m.classList.remove('open');m.querySelector('.mt').setAttribute('aria-expanded','false')})}
function mnShow(mi){mnClose();mi.classList.add('open');mi.querySelector('.mt').setAttribute('aria-expanded','true');const dd=mi.querySelector('.mdd');dd.style.left='0px';const r=dd.getBoundingClientRect();let sh=0;if(r.right>innerWidth-6)sh=innerWidth-6-r.right;if(r.left+sh<6)sh=6-r.left;dd.style.left=sh+'px'}
function mnFit(){const hd=document.querySelector('header');if(!hd)return;const h=Math.round(hd.getBoundingClientRect().bottom)+6;['exm','cmp'].forEach(i=>{const e=document.getElementById(i);if(e)e.style.top=h+'px'})}
document.addEventListener('click',e=>{const mt=e.target.closest&&e.target.closest('#mbar .mt');
 if(mt){const mi=mt.parentNode;if(mi.classList.contains('open'))mnClose();else mnShow(mi);e.stopPropagation();return}
 if(e.target.closest&&e.target.closest('#mbar .mdd button')){setTimeout(mnClose,0);return}
 if(!e.target.closest||!e.target.closest('#mbar'))mnClose()},true);
document.addEventListener('mouseover',e=>{const mt=e.target.closest&&e.target.closest('#mbar .mt');if(mt&&mnOpen()&&mnOpen()!==mt.parentNode)mnShow(mt.parentNode)});
document.addEventListener('keydown',e=>{const o=mnOpen();
 if(e.key==='Escape'&&o){mnClose();return}
 if(e.altKey&&!e.ctrlKey&&!e.metaKey){const f=MENUS.find(m=>m[0].slice(0,1).toLowerCase()===e.key.toLowerCase());if(f){const mi=document.querySelector('#mbar .mi[data-k="'+f[1]+'"]');if(mi){e.preventDefault();mnShow(mi);const b=mi.querySelector('.mdd button');if(b)b.focus();return}}}
 if(!o)return;const items=[...o.querySelectorAll('.mdd button')],i=items.indexOf(document.activeElement);
 if(e.key==='ArrowDown'){e.preventDefault();items[(i+1)%items.length].focus()}
 else if(e.key==='ArrowUp'){e.preventDefault();items[(i-1+items.length)%items.length].focus()}
 else if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const all=[...document.querySelectorAll('#mbar .mi')],k=all.indexOf(o),n=all[(k+(e.key==='ArrowRight'?1:-1)+all.length)%all.length];e.preventDefault();mnShow(n);const b=n.querySelector('.mdd button');if(b)b.focus()}});
addEventListener('resize',mnFit);
mnInit();
// кнопки, добавленные другими слоями позже, не остаются в строке инструментов: складываем в «Справка»
try{new MutationObserver(ms=>{const hd=document.querySelector('header');ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1&&n.tagName==='BUTTON'&&n.parentNode===hd&&!n.dataset.t&&n.id!=='bth'){const dd=document.querySelector('#mbar .mi[data-k="h"] .mdd');if(dd){n.setAttribute('data-nohelp','1');if(n.title)n.setAttribute('data-d',n.title.slice(0,70));dd.appendChild(n)}}}));mnFit()}).observe(document.querySelector('header'),{childList:true})}catch(e){}
setTimeout(mnFit,300);
// подсказка в Инструкцию
MAN.push(['Т32. Строка меню',`<p>Все функции платформы собраны в строке меню над схемой — как в обычных программах: нажмите на название пункта, и откроется список.</p>
<table class="t"><tr><th>Меню</th><th>Что внутри</th></tr>
<tr><td><b>Файл</b></td><td>Пример, Шаблоны, План, Экспорт/импорт, Отчёт, Адресация, Очистить</td></tr>
<tr><td><b>Правка</b></td><td>Отменить, Вернуть</td></tr>
<tr><td><b>Сеть</b></td><td>STP, QoS, Мониторинг, Трафик, NetFlow, Нагрузка, Журнал, Инструменты</td></tr>
<tr><td><b>Практика</b></td><td>Задания, Скрипты, Аварии, Экзамен, режимы ГИА · ДЭ и Профессионалы</td></tr>
<tr><td><b>Справка</b></td><td>Инструкция и переключатель значков «?»</td></tr></table>
<p>Под строкой меню — панель инструментов для работы со схемой: Выбор, добавление устройств, разметка, кабель, трасса кабеля, тип и длина кабеля, Удалить. Справа — переключатель светлой и тёмной темы.</p>
<p><b>Управление:</b> когда один список открыт, наведите указатель на соседний пункт — он откроется сам. <b>Esc</b> закрывает список; <b>Alt</b>+первая буква пункта (например, Alt+Ф) открывает меню; стрелки ↑ ↓ перемещают по пунктам, ← → переходят между меню, Enter выбирает.</p>`]);
