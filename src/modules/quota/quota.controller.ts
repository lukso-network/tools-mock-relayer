import express, { Request, Response } from "express";
import httpStatus from "http-status";

import { handleQuotas, QuotaMode } from "./quota.service";
import { validateSignatureAuthentication } from "./signatureAuth.middleware";

const quotaController = express.Router();
const quotaMode: QuotaMode =
  (process.env.QUOTA_MODE as QuotaMode) || QuotaMode.DummyQuota;

quotaController.post(
  "/",
  validateSignatureAuthentication,
  async (req: Request, res: Response) => {
    try {
      const quota = handleQuotas(req, quotaMode);

      res.send(quota);
    } catch (error) {
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send("Internal Server Error");
    }
  }
);

export default quotaController;
