// app/(dashboard)/academics/marks/entry/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Save, Search, Filter, Download } from 'lucide-react';
import { getMarksEntries, createMarksEntry, updateMarksEntry } from '@/actions/marks';
import { getClasses } from '@/actions/class';
import { getSubjects } from '@/actions/subject';
import { getSubjectStudents } from '@/actions/subject';

interface Class {
  id: string;
  code: string;
  name: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
}

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
}

interface SubjectRegistration {
  student: Student;
  id: string;
  studentId: string;
  subjectId: string;
}

interface SubjectRegistration {
  student: Student;
  id: string;
  studentId: string;
  subjectId: string;
}

interface MarksData {
  [studentId: string]: {
    cat1?: number;
    cat2?: number;
    cat3?: number;
    practical1?: number;
    practical2?: number;
    practical3?: number;
  };
}

interface MarksEntryInput {
  studentId: string;
  subjectId: string;
  classCode: string;
  cohort: string;
  session: string;
  scheduleType: string;
  examType: string;
  cat?: number;
  practical?: number;
  enteredBy: string;
}

interface MarksEntryInput {
  studentId: string;
  subjectId: string;
  classCode: string;
  cohort: string;
  session: string;
  scheduleType: string;
  examType: string;
  cat?: number;
  practical?: number;
  enteredBy: string;
}

export default function MarksEntryPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSession, setSelectedSession] = useState('SEPT_DEC');
  const [selectedAssessment, setSelectedAssessment] = useState<'cat' | 'practical'>('cat');
  const [assessmentNumber, setAssessmentNumber] = useState(1);
  const [marksData, setMarksData] = useState<MarksData>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadClasses();
    loadSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      loadStudents();
    }
  }, [selectedSubject]);

  const loadClasses = async () => {
    const result = await getClasses();
    if (result.success && Array.isArray(result.data)) {
      setClasses(result.data);
    }
  };

  const loadSubjects = async () => {
    const result = await getSubjects();
    if (result.success && Array.isArray(result.data)) {
      setSubjects(result.data);
    }
  };

  const loadStudents = async () => {
    if (!selectedSubject) return;
    
    setLoading(true);
    try {
      const result = await getSubjectStudents(selectedSubject);
      if (result.success && Array.isArray(result.data)) {
        setStudents(result.data.map((reg: SubjectRegistration) => reg.student));
      }
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarksChange = (studentId: string, value: string) => {
    const marks = parseFloat(value);
    if (isNaN(marks) || marks < 0 || marks > 100) return;

    setMarksData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [`${selectedAssessment}${assessmentNumber}`]: marks,
      },
    }));
  };

  const calculateAverage = (studentId: string) => {
    const data = marksData[studentId];
    if (!data) return '-';

    if (selectedAssessment === 'cat') {
      const cats = [data.cat1, data.cat2, data.cat3].filter(v => v !== undefined) as number[];
      if (cats.length === 0) return '-';
      return (cats.reduce((a, b) => a + b, 0) / cats.length).toFixed(1);
    } else {
      const practicals = [data.practical1, data.practical2, data.practical3].filter(v => v !== undefined) as number[];
      if (practicals.length === 0) return '-';
      return (practicals.reduce((a, b) => a + b, 0) / practicals.length).toFixed(1);
    }
  };

  const handleSave = async () => {
    if (!selectedClass || !selectedSubject || !selectedSession) {
      alert('Please select class, subject, and session');
      return;
    }

    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      for (const [studentId, marks] of Object.entries(marksData)) {
        const assessmentKey = `${selectedAssessment}${assessmentNumber}` as keyof typeof marks;
        
        const marksEntry: MarksEntryInput = {
          studentId,
          subjectId: selectedSubject,
          classCode: classes.find(c => c.id === selectedClass)?.code || '',
          cohort: '2025',
          session: selectedSession,
          scheduleType: 'continuous_assessment',
          examType: 'Module Assessment',
          cat: selectedAssessment === 'cat' ? marks[assessmentKey] : undefined,
          practical: selectedAssessment === 'practical' ? marks[assessmentKey] : undefined,
          enteredBy: user.id || '',
        };

        await createMarksEntry(marksEntry);
      }

      alert('Marks saved successfully!');
      setMarksData({});
    } catch (error) {
      console.error('Error saving marks:', error);
      alert('Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Marks Entry</h1>
        <nav className="text-sm text-gray-600 mt-1">
          Dashboard &gt; Student Academics &gt; Marks Entry
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Assessment Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
            >
              <option value="">Select Subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.code} - {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
            >
              <option value="SEPT_DEC">Sept - Dec</option>
              <option value="JAN_APRIL">Jan - April</option>
              <option value="MAY_AUGUST">May - August</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assessment Type <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedAssessment}
              onChange={(e) => setSelectedAssessment(e.target.value as 'cat' | 'practical')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
            >
              <option value="cat">Written Assessment (CAT)</option>
              <option value="practical">Practical Assessment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assessment Number <span className="text-red-500">*</span>
            </label>
            <select
              value={assessmentNumber}
              onChange={(e) => setAssessmentNumber(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
            >
              <option value={1}>Assessment 1</option>
              <option value={2}>Assessment 2</option>
              <option value={3}>Assessment 3</option>
            </select>
          </div>
        </div>
      </div>

      {/* Marks Entry Table */}
      {students.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              Enter Marks - {selectedAssessment.toUpperCase()} {assessmentNumber}
            </h2>
            <button
              onClick={handleSave}
              disabled={saving || Object.keys(marksData).length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Marks'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Admission No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Student Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    CAT 1
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    CAT 2
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    CAT 3
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Practical 1
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Practical 2
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Practical 3
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Average
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student, index) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {student.admissionNumber}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {student.firstName} {student.middleName} {student.lastName}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={marksData[student.id]?.cat1 || ''}
                        onChange={(e) => handleMarksChange(student.id, e.target.value)}
                        disabled={selectedAssessment !== 'cat' || assessmentNumber !== 1}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={marksData[student.id]?.cat2 || ''}
                        onChange={(e) => handleMarksChange(student.id, e.target.value)}
                        disabled={selectedAssessment !== 'cat' || assessmentNumber !== 2}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={marksData[student.id]?.cat3 || ''}
                        onChange={(e) => handleMarksChange(student.id, e.target.value)}
                        disabled={selectedAssessment !== 'cat' || assessmentNumber !== 3}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={marksData[student.id]?.practical1 || ''}
                        onChange={(e) => handleMarksChange(student.id, e.target.value)}
                        disabled={selectedAssessment !== 'practical' || assessmentNumber !== 1}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={marksData[student.id]?.practical2 || ''}
                        onChange={(e) => handleMarksChange(student.id, e.target.value)}
                        disabled={selectedAssessment !== 'practical' || assessmentNumber !== 2}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={marksData[student.id]?.practical3 || ''}
                        onChange={(e) => handleMarksChange(student.id, e.target.value)}
                        disabled={selectedAssessment !== 'practical' || assessmentNumber !== 3}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {calculateAverage(student.id)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-gray-500">
          Loading students...
        </div>
      )}

      {!loading && students.length === 0 && selectedSubject && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          No students registered for this subject. Please register students first.
        </div>
      )}
    </div>
  );
}