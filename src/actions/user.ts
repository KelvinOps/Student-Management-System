// src/actions/user.ts
'use server';

import prisma from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import * as bcrypt from 'bcryptjs';
import { Prisma, UserRole } from '@prisma/client';

// Get all users/staff
export async function getUsers(params?: {
  search?: string;
  role?: UserRole;
  limit?: number;
  page?: number;
}) {
  try {
    const { search = '', role, limit = 10, page = 1 } = params || {};
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phoneNumber: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(role && { role }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      success: true,
      data: users,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
        limit,
      },
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      success: false,
      error: 'Failed to fetch users',
      data: [],
    };
  }
}

// Get user by ID
export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            studentReports: true,
            attendanceRecords: true,
            marksEntries: true,
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return {
      success: false,
      error: 'Failed to fetch user details',
    };
  }
}

// Create new user/staff
export async function createUser(data: {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatar?: string;
}) {
  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'User with this email already exists',
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        avatar: data.avatar,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
    });

    revalidatePath('/staff-management');

    return {
      success: true,
      data: newUser,
      message: 'Staff member created successfully',
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: 'Failed to create staff member',
    };
  }
}

// Update user
export async function updateUser(
  id: string,
  data: {
    email?: string;
    role?: UserRole;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    avatar?: string;
    isActive?: boolean;
  }
) {
  try {
    // If email is being updated, check if it's already taken
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: { id },
        },
      });

      if (existingUser) {
        return {
          success: false,
          error: 'Email already in use by another user',
        };
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        avatar: true,
        isActive: true,
        updatedAt: true,
      },
    });

    revalidatePath('/staff-management');
    revalidatePath(`/staff-management/${id}`);

    return {
      success: true,
      data: updatedUser,
      message: 'Staff member updated successfully',
    };
  } catch (error) {
    console.error('Error updating user:', error);
    return {
      success: false,
      error: 'Failed to update staff member',
    };
  }
}

// Update user password
export async function updateUserPassword(id: string, newPassword: string) {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: 'Password updated successfully',
    };
  } catch (error) {
    console.error('Error updating password:', error);
    return {
      success: false,
      error: 'Failed to update password',
    };
  }
}

// Delete user
export async function deleteUser(id: string) {
  try {
    // Check if user has associated records
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            studentReports: true,
            attendanceRecords: true,
            marksEntries: true,
          },
        },
      },
    });

    if (
      user &&
      (user._count.studentReports > 0 ||
        user._count.attendanceRecords > 0 ||
        user._count.marksEntries > 0)
    ) {
      return {
        success: false,
        error: 'Cannot delete user with associated records. Consider deactivating instead.',
      };
    }

    await prisma.user.delete({
      where: { id },
    });

    revalidatePath('/staff-management');

    return {
      success: true,
      message: 'Staff member deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      error: 'Failed to delete staff member',
    };
  }
}

// Export users data
export async function exportUsersData() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const csvData = users.map((user) => ({
      Email: user.email,
      Role: user.role,
      'First Name': user.firstName,
      'Last Name': user.lastName,
      'Phone Number': user.phoneNumber || 'N/A',
      Status: user.isActive ? 'Active' : 'Inactive',
      'Created At': user.createdAt.toISOString().split('T')[0],
    }));

    return {
      success: true,
      data: csvData,
    };
  } catch (error) {
    console.error('Error exporting users:', error);
    return {
      success: false,
      error: 'Failed to export users',
    };
  }
}

// Toggle user active status
export async function toggleUserStatus(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { isActive: true },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        isActive: true,
      },
    });

    revalidatePath('/staff-management');

    return {
      success: true,
      data: updatedUser,
      message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
    };
  } catch (error) {
    console.error('Error toggling user status:', error);
    return {
      success: false,
      error: 'Failed to update user status',
    };
  }
}