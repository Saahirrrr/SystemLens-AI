"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { SystemRecord, UseCase } from "@/types";
import { useAnalysis } from "@/hooks/useAnalysis";
import { SESSION_STORAGE_KEY } from "@/lib/constants";
import { AnalysisHeader } from "@/components/analysis/AnalysisHeader";
import { UseCaseList } from "@/components/analysis/UseCaseList";
import { UseCaseForm } from "@/components/analysis/UseCaseForm";
import { AnalysisSubmitBar } from "@/components/analysis/AnalysisSubmitBar";
import { AnalysisLoading } from "@/components/analysis/AnalysisLoading";

export default function AnalysisPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [systems, setSystems] = useState<SystemRecord[]>([]);
  const [loadingSystems, setLoadingSystems] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingUseCase, setEditingUseCase] = useState<UseCase | null>(null);

  const {
    useCases,
    isSubmitting,
    isLoaded,
    addUseCase,
    updateUseCase,
    deleteUseCase,
    submitAnalysis
  } = useAnalysis();

  useEffect(() => {
    const fetchInventory = async () => {
      const id = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!id) {
        setSessionId(null);
        setLoadingSystems(false);
        return;
      }
      setSessionId(id);
      
      if (id === "demo-session-001") {
        const demoInv = localStorage.getItem("demo_inventory");
        if (demoInv) {
          const parsed = JSON.parse(demoInv);
          setSystems(parsed.systems || []);
        }
        setLoadingSystems(false);
        return;
      }

      try {
        const res = await apiClient.getInventory(id);
        if (res.data?.systems) {
          setSystems(res.data.systems);
        }
      } catch (err) {
        console.error(err);
      }
      setLoadingSystems(false);
    };
    fetchInventory();
  }, []);

  if (!isLoaded || loadingSystems) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-10 glass rounded-xl border border-white/10 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold mb-4">No active inventory found</h2>
            <p className="text-muted-foreground mb-8">Upload documents first to extract your enterprise systems.</p>
            <Button onClick={() => router.push("/upload")} className="w-full bg-white text-black hover:bg-white/90">
              Go To Upload
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  const handleAddNew = () => {
    setEditingUseCase(null);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEdit = (uc: UseCase) => {
    setEditingUseCase(uc);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFormSubmit = (data: UseCase) => {
    if (editingUseCase?.id) {
      updateUseCase(data);
    } else {
      addUseCase(data);
    }
    setIsEditing(false);
    setEditingUseCase(null);
  };

  const handleStartAnalysis = async () => {
    if (!sessionId) return;
    
    if (sessionId === "demo-session-001") {
      router.push("/results");
      return;
    }

    await submitAnalysis(sessionId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden pb-24">
      {isSubmitting && <AnalysisLoading />}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 relative z-10 max-w-4xl">
        <AnalysisHeader />

        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <UseCaseForm 
                initialData={editingUseCase} 
                systems={systems} 
                onSubmit={handleFormSubmit} 
                onCancel={() => setIsEditing(false)} 
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <UseCaseList 
                useCases={useCases} 
                onEdit={handleEdit} 
                onDelete={deleteUseCase} 
                onAdd={handleAddNew}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {!isEditing && (
        <AnalysisSubmitBar 
          useCaseCount={useCases.length} 
          onAdd={handleAddNew} 
          onSubmit={handleStartAnalysis} 
          disabled={isSubmitting} 
        />
      )}
    </div>
  );
}
