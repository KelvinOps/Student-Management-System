// src/actions/timetable.ts
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/app/lib/prisma';
import type { Building, Room, Break, TimetableEntry } from '@prisma/client';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

type BuildingWithCount = Building & {
  _count: {
    rooms: number;
  };
};

type RoomWithBuilding = Room & {
  building: Building;
};

type TimetableEntryWithRelations = TimetableEntry & {
  class: {
    id: string;
    code: string;
    name: string;
  };
  subject: {
    code: string;
    name: string;
  };
  tutor: {
    firstName: string;
    lastName: string;
  } | null;
  room: (Room & {
    building: Building;
  }) | null;
};

// ============== BUILDINGS ==============
export async function getBuildings(): Promise<ApiResponse<BuildingWithCount[]>> {
  try {
    const buildings = await prisma.building.findMany({
      include: {
        _count: {
          select: {
            rooms: true,
          },
        },
      },
      orderBy: {
        title: 'asc',
      },
    });

    return {
      success: true,
      data: buildings,
    };
  } catch (error) {
    console.error('Error fetching buildings:', error);
    return {
      success: false,
      error: 'Failed to fetch buildings',
      data: [],
    };
  }
}

export async function createBuilding(data: {
  title: string;
  status: string;
}): Promise<ApiResponse<Building>> {
  try {
    const building = await prisma.building.create({
      data: {
        title: data.title,
        status: data.status,
      },
    });

    revalidatePath('/academics/timetable/buildings');
    revalidatePath('/academics/timetable');

    return {
      success: true,
      data: building,
      message: 'Building created successfully',
    };
  } catch (error) {
    console.error('Error creating building:', error);
    return {
      success: false,
      error: 'Failed to create building',
    };
  }
}

export async function updateBuilding(
  id: string,
  data: { title: string; status: string }
): Promise<ApiResponse<Building>> {
  try {
    const building = await prisma.building.update({
      where: { id },
      data: {
        title: data.title,
        status: data.status,
      },
    });

    revalidatePath('/academics/timetable/buildings');
    revalidatePath('/academics/timetable');

    return {
      success: true,
      data: building,
      message: 'Building updated successfully',
    };
  } catch (error) {
    console.error('Error updating building:', error);
    return {
      success: false,
      error: 'Failed to update building',
    };
  }
}

export async function deleteBuilding(id: string): Promise<ApiResponse<null>> {
  try {
    // Check if building has rooms
    const roomCount = await prisma.room.count({
      where: { buildingId: id },
    });

    if (roomCount > 0) {
      return {
        success: false,
        error: 'Cannot delete building with rooms. Delete rooms first.',
      };
    }

    await prisma.building.delete({
      where: { id },
    });

    revalidatePath('/academics/timetable/buildings');
    revalidatePath('/academics/timetable');

    return {
      success: true,
      message: 'Building deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting building:', error);
    return {
      success: false,
      error: 'Failed to delete building',
    };
  }
}

// ============== ROOMS ==============
export async function getRooms(): Promise<ApiResponse<RoomWithBuilding[]>> {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        building: true,
      },
      orderBy: {
        title: 'asc',
      },
    });

    return {
      success: true,
      data: rooms,
    };
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return {
      success: false,
      error: 'Failed to fetch rooms',
      data: [],
    };
  }
}

export async function createRoom(data: {
  title: string;
  buildingId: string;
  roomIncharge: string | null;
  capacity: number | null;
}): Promise<ApiResponse<RoomWithBuilding>> {
  try {
    const room = await prisma.room.create({
      data: {
        title: data.title,
        buildingId: data.buildingId,
        roomIncharge: data.roomIncharge,
        capacity: data.capacity,
      },
      include: {
        building: true,
      },
    });

    revalidatePath('/academics/timetable/rooms');
    revalidatePath('/academics/timetable');

    return {
      success: true,
      data: room,
      message: 'Room created successfully',
    };
  } catch (error) {
    console.error('Error creating room:', error);
    return {
      success: false,
      error: 'Failed to create room',
    };
  }
}

export async function updateRoom(
  id: string,
  data: {
    title: string;
    buildingId: string;
    roomIncharge: string | null;
    capacity: number | null;
  }
): Promise<ApiResponse<RoomWithBuilding>> {
  try {
    const room = await prisma.room.update({
      where: { id },
      data: {
        title: data.title,
        buildingId: data.buildingId,
        roomIncharge: data.roomIncharge,
        capacity: data.capacity,
      },
      include: {
        building: true,
      },
    });

    revalidatePath('/academics/timetable/rooms');
    revalidatePath('/academics/timetable');

    return {
      success: true,
      data: room,
      message: 'Room updated successfully',
    };
  } catch (error) {
    console.error('Error updating room:', error);
    return {
      success: false,
      error: 'Failed to update room',
    };
  }
}

export async function deleteRoom(id: string): Promise<ApiResponse<null>> {
  try {
    // Check if room is being used in timetable
    const timetableCount = await prisma.timetableEntry.count({
      where: { roomId: id },
    });

    if (timetableCount > 0) {
      return {
        success: false,
        error: 'Cannot delete room being used in timetable. Remove from schedule first.',
      };
    }

    await prisma.room.delete({
      where: { id },
    });

    revalidatePath('/academics/timetable/rooms');
    revalidatePath('/academics/timetable');

    return {
      success: true,
      message: 'Room deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting room:', error);
    return {
      success: false,
      error: 'Failed to delete room',
    };
  }
}

