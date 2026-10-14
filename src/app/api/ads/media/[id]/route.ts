import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { Readable } from "node:stream";
import { adBucket } from "@/lib/ads";

// Stream one uploaded ad file (image/video) out of GridFS.
export async function GET(_req: Request, ctx: RouteContext<"/api/ads/media/[id]">) {
  const { id } = await ctx.params;
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: "Bad id." }, { status: 400 });
  }
  const bucket = await adBucket();
  const files = await bucket.find({ _id: oid }).toArray();
  if (!files.length) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const f = files[0];
  const nodeStream = bucket.openDownloadStream(oid);
  const web = Readable.toWeb(nodeStream) as ReadableStream;
  const contentType =
    (f.metadata as { contentType?: string } | undefined)?.contentType ||
    "application/octet-stream";
  return new NextResponse(web, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(f.length),
      "Cache-Control": "public, max-age=3600", // ads change daily; an hour of caching is fine
    },
  });
}
