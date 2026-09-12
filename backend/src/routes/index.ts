import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import * as p from '../controllers/product.controller';
import * as o from '../controllers/order.controller';
import * as r from '../controllers/report.controller';
import * as c from '../controllers/category.controller';
import * as u from '../controllers/user.controller';
import * as inv from '../controllers/inventory.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client';
import { validate } from '../middlewares/validate';
import { registerSchema, loginSchema } from '../validators/auth';
import { productCreate, productUpdate, productList, topSellingQuery, idParam } from '../validators/product';
import { createOrder, orderList, idParam as orderId, statusUpdate, salesReport } from '../validators/order';
import { categoryCreate, categoryUpdate, categoryId } from '../validators/category';
import { updateInventory } from '../validators/inventory';
import { updateProfile } from '../validators/user';
import * as v from '../controllers/vendor.controller';

export const router = Router();

// Authentication
router.post('/auth/register', validate(registerSchema), register);
router.post('/auth/login', validate(loginSchema), login);

// Users
router.get('/users/me', authenticate, u.profile);
router.patch('/users/me', authenticate, validate(updateProfile), u.update);

// Categories
router.get('/categories', c.list);
router.post('/categories', authenticate, authorize(Role.ADMIN), validate(categoryCreate), c.create);
router.patch('/categories/:id', authenticate, authorize(Role.ADMIN), validate(categoryUpdate), c.update);
router.delete('/categories/:id', authenticate, authorize(Role.ADMIN), validate(categoryId), c.remove);

// Vendors
router.get('/vendors', authenticate, authorize(Role.ADMIN), v.list);

// Products
router.get('/products', validate(productList), p.list);
router.get('/products/top-selling', validate(topSellingQuery), p.topSelling);
router.get('/products/:id', validate(idParam), p.details);
router.post('/products', authenticate, authorize(Role.ADMIN, Role.VENDOR), validate(productCreate), p.create);
router.patch('/products/:id', authenticate, authorize(Role.ADMIN, Role.VENDOR), validate(productUpdate), p.update);
router.patch('/products/:id/inventory', authenticate, authorize(Role.ADMIN, Role.VENDOR), validate(updateInventory), inv.update);
router.delete('/products/:id', authenticate, authorize(Role.ADMIN, Role.VENDOR), validate(idParam), p.remove);

// Orders
router.post('/orders', authenticate, authorize(Role.CUSTOMER), validate(createOrder), o.create);
router.get('/orders', authenticate, validate(orderList), o.list);
router.get('/orders/:id', authenticate, validate(orderId), o.details);
router.patch('/orders/:id/status', authenticate, authorize(Role.ADMIN, Role.VENDOR), validate(statusUpdate), o.status);
router.post('/orders/:id/cancel', authenticate, authorize(Role.ADMIN, Role.CUSTOMER), validate(orderId), o.cancel);

// Reports
router.get('/reports/sales', authenticate, authorize(Role.ADMIN, Role.VENDOR), validate(salesReport), r.sales);
router.get('/vendors/me/dashboard', authenticate, authorize(Role.VENDOR), r.vendor);
router.get('/admin/dashboard', authenticate, authorize(Role.ADMIN), r.admin);
