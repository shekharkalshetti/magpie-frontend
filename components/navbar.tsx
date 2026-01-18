"use client";

import { Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateProjectDialog } from "./create-project-dialog";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/auth-context";

export function Navbar() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  // Don't show navbar on login page
  if (pathname === "/login") {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      <nav className="border-b">
        <div className="flex h-16 items-center px-8">
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold">Triton</span>
          </div>
          {isAuthenticated && pathname === "/projects" && (
            <div className="ml-auto flex items-center gap-4">
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </div>
          )}
          {isAuthenticated && (
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">{user?.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </nav>
      <CreateProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
