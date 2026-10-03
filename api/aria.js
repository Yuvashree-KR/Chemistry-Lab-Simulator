import { ai } from "hatchable";

export const access = "public";
export const methods = ["POST"];

export default async function (req, res) {
  const body = req.body || {};
  const puzzle = typeof body.puzzle === "string" ? body.puzzle.slice(0, 1200) : "";
  const progress = typeof body.progress === "string" ? body.progress.slice(0, 1000) : "";
  const attempts = Number.isFinite(body.attempts) ? body.attempts : 0;
  if (!puzzle) return res.status(400).json({ error: "Puzzle context is required." });

  try {
    const result = await ai.generateText({
      model: "haiku",
      purpose: "aria-hint",
      maxTokens: 120,
      system: "You are ARIA, the Artificial Research Intelligence Assistant in a cooperative sci-fi escape room. Give one short atmospheric hint. Never reveal the exact answer unless the team is clearly stuck. Encourage communication. Never invent clues.",
      prompt: "Puzzle: " + puzzle + "\nTeam progress: " + progress + "\nFailed attempts: " + attempts + "\nReturn only ARIA's spoken hint in 1-2 sentences."
    });
    res.json({ hint: result.text || "Your team has the information you need. Compare what each player can see." });
  } catch (error) {
    res.status(503).json({ hint: "Team synchronization recommended. Compare your clues before trying another input.", fallback: true });
  }
}