import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { sceneTransitions } from '../../../lib/video/animations';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
      setTimeout(() => setPhase(4), 5000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center"
      {...sceneTransitions.scaleFade}
    >
      <motion.div
        className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-12"
        initial={{ scale: 0, rotate: -15, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </motion.div>

      <div className="text-center overflow-hidden">
        <motion.h1 
          className="text-[6vw] font-display font-black tracking-tight leading-none mb-6"
          initial={{ y: '100%' }}
          animate={phase >= 1 ? { y: 0 } : { y: '100%' }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          Contract Clarity
        </motion.h1>
      </div>

      <div className="text-center overflow-hidden h-24">
        <motion.p 
          className="text-[2vw] text-slate-400 font-medium tracking-wide"
          initial={{ y: '100%', opacity: 0 }}
          animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: '100%', opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          The AI-Powered Contract Review Platform
        </motion.p>
      </div>

      <motion.div
        className="absolute bottom-[20%] w-[1px] h-24 bg-gradient-to-b from-blue-500 to-transparent"
        initial={{ scaleY: 0, originY: 0 }}
        animate={phase >= 3 ? { scaleY: 1 } : { scaleY: 0 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
    </motion.div>
  );
}
