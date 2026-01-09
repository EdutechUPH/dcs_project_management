// src/app/projects/new/AddLecturerModal.tsx
'use client';

import { addLecturer } from '@/app/admin/lecturers/actions';
import SubmitButton from '@/components/SubmitButton';
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
  faculties: { id: number, name: string }[];
  onClose: () => void;
  onLecturerAdded: () => void;
};

export default function AddLecturerModal({ faculties, onClose, onLecturerAdded }: AddLecturerModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // State for the multi-select dropdown
  const [selectedFaculties, setSelectedFaculties] = useState<string[]>([]);

  const facultyOptions = faculties.map(f => ({ value: f.id.toString(), label: f.name }));

  const handleSubmit = async (formData: FormData) => {
    // Append the selected faculty IDs to the form data before submitting
    selectedFaculties.forEach(id => {
      formData.append('faculty_ids', id);
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
            Enter the lecturer's details and assign them to one or more faculties.
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
            <Label>Assign to Faculty(s)</Label>
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2 bg-white">
              {facultyOptions.map((faculty) => (
                <div key={faculty.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`faculty-${faculty.value}`}
                    checked={selectedFaculties.includes(faculty.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFaculties([...selectedFaculties, faculty.value]);
                      } else {
                        setSelectedFaculties(selectedFaculties.filter(id => id !== faculty.value));
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                  />
                  <label
                    htmlFor={`faculty-${faculty.value}`}
                    className="text-sm cursor-pointer select-none"
                  >
                    {faculty.label}
                  </label>
                </div>
              ))}
            </div>
            {selectedFaculties.length === 0 && (
              <p className="text-[0.8rem] text-muted-foreground">
                At least one faculty is recommended.
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