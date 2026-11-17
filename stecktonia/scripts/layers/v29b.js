// ===== v29b: случайные Git-задания =====
const RGW=['alpha','beta','gamma','delta','omega','sigma','kappa','lambda','zeta','theta'];
const gw=(r,k)=>RGW[(Math.floor(r()*RGW.length)+k)%RGW.length];
const GG=[
{id:'g_branch',t:'Git: ветка, файл и слияние',lvl:2,mk(r){const n=rI(r,1,99),dir='lab'+n,br='feature-'+gw(r,0),f=gw(r,3)+'.txt',L='v'+rI(r,10,99);
 return{dir,d:`В каталоге ~/${dir} есть репозиторий с коммитом в main. Создайте ветку ${br}, добавьте в неё файл ${f} со строкой «${L}», закоммитьте и слейте ветку в main (после слияния вы должны остаться на main).`,hint:`git switch -c ${br}; echo ${L} > ${f}; git add .; git commit -m …; git switch main; git merge ${br}`,
  pre:`mkdir -p ~/${dir} && cd ~/${dir} && git init -q && echo base > base.txt && git add . && git commit -qm "base"`,
  checks:[{t:'branch',a:br},{t:'merged',a:br},{t:'onbranch',a:'main'},{t:'file',a:f,b:L},{t:'clean'}],
  sol:()=>`cd ~/${dir}\ngit switch -c ${br}\necho ${L} > ${f}\ngit add .\ngit commit -m "add ${f}"\ngit switch main\ngit merge ${br}\n`}}},
{id:'g_conflict',t:'Git: конфликт слияния',lvl:3,mk(r){const n=rI(r,1,99),dir='merge'+n,key=gw(r,1),A='a'+rI(r,10,99),B='b'+rI(r,10,99),V='final'+rI(r,10,99);
 return{dir,d:`В ~/${dir} в ветках main и dev по-разному изменена строка ${key} файла app.cfg. Слейте dev в main, разрешите конфликт так, чтобы в файле осталась строка «${key}=${V}» без маркеров конфликта, и завершите слияние коммитом.`,hint:'git merge dev → правка app.cfg → git add app.cfg → git commit',
  pre:`mkdir -p ~/${dir} && cd ~/${dir} && git init -q && printf '${key}=base\\nport=80\\n' > app.cfg && git add . && git commit -qm base && git switch -q -c dev && printf '${key}=${B}\\nport=80\\n' > app.cfg && git commit -qam dev && git switch -q main && printf '${key}=${A}\\nport=80\\n' > app.cfg && git commit -qam main`,
  checks:[{t:'mergecommit'},{t:'nomarkers',a:'app.cfg'},{t:'file',a:'app.cfg',b:key+'='+V},{t:'clean'}],
  sol:()=>`cd ~/${dir}\ngit merge dev\nprintf '${key}=${V}\\nport=80\\n' > app.cfg\ngit add app.cfg\ngit commit -m "resolve ${key}"\n`}}},
{id:'g_ignore',t:'Git: .gitignore, удаление из индекса, тег',lvl:2,mk(r){const n=rI(r,1,99),dir='site'+n,ext=['log','tmp','bak','cache'][rI(r,0,3)],junk='debug.'+ext,tag='v'+rI(r,1,3)+'.'+rI(r,0,9);
 return{dir,d:`В ~/${dir} по ошибке закоммичен файл ${junk}. Добавьте .gitignore с правилом *.${ext}, уберите ${junk} из индекса (файл на диске оставьте), закоммитьте и поставьте тег ${tag}.`,hint:`echo "*.${ext}" > .gitignore; git rm --cached ${junk}; git add .gitignore; git commit; git tag ${tag}`,
  pre:`mkdir -p ~/${dir} && cd ~/${dir} && git init -q && echo main > main.c && echo x > ${junk} && git add . && git commit -qm init`,
  checks:[{t:'file',a:'.gitignore',b:'*.'+ext},{t:'nofile',a:junk},{t:'tag',a:tag},{t:'clean'}],
  sol:()=>`cd ~/${dir}\necho "*.${ext}" > .gitignore\ngit rm -q --cached ${junk}\ngit add .gitignore\ngit commit -m "ignore ${ext}"\ngit tag ${tag}\n`}}},
{id:'g_push',t:'Git: ветка и отправка на Git-сервер',lvl:3,mk(r){const n=rI(r,1,99),dir='proj'+n,repo='team/r'+n,br='release-'+gw(r,5),f=gw(r,2)+'.md';
 return{dir,srv:repo,d:`На Git-сервере создан репозиторий ${repo}. В ~/${dir} создайте локальный репозиторий с файлом ${f}, закоммитьте его, создайте ветку ${br}, подключите сервер как origin и отправьте ветку ${br} на сервер (git push -u origin ${br}).`,hint:()=>{const g=sxSrv();return`git remote add origin ssh://git@${g&&srcIp(g)||'<IP сервера>'}/${repo}.git; git push -u origin ${br}`},
  pre:'',
  checks:[{t:'remote'},{t:'branch',a:br},{t:'file',a:f},{t:'pushed',a:br,b:repo}],
  sol:()=>{const g=sxSrv();return`mkdir -p ~/${dir} && cd ~/${dir}\ngit init\necho "# ${repo}" > ${f}\ngit add .\ngit commit -m "init"\ngit switch -c ${br}\ngit remote add origin ssh://git@${g&&srcIp(g)||'10.0.0.10'}/${repo}.git\ngit push -u origin ${br}\n`}}}}
];
{const _m=rndMk;rndMk=function(rec){if(rec.sh!=='git')return _m(rec);const g=GG.find(x=>x.id===rec.g),o=g.mk(exRng(rec.seed));
 const c={id:rec.id,sh:'git',lvl:g.lvl,t:`Случайное: ${g.t} (№${rec.seed})`,d:o.d+` Вариант №${rec.seed}: имена и значения случайные.`,dir:o.dir,hint:'—',sol:'—',pre:o.pre,checks:o.checks};
 const t=sxcMkG(c);t.rnd=1;t.custom=1;t.src=rec;t.o=o;Object.defineProperty(t,'sol',{get:()=>o.sol(),configurable:true});Object.defineProperty(t,'hint',{get:()=>typeof o.hint==='function'?o.hint():o.hint,configurable:true});
 const _p=t.prep;t.prep=d=>{sxIdent(d);d.gcfg['init.defaultbranch']='main';let msg='';if(o.srv){const s=sxSrv();if(!s)return sxNeedSrv();const k='/srv/git/'+o.srv+'.git';sxWipe(s,k);repoCmd(s,['create',o.srv]);msg=`На сервере создан ${o.srv}. `}sxWipe(d,SXH+'/'+o.dir);return msg+(o.pre?_p(d):'Каталог очищен')};return t}}
function rndExampleG(d,gid){const g=(gid&&gid!=='any'&&GG.find(x=>x.id===gid))||GG[Math.floor(Math.random()*GG.length)],seed=1+Math.floor(Math.random()*99998),t=rndMk({id:'x',g:g.id,sh:'git',seed});const m=t.prep(d);const fname=`rand_${g.id}_${seed}.sh`;
 const body='#!/bin/bash\n'+['Случайный Git-сценарий: '+g.t+' (№'+seed+')',t.d.replace(/\n/g,' '),'Подготовка среды уже выполнена; скрипт ниже — образец решения. Запустите его и посмотрите вкладку «Git».'].map(x=>'# '+x).join('\n')+'\n'+t.sol;
 sxPutF(d,SXH+'/'+fname,body);return{path:SXH+'/'+fname,args:[],exp:[]}}
