// src/app/projects/new/AddLecturerModal.tsx
'use client';

import { addLecturer } from '@/app/admin/lecturers/actions';
import SubmitButton from '@/components/SubmitButton';
import { MultiSelect } from '@/components/MultiSelect';
import { useRef, useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type AddLecturerModalProps = {
  prodi: { id: number, name: string }[];
  onClose: () => void;
  onLecturerAdded: () => void;
};

export default function AddLecturerModal({ prodi, onClose, onLecturerAdded }: AddLecturerModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // State for the multi-select dropdown
  const [selectedProdi, setSelectedProdi] = useState<string[]>([]);

  const prodiOptions = prodi.map(p => ({ value: p.id.toString(), label: p.name }));

  const handleSubmit = async (formData: FormData) => {
    // Append the selected program IDs to the form data before submitting
    selectedProdi.forEach(prodiId => {
      formData.append('prodi_ids', prodiId);
    });

    startTransition(async () => {
      const result = await addLecturer({ error: null, data: null }, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(null);
        formRef.current?.reset();
        onLecturerAdded();
        onClose();
      }
    });
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Lecturer</DialogTitle>
          <DialogDescription>
            Enter the lecturer's details and assign them to one or more study programs.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" required placeholder="e.g. Dr. Jane Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input id="email" name="email" type="email" placeholder="jane@university.edu" />
          </div>
          <div className="space-y-2">
            <Label>Assign to Study Program(s)</Label>
            <MultiSelect
              options={prodiOptions}
              selected={selectedProdi}
              onChange={setSelectedProdi}
              placeholder="Select programs..."
              className="w-full"
            />
            {selectedProdi.length === 0 && (
              <p className="text-[0.8rem] text-muted-foreground">
                At least one program is recommended.
              </p>
            )}
          </div>
          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <SubmitButton
              className="bg-black text-white hover:bg-gray-800"
              pendingText="Saving..."
            >
              Save Lecturer
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}