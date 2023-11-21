
import { BigNumber } from "ethers";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

import { quotaMode } from "./quota.controller";
import { SignatureAuth } from "./quota.interfaces";
import { getTokenTransactionsCountQuota, QuotaMode } from "./quota.service";


export async function quotaMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (QuotaMode.TokenQuotaTransactionsCount !== quotaMode) {
    next();
    return;
  }

  const quotaLeft = await getTokenTransactionsCountQuota(
    req.body as SignatureAuth
  );

  if (quotaLeft.lt(BigNumber.from(1))) {
    // If there is no enough quota UPGRADE it
    res.status(httpStatus.UPGRADE_REQUIRED);
    return;
  }

  next();
}
