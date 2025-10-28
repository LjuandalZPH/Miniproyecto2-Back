/**
 * POST /api/subtitles/auto
 * Body: { movieId: string, videoUrl: string }
 *
 * Generates ES/EN WebVTT with OpenAI Whisper and returns the subtitles array.
 * You can persist it to your Movie model after generation.
 */

import { Router } from "express";
import { generateVttSubtitles } from "../services/subtitles.service";

const router = Router();

router.post("/auto", async (req, res) => {
  try {
    const { movieId, videoUrl } = req.body || {};
    if (!movieId || !videoUrl) {
      return res.status(400).json({ message: "movieId and videoUrl are required" });
    }

    const urls = await generateVttSubtitles(String(movieId), String(videoUrl));

    // Structure ready to store in your Movie document
    const subtitles = [
      { lang: "es", label: "Español", src: urls.es, default: true },
      { lang: "en", label: "English", src: urls.en },
    ];

    // Optional: persist in DB (uncomment and adapt to your Movie model)
    // await Movie.findByIdAndUpdate(movieId, { $set: { subtitles } });

    return res.json({ movieId, subtitles });
  } catch (err: any) {
    console.error("AutoSubtitles error:", err);
    return res.status(500).json({ message: err?.message || "Failed to generate subtitles" });
  }
});

export default router;