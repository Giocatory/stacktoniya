// номера строк в ошибках PowerShell-скриптов
{const _f=psRunFile;psRunFile=function(S,path,...r){const o={path:PSLN.path,ln:PSLN.ln};PSLN.path=cWin(path);PSLN.ln=1;try{return _f(S,path,...r)}finally{PSLN.path=o.path;PSLN.ln=o.ln}}}
{const _rc=psRec;psRec=function(...a){const r=_rc(...a);if(PSLN.path&&r&&typeof r==='object')r.at=PSLN.path+':'+PSLN.ln;return r}}
{const _fe=psFmtErr;psFmtErr=function(rec){let t=_fe(rec);if(rec&&rec.at){const i=t.indexOf('\n');if(i>=0)t=t.slice(0,i+1)+`At ${rec.at} char:1\n`+t.slice(i+1)}return t}}
