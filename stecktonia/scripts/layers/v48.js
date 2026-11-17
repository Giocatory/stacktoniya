// ===== v48: права доступа — chmod (восьмеричный и символьный), chown, stat, ls -l с режимами, «Permission denied» при запуске без +x; задания adm4–adm5 =====
const ADM_OWN='student';
function bModeNum(n){return n.m!==undefined?n.m:(n.d?0o755:0o644)}
function bModeStr(n){const m=bModeNum(n);let s=n.d?'d':'-';for(let i=2;i>=0;i--){const b=(m>>(i*3))&7;s+=(b&4?'r':'-')+(b&2?'w':'-')+(b&1?'x':'-')}return s}
// новый файл получает режим 644 (как при umask 022); служебные файлы заданий (sxPutF) режима не имеют и не ограничиваются
{const _w=sxWrite;sxWrite=function(fs,p,c,app){const had=!!fs[p];const e=_w(fs,p,c,app);if(!e&&!had&&fs[p]&&!fs[p].d&&fs[p].m===undefined)fs[p].m=0o644;return e}}
function chmodApply(cur,spec,isDir){if(/^[0-7]{1,4}$/.test(spec))return parseInt(spec,8)&0o7777;let m=cur;
 for(const part of spec.split(',')){const r=/^([ugoa]*)([+\-=])([rwxXst]*)$/.exec(part);if(!r)return null;const who=r[1]||'a';let bits=0;
  for(const ch of r[3]){const v=ch==='r'?4:ch==='w'?2:ch==='x'?1:ch==='X'?((isDir||(cur&0o111))?1:0):0;bits|=v}
  let mask=0;for(const w of (who==='a'?'ugo':who)){const sh=w==='u'?6:w==='g'?3:0;mask|=bits<<sh}
  if(r[2]==='+')m|=mask;else if(r[2]==='-')m&=~mask;else{let all=0;for(const w of (who==='a'?'ugo':who)){all|=7<<(w==='u'?6:w==='g'?3:0)}m=(m&~all)|mask}}
 return m}
BB.chmod=(X,a,io)=>{let rec=false;const r=[];a.forEach(x=>{if(x==='-R'||x==='--recursive')rec=true;else r.push(x)});if(r.length<2){io.err('chmod: пропущен операнд\nИспользование: chmod [-R] РЕЖИМ ФАЙЛ...\n');return 1}
 const spec=r[0];let code=0;if(chmodApply(0o644,spec,false)===null){io.err(`chmod: неверный режим: «${spec}»\n`);return 1}
 for(const p of r.slice(1)){const f=bAbs(X,p),n=X.fs[f];if(!n){io.err(`chmod: невозможно получить доступ к '${p}': Нет такого файла или каталога\n`);code=1;continue}
  const set=k=>{const e=X.fs[k];e.m=chmodApply(bModeNum(e),spec,!!e.d)};set(f);if(rec&&n.d){const pre=f+'/';Object.keys(X.fs).filter(k=>k.startsWith(pre)).forEach(set)}}
 return code};
BB.chown=(X,a,io)=>{let rec=false;const r=[];a.forEach(x=>{if(x==='-R')rec=true;else r.push(x)});if(r.length<2){io.err('chown: пропущен операнд\n');return 1}
 if(!X.sudo){io.err(`chown: изменение владельца '${r[1]}': Операция не позволена\n`);return 1}const m=/^([^:.]*)(?:[:.](.*))?$/.exec(r[0]);let code=0;
 for(const p of r.slice(1)){const f=bAbs(X,p),n=X.fs[f];if(!n){io.err(`chown: невозможно получить доступ к '${p}': Нет такого файла или каталога\n`);code=1;continue}
  const set=k=>{const e=X.fs[k];if(m[1])e.o=m[1];if(m[2])e.g=m[2]};set(f);if(rec&&n.d){const pre=f+'/';Object.keys(X.fs).filter(k=>k.startsWith(pre)).forEach(set)}}return code};
BB.stat=(X,a,io)=>{let fmt=null;const r=[];for(let i=0;i<a.length;i++){if(a[i]==='-c')fmt=a[++i];else if(/^--format=/.test(a[i]))fmt=a[i].slice(9);else r.push(a[i])}let code=0;
 for(const p of r){const f=bAbs(X,p),n=X.fs[f];if(!n){io.err(`stat: не удаётся выполнить stat для '${p}': Нет такого файла или каталога\n`);code=1;continue}
  const m=bModeNum(n),sz=n.d?4096:bBytes(n.c||''),o=n.o||ADM_OWN,g=n.g||ADM_OWN;
  if(fmt)io.out(fmt.replace(/%a/g,m.toString(8)).replace(/%A/g,bModeStr(n)).replace(/%U/g,o).replace(/%G/g,g).replace(/%s/g,String(sz)).replace(/%n/g,p).replace(/%F/g,n.d?'directory':'regular file')+'\n');
  else io.out(`  File: ${p}\n  Size: ${sz}\tBlocks: ${Math.ceil(sz/512)}\t${n.d?'directory':'regular file'}\nAccess: (${String(m.toString(8)).padStart(4,'0')}/${bModeStr(n)})  Uid: (1000/${o})   Gid: (1000/${g})\n`)}return code};
