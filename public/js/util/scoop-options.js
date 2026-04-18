export const SCOOP_OPTIONS = [
  { label: "1 Spin (FREE!)", extraScoops: 0, scoopCost: 0 },
  { label: "3 Extra Spins", extraScoops: 3, scoopCost: 30 },
];

export const buildScoopSelector = (productId, selectedScoops = 0) => {
  const wrapper = document.createElement("div");
  wrapper.className = "scoop-selector-wrapper";

  const label = document.createElement("label");
  label.className = "scoop-selector-label";
  label.textContent = "Spins on the Mystery Wheel for Speciality Items:";

  const select = document.createElement("select");
  select.className = "scoop-selector";
  select.setAttribute("data-label", "scoop-select");
  select.setAttribute("data-product-id", productId);

  for (let i = 0; i < SCOOP_OPTIONS.length; i++) {
    const opt = SCOOP_OPTIONS[i];
    const option = document.createElement("option");
    option.value = opt.extraScoops;
    option.setAttribute("data-scoop-cost", opt.scoopCost);
    option.textContent = opt.scoopCost > 0
      ? `${opt.label} (+$${opt.scoopCost.toFixed(2)})`
      : opt.label;
    if (opt.extraScoops === selectedScoops) option.selected = true;
    select.append(option);
  }

  wrapper.append(label, select);
  return wrapper;
};
