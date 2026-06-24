// Pikutara Admin Dashboard Client-side script - Bazkaria Registrations and Actions
async function toggleBazkariaPaid(id) {
  try {
    const res = await fetch('/api/bazkaria/' + id + '/toggle-paid', {
      method: 'PUT'
    });
    if (res.ok) {
      window.location.reload();
    } else {
      alert('Errorea ordainketa egoera aldatzean');
    }
  } catch (e) {
    alert('Sareko errorea');
  }
}

async function deleteBazkaria(id) {
  if (!confirm('Ziur izen-emate hau ezabatu nahi duzula?')) return;
  try {
    const res = await fetch('/api/bazkaria/' + id, {
      method: 'DELETE'
    });
    if (res.ok) {
      window.location.reload();
    } else {
      alert('Errorea ezabatzean');
    }
  } catch (e) {
    alert('Sareko errorea');
  }
}

async function resendBazkariaEmail(id) {
  if (!confirm('Ziur izen-ematerako posta elektronikoa berriz bidali nahi duzula?')) return;
  try {
    const res = await fetch('/api/bazkaria/' + id + '/resend-email', {
      method: 'POST'
    });
    if (res.ok) {
      alert('Posta ondo birbidali da! (Email reenviado correctamente)');
    } else {
      const data = await res.json();
      alert('Errorea bidaltzean: ' + (data.error || 'Errore ezezaguna'));
    }
  } catch (e) {
    alert('Sareko errorea');
  }
}

async function exportBazkaria() {
  try {
    const res = await fetch('/api/bazkaria/registrations');
    if (!res.ok) throw new Error('Ezin izan da daturik lortu');
    const data = await res.json();
    if (data.length === 0) {
      alert('Ez dago daturik esportatzeko.');
      return;
    }

    let csvContent = "ID,Izena,Abizenak,Motea,Emaila,Menua,Oharrak_Alergiak,Ordainketa,Nori_Eman,Pagado,Data\n";
    
    data.forEach(r => {
      const id = r.id || '';
      const izena = '"' + (r.izena || '').replace(/"/g, '""') + '"';
      const abizenak = '"' + (r.abizenak || '').replace(/"/g, '""') + '"';
      const mote = '"' + (r.mote || '').replace(/"/g, '""') + '"';
      const email = '"' + (r.email || '').replace(/"/g, '""') + '"';
      const menua = '"' + (r.menu_type || '').replace(/"/g, '""') + '"';
      const oharrak = '"' + (r.oharrak || '').replace(/"/g, '""') + '"';
      const ordainketa = '"' + (r.ordainketa_modua || '').replace(/"/g, '""') + '"';
      const nori = '"' + (r.konpartsakide_izena || r.konpartsakide_id || '').toString().replace(/"/g, '""') + '"';
      const pagado = r.is_paid === 1 ? '"BAI"' : '"EZ"';
      const dataStr = '"' + new Date(r.created_at).toLocaleString('eu-ES') + '"';
      
      csvContent += id + "," + izena + "," + abizenak + "," + mote + "," + email + "," + menua + "," + oharrak + "," + ordainketa + "," + nori + "," + pagado + "," + dataStr + "\n";
    });

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bazkaria_izen_emateak.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    alert('Errorea esportatzean: ' + e.message);
  }
}

async function sendBroadcastEmail(event) {
  event.preventDefault();
  
  const subject = document.getElementById('broadcast-subject').value;
  const driveUrl = document.getElementById('broadcast-drive').value;
  const message = document.getElementById('broadcast-message').value;
  
  // Count how many rows are in the table body, to tell the admin how many emails will be sent.
  const rowCount = document.querySelectorAll('tr[id^="bazkaria-row-"]').length;
  
  if (!confirm(`Ziur zaude mezu hau izena eman duten ${rowCount} pertsonei bidali nahi diezula?\n(¿Estás seguro de enviar este correo a las ${rowCount} personas registradas?)`)) {
    return;
  }
  
  const statusSpan = document.getElementById('broadcast-status');
  const submitBtn = event.target.querySelector('button[type="submit"]');
  
  statusSpan.style.display = 'inline';
  statusSpan.innerText = 'Bidaltzen / Enviando... ⏳';
  submitBtn.disabled = true;
  
  try {
    const res = await fetch('/api/bazkaria/broadcast-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ subject, driveUrl, message })
    });
    
    const data = await res.json();
    if (res.ok) {
      alert(`Difusioa ondo burutu da!\nBidaliak: ${data.successCount} | Huts eginak: ${data.failedCount}`);
      document.getElementById('broadcast-message').value = '';
      document.getElementById('broadcast-drive').value = '';
    } else {
      alert('Errorea mezuak bidaltzean: ' + (data.error || 'Errore ezezaguna'));
    }
  } catch (e) {
    alert('Sareko errorea: ' + e.message);
  } finally {
    statusSpan.style.display = 'none';
    submitBtn.disabled = false;
  }
}

