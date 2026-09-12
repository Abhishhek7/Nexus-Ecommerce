import { prisma } from '../config/prisma';
import { AppError } from '../utils/http';

export async function list() {
  const cats = await prisma.category.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { name: 'asc' },
  });
  const map = new Map(cats.map((c) => [c.id, { ...c, children: [] as unknown[] }]));
  const roots: unknown[] = [];

  for (const category of cats) {
    const node = map.get(category.id)!;
    if (category.parentId && map.has(category.parentId)) {
      (map.get(category.parentId)!.children as unknown[]).push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export async function create(input: { name: string; parentId?: number | null }) {
  if (input.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: input.parentId } });
    if (!parent || parent.status !== 'ACTIVE') {
      throw new AppError(422, 'Parent category is not active', 'INVALID_PARENT_CATEGORY');
    }
  }
  return prisma.category.create({ data: { name: input.name, parentId: input.parentId ?? null } });
}

export async function update(id: number, input: { name?: string; parentId?: number | null; status?: 'ACTIVE'|'INACTIVE' }) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new AppError(404, 'Category not found', 'NOT_FOUND');

  if (input.parentId === id) {
    throw new AppError(422, 'A category cannot be its own parent', 'INVALID_PARENT_CATEGORY');
  }
  if (input.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: input.parentId } });
    if (!parent) throw new AppError(404, 'Parent category not found', 'NOT_FOUND');
  }

  return prisma.category.update({ where: { id }, data: input });
}

export async function remove(id: number) {
  const children = await prisma.category.count({ where: { parentId: id, status: 'ACTIVE' } });
  if (children) throw new AppError(409, 'Category has child categories', 'CATEGORY_HAS_CHILDREN');

  const products = await prisma.product.count({ where: { categoryId: id, status: 'ACTIVE' } });
  if (products) throw new AppError(409, 'Category has active products', 'CATEGORY_HAS_PRODUCTS');

  return prisma.category.update({ where: { id }, data: { status: 'INACTIVE' } });
}
