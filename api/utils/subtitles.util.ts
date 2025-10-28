/**
 * @fileoverview Subtitle track utilities for handling VTT files.
 *
 * This module provides tools for working with WebVTT subtitle files stored
 * in the `/subtitles` directory. It scans for subtitle files matching a
 * specific naming pattern and constructs subtitle track metadata for API
 * responses.
 */

import fs from "fs";
import path from "path";

/**
 * Represents a subtitle track in the application.
 *
 * @interface SubtitleItem
 * @property {string} lang - ISO 639-1 language code (e.g., "es", "en")
 * @property {string} label - Human-readable language name (e.g., "Español", "English")
 * @property {string} src - Path to the VTT file, relative to server root
 * @property {boolean} [default] - Whether this track should be enabled by default
 */
export interface SubtitleItem {
  lang: string;   // "es", "en", etc.
  label: string;  // "Español", "English", etc.
  src: string;    // "/subtitles/<id>.<lang>.vtt"
  default?: boolean;
}

/**
 * Maps ISO 639-1 language codes to their native names.
 *
 * @param {string} lang - ISO 639-1 language code
 * @returns {string} Native name of the language or uppercased code if not found
 */
function labelFromLang(lang: string): string {
  const map: Record<string, string> = {
    es: "Español",
    en: "English",
    fr: "Français",
    de: "Deutsch",
    it: "Italiano",
    pt: "Português",
    "pt-BR": "Português (Brasil)",
  };
  return map[lang] || lang.toUpperCase();
}

/**
 * Build an array of subtitle tracks for a given movie ID.
 *
 * Scans the `/subtitles` directory for VTT files matching the pattern
 * `<movieId>.<lang>.vtt`. Does not persist to the database; intended for
 * constructing API responses only.
 *
 * Behavior:
 * - Returns empty array if `/subtitles` directory doesn't exist
 * - Filters for files matching `movieId.<lang>.vtt`
 * - Sets Spanish track as default if available, otherwise first track
 *
 * @param {string} movieId - ID of the movie to find subtitles for
 * @returns {SubtitleItem[]} Array of subtitle tracks, potentially empty
 */
export function buildSubtitlesForResponse(movieId: string): SubtitleItem[] {
  const dir = path.join(process.cwd(), "subtitles");
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir);
  const rx = new RegExp(`^${movieId}\\.([A-Za-z-]+)\\.vtt$`);
  const tracks: SubtitleItem[] = [];

  for (const filename of entries) {
    const match = filename.match(rx);
    if (!match) continue;
    const lang = match[1];
    tracks.push({
      lang,
      label: labelFromLang(lang),
      src: `/subtitles/${filename}`,
    });
  }

  
  if (tracks.length > 0) {
    const esIdx = tracks.findIndex(t => t.lang.toLowerCase() === "es");
    const idx = esIdx >= 0 ? esIdx : 0;
    tracks[idx].default = true;
  }

  return tracks;
}