// ===== v42: «Сравнить с ожидаемым» — построчное сравнение вывода скрипта студента с ожиданием на каждом тесте =====
function rndCompare(t,d){const o=t.o;if(sxRd(d,t.file)===null)return'Файл '+t.file.slice(t.file.lastIndexOf('/')+1)+' не найден — создайте его в редакторе.';
 (o.clean||[]).forEach(c=>sxRm(sxFs(d),t.base+c,true));(o.files||[]).forEach(f=>sxPutF(d,t.base+f.n,f.c));
 const norm=s=>String(s||'').replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
 const cases=o.run?[{a:[],exp:o.run.exp,h:0,l:'запуск без аргументов'}]:(o.tests||[]).map((x,i)=>({a:x.a,exp:x.exp,h:x.h,files:x.files,l:'тест '+(i+1)+(x.a.length?': '+x.a.join(' '):'')}));
 let ok=0,hid=0,hidOk=0,out='';
 cases.forEach(c=>{(c.files||[]).forEach(f=>sxPutF(d,t.base+f.n,f.c));const r=sxRunFresh(d,t.file,c.a,'');const got=norm(r.o),err=String(r.e||'').trim();const same=JSON.stringify(got)===JSON.stringify(c.exp);
  if(c.h){hid++;if(same)hidOk++;return}if(same)ok++;
  out+=(same?'✅ ':'❌ ')+c.l+'\n';
  if(same)out+='   вывод совпал: '+(c.exp.slice(0,3).join(' / ')+(c.exp.length>3?' …':''))+'\n';
  else{const n=Math.max(got.length,c.exp.length);let k=0;for(;k<n;k++)if(got[k]!==c.exp[k])break;
   out+='   ожидалось: '+(c.exp.slice(0,6).join(' / ')||'(пусто)')+(c.exp.length>6?' …':'')+'\n   у вас:     '+(got.slice(0,6).join(' / ')||'(пусто)')+(got.length>6?' …':'')+'\n';
   out+=k<n?`   первое расхождение — строка вывода ${k+1}: ожидалось «${c.exp[k]===undefined?'(конец вывода)':c.exp[k]}», получено «${got[k]===undefined?'(конец вывода)':got[k]}»\n`:'';
   if(err)out+='   сообщение об ошибке: '+err.split('\n')[0]+'\n'}});
 const vis=cases.length-hid;
 return`Сравнение с ожидаемым выводом: видимых тестов пройдено ${ok} из ${vis}`+(hid?`; скрытых пройдено ${hidOk} из ${hid} (подробности скрыты)`:'')+'\n\n'+out}
{const _t=sxuTk;sxuTk=function(el){_t(el);if(!el||!el.querySelectorAll)return;
 el.querySelectorAll('button[data-a=sol]').forEach(b=>{const t=SXT.find(x=>x.id===b.dataset.k);if(!t||!t.rnd||t.sh==='git'||!t.o)return;
  const h=document.createElement('button');h.textContent='⚖ Сравнить с ожидаемым';h.title='Запустить ваш скрипт на тестах и показать, чем вывод отличается от ожидаемого';
  h.onclick=()=>{let r;try{r=rndCompare(t,SXU.d)}catch(e){r='Не удалось выполнить сравнение: '+e.message}SXU.tres[t.id]=r;sxuTk(el)};
  const dbgb=[...b.parentNode.children].find(x=>x.textContent==='💡 Подсказка');b.parentNode.insertBefore(h,dbgb||b)})}}
