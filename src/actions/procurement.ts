// src/actions/procurement.ts
'use server';

import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma, ProcurementStatus } from '@prisma/client';

export interface ProcurementRequestData {
  requestedBy: string;
  department: string;
  description: string;
  estimatedCost: number;
  items?: ProcurementItem[];
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category?: string;
  justification?: string;
}

export interface ProcurementItem {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  specifications?: string;
}

interface ApprovalData {
  approvedBy: string;
  comments?: string;
}

async function generateRequestNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.procurementRequest.count({
    where: {
      requestNumber: {
        startsWith: `PR/${year}/`,
      },
    },
  });
  const nextNumber = (count + 1).toString().padStart(4, '0');
  return `PR/${year}/${nextNumber}`;
}

export async function createProcurementRequest(data: ProcurementRequestData) {
  try {
    const requestNumber = await generateRequestNumber();

    const request = await prisma.procurementRequest.create({
      data: {
        requestNumber,
        requestedBy: data.requestedBy,
        department: data.department,
        description: data.description,
        estimatedCost: data.estimatedCost,
        status: 'PENDING',
        // Store additional data as JSON in the description or add new fields
        ...(data.priority && { 
          description: `${data.description}\n\nPriority: ${data.priority}\nJustification: ${data.justification || 'N/A'}` 
        }),
      },
    });

    revalidatePath('/finance/procurement');
    return { success: true, data: request };
  } catch (error) {
    console.error('Error creating procurement request:', error);
    return { success: false, error: 'Failed to create procurement request' };
  }
}

export async function updateProcurementRequest(
  id: string,
  data: Partial<ProcurementRequestData>
) {
  try {
    const updateData: Prisma.ProcurementRequestUpdateInput = {
      ...(data.department && { department: data.department }),
      ...(data.description && { description: data.description }),
      ...(data.estimatedCost && { estimatedCost: data.estimatedCost }),
    };

    // Handle additional fields
    if (data.priority || data.justification || data.category) {
      const existing = await prisma.procurementRequest.findUnique({
        where: { id },
        select: { description: true },
      });

      if (existing) {
        // Parse or update description with additional info
        updateData.description = existing.description;
        if (data.priority) {
          updateData.description += `\nUpdated Priority: ${data.priority}`;
        }
        if (data.justification) {
          updateData.description += `\nUpdated Justification: ${data.justification}`;
        }
        if (data.category) {
          updateData.description += `\nCategory: ${data.category}`;
        }
      }
    }

    const request = await prisma.procurementRequest.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/finance/procurement');
    return { success: true, data: request };
  } catch (error) {
    console.error('Error updating procurement request:', error);
    return { success: false, error: 'Failed to update procurement request' };
  }
}

export async function approveProcurementRequest(
  id: string,
  approvalData: ApprovalData
) {
  try {
    const { approvedBy, comments } = approvalData;

    const request = await prisma.procurementRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
        // Store comments in the description field for now
        ...(comments && { 
          description: await addApprovalComments(id, `Approval Comments: ${comments}`) 
        }),
      },
    });

    revalidatePath('/finance/procurement');
    return { success: true, data: request };
  } catch (error) {
    console.error('Error approving procurement request:', error);
    return { success: false, error: 'Failed to approve procurement request' };
  }
}

export async function rejectProcurementRequest(
  id: string,
  rejectionData: ApprovalData
) {
  try {
    const { approvedBy, comments } = rejectionData;

    const request = await prisma.procurementRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedBy,
        approvedAt: new Date(),
        // Store comments in the description field for now
        ...(comments && { 
          description: await addApprovalComments(id, `Rejection Comments: ${comments}`) 
        }),
      },
    });

    revalidatePath('/finance/procurement');
    return { success: true, data: request };
  } catch (error) {
    console.error('Error rejecting procurement request:', error);
    return { success: false, error: 'Failed to reject procurement request' };
  }
}

// Helper function to add comments to existing description
async function addApprovalComments(id: string, comments: string): Promise<string> {
  const request = await prisma.procurementRequest.findUnique({
    where: { id },
    select: { description: true },
  });

  if (!request) {
    return comments;
  }

  return `${request.description}\n\n${comments}`;
}

export async function updateProcurementStatus(id: string, status: ProcurementStatus, comments?: string) {
  try {
    const updateData: Prisma.ProcurementRequestUpdateInput = {
      status,
      ...(status === 'APPROVED' || status === 'REJECTED' ? {
        approvedAt: new Date(),
      } : {}),
    };

    // Add comments if provided
    if (comments) {
      updateData.description = await addApprovalComments(id, `Status Update to ${status}: ${comments}`);
    }

    const request = await prisma.procurementRequest.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/finance/procurement');
    return { success: true, data: request };
  } catch (error) {
    console.error('Error updating procurement status:', error);
    return { success: false, error: 'Failed to update procurement status' };
  }
}

