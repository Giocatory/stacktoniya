const T=TPL.find(x=>/Резервный канал/.test(x.n));tplLoad(T);const R1=byNm('R1');
const go=(d,c)=>{sel=d.id;const o=out.textContent.length;run(c);return out.textContent.slice(o)};
console.log(R1.ifaces.map(f=>f.n+' '+f.ip).join(' | '));
go(R1,'shutdown gi0/1');console.log(go(R1,'route get 192.168.2.10'));
go(R1,'route add 192.168.2.10 255.255.255.255 10.0.13.2');console.log(go(R1,'route get 192.168.2.10'));
