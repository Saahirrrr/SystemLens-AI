import React from "react";
import { motion } from "framer-motion";
import { SystemRecord } from "@/types";
import { SystemCard } from "./SystemCard";

interface SystemGridProps {
  systems: SystemRecord[];
  onSystemClick: (system: SystemRecord) => void;
}

export function SystemGrid({ systems, onSystemClick }: SystemGridProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  if (systems.length === 0) {
    return (
      <div className="py-20 text-center border border-dashed border-white/10 rounded-xl glass">
        <h3 className="text-lg font-medium mb-2">No systems extracted</h3>
        <p className="text-muted-foreground text-sm">No systems match the current filters.</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
    >
      {systems.map((system) => (
        <SystemCard key={system.id} system={system} onClick={onSystemClick} />
      ))}
    </motion.div>
  );
}
