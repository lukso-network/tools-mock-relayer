import ERC725 from "@erc725/erc725.js";
import { ERC725YDataKeys, INTERFACE_IDS } from "@lukso/lsp-smart-contracts";
import { ethers } from "ethers";
import { arrayify } from "ethers/lib/utils";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

import { SignatureAuth } from "./quota.interfaces";
import { UniversalProfile__factory } from "../../../types/ethers-v5";
import { TIMESTAMP_AUTH_WINDOW_IN_SECONDS } from "../../globals";
import { getProvider } from "../../libs/ethers.service";
import {handleQuotas, QuotaMode} from "./quota.service";
import {quotaMode} from "./quota.controller";

export async function quotaMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (QuotaMode.TokenQuotaTransactionsCount !== quotaMode) {
    next();
    return;
  }

  handleQuotas(req, quotaMode);

  next();
}
