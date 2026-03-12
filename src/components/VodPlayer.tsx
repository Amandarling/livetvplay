import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, RotateCw, RefreshCw } from 'lucide-react';

interface VodPlayerProps {
  url: string;
  title: string;
  onClose?: () => void;
}

export const VodPlayer: React.FC<VodPlayerProps> = ({ url, title, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Controle de sumiço automático dos controles
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isPlaying) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    } else {
      setShowControls(true);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, progress]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setHasError(false);
    setIsPlaying(false);

    // Configurações para Web
    video.src = url;
    video.load();

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onLoadedMetadata = () => setDuration(video.duration);
    const onError = (e: any) => {
      console.error("Erro no Player:", e);
      setHasError(true);
    };
    const onTimeUpdate = () => {
      if (video.duration) {
        const currentProgress = (video.currentTime / video.duration) * 100;
        setProgress(currentProgress);
        // Salva o progresso para continuar depois
        localStorage.setItem(`vod_pos_${url}`, video.currentTime.toString());
      }
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('error', onError);
    video.addEventListener('timeupdate', onTimeUpdate);

    // Tenta recuperar posição salva
    const saved = localStorage.getItem(`vod_pos_${url}`);
    if (saved) video.currentTime = parseFloat(saved);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('error', onError);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.pause();
      video.src = "";
      video.load();
    };
  }, [url]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => setHasError(true));
    } else {
      videoRef.current.pause();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black z-[100] flex items-center justify-center overflow-hidden"
      onMouseMove={() => setShowControls(true)}
    >
      <video 
        ref={videoRef} 
        className="w-full h-full object-contain cursor-pointer" 
        playsInline
        autoPlay
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onClick={togglePlay}
      />

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 z-[110] p-6 text-center backdrop-blur-sm">
          <div className="bg-zinc-900 p-8 rounded-3xl border border-white/10 max-w-sm shadow-2xl">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw size={32} />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">Erro de Reprodução</h3>
            <p className="text-zinc-500 text-sm mb-6">
              Não foi possível carregar este vídeo. O link pode ter expirado ou o formato não é suportado pelo navegador.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-colors"
              >
                Tentar Novamente
              </button>
              <button onClick={onClose} className="text-zinc-400 hover:text-white text-sm font-medium py-2">
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controles */}
      <div className={`absolute inset-0 flex flex-col justify-between p-8 bg-gradient-to-t from-black/90 via-transparent to-black/60 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-white p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-white font-bold text-lg truncate">{title}</h2>
            <p className="text-white/40 text-xs uppercase tracking-widest">Reproduzindo VOD</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-12">
          <button onClick={() => videoRef.current && (videoRef.current.currentTime -= 10)} className="text-white/50 hover:text-white transition-colors">
            <RotateCcw size={40}/>
          </button>
          
          <button 
            onClick={togglePlay} 
            className="w-20 h-20 bg-white rounded-full text-black flex items-center justify-center hover:scale-110 transition-transform shadow-xl shadow-white/10"
          >
            {isPlaying ? <Pause size={36} fill="black"/> : <Play size={36} fill="black" className="ml-1"/>}
          </button>

          <button onClick={() => videoRef.current && (videoRef.current.currentTime += 10)} className="text-white/50 hover:text-white transition-colors">
            <RotateCw size={40}/>
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-xs text-white/50 font-mono">
             <span>{videoRef.current ? new Date(videoRef.current.currentTime * 1000).toISOString().substr(11, 8) : '00:00:00'}</span>
             <span>{videoRef.current ? new Date(duration * 1000).toISOString().substr(11, 8) : '00:00:00'}</span>
          </div>
          <div className="relative h-2 w-full bg-white/10 rounded-full cursor-pointer group"
               onClick={(e) => {
                 const rect = e.currentTarget.getBoundingClientRect();
                 const pos = (e.clientX - rect.left) / rect.width;
                 if (videoRef.current) videoRef.current.currentTime = pos * duration;
               }}>
            <div className="absolute h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            <div className="absolute h-4 w-4 bg-white rounded-full -top-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `${progress}%`, marginLeft: '-8px' }} />
          </div>
        </div>
      </div>
    </div>
  );
};