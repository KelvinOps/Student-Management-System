// src/actions/class.ts
'use server';

import prisma from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma, ProgrammeLevel } from '@prisma/client';

// Get all classes with optional filtering
export async function getClasses(params?: {
  search?: string;
  limit?: number;
  page?: number;
  status?: string;
}) {
  try {
    const { search = '', limit = 10, page = 1, status = 'Active' } = params || {};
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ClassWhereInput = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { branch: { contains: search, mode: 'insensitive' } },
          { programme: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    // Fetch classes with pagination
    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        include: {
          programme: {
            select: {
              id: true,
              code: true,
              name: true,
              department: {
                select: {
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              students: true,
              timetableEntries: true,
            },
          },
        },
        orderBy: { code: 'asc' },
        skip,
        take: limit,
      }),
      prisma.class.count({ where }),
    ]);

    return {
      success: true,
      data: classes,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
        limit,
      },
    };
  } catch (error) {
    console.error('Error fetching classes:', error);
    return {
      success: false,
      error: 'Failed to fetch classes',
      data: [],
    };
  }
}

// Get single class by ID
export async function getClassById(id: string) {
  try {
    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        programme: {
          include: {
            department: true,
          },
        },
        students: {
          select: {
            id: true,
            admissionNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        _count: {
          select: {
            students: true,
            timetableEntries: true,
          },
        },
      },
    });

    if (!classData) {
      return {
        success: false,
        error: 'Class not found',
      };
    }

    // Calculate average scores for students
    const studentsWithScores = await Promise.all(
      classData.students.map(async (student) => {
        const marks = await prisma.marksEntry.findMany({
          where: { studentId: student.id },
          select: { total: true },
        });

        const totalMarks = marks.reduce((sum, mark) => sum + (mark.total || 0), 0);
        const avgScore = marks.length > 0 ? totalMarks / marks.length : 0;

        return {
          ...student,
          avgScore: Math.round(avgScore * 100) / 100,
        };
      })
    );

    // Calculate class average
    const classAverage =
      studentsWithScores.length > 0
        ? studentsWithScores.reduce((sum, s) => sum + s.avgScore, 0) / studentsWithScores.length
        : 0;

    return {
      success: true,
      data: {
        ...classData,
        students: studentsWithScores,
        classAverage: Math.round(classAverage * 100) / 100,
      },
    };
  } catch (error) {
    console.error('Error fetching class:', error);
    return {
      success: false,
      error: 'Failed to fetch class details',
    };
  }
}

