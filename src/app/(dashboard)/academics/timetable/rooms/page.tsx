// app/(dashboard)/academics/timetable/rooms/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, DoorOpen } from 'lucide-react';
import { getRooms, createRoom, updateRoom, deleteRoom, getBuildings } from '@/actions/timetable';

interface Building {
  id: string;
  title: string;
  status: string;
}

interface Room {
  id: string;
  title: string;
  roomIncharge: string | null;
  capacity: number | null;
  building: Building;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    buildingId: '',
    roomIncharge: '',
    capacity: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [roomsRes, buildingsRes] = await Promise.all([
        getRooms(),
        getBuildings(),
      ]);

      if (roomsRes.success && Array.isArray(roomsRes.data)) {
        setRooms(roomsRes.data);
      }
      if (buildingsRes.success && Array.isArray(buildingsRes.data)) {
        setBuildings(buildingsRes.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        title: room.title,
        buildingId: room.building.id,
        roomIncharge: room.roomIncharge || '',
        capacity: room.capacity?.toString() || '',
      });
    } else {
      setEditingRoom(null);
      setFormData({
        title: '',
        buildingId: buildings[0]?.id || '',
        roomIncharge: '',
        capacity: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRoom(null);
    setFormData({
      title: '',
      buildingId: '',
      roomIncharge: '',
      capacity: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.buildingId) {
      alert('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const submitData = {
        title: formData.title,
        buildingId: formData.buildingId,
        roomIncharge: formData.roomIncharge || null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
      };

      let result;
      if (editingRoom) {
        result = await updateRoom(editingRoom.id, submitData);
      } else {
        result = await createRoom(submitData);
      }

      if (result.success) {
        alert(`Room ${editingRoom ? 'updated' : 'created'} successfully!`);
        handleCloseModal();
        loadData();
      } else {
        alert(result.error || 'Failed to save room');
      }
    } catch (error) {
      console.error('Error saving room:', error);
      alert('Failed to save room');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room?')) {
      return;
    }

    try {
      const result = await deleteRoom(id);
      if (result.success) {
        alert('Room deleted successfully');
        loadData();
      } else {
        alert(result.error || 'Failed to delete room');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Failed to delete room');
    }
  };

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = 
      room.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.building.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBuilding = !filterBuilding || room.building.id === filterBuilding;

    return matchesSearch && matchesBuilding;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rooms Management</h1>
        <nav className="text-sm text-gray-600 mt-1">
          Dashboard &gt; Student Academics &gt; Timetable &gt; Rooms
        </nav>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
            />
          </div>
          <select
            value={filterBuilding}
            onChange={(e) => setFilterBuilding(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
          >
            <option value="">All Buildings</option>
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.title}
              </option>
            ))}
          </select>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 ml-auto"
          >
            <Plus size={18} />
            Add Room
          </button>
        </div>
      </div>

      {/* Rooms Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading rooms...</div>
        ) : filteredRooms.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No rooms found. Add your first room to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Room Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Building
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Room In-charge
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Capacity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <DoorOpen className="text-cyan-600" size={20} />
                        <span className="text-sm font-medium text-gray-900">
                          {room.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {room.building.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {room.roomIncharge || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {room.capacity ? `${room.capacity} students` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(room)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(room.id)}
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Room 101, Lab A, Lecture Hall 1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Building <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.buildingId}
                    onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                    required
                  >
                    <option value="">Select Building</option>
                    {buildings.map((building) => (
                      <option key={building.id} value={building.id}>
                        {building.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room In-charge
                  </label>
                  <input
                    type="text"
                    value={formData.roomIncharge}
                    onChange={(e) => setFormData({ ...formData, roomIncharge: e.target.value })}
                    placeholder="Name of person responsible"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="Number of students"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                  />
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
                    {saving ? 'Saving...' : editingRoom ? 'Update' : 'Create'}
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