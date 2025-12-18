// app/(dashboard)/student-management/classes/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { createClass, getProgrammesForDropdown } from '@/actions/class';
import { toast } from 'sonner';

interface Programme {
  id: string;
  code: string;
  name: string;
  department: {
    name: string;
  };
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

export default function AddClassPage(): React.ReactElement {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingProgrammes, setLoadingProgrammes] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [allProgrammes, setAllProgrammes] = useState<Programme[]>([]);
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

  // Initialize departments and fetch all programmes
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Initialize departments
        const deptNames = [
          "Information Communication Technology",
          "Mechanical Engineering", 
          "Building and Civil Engineering",
          "Electrical and Electronic",
          "Fashion Design & Cosmetology",
          "Hospitality And Tourism",
          "Agriculture",
          "Business",
          "Hospitality and Institutional Management"
        ];
        
        const formattedDepartments = deptNames.map(dept => ({
          id: dept,
          name: dept
        }));
        setDepartments(formattedDepartments);

        // Fetch actual programmes from database
        setLoadingProgrammes(true);
        const result = await getProgrammesForDropdown();
        if (result.success && result.data) {
          setAllProgrammes(result.data as Programme[]);
        } else {
          toast.error('Failed to load programmes');
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoadingProgrammes(false);
      }
    };

    initializeData();
  }, []);

  // Filter programmes when department changes
  useEffect(() => {
    if (formData.department && allProgrammes.length > 0) {
      // Filter programmes by department name (case-insensitive)
      const filteredProgrammes = allProgrammes.filter(prog => 
        prog.department.name.toLowerCase() === formData.department.toLowerCase()
      );
      setProgrammes(filteredProgrammes);
      
      // Clear selected programme when department changes
      setFormData(prev => ({ ...prev, programmeId: '' }));
    } else {
      setProgrammes([]);
      setFormData(prev => ({ ...prev, programmeId: '' }));
    }
  }, [formData.department, allProgrammes]);

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
      // Find the selected programme to verify it exists
      const selectedProgramme = programmes.find(prog => prog.id === formData.programmeId);
      
      if (!selectedProgramme) {
        toast.error('Selected programme not found');
        setLoading(false);
        return;
      }

      // Create class with database programme ID
      const result = await createClass({
        code: formData.code,
        name: formData.name,
        programmeId: formData.programmeId, // This should be a valid database ID
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
                  disabled={!formData.department || loadingProgrammes || programmes.length === 0}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingProgrammes 
                      ? 'Loading programmes...' 
                      : !formData.department 
                        ? 'Select a department first' 
                        : programmes.length === 0 
                          ? 'No programmes found for this department' 
                          : 'Select Programme'
                    }
                  </option>
                  {programmes.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.code} - {prog.name}
                    </option>
                  ))}
                </select>
                {formData.department && programmes.length === 0 && !loadingProgrammes && (
                  <p className="text-xs text-amber-600 mt-1">
                    No programmes found for this department. Please add programmes in the database first.
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