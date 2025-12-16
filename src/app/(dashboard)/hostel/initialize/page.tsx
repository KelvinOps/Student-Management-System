// app/(dashboard)/hostel/initialize/page.tsx

'use client';

import { useState } from 'react';
import { Building2, Layers, DoorOpen, Bed, CheckCircle, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { initializeHostelStructure } from '@/actions/hostel';
import Link from 'next/link';

export default function InitializeHostelPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  const handleInitialize = async () => {
    if (!confirm('Are you sure you want to initialize the hostel structure? This action can only be done once.')) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await initializeHostelStructure();
      setResult(response);
    } catch (error) {
      console.error('Error initializing hostel:', error);
      setResult({
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/hostel/rooms"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            Back to Rooms
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-cyan-700 to-teal-600 text-white p-8">
            <div className="flex items-center gap-4">
              <Building2 size={48} />
              <div>
                <h1 className="text-3xl font-bold">Initialize Hostel Structure</h1>
                <p className="text-cyan-100 mt-2">
                  Set up the complete hostel infrastructure with blocks, floors, rooms, and beds
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Warning Alert */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="text-yellow-800 font-semibold">Important Notice</h3>
                  <p className="text-yellow-700 text-sm mt-1">
                    This initialization process can only be run once. It will create the entire hostel structure.
                    If the structure already exists, this operation will fail.
                  </p>
                </div>
              </div>
            </div>

            {/* Structure Overview */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">What will be created?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Blocks Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Building2 className="text-blue-600" size={32} />
                    <span className="text-3xl font-bold text-blue-600">30</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Blocks</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    15 Male + 15 Female
                  </p>
                </div>

                {/* Floors Card */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Layers className="text-green-600" size={32} />
                    <span className="text-3xl font-bold text-green-600">3</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Floors per Block</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Ground, First, Second
                  </p>
                </div>

                {/* Rooms Card */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <DoorOpen className="text-purple-600" size={32} />
                    <span className="text-3xl font-bold text-purple-600">30</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Rooms per Floor</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    900 rooms per block
                  </p>
                </div>

                {/* Beds Card */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Bed className="text-orange-600" size={32} />
                    <span className="text-3xl font-bold text-orange-600">2</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Beds per Room</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    5,400 total beds
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Structure Breakdown</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Total Blocks</span>
                  <span className="font-semibold text-gray-900">30 blocks</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Male Blocks</span>
                  <span className="font-semibold text-gray-900">15 blocks (Blocks 1-15)</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Female Blocks</span>
                  <span className="font-semibold text-gray-900">15 blocks (Blocks 16-30)</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Total Floors</span>
                  <span className="font-semibold text-gray-900">90 floors (3 per block)</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Total Rooms</span>
                  <span className="font-semibold text-gray-900">2,700 rooms (30 per floor)</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-700">Total Beds</span>
                  <span className="font-semibold text-gray-900">5,400 beds (2 per room)</span>
                </div>
              </div>
            </div>

            {/* Result Message */}
            {result && (
              <div
                className={`rounded-lg p-4 ${
                  result.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                  ) : (
                    <XCircle className="text-red-600 flex-shrink-0" size={24} />
                  )}
                  <div>
                    <h3
                      className={`font-semibold ${
                        result.success ? 'text-green-800' : 'text-red-800'
                      }`}
                    >
                      {result.success ? 'Success!' : 'Error'}
                    </h3>
                    <p
                      className={`text-sm mt-1 ${
                        result.success ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {result.message || result.error}
                    </p>
                    {result.success && (
                      <div className="mt-3">
                        <Link
                          href="/hostel/rooms"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          View Hostel Rooms
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="flex items-center justify-center pt-6">
              <button
                onClick={handleInitialize}
                disabled={loading || (result?.success === true)}
                className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all ${
                  loading || result?.success
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-700 to-teal-600 text-white hover:from-cyan-800 hover:to-teal-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-3">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Initializing Hostel Structure...
                  </span>
                ) : result?.success ? (
                  'Initialization Complete'
                ) : (
                  'Initialize Hostel Structure'
                )}
              </button>
            </div>

            {/* Info Note */}
            {!result && (
              <div className="text-center text-sm text-gray-500 mt-4">
                <p>
                  This process may take a few moments to complete. Please do not refresh the page.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-3">What happens after initialization?</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
              <span>All blocks, floors, rooms, and beds will be created in the database</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
              <span>Rooms will be automatically marked as available for booking</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
              <span>You can start assigning students to rooms immediately</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
              <span>View and manage all rooms from the Hostel Rooms page</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}