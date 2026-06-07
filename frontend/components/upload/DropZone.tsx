import React, { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileType } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ onFileSelect, disabled = false }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateAndSelect = useCallback((file: File) => {
    const validExtensions = ['pdf', 'txt', 'md', 'csv', 'png', 'jpg', 'jpeg'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension && validExtensions.includes(extension)) {
      onFileSelect(file);
    } else {
      alert(`Unsupported file type. Supported types: ${validExtensions.join(', ')}`);
    }
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSelect(file);
    }
  }, [disabled, validateAndSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
  }, [validateAndSelect]);



  return (
    <motion.div
      whileHover={disabled ? {} : { scale: 1.01 }}
      whileTap={disabled ? {} : { scale: 0.99 }}
      className={cn(
        "relative rounded-xl border-2 border-dashed p-12 transition-all duration-300 glass flex flex-col items-center justify-center cursor-pointer text-center group",
        isDragging ? "border-primary bg-primary/10" : "border-white/10 hover:border-white/20 hover:bg-white/5",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        className="hidden"
        accept=".pdf,.txt,.md,.csv,.png,.jpg,.jpeg"
        disabled={disabled}
      />
      
      <div className="mb-6 p-4 rounded-full bg-white/5 border border-white/10 group-hover:bg-primary/20 group-hover:border-primary/30 transition-colors">
        <UploadCloud className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">Drag & drop your system document</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Upload architecture diagrams, code documentation, or system exports.
      </p>
      
      <div className="flex gap-2 text-xs text-muted-foreground">
        <span className="flex items-center bg-white/5 rounded px-2 py-1"><FileType className="w-3 h-3 mr-1"/> PDF</span>
        <span className="flex items-center bg-white/5 rounded px-2 py-1"><FileType className="w-3 h-3 mr-1"/> TXT, MD</span>
        <span className="flex items-center bg-white/5 rounded px-2 py-1"><FileType className="w-3 h-3 mr-1"/> CSV, PNG, JPG</span>
      </div>
    </motion.div>
  );
}
