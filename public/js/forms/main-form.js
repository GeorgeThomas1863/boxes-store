import { FACEBOOK_ICON_SVG, INSTAGRAM_ICON_SVG, TIKTOK_ICON_SVG } from "../util/define-things.js";

export const buildMainForm = async () => {
  const container = document.createElement("div");
  container.classList.add("main-form-container");

  const navBar = await buildNavBar();

  const topImage = document.createElement("img");
  topImage.src = "/images/company_label.png";
  topImage.alt = "Bingo & Bows Co.";
  topImage.classList.add("top-banner-img");

  const cardsGrid = document.createElement("div");
  cardsGrid.classList.add("cards-grid");

  const girlCard = await buildCard("girl");
  const fabulousCard = await buildCard("fabulous");
  cardsGrid.append(girlCard, fabulousCard);

  const bottomText = await buildBottomText();

  container.append(navBar, topImage, cardsGrid, bottomText);

  return container;
};

export const buildNavBar = async () => {
  const nav = document.createElement("nav");
  nav.className = "navbar";

  const navContainer = document.createElement("div");
  navContainer.className = "nav-container";

  const logo = document.createElement("a");
  logo.className = "logo";
  logo.textContent = "Bingo & Bows";
  logo.href = "/";

  const ul = document.createElement("ul");
  ul.className = "nav-links";

  const navItems = [
    // { text: "Welcome", href: "/" }, //not needed
    { text: "How it works", href: "/how-it-works" },
    { text: "About", href: "/about" },
    { text: "Contact", href: "/contact" },
  ];

  for (let i = 0; i < navItems.length; i++) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = navItems[i].href;
    a.textContent = navItems[i].text;
    li.appendChild(a);
    ul.appendChild(li);
  }

  // Mobile social icons row (last item in dropdown)
  const mobileSocialLi = document.createElement("li");
  mobileSocialLi.className = "mobile-social-row";

  const mobileTiktokLink = document.createElement("a");
  //   mobileTiktokLink.href = "https://www.tiktok.com/@twosistersfiberart";
  mobileTiktokLink.target = "_blank";
  mobileTiktokLink.rel = "noopener noreferrer";
  mobileTiktokLink.className = "social-icon";
  mobileTiktokLink.setAttribute("aria-label", "Visit our TikTok page");
  mobileTiktokLink.innerHTML = TIKTOK_ICON_SVG;

  const mobileFbLink = document.createElement("a");
  //   mobileFbLink.href = "https://www.facebook.com/people/Two-Sisters-Fiber-Art/100087889424782";
  mobileFbLink.target = "_blank";
  mobileFbLink.rel = "noopener noreferrer";
  mobileFbLink.className = "social-icon";
  mobileFbLink.setAttribute("aria-label", "Visit our Facebook page");
  mobileFbLink.innerHTML = FACEBOOK_ICON_SVG;

  const mobileIgLink = document.createElement("a");
  //   mobileIgLink.href = "https://www.instagram.com/twosistersfiberart";
  mobileIgLink.target = "_blank";
  mobileIgLink.rel = "noopener noreferrer";
  mobileIgLink.className = "social-icon";
  mobileIgLink.setAttribute("aria-label", "Visit our Instagram page");
  mobileIgLink.innerHTML = INSTAGRAM_ICON_SVG;

  mobileSocialLi.append(mobileTiktokLink, mobileFbLink, mobileIgLink);
  ul.appendChild(mobileSocialLi);

  const rightContainer = document.createElement("div");
  rightContainer.className = "nav-right-container";

  // Add cart button
  const cartLi = document.createElement("li");
  cartLi.id = "nav-cart-container";
  cartLi.style.display = "none"; // Hidden by default

  const cartLink = document.createElement("a");
  cartLink.href = "/cart";
  cartLink.className = "nav-cart-link";

  const cartIcon = document.createElement("span");
  cartIcon.className = "cart-icon";
  cartIcon.textContent = "🛒";

  const cartCount = document.createElement("span");
  cartCount.className = "cart-count";
  cartCount.id = "nav-cart-count";
  cartCount.textContent = "0";

  cartLink.append(cartIcon, cartCount);
  cartLi.appendChild(cartLink);

  // Social media icons container
  const socialContainer = document.createElement("div");
  socialContainer.className = "social-icons";

  // TikTok icon
  const tiktokLink = document.createElement("a");
  tiktokLink.href = "https://www.tiktok.com/@twosistersfiberart";
  tiktokLink.target = "_blank";
  tiktokLink.rel = "noopener noreferrer";
  tiktokLink.className = "social-icon";
  tiktokLink.setAttribute("aria-label", "Visit our TikTok page");
  tiktokLink.innerHTML = TIKTOK_ICON_SVG;

  // Facebook icon
  const facebookLink = document.createElement("a");
  facebookLink.href = "https://www.facebook.com/people/Two-Sisters-Fiber-Art/100087889424782";
  facebookLink.target = "_blank";
  facebookLink.rel = "noopener noreferrer";
  facebookLink.className = "social-icon";
  facebookLink.setAttribute("aria-label", "Visit our Facebook page");
  facebookLink.innerHTML = FACEBOOK_ICON_SVG;

  // Instagram icon
  const instagramLink = document.createElement("a");
  instagramLink.href = "https://www.instagram.com/twosistersfiberart";
  instagramLink.target = "_blank";
  instagramLink.rel = "noopener noreferrer";
  instagramLink.className = "social-icon";
  instagramLink.setAttribute("aria-label", "Visit our Instagram page");
  instagramLink.innerHTML = INSTAGRAM_ICON_SVG;

  socialContainer.append(tiktokLink, facebookLink, instagramLink);
  rightContainer.append(cartLi, socialContainer);

  const hamburgerBtn = document.createElement("button");
  hamburgerBtn.className = "hamburger-btn";
  hamburgerBtn.setAttribute("aria-label", "Toggle menu");
  hamburgerBtn.setAttribute("data-label", "toggle-menu");
  for (let i = 0; i < 3; i++) {
    const line = document.createElement("span");
    line.className = "hamburger-line";
    line.setAttribute("data-label", "toggle-menu");
    hamburgerBtn.appendChild(line);
  }

  navContainer.append(logo, hamburgerBtn, ul, rightContainer);
  nav.appendChild(navContainer);

  // initMobileMenu(nav);

  return nav;
};

