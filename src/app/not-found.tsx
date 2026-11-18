import { Unlink } from "lucide-react";
import StatusPage from "@/components/StatusPage";

export default function NotFound() {
  return <StatusPage icon={Unlink} code="404" title="Nothing here" message="This short link doesn't exist, or the page you were looking for has moved." />;
}
