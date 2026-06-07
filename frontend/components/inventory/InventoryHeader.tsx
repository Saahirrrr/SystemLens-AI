import React from "react";
import { motion } from "framer-motion";

export function InventoryHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-2">
        Inventory Dashboard
      </h1>
      <p className="text-muted-foreground">View extracted enterprise systems</p>
    </motion.div>
  );
}
