"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Code, CheckCircle2, Download, Loader2, AlertCircle, Eye, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ArtifactData {
  files: Record<string, string>;
  zip_base64: string;
}

interface GenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: "idle" | "generating" | "complete" | "error";
  data: ArtifactData | null;
  error: string | null;
}

export function GenerationModal({ isOpen, onClose, status, data, error }: GenerationModalProps) {
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleClose = () => {
    setPreviewMode(false);
    setSelectedFile(null);
    onClose();
  };

  if (!isOpen) return null;

  const fileNames = data ? Object.keys(data.files) : [];
  const currentFile = selectedFile || (fileNames.length > 0 ? fileNames[0] : null);

  const handleDownload = () => {
    if (!data?.zip_base64) return;
    
    // Decode base64 to binary
    const binaryString = window.atob(data.zip_base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create blob and trigger download
    const blob = new Blob([bytes], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `integration_bundle_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`bg-[#0d1222] border border-white/10 shadow-2xl rounded-xl overflow-hidden flex flex-col ${
            previewMode ? "w-full max-w-5xl h-[80vh]" : "w-full max-w-md"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Code className="w-5 h-5 text-emerald-400" />
              Artifact Generation
            </h2>
            <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col relative">
            {status === "generating" && (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
                <h3 className="text-lg font-medium mb-2">Generating Artifacts...</h3>
                <p className="text-sm text-muted-foreground">Synthesizing connector logic, workflows, and tests.</p>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
                <h3 className="text-lg font-medium mb-2 text-rose-400">Generation Failed</h3>
                <p className="text-sm text-muted-foreground">{error || "An unknown error occurred."}</p>
              </div>
            )}

            {status === "complete" && data && !previewMode && (
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-center mb-6">Generation Complete</h3>
                
                <div className="bg-white/5 rounded-lg border border-white/10 p-4 mb-6">
                  <div className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Files Generated</div>
                  <ul className="space-y-2">
                    {fileNames.map(name => (
                      <li key={name} className="flex items-center text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2 shrink-0" />
                        <span className="text-foreground/90 font-mono text-xs">{name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-auto grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={() => setPreviewMode(true)} className="border-white/20 hover:bg-white/10">
                    <Eye className="w-4 h-4 mr-2" /> Preview Files
                  </Button>
                  <Button onClick={handleDownload} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Download className="w-4 h-4 mr-2" /> Download Bundle
                  </Button>
                </div>
              </div>
            )}

            {status === "complete" && data && previewMode && (
              <div className="flex h-full overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 border-r border-white/10 bg-black/20 flex flex-col overflow-y-auto">
                  <div className="p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Bundle Contents</div>
                  <div className="flex flex-col gap-1 p-2">
                    {fileNames.map(name => (
                      <button
                        key={name}
                        onClick={() => setSelectedFile(name)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-mono text-left transition-colors ${
                          currentFile === name 
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                        }`}
                      >
                        <FileIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Code Viewer */}
                <div className="flex-1 bg-black/40 overflow-hidden flex flex-col">
                  <div className="p-3 border-b border-white/5 bg-black/20 flex items-center justify-between">
                    <span className="text-sm font-mono text-foreground/80">{currentFile}</span>
                  </div>
                  <div className="flex-1 overflow-auto p-4">
                    <pre className="text-xs font-mono text-emerald-100/90 leading-relaxed whitespace-pre-wrap">
                      {currentFile ? data.files[currentFile] : ""}
                    </pre>
                  </div>
                  
                  {/* Bottom Bar for preview mode */}
                  <div className="p-4 border-t border-white/10 bg-background/50 flex justify-end gap-3">
                     <Button variant="outline" onClick={() => setPreviewMode(false)} className="border-white/20 hover:bg-white/10">
                      Back to Summary
                    </Button>
                    <Button onClick={handleDownload} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Download className="w-4 h-4 mr-2" /> Download Bundle
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
