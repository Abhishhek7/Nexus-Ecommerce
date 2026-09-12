import {
  PrismaClient, Role, ProductStatus, DiscountType, CouponStatus,
  PaymentMethod, PaymentStatus, OrderStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.orderCoupon.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.coupon.deleteMany();

  const passwordHash = await bcrypt.hash('Password@123', 12);

  const admin = await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@example.com', passwordHash, role: Role.ADMIN },
  });

  const vendors = [];
  for (let i = 1; i <= 2; i++) {
    vendors.push(await prisma.user.create({
      data: {
        name: `Vendor ${i}`,
        email: `vendor${i}@example.com`,
        passwordHash,
        role: Role.VENDOR,
        vendor: { create: { businessName: `Vendor ${i} Store`, phone: `900000000${i}` } },
      },
    }));
  }

  const customers = [];
  for (let i = 1; i <= 5; i++) {
    customers.push(await prisma.user.create({
      data: { name: `Customer ${i}`, email: `customer${i}@example.com`, passwordHash, role: Role.CUSTOMER },
    }));
  }

  const roots = [];
  for (const name of ['Electronics', 'Home', 'Fashion', 'Sports', 'Books']) {
    roots.push(await prisma.category.create({ data: { name } }));
  }

  const categories = [...roots];
  for (let i = 0; i < roots.length; i++) {
    categories.push(await prisma.category.create({
      data: { name: `${roots[i].name} Essentials`, parentId: roots[i].id },
    }));
  }

  for (let i = 1; i <= 30; i++) {
    const user = vendors[(i - 1) % vendors.length];
    const vendor = await prisma.vendor.findUniqueOrThrow({ where: { userId: user.id } });
    await prisma.product.create({
      data: {
        vendorId: vendor.id,
        categoryId: categories[(i - 1) % categories.length].id,
        name: `Demo Product ${i}`,
        sku: `SKU-${String(i).padStart(4, '0')}`,
        description: 'Seeded product for evaluation and reporting.',
        price: 100 + i * 75,
        status: ProductStatus.ACTIVE,
        inventory: { create: { availableQuantity: 25 + (i % 10) } },
      },
    });
  }

  const now = new Date();
  const coupon = await prisma.coupon.create({
    data: {
      code: 'SAVE20',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      minimumOrderValue: 1000,
      maximumDiscount: 500,
      usageLimit: 100,
      startDate: new Date(now.getTime() - 7 * 864e5),
      endDate: new Date(now.getTime() + 30 * 864e5),
      status: CouponStatus.ACTIVE,
    },
  });

  const products = await prisma.product.findMany({ take: 10 });
  for (let i = 1; i <= 20; i++) {
    const product = products[(i - 1) % products.length];
    const customer = customers[(i - 1) % customers.length];
    const subtotal = Number(product.price);
    const useCoupon = i % 4 === 0 && subtotal >= 1000;
    const discount = useCoupon ? Math.min(subtotal * 0.2, 500) : 0;
    const tax = (subtotal - discount) * 0.18;
    const shippingFee = subtotal >= 2000 ? 0 : 100;
    const total = subtotal - discount + tax + shippingFee;
    const createdAt = new Date(now.getTime() - (20 - i) * 7 * 864e5);
    const status = i % 7 === 0 ? OrderStatus.CANCELLED : i % 5 === 0 ? OrderStatus.DELIVERED : OrderStatus.CONFIRMED;

    await prisma.order.create({
      data: {
        orderNumber: `SEED-${String(i).padStart(3, '0')}`,
        customerId: customer.id,
        status,
        subtotal,
        discount,
        tax,
        shippingFee,
        totalAmount: total,
        createdAt,
        items: {
          create: {
            productId: product.id,
            quantity: 1,
            unitPrice: product.price,
            discount: 0,
            totalAmount: product.price,
          },
        },
        payment: {
          create: {
            amount: total,
            paymentMethod: PaymentMethod.CARD,
            status: status === OrderStatus.CANCELLED ? PaymentStatus.REFUNDED : PaymentStatus.SUCCESS,
            transactionId: `SEED-TXN-${String(i).padStart(3, '0')}`,
            paidAt: createdAt,
            createdAt,
          },
        },
        ...(useCoupon ? { coupons: { create: { couponId: coupon.id, discountAmount: discount } } } : {}),
      },
    });
  }

  await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: 5 } });

  console.log(`Seed complete: ${admin.email}`);
}

main()
  .catch((error) => { console.error(error); process.exit(1); })
  .finally(() => prisma.$disconnect());
