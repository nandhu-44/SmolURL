"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    // Handle profile update
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully.",
    });
  };

  return (
    <div className="p-8 bg-gradient-to-b from-rose-50 to-white dark:from-rose-950 dark:to-background">
      <Card className="border-rose-100 dark:border-rose-900">
        <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/50 dark:to-pink-950/50 rounded-t-lg">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={getAvatarUrl(session?.user?.avatarHash)}
                alt={session?.user?.name || 'User avatar'}
              />
              <AvatarFallback>{session?.user?.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">Profile Settings</h2>
              <p className="text-sm text-muted-foreground">
                Your avatar is automatically generated based on your email
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input defaultValue={session?.user?.name} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input defaultValue={session?.user?.email} disabled />
              <p className="text-sm text-muted-foreground">
                To change your avatar, update your Gravatar at{" "}
                <a
                  href="https://gravatar.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  gravatar.com
                </a>
              </p>
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}