"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { RotateCcw, Loader2 } from "lucide-react";
import {
  getPolicy,
  toggleCategory as apiToggleCategory,
  toggleSection as apiToggleSection,
  toggleOption as apiToggleOption,
  resetPolicy,
  type Policy,
  type PolicyCategory,
  type PolicySection,
  type Severity,
} from "@/lib/api";

// Code snippet component
function CodeSnippet({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md bg-muted/50 border p-4 font-mono text-sm text-muted-foreground">
      {children}
    </div>
  );
}

// Policy section component
function PolicySectionCard({
  section,
  onToggleSection,
  onToggleOption,
  isLoading,
}: {
  section: PolicySection;
  onToggleSection: (sectionId: string) => void;
  onToggleOption: (sectionId: string, optionId: string) => void;
  isLoading: boolean;
}) {
  return (
    <Card className={section.enabled ? "" : "opacity-60"}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">{section.title}</CardTitle>
            <Badge variant={section.severity as Severity}>
              {section.severity}
            </Badge>
          </div>
          <Switch
            checked={section.enabled}
            disabled={isLoading}
            onCheckedChange={() => onToggleSection(section.id)}
          />
        </div>
        <CardDescription>{section.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
            Description:
          </h4>
          <CodeSnippet>{section.policy_text}</CodeSnippet>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">
            Detection Options:
          </h4>
          <div className="grid gap-3">
            {section.options.map((option) => (
              <div
                key={option.id}
                className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30"
              >
                <span className="text-sm">{option.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {option.enabled && section.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <Switch
                    checked={option.enabled && section.enabled}
                    disabled={!section.enabled || isLoading}
                    onCheckedChange={() =>
                      onToggleOption(section.id, option.id)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Category header component
function CategoryHeader({
  category,
  onToggle,
  isLoading,
}: {
  category: PolicyCategory;
  onToggle: (categoryId: string) => void;
  isLoading: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-6 p-4 rounded-lg bg-muted/30 border">
      <div>
        <h3 className="text-lg font-semibold">{category.name}</h3>
        <p className="text-sm text-muted-foreground">
          {category.sections.length} detection modules
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {category.enabled ? "Enabled" : "Disabled"}
        </span>
        <Switch
          checked={category.enabled}
          disabled={isLoading}
          onCheckedChange={() => onToggle(category.id)}
        />
      </div>
    </div>
  );
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading policy...</span>
      </div>
    </div>
  );
}

// Error state
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <p className="text-destructive">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        <RotateCcw className="mr-2 h-4 w-4" />
        Retry
      </Button>
    </div>
  );
}

export default function PolicyPage({
  params,
}: {
  params: Promise<{ project_id: string }>;
}) {
  const { project_id } = use(params);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch policy on mount
  const fetchPolicy = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPolicy(project_id);
      setPolicy(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load policy");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, [project_id]);

  const handleToggleCategory = async (categoryId: string) => {
    if (!policy) return;
    setIsUpdating(true);
    try {
      const category = policy.config.categories.find(
        (c) => c.id === categoryId
      );
      if (!category) return;
      const updated = await apiToggleCategory(
        policy.id,
        categoryId,
        !category.enabled
      );
      setPolicy(updated);
    } catch (err) {
      console.error("Failed to toggle category:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleSection = async (categoryId: string, sectionId: string) => {
    if (!policy) return;
    setIsUpdating(true);
    try {
      const category = policy.config.categories.find(
        (c) => c.id === categoryId
      );
      const section = category?.sections.find((s) => s.id === sectionId);
      if (!section) return;
      const updated = await apiToggleSection(
        policy.id,
        categoryId,
        sectionId,
        !section.enabled
      );
      setPolicy(updated);
    } catch (err) {
      console.error("Failed to toggle section:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleOption = async (
    categoryId: string,
    sectionId: string,
    optionId: string
  ) => {
    if (!policy) return;
    setIsUpdating(true);
    try {
      const category = policy.config.categories.find(
        (c) => c.id === categoryId
      );
      const section = category?.sections.find((s) => s.id === sectionId);
      const option = section?.options.find((o) => o.id === optionId);
      if (!option) return;
      const updated = await apiToggleOption(
        policy.id,
        categoryId,
        sectionId,
        optionId,
        !option.enabled
      );
      setPolicy(updated);
    } catch (err) {
      console.error("Failed to toggle option:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetPolicy = async () => {
    if (!policy) return;
    setIsUpdating(true);
    try {
      const updated = await resetPolicy(policy.id);
      setPolicy(updated);
    } catch (err) {
      console.error("Failed to reset policy:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !policy) {
    return (
      <ErrorState message={error || "Policy not found"} onRetry={fetchPolicy} />
    );
  }

  const policyData = policy.config.categories;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Policy Configuration</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Configure content compliance, factuality, and security policies for
            this project.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleResetPolicy}
            disabled={isUpdating}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="content-policy" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content-policy">
            Content Policy Compliance
          </TabsTrigger>
          <TabsTrigger value="factuality">
            Factuality & Truthfulness
          </TabsTrigger>
          <TabsTrigger value="security">Security & Safety</TabsTrigger>
        </TabsList>

        {policyData.map((category) => (
          <TabsContent
            key={category.id}
            value={category.id}
            className="space-y-6"
          >
            <CategoryHeader
              category={category}
              onToggle={handleToggleCategory}
              isLoading={isUpdating}
            />
            <div
              className={`space-y-6 ${
                !category.enabled ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              {category.sections.map((section) => (
                <PolicySectionCard
                  key={section.id}
                  section={section}
                  isLoading={isUpdating}
                  onToggleSection={(sectionId) =>
                    handleToggleSection(category.id, sectionId)
                  }
                  onToggleOption={(sectionId, optionId) =>
                    handleToggleOption(category.id, sectionId, optionId)
                  }
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
