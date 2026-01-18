"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/app/protected-route";
import { useAuth } from "@/app/auth-context";

interface Project {
  project_id: string;
  name: string;
  description: string;
  created_at: string;
}

function ProjectsContent() {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const fetchProjects = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/projects", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.error("Failed to fetch projects:", response.status);
          setProjects([]);
          return;
        }

        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 animate-spin text-4xl">⏳</div>
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">📦</div>
          <h2 className="mb-2 text-2xl font-semibold">No projects yet</h2>
          <p className="mb-6 text-muted-foreground">
            Get started by creating your first project
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage your content moderation projects
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Link
            key={project.project_id}
            href={`/projects/${project.project_id}`}
            className="block"
          >
            <div className="rounded-lg border p-6 transition-colors hover:bg-muted/50">
              <h3 className="mb-2 text-xl font-semibold">{project.name}</h3>
              {project.description && (
                <p className="mb-4 text-sm text-muted-foreground">
                  {project.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Created {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <ProtectedRoute>
      <ProjectsContent />
    </ProtectedRoute>
  );
}
