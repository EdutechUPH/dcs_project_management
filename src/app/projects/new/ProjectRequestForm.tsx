'use client';

import { useState, useEffect, useRef, useActionState } from 'react';
import Link from 'next/link';
import SubmitButton from '@/components/SubmitButton';
import { createProject, getLecturersByFaculty } from './actions';
import { useRouter } from 'next/navigation';
import AddLecturerModal from './AddLecturerModal';
import { PlusCircle } from 'lucide-react';
import { type Option, type ProdiOption, type LecturerOption } from '@/lib/types';
import { toast } from "sonner";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';

type DataProps = {
  terms: Option[];
  faculties: Option[];
  prodi: ProdiOption[];
  lecturers: LecturerOption[];
  profiles: { id: string; full_name: string; role: string }[];
};

type FormState = {
  message: string;
  success?: boolean;
};

const initialState: FormState = { message: '' };

export default function ProjectRequestForm({ terms, faculties, prodi, lecturers, profiles }: DataProps) {
  const [state, formAction] = useActionState(createProject, initialState);
  const router = useRouter();

  // ... (existing state)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      // Optional: Wait a moment before redirecting to let the user see the toast
      const timeoutId = setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1000);
      return () => clearTimeout(timeoutId);
    } else if (state?.message && !state.success && state.message !== '') {
      // Show error toast if message exists but not success
      toast.error(state.message);
    }
  }, [state, router]);

  // ... (rest of effect)

  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [filteredProdi, setFilteredProdi] = useState<ProdiOption[]>([]);
  const [selectedProdi, setSelectedProdi] = useState('');
  const [filteredLecturers, setFilteredLecturers] = useState<LecturerOption[]>([]);
  const [isLoadingLecturers, setIsLoadingLecturers] = useState(false);
  const [videoCount, setVideoCount] = useState<number | ''>(1);
  const [courseName, setCourseName] = useState('');
  const [videoTitles, setVideoTitles] = useState<string[]>(['Video 1']);
  const prevCourseNameRef = useRef('');

  // Team assignment state
  type Assignment = { profileId: string; role: string };
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const addAssignment = () => setAssignments(prev => [...prev, { profileId: '', role: '' }]);
  const removeAssignment = (index: number) => setAssignments(prev => prev.filter((_, i) => i !== index));
  const updateAssignment = (index: number, field: 'profileId' | 'role', value: string) => {
    setAssignments(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
  };

  // Group profiles by role for the select dropdown
  const profilesByRole = {
    dcs: profiles.filter(p => p.role === 'Digital Content Specialist').sort((a, b) => a.full_name.localeCompare(b.full_name)),
    id: profiles.filter(p => p.role === 'Instructional Designer').sort((a, b) => a.full_name.localeCompare(b.full_name)),
    admin: profiles.filter(p => p.role === 'Admin').sort((a, b) => a.full_name.localeCompare(b.full_name)),
  };
  /* 
     Restoring logic to sync video titles with video count. 
     This updates the videoTitles array when the videoCount input changes.
  */
  useEffect(() => {
    const count = typeof videoCount === 'number' ? videoCount : 0;
    setVideoTitles(prevTitles => {
      const newTitles = [...prevTitles];
      if (count > prevTitles.length) {
        // Add new titles
        for (let i = prevTitles.length; i < count; i++) {
          newTitles.push(`${courseName || 'Video'} - ${i + 1}`);
        }
      } else if (count < prevTitles.length) {
        // Remove extra titles
        newTitles.length = count;
      }
      return newTitles;
    });
  }, [videoCount, courseName]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleVideoCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const count = value === '' ? '' : parseInt(value, 10);
    if (value === '' || (!isNaN(count as number) && (count as number) >= 0)) {
      setVideoCount(count);
    }
  };

  const handleTitleChange = (index: number, value: string) => {
    const newTitles = [...videoTitles];
    newTitles[index] = value;
    setVideoTitles(newTitles);
  };

  useEffect(() => {
    if (selectedFaculty) {
      setFilteredProdi(prodi.filter(p => p.faculty_id === parseInt(selectedFaculty)));
      setSelectedProdi('');
      setFilteredLecturers([]);
    } else {
      setFilteredProdi([]);
    }
  }, [selectedFaculty, prodi]);

  useEffect(() => {
    async function fetchLecturers() {
      if (selectedFaculty) {
        setIsLoadingLecturers(true);
        // We now fetch by Faculty ID
        const lecturersData = await getLecturersByFaculty(parseInt(selectedFaculty));
        // Note: I will rename getLecturersByProdi to getLecturersByFaculty in the next step, 
        // but for now I'm keeping the name matching the import to avoid break before update.
        // Actually, let's assume I will update the import and usage simultaneously or simply I'll update the function name in actions.ts next.
        // Better to change the function name here and in the import, and then update actions.ts.

        setFilteredLecturers(lecturersData as LecturerOption[]);
        setIsLoadingLecturers(false);
      } else {
        setFilteredLecturers([]);
      }
    }
    fetchLecturers();
  }, [selectedFaculty]); // Changed dependency from selectedProdi to selectedFaculty

  // ... (rest of code)

  return (
    <>
      <form action={formAction} className="space-y-6">
        {/* ... (form content) */}
        <div className="p-6 md:p-8 border border-gray-200 rounded-xl bg-gray-50/80 shadow-sm">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Project Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            {/* ... (inputs) */}
            <div className="md:col-span-2">
              <label htmlFor="course_name" className="block text-sm font-medium text-gray-700">Course Name</label>
              <input type="text" name="course_name" id="course_name" required className="mt-1 block w-full rounded-md border border-gray-300 bg-white shadow-sm p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={courseName} onChange={(e) => setCourseName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">Due Date</label>
              <input type="date" name="due_date" id="due_date" required className="mt-1 block w-full rounded-md border border-gray-300 bg-white shadow-sm p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
            </div>
            <div>
              <label htmlFor="term_id" className="block text-sm font-medium text-gray-700">Term</label>
              <select name="term_id" id="term_id" required className="mt-1 block w-full rounded-md border border-gray-300 bg-white shadow-sm p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
                <option value="">Select Term</option>
                {terms?.map(term => <option key={term.id} value={term.id}>{term.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="project_type" className="block text-sm font-medium text-gray-700">Project Type</label>
              <select name="project_type" id="project_type" required className="mt-1 block w-full rounded-md border border-gray-300 bg-white shadow-sm p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
                <option value="Taping and Editing">Taping and Editing</option>
                <option value="Animation">Animation</option>
                <option value="Translation">Translation</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-6 p-5 border border-gray-200 bg-white rounded-lg shadow-sm">
              <div>
                <label htmlFor="faculty_id" className="block text-sm font-medium text-gray-700">1. Select Faculty</label>
                <select name="faculty_id" id="faculty_id" required className="mt-1 block w-full rounded-md border border-gray-300 bg-white shadow-sm p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={selectedFaculty} onChange={(e) => setSelectedFaculty(e.target.value)}>
                  <option value="">Select Faculty</option>
                  {faculties?.map(faculty => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="prodi_id" className="block text-sm font-medium text-gray-700">2. Select Study Program</label>
                <select name="prodi_id" id="prodi_id" required className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 shadow-sm p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-60" disabled={!selectedFaculty} value={selectedProdi} onChange={(e) => setSelectedProdi(e.target.value)}>
                  <option value="">{!selectedFaculty ? "Select a Faculty first" : "Select Study Program"}</option>
                  {filteredProdi.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <label htmlFor="lecturer_id" className="block text-sm font-medium text-gray-700">3. Select Lecturer</label>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 font-medium bg-blue-50 px-2 py-1 rounded"
                  >
                    <PlusCircle size={14} /> Add New
                  </button>
                </div>
                {/* Changed disabled condition: wait for faculty instead of prodi */}
                <select name="lecturer_id" id="lecturer_id" required className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 shadow-sm p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-60" disabled={!selectedFaculty || isLoadingLecturers}>
                  <option value="">{isLoadingLecturers ? "Loading..." : !selectedFaculty ? "Select Faculty first" : "Select Lecturer"}</option>
                  {filteredLecturers.map(lecturer => <option key={lecturer.id} value={lecturer.id}>{lecturer.name}</option>)}
                </select>
              </div>
            </div>
            {/* Team Assignments (Optional) */}
            <div className="md:col-span-2 bg-white p-5 border border-gray-200 rounded-lg shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Initial Team Assignments <span className="text-xs font-normal text-gray-400">(Optional)</span></label>
                  <p className="text-xs text-gray-500 mt-0.5">You can also assign members later from the project page.</p>
                </div>
                <button type="button" onClick={addAssignment} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors">
                  <PlusCircle size={14} /> Add Member
                </button>
              </div>

              {/* Hidden serialised assignment data */}
              <input type="hidden" name="assignment_count" value={assignments.length} />
              {assignments.map((a, i) => (
                <input key={`hid-pid-${i}`} type="hidden" name={`assignment_${i}_profile_id`} value={a.profileId} />
              ))}
              {assignments.map((a, i) => (
                <input key={`hid-role-${i}`} type="hidden" name={`assignment_${i}_role`} value={a.role} />
              ))}

              {assignments.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-2">No members added yet.</p>
              )}

              {assignments.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  {/* Member dropdown — colour-coded Radix Select */}
                  <Select
                    value={a.profileId || undefined}
                    onValueChange={(v) => updateAssignment(i, 'profileId', v)}
                  >
                    <SelectTrigger className="flex-1 bg-white">
                      <SelectValue placeholder="Select member..." />
                    </SelectTrigger>
                    <SelectContent>
                      {profilesByRole.dcs.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="bg-blue-50/50 text-blue-800 font-bold border-b border-blue-100">Digital Content Specialists</SelectLabel>
                          {profilesByRole.dcs.map(p => (
                            <SelectItem key={p.id} value={p.id} className="data-[highlighted]:bg-blue-50 focus:bg-blue-50 focus:text-blue-900 transition-colors cursor-pointer pl-6 py-2">
                              {p.full_name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                      {profilesByRole.id.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="bg-purple-50/50 text-purple-800 font-bold border-b border-purple-100 mt-2">Instructional Designers</SelectLabel>
                          {profilesByRole.id.map(p => (
                            <SelectItem key={p.id} value={p.id} className="data-[highlighted]:bg-purple-50 focus:bg-purple-50 focus:text-purple-900 transition-colors cursor-pointer pl-6 py-2">
                              {p.full_name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                      {profilesByRole.admin.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="bg-yellow-50/50 text-yellow-800 font-bold border-b border-yellow-100 mt-2">Admins</SelectLabel>
                          {profilesByRole.admin.map(p => (
                            <SelectItem key={p.id} value={p.id} className="data-[highlighted]:bg-yellow-50 focus:bg-yellow-50 focus:text-yellow-900 transition-colors cursor-pointer pl-6 py-2">
                              {p.full_name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                    </SelectContent>
                  </Select>

                  {/* Role dropdown — colour-coded Radix Select */}
                  <Select
                    value={a.role || undefined}
                    onValueChange={(v) => updateAssignment(i, 'role', v)}
                  >
                    <SelectTrigger className="flex-1 bg-white">
                      <SelectValue placeholder="Select role..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel className="bg-purple-50/50 text-purple-800 font-bold border-b border-purple-100">Instructional Designer</SelectLabel>
                        <SelectItem value="Instructional Designer" className="data-[highlighted]:bg-purple-50 focus:bg-purple-50 focus:text-purple-900 transition-colors cursor-pointer pl-6 py-2">
                          Instructional Designer
                        </SelectItem>
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel className="bg-blue-50/50 text-blue-800 font-bold border-b border-blue-100 mt-2">Digital Content Specialists</SelectLabel>
                        <SelectItem value="Main Editor / Videographer" className="data-[highlighted]:bg-blue-50 focus:bg-blue-50 focus:text-blue-900 transition-colors cursor-pointer pl-6 py-2">
                          Main Editor / Videographer
                        </SelectItem>
                        <SelectItem value="Assistant Editor" className="data-[highlighted]:bg-blue-50 focus:bg-blue-50 focus:text-blue-900 transition-colors cursor-pointer pl-6 py-2">
                          Assistant Editor
                        </SelectItem>
                        <SelectItem value="Assistant Videographer" className="data-[highlighted]:bg-blue-50 focus:bg-blue-50 focus:text-blue-900 transition-colors cursor-pointer pl-6 py-2">
                          Assistant Videographer
                        </SelectItem>
                        <SelectItem value="Sound Engineer" className="data-[highlighted]:bg-blue-50 focus:bg-blue-50 focus:text-blue-900 transition-colors cursor-pointer pl-6 py-2">
                          Sound Engineer
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <button type="button" onClick={() => removeAssignment(i)} className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors whitespace-nowrap">
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Number of Videos */}
            <div className="md:col-span-2 bg-white p-5 border border-gray-200 rounded-lg shadow-sm">
              <label htmlFor="video_count" className="block text-sm font-medium text-gray-700">
                Number of Videos <span className="text-gray-500 font-normal ml-1">(this can be edited later)</span>
              </label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" name="video_count" id="video_count" value={videoCount} onChange={handleVideoCountChange} className="mt-2 block w-24 rounded-md border border-gray-300 shadow-sm p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
              
              <div className="mt-4 space-y-3">
                {videoTitles.map((title, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <label htmlFor={`video_title_${index}`} className="block text-sm font-medium text-gray-500 w-24 shrink-0">Video {index + 1}</label>
                    <input type="text" name={`video_title_${index}`} id={`video_title_${index}`} value={title} onChange={(e) => handleTitleChange(index, e.target.value)} className="block w-full rounded-md border border-gray-300 shadow-sm p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" required />
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="project_folder_url" className="block text-sm font-medium text-gray-700">Project Folder Link</label>
              <input type="text" name="project_folder_url" id="project_folder_url" className="mt-1 block w-full rounded-md border border-gray-300 bg-white shadow-sm p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" placeholder="e.g. OneDrive or Google Drive link" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea name="notes" id="notes" rows={3} className="mt-1 block w-full rounded-md border border-gray-300 bg-white shadow-sm p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"></textarea>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-4 items-center">
          {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
          <Link href="/" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</Link>
          <SubmitButton className="px-4 py-2 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-md shadow-sm hover:bg-gray-700 disabled:bg-gray-400" pendingText="Creating...">Create Project</SubmitButton>
        </div>
      </form>

      {isModalOpen && (
        <AddLecturerModal
          faculties={faculties}
          onClose={() => setIsModalOpen(false)}
          onLecturerAdded={async () => {
             // Directly update the lecturer list for the selected faculty
             if (selectedFaculty) {
               setIsLoadingLecturers(true);
               const lecturersData = await getLecturersByFaculty(parseInt(selectedFaculty));
               setFilteredLecturers(lecturersData as LecturerOption[]);
               setIsLoadingLecturers(false);
             }
          }}
        />
      )}
    </>
  );
}