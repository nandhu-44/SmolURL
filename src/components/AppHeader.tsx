"use client";
import { BookOpen, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Wordmark } from "./Logo";
import { ProgressBar } from "./NavProgress";
import ThemeToggle from "./ThemeToggle";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

const NAV = [
  { href: "/", label: "Links" },
  { href: "/docs", label: "API" },
];

/** Top bar shared by the app's pages. Signed out (e.g. on /docs), it offers sign-in instead of the account menu. */
export default function AppHeader({ user }: { user?: { name: string; email: string } | null }) {
  const path = usePathname();
  const router = useRouter();
  const [navigating, startNav] = useTransition();

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    // full page load: clears client-side caches and avoids a router.replace()+refresh() race that left the old UI showing
    window.location.assign("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      {navigating && <ProgressBar />}
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="smolurl home" className="rounded-md"><Wordmark /></Link>
        {user && (
          <nav aria-label="Main" className="flex items-center gap-1">
            {NAV.map((n) => {
              const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={cn("rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors", active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label="Account menu" className="grid size-8 place-items-center rounded-full bg-muted text-sm font-semibold text-foreground transition-colors hover:bg-border">
                  {user.name.charAt(0).toUpperCase()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-56">
                <DropdownMenuLabel>
                  <span className="block text-sm font-medium text-foreground">{user.name}</span>
                  <span className="block truncate">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => startNav(() => router.push("/settings"))}><Settings /> Settings</DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/docs"><BookOpen /> API docs</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={logout}><LogOut /> Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link href="/signin">Sign in</Link></Button>
              <Button asChild><Link href="/signup">Create account</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
