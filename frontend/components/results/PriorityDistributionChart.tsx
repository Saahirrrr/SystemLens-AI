import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PriorityItem } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function PriorityDistributionChart({ priorities }: { priorities: PriorityItem[] }) {
  const data = useMemo(() => {
    const counts = { P1: 0, P2: 0, P3: 0, P4: 0 };
    (priorities || []).forEach(p => {
      const t = p.priority_tier.toLowerCase();
      if (t.startsWith('p1')) counts.P1++;
      else if (t.startsWith('p2')) counts.P2++;
      else if (t.startsWith('p3')) counts.P3++;
      else counts.P4++;
    });
    return [
      { name: 'P1', value: counts.P1, color: '#fb7185' },
      { name: 'P2', value: counts.P2, color: '#fb923c' },
      { name: 'P3', value: counts.P3, color: '#fbbf24' },
      { name: 'P4', value: counts.P4, color: '#34d399' },
    ];
  }, [priorities]);

  if (!priorities || priorities.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="glass p-6 rounded-2xl border border-white/10"
    >
      <h3 className="text-lg font-semibold mb-6">Priority Distribution</h3>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(20, 20, 25, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
