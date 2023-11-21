import { EIP191Signer } from "@lukso/eip191-signer.js";
import { BigNumber, ethers } from "ethers";
import { getAddress } from "ethers/lib/utils";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

import { ExecutePayload } from "./relayer.interfaces";
import { UniversalProfile__factory } from "../../../types/ethers-v5";
import { CHAIN_ID, IS_VALID_SIGNATURE_MAGIC_VALUE } from "../../globals";
import { getProvider } from "../../libs/ethers.service";
import { getSigner } from "../../libs/signer.service";
import { quotaMode } from "../quota/quota.controller";
import {
  getAuthorizedAmountFor,
  QuotaMode,
  quotaTokenAddress,
} from "../quota/quota.service";

const isQuotaModeTransactionsCount =
  QuotaMode.TokenQuotaTransactionsCount === quotaMode;

const linkToQuotaCharge = "https://docs.un1.io/faq";

export async function validateRequestPayload(executeRequest: ExecutePayload) {
  const { address, transaction } = executeRequest;

  let isValidRequest = true;
  let errorMessage = "";

  try {
    if (!address) throw new Error();

    getAddress(address);
  } catch {
    isValidRequest = false;
    errorMessage = "Invalid address provided";
  }

  try {
    if (!transaction) throw new Error();

    const { abi, signature, nonce } = transaction;

    if (!abi || !signature || !nonce) {
      throw new Error();
    }
  } catch {
    isValidRequest = false;
    errorMessage = "Invalid transaction parameters";
    return;
  }

  if (!isValidRequest) {
    throw new Error(errorMessage);
  }
}

export async function guardTokenSpendingQuota(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!isQuotaModeTransactionsCount) {
    next();

    return;
  }

  const { address } = req.body as ExecutePayload;

  const tokensByOperator = isQuotaModeTransactionsCount
    ? await getAuthorizedAmountFor({
        address: address,
        timestamp: 0,
        signature: "",
      })
    : BigNumber.from(0);

  if (isQuotaModeTransactionsCount && tokensByOperator.lt(BigNumber.from(1))) {
    const operatorAddress = getSigner().address;
    res.status(httpStatus.UPGRADE_REQUIRED).send({
      message: `Authorize relayer to your LSP7 tokens. Visit ${linkToQuotaCharge}`,
      tokenAddress: quotaTokenAddress,
      address: address,
      operator: operatorAddress,
    });
    return;
  }

  next();
}

export async function validateExecuteSignature(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const executeRequest: ExecutePayload = req.body;

  try {
    validateRequestPayload(executeRequest);
  } catch (error: any) {
    res.status(httpStatus.BAD_REQUEST).send(error.message);
    return;
  }

  const { address, transaction } = executeRequest;

  const provider = getProvider();

  const universalProfile = UniversalProfile__factory.connect(address, provider);
  const keyManagerAddress = await universalProfile.owner();

  const message = ethers.utils.solidityPack(
    ["uint256", "uint256", "uint256", "uint256", "uint256", "bytes"],
    [
      6,
      CHAIN_ID,
      transaction.nonce,
      transaction.validityTimestamps || 0,
      0,
      transaction.abi,
    ]
  );

  const eip191Signer = new EIP191Signer();

  const messageHash = eip191Signer.hashDataWithIntendedValidator(
    keyManagerAddress,
    message
  );

  try {
    const isValidSignature = await universalProfile.isValidSignature(
      messageHash,
      transaction.signature
    );

    if (isValidSignature !== IS_VALID_SIGNATURE_MAGIC_VALUE) {
      throw new Error();
    }
  } catch {
    res.status(httpStatus.UNAUTHORIZED).send("Invalid Signature provided");
    return;
  }

  next();
}
