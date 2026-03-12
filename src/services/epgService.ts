import axios from 'axios';

export interface EPGProgram {
  title: string;
  start: string;
  stop: string;
  desc: string;
}

export interface EPGData {
  programs: Map<string, EPGProgram[]>;
}

const proxyRequest = async (url: string, method: string = 'GET', data?: any, params?: any) => {
  const response = await axios.post('/api/proxy', {
    url,
    method,
    data,
    params,
  });
  return response.data;
};

export const epgService = {
  fetchEPG: async (username: string, password: string): Promise<EPGData> => {
    const host = "https://livetvplay.com.br";
    const url = `${host}/player_api.php`;

    // Tentamos primeiro buscar o EPG curto (mais rápido e comum para canais específicos)
    // Mas o usuário quer que funcione para todos, então vamos tentar carregar o EPG completo
    // Nota: 'get_short_epg' ou 'get_simple_epg' costumam ser mais estáveis em algumas APIs Xtream
    const params = { username, password, action: 'get_all_epg' };
    const data = await proxyRequest(url, 'GET', undefined, params);
    
    const safeAtob = (str: string) => {
      try {
        if (!str) return '';
        return decodeURIComponent(escape(atob(str)));
      } catch (e) {
        try {
          return atob(str);
        } catch(e2) {
          return str;
        }
      }
    };

    const programsMap = new Map<string, EPGProgram[]>();

    if (data && data.epg_listings) {
      data.epg_listings.forEach((item: any) => {
        // Algumas APIs usam epg_id, outras stream_id ou channel_id
        const channelId = item.epg_id || item.channel_id;
        if (!channelId) return;

        if (!programsMap.has(channelId)) {
          programsMap.set(channelId, []);
        }

        programsMap.get(channelId)?.push({
          title: safeAtob(item.title),
          start: item.start,
          stop: item.end || item.stop,
          desc: safeAtob(item.description || item.desc)
        });
      });
    }
    
    return { programs: programsMap };
  },

  fetchChannelEPG: async (username: string, password: string, streamId: string | number): Promise<EPGProgram[]> => {
    const host = "https://livetvplay.com.br";
    const url = `${host}/player_api.php`;
    const params = { username, password, action: 'get_short_epg', stream_id: streamId };
    const data = await proxyRequest(url, 'GET', undefined, params);

    if (data && data.epg_listings) {
      return data.epg_listings.map((item: any) => ({
        title: atob(item.title || ''),
        start: item.start,
        stop: item.end || item.stop,
        desc: atob(item.description || item.desc || '')
      }));
    }
    return [];
  },

  getCurrentProgram: (programs: EPGProgram[] | undefined): EPGProgram | null => {
    if (!programs || programs.length === 0) return null;
    const now = new Date();

    // Ordenar por data de início
    const sorted = [...programs].sort((a, b) =>
      epgService.parseEPGDate(a.start).getTime() - epgService.parseEPGDate(b.start).getTime()
    );

    return sorted.find(p => {
      const start = epgService.parseEPGDate(p.start);
      const stop = epgService.parseEPGDate(p.stop);
      return now >= start && now <= stop;
    }) || null;
  },

  parseEPGDate: (dateStr: string): Date => {
    if (!dateStr) return new Date();
    // Xtream EPG dates are usually "YYYY-MM-DD HH:mm:ss"
    const cleaned = dateStr.replace(' ', 'T');
    return new Date(cleaned);
  }
};
