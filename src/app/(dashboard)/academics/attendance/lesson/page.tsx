// app/(dashboard)/academics/attendance/lesson/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save } from 'lucide-react';
import {
  getClassAttendance,
  bulkRecordAttendance,
} from '@/actions/attendance';
import { getClasses } from '@/actions/class';
import { getSubjects } from '@/actions/subject';

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

interface StudentAttendance {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  status: string;
  attendanceId?: string;
}

export default function LessonAttendancePage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [stage, setStage] = useState('');
  const [room, setRoom] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>(
    {}
  );

  // Load classes and subjects on mount
  useEffect(() => {
    const loadInitialData = async () => {
      const [classesResult, subjectsResult] = await Promise.all([
        getClasses(),
        getSubjects(),
      ]);
      
      if (classesResult.success && Array.isArray(classesResult.data)) {
        setClasses(classesResult.data);
      }
      
      if (subjectsResult.success && Array.isArray(subjectsResult.data)) {
        setSubjects(subjectsResult.data);
      }
    };

    loadInitialData();
  }, []);

  // Memoized loadStudents function to prevent infinite re-renders
  const loadStudents = useCallback(async () => {
    if (!selectedClass || !selectedDate) return;

    setLoading(true);
    try {
      const result = await getClassAttendance(
        selectedClass,
        new Date(selectedDate)
      );
      
      if (result.success && Array.isArray(result.data)) {
        setStudents(result.data);
        
        // Initialize attendance data with existing records
        const initData: Record<string, string> = {};
        result.data.forEach((student: StudentAttendance) => {
          if (student.status !== 'NOT_MARKED') {
            initData[student.id] = student.status;
          }
        });
        setAttendanceData(initData);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedDate]);

  // Load students when class or date changes
  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAll = (status: string) => {
    const newData: Record<string, string> = {};
    students.forEach((student) => {
      newData[student.id] = status;
    });
    setAttendanceData(newData);
  };

  const handleSave = async () => {
    if (!selectedClass || !selectedDate) {
      alert('Please select class and date');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) {
      alert('User not found. Please log in again.');
      return;
    }

    setSaving(true);
    try {     
      const records = Object.entries(attendanceData).map(([studentId, status]) => ({
        date: new Date(selectedDate),
        studentId,
        classId: selectedClass,
        subjectId: selectedSubject || undefined,
        stage: stage || undefined,
        room: room || undefined,
        status: status as 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED',
        recordedBy: user.id,
      }));

      const result = await bulkRecordAttendance(records);
      
      if (result.success) {
        alert('Attendance recorded successfully!');
        // Refresh the attendance data
        loadStudents();
      } else {
        alert(result.error || 'Failed to record attendance');
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to record attendance');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'ABSENT':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'LATE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'EXCUSED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getAttendanceStats = () => {
    const total = students.length;
    const marked = Object.keys(attendanceData).length;
    const present = Object.values(attendanceData).filter((s) => s === 'PRESENT').length;
    const absent = Object.values(attendanceData).filter((s) => s === 'ABSENT').length;
    const late = Object.values(attendanceData).filter((s) => s === 'LATE').length;
    const excused = Object.values(attendanceData).filter((s) => s === 'EXCUSED').length;

    return { total, marked, present, absent, late, excused };
  };

  const stats = getAttendanceStats();

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    // Reset subject when class changes if needed
    if (classId !== selectedClass) {
      setSelectedSubject('');
      setStage('');
      setRoom('');
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    // Clear attendance data when date changes
    if (date !== selectedDate) {
      setAttendanceData({});
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lesson Attendance</h1>
        <nav className="text-sm text-gray-600 mt-1">
          Dashboard &gt; Student Academics &gt; Lesson Attendance
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Attendance Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedClass}
              onChange={(e) => handleClassChange(e.target.value)}
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
              Subject (Optional)
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.code} - {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stage (Optional)
            </label>
            <input
              type="text"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              placeholder="e.g., Year 1, Semester 1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room (Optional)
            </label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g., Lab 1, Room 201"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
            />
          </div>
        </div>

        {/* Refresh button */}
        <div className="mt-4">
          <button
            onClick={loadStudents}
            disabled={!selectedClass || !selectedDate || loading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Refresh Students'}
          </button>
        </div>
      </div>

      {/* Statistics */}
      {students.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.marked}</div>
            <div className="text-sm text-gray-600">Marked</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            <div className="text-sm text-gray-600">Present</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            <div className="text-sm text-gray-600">Absent</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
            <div className="text-sm text-gray-600">Late</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-cyan-600">{stats.excused}</div>
            <div className="text-sm text-gray-600">Excused</div>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      {students.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Mark Attendance</h2>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleMarkAll('PRESENT')}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Mark All Present
              </button>
              <button
                onClick={() => handleMarkAll('ABSENT')}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Mark All Absent
              </button>
              <button
                onClick={() => handleMarkAll('LATE')}
                className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Mark All Late
              </button>
              <button
                onClick={() => handleMarkAll('EXCUSED')}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Mark All Excused
              </button>
              <button
                onClick={handleSave}
                disabled={saving || Object.keys(attendanceData).length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
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
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                    Present
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                    Absent
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                    Late
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                    Excused
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                    Status
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
                    <td className="px-4 py-3 text-center">
                      <input
                        type="radio"
                        name={`attendance-${student.id}`}
                        checked={attendanceData[student.id] === 'PRESENT'}
                        onChange={() => handleAttendanceChange(student.id, 'PRESENT')}
                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="radio"
                        name={`attendance-${student.id}`}
                        checked={attendanceData[student.id] === 'ABSENT'}
                        onChange={() => handleAttendanceChange(student.id, 'ABSENT')}
                        className="w-4 h-4 text-red-600 focus:ring-red-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="radio"
                        name={`attendance-${student.id}`}
                        checked={attendanceData[student.id] === 'LATE'}
                        onChange={() => handleAttendanceChange(student.id, 'LATE')}
                        className="w-4 h-4 text-yellow-600 focus:ring-yellow-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="radio"
                        name={`attendance-${student.id}`}
                        checked={attendanceData[student.id] === 'EXCUSED'}
                        onChange={() => handleAttendanceChange(student.id, 'EXCUSED')}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {attendanceData[student.id] && (
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            attendanceData[student.id]
                          )}`}
                        >
                          {attendanceData[student.id]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-gray-500">Loading students...</div>
      )}

      {!loading && students.length === 0 && selectedClass && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          No students found in this class.
        </div>
      )}
    </div>
  );
}