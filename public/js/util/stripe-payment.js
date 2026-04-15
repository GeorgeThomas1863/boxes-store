let stripe = null;
let cardElement = null;

export const initStripePayment = async (publishableKey) => {
  if (!publishableKey) {
    console.error("No Stripe publishable key provided");
    return null;
  }

  stripe = Stripe(publishableKey);
  const elements = stripe.elements();

  const cardStyle = {
    base: {
      fontFamily: "Georgia, serif",
      fontSize: "16px",
      color: "#000000",
      "::placeholder": { color: "#aab7c4" },
    },
    invalid: { color: "#dc2626", iconColor: "#dc2626" },
  };

  cardElement = elements.create("card", { style: cardStyle });

  const cardContainer = document.getElementById("card-container");
  if (!cardContainer) {
    console.error("Card container element not found");
    return null;
  }

  cardElement.mount(cardContainer);

  cardElement.on("change", (event) => {
    const errorContainer = document.getElementById("payment-error");
    if (!errorContainer) return;
    if (event.error) {
      errorContainer.textContent = event.error.message;
      errorContainer.style.display = "block";
    } else {
      errorContainer.textContent = "";
      errorContainer.style.display = "none";
    }
  });

  return cardElement;
};

export const confirmStripePayment = async (clientSecret, billingDetails) => {
  if (!stripe || !cardElement) {
    return { success: false, message: "Stripe not initialized" };
  }

  const result = await stripe.confirmCardPayment(clientSecret, {
    payment_method: { card: cardElement, billing_details: billingDetails },
  });

  if (result.error) return { success: false, message: result.error.message };

  if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
    return { success: true, paymentIntentId: result.paymentIntent.id };
  }

  return { success: false, message: "Payment did not complete" };
};
