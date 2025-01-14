import { getAuthSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Url from "@/models/Urls";
import User from "@/models/User";  // Add User model import
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  try {
    const session = await getAuthSession();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    await connectDB();
    const { url } = await req.json();
    
    const updatedUrl = await Url.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      { originalUrl: url },
      { new: true }
    );

    if (!updatedUrl) {
      return new NextResponse("URL not found", { status: 404 });
    }

    return NextResponse.json(updatedUrl);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const session = await getAuthSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "URL ID is required" }, { status: 400 });
    }

    // First find the user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find URL and check ownership in one query
    const url = await Url.findOne({ 
      _id: id,
      userId: user._id 
    });

    if (!url) {
      return NextResponse.json(
        { error: "URL not found or unauthorized" }, 
        { status: 404 }
      );
    }

    await url.deleteOne();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete URL error:", error);
    return NextResponse.json(
      { error: "Failed to delete URL" }, 
      { status: 500 }
    );
  }
}