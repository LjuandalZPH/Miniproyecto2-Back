import { Request, Response } from 'express';
import { searchPhotos, searchVideos } from '../services/pexels.service';

export async function getPhotos(req: Request, res: Response) {
  try {
    const query = (req.query.query as string) ?? '';
    if (!query.trim()) {
      return res.status(400).json({ error: 'Parámetro "query" es requerido' });
    }

    const page = Number(req.query.page ?? 1);
    const per_page = Math.min(Number(req.query.per_page ?? 15), 80);
    const orientation = req.query.orientation as 'landscape' | 'portrait' | 'square' | undefined;
    const size = req.query.size as 'large' | 'medium' | 'small' | undefined;
    const color = (req.query.color as string) || undefined;
    const locale = (req.query.locale as string) || undefined;

    const data = await searchPhotos({ query, page, per_page, orientation, size, color, locale });
    return res.json({ photos: data.photos });
  } catch (err) {
    console.error('[Pexels Photos] Error:', err);
    return res.status(502).json({ error: 'Error al obtener fotos desde Pexels' });
  }
}

export async function getVideos(req: Request, res: Response) {
  try {
    const query = (req.query.query as string) ?? '';
    if (!query.trim()) {
      return res.status(400).json({ error: 'Parámetro "query" es requerido' });
    }

    const page = Number(req.query.page ?? 1);
    const per_page = Math.min(Number(req.query.per_page ?? 15), 80);
    const min_width = req.query.min_width ? Number(req.query.min_width) : undefined;
    const min_height = req.query.min_height ? Number(req.query.min_height) : undefined;
    const min_duration = req.query.min_duration ? Number(req.query.min_duration) : undefined;
    const max_duration = req.query.max_duration ? Number(req.query.max_duration) : undefined;

    const data = await searchVideos({ query, page, per_page, min_width, min_height, min_duration, max_duration });
    return res.json(data);
  } catch (err) {
    console.error('[Pexels Videos] Error:', err);
    return res.status(502).json({ error: 'Error al obtener videos desde Pexels' });
  }
}