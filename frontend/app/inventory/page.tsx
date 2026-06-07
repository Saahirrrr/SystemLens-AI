"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { SystemRecord } from "@/types";
import { InventoryHeader } from "@/components/inventory/InventoryHeader";
import { MetricsBar } from "@/components/inventory/MetricsBar";
import { SystemGrid } from "@/components/inventory/SystemGrid";
import { EvidenceDrawer } from "@/components/inventory/EvidenceDrawer";
import { SearchBar } from "@/components/inventory/SearchBar";
import { FilterPanel, FilterOption } from "@/components/inventory/FilterPanel";
import { FlaggedSystemsPanel } from "@/components/inventory/FlaggedSystemsPanel";

export default function InventoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [systems, setSystems] = useState<SystemRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFilter, setCurrentFilter] = useState<FilterOption>("All");
  const [selectedSystem, setSelectedSystem] = useState<SystemRecord | null>(null);
  const [noSession, setNoSession] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      const sessionId = localStorage.getItem("discovery_session_id");
      if (!sessionId) {
        setNoSession(true);
        setLoading(false);
        return;
      }

      const response = await apiClient.getInventory(sessionId);
      if (response.data && response.data.systems) {
        setSystems(response.data.systems);
      } else {
        setSystems([]);
      }
      setLoading(false);
    };

    fetchInventory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (noSession) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-10 glass rounded-xl border border-white/10 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold mb-4">No active discovery session found</h2>
            <p className="text-muted-foreground mb-8">Upload a document to begin the extraction process and view the inventory.</p>
            <Button onClick={() => router.push("/upload")} className="w-full bg-white text-black hover:bg-white/90">
              Go to Upload
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  // Filtering Logic
  const filteredSystems = systems.filter((system) => {
    const matchesSearch = 
      system.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      system.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (currentFilter) {
      case "All": return true;
      case "Critical": return system.criticality.toLowerCase() === "critical";
      case "High": return system.criticality.toLowerCase() === "high";
      case "Medium": return system.criticality.toLowerCase() === "medium";
      case "Low": return system.criticality.toLowerCase() === "low";
      case "Flagged": return system.flagged_for_review;
      default: return true;
    }
  });

  const flaggedSystems = systems.filter(s => s.flagged_for_review);

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
        <InventoryHeader />
        
        <MetricsBar systems={systems} />

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8 pb-6 border-b border-white/5">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <FilterPanel currentFilter={currentFilter} onFilterChange={setCurrentFilter} />
        </div>

        {(currentFilter === "All" || currentFilter === "Flagged") && (
          <FlaggedSystemsPanel 
            systems={flaggedSystems.filter(s => 
              s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
              s.category.toLowerCase().includes(searchQuery.toLowerCase())
            )} 
            onSystemClick={setSelectedSystem} 
          />
        )}

        {currentFilter !== "Flagged" && (
          <div className="mb-4 text-sm text-muted-foreground">
            Regular Systems
          </div>
        )}
        
        <SystemGrid 
          systems={filteredSystems.filter(s => currentFilter === "Flagged" ? true : !s.flagged_for_review)} 
          onSystemClick={setSelectedSystem} 
        />
      </main>

      <EvidenceDrawer 
        system={selectedSystem} 
        onClose={() => setSelectedSystem(null)} 
      />
    </div>
  );
}
