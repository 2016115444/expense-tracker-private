import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors()); // Allow frontend requests

const TOKEN = "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"; // Keep this secret
const REPO = "2016115444/expense-tracker-private";
const FILE_PATH = "expenses.json";
const BRANCH = "main"; // or master

// Get current file SHA
async function getFileSHA() {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`, {
    headers: { Authorization: `token ${TOKEN}` }
  });
  const data = await res.json();
  return data.sha;
}

// Update JSON file
app.post("/update-expenses", async (req, res) => {
  const expenses = req.body.expenses;

  try {
    const sha = await getFileSHA();
    const content = Buffer.from(JSON.stringify(expenses, null, 2)).toString("base64");

    const response = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
      method: "PUT",
      headers: {
        "Authorization": `token ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Update expenses",
        content: content,
        sha: sha,
        branch: BRANCH
      })
    });

    const result = await response.json();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Backend running on http://localhost:3000"));
