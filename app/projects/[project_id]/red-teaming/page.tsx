"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Plus,
  Play,
} from "lucide-react";
import {
  getRedTeamStats,
  getRedTeamCampaigns,
  type RedTeamStats,
  type RedTeamCampaign,
} from "@/lib/api";
import { CreateCampaignDialog } from "@/components/create-campaign-dialog";

export default function RedTeamingPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.project_id as string;

  const [stats, setStats] = useState<RedTeamStats | null>(null);
  const [campaigns, setCampaigns] = useState<RedTeamCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, campaignsData] = await Promise.all([
        getRedTeamStats(projectId),
        getRedTeamCampaigns(projectId, undefined, 0, 10),
      ]);
      setStats(statsData);
      setCampaigns(campaignsData.items);
    } catch (error) {
      console.error("Error loading red teaming data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "default";
      default:
        return "secondary";
    }
  };

  const getRiskLevelIcon = (level: string) => {
    const riskLevel = level?.toLowerCase();
    if (riskLevel === "critical" || riskLevel === "high") {
      return <AlertTriangle className="h-4 w-4" />;
    }
    return <Shield className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold">Red Team Testing</h1>
          <p className="text-muted-foreground mt-2">
            Adversarial testing and security assessment
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/projects/${projectId}/red-teaming/templates`)
            }
          >
            View Templates
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Risk Level</p>
              <div className="flex items-center gap-2 mt-1">
                {getRiskLevelIcon(stats?.risk_level || "low")}
                <Badge variant={getRiskLevelColor(stats?.risk_level || "low")}>
                  {stats?.risk_level?.toUpperCase() || "LOW"}
                </Badge>
              </div>
            </div>
            {stats && stats.overall_success_rate > 5 ? (
              <TrendingUp className="h-8 w-8 text-destructive" />
            ) : (
              <TrendingDown className="h-8 w-8 text-green-500" />
            )}
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Campaigns</p>
          <p className="text-3xl font-bold mt-1">
            {stats?.total_campaigns || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats?.active_campaigns || 0} active
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Attacks Run</p>
          <p className="text-3xl font-bold mt-1">
            {stats?.total_attacks_run || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats?.total_successful_attacks || 0} successful
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Success Rate</p>
          <p className="text-3xl font-bold mt-1">
            {stats?.overall_success_rate?.toFixed(1) || "0.0"}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats && stats.overall_success_rate < 5
              ? "Excellent"
              : "Needs attention"}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Vulnerabilities by Category */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Vulnerabilities by Category
            </h3>
            {stats?.vulnerabilities_by_category &&
            Object.keys(stats.vulnerabilities_by_category).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.vulnerabilities_by_category).map(
                  ([category, count]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{category}</Badge>
                      </div>
                      <Badge variant="destructive">{count}</Badge>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No vulnerabilities found</p>
            )}
          </Card>

          {/* Recent Campaigns */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Campaigns</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("campaigns")}
              >
                View All
              </Button>
            </div>
            {campaigns.length > 0 ? (
              <div className="space-y-3">
                {campaigns.slice(0, 5).map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent"
                    onClick={() =>
                      router.push(
                        `/projects/${projectId}/red-teaming/campaigns/${campaign.id}`,
                      )
                    }
                  >
                    <div>
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          campaign.status === "completed"
                            ? "default"
                            : "outline"
                        }
                      >
                        {campaign.status}
                      </Badge>
                      {campaign.success_rate !== null && (
                        <Badge
                          variant={getRiskLevelColor(
                            campaign.risk_level || "low",
                          )}
                        >
                          {campaign.success_rate.toFixed(1)}% success
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No campaigns yet</p>
                <Button
                  className="mt-4"
                  onClick={() => setShowCreateDialog(true)}
                >
                  Create First Campaign
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">All Campaigns</h3>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>
            {campaigns.length > 0 ? (
              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent"
                    onClick={() =>
                      router.push(
                        `/projects/${projectId}/red-teaming/campaigns/${campaign.id}`,
                      )
                    }
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{campaign.name}</p>
                        <Badge
                          variant={
                            campaign.status === "completed"
                              ? "default"
                              : "outline"
                          }
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {campaign.attack_categories.join(", ")} •{" "}
                        {campaign.total_attacks} attacks
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created{" "}
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {campaign.risk_level && (
                        <Badge variant={getRiskLevelColor(campaign.risk_level)}>
                          {campaign.risk_level}
                        </Badge>
                      )}
                      {campaign.success_rate !== null && (
                        <span className="text-sm text-muted-foreground">
                          {campaign.successful_attacks}/{campaign.total_attacks}{" "}
                          succeeded
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No campaigns found</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="vulnerabilities">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Vulnerability Report</h3>
            {stats && stats.total_successful_attacks > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Total Vulnerabilities
                    </p>
                    <p className="text-2xl font-bold">
                      {stats.total_successful_attacks}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Risk Level</p>
                    <Badge
                      variant={getRiskLevelColor(stats.risk_level)}
                      className="mt-1"
                    >
                      {stats.risk_level?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    router.push(`/projects/${projectId}/review-queue`)
                  }
                >
                  View in Review Queue
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <p className="font-medium">No Vulnerabilities Found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your system passed all red team tests
                </p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Campaign Dialog */}
      <CreateCampaignDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        projectId={projectId}
        onSuccess={loadData}
      />
    </div>
  );
}
