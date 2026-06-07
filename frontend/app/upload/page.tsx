"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/ui/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropZone } from '@/components/upload/DropZone';
import { FilePreview } from '@/components/upload/FilePreview';
import { UploadProgress } from '@/components/upload/UploadProgress';
import { UploadSuccess } from '@/components/upload/UploadSuccess';
import { useUpload } from '@/hooks/useUpload';

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { isUploading, progress, error, successData, uploadFile } = useUpload();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadFile(selectedFile);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12 relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        
        <div className="w-full max-w-2xl mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-8 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Overview
            </Button>
          </Link>

          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
              Upload Document
            </h1>
            <p className="text-muted-foreground text-lg">
              Provide your architecture documentation to begin the intelligent analysis process.
            </p>
          </div>

          <Card className="glass border-white/10 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />
            
            <CardContent className="p-8 relative z-10">
              <AnimatePresence mode="wait">
                {successData ? (
                  <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <UploadSuccess 
                      sessionId={successData.session_id} 
                      systemsCount={successData.systems_extracted} 
                    />
                  </motion.div>
                ) : (
                  <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                    
                    {!selectedFile && !isUploading && (
                      <DropZone onFileSelect={handleFileSelect} disabled={isUploading} />
                    )}

                    {selectedFile && !isUploading && (
                      <div className="space-y-6">
                        <FilePreview file={selectedFile} onClear={handleClearFile} disabled={isUploading} />
                        
                        {error && (
                          <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 flex items-start text-destructive text-red-500">
                            <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                            <p className="text-sm">{error}</p>
                          </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                          <Button variant="outline" onClick={handleClearFile} className="border-white/10">
                            Cancel
                          </Button>
                          <Button onClick={handleUpload} className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400">
                            Analyze Document
                          </Button>
                        </div>
                      </div>
                    )}

                    {isUploading && (
                      <div className="py-8">
                        <UploadProgress progress={progress} />
                      </div>
                    )}
                    
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
