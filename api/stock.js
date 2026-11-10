// Vercel : api/stock.js — partage la liste des ruptures entre tous les appareils.
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const KEY = "midnight_stock";

async function redis(cmd) {
  const r = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: "Bearer " + TOKEN },
    body: JSON.stringify(cmd),
  });
  return (await r.json()).result;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") {
      const v = await redis(["GET", KEY]);
      return res.status(200).json({ out: v ? JSON.parse(v) : [] });
    }
    if (req.method === "POST") {
      if (!process.env.ADMIN_PIN || req.headers["x-admin-pin"] !== process.env.ADMIN_PIN) {
        return res.status(401).json({ error: "code incorrect" });
      }
      const body = req.body || {};
      const out = Array.isArray(body.out)
        ? body.out.filter((x) => typeof x === "string").slice(0, 100)
        : [];
      await redis(["SET", KEY, JSON.stringify(out)]);
      return res.status(200).json({ out });
    }
    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: "erreur serveur" });
  }
};
