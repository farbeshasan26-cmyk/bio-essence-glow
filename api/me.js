import crypto from "crypto";

function createToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");

  const secret = process.env.SESSION_SECRET;

  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");

  return `${data}.${signature}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const { phone, password } = req.body || {};

  const workerId = process.env.WORKER_ID;
  const workerPassword = process.env.WORKER_PASSWORD;

  const adminId = process.env.ADMIN_ID;
  const adminPassword = process.env.ADMIN_PASSWORD;

  let user = null;

  if (phone === adminId && password === adminPassword) {
    user = {
      id: phone,
      name: "Administrator",
      role: "admin",
      balance: 0,
      pending_balance: 0
    };
  } else if (phone === workerId && password === workerPassword) {
    user = {
      id: phone,
      name: "Worker",
      role: "worker",
      balance: 0,
      pending_balance: 0
    };
  }

  if (!user) {
    return res.status(401).json({
      error: "ভুল Worker ID অথবা Password"
    });
  }

  const token = createToken(user);

  res.setHeader(
    "Set-Cookie",
    `session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`
  );

  return res.status(200).json({
    role: user.role
  });
}
