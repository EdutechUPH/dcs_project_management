// src/app/projects/new/ProjectRequestForm.tsx
'use client';

import { useState, useEffect, useRef, useActionState } from 'react';
import Link from 'next/link';
import SubmitButton from '@/components/SubmitButton';
import { createProject, getLecturersByProdi } from './actions';
import { useRouter } from 'next/navigation';
import AddLecturerModal from './AddLecturerModal';
import { PlusCircle } from 'lucide-react';
import { type Option, type ProdiOption, type LecturerOption } from '@/lib/types';

type DataProps = {
  terms: Option[];
  faculties: Option[];
  prodi: ProdiOption[];
  lecturers: LecturerOption[]; // ✅ Add this
};

const initialState = { message: '' };

export default function ProjectRequestForm({ terms, faculties, prodi, lecturers }: DataProps) {
  const [state, formAction] = useActionState(createProject, initialState);
  const router = useRouter();
  
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [filteredProdi, setFilteredProdi] = useState<ProdiOption[]>([]);
  const [selectedProdi, setSelectedProdi] = useState('');
  const [filteredLecturers, setFilteredLecturers] = useState<LecturerOption[]>([]);
  const [isLoadingLecturers, setIsLoadingLecturers] = useState(false);
  const [videoCount, setVideoCount] = useState<number | ''>(1);
  const [courseName, setCourseName] = useState('');
  const [videoTitles, setVideoTitles] = useState<string[]>(['Video 1']);
  const prevCourseNameRef = useRef('');
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
      if (selectedProdi) {
        setIsLoadingLecturers(true);
        const lecturersData = await getLecturersByProdi(parseInt(selectedProdi));
        setFilteredLecturers(lecturersData as LecturerOption[]);
        setIsLoadingLecturers(false);
      } else {
        setFilteredLecturers([]);
      }
    }
    fetchLecturers();
  }, [selectedProdi]);

  useEffect(() => {
    const count = Number(videoCount) || 0;
    setVideoTitles(currentTitles => {
      const newTitles = Array.from({ length: count }, (_, i) => 
        currentTitles[i] || `Video ${i + 1}${courseName ? ` - ${courseName}` : ''}`
      );
      return newTitles;
    });
  }, [videoCount, courseName]);

  useEffect(() => {
    setVideoTitles(currentTitles => {
      const prevCourseName = prevCourseNameRef.current;
      const newTitles = currentTitles.map((title, index) => {
        const oldDefault = `Video ${index + 1}${prevCourseName ? ` - ${prevCourseName}` : ''}`;
        if (title === oldDefault || title === `Video ${index + 1}`) {
          return `Video ${index + 1}${courseName ? ` - ${courseName}` : ''}`;
        }
        return title;
      });
      prevCourseNameRef.current = courseName;
      return newTitles;
    });
  }, [courseName]);

  return (
    <>
      <form action={formAction} className="space-y-6">
        <div className="p-6 border rounded-lg bg-white">
          <h2 className="text-xl font-semibold mb-4">Project Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <div className="md:col-span-2">
              <label htmlFor="course_name" className="block text-sm font-medium text-gray-700">Course Name</label>
              <input type="text" name="course_name" id="course_name" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" value={courseName} onChange={(e) => setCourseName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">Due Date</label>
              <input type="date" name="due_date" id="due_date" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
            </div>
            <div>
              <label htmlFor="term_id" className="block text-sm font-medium text-gray-700">Term</label>
              <select name="term_id" id="term_id" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2">
                <option value="">Select Term</option>
                {terms?.map(term => <option key={term.id} value={term.id}>{term.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 space-y-6">
              <div>
                <label htmlFor="faculty_id" className="block text-sm font-medium text-gray-700">1. Select Faculty</label>
                <select name="faculty_id" id="faculty_id" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" value={selectedFaculty} onChange={(e) => setSelectedFaculty(e.target.value)}>
                  <option value="">Select Faculty</option>
                  {faculties?.map(faculty => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="prodi_id" className="block text-sm font-medium text-gray-700">2. Select Study Program</label>
                <select name="prodi_id" id="prodi_id" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 disabled:bg-gray-100" disabled={!selectedFaculty} value={selectedProdi} onChange={(e) => setSelectedProdi(e.target.value)}>
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
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <PlusCircle size={14} /> Add New
                  </button>
                </div>
                <select name="lecturer_id" id="lecturer_id" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 disabled:bg-gray-100" disabled={!selectedProdi || isLoadingLecturers}>
                  <option value="">{isLoadingLecturers ? "Loading..." : !selectedProdi ? "Select Program first" : "Select Lecturer"}</option>
                  {filteredLecturers.map(lecturer => <option key={lecturer.id} value={lecturer.id}>{lecturer.name}</option>)}
                </select>
              </div>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="video_count" className="block text-sm font-medium text-gray-700">
                Number of Videos <span className="text-gray-500 font-normal">(this can be edited later)</span>
              </label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" name="video_count" id="video_count" value={videoCount} onChange={handleVideoCountChange} className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm p-2"/>
            </div>
            <div className="md:col-span-2 space-y-2">
              {videoTitles.map((title, index) => (
                <div key={index}>
                  <label htmlFor={`video_title_${index}`} className="block text-sm font-medium text-gray-500">Video Title {index + 1}</label>
                  <input type="text" name={`video_title_${index}`} id={`video_title_${index}`} value={title} onChange={(e) => handleTitleChange(index, e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" required />
                </div>
              ))}
            </div>
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea name="notes" id="notes" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"></textarea>
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
          prodi={prodi}
          onClose={() => setIsModalOpen(false)} 
          onLecturerAdded={() => {
            router.refresh(); 
          }} 
        />
      )}
    </>
  );
}