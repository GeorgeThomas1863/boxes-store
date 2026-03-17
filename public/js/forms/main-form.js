export const buildMainForm = async () => {
  const container = document.createElement("div");
  container.classList.add("main-form-container");

  const navBar = await buildNavBar();

  const topImage = document.createElement("img");
  topImage.src = "/images/company_label.png";

  //BUILD CARD 1

  //BUILD CARD 2

  const bottomText = await buildBottomText();

  container.append(navBar, topImage, bottomText);

  return container;
};

export const buildNavBar = async () => {};

export const buildCard = async (type) => {};

export const buildBottomText = async () => {};
