import { Unlink } from "lucide-react";
import StatusPage from "@/components/StatusPage";

export default function NotFound() {
  return <StatusPage icon={Unlink} code="404" title="There's no link here" message="Check the address for typos. Short names can use letters, numbers, - and _." />;
}
