import { XtreamAuthResponse, XtreamCategory, XtreamStream, XtreamEPGResponse } from "@/src/types";
import { GoogleGenAI } from "@google/genai";

const FIXED_DNS = "https://livetvplay.com.br";

// Cache simples em memória
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_DURATION = 1000 * 60 * 15; // 15 minutos

export const xtreamService = {
  async authenticate(username: string, password: string): Promise<XtreamAuthResponse> {
    const url = `${FIXED_DNS}/player_api.php?username=${username}&password=${password}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Falha na autenticação");
    const data = await response.json();
    if (data.user_info.auth === 0) throw new Error("Usuário ou senha inválidos");
    return data;
  },

  async getLiveCategories(username: string, password: string): Promise<XtreamCategory[]> {
    const cacheKey = `live_categories_${username}`;
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
      return cache[cacheKey].data;
    }
    const url = `${FIXED_DNS}/player_api.php?username=${username}&password=${password}&action=get_live_categories`;
    const response = await fetch(url);
    const data = await response.json();
    cache[cacheKey] = { data, timestamp: Date.now() };
    return data;
  },

  async getLiveStreams(username: string, password: string, categoryId?: string): Promise<XtreamStream[]> {
    const cacheKey = `live_streams_${username}_${categoryId || 'all'}`;
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
      return cache[cacheKey].data;
    }
    let url = `${FIXED_DNS}/player_api.php?username=${username}&password=${password}&action=get_live_streams`;
    if (categoryId) url += `&category_id=${categoryId}`;
    const response = await fetch(url);
    const data = await response.json();
    cache[cacheKey] = { data, timestamp: Date.now() };
    return data;
  },

  async getMovieCategories(username: string, password: string): Promise<XtreamCategory[]> {
    const cacheKey = `movie_categories_${username}`;
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
      return cache[cacheKey].data;
    }
    const url = `${FIXED_DNS}/player_api.php?username=${username}&password=${password}&action=get_vod_categories`;
    const response = await fetch(url);
    const data = await response.json();
    cache[cacheKey] = { data, timestamp: Date.now() };
    return data;
  },

  async getMovies(username: string, password: string, categoryId?: string): Promise<XtreamStream[]> {
    const cacheKey = `movies_${username}_${categoryId || 'all'}`;
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
      return cache[cacheKey].data;
    }
    let url = `${FIXED_DNS}/player_api.php?username=${username}&password=${password}&action=get_vod_streams`;
    if (categoryId) url += `&category_id=${categoryId}`;
    const response = await fetch(url);
    const data = await response.json();
    cache[cacheKey] = { data, timestamp: Date.now() };
    return data;
  },

  async getSeriesCategories(username: string, password: string): Promise<XtreamCategory[]> {
    const cacheKey = `series_categories_${username}`;
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
      return cache[cacheKey].data;
    }
    const url = `${FIXED_DNS}/player_api.php?username=${username}&password=${password}&action=get_series_categories`;
    const response = await fetch(url);
    const data = await response.json();
    cache[cacheKey] = { data, timestamp: Date.now() };
    return data;
  },

  async getSeries(username: string, password: string, categoryId?: string): Promise<XtreamStream[]> {
    const cacheKey = `series_${username}_${categoryId || 'all'}`;
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
      return cache[cacheKey].data;
    }
    let url = `${FIXED_DNS}/player_api.php?username=${username}&password=${password}&action=get_series`;
    if (categoryId) url += `&category_id=${categoryId}`;
    const response = await fetch(url);
    const data = await response.json();
    cache[cacheKey] = { data, timestamp: Date.now() };
    return data;
  },

  async getShortEPG(username: string, password: string, streamId: number): Promise<XtreamEPGResponse> {
    const url = `${FIXED_DNS}/player_api.php?username=${username}&password=${password}&action=get_short_epg&stream_id=${streamId}`;
    const response = await fetch(url);
    return response.json();
  },

  getStreamUrl(username: string, password: string, streamId: number, extension: string = "ts"): string {
    return `${FIXED_DNS}/live/${username}/${password}/${streamId}.${extension}`;
  },

  getMovieUrl(username: string, password: string, streamId: number, extension: string = "mp4"): string {
    return `${FIXED_DNS}/movie/${username}/${password}/${streamId}.${extension}`;
  },

  getSeriesUrl(username: string, password: string, streamId: number, extension: string = "mp4"): string {
    return `${FIXED_DNS}/series/${username}/${password}/${streamId}.${extension}`;
  },

  async findMissingPoster(title: string, type: 'movie' | 'series'): Promise<string | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Find a high-quality poster image URL for the ${type} titled "${title}". Return ONLY the URL string, nothing else. If not found, return an empty string.`,
      });
      const url = response.text.trim();
      return url.startsWith('http') ? url : null;
    } catch (error) {
      console.error("Erro ao buscar capa online:", error);
      return null;
    }
  }
};
