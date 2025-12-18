'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/app/lib/prisma';
import type { 
  Gender, 
  Session, 
  AcademicStatus,
  Student,
  Class,
  Programme,
  Department,
  SubjectRegistration,
  Subject,
  FeePayment
} from '@prisma/client';
import { findOrCreateDepartment, findOrCreateProgramme } from '@/actions/department';

// Types for responses
type StudentWithRelations = Student & {
  class: Class;
  programme: Programme;
  department: Department;
};

type StudentWithFullRelations = Student & {
  class: Class;
  programme: Programme;
  department: Department;
  subjectRegistrations: (SubjectRegistration & {
    subject: Subject;
  })[];
  feePayments: FeePayment[];
};

type StudentListItem = Student & {
  class: {
    id: string;
    code: string;
    name: string;
  };
  programme: {
    id: string;
    code: string;
    name: string;
  };
  department: {
    id: string;
    code: string;
    name: string;
  };
};

type StudentSearchResult = {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string | null;
  class: {
    code: string;
  } | null;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

// Input types
export type CreateStudentInput = {
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  gender: Gender;
  dateOfBirth: Date | string;
  nationality?: string;
  idNumber?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  avatar?: string | null;
  religion?: string | null;
  cohort: string;
  academicYear: string;
  session: Session;
  classId: string;
  programmeId: string;
  departmentId: string;
  sportsHouse?: string | null;
  stream?: string | null;
  previousSchool?: string | null;
  kcpeScore?: number | null;
  specialNeeds?: string | null;
  academicStatus?: AcademicStatus;
  personnelId?: string | null;
  address?: string | null;
  county?: string | null;
  subCounty?: string | null;
  ward?: string | null;
  village?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  guardianEmail?: string | null;
  guardianRelation?: string | null;
  guardianOccupation?: string | null;
  guardianIdNumber?: string | null;
  guardianAddress?: string | null;
};

export type UpdateStudentInput = Partial<CreateStudentInput> & {
  id: string;
};

export async function createStudent(data: CreateStudentInput): Promise<ApiResponse<StudentWithRelations>> {
  try {
    // Check if admission number already exists
    const existingStudent = await prisma.student.findUnique({
      where: { admissionNumber: data.admissionNumber },
    });

    if (existingStudent) {
      return {
        success: false,
        error: 'A student with this admission number already exists',
      };
    }

    // Check if ID number exists (if provided)
    if (data.idNumber) {
      const existingIdNumber = await prisma.student.findUnique({
        where: { idNumber: data.idNumber },
      });

      if (existingIdNumber) {
        return {
          success: false,
          error: 'A student with this ID number already exists',
        };
      }
    }

    // Convert dateOfBirth to Date if it's a string
    const dateOfBirth = typeof data.dateOfBirth === 'string' 
      ? new Date(data.dateOfBirth) 
      : data.dateOfBirth;

    // --- FIX: Handle department and programme IDs ---
    let departmentId = data.departmentId;
    let programmeId = data.programmeId;

    // Check if departmentId is a name (not a UUID)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(departmentId);
    
    if (!isUuid) {
      // Find or create department by name
      const deptResult = await findOrCreateDepartment(departmentId);
      if (!deptResult.success) {
        return {
          success: false,
          error: deptResult.error || 'Failed to process department',
        };
      }
      departmentId = deptResult.data!.id;
    }

    // Check if programmeId is a name (not a UUID)
    const isProgrammeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(programmeId);
    
    if (!isProgrammeUuid) {
      // Find or create programme by name and department
      const progResult = await findOrCreateProgramme(programmeId, departmentId);
      if (!progResult.success) {
        return {
          success: false,
          error: progResult.error || 'Failed to process programme',
        };
      }
      programmeId = progResult.data!.id;
    }

    // Create student with the resolved UUIDs
    const student = await prisma.student.create({
      data: {
        admissionNumber: data.admissionNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName || null,
        gender: data.gender,
        dateOfBirth: dateOfBirth,
        nationality: data.nationality || 'Kenyan',
        idNumber: data.idNumber || null,
        email: data.email || null,
        phoneNumber: data.phoneNumber || null,
        avatar: data.avatar || null,
        religion: data.religion || null,
        cohort: data.cohort,
        academicYear: data.academicYear,
        session: data.session,
        classId: data.classId,
        programmeId: programmeId,
        departmentId: departmentId,
        sportsHouse: data.sportsHouse || null,
        stream: data.stream || null,
        previousSchool: data.previousSchool || null,
        kcpeScore: data.kcpeScore || null,
        specialNeeds: data.specialNeeds || null,
        academicStatus: data.academicStatus || 'ACTIVE',
        personnelId: data.personnelId || null,
        address: data.address || null,
        county: data.county || null,
        subCounty: data.subCounty || null,
        ward: data.ward || null,
        village: data.village || null,
        guardianName: data.guardianName || null,
        guardianPhone: data.guardianPhone || null,
        guardianEmail: data.guardianEmail || null,
        guardianRelation: data.guardianRelation || null,
        guardianOccupation: data.guardianOccupation || null,
        guardianIdNumber: data.guardianIdNumber || null,
        guardianAddress: data.guardianAddress || null,
      },
      include: {
        class: true,
        programme: true,
        department: true,
      },
    });

    revalidatePath('/student-management/students');
    
    return {
      success: true,
      data: student,
      message: 'Student created successfully',
    };
  } catch (error: unknown) {
    console.error('Error creating student:', error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === 'P2002') {
        return {
          success: false,
          error: 'A student with this information already exists',
        };
      }
      if (prismaError.code === 'P2003') {
        return {
          success: false,
          error: 'Invalid class, programme, or department selected',
        };
      }
    }
    
    return {
      success: false,
      error: 'Failed to create student. Please try again.',
    };
  }
}

