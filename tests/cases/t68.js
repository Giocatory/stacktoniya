(function(){const R=[];const ok=(n,c,i)=>R.push((c?'PASS ':'FAIL ')+n+(c?'':' '+String(i||'').slice(0,300)));
try{tplLoad(TPL[0]);sel=byNm('PC1').id;const o=document.getElementById('out');o.textContent='';
 run('rec start');ok('запись включена',RECX.on&&!document.getElementById('recbd').hidden);
 const i=document.getElementById('in');i.value='ipconfig';i.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));run('ping 192.168.1.11');
 ok('события записаны',RECX.ev.length>=3&&RECX.ev.some(e=>e.k==='c')&&RECX.ev.some(e=>e.k==='o'),JSON.stringify(RECX.ev.slice(0,3)));
 ok('вывод не нарушен',/PC1> ipconfig/.test(o.textContent)&&o.querySelector('.tl-cmd'));
 run('rec stop');ok('остановлена, окно открыто',!RECX.on&&!document.getElementById('rpw').hidden&&RP.ev.length===RECX.ev.length);
 const out=document.getElementById('rpo');ok('воспроизведён полный текст',/ipconfig/.test(out.textContent)&&out.querySelector('.tl-cmd')&&out.querySelector('.tl-ps'));
 RP.i=1;rpDraw();ok('перемотка',out.textContent.length<document.getElementById('rpo').textContent.length+1&&/rps/.test(document.getElementById('rps').id)&&document.getElementById('rps').value==='1');
 rpPlay();ok('кнопка пауза при воспроизведении',/Пауза/.test(document.getElementById('rpg').textContent));rpStop();
 // сдача с записью
 ASG={id:'x',title:'T',crit:[]};let saved=null;const dl0=asgDl;asgDl=(n,t)=>{saved=t};asgPanel();document.getElementById('as_n').value='Тест';document.querySelector('[data-x="as_sub"]').click();asgDl=dl0;
 const sub=JSON.parse(saved);ok('запись в файле сдачи',Array.isArray(sub.rec)&&sub.rec.length>0);const{seal,kind,v,rec,...b}=sub;ok('печать не зависит от записи',nlSeal(b)===seal);
 document.getElementById('rpe').click();
 run('proj on');ok('проектор включён',document.body.classList.contains('proj')&&localStorage.getItem('nl_proj')==='1');run('proj off');ok('проектор выключен',!document.body.classList.contains('proj'));
 ok('пункты меню',['bproj','brec','bplay'].every(x=>document.getElementById(x)));ok('MAN Т40',MAN.some(x=>/^Т40/.test(x[0])));
}catch(e){R.push('ERR '+e.stack)}return R.join('\n')})()
