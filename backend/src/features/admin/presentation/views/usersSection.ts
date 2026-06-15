import { AdminUser } from '../../domain/models/AdminData.js';

export function renderUsersSection(allUsers: AdminUser[]): string {
  return `
    <!-- Section 13: Erabiltzaileak Kudeatu (User Management) -->
    <div class="collapsible-section" id="sec-users" data-tab="erabiltzaileak">
      <div class="collapsible-header" onclick="toggleSection('sec-users')">
        <h2><span class="drag-handle" style="margin-right: 10px; color: #ff3366; cursor: grab;">☰</span>Erabiltzaileak Kudeatu 👥</h2>
        <span class="collapsible-icon">▼</span>
      </div>
      <div class="collapsible-content">
        <!-- Form to add new user -->
        <div class="card">
          <h3>Gehitu Erabiltzaile Berria</h3>
          <div style="display: flex; gap: 15px; flex-wrap: wrap; align-items: flex-end;">
            <div class="form-group" style="flex: 1; min-width: 200px; margin-bottom: 0;">
              <label for="new-username">Erabiltzaile Izena</label>
              <input type="text" id="new-username" placeholder="Adib: konpartsero1">
            </div>
            <div class="form-group" style="flex: 1; min-width: 200px; margin-bottom: 0;">
              <label for="new-password">Pasahitza (gutxienez 6 karaktere)</label>
              <input type="password" id="new-password" placeholder="******">
            </div>
            <div class="form-group" style="flex: 0.5; min-width: 150px; margin-bottom: 0;">
              <label for="new-role">Rola</label>
              <select id="new-role">
                <option value="moderator">Moderatzailea (Tinder soilik)</option>
                <option value="admin">Administratzailea (Dena)</option>
              </select>
            </div>
            <button class="btn btn-approve" onclick="addUser()" style="height: 42px;">Gehitu Erabiltzailea ➕</button>
          </div>
        </div>

        <!-- List of users -->
        <div class="card">
          <h3>Erabiltzaileen Zerrenda</h3>
          <div class="table-scroll-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Erabiltzailea</th>
                  <th>Rola</th>
                  <th>Sorrera Data</th>
                  <th style="width: 100px; text-align: center;">Ekintzak</th>
                </tr>
              </thead>
              <tbody>
                ${allUsers.map((u) => `
                  <tr>
                    <td style="font-weight: bold;">${u.username}</td>
                    <td>
                      <span class="badge ${u.role === 'admin' ? 'badge-accepted' : 'badge-pending'}">
                        ${u.role}
                      </span>
                    </td>
                    <td style="font-family: monospace; font-size: 0.85rem; color: #bbb;">${u.created_at}</td>
                    <td style="text-align: center;">
                      <button class="btn btn-delete" onclick="deleteUser(${u.id}, '${u.username}')" title="Ezabatu erabiltzailea">Ezabatu 🗑️</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}
