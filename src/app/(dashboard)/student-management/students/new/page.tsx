// src/app/(dashboard)/student-management/students/new/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createStudent, generateAdmissionNumber } from '@/actions/student';
import { getDepartments, getProgrammesByDepartment } from '@/actions/department';
import { getClasses } from '@/actions/class';
import { Gender, Session } from '@prisma/client';

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

// Data extracted from your provided dataset
const INSTITUTION_DATA = {
  departments: [
    "Information Communication Technology",
    "Mechanical Engineering", 
    "Building and Civil Engineering",
    "Electrical and Electronic",
    "Fashion Design & Cosmetology",
    "Hospitality And Tourism",
    "Agriculture",
    "Business",
  ],
  
  // Mapping of department to its programmes
  departmentProgrammes: {
    "Information Communication Technology": [
      "Certificate In Information Communication Technology L5",
      "Computer Operation NITA Grade III",
      "Computer Packages",
      "Diploma In Information Communication Technology L6",
      "Artisan In ICT Technician (l4)"
    ],
    "Mechanical Engineering": [
      "Diploma Automotive Technician (L6)",
      "Artisan In Automotive Mechanic L3",
      "Certificate In Automotive Technician L5",
      "Artisan in Automotive Technology L4"
    ],
    "Building and Civil Engineering": [
      "Plumbing L4",
      "Certificate Building Technician L5",
      "Certificate In Plumbing L5",
      "Masonry L4",
      "Certificate in Welding & Fabrication L5",
      "Diploma In Civil Engineering L6",
      "Diploma In Building Technology",
      "Artisan In Welding & Fabrication L4",
      "Plumbing NITA GRADE III",
      "Artisan In Masonry"
    ],
    "Electrical and Electronic": [
      "Driving School B-Light",
      "Electrical Wireman NITA GRADE III",
      "Diploma In Electrical Engineering L6",
      "Certificate In electrical operator L5",
      "Artisan In Electrical Installation L3",
      "Artisan In Electrical Installation L4"
    ],
    "Fashion Design & Cosmetology": [
      "Hairdressing NITA Grade III",
      "Cosmetology L3",
      "Cosmetology L5",
      "Artisan In Fashion Design (L4)",
      "Certificate In Hairdressing L5",
      "Certificate In Fashion Design L5",
      "Dressmaking NITA Grade III",
      "Certificate In Beauty Therapy L5",
      "Diploma In Beauty Therapy L6",
      "Artisan In Beauty Therapy L4",
      "Diploma In Fashion Design L6",
      "HAIRDRESSING L6",
      "Artisan In Hairdressing L4",
      "Artisan In Hairdressing L3",
      "Artisan in Beauty Therapy L3"
    ],
    "Hospitality And Tourism": [
      "FOOD AND BEVERAGE L4",
      "FOOD AND BEVERAGE L3",
      "FOOD AND BEVERAGE L5",
      "FOOD AND BEVERAGE L6"
    ],
    "Agriculture": [
      "Sustainable Agriculture for Rural Development Level 5",
      "Diploma In Agriculture Extension L6",
      "Diploma In Agriculture",
      "Horticulture Production Level 5",
      "Artisan in Food Production L4",
      "Diploma in Food Production L6",
      "Certificate in Food Production L5",
      "Artisan In Agriculture"
    ],
    "Business": [
      "Certificate In community Development an Social Work L5",
      "Diploma in Community Development and Social Work L6",
      "Certificate In Office Administration L5",
      "Diploma in Accountancy L6",
      "Diploma In Office administration Level 6",
      "Certificate In Huma Resource Management",
      "Artisan In Social Work and Community Development L4",
      "Certificate In Land Survey L5",
      "Certificate in Human Resource Management L5",
      "Diploma In Supply Chain Management",
      "Certificate In Supply Chain Management",
      "Diploma In Survey",
      "Diploma In Human Resource Management L6",
      "Diploma In Baking Technology L6",
      "Office Assistant Level 4"
    ]
  },
  
  // Cohort data from your dataset
  cohorts: [
    "SEPT - DEC 2025",
    "MAY-AUGUST 2025", 
    "JAN- APR 2025",
    "SEPT - DEC 2025",
    "MAY-AUGUST 2025",
    "JAN- APR 2025",
    "SEPT - DEC 2025",
    "MAY-AUGUST 2025",
    "JAN- APR 2025"
  ]
};

