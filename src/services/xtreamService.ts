import axios from 'axios';
import { XtreamAuthResponse, XtreamCategory, XtreamStream } from '../types';

const proxyRequest = async (url: string, method: string = 'GET', data?: any, params?: any) => {
  const response = await axios.post('/api/proxy', {
    url,
    method,
    data,
    params,
  });
  return response.data;
};

export const xtreamService = {
  authenticate: async (username: string, password: string): Promise<XtreamAuthResponse> => {
    const host = "https://livetvplay.com.br"; // Fixed DNS as per App.tsx
    const url = `${host}/player_api.php`;
    const params = { username, password };
    const data = await proxyRequest(url, 'GET', undefined, params);
    if (data?.user_info?.auth === 1) {
      return data;
    } else {
      throw new Error('Falha no login. Verifique suas credenciais.');
    }
  },

  getLiveCategories: async (username: string, password: string): Promise<XtreamCategory[]> => {
    const host = "https://livetvplay.com.br";
    const url = `${host}/player_api.php`;
    const params = { username, password, action: 'get_live_categories' };
    return await proxyRequest(url, 'GET', undefined, params);
  },

  getLiveStreams: async (username: string, password: string, categoryId?: string): Promise<XtreamStream[]> => {
    const host = "https://livetvplay.com.br";
    const url = `${host}/player_api.php`;
    const params: any = { username, password, action: 'get_live_streams' };
    if (categoryId) params.category_id = categoryId;
    return await proxyRequest(url, 'GET', undefined, params);
  },

  getMovieCategories: async (username: string, password: string): Promise<XtreamCategory[]> => {
    const host = "https://livetvplay.com.br";
    const url = `${host}/player_api.php`;
    const params = { username, password, action: 'get_vod_categories' };
    return await proxyRequest(url, 'GET', undefined, params);
  },

  getMovies: async (username: string, password: string, categoryId?: string): Promise<XtreamStream[]> => {
    const host = "https://livetvplay.com.br";
    const url = `${host}/player_api.php`;
    const params: any = { username, password, action: 'get_vod_streams' };
    if (categoryId) params.category_id = categoryId;
    return await proxyRequest(url, 'GET', undefined, params);
  },

  getSeriesCategories: async (username: string, password: string): Promise<XtreamCategory[]> => {
    const host = "https://livetvplay.com.br";
    const url = `${host}/player_api.php`;
    const params = { username, password, action: 'get_series_categories' };
    return await proxyRequest(url, 'GET', undefined, params);
  },

  getSeries: async (username: string, password: string, categoryId?: string): Promise<XtreamStream[]> => {
    const host = "https://livetvplay.com.br";
    const url = `${host}/player_api.php`;
    const params: any = { username, password, action: 'get_series' };
    if (categoryId) params.category_id = categoryId;
    return await proxyRequest(url, 'GET', undefined, params);
  },

  getStreamUrl: (username: string, password: string, streamId: number, extension: string = 'ts') => {
    const host = "https://livetvplay.com.br";
    const url = `${host}/live/${username}/${password}/${streamId}.${extension}`;
    return xtreamService.getProxiedUrl(url);
  },

  getMovieUrl: (username: string, password: string, streamId: number, extension: string = 'mp4') => {
    const host = "https://livetvplay.com.br";
    const url = `${host}/movie/${username}/${password}/${streamId}.${extension}`;
    return xtreamService.getProxiedUrl(url);
  },

  getSeriesUrl: (username: string, password: string, streamId: number, extension: string = 'mp4') => {
    const host = "https://livetvplay.com.br";
    const url = `${host}/series/${username}/${password}/${streamId}.${extension}`;
    return xtreamService.getProxiedUrl(url);
  },

  getProxiedUrl: (url: string) => {
    try {
      const urlObj = new URL(url);
      const host = urlObj.origin;
      const path = urlObj.pathname.substring(1) + urlObj.search;
      const encodedHost = btoa(host);
      return `/proxy-stream/${encodedHost}/${path}`;
    } catch (e) {
      return url;
    }
  }
};
