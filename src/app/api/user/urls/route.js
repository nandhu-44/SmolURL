import { getAuthSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import Url from "@/models/Urls";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getAuthSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  await connectDB();

  const urls = await Url.find({ userId: session.user.id })
    .sort({ createdAt: -1 });

  return NextResponse.json(urls);
}