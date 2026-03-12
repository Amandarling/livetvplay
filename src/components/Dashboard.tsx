import { useState, useEffect } from 'react';
import { XtreamCredentials, XtreamCategory, XtreamLiveStream, XtreamVodStream, XtreamSeries } from '@/lib/xtream';
import {
  getLiveCategories, getLiveStreams, getLiveStreamUrl,
  getVodCategories, getVodStreams, getVodStreamUrl,
  getSeriesCategories, getSeries, getSeriesInfo, getSeriesStreamUrl,
  XtreamSeriesInfo
} from '@/lib/xtream';
import { LivePlayer } from './LivePlayer';
import { VodPlayer } from './VodPlayer';
import { Tv, Film, Clapperboard, Search, LogOut, Radio, ChevronRight, Loader2 } from 'lucide-react';

type Tab = 'live' | 'movies' | 'series';

interface DashboardProps {
  credentials: XtreamCredentials;
  onLogout: () => void;
}

export default function Dashboard({ credentials, onLogout }: DashboardProps) {
  const [tab, setTab] = useState<Tab>('live');
  const [categories, setCategories] = useState<XtreamCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Live
  const [liveStreams, setLiveStreams] = useState<XtreamLiveStream[]>([]);
  const [playingLive, setPlayingLive] = useState<{ url: string; name: string } | null>(null);

  // VOD
  const [vodStreams, setVodStreams] = useState<XtreamVodStream[]>([]);
  const [playingVod, setPlayingVod] = useState<{ url: string; title: string } | null>(null);

  // Series
  const [seriesList, setSeriesList] = useState<XtreamSeries[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<XtreamSeriesInfo | null>(null);
  const [playingSeries, setPlayingSeries] = useState<{ url: string; title: string } | null>(null);

  // Load categories when tab changes
  useEffect(() => {
    setCategories([]);
    setSelectedCategory(null);
    setLoading(true);
    const loadCats = async () => {
      try {
        let cats: XtreamCategory[] = [];
        if (tab === 'live') cats = await getLiveCategories(credentials);
        else if (tab === 'movies') cats = await getVodCategories(credentials);
        else cats = await getSeriesCategories(credentials);
        setCategories(cats);
      } catch { }
      setLoading(false);
    };
    loadCats();
  }, [tab, credentials]);

  // Load streams when category changes
  useEffect(() => {
    setLoading(true);
    const loadStreams = async () => {
      try {
        if (tab === 'live') {
          const streams = await getLiveStreams(credentials, selectedCategory || undefined);
          setLiveStreams(streams);
        } else if (tab === 'movies') {
          const streams = await getVodStreams(credentials, selectedCategory || undefined);
          setVodStreams(streams);
        } else {
          const s = await getSeries(credentials, selectedCategory || undefined);
          setSeriesList(s);
        }
      } catch { }
      setLoading(false);
    };
    loadStreams();
  }, [tab, selectedCategory, credentials]);

  const playLive = (stream: XtreamLiveStream) => {
    const url = getLiveStreamUrl(credentials, stream.stream_id);
    setPlayingLive({ url, name: stream.name });
  };

  const playVod = (stream: XtreamVodStream) => {
    const url = getVodStreamUrl(credentials, stream.stream_id, stream.container_extension || 'mp4');
    setPlayingVod({ url, title: stream.name });
  };

  const openSeries = async (series: XtreamSeries) => {
    setLoading(true);
    try {
      const info = await getSeriesInfo(credentials, series.series_id);
      setSelectedSeries(info);
    } catch { }
    setLoading(false);
  };

  const playEpisode = (episodeId: string, ext: string, title: string) => {
    const url = getSeriesStreamUrl(credentials, episodeId, ext || 'mp4');
    setPlayingSeries({ url, title });
  };

  // Full screen player modes
  if (playingLive) {
    return (
      <div className="h-screen w-screen">
        <LivePlayer url={playingLive.url} title={playingLive.name} onClose={() => setPlayingLive(null)} />
      </div>
    );
  }

  if (playingVod) {
    return (
      <div className="h-screen w-screen">
        <VodPlayer url={playingVod.url} title={playingVod.title} onClose={() => setPlayingVod(null)} />
      </div>
    );
  }

  if (playingSeries) {
    return (
      <div className="h-screen w-screen">
        <VodPlayer url={playingSeries.url} title={playingSeries.title} onClose={() => setPlayingSeries(null)} />
      </div>
    );
  }

  // Filter items
  const filterBySearch = <T extends { name: string }>(items: T[]) =>
    search ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())) : items;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'live', label: 'Ao Vivo', icon: <Radio className="h-4 w-4" /> },
    { id: 'movies', label: 'Filmes', icon: <Film className="h-4 w-4" /> },
    { id: 'series', label: 'Séries', icon: <Clapperboard className="h-4 w-4" /> },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-border bg-card/50">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Tv className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">StreamX</h1>
            <p className="text-[10px] text-muted-foreground">IPTV Player</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="space-y-1 p-3">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSelectedSeries(null); }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {t.icon}
              {t.label}
              {t.id === 'live' && (
                <span className="ml-auto h-2 w-2 rounded-full bg-live live-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Categories */}
        <div className="flex-1 overflow-y-auto border-t border-border p-3">
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Categorias
          </p>
          <button
            onClick={() => setSelectedCategory(null)}
            className={`mb-1 flex w-full items-center rounded-md px-2 py-1.5 text-xs transition-colors ${
              !selectedCategory ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Todas
          </button>
          {categories.map(cat => (
            <button
              key={cat.category_id}
              onClick={() => setSelectedCategory(cat.category_id)}
              className={`mb-0.5 flex w-full items-center rounded-md px-2 py-1.5 text-xs transition-colors truncate ${
                selectedCategory === cat.category_id ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat.category_name}
            </button>
          ))}
        </div>

        {/* Logout */}
        <div className="border-t border-border p-3">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Desconectar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Search */}
        <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-lg px-6 py-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full rounded-lg border border-border bg-secondary/50 py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Series Detail View */}
          {selectedSeries && !loading ? (
            <SeriesDetail
              info={selectedSeries}
              onBack={() => setSelectedSeries(null)}
              onPlayEpisode={playEpisode}
            />
          ) : !loading && (
            <>
              {/* Live Streams */}
              {tab === 'live' && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {filterBySearch(liveStreams).map(stream => (
                    <button
                      key={stream.stream_id}
                      onClick={() => playLive(stream)}
                      className="group glass-panel rounded-xl p-3 text-left transition-all hover:border-primary/30 hover:glow-primary"
                    >
                      <div className="mb-2 flex h-16 items-center justify-center rounded-lg bg-secondary/50 overflow-hidden">
                        {stream.stream_icon ? (
                          <img
                            src={stream.stream_icon}
                            alt={stream.name}
                            className="h-full w-full object-contain p-2"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <Tv className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <p className="truncate text-xs font-medium text-foreground">{stream.name}</p>
                      <div className="mt-1 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-live live-pulse" />
                        <span className="text-[10px] text-muted-foreground">MPEG-TS</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* VOD */}
              {tab === 'movies' && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {filterBySearch(vodStreams).map(stream => (
                    <button
                      key={stream.stream_id}
                      onClick={() => playVod(stream)}
                      className="group glass-panel rounded-xl overflow-hidden text-left transition-all hover:border-primary/30"
                    >
                      <div className="aspect-[2/3] bg-secondary/50 overflow-hidden">
                        {stream.stream_icon ? (
                          <img
                            src={stream.stream_icon}
                            alt={stream.name}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Film className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="truncate text-xs font-medium text-foreground">{stream.name}</p>
                        {stream.rating && stream.rating !== '0' && (
                          <p className="mt-0.5 text-[10px] text-warning">★ {stream.rating}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Series */}
              {tab === 'series' && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {filterBySearch(seriesList).map(series => (
                    <button
                      key={series.series_id}
                      onClick={() => openSeries(series)}
                      className="group glass-panel rounded-xl overflow-hidden text-left transition-all hover:border-primary/30"
                    >
                      <div className="aspect-[2/3] bg-secondary/50 overflow-hidden">
                        {series.cover ? (
                          <img
                            src={series.cover}
                            alt={series.name}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Clapperboard className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="truncate text-xs font-medium text-foreground">{series.name}</p>
                        {series.rating && series.rating !== '0' && (
                          <p className="mt-0.5 text-[10px] text-warning">★ {series.rating}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function SeriesDetail({
  info,
  onBack,
  onPlayEpisode,
}: {
  info: XtreamSeriesInfo;
  onBack: () => void;
  onPlayEpisode: (episodeId: string, ext: string, title: string) => void;
}) {
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const seasons = Object.keys(info.episodes || {});

  useEffect(() => {
    if (seasons.length > 0 && !selectedSeason) {
      setSelectedSeason(seasons[0]);
    }
  }, [seasons]);

  const episodes = selectedSeason ? info.episodes[selectedSeason] || [] : [];

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Voltar para séries
      </button>

      <div className="mb-6 flex gap-6">
        {info.info?.cover && (
          <img
            src={info.info.cover}
            alt={info.info.name}
            className="h-48 w-32 rounded-lg object-cover"
          />
        )}
        <div>
          <h2 className="text-2xl font-bold text-foreground">{info.info?.name}</h2>
          {info.info?.rating && <p className="mt-1 text-sm text-warning">★ {info.info.rating}</p>}
          {info.info?.plot && <p className="mt-2 text-sm text-muted-foreground max-w-lg">{info.info.plot}</p>}
        </div>
      </div>

      {/* Season tabs */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {seasons.map(s => (
          <button
            key={s}
            onClick={() => setSelectedSeason(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedSeason === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            Temporada {s}
          </button>
        ))}
      </div>

      {/* Episodes */}
      <div className="space-y-2">
        {episodes.map(ep => (
          <button
            key={ep.id}
            onClick={() => onPlayEpisode(ep.id, ep.container_extension || 'mp4', `${info.info?.name} - ${ep.title}`)}
            className="flex w-full items-center gap-4 rounded-lg bg-secondary/30 p-3 text-left transition-colors hover:bg-secondary/60"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-sm font-bold text-primary">{ep.episode_num}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{ep.title || `Episódio ${ep.episode_num}`}</p>
              {ep.info?.duration && <p className="text-xs text-muted-foreground">{ep.info.duration}</p>}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}
