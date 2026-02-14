"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createRedTeamCampaign, getRedTeamTemplates } from "@/lib/api";

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}

export function CreateCampaignDialog({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: CreateCampaignDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [attacksPerType, setAttacksPerType] = useState([10]);
  const [targetModel, setTargetModel] = useState("");
  const [templateCount, setTemplateCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const attackTypes = [
    { value: "jailbreak", label: "Jailbreaks", icon: "🔓" },
    { value: "prompt_injection", label: "Prompt Injections", icon: "💉" },
    { value: "toxicity", label: "Toxicity", icon: "☠️" },
    { value: "data_leakage", label: "Data Leakage", icon: "🔍" },
    { value: "obfuscation", label: "Obfuscation", icon: "🎭" },
  ];

  useEffect(() => {
    if (selectedTypes.length > 0) {
      loadTemplateCount();
    } else {
      setTemplateCount(0);
    }
  }, [selectedTypes]);

  const loadTemplateCount = async () => {
    try {
      const templates = await getRedTeamTemplates();
      const filtered = templates.filter((t) =>
        selectedTypes.includes(t.category),
      );
      setTemplateCount(filtered.length);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const handleToggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTypes.length === 0) {
      alert("Please select at least one attack type");
      return;
    }

    setLoading(true);
    try {
      const campaign = await createRedTeamCampaign(projectId, {
        name,
        attack_categories: selectedTypes,
        target_model: targetModel || undefined,
        attacks_per_template: attacksPerType[0],
      });

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
      router.push(
        `/projects/${projectId}/red-teaming/campaigns/${campaign.id}`,
      );
    } catch (error: any) {
      alert(error.message || "Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!loading) {
      onOpenChange(open);
      if (!open) {
        // Reset form
        setName("");
        setSelectedTypes([]);
        setAttacksPerType([10]);
        setTargetModel("");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Red Team Campaign</DialogTitle>
          <DialogDescription>
            Configure a new adversarial testing campaign to identify security
            vulnerabilities
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              placeholder="e.g., Q4 2024 Security Audit"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Attack Types */}
          <div className="space-y-2">
            <Label>Attack Categories</Label>
            <div className="grid grid-cols-1 gap-3">
              {attackTypes.map((type) => (
                <label
                  key={type.value}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                >
                  <Checkbox
                    checked={selectedTypes.includes(type.value)}
                    onCheckedChange={() => handleToggleType(type.value)}
                  />
                  <span className="text-lg">{type.icon}</span>
                  <span className="flex-1">{type.label}</span>
                </label>
              ))}
            </div>
            {selectedTypes.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {templateCount} templates will be used ({selectedTypes.length}{" "}
                {selectedTypes.length === 1 ? "category" : "categories"})
              </p>
            )}
          </div>

          {/* Target Model */}
          <div className="space-y-2">
            <Label htmlFor="model">Target Model (Optional)</Label>
            <Input
              id="model"
              placeholder="e.g., gpt-4, claude-3"
              value={targetModel}
              onChange={(e) => setTargetModel(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use default model
            </p>
          </div>

          {/* Attacks Per Template */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Attacks Per Template</Label>
              <span className="text-sm font-medium">{attacksPerType[0]}</span>
            </div>
            <Slider
              min={1}
              max={20}
              step={1}
              value={attacksPerType}
              onValueChange={setAttacksPerType}
            />
            <p className="text-xs text-muted-foreground">
              Total attacks: {templateCount * attacksPerType[0]}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || selectedTypes.length === 0}
            >
              {loading ? "Creating..." : "Create Campaign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
