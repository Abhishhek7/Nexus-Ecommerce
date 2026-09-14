import { prisma } from '../config/prisma';
import { AppError } from '../utils/http';

export async function profile(id: number) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      vendor: true,
    },
  });

  if (!user) {
    throw new AppError(404, 'User not found', 'NOT_FOUND');
  }

  return user;
}

export async function update(id: number, input: any) {
  return prisma.user.update({
    where: { id },
    data: { name: input.name },
  });
}