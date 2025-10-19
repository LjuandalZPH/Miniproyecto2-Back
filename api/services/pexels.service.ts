import axios from "axios";
import { createClient, type Photo, type Photos } from "pexels";

// Inicializar cliente
const apiKey = process.env.PEXELS_API_KEY;
if (!apiKey) {
  throw new Error("Falta la variable de entorno PEXELS_API_KEY");
}
const client = createClient(apiKey);

// Tipos normalizados
export type NormalizedPhoto = {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
    landscape: string;
    portrait: string;
    tiny: string;
  };
};

export type NormalizedVideoFile = {
  id: number;
  quality: string;
  file_type: string;
  width: number | null;
  height: number | null;
  link: string;
};

export type NormalizedVideo = {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  video_files: NormalizedVideoFile[];
};

type PexelsError = { error: string };

function isPexelsError(x: unknown): x is PexelsError {
  return !!x && typeof x === "object" && "error" in (x as any);
}

function isPhotos(x: unknown): x is Photos {
  return !!x && typeof x === "object" && Array.isArray((x as any).photos);
}

function normalizePhoto(p: Photo): NormalizedPhoto {
  return {
    id: p.id,
    width: p.width,
    height: p.height,
    url: p.url,
    photographer: p.photographer,
    photographer_url: p.photographer_url,
    src: {
      original: p.src.original,
      large: p.src.large,
      medium: p.src.medium,
      small: p.src.small,
      landscape: p.src.landscape,
      portrait: p.src.portrait,
      tiny: p.src.tiny,
    },
  };
}

function normalizeVideo(v: any): NormalizedVideo {
  return {
    id: v.id,
    width: v.width,
    height: v.height,
    url: v.url,
    image: v.image,
    duration: v.duration,
    video_files: v.video_files.map((f: any) => ({
      id: f.id,
      quality: f.quality,
      file_type: f.file_type,
      width: f.width ?? null,
      height: f.height ?? null,
      link: f.link,
    })),
  };
}

export async function searchPhotos(params: {
  query: string;
  page?: number;
  per_page?: number;
  orientation?: "landscape" | "portrait" | "square";
  size?: "large" | "medium" | "small";
  color?: string;
  locale?: string;
}) {
  const { query, page = 1, per_page = 15, orientation, size, color, locale } = params;

  const result = await client.photos.search({
    query,
    page,
    per_page,
    orientation,
    size,
    color,
    locale,
  });

  if (isPexelsError(result)) {
    throw new Error(`Pexels Photos error: ${result.error}`);
  }
  if (!isPhotos(result)) {
    throw new Error("Respuesta inesperada de Pexels Photos");
  }

  return {
    total_results: (result as any).total_results ?? undefined,
    page: (result as any).page ?? page,
    per_page: (result as any).per_page ?? per_page,
    photos: result.photos.map(normalizePhoto),
  };
}

export async function searchVideos(params: {
  query: string;
  page?: number;
  per_page?: number;
  min_width?: number;
  min_height?: number;
  min_duration?: number;
  max_duration?: number;
}) {
  const {
    query,
    page = 1,
    per_page = 15,
    min_width,
    min_height,
    min_duration,
    max_duration,
  } = params;

  try {
    const response = await axios.get("https://api.pexels.com/videos/search", {
      headers: { Authorization: apiKey },
      params: { query, page, per_page, min_width, min_height, min_duration, max_duration },
    });

    const data = response.data;

    if (!data.videos || !Array.isArray(data.videos)) {
      console.error("Respuesta inesperada de Pexels:", data);
      throw new Error("Error al obtener videos desde Pexels");
    }

    return {
      total_results: data.total_results,
      page: data.page,
      per_page: data.per_page,
      videos: data.videos.map(normalizeVideo),
    };
  } catch (err: any) {
    console.error("Error Pexels videos:", err.message);
    throw new Error("Error al obtener videos desde Pexels");
  }
}
