// app/(dashboard)/academics/timetable/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Calendar, Building, DoorOpen, Coffee, Clock, Eye } from 'lucide-react';

interface TimetableCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  bgColor: string;
}

export default function TimetablePage() {
  const router = useRouter();

  const timetableCards: TimetableCard[] = [
    {
      title: 'View Timetable',
      description: 'View class timetables in a weekly grid format',
      icon: <Eye size={32} />,
      href: '/academics/timetable/time-table',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Manage Schedules',
      description: 'Create and manage timetable entries and class schedules',
      icon: <Calendar size={32} />,
      href: '/academics/timetable/schedules',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
    },
    {
      title: 'Buildings',
      description: 'Manage campus buildings and facilities',
      icon: <Building size={32} />,
      href: '/academics/timetable/buildings',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Rooms',
      description: 'Manage rooms, labs, and lecture halls',
      icon: <DoorOpen size={32} />,
      href: '/academics/timetable/rooms',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Break Times',
      description: 'Configure break times and intervals',
      icon: <Coffee size={32} />,
      href: '/academics/timetable/breaks',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const handleCardClick = (href: string) => {
    router.push(href);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Timetable Management</h1>
        <nav className="text-sm text-gray-600 mt-1">
          Dashboard &gt; Student Academics &gt; Timetable
        </nav>
        <p className="text-gray-600 mt-2">
          Manage your institution&apos;s timetable, schedules, rooms, and facilities
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Schedules</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
            <div className="p-3 bg-cyan-100 rounded-lg">
              <Calendar className="text-cyan-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Buildings</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Building className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Rooms</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <DoorOpen className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Break Times</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Coffee className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {timetableCards.map((card, index) => (
          <button
            key={index}
            onClick={() => handleCardClick(card.href)}
            className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-6 text-left group hover:scale-105"
          >
            <div className="flex items-start gap-4">
              <div className={`p-4 ${card.bgColor} rounded-lg group-hover:scale-110 transition-transform`}>
                <div className={card.color}>
                  {card.icon}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-cyan-700 transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {card.description}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-cyan-600 font-medium text-sm group-hover:translate-x-2 transition-transform">
              Manage →
            </div>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/academics/timetable/schedules')}
            className="flex items-center gap-3 p-4 border-2 border-cyan-200 rounded-lg hover:border-cyan-500 hover:bg-cyan-50 transition-all"
          >
            <Clock className="text-cyan-600" size={24} />
            <div className="text-left">
              <div className="font-semibold text-gray-900">Add Schedule</div>
              <div className="text-sm text-gray-600">Create new timetable entry</div>
            </div>
          </button>

          <button
            onClick={() => router.push('/academics/timetable/buildings')}
            className="flex items-center gap-3 p-4 border-2 border-green-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
          >
            <Building className="text-green-600" size={24} />
            <div className="text-left">
              <div className="font-semibold text-gray-900">Add Building</div>
              <div className="text-sm text-gray-600">Register new building</div>
            </div>
          </button>

          <button
            onClick={() => router.push('/academics/timetable/time-table')}
            className="flex items-center gap-3 p-4 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <Eye className="text-blue-600" size={24} />
            <div className="text-left">
              <div className="font-semibold text-gray-900">View Timetable</div>
              <div className="text-sm text-gray-600">See weekly schedule</div>
            </div>
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Getting Started</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <span className="font-semibold text-cyan-700">1.</span>
            <span>First, create buildings to organize your campus facilities</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold text-cyan-700">2.</span>
            <span>Add rooms within each building (classrooms, labs, lecture halls)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold text-cyan-700">3.</span>
            <span>Configure break times for your institution&apos;s schedule</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold text-cyan-700">4.</span>
            <span>Create schedule entries by assigning classes, subjects, tutors, rooms, and time slots</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold text-cyan-700">5.</span>
            <span>View the complete timetable in a weekly grid format</span>
          </div>
        </div>
      </div>
    </div>
  );
}