import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Database, AlertTriangle, ShieldAlert, Activity } from "lucide-react";
import { SystemRecord } from "@/types";

interface MetricsBarProps {
  systems: SystemRecord[];
}

export function MetricsBar({ systems }: MetricsBarProps) {
  const total = systems.length;
  const critical = systems.filter(s => s.criticality.toLowerCase() === "high" || s.criticality.toLowerCase() === "critical").length;
  const flagged = systems.filter(s => s.flagged_for_review).length;
  const avgConfidence = total > 0 ? Math.round(systems.reduce((acc, s) => acc + s.confidence_score, 0) / total) : 0;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
    >
      <motion.div variants={item}>
        <Card className="glass border-white/10 hover:border-white/20 transition-colors">
          <CardContent className="p-6 flex flex-col justify-center space-y-2">
            <div className="flex items-center space-x-2 text-muted-foreground mb-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium uppercase tracking-wider">Systems Found</span>
            </div>
            <motion.div 
              initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}
              className="text-3xl font-bold"
            >
              {total}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="glass border-white/10 hover:border-white/20 transition-colors">
          <CardContent className="p-6 flex flex-col justify-center space-y-2">
            <div className="flex items-center space-x-2 text-muted-foreground mb-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium uppercase tracking-wider">Critical Systems</span>
            </div>
            <motion.div 
              initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}
              className="text-3xl font-bold"
            >
              {critical}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="glass border-white/10 hover:border-white/20 transition-colors">
          <CardContent className="p-6 flex flex-col justify-center space-y-2">
            <div className="flex items-center space-x-2 text-muted-foreground mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium uppercase tracking-wider">Flagged Systems</span>
            </div>
            <motion.div 
              initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}
              className="text-3xl font-bold text-amber-400"
            >
              {flagged}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="glass border-white/10 hover:border-white/20 transition-colors">
          <CardContent className="p-6 flex flex-col justify-center space-y-2">
            <div className="flex items-center space-x-2 text-muted-foreground mb-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium uppercase tracking-wider">Avg Confidence</span>
            </div>
            <motion.div 
              initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}
              className="text-3xl font-bold text-emerald-400"
            >
              {avgConfidence}%
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
