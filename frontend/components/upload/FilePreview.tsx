import React from 'react';
import { motion } from 'framer-motion';
import { FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilePreviewProps {
  file: File;
  onClear: () => void;
  disabled?: boolean;
}

export function FilePreview({ file, onClear, disabled }: FilePreviewProps) {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5 glass"
    >
      <div className="flex items-center space-x-4">
        <div className="p-2 rounded bg-primary/20 text-primary">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground max-w-[200px] sm:max-w-[300px] truncate">
            {file.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatSize(file.size)}
          </p>
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onClear} 
        disabled={disabled}
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      >
        <X className="w-4 h-4" />
      </Button>
    </motion.div>
  );
}
