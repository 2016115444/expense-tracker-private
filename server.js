import express from "express";
import fetch from "node-fetch";
import cors from "cors";
const app = express();
app.use(express.json());
app.use(
  cors({
    origin:
      "https://2016115444.github.io/expense-tracker-private/expense-tracker-test.html",
  })
);
// --- Minimal changes start here ---
// 1) Read token from env (don't hardcode in code)
//    export GH_TOKEN="ghp_xxx..."
const TOKEN = process.env.GH_TOKEN;
if (!TOKEN) {
  console.warn(
    "Warning: GH_TOKEN is not set. Set it in your environment for GitHub API auth."
  );
}
const REPO = "2016115444/expense-tracker-private";
const FILE_PATH = "expenses.json";
const BRANCH = "main"; // or "master"
// Common GitHub headers (adds Accept + API version)
const GH_HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};
// Get current file SHA (needed for safe update)
async function getFileSHA() {
  const url = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
  const res = await fetch(url, { headers: GH_HEADERS });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get SHA: ${res.status} ${res.statusText}\n${text}`);
  }
  const data = await res.json();
  return data.sha;
}
// Update JSON file (overwrites with provided "expenses")
app.post("/update-expenses", async (req, res) => {
  const expenses = req.body.expenses;
  if (!Array.isArray(expenses)) {
    return res.status(400).json({ error: "Body must include 'expenses' as an array." });
  }
  try {
    const sha = await getFileSHA();
    // Prepare new content (pretty-printed JSON) in Base64
    const content = Buffer.from(JSON.stringify(expenses, null, 2)).toString("base64");
    // PUT to GitHub "Create or update file contents" endpoint
    const url = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;
    const payload = {
      message: "Update expenses",
      content,
      sha,          // required for updates; omit if creating a new file
      branch: BRANCH,
    };
    const response = await fetch(url, {
      method: "PUT",
      headers: { ...GH_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      console.error("GitHub API error:", result);
      return res.status(response.status).json({ error: result });
    }
    // Success: forward GitHub's response (includes commit + file urls)
    return res.json(result);
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: String(err) });
  }
});
// --- Minimal changes end here ---
app.listen(3000, () => console.log("Backend running on https://localhost:3000"));
