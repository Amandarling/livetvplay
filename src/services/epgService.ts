import { XtreamStream } from "@/src/types";

export interface EPGProgram {
  start: string;
  stop: string;
  title: string;
  desc: string;
  channel: string;
}

export interface EPGChannel {
  id: string;
  name: string;
}

export interface EPGData {
  channels: Map<string, EPGChannel>;
  programs: Map<string, EPGProgram[]>;
}

const FIXED_DNS = "https://livetvplay.com.br";
const CORS_PROXY = "https://api.allorigins.win/raw?url=";

export const epgService = {
  async fetchEPG(username?: string, password?: string): Promise<EPGData> {
    try {
      if (!username || !password) return { channels: new Map(), programs: new Map() };
      
      const xmltvUrl = `${FIXED_DNS}/xmltv.php?username=${username}&password=${password}`;
      // Using a CORS proxy to avoid 'Failed to fetch' errors in the browser
      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(xmltvUrl)}`);
      if (!response.ok) throw new Error("Falha ao carregar EPG XML");
      const xmlText = await response.text();
      return this.parseEPG(xmlText);
    } catch (error) {
      console.error("Erro ao buscar EPG:", error);
      return { channels: new Map(), programs: new Map() };
    }
  },

  parseEPG(xmlText: string): EPGData {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    const channels = new Map<string, EPGChannel>();
    const programs = new Map<string, EPGProgram[]>();

    const channelNodes = xmlDoc.getElementsByTagName("channel");
    for (let i = 0; i < channelNodes.length; i++) {
      const node = channelNodes[i];
      const id = node.getAttribute("id") || "";
      const name = node.getElementsByTagName("display-name")[0]?.textContent || "";
      if (id) {
        channels.set(id, { id, name });
      }
    }

    const programmeNodes = xmlDoc.getElementsByTagName("programme");
    for (let i = 0; i < programmeNodes.length; i++) {
      const node = programmeNodes[i];
      const channelId = node.getAttribute("channel") || "";
      const start = node.getAttribute("start") || "";
      const stop = node.getAttribute("stop") || "";
      const title = node.getElementsByTagName("title")[0]?.textContent || "";
      const desc = node.getElementsByTagName("desc")[0]?.textContent || "";

      if (channelId) {
        const program: EPGProgram = { start, stop, title, desc, channel: channelId };
        if (!programs.has(channelId)) {
          programs.set(channelId, []);
        }
        programs.get(channelId)?.push(program);
      }
    }

    return { channels, programs };
  },

  // Helper to parse EPG date string (YYYYMMDDHHMMSS +HHMM)
  parseEPGDate(dateStr: string): Date {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    const hour = parseInt(dateStr.substring(8, 10));
    const minute = parseInt(dateStr.substring(10, 12));
    const second = parseInt(dateStr.substring(12, 14));
    
    // Simple parsing, ignoring timezone for now as it's complex
    return new Date(year, month, day, hour, minute, second);
  },

  getCurrentProgram(programs: EPGProgram[] | undefined): EPGProgram | null {
    if (!programs) return null;
    const now = new Date();
    return programs.find(p => {
      const start = this.parseEPGDate(p.start);
      const stop = this.parseEPGDate(p.stop);
      return now >= start && now <= stop;
    }) || null;
  }
};
