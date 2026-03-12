import React, { useEffect, useRef, useState } from "react";

interface Props {
  url: string;
  title: string;
  onClose?: () => void;
}

export const VodPlayer: React.FC<Props> = ({ url, title, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.pause();
    video.removeAttribute("src");

    video.src = url;

    video.load();

    video.play().catch(() => {});

    video.ontimeupdate = () => {
      const pct = (video.currentTime / video.duration) * 100;

      setProgress(pct);
    };

    return () => {
      video.pause();
    };
  }, [url]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls
      />

      <div className="absolute top-4 left-4 text-white">{title}</div>

      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white"
      >
        Fechar
      </button>

      <div className="absolute bottom-0 w-full h-2 bg-gray-800">
        <div
          className="h-2 bg-blue-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};