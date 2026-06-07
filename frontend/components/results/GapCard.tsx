import React from 'react';
import { motion } from 'framer-motion';
import { IntegrationGap } from '@/types';
import { AlertCircle, ArrowRight, Code } from 'lucide-react';
import { formatConfidence } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { GenerationModal, ArtifactData } from './GenerationModal';

export function GapCard({ gap }: { gap: IntegrationGap }) {
  const effortColors: Record<string, string> = {
    low: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
    medium: "text-amber-400 border-amber-400/30 bg-amber-400/10",
    high: "text-rose-400 border-rose-400/30 bg-rose-400/10",
  };
  const eColor = effortColors[gap.effort_estimate?.toLowerCase()] || effortColors.medium;

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [genStatus, setGenStatus] = React.useState<"idle" | "generating" | "complete" | "error">("idle");
  const [artifactData, setArtifactData] = React.useState<ArtifactData | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleGenerate = async () => {
    setIsModalOpen(true);
    setGenStatus("generating");
    setErrorMsg(null);
    
    const response = await apiClient.generateArtifacts({
      source_system: gap.source_system,
      destination_system: gap.destination_system,
      missing_data_entity: gap.missing_data_entity,
      effort_estimate: gap.effort_estimate
    });

    if (response.status === 200 && response.data && 'files' in (response.data as Record<string, unknown>)) {
      setArtifactData(response.data as ArtifactData);
      setGenStatus("complete");
    } else {
      const errDetail = (response.data as unknown as Record<string, string>)?.detail;
      setErrorMsg(errDetail || response.error || "Generation failed.");
      setGenStatus("error");
    }
  };

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
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleGenerate}
          className="h-8 text-xs bg-white/5 border-white/10 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
        >
          <Code className="w-3.5 h-3.5 mr-1.5" />
          Generate Artifacts
        </Button>
      </div>

      <GenerationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        status={genStatus}
        data={artifactData}
        error={errorMsg}
      />
    </motion.div>
  );
}
