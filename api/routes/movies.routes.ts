
import { Router } from "express";
import {
  createMovie,
  getMovies,
  getMovieById,
  updateMovie,
  deleteMovie,
  addComment,
  deleteComment,
  importFromPexels
} from "../controller/movie.controller";

const router = Router();


router.post("/import/pexels", importFromPexels); 


router.post("/", createMovie);
router.get("/", getMovies);
router.get("/:id", getMovieById);
router.put("/:id", updateMovie);
router.delete("/:id", deleteMovie);


router.post("/:id/comments", addComment);
router.delete("/:id/comments/:commentId", deleteComment);

export default router;
