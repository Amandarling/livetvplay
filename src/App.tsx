import React, { useState, useEffect, useMemo } from 'react';
import { 
  Tv, Film, Clapperboard, Settings, Search, User, MoreVertical, 
  ChevronLeft, ChevronRight, Play, Clock, Lock, ShieldCheck, Radio, Mic, 
  LogOut, Eye, EyeOff, ArrowLeft, LayoutGrid, History, Star, Zap, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { xtreamService } from '@/src/services/xtreamService';
import { epgService, EPGData } from '@/src/services/epgService';
import { Logo } from '@/src/components/Logo';
import { VideoPlayer } from '@/src/components/VideoPlayer';
import { LivePlayer } from '@/src/components/LivePlayer';
import { XtreamAuthResponse, XtreamCategory, XtreamStream } from '@/src/types';

const PosterImage = ({ stream, type }: { stream: XtreamStream, type: 'movies' | 'series' }) => {
  const [posterUrl, setPosterUrl] = useState<string | null>(stream.stream_icon || stream.thumbnail || null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!posterUrl && !isSearching) {
      setIsSearching(true);
      xtreamService.findMissingPoster(stream.name, type === 'movies' ? 'movie' : 'series')
        .then(url => {
          if (url) setPosterUrl(url);
          setIsSearching(false);
        })
        .catch(() => setIsSearching(false));
    }
  }, [stream.name, type, posterUrl, isSearching]);

  return (
    <div className="aspect-[2/3] relative bg-black/40 overflow-hidden">
      {posterUrl ? (
        <img 
          src={posterUrl} 
          alt={stream.name} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-white/5">
          {isSearching ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-4 h-4 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" />
              <span className="text-[6px] text-white/40 uppercase font-bold">Buscando capa...</span>
            </div>
          ) : (
            type === 'movies' ? <Film className="w-6 h-6 sm:w-8 sm:h-8 opacity-10" /> : <Clapperboard className="w-6 h-6 sm:w-8 sm:h-8 opacity-10" />
          )}
        </div>
      )}
    </div>
  );
};

const LoadingOverlay = () => (
  <div className="fixed inset-0 bg-bg-deep/90 backdrop-blur-md flex flex-col items-center justify-center z-50">
    <Logo className="w-28 h-28 mb-8 animate-bounce" />
    <p className="text-white font-medium animate-pulse uppercase tracking-widest">Carregando conteúdo...</p>
  </div>
);

