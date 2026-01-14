'use client';

import { useState, useEffect, useTransition } from 'react';
import { updateProjectDetails, deleteProject, toggleProjectStatus } from './actions';
import { getLecturersByFaculty } from '@/app/projects/new/actions';
import SubmitButton from '@/components/SubmitButton';
import { useActionState } from 'react';
import { type Project as ProjectType, type LecturerOption } from '@/lib/types';
import { toast } from "sonner";

type MasterLists = {
  terms: { id: number; name: string }[];
  faculties: { id: number; name: string }[];
  prodi: { id: number; name: string; faculty_id: number }[];
};

type EditProjectDetailsProps = {
  project: ProjectType;
  masterLists: MasterLists;
  userRole: string;
};

const DetailItem = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div>
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 text-lg text-gray-900">{value || 'N/A'}</dd>
  </div>
);

export default function EditProjectDetails({ project, masterLists, userRole }: EditProjectDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(project.faculty_id.toString());
  const [filteredProdi, setFilteredProdi] = useState<{ id: number; name: string }[]>([]);
  const [selectedProdi, setSelectedProdi] = useState(project.prodi_id.toString());
  const [filteredLecturers, setFilteredLecturers] = useState<LecturerOption[]>([]);
  const [isLoadingLecturers, setIsLoadingLecturers] = useState(false);
  // Separate dirty state for the edit form
  const [isDirty, setIsDirty] = useState(false);
  const [isPendingStatus, startStatusTransition] = useTransition();

  useEffect(() => {
    if (selectedFaculty) {
      setFilteredProdi(masterLists.prodi.filter(p => p.faculty_id === parseInt(selectedFaculty)));
    }
  }, [selectedFaculty, masterLists.prodi]);

  useEffect(() => {
    async function fetchLecturers() {
      if (selectedFaculty) {
        setIsLoadingLecturers(true);
        const lecturersData = await getLecturersByFaculty(parseInt(selectedFaculty));
        setFilteredLecturers(lecturersData);
        setIsLoadingLecturers(false);
      } else {
        setFilteredLecturers([]);
      }
    }
    fetchLecturers();
  }, [selectedFaculty]);

  const updateDetailsWithId = updateProjectDetails.bind(null, project.id);
  const [deleteState, deleteAction] = useActionState(deleteProject, { error: null });

  const handleToggleStatus = () => {
    const newStatus = project.status === 'Done' ? 'Active' : 'Done';
    startStatusTransition(async () => {
      const result = await toggleProjectStatus(project.id, newStatus);
      if (result.error) {
        toast.error(result.error);
      } else if (result.message) {
        toast.success(result.message);
      }
    });
  };

  const handleValuesChange = () => {
    setIsDirty(true);
  };

  const handleCancel = () => {
    if (isDirty) {
      if (confirm("You have unsaved changes. Are you sure you want to discard them?")) {
        setIsEditing(false);
        setIsDirty(false);
        // Reset local state if needed, though unmounting behaves like reset for uncontrolled inputs
        // For controlled inputs, we might want to reset them to props, but simpler to just close.
        setSelectedFaculty(project.faculty_id.toString());
        setSelectedProdi(project.prodi_id.toString());
      }
    } else {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    // --- EDITING VIEW ---
    return (
      <div>
        {/* Pass onSubmit to reset editing/dirty state after successful server action? 
            Actually server action revalidates path, so form usually remounts or updates specific parts.
            For simple "Save Changes" that closes the form, we might want to handle it.
            But `useActionState` isn't used here for update (it was a direct action).
            Let's wrap update in a form action that we trust works, or upgrade to useActionState to detect success.
            The current implementation just submits and revalidates. 
            Ideally, we want to close the form on success.
        */}
        <form
          action={async (formData) => {
            await updateDetailsWithId(formData);
            setIsEditing(false);
            setIsDirty(false);
            toast.success("Project details saved");
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Edit Details</h2>
            {isDirty && <span className="text-xs text-amber-600 font-medium mr-auto ml-4">Unsaved changes</span>}
            <div className="flex items-center gap-2">
              {/* Status Toggle Button in Edit Mode */}
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={isPendingStatus}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${project.status === 'Done'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {isPendingStatus ? 'Updating...' : (project.status === 'Done' ? 'Status: Done' : 'Mark as Done')}
              </button>
            </div>
          </div>

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="md:col-span-2">
              <label htmlFor="course_name" className="text-sm font-medium text-gray-500">Course Name</label>
              <input type="text" name="course_name" id="course_name" defaultValue={project.course_name} onChange={handleValuesChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
            </div>
            <div>
              <label htmlFor="due_date" className="text-sm font-medium text-gray-500">Due Date</label>
              <input type="date" name="due_date" id="due_date" defaultValue={project.due_date?.split('T')[0]} onChange={handleValuesChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
            </div>
            <div>
              <label htmlFor="term_id" className="text-sm font-medium text-gray-500">Term</label>
              <select name="term_id" id="term_id" defaultValue={project.term_id} onChange={handleValuesChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2">
                {masterLists.terms.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="faculty_id" className="text-sm font-medium text-gray-500">Faculty</label>
              <select
                name="faculty_id"
                id="faculty_id"
                value={selectedFaculty}
                onChange={(e) => { setSelectedFaculty(e.target.value); handleValuesChange(); }}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              >
                {masterLists.faculties.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="prodi_id" className="text-sm font-medium text-gray-500">Study Program</label>
              <select
                name="prodi_id"
                id="prodi_id"
                value={selectedProdi}
                onChange={(e) => { setSelectedProdi(e.target.value); handleValuesChange(); }}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              >
                <option value="">Select a Program</option>
                {filteredProdi.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="lecturer_id" className="text-sm font-medium text-gray-500">Lecturer</label>
              <select name="lecturer_id" id="lecturer_id" defaultValue={project.lecturer_id} onChange={handleValuesChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2">
                {isLoadingLecturers ? <option>Loading...</option> : filteredLecturers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="notes" className="text-sm font-medium text-gray-500">Notes</label>
              <textarea name="notes" id="notes" defaultValue={project.notes || ''} onChange={handleValuesChange} rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"></textarea>
            </div>
          </dl>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={handleCancel} className="text-sm font-medium text-gray-600 px-3 py-1 border rounded-md hover:bg-gray-50">Cancel</button>
            <SubmitButton className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400" pendingText="Saving..." disabled={!isDirty}>Save Changes</SubmitButton>
          </div>
        </form>
        {userRole === 'Admin' && (
          <div className="mt-6 pt-4 border-t border-red-200">
            <form action={deleteAction}>
              <input type="hidden" name="projectId" value={project.id} />
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-red-700">Danger Zone</h3>
                  <p className="text-sm text-red-600">Deleting a project is permanent and cannot be undone.</p>
                </div>
                <button
                  type="submit"
                  onClick={(e) => {
                    if (!confirm('Are you sure you want to permanently delete this entire project and all its videos?')) {
                      e.preventDefault();
                    }
                  }}
                  className="bg-red-600 text-white rounded-md shadow-sm py-2 px-4 hover:bg-red-700"
                >
                  Delete Project
                </button>
              </div>
              {deleteState?.error && <p className="text-sm text-red-500 mt-2">{deleteState.error}</p>}
            </form>
          </div>
        )}
      </div>
    );
  }

  // --- READ-ONLY VIEW ---
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Overall Details</h2>
          {/* Status Toggle Button */}
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={isPendingStatus}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${project.status === 'Done'
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {isPendingStatus ? 'Updating...' : (project.status === 'Done' ? 'Status: Done' : 'Mark as Done')}
          </button>
        </div>
        <button onClick={() => setIsEditing(true)} className="text-sm font-medium text-blue-600 hover:underline">Edit Details</button>
      </div>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <DetailItem label="Request Date" value={new Date(project.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} />
        <DetailItem label="Due Date" value={project.due_date ? new Date(`${project.due_date}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'} />
        <DetailItem label="Term" value={project.terms?.name} />
        <DetailItem label="Faculty" value={project.prodi?.faculties?.name} />
        <DetailItem label="Study Program" value={project.prodi?.name} />
        <DetailItem label="Lecturer" value={project.lecturers?.name} />
        <div className="md:col-span-2">
          <DetailItem label="Notes" value={project.notes} />
        </div>
      </dl>
    </div>
  );
}