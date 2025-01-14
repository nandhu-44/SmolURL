import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";

export default async function DashboardLayout({ children }) {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  return <div>{children}</div>;
}