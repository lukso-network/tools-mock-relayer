/**
 * Returns Quota data based on type
 * Open for extensions if people are willing to implement them in QuotaModes enums
 */

import { BigNumber } from "ethers";
import { Request } from "express";

import { SignatureAuth } from "./quota.interfaces";
import { LSP7DigitalAsset__factory } from "../../../types/ethers-v5";
import { QUOTA_CONTRACT_ADDRESS } from "../../globals";
import { getProvider } from "../../libs/ethers.service";
import { getSigner } from "../../libs/signer.service";

export enum QuotaMode {
  DummyQuota = "DummyQuota",
  TokenQuotaTransactionsCount = "TokenQuotaTransactionsCount",
}

export const quotaTokenAddress: string = QUOTA_CONTRACT_ADDRESS;

export async function handleQuotas(
  req: Request,
  quotaType: QuotaMode = QuotaMode.DummyQuota
) {
  if (QuotaMode.TokenQuotaTransactionsCount !== quotaType) {
    return handleDummyQuota();
  }

  const signatureAuthParameters = req.body as SignatureAuth;
  const { address, timestamp, signature } =
    signatureAuthParameters as SignatureAuth;
  if (!address || !timestamp || !signature) {
    throw new Error(
      "handleQuotas function should be used only if signature is present in the request"
    );
  }
  const quota = await getTokenTransactionsCountQuota(signatureAuthParameters);

  console.log(`QUOTA TO NUMBER: ${quota.toNumber()}`);

  let tokensByOperator = BigNumber.from(0);

  //  This operation shall be assumed safe
  tokensByOperator = await getAuthorizedAmountFor(signatureAuthParameters);

  //  Ideally UP plugin does transactionCount model, but at this moment quotas are multiplied
  return {
    //  total quota represents all the LSP7 tokens that UP has
    quota: (quota.toNumber() + 1) * 100000000000,
    unit: "transactionCount",
    //  total quota represents all the LSP7 that was authorized in this backend
    totalQuota: tokensByOperator,
    resetDate: getDummyResetDate(new Date()),
  };
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
): Promise<BigNumber> {
  const provider = getProvider();
  const lsp7Token = LSP7DigitalAsset__factory.connect(
    quotaTokenAddress,
    provider
  );
  return await lsp7Token.balanceOf(signatureAuth.address);
}

export async function getAuthorizedAmountFor(
  signatureAuth: SignatureAuth
): Promise<BigNumber> {
  const provider = getProvider();
  const lsp7Token = LSP7DigitalAsset__factory.connect(
    quotaTokenAddress,
    provider
  );

  return await lsp7Token.authorizedAmountFor(
    getSigner().address,
    signatureAuth.address
  );
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
