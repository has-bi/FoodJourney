import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

function getR2Config() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }

  return { endpoint, accessKeyId, secretAccessKey, bucket };
}

export async function GET(request: NextRequest) {
  const rawKey = request.nextUrl.searchParams.get("key");
  const key = normalizeR2Key(rawKey);

  if (!key) {
    return NextResponse.json({ error: "Key gambarnya kagak ada" }, { status: 400 });
  }

  const config = getR2Config();
  if (!config) {
    return NextResponse.json({ error: "Storage belom diset" }, { status: 500 });
  }

  try {
    const r2 = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    const command = new GetObjectCommand({ Bucket: config.bucket, Key: key });
    const response = await r2.send(command);

    const body = response.Body;
    if (!body) {
      return NextResponse.json({ error: "Gambarnya kagak ketemu" }, { status: 404 });
    }

    const bytes = await body.transformToByteArray();

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": response.ContentType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Failed to read image from R2", { key, error });
    return NextResponse.json({ error: "Gambarnya kagak ketemu" }, { status: 404 });
  }
}

function normalizeR2Key(input: string | null): string {
  if (!input) return "";

  let key = input.trim();

  if (key.startsWith("r2:")) {
    key = key.slice(3);
  }

  if (key.startsWith("/api/images?")) {
    const params = new URLSearchParams(key.split("?")[1] || "");
    key = params.get("key") || "";
  }

  key = key.replace(/^\/+/, "");

  // Decode up to 3 times to support legacy/double-encoded keys.
  for (let i = 0; i < 3; i++) {
    try {
      const decoded = decodeURIComponent(key);
      if (decoded === key) break;
      key = decoded;
    } catch {
      break;
    }
  }

  return key;
}
