// ============================================
// 8. app/(dashboard)/student-management/applicants/[id]/page.tsx
// ============================================
"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, X, Mail, Phone } from "lucide-react";

export default function ApplicantDetailPage() {
  const params = useParams();
  const router = useRouter();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Applicant Details</h1>
            <p className="text-gray-600 mt-1">Application ID: APP{params.id}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
            <Check className="w-4 h-4" />
            Approve
          </button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
            <X className="w-4 h-4" />
            Reject
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Full Name</p>
              <p className="font-medium text-gray-900">Alice Johnson</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date of Birth</p>
              <p className="font-medium text-gray-900">2010-03-15</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gender</p>
              <p className="font-medium text-gray-900">Female</p>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <p className="font-medium text-gray-900">alice@example.com</p>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <p className="font-medium text-gray-900">+254712345678</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">KCPE Score</p>
              <p className="font-medium text-gray-900">385 / 500</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Previous School</p>
              <p className="font-medium text-gray-900">ABC Primary School</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Applied For</p>
              <p className="font-medium text-gray-900">Form 1 - Science Stream</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Application Date</p>
              <p className="font-medium text-gray-900">2024-10-01</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Guardian Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Guardian Name</p>
              <p className="font-medium text-gray-900">Mary Johnson</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Relationship</p>
              <p className="font-medium text-gray-900">Mother</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contact</p>
              <p className="font-medium text-gray-900">+254787654321</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-900">mary@example.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}