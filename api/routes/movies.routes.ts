
import { Router } from "express";
import {
  createMovie,
  getMovies,
  getMovieById,
  updateMovie,
  deleteMovie,
  toggleFavorite,
  addComment,
  importFromPexels
} from "../controller/movie.controller";

const router = Router();


router.post("/import/pexels", importFromPexels); 


router.post("/", createMovie);
router.get("/", getMovies);
router.get("/:id", getMovieById);
router.put("/:id", updateMovie);
router.delete("/:id", deleteMovie);


router.patch("/:id/favorite", toggleFavorite);
router.post("/:id/comments", addComment);

export default router;
