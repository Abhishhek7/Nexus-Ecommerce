import { prisma } from '../config/prisma';
import { AppError } from '../utils/http';
import { Prisma } from '@prisma/client';

const pagination = (page: number, limit: number, total: number) => ({
  page, limit, total, totalPages: Math.ceil(total / limit),
});

async function descendantCategoryIds(categoryId: number) {
  const categories = await prisma.category.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, parentId: true },
  });
  const children = new Map<number, number[]>();
  for (const category of categories) {
    if (category.parentId) {
      const list = children.get(category.parentId) ?? [];
      list.push(category.id);
      children.set(category.parentId, list);
    }
  }
  const result = [categoryId];
  const queue = [categoryId];
  while (queue.length) {
    const current = queue.shift()!;
    for (const child of children.get(current) ?? []) {
      result.push(child);
      queue.push(child);
    }
  }
  return result;
}

export async function listProducts(query: {
  page: number; limit: number; search?: string; vendorId?: number; categoryId?: number;
  categoryTree: boolean; minPrice?: number; maxPrice?: number;
  status?: 'ACTIVE'|'INACTIVE'|'OUT_OF_STOCK'; inStock?: boolean;
  sortBy: 'name'|'price'|'createdAt'; sortOrder: 'asc'|'desc';
}) {
  const { page, limit } = query;
  const where: Prisma.ProductWhereInput = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search } },
      { sku: { contains: query.search } },
      { category: { name: { contains: query.search } } },
      { vendor: { businessName: { contains: query.search } } },
    ];
  }
  if (query.vendorId) where.vendorId = query.vendorId;
  if (query.categoryId) {
    where.categoryId = query.categoryTree
      ? { in: await descendantCategoryIds(query.categoryId) }
      : query.categoryId;
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {
      ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
    };
  }
  if (query.status) where.status = query.status;
  if (query.inStock !== undefined) {
    where.inventory = query.inStock ? { availableQuantity: { gt: 0 } } : { availableQuantity: { lte: 0 } };
  }

  const [data, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [query.sortBy]: query.sortOrder },
      include: {
        vendor: { select: { id: true, businessName: true } },
        category: { select: { id: true, name: true } },
        inventory: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { data, pagination: pagination(page, limit, total) };
}

export async function getProduct(id: number) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { vendor: true, category: true, inventory: true },
  });
  if (!product) throw new AppError(404, 'Product not found', 'NOT_FOUND');
  return product;
}

async function assertCategory(categoryId: number) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category || category.status !== 'ACTIVE') {
    throw new AppError(422, 'Category is not active', 'INVALID_CATEGORY');
  }
}

async function assertVendor(vendorId: number) {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor || vendor.status !== 'ACTIVE') {
    throw new AppError(422, 'Vendor is not active', 'INVALID_VENDOR');
  }
  return vendor;
}

export async function createProduct(
  userId: number,
  role: string,
  input: {
    vendorId?: number; categoryId: number; name: string; sku: string;
    description: string; price: number; status: 'ACTIVE'|'INACTIVE'|'OUT_OF_STOCK';
    initialQuantity: number;
  },
) {
  await assertCategory(input.categoryId);
  const vendor = role === 'ADMIN'
    ? await assertVendor(input.vendorId ?? 0)
    : await prisma.vendor.findUnique({ where: { userId } });

  if (!vendor) throw new AppError(403, 'Vendor profile required', 'FORBIDDEN');

  return prisma.product.create({
    data: {
      vendorId: vendor.id,
      categoryId: input.categoryId,
      name: input.name,
      sku: input.sku,
      description: input.description,
      price: input.price,
      status: input.status,
      inventory: { create: { availableQuantity: input.initialQuantity } },
    },
    include: { inventory: true, category: true, vendor: true },
  });
}

export async function updateProduct(
  userId: number, role: string, id: number,
  input: { vendorId?: number; categoryId?: number; name?: string; description?: string; price?: number; status?: string },
) {
  const product = await getProduct(id);
  if (role === 'VENDOR') {
    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor || product.vendorId !== vendor.id) {
      throw new AppError(403, 'You can only modify your own products', 'FORBIDDEN');
    }
    if (input.vendorId && input.vendorId !== vendor.id) {
      throw new AppError(403, 'A vendor cannot reassign product ownership', 'FORBIDDEN');
    }
  }
  if (input.categoryId) await assertCategory(input.categoryId);
  if (role === 'ADMIN' && input.vendorId) await assertVendor(input.vendorId);

  const { vendorId, ...data } = input;
  return prisma.product.update({
    where: { id },
    data: { ...data, ...(role === 'ADMIN' && vendorId ? { vendorId } : {}) },
    include: { inventory: true, category: true, vendor: true },
  });
}

export async function deleteProduct(userId: number, role: string, id: number) {
  const product = await getProduct(id);
  if (role === 'VENDOR') {
    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor || product.vendorId !== vendor.id) {
      throw new AppError(403, 'You can only delete your own products', 'FORBIDDEN');
    }
  }
  // Soft delete keeps historical order_items valid.
  await prisma.product.update({ where: { id }, data: { status: 'INACTIVE' } });
  return null;
}

export async function topSelling(q: {
  dateFrom?: Date; dateTo?: Date; vendorId?: number; categoryId?: number; limit: number;
}) {
  const from = q.dateFrom ?? new Date(Date.now() - 30 * 864e5);
  const to = q.dateTo ?? new Date();

  const rows = await prisma.$queryRaw<Array<{
    productId: number; productName: string; vendor: string; category: string;
    orders: bigint; quantitySold: bigint; revenue: Prisma.Decimal;
  }>>(Prisma.sql`
    SELECT
      p.id AS productId,
      p.name AS productName,
      v.business_name AS vendor,
      c.name AS category,
      COUNT(DISTINCT o.id) AS orders,
      COALESCE(SUM(oi.quantity), 0) AS quantitySold,
      COALESCE(SUM(oi.total_amount), 0) AS revenue
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    INNER JOIN products p ON p.id = oi.product_id
    INNER JOIN vendors v ON v.id = p.vendor_id
    INNER JOIN categories c ON c.id = p.category_id
    WHERE o.created_at >= ${from}
      AND o.created_at <= ${to}
      AND o.status <> 'CANCELLED'
      ${q.vendorId ? Prisma.sql`AND p.vendor_id = ${q.vendorId}` : Prisma.empty}
      ${q.categoryId ? Prisma.sql`AND p.category_id = ${q.categoryId}` : Prisma.empty}
    GROUP BY p.id, p.name, v.business_name, c.name
    ORDER BY revenue DESC
    LIMIT ${q.limit}
  `);

  return rows.map((row) => ({
    productId: Number(row.productId),
    productName: row.productName,
    vendor: row.vendor,
    category: row.category,
    orders: Number(row.orders),
    quantitySold: Number(row.quantitySold),
    revenue: Number(row.revenue),
  }));
}
