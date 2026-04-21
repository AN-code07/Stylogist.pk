import * as OrderService from "./order.service.js";

export const createOrder = async (req, res) => {
  // `req.user` is set for authenticated customers; undefined for guest checkout.
  const userId = req.user?.id || null;
  const order = await OrderService.createOrder(userId, req.validated.body);
  res.status(201).json({ status: "success", message: "Order placed", data: order });
};

export const listMyOrders = async (req, res) => {
  const { items, pagination, summary } = await OrderService.listMyOrders(req.user.id, req.query);
  res.status(200).json({
    status: "success",
    results: items.length,
    pagination,
    summary,
    data: items,
  });
};

export const getMyOrder = async (req, res) => {
  const order = await OrderService.getMyOrder(req.user.id, req.params.id);
  res.status(200).json({ status: "success", data: order });
};
