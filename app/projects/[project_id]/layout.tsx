"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/auth-context";

interface Project {
  project_id: string;
  name: string;
  description: string | null;
}

const navigation = [
  { name: "Dashboard", href: "dashboard" },
  { name: "Policy", href: "policy" },
  { name: "Observability", href: "observability" },
  { name: "Review Queue", href: "review-queue" },
  { name: "Audit Logs", href: "audit-logs" },
  { name: "Team", href: "team" },
  { name: "Settings", href: "settings" },
];

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const projectId = params.project_id as string;
  const { token } = useAuth();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    async function fetchProject() {
      if (!projectId || !token) return;
      try {
        const response = await fetch(
          `http://localhost:8000/api/v1/projects/${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setProject(data);
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      }
    }
    fetchProject();
  }, [projectId, token]);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/10">
        <div className="flex h-full flex-col gap-y-5 px-6 py-4">
          {/* Back button */}
          <Link
            href="/projects"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            All Projects
          </Link>

          {/* Project name */}
          <div>
            <h2 className="text-lg font-semibold">
              {project?.name || "Loading..."}
            </h2>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-1">
              {navigation.map((item) => {
                const isActive = pathname.includes(`/${item.href}`);
                return (
                  <li key={item.name}>
                    <Link
                      href={`/projects/${projectId}/${item.href}`}
                      className={cn(
                        "group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6",
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}
