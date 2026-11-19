// Запуск всех тестов: node run.js [маска]   (например: node run.js t11)
// Каждый файл из cases/ выполняется в загруженном симуляторе; строки PASS/FAIL считаются.
const {spawnSync}=require('child_process'),fs=require('fs'),path=require('path');
const mask=process.argv[2]||'';
const files=fs.readdirSync(path.join(__dirname,'cases')).filter(f=>/^t\d+[a-z]*\.js$/.test(f)&&f.includes(mask))
 .sort((a,b)=>parseInt(a.slice(1))-parseInt(b.slice(1))||a.localeCompare(b));
let P=0,F=0,E=0;
for(const f of files){
 const r=spawnSync('node',[path.join(__dirname,'harness.js'),path.join(__dirname,'cases',f)],{encoding:'utf8',timeout:120000});
 const o=(r.stdout||'')+(r.stderr||''),p=(o.match(/^PASS/gm)||[]).length,fl=(o.match(/^FAIL/gm)||[]).length,er=/TESTERR/.test(o)||r.status!==0?1:0;
 P+=p;F+=fl;E+=er;
 console.log((fl||er?'✗ ':'✓ ')+f.padEnd(10)+` ok=${p} fail=${fl}${er?' ОШИБКА':''}`);
 if(fl||er)console.log(o.split('\n').filter(l=>/^FAIL|TESTERR|errors:/.test(l)).join('\n'));
}
console.log(`\nИтого: файлов ${files.length}, проверок ${P+F}, успешно ${P}, провалено ${F}, ошибок запуска ${E}`);
process.exit(F||E?1:0);
