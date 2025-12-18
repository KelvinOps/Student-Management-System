// src/app/(dashboard)/student-management/students/[id]/page.tsx
// STUDENT DETAIL VIEW PAGE 

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, BookOpen, Award, TrendingUp, Loader } from "lucide-react";
import { getStudentById } from "@/actions/student";

interface StudentDetail {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  admissionNumber: string;
  gender: string;
  dateOfBirth: Date | string;
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
  academicStatus: string;
  session: string;
  class?: {
    code: string;
    name: string;
  };
  programme?: {
    name: string;
  };
  department?: {
    name: string;
  };
  guardianName: string | null;
  guardianRelation: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  nationality: string | null;
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStudent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getStudentById(params.id as string);
      if (result.success && result.data) {
        setStudent(result.data as unknown as StudentDetail);
      } else {
        setError(result.error || "Student not found");
      }
    } catch (err) {
      setError("Failed to load student details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Details</h1>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || "Student not found"}
        </div>
      </div>
    );
  }

  const studentName = `${student.firstName} ${student.middleName || ""} ${student.lastName}`.trim();
  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();

  const formatDate = (dateString: Date | string | null) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return String(dateString);
    }
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "INACTIVE":
        return "bg-gray-100 text-gray-700";
      case "GRADUATED":
        return "bg-blue-100 text-blue-700";
      case "SUSPENDED":
        return "bg-red-100 text-red-700";
      case "EXPELLED":
        return "bg-red-100 text-red-700";
      case "WITHDRAWN":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{studentName}</h1>
            <p className="text-gray-600 mt-1">{student.admissionNumber} • {student.class?.code || "N/A"}</p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/student-management/students/${params.id}/edit`)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Edit className="w-4 h-4" />
          Edit Student
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-4xl font-bold text-blue-600">{initials}</span>
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{studentName}</h2>
              <p className="text-gray-600">{student.admissionNumber}</p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(student.academicStatus)}`}>
                {student.academicStatus}
              </span>
            </div>

            <div className="space-y-4">
              {student.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{student.email}</p>
                  </div>
                </div>
              )}

              {student.phoneNumber && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{student.phoneNumber}</p>
                  </div>
                </div>
              )}

              {student.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium text-gray-900">{student.address}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Date of Birth</p>
                  <p className="font-medium text-gray-900">{formatDate(student.dateOfBirth)}</p>
                </div>
              </div>
            </div>

            {(student.guardianName || student.guardianPhone) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Guardian Information</h3>
                <div className="space-y-3">
                  {student.guardianName && (
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium text-gray-900">{student.guardianName}</p>
                    </div>
                  )}
                  {student.guardianRelation && (
                    <div>
                      <p className="text-sm text-gray-600">Relationship</p>
                      <p className="font-medium text-gray-900">{student.guardianRelation}</p>
                    </div>
                  )}
                  {(student.guardianPhone || student.guardianEmail) && (
                    <div>
                      <p className="text-sm text-gray-600">Contact</p>
                      {student.guardianPhone && <p className="font-medium text-gray-900">{student.guardianPhone}</p>}
                      {student.guardianEmail && <p className="text-sm text-gray-600">{student.guardianEmail}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <div className="flex gap-4 px-6">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`py-4 px-2 border-b-2 transition-colors ${
                    activeTab === "overview"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("academic")}
                  className={`py-4 px-2 border-b-2 transition-colors ${
                    activeTab === "academic"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Academic Details
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {student.class && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                          <span className="text-sm text-gray-600">Current Class</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{student.class.code}</p>
                        <p className="text-sm text-gray-600">{student.class.name}</p>
                      </div>
                    )}

                    {student.programme && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <Award className="w-5 h-5 text-green-600" />
                          <span className="text-sm text-gray-600">Programme</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{student.programme.name}</p>
                      </div>
                    )}

                    {student.department && (
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <TrendingUp className="w-5 h-5 text-purple-600" />
                          <span className="text-sm text-gray-600">Department</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{student.department.name}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Gender</p>
                        <p className="font-medium text-gray-900">{student.gender}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Session</p>
                        <p className="font-medium text-gray-900">{student.session}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Nationality</p>
                        <p className="font-medium text-gray-900">{student.nationality || "N/A"}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="font-medium text-gray-900">{student.academicStatus}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "academic" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Student Information</h3>
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Admission Number</p>
                          <p className="font-medium text-gray-900">{student.admissionNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Class</p>
                          <p className="font-medium text-gray-900">{student.class?.code || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Programme</p>
                          <p className="font-medium text-gray-900">{student.programme?.name || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Department</p>
                          <p className="font-medium text-gray-900">{student.department?.name || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}