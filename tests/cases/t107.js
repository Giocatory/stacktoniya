const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
const bad=tplLoad(TPL.find(x=>/ACL: аудит правил/.test(x.n)));ok(!bad.length,'tpl '+JSON.stringify(bad));
const R1=byNm('R1');const go=(c)=>{sel=R1.id;const o=out.textContent.length;try{run(c)}catch(e){console.log('ERR',c,e.message)}return out.textContent.slice(o)};
let t=go('acl audit');console.log(t);ok(/никогда не сработает: перекрыто правилом 1/.test(t)&&/Найдено проблем: 2/.test(t),'audit finds 2');
t=go('acl test 192.168.1.10 192.168.2.10 tcp 22');console.log(t);ok(/правило 1/.test(t)&&/разрешено/.test(t),'test: permit any wins');
ok(/Удалено правило 3/.test(go('acl del 3')),'del');ok(/перенесено на позицию 2/.test(go('acl move 1 2')),'move');
t=go('acl audit');ok(/Перекрытых и избыточных правил нет/.test(t),'fixed list is clean');
go('acl permit any any');t=go('acl audit');ok(/избыточно: уже покрыто правилом 2/.test(t),'duplicate permit any detected');go('acl del 3');
ok(/ЗАПРЕЩЕНО/.test(go('acl test 192.168.1.10 192.168.2.10 tcp 22'))&&/разрешено/.test(go('acl test 192.168.1.10 192.168.2.10 tcp 80')),'ssh denied http allowed');
ok(/от 1 до/.test(go('acl del 9')),'range');ok(/Использование/.test(go('acl test x y')),'usage');ok(/Использование/.test(go('acl move 1 9')),'move range');
// pass-through of the old behaviour
t=go('acl');ok(/1\./.test(t),'plain acl still lists');
// exam
const x=EXNET.find(e=>/ACL: исправить/.test(e.n));x.start({});const cr=x.crit({}),R=byNm('R1');
const sc=()=>cr.map(c=>c[2]()?c[1]:0);ok(cr.reduce((a,b)=>a+b[1],0)===100,'sum 100');ok(sc().reduce((a,b)=>a+b)===0,'before 0 ('+sc()+')');
sel=R.id;run('acl del 3');let s=sc();ok(s[0]===0&&s.reduce((a,b)=>a+b)===0,'one fix is not enough ('+s+')');
run('acl move 1 2');s=sc();ok(s.reduce((a,b)=>a+b)===100,'final 100 ('+s+')');
run('acl clear');run('acl deny 192.168.1.0/24 192.168.2.0/24 tcp 22');s=sc();ok(s[0]===30&&s[1]===20&&s[2]===10,'deny only: web and ping pass by implicit permit ('+s+')');
// corrupt acl robustness
R.acl=[null,{a:'deny'},{a:'permit',sn:'x',sm:1,dn:2,dm:3}];ok(typeof go('acl audit')==='string','corrupt ok');
ok(MAN.some(m=>/Т70/.test(m[0])),'manual');
