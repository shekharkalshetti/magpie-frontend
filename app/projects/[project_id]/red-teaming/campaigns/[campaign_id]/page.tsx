"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Play,
  Square,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Download,
  Shield,
} from "lucide-react";
import {
  getRedTeamCampaign,
  getCampaignAttacks,
  startRedTeamCampaign,
  cancelRedTeamCampaign,
  type RedTeamCampaign,
  type RedTeamAttack,
} from "@/lib/api";

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.project_id as string;
  const campaignId = params.campaign_id as string;

  const [campaign, setCampaign] = useState<RedTeamCampaign | null>(null);
  const [attacks, setAttacks] = useState<RedTeamAttack[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccessful, setShowSuccessful] = useState(false);

  useEffect(() => {
    loadData();

    // Poll for updates if campaign is running
    const interval = setInterval(() => {
      if (campaign?.status === "running") {
        loadData();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [campaignId, campaign?.status]);

  const loadData = async () => {
    try {
      const [campaignData, attacksData] = await Promise.all([
        getRedTeamCampaign(campaignId),
        getCampaignAttacks(campaignId, showSuccessful, 0, 100),
      ]);
      setCampaign(campaignData);
      setAttacks(attacksData.items);
      setLoading(false);
    } catch (error) {
      console.error("Error loading campaign:", error);
      setLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      await startRedTeamCampaign(campaignId);
      loadData();
    } catch (error: any) {
      alert(error.message || "Failed to start campaign");
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this campaign?")) return;

    try {
      await cancelRedTeamCampaign(campaignId);
      loadData();
    } catch (error: any) {
      alert(error.message || "Failed to cancel campaign");
    }
  };

  const getRiskBadgeColor = (level: string | null) => {
    switch (level?.toLowerCase()) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "destructive";
      case "low":
        return "default";
      default:
        return "secondary";
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
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

  if (!campaign) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">Campaign not found</p>
      </div>
    );
  }

  const progress =
    campaign.total_attacks > 0
      ? ((campaign.successful_attacks + campaign.failed_attacks) /
          campaign.total_attacks) *
        100
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
            <Badge
              variant={campaign.status === "completed" ? "default" : "outline"}
            >
              {campaign.status}
            </Badge>
            {campaign.risk_level && (
              <Badge variant={getRiskBadgeColor(campaign.risk_level)}>
                {campaign.risk_level.toUpperCase()} RISK
              </Badge>
            )}
          </div>
          {campaign.description && (
            <p className="text-muted-foreground">{campaign.description}</p>
          )}
          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
            <span>
              Created {new Date(campaign.created_at).toLocaleDateString()}
            </span>
            {campaign.started_at && (
              <span>
                Started {new Date(campaign.started_at).toLocaleString()}
              </span>
            )}
            {campaign.completed_at && (
              <span>
                Completed {new Date(campaign.completed_at).toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {campaign.status === "pending" && (
            <Button onClick={handleStart}>
              <Play className="h-4 w-4 mr-2" />
              Start Campaign
            </Button>
          )}
          {campaign.status === "running" && (
            <Button variant="destructive" onClick={handleCancel}>
              <Square className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          {campaign.status === "completed" && (
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          )}
        </div>
      </div>

      {/* Progress */}
      {campaign.status === "running" && (
        <Card className="p-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground">
              {campaign.successful_attacks + campaign.failed_attacks} /{" "}
              {campaign.total_attacks} attacks completed
            </p>
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Attacks</p>
          <p className="text-3xl font-bold">{campaign.total_attacks}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {campaign.attack_categories.length} categories
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Successful Attacks</p>
          <p className="text-3xl font-bold text-destructive">
            {campaign.successful_attacks}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {campaign.success_rate?.toFixed(1)}% success rate
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Blocked</p>
          <p className="text-3xl font-bold text-green-500">
            {campaign.failed_attacks}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Defenses held</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Risk Level</p>
          <Badge
            variant={getRiskBadgeColor(campaign.risk_level)}
            className="text-lg"
          >
            {campaign.risk_level?.toUpperCase() || "N/A"}
          </Badge>
        </Card>
      </div>

      {/* Attacks Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Attack Results</h3>
          <div className="flex gap-2">
            <Button
              variant={showSuccessful ? "outline" : "default"}
              size="sm"
              onClick={() => setShowSuccessful(false)}
            >
              All Attacks
            </Button>
            <Button
              variant={showSuccessful ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSuccessful(true)}
            >
              Successful Only ({campaign.successful_attacks})
            </Button>
          </div>
        </div>

        {attacks.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Attack</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attacks.map((attack) => (
                <TableRow
                  key={attack.id}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() =>
                    router.push(
                      `/projects/${projectId}/red-teaming/attacks/${attack.id}`,
                    )
                  }
                >
                  <TableCell className="font-medium">
                    {attack.attack_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{attack.attack_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSeverityBadgeColor(attack.severity)}>
                      {attack.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {attack.was_successful ? (
                      <div className="flex items-center gap-1 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Bypassed</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-green-500">
                        <Shield className="h-4 w-4" />
                        <span>Blocked</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {attack.bypass_score !== null
                      ? `${(attack.bypass_score * 100).toFixed(0)}%`
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {attack.execution_time_ms
                      ? `${attack.execution_time_ms}ms`
                      : "N/A"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {showSuccessful ? "No successful attacks" : "No attacks yet"}
            </p>
          </div>
        )}
      </Card>

      {/* Error Message */}
      {campaign.error_message && (
        <Card className="p-4 border-destructive">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium">Campaign Error</p>
              <p className="text-sm text-muted-foreground mt-1">
                {campaign.error_message}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
