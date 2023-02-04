import express, { Request, Response } from "express";
import httpStatus from "http-status";

import { handleQuota } from "./quota.service";
import { validateSignatureAuthentication } from "./signatureAuth.middleware";

const quotaController = express.Router();

quotaController.post(
  "/",
  validateSignatureAuthentication,
  async (req: Request, res: Response) => {
    try {
      const quota = handleQuota();

      res.send(quota);
    } catch (error) {
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send("Internal Server Error");
    }
  }
);

export default quotaController;
