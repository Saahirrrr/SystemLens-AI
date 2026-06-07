import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SystemRecord } from "@/types";
import { X, FileText, AlertTriangle, Shield, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EvidenceDrawerProps {
  system: SystemRecord | null;
  onClose: () => void;
}

export function EvidenceDrawer({ system, onClose }: EvidenceDrawerProps) {
  return (
    <AnimatePresence>
      {system && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-card border-l border-white/10 shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold truncate pr-4">{system.name}</h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full shrink-0 hover:bg-white/10">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Status Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex flex-col space-y-1">
                    <span className="text-xs text-muted-foreground flex items-center"><Shield className="w-3 h-3 mr-1" /> Confidence</span>
                    <span className="text-lg font-semibold text-emerald-400">{system.confidence_score}%</span>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex flex-col space-y-1">
                    <span className="text-xs text-muted-foreground">Flagged for Review</span>
                    <span className="text-lg font-semibold flex items-center">
                      {system.flagged_for_review ? (
                        <span className="text-amber-400 flex items-center"><AlertTriangle className="w-4 h-4 mr-1" /> Yes</span>
                      ) : (
                        <span className="text-muted-foreground flex items-center"><CheckCircle2 className="w-4 h-4 mr-1" /> No</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Extraction Evidence */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Extraction Evidence</h3>
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-sm text-foreground/90 leading-relaxed italic border-l-2 border-primary pl-4 py-1">
                    {system.evidence}
                  </p>
                </div>
              </div>

              {/* Source Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Source Context</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Document</div>
                      <div className="text-sm text-muted-foreground">{system.source_document}</div>
                    </div>
                  </div>
                  {system.source_location.page_number && (
                    <div className="flex items-start space-x-3">
                      <div className="w-4 h-4 flex items-center justify-center text-xs font-bold text-muted-foreground mt-0.5 border border-muted-foreground rounded-sm">P</div>
                      <div>
                        <div className="text-sm font-medium">Page Number</div>
                        <div className="text-sm text-muted-foreground">{system.source_location.page_number}</div>
                      </div>
                    </div>
                  )}
                  {system.source_location.section_hint && (
                    <div className="flex items-start space-x-3">
                      <div className="w-4 h-4 text-muted-foreground mt-0.5 font-serif text-center font-bold">§</div>
                      <div>
                        <div className="text-sm font-medium">Section Hint</div>
                        <div className="text-sm text-muted-foreground">{system.source_location.section_hint}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Meta Tags */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">System Metadata</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-white/10">Category: {system.category}</Badge>
                  <Badge variant="outline" className="border-white/10">Auth: {system.authentication_method}</Badge>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-background/50 backdrop-blur-md">
              <Button className="w-full bg-white text-black hover:bg-white/90">View Full Context</Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
