import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "LOsEWhXvFup41WFZWMyMZtUwqGFWws583/YbGvEGtADMlAEfw1kJoc61miQlxR155ayovX2w+wQnWAAUGqKInRMkg43XgFvxcXoo8QkbPbDOso+a0PpwwBQDFUjQYF9LIuiemAo9f/iqKRxsJh6UXgdB04t89/1O/w1cDnyilFU=";
const LINE_GROUP_ID = process.env.LINE_GROUP_ID || "C94ac0eec7f7dc7b97fd2767104d1e7a0";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API to push LINE Flex Message
  app.post("/api/line/push", async (req, res) => {
    try {
      const { flexMessage, channelAccessToken, groupId } = req.body;

      if (!flexMessage) {
        return res.status(400).json({ error: "Missing flexMessage payload" });
      }

      const activeToken = channelAccessToken || LINE_CHANNEL_ACCESS_TOKEN;
      const activeGroupId = groupId || LINE_GROUP_ID;

      const response = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          to: activeGroupId,
          messages: [flexMessage],
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("LINE API Error:", response.status, errData);
        
        let customMessage = "LINE API Error";
        if (errData.message === "Failed to send messages") {
          customMessage = "Push Failed: บอทยังไม่ได้เข้าร่วมกลุ่ม (ยังไม่ถูกเชิญเข้ากลุ่ม) หรือ Group ID ที่ระบุไม่ถูกต้อง";
        } else if (errData.details) {
          customMessage = `Push Failed: รูปแบบ Flex JSON ไม่ถูกต้อง (${errData.message})`;
        }

        return res.status(response.status).json({ 
          error: customMessage, 
          details: errData 
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Push Error:", error);
      res.status(500).json({ error: error?.message || "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // @ts-ignore - catch all for Express 4/5
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
