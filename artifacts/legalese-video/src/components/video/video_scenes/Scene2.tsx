import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { sceneTransitions } from '../../../lib/video/animations';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),   // Show UI container
      setTimeout(() => setPhase(2), 1500),  // Drop file
      setTimeout(() => setPhase(3), 3000),  // Processing state
      setTimeout(() => setPhase(4), 5000),  // Show text extraction
      setTimeout(() => setPhase(5), 7000),  // Highlight risks
      setTimeout(() => setPhase(6), 11000), // Exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center px-24 pt-24"
      {...sceneTransitions.slideUp}
    >
      <div className="w-1/3 pr-16 z-20">
        <motion.h2 
          className="text-4xl font-display font-bold mb-6"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          Instant Upload & Extraction
        </motion.h2>
        <motion.p 
          className="text-xl text-slate-400 mb-12"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Drag & drop PDF or DOCX. Contract Clarity instantly extracts text and structural clauses.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            AI Risk Analysis
          </h3>
          <p className="text-lg text-slate-300">
            Automatically identifies critical clauses, unlimited liability, and one-sided terms.
          </p>
        </motion.div>
      </div>

      <div className="w-2/3 relative h-[70vh]">
        {/* Main UI Container */}
        <motion.div
          className="absolute inset-0 bg-[#0f172a] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.9, y: 50 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        >
          {/* Header */}
          <div className="h-12 border-b border-slate-800 bg-[#1e293b] flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
          </div>

          <div className="p-8 h-full relative">
            {/* Upload Zone */}
            <motion.div 
              className="absolute inset-8 border-2 border-dashed border-blue-500/50 rounded-xl bg-blue-500/5 flex flex-col items-center justify-center z-10"
              initial={{ opacity: 1 }}
              animate={phase >= 4 ? { opacity: 0, pointerEvents: 'none' } : { opacity: 1 }}
            >
              <svg className="w-16 h-16 text-blue-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-xl text-blue-200">Drag & Drop MSA_V2.pdf</p>
            </motion.div>

            {/* Dropping File */}
            {phase >= 2 && phase < 4 && (
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 border border-slate-700 p-4 rounded-lg shadow-xl z-20 flex items-center gap-4 w-64"
                initial={{ y: -200, opacity: 0, scale: 1.2 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="w-10 h-10 bg-red-500/20 rounded flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                </div>
                <div>
                  <div className="text-sm font-medium">MSA_V2.pdf</div>
                  {phase >= 3 ? (
                    <div className="w-full bg-slate-700 h-1 mt-2 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-blue-500" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.5 }} />
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 mt-1">2.4 MB</div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Extracted Document View */}
            <motion.div
              className="absolute inset-8 bg-slate-900 rounded-lg p-8 font-mono text-sm leading-relaxed text-slate-300 overflow-hidden border border-slate-800"
              initial={{ opacity: 0, y: 20 }}
              animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-2xl text-white font-sans font-bold mb-6 pb-4 border-b border-slate-800">MASTER SERVICES AGREEMENT</h1>
              <p className="mb-4">This Master Services Agreement is entered into as of the Effective Date.</p>
              
              <h2 className="text-lg text-white font-sans font-bold mt-8 mb-4">7. LIMITATION OF LIABILITY</h2>
              
              {/* Highlighted Risk Clause */}
              <div className="relative">
                <motion.div
                  className="absolute -inset-2 bg-red-500/10 border border-red-500/30 rounded-lg -z-10"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={phase >= 5 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                />
                <motion.div
                  className="absolute right-0 top-0 -translate-y-1/2 translate-x-4 bg-red-500 text-white text-xs font-sans font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={phase >= 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  HIGH RISK
                </motion.div>
                <p className={phase >= 5 ? "text-red-200" : ""}>
                  IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES. 
                  <motion.span 
                    className="inline-block"
                    animate={phase >= 5 ? { backgroundColor: 'rgba(239, 68, 68, 0.2)' } : {}}
                  >
                    HOWEVER, PROVIDER'S TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING UNDER THIS AGREEMENT SHALL BE UNLIMITED.
                  </motion.span>
                </p>
              </div>

              <h2 className="text-lg text-white font-sans font-bold mt-8 mb-4">8. TERMINATION</h2>
              <div className="relative">
                <motion.div
                  className="absolute -inset-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg -z-10"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={phase >= 5 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
                <motion.div
                  className="absolute right-0 top-0 -translate-y-1/2 translate-x-4 bg-yellow-500 text-white text-xs font-sans font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={phase >= 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  MEDIUM RISK
                </motion.div>
                <p className={phase >= 5 ? "text-yellow-200" : ""}>
                  Either party may terminate this Agreement upon 30 days written notice. 
                  <motion.span 
                    className="inline-block"
                    animate={phase >= 5 ? { backgroundColor: 'rgba(234, 179, 8, 0.2)' } : {}}
                  >
                    Provider may terminate immediately without cause.
                  </motion.span>
                </p>
              </div>

            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
