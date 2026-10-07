"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AccountInvestigation } from "@/components/AccountInvestigation";

export function AccountDetailClient({ accountId }: { accountId: string }) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#c5d0be] text-[#26301f] font-sans antialiased p-3 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1440px]">
        {accountId ? (
          <AccountInvestigation accountId={accountId} onBack={() => router.push("/?tab=accounts")} />
        ) : (
          <div className="clay-card p-8 text-center text-[#6b7663]">Invalid account identifier.</div>
        )}
      </div>
    </div>
  );
}