export async function updateStudent(data: UpdateStudentInput): Promise<ApiResponse<StudentWithRelations>> {
  try {
    const { id, ...updateData } = data;

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id },
    });

    if (!existingStudent) {
      return {
        success: false,
        error: 'Student not found',
      };
    }

    // Build update data object with proper types
    const processedData: Record<string, unknown> = {};
    
    // Copy all defined values from updateData
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        processedData[key] = value;
      }
    });

    // Convert dateOfBirth if provided
    if (updateData.dateOfBirth !== undefined) {
      processedData.dateOfBirth = typeof updateData.dateOfBirth === 'string'
        ? new Date(updateData.dateOfBirth)
        : updateData.dateOfBirth;
    }

    // Update student
    const student = await prisma.student.update({
      where: { id },
      data: processedData,
      include: {
        class: true,
        programme: true,
        department: true,
      },
    });

    revalidatePath('/student-management/students');
    revalidatePath(`/student-management/students/${id}`);
    
    return {
      success: true,
      data: student,
      message: 'Student updated successfully',
    };
  } catch (error: unknown) {
    console.error('Error updating student:', error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === 'P2002') {
        return {
          success: false,
          error: 'A student with this information already exists',
        };
      }
    }
    
    return {
      success: false,
      error: 'Failed to update student. Please try again.',
    };
  }
}

export async function deleteStudent(id: string): Promise<ApiResponse<null>> {
  try {
    await prisma.student.delete({
      where: { id },
    });

    revalidatePath('/student-management/students');
    
    return {
      success: true,
      message: 'Student deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting student:', error);
    return {
      success: false,
      error: 'Failed to delete student. Please try again.',
    };
  }
}

