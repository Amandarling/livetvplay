import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import mpegts from 'mpegts.js';
import { ArrowLeft, Volume2, VolumeX, Maximize, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LivePlayerProps {
  url: string;
  title: string;
  format?: 'hls' | 'ts';
  onClose?: () => void;
  inline?: boolean;
}

export const LivePlayer: React.FC<LivePlayerProps> = ({ url, title, format, onClose, inline = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hls: Hls | null = null;
    let mpPlayer: any = null;

    const init = () => {
      setIsLoading(true);
      setHasError(false);
      const isTs = format === 'ts' || url.toLowerCase().includes('.ts');

      if (isTs && mpegts.getFeatureList().mseLivePlayback) {
        mpPlayer = mpegts.createPlayer({ type: 'mpegts', isLive: true, url });
        mpPlayer.attachMediaElement(video);
        mpPlayer.load();
        mpPlayer.play().catch(() => {});
      } else if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
        hls.on(Hls.Events.ERROR, (_, data) => data.fatal && setHasError(true));
      } else {
        video.src = url;
      }
    };

    init();
    const handlers = {
      playing: () => { setIsLoading(false); setIsPlaying(true); },
      waiting: () => setIsLoading(true),
      error: () => setHasError(true)
    };

    Object.entries(handlers).forEach(([ev, fn]) => video.addEventListener(ev, fn));
    return () => {
      if (hls) hls.destroy();
      if (mpPlayer) { mpPlayer.unload(); mpPlayer.destroy(); }
      Object.entries(handlers).forEach(([ev, fn]) => video.removeEventListener(ev, fn));
    };
  }, [url, retry]);

  return (
    <div className={inline ? "relative w-full h-full bg-black flex items-center justify-center overflow-hidden" : "fixed inset-0 bg-black z-[100] flex items-center justify-center"}>
      <video ref={videoRef} className="w-full h-full object-contain" playsInline autoPlay />
      
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 p-6 text-center">
          <h3 className="text-white font-bold text-xl mb-4">Sinal fora do ar</h3>
          <button onClick={() => setRetry(r => r + 1)} className="px-6 py-3 bg-blue-600 text-white rounded-xl flex items-center gap-2">
            <RefreshCw size={20} /> Tentar Reconectar
          </button>
        </div>
      )}

      {!inline && (
        <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/80 via-transparent to-black/80 pointer-events-none">
          <div className="flex justify-between items-center pointer-events-auto">
            <button onClick={onClose} className="text-white p-2 bg-white/10 rounded-full"><ArrowLeft /></button>
            <div className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-md">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white text-xs font-bold uppercase">Ao Vivo</span>
            </div>
          </div>
          <div className="flex justify-between items-center pointer-events-auto">
            <h2 className="text-white font-medium">{title}</h2>
            <button onClick={() => videoRef.current?.requestFullscreen()} className="text-white p-2"><Maximize /></button>
          </div>
        </div>
      )}
    </div>
  );
};
