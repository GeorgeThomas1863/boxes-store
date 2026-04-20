import { TIKTOK_ICON_SVG, CAROUSEL_PREV_SVG, CAROUSEL_NEXT_SVG } from "../util/define-things.js";
import { sendToBack } from "../util/api-front.js";
import { buildSpinSelector } from "../util/spin-options.js";
import { buildCollapseContainer } from "../util/collapse.js";

export const buildMainForm = async () => {
  const container = document.createElement("div");
  container.classList.add("main-form-container");

  const navBar = await buildNavBar();

  const topImage = document.createElement("img");
  topImage.src = "/images/PRN_logo2.jpg";
  topImage.alt = "PRN & Pretty Things";
  topImage.classList.add("top-banner-img");

  const cardsGrid = document.createElement("div");
  cardsGrid.classList.add("cards-grid");

  const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");
  if (!productData) {
    const msg = document.createElement("p");
    msg.className = "no-products-msg";
    msg.textContent = "Unable to load products — please refresh the page.";
    cardsGrid.append(msg);
  } else {
    const products = productData
      .filter((p) => p.display !== "no" && p.sold !== "yes")
      .sort((a, b) => new Date(b.dateCreated || 0) - new Date(a.dateCreated || 0));
    if (products.length === 0) {
      const banner = await buildOutOfStockBanner();
      cardsGrid.append(banner);
    } else {
      for (let i = 0; i < products.length; i++) {
        const card = buildCard(products[i]);
        if (card) cardsGrid.append(card);
      }
    }
  }

  const bottomText = await buildBottomText();

  const bottomSection = await buildBottomSection();
  const launchSection = await buildLaunchSection();
  container.append(navBar, topImage, launchSection, cardsGrid, bottomText, bottomSection);

  return container;
};

