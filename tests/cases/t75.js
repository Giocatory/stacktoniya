(function(){const R=[];const ok=(n,c,i)=>R.push((c?'PASS ':'FAIL ')+n+(c?'':' '+String(i||'').slice(0,300)));
try{run('share');ok('панель открывается командой',!md.hidden&&/Совместная работа/.test(mb.innerHTML)&&/Ссылка на копию/.test(mb.innerHTML));
 ok('пункт меню',!!document.getElementById('bcol'));ok('Т47',MAN.some(x=>/^Т47/.test(x[0])));
 ok('колбэк-опросник выключен без подключения',!CLB.timer&&!CLB.bc);
 return colPack('{"devs":[],"links":[]}').then(c=>colUnpack(c)).then(j=>{ok('упаковка/распаковка',j==='{"devs":[],"links":[]}',j);try{colCheck('{"x":1}');ok('не-схема отвергается',false)}catch(e){ok('не-схема отвергается',/не схема/.test(e.message))}return R.join('\n')})
}catch(e){R.push('ERR '+e.stack)}return R.join('\n')})()
