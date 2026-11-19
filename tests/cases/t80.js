(function(){const R=[];const ok=(n,c,i)=>R.push((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(String(i||'')).slice(0,900)));
try{tplLoad(TPL[cmTplI()]);const d=byNm('PC1');sel=d.id;
 const ids=['an1','an2','an3','an4','an5','an6','an7','an8'];ok('8 заданий',ids.every(i=>SXT.find(t=>t.id===i)));
 ids.forEach(id=>{const t=SXT.find(x=>x.id===id);
  let r=sxTaskDo(id,'prep');ok(id+' prep',!r.err,r);
  r=sxTaskDo(id,'chk');ok(id+' пустое решение не засчитывается',!r.ok&&r.R.length>=1,r.R);
  const f=t.chk.toString();
  const file={an1:'hosts.ini',an2:'site.yml',an3:'vars.yml',an4:'web.yml',an5:'conf.yml',an6:'users.yml',an7:'dirs.yml',an8:'broken.yml'}[id];
  if(id==='an8'){r=sxTaskDo(id,'chk');ok('an8 сломанный плейбук не проходит',!r.ok,r.R)}
  sxPutF(d,SXH+'/'+file,t.sol);
  r=sxTaskDo(id,'chk');ok(id+' образец решения проходит',r.ok,r.R&&r.R.map(x=>(x[1]?'+':'-')+x[0]).join('|'))});
 // частично неверное решение: без handlers
 sxTaskDo('an5','prep');sxPutF(d,SXH+'/conf.yml','---\n- hosts: web\n  become: yes\n  tasks:\n    - copy:\n        content: "worker_processes 2;\\n"\n        dest: /etc/demo.conf\n');
 let r=sxTaskDo('an5','chk');ok('an5 без handler не проходит',!r.ok&&r.R.some(x=>!x[1]&&/RUNNING HANDLER/.test(x[0])),r.R);
 // захардкоженные переменные
 sxPutF(d,SXH+'/vars.yml','---\n- hosts: web\n  become: yes\n  tasks:\n    - copy:\n        content: "name=demo\\nport=8080\\nhost=Git1\\n"\n        dest: /srv/demo.conf\n');
 r=sxTaskDo('an3','chk');ok('an3 захардкоженные значения не проходят',!r.ok&&r.R.some(x=>!x[1]&&/-e/.test(x[0])),r.R);
 const o=document.getElementById('out');o.textContent='';run('stask list');ok('stask list показывает Ansible',/Ansible: Инвентарь/.test(o.textContent)&&/Ansible: Починить/.test(o.textContent),o.textContent.slice(-300));
 ok('MAN Т52',MAN.some(m=>/^Т52/.test(m[0])));
}catch(e){R.push('FAIL EXC '+e.stack)}
return R.join('\n')})();
