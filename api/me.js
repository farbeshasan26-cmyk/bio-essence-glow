import crypto from "crypto";

function getCookie(req, name) {
  const cookies = req.headers.cookie || "";

  const parts = cookies.split(";").map(x => x.trim());

  for (const part of parts) {
    const index = part.indexOf("=");

    if (index === -1) continue;

    const key = part.substring(0, index);
    const value = part.substring(index + 1);

    if (key === name) {
      return value;
    }
  }

  return null;
}

function verifyToken(token) {
  if (!token) return null;

  const secret = process.env.SESSION_SECRET;

  const parts = token.split(".");

  if (parts.length !== 2) return null;

  const [data, signature] = parts;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");

  if (signature !== expected) return null;

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

  const token = getCookie(req, "session");

  const user = verifyToken(token);

  if (!user) {
    return res.status(401).json({
      error: "আপনি Login করা নেই"
    });
  }

  return res.status(200).json(user);
}
