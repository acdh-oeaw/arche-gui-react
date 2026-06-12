'use client';

import { PauseIcon, PlayIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';
import { useEffect, useRef, useState } from 'react';

interface AudioBlockProps {
  url: string;
}

const MIME_BY_EXT: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  flac: 'audio/flac',
};

const formatTime = (time: number): string => {
  if (!Number.isFinite(time) || time < 0) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${String(minutes)}:${String(seconds).padStart(2, '0')}`;
};

const resolveAudioMime = (contentType: string | null, src: string): string => {
  if (contentType && !contentType.includes('octet-stream') && !contentType.includes('text/html')) {
    return contentType.split(';')[0].trim();
  }
  const ext = src.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  return MIME_BY_EXT[ext] ?? 'audio/mpeg';
};

export function AudioBlock({ url }: Readonly<AudioBlockProps>) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch audio and create a typed Blob URL to avoid octet-stream rejection
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    void (async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);

        const contentType = response.headers.get('content-type');
        const mime = resolveAudioMime(contentType, url);
        const buffer = await response.arrayBuffer();
        const blob = new Blob([buffer], { type: mime });
        const blobUrl = URL.createObjectURL(blob);

        blobUrlRef.current = blobUrl;
        audio.src = blobUrl;
        audio.load();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to fetch audio');
        setLoading(false);
      }
    })();

    const onPlay = () => { setIsPlaying(true); };
    const onPause = () => { setIsPlaying(false); };
    const onTimeUpdate = () => { setCurrentTime(audio.currentTime); };
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setLoading(false);
    };
    const onError = () => {
      const msg = audio.error?.message;
      setError(msg?.length ? msg : 'Failed to load audio');
      setLoading(false);
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('error', onError);
      audio.pause();
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [url]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      void audio.play().catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Playback failed');
      });
    }
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const onVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const vol = Number(e.target.value);
    audio.volume = vol;
    audio.muted = vol === 0;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !isMuted;
    audio.muted = next;
    setIsMuted(next);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full rounded-md border border-gray-200 bg-gray-50 p-4">
      <audio ref={audioRef} preload="auto" />

      {loading && !error && (
        <p className="py-4 text-center text-sm text-gray-500">{'Loading audio…'}</p>
      )}
      {error && (
        <p className="py-4 text-center text-sm text-red-600">{error}</p>
      )}
      {!loading && !error && (
        <div className="flex flex-col gap-3">
          {/* Seek bar */}
          <div className="relative h-2 w-full rounded-full bg-gray-200">
            <div
              className="absolute left-0 top-0 h-2 rounded-full bg-blue-500"
              style={{ width: `${String(progressPercent)}%` }}
            />
            <input
              aria-label="Seek"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              max={duration || 0}
              min={0}
              onChange={onSeek}
              step={0.1}
              type="range"
              value={currentTime}
            />
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-3">
            <button
              className="rounded-full p-1 hover:bg-gray-200"
              onClick={togglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
              type="button"
            >
              {isPlaying
                ? <PauseIcon className="h-6 w-6 text-gray-700" />
                : <PlayIcon className="h-6 w-6 text-gray-700" />}
            </button>

            <span className="min-w-20 text-sm text-gray-600">
              {formatTime(currentTime)}{' / '}{formatTime(duration)}
            </span>

            <div className="ml-auto flex items-center gap-2">
              <button
                className="rounded p-1 hover:bg-gray-200"
                onClick={toggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
                type="button"
              >
                {isMuted
                  ? <SpeakerXMarkIcon className="h-5 w-5 text-gray-700" />
                  : <SpeakerWaveIcon className="h-5 w-5 text-gray-700" />}
              </button>
              <input
                aria-label="Volume"
                className="w-20 cursor-pointer accent-blue-500"
                max={1}
                min={0}
                onChange={onVolumeChange}
                step={0.05}
                type="range"
                value={isMuted ? 0 : volume}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