// Create new class - UPDATED VERSION
export async function createClass(data: {
  code: string;
  name: string;
  programmeId: string;
  branch: string;
  sessionType: string;
  modeOfStudy: string;
  startDate: Date;
  endDate: Date;
  numberOfTeachers?: number;
}) {
  try {
    // Check if class code already exists
    const existingClass = await prisma.class.findUnique({
      where: { code: data.code },
    });

    if (existingClass) {
      return {
        success: false,
        error: 'Class with this code already exists',
      };
    }

    // Check if programmeId is a UUID (database ID) or our generated format
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.programmeId);
    let programme;
    
    if (isUuid) {
      // It's a database ID - find the programme
      programme = await prisma.programme.findUnique({
        where: { id: data.programmeId },
      });
      
      if (!programme) {
        return {
          success: false,
          error: 'Programme not found in database',
        };
      }
    } else {
      // It's our generated ID (e.g., "Information Communication Technology_0")
      // Extract department name and index
      const parts = data.programmeId.split('_');
      if (parts.length < 2) {
        return {
          success: false,
          error: 'Invalid programme ID format',
        };
      }
      
      const index = parseInt(parts[parts.length - 1]);
      const departmentName = parts.slice(0, -1).join('_');
      
      // Hardcoded programme mapping based on your data
      const programmeMapping: Record<string, string> = {
        // Information Communication Technology
        "Information Communication Technology_0": "Certificate In Information Communication Technology L5",
        "Information Communication Technology_1": "Computer Operation NITA Grade III",
        "Information Communication Technology_2": "Computer Packages",
        "Information Communication Technology_3": "Diploma In Information Communication Technology L6",
        "Information Communication Technology_4": "Artisan In ICT Technician (l4)",
        
        // Mechanical Engineering
        "Mechanical Engineering_0": "Diploma Automotive Technician (L6)",
        "Mechanical Engineering_1": "Artisan In Automotive Mechanic L3",
        "Mechanical Engineering_2": "Certificate In Automotive Technician L5",
        "Mechanical Engineering_3": "Artisan in Automotive Technology L4",
        
        // Building and Civil Engineering
        "Building and Civil Engineering_0": "Plumbing L4",
        "Building and Civil Engineering_1": "Certificate Building Technician L5",
        "Building and Civil Engineering_2": "Certificate In Plumbing L5",
        "Building and Civil Engineering_3": "Masonry L4",
        "Building and Civil Engineering_4": "Certificate in Welding & Fabrication L5",
        "Building and Civil Engineering_5": "Diploma In Civil Engineering L6",
        "Building and Civil Engineering_6": "Diploma In Building Technology",
        "Building and Civil Engineering_7": "Artisan In Welding & Fabrication L4",
        "Building and Civil Engineering_8": "Plumbing NITA GRADE III",
        "Building and Civil Engineering_9": "Artisan In Masonry",
        
        // Electrical and Electronic
        "Electrical and Electronic_0": "Driving School B-Light",
        "Electrical and Electronic_1": "Electrical Wireman NITA GRADE III",
        "Electrical and Electronic_2": "Diploma In Electrical Engineering L6",
        "Electrical and Electronic_3": "Certificate In electrical operator L5",
        "Electrical and Electronic_4": "Artisan In Electrical Installation L3",
        "Electrical and Electronic_5": "Artisan In Electrical Installation L4",
        
        // Fashion Design & Cosmetology
        "Fashion Design & Cosmetology_0": "Hairdressing NITA Grade III",
        "Fashion Design & Cosmetology_1": "Cosmetology L3",
        "Fashion Design & Cosmetology_2": "Cosmetology L5",
        "Fashion Design & Cosmetology_3": "Artisan In Fashion Design (L4)",
        "Fashion Design & Cosmetology_4": "Certificate In Hairdressing L5",
        "Fashion Design & Cosmetology_5": "Certificate In Fashion Design L5",
        "Fashion Design & Cosmetology_6": "Dressmaking NITA Grade III",
        "Fashion Design & Cosmetology_7": "Certificate In Beauty Therapy L5",
        "Fashion Design & Cosmetology_8": "Diploma In Beauty Therapy L6",
        "Fashion Design & Cosmetology_9": "Artisan In Beauty Therapy L4",
        "Fashion Design & Cosmetology_10": "Diploma In Fashion Design L6",
        "Fashion Design & Cosmetology_11": "HAIRDRESSING L6",
        "Fashion Design & Cosmetology_12": "Artisan In Hairdressing L4",
        "Fashion Design & Cosmetology_13": "Artisan In Hairdressing L3",
        "Fashion Design & Cosmetology_14": "Artisan in Beauty Therapy L3",
        
        // Hospitality And Tourism
        "Hospitality And Tourism_0": "FOOD AND BEVERAGE L4",
        "Hospitality And Tourism_1": "FOOD AND BEVERAGE L3",
        "Hospitality And Tourism_2": "FOOD AND BEVERAGE L5",
        "Hospitality And Tourism_3": "FOOD AND BEVERAGE L6",
        
        // Agriculture
        "Agriculture_0": "Sustainable Agriculture for Rural Development Level 5",
        "Agriculture_1": "Diploma In Agriculture Extension L6",
        "Agriculture_2": "Diploma In Agriculture",
        "Agriculture_3": "Horticulture Production Level 5",
        "Agriculture_4": "Artisan in Food Production L4",
        "Agriculture_5": "Diploma in Food Production L6",
        "Agriculture_6": "Certificate in Food Production L5",
        "Agriculture_7": "Artisan In Agriculture",
        
        // Business
        "Business_0": "Certificate In community Development an Social Work L5",
        "Business_1": "Diploma in Community Development and Social Work L6",
        "Business_2": "Certificate In Office Administration L5",
        "Business_3": "Diploma in Accountancy L6",
        "Business_4": "Diploma In Office administration Level 6",
        "Business_5": "Certificate In Human Resource Management",
        "Business_6": "Artisan In Social Work and Community Development L4",
        "Business_7": "Certificate In Land Survey L5",
        "Business_8": "Certificate in Human Resource Management L5",
        "Business_9": "Diploma In Supply Chain Management",
        "Business_10": "Certificate In Supply Chain Management",
        "Business_11": "Diploma In Survey",
        "Business_12": "Diploma In Human Resource Management L6",
        "Business_13": "Diploma In Baking Technology L6",
        "Business_14": "Office Assistant Level 4"
      };
      
      const programmeName = programmeMapping[data.programmeId];
      
      if (!programmeName) {
        return {
          success: false,
          error: `Programme not found for ID: ${data.programmeId}. Please use a valid programme.`,
        };
      }
      
      // Try to find programme by name
      programme = await prisma.programme.findFirst({
        where: { 
          name: programmeName,
          isActive: true 
        },
      });
      
      // If programme doesn't exist, create it
      if (!programme) {
        // First, find or create the department
        let department = await prisma.department.findFirst({
          where: { 
            name: { 
              equals: departmentName,
              mode: 'insensitive'
            }
          },
        });
        
        if (!department) {
          // Create department if it doesn't exist
          const departmentCode = departmentName
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 4);
            
          department = await prisma.department.create({
            data: {
              name: departmentName,
              code: departmentCode,
              isActive: true,
            },
          });
        }
        
        // Generate programme code from name
        const generateProgrammeCode = (name: string): string => {
          const words = name.split(' ');
          const mainWords = words.filter(word => 
            !['In', 'And', 'The', 'For', 'Of', 'To', 'With', 'L3', 'L4', 'L5', 'L6', 
              'NITA', 'Grade', 'III', 'Certificate', 'Diploma', 'Artisan', 'Level'].includes(word)
          );
          
          if (mainWords.length >= 2) {
            return `${mainWords[0].charAt(0)}${mainWords[1].charAt(0)}`.toUpperCase();
          }
          return name.substring(0, 4).toUpperCase().replace(/\s+/g, '');
        };
        
// Update the ProgrammeLevel usage to match your actual enum values
const getProgrammeLevel = (name: string): ProgrammeLevel => {
  if (name.includes('L6') || name.includes('Level 6') || name.includes('Diploma')) 
    return ProgrammeLevel.DIPLOMA;  // Changed from LEVEL_6
  if (name.includes('L5') || name.includes('Level 5') || name.includes('Certificate')) 
    return ProgrammeLevel.CERTIFICATE;  // Changed from LEVEL_5
  if (name.includes('L4') || name.includes('Level 4') || name.includes('Artisan')) 
    return ProgrammeLevel.ARTISAN;  // Changed from LEVEL_4
  if (name.includes('L3') || name.includes('Level 3') || name.includes('Grade III')) 
    return ProgrammeLevel.CERTIFICATE;  // Grade III is typically a certificate level
  
  return ProgrammeLevel.CERTIFICATE; // Default to certificate
};
        
        // Determine award scheme
        const getAwardScheme = (name: string): string => {
          if (name.includes('NITA')) return 'NITA';
          if (name.includes('Grade')) return 'NITA';
          return 'TVET';
        };
        
        // Determine duration based on level
// Also update the duration calculation function
const getDuration = (level: ProgrammeLevel): number => {
  switch(level) {
    case ProgrammeLevel.DIPLOMA: return 3; // Diploma usually 3 years
    case ProgrammeLevel.CERTIFICATE: return 2; // Certificate usually 2 years
    case ProgrammeLevel.ARTISAN: return 1; // Artisan usually 1 year
    case ProgrammeLevel.HIGHER_DIPLOMA: return 3; // Higher diploma usually 3 years
    case ProgrammeLevel.BACHELOR: return 4; // Bachelor usually 4 years
    default: return 2;
  }
};
        
        const level = getProgrammeLevel(programmeName);
        const duration = getDuration(level);
        const awardScheme = getAwardScheme(programmeName);
        const programmeCode = generateProgrammeCode(programmeName);
        
        // Create the programme - FIXED: No more 'any' type
        programme = await prisma.programme.create({
          data: {
            name: programmeName,
            code: programmeCode,
            departmentId: department.id,
            level: level, // Now using the proper enum type
            duration: duration,
            awardScheme: awardScheme,
            effectiveDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5)),
            isActive: true,
          },
        });
      }
    }

    if (!programme) {
      return {
        success: false,
        error: 'Programme not found or could not be created',
      };
    }

    // Create the class with the real programme ID
    const newClass = await prisma.class.create({
      data: {
        code: data.code,
        name: data.name,
        programmeId: programme.id,
        branch: data.branch,
        sessionType: data.sessionType,
        modeOfStudy: data.modeOfStudy,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'Active',
        numberOfTeachers: data.numberOfTeachers || 0,
      },
      include: {
        programme: {
          include: {
            department: true,
          },
        },
      },
    });

    revalidatePath('/student-management/classes');

    return {
      success: true,
      data: newClass,
      message: 'Class created successfully',
    };
  } catch (error) {
    console.error('Error creating class:', error);
    
    // Provide more specific error messages
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return {
            success: false,
            error: 'A class with this code already exists',
          };
        case 'P2003':
          return {
            success: false,
            error: 'Invalid programme ID',
          };
        default:
          return {
            success: false,
            error: `Database error: ${error.message}`,
          };
      }
    }
    
    return {
      success: false,
      error: 'Failed to create class. Please try again.',
    };
  }
}

