import React, { useState } from "react";
import { SystemRecord } from "@/types";
import { X, Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface StatedSystemsPickerProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  availableSystems: SystemRecord[];
}

export function StatedSystemsPicker({ selected, onChange, availableSystems }: StatedSystemsPickerProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = availableSystems.filter(s => 
    s.name.toLowerCase().includes(query.toLowerCase()) && !selected.includes(s.name)
  );

  const handleSelect = (name: string) => {
    onChange([...selected, name]);
    setQuery("");
    setIsOpen(false);
  };

  const handleRemove = (name: string) => {
    onChange(selected.filter(n => n !== name));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 min-h-[32px]">
        <AnimatePresence>
          {selected.map(name => (
            <motion.div
              key={name}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              layout
              className="flex items-center px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-sm"
            >
              <span className="mr-2 truncate max-w-[200px]">{name}</span>
              <button
                type="button"
                onClick={() => handleRemove(name)}
                className="hover:text-white transition-colors focus:outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {selected.length === 0 && (
          <span className="text-sm text-muted-foreground flex items-center">No systems selected</span>
        )}
      </div>

      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            className="w-full bg-background/50 border border-white/10 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary"
            placeholder="Search and select systems..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />
        </div>
        
        <AnimatePresence>
          {isOpen && query.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 w-full mt-1 bg-card border border-white/10 rounded-md shadow-xl max-h-[200px] overflow-y-auto"
            >
              {filtered.length > 0 ? (
                filtered.map(sys => (
                  <button
                    key={sys.id}
                    type="button"
                    onClick={() => handleSelect(sys.name)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors focus:bg-white/5 focus:outline-none"
                  >
                    {sys.name}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                  No matching systems found
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