export default function NewStudentPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    // Personal
    firstName: '',
    lastName: '',
    middleName: '',
    gender: '' as Gender | '',
    dateOfBirth: '',
    nationality: 'Kenyan',
    idNumber: '',
    email: '',
    phoneNumber: '',
    religion: '',
    address: '',
    county: '',
    
    // Academic
    admissionNumber: '',
    cohort: '',
    academicYear: new Date().getFullYear().toString(),
    session: '' as Session | '',
    classId: '',
    programmeId: '',
    departmentId: '',
    stream: '',
    previousSchool: '',
    kcpeScore: '',
    specialNeeds: '',
    sportsHouse: '',
    
    // Guardian
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    guardianRelation: '',
    guardianOccupation: '',
    guardianIdNumber: '',
    guardianAddress: '',
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [cohorts] = useState<string[]>(Array.from(new Set(INSTITUTION_DATA.cohorts)));

  // Load initial data
  useEffect(() => {
    loadDepartments();
    loadClasses();
    loadAdmissionNumber();
  }, []);

  // Load programmes when department changes
  useEffect(() => {
    if (formData.departmentId) {
      loadProgrammes(formData.departmentId);
    } else {
      setProgrammes([]);
    }
  }, [formData.departmentId]);

  const loadAdmissionNumber = async () => {
    const result = await generateAdmissionNumber();
    if (result.success && result.data) {
      setFormData(prev => ({ ...prev, admissionNumber: result.data as string }));
    }
  };

  const loadDepartments = () => {
    // Use static data from INSTITUTION_DATA
    const formattedDepartments = INSTITUTION_DATA.departments.map(dept => ({
      id: dept,
      name: dept
    }));
    setDepartments(formattedDepartments);
  };

  const loadProgrammes = (departmentId: string) => {
    // Find the selected department name
    const selectedDepartment = departments.find(dept => dept.id === departmentId);
    
    if (selectedDepartment) {
      // Get programmes for this department from static data
      const departmentProgrammes = INSTITUTION_DATA.departmentProgrammes[
        selectedDepartment.name as keyof typeof INSTITUTION_DATA.departmentProgrammes
      ] || [];
      
      const formattedProgrammes = departmentProgrammes.map(prog => ({
        id: prog,
        name: prog
      }));
      
      setProgrammes(formattedProgrammes);
    } else {
      setProgrammes([]);
    }
  };

  const loadClasses = async () => {
    const result = await getClasses();
    if (result.success && Array.isArray(result.data)) {
      setClasses(result.data);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await createStudent({
        ...formData,
        gender: formData.gender as Gender,
        session: formData.session as Session,
        dateOfBirth: new Date(formData.dateOfBirth),
        kcpeScore: formData.kcpeScore ? parseInt(formData.kcpeScore) : undefined,
      });

      if (result.success) {
        setSuccess('Student created successfully!');
        setTimeout(() => {
          router.push('/student-management/students');
        }, 1500);
      } else {
        setError(result.error || 'Failed to create student');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Student</h1>
          <p className="text-gray-600 mt-1">Fill in the student information below</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'personal'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Personal Information
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('academic')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'academic'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Academic Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('guardian')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'guardian'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Guardian Information
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter first name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter last name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter middle name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    value={formData.idNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter ID number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Religion
                  </label>
                  <input
                    type="text"
                    name="religion"
                    value={formData.religion}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter religion"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    County
                  </label>
                  <input
                    type="text"
                    name="county"
                    value={formData.county}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter county"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter residential address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="student@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="+254 7XX XXX XXX"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'academic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admission Number *
                  </label>
                  <input
                    type="text"
                    name="admissionNumber"
                    value={formData.admissionNumber}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    placeholder="Auto-generated"
                    disabled
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="2025"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  <select
                    name="cohort"
                    value={formData.cohort}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select cohort</option>
                    {cohorts.map((cohort, index) => (
                      <option key={index} value={cohort}>
                        {cohort}
                      </option>
                    ))}
                  </select>
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Select programme</option>
                    {programmes.map((prog) => (
                      <option key={prog.id} value={prog.id}>
                        {prog.name}
                      </option>
                    ))}
                    {programmes.length === 0 && formData.departmentId && (
                      <option value="" disabled>Select a department first</option>
                    )}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    Stream
                  </label>
                  <input
                    type="text"
                    name="stream"
                    value={formData.stream}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter stream"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Previous School
                  </label>
                  <input
                    type="text"
                    name="previousSchool"
                    value={formData.previousSchool}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter previous school name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    KCPE Score
                  </label>
                  <input
                    type="number"
                    name="kcpeScore"
                    value={formData.kcpeScore}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter KCPE marks"
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
                    value={formData.specialNeeds}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter any special needs or medical conditions"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guardian' && (
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
                    value={formData.guardianName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter guardian name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship
                  </label>
                  <select
                    name="guardianRelation"
                    value={formData.guardianRelation}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    value={formData.guardianPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="+254 7XX XXX XXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="guardianEmail"
                    value={formData.guardianEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="guardian@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Occupation
                  </label>
                  <input
                    type="text"
                    name="guardianOccupation"
                    value={formData.guardianOccupation}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter occupation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    National ID
                  </label>
                  <input
                    type="text"
                    name="guardianIdNumber"
                    value={formData.guardianIdNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter ID number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    name="guardianAddress"
                    value={formData.guardianAddress}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter address"
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
            disabled={loading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Student'}
          </button>
        </div>
      </form>
    </div>
  );
}