// Update existing class
export async function updateClass(
  id: string,
  data: {
    code?: string;
    name?: string;
    programmeId?: string;
    branch?: string;
    sessionType?: string;
    modeOfStudy?: string;
    startDate?: Date;
    endDate?: Date;
    numberOfTeachers?: number;
    status?: string;
  }
) {
  try {
    // If code is being updated, check if it's already taken
    if (data.code) {
      const existingClass = await prisma.class.findFirst({
        where: {
          code: data.code,
          NOT: { id },
        },
      });

      if (existingClass) {
        return {
          success: false,
          error: 'Class code already exists',
        };
      }
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data,
      include: {
        programme: {
          include: {
            department: true,
          },
        },
      },
    });

    revalidatePath('/student-management/classes');
    revalidatePath(`/student-management/classes/${id}`);

    return {
      success: true,
      data: updatedClass,
      message: 'Class updated successfully',
    };
  } catch (error) {
    console.error('Error updating class:', error);
    return {
      success: false,
      error: 'Failed to update class',
    };
  }
}

// Delete class
export async function deleteClass(id: string) {
  try {
    // Check if class has students
    const classWithStudents = await prisma.class.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (classWithStudents && classWithStudents._count.students > 0) {
      return {
        success: false,
        error: `Cannot delete class with ${classWithStudents._count.students} enrolled student(s)`,
      };
    }

    await prisma.class.delete({
      where: { id },
    });

    revalidatePath('/student-management/classes');

    return {
      success: true,
      message: 'Class deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting class:', error);
    return {
      success: false,
      error: 'Failed to delete class',
    };
  }
}

