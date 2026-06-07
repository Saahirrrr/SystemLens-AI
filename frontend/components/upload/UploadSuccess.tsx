import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Database, Key } from 'lucide-react';

interface UploadSuccessProps {
  sessionId: string;
  systemsCount: number;
}

export function UploadSuccess({ sessionId, systemsCount }: UploadSuccessProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-8 text-center space-y-6"
    >
      <div className="relative">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center"
        >
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </motion.div>
        {/* Ripple effect */}
        <motion.div
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute inset-0 bg-emerald-500/20 rounded-full z-[-1]"
        />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
          Analysis Complete
        </h3>
        <p className="text-muted-foreground">
          Document processed successfully. Preparing your inventory dashboard...
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-4">
        <div className="glass p-4 rounded-lg flex flex-col items-center justify-center space-y-2 border border-white/10">
          <Database className="w-5 h-5 text-blue-400" />
          <span className="text-2xl font-bold">{systemsCount}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Systems</span>
        </div>
        
        <div className="glass p-4 rounded-lg flex flex-col items-center justify-center space-y-2 border border-white/10 overflow-hidden">
          <Key className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-mono truncate w-full text-center px-2" title={sessionId}>{sessionId.substring(0, 8)}...</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Session ID</span>
        </div>
      </div>
    </motion.div>
  );
}
