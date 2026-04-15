import stripe from "../middleware/stripe-config.js";

export const createPaymentIntent = async (totalInCents) => {
  if (!totalInCents || typeof totalInCents !== "number" || totalInCents <= 0) {
    return { success: false, message: "Invalid amount" };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalInCents,
      currency: "usd",
      payment_method_types: ["card"],
    });

    if (!paymentIntent || !paymentIntent.client_secret) {
      return { success: false, message: "Failed to create PaymentIntent" };
    }

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (e) {
    console.error("STRIPE CREATE ERROR:", e);
    return { success: false, message: "Failed to create payment intent" };
  }
};

export const verifyPaymentIntent = async (paymentIntentId, expectedAmountInCents) => {
  if (!paymentIntentId || typeof paymentIntentId !== "string") {
    return { success: false, message: "Invalid PaymentIntent ID" };
  }

  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!intent) {
      return { success: false, message: "PaymentIntent not found" };
    }

    if (intent.status !== "succeeded") {
      return { success: false, message: `Payment not completed — status: ${intent.status}` };
    }

    if (intent.amount !== expectedAmountInCents) {
      return { success: false, message: "Payment amount mismatch — possible tampering detected" };
    }

    return { success: true, intent };
  } catch (e) {
    console.error("STRIPE RETRIEVE ERROR:", e);
    return { success: false, message: "Failed to retrieve payment intent" };
  }
};

export const refundPayment = async (paymentIntentId) => {
  if (!paymentIntentId || typeof paymentIntentId !== "string") {
    return { success: false, message: "Invalid PaymentIntent ID" };
  }
  try {
    const refund = await stripe.refunds.create({ payment_intent: paymentIntentId });
    if (!refund || !refund.id) {
      return { success: false, message: "Refund failed" };
    }
    return { success: true, refundId: refund.id };
  } catch (e) {
    console.error("STRIPE REFUND ERROR:", e);
    return { success: false, message: "Refund request failed" };
  }
};
