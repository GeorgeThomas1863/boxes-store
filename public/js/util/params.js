export const buildNewProductParams = async () => {
  const params = {
    route: "/add-new-product-route",
    itemId: document.getElementById("item-id")?.value || "",
    name: document.getElementById("name")?.value || "",
    urlName: document.getElementById("url-name")?.value?.trim() || "",
    price: document.getElementById("price")?.value || "",
    description: document.getElementById("description")?.value || "",
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
    price: document.getElementById("edit-price")?.value || "",
    description: document.getElementById("edit-description")?.value || "",
    picData: [],
  };
  return params;
};
