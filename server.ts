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

const MODULE_FOLDER_MAPPING: Record<string, string> = {
  "แจ้งซ่อม": "แจ้งซ่อม",
  "ส่งงานช่าง": "ส่งงานช่าง",
  "เติมน้ำมัน": "เติมน้ำมัน",
  "Check In GPS": "Checkin",
  "Checkin": "Checkin",
  "Check-In": "Checkin",
  "Check Out GPS": "Checkout",
  "Checkout": "Checkout",
  "Check-Out": "Checkout",
  "แนบเอกสาร": "แนบเอกสาร",
  "expenses": "แนบเอกสาร",
  "Expenses": "แนบเอกสาร"
};

function getThaiFormattedNow() {
  const d = new Date();
  // Adjust to UTC+7 (Thailand)
  const tzOffset = 7 * 60 * 60 * 1000;
  const localTime = new Date(d.getTime() + tzOffset);
  
  const yyyy = localTime.getUTCFullYear();
  const mm = String(localTime.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(localTime.getUTCDate()).padStart(2, "0");
  
  const hh = String(localTime.getUTCHours()).padStart(2, "0");
  const min = String(localTime.getUTCMinutes()).padStart(2, "0");
  const ss = String(localTime.getUTCSeconds()).padStart(2, "0");
  
  return {
    year: String(yyyy),
    month: mm,
    dateStr: `${yyyy}${mm}${dd}`,
    timeStr: `${hh}${min}${ss}`,
    fullDateTime: `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`
  };
}

async function getOrCreateFolder(drive: any, folderName: string, parentId: string): Promise<string> {
  const q = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`;
  const res = await drive.files.list({
    q,
    fields: "files(id)",
    spaces: "drive",
  });
  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id;
  }
  
  const fileMetadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    parents: [parentId]
  };
  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: "id"
  });
  return folder.data.id!;
}

// Function to upload to Google Drive
async function uploadToGoogleDrive(
  buffer: Buffer, 
  filename: string, 
  mimeType: string,
  moduleName: string
): Promise<{ success: boolean; url?: string; fileId?: string; error?: string }> {
  try {
    const GOOGLE_DRIVE_FOLDER_ID = "1yT9jpH63ZZCF-Dt5kz9rjKJfQv1pyC6m";
    
    // Auth client uses Application Default Credentials automatically or looks at environment variables
    const auth = new google.auth.GoogleAuth({
      scopes: [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/drive.file"
      ]
    });
    
    const drive = google.drive({ version: "v3", auth });
    
    // Organize cascade structure: Root -> Module Folder -> Year -> Month
    const dNow = getThaiFormattedNow();
    const folderLabel = MODULE_FOLDER_MAPPING[moduleName] || moduleName || "Other";
    
    const moduleFolderId = await getOrCreateFolder(drive, folderLabel, GOOGLE_DRIVE_FOLDER_ID);
    const yearFolderId = await getOrCreateFolder(drive, dNow.year, moduleFolderId);
    const finalFolderId = await getOrCreateFolder(drive, dNow.month, yearFolderId);

    const fileMetadata = {
      name: filename,
      parents: [finalFolderId]
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

// Helper to check if a token is a known expired/invalid token
function isStaleLineToken(token: string | undefined): boolean {
  if (!token) return true;
  const t = token.trim();
  return t === "" || t.includes("v5oSkyDH") || t.includes("LOsEWhXv");
}

// Helper to check if a group ID is a known expired/invalid group ID
function isStaleLineGroupId(groupId: string | undefined): boolean {
  if (!groupId) return true;
  const g = groupId.trim();
  return g === "" || g.includes("C94ac0eec7f7dc7b97fd2767104d1e7a0") || g === "C94ac0eec7f7dc7b97fd2767104d1e7a0";
}

const rawEnvToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const rawEnvGroupId = process.env.LINE_GROUP_ID;

const LINE_CHANNEL_ACCESS_TOKEN = isStaleLineToken(rawEnvToken)
  ? "emexPY8OBr3kHbSKKDRNh9W33tnL9dHqLxtD3Zqwx6fYBpy7UMv6BqU65FAJ8L1VhXdmqb7nE9H/AmyijvpPnNlcFgob0ET7ysPGosTEO33GgL6ccIn60mxibiOrEZ47yVH+EkKWcsTOX+RUhI7U6gdB04t89/1O/w1cDnyilFU="
  : rawEnvToken!.trim();

const LINE_GROUP_ID = isStaleLineGroupId(rawEnvGroupId)
  ? "Cfd9f3c46111cf32db3e3e69b6961fa3e"
  : rawEnvGroupId!.trim();

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
      const { image, module: moduleName = "Other", docId = "DOC", uploadBy = "System" } = req.body;
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

      // Format custom file name: ประเภทงาน_เลขที่เอกสาร_YYYYMMDD_HHMMSS.jpg
      const dNow = getThaiFormattedNow();
      const folderLabel = MODULE_FOLDER_MAPPING[moduleName] || moduleName;
      const sanitizedDocId = String(docId).replace(/[^a-zA-Z0-9-]/g, "_");
      const filename = `${folderLabel}_${sanitizedDocId}_${dNow.dateStr}_${dNow.timeStr}.jpg`;

      // Run Google Drive upload
      const driveResult = await uploadToGoogleDrive(buffer, filename, mimeType, moduleName);

      if (driveResult.success && driveResult.fileId) {
        photosMap.set(driveResult.fileId, { buffer, mimeType });
      }

      const responsePayload = {
        success: true,
        photoId,
        url: driveResult.success && driveResult.url ? driveResult.url : `/api/photo/${photoId}.jpg`,
        fileId: driveResult.success ? driveResult.fileId : `local_fallback_${photoId}`,
        fileName: filename,
        uploadDate: new Date().toISOString(),
        uploadBy,
        module: folderLabel,
        documentNo: docId,
        source: driveResult.success ? "google-drive" : "local-fallback"
      };

      res.json(responsePayload);
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

  // GET proxy endpoint to serve the Google Drive photo dynamically so LINE and other clients can fetch it directly
  app.get("/api/photo-proxy/:fileId", async (req, res) => {
    try {
      const fileIdClean = req.params.fileId.replace(/\.[^/.]+$/, ""); // Remove extension like .jpg
      
      // Serve from memory cache if available (super fast!)
      const memoryPhoto = photosMap.get(fileIdClean);
      if (memoryPhoto) {
        res.set("Content-Type", memoryPhoto.mimeType);
        res.set("Cache-Control", "public, max-age=604800"); // Cache for 7 days
        return res.send(memoryPhoto.buffer);
      }

      // If not in memory, fetch directly from Google's public high-speed image CDN
      const targetUrl = `https://lh3.googleusercontent.com/d/${fileIdClean}`;
      console.log(`[Photo Proxy] Fetching public user content from Drive URL: ${targetUrl}`);
      
      const response = await fetch(targetUrl);
      if (!response.ok) {
        throw new Error(`Failed to download from Drive CDN. Status: ${response.status}`);
      }
      
      const mimeType = response.headers.get("content-type") || "image/jpeg";
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Cache in memory for subsequent loads
      photosMap.set(fileIdClean, { buffer, mimeType });

      res.set("Content-Type", mimeType);
      res.set("Cache-Control", "public, max-age=604800"); // Cache for 7 days
      res.send(buffer);
    } catch (error: any) {
      console.error("Serve photo proxy error:", error);
      res.status(404).send("Photo proxy not found or accessible");
    }
  });

  // GET endpoint to list all employee photo files from Google Drive folder
  app.get("/api/drive-employees", async (req, res) => {
    try {
      const GOOGLE_DRIVE_FOLDER_ID = "1yT9jpH63ZZCF-Dt5kz9rjKJfQv1pyC6m";
      const folderUrl = `https://drive.google.com/drive/folders/${GOOGLE_DRIVE_FOLDER_ID}`;
      console.log(`[Drive Service] Scraping and parsing public photo folder: ${folderUrl}`);

      const htmlResponse = await fetch(folderUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
      });

      if (!htmlResponse.ok) {
        throw new Error(`Google Drive folder web request failed: ${htmlResponse.statusText}`);
      }

      const html = await htmlResponse.text();
      
      // Parse file IDs and names using direct matching
      const r1 = /data-id="([a-zA-Z0-9_-]{25,50})"[^>]*?data-tooltip="([^"]+?)"/g;
      let match;
      const files: { id: string; name: string }[] = [];
      const seenIds = new Set<string>();

      while ((match = r1.exec(html)) !== null) {
        const [_, id, tooltip] = match;
        const filename = tooltip.replace(/\s+Image$/, "").trim();
        const isImage = filename.toLowerCase().match(/\.(jpe?g|png|gif|webp)$/);
        
        if (isImage && !seenIds.has(id)) {
          seenIds.add(id);
          files.push({ id, name: filename });
        }
      }

      console.log(`[Drive Service] Parsed ${files.length} valid employee pictures from public Drive page.`);

      const roleMap: Record<string, string> = {
        "Admin2.ชัยนาวิน": "แอดมินฝ่ายประสานงานกลาง",
        "AE.ชัยนาวิน (บิว)": "เจ้าหน้าที่ฝ่ายประสานงานขาย (AE)",
        "BIWTY": "เจ้าหน้าที่สนับสนุนโครงการ (บิวตี้)",
        "chalwat": "ช่างเทคนิคและวิศวกรซ่อมคุมงาน",
        "cnw.นำหน้า": "โฟร์แมนนำทีมเครื่องจักรชัยนาวิน",
        "Max": "หัวหน้าฝ่ายเทคโนโลยีสนาม (แม็กซ์)",
        "Non. นนทนันท์ 5": "ผู้ช่วยช่างควบคุมเครื่องเกรดเบอร์ 5",
        "Sitthichai. wongdee": "ช่างคุมระบบไฟฟ้าและเครื่องกำเนิดไฟ",
        "WAVE": "ช่างซ่อมบำรุงและเครื่องยนต์ดีเซล",
        "^ SONGPON ^": "ช่างควบคุมเครื่องขุดระดับสูง (ทรงพล)",
        "ช.ชาย เด็กผู้พันตรี": "ช่างคุมงานตักลานหินบด",
        "ธชัย สระทองเขียว": "โฟร์แมนควบคุมกะก่อสร้างงานดิน",
        "นา": "แอดมินการเงินและตรวจสอบเวลา",
        "ยศ": "เจ้าหน้าที่สโตร์ส่วนภูมิภาค",
        "สุธา ภูชะหาร": "ผู้ดูแลกะคนขับรถพ่วงและหัวลาก",
        "อั้ม. อนุสรณ์": "ฝ่ายซ่อมบำรุงหนักและยางเครื่องคลาน",
        "เกด 24": "ผู้จัดการแอดมินบริหารงานบุคคล",
        "เป๊ก": "พนักงานขับรถส่งเครื่องจักรกลหนัก",
        "เหว่า": "ช่างเทคนิคซ่อมรถเกรดเดอร์ปูผิว",
        "๕ กัลยา": "ฝ่ายจัดการบัญชีเจ้าหนี้ (กัลยา)",
        "Benz o Nares": "วิศวกรควบคุมงานขุดเขื่อนระเบิดหิน"
      };

      function findMatchingRole(filename: string): string {
        const cleanName = filename.replace(/\.[^/.]+$/, "").trim();
        if (roleMap[cleanName]) return roleMap[cleanName];

        const normalizedFile = cleanName.toLowerCase().replace(/[^a-zA-Z0-9ก-๙]/g, "");
        for (const presetName of Object.keys(roleMap)) {
          const normalizedPreset = presetName.toLowerCase().replace(/[^a-zA-Z0-9ก-๙]/g, "");
          if (normalizedFile === normalizedPreset || normalizedFile.includes(normalizedPreset) || normalizedPreset.includes(normalizedFile)) {
            return roleMap[presetName];
          }
        }
        return "พนักงานทั่วไป/ช่างเทคนิค";
      }

      const employees = files.map(file => {
        const cleanName = file.name ? file.name.replace(/\.[^/.]+$/, "").trim() : "";
        const role = findMatchingRole(file.name || "");
        const photoUrl = `/api/photo-proxy/${file.id}.jpg`;
        
        return {
          id: file.id,
          name: cleanName,
          role: role,
          photoUrl: photoUrl
        };
      });

      // Filter out any entries without valid names
      const validEmployees = employees.filter(e => e.name.length > 0);

      console.log(`[Drive Service] Successfully resolved ${validEmployees.length} employees.`);
      res.json({ success: true, count: validEmployees.length, employees: validEmployees });
    } catch (error: any) {
      console.error("List employees from Google Drive folder failed:", error);
      res.status(500).json({ success: false, error: error?.message || String(error) });
    }
  });

  // API to push LINE Flex Message
  app.post("/api/line/push", async (req, res) => {
    try {
      const { flexMessage, channelAccessToken, groupId } = req.body;

      if (!flexMessage) {
        return res.status(400).json({ error: "Missing flexMessage payload" });
      }

      const activeToken = String(channelAccessToken || LINE_CHANNEL_ACCESS_TOKEN).trim();
      const activeGroupId = String(groupId || LINE_GROUP_ID).trim();

      console.log(`[LINE Service] Initiating push. Token prefix: ${activeToken.slice(0, 8)}...${activeToken.slice(-8)} (Len: ${activeToken.length}), Group ID: ${activeGroupId}`);

      // Auto-wrap flexMessage if it is not already wrapped in a "type": "flex" structure
      let finalMessage = flexMessage;
      if (flexMessage && flexMessage.type !== "flex") {
        finalMessage = {
          type: "flex",
          altText: flexMessage.altText || "📢 แจ้งเตือนจาก FlowWork",
          contents: flexMessage
        };
      }

      const response = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          to: activeGroupId,
          messages: [finalMessage],
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("LINE API Error:", response.status, errData);
        
        let customMessage = "LINE API Error";
        if (activeToken.startsWith("emexPY8OBr3") || activeGroupId === "Cfd9f3c46111cf32db3e3e69b6961fa3e") {
          customMessage = "🔴 ใช้รหัสระบบตัวอย่าง: กรุณาระบุรหัส Token และ Group ID กลุ่มแชทไลน์ของคุณเองในเมนู 'ตั้งค่ากลุ่มไลน์แจ้งเตือน' จากนั้นเชิญ LINE Bot (OA) เข้าร่วมกลุ่มแชทก่อนทดสอบใช้งาน";
        } else if (errData.message === "Failed to send messages") {
          customMessage = "Push Failed: บอทยังไม่ได้เข้าร่วมกลุ่ม (ยังไม่ถูกเชิญเข้ากลุ่มไลน์) หรือระบุรหัส Group ID ไม่ถูกต้อง กรุณาเข้ากลุ่ม ➡️ กดเมนูขวาบน ➡️ เชิญบ็อต (LINE Bot OA คู่ตัว) เข้าร่วมกลุ่มก่อนทำการแจ้งเตือน";
        } else if (errData.details) {
          customMessage = `Push Failed: รูปแบบ Flex JSON ไม่ถูกต้อง (${errData.message})`;
        } else {
          customMessage = `Failed to send LINE message: ${errData.message || response.statusText}`;
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
