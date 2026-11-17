// ===== v39: пошаговая трассировка для PowerShell =====
function ptVars(S){const o={};const ch=[];for(let s=S.sc;s;s=s.parent)ch.unshift(s);ch.forEach(s=>{if(s.vars&&s.vars.entries)s.vars.entries().forEach(([k,v])=>{let t;try{t=psStr(v)}catch(e){t='…'}if(Array.isArray(v))t='@('+v.map(x=>{try{return psStr(x)}catch(e){return'…'}}).join(', ')+')';o['$'+k]=String(t).slice(0,70)})});return o}
{const _r=psRun;psRun=function(S,n,out){if(!BTR||!BTR.ps||BTR.length>3000||!n||!n.ln||!/^(pipe|assign|return|throw|exit|break)$/.test(n.t)||BTR.in)return _r(S,n,out);
 const st={ln:n.ln,pre:ptVars(S),out:''};BTR.push(st);const l0=out.length;if(BTR.length>1)BTR.in=1;
 try{return _r(S,n,out)}finally{BTR.in=0;st.post=ptVars(S);try{const it=out.slice(l0);st.out=it.length?psFmtText(S,it)+'\n':''}catch(e){}}}}
