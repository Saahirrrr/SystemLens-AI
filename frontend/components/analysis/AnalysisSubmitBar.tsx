import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface AnalysisSubmitBarProps {
  useCaseCount: number;
  onAdd: () => void;
  onSubmit: () => void;
  disabled: boolean;
}

export function AnalysisSubmitBar({ useCaseCount, onAdd, onSubmit, disabled }: AnalysisSubmitBarProps) {
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-background/80 backdrop-blur-xl z-40"
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="text-sm text-muted-foreground hidden sm:block">
          <span className="font-semibold text-foreground">{useCaseCount}</span> use case{useCaseCount !== 1 && "s"} defined
        </div>
        
        <div className="flex gap-4 w-full sm:w-auto">
          <Button variant="outline" onClick={onAdd} className="flex-1 sm:flex-none border-white/20">
            Add Another
          </Button>
          <Button 
            onClick={onSubmit} 
            disabled={disabled || useCaseCount === 0}
            className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 border-0"
          >
            <Play className="w-4 h-4 mr-2" />
            Run Analysis
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
