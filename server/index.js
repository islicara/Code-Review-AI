import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = "GEMINI API KEY"; // paste your key here

app.post("/review", async (req, res) => {
  const { code, language, reviewType } = req.body;

  const prompt = `You are an expert code reviewer. Review the following ${language} code with focus on: ${reviewType}.

Structure your response with:
1. A brief summary
2. Issues found, each labeled with severity: **Critical**, **Warning**, or **Info**
3. For each issue: what the problem is and how to fix it

Code to review:
\`\`\`${language.toLowerCase()}
${code}
\`\`\`

Be specific, actionable, and concise.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  res.json({ text });
});

app.listen(3001, () => console.log("Server running on http://localhost:3001"));