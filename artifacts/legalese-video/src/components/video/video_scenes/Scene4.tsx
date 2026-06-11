import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { sceneTransitions } from '../../../lib/video/animations';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),   // Show templates
      setTimeout(() => setPhase(2), 3500),  // Shift focus to alerts
      setTimeout(() => setPhase(3), 4500),  // Show email alert popping in
      setTimeout(() => setPhase(4), 9000),  // Exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const templates = [
    { title: "Non-Disclosure (NDA)", desc: "Standard mutual confidentiality" },
    { title: "Master Services (MSA)", desc: "B2B SaaS subscription terms" },
    { title: "Service Level (SLA)", desc: "Uptime and support guarantees" },
    { title: "Employment Agreement", desc: "Standard full-time hire terms" },
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center px-20"
      {...sceneTransitions.wipe}
    >
      {/* Templates Section */}
      <motion.div 
        className="w-1/2 pr-12"
        animate={phase >= 2 ? { opacity: 0.3, scale: 0.95 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-3xl font-display font-bold mb-8">Standardize with Templates</h2>
        <div className="grid grid-cols-2 gap-4">
          {templates.map((t, i) => (
            <motion.div
              key={i}
              className="bg-slate-800/40 border border-slate-700 p-5 rounded-xl hover:border-blue-500/50 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="font-bold text-white mb-1">{t.title}</h3>
              <p className="text-sm text-slate-400">{t.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Alerts Section */}
      <motion.div 
        className="w-1/2 pl-12 relative h-full flex flex-col justify-center"
        initial={{ opacity: 0, x: 50 }}
        animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-3xl font-display font-bold mb-4">Never Miss a Renewal</h2>
        <p className="text-xl text-slate-400 mb-12">Automated email expiry alerts keep you ahead of automatic renewals.</p>

        {/* Email Alert Mockup */}
        <div className="relative">
          <motion.div
            className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-2xl relative z-10 w-full max-w-md mx-auto"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={phase >= 3 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">C</div>
              <div>
                <div className="text-sm font-bold text-white">Contract Clarity Alerts</div>
                <div className="text-xs text-slate-400">alert@contractclarity.app</div>
              </div>
              <div className="ml-auto text-xs text-slate-500">Just now</div>
            </div>
            
            <h3 className="font-bold text-lg mb-2 text-white">Contract Expiring: Acme Corp MSA</h3>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              The Master Services Agreement with Acme Corp is set to auto-renew in 30 days on Oct 1st.
            </p>
            
            <button className="bg-white text-slate-900 px-4 py-2 rounded font-medium text-sm w-full">
              Review Contract
            </button>
          </motion.div>
          
          {/* Decorative glowing background for email */}
          <motion.div
            className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full z-0"
            initial={{ opacity: 0 }}
            animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>
      </motion.div>

    </motion.div>
  );
}
