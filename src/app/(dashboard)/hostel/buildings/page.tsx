// app/(dashboard)/hostel/buildings/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Users, DoorOpen, Search, Filter, Eye, Plus } from 'lucide-react';
import { getHostelBlocks } from '@/actions/hostel';

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

interface Pagination {
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

type Gender = 'MALE' | 'FEMALE';

export default function HostelBuildingsPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 15,
  });

  useEffect(() => {
    loadBlocks();
  }, [genderFilter, currentPage]);

  const loadBlocks = async () => {
    setLoading(true);
    try {
      const result = await getHostelBlocks({
        gender: genderFilter ? (genderFilter as Gender) : undefined,
        page: currentPage,
        limit: 15,
      });

      if (result.success && Array.isArray(result.data)) {
        setBlocks(result.data);
        setPagination(result.pagination || { total: 0, totalPages: 0, page: 1, limit: 15 });
      }
    } catch (error) {
      console.error('Error loading blocks:', error);
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  };

  const getGenderColor = (gender: string) => {
    return gender === 'MALE' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800';
  };

  const getGenderIcon = (gender: string) => {
    return gender === 'MALE' ? '♂' : '♀';
  };

  const filteredBlocks = blocks.filter((block) => {
    if (searchTerm) {
      return block.blockNumber.toString().includes(searchTerm);
    }
    return true;
  });

  const totalRooms = blocks.reduce((sum, block) => {
    return sum + block.floors.reduce((floorSum, floor) => floorSum + floor._count.rooms, 0);
  }, 0);

  const totalBookings = blocks.reduce((sum, block) => sum + block._count.bookings, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hostel Buildings</h1>
          <nav className="text-sm text-gray-600 mt-1">
            Hostel Management &gt; Buildings Overview
          </nav>
        </div>
        <Link
          href="/hostel/initialize"
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus size={18} />
          Initialize Buildings
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Blocks</p>
              <p className="text-3xl font-bold text-cyan-700">{pagination.total}</p>
            </div>
            <Building2 className="text-cyan-700" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Rooms</p>
              <p className="text-3xl font-bold text-blue-600">{totalRooms}</p>
            </div>
            <DoorOpen className="text-blue-600" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Bookings</p>
              <p className="text-3xl font-bold text-green-600">{totalBookings}</p>
            </div>
            <Users className="text-green-600" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Occupancy Rate</p>
              <p className="text-3xl font-bold text-purple-600">
                {totalRooms > 0 ? Math.round((totalBookings / totalRooms) * 100) : 0}%
              </p>
            </div>
            <div className="text-purple-600 text-4xl">📊</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by block number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-600" />
            <select
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
            >
              <option value="">All Buildings</option>
              <option value="MALE">Male Blocks</option>
              <option value="FEMALE">Female Blocks</option>
            </select>
          </div>
        </div>
      </div>

      {/* Buildings Grid */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-700 mx-auto mb-4"></div>
            Loading buildings...
          </div>
        ) : filteredBlocks.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500 text-lg mb-2">No buildings found</p>
            <p className="text-gray-400 text-sm mb-4">
              {blocks.length === 0
                ? 'Initialize the hostel structure to create buildings'
                : 'Try adjusting your search or filters'}
            </p>
            {blocks.length === 0 && (
              <Link
                href="/hostel/initialize"
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                <Plus size={18} />
                Initialize Now
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {filteredBlocks.map((block) => (
              <div
                key={block.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-gray-50"
              >
                {/* Block Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-cyan-100 p-3 rounded-lg">
                      <Building2 className="text-cyan-700" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Block {block.blockNumber}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getGenderColor(
                          block.gender
                        )}`}
                      >
                        <span className="text-lg">{getGenderIcon(block.gender)}</span>
                        {block.gender}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 text-xs rounded ${
                      block.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {block.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>

                {/* Block Stats */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Floors</span>
                    <span className="font-semibold text-gray-900">
                      {block.floors.length} floors
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Total Rooms</span>
                    <span className="font-semibold text-gray-900">
                      {block.floors.reduce((sum, f) => sum + f._count.rooms, 0)} rooms
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">Active Bookings</span>
                    <span className="font-semibold text-gray-900">
                      {block._count.bookings} bookings
                    </span>
                  </div>
                </div>

                {/* Floor Breakdown */}
                <div className="bg-gray-50 rounded p-3 mb-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Floor Distribution</p>
                  <div className="space-y-1">
                    {block.floors.map((floor) => (
                      <div key={floor.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{floor.floorLevel} Floor</span>
                        <span className="text-gray-900 font-medium">
                          {floor._count.rooms} rooms
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <Link
                  href={`/hostel/rooms?block=${block.id}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 transition-colors"
                >
                  <Eye size={16} />
                  View Rooms
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

          {pagination.totalPages > 5 && (
            <>
              <span className="px-2">...</span>
              <button
                onClick={() => setCurrentPage(pagination.totalPages)}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
              >
                {pagination.totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
            disabled={currentPage === pagination.totalPages}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            »
          </button>
        </div>
      )}
    </div>
  );
}