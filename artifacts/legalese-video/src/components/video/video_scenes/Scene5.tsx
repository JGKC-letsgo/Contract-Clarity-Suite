import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { sceneTransitions } from '../../../lib/video/animations';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),   // Secure Auth Badge
      setTimeout(() => setPhase(2), 1500),  // Main value prop
      setTimeout(() => setPhase(3), 3000),  // CTA
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center text-center"
      {...sceneTransitions.morphExpand}
    >
      <motion.div
        className="mb-8 flex items-center gap-2 bg-slate-800/50 border border-slate-700 px-4 py-2 rounded-full"
        initial={{ opacity: 0, y: -20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        <span className="text-sm font-medium text-slate-300">Secure Sign-in by Clerk</span>
      </motion.div>

      <div className="overflow-hidden mb-6">
        <motion.h1 
          className="text-6xl font-display font-black tracking-tight"
          initial={{ y: '100%' }}
          animate={phase >= 2 ? { y: 0 } : { y: '100%' }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          Review Contracts <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">10x Faster</span>
        </motion.h1>
      </div>

      <motion.div
        className="mt-12"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={phase >= 3 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="inline-flex items-center justify-center px-8 py-4 bg-white text-slate-900 rounded-xl font-bold text-xl shadow-xl shadow-white/10 relative overflow-hidden group">
          <span className="relative z-10">contractclarity.app</span>
          <div className="absolute inset-0 bg-blue-50 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
        </div>
      </motion.div>
    </motion.div>
  );
}
