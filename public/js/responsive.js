const displayElement = document.getElementById("display-element");

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
};

if (displayElement) displayElement.addEventListener("click", clickHandler);
