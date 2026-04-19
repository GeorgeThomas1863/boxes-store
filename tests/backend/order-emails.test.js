import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/mailer.js", () => ({
  sendMail: vi.fn().mockResolvedValue({ messageId: "mock-id" }),
}));

import { sendMail } from "../../src/mailer.js";
import { sendOrderConfirmationEmails } from "../../src/orders.js";

const mockOrder = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  phone: "555-1234",
  address: "123 Main St",
  city: "Portland",
  state: "OR",
  zip: "97201",
  items: [
    { name: "Red Box", price: 25.0, quantity: 2, productId: "p1", itemId: "rb-001" },
  ],
  itemCount: 2,
  subtotal: 50.0,
  // tax: 4.5, // TAX DISABLED
  tax: 0,
  shippingCost: 0,
  totalCost: 54.5,
  amountPaid: 54.5,
  paymentId: "pi_stripe_test_123",
  paymentStatus: "succeeded",
  orderDate: "2026-04-15T12:00:00.000Z",
  orderNumber: 1001,
  orderId: "abc123",
};

const mockOrderWithSpins = {
  ...mockOrder,
  items: [
    { name: "Red Box", price: 25.0, quantity: 1, productId: "p1", itemId: "rb-001", extraSpins: 3, spinCost: 30 },
    { name: "Blue Box", price: 20.0, quantity: 1, productId: "p2", itemId: "bb-001", extraSpins: 0, spinCost: 0 },
  ],
  subtotal: 75.0,
  totalCost: 75.0,
  amountPaid: 75.0,
};

describe("sendOrderConfirmationEmails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.EMAIL_USER = "store@example.com";
    process.env.EMAIL_RECIPIENT_1 = "admin@example.com";
    process.env.EMAIL_RECIPIENT_2 = "";
  });

  it("returns { buyerSent: false, adminSent: false } for null orderData without calling sendMail", async () => {
    const result = await sendOrderConfirmationEmails(null);
    expect(result).toEqual({ buyerSent: false, adminSent: false });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("sends buyer email to customer address with company name in subject", async () => {
    await sendOrderConfirmationEmails(mockOrder);

    const buyerCall = sendMail.mock.calls.find((c) => c[0].to === "jane@example.com");
    expect(buyerCall).toBeDefined();
    expect(buyerCall[0].subject).toBe("Order Confirmation - PRN & Pretty Things Co.");
    expect(buyerCall[0].from).toBe("store@example.com");
  });

  it("sends admin email to EMAIL_RECIPIENT_1 with customer name in subject", async () => {
    await sendOrderConfirmationEmails(mockOrder);

    const adminCall = sendMail.mock.calls.find((c) => c[0].to?.includes("admin@example.com"));
    expect(adminCall).toBeDefined();
    expect(adminCall[0].subject).toContain("Jane");
    expect(adminCall[0].subject).toContain("Doe");
    expect(adminCall[0].subject).toContain("1001");
  });

  it("returns { buyerSent: true, adminSent: true } on success", async () => {
    const result = await sendOrderConfirmationEmails(mockOrder);
    expect(result).toEqual({ buyerSent: true, adminSent: true });
  });

  it("sets buyerSent false but still sends admin email if buyer send throws", async () => {
    sendMail
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce({ messageId: "ok" });

    const result = await sendOrderConfirmationEmails(mockOrder);
    expect(result.buyerSent).toBe(false);
    expect(result.adminSent).toBe(true);
  });

  it("sets adminSent false but still marks buyerSent true if admin send throws", async () => {
    sendMail
      .mockResolvedValueOnce({ messageId: "ok" })
      .mockRejectedValueOnce(new Error("network error"));

    const result = await sendOrderConfirmationEmails(mockOrder);
    expect(result.buyerSent).toBe(true);
    expect(result.adminSent).toBe(false);
  });

  it("returns adminSent false when both admin recipient env vars are unset", async () => {
    delete process.env.EMAIL_RECIPIENT_1;
    delete process.env.EMAIL_RECIPIENT_2;
    sendMail
      .mockResolvedValueOnce({ messageId: "ok" })
      .mockRejectedValueOnce(new Error("sendMail: at least one of 'to' or 'bcc' is required"));

    const result = await sendOrderConfirmationEmails(mockOrder);
    expect(result.buyerSent).toBe(true);
    expect(result.adminSent).toBe(false);
  });
});

