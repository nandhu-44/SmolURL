"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gradient-to-b from-rose-100 to-white dark:from-rose-950 dark:to-background">
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl bg-gradient-to-r from-rose-700 to-pink-700 text-transparent bg-clip-text dark:from-rose-500 dark:to-pink-500">
          Transform Long URLs into{" "}
          <span className="text-rose-700 dark:text-rose-400">Short Links</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
          Create shorter, more manageable links instantly. Track clicks and
          manage your URLs all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/login">
            <Button size="lg" className="font-semibold">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline" className="font-semibold">
              Create Account
            </Button>
          </Link>
        </div>
        <div className="pt-8">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
