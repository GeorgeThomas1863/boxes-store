// util/shipping-details.js
export const buildShippingOptionDetails = (rateData, className, label) => {
  if (!rateData.delivery_days && !rateData.estimated_delivery_date) return null;

  const details = document.createElement("div");
  details.className = className;
  details.dataset.label = label;

  const daysSpan = buildDeliveryDaysSpan(rateData, label);
  if (daysSpan) details.append(daysSpan);

  const dateSpan = buildDeliveryDateSpan(rateData, label);
  if (dateSpan) details.append(dateSpan);

  return details;
};

const buildDeliveryDaysSpan = (rateData, label) => {
  if (!rateData.delivery_days) return null;

  const daysSpan = document.createElement("span");
  daysSpan.textContent = `${rateData.delivery_days} business days`;
  daysSpan.dataset.label = label;

  return daysSpan;
};

const buildDeliveryDateSpan = (rateData, label) => {
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
