import { Request, Response } from 'express';
import { SQLiteSystemRepository } from '../../infrastructure/repositories/SQLiteSystemRepository.js';
import { GetSections } from '../../application/use-cases/GetSections.js';
import { ToggleSection } from '../../application/use-cases/ToggleSection.js';
import { IncrementPageView } from '../../application/use-cases/IncrementPageView.js';

const systemRepository = new SQLiteSystemRepository();

export class SystemController {
  static async listSections(req: Request, res: Response): Promise<any> {
    try {
      const getSectionsUseCase = new GetSections(systemRepository);
      const sections = await getSectionsUseCase.execute();
      
      // Return sections mapped as key-value pairs (key: is_active) to preserve original API structure
      const mapped: Record<string, boolean> = {};
      sections.forEach(s => {
        mapped[s.key] = s.isActive;
      });
      
      res.json(mapped);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Errorea atalak kargatzean' });
    }
  }

  static async toggleSection(req: Request, res: Response): Promise<any> {
    try {
      const { key } = req.params;
      const toggleUseCase = new ToggleSection(systemRepository);
      const success = await toggleUseCase.execute(key);
      res.json({ success });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Errorea atala aldatzean' });
    }
  }

  static async incrementView(req: Request, res: Response): Promise<any> {
    try {
      const { path } = req.body;
      const incrementUseCase = new IncrementPageView(systemRepository);
      await incrementUseCase.execute(path);
      res.json({ success: true });
    } catch (err: any) {
      res.status(err.message === 'Bidea falta da' ? 400 : 500).json({ error: err.message || 'Errorea bisita erregistratzean' });
    }
  }

  static async proxyImage(req: Request, res: Response): Promise<any> {
    try {
      const { url } = req.query;
      if (!url || typeof url !== 'string') {
        res.status(400).json({ error: 'URL falta da.' });
        return;
      }

      // Validate that url is from allowed domains (youtube, spotify, etc.)
      const parsedUrl = new URL(url);
      if (!['i.scdn.co', 'img.youtube.com', 'i.ytimg.com', 'open.spotify.com', 'ytimg.com'].some(d => parsedUrl.hostname.endsWith(d))) {
        res.status(400).json({ error: 'Esteka ez da baimendutako domeinu batekoa.' });
        return;
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        res.status(response.status).json({ error: `Ezin izan da irudia deskargatu. Egoera kodea: ${response.status}` });
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(Buffer.from(arrayBuffer));
    } catch (error: any) {
      console.error("Error proxying image:", error);
      res.status(500).json({ error: 'Errorea irudia lortzean: ' + error.message });
    }
  }
}
