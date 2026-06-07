import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

const loadingSteps = [
  "Mapping systems...",
  "Discovering workflows...",
  "Detecting integration gaps...",
  "Prioritizing opportunities..."
];

export function AnalysisLoading() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md">
      <div className="flex flex-col items-center max-w-sm w-full p-8 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-8" />
        
        <div className="h-8 relative w-full flex justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-lg font-medium text-foreground absolute"
            >
              {loadingSteps[currentStep]}
            </motion.p>
          </AnimatePresence>
        </div>
        
        <div className="w-full h-1 bg-white/10 rounded-full mt-8 overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-400"
            initial={{ width: "0%" }}
            animate={{ width: `${((currentStep + 1) / loadingSteps.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
}
