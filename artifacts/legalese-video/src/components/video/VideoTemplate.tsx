import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

export const SCENE_DURATIONS: Record<string, number> = {
  intro: 6000,
  uploadAnalysis: 12000,
  compareNegotiate: 12000,
  templatesAlerts: 10000,
  outro: 8000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  intro: Scene1,
  uploadAnalysis: Scene2,
  compareNegotiate: Scene3,
  templatesAlerts: Scene4,
  outro: Scene5,
};

const SCENE_KEYS = Object.keys(SCENE_DURATIONS);

const SCENE_START_SEC: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  let cumulativeMs = 0;
  for (const [key, ms] of Object.entries(SCENE_DURATIONS)) {
    out[key] = cumulativeMs / 1000;
    cumulativeMs += ms;
  }
  return out;
})();

const AUDIO_SEEK_EPSILON_SEC = 0.18;

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  muted = false,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  muted?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '');
  const sceneIndex = SCENE_KEYS.indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.45;
    const targetTime = SCENE_START_SEC[baseSceneKey] ?? 0;
    if (Math.abs(audio.currentTime - targetTime) > AUDIO_SEEK_EPSILON_SEC) {
      audio.currentTime = targetTime;
    }
    audio.play().catch(() => {});
  }, [currentSceneKey, baseSceneKey, muted]);

  return (
    <>
      <div className="relative w-full h-screen overflow-hidden bg-[#020617] text-white">
        {/* Persistent Background Layer */}
        <div className="absolute inset-0 z-0">
          <motion.div
            className="absolute w-[80vw] h-[80vw] rounded-full opacity-20 blur-[100px]"
            style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }}
            animate={{
              x: ['-20%', '20%', '-10%', '10%', '-20%'][sceneIndex % 5],
              y: ['-20%', '10%', '30%', '-10%', '-20%'][sceneIndex % 5],
              scale: [1, 1.2, 0.8, 1.1, 1][sceneIndex % 5],
            }}
            transition={{ duration: 10, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-[60vw] h-[60vw] rounded-full opacity-10 blur-[100px] right-0 bottom-0"
            style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }}
            animate={{
              x: ['10%', '-30%', '20%', '-10%', '10%'][sceneIndex % 5],
              y: ['10%', '-10%', '-30%', '20%', '10%'][sceneIndex % 5],
              scale: [1, 0.9, 1.3, 0.9, 1][sceneIndex % 5],
            }}
            transition={{ duration: 12, ease: 'easeInOut' }}
          />
          <div
            className="absolute inset-0 opacity-20 mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23fff' fill-opacity='0.05'/%3E%3C/svg%3E\")",
            }}
          />
        </div>

        {/* Persistent Logo — hidden on intro/outro */}
        <motion.div
          className="absolute top-8 left-12 z-20 font-bold text-2xl tracking-tight flex items-center gap-3"
          animate={{ opacity: sceneIndex === 0 || sceneIndex === 4 ? 0 : 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          Legalese
        </motion.div>

        {/* Persistent Scene Progress Dots — hidden on intro */}
        <motion.div
          className="absolute bottom-8 right-12 z-20 flex gap-2"
          animate={{ opacity: sceneIndex === 0 ? 0 : 1 }}
          transition={{ duration: 0.4 }}
        >
          {SCENE_KEYS.map((k, i) => (
            <motion.div
              key={k}
              className={`h-1 rounded-full ${i === sceneIndex ? 'bg-white' : 'bg-white/20'}`}
              animate={{ width: i === sceneIndex ? 32 : 16 }}
              transition={{ duration: 0.5 }}
            />
          ))}
        </motion.div>

        {/* Scene Content */}
        <div className="relative z-10 w-full h-full">
          <AnimatePresence mode="popLayout">
            {SceneComponent && <SceneComponent key={currentSceneKey} />}
          </AnimatePresence>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}audio/bg_music.mp3`}
        preload="auto"
        autoPlay
        muted={muted}
      />
    </>
  );
}
