// ===== v45: задания по CI/CD (3 шт.) и условия проверки конвейера =====
SXCK.cipass=['Последний конвейер ветки успешен','проект на сервере (team/app)','ветка'];SXCK.cijobs=['В последнем конвейере выполнено заданий не меньше','проект на сервере','N'];SXCK.cijob=['Задание последнего конвейера прошло','проект на сервере','имя задания'];SXCK.srvfile=['На Git-сервере есть файл','путь, напр. /srv/www/app/index.html'];
function nciLast(repo,br){const g=sxSrv();if(!g||!g.ci)return null;const l=g.ci.filter(x=>x.repo===repo&&(!br||x.branch===br));return l[l.length-1]||null}
{const _c=sxcCheck;sxcCheck=function(d,dir,k){const a=String(k.a||'').trim(),b=String(k.b||'').trim();
 if(k.t==='cipass'){const P=nciLast(a,b||'main');return!!P&&(P.status==='passed'||P.status==='warning')}
 if(k.t==='cijobs'){const P=nciLast(a);return!!P&&(P.status==='passed'||P.status==='warning')&&(P.jobsRun||0)>=(+b||1)}
 if(k.t==='cijob'){const P=nciLast(a);return!!P&&P.jobs.some(j=>j.name===b&&(j.status==='passed'||j.status==='warning'))}
 if(k.t==='srvfile'){const g=sxSrv();return!!g&&sxFs(g)[a]!==undefined&&!sxFs(g)[a].d}
 return _c(d,dir,k)}}
function nciTask(o){const c={id:o.id,dir:o.dir,lvl:o.lvl,t:o.t,d:o.d,hint:o.hint,sol:o.sol,pre:'',checks:o.checks};const t=sxcMkG(c);delete t.custom;t.ci=1;
 t.prep=d=>{const s=sxSrv();if(!s)return sxNeedSrv();sxIdent(d);sxIdent(s);d.gcfg['init.defaultbranch']='main';s.gcfg['init.defaultbranch']='main';s.ci=(s.ci||[]).filter(x=>x.repo!==o.repo);
  const k='/srv/git/'+o.repo+'.git';sxWipe(s,k);sxWipe(s,'/srv/www/'+o.repo.split('/').pop());repoCmd(s,['create',o.repo]);sxWipe(d,SXH+'/'+o.dir);
  Object.keys(o.files).forEach(f=>sxPutF(d,SXH+'/'+o.dir+'/'+f,o.files[f]));const ip=srcIp(s)||'10.0.0.10';
  const r=sxExec(d,'bash',`cd ~/${o.dir} && git init -q && git add . && git commit -qm "Начальный коммит" && git remote add origin ssh://git@${ip}/${o.repo}.git`+(o.push?' && git push -q -u origin main':''));
  return o.msg+(r.e?' Сообщения: '+r.e.slice(0,200):'')};
 Object.defineProperty(t,'hint',{get:()=>o.hint,configurable:true});SXT.push(t);return t}
const NCI_APP='#!/bin/bash\n# учебное приложение: складывает два числа\necho $(( $1 + $2 ))\n';
const NCI_BAD='#!/bin/bash\n# учебное приложение: складывает два числа\necho $(( $1 * $2 ))\n';
const NCI_TEST='#!/bin/bash\nr=$(bash app.sh 2 3)\nif [ "$r" = "5" ]; then echo "тест пройден"; else echo "ОШИБКА: ожидалось 5, получено $r"; exit 1; fi\n';
nciTask({id:'ci1',repo:'team/ci1',dir:'ci1',lvl:2,t:'CI: первый конвейер',push:false,files:{'app.sh':NCI_APP,'test.sh':NCI_TEST},
 msg:'Создан ~/ci1 (коммит есть, origin настроен) и пустой репозиторий team/ci1 на сервере.',
 d:'В ~/ci1 лежит приложение app.sh и тест test.sh; origin настроен на репозиторий team/ci1. Добавьте файл .stacktoniya-ci.yml с двумя стадиями — build (проверка синтаксиса: bash -n app.sh) и test (bash test.sh) — закоммитьте и отправьте ветку main на сервер, чтобы конвейер прошёл успешно.',
 hint:'stages: [build, test] · задание build: stage: build, script: [bash -n app.sh] · задание test: stage: test, script: [bash test.sh] · git add . && git commit && git push -u origin main · результат: ci show 1',
 checks:[{t:'file',a:'.stacktoniya-ci.yml'},{t:'cipass',a:'team/ci1',b:'main'},{t:'cijobs',a:'team/ci1',b:'2'}],
 sol:`cd ~/ci1\nprintf 'stages: [build, test]\\nbuild:\\n  stage: build\\n  script:\\n    - bash -n app.sh\\ntest:\\n  stage: test\\n  script:\\n    - bash test.sh\\n' > .stacktoniya-ci.yml\ngit add .\ngit commit -m "Добавлен конвейер"\ngit push -u origin main\n`});
