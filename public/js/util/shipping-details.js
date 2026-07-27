// util/shipping-details.js
export const buildDeliveryDateSpan = (rateData, label) => {
  if (!rateData.estimated_delivery_date) return null;

  const dateSpan = document.createElement("span");
  dateSpan.append("Estimated delivery: ");
  dateSpan.dataset.label = label;

  const dateValue = document.createElement("span");
  dateValue.className = "shipping-detail-date";
  dateValue.textContent = rateData.estimated_delivery_date;
  dateValue.dataset.label = label;

  dateSpan.append(dateValue);

  return dateSpan;
};
