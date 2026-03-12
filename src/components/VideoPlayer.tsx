import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Star, RotateCcw, RotateCw, Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from '@/src/components/Logo';

interface VideoPlayerProps {
  url: string;
  title: string;
  type: 'live' | 'vod';
  isFavorite: boolean;
  onClose?: () => void;
  onToggleFavorite?: () => void;
  inline?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  title,
  type,
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
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const initPlayer = () => {
      setIsLoading(true);
      setHasError(false);
      video.src = url;
      
      // Tentar recuperar posição anterior para VOD
      if (type === 'vod') {
        const savedPos = localStorage.getItem(`playback_pos_${url}`);
        if (savedPos) {
          video.currentTime = parseFloat(savedPos);
        }
      }
      
      video.play().catch(() => setIsPlaying(false));
    };

    initPlayer();

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // Salvar progresso periodicamente para VOD
      if (type === 'vod' && video.currentTime > 0) {
        localStorage.setItem(`playback_pos_${url}`, video.currentTime.toString());
      }
    };
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };
    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
    };
  }, [url, type]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    videoRef.current.currentTime = percentage * duration;
  };

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

  const skip = (seconds: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
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
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-black/80 backdrop-blur-md z-50">
          <div className="bg-white/10 p-6 rounded-2xl border border-white/20 text-center max-w-sm mx-4 pointer-events-auto">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl font-bold">!</span>
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Erro ao carregar vídeo</h3>
            <p className="text-white/60 text-sm mb-4">Não foi possível reproduzir este conteúdo. Verifique sua conexão ou tente novamente mais tarde.</p>
            
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl mb-6 text-left">
              <p className="text-yellow-500 text-[11px] font-bold uppercase mb-1">Dica de Conexão:</p>
              <p className="text-white/70 text-[10px] leading-relaxed">
                Se o erro persistir, seu navegador pode estar bloqueando o vídeo (Mixed Content). 
                Clique no ícone de <b>Cadeado</b> na barra de endereços e ative <b>"Conteúdo Inseguro"</b> ou <b>"Insecure Content"</b>.
              </p>
            </div>

            {onClose && (
              <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
              >
                Voltar
              </button>
            )}
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
                <h2 className="text-white font-bold text-lg sm:text-xl drop-shadow-md truncate max-w-[60vw]">
                  {title}
                </h2>
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

            {/* Center Controls (VOD only) */}
            {type === 'vod' && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-8 pointer-events-auto">
                <button 
                  onClick={(e) => skip(-20, e)}
                  className="p-4 bg-black/40 hover:bg-white/10 backdrop-blur-md rounded-full transition-colors group"
                >
                  <RotateCcw className="w-8 h-8 text-white group-hover:text-neon-blue transition-colors" />
                </button>
                <button 
                  onClick={togglePlay}
                  className="p-6 bg-neon-blue/20 hover:bg-neon-blue/40 backdrop-blur-md rounded-full border border-neon-blue/30 shadow-[0_0_20px_rgba(10,132,255,0.3)] transition-all group"
                >
                  {isPlaying ? (
                    <Pause className="w-12 h-12 text-neon-blue" />
                  ) : (
                    <Play className="w-12 h-12 text-neon-blue ml-1" />
                  )}
                </button>
                <button 
                  onClick={(e) => skip(20, e)}
                  className="p-4 bg-black/40 hover:bg-white/10 backdrop-blur-md rounded-full transition-colors group"
                >
                  <RotateCw className="w-8 h-8 text-white group-hover:text-neon-blue transition-colors" />
                </button>
              </div>
            )}

            {/* Bottom Controls */}
            <div className="flex flex-col pointer-events-auto">
              {/* Progress Bar (VOD only) */}
              {type === 'vod' && (
                <div className="px-4 sm:px-6 mb-2">
                  <div 
                    className="relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer group"
                    onClick={handleSeek}
                  >
                    <div 
                      className="absolute top-0 left-0 h-full bg-neon-blue shadow-[0_0_10px_rgba(10,132,255,0.5)] transition-all duration-100" 
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 px-1">
                    <span className="text-[10px] text-white/60 font-mono">{formatTime(currentTime)}</span>
                    <span className="text-[10px] text-white/60 font-mono">{formatTime(duration)}</span>
                  </div>
                </div>
              )}

              <div className="p-4 sm:p-6 flex items-center justify-between">
                <button 
                  onClick={toggleMute}
                  className="p-2 sm:p-3 bg-black/40 hover:bg-white/10 backdrop-blur-md rounded-full transition-colors"
                >
                  {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                </button>
                
                {type === 'live' && (
                  <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-neon-red animate-pulse"></div>
                    <span className="text-white font-bold text-sm tracking-wider">AO VIVO</span>
                  </div>
                )}

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
