(function(){const R=[];const ok=(n,c,i)=>R.push((c?'PASS ':'FAIL ')+n+(c?'':' '+String(i||'').slice(0,400)));
try{cmStart('ge','Тест',{variant:7,group:'Т'});
 cmFinish(false);const h=cmResultHtml();const A=cmAdvise();
 ok('раздел есть',/Разбор ошибок/.test(h));ok('есть рекомендации при пустом решении',A.length>0&&/<li><b>Модуль/.test(h),A.length);
 ok('протокол тоже',/Разбор ошибок/.test(cmResultHtml(true)));
 ok('MAN Т37',MAN.some(x=>/^Т37/.test(x[0])));
}catch(e){R.push('ERR '+e.stack)}return R.join('\n')})()
