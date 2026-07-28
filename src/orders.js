import dbModel from "../models/db-model.js";
import { dbGet } from "../middleware/db-config.js";
import { getCartStats } from "./cart.js";
import { verifyPaymentIntent } from "./payments.js";
import { storeCustomerData } from "./customer.js";
import { sendMail } from "./mailer.js";
import { escapeHtml, sanitizeEmailHeader } from "./sanitize.js";
import { getSelectedShippingCost } from "./shipping.js";

export const placeNewOrder = async (req) => {
  if (!req || !req.body) return { success: false, message: "No input parameters" };
  if (!req.session.cart || !req.session.cart.length) return { success: false, message: "Cart is empty" };

  const { paymentIntentId, firstName, lastName, email, phone, address, city, state, zip,
    nursingSpecialty, productLikes, productDislikes, tiktokHandle } = req.body;

  const cartStats = await getCartStats(req);
  if (!cartStats || !cartStats.success) return { success: false, message: "Failed to get cart data" };

  const shippingCost = getSelectedShippingCost(req);
  if (shippingCost === null) return { success: false, message: "No shipping rate selected" };
  const selectedRate = req.session.shipping.selectedRate;
  const shippingDetails = {
    carrier: selectedRate.carrier_friendly_name,
    service: selectedRate.service_type,
    cost: shippingCost,
    deliveryDays: selectedRate.delivery_days,
    estimatedDelivery: selectedRate.estimated_delivery_date,
    zip: req.session.shipping.zip,
  };
  const subtotal = Math.round(cartStats.total * 100) / 100;
  // const taxRate = parseFloat(process.env.TAX_RATE) || 0; // TAX DISABLED
  // const tax = Math.round(subtotal * taxRate * 100) / 100; // TAX DISABLED
  const tax = 0; // TAX DISABLED
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
      nursingSpecialty, productLikes, productDislikes, tiktokHandle,
      items: req.session.cart,
      itemCount: cartStats.itemCount,
      subtotal, tax, shippingCost, shippingDetails, totalCost,
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
    req.session.shipping = null;

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
        shippingDetails: orderData.shippingDetails,
        totalCost: orderData.totalCost,
        firstName, lastName, email, phone, address, city, state, zip,
        nursingSpecialty, productLikes, productDislikes, tiktokHandle,
        cartData: orderData.items,
      },
    };
  } catch (e) {
    console.error("ORDER ERROR:", e);
    return { success: false, message: "Failed to place order" };
  }
};