// Export classes data
export async function exportClassesData() {
  try {
    const classes = await prisma.class.findMany({
      include: {
        programme: {
          include: {
            department: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const csvData = classes.map((cls) => ({
      Code: cls.code,
      Name: cls.name,
      Branch: cls.branch,
      Programme: cls.programme.name,
      Department: cls.programme.department.name,
      'Session Type': cls.sessionType,
      'Mode of Study': cls.modeOfStudy,
      'Start Date': cls.startDate.toISOString().split('T')[0],
      'End Date': cls.endDate.toISOString().split('T')[0],
      'Number of Students': cls._count.students,
      'Number of Teachers': cls.numberOfTeachers,
      Status: cls.status,
    }));

    return {
      success: true,
      data: csvData,
    };
  } catch (error) {
    console.error('Error exporting classes:', error);
    return {
      success: false,
      error: 'Failed to export classes',
    };
  }
}

// Get programmes for dropdown
export async function getProgrammesForDropdown() {
  try {
    const programmes = await prisma.programme.findMany({
      where: { isActive: true },
      include: {
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      data: programmes,
    };
  } catch (error) {
    console.error('Error fetching programmes:', error);
    return {
      success: false,
      error: 'Failed to fetch programmes',
      data: [],
    };
  }
}

// Get class statistics
export async function getClassStatistics(id: string) {
  try {
    const [studentCount, averageAttendance, subjectCount] = await Promise.all([
      prisma.student.count({
        where: { classId: id, academicStatus: 'ACTIVE' },
      }),
      prisma.attendanceRecord.aggregate({
        where: {
          classId: id,
          status: 'PRESENT',
        },
        _count: true,
      }),
      prisma.timetableEntry.count({
        where: { classId: id },
      }),
    ]);

    return {
      success: true,
      data: {
        studentCount,
        averageAttendance: averageAttendance._count,
        subjectCount,
      },
    };
  } catch (error) {
    console.error('Error fetching class statistics:', error);
    return {
      success: false,
      error: 'Failed to fetch class statistics',
    };
  }
}