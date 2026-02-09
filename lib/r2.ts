import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

function getR2Config() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("R2 storage env is incomplete");
  }

  return { endpoint, accessKeyId, secretAccessKey, bucket };
}

/**
 * Upload a base64-encoded image to R2 and return a key reference.
 * The returned value is prefixed with "r2:" to identify it as an R2 key.
 */
export async function uploadImage(
  base64Data: string,
  folder: string = "visits"
): Promise<string> {
  const { endpoint, accessKeyId, secretAccessKey, bucket } = getR2Config();
  const r2 = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  // Parse data URL or raw base64
  let contentType = "image/jpeg";
  let base64 = base64Data;

  if (base64Data.startsWith("data:")) {
    const match = base64Data.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      contentType = match[1];
      base64 = match[2];
    }
  }

  const buffer = Buffer.from(base64, "base64");
  const ext = contentType.split("/")[1] || "jpg";
  const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `r2:${key}`;
}