export const buildCard = async (type) => {
  const configs = {
    girl: { src: "/images/girl-card.png", label: "Just a Girl", productId: "girl-001", price: 25.00 },
    fabulous: { src: "/images/misspelled-card.png", label: "Fabulous", productId: "fabulous-001", price: 30.00 },
  };
  const config = configs[type];
  if (!config) return null;

  const card = document.createElement("div");
  card.classList.add("product-card");
  card.setAttribute("data-product-id", config.productId);

  const img = document.createElement("img");
  img.src = config.src;
  img.alt = config.label;
  img.loading = "lazy";
  img.className = "product-image";

  const label = document.createElement("div");
  label.classList.add("card-label", "product-name");
  label.textContent = config.label;

  const priceSpan = document.createElement("span");
  priceSpan.className = "product-price";
  priceSpan.textContent = `$${config.price.toFixed(2)}`;

  const addToCartBtn = document.createElement("button");
  addToCartBtn.className = "add-to-cart-btn";
  addToCartBtn.setAttribute("data-label", "add-to-cart");
  addToCartBtn.textContent = "Add to Cart";
  addToCartBtn.productId = config.productId;

  card.append(img, label, priceSpan, addToCartBtn);
  return card;
};

export const buildBottomText = async () => {
  const section = document.createElement("div");
  section.classList.add("bottom-text-section");

  const p = document.createElement("p");
  p.classList.add("bottom-text");
  // placeholder — user will fill in text

  section.appendChild(p);
  return section;
};
