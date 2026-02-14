"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getRedTeamStats, type RedTeamStats } from "@/lib/api";

interface SecurityWidgetProps {
  projectId: string;
}

export function SecurityWidget({ projectId }: SecurityWidgetProps) {
  const router = useRouter();
  const [stats, setStats] = useState<RedTeamStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [projectId]);

  const loadStats = async () => {
    try {
      const data = await getRedTeamStats(projectId);
      setStats(data);
    } catch (error) {
      console.error("Error loading security stats:", error);
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
      return <AlertTriangle className="h-5 w-5" />;
    }
    return <Shield className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-8 bg-muted rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Security Assessment</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/projects/${projectId}/red-teaming`)}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View Details
          </Button>
        </div>

        {/* Risk Level */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            {getRiskLevelIcon(stats?.risk_level || "low")}
            <div>
              <p className="text-sm text-muted-foreground">
                Current Risk Level
              </p>
              <Badge
                variant={getRiskLevelColor(stats?.risk_level || "low")}
                className="mt-1"
              >
                {stats?.risk_level?.toUpperCase() || "LOW"}
              </Badge>
            </div>
          </div>
          {stats && stats.overall_success_rate > 5 ? (
            <TrendingUp className="h-6 w-6 text-destructive" />
          ) : (
            <TrendingDown className="h-6 w-6 text-green-500" />
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Campaigns</p>
            <p className="text-2xl font-bold mt-1">
              {stats?.total_campaigns || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Attacks Run</p>
            <p className="text-2xl font-bold mt-1">
              {stats?.total_attacks_run || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Success Rate</p>
            <p className="text-2xl font-bold mt-1">
              {stats?.overall_success_rate
                ? `${stats.overall_success_rate.toFixed(1)}%`
                : "0%"}
            </p>
          </div>
        </div>

        {/* Vulnerabilities by Category */}
        {stats?.vulnerabilities_by_category &&
          Object.keys(stats.vulnerabilities_by_category).length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Top Vulnerabilities</p>
              <div className="space-y-2">
                {Object.entries(stats.vulnerabilities_by_category)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 3)
                  .map(([category, count]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground capitalize">
                        {category.replace("_", " ")}
                      </span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}

        {/* Recent Campaigns */}
        {stats?.recent_campaigns && stats.recent_campaigns.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Recent Tests</p>
            <div className="space-y-2">
              {stats.recent_campaigns.slice(0, 2).map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between text-sm p-2 bg-muted rounded hover:bg-accent cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/projects/${projectId}/red-teaming/campaigns/${campaign.id}`,
                    )
                  }
                >
                  <span className="truncate flex-1">{campaign.name}</span>
                  <Badge variant="outline" className="ml-2">
                    {campaign.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          className="w-full"
          onClick={() =>
            router.push(`/projects/${projectId}/red-teaming/campaigns/new`)
          }
        >
          Run New Security Test
        </Button>
      </div>
    </Card>
  );
}
