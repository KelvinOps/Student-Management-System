// app/academics/tutors/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react'; // Added useCallback
import { getTutors, deleteTutor, generateEmployeeCode, createTutor } from '@/actions/tutor';
import type { CreateTutorInput } from '@/actions/tutor';

type TutorWithAssignments = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  specialization: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  subjectAssignments: Array<{
    subject: {
      id: string;
      name: string;
    };
  }>;
  _count?: {
    timetableEntries: number;
  };
};

export default function TutorsPage() {
  const [tutors, setTutors] = useState<TutorWithAssignments[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState<CreateTutorInput>({
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    specialization: '',
    isActive: true,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Define loadTutors with useCallback
  const loadTutors = useCallback(async () => {
    setLoading(true);
    const response = await getTutors({ page, limit: 10, search });
    if (response.success && response.data) {
      setTutors(response.data);
      setTotalPages(response.pagination?.totalPages || 1);
    }
    setLoading(false);
  }, [page, search]); // Add dependencies

  useEffect(() => {
    loadTutors();
  }, [page, search, loadTutors]); // Add loadTutors to dependencies

  const handleGenerateCode = async () => {
    const response = await generateEmployeeCode();
    if (response.success && response.data) {
      setFormData({ ...formData, employeeCode: response.data });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const response = await createTutor(formData);
    if (response.success) {
      setSuccess(response.message || 'Tutor created successfully');
      setShowForm(false);
      setFormData({
        employeeCode: '',
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        specialization: '',
        isActive: true,
      });
      loadTutors();
    } else {
      setError(response.error || 'Failed to create tutor');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tutor?')) return;

    const response = await deleteTutor(id);
    if (response.success) {
      setSuccess(response.message || 'Tutor deleted successfully');
      loadTutors();
    } else {
      setError(response.error || 'Failed to delete tutor');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Tutors Management</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Search tutors..."
            className="flex-1 px-4 py-2 border rounded"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Add Tutor'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-semibold">Employee Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    className="flex-1 px-4 py-2 border rounded"
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-semibold">Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-2 border rounded"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold">First Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold">Last Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold">Phone Number</label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 border rounded"
                  value={formData.phoneNumber || ''}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold">Specialization</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded"
                  value={formData.specialization || ''}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                Active
              </label>
            </div>

            <button
              type="submit"
              className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              Create Tutor
            </button>
          </form>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Subjects</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tutors.map((tutor) => (
                  <tr key={tutor.id} className="border-t">
                    <td className="px-4 py-3">{tutor.employeeCode}</td>
                    <td className="px-4 py-3">{`${tutor.firstName} ${tutor.lastName}`}</td>
                    <td className="px-4 py-3">{tutor.email}</td>
                    <td className="px-4 py-3">
                      {tutor.subjectAssignments.length > 0
                        ? tutor.subjectAssignments.map(a => a.subject.name).join(', ')
                        : 'None'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          tutor.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {tutor.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(tutor.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}