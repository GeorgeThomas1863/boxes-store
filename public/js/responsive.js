import { runAddToCart, runIncreaseQuantity, runDecreaseQuantity, runRemoveFromCart } from "./run/cart-run.js";
import { closePopup } from "./run/popup.js";
import { runAuthSubmit } from "./auth.js";
import { runPwToggle } from "./run/collapse.js";

const displayElement = document.getElementById("display-element");
const cartElement = document.getElementById("cart-element");
const authElement = document.getElementById("auth-element");

export const clickHandler = (e) => {
  const clickedElement = e.target;
  const clickId = clickedElement.id;

  const clickType = clickedElement.getAttribute("data-label");

  console.log("CLICK HANDLER");
  console.log(clickId);
  console.log("CLICK TYPE");
  console.log(clickType);

  if (clickType === "toggle-menu") {
    const menu = document.querySelector(".nav-links");
    menu.classList.toggle("open");
  }

  if (clickType === "pwToggle") runPwToggle();

  if (clickType === "auth-submit") runAuthSubmit();

  if (clickType === "add-to-cart") runAddToCart(clickedElement);
  if (clickType === "increase-quantity") runIncreaseQuantity(clickedElement);
  if (clickType === "decrease-quantity") runDecreaseQuantity(clickedElement);
  if (clickType === "remove-from-cart") runRemoveFromCart(clickedElement);
  if (clickType === "popup-close") closePopup();
  if (clickType === "auth-submit") runAuthSubmit();
};

if (displayElement) displayElement.addEventListener("click", clickHandler);
if (cartElement) cartElement.addEventListener("click", clickHandler);
if (authElement) authElement.addEventListener("click", clickHandler);
