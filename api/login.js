export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { phone, password } = req.body || {};

  const workerId = process.env.WORKER_ID;
  const workerPassword = process.env.WORKER_PASSWORD;

  const adminId = process.env.ADMIN_ID;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (phone === adminId && password === adminPassword) {
    return res.status(200).json({ role: "admin" });
  }

  if (phone === workerId && password === workerPassword) {
    return res.status(200).json({ role: "worker" });
  }

  return res.status(401).json({
    error: "ভুল Worker ID অথবা Password"
  });
}