describe("email HTML content (via sendOrderConfirmationEmails)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.EMAIL_USER = "store@example.com";
    process.env.EMAIL_RECIPIENT_1 = "admin@example.com";
    process.env.EMAIL_RECIPIENT_2 = "";
  });

  const getBuyerHtml = async (order = mockOrder) => {
    await sendOrderConfirmationEmails(order);
    const buyerCall = sendMail.mock.calls.find((c) => c[0].to === order.email);
    return buyerCall[0].html;
  };

  const getAdminHtml = async (order = mockOrder) => {
    await sendOrderConfirmationEmails(order);
    const adminCall = sendMail.mock.calls.find((c) => c[0].to?.includes("admin@example.com"));
    return adminCall[0].html;
  };

  it("buyer html contains customer name but NOT order number", async () => {
    const html = await getBuyerHtml();
    expect(html).not.toContain("1001");
    expect(html).toContain("Jane");
    expect(html).toContain("Doe");
  });

  it("buyer html contains item name, quantity, and line total", async () => {
    const html = await getBuyerHtml();
    expect(html).toContain("Red Box");
    expect(html).toContain(">2<");
    expect(html).toContain("50.00");
  });

  it("buyer html contains subtotal and total", async () => { // TAX DISABLED: removed tax assertion
    const html = await getBuyerHtml();
    expect(html).toContain("50.00");
    // expect(html).toContain("4.50"); // TAX DISABLED
    expect(html).toContain("54.50");
  });

  it("buyer html contains shipping address", async () => {
    const html = await getBuyerHtml();
    expect(html).toContain("123 Main St");
    expect(html).toContain("Portland");
    expect(html).toContain("OR");
    expect(html).toContain("97201");
  });

  it("admin html contains Stripe paymentId", async () => {
    const html = await getAdminHtml();
    expect(html).toContain("pi_stripe_test_123");
  });

  it("admin html contains itemId column", async () => {
    const html = await getAdminHtml();
    expect(html).toContain("rb-001");
  });

  it("buyer html does NOT contain Stripe paymentId", async () => {
    const html = await getBuyerHtml();
    expect(html).not.toContain("pi_stripe_test_123");
  });

  it("escapes HTML special characters in user-supplied data", async () => {
    const xssOrder = { ...mockOrder, firstName: "<script>alert(1)</script>" };
    const html = await getBuyerHtml(xssOrder);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes HTML special characters in item quantity", async () => {
    const xssOrder = {
      ...mockOrder,
      items: [{ ...mockOrder.items[0], quantity: '"><img src=x>' }],
    };
    const html = await getBuyerHtml(xssOrder);
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("handles missing items array without throwing and still sends emails", async () => {
    const result = await sendOrderConfirmationEmails({ ...mockOrder, items: undefined });
    expect(result.buyerSent).toBe(true);
    expect(result.adminSent).toBe(true);
  });
});

describe("extra spins in email HTML", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.EMAIL_USER = "store@example.com";
    process.env.EMAIL_RECIPIENT_1 = "admin@example.com";
    process.env.EMAIL_RECIPIENT_2 = "";
  });

  const getSpinBuyerHtml = async () => {
    await sendOrderConfirmationEmails(mockOrderWithSpins);
    const buyerCall = sendMail.mock.calls.find((c) => c[0].to === mockOrderWithSpins.email);
    return buyerCall[0].html;
  };

  const getSpinAdminHtml = async () => {
    await sendOrderConfirmationEmails(mockOrderWithSpins);
    const adminCall = sendMail.mock.calls.find((c) => c[0].to?.includes("admin@example.com"));
    return adminCall[0].html;
  };

  it("buyer html shows extra spins note for item with extraSpins > 0", async () => {
    const html = await getSpinBuyerHtml();
    expect(html).toContain("3 Extra Spins");
  });

  it("buyer html does NOT show extra spins note for item with extraSpins = 0", async () => {
    const html = await getSpinBuyerHtml();
    const blueBoxIdx = html.indexOf("Blue Box");
    const afterBlueBox = html.slice(blueBoxIdx);
    expect(afterBlueBox.slice(0, 200)).not.toContain("Extra Spins");
  });

  it("buyer html includes Extra Spins summary line when spinTotal > 0", async () => {
    const html = await getSpinBuyerHtml();
    expect(html).toContain("Extra Spins");
    expect(html).toContain("+$30.00");
  });

  it("buyer html line total for spin item includes spinCost", async () => {
    const html = await getSpinBuyerHtml();
    expect(html).toContain("55.00");
  });

  it("admin html shows extra spins note for item with extraSpins > 0", async () => {
    const html = await getSpinAdminHtml();
    expect(html).toContain("3 Extra Spins");
  });

  it("admin html includes Extra Spins summary line when spinTotal > 0", async () => {
    const html = await getSpinAdminHtml();
    expect(html).toContain("+$30.00");
  });

  it("order with no extra spins shows no Extra Spins line in buyer html", async () => {
    await sendOrderConfirmationEmails(mockOrder);
    const buyerCall = sendMail.mock.calls.find((c) => c[0].to === mockOrder.email);
    const html = buyerCall[0].html;
    expect(html).not.toContain("Extra Spins");
  });
});
