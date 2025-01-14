import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import Url from "@/models/Urls";
import User from "@/models/User";
import { getAuthSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

export async function POST(request) {
  try {
    await connectDB();
    const session = await getAuthSession();
    console.log('Session data:', JSON.stringify(session, null, 2));

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find or create user based on email
    let user = await User.findOne({ email: session.user.email });

    if (!user) {
      user = await User.create({
        email: session.user.email,
        name: session.user.name
      });
    }

    const { url, customSlug } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Generate unique shortId
    let shortId;
    let existingUrl;
    do {
      shortId = customSlug || nanoid(8);
      existingUrl = await Url.findOne({ shortId });
    } while (existingUrl);

    const newUrl = await Url.create({
      originalUrl: url,
      shortId,
      userId: user._id,
      customSlug: customSlug || undefined,
    });

    return NextResponse.json({
      _id: newUrl._id.toString(),  // Ensure _id is included and converted to string
      id: newUrl._id.toString(),   // Include both _id and id for compatibility
      originalUrl: newUrl.originalUrl,
      shortId: newUrl.shortId,
      clicks: newUrl.clicks || 0
    });
  } catch (error) {
    console.error("URL creation error:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: "Failed to create shortened URL" },
      { status: 500 }
    );
  }
}
