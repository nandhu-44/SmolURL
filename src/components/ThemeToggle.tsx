"use client";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

type Theme = "light" | "dark" | "system";
const KEY = "theme";
const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const ONE_YEAR = 60 * 60 * 24 * 365;

// The choice is kept in a cookie (readable by the server, survives blocked localStorage) and mirrored to localStorage.
const stored = (): Theme => {
  let t: string | null = document.cookie.match(/(?:^|; )theme=(light|dark)/)?.[1] ?? null;
  if (!t) {
    try {
      t = localStorage.getItem(KEY);
    } catch {}
  }
  return t === "light" || t === "dark" ? t : "system";
};
const persist = (t: Theme) => {
  document.cookie =
    t === "system"
      ? `${KEY}=; path=/; max-age=0; SameSite=Lax`
      : `${KEY}=${t}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
  try {
    if (t === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, t);
  } catch {}
};
const prefersDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
const apply = (t: Theme) => {
  const c = document.documentElement.classList;
  c.toggle("dark", t === "dark" || (t === "system" && prefersDark()));
  // "light" marks an explicit choice, so the CSS fallback for a dark system setting doesn't override it
  c.toggle("light", t === "light");
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);
  const [osDark, setOsDark] = useState(false); // what the browser currently reports for prefers-color-scheme

  // Read the saved choice after mount (the inline script has already applied it to <html>).
  useEffect(() => {
    const t = stored();
    setTheme(t);
    // Re-assert the saved theme on <html>. If React ever has to re-render the whole document (after a hydration
    // problem) it drops classes that were added outside React, which silently turned a saved dark theme light.
    apply(t);
    setOsDark(prefersDark());
    setMounted(true);
  }, []);

  // Follow OS changes while in "system" mode, and stay in sync with other tabs.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onOs = () => {
      setOsDark(mq.matches);
      if (theme === "system") apply("system");
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      const t = stored();
      setTheme(t);
      apply(t);
    };
    mq.addEventListener("change", onOs);
    window.addEventListener("storage", onStorage);
    return () => {
      mq.removeEventListener("change", onOs);
      window.removeEventListener("storage", onStorage);
    };
  }, [theme]);

  const choose = useCallback((t: Theme) => {
    setTheme(t);
    apply(t);
    persist(t);
  }, []);

  const Current = OPTIONS.find((o) => o.value === theme)!.icon;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Theme">
          {/* before mount we don't know the saved mode, so show a neutral icon to avoid a flash of the wrong one */}
          {mounted ? <Current /> : <Monitor />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-36">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={value} onSelect={() => choose(value)}>
            <Icon /> {label}
            {value === "system" && mounted && <span className="text-xs text-muted-foreground">{osDark ? "Dark now" : "Light now"}</span>}
            {theme === value && <Check className="ml-auto text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