// Completes the record opened by storePendingOrder rather than inserting a new
// one, so a paid order is a single document that moved from pending to done.
export const storeOrderData = async (orderObj) => {
  if (!orderObj || !orderObj.paymentId) return null;

  const pendingModel = new dbModel({ keyToLookup: "paymentId", itemValue: orderObj.paymentId }, process.env.ORDERS_COLLECTION);
  const pendingData = await pendingModel.getUniqueItem();
  if (!pendingData) return null;

  const orderNumber = await getOrderNumber();
  if (!orderNumber) return null;

  orderObj.orderNumber = orderNumber;
  orderObj.orderStatus = "completed";

  const updateModel = new dbModel(
    { keyToLookup: "paymentId", itemValue: orderObj.paymentId, updateObj: orderObj },
    process.env.ORDERS_COLLECTION
  );
  const result = await updateModel.updateObjItem();
  if (!result || !result.matchedCount) return null;

  orderObj.orderId = pendingData._id.toString();
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

// The card is charged in the browser before the order request reaches us, so a
// dropped connection would otherwise leave a charge with no trace on our side.
// Opening the order record up front makes those orphans findable and refundable:
// an order still marked pending whose intent succeeded in Stripe is money owed back.
export const storePendingOrder = async (paymentId, amountInCents, cartItems) => {
  if (!paymentId) return null;

  const pendingObj = {
    paymentId,
    amountInCents,
    items: cartItems,
    orderStatus: "pending",
    createdAt: new Date().toISOString(),
  };

  try {
    const pendingModel = new dbModel(pendingObj, process.env.ORDERS_COLLECTION);
    const result = await pendingModel.storeAny();
    if (!result || !result.insertedId) return null;

    return pendingObj;
  } catch (e) {
    console.error("STORE PENDING ORDER ERROR:", e);
    return null;
  }
};

export const updateOrderStatus = async (paymentId, orderStatus) => {
  if (!paymentId || !orderStatus) return null;

  const updateObj = { orderStatus, resolvedAt: new Date().toISOString() };

  try {
    const updateModel = new dbModel(
      { keyToLookup: "paymentId", itemValue: paymentId, updateObj },
      process.env.ORDERS_COLLECTION
    );
    const result = await updateModel.updateObjItem();
    if (!result || !result.matchedCount) return null;

    return updateObj;
  } catch (e) {
    console.error("UPDATE ORDER STATUS ERROR:", e);
    return null;
  }
};

//----------

export const getSoldUnitCount = async () => {
  try {
    const resultArray = await dbGet()
      .collection(process.env.ORDERS_COLLECTION)
      .aggregate([
        { $match: { orderStatus: "completed" } },
        { $group: { _id: null, soldUnits: { $sum: "$itemCount" } } },
      ])
      .toArray();

    return resultArray[0]?.soldUnits ?? 0;
  } catch (e) {
    console.error("GET SOLD UNIT COUNT ERROR:", e);
    return null;
  }
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
      fromName: process.env.EMAIL_FROM_NAME,
      to: email,
      subject: `Order Confirmation - PRN & Pretty Things Co.`,
      html: buyerHtml,
    });
    buyerSent = true;
  } catch (error) {
    console.error("BUYER EMAIL ERROR:", error);
  }

  try {
    await sendMail({
      from: process.env.EMAIL_USER,
      fromName: process.env.EMAIL_FROM_NAME,
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
    nursingSpecialty, productLikes, productDislikes, tiktokHandle,
    items, subtotal, tax, shippingCost, shippingDetails, totalCost,
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
    year: "numeric", month: "long", day: "numeric", timeZone: "America/New_York",
  });

  const isAdmin = type === "admin";

  const prefSpecialty = nursingSpecialty ? escapeHtml(nursingSpecialty) : "<em>Not provided</em>";
  const prefLikes     = productLikes ? escapeHtml(productLikes) : "<em>Not provided</em>";
  const prefDislikes  = productDislikes ? escapeHtml(productDislikes) : "<em>Not provided</em>";
  const prefTiktok    = tiktokHandle ? escapeHtml(tiktokHandle) : "<em>Not provided</em>";

  const preferencesSection = `
    <hr style="margin: 24px 0; border: none; border-top: 1px solid #ccc;">
    <h2>Customer Preferences</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 4px 8px;"><strong>Nursing Specialty:</strong></td><td style="padding: 4px 8px;">${prefSpecialty}</td></tr>
      <tr><td style="padding: 4px 8px;"><strong>Product Likes:</strong></td><td style="padding: 4px 8px;">${prefLikes}</td></tr>
      <tr><td style="padding: 4px 8px;"><strong>Product Dislikes:</strong></td><td style="padding: 4px 8px;">${prefDislikes}</td></tr>
      <tr><td style="padding: 4px 8px;"><strong>TikTok Handle:</strong></td><td style="padding: 4px 8px;">${prefTiktok}</td></tr>
    </table>`;

  const safeItems = Array.isArray(items) ? items : [];
  let itemRows = "";
  for (let i = 0; i < safeItems.length; i++) {
    const item = safeItems[i];
    const lineTotal = escapeHtml(((Number(item.price) + (Number(item.spinCost) || 0)) * Number(item.quantity)).toFixed(2));
    itemRows += `<tr>
      ${isAdmin ? `<td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(item.itemId || "")}</td>` : ""}
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(item.name)}${item.extraSpins > 0 ? `<br><small style="color: #666;">+ ${escapeHtml(String(item.extraSpins))} Extra Spins</small>` : ""}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${escapeHtml(String(item.quantity))}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${lineTotal}</td>
    </tr>`;
  }

  let spinTotal = 0;
  for (let i = 0; i < safeItems.length; i++) {
    spinTotal += (Number(safeItems[i].spinCost) || 0) * Number(safeItems[i].quantity);
  }

  const header = isAdmin
    ? `<h2>New Order — #${safeOrderNumber}</h2>
       <p><strong>Customer:</strong> ${safeFirstName} ${safeLastName} (${safeEmail})</p>`
    : `<h2>Order Confirmation</h2>
       <p>Thank you for your order, ${safeFirstName} ${safeLastName}!</p>`;

  const paymentSection = isAdmin
    ? `<hr style="margin: 24px 0; border: none; border-top: 1px solid #ccc;">
       <h2>Payment Details</h2>
       <table style="width: 100%; border-collapse: collapse;">
         <tr><td style="padding: 4px 8px;"><strong>Payment ID:</strong></td><td style="padding: 4px 8px;">${escapeHtml(paymentId || "")}</td></tr>
         <tr><td style="padding: 4px 8px;"><strong>Status:</strong></td><td style="padding: 4px 8px;">${escapeHtml(paymentStatus || "")}</td></tr>
         <tr><td style="padding: 4px 8px;"><strong>Amount Paid:</strong></td><td style="padding: 4px 8px;">$${escapeHtml(Number(amountPaid).toFixed(2))}</td></tr>
       </table>`
    : "";

  const shippingService = shippingDetails
    ? ` (${escapeHtml(String(shippingDetails.carrier || ""))} &mdash; ${escapeHtml(String(shippingDetails.service || ""))})`
    : "";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      ${header}
      <p><strong>Date:</strong> ${escapeHtml(formattedDate)}</p>

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
        <p><strong>Subtotal:</strong> $${escapeHtml(Number(subtotal).toFixed(2))}</p>
        <!-- <p><strong>Tax:</strong> $${escapeHtml(Number(tax).toFixed(2))}</p> --> <!-- TAX DISABLED -->
        ${spinTotal > 0 ? `<p><strong>Extra Spins:</strong> +$${escapeHtml(spinTotal.toFixed(2))}</p>` : ""}
        <p><strong>Shipping:</strong> $${escapeHtml(Number(shippingCost).toFixed(2))}${shippingService}</p>
        <p style="font-size: 18px;"><strong>Total:</strong> $${escapeHtml(Number(totalCost).toFixed(2))}</p>
      </div>

      <h2>Shipping Address</h2>
      <p>${safeFirstName} ${safeLastName}<br>${safeAddress}<br>${safeCity}, ${safeState} ${safeZip}</p>

      ${preferencesSection}

      ${paymentSection}
    </div>
  `;
};
