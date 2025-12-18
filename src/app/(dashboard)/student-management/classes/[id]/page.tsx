// app/(dashboard)/student-management/classes/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, BookOpen, TrendingUp, Loader2 } from 'lucide-react';
import { getClassById } from '@/actions/class';
import { toast } from 'sonner';

interface StudentData {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string | null;
  avgScore: number;
}

interface ClassDetail {
  id: string;
  code: string;
  name: string;
  branch: string;
  sessionType: string;
  modeOfStudy: string;
  startDate: Date;
  endDate: Date;
  status: string;
  programme: {
    name: string;
    code: string;
    department: {
      name: string;
    };
  };
  students: StudentData[];
  classAverage: number;
  _count: {
    students: number;
    timetableEntries: number;
  };
}

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClassDetail = async () => {
      if (!params.id) return;

      setLoading(true);
      const result = await getClassById(params.id as string);

      if (result.success && result.data) {
        setClassData(result.data as ClassDetail);
      } else {
        toast.error(result.error || 'Failed to fetch class details');
        router.push('/student-management/classes');
      }
      setLoading(false);
    };

    fetchClassDetail();
  }, [params.id, router]); // Added router to dependency array

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-700" />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Class not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{classData.name}</h1>
          <p className="text-gray-600 mt-1">
            {classData.code} • {classData.programme.name} • {classData._count.students} Students
          </p>
        </div>
      </div>

      {/* Class Info Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Class Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Branch</p>
            <p className="font-medium text-gray-900">{classData.branch}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Department</p>
            <p className="font-medium text-gray-900">
              {classData.programme.department.name}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Session Type</p>
            <p className="font-medium text-gray-900">{classData.sessionType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Mode of Study</p>
            <p className="font-medium text-gray-900">{classData.modeOfStudy}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Start Date</p>
            <p className="font-medium text-gray-900">
              {new Date(classData.startDate).toLocaleDateString('en-GB')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">End Date</p>
            <p className="font-medium text-gray-900">
              {new Date(classData.endDate).toLocaleDateString('en-GB')}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Total Students</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{classData._count.students}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Subjects</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {classData._count.timetableEntries}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Class Average</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {classData.classAverage.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Students</h2>
        </div>
        
        {classData.students.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No students enrolled in this class yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Admission No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Average Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {classData.students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {student.admissionNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {student.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {student.phoneNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.avgScore > 0 ? `${student.avgScore.toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(`/student-management/students/${student.id}`)
                        }
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}