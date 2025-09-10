// pages/api/upload.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// --- S3Client (Cloudflare R2) 設定 ---
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!, // ex: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fileName, contentType, dir } = req.body as {
      fileName?: string;
      contentType?: string;
      dir?: string;
    };

    if (!fileName || !contentType) {
      return res.status(400).json({ error: "Missing fileName or contentType" });
    }

    // 任意のディレクトリ指定（例: "microcms-blog/images"）
    const safeDir = dir ? dir.replace(/\/+$/, "") + "/" : "";
    const key = `${safeDir}${fileName}`;

    // PutObjectCommand に署名をつける
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      ContentType: contentType,
    });

    // 署名URL（5分有効）
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });

    // 公開アクセス用のURL
    const base = process.env.NEXT_PUBLIC_R2_BUCKET_URL!.replace(/\/+$/, "");
    const publicUrl = `${base}/${key}`;

    return res.status(200).json({ signedUrl, key, publicUrl });
  } catch (err) {
    console.error("upload.ts error:", err);
    return res.status(500).json({ error: "Failed to generate signed URL" });
  }
}