export async function getProcurementRequests(filters?: {
  department?: string;
  status?: ProcurementStatus;
  requestedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const {
      department,
      status,
      requestedBy,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 50,
    } = filters || {};

    const where: Prisma.ProcurementRequestWhereInput = {};

    if (department) where.department = department;
    if (status) where.status = status;
    if (requestedBy) where.requestedBy = requestedBy;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    if (search) {
      where.OR = [
        { requestNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.procurementRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.procurementRequest.count({ where }),
    ]);

    return {
      success: true,
      data: requests,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  } catch (error) {
    console.error('Error fetching procurement requests:', error);
    return { success: false, error: 'Failed to fetch procurement requests', data: [] };
  }
}

export async function getProcurementRequest(id: string) {
  try {
    const request = await prisma.procurementRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return { success: false, error: 'Procurement request not found' };
    }

    // Parse additional info from description
    const parsedRequest = {
      ...request,
      parsedDescription: parseDescription(request.description),
    };

    return { success: true, data: parsedRequest };
  } catch (error) {
    console.error('Error fetching procurement request:', error);
    return { success: false, error: 'Failed to fetch procurement request' };
  }
}

// Helper function to parse additional info from description
function parseDescription(description: string) {
  const result: Record<string, string> = {};
  const lines = description.split('\n').filter(line => line.trim());

  lines.forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      const value = valueParts.join(':').trim();
      result[key.trim().toLowerCase().replace(/\s+/g, '_')] = value;
    }
  });

  return result;
}

export async function deleteProcurementRequest(id: string) {
  try {
    const request = await prisma.procurementRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return { success: false, error: 'Procurement request not found' };
    }

    // Only allow deletion of pending requests
    if (request.status !== 'PENDING') {
      return { success: false, error: 'Can only delete pending requests' };
    }

    await prisma.procurementRequest.delete({
      where: { id },
    });

    revalidatePath('/finance/procurement');
    return { success: true };
  } catch (error) {
    console.error('Error deleting procurement request:', error);
    return { success: false, error: 'Failed to delete procurement request' };
  }
}

export async function getProcurementSummary(filters?: {
  department?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  try {
    const { department, dateFrom, dateTo } = filters || {};

    const where: Prisma.ProcurementRequestWhereInput = {};

    if (department) where.department = department;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const requests = await prisma.procurementRequest.findMany({
      where,
    });

    const summary = {
      total: requests.length,
      totalValue: requests.reduce((sum, r) => sum + r.estimatedCost, 0),
      byStatus: {
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0,
      } as Record<ProcurementStatus, number>,
      byDepartment: {} as Record<string, { count: number; value: number }>,
    };

    requests.forEach((request) => {
      summary.byStatus[request.status]++;

      if (!summary.byDepartment[request.department]) {
        summary.byDepartment[request.department] = { count: 0, value: 0 };
      }
      summary.byDepartment[request.department].count++;
      summary.byDepartment[request.department].value += request.estimatedCost;
    });

    return { success: true, data: summary };
  } catch (error) {
    console.error('Error generating procurement summary:', error);
    return { success: false, error: 'Failed to generate procurement summary' };
  }
}

export async function getDepartmentProcurementBudget(department: string) {
  try {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);

    const requests = await prisma.procurementRequest.findMany({
      where: {
        department,
        createdAt: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
    });

    const summary = {
      totalRequested: 0,
      totalApproved: 0,
      totalSpent: 0,
      pending: 0,
      approvedWithComments: [] as Array<{ requestNumber: string; comments?: string }>,
      rejectedWithComments: [] as Array<{ requestNumber: string; comments?: string }>,
    };

    requests.forEach((request) => {
      summary.totalRequested += request.estimatedCost;

      if (request.status === 'APPROVED' || request.status === 'COMPLETED') {
        summary.totalApproved += request.estimatedCost;
        
        // Extract approval comments if any
        const parsed = parseDescription(request.description);
        summary.approvedWithComments.push({
          requestNumber: request.requestNumber,
          comments: parsed.approval_comments,
        });
      }

      if (request.status === 'COMPLETED') {
        summary.totalSpent += request.estimatedCost;
      }

      if (request.status === 'PENDING') {
        summary.pending += request.estimatedCost;
      }

      if (request.status === 'REJECTED') {
        // Extract rejection comments if any
        const parsed = parseDescription(request.description);
        summary.rejectedWithComments.push({
          requestNumber: request.requestNumber,
          comments: parsed.rejection_comments,
        });
      }
    });

    return { success: true, data: summary };
  } catch (error) {
    console.error('Error fetching department procurement budget:', error);
    return { success: false, error: 'Failed to fetch department budget' };
  }
}

// Get procurement statistics for dashboard
export async function getProcurementDashboardStats() {
  try {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);

    const requests = await prisma.procurementRequest.findMany({
      where: {
        createdAt: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
    });

    const totalValue = requests.reduce((sum, r) => sum + r.estimatedCost, 0);
    const pendingCount = requests.filter(r => r.status === 'PENDING').length;
    const approvedCount = requests.filter(r => r.status === 'APPROVED').length;
    const completedCount = requests.filter(r => r.status === 'COMPLETED').length;

    return {
      success: true,
      data: {
        totalRequests: requests.length,
        totalValue,
        pendingCount,
        approvedCount,
        completedCount,
        averageProcessingTime: 0, // You would calculate this based on approval dates
      },
    };
  } catch (error) {
    console.error('Error fetching procurement dashboard stats:', error);
    return { success: false, error: 'Failed to fetch procurement stats' };
  }
}