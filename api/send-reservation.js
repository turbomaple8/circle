const nodemailer = require("nodemailer");
const dns = require("dns");

// Force Node to resolve DNS fresh (workaround for Vercel EBUSY)
dns.setDefaultResultOrder("ipv4first");

const BACKEND_API_URL = process.env.BACKEND_API_URL || "https://coliville-api-626057356331.us-east1.run.app";
const BACKEND_PROJECT_ID = process.env.BACKEND_PROJECT_ID || "circle";

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: { servername: "mail.privateemail.com", rejectUnauthorized: true },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

async function sendWithRetry(transporter, mailOptions, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await sendWithRetry(transporter, mailOptions);
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { fullName, email, phone, moveInDate, property, propertySlug, roomName } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(400).json({ success: false, message: "Missing required fields: fullName, email, phone" });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const expiresFormatted = expiresAt.toLocaleString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit", timeZoneName: "short",
    });

    // 1. Send email to admin (info@circlestay.ca)
    const transporter = createTransporter();

    await sendWithRetry(transporter, {
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO || "info@circlestay.ca",
      replyTo: email,
      subject: `Circle — Instant Reservation - ${property || "General"} - ${fullName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
          <h2 style="color: #8b7355; border-bottom: 3px solid #8b7355; padding-bottom: 10px;">
            New Instant Reservation (24h Hold)
          </h2>
          <div style="background: linear-gradient(135deg, #fff3e0, #fff8e1); padding: 16px 20px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #ff9800;">
            <p style="margin: 0; color: #e65100; font-weight: bold;">This reservation expires on ${expiresFormatted}</p>
            <p style="margin: 4px 0 0; color: #bf360c; font-size: 13px;">Follow up quickly to convert this into a booking.</p>
          </div>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1a1a2e;">Contact Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666; width: 35%;"><strong>Full Name:</strong></td><td>${fullName}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td><td><a href="mailto:${email}" style="color: #8b7355;">${email}</a></td></tr>
              <tr><td style="padding: 8px 0; color: #666;"><strong>Phone:</strong></td><td>${phone}</td></tr>
            </table>
          </div>
          <div style="background-color: #f5f0eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1a1a2e;">Reservation Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666; width: 35%;"><strong>Property:</strong></td><td>${property || "Not specified"}</td></tr>
              ${roomName ? `<tr><td style="padding: 8px 0; color: #666;"><strong>Room:</strong></td><td>${roomName}</td></tr>` : ""}
              <tr><td style="padding: 8px 0; color: #666;"><strong>Move-in Date:</strong></td><td>${moveInDate || "Not specified"}</td></tr>
            </table>
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd; color: #999; font-size: 12px;">
            <p>Submitted via circlestay.ca</p>
            <p>
              <a href="mailto:${email}" style="color: #8b7355;">Reply</a>
              ${phone ? ` · <a href="https://wa.me/${phone.replace(/[^0-9]/g, "")}" style="color: #25D366;">WhatsApp</a>` : ""}
            </p>
          </div>
        </div>
      `,
    });

    // 2. Send confirmation email to customer
    await sendWithRetry(transporter, {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Your Room is Reserved - ${property || "Circle Stay"} (24-Hour Hold)`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #8b7355, #6b5740); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Your Room is Reserved!</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 15px;">24-hour hold confirmed</p>
          </div>
          <div style="padding: 32px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none;">
            <p style="color: #374151; font-size: 15px; line-height: 1.6;">Hi ${fullName.split(" ")[0]},</p>
            <p style="color: #374151; font-size: 15px; line-height: 1.6;">
              Great news! Your room${property ? ` at <strong>${property}</strong>` : ""} has been reserved for 24 hours. No payment was charged.
            </p>
            <div style="background: #f5f0eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <h3 style="margin: 0 0 12px; color: #1a1a2e; font-size: 15px;">Reservation Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${property ? `<tr><td style="padding: 6px 0; color: #6b7280; width: 40%;">Property</td><td style="font-weight: 500;">${property}</td></tr>` : ""}
                ${roomName ? `<tr><td style="padding: 6px 0; color: #6b7280;">Room</td><td style="font-weight: 500;">${roomName}</td></tr>` : ""}
                ${moveInDate ? `<tr><td style="padding: 6px 0; color: #6b7280;">Move-in</td><td style="font-weight: 500;">${moveInDate}</td></tr>` : ""}
                <tr><td style="padding: 6px 0; color: #6b7280;">Hold expires</td><td style="color: #e65100; font-weight: 600;">${expiresFormatted}</td></tr>
              </table>
            </div>
            <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>What happens next?</strong><br/>
                A member of our team will reach out shortly to help you complete your booking. If not confirmed within 24 hours, the reservation is automatically released.
              </p>
            </div>
            <p style="color: #6b7280; font-size: 13px;">Questions? Reply to this email or reach us on WhatsApp.</p>
          </div>
          <div style="padding: 20px 32px; background: #f9fafb; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">Circle Stay — Co-Living in Toronto</p>
          </div>
        </div>
      `,
    });

    // 3. Forward to backend for dashboard tracking (fire-and-forget)
    try {
      await fetch(`${BACKEND_API_URL}/v1/public/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Project-Id": BACKEND_PROJECT_ID },
        body: JSON.stringify({
          fullName, email, phone, moveInDate: moveInDate || null,
          property: property || null, propertySlug: propertySlug || null,
          roomName: roomName || null, sourceWebsite: "circlestay.ca", city: "Toronto",
        }),
      });
    } catch (err) {
      console.error("[Circle] Backend forwarding failed:", err);
    }

    return res.status(200).json({ success: true, message: "Reservation confirmed" });
  } catch (error) {
    console.error("[Circle] Reservation error:", error);
    return res.status(500).json({ success: false, message: "Failed to process reservation", debug: error.message });
  }
};
