// app/(dashboard)/academics/timetable/buildings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Building as BuildingIcon } from 'lucide-react';
import { getBuildings, createBuilding, updateBuilding, deleteBuilding } from '@/actions/timetable';

interface Building {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  _count: {
    rooms: number;
  };
}

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    status: 'Active',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBuildings();
  }, []);

  const loadBuildings = async () => {
    setLoading(true);
    try {
      const result = await getBuildings();
      if (result.success && Array.isArray(result.data)) {
        setBuildings(result.data);
      }
    } catch (error) {
      console.error('Error loading buildings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (building?: Building) => {
    if (building) {
      setEditingBuilding(building);
      setFormData({
        title: building.title,
        status: building.status,
      });
    } else {
      setEditingBuilding(null);
      setFormData({
        title: '',
        status: 'Active',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBuilding(null);
    setFormData({
      title: '',
      status: 'Active',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      alert('Please enter a building title');
      return;
    }

    setSaving(true);
    try {
      let result;
      if (editingBuilding) {
        result = await updateBuilding(editingBuilding.id, formData);
      } else {
        result = await createBuilding(formData);
      }

      if (result.success) {
        alert(`Building ${editingBuilding ? 'updated' : 'created'} successfully!`);
        handleCloseModal();
        loadBuildings();
      } else {
        alert(result.error || 'Failed to save building');
      }
    } catch (error) {
      console.error('Error saving building:', error);
      alert('Failed to save building');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this building?')) {
      return;
    }

    try {
      const result = await deleteBuilding(id);
      if (result.success) {
        alert('Building deleted successfully');
        loadBuildings();
      } else {
        alert(result.error || 'Failed to delete building');
      }
    } catch (error) {
      console.error('Error deleting building:', error);
      alert('Failed to delete building');
    }
  };

  const filteredBuildings = buildings.filter((building) =>
    building.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Buildings Management</h1>
        <nav className="text-sm text-gray-600 mt-1">
          Dashboard &gt; Student Academics &gt; Timetable &gt; Buildings
        </nav>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search buildings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 ml-auto"
          >
            <Plus size={18} />
            Add Building
          </button>
        </div>
      </div>

      {/* Buildings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-8 text-center text-gray-500">
            Loading buildings...
          </div>
        ) : filteredBuildings.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500">
            No buildings found. Add your first building to get started.
          </div>
        ) : (
          filteredBuildings.map((building) => (
            <div
              key={building.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-100 rounded-lg">
                    <BuildingIcon className="text-cyan-700" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {building.title}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      building.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {building.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Rooms:</span>
                  <span className="font-semibold text-gray-900">
                    {building._count.rooms}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={() => handleOpenModal(building)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(building.id)}
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
                {editingBuilding ? 'Edit Building' : 'Add New Building'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Building Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Administration Block, Science Block"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                  </select>
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
                    {saving ? 'Saving...' : editingBuilding ? 'Update' : 'Create'}
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