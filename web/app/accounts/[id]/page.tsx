import React from "react";
import { AccountDetailClient } from "./AccountDetailClient";

export async function generateStaticParams() {
  return [
    { id: "ACCT_MULE_001" },
    { id: "ACCT_MULE_002" },
    { id: "ACCT_MULE_003" },
    { id: "ACCT_MULE_004" },
    { id: "ACCT_LEGIT_001" },
    { id: "ACCT_LEGIT_002" },
    { id: "ACCT_TEST_PT_01" },
    { id: "ACCT_TEST_SMURF_02" },
    { id: "ACCT_TEST_BURST_03" },
    { id: "ACCT_TEST_MULE_PASS" },
    { id: "ACCT_TEST_SMURF" },
    { id: "ACCT_TEST_BURST" },
    { id: "ACCT_TEST_HUB" },
  ];
}

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <AccountDetailClient accountId={resolvedParams.id} />;
}
