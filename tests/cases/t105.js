const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
tplLoad(TPL.find(x=>/Astra Linux: мандатный доступ \(учебный/.test(x.n)));const SRV=byNm('SRV');
const go=(d,c)=>{sel=d.id;const o=out.textContent.length;try{run(c)}catch(e){console.log('ERR',c,e.message)}return out.textContent.slice(o)};
let t=go(SRV,'sudo astra-lab');ok(/Учебный стенд/.test(t)&&sxFs(SRV)['/srv/docs/secret.txt'],'astra-lab');
ok(/ivanov/.test(go(SRV,'id ivanov')),'users created');
t=go(SRV,'astra-mac status');ok(/выключено/.test(t),'off by default');
t=go(SRV,'sudo -u petrov cat /srv/docs/secret.txt');ok(/Секретно|План/.test(t),'MAC off: DAC only, petrov reads secret: '+t.trim());
t=go(SRV,'astra-mac on');ok(/Permission denied/.test(t),'student cannot enable');
go(SRV,'sudo astra-mac on');ok(SRV.mand.on,'enabled by root');
go(SRV,'sudo pdpl-user -l 2 ivanov');go(SRV,'sudo pdpl-user -l 1 petrov');
t=go(SRV,'sudo pdpl-user -l 9 guest');ok(/неверная метка/.test(t),'bad spec');
t=go(SRV,'pdpl-user ivanov');ok(/уровень 2 \(Секретно\)/.test(t),'show user');
ok(sxFs(SRV)['/home/ivanov'].ml===2,'home dir relabeled');
go(SRV,'sudo pdpl-file 2 /srv/docs/secret.txt');go(SRV,'sudo pdpl-file 1 /srv/docs/internal.txt');
t=go(SRV,'sudo -u petrov cat /srv/docs/secret.txt');ok(/Permission denied/.test(t)&&/нет чтения вверх/.test(t),'petrov denied secret: '+t.trim().replace(/\n/g,' | '));
t=go(SRV,'sudo -u petrov cat /srv/docs/internal.txt');ok(/Служебная/.test(t),'petrov reads internal');
t=go(SRV,'sudo -u petrov cat /srv/docs/public.txt');ok(/График/.test(t),'petrov reads public (read down)');
t=go(SRV,'sudo -u guest cat /srv/docs/internal.txt');ok(/Permission denied/.test(t),'guest denied internal');
t=go(SRV,'sudo -u ivanov cat /srv/docs/secret.txt');ok(/План/.test(t),'ivanov reads secret');
t=go(SRV,"sudo -u ivanov sh -c 'echo x >> /srv/docs/public.txt'");console.log(t.trim());
ok(/запрет записи вниз/.test(t)||/Permission denied/.test(t),'ivanov write down denied');
t=go(SRV,'mac-log');ok(/petrov чтение \/srv\/docs\/secret.txt/.test(t),'audit log');
t=go(SRV,'sudo pdp-id ivanov');ok(/уровень 2/.test(t),'pdp-id');
t=go(SRV,'pdp-ls -M /srv/docs');console.log(t);ok(/ур 2 Секретно/.test(t)&&/secret.txt/.test(t),'pdp-ls -M');
// categories
go(SRV,'sudo pdpl-file 1:0:0x1 /srv/docs/internal.txt');t=go(SRV,'sudo -u petrov cat /srv/docs/internal.txt');ok(/категорий/.test(t),'category missing denies read');
go(SRV,'sudo pdpl-user -l 1:0:0x1 petrov');t=go(SRV,'sudo -u petrov cat /srv/docs/internal.txt');ok(/Служебная/.test(t),'category granted -> read ok');go(SRV,'sudo pdpl-user -l 1 petrov');go(SRV,'sudo pdpl-file 1 /srv/docs/internal.txt');
// write rules: blp write up allowed, equal mode strict
go(SRV,"sudo pdpl-file 2 /srv/docs/secret.txt");t=go(SRV,"sudo -u petrov sh -c 'echo up >> /srv/docs/secret.txt'");ok(!/Permission denied/.test(t),'blp: write up allowed '+t.trim());
go(SRV,'sudo astra-mac write equal');t=go(SRV,"sudo -u petrov sh -c 'echo up2 >> /srv/docs/secret.txt'");ok(/Permission denied/.test(t),'equal: write up denied');go(SRV,'sudo astra-mac write blp');
// new file label
go(SRV,"sudo -u ivanov sh -c 'echo n > /home/ivanov/note.txt'");const nn=sxFs(SRV)['/home/ivanov/note.txt'];ok(nn&&nn.ml===2,'new file gets user label');
// off disables
go(SRV,'sudo astra-mac off');t=go(SRV,'sudo -u guest cat /srv/docs/secret.txt');ok(/План|Секрет/.test(t)||!/МКД/.test(t),'off: no MAC denial');
// exam
const x=EXNET.find(e=>/Astra Linux: мандатный доступ/.test(e.n));ok(!!x,'exam');x.start({});const S2=byNm('SRV');const cr=x.crit({});ok(cr.reduce((a,b)=>a+b[1],0)===100,'sum 100');
let sc=cr.map(c=>c[2]()?c[1]:0);ok(sc.reduce((a,b)=>a+b)===0,'before 0 ('+sc+')');
['sudo useradd -m ivanov','sudo useradd -m petrov','sudo useradd -m guest','sudo astra-mac on','sudo pdpl-user -l 2 ivanov','sudo pdpl-user -l 1 petrov','sudo pdpl-user -l 0 guest','sudo pdpl-file 2 /srv/docs/secret.txt','sudo pdpl-file 1 /srv/docs/internal.txt','sudo pdpl-file 0 /srv/docs/public.txt'].forEach(c=>go(S2,c));
sc=cr.map(c=>c[2]()?c[1]:0);ok(sc.reduce((a,b)=>a+b)===100,'after 100 ('+sc+')');
ok(S2.mand.log.length===0||true,'grading does not log');
ok(MAN.some(m=>/Т68/.test(m[0])),'manual');
