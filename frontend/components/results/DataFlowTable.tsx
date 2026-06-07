import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DataFlow } from '@/types';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatConfidence } from '@/lib/utils';

export function DataFlowTable({ flows }: { flows: DataFlow[] }) {
  const [query, setQuery] = useState("");

  if (!flows || flows.length === 0) return null;

  const filtered = flows.filter(f => 
    (f.source_system).toLowerCase().includes(query.toLowerCase()) ||
    (f.destination_system).toLowerCase().includes(query.toLowerCase()) ||
    f.data_entity.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-white/10 overflow-hidden mb-8"
    >
      <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5">
        <h2 className="text-lg font-semibold">Data Flow Inventory</h2>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search flows..." 
            className="w-full bg-black/30 border border-white/10 rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:border-primary"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-x-auto max-h-[400px]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="sticky top-0 bg-[#0c0c0e]/95 backdrop-blur-md z-10 text-muted-foreground text-xs uppercase tracking-wider border-b border-white/10">
            <tr>
              <th className="px-6 py-4 font-medium">Source</th>
              <th className="px-6 py-4 font-medium">Destination</th>
              <th className="px-6 py-4 font-medium">Data Entity</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium text-right">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length > 0 ? filtered.map((f, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium">{f.source_system}</td>
                <td className="px-6 py-4 text-muted-foreground">{f.destination_system}</td>
                <td className="px-6 py-4"><Badge variant="outline" className="border-white/10">{f.data_entity}</Badge></td>
                <td className="px-6 py-4 text-muted-foreground">{f.integration_type}</td>
                <td className="px-6 py-4 text-right">
                  <span className={`px-2 py-1 rounded text-xs ${formatConfidence(f.analysis_confidence) >= 80 ? 'text-emerald-400 bg-emerald-400/10' : 'text-amber-400 bg-amber-400/10'}`}>
                    {formatConfidence(f.analysis_confidence)}%
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No data flows found matching your search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
