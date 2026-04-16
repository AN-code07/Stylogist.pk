import {
  adminLoginService,
  createAdminService,
  sendToken,
} from './admin.services.js';
import * as StatsService from './admin.stats.service.js';
import * as CustomersService from './admin.customers.service.js';
import * as OrdersService from './admin.orders.service.js';

// ---------------------------
// Admin login
// ---------------------------
export const adminLogin = async (req, res) => {
  const user = await adminLoginService(req.body);
  const userData = sendToken(user, res);
  res.status(200).json({ status: 'success', message: 'Logged in successfully', data: userData });
};

// ---------------------------
// Admin logout
// ---------------------------
export const adminLogout = async (_req, res) => {
  res.cookie('jwt', 'loggedout', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    expires: new Date(Date.now() + 10 * 1000),
  });
  res.status(200).json({ status: 'success', message: 'Logged out successfully' });
};

// ---------------------------
// Super Admin creates Staff/Admin
// ---------------------------
export const createAdmin = async (req, res) => {
  const newAdmin = await createAdminService(req.body);
  res.status(201).json({
    status: 'success',
    message: `${newAdmin.role} created successfully`,
    data: {
      id: newAdmin._id,
      name: newAdmin.name,
      phone: newAdmin.phone,
      email: newAdmin.email,
      role: newAdmin.role,
    },
  });
};

// ---------------------------
// Stats
// ---------------------------
export const getOverview = async (_req, res) => {
  const data = await StatsService.getOverviewStats();
  res.status(200).json({ status: 'success', data });
};

export const getAnalytics = async (req, res) => {
  const data = await StatsService.getAnalyticsStats(req.query.timeframe);
  res.status(200).json({ status: 'success', data });
};

// ---------------------------
// Customers
// ---------------------------
export const listCustomers = async (req, res) => {
  const { items, pagination } = await CustomersService.listCustomers(req.query);
  res.status(200).json({ status: 'success', results: items.length, pagination, data: items });
};

export const getCustomer = async (req, res) => {
  const data = await CustomersService.getCustomerProfile(req.params.id);
  res.status(200).json({ status: 'success', data });
};

export const blockCustomer = async (req, res) => {
  const user = await CustomersService.setCustomerBlocked(req.params.id, true);
  res.status(200).json({ status: 'success', message: 'Customer blocked', data: user });
};

export const unblockCustomer = async (req, res) => {
  const user = await CustomersService.setCustomerBlocked(req.params.id, false);
  res.status(200).json({ status: 'success', message: 'Customer unblocked', data: user });
};

// ---------------------------
// Orders
// ---------------------------
export const listOrders = async (req, res) => {
  const { items, pagination } = await OrdersService.listOrders(req.query);
  res.status(200).json({ status: 'success', results: items.length, pagination, data: items });
};

export const getOrder = async (req, res) => {
  const order = await OrdersService.getOrderById(req.params.id);
  res.status(200).json({ status: 'success', data: order });
};

export const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const order = await OrdersService.updateOrderStatus(req.params.id, status);
  res.status(200).json({ status: 'success', message: 'Order status updated', data: order });
};
