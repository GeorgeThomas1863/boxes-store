import { buildNavBar } from "./main-form.js";

const buildBgMesh = () => {
  const mesh = document.createElement("div");
  mesh.className = "about-bg-mesh";
  return mesh;
};

const buildOrbs = () => {
  const defs = ["about-orb about-orb-1", "about-orb about-orb-2", "about-orb about-orb-3"];
  return defs.map((cls) => {
    const orb = document.createElement("div");
    orb.className = cls;
    return orb;
  });
};

const buildHero = () => {
  const hero = document.createElement("div");
  hero.className = "about-hero";

  const sub = document.createElement("p");
  sub.className = "about-hero-sub";
  sub.textContent = "PRN & Pretty Things Co. \u2022 Blue Ridge Mountains";

  const emojiRow = document.createElement("div");
  emojiRow.className = "about-hero-emoji";
  emojiRow.textContent = "\uD83C\uDF38 \uD83D\uDD4A\uFE0F \uD83C\uDF80";

  hero.append(sub, emojiRow);
  return hero;
};

const buildCard = ({ delay, barClass, tag, heading, paragraphs }) => {
  const card = document.createElement("div");
  card.className = "about-g-card about-glass";
  card.style.animationDelay = delay;

  const bar = document.createElement("div");
  bar.className = `about-accent-bar ${barClass}`;

  const tagEl = document.createElement("div");
  tagEl.className = "about-card-tag";
  tagEl.textContent = tag;

  const h2 = document.createElement("h2");
  h2.textContent = heading;

  card.append(bar, tagEl, h2);

  paragraphs.forEach(({ parts }) => {
    const p = document.createElement("p");
    parts.forEach(({ text, highlight }) => {
      if (highlight) {
        const span = document.createElement("span");
        span.className = "about-inline-hl";
        span.textContent = text;
        p.appendChild(span);
      } else {
        p.appendChild(document.createTextNode(text));
      }
    });
    card.appendChild(p);
  });

  return card;
};

const buildCards = () => {
  const card1 = buildCard({
    delay: "0.1s",
    barClass: "about-pink-bar",
    tag: "\uD83D\uDC8C My Journey",
    heading: "Finding Our Forever Home in the Blue Ridge",
    paragraphs: [
      {
        parts: [
          {
            text: "Originally from the Northeast, my journey to these mountains began in 2021. My husband and I have truly found our ",
          },
          { text: "\u201Cforever home\u201D", highlight: true },
          { text: " in Western North Carolina." },
        ],
      },
      {
        parts: [
          {
            text: "We weren\u2019t born here, but we chose these mountains for the quiet, intentional life they offer, and we\u2019ve been loving every minute of it since we arrived.",
          },
        ],
      },
    ],
  });

  const card2 = buildCard({
    delay: "0.2s",
    barClass: "about-purple-bar",
    tag: "\uD83D\uDD4A\uFE0F My Calling",
    heading: "A Decade of Nursing, Called to Comfort",
    paragraphs: [
      {
        parts: [
          {
            text: "I\u2019m Rachel, a Registered Nurse with a decade of clinical experience, and the heart behind PRN & Pretty Things Co.",
          },
        ],
      },
      {
        parts: [
          {
            text: "Over the last couple years I\u2019ve found my heart drawn to hospice care \u2014 where the focus is on comfort, peace, and making every moment count.",
          },
        ],
      },
      {
        parts: [
          { text: "There is a " },
          { text: "special kind of honor", highlight: true },
          {
            text: " in being there for patients and families during a sacred time. I know firsthand how heavy the heart can feel after a long shift.",
          },
        ],
      },
    ],
  });

  const card3 = buildCard({
    delay: "0.3s",
    barClass: "about-mint-bar",
    tag: "\uD83C\uDF80 The Brand",
    heading: "Every Girl Deserves a Hug in a Box",
    paragraphs: [
      {
        parts: [
          {
            text: "I created PRN & Pretty Things Co. because I believe every healthcare hero and every \u201Cjust a girl\u201D doing her best deserves a moment of pure, uncomplicated joy.",
          },
        ],
      },
      {
        parts: [
          { text: "I wanted to create a way for you to treat yourself to a cute package that actually feels like a " },
          { text: "hug in a box", highlight: true },
          { text: "." },
        ],
      },
    ],
  });

  return [card1, card2, card3];
};

const buildQuote = () => {
  const quote = document.createElement("div");
  quote.className = "about-quote-glass";

  const bigQ = document.createElement("span");
  bigQ.className = "about-big-q";
  bigQ.textContent = "\u201C";

  const blockquote = document.createElement("blockquote");
  blockquote.textContent =
    "I\u2019ve learned that the smallest comforts make the biggest difference. I created PRN & Pretty Things Co. to bring a little extra peace and joy to your off-duty hours.";

  const line = document.createElement("div");
  line.className = "about-quote-line";



  const cite = document.createElement("cite");
  cite.textContent = "\u2014 Rachel, RN";

  quote.append(bigQ, blockquote, line, cite);
  return quote;
};

const buildFooter = () => {
  const footer = document.createElement("div");
  footer.className = "about-footer-glass about-glass";

  const items = document.createElement("div");
  items.className = "about-footer-items";

  const rows = [
    { icon: "\uD83C\uDFD4\uFE0F", label: "Based In", value: "Western North Carolina" },
    { icon: "\uD83D\uDC69\uD83C\uDFFD\u200D\u2695\uFE0F", label: "Ownership", value: "Owned & Operated by a Registered Nurse" },
  ];

  rows.forEach(({ icon, label, value }) => {
    const row = document.createElement("div");
    row.className = "about-footer-row";

    const iconWrap = document.createElement("div");
    iconWrap.className = "about-f-icon-wrap";
    iconWrap.textContent = icon;

    const info = document.createElement("div");
    const labelEl = document.createElement("div");
    labelEl.className = "about-f-label";
    labelEl.textContent = label;
    const valueEl = document.createElement("div");
    valueEl.className = "about-f-value";
    valueEl.textContent = value;
    info.append(labelEl, valueEl);

    row.append(iconWrap, info);
    items.appendChild(row);
  });

  const divider = document.createElement("div");
  divider.className = "about-footer-divider";

  const copyright = document.createElement("div");
  copyright.className = "about-copyright";
  copyright.textContent = "\u00A9 2026 PRN & Pretty Things Co.";

  footer.append(items, divider, copyright);
  return footer;
};

export const buildAboutForm = async () => {
  const container = document.createElement("div");
  container.className = "about-container";

  const mesh = buildBgMesh();
  const orbs = buildOrbs();
  const nav = await buildNavBar();

  const page = document.createElement("div");
  page.className = "about-page";

  const hero = buildHero();
  const [card1, card2, card3] = buildCards();
  const quoteCard = buildQuote();
  const footerCard = buildFooter();

  page.append(hero, card2, card1, card3, quoteCard, footerCard);
  container.append(mesh, ...orbs, nav, page);
  return container;
};
