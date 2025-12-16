// src/actions/hostel.ts
'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/app/lib/prisma';
import type { 
  Gender, 
  BookingStatus, 
  Prisma, 
  FloorLevel,
  RoomStatus,
  HostelBlock,
  HostelFloor,
  HostelRoom,
  HostelBed,        // ✅ Added this missing import
  HostelBooking,
  Student
} from '@prisma/client';

// Types
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

// Extended types for includes
type RoomWithRelations = HostelRoom & {
  floor: HostelFloor & {
    block: HostelBlock;
  };
  beds: HostelBed[];
};

type BlockWithRelations = HostelBlock & {
  _count: {
    bookings: number;
  };
  floors: (HostelFloor & {
    _count: {
      rooms: number;
    };
  })[];
};

type BookingWithRelations = HostelBooking & {
  student: Pick<Student, 'id' | 'firstName' | 'lastName' | 'admissionNumber' | 'gender'>;
  room: HostelRoom;
  floor: HostelFloor;
  block: HostelBlock;
  bed?: HostelBed;
};

export type CreateBookingInput = {
  studentId: string;
  blockId: string;
  floorId: string;
  roomId: string;
  bedId: string;
  academicYear: string;
  session: string;
  checkInDate: Date | string;
  checkOutDate: Date | string;
  amount: number;
  notes?: string;
};

export type UpdateBookingInput = Partial<CreateBookingInput> & {
  id: string;
};

// Initialize Hostel Blocks with Floors and Rooms
export async function initializeHostelStructure(): Promise<ApiResponse<string>> {
  try {
    // Check if already initialized
    const existingBlocks = await prisma.hostelBlock.count();
    if (existingBlocks > 0) {
      return {
        success: false,
        error: 'Hostel structure already initialized',
      };
    }

    const blocksToCreate: Array<{ blockNumber: number; gender: Gender }> = [];

    // Create 15 blocks for males and 15 blocks for females (blocks 1-15 male, 16-30 female)
    for (let blockNum = 1; blockNum <= 30; blockNum++) {
      const gender: Gender = blockNum <= 15 ? 'MALE' : 'FEMALE';
      
      blocksToCreate.push({
        blockNumber: blockNum,
        gender: gender,
      });
    }

    // Create blocks with floors and rooms
    for (const blockData of blocksToCreate) {
      const block = await prisma.hostelBlock.create({
        data: {
          blockNumber: blockData.blockNumber,
          gender: blockData.gender,
        },
      });

      // Create 3 floors (Ground, First, Second)
      const floors: Array<{ floorLevel: FloorLevel; floorNumber: number }> = [
        { floorLevel: 'GROUND', floorNumber: 0 },
        { floorLevel: 'FIRST', floorNumber: 1 },
        { floorLevel: 'SECOND', floorNumber: 2 },
      ];

      for (const floorData of floors) {
        const floor = await prisma.hostelFloor.create({
          data: {
            blockId: block.id,
            floorLevel: floorData.floorLevel,
            floorNumber: floorData.floorNumber,
          },
        });

        // Create 30 rooms per floor with 2 beds each
        for (let roomNum = 1; roomNum <= 30; roomNum++) {
          const room = await prisma.hostelRoom.create({
            data: {
              floorId: floor.id,
              roomNumber: roomNum,
            },
          });

          // Create 2 beds per room
          for (let bedNum = 1; bedNum <= 2; bedNum++) {
            await prisma.hostelBed.create({
              data: {
                roomId: room.id,
                bedNumber: bedNum,
              },
            });
          }
        }
      }
    }

    revalidatePath('/hostel/rooms');
    revalidatePath('/hostel/bookings');
    revalidatePath('/hostel/buildings');

    return {
      success: true,
      message: 'Hostel structure initialized successfully',
      data: '30 blocks with 3 floors and 30 rooms per floor created',
    };
  } catch (error) {
    console.error('Error initializing hostel:', error);
    return {
      success: false,
      error: 'Failed to initialize hostel structure',
    };
  }
}

