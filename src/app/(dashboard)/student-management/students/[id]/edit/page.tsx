// src/app/(dashboard)/student-management/students/[id]/edit/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Save, Loader } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { updateStudent, getStudentById } from "@/actions/student";
import { getDepartments } from "@/actions/department";
import { getProgrammesByDepartment } from "@/actions/programme"; // Import the correct action
import { getClasses } from "@/actions/class";
import { Gender, Session } from "@prisma/client";

interface Department {
  id: string;
  name: string;
}

interface Programme {
  id: string;
  name: string;
}

interface Class {
  id: string;
  code: string;
  name: string;
}

// Add proper type for academic status
type AcademicStatus = "ACTIVE" | "INACTIVE" | "GRADUATED" | "SUSPENDED" | "EXPELLED" | "WITHDRAWN";

interface StudentData {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  gender: Gender | "";
  dateOfBirth: string;
  nationality: string | null;
  idNumber: string | null;
  email: string | null;
  phoneNumber: string | null;
  religion: string | null;
  cohort: string;
  academicYear: string;
  session: Session | "";
  classId: string;
  programmeId: string;
  departmentId: string;
  stream: string | null;
  previousSchool: string | null;
  kcpeScore: number | null;
  specialNeeds: string | null;
  sportsHouse: string | null;
  academicStatus: AcademicStatus;
  address: string | null;
  county: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  guardianRelation: string | null;
  guardianOccupation: string | null;
  guardianIdNumber: string | null;
  guardianAddress: string | null;
}

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState<StudentData>({
    id: "",
    admissionNumber: "",
    firstName: "",
    lastName: "",
    middleName: null,
    gender: "",
    dateOfBirth: "",
    nationality: "Kenyan",
    idNumber: null,
    email: null,
    phoneNumber: null,
    religion: null,
    cohort: "",
    academicYear: "",
    session: "",
    classId: "",
    programmeId: "",
    departmentId: "",
    stream: null,
    previousSchool: null,
    kcpeScore: null,
    specialNeeds: null,
    sportsHouse: null,
    academicStatus: "ACTIVE",
    address: null,
    county: null,
    guardianName: null,
    guardianPhone: null,
    guardianEmail: null,
    guardianRelation: null,
    guardianOccupation: null,
    guardianIdNumber: null,
    guardianAddress: null,
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  // Function to load programmes
  const loadProgrammes = useCallback(async (departmentId: string) => {
    try {
      if (!departmentId) {
        setProgrammes([]);
        return;
      }

      // Use the proper server action to get programmes by department
      const programmesResult = await getProgrammesByDepartment(departmentId);
      if (programmesResult.success && Array.isArray(programmesResult.data)) {
        setProgrammes(programmesResult.data);
      } else {
        setProgrammes([]);
      }
    } catch (error) {
      console.error("Error loading programmes:", error);
      setProgrammes([]);
    }
  }, []);

  // Define loadInitialData with useCallback
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      // Load student data
      const studentResult = await getStudentById(params.id as string);
      if (studentResult.success && studentResult.data) {
        const student = studentResult.data;
        setFormData({
          id: student.id,
          admissionNumber: student.admissionNumber || "",
          firstName: student.firstName || "",
          lastName: student.lastName || "",
          middleName: student.middleName || null,
          gender: (student.gender || "") as Gender | "",
          dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split("T")[0] : "",
          nationality: student.nationality || "Kenyan",
          idNumber: student.idNumber || null,
          email: student.email || null,
          phoneNumber: student.phoneNumber || null,
          religion: student.religion || null,
          cohort: student.cohort || "",
          academicYear: student.academicYear || "",
          session: (student.session || "") as Session | "",
          classId: student.classId || "",
          programmeId: student.programmeId || "",
          departmentId: student.departmentId || "",
          stream: student.stream || null,
          previousSchool: student.previousSchool || null,
          kcpeScore: student.kcpeScore || null,
          specialNeeds: student.specialNeeds || null,
          sportsHouse: student.sportsHouse || null,
          academicStatus: (student.academicStatus || "ACTIVE") as AcademicStatus,
          address: student.address || null,
          county: student.county || null,
          guardianName: student.guardianName || null,
          guardianPhone: student.guardianPhone || null,
          guardianEmail: student.guardianEmail || null,
          guardianRelation: student.guardianRelation || null,
          guardianOccupation: student.guardianOccupation || null,
          guardianIdNumber: student.guardianIdNumber || null,
          guardianAddress: student.guardianAddress || null,
        });
        
        // Load programmes for the student's department if it exists
        if (student.departmentId) {
          await loadProgrammes(student.departmentId);
        }
      } else {
        setError(studentResult.error || "Failed to load student");
        return;
      }

      // Load departments
      const deptResult = await getDepartments();
      if (deptResult.success && Array.isArray(deptResult.data)) {
        setDepartments(deptResult.data);
      }

      // Load classes
      const classResult = await getClasses();
      if (classResult.success && Array.isArray(classResult.data)) {
        setClasses(classResult.data);
      }
    } catch (err) {
      setError("Failed to load data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params.id, loadProgrammes]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle department change to load programmes
  const handleDepartmentChange = async (departmentId: string) => {
    setFormData(prev => ({
      ...prev,
      departmentId,
      programmeId: "" // Reset programme when department changes
    }));
    
    await loadProgrammes(departmentId);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle department change separately
    if (name === "departmentId") {
      handleDepartmentChange(value);
      return;
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? null : (type === "number" && value !== "" ? Number(value) : value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Validate required fields
      if (formData.gender === "") {
        setError("Gender is required");
        setSaving(false);
        return;
      }

      if (formData.session === "") {
        setError("Session is required");
        setSaving(false);
        return;
      }

      const updateData = {
        id: formData.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName || undefined,
        gender: formData.gender as Gender,
        dateOfBirth: new Date(formData.dateOfBirth),
        nationality: formData.nationality || undefined,
        idNumber: formData.idNumber || undefined,
        email: formData.email || undefined,
        phoneNumber: formData.phoneNumber || undefined,
        religion: formData.religion || undefined,
        cohort: formData.cohort,
        academicYear: formData.academicYear,
        session: formData.session as Session,
        classId: formData.classId,
        programmeId: formData.programmeId,
        departmentId: formData.departmentId,
        stream: formData.stream || undefined,
        previousSchool: formData.previousSchool || undefined,
        kcpeScore: formData.kcpeScore || undefined,
        specialNeeds: formData.specialNeeds || undefined,
        sportsHouse: formData.sportsHouse || undefined,
        academicStatus: formData.academicStatus,
        address: formData.address || undefined,
        county: formData.county || undefined,
        guardianName: formData.guardianName || undefined,
        guardianPhone: formData.guardianPhone || undefined,
        guardianEmail: formData.guardianEmail || undefined,
        guardianRelation: formData.guardianRelation || undefined,
        guardianOccupation: formData.guardianOccupation || undefined,
        guardianIdNumber: formData.guardianIdNumber || undefined,
        guardianAddress: formData.guardianAddress || undefined,
      };

      const result = await updateStudent(updateData);

      if (result.success) {
        setSuccess("Student updated successfully!");
        setTimeout(() => {
          router.push(`/student-management/students/${formData.id}`);
        }, 1500);
      } else {
        setError(result.error || "Failed to update student");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading student data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Student</h1>
          <p className="text-gray-600 mt-1">
            {formData.firstName} {formData.lastName} ({formData.admissionNumber || "N/A"})
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            <button
              type="button"
              onClick={() => setActiveTab("personal")}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === "personal"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Personal Information
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("academic")}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === "academic"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Academic Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("guardian")}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === "guardian"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Guardian Information
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === "personal" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    National ID / Birth Certificate No.
                  </label>
                  <input
                    type="text"
                    name="idNumber"
                    value={formData.idNumber || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Religion</label>
                  <input
                    type="text"
                    name="religion"
                    value={formData.religion || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">County</label>
                  <input
                    type="text"
                    name="county"
                    value={formData.county || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    name="address"
                    value={formData.address || ""}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "academic" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admission Number
                  </label>
                  <input
                    type="text"
                    value={formData.admissionNumber || ""}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 2024/2025"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session *
                  </label>
                  <select
                    name="session"
                    value={formData.session}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Select session</option>
                    <option value="SEPT_DEC">SEPT - DEC</option>
                    <option value="JAN_APRIL">JAN - APRIL</option>
                    <option value="MAY_AUGUST">MAY - AUGUST</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cohort *
                  </label>
                  <input
                    type="text"
                    name="cohort"
                    value={formData.cohort}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 2024"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Programme *
                  </label>
                  <select
                    name="programmeId"
                    value={formData.programmeId}
                    onChange={handleChange}
                    required
                    disabled={!formData.departmentId}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select programme</option>
                    {programmes.map((prog) => (
                      <option key={prog.id} value={prog.id}>
                        {prog.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class *
                  </label>
                  <select
                    name="classId"
                    value={formData.classId}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Select class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.code} - {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    name="academicStatus"
                    value={formData.academicStatus}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="GRADUATED">Graduated</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="EXPELLED">Expelled</option>
                    <option value="WITHDRAWN">Withdrawn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stream
                  </label>
                  <input
                    type="text"
                    name="stream"
                    value={formData.stream || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Previous School
                  </label>
                  <input
                    type="text"
                    name="previousSchool"
                    value={formData.previousSchool || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    KCPE Score
                  </label>
                  <input
                    type="number"
                    name="kcpeScore"
                    value={formData.kcpeScore ?? ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    max="500"
                    min="0"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Needs / Medical Conditions
                  </label>
                  <textarea
                    name="specialNeeds"
                    value={formData.specialNeeds || ""}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "guardian" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Guardian</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="guardianName"
                    value={formData.guardianName || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship
                  </label>
                  <select
                    name="guardianRelation"
                    value={formData.guardianRelation || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Select relationship</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Uncle">Uncle</option>
                    <option value="Aunt">Aunt</option>
                    <option value="Grandparent">Grandparent</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="guardianPhone"
                    value={formData.guardianPhone || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="guardianEmail"
                    value={formData.guardianEmail || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Occupation
                  </label>
                  <input
                    type="text"
                    name="guardianOccupation"
                    value={formData.guardianOccupation || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    National ID
                  </label>
                  <input
                    type="text"
                    name="guardianIdNumber"
                    value={formData.guardianIdNumber || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    name="guardianAddress"
                    value={formData.guardianAddress || ""}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={saving}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}