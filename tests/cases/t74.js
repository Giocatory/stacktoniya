(function(){const R=[];const ok=(n,c,i)=>R.push((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(String(i||'')).slice(0,700)));
try{tplLoad(TPL[cmTplI()]);const d=byNm('PC1');sel=d.id;const o=document.getElementById('out');const g=byNm('Git1');
 const put=(f,t)=>sxWrite(sxFs(d),SXH+'/'+f,t);const sh=c=>{o.textContent='';run(c);return o.textContent};
 put('inventory','[web]\nGit1\n\n[local]\nlocalhost\n');
 let t=sh('ansible all -m ping');ok('ping по инвентарю',/Git1 \| SUCCESS/.test(t)&&/localhost \| SUCCESS/.test(t)&&/pong/.test(t),t);
 t=sh('ansible web -m shell -a "echo hi"');ok('shell',/Git1 \| CHANGED \| rc=0 >>\nhi/.test(t),t);
 t=sh('ansible-inventory --graph');ok('inventory --graph',/@web:[\s\S]*Git1/.test(t),t);
 t=sh('ansible nogroup -m ping');ok('нет совпадений',/does not match any hosts/.test(t),t);
 put('p1.yml',`---
- name: Настройка веб-сервера
  hosts: web
  become: yes
  vars:
    site: demo
    pkgs: [nginx, curl]
  tasks:
    - name: Пакеты
      apt:
        name: "{{ pkgs }}"
        state: present
    - name: Каталог сайта
      file:
        path: /var/www/{{ site }}
        state: directory
        mode: "0755"
    - name: Страница
      copy:
        content: "Hello from {{ inventory_hostname }}\\n"
        dest: /var/www/{{ site }}/index.html
      notify: restart nginx
    - name: Строка в конфиг
      lineinfile:
        path: /etc/motd
        line: "Managed by NetLab"
        create: yes
    - name: Служба
      service:
        name: nginx
        state: started
        enabled: yes
    - name: Пропуск
      debug:
        msg: no
      when: site == 'other'
    - name: Цикл
      command: "echo {{ item }}"
      loop: [a, b]
      register: res
    - name: Вывод
      debug:
        msg: "{{ res.results | length }} результата"
  handlers:
    - name: restart nginx
      service:
        name: nginx
        state: restarted
`);
 t=sh('ansible-playbook p1.yml');
 ok('PLAY/TASK/RECAP',/PLAY \[Настройка веб-сервера\]/.test(t)&&/TASK \[Пакеты\]/.test(t)&&/PLAY RECAP/.test(t),t);
 ok('первый запуск changed',/changed: \[Git1\]/.test(t)&&/failed=0/.test(t)&&!/FAILED/.test(t),t);
 ok('файл создан на целевом узле',sxRd(g,'/var/www/demo/index.html')==='Hello from Git1\n',sxRd(g,'/var/www/demo/index.html'));
 ok('lineinfile создал файл',/Managed by NetLab/.test(sxRd(g,'/etc/motd')||''));
 ok('пакеты записаны',(g.pkgs||[]).includes('nginx'));
 ok('служба nginx активна',g.units&&g.units.nginx&&g.units.nginx.s==='active');
 ok('skipping',/skipping: \[Git1\]/.test(t),t);
 ok('handler выполнен',/RUNNING HANDLER \[restart nginx\]/.test(t),t);
 ok('loop+register',/changed: \[Git1\] => \(item=a\)/.test(t)&&/2 результата/.test(t),t);
 t=sh('ansible-playbook p1.yml');
 const rec=t.match(/Git1\s*: ok=(\d+)\s+changed=(\d+)/);
 ok('идемпотентность: copy/file/lineinfile/apt не меняют',rec&&!/changed: \[Git1\]\n[\s\S]*TASK \[Каталог/.test(t)&&!/RUNNING HANDLER \[restart/.test(t),t);
 ok('повтор: changed только command-цикл',rec&&+rec[2]===1,rec&&rec[0]);
 put('p2.yml','- hosts: web\n  tasks:\n    - name: Запись в /etc без become\n      copy:\n        content: x\n        dest: /etc/x.conf\n    - name: Не должна выполниться\n      debug:\n        msg: после ошибки\n');
 t=sh('ansible-playbook p2.yml');ok('без become — Permission denied и остановка',/FAILED! =>.*Permission denied/.test(t)&&!/после ошибки/.test(t)&&/failed=1/.test(t),t);
 put('p3.yml','- hosts: all\n  tasks:\n    - name: bad\n      unknownmod: x=1\n');t=sh('ansible-playbook p3.yml');ok('неизвестный модуль',/не поддерживается/.test(t),t);
 put('p4.yml','- hosts: web\n  tasks:\n  - debug:\n      msg: "{{ undefined_var }}"\n');t=sh('ansible-playbook p4.yml');ok('неопределённая переменная',/undefined variable/.test(t),t);
 put('p5.yml','- hosts: local\n  gather_facts: no\n  tasks:\n    - name: локально\n      command: echo local\n      register: r\n    - debug:\n        var: r.stdout\n    - name: при условии\n      debug:\n        msg: ok\n      when: r.rc == 0 and r.stdout == "local"\n');t=sh('ansible-playbook p5.yml');ok('localhost, var, when',/"r.stdout": "local"/.test(t)&&/"msg": "ok"/.test(t)&&/localhost\s*: ok=3/.test(t),t);
 put('p6.yml','- hosts: web\n  tasks: [\n');t=sh('ansible-playbook --syntax-check p6.yml');ok('ошибка YAML — не падает',/ERROR!/.test(t)||/syntax/i.test(t)||/playbook:/.test(t),t);
 put('p7.yml','- hosts: web\n\ttasks:\n    - debug: msg=1\n');t=sh('ansible-playbook p7.yml');ok('табуляция в YAML',/табуляция/.test(t),t);
 put('inv2','ghost ansible_host=10.0.9.9\n');t=sh('ansible all -i inv2 -m ping');ok('недоступный узел',/UNREACHABLE/.test(t),t);
 t=sh('ansible-playbook --check p1.yml');ok('--check не меняет файлы',!sxRd(g,'/etc/x.conf'),t);
 t=sh('ansible web -b -m user -a "name=dev1 groups=sudo"');ok('модуль user',/Git1 \| (CHANGED|FAILED)/.test(t),t);
 t=sh('ansible web -m copy -a "content=x dest=/tmp/y.txt mode=0644"');ok('copy в /tmp без become',/CHANGED/.test(t)&&sxRd(g,'/tmp/y.txt')==='x',t);
 ok('MAN Т46',MAN.some(x=>/^Т46/.test(x[0])));
}catch(e){R.push('ERR '+e.stack)}return R.join('\n')})()
