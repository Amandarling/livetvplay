export interface XtreamCredentials {
  server: string;
  username: string;
  password: string;
}

export interface XtreamUserInfo {
  username: string;
  password: string;
  status: string;
  exp_date: string;
  active_cons: string;
  max_connections: string;
}

export interface XtreamCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface XtreamLiveStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  category_id: string;
  is_adult: string;
}

export interface XtreamVodStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  category_id: string;
  container_extension: string;
  rating: string;
}

export interface XtreamSeries {
  series_id: number;
  name: string;
  cover: string;
  category_id: string;
  rating: string;
  plot: string;
}

export interface XtreamSeriesInfo {
  seasons: Record<string, { name: string; season_number: number; episodes: XtreamEpisode[] }>;
  info: XtreamSeries;
  episodes: Record<string, XtreamEpisode[]>;
}

export interface XtreamEpisode {
  id: string;
  episode_num: number;
  title: string;
  container_extension: string;
  info: { movie_image?: string; plot?: string; duration?: string };
  season: number;
}

function baseUrl(creds: XtreamCredentials): string {
  let server = creds.server.trim();
  if (!server.startsWith('http')) server = 'http://' + server;
  if (server.endsWith('/')) server = server.slice(0, -1);
  return server;
}

const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

async function fetchWithProxy(url: string): Promise<Response> {
  // Try direct first
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) return res;
  } catch {}

  // Try proxies
  for (const proxy of CORS_PROXIES) {
    try {
      const res = await fetch(proxy(url));
      if (res.ok) return res;
    } catch {}
  }

  throw new Error('Não foi possível conectar ao servidor. Verifique o endereço e tente novamente.');
}

export async function authenticate(creds: XtreamCredentials): Promise<XtreamUserInfo> {
  const url = `${baseUrl(creds)}/player_api.php?username=${creds.username}&password=${creds.password}`;
  const res = await fetchWithProxy(url);
  const data = await res.json();
  if (!data.user_info) throw new Error('Credenciais inválidas');
  return data.user_info;
}

export async function getLiveCategories(creds: XtreamCredentials): Promise<XtreamCategory[]> {
  const url = `${baseUrl(creds)}/player_api.php?username=${creds.username}&password=${creds.password}&action=get_live_categories`;
  const res = await fetchWithProxy(url);
  return res.json();
}

export async function getLiveStreams(creds: XtreamCredentials, categoryId?: string): Promise<XtreamLiveStream[]> {
  let url = `${baseUrl(creds)}/player_api.php?username=${creds.username}&password=${creds.password}&action=get_live_streams`;
  if (categoryId) url += `&category_id=${categoryId}`;
  const res = await fetchWithProxy(url);
  return res.json();
}

export async function getVodCategories(creds: XtreamCredentials): Promise<XtreamCategory[]> {
  const url = `${baseUrl(creds)}/player_api.php?username=${creds.username}&password=${creds.password}&action=get_vod_categories`;
  const res = await fetchWithProxy(url);
  return res.json();
}

export async function getVodStreams(creds: XtreamCredentials, categoryId?: string): Promise<XtreamVodStream[]> {
  let url = `${baseUrl(creds)}/player_api.php?username=${creds.username}&password=${creds.password}&action=get_vod_streams`;
  if (categoryId) url += `&category_id=${categoryId}`;
  const res = await fetchWithProxy(url);
  return res.json();
}

export async function getSeriesCategories(creds: XtreamCredentials): Promise<XtreamCategory[]> {
  const url = `${baseUrl(creds)}/player_api.php?username=${creds.username}&password=${creds.password}&action=get_series_categories`;
  const res = await fetchWithProxy(url);
  return res.json();
}

export async function getSeries(creds: XtreamCredentials, categoryId?: string): Promise<XtreamSeries[]> {
  let url = `${baseUrl(creds)}/player_api.php?username=${creds.username}&password=${creds.password}&action=get_series`;
  if (categoryId) url += `&category_id=${categoryId}`;
  const res = await fetchWithProxy(url);
  return res.json();
}

export async function getSeriesInfo(creds: XtreamCredentials, seriesId: number): Promise<XtreamSeriesInfo> {
  const url = `${baseUrl(creds)}/player_api.php?username=${creds.username}&password=${creds.password}&action=get_series_info&series_id=${seriesId}`;
  const res = await fetchWithProxy(url);
  return res.json();
}

export function getLiveStreamUrl(creds: XtreamCredentials, streamId: number): string {
  return `${baseUrl(creds)}/live/${creds.username}/${creds.password}/${streamId}.ts`;
}

export function getVodStreamUrl(creds: XtreamCredentials, streamId: number, extension: string): string {
  return `${baseUrl(creds)}/movie/${creds.username}/${creds.password}/${streamId}.${extension}`;
}

export function getSeriesStreamUrl(creds: XtreamCredentials, episodeId: string, extension: string): string {
  return `${baseUrl(creds)}/series/${creds.username}/${creds.password}/${episodeId}.${extension}`;
}
