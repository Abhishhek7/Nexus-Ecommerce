import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { PrismaClient, Role, ProductStatus } from '@prisma/client';

const hasDb = Boolean(process.env.DATABASE_URL);
const suite = hasDb ? describe : describe.skip;

suite('API integration', () => {
  let app: any;
  const prisma = new PrismaClient();
  const suffix = Date.now();
  let customer1Token = '';
  let customer2Token = '';
  let adminToken = '';
  let productId = 0;
  let crudProductId = 0;
  let testCategoryId = 0;
  let testVendorId = 0;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-test-secret-12345';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.CORS_ORIGIN = 'http://localhost:5173';
    const imported = await import('../src/app');
    app = imported.app;

    const hash = await bcrypt.hash('Password@123', 4);
    const vendorUser = await prisma.user.create({
      data: { name: `Test Vendor ${suffix}`, email: `vendor-${suffix}@test.local`, passwordHash: hash, role: Role.VENDOR },
    });
    const vendor = await prisma.vendor.create({
      data: { userId: vendorUser.id, businessName: `Test Vendor ${suffix}` },
    });
    testVendorId = vendor.id;
    const category = await prisma.category.create({ data: { name: `Test Category ${suffix}` } });
    testCategoryId = category.id;
    const customers = await Promise.all([1, 2].map((n) => prisma.user.create({
      data: { name: `Test Customer ${n}`, email: `customer-${suffix}-${n}@test.local`, passwordHash: hash, role: Role.CUSTOMER },
    })));

    const adminHash = await bcrypt.hash('Password@123', 4);
    await prisma.user.upsert({
      where: { email: `admin-${suffix}@test.local` },
      update: {},
      create: { name: `Test Admin ${suffix}`, email: `admin-${suffix}@test.local`, passwordHash: adminHash, role: Role.ADMIN },
    });
    const adminResponse = await request(app).post('/api/v1/auth/login').send({ email: `admin-${suffix}@test.local`, password: 'Password@123' });
    adminToken = adminResponse.body.data.accessToken;

    const product = await prisma.product.create({
      data: {
        vendorId: vendor.id, categoryId: category.id, name: `Concurrency Product ${suffix}`,
        sku: `CON-${suffix}`, description: 'integration test', price: 100, status: ProductStatus.ACTIVE,
        inventory: { create: { availableQuantity: 5 } },
      },
    });
    productId = product.id;

    for (const [index, customer] of customers.entries()) {
      const response = await request(app).post('/api/v1/auth/login')
        .send({ email: customer.email, password: 'Password@123' });
      if (index === 0) customer1Token = response.body.data.accessToken;
      else customer2Token = response.body.data.accessToken;
    }
  });

  afterAll(async () => {
    await prisma.orderCoupon.deleteMany({ where: { order: { items: { some: { productId } } } } }).catch(() => undefined);
    await prisma.payment.deleteMany({ where: { order: { items: { some: { productId } } } } }).catch(() => undefined);
    await prisma.orderItem.deleteMany({ where: { productId } }).catch(() => undefined);
    await prisma.order.deleteMany({ where: { customer: { email: { contains: `customer-${suffix}-` } } } }).catch(() => undefined);
    await prisma.inventory.deleteMany({ where: { productId: { in: [productId, crudProductId] } } }).catch(() => undefined);
    await prisma.product.deleteMany({ where: { id: { in: [productId, crudProductId] } } }).catch(() => undefined);
    await prisma.category.deleteMany({ where: { name: `Test Category ${suffix}` } }).catch(() => undefined);
    await prisma.vendor.deleteMany({ where: { businessName: `Test Vendor ${suffix}` } }).catch(() => undefined);
    await prisma.user.deleteMany({ where: { email: { contains: `-${suffix}@test.local` } } }).catch(() => undefined);
    await prisma.$disconnect();
  });

  it('returns health status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('up');
  });

  it('rejects invalid credentials', async () => {
    const response = await request(app).post('/api/v1/auth/login')
      .send({ email: `customer-${suffix}-1@test.local`, password: 'wrong' });
    expect(response.status).toBe(401);
    expect(response.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects unauthenticated protected requests', async () => {
    const response = await request(app).get('/api/v1/orders');
    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('supports paginated product listing', async () => {
    const response = await request(app).get('/api/v1/products?page=1&limit=5&inStock=true');
    expect(response.status).toBe(200);
    expect(response.body.data.pagination.limit).toBe(5);
    expect(response.body.data.data.length).toBeLessThanOrEqual(5);
  });

  it('enforces product authorization and supports admin CRUD', async () => {
    const forbidden = await request(app).post('/api/v1/products')
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ vendorId: 1, categoryId: 1, name: 'Forbidden Product', sku: `FORBID-${suffix}`, price: 10 });
    expect(forbidden.status).toBe(403);

    const vendor = await prisma.vendor.findUniqueOrThrow({ where: { id: testVendorId } });
    const created = await request(app).post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ vendorId: vendor.id, categoryId: testCategoryId, name: `CRUD Product ${suffix}`, sku: `CRUD-${suffix}`, price: 50, initialQuantity: 10 });
    expect(created.status).toBe(201);
    crudProductId = created.body.data.id;

    const updated = await request(app).patch(`/api/v1/products/${crudProductId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 75 });
    expect(updated.status).toBe(200);
    expect(Number(updated.body.data.price)).toBe(75);

    const removed = await request(app).delete(`/api/v1/products/${crudProductId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(removed.status).toBe(200);

    const deactivated = await prisma.product.findUniqueOrThrow({ where: { id: crudProductId } });
    expect(deactivated.status).toBe('INACTIVE');
  });

  it('prevents overselling under concurrent orders', async () => {
    const makeOrder = (token: string, quantity: number) => request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId, quantity }], paymentMethod: 'CARD' });

    const [a, b] = await Promise.all([makeOrder(customer1Token, 4), makeOrder(customer2Token, 3)]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);

    const inventory = await prisma.inventory.findUniqueOrThrow({ where: { productId } });
    expect(inventory.availableQuantity).toBe(1);
  });
});