// Get available rooms with filters
export async function getAvailableRooms(params: {
  gender?: Gender;
  blockNumber?: number;
  floorLevel?: FloorLevel;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<RoomWithRelations[]>> {
  try {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.HostelRoomWhereInput = {
      status: 'AVAILABLE' as RoomStatus,
      isAvailable: true,
    };

    // Build nested filter conditions properly
    if (params.blockNumber || params.gender || params.floorLevel) {
      where.floor = {};

      if (params.floorLevel) {
        where.floor.floorLevel = params.floorLevel;
      }

      if (params.blockNumber || params.gender) {
        where.floor.block = {};

        if (params.blockNumber) {
          where.floor.block.blockNumber = params.blockNumber;
        }

        if (params.gender) {
          where.floor.block.gender = params.gender;
        }
      }
    }

    const [rooms, total] = await Promise.all([
      prisma.hostelRoom.findMany({
        where,
        skip,
        take: limit,
        include: {
          floor: {
            include: {
              block: true,
            },
          },
          beds: {
            where: { isOccupied: false },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      prisma.hostelRoom.count({ where }),
    ]);

    return {
      success: true,
      data: rooms,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    return {
      success: false,
      error: 'Failed to fetch available rooms',
      data: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    };
  }
}

// Get hostel blocks
export async function getHostelBlocks(params: {
  gender?: Gender;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<BlockWithRelations[]>> {
  try {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.HostelBlockWhereInput = { isActive: true };
    if (params.gender) {
      where.gender = params.gender;
    }

    const [blocks, total] = await Promise.all([
      prisma.hostelBlock.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { bookings: true },
          },
          floors: {
            include: {
              _count: {
                select: { rooms: true },
              },
            },
          },
        },
        orderBy: {
          blockNumber: 'asc',
        },
      }),
      prisma.hostelBlock.count({ where }),
    ]);

    return {
      success: true,
      data: blocks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching hostel blocks:', error);
    return {
      success: false,
      error: 'Failed to fetch hostel blocks',
      data: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    };
  }
}

// Get rooms by block
export async function getRoomsByBlock(
  blockId: string,
  params?: {
    floorLevel?: FloorLevel;
    page?: number;
    limit?: number;
  }
): Promise<ApiResponse<(RoomWithRelations & { bookings: HostelBooking[] })[]>> {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.HostelRoomWhereInput = {
      floor: {
        blockId,
      },
    };

    if (params?.floorLevel) {
      where.floor = {
        blockId,
        floorLevel: params.floorLevel,
      };
    }

    const [rooms, total] = await Promise.all([
      prisma.hostelRoom.findMany({
        where,
        skip,
        take: limit,
        include: {
          floor: {
            include: {
              block: true,
            },
          },
          beds: true,
          bookings: {
            where: {
              status: 'CONFIRMED' as BookingStatus,
            },
          },
        },
        orderBy: {
          roomNumber: 'asc',
        },
      }),
      prisma.hostelRoom.count({ where }),
    ]);

    return {
      success: true,
      data: rooms,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching rooms by block:', error);
    return {
      success: false,
      error: 'Failed to fetch rooms',
      data: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
  }
}

// Create booking
export async function createBooking(data: CreateBookingInput): Promise<ApiResponse<BookingWithRelations>> {
  try {
    // Validate student exists
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
    });

    if (!student) {
      return {
        success: false,
        error: 'Student not found',
      };
    }

    // Validate bed is available
    const bed = await prisma.hostelBed.findUnique({
      where: { id: data.bedId },
    });

    if (!bed || bed.isOccupied) {
      return {
        success: false,
        error: 'Bed is not available',
      };
    }

    // Check for existing active booking - use proper BookingStatus enum values
    const existingBooking = await prisma.hostelBooking.findFirst({
      where: {
        studentId: data.studentId,
        status: {
          in: ['PENDING', 'CONFIRMED'] as BookingStatus[],
        },
        academicYear: data.academicYear,
      },
    });

    if (existingBooking) {
      return {
        success: false,
        error: 'Student already has an active booking for this academic year',
      };
    }

    const checkInDate = typeof data.checkInDate === 'string'
      ? new Date(data.checkInDate)
      : data.checkInDate;

    const checkOutDate = typeof data.checkOutDate === 'string'
      ? new Date(data.checkOutDate)
      : data.checkOutDate;

    // Create booking
    const booking = await prisma.hostelBooking.create({
      data: {
        studentId: data.studentId,
        blockId: data.blockId,
        floorId: data.floorId,
        roomId: data.roomId,
        bedId: data.bedId,
        academicYear: data.academicYear,
        session: data.session,
        checkInDate,
        checkOutDate,
        amount: data.amount,
        notes: data.notes,
        status: 'PENDING' as BookingStatus,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
            gender: true,
          },
        },
        room: true,
        bed: true,
        block: true,
        floor: true,
      },
    });

    revalidatePath('/hostel/bookings');
    revalidatePath('/hostel/rooms');

    return {
      success: true,
      data: booking,
      message: 'Booking created successfully',
    };
  } catch (error) {
    console.error('Error creating booking:', error);
    return {
      success: false,
      error: 'Failed to create booking',
    };
  }
}

// Confirm booking and mark bed as occupied
export async function confirmBooking(bookingId: string): Promise<ApiResponse<BookingWithRelations>> {
  try {
    const booking = await prisma.hostelBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      };
    }

    if (booking.status !== ('PENDING' as BookingStatus)) {
      return {
        success: false,
        error: 'Only pending bookings can be confirmed',
      };
    }

    // Update booking
    const updatedBooking = await prisma.hostelBooking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED' as BookingStatus,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
            gender: true,
          },
        },
        room: true,
        bed: true,
        block: true,
        floor: true,
      },
    });

    // Mark bed as occupied
    await prisma.hostelBed.update({
      where: { id: booking.bedId },
      data: { isOccupied: true },
    });

    // Update room occupancy
    const occupiedBeds = await prisma.hostelBed.count({
      where: {
        roomId: booking.roomId,
        isOccupied: true,
      },
    });

    await prisma.hostelRoom.update({
      where: { id: booking.roomId },
      data: {
        currentOccupancy: occupiedBeds,
        isAvailable: occupiedBeds < 2,
        status: (occupiedBeds === 2 ? 'OCCUPIED' : 'AVAILABLE') as RoomStatus,
      },
    });

    revalidatePath('/hostel/bookings');
    revalidatePath('/hostel/rooms');

    return {
      success: true,
      data: updatedBooking,
      message: 'Booking confirmed successfully',
    };
  } catch (error) {
    console.error('Error confirming booking:', error);
    return {
      success: false,
      error: 'Failed to confirm booking',
    };
  }
}

