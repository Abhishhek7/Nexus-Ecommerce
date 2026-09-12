import { prisma } from '../config/prisma';

export async function listVendors() {
  return prisma.vendor.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { businessName: 'asc' },
    select: { id: true, businessName: true, phone: true, status: true },
  });
}
