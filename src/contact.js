import { sendMail } from "./mailer.js";
import dbModel from "../models/db-model.js";
import { escapeHtml, sanitizeEmailHeader, validateEmail, validateString } from "./sanitize.js";

export const submitContact = async (inputParams) => {
  if (!inputParams) return { success: false, message: "No input parameters" };

  const { name, email, subject, message } = inputParams;

  const cleanName = validateString(name, 100);
  if (!cleanName) return { success: false, message: "Invalid name" };

  const cleanEmail = validateEmail(email);
  if (!cleanEmail) return { success: false, message: "Invalid email address" };

  const cleanMessage = validateString(message, 5000);
  if (!cleanMessage) return { success: false, message: "Invalid message" };

  const cleanSubject = validateString(subject, 200) ?? "";

  const safeName = escapeHtml(cleanName);
  const safeEmail = escapeHtml(cleanEmail);
  const safeSubject = escapeHtml(cleanSubject);
  const safeMessage = escapeHtml(cleanMessage).replace(/\n/g, "<br>");

  const mailParams = {
    from: process.env.EMAIL_USER,
    to: [process.env.EMAIL_RECIPIENT_1, process.env.EMAIL_RECIPIENT_2].filter(Boolean).join(", "),
    subject: `SITE MESSAGE FROM ${sanitizeEmailHeader(cleanName)} | SUBJECT: ${sanitizeEmailHeader(cleanSubject)}`,
    html: `
      <h4>NEW CONTACT FORM SUBMISSION:</h4>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Subject:</strong> ${safeSubject || "No subject provided"}</p>
      <p><strong>Message:</strong> ${safeMessage}</p>`,
    replyTo: sanitizeEmailHeader(cleanEmail),
  };

  try {
    const data = await sendMail(mailParams);
    if (!data) return { success: false, message: "Failed to send email" };

    mailParams.messageId = data.messageId;
    mailParams.emailData = data;

    const storeModel = new dbModel(mailParams, process.env.CONTACTS_COLLECTION);
    const storeData = await storeModel.storeAny();
    if (!storeData) return { success: false, message: "Failed to store contact data" };

    return { success: true, message: "Email sent successfully", messageId: data.messageId };
  } catch (error) {
    console.error("CONTACT EMAIL ERROR:", error);
    return { success: false, message: "Failed to send email" };
  }
};