nciTask({id:'ci2',repo:'team/ci2',dir:'ci2',lvl:3,t:'CI: починить упавший конвейер',push:true,files:{'app.sh':NCI_BAD,'test.sh':NCI_TEST,'.stacktoniya-ci.yml':'stages: [build, test]\nbuild:\n  stage: build\n  script:\n    - bash -n app.sh\ntest:\n  stage: test\n  script:\n    - bash test.sh\n'},
 msg:'Создан ~/ci2 и отправлен в team/ci2 — конвейер #1 для main упал.',
 d:'Репозиторий team/ci2 уже на сервере, но конвейер для main упал (ci list, ci log). Найдите причину по логу, исправьте app.sh (приложение должно складывать числа), закоммитьте и отправьте исправление, чтобы новый конвейер прошёл.',
 hint:'ci list → ci show N → ci log N test: в логе видно, какой результат получен. Исправьте app.sh, затем git commit -am … && git push',
 checks:[{t:'commits',a:'2'},{t:'cipass',a:'team/ci2',b:'main'},{t:'cijobs',a:'team/ci2',b:'2'}],
 sol:`cd ~/ci2\nprintf '#!/bin/bash\\necho $(( $1 + $2 ))\\n' > app.sh\ngit commit -qam "Исправлено сложение"\ngit push -q origin main\n`});
nciTask({id:'ci3',repo:'team/ci3',dir:'ci3',lvl:3,t:'CI: автоматический деплой',push:true,files:{'index.html':'<h1>Привет из CI/CD</h1>\n','app.sh':NCI_APP,'test.sh':NCI_TEST,'.stacktoniya-ci.yml':'stages: [test]\ntest:\n  stage: test\n  script:\n    - bash test.sh\n'},
 msg:'Создан ~/ci3 и отправлен в team/ci3 — пока только стадия test, деплоя нет.',
 d:'В team/ci3 конвейер состоит только из стадии test. Добавьте стадию deploy и задание deploy, которое выполняется только для ветки main и копирует index.html в /srv/www/ci3/ на сервере (mkdir -p и cp). Отправьте изменения, чтобы деплой прошёл.',
 hint:'stages: [test, deploy] · задание deploy: stage: deploy, only: [main], script: [mkdir -p /srv/www/ci3, cp index.html /srv/www/ci3/index.html]',
 checks:[{t:'cipass',a:'team/ci3',b:'main'},{t:'cijob',a:'team/ci3',b:'deploy'},{t:'srvfile',a:'/srv/www/ci3/index.html'}],
 sol:`cd ~/ci3\nprintf 'stages: [test, deploy]\\ntest:\\n  stage: test\\n  script:\\n    - bash test.sh\\ndeploy:\\n  stage: deploy\\n  only: [main]\\n  script:\\n    - mkdir -p /srv/www/ci3\\n    - cp index.html /srv/www/ci3/index.html\\n' > .stacktoniya-ci.yml\ngit add .\ngit commit -m "Добавлен деплой"\ngit push -q origin main\n`});
if(typeof exSyncCustom==='function')exSyncCustom();
p('Новое (v44–v45): CI/CD — файл .stacktoniya-ci.yml запускает конвейер при git push на Git-сервер (ci demo, ci list, ci show, ci log, ci lint, ci run), 3 задания «CI: …».');
