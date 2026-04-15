import dbModel from "../models/db-model.js";
import { getCartStats } from "./cart.js";
import { verifyPaymentIntent } from "./payments.js";
import { storeCustomerData } from "./customer.js";

export const placeNewOrder = async (req) => {
  if (!req || !req.body) return { success: false, message: "No input parameters" };
  if (!req.session.cart || !req.session.cart.length) return { success: false, message: "Cart is empty" };

  const { paymentIntentId, firstName, lastName, email, phone, address, city, state, zip } = req.body;

  const cartStats = await getCartStats(req);
  if (!cartStats || !cartStats.success) return { success: false, message: "Failed to get cart data" };

  const subtotal = Math.round(cartStats.total * 100) / 100;
  const taxRate = parseFloat(process.env.TAX_RATE) || 0;
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const shippingCost = 0;
  const totalCost = Math.round((subtotal + tax + shippingCost) * 100) / 100;
  const totalInCents = Math.round(totalCost * 100);

  try {
    const paymentData = await verifyPaymentIntent(paymentIntentId, totalInCents);
    if (!paymentData || !paymentData.success) {
      return { success: false, message: paymentData?.message || "Payment verification failed" };
    }

    const intent = paymentData.intent;

    const orderObj = {
      firstName, lastName, email, phone, address, city, state, zip,
      items: req.session.cart,
      itemCount: cartStats.itemCount,
      subtotal, tax, shippingCost, totalCost,
      amountPaid: totalCost,
      paymentId: intent.id,
      paymentStatus: intent.status,
      orderDate: new Date().toISOString(),
    };

    const orderData = await storeOrderData(orderObj);
    if (!orderData || !orderData.orderId) return { success: false, message: "Failed to store order data" };

    await storeCustomerData(orderData);

    req.session.cart = [];

    return {
      success: true,
      message: "Order placed successfully",
      data: {
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        orderDate: orderData.orderDate,
        paymentStatus: orderData.paymentStatus,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        shippingCost: orderData.shippingCost,
        totalCost: orderData.totalCost,
        firstName, lastName, email, phone, address, city, state, zip,
        cartData: orderData.items,
      },
    };
  } catch (e) {
    console.error("ORDER ERROR:", e);
    return { success: false, message: "Failed to place order" };
  }
};

export const storeOrderData = async (orderObj) => {
  if (!orderObj) return null;

  const orderNumber = await getOrderNumber();
  if (!orderNumber) return null;

  orderObj.orderNumber = orderNumber;

  const orderModel = new dbModel(orderObj, process.env.ORDERS_COLLECTION);
  const result = await orderModel.storeAny();
  if (!result || !result.insertedId) return null;

  orderObj.orderId = result.insertedId.toString();
  return orderObj;
};

export const getOrderNumber = async () => {
  const dataModel = new dbModel({ keyToLookup: "orderNumber" }, process.env.ORDERS_COLLECTION);
  const maxId = await dataModel.getMaxId();
  if (!maxId) return 1001;
  return maxId + 1;
};
