import React from "react";
import { motion } from "framer-motion";
import { AnalysisResultData } from "@/types";
import { Calendar, Target, AlertTriangle, Layers } from "lucide-react";

interface ResultsHeaderProps {
  data: AnalysisResultData;
}

export function ResultsHeader({ data }: ResultsHeaderProps) {
  const metadata = data.metadata || data;
  const useCases = metadata.use_cases_analysed || 0;
  const totalGaps = metadata.total_gaps_found || data.total_integration_gaps || 0;
  const highestTier = metadata.highest_priority_tier || "N/A";
  const timestamp = metadata.generated_timestamp || new Date().toISOString();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 p-8 glass rounded-2xl border border-white/10 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none -mr-20 -mt-20" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-2">
            Analysis Results
          </h1>
          <p className="text-muted-foreground text-lg">Automation Opportunity Report</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{useCases} Use Cases</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium">{totalGaps} Gaps Found</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium">Tier: {highestTier}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{new Date(timestamp).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
