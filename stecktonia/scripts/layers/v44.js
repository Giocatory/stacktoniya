// ===== v44: встроенный CI/CD-конвейер (.stacktoniya-ci.yml) — запускается при git push на Git-сервер =====
const NCIF=['.stacktoniya-ci.yml','.gitlab-ci.yml'];
function nciStrip(l){let q=null;for(let i=0;i<l.length;i++){const c=l[i];if(q){if(c===q)q=null;continue}if(c==='"'||c==="'")q=c;else if(c==='#'&&(i===0||/\s/.test(l[i-1])))return l.slice(0,i)}return l}
function nciScalar(v){v=v.trim();if(v==='')return'';if(/^\[.*\]$/.test(v))return v.slice(1,-1).split(',').map(x=>nciScalar(x)).filter(x=>x!=='');
 if(/^"([\s\S]*)"$/.test(v))return v.slice(1,-1).replace(/\\"/g,'"');if(/^'([\s\S]*)'$/.test(v))return v.slice(1,-1).replace(/''/g,"'");if(v==='true')return true;if(v==='false')return false;return v}
function nciYaml(src){const raw=String(src).replace(/\r/g,'').split('\n');const L=[];raw.forEach((l,i)=>{const s=nciStrip(l);if(s.trim()==='')return;if(/^\t/.test(s))throw{ln:i+1,m:'табуляция в отступе — используйте пробелы'};L.push({ind:s.match(/^ */)[0].length,t:s.trim(),ln:i+1,raw:s})});
 let pos=0;
 function block(ind,pk){if(pos>=L.length)return null;if(L[pos].t.startsWith('- ')||L[pos].t==='-')return list(L[pos].ind,pk);return map(L[pos].ind)}
 function list(ind,pk){const a=[];while(pos<L.length&&L[pos].ind===ind&&(L[pos].t.startsWith('- ')||L[pos].t==='-')){const it=L[pos++].t.slice(1).trim();
  if(pk==='rules'&&/^[A-Za-z_][\w-]*:(\s|$)/.test(it)){const ob={};const add=t=>{const m=/^([\w-]+):\s*(.*)$/.exec(t);if(m)ob[m[1]]=nciScalar(m[2])};add(it);while(pos<L.length&&L[pos].ind>ind&&!L[pos].t.startsWith('- ')){add(L[pos++].t)}a.push(ob)}else a.push(nciScalar(it))}return a}
 function map(ind){const o={};while(pos<L.length&&L[pos].ind>=ind){if(L[pos].ind>ind)throw{ln:L[pos].ln,m:'неожиданный отступ'};const l=L[pos],m=/^([^\s:][^:]*?)\s*:(?:\s+(.*))?$/.exec(l.t);if(!m)throw{ln:l.ln,m:'ожидалось «ключ: значение»'};pos++;const k=m[1].replace(/^["']|["']$/g,''),v=m[2];
  if(v===undefined||v===''){if(pos<L.length&&(L[pos].ind>ind||(L[pos].ind===ind&&L[pos].t.startsWith('- ')))){o[k]=block(L[pos].ind,k)}else o[k]=null}
  else if(v==='|'||v==='>'){const lines=[];while(pos<L.length&&L[pos].ind>ind)lines.push(L[pos++].t);o[k]=v==='|'?lines:[lines.join(' ')]}
  else o[k]=nciScalar(v)}return o}
 const r=L.length?block(L[0].ind):{};if(pos<L.length)throw{ln:L[pos].ln,m:'неожиданное содержимое'};return r||{}}
const NCI_RES=['stages','variables','default','before_script','after_script','image','workflow','include','cache'];
const nciArr=x=>x==null||x===''?[]:Array.isArray(x)?x:[x];
function nciPlan(cfg,branch){const err=[];const stages=nciArr(cfg.stages).length?nciArr(cfg.stages).map(String):['build','test','deploy'];const jobs=[];
 Object.keys(cfg).forEach(k=>{if(NCI_RES.includes(k)||k[0]==='.')return;const j=cfg[k];if(!j||typeof j!=='object'||Array.isArray(j)){err.push(`задание «${k}»: ожидалась таблица параметров`);return}
  const st=String(j.stage||'test');if(!stages.includes(st))err.push(`задание «${k}»: неизвестная стадия «${st}» (есть: ${stages.join(', ')})`);
  const sc=nciArr(j.script).map(String);if(!sc.length)err.push(`задание «${k}»: не задан script`);
  let run=true,why='';const only=nciArr(j.only).map(String),exc=nciArr(j.except).map(String);if(only.length&&!only.includes(branch)){run=false;why='only'}if(exc.includes(branch)){run=false;why='except'}
  if(Array.isArray(j.rules)){let hit=null;for(const rl of j.rules){if(!rl||typeof rl!=='object')continue;if(rl.if===undefined||nciCond(String(rl.if),branch,cfg)){hit=rl;break}}run=!!hit&&hit.when!=='never';if(!hit)why='rules'}
  jobs.push({name:k,stage:st,script:sc,before:nciArr(j.before_script).map(String),after:nciArr(j.after_script).map(String),vars:(j.variables&&typeof j.variables==='object')?j.variables:{},allow:j.allow_failure===true,manual:j.when==='manual',never:j.when==='never',run,why,rulesRaw:j.rules})});
 return{stages,jobs,err}}
function nciCond(c,branch,cfg){const env={CI_COMMIT_BRANCH:branch,CI_COMMIT_REF_NAME:branch,CI:'true'};Object.assign(env,(cfg&&cfg.variables)||{});const one=x=>{x=x.trim();const m=/^\$(\w+)\s*(==|!=)\s*["']?([^"']*)["']?$/.exec(x);if(m){const v=env[m[1]]===undefined?'':String(env[m[1]]);return m[2]==='=='?v===m[3]:v!==m[3]}const t=/^\$(\w+)\s*=~\s*\/(.*)\/$/.exec(x);if(t){try{return new RegExp(t[2]).test(String(env[t[1]]||''))}catch(e){return false}}const v=/^\$(\w+)$/.exec(x);if(v)return!!env[v[1]];return false};return c.split('||').some(p=>p.split('&&').every(one))}
function nciCfgOf(rr,id){const t=(rr.objs[id]||{}).tree||{};for(const f of NCIF)if(t[f]!==undefined)return{file:f,text:String(t[f])};return null}
function nciShQ(s){return"'"+String(s).replace(/'/g,"'\\''")+"'"}
function nciRunPipeline(srv,key,rr,branch,sid){srv.ci=srv.ci||[];const cf=nciCfgOf(rr,sid);if(!cf)return null;
 const proj=key.replace('/srv/git/','').replace(/\.git$/,''),id=(srv.ci.reduce((m,x)=>Math.max(m,x.id),0)||0)+1,c=rr.objs[sid];
 const P={id,repo:proj,branch,sha:sid,short:gShort(sid),msg:String(c.m||'').split('\n')[0],status:'running',jobs:[],err:[],ts:Date.now(),file:cf.file};
 let cfg;try{cfg=nciYaml(cf.text)}catch(e){P.status='failed';P.err.push(`${cf.file}, строка ${e.ln||'?'}: ${e.m||e.message}`);srv.ci.push(P);nciTrim(srv);return P}
 const plan=nciPlan(cfg,branch);if(plan.err.length){P.status='failed';P.err=plan.err.map(x=>cf.file+': '+x);srv.ci.push(P);nciTrim(srv);return P}
 const gv=(cfg.variables&&typeof cfg.variables==='object')?cfg.variables:{};const gb=nciArr(cfg.before_script).map(String),ga=nciArr(cfg.after_script).map(String);
 const base='/var/ci/'+proj+'/p'+id;Object.keys(c.tree||{}).forEach(f=>sxPutF(srv,base+'/'+f,c.tree[f]));
 let failed=false;
 plan.stages.forEach(st=>{plan.jobs.filter(j=>j.stage===st).forEach(j=>{const J={name:j.name,stage:st,status:'',log:'',code:0,allow:j.allow,dur:0};P.jobs.push(J);
   if(!j.run||j.never){J.status='skipped';J.log=j.never?'Задание отключено (when: never).':`Задание пропущено: ветка «${branch}» не подходит под ${j.why==='only'?'only':j.why==='rules'?'rules':'except'}.`;return}
   if(j.manual){J.status='manual';J.log='Задание ручное (when: manual) — в этой среде не запускается автоматически.';return}
   if(failed){J.status='skipped';J.log='Пропущено: предыдущая стадия завершилась с ошибкой.';return}
   const env=Object.assign({CI:'true',CI_COMMIT_BRANCH:branch,CI_COMMIT_REF_NAME:branch,CI_COMMIT_SHA:sid,CI_COMMIT_SHORT_SHA:gShort(sid),CI_COMMIT_MESSAGE:P.msg,CI_PROJECT_NAME:proj.split('/').pop(),CI_PROJECT_PATH:proj,CI_PIPELINE_ID:String(id),CI_JOB_NAME:j.name,CI_JOB_STAGE:st,CI_PROJECT_DIR:base},gv,j.vars);
   const lines=[...gb,...j.before,...j.script];
   let src='#!/bin/bash\nset -e\ncd '+nciShQ(base)+'\n'+Object.keys(env).map(k=>`export ${k}=${nciShQ(env[k])}`).join('\n')+'\n';
   lines.forEach(l=>{src+=`printf '%s\\n' ${nciShQ('$ '+l)}\n${l}\n`});
   const jf='/var/ci/'+proj+'/p'+id+'.'+j.name.replace(/[^\w.-]/g,'_')+'.sh';sxPutF(srv,jf,src);
   const r=sxRunFile(srv,jf,[],{});J.code=r.code;J.log=(r.o||'')+(r.e?(r.o&&!r.o.endsWith('\n')?'\n':'')+r.e:'');J.dur=1+Math.round(lines.length*1.3);
   const after=[...j.after,...ga];if(after.length){let s2='#!/bin/bash\ncd '+nciShQ(base)+'\n'+after.map(l=>`printf '%s\\n' ${nciShQ('$ '+l)}\n${l}\n`).join('');sxPutF(srv,jf+'.after',s2);const r2=sxRunFile(srv,jf+'.after',[],{});J.log+=(J.log&&!J.log.endsWith('\n')?'\n':'')+(r2.o||'')+(r2.e||'')}
   if(r.code===0)J.status='passed';else{J.status=j.allow?'warning':'failed';J.log+=(J.log.endsWith('\n')?'':'\n')+`ERROR: задание завершилось с кодом ${r.code}\n`;if(!j.allow)failed=true}})});
 const anyFail=P.jobs.some(j=>j.status==='failed'),anyWarn=P.jobs.some(j=>j.status==='warning');P.status=anyFail?'failed':anyWarn?'warning':'passed';P.jobsRun=P.jobs.filter(j=>/passed|warning|failed/.test(j.status)).length;
 srv.ci.push(P);nciTrim(srv);return P}
function nciTrim(s){while(s.ci.length>40){const o=s.ci.shift();if(o&&o.repo)sxRm(sxFs(s),'/var/ci/'+o.repo+'/p'+o.id,true)}}
const NCI_ST={passed:'✔ passed',failed:'✘ failed',warning:'⚠ passed (с предупреждением)',skipped:'⏭ skipped',manual:'⏸ manual',running:'… running'};
function nciSummary(P){let o=`Pipeline #${P.id} (${P.repo}, ветка ${P.branch}, ${P.short}) — ${NCI_ST[P.status]||P.status}\n`;if(P.err&&P.err.length)o+=P.err.map(e=>'  ошибка конфигурации: '+e).join('\n')+'\n';
 const st=[...new Set(P.jobs.map(j=>j.stage))];st.forEach(s=>{o+=`  стадия ${s}:\n`;P.jobs.filter(j=>j.stage===s).forEach(j=>{o+=`    ${(NCI_ST[j.status]||j.status).padEnd(8)} ${j.name}${j.status==='failed'?' (код '+j.code+')':''}\n`})});return o}
{const _n=gitNet;gitNet=function(G,cmd,a){if(cmd!=='push')return _n(G,cmd,a);
 let R=null,before=null;try{const ps=a.filter(x=>x[0]!=='-');const rn=ps[0]||(G.r.up[G.r.head]?G.r.up[G.r.head].split('/')[0]:'origin');const rm=G.r.remotes[rn];if(rm){R=gRemote(G,rm.url);if(R.err)R=null;else before=JSON.stringify(R.r.refs)}}catch(e){R=null}
 const code=_n(G,cmd,a);if(code!==0||!R||!R.srv||R.srv.role!=='git'||!R.r.bare)return code;
 const after=R.r.refs,old=JSON.parse(before||'{}');const ch=Object.keys(after).filter(b=>after[b]!==old[b]);
 ch.forEach(b=>{let P;try{P=nciRunPipeline(R.srv,R.key,R.r,b,after[b])}catch(e){G.io.err('remote: CI: внутренняя ошибка конвейера: '+(e&&e.message||e)+'\n');return}
  if(!P)return;G.io.out(`remote: \nremote: Запущен pipeline #${P.id} для ветки ${b} (${P.short}) — ${NCI_ST[P.status]}\n`+nciSummary(P).split('\n').filter(Boolean).slice(1).map(l=>'remote: '+l).join('\n')+'\nremote: Подробности: ci show '+P.id+' · ci log '+P.id+' <задание>\n')});
 return code}}
// ---- команда ci ----
function nciCmd(d,a){const srv=sxSrv();const out=[];const o=s=>out.push(s);const sub=(a[0]||'help').toLowerCase();
 const need=()=>{if(!srv){o('Git-сервер в схеме не найден (добавьте устройство «Git-сервер»).');return false}srv.ci=srv.ci||[];return true};
 if(sub==='help'||sub==='-h'){o('ci list [repo]      — последние конвейеры\nci show <N>        — стадии и задания конвейера N\nci log <N> [задание] — вывод заданий\nci run <группа/проект> [ветка] — перезапустить конвейер для вершины ветки\nci lint <файл>     — проверить .stacktoniya-ci.yml (синтаксис, стадии, script)\nci demo            — подготовить учебный репозиторий team/cidemo с конвейером\nci clear           — очистить историю конвейеров\nФайл конфигурации: .stacktoniya-ci.yml в корне репозитория (stages, variables, задания со stage/script/only/except/allow_failure/when).');return out.join('\n')}
 if(sub==='list'){if(!need())return out.join('\n');const l=srv.ci.filter(x=>!a[1]||x.repo===a[1]).slice(-15).reverse();if(!l.length)o('Конвейеров ещё не было: сделайте git push в репозиторий с файлом .stacktoniya-ci.yml.');l.forEach(P=>o(`#${P.id}  ${P.repo}  ${P.branch}  ${P.short}  ${NCI_ST[P.status]}  «${P.msg}»`));return out.join('\n')}
 if(sub==='show'||sub==='log'){if(!need())return out.join('\n');const P=srv.ci.find(x=>x.id===+a[1]);if(!P){o('Конвейер не найден: '+(a[1]||'укажите номер')+'. См. ci list.');return out.join('\n')}
  if(sub==='show'){o(nciSummary(P));return out.join('\n')}
  const js=a[2]?P.jobs.filter(j=>j.name===a[2]):P.jobs;if(!js.length){o('Задание не найдено: '+a[2]);return out.join('\n')}
  if(P.err&&P.err.length)o(P.err.join('\n'));js.forEach(j=>{o(`── ${j.stage}:${j.name} — ${NCI_ST[j.status]||j.status} ──\n${j.log||'(нет вывода)'}`)});return out.join('\n')}
 if(sub==='run'){if(!need())return out.join('\n');if(!a[1]){o('Использование: ci run <группа/проект> [ветка]');return out.join('\n')}const key='/srv/git/'+a[1].replace(/\.git$/,'')+'.git',rr=srv.gdb&&srv.gdb[key];if(!rr){o('Репозиторий не найден на сервере: '+a[1]);return out.join('\n')}
  const b=a[2]||rr.head,id=rr.refs[b];if(!id){o('Нет такой ветки: '+b);return out.join('\n')}const P=nciRunPipeline(srv,key,rr,b,id);if(!P){o('В вершине ветки нет файла .stacktoniya-ci.yml.');return out.join('\n')}o(nciSummary(P));return out.join('\n')}
 if(sub==='lint'){const f=a[1];if(!f){o('Использование: ci lint <файл>');return out.join('\n')}const fs=sxFs(d||srv);const abs=sxNorm(((d&&sxSession(d,'bash').cwd)||SXH),f);const nd=fs[abs];if(!nd||nd.d){o('Файл не найден: '+f);return out.join('\n')}
  let cfg;try{cfg=nciYaml(nd.c)}catch(e){o(`✘ синтаксис YAML, строка ${e.ln||'?'}: ${e.m||e.message}`);return out.join('\n')}const pl=nciPlan(cfg,'main');
  if(pl.err.length){pl.err.forEach(e=>o('✘ '+e));return out.join('\n')}o(`✔ конфигурация корректна: стадий ${pl.stages.length} (${pl.stages.join(' → ')}), заданий ${pl.jobs.length}`);pl.jobs.forEach(j=>o(`   ${j.stage}: ${j.name} — команд ${j.script.length}${j.allow?', allow_failure':''}${j.manual?', manual':''}`));return out.join('\n')}
 if(sub==='clear'){if(!need())return out.join('\n');srv.ci.length=0;sxRm(sxFs(srv),'/var/ci',true);o('История конвейеров очищена.');return out.join('\n')}
 if(sub==='demo'){if(!need())return out.join('\n');if(!d||!sxEnd(d)){o('Запустите ci demo на компьютере (ПК), с которого будете делать push.');return out.join('\n')}sxIdent(d);d.gcfg['init.defaultbranch']='main';const k='/srv/git/team/cidemo.git';sxWipe(srv,k);repoCmd(srv,['create','team/cidemo']);sxWipe(d,SXH+'/cidemo');
  const files={'app.sh':'#!/bin/bash\n# учебное приложение: складывает два числа\necho $(( $1 + $2 ))\n','test.sh':'#!/bin/bash\nr=$(bash app.sh 2 3)\nif [ "$r" = "5" ]; then echo "тест пройден"; else echo "ОШИБКА: ожидалось 5, получено $r"; exit 1; fi\n','.stacktoniya-ci.yml':'stages: [build, test, deploy]\n\nvariables:\n  APP_ENV: demo\n\nbuild-job:\n  stage: build\n  script:\n    - echo "Сборка для $APP_ENV, коммит $CI_COMMIT_SHORT_SHA"\n    - bash -n app.sh\n\ntest-job:\n  stage: test\n  script:\n    - bash test.sh\n\ndeploy-job:\n  stage: deploy\n  only: [main]\n  script:\n    - mkdir -p /srv/www/cidemo\n    - cp app.sh /srv/www/cidemo/app.sh\n    - echo "Развёрнуто в /srv/www/cidemo"\n'};
  Object.keys(files).forEach(f=>sxPutF(d,SXH+'/cidemo/'+f,files[f]));const ip=srcIp(srv)||'<IP сервера>';
  const r=sxExec(d,'bash',`cd ~/cidemo && git init -q && git add . && git commit -qm "Первый коммит" && git remote add origin ssh://git@${ip}/team/cidemo.git`);
  o(`Готово: ~/cidemo (локальный репозиторий с .stacktoniya-ci.yml) и пустой репозиторий team/cidemo на сервере.\nТеперь: cd ~/cidemo && git push -u origin main — после push запустится конвейер build → test → deploy.\nПосмотреть: ci list, ci show 1, ci log 1.`+(r.e?'\n'+r.e:''));return out.join('\n')}
 o('Неизвестная подкоманда. ci help — справка.');return out.join('\n')}
{const _r=run;run=function(c){const s=c.trim(),a=s.split(/\s+/);if((a[0]||'').toLowerCase()==='ci'){const d=sel&&dv(sel);const t=nciCmd(d,a.slice(1).map(x=>x.replace(/^(["'])([\s\S]*)\1$/,'$2')));return sxPrint(t)}return _r(c)}}
CMDS.push(['ci','ci list | show N | log N [задание] | run проект [ветка] | lint файл | demo','CI/CD-конвейер на Git-сервере: .stacktoniya-ci.yml, запуск при git push','После git push на Git-сервер, если в корне репозитория есть .stacktoniya-ci.yml, сервер выполняет конвейер: стадии (stages) по порядку, задания — bash-скрипты с переменными CI_COMMIT_BRANCH, CI_COMMIT_SHORT_SHA и др.; ошибка задания останавливает следующие стадии; поддерживаются only/except, allow_failure, when: manual, variables, before_script/after_script. ci demo готовит учебный репозиторий.','ci demo','Скрипты и Git']);
// ---- UI: конвейеры во вкладке Git ----
document.head.insertAdjacentHTML('beforeend','<style>.nci{border:1px solid var(--bd);border-radius:8px;padding:8px;margin:6px 0}.nci .pl{display:flex;gap:10px;align-items:flex-start;overflow-x:auto;padding:4px 0}.nci .stg{min-width:120px}.nci .stg h5{margin:0 0 4px;font-size:12px;color:var(--mt);font-weight:600}.nci .jb{display:block;width:100%;text-align:left;margin:0 0 4px;padding:3px 8px;border-radius:12px;border:1px solid var(--bd);font-size:12px;cursor:pointer}.nci button.jb.passed{background:#2f7d32!important;color:#fff!important;border-color:#2f7d32!important}.nci button.jb.failed{background:#c0392b!important;color:#fff!important;border-color:#c0392b!important}.nci button.jb.warning{background:#d9822b!important;color:#fff!important;border-color:#d9822b!important}.nci .jb.skipped,.nci .jb.manual{opacity:.6}.nci .hd{display:flex;gap:8px;align-items:center;cursor:pointer;font-size:13px}.nci .ok{color:#2f7d32}.nci .bad{color:#c0392b}</style>');
function nciUI(el){const srv=S.devs.find(x=>x.role==='git');if(!srv||!(srv.ci||[]).length)return;
 const w=document.createElement('div');w.className='sxk';w.id='nciw';const L=srv.ci.slice(-8).reverse();
 w.innerHTML=`<h4>⚙ CI/CD: конвейеры Git-сервера ${sxE(srv.name)}</h4><p style="margin:0 0 6px;color:var(--mt);font-size:13px">Запускаются при git push, если в корне репозитория есть <code>.stacktoniya-ci.yml</code>. Нажмите на задание, чтобы увидеть его лог. Команды: <code>ci list</code>, <code>ci show N</code>, <code>ci log N</code>.</p>`+L.map(P=>`<div class="nci" data-id="${P.id}"><div class="hd"><b class="${P.status==='failed'?'bad':P.status==='passed'?'ok':''}">${NCI_ST[P.status]||P.status}</b> <span>#${P.id} · ${sxE(P.repo)} · ${sxE(P.branch)} · ${P.short} · «${sxE(P.msg)}»</span></div>${P.err&&P.err.length?`<div class="bad">${P.err.map(sxE).join('<br>')}</div>`:''}<div class="pl">${[...new Set(P.jobs.map(j=>j.stage))].map(st=>`<div class="stg"><h5>${sxE(st)}</h5>${P.jobs.filter(j=>j.stage===st).map(j=>`<button class="jb ${j.status}" data-j="${sxE(j.name)}" title="${sxE(NCI_ST[j.status]||j.status)}">${({passed:'✔',failed:'✘',warning:'⚠',skipped:'⏭',manual:'⏸'})[j.status]||'…'} ${sxE(j.name)}</button>`).join('')}</div>`).join('')}</div><pre class="sxo nlog" style="display:none"></pre></div>`).join('');
 const anchor=el.querySelector('#gvw')||el.querySelector('.sxg');anchor?anchor.parentNode.insertBefore(w,anchor.nextSibling):el.appendChild(w);
 w.querySelectorAll('.jb').forEach(b=>b.onclick=()=>{const bx=b.closest('.nci'),P=srv.ci.find(x=>x.id===+bx.dataset.id),j=P&&P.jobs.find(x=>x.name===b.dataset.j),pre=bx.querySelector('.nlog');if(!j)return;pre.style.display='block';pre.textContent=`── ${j.stage}:${j.name} — ${NCI_ST[j.status]||j.status} ──\n`+(j.log||'(нет вывода)')})}
{const _g=sxuGt;sxuGt=function(el){_g(el);try{nciUI(el)}catch(e){}}}