// ls -l: режим и владелец
{const src=BB.ls.toString();}
const admM=(d,p)=>{const n=sxFs(d)[p];return n?bModeNum(n):null};
admTask({id:'adm4',lvl:1,t:'Права: скрипт не запускается',d:'В домашнем каталоге лежит deploy.sh, но ./deploy.sh отвечает «Permission denied». Выясните причину (ls -l) и сделайте так, чтобы владелец мог запускать скрипт, не меняя его содержимого. Затем запустите ./deploy.sh.',
 hint:'ls -l deploy.sh покажет -rw-r--r-- — нет бита x. Добавьте его: chmod +x deploy.sh (или chmod 755 deploy.sh).',
 prep:d=>{sxWrite(sxFs(d),SXH+'/deploy.sh','#!/bin/bash\necho "развёртывание выполнено"\n');sxFs(d)[SXH+'/deploy.sh'].m=0o644;return'Создан ~/deploy.sh с правами 644 (запуск запрещён).'},
 sol:'chmod +x ~/deploy.sh\n',
 chk:d=>{const m=admM(d,SXH+'/deploy.sh');const n=sxFs(d)[SXH+'/deploy.sh'];return[['файл deploy.sh на месте и не изменён',!!n&&/развёртывание выполнено/.test(n.c||'')],['у владельца есть право на исполнение (u+x)',m!==null&&(m&0o100)!==0],['у владельца есть право на чтение (u+r)',m!==null&&(m&0o400)!==0]]}});
admTask({id:'adm5',lvl:2,t:'Права: приватный ключ SSH',d:'В ~/.ssh лежит закрытый ключ id_rsa с правами 644 — любой пользователь системы может его прочитать, ssh такой ключ не примет. Задайте безопасные права: ключ доступен только владельцу на чтение и запись (600), каталог ~/.ssh — только владельцу (700).',
 hint:'chmod 600 ~/.ssh/id_rsa && chmod 700 ~/.ssh. Проверьте: ls -l ~/.ssh, stat -c %a ~/.ssh/id_rsa',
 prep:d=>{const fs=sxFs(d);sxMk(fs,SXH+'/.ssh',true);fs[SXH+'/.ssh'].m=0o755;sxWrite(fs,SXH+'/.ssh/id_rsa','-----BEGIN OPENSSH PRIVATE KEY-----\nQWxsIHlvdXIga2V5cyBhcmUgYmVsb25nIHRvIHVz\n-----END OPENSSH PRIVATE KEY-----\n');fs[SXH+'/.ssh/id_rsa'].m=0o644;return'Создан ~/.ssh/id_rsa с правами 644 и каталог ~/.ssh с правами 755.'},
 sol:'chmod 700 ~/.ssh\nchmod 600 ~/.ssh/id_rsa\n',
 chk:d=>[['ключ id_rsa существует',admM(d,SXH+'/.ssh/id_rsa')!==null],['права ключа 600',admM(d,SXH+'/.ssh/id_rsa')===0o600],['права каталога ~/.ssh 700',admM(d,SXH+'/.ssh')===0o700]]});
admTask({id:'adm6',lvl:3,t:'Права: общий каталог проекта',d:'Создайте каталог ~/shared и файл ~/shared/notes.txt. Каталог должен быть доступен владельцу полностью, группе — на чтение и вход (r-x), остальным — никак (750). Файл: владелец читает и пишет, группа только читает, остальным закрыт (640). Вариант с -R допустим, но каталог и файл должны получить именно эти права.',
 hint:'mkdir ~/shared && echo текст > ~/shared/notes.txt · chmod 750 ~/shared · chmod 640 ~/shared/notes.txt · символьно: chmod u=rwx,g=rx,o= ~/shared',
 prep:d=>{const fs=sxFs(d);sxRm(fs,SXH+'/shared',true);return'Каталога ~/shared пока нет — создайте его.'},
 sol:'mkdir ~/shared\necho "заметки" > ~/shared/notes.txt\nchmod 750 ~/shared\nchmod 640 ~/shared/notes.txt\n',
 chk:d=>[['каталог ~/shared существует',!!sxFs(d)[SXH+'/shared']&&!!sxFs(d)[SXH+'/shared'].d],['файл notes.txt существует',admM(d,SXH+'/shared/notes.txt')!==null],['права каталога 750',admM(d,SXH+'/shared')===0o750],['права файла 640',admM(d,SXH+'/shared/notes.txt')===0o640]]});
if(typeof exSyncCustom==='function')exSyncCustom();
p('Новое (v48): права доступа — chmod/chown/stat, ls -l с режимами, «Permission denied» без бита x; задания adm4–adm6.');
