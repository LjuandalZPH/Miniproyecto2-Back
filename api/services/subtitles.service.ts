/**
 * Subtitles generation service using OpenAI Whisper.
 * It downloads the video, generates Spanish and English WebVTT files,
 * saves them under /subtitles, and returns their public URLs.
 *
 * Requires:
 * - OPENAI_API_KEY in environment variables.
 * - Static serving of /subtitles in server.ts with Content-Type text/vtt.
 */

import fs from "fs";
import path from "path";
import axios from "axios";
import OpenAI from "openai";

const SUBTITLES_DIR = path.join(process.cwd(), "subtitles");
const TMP_DIR = path.join(process.cwd(), "tmp");

function ensureDirs() {
  if (!fs.existsSync(SUBTITLES_DIR)) fs.mkdirSync(SUBTITLES_DIR, { recursive: true });
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
}

/**
 * Download a remote file to a local path by streaming it to disk.
 * @param url Remote media URL
 * @param outPath Local output path
 */
async function downloadToFile(url: string, outPath: string): Promise<string> {
  await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
  const writer = fs.createWriteStream(outPath);
  const response = await axios.get(url, { responseType: "stream", timeout: 90_000 });
  await new Promise<void>((resolve, reject) => {
    response.data.pipe(writer);
    writer.on("finish", () => resolve());
    writer.on("error", reject);
  });
  return outPath;
}

/**
 * Generate Spanish and English WebVTT subtitle files for a given movie.
 * @param movieId Movie identifier (used as filename prefix)
 * @param videoUrl Publicly accessible video URL (mp4/webm/etc.)
 * @returns Public URLs for ES and EN VTT files under /subtitles
 */
export async function generateVttSubtitles(movieId: string, videoUrl: string): Promise<{ es: string; en: string; }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  ensureDirs();

  // 1) Download source video
  const tmpFile = path.join(TMP_DIR, `${movieId}.source.mp4`);
  await downloadToFile(videoUrl, tmpFile);

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 2) Transcribe to Spanish VTT
    const esOutPath = path.join(SUBTITLES_DIR, `${movieId}.es.vtt`);
    {
      const vtt = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tmpFile) as any,
        model: "whisper-1",
        response_format: "vtt",
        language: "es",
      } as any);
      await fs.promises.writeFile(esOutPath, String(vtt), "utf8");
    }

    // 3) Translate to English VTT
    const enOutPath = path.join(SUBTITLES_DIR, `${movieId}.en.vtt`);
    {
      const vtt = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tmpFile) as any,
        model: "whisper-1",
        response_format: "vtt",
        language: "es",      // source language
        translate: true as any, // output in English
      } as any);
      await fs.promises.writeFile(enOutPath, String(vtt), "utf8");
    }

    // 4) Return public URLs for the files served from /subtitles
    return {
      es: `/subtitles/${movieId}.es.vtt`,
      en: `/subtitles/${movieId}.en.vtt`,
    };
  } finally {
    // Clean temp file
    fs.promises.unlink(tmpFile).catch(() => void 0);
  }
}