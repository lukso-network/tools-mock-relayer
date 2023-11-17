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
      const quota = await handleQuotas(req, quotaMode);

      res.send(quota);
    } catch (error) {
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send("Internal Server Error");
    }
  }
);

//  This controller is only for debugging purposes and will be removed
quotaController.get("/", async (req: Request, res: Response) => {
  try {
    req.body = {
      address: "0x30E0693E4C4807C157F8b2e1426a74930C426b25",
      timestamp: Math.floor(new Date().getTime() / 1000),
      signature: "0x30E0693E4C4807C157F8b2e1426a74930C426b25",
    };

    const quota = await handleQuotas(req, quotaMode);
    res.send(quota);
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
});

export default quotaController;
