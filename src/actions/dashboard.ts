// src/actions/dashboard.ts
"use server";

import prisma from "@/app/lib/prisma";
import { AcademicStatus, Gender, Session } from "@prisma/client";

interface DashboardFilters {
  academicYear?: string;
  session?: Session;
  status?: AcademicStatus;
}

interface StudentFilters {
  academicYear?: string;
  session?: Session;
}

// Get dashboard statistics
export async function getDashboardStats(filters?: DashboardFilters) {
  try {
    const whereClause: {
      academicYear?: string;
      session?: Session;
      academicStatus?: AcademicStatus;
    } = {};

    if (filters?.academicYear) {
      whereClause.academicYear = filters.academicYear;
    }

    if (filters?.session) {
      whereClause.session = filters.session;
    }

    if (filters?.status) {
      whereClause.academicStatus = filters.status;
    } else {
      // Default to active students if no status filter
      whereClause.academicStatus = "ACTIVE";
    }

    // Total students count
    const totalStudents = await prisma.student.count({
      where: whereClause,
    });

    // Active classes count
    const activeClasses = await prisma.class.count({
      where: {
        status: "Active",
      },
    });

    // Total departments count
    const totalDepartments = await prisma.department.count({
      where: {
        isActive: true,
      },
    });

    // Calculate total revenue (sum of all completed fee payments)
    const totalRevenue = await prisma.feePayment.aggregate({
      where: {
        status: "COMPLETED",
        ...(filters?.academicYear && { academicYear: filters.academicYear }),
        ...(filters?.session && { session: filters.session }),
      },
      _sum: {
        amountPaid: true,
      },
    });

    return {
      success: true,
      data: {
        totalStudents,
        activeClasses,
        totalDepartments,
        totalRevenue: totalRevenue._sum.amountPaid || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      success: false,
      error: "Failed to fetch dashboard statistics",
    };
  }
}

// Get student population by gender
export async function getStudentsByGender(filters?: StudentFilters) {
  try {
    const whereClause: {
      academicStatus: AcademicStatus;
      academicYear?: string;
      session?: Session;
    } = {
      academicStatus: "ACTIVE",
    };

    if (filters?.academicYear) {
      whereClause.academicYear = filters.academicYear;
    }

    if (filters?.session) {
      whereClause.session = filters.session;
    }

    const genderCounts = await prisma.student.groupBy({
      by: ["gender"],
      where: whereClause,
      _count: {
        gender: true,
      },
    });

    const result: Record<Gender, number> = {
      MALE: 0,
      FEMALE: 0,
      OTHER: 0,
    };

    genderCounts.forEach((item) => {
      result[item.gender] = item._count.gender;
    });

    return {
      success: true,
      data: [
        { gender: "Male", count: result.MALE, color: "bg-cyan-600" },
        { gender: "Female", count: result.FEMALE, color: "bg-pink-600" },
        { gender: "Others", count: result.OTHER, color: "bg-purple-600" },
      ],
    };
  } catch (error) {
    console.error("Error fetching students by gender:", error);
    return {
      success: false,
      error: "Failed to fetch student gender distribution",
    };
  }
}

// Get student population per department
export async function getStudentsByDepartment(filters?: StudentFilters) {
  try {
    const whereClause: {
      academicStatus: AcademicStatus;
      academicYear?: string;
      session?: Session;
    } = {
      academicStatus: "ACTIVE",
    };

    if (filters?.academicYear) {
      whereClause.academicYear = filters.academicYear;
    }

    if (filters?.session) {
      whereClause.session = filters.session;
    }

    const totalStudents = await prisma.student.count({
      where: whereClause,
    });

    const departmentCounts = await prisma.student.groupBy({
      by: ["departmentId"],
      where: whereClause,
      _count: {
        departmentId: true,
      },
    });

    // Get department details
    const departments = await prisma.department.findMany({
      where: {
        id: {
          in: departmentCounts.map((d) => d.departmentId),
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const colors = [
      "bg-blue-600",
      "bg-red-600",
      "bg-teal-600",
      "bg-green-600",
      "bg-purple-600",
      "bg-yellow-600",
      "bg-orange-600",
      "bg-pink-600",
      "bg-indigo-600",
    ];

    const result = departmentCounts
      .map((item, index) => {
        const dept = departments.find((d) => d.id === item.departmentId);
        const count = item._count.departmentId;
        const percentage =
          totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;

        return {
          name: dept?.name || "Unknown",
          count,
          percentage,
          color: colors[index % colors.length],
        };
      })
      .sort((a, b) => b.count - a.count);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error fetching students by department:", error);
    return {
      success: false,
      error: "Failed to fetch department distribution",
    };
  }
}

// Get subject registration statistics
export async function getSubjectRegistrationStats(filters?: StudentFilters) {
  try {
    const whereClause: {
      academicStatus: AcademicStatus;
      academicYear?: string;
      session?: Session;
    } = {
      academicStatus: "ACTIVE",
    };

    if (filters?.academicYear) {
      whereClause.academicYear = filters.academicYear;
    }

    if (filters?.session) {
      whereClause.session = filters.session;
    }

    const totalStudents = await prisma.student.count({
      where: whereClause,
    });

    // Get students with subject registrations
    const studentsWithRegistrations = await prisma.student.findMany({
      where: whereClause,
      select: {
        id: true,
        subjectRegistrations: {
          select: {
            id: true,
          },
        },
      },
    });

    const registeredCount = studentsWithRegistrations.filter(
      (s) => s.subjectRegistrations.length > 0
    ).length;

    const notRegisteredCount = totalStudents - registeredCount;

    return {
      success: true,
      data: {
        registered: registeredCount,
        notRegistered: notRegisteredCount,
      },
    };
  } catch (error) {
    console.error("Error fetching subject registration stats:", error);
    return {
      success: false,
      error: "Failed to fetch subject registration statistics",
    };
  }
}

// Get cumulative student record (active vs inactive)
export async function getStudentRecord(filters?: StudentFilters) {
  try {
    const whereClause: {
      academicYear?: string;
      session?: Session;
    } = {};

    if (filters?.academicYear) {
      whereClause.academicYear = filters.academicYear;
    }

    if (filters?.session) {
      whereClause.session = filters.session;
    }

    const activeCount = await prisma.student.count({
      where: {
        ...whereClause,
        academicStatus: "ACTIVE",
      },
    });

    const inactiveCount = await prisma.student.count({
      where: {
        ...whereClause,
        academicStatus: {
          not: "ACTIVE",
        },
      },
    });

    return {
      success: true,
      data: {
        active: activeCount,
        inactive: inactiveCount,
      },
    };
  } catch (error) {
    console.error("Error fetching student record:", error);
    return {
      success: false,
      error: "Failed to fetch student record",
    };
  }
}

// Get total applicants
export async function getTotalApplicants(filters?: { academicYear?: string }) {
  try {
    const whereClause = {};

    // You might want to add a year field to Applicant model
    // For now, we'll just count all pending applicants

    const totalApplicants = await prisma.applicant.count({
      where: whereClause,
    });

    const genderCounts = await prisma.applicant.groupBy({
      by: ["gender"],
      where: whereClause,
      _count: {
        gender: true,
      },
    });

    const result: Record<Gender, number> = {
      MALE: 0,
      FEMALE: 0,
      OTHER: 0,
    };

    genderCounts.forEach((item) => {
      result[item.gender] = item._count.gender;
    });

    return {
      success: true,
      data: {
        total: totalApplicants,
        male: result.MALE,
        female: result.FEMALE,
        others: result.OTHER,
      },
    };
  } catch (error) {
    console.error("Error fetching applicants:", error);
    return {
      success: false,
      error: "Failed to fetch applicant statistics",
    };
  }
}

// Get available academic years (for filter dropdown)
export async function getAcademicYears() {
  try {
    const years = await prisma.student.findMany({
      distinct: ["academicYear"],
      select: {
        academicYear: true,
      },
      orderBy: {
        academicYear: "desc",
      },
    });

    return {
      success: true,
      data: years.map((y) => y.academicYear),
    };
  } catch (error) {
    console.error("Error fetching academic years:", error);
    return {
      success: false,
      error: "Failed to fetch academic years",
      data: [],
    };
  }
}