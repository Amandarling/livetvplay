import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import mpegts from "mpegts.js";

interface Props {
  url: string;
  title: string;
  onClose?: () => void;
}

export const LivePlayer: React.FC<Props> = ({ url, title, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    let hls: Hls | null = null;

    let player: any = null;

    video.pause();
    video.removeAttribute("src");

    const isTs = url.includes(".ts");

    if (isTs && mpegts.getFeatureList().mseLivePlayback) {
      player = mpegts.createPlayer({
        type: "mpegts",
        url,
        isLive: true,
      });

      player.attachMediaElement(video);
      player.load();
      player.play();
    } else if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play();
      });
    } else {
      video.src = url;
      video.play();
    }

    video.onplaying = () => setLoading(false);

    return () => {
      if (hls) hls.destroy();

      if (player) {
        player.unload();
        player.destroy();
      }

      video.pause();
    };
  }, [url]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      <video ref={videoRef} className="w-full h-full" autoPlay playsInline />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          Carregando canal...
        </div>
      )}

      <div className="absolute top-4 left-4 text-white">{title}</div>

      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white"
      >
        Fechar
      </button>
    </div>
  );
};