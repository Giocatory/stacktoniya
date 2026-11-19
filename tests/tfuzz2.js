(function(){const R=[];const bad=[];let n=0;
const vals=['','abc','-1','0','999999','1.2.3.4','10.0.0.300','2001:db8::1/200','::g','x'.repeat(300),'<b>x</b>','0.0.0.0','255.255.255.255','1e9','  '];
const SD=document.getElementById('side');
for(const ti of TPL.map((t,i)=>i)){try{tplLoad(TPL[ti])}catch(e){bad.push('TPL '+ti);continue}
 for(const d of S.devs.slice()){sel=d.id;try{0}catch(e){}
  try{side()}catch(e){bad.push('showSide '+d.name+': '+e.message)}
  const els=[...SD.querySelectorAll('input,select,textarea')];
  els.forEach(el=>{const types=el.type;const vs=types==='checkbox'?[true,false]:vals;
   for(const v of vs){try{if(types==='checkbox')el.checked=v;else el.value=v;el.dispatchEvent(new window.Event('change',{bubbles:true}));el.dispatchEvent(new window.Event('input',{bubbles:true}));n++}catch(e){bad.push(`[${TPL[ti].n}] ${d.name} ${el.dataset.k||el.dataset.a||el.id} = "${String(v).slice(0,20)}" → ${e.message}`)}}
   // после мусора панель могла перерисоваться
  });
  // повторная отрисовка не должна падать
  try{side()}catch(e){bad.push('showSide2 '+d.name+': '+e.message)}}
 if(bad.length>30)break}
R.push('events '+n+' bad '+bad.length);const seen={};bad.forEach(b=>{const k=b.replace(/^\[[^\]]*\] /,'').replace(/ = ".*?"/,'');if(!seen[k]){seen[k]=1;R.push(b)}});return R.slice(0,40).join('\n')})();
