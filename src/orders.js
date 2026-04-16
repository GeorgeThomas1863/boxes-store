import dbModel from "../models/db-model.js";
import { dbGet } from "../middleware/db-config.js";
import { getCartStats } from "./cart.js";
import { verifyPaymentIntent } from "./payments.js";
import { storeCustomerData } from "./customer.js";
import { sendMail } from "./mailer.js";
import { escapeHtml, sanitizeEmailHeader } from "./sanitize.js";

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

    try {
      const emailResult = await sendOrderConfirmationEmails(orderData);
      if (!emailResult.buyerSent || !emailResult.adminSent) {
        console.error("EMAIL ISSUE — buyer:", emailResult.buyerSent, "admin:", emailResult.adminSent);
      }
    } catch (e) {
      console.error("EMAIL SEND UNEXPECTED ERROR:", e);
    }

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
  const result = await dbGet().collection("counters").findOneAndUpdate(
    { _id: "orderNumber" },
    [{ $set: { seq: { $ifNull: [{ $add: ["$seq", 1] }, 1001] } } }],
    { upsert: true, returnDocument: "after" }
  );
  return result?.seq || null;
};

//----------

export const sendOrderConfirmationEmails = async (orderData) => {
  if (!orderData) return { buyerSent: false, adminSent: false };

  const { email, firstName, lastName, orderNumber } = orderData;
  const safeOrderNumber = escapeHtml(String(orderNumber));

  let buyerSent = false;
  let adminSent = false;

  const buyerHtml = buildEmailHtml(orderData, "buyer");
  const adminHtml = buildEmailHtml(orderData, "admin");

  try {
    await sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Order Confirmation — #${safeOrderNumber}`,
      html: buyerHtml,
    });
    buyerSent = true;
  } catch (error) {
    console.error("BUYER EMAIL ERROR:", error);
  }

  try {
    await sendMail({
      from: process.env.EMAIL_USER,
      to: [process.env.EMAIL_RECIPIENT_1, process.env.EMAIL_RECIPIENT_2].filter(Boolean).join(", "),
      subject: `New Order — #${safeOrderNumber} from ${sanitizeEmailHeader(firstName)} ${sanitizeEmailHeader(lastName)}`,
      html: adminHtml,
    });
    adminSent = true;
  } catch (error) {
    console.error("ADMIN EMAIL ERROR:", error);
  }

  return { buyerSent, adminSent };
};

//----------

const buildEmailHtml = (orderData, type) => {
  const {
    firstName, lastName, email,
    address, city, state, zip,
    items, subtotal, tax, totalCost,
    amountPaid, paymentId, paymentStatus,
    orderDate, orderNumber,
  } = orderData;

  const safeOrderNumber = escapeHtml(String(orderNumber));
  const safeFirstName = escapeHtml(firstName);
  const safeLastName  = escapeHtml(lastName);
  const safeEmail     = escapeHtml(email);
  const safeAddress   = escapeHtml(address);
  const safeCity      = escapeHtml(city);
  const safeState     = escapeHtml(state);
  const safeZip       = escapeHtml(zip);

  const formattedDate = new Date(orderDate).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const isAdmin = type === "admin";

  let itemRows = "";
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const lineTotal = (Number(item.price) * Number(item.quantity)).toFixed(2);
    itemRows += `<tr>
      ${isAdmin ? `<td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(item.itemId || "")}</td>` : ""}
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(item.name)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${escapeHtml(String(item.quantity))}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${lineTotal}</td>
    </tr>`;
  }

  const header = isAdmin
    ? `<h2>New Order — #${safeOrderNumber}</h2>
       <p><strong>Customer:</strong> ${safeFirstName} ${safeLastName} (${safeEmail})</p>`
    : `<h2>Order Confirmation — #${safeOrderNumber}</h2>
       <p>Thank you for your order, ${safeFirstName} ${safeLastName}!</p>`;

  const paymentSection = isAdmin
    ? `<hr style="margin: 24px 0; border: none; border-top: 1px solid #ccc;">
       <h2>Payment Details</h2>
       <table style="width: 100%; border-collapse: collapse;">
         <tr><td style="padding: 4px 8px;"><strong>Payment ID:</strong></td><td style="padding: 4px 8px;">${escapeHtml(paymentId || "")}</td></tr>
         <tr><td style="padding: 4px 8px;"><strong>Status:</strong></td><td style="padding: 4px 8px;">${escapeHtml(paymentStatus || "")}</td></tr>
         <tr><td style="padding: 4px 8px;"><strong>Amount Paid:</strong></td><td style="padding: 4px 8px;">$${Number(amountPaid).toFixed(2)}</td></tr>
       </table>`
    : "";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      ${header}
      <p><strong>Date:</strong> ${formattedDate}</p>

      <h2>Items</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f5f5f5;">
            ${isAdmin ? `<th style="padding: 8px; text-align: left;">Item ID</th>` : ""}
            <th style="padding: 8px; text-align: left;">Item</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div style="margin-top: 16px; text-align: right;">
        <p><strong>Subtotal:</strong> $${Number(subtotal).toFixed(2)}</p>
        <p><strong>Tax:</strong> $${Number(tax).toFixed(2)}</p>
        <p style="font-size: 18px;"><strong>Total:</strong> $${Number(totalCost).toFixed(2)}</p>
      </div>

      <h2>Shipping Address</h2>
      <p>${safeFirstName} ${safeLastName}<br>${safeAddress}<br>${safeCity}, ${safeState} ${safeZip}</p>

      ${paymentSection}
    </div>
  `;
};
