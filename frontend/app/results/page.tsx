"use client";

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/ui/navbar';
import { AnalysisResultData, DataFlow, IntegrationGap, PriorityItem, AnalysisConfidenceData } from '@/types';
import { ANALYSIS_STORAGE_KEY } from '@/lib/constants';
import { formatConfidence } from '@/lib/utils';
import { ResultsHeader } from '@/components/results/ResultsHeader';

interface BackendAnalysisReport {
  use_case_name: string;
  generated_at: string;
  gap_count: number;
  use_case_mappings: unknown[];
  data_flows?: DataFlow[];
  integration_gaps?: IntegrationGap[];
  priority_report?: PriorityItem[];
}
import { ExecutiveSummary } from '@/components/results/ExecutiveSummary';
import { SystemFlowGraph } from '@/components/results/SystemFlowGraph';
import { DataFlowTable } from '@/components/results/DataFlowTable';
import { GapGrid } from '@/components/results/GapGrid';
import { PriorityTable } from '@/components/results/PriorityTable';
import { ConfidenceChart } from '@/components/results/ConfidenceChart';
import { PriorityDistributionChart } from '@/components/results/PriorityDistributionChart';
import { EmptyResults } from '@/components/results/EmptyResults';
import { ExportBar } from '@/components/results/ExportBar';
import { Loader2 } from 'lucide-react';

export default function ResultsPage() {
  const [data, setData] = useState<AnalysisResultData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(ANALYSIS_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) {
          let totalGaps = 0;
          let highestTier = "N/A";
          const dataFlows: DataFlow[] = [];
          const gaps: IntegrationGap[] = [];
          const priorities: PriorityItem[] = [];

          parsed.forEach((report: BackendAnalysisReport) => {
            totalGaps += report.gap_count || 0;
            if (report.data_flows) dataFlows.push(...report.data_flows);
            if (report.integration_gaps) gaps.push(...report.integration_gaps);
            if (report.priority_report) priorities.push(...report.priority_report);

            report.priority_report?.forEach((p: PriorityItem) => {
              if (highestTier === "N/A" || p.priority_tier < highestTier) {
                highestTier = p.priority_tier;
              }
            });
          });

          const totalSystems = new Set<string>();
          dataFlows.forEach(f => {
             totalSystems.add(f.source_system);
             totalSystems.add(f.destination_system);
          });

          let totalConfidence = 0;
          let countConfidence = 0;
          const confChartData: AnalysisConfidenceData[] = [];
          priorities.forEach((p, i) => {
             const conf = formatConfidence(p.analysis_confidence);
             if (conf > 0) {
                totalConfidence += conf;
                countConfidence++;
                confChartData.push({ name: `G${i+1}`, value: conf });
             }
          });

          const aggregatedData: AnalysisResultData = {
            metadata: {
               use_cases_analysed: parsed.length,
               total_gaps_found: totalGaps,
               highest_priority_tier: highestTier,
               generated_timestamp: parsed[0]?.generated_at || new Date().toISOString()
            },
            total_systems: totalSystems.size,
            total_data_flows: dataFlows.length,
            total_integration_gaps: gaps.length,
            average_confidence: countConfidence > 0 ? Math.round(totalConfidence / countConfidence) : 0,
            data_flows: dataFlows,
            integration_gaps: gaps,
            priority_report: priorities,
            analysis_confidence: confChartData
          };

          // eslint-disable-next-line
          setData(aggregatedData as unknown as AnalysisResultData);
        } else {
          setData(parsed as AnalysisResultData);
        }
      } catch (e) {
        console.error("Failed to parse results", e);
      }
    }
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 flex items-center justify-center">
          <EmptyResults />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 relative z-10 max-w-7xl">
        <ResultsHeader data={data} />
        <ExecutiveSummary data={data} />
        
        <SystemFlowGraph flows={data.data_flows || []} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <PriorityDistributionChart priorities={data.priority_report || []} />
          <ConfidenceChart data={data.analysis_confidence || []} />
        </div>
        
        <GapGrid gaps={data.integration_gaps || []} />
        <PriorityTable priorities={data.priority_report || []} />
        <DataFlowTable flows={data.data_flows || []} />
        
        <ExportBar data={data} />
      </main>
    </div>
  );
}
