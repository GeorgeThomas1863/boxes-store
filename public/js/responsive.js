import { runAddToCart, runIncreaseQuantity, runDecreaseQuantity, runRemoveFromCart } from "./run/cart-run.js";
import { closePopup } from "./util/popup.js";

const displayElement = document.getElementById("display-element");
const cartElement = document.getElementById("cart-element");

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

  if (clickType === "add-to-cart") runAddToCart(clickedElement);
  if (clickType === "increase-quantity") runIncreaseQuantity(clickedElement);
  if (clickType === "decrease-quantity") runDecreaseQuantity(clickedElement);
  if (clickType === "remove-from-cart") runRemoveFromCart(clickedElement);
  if (clickType === "popup-close") closePopup();
};

if (displayElement) displayElement.addEventListener("click", clickHandler);
if (cartElement) cartElement.addEventListener("click", clickHandler);
