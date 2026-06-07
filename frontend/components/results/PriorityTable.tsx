import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PriorityItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown } from 'lucide-react';
import { formatConfidence } from '@/lib/utils';

export function PriorityTable({ priorities }: { priorities: PriorityItem[] }) {
  const [sortField, setSortField] = useState<keyof PriorityItem>('rank');
  const [sortDesc, setSortDesc] = useState(false);

  if (!priorities || priorities.length === 0) return null;

  const handleSort = (field: keyof PriorityItem) => {
    if (sortField === field) setSortDesc(!sortDesc);
    else {
      setSortField(field);
      setSortDesc(false);
    }
  };

  const sorted = [...priorities].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (aVal < bVal) return sortDesc ? 1 : -1;
    if (aVal > bVal) return sortDesc ? -1 : 1;
    return 0;
  });

  const getTierColor = (tier: string) => {
    const t = tier.toLowerCase();
    if (t.startsWith('p1')) return 'text-rose-400 border-rose-400/30 bg-rose-400/10';
    if (t.startsWith('p2')) return 'text-orange-400 border-orange-400/30 bg-orange-400/10';
    if (t.startsWith('p3')) return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
    return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
  };



  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-white/10 overflow-hidden mb-8"
    >
      <div className="p-4 border-b border-white/10 bg-white/5">
        <h2 className="text-lg font-semibold">Priority Report</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#0c0c0e]/95 text-muted-foreground text-xs uppercase tracking-wider border-b border-white/10">
            <tr>
              <th className="px-6 py-4 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('rank')}>Rank <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-50" /></th>
              <th className="px-6 py-4 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('priority_tier')}>Tier <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-50" /></th>
              <th className="px-6 py-4 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('source_system')}>Source <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-50" /></th>
              <th className="px-6 py-4 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('destination_system')}>Destination <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-50" /></th>
              <th className="px-6 py-4 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('priority_score')}>Score <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-50" /></th>
              <th className="px-6 py-4 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('analysis_confidence')}>Confidence <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-50" /></th>
              <th className="px-6 py-4 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('effort_estimate')}>Effort <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-50" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sorted.map((p, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium">#{p.rank}</td>
                <td className="px-6 py-4"><Badge variant="outline" className={getTierColor(p.priority_tier)}>{p.priority_tier}</Badge></td>
                <td className="px-6 py-4">{p.source_system}</td>
                <td className="px-6 py-4 text-muted-foreground">{p.destination_system}</td>
                <td className="px-6 py-4 font-medium text-primary">{p.priority_score}</td>
                <td className="px-6 py-4 text-muted-foreground">{formatConfidence(p.analysis_confidence)}%</td>
                <td className="px-6 py-4 text-muted-foreground capitalize">{p.effort_estimate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