const BottomNav = ({ activeView, handleSetView, loadLive, loadMovies, loadSeries }: any) => {
  const items = [
    { id: 'dashboard', icon: LayoutGrid, label: 'Início', action: () => handleSetView('dashboard') },
    { id: 'live', icon: Tv, label: 'Canais', action: () => loadLive() },
    { id: 'movies', icon: Film, label: 'Filmes', action: () => loadMovies() },
    { id: 'series', icon: Clapperboard, label: 'Séries', action: () => loadSeries() },
    { id: 'favorites', icon: Star, label: 'Favs', action: () => handleSetView('favorites') },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-bg-deep/95 backdrop-blur-xl border-t border-white/10 flex justify-around items-center p-1 z-50 pb-safe">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={item.action}
          className={`flex flex-col items-center gap-0.5 p-1 transition-all ${activeView === item.id ? 'text-neon-red scale-110' : 'text-white/40'}`}
        >
          <item.icon className="w-5 h-5" />
          <span className="text-[8px] font-bold uppercase tracking-tighter">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

const Header = ({ title, onBack, user, onSettings, onProfile, onLogout, onSearch }: any) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const formattedDate = time.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

  return (
    <div className="flex items-center justify-between p-2 sm:p-4 lg:p-6 bg-transparent z-10 relative shrink-0">
      <div className="flex items-center gap-2 sm:gap-4">
        {onBack && (
          <button onClick={onBack} className="p-1 sm:p-2 hover:bg-white/10 rounded-full transition-colors group">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:scale-110 transition-transform" />
          </button>
        )}
        <div className="flex items-center">
          <Logo className="w-16 h-8 sm:w-24 sm:h-12 lg:w-32 lg:h-16 -ml-2 sm:-ml-4" />
        </div>
      </div>

      <div className="hidden lg:flex flex-col items-center absolute left-1/2 -translate-x-1/2">
        <span className="text-3xl font-black tracking-tighter italic text-white drop-shadow-lg">{formattedTime}</span>
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">{formattedDate}</span>
      </div>

      <div className="flex items-center gap-3 sm:gap-6 lg:gap-6">
        <div onClick={onSearch} className="flex items-center gap-2 text-white/80 hover:text-white cursor-pointer transition-colors group">
          <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline font-bold uppercase text-[10px] tracking-widest">Pesquisar</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={onProfile} className="p-1.5 hover:bg-white/10 rounded-lg transition-all hover:text-neon-blue">
            <User className="w-4 h-4" />
          </button>
          
          {onLogout && (
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 bg-neon-red/10 hover:bg-neon-red/20 px-3 py-1.5 rounded-lg text-neon-red transition-all group border border-neon-red/20"
            >
              <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              <span className="hidden sm:inline font-black uppercase italic text-[10px] tracking-tighter">SAIR</span>
            </button>
          )}
        </div>

        <div className="lg:hidden flex flex-col items-end">
          <span className="text-base font-black italic leading-none">{formattedTime}</span>
          <span className="text-[7px] font-bold opacity-40 uppercase tracking-widest">{formattedDate}</span>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<'login' | 'dashboard' | 'live' | 'movies' | 'series' | 'favorites' | 'history' | 'settings' | 'playlist-info' | 'epg' | 'global-search'>('login');
  const [previousView, setPreviousView] = useState<'login' | 'dashboard' | 'live' | 'movies' | 'series' | 'favorites' | 'history' | 'settings' | 'playlist-info' | 'epg' | 'global-search'>('dashboard');

  const handleSetView = (newView: typeof view) => {
    setPreviousView(view);
    setView(newView);
    setActiveStream(null);
  };
  const [auth, setAuth] = useState<XtreamAuthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [epgData, setEpgData] = useState<EPGData | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  
  const [favorites, setFavorites] = useState<XtreamStream[]>([]);
  const [history, setHistory] = useState<XtreamStream[]>([]);

  const [cache, setCache] = useState<{
    live: { categories: XtreamCategory[], streams: XtreamStream[] },
    movies: { categories: XtreamCategory[], streams: XtreamStream[] },
    series: { categories: XtreamCategory[], streams: XtreamStream[] }
  }>({
    live: { categories: [], streams: [] },
    movies: { categories: [], streams: [] },
    series: { categories: [], streams: [] }
  });

  const [activeStream, setActiveStream] = useState<XtreamStream | null>(null);
  const [selectedEpgChannel, setSelectedEpgChannel] = useState<XtreamStream | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const FIXED_DNS = "https://livetvplay.com.br";

  const loadUserData = (user: string) => {
    const favs = JSON.parse(localStorage.getItem(`iptv_favs_${user}`) || '[]');
    const hist = JSON.parse(localStorage.getItem(`iptv_hist_${user}`) || '[]');
    setFavorites(favs);
    setHistory(hist);
  };

  const toggleFavorite = (stream: XtreamStream) => {
    if (!auth) return;
    const user = auth.user_info.username;
    const isFav = favorites.some(f => f.stream_id === stream.stream_id);
    let newFavs;
    if (isFav) {
      newFavs = favorites.filter(f => f.stream_id !== stream.stream_id);
    } else {
      newFavs = [...favorites, stream];
    }
    setFavorites(newFavs);
    localStorage.setItem(`iptv_favs_${user}`, JSON.stringify(newFavs));
  };

  const addToHistory = (stream: XtreamStream) => {
    if (!auth) return;
    const user = auth.user_info.username;
    const newHist = [stream, ...history.filter(h => h.stream_id !== stream.stream_id)].slice(0, 100);
    setHistory(newHist);
    localStorage.setItem(`iptv_hist_${user}`, JSON.stringify(newHist));
  };

  useEffect(() => {
    const savedAuth = localStorage.getItem('iptv_auth');
    const savedCreds = localStorage.getItem('iptv_creds');
    if (savedAuth && savedCreds) {
      const parsedAuth = JSON.parse(savedAuth);
      const parsedCreds = JSON.parse(savedCreds);
      setAuth(parsedAuth);
      loadUserData(parsedCreds.username);
      handleSetView('dashboard');
      preFetchContent(parsedCreds.username, parsedCreds.password);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const minWait = new Promise(resolve => setTimeout(resolve, 1500));
    try {
      const [response] = await Promise.all([
        xtreamService.authenticate(username, password),
        minWait
      ]);
      setAuth(response);
      localStorage.setItem('iptv_auth', JSON.stringify(response));
      localStorage.setItem('iptv_creds', JSON.stringify({ username, password }));
      loadUserData(username);
      handleSetView('dashboard');
      preFetchContent(username, password);
    } catch (error: any) {
      alert(error.message || "Erro ao conectar");
    } finally {
      setLoading(false);
    }
  };

  const preFetchContent = async (user: string, pass: string) => {
    try {
      const [liveCats, movieCats, seriesCats] = await Promise.all([
        xtreamService.getLiveCategories(user, pass).catch(() => []),
        xtreamService.getMovieCategories(user, pass).catch(() => []),
        xtreamService.getSeriesCategories(user, pass).catch(() => [])
      ]);

      setCache(prev => ({
        ...prev,
        live: { ...prev.live, categories: liveCats as XtreamCategory[] },
        movies: { ...prev.movies, categories: movieCats as XtreamCategory[] },
        series: { ...prev.series, categories: seriesCats as XtreamCategory[] }
      }));

      const [liveStreams, movieStreams, seriesStreams] = await Promise.all([
        xtreamService.getLiveStreams(user, pass).catch(() => []),
        xtreamService.getMovies(user, pass).catch(() => []),
        xtreamService.getSeries(user, pass).catch(() => [])
      ]);

      setCache(prev => ({
        ...prev,
        live: { categories: liveCats as XtreamCategory[], streams: liveStreams as XtreamStream[] },
        movies: { categories: movieCats as XtreamCategory[], streams: movieStreams as XtreamStream[] },
        series: { categories: seriesCats as XtreamCategory[], streams: seriesStreams as XtreamStream[] }
      }));
    } catch (error) {
      console.error("Pre-fetch failed:", error);
    }
  };

  const loadLiveContent = async (catId?: string) => {
    if (!auth) return;
    if (view !== 'live') {
      handleSetView('live');
      setSelectedCategory(catId || null);
    }
    setContentLoading(true);
    try {
      const creds = JSON.parse(localStorage.getItem('iptv_creds') || '{}');
      const cats = await xtreamService.getLiveCategories(creds.username, creds.password);
      const items = await xtreamService.getLiveStreams(creds.username, creds.password, catId || undefined);
      setCache(prev => ({ ...prev, live: { categories: cats, streams: items } }));
    } catch (error) {
      console.error(error);
    } finally {
      setContentLoading(false);
    }
  };

  const loadMoviesContent = async (catId?: string) => {
    if (!auth) return;
    if (view !== 'movies') {
      handleSetView('movies');
      setSelectedCategory(catId || null);
    }
    setContentLoading(true);
    try {
      const creds = JSON.parse(localStorage.getItem('iptv_creds') || '{}');
      const cats = await xtreamService.getMovieCategories(creds.username, creds.password);
      const items = await xtreamService.getMovies(creds.username, creds.password, catId || undefined);
      setCache(prev => ({ ...prev, movies: { categories: cats, streams: items } }));
    } catch (error) {
      console.error(error);
    } finally {
      setContentLoading(false);
    }
  };

  const loadSeriesContent = async (catId?: string) => {
    if (!auth) return;
    if (view !== 'series') {
      handleSetView('series');
      setSelectedCategory(catId || null);
    }
    setContentLoading(true);
    try {
      const creds = JSON.parse(localStorage.getItem('iptv_creds') || '{}');
      const cats = await xtreamService.getSeriesCategories(creds.username, creds.password);
      const items = await xtreamService.getSeries(creds.username, creds.password, catId || undefined);
      setCache(prev => ({ ...prev, series: { categories: cats, streams: items } }));
    } catch (error) {
      console.error(error);
    } finally {
      setContentLoading(false);
    }
  };

  const currentStreams = useMemo(() => {
    if (view === 'live') return cache.live.streams;
    if (view === 'movies') return cache.movies.streams;
    if (view === 'series') return cache.series.streams;
    if (view === 'favorites') return favorites;
    if (view === 'history') return history;
    return [];
  }, [view, cache, favorites, history]);

  const currentCategories = useMemo(() => {
    if (view === 'live') return cache.live.categories;
    if (view === 'movies') return cache.movies.categories;
    if (view === 'series') return cache.series.categories;
    return [];
  }, [view, cache]);

  const filteredStreams = useMemo(() => {
    let streams = currentStreams;
    if (selectedCategory) {
      streams = streams.filter(s => s.category_id === selectedCategory);
    }
    return streams.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [currentStreams, searchQuery, selectedCategory]);

  const handleLogout = () => {
    localStorage.removeItem('iptv_auth');
    localStorage.removeItem('iptv_creds');
    setAuth(null);
    handleSetView('login');
    setCache({
      live: { categories: [], streams: [] },
      movies: { categories: [], streams: [] },
      series: { categories: [], streams: [] }
    });
  };

  const loadEPG = async () => {
    handleSetView('epg');
    if (epgData) return;
    setContentLoading(true);
    try {
      const creds = JSON.parse(localStorage.getItem('iptv_creds') || '{}');
      let liveStreams = cache.live.streams;
      if (liveStreams.length === 0 && auth) {
        liveStreams = await xtreamService.getLiveStreams(creds.username, creds.password);
        setCache(prev => ({ ...prev, live: { ...prev.live, streams: liveStreams } }));
      }
      const data = await epgService.fetchEPG(creds.username, creds.password);
      setEpgData(data);
    } catch (error) {
      console.error("Erro ao carregar EPG:", error);
    } finally {
      setContentLoading(false);
    }
  };

  const renderLogin = () => (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center p-4 relative overflow-y-auto">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none fixed">
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-neon-red/5 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-neon-blue/5 blur-[100px] rounded-full"></div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[280px] relative z-10 flex flex-col items-center gap-4 my-auto"
      >
        <Logo className="w-36 h-36 drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]" />
        
        <div className="w-full bg-white/5 backdrop-blur-2xl p-5 rounded-[1.5rem] border border-white/10 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-3 w-full">
            <div className="space-y-1">
              <input 
                type="text" 
                placeholder="Usuário" 
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-[12px] text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-neon-red transition-all font-bold"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Senha" 
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-[12px] text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-neon-red transition-all font-bold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-neon-red to-neon-purple text-white font-black py-2.5 rounded-lg hover:opacity-90 transition-all transform active:scale-[0.98] shadow-lg uppercase tracking-[0.2em] text-[10px] mt-1"
            >
              ENTRAR
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );

  const renderDashboard = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      <main className="flex-1 p-4 lg:p-10 flex flex-col justify-center min-h-0 overflow-hidden">
        <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col landscape:flex-row md:flex-row gap-2 sm:gap-3 md:gap-6 lg:gap-8 min-h-0">
          <div className="w-full landscape:w-[45%] md:w-[45%] xl:w-[40%] flex flex-col flex-1 min-h-0">
            <motion.div 
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => loadLiveContent()}
              className="relative group cursor-pointer overflow-hidden rounded-xl sm:rounded-[1.5rem] flex-1 min-h-[100px] bg-gradient-to-br from-neon-red via-neon-red/80 to-neon-purple shadow-xl flex flex-col border border-white/10"
            >
              <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-3 md:p-6">
                <div className="relative mb-1 sm:mb-2 md:mb-6">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-28 md:h-28 lg:w-40 lg:h-40 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-xl relative z-10">
                    <Tv className="w-5 h-5 sm:w-7 sm:h-7 md:w-14 md:h-14 lg:w-20 lg:h-20 text-white drop-shadow-lg" />
                  </div>
                </div>
                <h2 className="text-lg sm:text-xl md:text-3xl lg:text-6xl font-black tracking-tighter italic drop-shadow-xl uppercase leading-none text-center">TV AO VIVO</h2>
              </div>
            </motion.div>
          </div>
          <div className="w-full landscape:w-[55%] md:w-[55%] xl:w-[60%] flex flex-col flex-1 gap-2 sm:gap-3 md:gap-6 lg:gap-8 min-h-0">
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-6 lg:gap-8 flex-1 min-h-0">
              <motion.div 
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => loadMoviesContent()}
                className="relative group cursor-pointer overflow-hidden rounded-xl sm:rounded-[1.5rem] flex-1 min-h-[60px] bg-gradient-to-br from-neon-blue via-neon-blue/80 to-neon-purple shadow-lg flex flex-col border border-white/10"
              >
                <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-3 md:p-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white/5 rounded-full flex items-center justify-center mb-1 sm:mb-2 md:mb-4 border border-white/10 shadow-lg">
                    <Film className="w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white drop-shadow-lg" />
                  </div>
                  <h2 className="text-base sm:text-lg md:text-2xl lg:text-4xl font-black tracking-tighter italic drop-shadow-xl uppercase leading-none">FILMES</h2>
                </div>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => loadSeriesContent()}
                className="relative group cursor-pointer overflow-hidden rounded-xl sm:rounded-[1.5rem] flex-1 min-h-[60px] bg-gradient-to-br from-neon-purple via-neon-purple/80 to-neon-red shadow-lg flex flex-col border border-white/10"
              >
                <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-3 md:p-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white/5 rounded-full flex items-center justify-center mb-1 sm:mb-2 md:mb-4 border border-white/10 shadow-lg">
                    <Clapperboard className="w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white drop-shadow-lg" />
                  </div>
                  <h2 className="text-base sm:text-lg md:text-2xl lg:text-4xl font-black tracking-tighter italic drop-shadow-xl uppercase leading-none">SÉRIES</h2>
                </div>
              </motion.div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-6 shrink-0">
              {[
                { id: 'epg', icon: Calendar, label: 'EPG', color: 'neon-red', action: () => loadEPG() },
                { id: 'favorites', icon: Star, label: 'FAVORITOS', color: 'neon-blue', action: () => handleSetView('favorites') },
                { id: 'history', icon: History, label: 'HISTÓRICO', color: 'neon-purple', action: () => handleSetView('history') }
              ].map((item) => (
                <motion.div 
                  key={item.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  onClick={item.action}
                  className="bg-white/5 hover:bg-white/10 p-1.5 sm:p-2 md:p-4 lg:p-6 rounded-xl sm:rounded-[1.2rem] flex flex-col items-center justify-center gap-1 sm:gap-1.5 md:gap-3 transition-all cursor-pointer shadow-lg border border-white/10 group relative overflow-hidden h-auto"
                >
                  <div className={`bg-${item.color}/10 p-1 sm:p-1.5 md:p-3 rounded-lg sm:rounded-xl group-hover:bg-${item.color}/20 transition-all`}>
                    <item.icon className={`w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-${item.color} opacity-80`} />
                  </div>
                  <span className="font-black text-[6px] sm:text-[8px] md:text-xs lg:text-lg italic uppercase tracking-tighter relative z-10 text-center leading-tight">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  const renderList = (type: 'live' | 'movies' | 'series' | 'favorites' | 'history') => {
    const isGrid = type !== 'live';
    const hasSidebar = type === 'live' || type === 'movies' || type === 'series';
    const isCollapsibleSidebar = type === 'movies' || type === 'series';

    return (
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex flex-1 overflow-hidden relative">
          {hasSidebar && (
            <>
              {/* Mobile Overlay for Collapsible Sidebar */}
              {isCollapsibleSidebar && showSidebar && (
                <div 
                  className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                  onClick={() => setShowSidebar(false)}
                />
              )}

              {/* Sidebar */}
              <div className={`
                ${isCollapsibleSidebar ? 'fixed lg:relative z-50 h-full transition-transform duration-300 ease-in-out' : 'relative'}
                ${isCollapsibleSidebar && !showSidebar ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
                w-[180px] sm:w-[220px] bg-bg-deep border-r border-white/5 flex flex-col shrink-0
              `}>
                <div className="p-2 flex items-center justify-between">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" />
                    <input 
                      type="text" 
                      placeholder="Pesquisa..." 
                      className="w-full bg-white/5 border border-white/5 rounded-md py-1 pl-6 pr-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-neon-blue"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  {isCollapsibleSidebar && (
                    <button 
                      onClick={() => setShowSidebar(false)}
                      className="lg:hidden ml-2 p-2 hover:bg-white/10 rounded-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <button 
                    onClick={() => {
                      setSelectedCategory(null);
                      if (type === 'live') loadLiveContent();
                      else if (type === 'movies') loadMoviesContent();
                      else if (type === 'series') loadSeriesContent();
                      if (isCollapsibleSidebar && window.innerWidth < 1024) setShowSidebar(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 flex justify-between items-center hover:bg-white/5 transition-colors ${selectedCategory === null ? 'bg-neon-red/10 border-l-2 border-neon-red' : ''}`}
                  >
                    <span className="font-bold uppercase text-[9px] sm:text-[10px]">Todos</span>
                    <span className="text-[8px] opacity-60">{currentStreams.length}</span>
                  </button>
                  {currentCategories.map(cat => (
                    <button 
                      key={cat.category_id}
                      onClick={() => {
                        setSelectedCategory(cat.category_id);
                        if (type === 'live') loadLiveContent(cat.category_id);
                        else if (type === 'movies') loadMoviesContent(cat.category_id);
                        else if (type === 'series') loadSeriesContent(cat.category_id);
                        if (isCollapsibleSidebar && window.innerWidth < 1024) setShowSidebar(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex justify-between items-center hover:bg-white/5 transition-colors ${selectedCategory === cat.category_id ? 'bg-neon-red/10 border-l-2 border-neon-red' : ''}`}
                    >
                      <span className="font-bold uppercase truncate pr-2 text-[9px] sm:text-[10px]">{cat.category_name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Floating Toggle Button for Collapsible Sidebar */}
              {isCollapsibleSidebar && !showSidebar && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="lg:hidden absolute left-0 top-4 z-40 bg-neon-blue/20 hover:bg-neon-blue/40 px-1 py-4 rounded-r-lg border border-l-0 border-neon-blue/30 backdrop-blur-md shadow-[4px_0_15px_rgba(10,132,255,0.3)] transition-all flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4 text-neon-blue" />
                </button>
              )}
            </>
          )}

          <div className={`flex-1 overflow-y-auto p-2 sm:p-3 custom-scrollbar relative ${!hasSidebar ? 'w-full' : ''}`}>
            {contentLoading && (
              <div className="absolute inset-0 z-10 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
                <Logo className="w-12 h-12 animate-bounce" />
              </div>
            )}
            
            {!hasSidebar && (
              <div className="mb-6 relative max-w-md mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input 
                  type="text" 
                  placeholder={`Pesquisar em ${type === 'favorites' ? 'Favoritos' : 'Histórico'}...`}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-neon-blue transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}

            {!isGrid ? (
              <div className="flex flex-col gap-1">
                {filteredStreams.slice(0, 300).map(stream => {
                  const programs = epgData?.programs.get(stream.epg_channel_id) || epgData?.programs.get(stream.name);
                  const currentProgram = epgService.getCurrentProgram(programs);
                  return (
                    <motion.div 
                      key={stream.stream_id}
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setActiveStream(stream);
                        addToHistory(stream);
                      }}
                      className="bg-white/5 border border-white/5 rounded-md p-1.5 flex items-center gap-2 cursor-pointer hover:bg-white/10 transition-all group shadow-sm relative"
                    >
                      <div className="w-10 h-10 bg-black/40 rounded flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/5">
                        {stream.stream_icon ? (
                          <img src={stream.stream_icon} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" loading="lazy" />
                        ) : <Tv className="w-5 h-5 opacity-20" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-[11px] sm:text-[13px] text-white truncate group-hover:text-neon-blue transition-colors pr-6">{stream.name}</h3>
                          <span className="text-[7px] font-black bg-neon-red/20 text-neon-red px-1 py-0.5 rounded uppercase tracking-tighter shrink-0 ml-1">AO VIVO</span>
                        </div>
                        {currentProgram ? (
                          <div className="space-y-0">
                            <p className="text-[10px] text-white/80 font-medium truncate">{currentProgram.title}</p>
                          </div>
                        ) : (
                          <p className="text-[9px] text-white/20 italic truncate">Sem info</p>
                        )}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(stream);
                        }}
                        className="absolute right-1 top-1 p-1 rounded-full hover:bg-white/10 transition-colors z-10"
                      >
                        <Star className={`w-3.5 h-3.5 ${favorites.some(f => f.stream_id === stream.stream_id) ? 'fill-neon-blue text-neon-blue' : 'text-white/20 hover:text-white/40'}`} />
                      </button>
                      <Play className="w-4 h-4 text-white/10 group-hover:text-neon-blue transition-colors shrink-0 mr-6" />
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-1.5 sm:gap-2 lg:gap-3">
                {filteredStreams.slice(0, 300).map(stream => (
                  <motion.div 
                    key={stream.stream_id}
                    whileHover={{ scale: 1.05, zIndex: 10 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setActiveStream(stream);
                      addToHistory(stream);
                    }}
                    className="bg-white/5 rounded-lg overflow-hidden border border-white/10 cursor-pointer group flex flex-col shadow-lg hover:shadow-neon-blue/20 transition-all duration-200 relative"
                  >
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(stream);
                      }}
                      className="absolute top-1 right-1 sm:top-2 sm:right-2 z-20 p-1.5 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-colors"
                    >
                      <Star className={`w-3 h-3 sm:w-4 sm:h-4 ${favorites.some(f => f.stream_id === stream.stream_id) ? 'fill-neon-blue text-neon-blue drop-shadow-[0_0_8px_rgba(10,132,255,0.8)]' : 'text-white/50 hover:text-white'}`} />
                    </button>
                    <PosterImage stream={stream} type={type as 'movies' | 'series'} />
                    <div className="p-1.5 sm:p-2 flex-1 flex flex-col justify-center bg-black/20 border-t border-white/5">
                      <p className="text-[8px] sm:text-[10px] font-black italic uppercase tracking-tighter line-clamp-2 text-center leading-tight group-hover:text-neon-blue transition-colors">
                        {stream.name}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {filteredStreams.length === 0 && !contentLoading && (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-white/40">
                    {type === 'favorites' ? (
                      <>
                        <Star className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-bold uppercase tracking-widest">Nenhum favorito encontrado</p>
                      </>
                    ) : type === 'history' ? (
                      <>
                        <History className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-bold uppercase tracking-widest">Histórico vazio</p>
                      </>
                    ) : (
                      <p className="text-lg font-bold uppercase tracking-widest">Nenhum conteúdo encontrado</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 p-6 sm:p-10 lg:p-16 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {[
              { icon: Settings, label: 'Configurações Gerais', color: 'neon-blue' },
              { icon: Clock, label: 'EPG', color: 'neon-red' },
            ].map((item, i) => (
              <motion.div 
                key={i}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/5 border border-white/10 p-8 lg:p-10 rounded-[2rem] flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-white/10 transition-all group shadow-2xl backdrop-blur-xl relative overflow-hidden"
              >
                <div className={`bg-${item.color}/20 p-5 rounded-2xl group-hover:bg-${item.color}/40 transition-all group-hover:rotate-6`}>
                  <item.icon className={`w-12 h-12 text-${item.color} drop-shadow-[0_0_10px_rgba(var(--${item.color}-rgb),0.5)]`} />
                </div>
                <span className="font-black text-center uppercase tracking-tighter italic text-lg lg:text-xl leading-tight group-hover:text-white transition-colors">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderEPG = () => {
    const channels = cache.live.streams;
    const selectedChannel = selectedEpgChannel || channels[0];
    const programs = selectedChannel ? (epgData?.programs.get(selectedChannel.epg_channel_id) || epgData?.programs.get(selectedChannel.name) || []) : [];
    const currentProgram = epgService.getCurrentProgram(programs);

    return (
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex flex-1 overflow-hidden relative">
          {/* Channels Sidebar */}
          <div className="w-[240px] sm:w-[320px] bg-bg-deep border-r border-white/10 flex flex-col shrink-0 relative z-10">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-xl font-black italic tracking-tighter text-neon-blue">GUIA DE PROGRAMAÇÃO</h2>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {channels.map(stream => (
                <button 
                  key={stream.stream_id}
                  onClick={() => setSelectedEpgChannel(stream)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5 ${selectedChannel?.stream_id === stream.stream_id ? 'bg-neon-red/20 border-l-4 border-l-neon-red' : 'border-l-4 border-l-transparent'}`}
                >
                  <div className="w-10 h-10 bg-black/40 rounded flex items-center justify-center overflow-hidden shrink-0">
                    {stream.stream_icon ? (
                      <img src={stream.stream_icon} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" loading="lazy" />
                    ) : <Tv className="w-5 h-5 opacity-20" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-white truncate">{stream.name}</h3>
                    {epgService.getCurrentProgram(epgData?.programs.get(stream.epg_channel_id) || epgData?.programs.get(stream.name)) && (
                      <p className="text-[10px] text-white/50 truncate">
                        {epgService.getCurrentProgram(epgData?.programs.get(stream.epg_channel_id) || epgData?.programs.get(stream.name))?.title}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Area: Mini Player + EPG Grid */}
          <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
            {selectedChannel ? (
              <>
                {/* Mini Player Area */}
                <div className="h-[30vh] sm:h-[40vh] shrink-0 bg-black relative border-b border-white/10">
                  {auth && (
                    <VideoPlayer
                      url={selectedChannel.direct_source || xtreamService.getStreamUrl(auth.user_info.username, auth.user_info.password, selectedChannel.stream_id, 'm3u8')}
                      title={selectedChannel.name}
                      type="live"
                      isFavorite={favorites.some(f => f.stream_id === selectedChannel.stream_id)}
                      onToggleFavorite={() => toggleFavorite(selectedChannel)}
                      inline={true}
                    />
                  )}
                </div>

                {/* EPG Grid Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-black/40 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                        {selectedChannel.stream_icon ? (
                          <img src={selectedChannel.stream_icon} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                        ) : <Tv className="w-8 h-8 opacity-20" />}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">{selectedChannel.name}</h2>
                        <p className="text-neon-blue text-sm font-medium">Programação do Canal</p>
                      </div>
                    </div>

                    {programs.length > 0 ? (
                      <div className="space-y-3">
                        {programs.map((prog, idx) => {
                          const isCurrent = currentProgram === prog;
                          const start = epgService.parseEPGDate(prog.start);
                          const stop = epgService.parseEPGDate(prog.stop);
                          
                          return (
                            <div 
                              key={idx} 
                              className={`p-4 rounded-xl border transition-all ${isCurrent ? 'bg-neon-blue/10 border-neon-blue/30 shadow-[0_0_15px_rgba(10,132,255,0.1)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="text-lg font-mono font-bold text-white/90">
                                    {start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  <span className="text-white/30">-</span>
                                  <div className="text-sm font-mono text-white/50">
                                    {stop.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className={`font-bold text-base sm:text-lg truncate ${isCurrent ? 'text-neon-blue' : 'text-white'}`}>
                                    {prog.title}
                                  </h4>
                                  {prog.desc && (
                                    <p className="text-sm text-white/60 mt-1 line-clamp-2">{prog.desc}</p>
                                  )}
                                </div>
                                {isCurrent && (
                                  <div className="shrink-0 bg-neon-red/20 text-neon-red px-2 py-1 rounded text-xs font-black tracking-wider uppercase animate-pulse">
                                    Agora
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                        <Tv className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <p className="text-white/50 font-medium">Nenhuma programação disponível para este canal.</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Tv className="w-16 h-16 text-white/10 mx-auto mb-4" />
                  <p className="text-white/40 font-medium">Selecione um canal para ver a programação</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPlaylistInfo = () => (
    <div className="flex-1 flex flex-col pb-12 lg:pb-0">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-white/10 p-4 text-center font-bold text-lg border-bottom border-white/10">
            Playlist Info
          </div>
          <div className="p-8 space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-white/60 font-medium">Usuario:</span>
              <span className="font-bold text-white">{auth?.user_info.username}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGlobalSearch = () => (
    <div className="flex-1 flex flex-col overflow-hidden pb-12 lg:pb-0">
      <div className="flex-1 flex flex-col p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white/40" />
          <input 
            type="text" 
            placeholder="Pesquisar canais, filmes ou séries..." 
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-4 text-xl focus:outline-none focus:ring-2 focus:ring-neon-blue transition-all"
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="font-sans select-none h-[100dvh] w-full bg-bg-deep text-white flex flex-col overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-[80%] h-[80%] bg-neon-red/5 blur-[80px] rounded-full"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-[80%] h-[80%] bg-neon-blue/5 blur-[80px] rounded-full"></div>
      </div>

      {loading && <LoadingOverlay />}

      {activeStream && auth && (
        activeStream.stream_type === 'live' ? (
          <LivePlayer
            url={
              activeStream.direct_source ? activeStream.direct_source :
              xtreamService.getStreamUrl(auth.user_info.username, auth.user_info.password, activeStream.stream_id, 'm3u8')
            }
            title={activeStream.name}
            isFavorite={favorites.some(f => f.stream_id === activeStream.stream_id)}
            onClose={() => setActiveStream(null)}
            onToggleFavorite={() => toggleFavorite(activeStream)}
          />
        ) : (
          <VideoPlayer
            url={
              activeStream.direct_source ? activeStream.direct_source :
              activeStream.stream_type === 'movie' ? xtreamService.getMovieUrl(auth.user_info.username, auth.user_info.password, activeStream.stream_id, activeStream.container_extension || 'mp4') :
              xtreamService.getSeriesUrl(auth.user_info.username, auth.user_info.password, activeStream.stream_id, activeStream.container_extension || 'mp4')
            }
            title={activeStream.name}
            type="vod"
            isFavorite={favorites.some(f => f.stream_id === activeStream.stream_id)}
            onClose={() => setActiveStream(null)}
            onToggleFavorite={() => toggleFavorite(activeStream)}
          />
        )
      )}

      {auth && view !== 'login' && (
        <Header 
          onBack={view !== 'dashboard' ? () => handleSetView('dashboard') : undefined}
          user={auth}
          onSettings={() => handleSetView('settings')}
          onProfile={() => handleSetView('playlist-info')}
          onLogout={handleLogout}
          onSearch={() => handleSetView('global-search')}
        />
      )}

      <AnimatePresence mode="wait">
        {view === 'login' && <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">{renderLogin()}</motion.div>}
        {view === 'dashboard' && <motion.div key="dashboard" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="flex-1 flex flex-col min-h-0">{renderDashboard()}</motion.div>}
        {(view === 'live' || view === 'movies' || view === 'series' || view === 'favorites' || view === 'history') && <motion.div key="list" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col min-h-0">{renderList(view as any)}</motion.div>}
        {view === 'settings' && <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1 flex flex-col min-h-0">{renderSettings()}</motion.div>}
        {view === 'playlist-info' && <motion.div key="playlist-info" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="flex-1 flex flex-col min-h-0">{renderPlaylistInfo()}</motion.div>}
        {view === 'epg' && <motion.div key="epg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1 flex flex-col min-h-0">{renderEPG()}</motion.div>}
        {view === 'global-search' && <motion.div key="global-search" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="flex-1 flex flex-col min-h-0">{renderGlobalSearch()}</motion.div>}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
      `}</style>
    </div>
  );
}
