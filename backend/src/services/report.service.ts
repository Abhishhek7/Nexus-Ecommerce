import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';

const notCancelled = Prisma.sql`o.status <> 'CANCELLED'`;

export async function sales(q: {
  dateFrom?: Date; dateTo?: Date; vendorId?: number; categoryId?: number;
  productId?: number; paymentStatus?: 'PENDING'|'SUCCESS'|'FAILED'|'REFUNDED';
  groupBy: 'day'|'week'|'month'|'vendor'|'category'|'product';
}) {
  const from = q.dateFrom ?? new Date(Date.now() - 180 * 864e5);
  const to = q.dateTo ?? new Date();

  const filters = [
    Prisma.sql`o.created_at >= ${from}`,
    Prisma.sql`o.created_at <= ${to}`,
    notCancelled,
    ...(q.vendorId ? [Prisma.sql`p.vendor_id = ${q.vendorId}`] : []),
    ...(q.categoryId ? [Prisma.sql`p.category_id = ${q.categoryId}`] : []),
    ...(q.productId ? [Prisma.sql`p.id = ${q.productId}`] : []),
    ...(q.paymentStatus ? [Prisma.sql`pay.status = ${q.paymentStatus}`] : []),
  ];
  const where = Prisma.join(filters, ' AND ');

  if (q.groupBy === 'vendor') {
    return prisma.$queryRaw(Prisma.sql`
      SELECT v.id AS groupId, v.business_name AS groupName,
        COUNT(DISTINCT o.id) AS orders, COALESCE(SUM(oi.quantity),0) AS itemsSold,
        COALESCE(SUM(oi.total_amount),0) AS grossRevenue,
        COALESCE(SUM(oi.discount),0) AS discount,
        COALESCE(SUM(oi.total_amount - oi.discount),0) AS netRevenue
      FROM orders o JOIN order_items oi ON oi.order_id=o.id
      JOIN products p ON p.id=oi.product_id JOIN vendors v ON v.id=p.vendor_id
      LEFT JOIN payments pay ON pay.order_id=o.id
      WHERE ${where}
      GROUP BY v.id, v.business_name ORDER BY netRevenue DESC
    `);
  }

  if (q.groupBy === 'category') {
    return prisma.$queryRaw(Prisma.sql`
      SELECT c.id AS groupId, c.name AS groupName,
        COUNT(DISTINCT o.id) AS orders, COALESCE(SUM(oi.quantity),0) AS itemsSold,
        COALESCE(SUM(oi.total_amount),0) AS grossRevenue,
        COALESCE(SUM(oi.discount),0) AS discount,
        COALESCE(SUM(oi.total_amount - oi.discount),0) AS netRevenue
      FROM orders o JOIN order_items oi ON oi.order_id=o.id
      JOIN products p ON p.id=oi.product_id JOIN categories c ON c.id=p.category_id
      LEFT JOIN payments pay ON pay.order_id=o.id
      WHERE ${where}
      GROUP BY c.id, c.name ORDER BY netRevenue DESC
    `);
  }

  if (q.groupBy === 'product') {
    return prisma.$queryRaw(Prisma.sql`
      SELECT p.id AS groupId, p.name AS groupName,
        COUNT(DISTINCT o.id) AS orders, COALESCE(SUM(oi.quantity),0) AS itemsSold,
        COALESCE(SUM(oi.total_amount),0) AS grossRevenue,
        COALESCE(SUM(oi.discount),0) AS discount,
        COALESCE(SUM(oi.total_amount - oi.discount),0) AS netRevenue
      FROM orders o JOIN order_items oi ON oi.order_id=o.id
      JOIN products p ON p.id=oi.product_id
      LEFT JOIN payments pay ON pay.order_id=o.id
      WHERE ${where}
      GROUP BY p.id, p.name ORDER BY netRevenue DESC
    `);
  }

  const period = q.groupBy === 'day'
    ? Prisma.sql`DATE(o.created_at)`
    : q.groupBy === 'week'
      ? Prisma.sql`YEARWEEK(o.created_at, 1)`
      : Prisma.sql`DATE_FORMAT(o.created_at, '%Y-%m')`;

  return prisma.$queryRaw(Prisma.sql`
    SELECT ${period} AS period,
      COUNT(DISTINCT o.id) AS orders, COALESCE(SUM(oi.quantity),0) AS itemsSold,
      COALESCE(SUM(oi.total_amount),0) AS grossRevenue,
      COALESCE(SUM(oi.discount),0) AS discount,
      COALESCE(SUM(oi.total_amount - oi.discount),0) AS netRevenue
    FROM orders o JOIN order_items oi ON oi.order_id=o.id
    JOIN products p ON p.id=oi.product_id
    LEFT JOIN payments pay ON pay.order_id=o.id
    WHERE ${where}
    GROUP BY ${period}
    ORDER BY ${period}
  `);
}

