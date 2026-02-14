"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Search,
  FileText,
  Play,
  AlertTriangle,
  Shield,
  Activity,
} from "lucide-react";
import {
  getRedTeamTemplates,
  runQuickTest,
  type RedTeamTemplate,
  type QuickTestResponse,
} from "@/lib/api";

export default function TemplatesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.project_id as string;

  const [templates, setTemplates] = useState<RedTeamTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<RedTeamTemplate[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const [selectedTemplate, setSelectedTemplate] =
    useState<RedTeamTemplate | null>(null);
  const [testResult, setTestResult] = useState<QuickTestResponse | null>(null);
  const [testing, setTesting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, categoryFilter, severityFilter]);

  const loadTemplates = async () => {
    try {
      const data = await getRedTeamTemplates(undefined, projectId);
      setTemplates(data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading templates:", error);
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query),
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }

    if (severityFilter !== "all") {
      filtered = filtered.filter((t) => t.severity === severityFilter);
    }

    setFilteredTemplates(filtered);
  };

  const handleTestTemplate = async (template: RedTeamTemplate) => {
    setTesting(true);
    setTestResult(null);

    try {
      const result = await runQuickTest(projectId, {
        template_id: template.id,
      });
      setTestResult(result);
    } catch (error: any) {
      alert(error.message || "Failed to run test");
    } finally {
      setTesting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "jailbreak":
        return "🔓";
      case "prompt_injection":
        return "💉";
      case "toxicity":
        return "☠️";
      case "data_leakage":
        return "🔍";
      case "obfuscation":
        return "🎭";
      default:
        return "📄";
    }
  };

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "jailbreak", label: "Jailbreaks" },
    { value: "prompt_injection", label: "Prompt Injections" },
    { value: "toxicity", label: "Toxicity" },
    { value: "data_leakage", label: "Data Leakage" },
    { value: "obfuscation", label: "Obfuscation" },
  ];

  const severities = [
    { value: "all", label: "All Severities" },
    { value: "critical", label: "Critical" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attack Templates</h1>
          <p className="text-muted-foreground mt-2">
            Browse and test pre-built attack patterns
          </p>
        </div>
        <Badge variant="outline">{filteredTemplates.length} templates</Badge>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              {severities.map((sev) => (
                <SelectItem key={sev.value} value={sev.value}>
                  {sev.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className="p-4 hover:border-primary cursor-pointer transition-colors"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">
                      {getCategoryIcon(template.category)}
                    </span>
                    <h3 className="font-semibold">{template.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {template.category.replace("_", " ")}
                    </Badge>
                    <Badge
                      variant={getSeverityColor(template.severity)}
                      className="text-xs"
                    >
                      {template.severity}
                    </Badge>
                    {template.is_custom && (
                      <Badge variant="secondary" className="text-xs">
                        Custom
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-3">
                {template.description || "No description available"}
              </p>

              {template.variables &&
                Object.keys(template.variables).length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Variables: {Object.keys(template.variables).join(", ")}
                  </p>
                )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedTemplate(template);
                    setShowPreview(true);
                    setTestResult(null);
                  }}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleTestTemplate(template)}
                  disabled={testing}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Test
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No templates found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your filters or search query
            </p>
          </div>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">
                {selectedTemplate && getCategoryIcon(selectedTemplate.category)}
              </span>
              {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant="outline">{selectedTemplate.category}</Badge>
                <Badge variant={getSeverityColor(selectedTemplate.severity)}>
                  {selectedTemplate.severity}
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Template</h4>
                <div className="bg-muted p-4 rounded-lg font-mono text-xs whitespace-pre-wrap overflow-auto max-h-64">
                  {selectedTemplate.template_text}
                </div>
              </div>

              {selectedTemplate.variables &&
                Object.keys(selectedTemplate.variables).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Variables</h4>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-48">
                      {JSON.stringify(selectedTemplate.variables, null, 2)}
                    </pre>
                  </div>
                )}

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowPreview(false);
                    handleTestTemplate(selectedTemplate);
                  }}
                  disabled={testing}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {testing ? "Testing..." : "Run Test"}
                </Button>
              </div>

              {testResult && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-2">
                    {testResult.was_successful ? (
                      <>
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <h4 className="font-medium text-destructive">
                          Attack Successful
                        </h4>
                      </>
                    ) : (
                      <>
                        <Shield className="h-5 w-5 text-green-500" />
                        <h4 className="font-medium text-green-500">
                          Attack Blocked
                        </h4>
                      </>
                    )}
                    {testResult.bypass_score !== null && (
                      <Badge variant="outline">
                        Score: {(testResult.bypass_score * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h5 className="text-sm font-medium mb-2">Response</h5>
                    <div className="bg-muted p-4 rounded-lg text-sm max-h-48 overflow-auto">
                      {testResult.llm_response || "No response"}
                    </div>
                  </div>

                  {testResult.analysis_notes && (
                    <div>
                      <h5 className="text-sm font-medium mb-2">Analysis</h5>
                      <p className="text-sm text-muted-foreground">
                        {testResult.analysis_notes}
                      </p>
                    </div>
                  )}

                  {testResult.review_queue_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        router.push(
                          `/projects/${projectId}/review-queue?item=${testResult.review_queue_id}`,
                        );
                        setShowPreview(false);
                      }}
                    >
                      View in Review Queue
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
