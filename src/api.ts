import axios from 'axios';

export interface XtreamCredentials {
  host: string;
  username: string;
  password: string;
}

// Helper to proxy requests to bypass CORS
const proxyRequest = async (url: string, method: string = 'GET', data?: any, params?: any) => {
  const response = await axios.post('/api/proxy', {
    url,
    method,
    data,
    params,
  });
  return response.data;
};

export const loginXtream = async (creds: XtreamCredentials) => {
  const { host, username, password } = creds;
  const url = `${host}/player_api.php`;
  const params = { username, password };
  
  const data = await proxyRequest(url, 'GET', undefined, params);
  
  if (data?.user_info?.auth === 1) {
    return data;
  } else {
    throw new Error('Falha no login. Verifique suas credenciais.');
  }
};

export const loadLiveCategories = async (creds: XtreamCredentials) => {
  const { host, username, password } = creds;
  const url = `${host}/player_api.php`;
  const params = { username, password, action: 'get_live_categories' };
  return await proxyRequest(url, 'GET', undefined, params);
};

export const loadLiveStreams = async (creds: XtreamCredentials, categoryId?: string) => {
  const { host, username, password } = creds;
  const url = `${host}/player_api.php`;
  const params: any = { username, password, action: 'get_live_streams' };
  if (categoryId) params.category_id = categoryId;
  return await proxyRequest(url, 'GET', undefined, params);
};

export const loadVODCategories = async (creds: XtreamCredentials, type: 'vod' | 'series' = 'vod') => {
  const { host, username, password } = creds;
  const url = `${host}/player_api.php`;
  const action = type === 'vod' ? 'get_vod_categories' : 'get_series_categories';
  const params = { username, password, action };
  return await proxyRequest(url, 'GET', undefined, params);
};

export const loadVODStreams = async (creds: XtreamCredentials, categoryId?: string, type: 'vod' | 'series' = 'vod') => {
  const { host, username, password } = creds;
  const url = `${host}/player_api.php`;
  const action = type === 'vod' ? 'get_vod_streams' : 'get_series';
  const params: any = { username, password, action };
  if (categoryId) params.category_id = categoryId;
  return await proxyRequest(url, 'GET', undefined, params);
};

export const getProxiedStreamUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    const host = urlObj.origin;
    const path = urlObj.pathname.substring(1) + urlObj.search;
    const encodedHost = btoa(host);
    return `/proxy-stream/${encodedHost}/${path}`;
  } catch (e) {
    return url;
  }
};

export const getLiveStreamUrl = (creds: XtreamCredentials, streamId: string | number) => {
  const url = `${creds.host}/live/${creds.username}/${creds.password}/${streamId}.ts`;
  return getProxiedStreamUrl(url);
};

export const getVODStreamUrl = (creds: XtreamCredentials, streamId: string | number, extension: string = 'mp4') => {
  const url = `${creds.host}/movie/${creds.username}/${creds.password}/${streamId}.${extension}`;
  return getProxiedStreamUrl(url);
};

export const getSeriesStreamUrl = (creds: XtreamCredentials, streamId: string | number, extension: string = 'mp4') => {
  const url = `${creds.host}/series/${creds.username}/${creds.password}/${streamId}.${extension}`;
  return getProxiedStreamUrl(url);
};
