const go=(d,c)=>{sel=d.id;const o=out.textContent.length;run(c);return out.textContent.slice(o)};
const x=EXNET.find(e=>/Фильтрация: пропустить/.test(e.n));x.start({});const R2=byNm('R2'),R1=byNm('R1');
go(R2,'prefix-list BR permit 172.16.0.0/16 le 24');go(R2,'prefix-list BR permit 192.168.2.0/24');
go(R2,'redistribute static ospf prefix-list BR');go(R2,'redistribute connected ospf prefix-list BR');
console.log(go(R1,'route'));console.log(JSON.stringify(RIPT[R1.id]));console.log(go(R2,'show redistribute'))
