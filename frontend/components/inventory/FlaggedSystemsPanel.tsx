import React from "react";
import { motion } from "framer-motion";
import { SystemRecord } from "@/types";
import { SystemCard } from "./SystemCard";
import { AlertTriangle } from "lucide-react";

interface FlaggedSystemsPanelProps {
  systems: SystemRecord[];
  onSystemClick: (system: SystemRecord) => void;
}

export function FlaggedSystemsPanel({ systems, onSystemClick }: FlaggedSystemsPanelProps) {
  if (systems.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-10 space-y-4"
    >
      <div className="flex items-center space-x-2 text-amber-500 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-md w-fit">
        <AlertTriangle className="w-5 h-5" />
        <span className="font-semibold text-sm uppercase tracking-wider">Requires Human Review</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {systems.map((system) => (
          <SystemCard key={system.id} system={system} onClick={onSystemClick} />
        ))}
      </div>
    </motion.div>
  );
}
