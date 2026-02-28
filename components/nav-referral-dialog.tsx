"use client";

import React, { useEffect, useState } from "react";
import ResponsiveDialog from "@/components/ui/aevr/responsive-dialog";
import { InfoBox } from "@/components/ui/aevr/info-box";
import { useAuth } from "@/components/providers/auth-provider";
import { PayIDService } from "@/utils/payid/payid-service";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TagIcon,
  CopyIcon,
  UsersIcon,
  CheckCircleIcon,
  GiftIcon,
} from "lucide-react";

interface NavReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ReferredUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  createdAt: string;
}

export function NavReferralDialog({
  open,
  onOpenChange,
}: NavReferralDialogProps) {
  const { user, refreshSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingReferrals, setFetchingReferrals] = useState(false);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [retroactiveCode, setRetroactiveCode] = useState("");

  const hasPayTag = !!user?.payTag;

  // Fetch referrals when dialog opens if they have a payTag
  useEffect(() => {
    if (open && hasPayTag) {
      loadReferrals();
    }
  }, [open, hasPayTag]);

  const loadReferrals = async () => {
    setFetchingReferrals(true);
    try {
      const response = await fetch("/api/v1/user/referrals");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReferredUsers(data.data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch referrals", e);
    } finally {
      setFetchingReferrals(false);
    }
  };

  const handleGenerateMagicLink = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const payIdService = new PayIDService();
      const response = await payIdService.requestOAuthMagicLink({
        email: user.email,
        shouldCreate: true,
        firstName: user.firstName,
        lastName: user.lastName,
      });

      if (response.success) {
        sileo.success({
          title: "Check your email",
          description: "We sent a secure link to activate your referral code.",
        });
        onOpenChange(false);
      } else {
        sileo.error({
          title: "Setup Failed",
          description: response.message || "Please try again later.",
        });
      }
    } catch {
      sileo.error({
        title: "An error occurred",
        description: "Could not process your request.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (user?.payTag) {
      await navigator.clipboard.writeText(user.payTag);
      sileo.success({
        title: "Copied!",
        description: "Your referral code is copied to the clipboard.",
      });
    }
  };

  const handleSubmitRetroactiveCode = async () => {
    if (!retroactiveCode.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/v1/user/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: retroactiveCode.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        sileo.success({
          title: "Referral Applied",
          description: `You were referred by ${data.data.referredBy}.`,
        });

        if (user) {
          // Trigger a session refresh to pull the newly set string association
          refreshSession();
        }
        setRetroactiveCode("");
      } else {
        sileo.error({
          title: "Invalid Code",
          description:
            data.message || "That referral code could not be applied.",
        });
      }
    } catch {
      sileo.error({
        title: "Error",
        description: "Could not apply referral code.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <ResponsiveDialog
      openPrompt={open}
      onOpenPromptChange={(v) => onOpenChange(!!v)}
      title="Refer a Friend"
      description="Invite your friends to Bucket to earn rewards together."
    >
      <div className="flex flex-col gap-6 py-4">
        {/* If the user doesn't have a paytag, they can't refer anyone yet */}
        {!hasPayTag ? (
          <InfoBox
            type="warning"
            icon={<GiftIcon className="h-6 w-6 text-yellow-500" />}
            title="Setup your Referral Code"
            description="You need to link a PayID account before you can receive a referral code. Click below to securely generate one right now."
            actions={[
              {
                name: loading ? "Generating..." : "Generate Referral Code",
                onClick: handleGenerateMagicLink,
                variant: "default",
                disabled: loading,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any,
            ]}
          />
        ) : (
          /* If they DO have a PayTag, show the active dashboard */
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                Your Referral Code
              </span>
              <div
                onClick={handleCopyCode}
                className="flex items-center gap-3 cursor-pointer select-all rounded-lg bg-background px-6 py-3 text-3xl font-bold tracking-tight shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                title="Click to copy"
              >
                {user.payTag}
                <CopyIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            {/* Retroactive Referral Submission (If they weren't referred) */}
            {!user.referredBy && (
              <div className="flex flex-col gap-2 rounded-xl bg-muted/50 p-4">
                <span className="text-sm font-medium">Were you referred?</span>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <TagIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Enter a friend's PayTag code"
                      className="pl-9 bg-background"
                      value={retroactiveCode}
                      onChange={(e) => setRetroactiveCode(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <Button
                    onClick={handleSubmitRetroactiveCode}
                    disabled={!retroactiveCode.trim() || loading}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            )}

            {/* Readonly Referenced By */}
            {user.referredBy && (
              <div className="flex items-center gap-2 rounded-xl border bg-green-50/50 p-4 text-green-700 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-400">
                <CheckCircleIcon className="h-5 w-5" />
                <span className="text-sm font-medium">
                  You were referred by <strong>{user.referredBy}</strong>
                </span>
              </div>
            )}

            {/* Who I Referred List */}
            <div className="flex flex-col gap-4 pt-4 border-t">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <UsersIcon className="h-4 w-4" />
                People you&apos;ve referred ({referredUsers.length})
              </h4>

              {fetchingReferrals ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : referredUsers.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  You haven&apos;t referred anyone yet. Share your code to get
                  started!
                </div>
              ) : (
                <div className="flex max-h-48 flex-col gap-2 overflow-y-auto pr-2">
                  {referredUsers.map((rUser) => (
                    <div
                      key={rUser._id}
                      className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {rUser.firstName?.charAt(0) || rUser.email.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {rUser.firstName} {rUser.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Joined{" "}
                            {new Date(rUser.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}
