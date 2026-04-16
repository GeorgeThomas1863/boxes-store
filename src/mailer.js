export const sendMail = async ({ from, to, bcc, subject, html, text, replyTo }) => {
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    throw new Error("sendMail: MAILGUN_API_KEY and MAILGUN_DOMAIN must be set");
  }
  if (!from) throw new Error("sendMail: 'from' is required");
  if (!to && !bcc) throw new Error("sendMail: at least one of 'to' or 'bcc' is required");

  const params = new URLSearchParams();

  params.append("from", from);
  if (to) params.append("to", to);
  params.append("subject", subject);
  if (html) params.append("html", html);
  if (text) params.append("text", text);
  if (bcc) {
    if (Array.isArray(bcc)) bcc.forEach((addr) => params.append("bcc", addr));
    else params.append("bcc", bcc);
  }
  if (replyTo) params.append("h:Reply-To", replyTo);

  const credentials = Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString("base64");

  const response = await fetch(
    `https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${credentials}` },
      body: params,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mailgun error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return { messageId: data.id };
};
