"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { updateHouseholdName } from "@/actions/settings";

interface RenameHouseholdDialogProps {
  currentName: string;
}

export function RenameHouseholdDialog({ currentName }: RenameHouseholdDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    startTransition(async () => {
      const result = await updateHouseholdName({ name: name.trim() });
      if (result.success) {
        setIsOpen(false);
      } else {
        setError(result.error ?? "Failed to update name");
      }
    });
  };

  const handleClose = () => {
    setName(currentName);
    setError(null);
    setIsOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <p className="text-lg">{currentName}</p>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Edit household name"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Rename Household</h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="householdName"
                  className="mb-1 block text-sm font-medium"
                >
                  Household Name
                </label>
                <input
                  id="householdName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter household name"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || name.trim() === currentName}
                  className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
