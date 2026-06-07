import React from "react";
import { motion } from "framer-motion";
import { UseCase } from "@/types";
import { Edit2, Trash2, Zap, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface UseCaseCardProps {
  useCase: UseCase;
  onEdit: () => void;
  onDelete: () => void;
}

export function UseCaseCard({ useCase, onEdit, onDelete }: UseCaseCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
    >
      <Card className="glass border-white/10 hover:border-white/20 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">{useCase.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{useCase.description}</p>
            </div>
            <div className="flex space-x-2 shrink-0 ml-4">
              <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8 hover:bg-white/10 hover:text-white">
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm bg-white/5 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium block text-foreground">Trigger</span>
                <span className="text-muted-foreground">{useCase.trigger}</span>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Target className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium block text-foreground">Outcome</span>
                <span className="text-muted-foreground">{useCase.expected_outcome}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Involved Systems ({useCase.stated_systems.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {useCase.stated_systems.map((sys) => (
                <Badge key={sys} variant="outline" className="border-primary/30 text-primary bg-primary/5">
                  {sys}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
