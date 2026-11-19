(function(){const R=[];const ok=(n,c,i)=>R.push((c?'PASS ':'FAIL ')+n+(c?'':' '+String(i||'').slice(0,400)));
try{tplLoad(TPL[0]);const pcs=S.devs.filter(d=>d.t==='pc').map(d=>d.name);
 ASG=null;ASGD={title:'Тест',text:'Условие',author:'Преп',useS:true,crit:[{type:'ping',f1:pcs[0],f2:pcs[1],f3:'',exp:'yes',w:2},{type:'dev',f1:'Nope',f2:'',f3:'',exp:'yes',w:1},{type:'cnt',f1:'3',f2:'',f3:'',exp:'yes',w:1},{type:'ip',f1:pcs[0],f2:'192.168.1.',f3:'',exp:'yes',w:1}]};
 asgForm();ok('конструктор рендерится',document.getElementById('as_t')&&document.querySelector('[data-af="type"]'));
 // сохранить задание: перехватим asgDl
 let saved=null;const dl0=asgDl;asgDl=(n,t)=>{saved={n,t}};
 document.querySelector('[data-x="as_save"]').click();ok('файл задания скачан',!!saved&&/nlassign/.test(saved.n),JSON.stringify(saved).slice(0,100));
 const j=JSON.parse(saved.t);ok('в файле схема и 4 критерия',j.kind==='nl-assign'&&j.crit.length===4&&!!j.scheme);
 // загрузка
 S={devs:[],links:[],cfg:[]};try{S=JSON.parse(JSON.stringify(S))}catch(e){}
 ok('asgLoad',asgLoad(j));ok('схема восстановлена',S.devs.length===j.scheme.devs.length);
 const R1=asgEval();ok('оценка критериев',R1.max===5&&R1.score>=3&&R1.crit[1].ok===false,JSON.stringify(R1.crit.map(c=>c.ok)));
 ok('asgPanel рендерится',(asgPanel(),document.getElementById('mb').innerHTML.includes('Сдать работу')));
 // сдача
 saved=null;document.getElementById('as_n').value='Иванов Иван';document.getElementById('as_g').value='ИС-41';document.querySelector('[data-x="as_sub"]').click();
 ok('файл сдачи',!!saved&&/nlsub/.test(saved.n));const sub=JSON.parse(saved.t);
 const{seal,kind,v,...o}=sub;ok('печать верна',nlSeal(o)===sub.seal);o.score=99;ok('печать ловит правку',nlSeal(o)!==sub.seal);
 ok('в сдаче подпись схемы',sub.sig.length>0,sub.sig.length);
 window.__sub=sub;asgDl=dl0;
 ok('NL_PAGES.journal',typeof NL_PAGES.journal==='string'&&NL_PAGES.journal.length>2000);ok('MAN Т38',MAN.some(x=>/^Т38/.test(x[0])));
 ok('пункт меню',!!document.getElementById('basg'));
 // тип sx
 ASG={crit:[{type:'sx',f1:'b23',w:1}]};const Rs=asgEval();ok('sx-критерий без решения не выполнен',Rs.score===0,JSON.stringify(Rs));
 const d=sxTD();ok('есть устройство для скриптов',!!d);
}catch(e){R.push('ERR '+e.stack)}return R.join('\n')})()
