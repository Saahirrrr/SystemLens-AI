import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AnalysisResultData } from "@/types";

interface ExecutiveSummaryProps {
  data: AnalysisResultData;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 }
};

function AnimatedCount({ value, format }: { value: number, format?: (v: number) => string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    const duration = 1500;
    const startValue = 0;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(easeOutQuart * (value - startValue) + startValue);
      
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };
    
    requestAnimationFrame(step);
  }, [value]);

  return <span>{format ? format(displayValue) : displayValue}</span>;
}

export function ExecutiveSummary({ data }: ExecutiveSummaryProps) {
  const totalSystems = data.total_systems || 0;
  const totalDataFlows = data.total_data_flows || data.data_flows?.length || 0;
  const totalIntegrationGaps = data.total_integration_gaps || data.integration_gaps?.length || 0;
  const averageConfidence = data.average_confidence || 85;

  const kpis = [
    { label: "Total Systems", value: totalSystems },
    { label: "Total Data Flows", value: totalDataFlows },
    { label: "Integration Gaps", value: totalIntegrationGaps },
    { label: "Avg Confidence", value: averageConfidence, format: (v: number) => `${v}%` }
  ];

  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
    >
      {kpis.map((kpi, i) => (
        <motion.div 
          key={i} 
          variants={item}
          className="glass p-6 rounded-xl border border-white/10 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <h3 className="text-sm font-medium text-muted-foreground mb-2 relative z-10">{kpi.label}</h3>
          <div className="text-3xl font-bold text-foreground relative z-10">
            <AnimatedCount value={kpi.value} format={kpi.format} />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