export async function getStudents(params: {
  page?: number;
  limit?: number;
  search?: string;
  classId?: string;
  programmeId?: string;
  departmentId?: string;
  academicStatus?: string;
}): Promise<ApiResponse<StudentListItem[]>> {
  try {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause with proper type safety
    type StudentWhereInput = {
      OR?: Array<{
        admissionNumber?: { contains: string; mode: 'insensitive' };
        firstName?: { contains: string; mode: 'insensitive' };
        lastName?: { contains: string; mode: 'insensitive' };
        email?: { contains: string; mode: 'insensitive' };
      }>;
      classId?: string;
      programmeId?: string;
      departmentId?: string;
      academicStatus?: AcademicStatus;
    };

    const where: StudentWhereInput = {};

    // Search filter
    if (params.search && params.search.trim()) {
      where.OR = [
        { admissionNumber: { contains: params.search, mode: 'insensitive' } },
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    // Filters with proper type checking
    if (params.classId && params.classId.trim()) {
      where.classId = params.classId;
    }
    
    if (params.programmeId && params.programmeId.trim()) {
      where.programmeId = params.programmeId;
    }
    
    if (params.departmentId && params.departmentId.trim()) {
      where.departmentId = params.departmentId;
    }
    
    // Handle academicStatus - ensure it's a valid enum value
    if (params.academicStatus && params.academicStatus.trim()) {
      const validStatuses = ['ACTIVE', 'INACTIVE', 'GRADUATED', 'SUSPENDED', 'EXPELLED', 'WITHDRAWN'];
      if (validStatuses.includes(params.academicStatus)) {
        where.academicStatus = params.academicStatus as AcademicStatus;
      }
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: {
          class: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          programme: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          department: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.student.count({ where }),
    ]);

    return {
      success: true,
      data: students,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching students:', error);
    return {
      success: false,
      error: 'Failed to fetch students',
      data: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    };
  }
}

export async function getStudentById(id: string): Promise<ApiResponse<StudentWithFullRelations>> {
  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        class: true,
        programme: true,
        department: true,
        subjectRegistrations: {
          include: {
            subject: true,
          },
        },
        feePayments: {
          orderBy: {
            paymentDate: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!student) {
      return {
        success: false,
        error: 'Student not found',
      };
    }

    return {
      success: true,
      data: student,
    };
  } catch (error) {
    console.error('Error fetching student:', error);
    return {
      success: false,
      error: 'Failed to fetch student details',
    };
  }
}

export async function generateAdmissionNumber(): Promise<ApiResponse<string>> {
  try {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    
    const lastStudent = await prisma.student.findFirst({
      orderBy: {
        admissionNumber: 'desc',
      },
      where: {
        admissionNumber: {
          startsWith: 'KTYC/S/',
        },
      },
    });

    let nextNumber = 1;
    if (lastStudent) {
      const match = lastStudent.admissionNumber.match(/\/(\d+)\//);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return {
      success: true,
      data: `KTYC/S/${nextNumber}/${currentYear}`,
    };
  } catch (error) {
    console.error('Error generating admission number:', error);
    return {
      success: false,
      error: 'Failed to generate admission number',
    };
  }
}

type StudentStats = {
  total: number;
  active: number;
  male: number;
  female: number;
  graduated: number;
};

export async function getStudentStats(): Promise<ApiResponse<StudentStats>> {
  try {
    const [total, active, male, female, graduated] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { academicStatus: 'ACTIVE' } }),
      prisma.student.count({ where: { gender: 'MALE' } }),
      prisma.student.count({ where: { gender: 'FEMALE' } }),
      prisma.student.count({ where: { academicStatus: 'GRADUATED' } }),
    ]);

    return {
      success: true,
      data: { total, active, male, female, graduated },
    };
  } catch (error) {
    console.error('Error fetching student stats:', error);
    return {
      success: false,
      error: 'Failed to fetch student statistics',
    };
  }
}

export async function searchStudents(query: string): Promise<ApiResponse<StudentSearchResult[]>> {
  try {
    if (!query || query.trim().length < 2) {
      return { success: true, data: [] };
    }

    const students = await prisma.student.findMany({
      where: {
        OR: [
          { admissionNumber: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { idNumber: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        admissionNumber: true,
        firstName: true,
        lastName: true,
        middleName: true,
        email: true,
        class: {
          select: {
            code: true,
          },
        },
      },
      take: 10,
    });

    return {
      success: true,
      data: students,
    };
  } catch (error) {
    console.error('Error searching students:', error);
    return {
      success: false,
      error: 'Failed to search students',
      data: [],
    };
  }
}