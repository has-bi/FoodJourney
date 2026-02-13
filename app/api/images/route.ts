import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { uploadBuffer } from "@/lib/r2";

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "visits";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File gambarnya mana?" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Bukan file gambar" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran gambar maksimal 5MB" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const key = await uploadBuffer(buffer, file.type, folder);

    return NextResponse.json({ key });
  } catch (error) {
    console.error("Failed to upload image", error);
    return NextResponse.json({ error: "Gagal upload gambar" }, { status: 500 });
  }
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
