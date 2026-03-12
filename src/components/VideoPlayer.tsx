import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowLeft, Star, RotateCcw, RotateCw, Play, Pause,
  Volume2, VolumeX, Maximize, Minimize, Settings,
  SkipForward, SkipBack, List, Info, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from '@/src/components/Logo';
import Hls from 'hls.js';
import mpegts from 'mpegts.js';

interface VideoPlayerProps {
  url: string;
  title: string;
  type: 'live' | 'vod' | 'movie' | 'series';
  isFavorite?: boolean;
  onClose?: () => void;
  onToggleFavorite?: () => void;
  inline?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  title,
  type,
  isFavorite = false,
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const isLive = type === 'live';

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

    let hls: Hls | null = null;
    let player: any = null;

    const initPlayer = () => {
      setIsLoading(true);
      setHasError(false);

      const isTs = url.includes(".ts") || url.includes("type=ts");

      if (isTs && mpegts.getFeatureList().mseLivePlayback) {
        player = mpegts.createPlayer({
          type: "mpegts",
          url,
          isLive: isLive,
        });
        player.attachMediaElement(video);
        player.load();
        player.play().catch(() => setIsPlaying(false));
      } else if ((url.includes(".m3u8") || url.includes("type=m3u8")) && Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: isLive,
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => setIsPlaying(false));
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            setHasError(true);
          }
        });
      } else {
        video.src = url;
        video.play().catch(() => setIsPlaying(false));
      }
    };

    initPlayer();

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (!isLive && video.duration > 0) {
        localStorage.setItem(`playback_pos_${url}`, video.currentTime.toString());
      }
    };
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);

      if (!isLive) {
        const savedPos = localStorage.getItem(`playback_pos_${url}`);
        if (savedPos) {
          video.currentTime = parseFloat(savedPos);
        }
      }
    };
    const handleError = () => {
      if (!video.src.includes('blob:')) {
        setHasError(true);
      }
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
      if (hls) hls.destroy();
      if (player) {
        player.unload();
        player.destroy();
      }
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
    if (!videoRef.current || !duration || isLive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    videoRef.current.currentTime = percentage * duration;
  };

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isHoveringProgress) setShowControls(false);
    }, 4000);
  }, [isPlaying, isHoveringProgress]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, resetControlsTimeout]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
    resetControlsTimeout();
  };

  const skip = (seconds: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current && !isLive) {
      videoRef.current.currentTime += seconds;
      resetControlsTimeout();
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
      className={inline
        ? "relative w-full h-full bg-black overflow-hidden rounded-xl border border-white/10 shadow-2xl group"
        : "fixed inset-0 z-[9999] bg-black flex items-center justify-center select-none overflow-hidden"
      }
      onMouseMove={resetControlsTimeout}
      onClick={resetControlsTimeout}
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain pointer-events-none"
        playsInline
        preload="auto"
        autoPlay
      />

      {/* Static Background Overlay (always there but invisible until controls show) */}
      <div className={`absolute inset-0 bg-black/40 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`} />

      {/* Jumping Logo Loading */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Logo className="w-24 h-24 animate-bounce" />
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50 p-6">
          <div className="max-w-md text-center">
            <h3 className="text-white font-bold text-2xl mb-4">Ocorreu um erro inesperado</h3>
            <p className="text-white/60 mb-8">Não foi possível carregar este conteúdo agora. Por favor, tente novamente em alguns instantes.</p>
            <div className="flex gap-4 justify-center">
               <button onClick={() => window.location.reload()} className="px-8 py-3 bg-white text-black font-bold rounded hover:bg-white/90 transition-colors">Recarregar</button>
               {onClose && <button onClick={onClose} className="px-8 py-3 bg-white/10 text-white font-bold rounded hover:bg-white/20 transition-colors">Voltar</button>}
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
            className="absolute inset-0 flex flex-col justify-between z-10"
          >
            {/* Top Bar */}
            <div className="bg-gradient-to-b from-black/80 via-black/40 to-transparent p-6 sm:p-10 flex items-center gap-6">
              {onClose && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors group"
                >
                  <ArrowLeft className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                </button>
              )}
              <div className="flex-1">
                <h2 className="text-white font-medium text-xl sm:text-2xl drop-shadow-md truncate">
                  {title}
                </h2>
                {isLive && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Ao Vivo</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                {onToggleFavorite && (
                  <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Star className={`w-7 h-7 ${isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-white'}`} />
                  </button>
                )}
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <HelpCircle className="w-7 h-7 text-white" />
                </button>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 sm:p-10 pt-20">
              {/* Progress Slider (Netflix style) */}
              {!isLive && (
                <div className="mb-6 px-2">
                  <div 
                    className="relative w-full h-1.5 bg-white/30 rounded-full cursor-pointer group/progress"
                    onMouseEnter={() => setIsHoveringProgress(true)}
                    onMouseLeave={() => setIsHoveringProgress(false)}
                    onClick={handleSeek}
                  >
                    <div 
                      className="absolute top-0 left-0 h-full bg-red-600 transition-all duration-100 rounded-full"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-red-600 rounded-full scale-0 group-hover/progress:scale-100 transition-transform shadow-lg" />
                    </div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-sm text-white/80 font-medium">{formatTime(currentTime)}</span>
                    <span className="text-sm text-white/80 font-medium">{formatTime(duration)}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <button onClick={togglePlay} className="hover:scale-110 transition-transform">
                    {isPlaying ? <Pause className="w-8 h-8 text-white" fill="white" /> : <Play className="w-8 h-8 text-white" fill="white" />}
                  </button>

                  {!isLive && (
                    <>
                      <button onClick={(e) => skip(-10, e)} className="hover:scale-110 transition-transform">
                        <RotateCcw className="w-8 h-8 text-white" />
                      </button>
                      <button onClick={(e) => skip(10, e)} className="hover:scale-110 transition-transform">
                        <RotateCw className="w-8 h-8 text-white" />
                      </button>
                    </>
                  )}

                  <div className="flex items-center gap-3 group/volume">
                    <button onClick={toggleMute} className="hover:scale-110 transition-transform">
                      {isMuted ? <VolumeX className="w-8 h-8 text-white" /> : <Volume2 className="w-8 h-8 text-white" />}
                    </button>
                    <div className="w-0 group-hover/volume:w-24 overflow-hidden transition-all duration-300">
                       <input
                         type="range"
                         min="0" max="1" step="0.1"
                         className="w-24 accent-white cursor-pointer"
                         onChange={(e) => {
                           if (videoRef.current) videoRef.current.volume = parseFloat(e.target.value);
                         }}
                       />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <button className="hover:scale-110 transition-transform opacity-60 hover:opacity-100">
                    <List className="w-8 h-8 text-white" />
                  </button>
                  <button className="hover:scale-110 transition-transform opacity-60 hover:opacity-100">
                    <Settings className="w-8 h-8 text-white" />
                  </button>
                  <button onClick={toggleFullscreen} className="hover:scale-110 transition-transform">
                    {isFullscreen ? <Minimize className="w-8 h-8 text-white" /> : <Maximize className="w-8 h-8 text-white" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
