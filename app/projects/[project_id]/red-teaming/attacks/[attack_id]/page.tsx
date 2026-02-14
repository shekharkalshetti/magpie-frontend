"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  AlertTriangle,
  Shield,
  FileText,
  MessageSquare,
  Activity,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { getRedTeamAttack, type RedTeamAttack } from "@/lib/api";

export default function AttackDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.project_id as string;
  const attackId = params.attack_id as string;

  const [attack, setAttack] = useState<RedTeamAttack | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  useEffect(() => {
    loadAttack();
  }, [attackId]);

  const loadAttack = async () => {
    try {
      const data = await getRedTeamAttack(attackId);
      setAttack(data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading attack:", error);
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: "prompt" | "response") => {
    await navigator.clipboard.writeText(text);
    if (type === "prompt") {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } else {
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "outline";
      case "low":
        return "default";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!attack) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">Attack not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">{attack.attack_name}</h1>
            {attack.was_successful ? (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Bypassed
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-green-500 text-green-500"
              >
                <Shield className="h-3 w-3 mr-1" />
                Blocked
              </Badge>
            )}
            <Badge variant={getSeverityColor(attack.severity)}>
              {attack.severity.toUpperCase()}
            </Badge>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Type: {attack.attack_type}</span>
            <span>Executed {new Date(attack.created_at).toLocaleString()}</span>
            {attack.execution_time_ms && (
              <span>Duration: {attack.execution_time_ms}ms</span>
            )}
          </div>
        </div>
        {attack.review_queue_id && (
          <Button
            variant="outline"
            onClick={() =>
              router.push(
                `/projects/${projectId}/review-queue?item=${attack.review_queue_id}`,
              )
            }
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View in Review Queue
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Bypass Score</p>
          <p className="text-3xl font-bold">
            {attack.bypass_score !== null
              ? `${(attack.bypass_score * 100).toFixed(0)}%`
              : "N/A"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {attack.bypass_score && attack.bypass_score > 0.7
              ? "High confidence bypass"
              : attack.bypass_score && attack.bypass_score > 0.4
                ? "Possible bypass"
                : "Blocked effectively"}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Model</p>
          <p className="text-lg font-medium">{attack.llm_model || "Unknown"}</p>
          <p className="text-xs text-muted-foreground mt-1">Target model</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Execution Time</p>
          <p className="text-lg font-medium">
            {attack.execution_time_ms ? `${attack.execution_time_ms}ms` : "N/A"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Response latency</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Policies Flagged</p>
          <p className="text-lg font-medium">
            {attack.flagged_policies?.length || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {attack.flagged_policies?.length
              ? attack.flagged_policies.join(", ")
              : "None"}
          </p>
        </Card>
      </div>

      {/* Details Tabs */}
      <Tabs defaultValue="prompt" className="w-full">
        <TabsList>
          <TabsTrigger value="prompt">
            <FileText className="h-4 w-4 mr-2" />
            Attack Prompt
          </TabsTrigger>
          <TabsTrigger value="response">
            <MessageSquare className="h-4 w-4 mr-2" />
            LLM Response
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <Activity className="h-4 w-4 mr-2" />
            Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prompt" className="mt-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Attack Prompt</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(attack.attack_prompt, "prompt")}
              >
                {copiedPrompt ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copiedPrompt ? "Copied!" : "Copy"}
              </Button>
            </div>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
              {attack.attack_prompt}
            </div>
            {attack.template_variables && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Template Variables</h4>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
                  {JSON.stringify(attack.template_variables, null, 2)}
                </pre>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="response" className="mt-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">LLM Response</h3>
              {attack.llm_response && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(attack.llm_response!, "response")
                  }
                >
                  {copiedResponse ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {copiedResponse ? "Copied!" : "Copy"}
                </Button>
              )}
            </div>
            {attack.llm_response ? (
              <div className="bg-muted p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                {attack.llm_response}
              </div>
            ) : (
              <p className="text-muted-foreground">No response available</p>
            )}
            {attack.error_message && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-sm font-medium text-destructive">
                  Error: {attack.error_message}
                </p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="mt-4">
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Attack Analysis</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Attack Type
                  </span>
                  <Badge variant="outline">{attack.attack_type}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Severity
                  </span>
                  <Badge variant={getSeverityColor(attack.severity)}>
                    {attack.severity}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Success</span>
                  <span className="font-medium">
                    {attack.was_successful ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Bypass Score
                  </span>
                  <span className="font-medium">
                    {attack.bypass_score !== null
                      ? `${(attack.bypass_score * 100).toFixed(1)}%`
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {attack.analysis_notes && (
              <div>
                <h4 className="text-sm font-medium mb-2">Analysis Notes</h4>
                <div className="bg-muted p-4 rounded-lg text-sm">
                  {attack.analysis_notes}
                </div>
              </div>
            )}

            {attack.flagged_policies && attack.flagged_policies.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Flagged Policies</h4>
                <div className="space-y-2">
                  {attack.flagged_policies.map((policy, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-muted rounded"
                    >
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-sm">{policy}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {attack.execution_log_id && (
              <div>
                <h4 className="text-sm font-medium mb-2">Related Logs</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(
                      `/projects/${projectId}/logs?execution_id=${attack.execution_log_id}`,
                    )
                  }
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Execution Log
                </Button>
              </div>
            )}

            {/* Recommendations */}
            <div>
              <h4 className="text-sm font-medium mb-2">Recommendations</h4>
              <div className="space-y-2">
                {attack.was_successful ? (
                  <>
                    <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">
                          This attack successfully bypassed your defenses
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Consider implementing stronger content policies or
                          prompt guards to prevent similar attacks.
                        </p>
                      </div>
                    </div>
                    {attack.attack_type === "jailbreak" && (
                      <p className="text-sm text-muted-foreground">
                        • Add system prompt reinforcement to reject roleplay
                        scenarios
                        <br />
                        • Implement pre-processing checks for common jailbreak
                        patterns
                        <br />• Use output filtering to catch bypassed content
                      </p>
                    )}
                    {attack.attack_type === "prompt_injection" && (
                      <p className="text-sm text-muted-foreground">
                        • Clearly separate system instructions from user input
                        <br />
                        • Add delimiters around user content
                        <br />• Use prompt injection detection tools before
                        processing
                      </p>
                    )}
                    {attack.attack_type === "data_leakage" && (
                      <p className="text-sm text-muted-foreground">
                        • Never include sensitive data in system prompts
                        <br />
                        • Use output filters to detect and redact sensitive
                        patterns
                        <br />• Implement strict access controls on model
                        context
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        Your defenses successfully blocked this attack
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        Continue monitoring for new attack patterns and update
                        policies as needed.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
