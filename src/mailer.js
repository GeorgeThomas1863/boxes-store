const toRecipients = (val) => {
  if (!val) return [];
  const list = Array.isArray(val) ? val : val.split(",").map((s) => s.trim()).filter(Boolean);
  return list;
};

export const sendMail = async ({ from, fromName, to, bcc, subject, html, text, replyTo }) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("sendMail: RESEND_API_KEY must be set");
  }
  if (!from) throw new Error("sendMail: 'from' is required");
  if (!to) throw new Error("sendMail: 'to' is required");

  const body = { from: fromName ? `${fromName} <${from}>` : from, subject };

  const toList = toRecipients(to);
  if (toList.length) body.to = toList;

  const bccList = toRecipients(bcc);
  if (bccList.length) body.bcc = bccList;

  if (html) body.html = html;
  if (text) body.text = text;
  if (replyTo) body.reply_to = replyTo;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return { messageId: data.id };
};
