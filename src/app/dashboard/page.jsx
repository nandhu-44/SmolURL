"use client";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HelpCircle, LogOut, Plus, Settings, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReloadIcon } from "@radix-ui/react-icons";
import { getAvatarUrl } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export default function DashboardPage() {
  const [urls, setUrls] = useState([]);
  const [newUrl, setNewUrl] = useState("");
  const [error, setError] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [urlToDelete, setUrlToDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();
  const { toast } = useToast();

  const baseUrl = (process?.env?.NEXT_PUBLIC_BASE_URL)?.trimEnd("/");
  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    const res = await fetch("/api/user/urls");
    const data = await res.json();
    setUrls(data);
  };

  const addUrl = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl }),
      });
      const data = await res.json();

      if (res.ok) {
        setNewUrl("");
        fetchUrls();
        setIsModalOpen(false);
        toast({
          title: "Success",
          description: "URL has been shortened successfully",
        });
      } else {
        setError(data.error || "Failed to create URL");
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to create URL",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create URL",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiateDelete = (url) => {
    setUrlToDelete(url);
    setIsDeleteDialogOpen(true);
  };

  const deleteUrl = async () => {
    try {
      const res = await fetch(`/api/url/${urlToDelete._id || urlToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchUrls();
        toast({
          title: "Success",
          description: "URL has been deleted successfully",
        });
      } else {
        const data = await res.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to delete URL",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete URL",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setUrlToDelete(null);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-rose-100/50 to-white dark:from-rose-950/50 dark:to-background">
      {/* Navigation Bar */}
      <nav className="border-b border-rose-200/50 dark:border-rose-800/50 px-4 lg:px-6 py-3 flex justify-between items-center bg-gradient-to-r from-rose-700 to-pink-700 text-white dark:from-rose-900 dark:to-pink-900">
        <Link className="flex items-center space-x-1" href="/dashboard">
          <Image src="/link.png" alt="Logo" width={32} height={32} />
          <h1 className="text-xl font-bold">SmolURL</h1>
        </Link>
        <div className="relative">
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <Avatar>
                <AvatarImage
                  src={getAvatarUrl(session?.user?.avatarHash)}
                  alt={session?.user?.name || "User avatar"}
                />
                <AvatarFallback>
                  {session?.user?.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 p-2" align="end">
              <DropdownMenuLabel className="px-2 py-2 border-b border-rose-200/50 dark:border-rose-800/50">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <div className="p-1">
                <DropdownMenuItem className="cursor-pointer rounded-md hover:bg-rose-100/50 dark:hover:bg-rose-800/50">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-md hover:bg-rose-100/50 dark:hover:bg-rose-800/50">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-md hover:bg-rose-100/50 dark:hover:bg-rose-800/50">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help</span>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="my-2" />
              <div className="p-1">
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Original URL</TableHead>
              <TableHead>Short ID</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {urls.map((url) => (
              <TableRow key={url._id || url.id}>
                <TableCell className="max-w-[300px] truncate">
                  {url.originalUrl}
                </TableCell>
                <TableCell>
                  <a
                    href={`${baseUrl}/r/${url.shortId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className=""
                  >
                    <span className="text-blue-600 underline-offset-2 underline font-extrabold">
                      /r
                    </span>
                    <span className="text-rose-600 underline-offset-2 underline font-semibold">
                      /{url.shortId}
                    </span>
                  </a>
                </TableCell>
                <TableCell>{url.clicks || 0}</TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    onClick={() => initiateDelete(url)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* URL Creation Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-8 right-8 rounded-full w-14 h-14 p-0 bg-rose-700 hover:bg-rose-800 transition-colors text-white dark:bg-rose-800 dark:hover:bg-rose-700"
            size="icon"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Shorten New URL</DialogTitle>
          </DialogHeader>
          <form onSubmit={addUrl} className="space-y-4 mt-4">
            <Input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="Enter URL to shorten"
              disabled={isSubmitting}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && (
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              )}
              Shorten URL
            </Button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              shortened URL.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteUrl}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
