import { buildNavBar } from "./main-form.js";

//-------------------------------------------

export const buildNameGroup = async () => {
  const group = document.createElement("div");
  group.className = "form-group";

  const label = document.createElement("label");
  label.htmlFor = "contact-name";
  label.textContent = "Name";

  const input = document.createElement("input");
  input.type = "text";
  input.id = "contact-name";
  input.name = "contact-name";
  input.placeholder = "Your name";
  input.required = true;
  input.maxLength = 100;

  group.append(label, input);
  return group;
};

//-------------------------------------------

export const buildEmailGroup = async () => {
  const group = document.createElement("div");
  group.className = "form-group";

  const label = document.createElement("label");
  label.htmlFor = "contact-email";
  label.textContent = "Email";

  const input = document.createElement("input");
  input.type = "email";
  input.id = "contact-email";
  input.name = "contact-email";
  input.placeholder = "your@email.com";
  input.required = true;
  input.maxLength = 200;

  group.append(label, input);
  return group;
};

//-------------------------------------------

export const buildSubjectGroup = async () => {
  const group = document.createElement("div");
  group.className = "form-group";

  const label = document.createElement("label");
  label.htmlFor = "contact-subject";
  label.textContent = "Subject";

  const input = document.createElement("input");
  input.type = "text";
  input.id = "contact-subject";
  input.name = "contact-subject";
  input.placeholder = "What's this about?";
  input.required = false;
  input.maxLength = 200;

  group.append(label, input);
  return group;
};

//-------------------------------------------

export const buildMessageGroup = async () => {
  const group = document.createElement("div");
  group.className = "form-group";

  const label = document.createElement("label");
  label.htmlFor = "contact-message";
  label.textContent = "Message";

  const textarea = document.createElement("textarea");
  textarea.id = "contact-message";
  textarea.name = "contact-message";
  textarea.placeholder = "Write your message here...";
  textarea.required = true;

  group.append(label, textarea);
  return group;
};

//-------------------------------------------

export const buildContactSubmitButton = async () => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "submit-button";
  button.setAttribute("data-label", "contact-submit");
  button.textContent = "Send Message";

  return button;
};

//-------------------------------------------

export const buildContactFormElement = async () => {
  const form = document.createElement("form");
  form.id = "contact-form";

  const nameGroup = await buildNameGroup();
  const emailGroup = await buildEmailGroup();
  const subjectGroup = await buildSubjectGroup();
  const messageGroup = await buildMessageGroup();
  const submitButton = await buildContactSubmitButton();

  form.append(nameGroup, emailGroup, subjectGroup, messageGroup, submitButton);
  return form;
};

//-------------------------------------------

export const buildContactFormContent = async () => {
  const content = document.createElement("div");
  content.className = "contact-form-content";

  const formElement = await buildContactFormElement();

  content.append(formElement);
  return content;
};

//-------------------------------------------

export const buildContactCard = async () => {
  const card = document.createElement("div");
  card.className = "contact-card";

  const formContent = await buildContactFormContent();

  card.append(formContent);
  return card;
};

//-------------------------------------------

export const buildContactHeader = async () => {
  const header = document.createElement("div");
  header.className = "contact-page-header";

  const title = document.createElement("h1");
  title.className = "contact-page-title";
  title.textContent = "Contact Us";

  const subtitle = document.createElement("p");
  subtitle.className = "contact-page-subtitle";
  subtitle.textContent = "We'd love to hear from you. Send us a message!";

  header.append(title, subtitle);
  return header;
};

//-------------------------------------------

export const buildContactContainer = async () => {
  const container = document.createElement("div");
  container.className = "contact-container";

  const header = await buildContactHeader();
  const card = await buildContactCard();

  container.append(header, card);
  return container;
};

//-------------------------------------------

export const buildContactForm = async () => {
  const wrapper = document.createElement("div");
  wrapper.className = "contact-page-wrapper";

  const navBar = await buildNavBar();
  const contactContainer = await buildContactContainer();

  wrapper.append(navBar, contactContainer);
  return wrapper;
};
