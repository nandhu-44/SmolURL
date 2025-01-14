import { redirect } from "next/navigation";
import Url from "@/models/Urls";

export async function GET(request, { params }) {
  const { shortId } = params;

  const url = await Url.findOneAndUpdate(
    { shortId },
    { $inc: { clicks: 1 } },
    { new: true },
  );

  if (!url) {
    return new Response("Not found", { status: 404 });
  }

  return redirect(url.originalUrl);
}
