// src/actions/id-card.ts
"use server";

import prisma from "@/app/lib/prisma";
import { Prisma, AcademicStatus, Session } from "@prisma/client";

interface IDCardFilters {
  departmentId?: string;
  classId?: string;
  academicStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface IDCardData {
  id: string;
  name: string;
  admissionNo: string;
  avatar: string | null;
  class: string;
  programme: string;
  department: string;
  academicYear: string;
  session: string;
  validUntil: string;
}

interface IDCardResponse {
  success: boolean;
  data: IDCardData[];
  pagination?: {
    total: number;
    totalPages: number;
    currentPage: number;
  };
  error?: string;
}

// Calculate valid until date (typically 4 years from academic year start)
function calculateValidUntil(academicYear: string, session: Session): string {
  const yearMatch = academicYear.match(/\d{4}/);
  if (!yearMatch) return 'N/A';
  
  const startYear = parseInt(yearMatch[0]);
  
  // Determine session end month based on session type
  let endMonth = 12; // Default to December
  
  if (session === Session.JAN_APRIL) {
    endMonth = 4; // April
  } else if (session === Session.MAY_AUGUST) {
    endMonth = 8; // August
  } else if (session === Session.SEPT_DEC) {
    endMonth = 12; // December
  }
  
  // Calculate end year based on session
  const endYear = startYear + 4;
  
  // Format date string
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const monthName = monthNames[endMonth - 1];
  const lastDayOfMonth = new Date(endYear, endMonth, 0).getDate();
  
  return `${lastDayOfMonth} ${monthName} ${endYear}`;
}

// Helper function to format session for display
function formatSessionForDisplay(session: Session): string {
  return session.replace(/_/g, '-');
}

export async function getIDCardsData(filters?: IDCardFilters): Promise<IDCardResponse> {
  try {
    const page = filters?.page || 1;
    const limit = filters?.limit || 12;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.StudentWhereInput = {
      academicStatus: 'ACTIVE', // Only active students get ID cards
    };

    if (filters?.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters?.classId) {
      where.classId = filters.classId;
    }

    if (filters?.academicStatus) {
      where.academicStatus = filters.academicStatus as AcademicStatus;
    }

    if (filters?.search) {
      where.OR = [
        { admissionNumber: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.student.count({ where });

    // Get students with pagination
    const students = await prisma.student.findMany({
      where,
      include: {
        class: {
          select: {
            code: true,
            name: true,
          },
        },
        programme: {
          select: {
            name: true,
            code: true,
            duration: true,
          },
        },
        department: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        admissionNumber: 'asc',
      },
      skip,
      take: limit,
    });

    // Format data for ID cards
    const idCardData: IDCardData[] = students.map((student) => ({
      id: student.id,
      name: `${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim().toUpperCase(),
      admissionNo: student.admissionNumber,
      avatar: student.avatar,
      class: student.class?.code || 'N/A',
      programme: student.programme?.name || 'N/A',
      department: student.department?.name || 'N/A',
      academicYear: student.academicYear,
      session: formatSessionForDisplay(student.session),
      validUntil: calculateValidUntil(student.academicYear, student.session),
    }));

    return {
      success: true,
      data: idCardData,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  } catch (error) {
    console.error("Error fetching ID cards data:", error);
    return {
      success: false,
      error: "Failed to fetch ID cards data",
      data: [],
    };
  }
}

// Get single student for ID card generation
export async function getStudentIDCard(studentId: string): Promise<{ success: boolean; data?: IDCardData; error?: string }> {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: {
          select: {
            code: true,
            name: true,
          },
        },
        programme: {
          select: {
            name: true,
            code: true,
            duration: true,
          },
        },
        department: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    if (!student) {
      return {
        success: false,
        error: "Student not found",
      };
    }

    const idCardData: IDCardData = {
      id: student.id,
      name: `${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim().toUpperCase(),
      admissionNo: student.admissionNumber,
      avatar: student.avatar,
      class: student.class?.code || 'N/A',
      programme: student.programme?.name || 'N/A',
      department: student.department?.name || 'N/A',
      academicYear: student.academicYear,
      session: formatSessionForDisplay(student.session),
      validUntil: calculateValidUntil(student.academicYear, student.session),
    };

    return {
      success: true,
      data: idCardData,
    };
  } catch (error) {
    console.error("Error fetching student ID card:", error);
    return {
      success: false,
      error: "Failed to fetch student ID card",
    };
  }
}

// Bulk generate ID cards for multiple students
export async function getBulkIDCards(studentIds: string[]): Promise<IDCardResponse> {
  try {
    const students = await prisma.student.findMany({
      where: {
        id: {
          in: studentIds,
        },
        academicStatus: 'ACTIVE',
      },
      include: {
        class: {
          select: {
            code: true,
            name: true,
          },
        },
        programme: {
          select: {
            name: true,
            code: true,
            duration: true,
          },
        },
        department: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        admissionNumber: 'asc',
      },
    });

    // Format data for ID cards
    const idCardData: IDCardData[] = students.map((student) => ({
      id: student.id,
      name: `${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim().toUpperCase(),
      admissionNo: student.admissionNumber,
      avatar: student.avatar,
      class: student.class?.code || 'N/A',
      programme: student.programme?.name || 'N/A',
      department: student.department?.name || 'N/A',
      academicYear: student.academicYear,
      session: formatSessionForDisplay(student.session),
      validUntil: calculateValidUntil(student.academicYear, student.session),
    }));

    return {
      success: true,
      data: idCardData,
    };
  } catch (error) {
    console.error("Error generating bulk ID cards:", error);
    return {
      success: false,
      error: "Failed to generate bulk ID cards",
      data: [],
    };
  }
}

// Get departments for filter dropdown
export async function getDepartmentsForFilter() {
  try {
    const departments = await prisma.department.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      success: true,
      data: departments,
    };
  } catch (error) {
    console.error("Error fetching departments:", error);
    return {
      success: false,
      error: "Failed to fetch departments",
      data: [],
    };
  }
}

// Get classes for filter dropdown
export async function getClassesForFilter() {
  try {
    const classes = await prisma.class.findMany({
      where: {
        status: 'Active',
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      success: true,
      data: classes,
    };
  } catch (error) {
    console.error("Error fetching classes:", error);
    return {
      success: false,
      error: "Failed to fetch classes",
      data: [],
    };
  }
}

// Check if student is eligible for ID card
export async function checkStudentEligibility(studentId: string): Promise<{
  success: boolean;
  eligible: boolean;
  reason?: string;
  studentData?: IDCardData;
}> {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: {
          select: {
            code: true,
            name: true,
          },
        },
        programme: {
          select: {
            name: true,
            duration: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
        feePayments: {
          where: {
            status: 'COMPLETED',
          },
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!student) {
      return {
        success: false,
        eligible: false,
        reason: 'Student not found',
      };
    }

    // Check eligibility criteria
    const reasons: string[] = [];

    if (student.academicStatus !== 'ACTIVE') {
      reasons.push('Student is not active');
    }

    if (student.feePayments.length === 0) {
      reasons.push('No fee payments found');
    }

    if (reasons.length > 0) {
      return {
        success: true,
        eligible: false,
        reason: reasons.join(', '),
      };
    }

    // Student is eligible, format their data
    const studentData: IDCardData = {
      id: student.id,
      name: `${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim().toUpperCase(),
      admissionNo: student.admissionNumber,
      avatar: student.avatar,
      class: student.class?.code || 'N/A',
      programme: student.programme?.name || 'N/A',
      department: student.department?.name || 'N/A',
      academicYear: student.academicYear,
      session: formatSessionForDisplay(student.session),
      validUntil: calculateValidUntil(student.academicYear, student.session),
    };

    return {
      success: true,
      eligible: true,
      studentData,
    };
  } catch (error) {
    console.error("Error checking student eligibility:", error);
    return {
      success: false,
      eligible: false,
      reason: 'Error checking eligibility',
    };
  }
}