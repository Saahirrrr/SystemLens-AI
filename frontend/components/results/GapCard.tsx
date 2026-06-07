import React from 'react';
import { motion } from 'framer-motion';
import { IntegrationGap } from '@/types';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { formatConfidence } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function GapCard({ gap }: { gap: IntegrationGap }) {
  const effortColors: Record<string, string> = {
    low: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
    medium: "text-amber-400 border-amber-400/30 bg-amber-400/10",
    high: "text-rose-400 border-rose-400/30 bg-rose-400/10",
  };
  const eColor = effortColors[gap.effort_estimate?.toLowerCase()] || effortColors.medium;

  return (
    <motion.div 
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
      className="p-5 glass rounded-xl border border-white/10 relative group hover:border-white/20 transition-all"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50 rounded-l-xl" />
      
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-foreground">{gap.source_system}</span>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground">{gap.destination_system}</span>
        </div>
        <Badge variant="outline" className={eColor}>
          <span className="capitalize">{gap.effort_estimate}</span> Effort
        </Badge>
      </div>

      <div className="mb-4">
        <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Missing Entity</div>
        <div className="font-medium text-amber-100">{gap.missing_data_entity}</div>
      </div>

      <div className="bg-white/5 p-3 rounded-md border border-white/5 text-sm text-muted-foreground flex items-start space-x-2">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="leading-snug">{gap.gap_reason}</p>
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Confidence: <span className="font-medium text-foreground">{formatConfidence(gap.analysis_confidence)}%</span>
        </div>
      </div>
    </motion.div>
  );
}
