// app/(dashboard)/academics/exams/transcripts/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Search, Download, Printer } from 'lucide-react';
import { generateStudentTranscript } from '@/actions/exam'; // Fixed: removed unused imports
import { getStudents } from '@/actions/student';

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  gender: string;
  dateOfBirth: Date;
  class?: {
    code: string;
    name: string;
    programme?: {
      name: string;
      code: string;
    };
  };
  programme?: {
    name: string;
    code: string;
  };
  department?: {
    name: string;
    code: string;
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

// Local synchronous versions of calculateGrade and calculateCompetence
const calculateGradeSync = (score: number): string => {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'E';
};

const calculateCompetenceSync = (score: number): string => {
  if (score >= 80) return 'C';
  if (score >= 60) return 'P';
  return 'I';
};

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
    try {
      const result = await getStudents({ page: 1, limit: 1000 });
      if (result.success && Array.isArray(result.data)) {
        setStudents(result.data);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadTranscript = async (studentId: string) => {
    if (!studentId) return;

    setLoading(true);
    try {
      const result = await generateStudentTranscript(studentId);
      if (result.success && result.data) {
        // Type assertion to handle the API response
        setTranscriptData(result.data as unknown as TranscriptData);
      } else {
        alert(result.error || 'Failed to load transcript');
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
    if (studentId) {
      loadTranscript(studentId);
    } else {
      setTranscriptData(null);
    }
  };

  const calculateSessionAverage = (marks: MarksEntry[]) => {
    const totals = marks.map((m) => m.total).filter((t): t is number => t !== null);
    if (totals.length === 0) return 0;
    const sum = totals.reduce((a, b) => a + b, 0);
    return sum / totals.length;
  };

  const calculateSessionCredits = (marks: MarksEntry[]) => {
    return marks.reduce((total, mark) => total + (mark.subject?.credits || 0), 0);
  };

  const calculateCumulativeGPA = () => {
    if (!transcriptData || Object.keys(transcriptData.marksBySession).length === 0) return 0;

    let totalGradePoints = 0;
    let totalCredits = 0;

    Object.values(transcriptData.marksBySession).forEach((marks) => {
      marks.forEach((mark) => {
        if (mark.total !== null && (mark.subject?.credits || 0) > 0) {
          // Convert percentage to GPA (4.0 scale)
          const gpa = mark.total >= 90 ? 4.0 :
                      mark.total >= 80 ? 3.5 :
                      mark.total >= 70 ? 3.0 :
                      mark.total >= 60 ? 2.5 :
                      mark.total >= 50 ? 2.0 : 0.0;
          
          totalGradePoints += gpa * (mark.subject?.credits || 0);
          totalCredits += (mark.subject?.credits || 0);
        }
      });
    });

    return totalCredits > 0 ? totalGradePoints / totalCredits : 0;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // TODO: Implement PDF download
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

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'text-green-700';
      case 'A': return 'text-green-600';
      case 'B+': return 'text-blue-600';
      case 'B': return 'text-blue-500';
      case 'C+': return 'text-yellow-600';
      case 'C': return 'text-yellow-500';
      case 'D': return 'text-orange-500';
      case 'E': return 'text-red-600';
      default: return 'text-gray-700';
    }
  };

  const getCompetenceColor = (competence: string) => {
    switch (competence) {
      case 'C': return 'text-green-600';
      case 'P': return 'text-yellow-600';
      case 'I': return 'text-red-600';
      default: return 'text-gray-700';
    }
  };

  // Helper functions to safely access nested properties
  const getProgrammeName = () => {
    if (!transcriptData?.student) return 'N/A';
    return transcriptData.student.programme?.name || 
           transcriptData.student.class?.programme?.name || 
           'N/A';
  };

  const getProgrammeCode = () => {
    if (!transcriptData?.student) return 'N/A';
    return transcriptData.student.programme?.code || 
           transcriptData.student.class?.programme?.code || 
           'N/A';
  };

  const getDepartmentName = () => {
    if (!transcriptData?.student) return 'N/A';
    return transcriptData.student.department?.name || 'N/A';
  };

  const getDepartmentCode = () => {
    if (!transcriptData?.student) return 'N/A';
    return transcriptData.student.department?.code || 'N/A';
  };

  const getClassCode = () => {
    if (!transcriptData?.student) return 'N/A';
    return transcriptData.student.class?.code || 'N/A';
  };

  const getClassName = () => {
    if (!transcriptData?.student) return 'N/A';
    return transcriptData.student.class?.name || 'N/A';
  };

  const getStudentName = () => {
    if (!transcriptData?.student) return '';
    const { firstName, middleName, lastName } = transcriptData.student;
    return `${firstName} ${middleName || ''} ${lastName}`.trim();
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
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
              disabled={loading}
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
              className="flex items-center gap-2 px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 transition-colors"
            >
              <Printer size={18} />
              Print Transcript
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Download size={18} />
              Download PDF
            </button>
          </div>
        )}
      </div>

      {/* Transcript Content */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-700"></div>
          <p className="mt-2 text-gray-500">Loading transcript...</p>
        </div>
      )}

      {!loading && transcriptData && (
        <div className="bg-white rounded-lg shadow p-8 print:shadow-none print:p-0">
          {/* Header */}
          <div className="text-center border-b pb-6 mb-6">
            <div className="flex items-center justify-center gap-4 mb-4">
              {/* College Logo/Stamp */}
              <div className="w-16 h-16 border-2 border-cyan-700 rounded-full flex items-center justify-center">
                <span className="text-cyan-700 font-bold text-xs">KTVC</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-cyan-700">
                  KONGONI TECHNICAL AND VOCATIONAL COLLEGE
                </h1>
                <p className="text-lg font-semibold mt-2">ACADEMIC TRANSCRIPT</p>
                <p className="text-sm text-gray-600 mt-1">Official Record of Academic Performance</p>
              </div>
            </div>
          </div>

          {/* Student Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 print:grid-cols-2">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3 border-b pb-2">Student Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Admission Number:</span>
                    <span className="font-bold">{transcriptData.student.admissionNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Name:</span>
                    <span>{getStudentName()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Gender:</span>
                    <span>{transcriptData.student.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Date of Birth:</span>
                    <span>{formatDate(transcriptData.student.dateOfBirth)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3 border-b pb-2">Programme Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Department:</span>
                    <span>{getDepartmentName()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Department Code:</span>
                    <span>{getDepartmentCode()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Programme:</span>
                    <span className="font-medium">{getProgrammeName()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Programme Code:</span>
                    <span>{getProgrammeCode()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Current Class:</span>
                    <span>{getClassCode()} - {getClassName()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="mb-8 p-4 bg-cyan-50 rounded-lg print:bg-white print:border">
            <h3 className="font-semibold text-gray-900 mb-4">Academic Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-cyan-700">
                  {Object.keys(transcriptData.marksBySession).length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Subjects</p>
                <p className="text-2xl font-bold text-cyan-700">
                  {Object.values(transcriptData.marksBySession).flat().length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Credits</p>
                <p className="text-2xl font-bold text-cyan-700">
                  {Object.values(transcriptData.marksBySession).reduce(
                    (total, marks) => total + calculateSessionCredits(marks), 0
                  )}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Cumulative GPA</p>
                <p className="text-2xl font-bold text-cyan-700">
                  {calculateCumulativeGPA().toFixed(2)} / 4.0
                </p>
              </div>
            </div>
          </div>

          {/* Academic Record by Session */}
          <div className="space-y-8">
            <h3 className="font-semibold text-gray-900 text-lg border-b pb-2">
              Academic Performance
            </h3>

            {Object.entries(transcriptData.marksBySession).map(([session, marks]) => {
              const sessionAverage = calculateSessionAverage(marks);
              const sessionCredits = calculateSessionCredits(marks);
              const sessionGrade = calculateGradeSync(sessionAverage);
              
              return (
                <div key={session} className="print-break-avoid mb-8">
                  <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800">
                      {formatSession(session)}
                    </h4>
                    <div className="text-sm">
                      <span className="font-medium mr-4">
                        Average: <span className="font-bold">{sessionAverage.toFixed(2)}%</span>
                      </span>
                      <span className="font-medium mr-4">
                        Grade: <span className={`font-bold ${getGradeColor(sessionGrade)}`}>{sessionGrade}</span>
                      </span>
                      <span className="font-medium">
                        Credits: <span className="font-bold">{sessionCredits}</span>
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-gray-300 px-3 py-2 text-left">Code</th>
                          <th className="border border-gray-300 px-3 py-2 text-left">Subject</th>
                          <th className="border border-gray-300 px-3 py-2 text-center">Credits</th>
                          <th className="border border-gray-300 px-3 py-2 text-center">CAT</th>
                          <th className="border border-gray-300 px-3 py-2 text-center">Practical</th>
                          <th className="border border-gray-300 px-3 py-2 text-center">Total</th>
                          <th className="border border-gray-300 px-3 py-2 text-center">Grade</th>
                          <th className="border border-gray-300 px-3 py-2 text-center">Competence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marks.map((mark) => {
                          const grade = mark.total !== null ? calculateGradeSync(mark.total) : '-';
                          const competence = mark.total !== null ? calculateCompetenceSync(mark.total) : '-';
                          
                          return (
                            <tr key={mark.id} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-3 py-2 font-medium">
                                {mark.subject?.code || 'N/A'}
                              </td>
                              <td className="border border-gray-300 px-3 py-2">
                                {mark.subject?.name || 'N/A'}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-center">
                                {mark.subject?.credits || 0}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-center">
                                {mark.cat?.toFixed(1) || '-'}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-center">
                                {mark.practical?.toFixed(1) || '-'}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-center font-bold">
                                {mark.total?.toFixed(1) || '-'}
                              </td>
                              <td className={`border border-gray-300 px-3 py-2 text-center font-bold ${getGradeColor(grade)}`}>
                                {grade}
                              </td>
                              <td className={`border border-gray-300 px-3 py-2 text-center font-medium ${getCompetenceColor(competence)}`}>
                                {competence}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grading System */}
          <div className="mt-8 pt-6 border-t border-gray-300">
            <h4 className="font-semibold text-gray-900 mb-4">Grading System</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium mb-3 text-gray-800">Grade Scale:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>A+ : 90-100%</span>
                    <span className="text-green-700">Excellent</span>
                  </div>
                  <div className="flex justify-between">
                    <span>A : 80-89%</span>
                    <span className="text-green-600">Very Good</span>
                  </div>
                  <div className="flex justify-between">
                    <span>B+ : 75-79%</span>
                    <span className="text-blue-600">Good</span>
                  </div>
                  <div className="flex justify-between">
                    <span>B : 70-74%</span>
                    <span className="text-blue-500">Above Average</span>
                  </div>
                  <div className="flex justify-between">
                    <span>C+ : 65-69%</span>
                    <span className="text-yellow-600">Average</span>
                  </div>
                  <div className="flex justify-between">
                    <span>C : 60-64%</span>
                    <span className="text-yellow-500">Pass</span>
                  </div>
                  <div className="flex justify-between">
                    <span>D : 50-59%</span>
                    <span className="text-orange-500">Marginal Pass</span>
                  </div>
                  <div className="flex justify-between">
                    <span>E : Below 50%</span>
                    <span className="text-red-600">Fail</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium mb-3 text-gray-800">Competence Levels:</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm"><strong>C : Competent</strong> (80% and above)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm"><strong>P : Progressing</strong> (60-79%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm"><strong>I : Insufficient</strong> (Below 60%)</span>
                  </div>
                  <div className="mt-4 text-xs text-gray-600">
                    <p><strong>Note:</strong> GPA is calculated on a 4.0 scale based on percentage scores.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-400">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Date Issued:</p>
                <p className="font-medium">{formatDate(new Date())}</p>
                <p className="text-xs text-gray-500 mt-4">
                  This is an official transcript issued by Kongoni Technical and Vocational College.
                  Any alteration makes this document invalid.
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="border-t-2 border-gray-800 w-48 mx-auto pt-4">
                  <p className="text-sm font-medium">Authorized Signature</p>
                  <p className="text-xs text-gray-600">Academic Registrar</p>
                </div>
                <div className="border-2 border-dashed border-gray-300 px-6 py-3 rounded-lg">
                  <p className="text-xs text-gray-500">OFFICIAL STAMP</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !transcriptData && selectedStudent && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Transcript Data Available</h3>
          <p className="mb-4">No academic records found for the selected student.</p>
          <p className="text-sm text-gray-400">
            Transcript data will appear once exam results are recorded.
          </p>
        </div>
      )}

      {!loading && !selectedStudent && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          <div className="mx-auto w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mb-4">
            <Search size={24} className="text-cyan-600" />
          </div>
          <h3 className="text-lg font-medium mb-2">Select a Student</h3>
          <p className="mb-4">Choose a student from the dropdown above to view their transcript.</p>
          <p className="text-sm text-gray-400">
            Use the search box to quickly find students by admission number or name.
          </p>
        </div>
      )}
    </div>
  );
}