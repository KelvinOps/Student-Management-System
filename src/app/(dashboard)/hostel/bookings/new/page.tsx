// app/(dashboard)/hostel/bookings/new/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader } from 'lucide-react';
import { searchStudents } from '@/actions/student';
import { getHostelBlocks, getRoomsByBlock, getAvailableRooms, createBooking } from '@/actions/hostel';

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string | null;
  class: {
    code: string;
  } | null;
}

interface Block {
  id: string;
  blockNumber: number;
  gender: string;
  floors: Array<{
    id: string;
    floorLevel: string;
    floorNumber: number;
  }>;
}

interface Floor {
  id: string;
  floorLevel: string;
  floorNumber: number;
}

interface Room {
  id: string;
  roomNumber: number;
  floor: {
    floorLevel: string;
  };
  beds: Array<{
    id: string;
    bedNumber: number;
    isOccupied: boolean;
  }>;
}

interface Bed {
  id: string;
  bedNumber: number;
  isOccupied: boolean;
}

export default function NewBookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [studentSuggestions, setStudentSuggestions] = useState<Student[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [selectedBed, setSelectedBed] = useState<string>('');

  const [formData, setFormData] = useState({
    academicYear: new Date().getFullYear().toString(),
    session: 'JAN_APRIL',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    amount: 0,
    notes: '',
  });

  useEffect(() => {
    loadBlocks();
  }, []);

  useEffect(() => {
    if (selectedBlock) {
      loadRoomsByBlock();
    }
  }, [selectedBlock, selectedFloor]);

  useEffect(() => {
    if (selectedRoom) {
      const room = rooms.find((r) => r.id === selectedRoom);
      if (room) {
        const available = room.beds.filter((bed) => !bed.isOccupied);
        setAvailableBeds(available);
        if (available.length > 0) {
          setSelectedBed(available[0].id);
        }
      }
    }
  }, [selectedRoom]);

  const loadBlocks = async () => {
    try {
      setLoading(true);
      const result = await getHostelBlocks({
        page: 1,
        limit: 30,
      });

      if (result.success && Array.isArray(result.data)) {
        setBlocks(result.data);
      }
    } catch (error) {
      console.error('Error loading blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoomsByBlock = async () => {
    if (!selectedBlock) return;

    try {
      const result = await getRoomsByBlock(selectedBlock, {
        floorLevel: selectedFloor || undefined,
        page: 1,
        limit: 100,
      });

      if (result.success && Array.isArray(result.data)) {
        setRooms(result.data);
        const floorSet = new Set(
          result.data.map((room) => room.floor.floorLevel)
        );
        const blockData = blocks.find((b) => b.id === selectedBlock);
        if (blockData) {
          setFloors(blockData.floors);
        }
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const handleSearchStudent = async (value: string) => {
    setSearchQuery(value);

    if (value.trim().length < 2) {
      setStudentSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const result = await searchStudents(value);
      if (result.success && Array.isArray(result.data)) {
        setStudentSuggestions(result.data);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error searching students:', error);
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setSearchQuery(`${student.firstName} ${student.lastName}`);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) {
      alert('Please select a student');
      return;
    }

    if (!selectedBlock || !selectedFloor || !selectedRoom || !selectedBed) {
      alert('Please select block, floor, room, and bed');
      return;
    }

    if (!formData.checkInDate || !formData.checkOutDate) {
      alert('Please select check-in and check-out dates');
      return;
    }

    if (formData.amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createBooking({
        studentId: selectedStudent.id,
        blockId: selectedBlock,
        floorId: selectedFloor,
        roomId: selectedRoom,
        bedId: selectedBed,
        academicYear: formData.academicYear,
        session: formData.session,
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        amount: parseFloat(formData.amount.toString()),
        notes: formData.notes,
      });

      if (result.success) {
        alert('Booking created successfully');
        router.push('/hostel/bookings');
      } else {
        alert(result.error || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error creating booking');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBlockData = blocks.find((b) => b.id === selectedBlock);
  const selectedRoomData = rooms.find((r) => r.id === selectedRoom);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/hostel/bookings" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Hostel Booking</h1>
          <nav className="text-sm text-gray-600 mt-1">
            Hostel Management &gt; Bookings &gt; New Booking
          </nav>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Student</h2>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Student
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter admission number or name..."
                value={searchQuery}
                onChange={(e) => handleSearchStudent(e.target.value)}
                onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
              />

              {showSuggestions && studentSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 mt-1">
                  {studentSuggestions.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => handleSelectStudent(student)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <p className="font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{student.admissionNumber}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedStudent && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Selected:</strong> {selectedStudent.firstName} {selectedStudent.lastName} (
                {selectedStudent.admissionNumber})
              </p>
            </div>
          )}
        </div>

        {/* Room Selection */}
        {selectedStudent && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Select Room</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Block
                </label>
                <select
                  value={selectedBlock}
                  onChange={(e) => {
                    setSelectedBlock(e.target.value);
                    setSelectedFloor('');
                    setSelectedRoom('');
                    setSelectedBed('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                >
                  <option value="">-- Select Block --</option>
                  {blocks.map((block) => (
                    <option key={block.id} value={block.id}>
                      Block {block.blockNumber} ({block.gender})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Floor
                </label>
                <select
                  value={selectedFloor}
                  onChange={(e) => {
                    setSelectedFloor(e.target.value);
                    setSelectedRoom('');
                    setSelectedBed('');
                  }}
                  disabled={!selectedBlock}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 disabled:opacity-50"
                >
                  <option value="">-- Select Floor --</option>
                  {floors.map((floor) => (
                    <option key={floor.id} value={floor.id}>
                      {floor.floorLevel} Floor
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room
                </label>
                <select
                  value={selectedRoom}
                  onChange={(e) => {
                    setSelectedRoom(e.target.value);
                    setSelectedBed('');
                  }}
                  disabled={!selectedFloor}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 disabled:opacity-50"
                >
                  <option value="">-- Select Room --</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Room {room.roomNumber} ({room.beds.filter((b) => !b.isOccupied).length}/2 available)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedRoom && availableBeds.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bed Number
                </label>
                <div className="flex gap-2">
                  {availableBeds.map((bed) => (
                    <button
                      key={bed.id}
                      type="button"
                      onClick={() => setSelectedBed(bed.id)}
                      className={`px-4 py-2 rounded border-2 font-medium transition ${
                        selectedBed === bed.id
                          ? 'border-cyan-700 bg-cyan-50 text-cyan-700'
                          : 'border-gray-300 hover:border-cyan-400'
                      }`}
                    >
                      Bed {bed.bedNumber}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedRoom && availableBeds.length === 0 && (
              <p className="text-red-600 text-sm">No available beds in this room</p>
            )}

            {selectedBlockData && selectedRoomData && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Selected:</strong> Block {selectedBlockData.blockNumber} - {selectedRoomData.floor.floorLevel} Floor - Room {selectedRoomData.roomNumber}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Booking Details */}
        {selectedStudent && selectedRoom && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Booking Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={formData.academicYear}
                  onChange={(e) =>
                    setFormData({ ...formData, academicYear: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session
                </label>
                <select
                  value={formData.session}
                  onChange={(e) =>
                    setFormData({ ...formData, session: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="JAN_APRIL">January - April</option>
                  <option value="MAY_AUGUST">May - August</option>
                  <option value="SEPT_DEC">September - December</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-in Date
                </label>
                <input
                  type="date"
                  value={formData.checkInDate}
                  onChange={(e) =>
                    setFormData({ ...formData, checkInDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-out Date
                </label>
                <input
                  type="date"
                  value={formData.checkOutDate}
                  onChange={(e) =>
                    setFormData({ ...formData, checkOutDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Amount (KES)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                  min="0"
                  step="100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Any special requests or notes..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || !selectedStudent || !selectedRoom}
            className="flex items-center gap-2 px-6 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader size={18} className="animate-spin" />}
            Create Booking
          </button>
          <Link
            href="/hostel/bookings"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}