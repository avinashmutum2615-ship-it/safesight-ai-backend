import express from "express";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { auth } from "../../middleware/auth.js";
import { authorize } from "../../middleware/authorize.js";
const router = express.Router();
async function chat(req, res) {
  if (!(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY))
    return res
      .status(503)
      .json({
        success: false,
        message:
          "AI assistance is not configured. Please use the booking form or staff dashboard.",
      });
  if (
    typeof req.body.message !== "string" ||
    !req.body.message.trim() ||
    req.body.message.length > 4000
  )
    return res
      .status(400)
      .json({
        success: false,
        message: "Enter a message of 1–4000 characters.",
      });
  try {
    const role = req.params.role;
    const owner = req.user?.id || "public";
    let thread;
    if (req.body.threadId) {
      const claims = jwt.verify(req.body.threadId, process.env.JWT_SECRET);
      if (
        claims.owner !== owner ||
        claims.role !== role ||
        claims.purpose !== "chat"
      )
        throw new Error("Invalid conversation.");
      thread = claims.thread;
    } else thread = randomUUID();
    const threadId = jwt.sign(
      { owner, role, thread, purpose: "chat" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" },
    );
    const { chatbotGraph } = await import("../../ai/graph/index.js");
    const { HumanMessage } = await import("@langchain/core/messages");
    const user = {
      id: owner,
      role: req.user?.role || "public",
      name: req.user?.name || "Guest",
    };
    const result = await chatbotGraph.invoke(
      { messages: [new HumanMessage(req.body.message.trim())] },
      {
        configurable: {
          thread_id: `${role}:${owner}:${thread}`,
          agent: role,
          user,
        },
        recursionLimit: 12,
      },
    );
    const content = result.messages.at(-1).content;
    res.json({
      success: true,
      threadId,
      response:
        typeof content === "string"
          ? content
          : content
              .filter((x) => x.type === "text")
              .map((x) => x.text)
              .join("\n"),
    });
  } catch (error) {
    console.error("AI request failed:", error.name);
    res
      .status(502)
      .json({
        success: false,
        message:
          "The AI assistant is unavailable. Start a new conversation or use the clinic forms.",
      });
  }
}
router.post(
  "/:role/chat",
  (req, res, next) => {
    if (req.params.role === "public") return next();
    if (!["doctor", "receptionist"].includes(req.params.role))
      return res.sendStatus(404);
    auth(req, res, () => authorize(req.params.role)(req, res, next));
  },
  chat,
);
export { router as chatRouter };