export const buildNavBar = async () => {
  const nav = document.createElement("nav");
  nav.className = "navbar";

  const navContainer = document.createElement("div");
  navContainer.className = "nav-container";

  const logo = document.createElement("a");
  logo.className = "logo";
  logo.textContent = "PRN & Pretty Things";
  logo.href = "/";

  const ul = document.createElement("ul");
  ul.className = "nav-links";

  const navItems = [
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

  const rightContainer = document.createElement("div");
  rightContainer.className = "nav-right-container";

  const cartLi = document.createElement("li");
  cartLi.id = "nav-cart-container";
  cartLi.style.display = "none";

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

  const navTiktokLink = document.createElement("a");
  navTiktokLink.href = "https://www.tiktok.com/@prn_prettythings_co";
  navTiktokLink.target = "_blank";
  navTiktokLink.rel = "noopener noreferrer";
  navTiktokLink.className = "social-icon nav-tiktok";
  navTiktokLink.setAttribute("aria-label", "Visit our TikTok page");
  navTiktokLink.innerHTML = TIKTOK_ICON_SVG;

  rightContainer.append(cartLi, navTiktokLink);

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

  const navOverlay = document.createElement("div");
  navOverlay.className = "nav-overlay";

  const menuCloseBtn = document.createElement("button");
  menuCloseBtn.className = "nav-menu-close";
  menuCloseBtn.setAttribute("data-label", "toggle-menu");
  menuCloseBtn.setAttribute("aria-label", "Close menu");
  menuCloseBtn.textContent = "✕";

  navOverlay.append(menuCloseBtn, ul);

  navContainer.append(hamburgerBtn, logo, rightContainer);
  nav.append(navContainer, navOverlay);

  return nav;
};

//-------------------------------------------

export const buildCard = (productData) => {
  if (!productData) return null;

  const { productId, name, price, picData, description, discount } = productData;

  const card = document.createElement("div");
  card.classList.add("product-card");
  card.setAttribute("data-product-id", productId);
  card.productData = productData;

  if (picData && picData.length > 0) {
    if (picData.length === 1) {
      const img = document.createElement("img");
      img.src = picData[0].path;
      img.alt = name;
      img.loading = "lazy";
      img.className = "product-image";
      img.setAttribute("data-label", "product-card-click");
      card.append(img);
    } else {
      card.append(buildCarouselElement(picData, name, true));
    }
  }

  const label = document.createElement("div");
  label.classList.add("card-label", "product-name");
  label.setAttribute("data-label", "product-card-click");
  label.textContent = name;

  let priceSpan;
  if (discount > 0) {
    priceSpan = document.createElement("div");
    priceSpan.className = "price-block";
    priceSpan.setAttribute("data-label", "product-card-click");

    const originalEl = document.createElement("del");
    originalEl.className = "product-price-original";
    originalEl.setAttribute("data-label", "product-card-click");
    originalEl.textContent = `$${parseFloat(price || 0).toFixed(2)}`;

    const discountedEl = document.createElement("span");
    discountedEl.className = "product-price product-price-discounted";
    discountedEl.setAttribute("data-label", "product-card-click");
    discountedEl.textContent = `$${(parseFloat(price || 0) * (1 - discount / 100)).toFixed(2)}`;

    const badgeEl = document.createElement("span");
    badgeEl.className = "discount-badge";
    badgeEl.setAttribute("data-label", "product-card-click");
    badgeEl.textContent = `${discount}% OFF`;

    priceSpan.append(originalEl, discountedEl, badgeEl);
  } else {
    priceSpan = document.createElement("span");
    priceSpan.className = "product-price";
    priceSpan.setAttribute("data-label", "product-card-click");
    priceSpan.textContent = `$${parseFloat(price || 0).toFixed(2)}`;
  }

  const addToCartBtn = document.createElement("button");
  addToCartBtn.className = "add-to-cart-btn";
  addToCartBtn.setAttribute("data-label", "add-to-cart");
  addToCartBtn.textContent = "Add to Cart";
  addToCartBtn.productId = productId;

  const toAppend = [label, priceSpan, addToCartBtn];

  if (description) {
    const desc = document.createElement("p");
    desc.className = "product-description";
    desc.setAttribute("data-label", "product-card-click");
    desc.textContent = description;
    toAppend.push(desc);
  }

  toAppend.push(buildSpinSelector(productId, 0));
  card.append(...toAppend);
  return card;
};

export const buildCarouselElement = (pics, altText, isCard, startIndex = 0) => {
  const carousel = document.createElement("div");
  carousel.className = "product-carousel";
  if (isCard) carousel.setAttribute("data-label", "product-card-click");

  const track = document.createElement("div");
  track.className = "carousel-track";

  for (let i = 0; i < pics.length; i++) {
    let slide;
    if (pics[i].mediaType === "video") {
      slide = document.createElement("video");
      slide.controls = true;
    } else {
      slide = document.createElement("img");
      slide.alt = altText;
      if (isCard || i !== startIndex) slide.setAttribute("loading", "lazy");
    }
    slide.className = "carousel-slide";
    if (isCard && pics[i].mediaType !== "video") slide.setAttribute("data-label", "product-card-click");
    slide.draggable = false;
    slide.src = pics[i].path;
    track.append(slide);
  }

  const prevBtn = document.createElement("button");
  prevBtn.className = "carousel-arrow carousel-arrow-prev";
  prevBtn.setAttribute("data-label", "carousel-prev");
  prevBtn.type = "button";
  prevBtn.innerHTML = CAROUSEL_PREV_SVG;

  const nextBtn = document.createElement("button");
  nextBtn.className = "carousel-arrow carousel-arrow-next";
  nextBtn.setAttribute("data-label", "carousel-next");
  nextBtn.type = "button";
  nextBtn.innerHTML = CAROUSEL_NEXT_SVG;

  const dotsContainer = document.createElement("div");
  dotsContainer.className = "carousel-dots";

  for (let i = 0; i < pics.length; i++) {
    const dot = document.createElement("button");
    dot.className = "carousel-dot" + (i === startIndex ? " active" : "");
    dot.setAttribute("data-label", "product-carousel-dot");
    dot.setAttribute("data-index", String(i));
    dot.type = "button";
    dotsContainer.append(dot);
  }

  carousel.append(track, prevBtn, nextBtn, dotsContainer);
  if (startIndex > 0) track.style.transform = `translateX(-${startIndex * 100}%)`;
  return carousel;
};

export const buildBottomSection = async () => {
  const bottomSection = document.createElement("div");
  bottomSection.className = "main-bottom-section";

  const infoRows = await buildBottomInfoRows();

  const dividerTop = document.createElement("div");
  dividerTop.className = "main-footer-divider";

  const disclaimerBlock = await buildBottomDisclaimerBlock();

  const dividerBottom = document.createElement("div");
  dividerBottom.className = "main-footer-divider";

  const copyright = document.createElement("div");
  copyright.className = "main-footer-copyright";
  copyright.textContent = "© 2026 PRN & Pretty Things Co.";

  bottomSection.append(infoRows, dividerTop, disclaimerBlock, dividerBottom, copyright);

  return bottomSection;
};

//-------------------------------------------

export const buildBottomInfoRows = async () => {
  const infoBlock = document.createElement("div");
  infoBlock.className = "main-footer-info";

  const rows = [
    { icon: "\uD83D\uDC69\uD83C\uDFFB\u200D\u2695\uFE0F", text: "Owned and Operated by a Registered Nurse" },
    { icon: "\uD83C\uDFD4\uFE0F", text: "Proudly based in Western North Carolina" },
  ];

  for (let i = 0; i < rows.length; i++) {
    const row = document.createElement("div");
    row.className = "main-footer-info-line main-footer-icon-row";

    const iconWrap = document.createElement("div");
    iconWrap.className = "main-footer-icon-wrap";
    iconWrap.textContent = rows[i].icon;

    const text = document.createElement("span");
    text.textContent = rows[i].text;

    row.append(iconWrap, text);
    infoBlock.append(row);
  }

  return infoBlock;
};

//-------------------------------------------

export const buildBottomDisclaimerBlock = async () => {
  const block = document.createElement("div");
  block.className = "main-disclaimer-block";

  const title = document.createElement("div");
  title.className = "main-disclaimer-title";
  title.textContent = "*DISCLAIMERS";

  const disclaimerItems = [
    {
      header: "1. The Mystery Experience",
      body: 'While we personally select every item to ensure it meets our "Nurse Approved" and "Coquette Aesthetic" standards, we cannot guarantee specific colors or variations. Items are subject to change.',
      subItems: [],
    },
    {
      header: "2. All Sales Are Final",
      body: "Every box is a custom experience, packed specifically for your order. Because of this personalized process, all sales are final. We do not offer returns, exchanges, or refunds based on personal preference of the mystery items received. We put our heart into every pull and hope the surprises bring a smile to your end of shift!",
      subItems: [],
    },
    {
      header: "3. Shipping & Mountain Time",
      body: "Processing: Each box is hand-packed in the heart of Western North Carolina. Please allow 3–5 business days for us to prepare your package for its journey.",
      subItems: [
        {
          label: "*Accuracy:",
          body: "Please double-check your shipping address at checkout. PRN & Pretty Things Co. is not responsible for packages sent to incorrectly provided addresses.",
        },
        {
          label: "*Damages:",
          body: "While we pack with care, the journey through the mountains can be bumpy! If an item arrives damaged, please email us a photo within 48 hours of delivery at admin@prnprettythings.com so we can make it right.",
        },
      ],
    },
  ];

  block.append(title);

  for (let i = 0; i < disclaimerItems.length; i++) {
    const itemData = disclaimerItems[i];

    const item = document.createElement("div");
    item.className = "main-disclaimer-item";

    const header = document.createElement("div");
    header.className = "main-disclaimer-item-header";
    header.textContent = itemData.header;

    const body = document.createElement("p");
    body.className = "main-disclaimer-item-body";
    body.textContent = itemData.body;

    item.append(header, body);

    for (let j = 0; j < itemData.subItems.length; j++) {
      const subData = itemData.subItems[j];

      const subItem = document.createElement("div");
      subItem.className = "main-disclaimer-sub-item";

      const subLabel = document.createElement("span");
      subLabel.className = "main-disclaimer-sub-label";
      subLabel.textContent = subData.label + " ";

      const subBody = document.createElement("span");
      subBody.className = "main-disclaimer-sub-body";
      subBody.textContent = subData.body;

      subItem.append(subLabel, subBody);
      item.append(subItem);
    }

    block.append(item);
  }

  return block;
};

//-------------------------------------------

export const buildLaunchSection = async () => {
  const card = document.createElement("div");
  card.className = "launch-card";

  const header = document.createElement("p");
  header.className = "launch-header";
  const bold = document.createElement("strong");
  bold.textContent = "Now Accepting PRE-ORDERS For:";
  const title = document.createElement("em");
  title.className = "launch-header-title";
  title.textContent = "The Fabulous Nurse Mystery Box";
  header.append(bold, title);

  const subheader = document.createElement("p");
  subheader.className = "launch-subheader";
  subheader.textContent = "15 pink prize capsules and 1 Spin on the Mystery Wheel";

  const capsulesTitle = document.createElement("span");
  capsulesTitle.textContent = "Pink Prize Capsules";

  const pillsWrap = document.createElement("div");
  pillsWrap.className = "launch-pills";
  const capsuleItems = [
    "Shift Essentials",
    "Self-care items",
    "Fun off duty activities",
    "RN's pick",
    "Grab 2 extra picks",
    "Specialty Item Mystery Spins",
  ];
  for (let i = 0; i < capsuleItems.length; i++) {
    const pill = document.createElement("span");
    pill.className = "launch-pill";
    pill.textContent = capsuleItems[i];
    pillsWrap.append(pill);
  }

  const capsulesCollapse = await buildCollapseContainer({
    titleElement: capsulesTitle,
    contentElement: pillsWrap,
    isExpanded: false,
    className: "launch-collapsible-item",
  });

  const wheelTitle = document.createElement("span");
  wheelTitle.textContent = "Mystery Wheel Specialty Items";

  const wheelList = document.createElement("ul");
  wheelList.className = "launch-wheel-list";
  const wheelItems = [
    "Each number on the Mystery wheel correlates to a Specialty Item",
    "Items include planners, chargers, handbags, and other sparkly accessories",
    "1 spin is included in your purchase",
    "Extra spins are available for purchase at checkout",
  ];
  for (let i = 0; i < wheelItems.length; i++) {
    const li = document.createElement("li");
    li.className = "launch-wheel-item";
    li.textContent = wheelItems[i];
    wheelList.append(li);
  }

  const wheelCollapse = await buildCollapseContainer({
    titleElement: wheelTitle,
    contentElement: wheelList,
    isExpanded: false,
    className: "launch-collapsible-item",
  });

  const includesLabel = document.createElement("p");
  includesLabel.className = "launch-includes-label";
  includesLabel.textContent = "Each box includes:";

  const row = document.createElement("div");
  row.className = "launch-collapsibles-row";
  row.append(capsulesCollapse, wheelCollapse);

  card.append(header, subheader, includesLabel, row);
  return card;
};

//-------------------------------------------

export const buildOutOfStockBanner = async () => {
  const banner = document.createElement("div");
  banner.className = "out-of-stock-banner";

  const icon = document.createElement("div");
  icon.className = "out-of-stock-icon";
  icon.textContent = "🎀";

  const title = document.createElement("p");
  title.className = "out-of-stock-title";
  title.textContent = "Currently Out of Stock";

  const bodyOne = document.createElement("p");
  bodyOne.className = "out-of-stock-body";
  bodyOne.textContent = "Thank you so much for your incredible support! Every box has found its home, we\u2019re not accepting new orders at this time. We will restock soon!";

  const bodyTwo = document.createElement("p");
  bodyTwo.className = "out-of-stock-body";
  bodyTwo.textContent = "If you\u2019d like to be the first to know when new orders are available, send us a message and we\u2019ll be in touch. \uD83D\uDC97\uD83C\uDF38";

  const link = document.createElement("a");
  link.className = "out-of-stock-link";
  link.href = "/contact";
  link.textContent = "Send Us a Message \u2192";

  banner.append(icon, title, bodyOne, bodyTwo, link);

  return banner;
};

//-------------------------------------------

export const buildBottomText = async () => {
  const section = document.createElement("div");
  section.classList.add("bottom-text-section");

  const p = document.createElement("p");
  p.classList.add("bottom-text");
  // placeholder — user will fill in text

  section.appendChild(p);
  return section;
};
