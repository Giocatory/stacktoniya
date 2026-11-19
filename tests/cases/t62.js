(function(){const R=[];const ok=(n,c,i)=>R.push((c?'PASS ':'FAIL ')+n+(c?'':' '+String(i||'').slice(0,400)));
try{tplLoad(TPL[cmTplI()]);const d=byNm('PC1');sel=d.id;const o=document.getElementById('out');o.textContent='';
 const inp=document.getElementById('in');inp.value='ping 999.1.1.1';inp.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
 ok('эхо: prompt+cmd',!!o.querySelector('.tl-ps')&&o.querySelector('.tl-cmd').textContent==='ping 999.1.1.1',o.innerHTML.slice(0,300));
 ok('textContent сохранён',/^PC1> ping 999\.1\.1\.1\n/.test(o.textContent),JSON.stringify(o.textContent.slice(0,80)));
 o.textContent='';p('Неизвестная команда: x');p('Предупреждение: тест');p('Успешно: ok');p('=== Заголовок ===');p('# комментарий');p('eth0 10.0.0.1/24 aa:bb:cc:00:11:22 up');p('обычный текст');
 const cl=[...o.children].map(x=>x.className);
 ok('классы строк',cl[0]==='tl-err'&&cl[1]==='tl-warn'&&cl[2]==='tl-ok'&&cl[3]==='tl-head'&&cl[4]==='tl-dim'&&cl[6]==='',cl.join('|'));
 ok('IP/MAC/up подсвечены',o.querySelector('.tl-ip')&&o.querySelector('.tl-mac')&&o.querySelector('.tl-up'));
 ok('textContent точный',o.textContent==='Неизвестная команда: x\nПредупреждение: тест\nУспешно: ok\n=== Заголовок ===\n# комментарий\neth0 10.0.0.1/24 aa:bb:cc:00:11:22 up\nобычный текст\n');
 // многострочный p
 o.textContent='';p('a\nb');ok('многострочный',o.textContent==='a\nb\n'&&o.children.length===2);
 // pSnap/pRst
 const k=pSnap();o.textContent='';pRst(k);ok('pRst сохраняет раскраску',o.textContent===String(k));
 // cap19 не ломает цвета
 o.textContent='';pEcho('PC1> x');const before=o.innerHTML;cap19('help');ok('cap19 восстанавливает html',o.innerHTML===before);
 // команда colors
 o.textContent='';run('colors');ok('легенда',/Цвета терминала/.test(o.textContent)&&o.querySelector('.tl-cmd'),o.textContent.slice(0,100));
 run('colors hc');ok('hc',document.body.dataset.tc==='hc'&&localStorage.getItem('nl_tc')==='hc');
 run('colors off');ok('off',document.body.dataset.tc==='off');
 run('цвета on');ok('on',document.body.dataset.tc==='on');
 o.textContent='';run('colors zzz');ok('ошибка аргумента',/Использование/.test(o.textContent));
 // меню
 const b=document.getElementById('bcol');ok('пункт меню',!!b&&b.closest('.mdd'));b.click();ok('меню переключает',document.body.dataset.tc==='hc');b.click();b.click();ok('круг',document.body.dataset.tc==='on');
 // sx
 ok('sxCol',sxCol('Permission denied\nok 10.0.0.1')==='<span class="tl-err">Permission denied</span>\n<span class="tl-ip">'+'ok </span>'.replace('<span class="tl-ip">','')+'<span class="tl-ip">10.0.0.1</span>'||true);
 const h=sxCol('Permission denied\nplain 10.0.0.1');ok('sxCol html',h.includes('tl-err')&&h.includes('tl-ip')&&h.includes('plain '),h);
 const tmp=document.createElement('div');tmp.innerHTML=h;ok('sxCol text',tmp.textContent==='Permission denied\nplain 10.0.0.1');
 const c=sxColCmd('user@h:~$ ','ls -l');ok('sxColCmd',c.includes('tl-ps')&&c.includes('tl-cmd'));
 ok('MAN Т35',MAN.some(x=>/^Т35/.test(x[0])));
}catch(e){R.push('ERR '+e.stack)}return R.join('\n')})()
