import { buildAuthForm } from "./forms/auth-form.js";
import { sendToBack } from "./util/api-front.js";

const authElement = document.getElementById("auth-element");

export const buildAuthDisplay = async () => {
  if (!authElement) return null;

  const authForm = await buildAuthForm();
  if (!authForm) {
    // console.log("FAILED TO BUILD AUTH FORM");
    return null;
  }

  authElement.appendChild(authForm);
};

export const runAuthSubmit = async () => {
  const authPwInput = document.getElementById("auth-pw-input");
  if (!authPwInput || !authPwInput.value) return null;

  const data = await sendToBack({ route: "/site-auth-route", pw: authPwInput.value });

  if (!data || !data.redirect) return null;

  window.location.href = data.redirect;
  return data;
};
