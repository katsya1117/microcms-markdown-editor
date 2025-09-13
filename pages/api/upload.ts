import type { NextApiRequest, NextApiResponse } from "next";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fileName, contentType } = req.body;

    if (!fileName || !contentType) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    // 保存先を一律で images/ 配下にする
    const key = `images/${fileName}`;

    // PutObjectCommand を作成
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      ContentType: contentType,
    });

    // getSignedUrl を使って署名付きURLを生成
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
    console.log("DEBUG Key:", key);

    // 公開URLを組み立て
    const publicUrl = `${process.env.NEXT_PUBLIC_R2_BUCKET_URL}/${key}`;

    res.status(200).json({ signedUrl, publicUrl });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to create signed URL" });
  }
}