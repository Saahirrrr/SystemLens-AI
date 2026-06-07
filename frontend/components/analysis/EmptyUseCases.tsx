import React from "react";
import { motion } from "framer-motion";
import { PlusCircle } from "lucide-react";

export function EmptyUseCases({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-white/10 rounded-xl glass text-center cursor-pointer hover:border-white/20 hover:bg-white/5 transition-colors group"
      onClick={onAdd}
    >
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
        <PlusCircle className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-xl font-medium mb-2">Create your first automation workflow</h3>
      <p className="text-muted-foreground max-w-sm">
        Define triggers, outcomes, and select the involved systems to build a comprehensive automation use case.
      </p>
    </motion.div>
  );
}
