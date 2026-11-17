// ===== v33: «Подсказка по ошибке» для заданий «Найди ошибку» (две ступени) =====
{const _m=rndMk;rndMk=function(rec){const t=_m(rec);if(!rec.dbg||!t.prep)return t;const _p=t.prep;t.dbgLv=0;
 t.prep=d=>{const msg=_p(d);const cur=sxRd?sxRd(d,t.file):null;t.brk=typeof cur==='string'?cur:(cur&&cur.c)||null;t.dbgLv=0;return msg};return t}}
function dbgHelp(t){if(!t.brk)return'Сначала нажмите «Подготовить среду» — тогда появится файл с ошибкой.';
 const a=t.brk.replace(/\r/g,'').split('\n'),b=((t.sh==='bash'?'':'')+t.sol).replace(/\r/g,'').split('\n');let n=-1;
 for(let i=0;i<Math.max(a.length,b.length);i++)if(a[i]!==b[i]){n=i;break}
 if(n<0)return'Не удалось определить строку.';
 t.dbgLv=(t.dbgLv||0)+1;const pth=t.file.slice(t.file.lastIndexOf('/')+1);
 if(t.dbgLv===1)return`Подсказка 1: ошибка в строке ${n+1} файла ${pth} (или рядом с ней). Нажмите ещё раз, чтобы увидеть, что именно не так.`;
 return`Подсказка 2: строка ${n+1} сейчас такая:\n  ${a[n]===undefined?'(строки нет)':a[n]}\nПравильный вариант выглядит так:\n  ${b[n]===undefined?'(строку нужно удалить)':b[n]}`}
{const _t=sxuTk;sxuTk=function(el){_t(el);if(!el||!el.querySelectorAll)return;
 el.querySelectorAll('button[data-a=sol]').forEach(b=>{const t=SXT.find(x=>x.id===b.dataset.k);if(!t||!t.dbg)return;
  const h=document.createElement('button');h.textContent='💡 Подсказка';h.title='Номер строки с ошибкой, затем сама строка';
  h.onclick=()=>{SXU.tres[t.id]=dbgHelp(t);sxuTk(el)};b.parentNode.insertBefore(h,b)})}}
