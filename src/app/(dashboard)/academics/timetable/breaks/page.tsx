// app/(dashboard)/academics/timetable/breaks/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Coffee } from 'lucide-react';
import { getBreaks, createBreak, updateBreak, deleteBreak } from '@/actions/timetable';

interface Break {
  id: string;
  srNo: number;
  title: string;
  startTime: string;
  endTime: string;
}

export default function BreaksPage() {
  const [breaks, setBreaks] = useState<Break[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBreak, setEditingBreak] = useState<Break | null>(null);
  const [formData, setFormData] = useState({
    srNo: 1,
    title: '',
    startTime: '10:00',
    endTime: '10:15',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBreaks();
  }, []);

  const loadBreaks = async () => {
    setLoading(true);
    try {
      const result = await getBreaks();
      if (result.success && Array.isArray(result.data)) {
        setBreaks(result.data);
      }
    } catch (error) {
      console.error('Error loading breaks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (breakItem?: Break) => {
    if (breakItem) {
      setEditingBreak(breakItem);
      setFormData({
        srNo: breakItem.srNo,
        title: breakItem.title,
        startTime: breakItem.startTime.slice(0, 5),
        endTime: breakItem.endTime.slice(0, 5),
      });
    } else {
      setEditingBreak(null);
      const nextSrNo = breaks.length > 0 
        ? Math.max(...breaks.map(b => b.srNo)) + 1 
        : 1;
      setFormData({
        srNo: nextSrNo,
        title: '',
        startTime: '10:00',
        endTime: '10:15',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBreak(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.startTime || !formData.endTime) {
      alert('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      let result;
      if (editingBreak) {
        result = await updateBreak(editingBreak.id, formData);
      } else {
        result = await createBreak(formData);
      }

      if (result.success) {
        alert(`Break ${editingBreak ? 'updated' : 'created'} successfully!`);
        handleCloseModal();
        loadBreaks();
      } else {
        alert(result.error || 'Failed to save break');
      }
    } catch (error) {
      console.error('Error saving break:', error);
      alert('Failed to save break');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this break?')) {
      return;
    }

    try {
      const result = await deleteBreak(id);
      if (result.success) {
        alert('Break deleted successfully');
        loadBreaks();
      } else {
        alert(result.error || 'Failed to delete break');
      }
    } catch (error) {
      console.error('Error deleting break:', error);
      alert('Failed to delete break');
    }
  };

  const calculateDuration = (start: string, end: string) => {
    const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
    const endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
    const duration = endMinutes - startMinutes;
    return `${duration} mins`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Break Times Management</h1>
        <nav className="text-sm text-gray-600 mt-1">
          Dashboard &gt; Student Academics &gt; Timetable &gt; Breaks
        </nav>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center">
          <p className="text-gray-600">
            Manage break times and intervals for the timetable
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800"
          >
            <Plus size={18} />
            Add Break
          </button>
        </div>
      </div>

      {/* Breaks Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-8 text-center text-gray-500">
            Loading breaks...
          </div>
        ) : breaks.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500">
            No breaks configured. Add your first break time.
          </div>
        ) : (
          breaks.map((breakItem) => (
            <div
              key={breakItem.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Coffee className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      Break #{breakItem.srNo}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {breakItem.title}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Start Time:</span>
                  <span className="font-semibold text-gray-900">
                    {breakItem.startTime.slice(0, 5)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">End Time:</span>
                  <span className="font-semibold text-gray-900">
                    {breakItem.endTime.slice(0, 5)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold text-gray-900">
                    {calculateDuration(breakItem.startTime, breakItem.endTime)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={() => handleOpenModal(breakItem)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(breakItem.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingBreak ? 'Edit Break' : 'Add New Break'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Serial Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.srNo}
                    onChange={(e) => setFormData({ ...formData, srNo: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Break Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Morning Break, Lunch Break, Tea Break"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    {saving ? 'Saving...' : editingBreak ? 'Update' : 'Create'}
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