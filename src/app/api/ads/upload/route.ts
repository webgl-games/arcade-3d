import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  adBucket,
  MAX_FILES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  IMAGE_TYPES,
  VIDEO_TYPES,
} from "@/lib/ads";

// Upload the ad's media (multipart form, field "files"): images and/or video.
// Files land in GridFS; the returned ids go into the booking.
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Log in first." }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Send multipart form data." }, { status: 400 });
  }
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "No files." }, { status: 400 });
  if (files.length > MAX_FILES)
    return NextResponse.json({ error: `Max ${MAX_FILES} files.` }, { status: 400 });

  const bucket = await adBucket();
  const out: { fileId: string; type: "image" | "video"; contentType: string }[] = [];
  for (const f of files) {
    const isImage = IMAGE_TYPES.includes(f.type);
    const isVideo = VIDEO_TYPES.includes(f.type);
    if (!isImage && !isVideo)
      return NextResponse.json({ error: `Unsupported type: ${f.type}. Use PNG/JPG/WebP/GIF images or MP4/WebM video.` }, { status: 400 });
    const cap = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (f.size > cap)
      return NextResponse.json({ error: `${f.name} is too big (max ${Math.round(cap / 1048576)} MB for ${isVideo ? "video" : "images"}).` }, { status: 400 });

    const buf = Buffer.from(await f.arrayBuffer());
    const id = await new Promise<string>((resolve, reject) => {
      const up = bucket.openUploadStream(f.name, {
        // contentType lives in our metadata — the driver's top-level field is deprecated
        metadata: { userId: user.id, uploadedAt: new Date(), contentType: f.type },
      });
      up.on("error", reject);
      up.on("finish", () => resolve(up.id.toString()));
      up.end(buf);
    });
    out.push({ fileId: id, type: isVideo ? "video" : "image", contentType: f.type });
  }
  return NextResponse.json({ files: out });
}
