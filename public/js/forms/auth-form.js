export const buildAuthForm = async () => {
  const wrapper = document.createElement("div");
  wrapper.id = "auth-form-wrapper";

  const heading = document.createElement("h2");
  heading.id = "auth-heading";
  heading.textContent = "Admin Login";

  const ul = document.createElement("ul");

  const pwItem = document.createElement("li");
  pwItem.id = "auth-pw-list-item";

  const label = document.createElement("label");
  label.id = "auth-label";
  label.htmlFor = "auth-pw-input";
  label.textContent = "Password";

  const input = document.createElement("input");
  input.id = "auth-pw-input";
  input.type = "password";
  input.placeholder = "Enter password";
  input.autocomplete = "current-password";

  pwItem.append(label, input);
  ul.appendChild(pwItem);

  const submitBtn = document.createElement("button");
  submitBtn.setAttribute("data-label", "auth-submit");
  submitBtn.textContent = "Login";

  wrapper.append(heading, ul, submitBtn);

  return wrapper;
};
