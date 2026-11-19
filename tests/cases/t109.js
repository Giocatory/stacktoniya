const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
const go=(c)=>{const d=S.devs[0]||null;sel=d?d.id:sel;const o=out.textContent.length;try{run(c)}catch(e){console.log('ERR',c,e.message)}return out.textContent.slice(o)};
tplLoad(TPL[0]);
ok(QZ_Q.length===48,'48 questions');
ok(QZ_Q.every(q=>q.length===5&&q[3].length===3&&new Set([q[2],...q[3]]).size===4&&QZ_T[q[0]]&&q[4].length>20),'structure');
ok(Object.keys(QZ_T).every(t=>QZ_Q.filter(q=>q[0]===t).length===8),'8 per topic');
ok(new Set(QZ_Q.map(q=>q[1])).size===48,'unique texts');
// correct-option position distribution after shuffle
let t=go('quiz topics');ok(/osi/.test(t)&&/48/.test(t),'topics');
t=go('quiz all 10');ok(/Вопрос 1 из 10/.test(t)&&/a\)/.test(t)&&/d\)/.test(t)&&QZ.q.length===10,'start');
for(let i=0;i<10;i++){const l='abcd'[QZ.ci];t=go('quiz '+l);if(i<9)ok(/✔ Верно/.test(t)&&/Вопрос \d+ из 10/.test(t),'q'+(i+1)+' correct');}
ok(/Верно: 10 из 10 \(100%\). Оценка: 5/.test(t)&&/Ошибок нет/.test(t)&&QZ===null,'perfect run');
go('quiz route 8');let wrongs=0;for(let i=0;i<8;i++){const l='abcd'[(QZ.ci+1)%4];t=go('quiz '+l);if(i<7)ok(/✖ Неверно/.test(t),'wrong q'+(i+1));}
ok(/Верно: 0 из 8 \(0%\). Оценка: 2/.test(t)&&/Повторите темы: Маршрутизация \(ошибок: 8\)/.test(t),'all wrong -> 2');
go('quiz sec 4');t=go('quiz a');t=go('quiz 2');t=go('quiz c');t=go('quiz answer d');ok(QZ===null&&/Оценка/.test(t),'answer / digits');
ok(/не запущен/.test(go('quiz a')),'no test running');ok(/Использование/.test(go('quiz foo')),'usage');
go('quiz all 3');ok(/остановлен/.test(go('quiz stop'))&&QZ===null,'stop');ok(/не запущен/.test(go('quiz stop')),'stop idle');
go('quiz osi 100');ok(QZ.q.length===8,'cap by topic size');go('quiz stop');go('quiz all 1');ok(QZ.q.length===3,'min 3');go('quiz stop');
// grading thresholds
const grade=(c,n)=>{go('quiz all '+n);for(let i=0;i<n;i++){const l=i<c?'abcd'[QZ.ci]:'abcd'[(QZ.ci+1)%4];t=go('quiz '+l)}return t};
ok(/Оценка: 4/.test(grade(8,10)),'80% -> 4');ok(/Оценка: 3/.test(grade(5,10)),'50% -> 3');ok(/Оценка: 2/.test(grade(4,10)),'40% -> 2');ok(/Оценка: 5/.test(grade(9,10)),'90% -> 5');
ok(MAN.some(m=>/Т72/.test(m[0])),'manual');
