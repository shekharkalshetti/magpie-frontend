"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Play, Info } from "lucide-react";
import {
  createRedTeamCampaign,
  startRedTeamCampaign,
  getRedTeamTemplates,
  type RedTeamTemplate,
} from "@/lib/api";

const ATTACK_CATEGORIES = [
  {
    id: "jailbreak",
    name: "Jailbreaks",
    description: "DAN, Developer Mode, Roleplay exploits",
  },
  {
    id: "prompt_injection",
    name: "Prompt Injections",
    description: "System override, ignore instructions",
  },
  {
    id: "toxicity",
    name: "Toxicity Testing",
    description: "Hate speech, bias, violence scenarios",
  },
  {
    id: "data_leakage",
    name: "Data Leakage",
    description: "System prompt extraction, PII exposure",
  },
  {
    id: "obfuscation",
    name: "Obfuscation",
    description: "Base64, ROT13, Unicode tricks",
  },
];

export default function NewCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.project_id as string;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [attacksPerTemplate, setAttacksPerTemplate] = useState("1");
  const [targetModel, setTargetModel] = useState("qwen2.5-1.5b-instruct");
  const [failThreshold, setFailThreshold] = useState("");
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<RedTeamTemplate[]>([]);
  const [startImmediately, setStartImmediately] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const allTemplates = await getRedTeamTemplates();
      setTemplates(allTemplates);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const getTemplateCount = () => {
    if (selectedCategories.length === 0) return 0;
    return templates.filter((t) => selectedCategories.includes(t.category))
      .length;
  };

  const getTotalAttacks = () => {
    return getTemplateCount() * parseInt(attacksPerTemplate || "1");
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter a campaign name");
      return;
    }

    if (selectedCategories.length === 0) {
      alert("Please select at least one attack category");
      return;
    }

    try {
      setLoading(true);

      const campaign = await createRedTeamCampaign(projectId, {
        name: name.trim(),
        description: description.trim() || undefined,
        attack_categories: selectedCategories,
        target_model: targetModel || undefined,
        attacks_per_template: parseInt(attacksPerTemplate),
        fail_threshold_percent: failThreshold
          ? parseFloat(failThreshold)
          : undefined,
      });

      // Start immediately if requested
      if (startImmediately) {
        await startRedTeamCampaign(campaign.id);
      }

      router.push(
        `/projects/${projectId}/red-teaming/campaigns/${campaign.id}`,
      );
    } catch (error: any) {
      console.error("Error creating campaign:", error);
      alert(error.message || "Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => router.push(`/projects/${projectId}/red-teaming`)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Red Teaming
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Red Team Campaign</h1>
        <p className="text-muted-foreground mt-1">
          Set up automated adversarial testing for your LLM system
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign Details */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Campaign Details</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Security Audit - January 2026"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Monthly security assessment..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="targetModel">Target Model</Label>
              <Input
                id="targetModel"
                value={targetModel}
                onChange={(e) => setTargetModel(e.target.value)}
                placeholder="qwen2.5-1.5b-instruct"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to use default model
              </p>
            </div>
          </div>
        </Card>

        {/* Attack Categories */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Attack Categories *</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Select the types of attacks to include in this campaign
          </p>
          <div className="space-y-3">
            {ATTACK_CATEGORIES.map((category) => {
              const categoryTemplates = templates.filter(
                (t) => t.category === category.id,
              );
              return (
                <div
                  key={category.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => handleCategoryToggle(category.id)}
                >
                  <Checkbox
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{category.name}</p>
                      <Badge variant="outline">
                        {categoryTemplates.length} templates
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {category.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Test Configuration */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Test Configuration</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="attacksPerTemplate">Attacks per Template</Label>
              <Select
                value={attacksPerTemplate}
                onValueChange={setAttacksPerTemplate}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 attack per template</SelectItem>
                  <SelectItem value="3">3 attacks per template</SelectItem>
                  <SelectItem value="5">5 attacks per template</SelectItem>
                  <SelectItem value="10">10 attacks per template</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Total attacks: ~{getTotalAttacks()} ({getTemplateCount()}{" "}
                templates × {attacksPerTemplate})
              </p>
            </div>

            <div>
              <Label htmlFor="failThreshold">Failure Threshold (%)</Label>
              <Input
                id="failThreshold"
                type="number"
                value={failThreshold}
                onChange={(e) => setFailThreshold(e.target.value)}
                placeholder="20"
                min="0"
                max="100"
                step="0.1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Campaign fails if success rate exceeds this percentage
                (optional)
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Info className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Estimated time: ~{Math.ceil((getTotalAttacks() * 3) / 60)}{" "}
                minutes
              </p>
            </div>
          </div>
        </Card>

        {/* Execution Options */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Execution Options</h3>
          <div className="flex items-center gap-2">
            <Checkbox
              id="startImmediately"
              checked={startImmediately}
              onCheckedChange={(checked) =>
                setStartImmediately(checked as boolean)
              }
            />
            <Label htmlFor="startImmediately" className="cursor-pointer">
              Start campaign immediately after creation
            </Label>
          </div>
          <p className="text-xs text-muted-foreground mt-2 ml-6">
            If unchecked, you can manually start the campaign later
          </p>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/projects/${projectId}/red-teaming`)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || selectedCategories.length === 0}
          >
            {loading ? (
              "Creating..."
            ) : (
              <>
                {startImmediately && <Play className="h-4 w-4 mr-2" />}
                {startImmediately
                  ? "Create & Start Campaign"
                  : "Create Campaign"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
