// app/(dashboard)/academics/timetable/time-table/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Download, Printer, Filter, Calendar } from 'lucide-react';
import { getTimetableEntries } from '@/actions/timetable';
import { getClasses } from '@/actions/class';

interface Class {
  id: string;
  code: string;
  name: string;
}

interface Building {
  title: string;
}

interface Room {
  title: string;
  building: Building;
}

interface Tutor {
  firstName: string;
  lastName: string;
}

interface Subject {
  code: string;
  name: string;
}

interface ClassInfo {
  code: string;
  name: string;
}

interface TimetableEntry {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  class: ClassInfo;
  subject: Subject;
  tutor: Tutor | null;
  room: (Room & { building: Building }) | null;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00'
];

export default function TimetablePage() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadTimetable();
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    const result = await getClasses();
    if (result.success && Array.isArray(result.data)) {
      setClasses(result.data);
      if (result.data.length > 0) {
        setSelectedClass(result.data[0].id);
      }
    }
  };

  const loadTimetable = async () => {
    setLoading(true);
    try {
      const result = await getTimetableEntries(selectedClass);
      if (result.success && Array.isArray(result.data)) {
        setEntries(result.data);
      }
    } catch (error) {
      console.error('Error loading timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEntriesForDayAndTime = (day: number, time: string) => {
    return entries.filter((entry) => {
      if (entry.dayOfWeek !== day) return false;
      
      const entryStart = entry.startTime.slice(0, 5);
      return entryStart === time;
    });
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedClassInfo = classes.find(c => c.id === selectedClass);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="print:hidden">
        <h1 className="text-3xl font-bold text-gray-900">Class Timetable</h1>
        <nav className="text-sm text-gray-600 mt-1">
          Dashboard &gt; Student Academics &gt; Timetable &gt; View Timetable
        </nav>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4 print:hidden">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.code} - {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <Printer size={18} />
              Print
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800"
            >
              <Download size={18} />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Timetable Header for Print */}
      <div className="hidden print:block bg-white p-6 mb-4">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold">Kongoni Technical and Vocational College</h1>
          <p className="text-gray-600 mt-1">Class Timetable</p>
        </div>
        {selectedClassInfo && (
          <div className="border-t border-b py-3 mt-4">
            <div className="flex justify-between">
              <div>
                <span className="font-semibold">Class:</span> {selectedClassInfo.code} - {selectedClassInfo.name}
              </div>
              <div>
                <span className="font-semibold">Academic Year:</span> 2024/2025
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden print:shadow-none">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading timetable...</div>
        ) : !selectedClass ? (
          <div className="p-8 text-center text-gray-500">
            Please select a class to view timetable
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No timetable entries found for this class. Create schedule entries to build the timetable.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-cyan-700 text-white">
                  <th className="border border-gray-300 px-3 py-3 text-left font-semibold w-24">
                    Time
                  </th>
                  {DAYS.map((day) => (
                    <th key={day} className="border border-gray-300 px-3 py-3 text-center font-semibold">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((time, timeIndex) => (
                  <tr key={time} className={timeIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="border border-gray-300 px-3 py-4 font-medium text-sm text-gray-700">
                      {time}
                    </td>
                    {DAYS.map((day, dayIndex) => {
                      const dayEntries = getEntriesForDayAndTime(dayIndex + 1, time);
                      
                      return (
                        <td key={day} className="border border-gray-300 px-2 py-2 align-top">
                          {dayEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className="bg-blue-50 border-l-4 border-blue-500 p-2 mb-2 last:mb-0 rounded"
                            >
                              <div className="font-semibold text-sm text-blue-900">
                                {entry.subject.code}
                              </div>
                              <div className="text-xs text-gray-700 mt-1">
                                {entry.subject.name}
                              </div>
                              {entry.tutor && (
                                <div className="text-xs text-gray-600 mt-1">
                                  👨‍🏫 {entry.tutor.firstName} {entry.tutor.lastName}
                                </div>
                              )}
                              {entry.room && (
                                <div className="text-xs text-gray-600 mt-1">
                                  📍 {entry.room.building.title} - {entry.room.title}
                                </div>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                              </div>
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      {entries.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 print:shadow-none">
          <h3 className="font-semibold text-gray-900 mb-3">Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Regular Class</span>
            </div>
            <div className="flex items-center gap-2">
              <span>👨‍🏫</span>
              <span>Tutor/Instructor</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span>Room Location</span>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          table {
            page-break-inside: avoid;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  );
}