"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download, Copy, FileText, Check } from 'lucide-react';
import { AnalysisResultData } from '@/types';

export function ExportBar({ data }: { data: AnalysisResultData }) {
  const [copied, setCopied] = useState(false);

  const handleExportJson = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discovery_analysis_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = async () => {
    const summary = `Discovery Agent — Automation Opportunity Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

Key Metrics:
• Use Cases Analysed: ${data.metadata?.use_cases_analysed || 0}
• Total Systems: ${data.total_systems || 0}
• Data Flows Identified: ${data.total_data_flows || 0}
• Integration Gaps: ${data.total_integration_gaps || 0}
• Highest Priority Tier: ${data.metadata?.highest_priority_tier || 'N/A'}
• Average Confidence: ${data.average_confidence || 0}%

Priority Items: ${data.priority_report?.length || 0}
${(data.priority_report || []).map(p => `  #${p.rank} [${p.priority_tier}] ${p.source_system} → ${p.destination_system}: ${p.missing_data_entity}`).join('\n')}`;

    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadReport = () => {
    window.print();
  };

  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="flex flex-wrap gap-4 justify-end mt-12 mb-8 no-print"
    >
      <Button variant="outline" onClick={handleExportJson} className="border-white/20 bg-black/50 backdrop-blur-md hover:bg-white/10">
        <Download className="w-4 h-4 mr-2" /> Export JSON
      </Button>

      <div className="relative">
        <Button variant="outline" onClick={handleCopySummary} className="border-white/20 bg-black/50 backdrop-blur-md hover:bg-white/10">
          {copied ? <Check className="w-4 h-4 mr-2 text-emerald-400" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? "Copied!" : "Copy Summary"}
        </Button>
        <AnimatePresence>
          {copied && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-md text-xs text-emerald-400 whitespace-nowrap"
            >
              Summary copied to clipboard
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Button onClick={handleDownloadReport} className="bg-primary hover:bg-primary/90 text-primary-foreground">
        <FileText className="w-4 h-4 mr-2" /> Download Report
      </Button>
    </motion.div>
  );
}
