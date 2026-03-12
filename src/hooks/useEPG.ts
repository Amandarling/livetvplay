import { useEffect, useState } from "react";
import { epgService, EPGData } from "@/services/epgService";

export function useEPG(credentials: any) {
  const [epg, setEPG] = useState<EPGData | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await epgService.fetchEPG(
          credentials.server,
          credentials.username,
          credentials.password
        );

        if (mounted) setEPG(data);
      } catch (err) {
        console.error("EPG error", err);
      }
    };

    load();

    const interval = setInterval(load, 5 * 60 * 1000); // atualizar 5 min

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [credentials]);

  return epg;
}