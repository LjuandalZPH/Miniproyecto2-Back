import { Request, Response } from "express";
import Movie from "../models/movies";
import axios from "axios";

/**
 * Create a new movie from request body.
 */
export const createMovie = async (req: Request, res: Response) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    res.status(201).json(movie);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Get movies list, optionally filtered by "search" query param.
 * - Matches partial title (case-insensitive).
 * Example: GET /api/movies?search=man
 */
export const getMovies = async (req: Request, res: Response) => {
  try {
    const { search } = req.query as { search?: string };
    const filter: Record<string, any> = {};

    // Apply partial, case-insensitive match on "title" when search is present
    if (search && search.trim()) {
      filter.title = { $regex: search.trim(), $options: "i" };
    }

    const movies = await Movie.find(filter);
    res.json(movies);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get a single movie by its ID.
 */
export const getMovieById = async (req: Request, res: Response) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: "Movie not found" });
    res.json(movie);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update a movie (full update).
 */
export const updateMovie = async (req: Request, res: Response) => {
  try {
    const updated = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: "Movie not found" });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete a movie by ID.
 */
export const deleteMovie = async (req: Request, res: Response) => {
  try {
    const deleted = await Movie.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Movie not found" });
    res.json({ message: "Deleted", id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};



/**
 * Add a new comment to a movie and recalculate average rating.
 */
export const addComment = async (req: Request, res: Response) => {
  try {
    const { user, text, rating } = req.body;
    if (!user || !text) {
      return res.status(400).json({ error: "user and text required" });
    }

    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: "Movie not found" });

    movie.comments.push({ user, text, rating: rating ?? 3 });

    // Recalculate average rating based on comments
    if (movie.comments.length > 0) {
      const avg =
        movie.comments.reduce((sum: number, c: any) => sum + (c.rating || 0), 0) /
        movie.comments.length;
      movie.rating = parseFloat(avg.toFixed(2));
    }

    await movie.save();
    res.status(201).json(movie);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete a comment from a movie by comment id and recalculate average rating.
 */
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { id, commentId } = req.params;

    const movie = await Movie.findById(id);
    if (!movie) return res.status(404).json({ error: "Movie not found" });

    // Find the comment - works whether comments are subdocs or plain objects
    const exists = (movie as any).comments.find((c: any) => {
      // support both `c._id` (ObjectId) and `c.id` or string id
      const cid = c?._id?.toString?.() ?? c?.id ?? c;
      return cid === commentId;
    });

    if (!exists) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Remove the comment(s) with matching id
    (movie as any).comments = (movie as any).comments.filter((c: any) => {
      const cid = c?._id?.toString?.() ?? c?.id ?? c;
      return cid !== commentId;
    });

    // Recalculate average rating after removal
    if ((movie as any).comments.length > 0) {
      const avg =
        (movie as any).comments.reduce((sum: number, c: any) => sum + (c.rating || 0), 0) /
        (movie as any).comments.length;
      movie.rating = parseFloat(avg.toFixed(2));
    } else {
      movie.rating = 0;
    }

    await movie.save();
    res.json({ message: "Comment deleted", movie });
  } catch (err: any) {
    console.error("deleteComment error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

/**
 * Import movies from Pexels API and store them if not duplicated.
 */
export const importFromPexels = async (req: Request, res: Response) => {
  try {
    const { query = "movie trailer", per_page = 10 } = req.body || {};
    const API_KEY = process.env.PEXELS_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: "PEXELS_API_KEY not set" });

    const resp = await axios.get("https://api.pexels.com/videos/search", {
      headers: { Authorization: API_KEY },
      params: { query, per_page },
    });

    const videos = resp.data.videos || [];
    const imported: any[] = [];

    for (const v of videos) {
      // Pick the first available video file and picture
      const videoFile =
        v.video_files && v.video_files.length ? v.video_files[0].link : null;
      const image =
        v.video_pictures && v.video_pictures.length ? v.video_pictures[0].picture : null;
      const title = v.user?.name || v.id?.toString() || "Pexels video";

      if (!videoFile) continue;

      // Avoid duplicates by videoUrl
      const exists = await Movie.findOne({ videoUrl: videoFile });
      if (exists) continue;

      const doc = new Movie({
        title,
        genre: "Desconocido",
        author: v.user?.name || "Pexels",
        rating: 0,
        videoUrl: videoFile,
        image,
        favorite: false,
        comments: [],
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