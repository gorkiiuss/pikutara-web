import { Request, Response } from 'express';
import { SQLiteMemeRepository } from '../../infrastructure/repositories/SQLiteMemeRepository.js';
import { ListMemes } from '../../application/use-cases/ListMemes.js';
import { SubmitMeme } from '../../application/use-cases/SubmitMeme.js';
import { VoteMeme } from '../../application/use-cases/VoteMeme.js';
import { UnvoteMeme } from '../../application/use-cases/UnvoteMeme.js';
import { ApproveMeme } from '../../application/use-cases/ApproveMeme.js';
import { UnapproveMeme } from '../../application/use-cases/UnapproveMeme.js';
import { DeleteMeme } from '../../application/use-cases/DeleteMeme.js';

const memeRepository = new SQLiteMemeRepository();

export class MemeController {
  static async listMemes(req: Request, res: Response): Promise<any> {
    try {
      const approvedOnly = req.query.approved === 'true';
      const listUseCase = new ListMemes(memeRepository);
      const memes = await listUseCase.execute(approvedOnly);
      res.json(memes);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Errorea memeak kargatzean' });
    }
  }

  static async submitMeme(req: Request, res: Response): Promise<any> {
    try {
      const { title, contact } = req.body;
      const filename = req.file ? req.file.filename : undefined;

      const submitUseCase = new SubmitMeme(memeRepository);
      await submitUseCase.execute({ title, contact, filename });

      // Redirect back to memes list page (Astro frontend path)
      res.redirect('/memeak?success=true');
    } catch (err: any) {
      res.status(400).send(`Errorea memea igotzean: ${err.message}`);
    }
  }

  static async voteMeme(req: Request, res: Response): Promise<any> {
    try {
      const id = parseInt(req.params.id);
      const voteUseCase = new VoteMeme(memeRepository);
      const updated = await voteUseCase.execute(id);
      res.json({ success: true, votes: updated.votes });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Errorea botoa ematean' });
    }
  }

  static async unvoteMeme(req: Request, res: Response): Promise<any> {
    try {
      const id = parseInt(req.params.id);
      const unvoteUseCase = new UnvoteMeme(memeRepository);
      const updated = await unvoteUseCase.execute(id);
      res.json({ success: true, votes: updated.votes });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Errorea botoa kentzean' });
    }
  }

  static async approveMeme(req: Request, res: Response): Promise<any> {
    try {
      const id = parseInt(req.params.id);
      const approveUseCase = new ApproveMeme(memeRepository);
      await approveUseCase.execute(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Errorea memea onartzean' });
    }
  }

  static async unapproveMeme(req: Request, res: Response): Promise<any> {
    try {
      const id = parseInt(req.params.id);
      const unapproveUseCase = new UnapproveMeme(memeRepository);
      await unapproveUseCase.execute(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Errorea memea baztertzean' });
    }
  }

  static async deleteMeme(req: Request, res: Response): Promise<any> {
    try {
      const id = parseInt(req.params.id);
      const deleteUseCase = new DeleteMeme(memeRepository);
      const success = await deleteUseCase.execute(id);
      res.json({ success });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Errorea memea ezabatzean' });
    }
  }
}
