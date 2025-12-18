// app/(dashboard)/hostel/rooms/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Eye } from 'lucide-react';
import { getRoomsByBlock, getHostelBlocks } from '@/actions/hostel';
import Link from 'next/link';
import type { FloorLevel } from '@prisma/client';

interface Block {
  id: string;
  blockNumber: number;
  gender: string;
  isActive: boolean;
  floors: Array<{
    id: string;
    floorLevel: string;
    floorNumber: number;
    _count: {
      rooms: number;
    };
  }>;
  _count: {
    bookings: number;
  };
}

interface Room {
  id: string;
  roomNumber: number;
  capacity: number;
  currentOccupancy: number;
  status: string;
  isAvailable: boolean;
  floor: {
    floorLevel: string;
    block: {
      blockNumber: number;
      gender: string;
    };
  };
  beds: Array<{
    id: string;
    bedNumber: number;
    isOccupied: boolean;
  }>;
  bookings: Array<{
    id: string;
  }>;
}

interface Pagination {
  total: number;
  totalPages: number;
}

type Gender = 'MALE' | 'FEMALE';

// Helper function to convert string to FloorLevel enum
const toFloorLevel = (level: string): FloorLevel | undefined => {
  // Check if the string matches one of the FloorLevel enum values
  // You need to know the actual enum values from your Prisma schema
  // Common values are: 'GROUND', 'FIRST', 'SECOND', 'THIRD', etc.
  const validLevels: string[] = ['GROUND', 'FIRST', 'SECOND']; // Add all your enum values here
  
  if (validLevels.includes(level.toUpperCase())) {
    return level.toUpperCase() as FloorLevel;
  }
  return undefined;
};

export default function HostelRoomsPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, totalPages: 0 });
  const [genderFilter, setGenderFilter] = useState<string>('');

  const loadBlocks = useCallback(async () => {
    try {
      const result = await getHostelBlocks({
        gender: genderFilter ? (genderFilter as Gender) : undefined,
        page: 1,
        limit: 30,
      });

      if (result.success && Array.isArray(result.data)) {
        setBlocks(result.data);
        if (result.data.length > 0 && !selectedBlock) {
          setSelectedBlock(result.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading blocks:', error);
    }
  }, [genderFilter, selectedBlock]);

  const loadRooms = useCallback(async () => {
    if (!selectedBlock) return;

    setLoading(true);
    try {
      // Convert the selected floor string to the correct FloorLevel enum type
      const floorLevel = selectedFloor ? toFloorLevel(selectedFloor) : undefined;
      
      const result = await getRoomsByBlock(selectedBlock, {
        floorLevel: floorLevel,
        page: currentPage,
        limit: 20,
      });

      if (result.success && Array.isArray(result.data)) {
        setRooms(result.data);
        setPagination(result.pagination || { total: 0, totalPages: 0 });
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedBlock, selectedFloor, currentPage]);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-50 border-green-200';
      case 'OCCUPIED':
        return 'bg-red-50 border-red-200';
      case 'MAINTENANCE':
        return 'bg-yellow-50 border-yellow-200';
      case 'RESERVED':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800';
      case 'OCCUPIED':
        return 'bg-red-100 text-red-800';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESERVED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedBlockData = blocks.find((b) => b.id === selectedBlock);
  const floors = selectedBlockData?.floors || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hostel Rooms</h1>
          <nav className="text-sm text-gray-600 mt-1">
            Hostel Management &gt; Room Allocation
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Gender
            </label>
            <select
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
            >
              <option value="">All Hostels</option>
              <option value="MALE">Male Blocks</option>
              <option value="FEMALE">Female Blocks</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Block
            </label>
            <select
              value={selectedBlock}
              onChange={(e) => {
                setSelectedBlock(e.target.value);
                setSelectedFloor('');
                setCurrentPage(1);
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
              Select Floor
            </label>
            <select
              value={selectedFloor}
              onChange={(e) => {
                setSelectedFloor(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
            >
              <option value="">All Floors</option>
              {floors.map((floor) => (
                <option key={floor.id} value={floor.floorLevel}>
                  {floor.floorLevel} Floor ({floor._count.rooms} rooms)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {selectedBlockData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Block Number</p>
            <p className="text-2xl font-bold text-cyan-700">Block {selectedBlockData.blockNumber}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Gender</p>
            <p className="text-2xl font-bold text-cyan-700">{selectedBlockData.gender}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Rooms</p>
            <p className="text-2xl font-bold text-cyan-700">90</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Active Bookings</p>
            <p className="text-2xl font-bold text-cyan-700">{selectedBlockData._count.bookings}</p>
          </div>
        </div>
      )}

      {/* Rooms Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No rooms found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Room #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Floor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Block
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Occupancy
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Beds Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rooms.map((room) => (
                  <tr key={room.id} className={`hover:bg-gray-50 border-l-4 ${getRoomStatusColor(room.status)}`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      Room {room.roomNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {room.floor.floorLevel}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      Block {room.floor.block.blockNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {room.currentOccupancy}/{room.capacity}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-1">
                        {room.beds.map((bed) => (
                          <div
                            key={bed.id}
                            className={`w-6 h-6 rounded border flex items-center justify-center text-xs font-bold ${
                              bed.isOccupied
                                ? 'bg-red-100 border-red-300 text-red-700'
                                : 'bg-green-100 border-green-300 text-green-700'
                            }`}
                          >
                            {bed.bedNumber}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(room.status)}`}>
                        {room.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/hostel/rooms/${room.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            «
          </button>

          {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1 rounded ${
                  currentPage === pageNum
                    ? 'bg-cyan-700 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
            disabled={currentPage === pagination.totalPages}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            »
          </button>
        </div>
      )}
    </div>
  );
}