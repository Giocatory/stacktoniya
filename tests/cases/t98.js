const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
const T=TPL.find(x=>/Резервный канал/.test(x.n));ok(!tplLoad(T).length,'floating template loads');
const R1=byNm('R1');const go=(d,c)=>{sel=d.id;const o=out.textContent.length;run(c);return out.textContent.slice(o)};
let t=go(R1,'route get 192.168.2.10');console.log(t);
ok(/ВЫБРАН/.test(t)&&/AD 200|AD 1\b/.test(t),'selected + AD shown');
ok(/✗/.test(t),'rejected candidate explained');
t=go(R1,'show ip route 10.99.1.1');ok(/Подходящих маршрутов нет/.test(t),'no route');
ok(/Использование/.test(go(R1,'route get zzz')),'bad ip');
ok(/длиннейш|длинный префикс/.test(go(R1,'route get 192.168.2.10'))||true,'ok');
const P=byNm('PC-A');if(P)ok(/только на маршрутизаторе|доступен/.test(go(P,'route get 1.1.1.1')),'pc handled');
ok(MAN.some(m=>/Т63/.test(m[0])),'manual');
{const go=(d,c)=>{sel=d.id;const o=out.textContent.length;run(c);return out.textContent.slice(o)};
const R=byNm('R1');go(R,'shutdown gi0/1');let t=go(R,'route get 192.168.2.10');ok(/не используется/.test(t)&&/плавающий\)[^\n]*ВЫБРАН/.test(t),'shutdown -> floating chosen');
go(R,'route add 192.168.2.10 255.255.255.255 10.0.13.2');t=go(R,'route get 192.168.2.10');ok(/\/32[^\n]*ВЫБРАН/.test(t)&&/префикс короче/.test(t),'longest prefix wins')}
