// app/(dashboard)/academics/timetable/schedules/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Calendar } from 'lucide-react';
import { 
  getTimetableEntries, 
  createTimetableEntry, 
  updateTimetableEntry, 
  deleteTimetableEntry 
} from '@/actions/timetable';
import { getClasses } from '@/actions/class';
import { getSubjects } from '@/actions/subject';
import { getTutors } from '@/actions/tutor';
import { getRooms } from '@/actions/timetable';

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

interface Tutor {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
}

interface Building {
  title: string;
}

interface Room {
  id: string;
  title: string;
  building: Building;
}

interface TimetableEntry {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  class: {
    id: string;
    code: string;
    name: string;
  };
  subject: {
    code: string;
    name: string;
  };
  tutor: {
    firstName: string;
    lastName: string;
  } | null;
  room: Room | null;
}

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

export default function TimetableSchedulesPage() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [filterClass, setFilterClass] = useState('');
  const [formData, setFormData] = useState({
    classId: '',
    subjectId: '',
    tutorId: '',
    roomId: '',
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '09:00',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadEntries();
  }, [filterClass]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [classesRes, subjectsRes, tutorsRes, roomsRes] = await Promise.all([
        getClasses(),
        getSubjects({ page: 1, limit: 200 }),
        getTutors({ page: 1, limit: 200 }),
        getRooms(),
      ]);

      if (classesRes.success && Array.isArray(classesRes.data)) {
        setClasses(classesRes.data);
      }
      if (subjectsRes.success && Array.isArray(subjectsRes.data)) {
        setSubjects(subjectsRes.data);
      }
      if (tutorsRes.success && Array.isArray(tutorsRes.data)) {
        setTutors(tutorsRes.data);
      }
      if (roomsRes.success && Array.isArray(roomsRes.data)) {
        setRooms(roomsRes.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEntries = async () => {
    try {
      const result = await getTimetableEntries(filterClass || undefined);
      if (result.success && Array.isArray(result.data)) {
        setEntries(result.data);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const handleOpenModal = (entry?: TimetableEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        classId: entry.class.id,
        subjectId: entry.subject.code,
        tutorId: entry.tutor ? `${entry.tutor.firstName} ${entry.tutor.lastName}` : '',
        roomId: entry.room?.id || '',
        dayOfWeek: entry.dayOfWeek,
        startTime: entry.startTime.slice(0, 5),
        endTime: entry.endTime.slice(0, 5),
      });
    } else {
      setEditingEntry(null);
      setFormData({
        classId: filterClass || (classes[0]?.id || ''),
        subjectId: '',
        tutorId: '',
        roomId: '',
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '09:00',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEntry(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.classId || !formData.subjectId) {
      alert('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const submitData = {
        classId: formData.classId,
        subjectId: formData.subjectId,
        tutorId: formData.tutorId || null,
        roomId: formData.roomId || null,
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
      };

      let result;
      if (editingEntry) {
        result = await updateTimetableEntry(editingEntry.id, submitData);
      } else {
        result = await createTimetableEntry(submitData);
      }

      if (result.success) {
        alert(`Schedule ${editingEntry ? 'updated' : 'created'} successfully!`);
        handleCloseModal();
        loadEntries();
      } else {
        alert(result.error || 'Failed to save schedule');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule entry?')) {
      return;
    }

    try {
      const result = await deleteTimetableEntry(id);
      if (result.success) {
        alert('Schedule deleted successfully');
        loadEntries();
      } else {
        alert(result.error || 'Failed to delete schedule');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule');
    }
  };

  const getDayLabel = (day: number) => {
    return DAYS.find(d => d.value === day)?.label || 'Unknown';
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Timetable Schedules</h1>
        <nav className="text-sm text-gray-600 mt-1">
          Dashboard &gt; Student Academics &gt; Timetable &gt; Schedules
        </nav>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Class
            </label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
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
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 mt-auto"
          >
            <Plus size={18} />
            Add Schedule
          </button>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading schedules...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No schedule entries found. Add your first entry to build the timetable.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Class
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Day
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Tutor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Room
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {entry.class.code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {entry.subject.code} - {entry.subject.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {getDayLabel(entry.dayOfWeek)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {entry.tutor 
                        ? `${entry.tutor.firstName} ${entry.tutor.lastName}`
                        : '-'
                      }
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {entry.room 
                        ? `${entry.room.building.title} - ${entry.room.title}`
                        : '-'
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(entry)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingEntry ? 'Edit Schedule' : 'Add New Schedule'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.classId}
                      onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                      required
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
                      value={formData.subjectId}
                      onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                      required
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
                      Day of Week <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.dayOfWeek}
                      onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                      required
                    >
                      {DAYS.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tutor
                    </label>
                    <select
                      value={formData.tutorId}
                      onChange={(e) => setFormData({ ...formData, tutorId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                    >
                      <option value="">No Tutor Assigned</option>
                      {tutors.map((tutor) => (
                        <option key={tutor.id} value={tutor.id}>
                          {tutor.employeeCode} - {tutor.firstName} {tutor.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room
                    </label>
                    <select
                      value={formData.roomId}
                      onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                    >
                      <option value="">No Room Assigned</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.building.title} - {room.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : editingEntry ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}