import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { sceneTransitions } from '../../../lib/video/animations';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),   // Show UI
      setTimeout(() => setPhase(2), 2000),  // Trigger diff calculation
      setTimeout(() => setPhase(3), 3500),  // Show redlines
      setTimeout(() => setPhase(4), 6000),  // Show negotiation panel
      setTimeout(() => setPhase(5), 8000),  // Accept AI suggestion
      setTimeout(() => setPhase(6), 11000), // Exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center pt-20 px-16"
      {...sceneTransitions.clipPolygon}
    >
      <div className="text-center z-20 mb-8">
        <motion.h2 
          className="text-4xl font-display font-bold mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Side-by-side Version Diff
        </motion.h2>
        <motion.p 
          className="text-xl text-slate-400 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Full redline comparison. Track negotiations per risk. Get AI-suggested safer clauses.
        </motion.p>
      </div>

      <div className="w-full max-w-6xl relative h-[65vh] flex gap-4">
        {/* Diff View */}
        <motion.div
          className="flex-1 bg-[#0f172a] rounded-xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col"
          initial={{ opacity: 0, x: -50 }}
          animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
          transition={{ duration: 0.8 }}
        >
          <div className="h-12 border-b border-slate-800 bg-[#1e293b] flex items-center px-4 justify-between">
            <span className="text-sm font-medium text-slate-400">V1 (Original) vs V2 (Current)</span>
            {phase >= 2 && phase < 3 && (
              <motion.div 
                className="text-xs text-blue-400 flex items-center gap-2"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              >
                <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                Calculating Diff...
              </motion.div>
            )}
          </div>
          
          <div className="flex-1 flex font-mono text-sm leading-relaxed p-6 gap-6 relative">
            <div className="flex-1 text-slate-500">
              <p className="mb-4 text-slate-600 font-sans font-bold">V1</p>
              <p>7. LIMITATION OF LIABILITY</p>
              <p className="mt-2">PROVIDER'S TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING UNDER THIS AGREEMENT SHALL BE UNLIMITED.</p>
            </div>
            
            <div className="w-px bg-slate-800" />
            
            <div className="flex-1 text-slate-300">
              <p className="mb-4 text-slate-600 font-sans font-bold">V2</p>
              <p>7. LIMITATION OF LIABILITY</p>
              <p className="mt-2 relative">
                {phase >= 3 && (
                  <>
                    <motion.span 
                      className="bg-red-500/20 text-red-300 line-through px-1 rounded mr-1"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    >
                      UNLIMITED
                    </motion.span>
                    <motion.span 
                      className="bg-green-500/20 text-green-300 px-1 rounded"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    >
                      LIMITED TO THE FEES PAID IN THE PRIOR 12 MONTHS
                    </motion.span>
                  </>
                )}
                {phase < 3 && "UNLIMITED."}
              </p>
            </div>
          </div>
        </motion.div>

        {/* AI Negotiation Panel */}
        <motion.div
          className="w-80 bg-[#0f172a] rounded-xl border border-slate-800 shadow-2xl flex flex-col"
          initial={{ opacity: 0, x: 50, width: 0 }}
          animate={phase >= 4 ? { opacity: 1, x: 0, width: 320 } : { opacity: 0, x: 50, width: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        >
          <div className="p-4 border-b border-slate-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <span className="font-bold text-white">AI Suggestion</span>
          </div>
          <div className="p-4 flex-1">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 mb-4">
              <div className="text-xs text-slate-400 mb-2 font-medium">RECOMMENDED CLAUSE</div>
              <p className="text-sm font-mono text-blue-200">
                "limited to the fees paid in the prior 12 months"
              </p>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Industry standard for SaaS agreements. Reduces infinite exposure while remaining acceptable to enterprise buyers.
            </p>
            <motion.button
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-colors relative overflow-hidden"
              whileTap={{ scale: 0.95 }}
              animate={phase >= 5 ? { backgroundColor: '#10b981' } : {}}
            >
              {phase >= 5 ? (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Applied to V2
                </motion.span>
              ) : "Apply Suggestion"}
              
              {phase === 5 && (
                <motion.div 
                  className="absolute inset-0 bg-white"
                  initial={{ opacity: 0.5, scale: 0 }}
                  animate={{ opacity: 0, scale: 2 }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
