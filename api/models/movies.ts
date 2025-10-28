import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  user: { type: String, required: true },
  text: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, default: 3 },
});

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  genre: { type: String },
  author: { type: String },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  videoUrl: { type: String, required: true },
  image: { type: String, required: true },
  comments: [commentSchema],
});

export default mongoose.model("Movie", movieSchema);
