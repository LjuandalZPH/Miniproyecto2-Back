import { Router } from 'express';
import { getPhotos, getVideos } from '../controller/pexels.controller';

const router = Router();

// GET /api/pexels/photos?query=matrix&orientation=portrait&page=1&per_page=10
router.get('/photos', getPhotos);

// GET /api/pexels/videos?query=matrix&page=1&per_page=10
router.get('/videos', getVideos);

export default router;