// app/(dashboard)/academics/attendance/reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Search, Download, Filter, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { getAttendanceReport } from '@/actions/attendance';
import { getClasses } from '@/actions/class';

interface Class {
  id: string;
  code: string;
  name: string;
}

interface AttendanceData {
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    class: {
      code: string;
    };
  };
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}

export default function AttendanceReportsPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [reportData, setReportData] = useState<AttendanceData[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClasses();
    // Set default date range (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  const loadClasses = async () => {
    const result = await getClasses();
    if (result.success && Array.isArray(result.data)) {
      setClasses(result.data);
    }
  };

  const loadReport = async () => {
    if (!startDate || !endDate) {
      alert('Please select date range');
      return;
    }

    setLoading(true);
    try {
      const result = await getAttendanceReport({
        classId: selectedClass || undefined,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });

      if (result.success && Array.isArray(result.data)) {
        setReportData(result.data);
      }
    } catch (error) {
      console.error('Error loading report:', error);
      alert('Failed to load attendance report');
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-blue-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceIcon = (rate: number) => {
    if (rate >= 75) return <TrendingUp size={16} className="text-green-600" />;
    return <TrendingDown size={16} className="text-red-600" />;
  };

  const calculateOverallStats = () => {
    if (reportData.length === 0) return { avgRate: 0, totalPresent: 0, totalAbsent: 0, totalLate: 0 };

    const totalRate = reportData.reduce((sum, d) => sum + d.attendanceRate, 0);
    const totalPresent = reportData.reduce((sum, d) => sum + d.present, 0);
    const totalAbsent = reportData.reduce((sum, d) => sum + d.absent, 0);
    const totalLate = reportData.reduce((sum, d) => sum + d.late, 0);

    return {
      avgRate: (totalRate / reportData.length).toFixed(1),
      totalPresent,
      totalAbsent,
      totalLate,
    };
  };

  const stats = calculateOverallStats();

  const filteredData = reportData.filter((data) =>
    data.student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${data.student.firstName} ${data.student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance Reports</h1>
        <nav className="text-sm text-gray-600 mt-1">
          Dashboard &gt; Student Academics &gt; Attendance Reports
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Report Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class (Optional)
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.code} - {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadReport}
              disabled={loading}
              className="w-full px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {reportData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Attendance</p>
                <p className="text-3xl font-bold text-cyan-700">{stats.avgRate}%</p>
              </div>
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                <TrendingUp className="text-cyan-700" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Present</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalPresent}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Absent</p>
                <p className="text-3xl font-bold text-red-600">{stats.totalAbsent}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Calendar className="text-red-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Late</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.totalLate}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Calendar className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Table */}
      {reportData.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Attendance Report</h2>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                <Download size={18} />
                Export
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Class
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                    Total Days
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
                    Attendance %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((data, index) => (
                  <tr key={data.student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {data.student.admissionNumber}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {data.student.firstName} {data.student.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {data.student.class.code}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700">
                      {data.total}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {data.present}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        {data.absent}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {data.late}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {data.excused}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getAttendanceIcon(data.attendanceRate)}
                        <span className={`font-bold ${getAttendanceColor(data.attendanceRate)}`}>
                          {data.attendanceRate.toFixed(1)}%
                        </span>
                      </div>
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
          Generating attendance report...
        </div>
      )}

      {!loading && reportData.length === 0 && startDate && endDate && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          No attendance data found for the selected period. Click Generate Report to load data.
        </div>
      )}
    </div>
  );
}