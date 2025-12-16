// app/(dashboard)/academics/curriculum/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, BookOpen } from 'lucide-react';

interface Curriculum {
  id: string;
  code: string;
  name: string;
  awardScheme: string;
  effectiveDate: Date;
  endDate: Date;
  programme?: {
    code: string;
    name: string;
  } | null;
}

export default function CurriculumPage() {
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState<Curriculum | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    awardScheme: 'General',
    effectiveDate: '',
    endDate: '',
  });

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockCurriculums: Curriculum[] = [
      {
        id: '1',
        code: 'ICT-2024',
        name: 'Information Technology Curriculum 2024',
        awardScheme: 'KNEC',
        effectiveDate: new Date('2024-01-01'),
        endDate: new Date('2029-12-31'),
        programme: {
          code: 'ICT-L6',
          name: 'Diploma in Information Technology',
        },
      },
      {
        id: '2',
        code: 'ENG-2024',
        name: 'Engineering Curriculum 2024',
        awardScheme: 'KNEC',
        effectiveDate: new Date('2024-01-01'),
        endDate: new Date('2029-12-31'),
        programme: {
          code: 'DME-L6',
          name: 'Diploma in Mechanical Engineering',
        },
      },
    ];
    setCurriculums(mockCurriculums);
    setLoading(false);
  }, []);

  const handleOpenModal = (curriculum?: Curriculum) => {
    if (curriculum) {
      setEditingCurriculum(curriculum);
      setFormData({
        code: curriculum.code,
        name: curriculum.name,
        awardScheme: curriculum.awardScheme,
        effectiveDate: new Date(curriculum.effectiveDate).toISOString().split('T')[0],
        endDate: new Date(curriculum.endDate).toISOString().split('T')[0],
      });
    } else {
      setEditingCurriculum(null);
      setFormData({
        code: '',
        name: '',
        awardScheme: 'General',
        effectiveDate: '',
        endDate: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCurriculum(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Save functionality to be implemented with API');
    handleCloseModal();
  };

  const filteredCurriculums = curriculums.filter((curriculum) =>
    curriculum.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    curriculum.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Curriculum Management</h1>
        <nav className="text-sm text-gray-600 mt-1">
          Dashboard &gt; Student Academics &gt; Curriculum
        </nav>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search curriculums..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 ml-auto"
          >
            <Plus size={18} />
            Add Curriculum
          </button>
        </div>
      </div>

      {/* Curriculums Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading curriculums...</div>
        ) : filteredCurriculums.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No curriculums found. Add your first curriculum to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Curriculum Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Programme
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Award Scheme
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Effective Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    End Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCurriculums.map((curriculum) => (
                  <tr key={curriculum.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {curriculum.code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-gray-400" />
                        {curriculum.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {curriculum.programme?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {curriculum.awardScheme}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(curriculum.effectiveDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(curriculum.endDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(curriculum)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => alert('Delete functionality to be implemented')}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingCurriculum ? 'Edit Curriculum' : 'Add New Curriculum'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Curriculum Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., ICT-2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Curriculum Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Information Technology Curriculum 2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Award Scheme <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.awardScheme}
                  onChange={(e) => setFormData({ ...formData, awardScheme: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                >
                  <option value="General">General</option>
                  <option value="KNEC">KNEC</option>
                  <option value="NITA">NITA</option>
                  <option value="University">University</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Effective Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800"
                >
                  {editingCurriculum ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}