async function monthlyRevenue(vendorId?: number) {
  return prisma.$queryRaw(Prisma.sql`
    SELECT DATE_FORMAT(o.created_at, '%Y-%m') AS month,
      COALESCE(SUM(oi.total_amount),0) AS revenue
    FROM orders o
    JOIN order_items oi ON oi.order_id=o.id
    JOIN products p ON p.id=oi.product_id
    WHERE o.status <> 'CANCELLED'
      ${vendorId ? Prisma.sql`AND p.vendor_id = ${vendorId}` : Prisma.empty}
    GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
    ORDER BY month
  `);
}

async function topProducts(vendorId?: number, limit = 5) {
  return prisma.$queryRaw(Prisma.sql`
    SELECT p.id AS productId, p.name, COALESCE(SUM(oi.quantity),0) AS quantitySold,
      COALESCE(SUM(oi.total_amount),0) AS revenue
    FROM order_items oi
    JOIN orders o ON o.id=oi.order_id
    JOIN products p ON p.id=oi.product_id
    WHERE o.status <> 'CANCELLED'
      ${vendorId ? Prisma.sql`AND p.vendor_id = ${vendorId}` : Prisma.empty}
    GROUP BY p.id, p.name
    ORDER BY revenue DESC
    LIMIT ${limit}
  `);
}

async function topCategories(vendorId: number, limit = 5) {
  return prisma.$queryRaw(Prisma.sql`
    SELECT c.id AS categoryId, c.name, COALESCE(SUM(oi.quantity),0) AS itemsSold,
      COALESCE(SUM(oi.total_amount),0) AS revenue
    FROM order_items oi
    JOIN orders o ON o.id=oi.order_id
    JOIN products p ON p.id=oi.product_id
    JOIN categories c ON c.id=p.category_id
    WHERE o.status <> 'CANCELLED' AND p.vendor_id=${vendorId}
    GROUP BY c.id, c.name
    ORDER BY revenue DESC
    LIMIT ${limit}
  `);
}

export async function vendorDashboard(userId: number) {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) throw new Error('Vendor profile not found');

  const base = { items: { some: { product: { vendorId: vendor.id } } } };
  const [products, activeProducts, orders, completedOrders, cancelledOrders, items, monthly, productsTop, categoriesTop] = await Promise.all([
    prisma.product.count({ where: { vendorId: vendor.id } }),
    prisma.product.count({ where: { vendorId: vendor.id, status: 'ACTIVE' } }),
    prisma.order.count({ where: base }),
    prisma.order.count({ where: { ...base, status: 'DELIVERED' } }),
    prisma.order.count({ where: { ...base, status: 'CANCELLED' } }),
    prisma.orderItem.aggregate({
      where: { product: { vendorId: vendor.id }, order: { status: { not: 'CANCELLED' } } },
      _sum: { quantity: true, totalAmount: true },
    }),
    monthlyRevenue(vendor.id),
    topProducts(vendor.id),
    topCategories(vendor.id),
  ]);

  const totalRevenue = Number(items._sum.totalAmount ?? 0);
  const totalItemsSold = Number(items._sum.quantity ?? 0);

  return {
    totalProducts: products,
    activeProducts,
    totalOrders: orders,
    completedOrders,
    cancelledOrders,
    totalItemsSold,
    totalRevenue,
    averageOrderValue: orders ? totalRevenue / orders : 0,
    top5Products: productsTop,
    top5Categories: categoriesTop,
    monthlyRevenue: monthly,
  };
}

export async function adminDashboard() {
  const [customers, vendors, products, orders, completed, cancelled, revenue, monthly, productsTop, vendorsTop] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.vendor.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.order.count({ where: { status: 'CANCELLED' } }),
    prisma.order.aggregate({ where: { status: { not: 'CANCELLED' } }, _sum: { totalAmount: true } }),
    monthlyRevenue(),
    topProducts(),
    prisma.$queryRaw(Prisma.sql`
      SELECT v.id AS vendorId, v.business_name AS name,
        COALESCE(SUM(oi.total_amount),0) AS revenue
      FROM order_items oi
      JOIN orders o ON o.id=oi.order_id
      JOIN products p ON p.id=oi.product_id
      JOIN vendors v ON v.id=p.vendor_id
      WHERE o.status <> 'CANCELLED'
      GROUP BY v.id, v.business_name
      ORDER BY revenue DESC
      LIMIT 5
    `),
  ]);

  const totalRevenue = Number(revenue._sum.totalAmount ?? 0);
  return {
    totalCustomers: customers,
    totalVendors: vendors,
    totalProducts: products,
    totalOrders: orders,
    completedOrders: completed,
    cancelledOrders: cancelled,
    totalRevenue,
    averageOrderValue: orders ? totalRevenue / orders : 0,
    topVendors: vendorsTop,
    topProducts: productsTop,
    monthlyRevenue: monthly,
  };
}
