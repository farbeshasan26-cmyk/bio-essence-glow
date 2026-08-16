const r = await fetch('/api/me');

if (!r.ok) {
  const errorText = await r.text();
  document.body.innerHTML =
    '<h2>Login session error</h2><pre>' +
    errorText +
    '</pre><p>Status: ' +
    r.status +
    '</p>';
  return;
}const u=await r.json();name.textContent='স্বাগতম, '+u.name;balance.textContent='৳'+u.balance;pending.textContent='৳'+u.pending_balance;const t=await fetch('/api/tasks').then(x=>x.json());tasks.innerHTML=t.length?t.map(x=>`<div class="task"><div><b>${x.title}</b><p>Reward: ৳${x.reward} · ${x.duration_seconds}s</p></div><button onclick="completeTask(${x.id})">Start</button></div>`).join(''):'<p>এই মুহূর্তে কোনো task নেই।';}async function completeTask(id){const r=await fetch('/api/tasks/'+id+'/complete',{method:'POST'});const d=await r.json();alert(d.message||d.error);load()}async function logout(){await fetch('/api/logout',{method:'POST'});location.href='/'}load();
