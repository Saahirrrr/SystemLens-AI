import React from "react";
import { cn } from "@/lib/utils";

export type FilterOption = "All" | "Critical" | "High" | "Medium" | "Low" | "Flagged";

interface FilterPanelProps {
  currentFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
}

export function FilterPanel({ currentFilter, onFilterChange }: FilterPanelProps) {
  const options: FilterOption[] = ["All", "Critical", "High", "Medium", "Low", "Flagged"];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onFilterChange(option)}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border",
            currentFilter === option
              ? "bg-primary/20 border-primary/50 text-primary"
              : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
