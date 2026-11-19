const o=Storage.prototype.setItem;let n=0;Storage.prototype.setItem=function(k,v){if(k==='netlab'){n++;throw new Error('quota')}return o.call(this,k,v)};
const t0=out.textContent.length;ch();ch();ch();
const m=(out.textContent.slice(t0).match(/Автосохранение/g)||[]).length;
Storage.prototype.setItem=o;ch();
console.log(m===1?'PASS warned once':'FAIL warned '+m);
