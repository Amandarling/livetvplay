import axios from "axios";

const HOST = "https://livetvplay.com.br";

const proxyRequest = async (
  url: string,
  method: string = "GET",
  data?: any,
  params?: any
) => {
  const response = await axios.post("/api/proxy", {
    url,
    method,
    data,
    params,
  });

  return response.data;
};

export const xtreamService = {
  authenticate: async (username: string, password: string) => {
    const url = `${HOST}/player_api.php`;

    const params = { username, password };

    const data = await proxyRequest(url, "GET", undefined, params);

    if (data?.user_info?.auth === 1) return data;

    throw new Error("Login inválido");
  },

  getLiveStreams: async (username: string, password: string) => {
    return proxyRequest(`${HOST}/player_api.php`, "GET", undefined, {
      username,
      password,
      action: "get_live_streams",
    });
  },

  getMovies: async (username: string, password: string) => {
    return proxyRequest(`${HOST}/player_api.php`, "GET", undefined, {
      username,
      password,
      action: "get_vod_streams",
    });
  },

  // LIVE usa proxy
  getStreamUrl: (
    username: string,
    password: string,
    streamId: number,
    extension = "ts"
  ) => {
    const url = `${HOST}/live/${username}/${password}/${streamId}.${extension}`;

    return xtreamService.getProxiedUrl(url);
  },

  // VOD direto
  getMovieUrl: (
    username: string,
    password: string,
    streamId: number,
    extension = "mp4"
  ) => {
    return `${HOST}/movie/${username}/${password}/${streamId}.${extension}`;
  },

  getProxiedUrl: (url: string) => {
    const urlObj = new URL(url);

    const host = btoa(urlObj.origin);

    const path = urlObj.pathname.substring(1);

    return `/proxy-stream/${host}/${path}`;
  },
};