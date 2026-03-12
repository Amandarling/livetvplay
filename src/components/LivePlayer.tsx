import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { ArrowLeft, Star, Volume2, VolumeX, Maximize, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from '@/src/components/Logo';

interface LivePlayerProps {
  url: string;
  title: string;
  isFavorite: boolean;
  onClose?: () => void;
  onToggleFavorite?: () => void;
  inline?: boolean;
}

export const LivePlayer: React.FC<LivePlayerProps> = ({
  url,
  title,
  isFavorite,
  onClose,
  onToggleFavorite,
  inline = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const initPlayer = () => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setHasError(false);

    let hls: Hls | null = null;
    let playbackUrl = url;
    
    // Suporte para .ts em canais ao vivo convertendo para .m3u8 se necessário
    const isTsLive = playbackUrl.endsWith('.ts');
    if (isTsLive) {
      playbackUrl = playbackUrl.replace(/\.ts$/, '.m3u8');
    }

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        startLevel: -1,
        capLevelToPlayerSize: true,
        maxBufferLength: 15,
        maxMaxBufferLength: 30,
        maxBufferSize: 60 * 1000 * 1000,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        fragLoadingTimeOut: 20000,
        manifestLoadingTimeOut: 10000,
        appendErrorMaxRetry: 5,
      });

      hls.loadSource(playbackUrl);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => setIsPlaying(false));
        setIsLoading(false);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          // Fallback para .ts original se o .m3u8 falhar
          if (isTsLive && playbackUrl.includes('.m3u8')) {
            playbackUrl = url;
            hls?.destroy();
            video.src = playbackUrl;
            video.play().catch(() => setIsPlaying(false));
            return;
          }

          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (retryCount < 5) {
                setRetryCount(prev => prev + 1);
                hls?.startLoad();
              } else {
                setHasError(true);
                setIsLoading(false);
                hls?.destroy();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls?.recoverMediaError();
              break;
            default:
              setHasError(true);
              setIsLoading(false);
              hls?.destroy();
              break;
          }
        }
      });

      return hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Suporte nativo (Safari/iOS)
      video.src = playbackUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => setIsPlaying(false));
        setIsLoading(false);
      });
    } else {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => setIsPlaying(false));
        setIsLoading(false);
      });
    }
  };

  useEffect(() => {
    const hls = initPlayer();

    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      if (hls) hls.destroy();
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [url, retryCount]);

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(err => console.error(err));
      setIsFullscreen(false);
    }
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRetryCount(prev => prev + 1);
  };

  return (
    <div 
      ref={containerRef}
      className={inline ? "relative w-full h-full bg-black overflow-hidden rounded-xl border border-white/10 shadow-2xl" : "fixed inset-0 z-[100] bg-black flex items-center justify-center"}
      onMouseMove={resetControlsTimeout}
      onClick={resetControlsTimeout}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        autoPlay
        onClick={togglePlay}
      />

      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/40 backdrop-blur-sm">
          <Logo className="w-20 h-20 animate-bounce" />
          <div className="absolute mt-32 text-white/60 text-xs font-medium tracking-widest uppercase">Sincronizando Sinal...</div>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-black/80 backdrop-blur-md z-50">
          <div className="bg-white/10 p-6 rounded-2xl border border-white/20 text-center max-w-sm mx-4 pointer-events-auto">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl font-bold">!</span>
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Sinal Indisponível</h3>
            <p className="text-white/60 text-sm mb-4">Não foi possível conectar ao fluxo de transmissão. Verifique sua lista ou tente novamente.</p>
            
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl mb-6 text-left">
              <p className="text-yellow-500 text-[11px] font-bold uppercase mb-1">Dica de Conexão:</p>
              <p className="text-white/70 text-[10px] leading-relaxed">
                Se o erro persistir, seu navegador pode estar bloqueando o sinal (Mixed Content). 
                Clique no ícone de <b>Cadeado</b> na barra de endereços e ative <b>"Conteúdo Inseguro"</b> ou <b>"Insecure Content"</b>.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button 
                onClick={handleRetry}
                className="w-full py-3 bg-neon-blue text-white font-bold rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Tentar Novamente
              </button>
              {onClose && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/60 font-medium rounded-xl transition-colors"
                >
                  Voltar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80 pointer-events-none flex flex-col justify-between"
          >
            {/* Top Controls */}
            <div className="p-4 sm:p-6 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-4">
                {onClose && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="p-2 sm:p-3 bg-black/40 hover:bg-white/10 backdrop-blur-md rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6 text-white" />
                  </button>
                )}
                <div className="flex flex-col">
                  <h2 className="text-white font-bold text-lg sm:text-xl drop-shadow-md truncate max-w-[60vw]">
                    {title}
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-neon-red animate-pulse"></div>
                    <span className="text-[10px] text-white/60 font-bold tracking-widest uppercase">Transmissão em Tempo Real</span>
                  </div>
                </div>
              </div>
              {onToggleFavorite && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                  className="p-2 sm:p-3 bg-black/40 hover:bg-white/10 backdrop-blur-md rounded-full transition-colors"
                >
                  <Star className={`w-6 h-6 ${isFavorite ? 'fill-neon-blue text-neon-blue drop-shadow-[0_0_8px_rgba(10,132,255,0.8)]' : 'text-white'}`} />
                </button>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="p-4 sm:p-6 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-4">
                <button 
                  onClick={toggleMute}
                  className="p-2 sm:p-3 bg-black/40 hover:bg-white/10 backdrop-blur-md rounded-full transition-colors"
                >
                  {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                </button>
                
                <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-white/40 font-bold uppercase tracking-tighter">Status do Sinal</span>
                    <span className="text-[11px] text-neon-green font-bold uppercase">Excelente</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={handleRetry}
                  className="p-2 sm:p-3 bg-black/40 hover:bg-white/10 backdrop-blur-md rounded-full transition-colors"
                  title="Recarregar Sinal"
                >
                  <RefreshCw className="w-5 h-5 text-white" />
                </button>
                <button 
                  onClick={toggleFullscreen}
                  className="p-2 sm:p-3 bg-black/40 hover:bg-white/10 backdrop-blur-md rounded-full transition-colors"
                >
                  <Maximize className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
