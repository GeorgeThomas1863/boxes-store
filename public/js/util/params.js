export const buildNewProductParams = async () => {
  const slotBtns = document.querySelectorAll(".pic-slots-container .upload-btn");
  const picData = [];
  for (let i = 0; i < slotBtns.length; i++) {
    if (slotBtns[i].uploadData) picData.push(slotBtns[i].uploadData);
  }

  const params = {
    route: "/add-new-product-route",
    itemId: document.getElementById("item-id")?.value || "",
    name: document.getElementById("name")?.value || "",
    urlName: document.getElementById("url-name")?.value?.trim() || "",
    price: document.getElementById("price")?.value || "",
    description: document.getElementById("description")?.value || "",
    picData: picData,
    dateCreated: new Date().toISOString(),
  };
  return params;
};

export const getEditProductParams = async () => {
  const slotBtns = document.querySelectorAll(".pic-slots-container .upload-btn");
  const picData = [];
  for (let i = 0; i < slotBtns.length; i++) {
    if (slotBtns[i].uploadData) picData.push(slotBtns[i].uploadData);
  }

  const params = {
    itemId: document.getElementById("edit-item-id")?.value || "",
    name: document.getElementById("edit-name")?.value || "",
    urlName: document.getElementById("edit-url-name")?.value?.trim() || undefined,
    price: document.getElementById("edit-price")?.value || "",
    description: document.getElementById("edit-description")?.value || "",
    picData: picData,
  };
  return params;
};
