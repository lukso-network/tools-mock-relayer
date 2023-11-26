import { BigNumber } from "ethers";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

import { quotaMode } from "./quota.controller";
import { SignatureAuth } from "./quota.interfaces";
import {
  getTokenTransactionsCountQuota,
  QuotaMode,
  quotaTokenAddress,
} from "./quota.service";
import { LINK_TO_QUOTA_CHARGE } from "../../globals";
import { getSigner } from "../../libs/signer.service";

export async function quotaMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (QuotaMode.TokenQuotaTransactionsCount !== quotaMode) {
    next();
    return;
  }
  const signatureAuth = req.body as SignatureAuth;
  let quotaLeft = BigNumber.from(0);

  try {
    quotaLeft = await getTokenTransactionsCountQuota(req.body as SignatureAuth);
  } catch (err) {}

  if (quotaLeft.lt(BigNumber.from(1))) {
    // If there is no enough quota UPGRADE it
    res.status(httpStatus.UPGRADE_REQUIRED).send({
      message: `Authorize relayer to your LSP7 tokens. Visit ${LINK_TO_QUOTA_CHARGE}`,
      tokenAddress: quotaTokenAddress,
      address: signatureAuth.address,
      operator: getSigner().address,
    });
    return;
  }

  next();
}
