import {
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";
import formidable from "formidable";
import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!req.headers["content-type"]?.includes("multipart/form-data")) {
    res.status(400).send(undefined);
    return;
  }

  try {
    const { fileName, mimetype } = await uploadImage(req);

    res.status(200).json({
      fileName,
      mimetype,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send(undefined);
  }
}

const uploadImage = async (
  req: NextApiRequest
): Promise<{ fileName: string; mimetype: string }> => {
  const form = formidable({
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("upload timeout"));
    }, 60_000);

    form.parse(req, async (err, fields, files) => {
      clearTimeout(timeoutId);
      if (err) {
        reject(err);
        return;
      }

      // file: File | File[] | undefined
      const uploaded = files.file;
      if (!uploaded) {
        reject(new Error("imageFile not specified."));
        return;
      }
      const file: formidable.File = Array.isArray(uploaded)
        ? uploaded[0]
        : uploaded;

      // fileName: string | string[] | undefined
      const rawName = fields.fileName;
      if (!rawName) {
        reject(new Error("fileName not specified."));
        return;
      }
      const fileName: string = Array.isArray(rawName) ? rawName[0] : rawName;

      const filePath = fs.readFileSync(file.filepath);

      // R2 Client
      const client = new S3Client({
        endpoint: process.env.R2_ENDPOINT,
        region: "auto",
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY!,
          secretAccessKey: process.env.R2_SECRET_KEY!,
        },
      });

      const params: PutObjectCommandInput = {
        Bucket: process.env.NEXT_PUBLIC_BUCKET_NAME!,
        Key: fileName,
        ContentType: file.mimetype ?? "application/octet-stream",
        CacheControl: "public, max-age=31536000",
        Body: filePath,
      };

      await client.send(new PutObjectCommand(params));


      resolve({
        fileName,
        mimetype: file.mimetype ?? "application/octet-stream",
      });
    });
  });
};
