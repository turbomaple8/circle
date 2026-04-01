const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
const nodemailer = require("nodemailer");

const BACKEND_API_URL = process.env.BACKEND_API_URL || "https://coliville-api-626057356331.us-east1.run.app";
const BACKEND_PROJECT_ID = process.env.BACKEND_PROJECT_ID || "circle";

async function createTransporter() {
  let host = process.env.SMTP_HOST || "mail.privateemail.com";
  try {
    const { resolve4 } = require("dns").promises;
    const ips = await resolve4(host);
    if (ips.length > 0) host = ips[0];
  } catch {}
  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    tls: { servername: "mail.privateemail.com", rejectUnauthorized: true },
    connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 20000,
  });
}

async function sendWithRetry(transporter, mailOptions, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try { return await sendWithRetry(transporter, mailOptions); }
    catch (err) { if (i === retries) throw err; await new Promise(r => setTimeout(r, 500 * (i + 1))); }
  }
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { name, email, phone, property, date, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "-";

    const transporter = await createTransporter();

    // Email to admin
    await sendWithRetry(transporter, {
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO || "info@circlestay.ca",
      replyTo: email,
      subject: `Circle — Tour Request - ${property || "General"} - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
          <h2 style="color: #8b7355; border-bottom: 3px solid #8b7355; padding-bottom: 10px;">Tour Request</h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1a1a2e;">Contact</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666; width: 35%;"><strong>Name:</strong></td><td>${name}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td><td><a href="mailto:${email}">${email}</a></td></tr>
              ${phone ? `<tr><td style="padding: 8px 0; color: #666;"><strong>Phone:</strong></td><td>${phone}</td></tr>` : ""}
            </table>
          </div>
          <div style="background-color: #f5f0eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1a1a2e;">Tour Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${property ? `<tr><td style="padding: 8px 0; color: #666; width: 35%;"><strong>Property:</strong></td><td>${property}</td></tr>` : ""}
              ${date ? `<tr><td style="padding: 8px 0; color: #666;"><strong>Preferred Date:</strong></td><td>${date}</td></tr>` : ""}
            </table>
            ${message ? `<div style="margin-top: 12px; padding: 12px; background: #fff; border-radius: 6px;"><strong>Notes:</strong><br/>${message}</div>` : ""}
          </div>
          <div style="color: #999; font-size: 12px; border-top: 2px solid #ddd; padding-top: 15px;">
            <p>Submitted via circlestay.ca</p>
          </div>
        </div>
      `,
    });

    // Confirmation to visitor
    await sendWithRetry(transporter, {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Tour Request Received — Circle Stay`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #8b7355, #6b5740); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Tour Scheduled!</h1>
          </div>
          <div style="padding: 32px; background: #fff; border: 1px solid #e5e7eb; border-top: none;">
            <p style="color: #374151; font-size: 15px;">Hi ${firstName},</p>
            <p style="color: #374151; font-size: 15px;">We've received your tour request${property ? ` for <strong>${property}</strong>` : ""}. Our team will reach out within 24 hours to confirm your visit.</p>
            <p style="color: #6b7280; font-size: 13px;">Questions? Reply to this email.</p>
          </div>
          <div style="padding: 20px; background: #f9fafb; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">Circle Stay — Co-Living in Toronto</p>
          </div>
        </div>
      `,
    });

    // Backend forwarding
    try {
      await fetch(`${BACKEND_API_URL}/v1/public/tour-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Project-Id": BACKEND_PROJECT_ID },
        body: JSON.stringify({
          firstName, lastName, email, phone: phone || null,
          property: property || null, date: date || "", time: "morning",
          notes: message || null, sourceWebsite: "circlestay.ca", city: "Toronto",
        }),
      });
    } catch (err) {
      console.error("[Circle] Backend forwarding failed:", err);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Circle] Tour error:", error);
    return res.status(500).json({ success: false, message: "Failed to process tour request" });
  }
};
