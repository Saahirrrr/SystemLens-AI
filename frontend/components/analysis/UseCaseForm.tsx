import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UseCase, SystemRecord } from "@/types";
import { Button } from "@/components/ui/button";
import { StatedSystemsPicker } from "./StatedSystemsPicker";

const useCaseSchema = z.object({
  name: z.string().min(5, "Name must be at least 5 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  trigger: z.string().min(5, "Trigger must be at least 5 characters"),
  expected_outcome: z.string().min(5, "Expected outcome must be at least 5 characters"),
  stated_systems: z.array(z.string()).min(1, "At least one system must be selected")
});

type UseCaseFormValues = z.infer<typeof useCaseSchema>;

interface UseCaseFormProps {
  initialData?: UseCase | null;
  systems: SystemRecord[];
  onSubmit: (data: UseCase) => void;
  onCancel: () => void;
}

export function UseCaseForm({ initialData, systems, onSubmit, onCancel }: UseCaseFormProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<UseCaseFormValues>({
    resolver: zodResolver(useCaseSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      trigger: "",
      expected_outcome: "",
      stated_systems: []
    }
  });

  return (
    <form onSubmit={handleSubmit((data) => onSubmit({ ...initialData, ...data }))} className="space-y-6 glass p-6 rounded-xl border border-white/10">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Use Case Name</label>
          <input
            {...register("name")}
            className="w-full bg-background/50 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. Automated User Onboarding"
          />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            {...register("description")}
            className="w-full bg-background/50 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
            placeholder="Describe the workflow..."
          />
          {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Trigger</label>
            <input
              {...register("trigger")}
              className="w-full bg-background/50 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. New employee added to HR system"
            />
            {errors.trigger && <p className="text-red-400 text-xs mt-1">{errors.trigger.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Expected Outcome</label>
            <input
              {...register("expected_outcome")}
              className="w-full bg-background/50 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. Accounts provisioned automatically"
            />
            {errors.expected_outcome && <p className="text-red-400 text-xs mt-1">{errors.expected_outcome.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Stated Systems</label>
          <Controller
            name="stated_systems"
            control={control}
            render={({ field }) => (
              <StatedSystemsPicker
                selected={field.value}
                onChange={field.onChange}
                availableSystems={systems}
              />
            )}
          />
          {errors.stated_systems && <p className="text-red-400 text-xs mt-1">{errors.stated_systems.message}</p>}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-white/5">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
          {initialData ? "Update Use Case" : "Add Use Case"}
        </Button>
      </div>
    </form>
  );
}
