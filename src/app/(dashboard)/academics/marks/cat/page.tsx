// ============================================
// 13. app/(dashboard)/academics/marks/cat/page.tsx
// ============================================
"use client";

import { Download } from "lucide-react";

export default function CATMarksPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CAT Marks Management</h1>
          <p className="text-gray-600 mt-1">View and manage Continuous Assessment Test marks</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select className="px-4 py-2 border border-gray-300 rounded-lg">
            <option>Select Class</option>
            <option>Form 1A</option>
            <option>Form 2A</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg">
            <option>Select Subject</option>
            <option>Mathematics</option>
            <option>English</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg">
            <option>CAT 1</option>
            <option>CAT 2</option>
            <option>CAT 3</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">CAT 1</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">CAT 2</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Average</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">John Doe</td>
              <td className="px-6 py-4 text-center">85</td>
              <td className="px-6 py-4 text-center">88</td>
              <td className="px-6 py-4 text-center font-semibold">86.5</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
