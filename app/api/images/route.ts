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
  const key = request.nextUrl.searchParams.get("key");

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
  } catch {
    return NextResponse.json({ error: "Gambarnya kagak ketemu" }, { status: 404 });
  }
}
