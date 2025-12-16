// app/(dashboard)/academics/exams/scheduling/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, Edit, Trash2, Eye } from 'lucide-react';
import {
  getExamSchedules,
  createExamSchedule,
  updateExamSchedule,
  deleteExamSchedule,
} from '@/actions/exam';
import { getClasses } from '@/actions/class';

interface ExamSchedule {
  id: string;
  scheduleType: string;
  session: string;
  examType: string;
  numberOfClasses: number;
  examStartDate: Date;
  examEndDate: Date;
  subjects?: Array<{
    id: string;
    code: string;
    name: string;
  }>;
  _count?: {
    examResults: number;
  };
}

export default function ExamSchedulingPage() {
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ExamSchedule | null>(null);
  const [formData, setFormData] = useState({
    scheduleType: 'end term exam',
    session: 'SEPT_DEC',
    examType: 'End of session',
    numberOfClasses: 1,
    examStartDate: '',
    examEndDate: '',
  });
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({
    session: '',
    scheduleType: '',
  });

  useEffect(() => {
    loadSchedules();
  }, [filters]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const result = await getExamSchedules({
        session: filters.session || undefined,
        scheduleType: filters.scheduleType || undefined,
        page: 1,
        limit: 50,
      });

      if (result.success && Array.isArray(result.data)) {
        setSchedules(result.data);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (schedule?: ExamSchedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        scheduleType: schedule.scheduleType,
        session: schedule.session,
        examType: schedule.examType,
        numberOfClasses: schedule.numberOfClasses,
        examStartDate: new Date(schedule.examStartDate).toISOString().split('T')[0],
        examEndDate: new Date(schedule.examEndDate).toISOString().split('T')[0],
      });
    } else {
      setEditingSchedule(null);
      setFormData({
        scheduleType: 'end term exam',
        session: 'SEPT_DEC',
        examType: 'End of session',
        numberOfClasses: 1,
        examStartDate: '',
        examEndDate: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.examStartDate || !formData.examEndDate) {
      alert('Please fill all required fields');
      return;
    }

    if (new Date(formData.examStartDate) > new Date(formData.examEndDate)) {
      alert('Start date must be before end date');
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...formData,
        examStartDate: new Date(formData.examStartDate),
        examEndDate: new Date(formData.examEndDate),
      };

      let result;
      if (editingSchedule) {
        result = await updateExamSchedule(editingSchedule.id, data);
      } else {
        result = await createExamSchedule(data);
      }

      if (result.success) {
        alert(`Exam schedule ${editingSchedule ? 'updated' : 'created'} successfully!`);
        handleCloseModal();
        loadSchedules();
      } else {
        alert(result.error || 'Failed to save exam schedule');
      }
    } catch (error) {
      console.error('Error saving exam schedule:', error);
      alert('Failed to save exam schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exam schedule?')) {
      return;
    }

    try {
      const result = await deleteExamSchedule(id);
      if (result.success) {
        loadSchedules();
      } else {
        alert('Failed to delete exam schedule');
      }
    } catch (error) {
      console.error('Error deleting exam schedule:', error);
      alert('Failed to delete exam schedule');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatSession = (session: string) => {
    return session.replace(/_/g, ' - ');
  };

  const getSessionBadgeColor = (session: string) => {
    const colors: Record<string, string> = {
      SEPT_DEC: 'bg-blue-100 text-blue-800',
      JAN_APRIL: 'bg-green-100 text-green-800',
      MAY_AUGUST: 'bg-purple-100 text-purple-800',
    };
    return colors[session] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Exam Scheduling</h1>
        <nav className="text-sm text-gray-600 mt-1">
          Dashboard &gt; Student Academics &gt; Exam Scheduling
        </nav>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-3 flex-1">
            <select
              value={filters.session}
              onChange={(e) => setFilters({ ...filters, session: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Sessions</option>
              <option value="SEPT_DEC">Sept - Dec</option>
              <option value="JAN_APRIL">Jan - April</option>
              <option value="MAY_AUGUST">May - August</option>
            </select>

            <select
              value={filters.scheduleType}
              onChange={(e) => setFilters({ ...filters, scheduleType: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Schedule Types</option>
              <option value="end term exam">End Term Exam</option>
              <option value="mid term exam">Mid Term Exam</option>
              <option value="CAT">CAT</option>
            </select>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800"
          >
            <Plus size={18} />
            Schedule Exam
          </button>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading schedules...</div>
        ) : schedules.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No exam schedules found. Create your first exam schedule to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Schedule Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Session
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Exam Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Classes
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Start Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    End Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Results
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {schedule.scheduleType}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSessionBadgeColor(schedule.session)}`}>
                        {formatSession(schedule.session)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {schedule.examType}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {schedule.numberOfClasses}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(schedule.examStartDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(schedule.examEndDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {schedule._count?.examResults || 0} results
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(schedule)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(schedule.id)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingSchedule ? 'Edit Exam Schedule' : 'Create Exam Schedule'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.scheduleType}
                  onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                >
                  <option value="end term exam">End Term Exam</option>
                  <option value="mid term exam">Mid Term Exam</option>
                  <option value="CAT">CAT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.session}
                  onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                >
                  <option value="SEPT_DEC">Sept - Dec</option>
                  <option value="JAN_APRIL">Jan - April</option>
                  <option value="MAY_AUGUST">May - August</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.examType}
                  onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                  placeholder="e.g., End of session"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Classes <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.numberOfClasses}
                  onChange={(e) => setFormData({ ...formData, numberOfClasses: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.examStartDate}
                    onChange={(e) => setFormData({ ...formData, examStartDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.examEndDate}
                    onChange={(e) => setFormData({ ...formData, examEndDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                    required
                  />
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
                  {saving ? 'Saving...' : editingSchedule ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}