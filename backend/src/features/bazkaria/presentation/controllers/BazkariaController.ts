import { Request, Response } from 'express';
import { SQLiteRegistrationRepository } from '../../infrastructure/repositories/SQLiteRegistrationRepository.js';
import { SQLiteKonpartsakideRepository } from '../../../konpartsakideak/infrastructure/repositories/SQLiteKonpartsakideRepository.js';
import { MailService } from '../../infrastructure/services/MailService.js';

const registrationRepo = new SQLiteRegistrationRepository();
const konpartsakideRepo = new SQLiteKonpartsakideRepository();

export class BazkariaController {
  static async register(req: Request, res: Response): Promise<void> {
    const { izena, abizenak, email, menuType, ordainketaModua, konpartsakideId, oharrak, mote } = req.body;

    if (!izena || !abizenak || !email || !menuType || !ordainketaModua) {
      res.status(400).json({ error: 'Datu guztiak bete behar dira (Faltan datos obligatorios).' });
      return;
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanIzena = izena.trim().toLowerCase();
      const cleanAbizenak = abizenak.trim().toLowerCase();

      const existingRegistration = await registrationRepo.findByEmailAndName(cleanEmail, cleanIzena, cleanAbizenak);

      if (existingRegistration) {
        if (!mote || !mote.trim()) {
          res.status(409).json({
            requiresMote: true,
            error: 'Dagoeneko badago izen-emate bat datu hauekin. Mesedez, jarri mote edo izenondo bat bereizteko (Aitona, Txiki, etab).'
          });
          return;
        }

        const exactMoteDuplicate = await registrationRepo.findByEmailAndNameAndMote(
          cleanEmail,
          cleanIzena,
          cleanAbizenak,
          mote
        );

        if (exactMoteDuplicate) {
          res.status(400).json({ error: 'Mote hau ere erregistratuta dago jada email honentzat.' });
          return;
        }
      }

      // 1. Save in DB
      await registrationRepo.save({
        izena,
        abizenak,
        email,
        menu_type: menuType,
        ordainketa_modua: ordainketaModua,
        konpartsakide_id: konpartsakideId ? Number(konpartsakideId) : null,
        oharrak: oharrak || null,
        mote: mote || null
      });

      // 2. Prepare Email
      let ordainketaMezua = '';

      if (ordainketaModua === 'aurretiaz' && konpartsakideId) {
        const k = await konpartsakideRepo.findById(Number(konpartsakideId));
        const konpartsakideIzena = k ? k.izena : 'konpartsakide bati';

        let kontaktuKutxa = '';
        if (k && (k.telefono || k.instagram)) {
          kontaktuKutxa += `<div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #ddd;">`;
          kontaktuKutxa += `<p style="margin-top: 0; margin-bottom: 10px; color: #700070;"><strong>${konpartsakideIzena}-(r)en kontaktua:</strong></p>`;
          kontaktuKutxa += `<ul style="list-style: none; padding: 0; margin: 0; line-height: 1.8;">`;

          if (k.telefono) {
            kontaktuKutxa += `<li>📱 <strong>Telefonoa:</strong> <a href="tel:${k.telefono}" style="color: #ff0000; text-decoration: none; font-weight: bold;">${k.telefono}</a></li>`;
          }

          if (k.instagram) {
            const cleanInsta = k.instagram.replace(/^@/, '');
            kontaktuKutxa += `<li>📸 <strong>Instagram:</strong> <a href="https://ig.me/m/${cleanInsta}" style="color: #ff0000; text-decoration: none; font-weight: bold;">@${cleanInsta}</a></li>`;
          }

          kontaktuKutxa += `<li>⚠️ <strong>Arazorik baldin baduzu</strong>, edo ordainketa egiteko zailtasunak badituzu, ez izan zalantzarik eta jarri gurekin harremanetan: <a href="mailto:pikutaragaztekonpartsa@gmail.com" style="color: #ff0000; text-decoration: none; font-weight: bold;">pikutaragaztekonpartsa@gmail.com</a></li>`;
          kontaktuKutxa += `</ul></div>`;
        }

        ordainketaMezua = `
          <p>Ordainketa egiteko <strong>${konpartsakideIzena}</strong>-(r)ekin geratu zara.</p>
          <p>Mesedez, jarri berarekin harremanetan ahalik eta lasterren 10€-ak emateko eta zure lekua 100% ziurtatzeko.</p>
          <p>Konpartsakideari ordainketa egitea zailtzen bazaizu, edo bestelako arazoak badituzu, ez izan zalantzarik eta jarri gurekin harremanetan.</p>
          ${kontaktuKutxa}
        `;
      } else if (ordainketaModua === 'ganetza_presentziala') {
        ordainketaMezua = `
          <p>Ordainketa <strong>Ganetzan presentzialki</strong> egitea hautatu duzu.</p>
          <p>Azken orduko ordainketa egiteko, astelehenetik asteazkenera (Ekainak 15, 16 eta 17) Ganetzan egongo gara arratsaldeko <strong>17:00etatik 20:30era</strong>.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #ddd;">
            <p style="margin: 0;">📍 <strong>Ganetza:</strong> <a href="https://maps.app.goo.gl/5Ak6exkS6NBfTKBg9" style="color: #ff0000; text-decoration: none; font-weight: bold;">Ikusi Google Maps-en</a></p>
          </div>
        `;
      } else if (ordainketaModua === 'pikutara_zuzenean') {
        ordainketaMezua = `
          <p>Ordainketa nola egin adosteko gurekin (Pikutara) harremanetan jarriko zinela adierazi duzu.</p>
          <p>Aukeratu bi bide hauetako bat ordainketa bidea ixteko:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #ddd;">
            <ul style="list-style: none; padding: 0; margin: 0; line-height: 1.8;">
              <li>📸 <strong>Instagram:</strong> <a href="https://ig.me/m/pikutaragaztekonpartsa" style="color: #ff0000; text-decoration: none; font-weight: bold;">@pikutaragaztekonpartsa</a></li>
              <li>📧 <strong>Emaila:</strong> <a href="mailto:pikutaragaztekonpartsa@gmail.com" style="color: #ff0000; text-decoration: none; font-weight: bold;">pikutaragaztekonpartsa@gmail.com (Bidali posta)</a></li>
            </ul>
          </div>
        `;
      } else {
        ordainketaMezua = `
          <p>Ordainketa <strong>egunean bertan txosnan</strong> egingo duzula adierazi duzu.</p>
          <p>Gogoan izan 10€-ak justu ekartzea eskertuko dizugula txanpon-aldaketekin arazoak ekiditeko.</p>
        `;
      }

      const menuMezua = menuType === 'beganoa' ? '🌱 Menu Beganoa' : '🍖 Menu Haragijalea';

      const mailOptions = {
        from: `"Pikutara Gazte Konpartsa" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `✅ Bazkarirako izen-ematea baieztatuta - Gazte Eguna`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #700070; padding: 20px; text-align: center;">
              <h1 style="color: #fff; margin: 0; text-transform: uppercase;">Gazte Eguneko Bazkaria</h1>
            </div>
            <div style="padding: 30px;">
              <p>Kaixo <strong>${izena}</strong>,</p>
              <p>Zure izen-ematea ondo jaso dugu. Hau da your erregistroaren laburpena:</p>
              
              <div style="background-color: #fff4f4; border-left: 4px solid #ff0000; padding: 15px; margin: 20px 0;">
                <ul style="list-style: none; padding: 0; margin: 0;">
                  <li style="margin-bottom: 10px;"><strong>👤 Izena:</strong> ${izena} ${abizenak}${mote ? `<strong> ${mote}</strong>` : ""}</li>
                  <li><strong>🍽️ Menua:</strong> ${menuMezua}</li>
                  ${oharrak ? `<li style="color: #ff3366; font-weight: bold;"><strong>⚠️ Alergiak/Oharrak:</strong> ${oharrak}</li>` : ''}
                </ul>
              </div>

              <h3 style="color: #700070; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 30px;">Ordainketa (Pago)</h3>
              ${ordainketaMezua}

              <p style="margin-top: 30px;">Eskerrik asko gazte egunean parte hartzeagatik.<br>Laster arte!</p>
              <p style="font-weight: bold; color: #ff0000;">SESTAO ASTINTZERA!</p>
            </div>
          </div>
        `
      };

      // 3. Send email asynchronously (non-blocking)
      MailService.sendMail(mailOptions).catch((err) => {
        console.error('BazkariaController: async mail send failed:', err);
      });

      res.status(201).json({ success: true, message: 'Izen ematea ondo burutu da.' });
    } catch (error: any) {
      console.error('Errorea bazkariko izen-ematea gordetzean:', error);
      res.status(500).json({ error: 'Zerbitzari errorea.' });
    }
  }

