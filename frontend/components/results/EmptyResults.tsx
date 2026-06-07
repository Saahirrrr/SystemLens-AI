import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FileSearch } from 'lucide-react';

export function EmptyResults() {
  const router = useRouter();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center p-16 glass rounded-2xl border border-white/10 max-w-md w-full mx-auto mt-20"
    >
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <FileSearch className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-4">No analysis results found</h2>
      <p className="text-muted-foreground mb-8">
        You need to run an analysis first to view the dashboard.
      </p>
      <Button onClick={() => router.push("/analysis")} className="w-full bg-white text-black hover:bg-white/90">
        Go To Analysis
      </Button>
    </motion.div>
  );
}
