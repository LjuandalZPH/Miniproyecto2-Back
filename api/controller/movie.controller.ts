// controllers/movie.controller.ts
import { Request, Response } from "express";
import Movie from "../models/movies"; 
import axios from "axios";

// Crear movie manual
export const createMovie = async (req: Request, res: Response) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    res.status(201).json(movie);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// Listar movies
export const getMovies = async (req: Request, res: Response) => {
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Obtener por id
export const getMovieById = async (req: Request, res: Response) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: "Movie not found" });
    res.json(movie);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Actualizar movie completo (PUT)
export const updateMovie = async (req: Request, res: Response) => {
  try {
    const updated = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: "Movie not found" });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Borrar movie
export const deleteMovie = async (req: Request, res: Response) => {
  try {
    const deleted = await Movie.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Movie not found" });
    res.json({ message: "Deleted", id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Toggle favorito (PATCH /:id/favorite)
export const toggleFavorite = async (req: Request, res: Response) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: "Movie not found" });
    movie.favorite = !movie.favorite;
    await movie.save();
    res.json({ message: "Favorite toggled", favorite: movie.favorite });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Añadir comentario (POST /:id/comments)
export const addComment = async (req: Request, res: Response) => {
  try {
    const { user, text, rating } = req.body;
    if (!user || !text) return res.status(400).json({ error: "user and text required" });

    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: "Movie not found" });

    movie.comments.push({ user, text, rating: rating ?? 3 });
    // opcional: recalcular rating promedio
    if (movie.comments.length > 0) {
      const avg = movie.comments.reduce((sum: any, c: any) => sum + (c.rating || 0), 0) / movie.comments.length;
      movie.rating = parseFloat(avg.toFixed(2));
    }

    await movie.save();
    res.status(201).json(movie);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Importar desde Pexels (POST /api/movies/import/pexels)
export const importFromPexels = async (req: Request, res: Response) => {
  try {
    const { query = "movie trailer", per_page = 10 } = req.body || {};
    const API_KEY = process.env.PEXELS_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: "PEXELS_API_KEY not set" });

    const resp = await axios.get("https://api.pexels.com/videos/search", {
      headers: { Authorization: API_KEY },
      params: { query, per_page }
    });

    const videos = resp.data.videos || [];

    const imported: any[] = [];
    for (const v of videos) {
      // toma la primera variante de video disponible y una imagen
      const videoFile = v.video_files && v.video_files.length ? v.video_files[0].link : null;
      const image = v.video_pictures && v.video_pictures.length ? v.video_pictures[0].picture : null;
      const title = v.user?.name || v.id?.toString() || "Pexels video";

      if (!videoFile) continue;

      // evita duplicados por videoUrl
      const exists = await Movie.findOne({ videoUrl: videoFile });
      if (exists) continue;

      const doc = new Movie({
        title,
        genre: "Desconocido",
        author: v.user?.name || "Pexels",
        rating: 0,
        videoUrl: videoFile,
        image: image,
        favorite: false,
        comments: []
      });

      await doc.save();
      imported.push(doc);
    }

    res.json({ message: "Import completed", count: imported.length, imported });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
