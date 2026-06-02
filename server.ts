import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import { Readable } from "stream";

// Helper to convert buffer to readable stream for googleapis file upload
function bufferToStream(buffer: Buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

// Function to upload to Google Drive
async function uploadToGoogleDrive(buffer: Buffer, filename: string, mimeType: string): Promise<{ success: boolean; url?: string; fileId?: string; error?: string }> {
  try {
    const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || "1HgfXlXZ4tzFOTQtpvVwG8FDOP0Wk1kje";
    
    // Auth client uses Application Default Credentials automatically or looks at environment variables
    const auth = new google.auth.GoogleAuth({
      scopes: [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/drive.file"
      ]
    });
    
    const drive = google.drive({ version: "v3", auth });
    
    const fileMetadata = {
      name: filename,
      parents: [GOOGLE_DRIVE_FOLDER_ID]
    };
    
    const media = {
      mimeType: mimeType,
      body: bufferToStream(buffer)
    };
    
    // Create the file on Google Drive
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id"
    });
    
    const fileId = file.data.id;
    if (!fileId) {
      throw new Error("Failed to retrieve file ID from Google Drive response.");
    }
    
    // Share file so it is publicly viewable: anyone with the link is a reader
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone"
      }
    });
    
    // Standard direct image embed link format for Google Drive
    const publicUrl = `https://drive.google.com/uc?id=${fileId}`;
    console.log(`Successfully uploaded to Google Drive! File ID: ${fileId}. URL: ${publicUrl}`);
    
    return {
      success: true,
      fileId,
      url: publicUrl
    };
  } catch (error: any) {
    console.warn("Google Drive API upload failed, falling back to local photo cache:", error);
    return {
      success: false,
      error: error?.message || String(error)
    };
  }
}

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "LOsEWhXvFup41WFZWMyMZtUwqGFWws583/YbGvEGtADMlAEfw1kJoc61miQlxR155ayovX2w+wQnWAAUGqKInRMkg43XgFvxcXoo8QkbPbDOso+a0PpwwBQDFUjQYF9LIuiemAo9f/iqKRxsJh6UXgdB04t89/1O/w1cDnyilFU=";
const LINE_GROUP_ID = process.env.LINE_GROUP_ID || "C94ac0eec7f7dc7b97fd2767104d1e7a0";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Custom parser with larger limit for base64 photo payloads
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ limit: "25mb", extended: true }));

  // In-memory cache to store base64 photos to serve them as valid public URLs so LINE servers can download them
  const photosMap = new Map<string, { buffer: Buffer; mimeType: string }>();

  // API to upload base64 photo and get a public URL
  app.post("/api/upload-photo", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image || !image.startsWith("data:")) {
        return res.status(400).json({ error: "Invalid image format. Must be base64 data URL." });
      }

      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: "Invalid base64 pattern." });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");
      
      const photoId = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      photosMap.set(photoId, { buffer, mimeType });

      // Run Google Drive upload
      const filename = `attendance_${photoId}.jpg`;
      const driveResult = await uploadToGoogleDrive(buffer, filename, mimeType);

      if (driveResult.success && driveResult.url) {
        return res.json({
          success: true,
          photoId,
          url: driveResult.url,
          source: "google-drive"
        });
      }

      // Fallback url
      res.json({ 
        success: true, 
        photoId,
        url: `/api/photo/${photoId}.jpg`,
        source: "local-fallback"
      });
    } catch (error: any) {
      console.error("Upload photo error:", error);
      res.status(500).json({ error: error?.message || "Internal server error" });
    }
  });

  // GET endpoint to serve the uploaded photos
  app.get("/api/photo/:photoId", (req, res) => {
    try {
      const photoIdClean = req.params.photoId.replace(/\.[^/.]+$/, ""); // Remove extension like .jpg
      const photo = photosMap.get(photoIdClean);
      if (!photo) {
        return res.status(404).send("Photo not found");
      }

      res.set("Content-Type", photo.mimeType);
      res.send(photo.buffer);
    } catch (error: any) {
      console.error("Serve photo error:", error);
      res.status(500).send("Internal server error");
    }
  });

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
