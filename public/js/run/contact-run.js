import { displayPopup } from "../util/popup.js";
import { sendToBack } from "../util/api-front.js";

export const runContactSubmit = async () => {
  const nameInput = document.getElementById("contact-name");
  const emailInput = document.getElementById("contact-email");
  const subjectInput = document.getElementById("contact-subject");
  const messageInput = document.getElementById("contact-message");

  const name = nameInput?.value?.trim() || "";
  const email = emailInput?.value?.trim() || "";
  const subject = subjectInput?.value?.trim() || "";
  const message = messageInput?.value?.trim() || "";

  if (!name) {
    await displayPopup("Please enter your name.", "error");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    await displayPopup("Please enter a valid email address.", "error");
    return;
  }

  if (!message) {
    await displayPopup("Please enter a message.", "error");
    return;
  }

  const params = {
    route: "/contact/submit",
    name,
    email,
    subject,
    message,
  };

  const data = await sendToBack(params);

  if (!data || !data.success) {
    await displayPopup("Failed to send message. Please try again.", "error");
    return;
  }

  await displayPopup("Message sent! We'll get back to you soon.", "success");

  if (nameInput) nameInput.value = "";
  if (emailInput) emailInput.value = "";
  if (subjectInput) subjectInput.value = "";
  if (messageInput) messageInput.value = "";
};
