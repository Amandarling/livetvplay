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
    const params = { username, password, action: 'get_all_epg' };
    const data = await proxyRequest(url, 'GET', undefined, params);
    
    const safeAtob = (str: string) => {
      try {
        return atob(str);
      } catch (e) {
        return str;
      }
    };

    const programsMap = new Map<string, EPGProgram[]>();
    // Basic parsing logic, might need adjustment based on actual XMLTV or JSON response
    if (data && data.epg_listings) {
      data.epg_listings.forEach((item: any) => {
        const channelId = item.epg_id;
        if (!programsMap.has(channelId)) {
          programsMap.set(channelId, []);
        }
        programsMap.get(channelId)?.push({
          title: safeAtob(item.title),
          start: item.start,
          stop: item.end,
          desc: safeAtob(item.description)
        });
      });
    }
    
    return { programs: programsMap };
  },

  getCurrentProgram: (programs: EPGProgram[] | undefined): EPGProgram | null => {
    if (!programs || programs.length === 0) return null;
    const now = new Date();
    return programs.find(p => {
      const start = epgService.parseEPGDate(p.start);
      const stop = epgService.parseEPGDate(p.stop);
      return now >= start && now <= stop;
    }) || null;
  },

  parseEPGDate: (dateStr: string): Date => {
    // Expected format: "2023-10-27 14:00:00"
    return new Date(dateStr.replace(' ', 'T'));
  }
};
