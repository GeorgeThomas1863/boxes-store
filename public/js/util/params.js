export const buildNewProductParams = async () => {
  const params = {
    route: "/add-new-product-route",
    itemId: document.getElementById("item-id")?.value || "",
    name: document.getElementById("name")?.value || "",
    urlName: document.getElementById("url-name")?.value?.trim() || "",
    productType: document.getElementById("product-type")?.value || "",
    price: document.getElementById("price")?.value || "",
    canShip: document.getElementById("can-ship")?.value || "yes",
    length: document.getElementById("length")?.value || "",
    width: document.getElementById("width")?.value || "",
    height: document.getElementById("height")?.value || "",
    weight: document.getElementById("weight")?.value || "",
    description: document.getElementById("description")?.value || "",
    display: document.getElementById("display")?.value || "yes",
    sold: document.getElementById("sold")?.value || "no",
    picData: [],
    dateCreated: new Date().toISOString(),
  };
  return params;
};

export const getEditProductParams = async () => {
  const params = {
    itemId: document.getElementById("edit-item-id")?.value || "",
    name: document.getElementById("edit-name")?.value || "",
    urlName: document.getElementById("edit-url-name")?.value?.trim() || undefined,
    productType: document.getElementById("edit-product-type")?.value || "",
    price: document.getElementById("edit-price")?.value || "",
    canShip: document.getElementById("edit-can-ship")?.value || "yes",
    length: document.getElementById("edit-length")?.value || "",
    width: document.getElementById("edit-width")?.value || "",
    height: document.getElementById("edit-height")?.value || "",
    weight: document.getElementById("edit-weight")?.value || "",
    description: document.getElementById("edit-description")?.value || "",
    display: document.getElementById("edit-display")?.value || "yes",
    sold: document.getElementById("edit-sold")?.value || "no",
    picData: [],
  };
  return params;
};
