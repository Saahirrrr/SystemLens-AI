import React, { useMemo } from 'react';
import { ReactFlow, Controls, Background, useNodesState, useEdgesState, BackgroundVariant, MarkerType, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { DataFlow } from '@/types';
import { motion } from 'framer-motion';

/**
 * Deterministic column-based layout for the system flow graph.
 *
 * Column assignment:
 *   - Column 0 (left):   systems that only appear as sources
 *   - Column 1 (center): systems that appear as both source and destination
 *   - Column 2 (right):  systems that only appear as destinations
 */
function buildColumnLayout(flows: DataFlow[]) {
  const sourceSet = new Set<string>();
  const destSet = new Set<string>();

  flows.forEach(f => {
    sourceSet.add(f.source_system);
    destSet.add(f.destination_system);
  });

  const allSystems = new Set([...sourceSet, ...destSet]);

  const columns: string[][] = [[], [], []];
  allSystems.forEach(sys => {
    const isSource = sourceSet.has(sys);
    const isDest = destSet.has(sys);
    if (isSource && isDest) columns[1].push(sys);
    else if (isSource) columns[0].push(sys);
    else columns[2].push(sys);
  });

  // Sort each column alphabetically for consistency
  columns.forEach(col => col.sort());

  return columns;
}

export function SystemFlowGraph({ flows }: { flows: DataFlow[] }) {
  const initialNodes = useMemo(() => {
    if (!flows || flows.length === 0) return [];

    const columns = buildColumnLayout(flows);
    const colX = [80, 380, 680];
    const nodes: Node[] = [];

    columns.forEach((col, colIdx) => {
      const totalHeight = col.length * 80;
      const startY = Math.max(40, (400 - totalHeight) / 2);

      col.forEach((sys, rowIdx) => {
        nodes.push({
          id: sys,
          position: { x: colX[colIdx], y: startY + rowIdx * 80 },
          data: { label: sys },
          style: {
            background: 'rgba(20, 20, 25, 0.8)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(8px)',
            minWidth: '140px',
            textAlign: 'center' as const,
          },
        });
      });
    });

    return nodes;
  }, [flows]);

  const initialEdges = useMemo(() => {
    if (!flows || flows.length === 0) return [];
    return flows.map((f, i) => ({
      id: `e-${i}`,
      source: f.source_system,
      target: f.destination_system,
      label: f.data_entity,
      animated: true,
      style: { stroke: 'rgba(52, 211, 153, 0.5)', strokeWidth: 2 },
      labelStyle: { fill: '#a1a1aa', fontWeight: 500, fontSize: 11 },
      labelBgStyle: { fill: '#18181b', fillOpacity: 0.8 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'rgba(52, 211, 153, 0.5)',
      },
    }));
  }, [flows]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  if (!flows || flows.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-[500px] w-full rounded-2xl border border-white/10 overflow-hidden glass relative mb-8"
    >
      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-black/50 border border-white/10 rounded-md text-sm font-medium backdrop-blur-md">
        System Integration Flow
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="rgba(255,255,255,0.1)" />
        <Controls showInteractive={false} className="bg-black/50 border-white/10 fill-white" />
      </ReactFlow>
    </motion.div>
  );
}
