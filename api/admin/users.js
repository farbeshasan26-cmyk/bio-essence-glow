export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cookie = req.headers.cookie || "";

  if (!cookie.includes("admin_session=")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return res.status(500).json({ error: "Supabase environment variables missing" });
  }

  const r = await fetch(
    `${url}/rest/v1/workers?select=id,full_name,phone,status`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    }
  );

  if (!r.ok) {
    return res.status(500).json({ error: "Could not load workers" });
  }

  const workers = await r.json();

  const result = workers.map(x => ({
    id: x.id,
    name: x.full_name,
    phone: x.phone,
    status: x.status
  }));

  return res.status(200).json(result);
}
