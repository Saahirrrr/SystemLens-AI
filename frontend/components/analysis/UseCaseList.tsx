import React from "react";
import { AnimatePresence } from "framer-motion";
import { UseCase } from "@/types";
import { UseCaseCard } from "./UseCaseCard";
import { EmptyUseCases } from "./EmptyUseCases";

interface UseCaseListProps {
  useCases: UseCase[];
  onEdit: (useCase: UseCase) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function UseCaseList({ useCases, onEdit, onDelete, onAdd }: UseCaseListProps) {
  if (useCases.length === 0) {
    return <EmptyUseCases onAdd={onAdd} />;
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="popLayout">
        {useCases.map((uc) => (
          <UseCaseCard
            key={uc.id}
            useCase={uc}
            onEdit={() => onEdit(uc)}
            onDelete={() => uc.id && onDelete(uc.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
