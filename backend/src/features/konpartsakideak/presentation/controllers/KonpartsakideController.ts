import { Request, Response } from 'express';
import { SQLiteKonpartsakideRepository } from '../../infrastructure/repositories/SQLiteKonpartsakideRepository.js';

const repository = new SQLiteKonpartsakideRepository();

export class KonpartsakideController {
  static async listMoneyCollectors(req: Request, res: Response): Promise<void> {
    try {
      const list = await repository.findMoneyCollectors();
      res.json(list);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Zerbitzari errorea.' });
    }
  }

  static async listKonpartsakideak(req: Request, res: Response): Promise<void> {
    try {
      const list = await repository.findAll();
      res.json(list);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Zerbitzari errorea.' });
    }
  }

  static async createKonpartsakide(req: Request, res: Response): Promise<void> {
    try {
      const { izena, dirua_jaso, instagram, telefono } = req.body;
      if (!izena) {
        res.status(400).json({ error: 'Izena beharrezkoa da.' });
        return;
      }
      await repository.save({
        izena,
        dirua_jaso: dirua_jaso ? 1 : 0,
        instagram: instagram || '',
        telefono: telefono || ''
      });
      res.status(201).json({ success: true });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Errorea gordetzean.' });
    }
  }

  static async updateKonpartsakide(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { izena, dirua_jaso, instagram, telefono } = req.body;
      if (!izena) {
        res.status(400).json({ error: 'Izena beharrezkoa da.' });
        return;
      }
      await repository.update(Number(id), {
        izena,
        dirua_jaso: dirua_jaso ? 1 : 0,
        instagram: instagram || '',
        telefono: telefono || ''
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Errorea eguneratzean.' });
    }
  }

  static async deleteKonpartsakide(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await repository.delete(Number(id));
      res.json({ success: true });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Errorea ezabatzean.' });
    }
  }
}
