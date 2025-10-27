import fs from "fs";
import path from "path";

export interface SubtitleItem {
  lang: string;   // "es", "en", etc.
  label: string;  // "Español", "English", etc.
  src: string;    // "/subtitles/<id>.<lang>.vtt"
  default?: boolean;
}

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
 * Construye el array de pistas si existen archivos VTT con el patrón "<movieId>.<lang>.vtt"
 * en la carpeta /subtitles. No persiste en BD; solo es para responder la API.
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

  // Marca una pista por defecto: prioriza "es", si no, la primera
  if (tracks.length > 0) {
    const esIdx = tracks.findIndex(t => t.lang.toLowerCase() === "es");
    const idx = esIdx >= 0 ? esIdx : 0;
    tracks[idx].default = true;
  }

  return tracks;
}