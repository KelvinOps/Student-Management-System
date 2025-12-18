// src/actions/dashboard.ts
"use server";

import prisma from "@/app/lib/prisma";
import { AcademicStatus, Gender, Session, ApplicationStatus } from "@prisma/client";

interface DashboardFilters {
  academicYear?: string;
  session?: Session;
  status?: AcademicStatus;
}

interface StudentFilters {
  academicYear?: string;
  session?: Session;
}

interface ApplicantFilters {
  academicYear?: string;
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

    // Get active hostel bookings count
    const activeHostelBookings = await prisma.hostelBooking.count({
      where: {
        status: {
          in: ["CONFIRMED", "CHECKED_IN"]
        },
        ...(filters?.academicYear && { academicYear: filters.academicYear }),
        ...(filters?.session && { session: filters.session }),
      },
    });

    return {
      success: true,
      data: {
        totalStudents,
        activeClasses,
        totalDepartments,
        activeHostelBookings,
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
      if (item._count.gender !== undefined) {
        result[item.gender] = item._count.gender;
      }
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
        const count = item._count.departmentId || 0;
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
export async function getTotalApplicants(filters?: ApplicantFilters) {
  try {
    const whereClause: {
      createdAt?: {
        gte?: Date;
        lt?: Date;
      };
    } = {};

    // Apply academic year filter if provided
    if (filters?.academicYear) {
      const year = parseInt(filters.academicYear);
      if (!isNaN(year)) {
        whereClause.createdAt = {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        };
      }
    }

    const totalApplicants = await prisma.applicant.count({
      where: whereClause,
    });

    const genderCounts = await prisma.applicant.groupBy({
      by: ["gender"],
      where: whereClause,
      _count: {
        _all: true,
      },
    });

    const result: Record<Gender, number> = {
      MALE: 0,
      FEMALE: 0,
      OTHER: 0,
    };

    genderCounts.forEach((item) => {
      if (item._count._all !== undefined) {
        result[item.gender] = item._count._all;
      }
    });

    // Get applicants by status
    const statusCounts = await prisma.applicant.groupBy({
      by: ["status"],
      where: whereClause,
      _count: {
        _all: true,
      },
    });

    const statusResult: Record<ApplicationStatus, number> = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
    };

    statusCounts.forEach((item) => {
      if (item._count._all !== undefined) {
        statusResult[item.status] = item._count._all;
      }
    });

    return {
      success: true,
      data: {
        total: totalApplicants,
        male: result.MALE,
        female: result.FEMALE,
        others: result.OTHER,
        pending: statusResult.PENDING,
        approved: statusResult.APPROVED,
        rejected: statusResult.REJECTED,
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
      data: years.map((y) => y.academicYear).filter(Boolean),
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

// Get available sessions (for filter dropdown)
export async function getSessions() {
  try {
    const sessions = await prisma.student.findMany({
      distinct: ["session"],
      select: {
        session: true,
      },
      orderBy: {
        session: "asc",
      },
    });

    return {
      success: true,
      data: sessions.map((s) => s.session).filter(Boolean),
    };
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return {
      success: false,
      error: "Failed to fetch sessions",
      data: [],
    };
  }
}

// Get applicant count by status (optional helper function)
export async function getApplicantsByStatus(filters?: ApplicantFilters) {
  try {
    const whereClause: {
      createdAt?: {
        gte?: Date;
        lt?: Date;
      };
    } = {};

    if (filters?.academicYear) {
      const year = parseInt(filters.academicYear);
      if (!isNaN(year)) {
        whereClause.createdAt = {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        };
      }
    }

    const statusCounts = await prisma.applicant.groupBy({
      by: ["status"],
      where: whereClause,
      _count: {
        _all: true,
      },
    });

    const result = statusCounts.reduce((acc, item) => {
      if (item._count._all !== undefined) {
        acc[item.status] = item._count._all;
      }
      return acc;
    }, {} as Record<ApplicationStatus, number>);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error fetching applicants by status:", error);
    return {
      success: false,
      error: "Failed to fetch applicant status distribution",
    };
  }
}

// Get applicant academic years (for filter dropdown)
export async function getApplicantAcademicYears() {
  try {
    const applicants = await prisma.applicant.findMany({
      distinct: ["createdAt"],
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Extract unique years from createdAt dates
    const years = Array.from(
      new Set(
        applicants.map((app) => {
          return app.createdAt.getFullYear().toString();
        })
      )
    ).sort((a, b) => parseInt(b) - parseInt(a));

    return {
      success: true,
      data: years,
    };
  } catch (error) {
    console.error("Error fetching applicant academic years:", error);
    return {
      success: false,
      error: "Failed to fetch applicant academic years",
      data: [],
    };
  }
}

// Get hostel occupancy statistics
export async function getHostelOccupancyStats(filters?: { academicYear?: string; session?: Session }) {
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

    // Get total capacity
    const totalCapacity = await prisma.hostelBlock.aggregate({
      _sum: {
        totalCapacity: true,
      },
    });

    // Get active bookings (confirmed or checked-in)
    const activeBookings = await prisma.hostelBooking.count({
      where: {
        status: {
          in: ["CONFIRMED", "CHECKED_IN"]
        },
        ...whereClause,
      },
    });

    // Get bookings by gender
    const bookingsByGender = await prisma.hostelBooking.groupBy({
      by: ["blockId"],
      where: {
        status: {
          in: ["CONFIRMED", "CHECKED_IN"]
        },
        ...whereClause,
      },
      _count: {
        _all: true,
      },
    });

    // Get block genders
    const blocks = await prisma.hostelBlock.findMany({
      where: {
        id: {
          in: bookingsByGender.map(b => b.blockId)
        }
      },
      select: {
        id: true,
        gender: true,
      },
    });

    const genderResult: Record<Gender, number> = {
      MALE: 0,
      FEMALE: 0,
      OTHER: 0,
    };

    bookingsByGender.forEach((booking) => {
      const block = blocks.find(b => b.id === booking.blockId);
      if (block && booking._count._all !== undefined) {
        genderResult[block.gender] = (genderResult[block.gender] || 0) + booking._count._all;
      }
    });

    const occupancyRate = totalCapacity._sum.totalCapacity 
      ? Math.round((activeBookings / totalCapacity._sum.totalCapacity) * 100) 
      : 0;

    return {
      success: true,
      data: {
        totalCapacity: totalCapacity._sum.totalCapacity || 0,
        activeBookings,
        occupancyRate,
        maleOccupancy: genderResult.MALE,
        femaleOccupancy: genderResult.FEMALE,
      },
    };
  } catch (error) {
    console.error("Error fetching hostel occupancy stats:", error);
    return {
      success: false,
      error: "Failed to fetch hostel occupancy statistics",
    };
  }
}

// Get recent activities
export async function getRecentActivities(limit: number = 10) {
  try {
    // Get recent student registrations
    const recentStudents = await prisma.student.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        admissionNumber: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        class: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get recent applicants
    const recentApplicants = await prisma.applicant.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        referenceNumber: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true,
        department: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get recent fee payments
    const recentPayments = await prisma.feePayment.findMany({
      take: limit,
      where: {
        status: 'COMPLETED',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        amountPaid: true,
        paymentMethod: true,
        createdAt: true,
        student: {
          select: {
            admissionNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        recentStudents,
        recentApplicants,
        recentPayments,
      },
    };
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return {
      success: false,
      error: "Failed to fetch recent activities",
    };
  }
}