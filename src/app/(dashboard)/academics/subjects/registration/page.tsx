// app/(dashboard)/academics/subjects/registration/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { Save, Trash2 } from 'lucide-react'; // Removed unused Plus and Search imports
import {
  getSubjectRegistrations,
  bulkRegisterStudentSubjects,
  deleteSubjectRegistration,
} from '@/actions/subject'; // Removed unused registerStudentSubject import
import { getStudents } from '@/actions/student';
import { getSubjects } from '@/actions/subject';
import { getClasses } from '@/actions/class';

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  class: {
    code: string;
    name: string;
  };
}

interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  isCore: boolean;
}

interface Class {
  id: string;
  code: string;
  name: string;
}

interface Registration {
  id: string;
  cohort: string;
  classCode: string;
  startDate: Date;
  endDate: Date;
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
  };
  subject: {
    id: string;
    code: string;
    name: string;
    credits: number;
    isCore: boolean;
  };
}

export default function SubjectRegistrationPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [cohort, setCohort] = useState('2025');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'register' | 'view'>('register');

  // Define loadRegistrations with useCallback
  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getSubjectRegistrations({
        classCode: selectedClass ? classes.find(c => c.id === selectedClass)?.code : undefined,
        page: 1,
        limit: 500,
      });
      
      if (result.success && Array.isArray(result.data)) {
        setRegistrations(result.data);
      }
    } catch (error) {
      console.error('Error loading registrations:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, classes]); // Add dependencies

  // Define loadStudentsByClass with useCallback
  const loadStudentsByClass = useCallback(async () => {
    if (!selectedClass) return;
    
    setLoading(true);
    try {
      const result = await getStudents({
        classId: selectedClass,
        page: 1,
        limit: 500,
      });
      
      if (result.success && Array.isArray(result.data)) {
        setStudents(result.data);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedClass]); // Add dependency

  useEffect(() => {
    loadClasses();
    loadSubjects();
    loadRegistrations();
  }, [loadRegistrations]); // Add loadRegistrations to dependencies

  useEffect(() => {
    if (selectedClass) {
      loadStudentsByClass();
    }
  }, [selectedClass, loadStudentsByClass]); // Add loadStudentsByClass to dependencies

  const loadClasses = async () => {
    const result = await getClasses();
    if (result.success && Array.isArray(result.data)) {
      setClasses(result.data);
    }
  };

  const loadSubjects = async () => {
    const result = await getSubjects({ page: 1, limit: 200 });
    if (result.success && Array.isArray(result.data)) {
      setSubjects(result.data);
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleRegister = async () => {
    if (!selectedStudent || selectedSubjects.length === 0 || !startDate || !endDate) {
      alert('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const student = students.find(s => s.id === selectedStudent);
      if (!student) return;

      const registrations = selectedSubjects.map((subjectId) => ({
        studentId: selectedStudent,
        subjectId,
        cohort,
        classCode: student.class.code,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        numberOfSubjects: selectedSubjects.length,
      }));

      const result = await bulkRegisterStudentSubjects(registrations);
      
      if (result.success) {
        alert('Student registered successfully!');
        setSelectedStudent('');
        setSelectedSubjects([]);
        loadRegistrations();
      } else {
        alert('Failed to register student');
      }
    } catch (error) {
      console.error('Error registering student:', error);
      alert('Failed to register student');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this registration?')) {
      return;
    }

    try {
      const result = await deleteSubjectRegistration(id);
      if (result.success) {
        loadRegistrations();
      } else {
        alert('Failed to delete registration');
      }
    } catch (error) {
      console.error('Error deleting registration:', error);
      alert('Failed to delete registration');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subject Registration</h1>
        <nav className="text-sm text-gray-600 mt-1">
          Dashboard &gt; Student Academics &gt; Subject Registration
        </nav>
      </div>

      {/* Mode Toggle */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('register')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'register'
                ? 'bg-cyan-700 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Register Students
          </button>
          <button
            onClick={() => {
              setViewMode('view');
              loadRegistrations();
            }}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'view'
                ? 'bg-cyan-700 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            View Registrations
          </button>
        </div>
      </div>

      {/* Registration Form */}
      {viewMode === 'register' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Register Student for Subjects</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.code} - {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                disabled={!selectedClass}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 disabled:bg-gray-100"
              >
                <option value="">Select Student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.admissionNumber} - {student.firstName} {student.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cohort <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
                placeholder="e.g., 2025"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Subjects <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto border rounded-lg p-4">
              {subjects.map((subject) => (
                <label
                  key={subject.id}
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject.id)}
                    onChange={() => handleSubjectToggle(subject.id)}
                    className="w-4 h-4 text-cyan-700 rounded focus:ring-cyan-700"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{subject.code}</div>
                    <div className="text-xs text-gray-600">{subject.name}</div>
                    <div className="text-xs text-gray-500">
                      {subject.credits} credits • {subject.isCore ? 'Core' : 'Elective'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleRegister}
              disabled={saving || !selectedStudent || selectedSubjects.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {saving ? 'Registering...' : `Register for ${selectedSubjects.length} Subject(s)`}
            </button>
          </div>
        </div>
      )}

      {/* View Registrations */}
      {viewMode === 'view' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold">Subject Registrations</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading registrations...
            </div>
          ) : registrations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No subject registrations found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Admission No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Student Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Subject Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Subject Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Credits
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Class
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Cohort
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {reg.student.admissionNumber}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {reg.student.firstName} {reg.student.middleName} {reg.student.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {reg.subject.code}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {reg.subject.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {reg.subject.credits}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          reg.subject.isCore
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {reg.subject.isCore ? 'Core' : 'Elective'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {reg.classCode}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {reg.cohort}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(reg.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}