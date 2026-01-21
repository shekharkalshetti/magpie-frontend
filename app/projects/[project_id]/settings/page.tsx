"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getProject,
  deleteProject,
  updateProject,
  getApiKeys,
  createApiKey,
  deleteApiKey,
  type Project,
  type ApiKey,
  type GeneratedApiKey,
} from "@/lib/api";
import { Copy, Edit2, Key, Trash2, Check } from "lucide-react";

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.project_id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit project name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  // Delete project state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Copy feedback state
  const [copiedProjectId, setCopiedProjectId] = useState(false);

  // API key management state
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newGeneratedKey, setNewGeneratedKey] =
    useState<GeneratedApiKey | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projectData, apiKeysData] = await Promise.all([
        getProject(projectId),
        getApiKeys(projectId),
      ]);
      setProject(projectData);
      setApiKeys(apiKeysData);
      setEditedName(projectData.name);
    } catch (err) {
      setError("Failed to load project settings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyProjectId = () => {
    navigator.clipboard.writeText(projectId);
    setCopiedProjectId(true);
    setTimeout(() => setCopiedProjectId(false), 2000);
  };

  const handleEditName = () => {
    setIsEditingName(true);
    setEditedName(project?.name || "");
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName(project?.name || "");
  };

  const handleSaveName = async () => {
    if (!editedName.trim() || editedName === project?.name) {
      setIsEditingName(false);
      return;
    }

    try {
      setIsSavingName(true);
      const updatedProject = await updateProject(projectId, {
        name: editedName,
      });
      setProject(updatedProject);
      setIsEditingName(false);
    } catch (err) {
      console.error("Failed to update project name:", err);
      setError("Failed to update project name");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleDeleteProject = async () => {
    if (deleteConfirmation !== project?.name) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteProject(projectId);
      // Redirect to projects list after successful deletion
      router.push("/projects");
    } catch (err) {
      console.error("Failed to delete project:", err);
      setError("Failed to delete project");
      setIsDeleting(false);
    } finally {
      setShowDeleteDialog(false);
      setDeleteConfirmation("");
    }
  };

  const handleRegenerateApiKey = async () => {
    try {
      setIsRegenerating(true);

      // Delete old keys
      await Promise.all(apiKeys.map((key) => deleteApiKey(projectId, key.id)));

      // Generate new key
      const newKey = await createApiKey(projectId, "Primary API Key");
      setNewGeneratedKey(newKey);

      // Reload API keys
      const updatedKeys = await getApiKeys(projectId);
      setApiKeys(updatedKeys);

      setShowRegenerateDialog(false);
      setShowNewKeyDialog(true);
    } catch (err) {
      console.error("Failed to regenerate API key:", err);
      setError("Failed to regenerate API key");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyApiKey = () => {
    if (newGeneratedKey) {
      navigator.clipboard.writeText(newGeneratedKey.api_key);
      setCopiedApiKey(true);
      setTimeout(() => setCopiedApiKey(false), 2000);
    }
  };

  const getCurrentApiKey = () => {
    const activeKey = apiKeys.find((k) => k.is_active);
    if (!activeKey) return null;
    return activeKey;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">{error || "Project not found"}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your project configuration and security settings
        </p>
      </div>

      {/* Project Name */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-2">Project Name</h2>
            {isEditingName ? (
              <div className="space-y-3">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Enter project name"
                  className="max-w-md"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveName}
                    disabled={isSavingName || !editedName.trim()}
                  >
                    {isSavingName ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEditName}
                    disabled={isSavingName}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-gray-900 font-medium">{project.name}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleEditName}
                  className="h-8 w-8 p-0"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              The display name for your project
            </p>
          </div>
        </div>
      </Card>

      {/* Project ID */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-2">Project ID</h2>
        <div className="flex items-center gap-3">
          <code className="flex-1 bg-gray-50 px-3 py-2 rounded text-sm font-mono">
            {projectId}
          </code>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyProjectId}
            className="flex items-center gap-2"
          >
            {copiedProjectId ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Use this ID when initializing the SDK
        </p>
      </Card>

      {/* API Key */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Key
        </h2>
        <div className="space-y-3">
          {getCurrentApiKey() ? (
            <>
              <div className="flex items-center gap-3">
                <code className="flex-1 bg-gray-50 px-3 py-2 rounded text-sm font-mono">
                  {getCurrentApiKey()!.key_prefix}****************************
                </code>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowRegenerateDialog(true)}
              >
                Regenerate API Key
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                No API key found. Generate one to start using the SDK.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowRegenerateDialog(true)}
              >
                Generate API Key
              </Button>
            </>
          )}
          <p className="text-sm text-muted-foreground">
            Your API key is used to authenticate requests to the Magpie API
          </p>
          <p className="text-xs text-yellow-600 bg-yellow-50 px-3 py-2 rounded">
            ⚠️ Regenerating the API key will invalidate the current key
          </p>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-200 bg-red-50/30">
        <h2 className="text-lg font-semibold mb-2 text-red-900 flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Danger Zone
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete this project and all associated data. This action
          cannot be undone.
        </p>
        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
          Delete Project
        </Button>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              project and all associated data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All execution logs</li>
                <li>API keys</li>
                <li>Policies and configurations</li>
                <li>Review queue items</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Type <span className="font-bold">{project.name}</span> to
                confirm:
              </label>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={project.name}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmation("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={deleteConfirmation !== project.name || isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate API Key Confirmation Dialog */}
      <Dialog
        open={showRegenerateDialog}
        onOpenChange={setShowRegenerateDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {getCurrentApiKey() ? "Regenerate" : "Generate"} API Key
            </DialogTitle>
            <DialogDescription>
              {getCurrentApiKey()
                ? "This will invalidate your current API key. Any applications using the old key will stop working immediately."
                : "Generate a new API key for this project. You'll need this key to authenticate SDK requests."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRegenerateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant={getCurrentApiKey() ? "destructive" : "default"}
              onClick={handleRegenerateApiKey}
              disabled={isRegenerating}
            >
              {isRegenerating
                ? "Generating..."
                : getCurrentApiKey()
                  ? "Regenerate Key"
                  : "Generate Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New API Key Display Dialog */}
      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your New API Key</DialogTitle>
            <DialogDescription>
              Copy this key and store it securely. You won't be able to see it
              again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">API Key:</label>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 bg-gray-50 px-3 py-2 rounded text-sm font-mono break-all">
                  {newGeneratedKey?.api_key}
                </code>
                <Button size="sm" variant="outline" onClick={handleCopyApiKey}>
                  {copiedApiKey ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Make sure to copy your API key now.
                You won't be able to see it again!
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowNewKeyDialog(false);
                setNewGeneratedKey(null);
                setCopiedApiKey(false);
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
