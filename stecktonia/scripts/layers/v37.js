// ===== v37: Git-задания «починить историю» (коммит не в той ветке, откат без переписывания истории) =====
SXCK.brfile=['Файл есть в вершине ветки','ветка','путь'];SXCK.brnofile=['Файла нет в вершине ветки','ветка','путь'];
{const _c=sxcCheck;sxcCheck=function(d,dir,k){if(k.t!=='brfile'&&k.t!=='brnofile')return _c(d,dir,k);const G=gRepoAt(d,dir);if(!G)return false;const r=G.r,id=r.refs[String(k.a||'').trim()];if(!id||!r.objs[id])return false;const has=r.objs[id].tree[String(k.b||'').trim()]!==undefined;return k.t==='brfile'?has:!has}}
GG.push(
{id:'g_wrongbr',t:'Git: коммит попал не в ту ветку',lvl:3,mk(r){const n=rI(r,1,99),dir='fix'+n,br='feature-'+gw(r,4),f=gw(r,6)+'.txt';
 return{dir,d:`В ~/${dir} вы по ошибке сделали коммит с файлом ${f} прямо в main, хотя он должен быть в ветке ${br}. Исправьте: создайте ветку ${br} из текущего состояния, верните main на предыдущий коммит (git reset --hard HEAD~1 выполняйте, уже имея ветку!) и останьтесь на ${br}. В итоге файл ${f} есть только в ${br}.`,hint:`git branch ${br}; git reset --hard HEAD~1 (на main); git switch ${br}`,
  pre:`mkdir -p ~/${dir} && cd ~/${dir} && git init -q && echo base > base.txt && git add . && git commit -qm base && echo work > ${f} && git add . && git commit -qm "work in progress"`,
  checks:[{t:'branch',a:br},{t:'brfile',a:br,b:f},{t:'brnofile',a:'main',b:f},{t:'onbranch',a:br},{t:'clean'}],
  sol:()=>`cd ~/${dir}\ngit branch ${br}\ngit reset -q --hard HEAD~1\ngit switch ${br}\n`}}},
{id:'g_revert',t:'Git: отменить коммит без переписывания истории',lvl:3,mk(r){const n=rI(r,1,99),dir='undo'+n,f=['secret','passwords','token','keys'][rI(r,0,3)]+'.txt';
 return{dir,d:`В ~/${dir} последним коммитом в репозиторий попал файл ${f} с секретом. История уже «опубликована», поэтому её нельзя переписывать (reset запрещён): отмените коммит командой git revert, чтобы файла в последнем состоянии не было, а прежние коммиты остались.`,hint:'git revert HEAD --no-edit',
  pre:`mkdir -p ~/${dir} && cd ~/${dir} && git init -q && echo a > a.txt && git add . && git commit -qm first && echo b >> a.txt && git commit -qam second && echo "pass=123" > ${f} && git add . && git commit -qm "add ${f}"`,
  checks:[{t:'commits',a:'4'},{t:'nofile',a:f},{t:'file',a:'a.txt'},{t:'msg',a:'Revert'},{t:'clean'}],
  sol:()=>`cd ~/${dir}\ngit revert HEAD --no-edit\n`}}});
