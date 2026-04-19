const toRecipients = (val) => {
  if (!val) return [];
  const list = Array.isArray(val) ? val : val.split(",").map((s) => s.trim()).filter(Boolean);
  return list.map((email) => ({ email }));
};

export const sendMail = async ({ from, to, bcc, subject, html, text, replyTo }) => {
  if (!process.env.MAILERSEND_API_KEY) {
    throw new Error("sendMail: MAILERSEND_API_KEY must be set");
  }
  if (!from) throw new Error("sendMail: 'from' is required");
  if (!to && !bcc) throw new Error("sendMail: at least one of 'to' or 'bcc' is required");

  const body = { from: { email: from }, subject };

  const toList = toRecipients(to);
  if (toList.length) body.to = toList;

  const bccList = toRecipients(bcc);
  if (bccList.length) body.bcc = bccList;

  if (html) body.html = html;
  if (text) body.text = text;
  if (replyTo) body.reply_to = { email: replyTo };

  const response = await fetch("https://api.mailersend.com/v1/email", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MAILERSEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MailerSend error ${response.status}: ${errorText}`);
  }

  return { messageId: response.headers.get("X-Message-Id") };
};
