import { prisma } from '../config/prisma';
import { AppError } from '../utils/http';
import { OrderStatus, Prisma } from '@prisma/client';

const TAX_RATE = 0.18;
const SHIPPING_THRESHOLD = 2000;
const SHIPPING_FEE = 100;

const allowed: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const orderInclude = {
  customer: { select: { id: true, name: true, email: true } },
  items: { include: { product: { include: { vendor: true, category: true } } } },
  payment: true,
  coupons: { include: { coupon: true } },
} satisfies Prisma.OrderInclude;

export async function createOrder(customerId: number, input: {
  items: { productId: number; quantity: number }[];
  couponCode?: string;
  paymentMethod: 'CARD' | 'COD';
}) {
  try {
    return await prisma.$transaction(async (tx) => {
      // Lock products in a deterministic order to reduce deadlock risk.
      const requested = [...input.items].sort((a, b) => a.productId - b.productId);
      const ids = requested.map((item) => item.productId);

      const products = await tx.product.findMany({
        where: { id: { in: ids }, status: 'ACTIVE' },
        include: { inventory: true },
      });

      if (products.length !== ids.length) {
        throw new AppError(400, 'One or more products are unavailable', 'PRODUCT_UNAVAILABLE');
      }

      const byId = new Map(products.map((product) => [product.id, product]));
      let subtotal = 0;

      for (const item of requested) {
        const product = byId.get(item.productId)!;
        if (!product.inventory || product.inventory.availableQuantity < item.quantity) {
          throw new AppError(409, `Insufficient inventory for ${product.name}`, 'INSUFFICIENT_INVENTORY');
        }
        subtotal += Number(product.price) * item.quantity;
      }

      let discount = 0;
      let coupon: any = null;

      if (input.couponCode) {
        coupon = await tx.coupon.findUnique({ where: { code: input.couponCode.toUpperCase() } });
        const now = new Date();

        if (!coupon || coupon.status !== 'ACTIVE' || now < coupon.startDate || now > coupon.endDate) {
          throw new AppError(422, 'Invalid or expired coupon', 'INVALID_COUPON');
        }
        if (subtotal < Number(coupon.minimumOrderValue)) {
          throw new AppError(422, 'Minimum order value not met', 'COUPON_MINIMUM');
        }
        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
          throw new AppError(422, 'Coupon usage limit reached', 'COUPON_LIMIT');
        }

        discount = coupon.discountType === 'PERCENTAGE'
          ? subtotal * Number(coupon.discountValue) / 100
          : Number(coupon.discountValue);

        if (coupon.maximumDiscount !== null) {
          discount = Math.min(discount, Number(coupon.maximumDiscount));
        }
      }

      const taxable = Math.max(0, subtotal - discount);
      const tax = taxable * TAX_RATE;
      const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
      const total = taxable + tax + shipping;

      const order = await tx.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          customerId,
          subtotal,
          discount,
          tax,
          shippingFee: shipping,
          totalAmount: total,
          items: {
            create: input.items.map((item) => {
              const product = byId.get(item.productId)!;
              return {
                productId: product.id,
                quantity: item.quantity,
                unitPrice: product.price,
                discount: 0,
                totalAmount: Number(product.price) * item.quantity,
              };
            }),
          },
          payment: {
            create: {
              amount: total,
              paymentMethod: input.paymentMethod,
              // Payment is mocked for the assignment; a real gateway would update this asynchronously.
              status: 'SUCCESS',
              transactionId: `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              paidAt: new Date(),
            },
          },
          ...(coupon ? {
            coupons: { create: { couponId: coupon.id, discountAmount: discount } },
          } : {}),
        },
      });

      // Conditional atomic UPDATE is the final stock guard. If another transaction
      // consumes the stock first, this affects zero rows and the whole transaction rolls back.
      for (const item of requested) {
        const product = byId.get(item.productId)!;
        const result = await tx.inventory.updateMany({
          where: {
            productId: product.id,
            availableQuantity: { gte: item.quantity },
          },
          data: {
            availableQuantity: { decrement: item.quantity },
            reservedQuantity: { increment: item.quantity },
          },
        });
        if (result.count !== 1) {
          throw new AppError(409, `Inventory changed while placing order for ${product.name}`, 'INVENTORY_CONFLICT');
        }
      }

      if (coupon) {
        const result = await tx.coupon.updateMany({
          where: {
            id: coupon.id,
            OR: [
              { usageLimit: null },
              { usedCount: { lt: coupon.usageLimit! } },
            ],
          },
          data: { usedCount: { increment: 1 } },
        });
        if (result.count !== 1) {
          throw new AppError(409, 'Coupon usage limit was reached while placing the order', 'COUPON_CONFLICT');
        }
      }

      return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: orderInclude });
    }, { isolationLevel: 'Serializable', maxWait: 5000, timeout: 15000 });
  } catch (error) {
    // Prisma uses P2034 for serialization/deadlock conflicts. Convert it into a useful API response.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      throw new AppError(409, 'Order conflicted with another transaction. Please retry.', 'TRANSACTION_CONFLICT');
    }
    throw error;
  }
}

export async function listOrders(user: { id: number; role: string }, q: {
  page?: number; limit?: number; status?: OrderStatus; search?: string; date?: string;
  minAmount?: number; maxAmount?: number;
}) {
  const page = Number(q.page ?? 1);
  const limit = Number(q.limit ?? 20);
  const where: Prisma.OrderWhereInput = {};

  if (user.role === 'CUSTOMER') where.customerId = user.id;
  if (user.role === 'VENDOR') {
    where.items = { some: { product: { vendor: { userId: user.id } } } };
  }
  if (q.status) where.status = q.status;
  if (q.search) where.orderNumber = { contains: q.search };
  if (q.date) {
    const start = new Date(`${q.date}T00:00:00.000`);
    const end = new Date(`${q.date}T23:59:59.999`);
    where.createdAt = { gte: start, lte: end };
  }
  if (q.minAmount !== undefined || q.maxAmount !== undefined) {
    where.totalAmount = {
      ...(q.minAmount !== undefined ? { gte: q.minAmount } : {}),
      ...(q.maxAmount !== undefined ? { lte: q.maxAmount } : {}),
    };
  }

  const [data, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true, vendorId: true } } } },
        payment: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function findAuthorizedOrder(
  tx: Prisma.TransactionClient | typeof prisma,
  user: { id: number; role: string },
  id: number,
) {
  const order = await tx.order.findUnique({ where: { id }, include: orderInclude });
  if (!order) throw new AppError(404, 'Order not found', 'NOT_FOUND');

  if (user.role === 'CUSTOMER' && order.customerId !== user.id) {
    throw new AppError(403, 'You can only access your own orders', 'FORBIDDEN');
  }
  if (user.role === 'VENDOR' && !order.items.some((item) => item.product.vendor.userId === user.id)) {
    throw new AppError(403, 'You can only access orders containing your products', 'FORBIDDEN');
  }
  return order;
}

export async function getOrder(user: { id: number; role: string }, id: number) {
  return findAuthorizedOrder(prisma, user, id);
}

export async function updateStatus(
  user: { id: number; role: string },
  id: number,
  status: OrderStatus,
) {
  return prisma.$transaction(async (tx) => {
    const order = await findAuthorizedOrder(tx, user, id);
    if (!allowed[order.status].includes(status)) {
      throw new AppError(400, `Invalid status transition: ${order.status} -> ${status}`, 'INVALID_STATUS_TRANSITION');
    }
    const result = await tx.order.updateMany({
      where: { id, status: order.status },
      data: { status },
    });
    if (result.count !== 1) {
      throw new AppError(409, 'Order changed while updating its status. Please retry.', 'ORDER_CONFLICT');
    }
    return tx.order.findUniqueOrThrow({ where: { id } });
  });
}

export async function cancelOrder(user: { id: number; role: string }, id: number) {
  return prisma.$transaction(async (tx) => {
    const order = await findAuthorizedOrder(tx, user, id);

    if (user.role !== 'CUSTOMER' && user.role !== 'ADMIN') {
      throw new AppError(403, 'Only the customer or admin can cancel an order', 'FORBIDDEN');
    }
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new AppError(400, 'Order cannot be cancelled in its current status', 'CANCELLATION_NOT_ALLOWED');
    }

    const updated = await tx.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    for (const item of order.items) {
      await tx.inventory.update({
        where: { productId: item.productId },
        data: {
          availableQuantity: { increment: item.quantity },
          reservedQuantity: { decrement: item.quantity },
        },
      });
    }

    return updated;
  });
}