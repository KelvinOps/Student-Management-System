// actions/student-search.ts
'use server';

import prisma from '@/app/lib/prisma';
import { Prisma, AcademicStatus, Gender, Session } from '@prisma/client';

export interface SearchStudentFilters {
  search?: string;
  classId?: string;
  departmentId?: string;
  programmeId?: string;
  academicStatus?: string;
  gender?: string;
  session?: string;
}

export async function searchStudents(filters: SearchStudentFilters) {
  try {
    const {
      search = '',
      classId = '',
      departmentId = '',
      programmeId = '',
      academicStatus = '',
      gender = '',
      session = '',
    } = filters;

    // Build where clause
    const whereConditions: Prisma.StudentWhereInput[] = [];

    // Enhanced search filter - handles multiple words (e.g., "WASIKE KEMBOI")
    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      
      // Split search term into words for multi-word searches
      const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
      
      if (searchWords.length > 1) {
        // Multi-word search: Each word must be found in at least one name field
        // Example: "WASIKE KEMBOI" will find students where:
        //   - "WASIKE" is in firstName OR lastName OR middleName
        //   - AND "KEMBOI" is in firstName OR lastName OR middleName
        const wordConditions = searchWords.map(word => ({
          OR: [
            { firstName: { contains: word, mode: Prisma.QueryMode.insensitive } },
            { lastName: { contains: word, mode: Prisma.QueryMode.insensitive } },
            { middleName: { contains: word, mode: Prisma.QueryMode.insensitive } },
          ]
        }));
        
        // All words must match (AND) but each word can match any name field (OR)
        whereConditions.push({
          AND: wordConditions
        });
      } else {
        // Single word search: Search across all fields including non-name fields
        whereConditions.push({
          OR: [
            { firstName: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
            { lastName: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
            { middleName: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
            { admissionNumber: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
            { phoneNumber: { contains: searchTerm } },
            { idNumber: { contains: searchTerm } },
          ],
        });
      }
    }

    // Apply individual filters only if they have values
    if (classId && classId.trim() !== '') {
      whereConditions.push({ classId: classId.trim() });
    }

    if (departmentId && departmentId.trim() !== '') {
      whereConditions.push({ departmentId: departmentId.trim() });
    }

    if (programmeId && programmeId.trim() !== '') {
      whereConditions.push({ programmeId: programmeId.trim() });
    }

    if (academicStatus && academicStatus.trim() !== '') {
      whereConditions.push({ 
        academicStatus: academicStatus as AcademicStatus
      });
    }

    if (gender && gender.trim() !== '') {
      whereConditions.push({ 
        gender: gender as Gender
      });
    }

    if (session && session.trim() !== '') {
      whereConditions.push({ 
        session: session as Session
      });
    }

    // Final where clause
    const where: Prisma.StudentWhereInput = 
      whereConditions.length > 0 
        ? { AND: whereConditions } 
        : {};

    const students = await prisma.student.findMany({
      where,
      include: {
        class: {
          select: {
            id: true,
            code: true,
            name: true,
            branch: true,
          },
        },
        programme: {
          select: {
            id: true,
            code: true,
            name: true,
            level: true,
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
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
      take: 100,
    });

    return {
      success: true,
      data: students,
      total: students.length,
    };
  } catch (error) {
    console.error('Error searching students:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search students',
      data: [],
      total: 0,
    };
  }
}

export async function getStudentDetails(studentId: string) {
  try {
    if (!studentId || studentId.trim() === '') {
      return {
        success: false,
        error: 'Student ID is required',
      };
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: {
          include: {
            programme: true,
          },
        },
        programme: {
          include: {
            department: true,
          },
        },
        department: true,
        subjectRegistrations: {
          include: {
            subject: true,
          },
        },
        attendanceRecords: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        marksEntries: {
          include: {
            subject: true,
          },
          orderBy: { enteredAt: 'desc' },
        },
        feePayments: {
          orderBy: { paymentDate: 'desc' },
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
    console.error('Error fetching student details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch student details',
    };
  }
}

export async function getSearchFiltersData() {
  try {
    const [classes, departments, programmes] = await Promise.all([
      prisma.class.findMany({
        where: { status: 'Active' },
        select: { 
          id: true, 
          code: true, 
          name: true,
          branch: true,
        },
        orderBy: { code: 'asc' },
      }),
      prisma.department.findMany({
        where: { isActive: true },
        select: { 
          id: true, 
          code: true, 
          name: true 
        },
        orderBy: { name: 'asc' },
      }),
      prisma.programme.findMany({
        where: { isActive: true },
        select: { 
          id: true, 
          code: true, 
          name: true, 
          level: true 
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      success: true,
      data: {
        classes,
        departments,
        programmes,
      },
    };
  } catch (error) {
    console.error('Error fetching filter data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch filter data',
      data: {
        classes: [],
        departments: [],
        programmes: [],
      },
    };
  }
}

// Additional helper function for bulk operations
export async function getStudentCount(filters: SearchStudentFilters) {
  try {
    const whereConditions: Prisma.StudentWhereInput[] = [];

    if (filters.search?.trim()) {
      const searchTerm = filters.search.trim();
      const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
      
      if (searchWords.length > 1) {
        // Multi-word search
        const wordConditions = searchWords.map(word => ({
          OR: [
            { firstName: { contains: word, mode: Prisma.QueryMode.insensitive } },
            { lastName: { contains: word, mode: Prisma.QueryMode.insensitive } },
            { middleName: { contains: word, mode: Prisma.QueryMode.insensitive } },
          ]
        }));
        
        whereConditions.push({
          AND: wordConditions
        });
      } else {
        // Single word search
        whereConditions.push({
          OR: [
            { firstName: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
            { lastName: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
            { middleName: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
            { admissionNumber: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
          ],
        });
      }
    }

    if (filters.classId?.trim()) {
      whereConditions.push({ classId: filters.classId.trim() });
    }

    if (filters.departmentId?.trim()) {
      whereConditions.push({ departmentId: filters.departmentId.trim() });
    }

    if (filters.programmeId?.trim()) {
      whereConditions.push({ programmeId: filters.programmeId.trim() });
    }

    if (filters.academicStatus?.trim()) {
      whereConditions.push({ 
        academicStatus: filters.academicStatus as AcademicStatus 
      });
    }

    if (filters.gender?.trim()) {
      whereConditions.push({ 
        gender: filters.gender as Gender 
      });
    }

    if (filters.session?.trim()) {
      whereConditions.push({ 
        session: filters.session as Session 
      });
    }

    const where: Prisma.StudentWhereInput = 
      whereConditions.length > 0 
        ? { AND: whereConditions } 
        : {};

    const count = await prisma.student.count({ where });

    return {
      success: true,
      count,
    };
  } catch (error) {
    console.error('Error counting students:', error);
    return {
      success: false,
      error: 'Failed to count students',
      count: 0,
    };
  }
}

// Verify student exists by admission number
export async function verifyStudentByAdmissionNumber(admissionNumber: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { admissionNumber },
      select: {
        id: true,
        admissionNumber: true,
        firstName: true,
        lastName: true,
        academicStatus: true,
      },
    });

    return {
      success: true,
      exists: !!student,
      data: student,
    };
  } catch (error) {
    console.error('Error verifying student:', error);
    return {
      success: false,
      error: 'Failed to verify student',
      exists: false,
    };
  }
}