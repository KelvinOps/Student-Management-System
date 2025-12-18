// app/(dashboard)/hostel/bookings/new/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader } from 'lucide-react';
import { searchStudents } from '@/actions/student';
import { getHostelBlocks, getRoomsByBlock, createBooking } from '@/actions/hostel';
import type { FloorLevel } from '@prisma/client'; // Import directly from Prisma

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

  const loadBlocks = useCallback(async () => {
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
  }, []);

  const loadRoomsByBlock = useCallback(async () => {
    if (!selectedBlock) return;

    try {
      // Get the floorLevel from the selected floor ID
      let floorLevel: FloorLevel | undefined = undefined;
      if (selectedFloor) {
        const floor = floors.find(f => f.id === selectedFloor);
        if (floor) {
          // Type assertion since we know floorLevel should match FloorLevel type
          floorLevel = floor.floorLevel as FloorLevel;
        }
      }

      const result = await getRoomsByBlock(selectedBlock, {
        floorLevel: floorLevel,
        page: 1,
        limit: 100,
      });

      if (result.success && Array.isArray(result.data)) {
        setRooms(result.data);
        const blockData = blocks.find((b) => b.id === selectedBlock);
        if (blockData) {
          setFloors(blockData.floors);
        }
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  }, [selectedBlock, selectedFloor, floors, blocks]);

  const updateAvailableBeds = useCallback(() => {
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
  }, [selectedRoom, rooms]);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  useEffect(() => {
    if (selectedBlock) {
      loadRoomsByBlock();
    }
  }, [selectedBlock, selectedFloor, loadRoomsByBlock]);

  useEffect(() => {
    updateAvailableBeds();
  }, [updateAvailableBeds]);

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
        checkInDate: new Date(formData.checkInDate),
        checkOutDate: new Date(formData.checkOutDate),
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

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center p-6 bg-white rounded-lg shadow">
          <Loader className="w-6 h-6 animate-spin text-cyan-700" />
          <span className="ml-2 text-gray-600">Loading hostel blocks...</span>
        </div>
      )}

      {/* Form */}
      {!loading && (
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
                  disabled={loading}
                />

                {showSuggestions && studentSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 mt-1 max-h-60 overflow-y-auto">
                    {studentSuggestions.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => handleSelectStudent(student)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                      >
                        <p className="font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                          {student.middleName && ` ${student.middleName}`}
                        </p>
                        <p className="text-sm text-gray-600">{student.admissionNumber}</p>
                        {student.class && (
                          <p className="text-xs text-gray-500">Class: {student.class.code}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedStudent && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                      {selectedStudent.middleName && ` ${selectedStudent.middleName}`}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Admission: {selectedStudent.admissionNumber}
                      {selectedStudent.class && ` • Class: ${selectedStudent.class.code}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudent(null);
                      setSearchQuery('');
                    }}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Clear
                  </button>
                </div>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent transition-colors"
                    disabled={loading}
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
                    disabled={!selectedBlock || loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Select Floor --</option>
                    {floors.map((floor) => (
                      <option key={floor.id} value={floor.id}>
                        {floor.floorLevel} Floor (Level {floor.floorNumber})
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
                    disabled={!selectedFloor || loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Select Room --</option>
                    {rooms.map((room) => {
                      const availableBeds = room.beds.filter((b) => !b.isOccupied).length;
                      return (
                        <option key={room.id} value={room.id}>
                          Room {room.roomNumber} ({availableBeds}/2 available)
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {selectedRoom && availableBeds.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bed Number
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableBeds.map((bed) => (
                      <button
                        key={bed.id}
                        type="button"
                        onClick={() => setSelectedBed(bed.id)}
                        className={`px-4 py-2 rounded border-2 font-medium transition-colors ${
                          selectedBed === bed.id
                            ? 'border-cyan-700 bg-cyan-50 text-cyan-700'
                            : 'border-gray-300 bg-white hover:border-cyan-400 hover:bg-cyan-50'
                        }`}
                      >
                        Bed {bed.bedNumber}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedRoom && availableBeds.length === 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">No available beds in this room</p>
                </div>
              )}

              {selectedBlockData && selectedRoomData && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        Selected: Block {selectedBlockData.blockNumber} - {selectedRoomData.floor.floorLevel} Floor - Room {selectedRoomData.roomNumber}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Gender: {selectedBlockData.gender}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBlock('');
                        setSelectedFloor('');
                        setSelectedRoom('');
                        setSelectedBed('');
                      }}
                      className="text-xs text-gray-600 hover:text-gray-800"
                    >
                      Change
                    </button>
                  </div>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
                    required
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
                    required
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
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
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
                    min={formData.checkInDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Booking Amount (KES)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      KSh
                    </span>
                    <input
                      type="number"
                      value={formData.amount || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
                      required
                      min="0"
                      step="100"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-700">
                      {(() => {
                        const checkIn = new Date(formData.checkInDate);
                        const checkOut = new Date(formData.checkOutDate);
                        const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return `${diffDays} days`;
                      })()}
                    </p>
                  </div>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting || !selectedStudent || !selectedRoom || loading}
              className="flex items-center gap-2 px-6 py-3 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting && <Loader size={18} className="animate-spin" />}
              {submitting ? 'Creating Booking...' : 'Create Booking'}
            </button>
            <Link
              href="/hostel/bookings"
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}