// ===== v38: пошаговая трассировка для .bat/.cmd =====
{const _p=cPct;cPct=function(X,s,batch){if(batch===true&&BTR&&BTR.cmd&&BTR.length<3000){const prev=BTR[BTR.length-1];if(prev&&!prev.post)prev.post={...X.env};if(prev)prev.rc=X.last;
 let ln=0;const its=(X.prog&&X.prog.items)||[];const pl=prev?prev.ln:0;let best=1e9;its.forEach(it=>{if(it.text===s){const dd=it.line>=pl?it.line-pl:1e6+pl-it.line;if(dd<best){best=dd;ln=it.line}}});
 BTR.push({ln,pre:{...X.env},out:''});BTR.cur=BTR[BTR.length-1]}
 return _p(X,s,batch)}}
{const _c=cCap;cCap=function(io){const r=_c(io);if(!BTR||!BTR.cmd)return r;const o=r.out;r.out=s=>{if(BTR.cur)BTR.cur.out+=s;o(s)};return r}}
