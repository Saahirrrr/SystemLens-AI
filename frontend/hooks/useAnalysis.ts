import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UseCase } from "@/types";
import { apiClient } from "@/lib/api";
import { ANALYSIS_STORAGE_KEY, DRAFT_STORAGE_KEY } from "@/lib/constants";

export function useAnalysis() {
  const router = useRouter();
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (draft) {
      try {
        // eslint-disable-next-line
        setUseCases(JSON.parse(draft));
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveDraft = useCallback((newUseCases: UseCase[]) => {
    setUseCases(newUseCases);
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(newUseCases));
  }, []);

  const addUseCase = useCallback((useCase: UseCase) => {
    saveDraft([...useCases, { ...useCase, id: crypto.randomUUID() }]);
  }, [useCases, saveDraft]);

  const updateUseCase = useCallback((updated: UseCase) => {
    saveDraft(useCases.map(uc => uc.id === updated.id ? updated : uc));
  }, [useCases, saveDraft]);

  const deleteUseCase = useCallback((id: string) => {
    saveDraft(useCases.filter(uc => uc.id !== id));
  }, [useCases, saveDraft]);

  const submitAnalysis = useCallback(async (sessionId: string) => {
    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const payload = useCases.map(({ id, ...rest }) => rest);
      const response = await apiClient.submitAnalysis(sessionId, payload);
      
      if (response.data) {
        localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(response.data));
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        router.push("/results");
      } else {
        throw new Error(response.error || "Failed to submit analysis");
      }
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      alert("Failed to run analysis. Please try again.");
    }
  }, [useCases, router]);

  return {
    useCases,
    isSubmitting,
    isLoaded,
    addUseCase,
    updateUseCase,
    deleteUseCase,
    submitAnalysis
  };
}
