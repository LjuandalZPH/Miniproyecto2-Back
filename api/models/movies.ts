import mongoose from "mongoose";

/**
 * Comment subdocument schema for movies.
 *
 * Fields:
 * - user: string (required) — id or identifier of the user who posted the comment.
 * - text: string (required) — the comment body.
 * - rating: number (1-5, default 3) — optional rating attached to the comment.
 *
 * This schema is used as an embedded subdocument inside `movieSchema`.
 */
const commentSchema = new mongoose.Schema({
  user: { type: String, required: true },
  text: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, default: 3 },
});

/**
 * Movie document schema.
 *
 * Fields:
 * - title: string (required) — movie title.
 * - genre: string (optional) — movie genre/category.
 * - author: string (optional) — author/creator of the movie resource.
 * - rating: number (0-5, default 0) — aggregate or displayed rating for the movie.
 * - videoUrl: string (required) — URL to the video content.
 * - image: string (required) — URL to the movie image/thumbnail.
 * - comments: array of comment subdocuments.
 *
 * The schema is intentionally minimal and stores comments as embedded
 * subdocuments using `commentSchema`.
 */
const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  genre: { type: String },
  author: { type: String },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  videoUrl: { type: String, required: true },
  image: { type: String, required: true },
  comments: [commentSchema],
});

/**
 * Mongoose model for movies.
 *
 * Export default: mongoose.Model for the `Movie` collection using `movieSchema`.
 */
export default mongoose.model("Movie", movieSchema);
