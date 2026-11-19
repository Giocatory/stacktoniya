(function(){const R=[];const ok=(n,c,i)=>R.push((c?'PASS ':'FAIL ')+n+(c?'':' '+String(i||'').slice(0,300)));
try{tplLoad(TPL[cmTplI()]);const d=byNm('PC1');sel=d.id;const o=document.getElementById('out');o.textContent='';const ta=document.getElementById('neda');
 const key=(k,o2)=>{const ev=new KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true,...(o2||{})});(document.getElementById('nedc').hidden?ta:document.getElementById('nedc')).dispatchEvent(ev)};
 const type=s=>[...s].forEach(c=>key(c));
 run('nano note.txt');ok('nano открылся',NED.on&&NED.mode==='nano'&&!document.getElementById('ned').hidden,o.textContent);
 ta.value='строка1\nстрока2\nстрока3\n';ta.setSelectionRange(0,0);key('k',{ctrlKey:true});ok('^K вырезает строку',ta.value==='строка2\nстрока3\n'&&NED.cut==='строка1\n');key('u',{ctrlKey:true});ok('^U вставляет',ta.value==='строка1\nстрока2\nстрока3\n');
 key('o',{ctrlKey:true});const f=sxRd(d,SXH+'/note.txt');ok('^O записывает файл',f==='строка1\nстрока2\nстрока3\n',JSON.stringify(f));
 ta.value+='ещё\n';key('x',{ctrlKey:true});ok('^X с изменениями спрашивает',/Сохранить изменения/.test(document.getElementById('nedm').textContent)&&NED.on);key('n');ok('N — выход без сохранения',!NED.on&&sxRd(d,SXH+'/note.txt')==='строка1\nстрока2\nстрока3\n');
 // vim
 run('vim v.txt');ok('vim открылся (новый файл)',NED.on&&NED.mode==='vim'&&NED.vm==='n');
 key('i');ok('i → вставка',NED.vm==='i');ta.value='alpha\nbeta\ngamma\ndelta\n';ta.setSelectionRange(0,0);key('Escape');ok('Esc → команды',NED.vm==='n'&&ta.readOnly);
 key('j');ok('j вниз',edLC().l===2);key('d');key('d');ok('dd удаляет строку',ta.value==='alpha\ngamma\ndelta\n',JSON.stringify(ta.value));key('p');ok('p вставляет строку после',ta.value==='alpha\ngamma\nbeta\ndelta\n',JSON.stringify(ta.value));
 key('u');ok('u отменяет',ta.value==='alpha\ngamma\ndelta\n',JSON.stringify(ta.value));key('g');key('g');ok('gg в начало',ta.selectionStart===0);key('G');ok('G в конец',edLC().l>=3);
 key('g');key('g');key('2');key('d');key('d');ok('2dd удаляет две строки',ta.value==='delta\n',JSON.stringify(ta.value));
 key('o');ta.value='delta\nnew';ta.setSelectionRange(ta.value.length,ta.value.length);key('Escape');
 key(':');const c=document.getElementById('nedc');ok('командная строка',!c.hidden&&c.value===':');c.value=':q';key('Enter');ok(':q с изменениями — ошибка E37',NED.on&&/E37/.test(document.getElementById('nedm').textContent));
 key(':');c.value=':wq';key('Enter');ok(':wq сохраняет и выходит',!NED.on&&/delta\nnew/.test(sxRd(d,SXH+'/v.txt')||''),JSON.stringify(sxRd(d,SXH+'/v.txt')));
 run('vi v.txt');key('/');c.value='/new';key('Enter');ok('поиск /new',ta.selectionStart===ta.value.indexOf('new'));key(':');c.value=':q!';key('Enter');ok(':q! выходит',!NED.on);
 run('cat v.txt');ok('cat видит файл после редактора',/delta/.test(o.textContent));
 run('nano');ok('nano без имени — сообщение',/укажите имя файла/.test(o.textContent));
 ok('MAN Т43',MAN.some(x=>/^Т43/.test(x[0])));
}catch(e){R.push('ERR '+e.stack)}return R.join('\n')})()
