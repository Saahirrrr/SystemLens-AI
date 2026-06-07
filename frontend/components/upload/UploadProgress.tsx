import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface UploadProgressProps {
  progress: number;
}

export function UploadProgress({ progress }: UploadProgressProps) {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-muted-foreground font-medium">Analyzing document...</span>
        </div>
        <span className="text-primary font-bold">{Math.round(progress)}%</span>
      </div>
      
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          className="h-full bg-gradient-to-r from-blue-500 to-emerald-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: "easeInOut", duration: 0.5 }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-center animate-pulse">
        Extracting systems, databases, and dependencies
      </p>
    </div>
  );
}
