import React from "react"; // Trigger IDE cache reset
import { motion } from "framer-motion";
import { SystemRecord } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Key, GitCommit, GitBranch } from "lucide-react";

interface SystemCardProps {
  system: SystemRecord;
  onClick: (system: SystemRecord) => void;
}

export function SystemCard({ system, onClick }: SystemCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={() => onClick(system)}
      className="cursor-pointer group h-full"
    >
      <Card className="h-full glass border-white/10 transition-all duration-300 group-hover:border-white/30 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] overflow-hidden relative">
        {system.flagged_for_review && (
          <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 bg-amber-500/20 text-amber-500 text-[10px] font-bold px-8 py-1 rotate-45 translate-x-[30%] translate-y-[20%] uppercase border-b border-amber-500/30 w-full text-center">
              Flagged
            </div>
          </div>
        )}
        <CardContent className="p-6 flex flex-col h-full space-y-4">
          <div className="flex flex-col space-y-2 mb-2 pr-4">
            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1" title={system.name}>
              {system.name}
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">{system.category}</Badge>
              <Badge variant={system.criticality.toLowerCase() === "high" || system.criticality.toLowerCase() === "critical" ? "warning" : "outline"} className={system.criticality.toLowerCase() === "high" || system.criticality.toLowerCase() === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20" : ""}>
                {system.criticality}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground flex-1">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>{system.confidence_score}% Conf</span>
            </div>
            <div className="flex items-center space-x-2 truncate" title={system.authentication_method}>
              <Key className="w-4 h-4 text-purple-400" />
              <span className="truncate">{system.authentication_method}</span>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/5">
            <div>
              <div className="flex items-center space-x-2 text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                <GitCommit className="w-3 h-3" />
                <span>Key Entities</span>
              </div>
              <div className="text-sm line-clamp-1" title={system.key_entities.join(", ")}>
                {system.key_entities.length > 0 ? system.key_entities.join(", ") : "None identified"}
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2 text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                <GitBranch className="w-3 h-3" />
                <span>Business Processes</span>
              </div>
              <div className="text-sm line-clamp-1" title={system.business_processes.join(", ")}>
                {system.business_processes.length > 0 ? system.business_processes.join(", ") : "None identified"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
