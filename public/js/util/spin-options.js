export const SPIN_OPTIONS = [
  { label: "1 Spin (free)", extraSpins: 0, spinCost: 0 },
  { label: "3 Extra Spins", extraSpins: 3, spinCost: 30 },
];

export const buildSpinSelector = (productId, selectedSpins = 0, cartItemId = null) => {
  const wrapper = document.createElement("div");
  wrapper.className = "spin-selector-wrapper";

  const label = document.createElement("label");
  label.className = "spin-selector-label";
  label.textContent = "Spins on the Mystery Wheel for Speciality Items:";

  const select = document.createElement("select");
  select.className = "spin-selector";
  select.setAttribute("data-label", "spin-select");
  select.setAttribute("data-product-id", productId);
  if (cartItemId != null) select.setAttribute("data-cart-item-id", cartItemId);

  for (let i = 0; i < SPIN_OPTIONS.length; i++) {
    const opt = SPIN_OPTIONS[i];
    const option = document.createElement("option");
    option.value = opt.extraSpins;
    option.setAttribute("data-spin-cost", opt.spinCost);
    option.textContent = opt.spinCost > 0
      ? `${opt.label} (+$${opt.spinCost.toFixed(2)})`
      : opt.label;
    if (opt.extraSpins === selectedSpins) option.selected = true;
    select.append(option);
  }

  wrapper.append(label, select);
  return wrapper;
};
