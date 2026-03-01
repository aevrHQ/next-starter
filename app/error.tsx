"use client";

import { InfoBox } from "@/components/ui/aevr/info-box";
import {
  SettingsCard,
  SettingsCardContent,
  SettingsCardHeader,
  SettingsCardTitle,
  SettingsRow,
  SettingsRowContent,
} from "@/components/ui/aevr/settings-card";
import { Button } from "@/components/ui/button";
import { Home, Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

interface NextErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const IS_DEV = process.env.NODE_ENV === "development";

export default function GlobalError({ error, reset }: NextErrorProps) {
  const reportedRef = useRef(false);

  useEffect(() => {
    // Attempt to report this error to administrators if it hasn't been reported yet in this session
    if (!reportedRef.current && error) {
      reportedRef.current = true;

      const reportContent = {
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        path:
          typeof window !== "undefined"
            ? window.location.href
            : "Server/Unknown",
      };

      console.error("Caught in Global Error Boundary:", error);

      // Fire and forget POST request
      fetch("/api/v1/system/report-error", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportContent),
      }).catch((e) => console.error("Could not dispatch error report:", e));
    }
  }, [error]);

  const emailBody = `
Digest:
${error.digest ?? "N/A"}

Stack:
${error.stack ?? "N/A"}
`;

  return (
    <section className="site-section flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <div className="wrapper max-w-2xl w-full flex flex-col gap-4">
        {/* Main Error Alert */}

        <InfoBox
          type={"error"}
          title={
            <span className="text-xl font-semibold">Something went wrong</span>
          }
          description={
            error.message ||
            "We're sorry, but something went wrong. Please try again later."
          }
        />

        {/* Help & Details Section */}
        <SettingsCard className="bg-white dark:bg-gray-900 border-none shadow-sm">
          <SettingsCardHeader className="pb-4">
            <SettingsCardTitle className="text-lg">
              What you can try:
            </SettingsCardTitle>
          </SettingsCardHeader>

          <SettingsCardContent>
            <div className="px-6 mb-4">
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center">
                  <span className="mr-3 text-red-500">•</span>
                  Refresh the page to see if the error resolves
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-red-500">•</span>
                  Check your internet connection
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-red-500">•</span>
                  Return to the homepage and try again
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-red-500">•</span>
                  Don&apos;t worry &mdash; our engineering team has been
                  automatically notified.
                </li>
              </ul>
            </div>

            {IS_DEV && error.stack && (
              <SettingsRow className="px-6 sm:px-6">
                <SettingsRowContent className="w-full">
                  <details className="group w-full">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none transition-colors">
                      Technical Details (Stack Trace)
                    </summary>
                    <div className="mt-3 p-4 rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <pre className="overflow-auto whitespace-pre-wrap text-[11px] text-gray-600 dark:text-gray-400 font-mono">
                        {error.stack}
                      </pre>
                    </div>
                  </details>
                </SettingsRowContent>
              </SettingsRow>
            )}

            {error.digest && (
              <SettingsRow className="px-6 sm:px-6">
                <SettingsRowContent className="w-full">
                  <details className="group w-full">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none transition-colors">
                      Digest ID
                    </summary>
                    <div className="mt-3 p-4 rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <pre className="overflow-auto whitespace-pre-wrap text-[11px] text-gray-600 dark:text-gray-400 font-mono">
                        {error.digest}
                      </pre>
                    </div>
                  </details>
                </SettingsRowContent>
              </SettingsRow>
            )}

            <div className="flex flex-col sm:flex-row gap-3 p-6 pt-4 mt-2  dark:border-gray-800">
              {reset && <Button onClick={reset}>Try Again</Button>}

              <Button
                variant={"secondary"}
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.location.reload();
                  }
                }}
              >
                Reload Page
              </Button>

              <Button asChild variant={"secondary"}>
                <Link href="/">
                  <Home size={16} color="currentColor" />
                  <span>Home</span>
                </Link>
              </Button>

              <Button asChild variant={"secondary"}>
                <Link
                  href={`mailto:${process.env.NEXT_PUBLIC_APP_SUPPORT_MAIL || "support@100pay.co"}?subject=Error Report&body=${encodeURIComponent(emailBody)}`}
                >
                  <Mail size={16} color="currentColor" />
                  <span>Contact Support</span>
                </Link>
              </Button>
            </div>
          </SettingsCardContent>
        </SettingsCard>
      </div>
    </section>
  );
}