  static async listRegistrations(req: Request, res: Response): Promise<void> {
    try {
      const registrations = await registrationRepo.findAll();
      res.json(registrations);
    } catch (error: any) {
      console.error('Errorea registrations bilatzean:', error);
      res.status(500).json({ error: 'Erro no servidor (Zerbitzari errorea).' });
    }
  }

  static async deleteRegistration(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await registrationRepo.delete(Number(id));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Errorea registration ezabatzean:', error);
      res.status(500).json({ error: 'Errorea ezabatzean.' });
    }
  }

  static async togglePaidRegistration(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const registration = await registrationRepo.findById(Number(id));
      if (!registration) {
        res.status(404).json({ error: 'Izen-ematea ez da aurkitu (No encontrado).' });
        return;
      }

      const newPaidStatus = registration.is_paid === 1 ? 0 : 1;
      await registrationRepo.updatePaymentStatus(Number(id), newPaidStatus);
      res.json({ success: true, is_paid: newPaidStatus });
    } catch (error: any) {
      console.error('Errorea ordainketa egoera aldatzean:', error);
      res.status(500).json({ error: 'Errorea egoera aldatzean.' });
    }
  }

  static async resendEmail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const registration = await registrationRepo.findById(Number(id));
      if (!registration) {
        res.status(404).json({ error: 'Izen-ematea ez da aurkitu.' });
        return;
      }

      const { izena, abizenak, email, menu_type, ordainketa_modua, konpartsakide_id, oharrak, mote } = registration;

      let ordainketaMezua = '';

      if (ordainketa_modua === 'aurretiaz' && konpartsakide_id) {
        const k = await konpartsakideRepo.findById(Number(konpartsakide_id));
        const konpartsakideIzena = k ? k.izena : 'konpartsakide bati';

        let kontaktuKutxa = '';
        if (k && (k.telefono || k.instagram)) {
          kontaktuKutxa += `<div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #ddd;">`;
          kontaktuKutxa += `<p style="margin-top: 0; margin-bottom: 10px; color: #700070;"><strong>${konpartsakideIzena}-(r)en kontaktua:</strong></p>`;
          kontaktuKutxa += `<ul style="list-style: none; padding: 0; margin: 0; line-height: 1.8;">`;

          if (k.telefono) {
            kontaktuKutxa += `<li>📱 <strong>Telefonoa:</strong> <a href="tel:${k.telefono}" style="color: #ff0000; text-decoration: none; font-weight: bold;">${k.telefono}</a></li>`;
          }

          if (k.instagram) {
            const cleanInsta = k.instagram.replace(/^@/, '');
            kontaktuKutxa += `<li>📸 <strong>Instagram:</strong> <a href="https://ig.me/m/${cleanInsta}" style="color: #ff0000; text-decoration: none; font-weight: bold;">@${cleanInsta}</a></li>`;
          }

          kontaktuKutxa += `<li>⚠️ <strong>Arazorik baldin baduzu</strong>, edo ordainketa egiteko zailtasunak badituzu, ez izan zalantzarik eta jarri gurekin harremanetan: <a href="mailto:pikutaragaztekonpartsa@gmail.com" style="color: #ff0000; text-decoration: none; font-weight: bold;">pikutaragaztekonpartsa@gmail.com</a></li>`;
          kontaktuKutxa += `</ul></div>`;
        }

        ordainketaMezua = `
          <p>Ordainketa egiteko <strong>${konpartsakideIzena}</strong>-(r)ekin geratu zara.</p>
          <p>Mesedez, jarri berarekin harremanetan ahalik eta lasterren 10€-ak emateko zure lekua 100% ziurtatzeko.</p>
          <p>Konpartsakideari ordainketa egitea zailtzen bazaizu, edo bestelako arazoak badituzu, ez izan zalantzarik eta jarri gurekin harremanetan.</p>
          ${kontaktuKutxa}
        `;
      } else if (ordainketa_modua === 'ganetza_presentziala') {
        ordainketaMezua = `
          <p>Ordainketa <strong>Ganetzan presentzialki</strong> egitea hautatu duzu.</p>
          <p>Azken orduko ordainketa egiteko, astelehenetik asteazkenera (Ekainak 15, 16 eta 17) Ganetzan egongo gara arratsaldeko <strong>17:00etatik 20:30era</strong>.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #ddd;">
            <p style="margin: 0;">📍 <strong>Ganetza:</strong> <a href="https://maps.app.goo.gl/5Ak6exkS6NBfTKBg9" style="color: #ff0000; text-decoration: none; font-weight: bold;">Ikusi Google Maps-en</a></p>
          </div>
        `;
      } else if (ordainketa_modua === 'pikutara_zuzenean') {
        ordainketaMezua = `
          <p>Ordainketa nola egin adosteko gurekin (Pikutara) harremanetan jarriko zinela adierazi duzu.</p>
          <p>Aukeratu bi bide hauetako bat ordainketa bidea ixteko:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #ddd;">
            <ul style="list-style: none; padding: 0; margin: 0; line-height: 1.8;">
              <li>📸 <strong>Instagram:</strong> <a href="https://ig.me/m/pikutaragaztekonpartsa" style="color: #ff0000; text-decoration: none; font-weight: bold;">@pikutaragaztekonpartsa</a></li>
              <li>📧 <strong>Emaila:</strong> <a href="mailto:pikutaragaztekonpartsa@gmail.com" style="color: #ff0000; text-decoration: none; font-weight: bold;">pikutaragaztekonpartsa@gmail.com (Bidali posta)</a></li>
            </ul>
          </div>
        `;
      } else {
        ordainketaMezua = `
          <p>Ordainketa <strong>egunean bertan txosnan</strong> egingo duzula adierazi duzu.</p>
          <p>Gogoan izan 10€-ak justu ekartzea eskertuko dizugula txanpon-aldaketekin arazoak ekiditeko.</p>
        `;
      }

      const menuMezua = menu_type === 'beganoa' ? '🌱 Menu Beganoa' : '🍖 Menu Haragijalea';

      const mailOptions = {
        from: `"Pikutara Gazte Konpartsa" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `✅ Bazkarirako izen-ematea baieztatuta - Gazte Eguna`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #700070; padding: 20px; text-align: center;">
              <h1 style="color: #fff; margin: 0; text-transform: uppercase;">Gazte Eguneko Bazkaria</h1>
            </div>
            <div style="padding: 30px;">
              <p>Kaixo <strong>${izena}</strong>,</p>
              <p>Hona hemen zure bazkarirako izen-ematearen kopia berri bat:</p>
              
              <div style="background-color: #fff4f4; border-left: 4px solid #ff0000; padding: 15px; margin: 20px 0;">
                <ul style="list-style: none; padding: 0; margin: 0;">
                  <li style="margin-bottom: 10px;"><strong>👤 Izena:</strong> ${izena} ${abizenak}${mote ? `<strong> ${mote}</strong>` : ""}</li>
                  <li><strong>🍽️ Menua:</strong> ${menuMezua}</li>
                  ${oharrak ? `<li style="color: #ff3366; font-weight: bold;"><strong>⚠️ Alergiak/Oharrak:</strong> ${oharrak}</li>` : ''}
                </ul>
              </div>

              <h3 style="color: #700070; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 30px;">Ordainketa</h3>
              ${ordainketaMezua}

              <p style="margin-top: 30px;">Eskerrik asko gazte egunean parte hartzeagatik.<br>Laster arte!</p>
              <p style="font-weight: bold; color: #ff0000;">SESTAO ASTINTZERA!</p>
            </div>
          </div>
        `
      };

      await MailService.sendMail(mailOptions);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Errorea posta berriz bidaltzean:', error);
      res.status(500).json({ error: error.message || 'Errorea posta berriz bidaltzean.' });
    }
  }
}
