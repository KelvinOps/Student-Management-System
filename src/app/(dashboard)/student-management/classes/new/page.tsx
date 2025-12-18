// app/(dashboard)/student-management/classes/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { createClass } from '@/actions/class';
import { toast } from 'sonner';

interface Programme {
  id: string;
  name: string;
  department: string;
}

interface FormData {
  code: string;
  name: string;
  department: string;
  programmeId: string;
  branch: string;
  sessionType: string;
  modeOfStudy: string;
  startDate: string;
  endDate: string;
}

interface Department {
  id: string;
  name: string;
}

// Hardcoded data matching your institution
const INSTITUTION_DATA = {
  departments: [
    "Information Communication Technology",
    "Mechanical Engineering", 
    "Building and Civil Engineering",
    "Electrical and Electronic",
    "Fashion Design & Cosmetology",
    "Hospitality And Tourism",
    "Agriculture",
    "Business"
  ],
  
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
      "Certificate In Human Resource Management",
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
  }
};

export default function AddClassPage(): React.ReactElement {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    department: '',
    programmeId: '',
    branch: 'Main Campus',
    sessionType: 'Semester',
    modeOfStudy: 'Full Time',
    startDate: '',
    endDate: '',
  });

  // Initialize departments from hardcoded data
  useEffect(() => {
    const formattedDepartments = INSTITUTION_DATA.departments.map(dept => ({
      id: dept,
      name: dept
    }));
    setDepartments(formattedDepartments);
  }, []);

  // Load programmes when department changes
  useEffect(() => {
    if (formData.department) {
      const departmentProgrammes = INSTITUTION_DATA.departmentProgrammes[
        formData.department as keyof typeof INSTITUTION_DATA.departmentProgrammes
      ] || [];
      
      const formattedProgrammes = departmentProgrammes.map((prog, index) => ({
        id: `${formData.department}_${index}`, // Create a unique ID
        name: prog,
        department: formData.department
      }));
      
      setProgrammes(formattedProgrammes);
      
      // Clear selected programme when department changes
      setFormData(prev => ({ ...prev, programmeId: '' }));
    } else {
      setProgrammes([]);
      setFormData(prev => ({ ...prev, programmeId: '' }));
    }
  }, [formData.department]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    // Validation
    if (
      !formData.code ||
      !formData.name ||
      !formData.department ||
      !formData.programmeId ||
      !formData.startDate ||
      !formData.endDate
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast.error('End date must be after start date');
      return;
    }

    setLoading(true);

    try {
      // Find the selected programme
      const selectedProgramme = programmes.find(prog => prog.id === formData.programmeId);
      
      if (!selectedProgramme) {
        toast.error('Selected programme not found');
        setLoading(false);
        return;
      }

      // Create class - ONLY PASS THE FIELDS THAT createClass ACCEPTS
      const result = await createClass({
        code: formData.code,
        name: formData.name,
        programmeId: formData.programmeId, // This is the ID from our hardcoded data
        branch: formData.branch,
        sessionType: formData.sessionType,
        modeOfStudy: formData.modeOfStudy,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      });

      if (result.success) {
        toast.success(result.message || 'Class created successfully');
        router.push('/student-management/classes');
      } else {
        toast.error(result.error || 'Failed to create class');
      }
    } catch (error) {
      console.error('Error creating class:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
          type="button"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Class</h1>
          <p className="text-gray-600 mt-1">Create a new class for student enrollment</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Class Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="code"
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
                  placeholder="e.g., ICT(L6)/2025/S"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Unique identifier for the class
                </p>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Class Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
                  placeholder="e.g., ICT Diploma 2025 Sept"
                />
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="programmeId" className="block text-sm font-medium text-gray-700 mb-2">
                  Programme <span className="text-red-500">*</span>
                </label>
                <select
                  id="programmeId"
                  name="programmeId"
                  value={formData.programmeId}
                  onChange={handleChange}
                  required
                  disabled={!formData.department || programmes.length === 0}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!formData.department 
                      ? 'Select a department first' 
                      : programmes.length === 0 
                        ? 'No programmes found for this department' 
                        : 'Select Programme'
                    }
                  </option>
                  {programmes.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.name}
                    </option>
                  ))}
                </select>
                {formData.department && programmes.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No programmes available for the selected department
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-2">
                  Branch <span className="text-red-500">*</span>
                </label>
                <input
                  id="branch"
                  type="text"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
                  placeholder="Main Campus"
                />
              </div>
            </div>
          </div>

          {/* Academic Details */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Academic Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="sessionType" className="block text-sm font-medium text-gray-700 mb-2">
                  Session Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="sessionType"
                  name="sessionType"
                  value={formData.sessionType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
                >
                  <option value="Semester">Semester</option>
                  <option value="Term">Term</option>
                  <option value="Trimester">Trimester</option>
                </select>
              </div>

              <div>
                <label htmlFor="modeOfStudy" className="block text-sm font-medium text-gray-700 mb-2">
                  Mode of Study <span className="text-red-500">*</span>
                </label>
                <select
                  id="modeOfStudy"
                  name="modeOfStudy"
                  value={formData.modeOfStudy}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
                >
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Evening">Evening</option>
                  <option value="Weekend">Weekend</option>
                </select>
              </div>

              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="startDate"
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="endDate"
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.department || !formData.programmeId}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save size={18} />
                Create Class
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}