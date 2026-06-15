import { Request, Response } from 'express';
import { SQLitePosterRepository } from '../../infrastructure/repositories/SQLitePosterRepository.js';
import { ListPosters } from '../../application/use-cases/ListPosters.js';
import { CreatePoster } from '../../application/use-cases/CreatePoster.js';
import { EditPoster } from '../../application/use-cases/EditPoster.js';
import { DeletePoster } from '../../application/use-cases/DeletePoster.js';

const posterRepository = new SQLitePosterRepository();

export class PosterController {
  static async listPosters(req: Request, res: Response): Promise<any> {
    try {
      const listUseCase = new ListPosters(posterRepository);
      const posters = await listUseCase.execute();
      res.json(posters);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Errorea kartelak kargatzean' });
    }
  }

  static async createPoster(req: Request, res: Response): Promise<any> {
    try {
      const { posterTitle, posterDate, posterDesc, posterBands } = req.body;
      const filename = req.file ? req.file.filename : undefined;

      const createUseCase = new CreatePoster(posterRepository);
      await createUseCase.execute({
        title: posterTitle,
        eventDate: posterDate,
        description: posterDesc,
        bands: posterBands,
        filename
      });

      // Original behavior: redirect back to admin page
      res.redirect('/admin');
    } catch (err: any) {
      res.status(400).send(`Errorea kartela igotzean: ${err.message}`);
    }
  }

  static async editPoster(req: Request, res: Response): Promise<any> {
    try {
      const id = parseInt(req.params.id);
      const { posterTitle, posterDate, posterDesc, posterBands } = req.body;
      const filename = req.file ? req.file.filename : undefined;

      const editUseCase = new EditPoster(posterRepository);
      await editUseCase.execute({
        id,
        title: posterTitle,
        eventDate: posterDate,
        description: posterDesc,
        bands: posterBands,
        filename
      });

      // Original behavior: redirect back to admin page
      res.redirect('/admin');
    } catch (err: any) {
      res.status(400).send(`Errorea kartela aldatzean: ${err.message}`);
    }
  }

  static async deletePoster(req: Request, res: Response): Promise<any> {
    try {
      const id = parseInt(req.params.id);
      const deleteUseCase = new DeletePoster(posterRepository);
      const success = await deleteUseCase.execute(id);
      res.json({ success });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Errorea kartela ezabatzean' });
    }
  }
}
