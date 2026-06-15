// Pikutara Admin Dashboard Client-side script - Users and Roles
async function addUser() {
  const userIn = document.getElementById('new-username');
  const passIn = document.getElementById('new-password');
  const roleIn = document.getElementById('new-role');
  const username = userIn.value.trim();
  const password = passIn.value;
  const role = roleIn.value;
  
  if (!username || !password) {
    alert('Erabiltzaile izena eta pasahitza sartu behar dituzu.');
    return;
  }

  try {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });
    if (res.ok) {
      window.location.reload();
    } else {
      const errData = await res.json().catch(() => ({}));
      alert('Errorea sortzean: ' + (errData.error || 'ezezaguna'));
    }
  } catch (e) {
    alert('Sareko errorea');
  }
}

async function deleteUser(id, username) {
  if (!confirm('Ziur zaude "' + username + '" erabiltzailea ezabatu nahi duzula?')) return;
  try {
    const res = await fetch('/api/admin/users/' + id, {
      method: 'DELETE'
    });
    if (res.ok) {
      window.location.reload();
    } else {
      const errData = await res.json().catch(() => ({}));
      alert('Errorea ezabatzean: ' + (errData.error || 'ezezaguna'));
    }
  } catch (e) {
    alert('Sareko errorea');
  }
}
