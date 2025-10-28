import { Request, Response } from 'express';
import { searchPhotos, searchVideos } from '../services/pexels.service';

/**
 * Controller: Pexels media endpoints
 *
 * This module exports handlers for retrieving photos and videos from the
 * Pexels service. Handlers expect certain query parameters and forward the
 * request to the service layer functions `searchPhotos` and `searchVideos`.
 * The controller is responsible for basic validation of required parameters
 * and mapping query values to the argument shapes expected by the service.
 */

/**
 * GET /photos
 *
 * Query parameters (all come from req.query):
 * - query: string (required) - search term
 * - page: number (optional, default 1)
 * - per_page: number (optional, default 15, max 80)
 * - orientation: 'landscape' | 'portrait' | 'square' (optional)
 * - size: 'large' | 'medium' | 'small' (optional)
 * - color: string (optional)
 * - locale: string (optional)
 *
 * Behavior:
 * - Validates that `query` is present and non-empty. If missing, responds
 *   with 400 and an error JSON payload.
 * - Calls `searchPhotos` from the service layer with normalized parameters
 *   and returns `{ photos: data.photos }` on success.
 * - On unexpected errors, logs the error and responds 502 Bad Gateway.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response|void>} Sends an HTTP response; does not throw.
 */
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
/**
 * GET /videos
 *
 * Query parameters (from req.query):
 * - query: string (required) - search term
 * - page: number (optional, default 1)
 * - per_page: number (optional, default 15, max 80)
 * - min_width: number (optional)
 * - min_height: number (optional)
 * - min_duration: number (optional)
 * - max_duration: number (optional)
 *
 * Behavior:
 * - Validates that `query` is present and non-empty. If missing, responds
 *   with 400 and an error JSON payload.
 * - Calls `searchVideos` from the service layer with normalized parameters
 *   and returns the service response on success.
 * - On unexpected errors, logs the error and responds 502 Bad Gateway.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response|void>} Sends an HTTP response; does not throw.
 */
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