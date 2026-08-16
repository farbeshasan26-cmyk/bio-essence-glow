import crypto from "crypto";

function getCookie(req, name) {
  const cookies = req.headers.cookie || "";

  for (const part of cookies.split(";")) {
    const item = part.trim();
    const index = item.indexOf("=");

    if (index === -1) continue;

    const key = item.slice(0, index);
    const value = item.slice(index + 1);

    if (key === name) {
      return decodeURIComponent(value);
    }
  }

  return null;
}

function verifyToken(token) {
  if (!token) return null;

  const secret = process.env.SESSION_SECRET;

  if (!secret) return null;

  const parts = token.split(".");

  if (parts.length !== 2) return null;

  const [data, signature] = parts;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");

  try {
    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected)
      )
    ) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    return JSON.parse(
      Buffer.from(data, "base64url").toString("utf8")
    );
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const token = getCookie(req, "session");

    const user = verifyToken(token);

    if (!user) {
      return res.status(401).json({
        error: "আপনি Login করা নেই"
      });
    }

    return res.status(200).json({
      ok: true,
      id: user.id,
      name: user.name,
      role: user.role,
      balance: Number(user.balance || 0),
      pending_balance: Number(
        user.pending_balance || 0
      )
    });

  } catch (error) {
    console.error("Me API error:", error);

    return res.status(500).json({
      error: "User information load করতে সমস্যা হয়েছে"
    });
  }
}
