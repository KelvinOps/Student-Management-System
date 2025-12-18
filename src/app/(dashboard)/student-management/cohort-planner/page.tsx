"use client";

import { useState } from "react";
import { Plus, Users, Calendar, BookOpen, TrendingUp, Award, Briefcase } from "lucide-react";

export default function TVETCohortPlannerPage() {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedCourse, setSelectedCourse] = useState("all");

  const cohorts = [
    {
      id: 1,
      name: "ICT Technician - Level 4",
      course: "ICT Technician",
      year: "2024",
      level: 4,
      levelName: "Artisan Certificate",
      students: 145,
      classes: 3,
      modules: 8,
      completedModules: 3,
      startDate: "Jan 2024",
      endDate: "Dec 2024",
      status: "Active",
      duration: "1 year",
    },
    {
      id: 2,
      name: "ICT Technician - Level 5",
      course: "ICT Technician",
      year: "2023",
      level: 5,
      levelName: "Craft Certificate",
      students: 128,
      classes: 3,
      modules: 8,
      completedModules: 6,
      startDate: "Jan 2023",
      endDate: "Dec 2024",
      status: "Active",
      duration: "2 years",
    },
    {
      id: 3,
      name: "ICT Technician - Level 6",
      course: "ICT Technician",
      year: "2022",
      level: 6,
      levelName: "Diploma",
      students: 112,
      classes: 2,
      modules: 8,
      completedModules: 7,
      startDate: "Jan 2022",
      endDate: "Dec 2024",
      status: "Graduating",
      duration: "3 years",
    },
    {
      id: 4,
      name: "Electrical Engineering - Level 4",
      course: "Electrical Engineering",
      year: "2024",
      level: 4,
      levelName: "Artisan Certificate",
      students: 132,
      classes: 3,
      modules: 8,
      completedModules: 2,
      startDate: "Jan 2024",
      endDate: "Dec 2024",
      status: "Active",
      duration: "1 year",
    },
    {
      id: 5,
      name: "Hospitality Management - Level 5",
      course: "Hospitality Management",
      year: "2023",
      level: 5,
      levelName: "Craft Certificate",
      students: 98,
      classes: 2,
      modules: 8,
      completedModules: 5,
      startDate: "Jan 2023",
      endDate: "Dec 2024",
      status: "Active",
      duration: "2 years",
    },
  ];

  const courses = ["all", "ICT Technician", "Electrical Engineering", "Hospitality Management"];

  const filteredCohorts = selectedCourse === "all" 
    ? cohorts 
    : cohorts.filter(c => c.course === selectedCourse);

  const totalStudents = filteredCohorts.reduce((sum, c) => sum + c.students, 0);
  const activeCohorts = filteredCohorts.filter(c => c.status === "Active").length;
  const graduatingStudents = filteredCohorts
    .filter(c => c.status === "Graduating")
    .reduce((sum, c) => sum + c.students, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">TVET Cohort Planner</h1>
          <p className="text-gray-600 mt-1">Manage student cohorts across CBET Levels 4, 5, and 6</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create New Cohort
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-gray-600 text-sm">Total Students</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
          <p className="text-sm text-green-600 mt-1">Across all levels</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-gray-600 text-sm">Active Cohorts</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeCohorts}</p>
          <p className="text-sm text-gray-500 mt-1">Running programs</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-gray-600 text-sm">Graduating Soon</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{graduatingStudents}</p>
          <p className="text-sm text-gray-500 mt-1">Level 6 - Dec 2024</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-gray-600 text-sm">Avg. Completion</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">87.3%</p>
          <p className="text-sm text-green-600 mt-1">+3.2% from last year</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4 mb-6">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="2024">Academic Year 2024</option>
            <option value="2023">Academic Year 2023</option>
            <option value="2022">Academic Year 2022</option>
          </select>
          
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Courses</option>
            {courses.slice(1).map(course => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>

          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            View Timeline
          </button>
        </div>

        <div className="space-y-4">
          {filteredCohorts.map((cohort) => {
            const progress = (cohort.completedModules / cohort.modules) * 100;
            
            return (
              <div key={cohort.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{cohort.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        cohort.level === 4 ? "bg-blue-100 text-blue-700" :
                        cohort.level === 5 ? "bg-green-100 text-green-700" :
                        "bg-purple-100 text-purple-700"
                      }`}>
                        {cohort.levelName}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {cohort.course} • {cohort.duration} • {cohort.startDate} - {cohort.endDate}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    cohort.status === "Active" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-orange-100 text-orange-700"
                  }`}>
                    {cohort.status}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Students</p>
                    <p className="text-xl font-bold text-gray-900">{cohort.students}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Classes</p>
                    <p className="text-xl font-bold text-gray-900">{cohort.classes}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Modules</p>
                    <p className="text-xl font-bold text-gray-900">{cohort.modules}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-xl font-bold text-gray-900">{cohort.completedModules}/{cohort.modules}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Module Progress</span>
                    <span className="text-sm text-gray-600">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        cohort.level === 4 ? "bg-blue-600" :
                        cohort.level === 5 ? "bg-green-600" :
                        "bg-purple-600"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm">
                    View Modules
                  </button>
                  <button className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-sm">
                    Edit Cohort
                  </button>
                  <button className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-sm">
                    Student List
                  </button>
                  <button className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-sm">
                    Generate Report
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">CBET Level Distribution</h2>
          <div className="space-y-4">
            {[
              { level: "Level 4 - Artisan", count: 277, color: "bg-blue-500" },
              { level: "Level 5 - Craft", count: 226, color: "bg-green-500" },
              { level: "Level 6 - Diploma", count: 112, color: "bg-purple-500" },
            ].map((item) => {
              const total = 615;
              const percentage = (item.count / total) * 100;
              
              return (
                <div key={item.level} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-32">
                    <span className="text-sm font-medium text-gray-700">{item.level}</span>
                  </div>
                  <div className="flex-1">
                    <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden">
                      <div 
                        className={`absolute inset-y-0 left-0 ${item.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {item.count} students ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Milestones</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <Award className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Level 6 Graduation Ceremony</p>
                <p className="text-sm text-gray-600">December 2024 • 112 graduates</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Industrial Attachment Period</p>
                <p className="text-sm text-gray-600">Level 5 & 6 • July - September 2024</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">New Intake Registration</p>
                <p className="text-sm text-gray-600">Level 4 Programs • January 2025</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
              <BookOpen className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Module Assessments</p>
                <p className="text-sm text-gray-600">All Levels • Ongoing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}