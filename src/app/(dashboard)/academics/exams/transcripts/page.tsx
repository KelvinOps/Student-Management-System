// app/(dashboard)/academics/exams/transcripts/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Search, Download, Printer, FileText } from 'lucide-react';
import { generateStudentTranscript } from '@/actions/exam';
import { getStudents } from '@/actions/student';
import { calculateGrade, calculateCompetence } from '@/actions/exam';

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  gender: string;
  dateOfBirth: Date;
  class: {
    code: string;
    name: string;
  };
  programme: {
    name: string;
    code: string;
  };
  department: {
    name: string;
  };
}

interface MarksEntry {
  id: string;
  session: string;
  scheduleType: string;
  examType: string;
  cat: number | null;
  midTerm: number | null;
  practical: number | null;
  endOfTerm: number | null;
  industrialAttachment: number | null;
  total: number | null;
  subject: {
    code: string;
    name: string;
    credits: number;
  };
}

interface ExamResult {
  id: string;
  session: string;
  academicYear: string;
  term: string;
  totalMarks: number;
  averageMarks: number;
  grade: string;
  position: number | null;
  remarks: string | null;
}

interface TranscriptData {
  student: Student;
  marksBySession: Record<string, MarksEntry[]>;
  examResults: ExamResult[];
}

export default function TranscriptsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const result = await getStudents({ page: 1, limit: 1000 });
    if (result.success && Array.isArray(result.data)) {
      setStudents(result.data);
    }
  };

  const loadTranscript = async (studentId: string) => {
    if (!studentId) return;

    setLoading(true);
    try {
      const result = await generateStudentTranscript(studentId);
      if (result.success && result.data) {
        setTranscriptData(result.data);
      } else {
        alert('Failed to load transcript');
      }
    } catch (error) {
      console.error('Error loading transcript:', error);
      alert('Failed to load transcript');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentChange = (studentId: string) => {
    setSelectedStudent(studentId);
    loadTranscript(studentId);
  };

  const calculateSessionAverage = (marks: MarksEntry[]) => {
    const totals = marks.map((m) => m.total).filter((t): t is number => t !== null);
    if (totals.length === 0) return 0;
    return totals.reduce((a, b) => a + b, 0) / totals.length;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert('PDF download functionality coming soon!');
  };

  const filteredStudents = students.filter((s) =>
    s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatSession = (session: string) => {
    return session.replace(/_/g, ' - ');
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="no-print">
        <h1 className="text-3xl font-bold text-gray-900">Student Transcripts</h1>
        <nav className="text-sm text-gray-600 mt-1">
          Dashboard &gt; Student Academics &gt; Transcripts
        </nav>
      </div>

      {/* Student Selection */}
      <div className="bg-white rounded-lg shadow p-6 no-print">
        <h2 className="text-lg font-semibold mb-4">Select Student</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Student
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by admission no. or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => handleStudentChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
            >
              <option value="">Select Student</option>
              {filteredStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.admissionNumber} - {student.firstName} {student.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {transcriptData && (
          <div className="mt-4 flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800"
            >
              <Printer size={18} />
              Print Transcript
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <Download size={18} />
              Download PDF
            </button>
          </div>
        )}
      </div>

      {/* Transcript Content */}
      {loading && (
        <div className="text-center py-12 text-gray-500">
          Loading transcript...
        </div>
      )}

      {!loading && transcriptData && (
        <div className="bg-white rounded-lg shadow p-8 print:shadow-none">
          {/* Header */}
          <div className="text-center border-b pb-6 mb-6">
            <h1 className="text-2xl font-bold text-cyan-700">
              KONGONI TECHNICAL AND VOCATIONAL COLLEGE
            </h1>
            <p className="text-lg font-semibold mt-2">ACADEMIC TRANSCRIPT</p>
            <p className="text-sm text-gray-600 mt-1">Official Record of Academic Performance</p>
          </div>

          {/* Student Information */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Student Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="font-medium w-40">Admission Number:</span>
                  <span>{transcriptData.student.admissionNumber}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-40">Name:</span>
                  <span>
                    {transcriptData.student.firstName} {transcriptData.student.middleName}{' '}
                    {transcriptData.student.lastName}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-medium w-40">Gender:</span>
                  <span>{transcriptData.student.gender}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-40">Date of Birth:</span>
                  <span>{formatDate(transcriptData.student.dateOfBirth)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Programme Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="font-medium w-40">Department:</span>
                  <span>{transcriptData.student.department.name}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-40">Programme:</span>
                  <span>{transcriptData.student.programme.name}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-40">Programme Code:</span>
                  <span>{transcriptData.student.programme.code}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-40">Current Class:</span>
                  <span>{transcriptData.student.class.code}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Record by Session */}
          <div className="space-y-8">
            <h3 className="font-semibold text-gray-900 text-lg border-b pb-2">
              Academic Performance
            </h3>

            {Object.entries(transcriptData.marksBySession).map(([session, marks]) => (
              <div key={session} className="print-break-avoid">
                <h4 className="font-semibold text-gray-800 mb-3 bg-gray-50 px-4 py-2 rounded">
                  {formatSession(session)}
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border px-3 py-2 text-left">Subject Code</th>
                        <th className="border px-3 py-2 text-left">Subject Name</th>
                        <th className="border px-3 py-2 text-center">Credits</th>
                        <th className="border px-3 py-2 text-center">CAT</th>
                        <th className="border px-3 py-2 text-center">Practical</th>
                        <th className="border px-3 py-2 text-center">Total</th>
                        <th className="border px-3 py-2 text-center">Grade</th>
                        <th className="border px-3 py-2 text-center">Competence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marks.map((mark) => {
                        const grade = mark.total ? calculateGrade(mark.total) : '-';
                        const competence = mark.total ? calculateCompetence(mark.total) : '-';
                        
                        return (
                          <tr key={mark.id}>
                            <td className="border px-3 py-2">{mark.subject.code}</td>
                            <td className="border px-3 py-2">{mark.subject.name}</td>
                            <td className="border px-3 py-2 text-center">{mark.subject.credits}</td>
                            <td className="border px-3 py-2 text-center">
                              {mark.cat?.toFixed(1) || '-'}
                            </td>
                            <td className="border px-3 py-2 text-center">
                              {mark.practical?.toFixed(1) || '-'}
                            </td>
                            <td className="border px-3 py-2 text-center font-semibold">
                              {mark.total?.toFixed(1) || '-'}
                            </td>
                            <td className="border px-3 py-2 text-center font-semibold">
                              {grade}
                            </td>
                            <td className="border px-3 py-2 text-center">{competence}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 font-semibold">
                      <tr>
                        <td colSpan={5} className="border px-3 py-2 text-right">
                          Session Average:
                        </td>
                        <td className="border px-3 py-2 text-center">
                          {calculateSessionAverage(marks).toFixed(2)}%
                        </td>
                        <td colSpan={2} className="border px-3 py-2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Grading System */}
          <div className="mt-8 pt-6 border-t">
            <h4 className="font-semibold text-gray-900 mb-3">Grading System</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium mb-2">Grade Scale:</p>
                <ul className="space-y-1">
                  <li>A+ : 90-100% (Excellent)</li>
                  <li>A : 80-89% (Very Good)</li>
                  <li>B+ : 75-79% (Good)</li>
                  <li>B : 70-74% (Above Average)</li>
                  <li>C+ : 65-69% (Average)</li>
                  <li>C : 60-64% (Pass)</li>
                  <li>D : 50-59% (Marginal Pass)</li>
                  <li>E : Below 50% (Fail)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Competence Levels:</p>
                <ul className="space-y-1">
                  <li>C : Competent (80% and above)</li>
                  <li>P : Progressing (60-79%)</li>
                  <li>I : Insufficient (Below 60%)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-gray-600">Date Issued:</p>
                <p className="font-medium">{formatDate(new Date())}</p>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-gray-800 w-48 mx-auto mt-16 pt-2">
                  <p className="text-sm font-medium">Authorized Signature</p>
                  <p className="text-xs text-gray-600">Academic Registrar</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stamp Area */}
          <div className="mt-8 text-center">
            <div className="inline-block border-2 border-gray-300 rounded-lg px-8 py-4">
              <p className="text-sm text-gray-500">OFFICIAL STAMP</p>
            </div>
          </div>
        </div>
      )}

      {!loading && !transcriptData && selectedStudent && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          No transcript data available for this student.
        </div>
      )}
    </div>
  );
}