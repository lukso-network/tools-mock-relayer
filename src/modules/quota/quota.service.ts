/**
 * Returns Quota data based on type
 * Open for extensions if people are willing to implement them in QuotaModes enums
 */

import { Request } from "express";

import { SignatureAuth } from "./quota.interfaces";
import { LSP7DigitalAsset__factory } from "../../../types/ethers-v5";
import { getProvider } from "../../libs/ethers.service";

export enum QuotaMode {
  DummyQuota = "DummyQuota",
  TokenQuotaTransactionsCount = "TokenQuotaTransactionsCount",
}

const quotaTokenAddress: string =
  process.env.QUOTA_TOKEN_ADDRESS ||
  "0x2454A56269b1a978655D1aeCD24d6cc7c59aD5b6";

export async function handleQuotas(
  req: Request,
  quotaType: QuotaMode = QuotaMode.DummyQuota
) {
  if (QuotaMode.TokenQuotaTransactionsCount === quotaType) {
    const signatureAuthParameters = req.body as SignatureAuth;
    const { address, timestamp, signature } =
      signatureAuthParameters as SignatureAuth;
    if (!address || !timestamp || !signature) {
      throw new Error(
        "handleQuotas function should be used only if signature is present in the request"
      );
    }
    const quota = await getTokenTransactionsCountQuota(signatureAuthParameters);

    return {
      quota: quota,
      unit: "transactionCount",
      totalQuota: quota,
      resetDate: getDummyResetDate(new Date()),
    };
  }

  return handleDummyQuota();
}

function handleDummyQuota() {
  return {
    quota: 1543091,
    unit: "gas",
    totalQuota: 5000000,
    resetDate: getDummyResetDate(new Date()),
  };
}

export async function getTokenTransactionsCountQuota(
  signatureAuth: SignatureAuth
): Promise<number> {
  const provider = getProvider();
  const lsp7Token = LSP7DigitalAsset__factory.connect(
    quotaTokenAddress,
    provider
  );
  const quota = await lsp7Token.balanceOf(signatureAuth.address);

  return quota.toNumber();
}

function getDummyResetDate(resetDate: Date) {
  resetDate.setMonth(resetDate.getMonth() + 1);
  resetDate.setDate(1);
  resetDate.setHours(0);
  resetDate.setMinutes(0);
  resetDate.setSeconds(0);
  resetDate.setMilliseconds(0);
  return Math.floor(resetDate.getTime() / 1000);
}