// ============== BREAKS ==============
export async function getBreaks(): Promise<ApiResponse<Break[]>> {
  try {
    const breaks = await prisma.break.findMany({
      orderBy: {
        srNo: 'asc',
      },
    });

    return {
      success: true,
      data: breaks,
    };
  } catch (error) {
    console.error('Error fetching breaks:', error);
    return {
      success: false,
      error: 'Failed to fetch breaks',
      data: [],
    };
  }
}

export async function createBreak(data: {
  srNo: number;
  title: string;
  startTime: string;
  endTime: string;
}): Promise<ApiResponse<Break>> {
  try {
    const breakItem = await prisma.break.create({
      data: {
        srNo: data.srNo,
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
      },
    });

    revalidatePath('/academics/timetable/breaks');
    revalidatePath('/academics/timetable');

    return {
      success: true,
      data: breakItem,
      message: 'Break created successfully',
    };
  } catch (error) {
    console.error('Error creating break:', error);
    return {
      success: false,
      error: 'Failed to create break',
    };
  }
}

export async function updateBreak(
  id: string,
  data: {
    srNo: number;
    title: string;
    startTime: string;
    endTime: string;
  }
): Promise<ApiResponse<Break>> {
  try {
    const breakItem = await prisma.break.update({
      where: { id },
      data: {
        srNo: data.srNo,
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
      },
    });

    revalidatePath('/academics/timetable/breaks');
    revalidatePath('/academics/timetable');

    return {
      success: true,
      data: breakItem,
      message: 'Break updated successfully',
    };
  } catch (error) {
    console.error('Error updating break:', error);
    return {
      success: false,
      error: 'Failed to update break',
    };
  }
}

export async function deleteBreak(id: string): Promise<ApiResponse<null>> {
  try {
    await prisma.break.delete({
      where: { id },
    });

    revalidatePath('/academics/timetable/breaks');
    revalidatePath('/academics/timetable');

    return {
      success: true,
      message: 'Break deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting break:', error);
    return {
      success: false,
      error: 'Failed to delete break',
    };
  }
}

// ============== TIMETABLE ENTRIES ==============
export async function getTimetableEntries(
  classId?: string
): Promise<ApiResponse<TimetableEntryWithRelations[]>> {
  try {
    const where = classId ? { classId } : {};

    const entries = await prisma.timetableEntry.findMany({
      where,
      include: {
        class: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        subject: {
          select: {
            code: true,
            name: true,
          },
        },
        tutor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        room: {
          include: {
            building: true,
          },
        },
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return {
      success: true,
      data: entries,
    };
  } catch (error) {
    console.error('Error fetching timetable entries:', error);
    return {
      success: false,
      error: 'Failed to fetch timetable entries',
      data: [],
    };
  }
}

export async function createTimetableEntry(data: {
  classId: string;
  subjectId: string;
  tutorId: string | null;
  roomId: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}): Promise<ApiResponse<TimetableEntry>> {
  try {
    const entry = await prisma.timetableEntry.create({
      data: {
        classId: data.classId,
        subjectId: data.subjectId,
        tutorId: data.tutorId,
        roomId: data.roomId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
      },
    });

    revalidatePath('/academics/timetable/schedules');
    revalidatePath('/academics/timetable/time-table');
    revalidatePath('/academics/timetable');

    return {
      success: true,
      data: entry,
      message: 'Schedule entry created successfully',
    };
  } catch (error) {
    console.error('Error creating timetable entry:', error);
    return {
      success: false,
      error: 'Failed to create schedule entry',
    };
  }
}

export async function updateTimetableEntry(
  id: string,
  data: {
    classId: string;
    subjectId: string;
    tutorId: string | null;
    roomId: string | null;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }
): Promise<ApiResponse<TimetableEntry>> {
  try {
    const entry = await prisma.timetableEntry.update({
      where: { id },
      data: {
        classId: data.classId,
        subjectId: data.subjectId,
        tutorId: data.tutorId,
        roomId: data.roomId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
      },
    });

    revalidatePath('/academics/timetable/schedules');
    revalidatePath('/academics/timetable/time-table');
    revalidatePath('/academics/timetable');

    return {
      success: true,
      data: entry,
      message: 'Schedule entry updated successfully',
    };
  } catch (error) {
    console.error('Error updating timetable entry:', error);
    return {
      success: false,
      error: 'Failed to update schedule entry',
    };
  }
}

export async function deleteTimetableEntry(id: string): Promise<ApiResponse<null>> {
  try {
    await prisma.timetableEntry.delete({
      where: { id },
    });

    revalidatePath('/academics/timetable/schedules');
    revalidatePath('/academics/timetable/time-table');
    revalidatePath('/academics/timetable');

    return {
      success: true,
      message: 'Schedule entry deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting timetable entry:', error);
    return {
      success: false,
      error: 'Failed to delete schedule entry',
    };
  }
}