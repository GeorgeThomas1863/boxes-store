import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const wantsJson = (req) => {
  if (req.path.endsWith("-route")) return true;
  const accept = req.get("Accept") || "";
  return accept.includes("application/json");
};

const requireAuth = (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.session.authenticated) return next();

  if (wantsJson(req)) {
    return res.status(401).json({ success: false, message: "Unauthorized", redirect: "/401" });
  }

  res.sendFile(path.join(__dirname, "..", "html", "auth.html"));
};

export default requireAuth;