// Get bookings with filters
export async function getBookings(params: {
  studentId?: string;
  academicYear?: string;
  status?: BookingStatus;
  blockId?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<BookingWithRelations[]>> {
  try {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.HostelBookingWhereInput = {};

    if (params.studentId) where.studentId = params.studentId;
    if (params.academicYear) where.academicYear = params.academicYear;
    if (params.status) where.status = params.status;
    if (params.blockId) where.blockId = params.blockId;

    const [bookings, total] = await Promise.all([
      prisma.hostelBooking.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNumber: true,
              gender: true,
            },
          },
          room: true,
          floor: true,
          block: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.hostelBooking.count({ where }),
    ]);

    return {
      success: true,
      data: bookings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return {
      success: false,
      error: 'Failed to fetch bookings',
      data: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    };
  }
}

// Check out booking and free bed
export async function checkOutBooking(bookingId: string): Promise<ApiResponse<HostelBooking>> {
  try {
    const booking = await prisma.hostelBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      };
    }

    // Update booking status to CHECKED_OUT
    const updatedBooking = await prisma.hostelBooking.update({
      where: { id: bookingId },
      data: {
        status: 'CHECKED_OUT' as BookingStatus,
      },
    });

    // Free up the bed
    await prisma.hostelBed.update({
      where: { id: booking.bedId },
      data: { isOccupied: false },
    });

    // Update room occupancy
    const occupiedBeds = await prisma.hostelBed.count({
      where: {
        roomId: booking.roomId,
        isOccupied: true,
      },
    });

    await prisma.hostelRoom.update({
      where: { id: booking.roomId },
      data: {
        currentOccupancy: occupiedBeds,
        isAvailable: true,
        status: 'AVAILABLE' as RoomStatus,
      },
    });

    revalidatePath('/hostel/bookings');
    revalidatePath('/hostel/rooms');

    return {
      success: true,
      data: updatedBooking,
      message: 'Student checked out successfully',
    };
  } catch (error) {
    console.error('Error checking out booking:', error);
    return {
      success: false,
      error: 'Failed to check out booking',
    };
  }
}

// Get hostel statistics
export async function getHostelStats(): Promise<ApiResponse<{
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyRate: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
}>> {
  try {
    const [totalRooms, occupiedRooms, totalBeds, occupiedBeds, totalBookings, confirmedBookings] = await Promise.all([
      prisma.hostelRoom.count(),
      prisma.hostelRoom.count({ where: { status: 'OCCUPIED' as RoomStatus } }),
      prisma.hostelBed.count(),
      prisma.hostelBed.count({ where: { isOccupied: true } }),
      prisma.hostelBooking.count(),
      prisma.hostelBooking.count({ where: { status: 'CONFIRMED' as BookingStatus } }),
    ]);

    return {
      success: true,
      data: {
        totalRooms,
        occupiedRooms,
        availableRooms: totalRooms - occupiedRooms,
        occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
        totalBeds,
        occupiedBeds,
        availableBeds: totalBeds - occupiedBeds,
        totalBookings,
        confirmedBookings,
        pendingBookings: totalBookings - confirmedBookings,
      },
    };
  } catch (error) {
    console.error('Error fetching hostel stats:', error);
    return {
      success: false,
      error: 'Failed to fetch hostel statistics',
    };
  }
}