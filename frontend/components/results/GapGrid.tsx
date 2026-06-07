import React from 'react';
import { motion } from 'framer-motion';
import { IntegrationGap } from '@/types';
import { GapCard } from './GapCard';

export function GapGrid({ gaps }: { gaps: IntegrationGap[] }) {
  if (!gaps || gaps.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">Integration Gaps</h2>
      <motion.div 
        initial="hidden" animate="show"
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {gaps.map((gap, i) => <GapCard key={i} gap={gap} />)}
      </motion.div>
    </div>
  );
}
