import express, { Request, Response } from "express";
import httpStatus from "http-status";

import {
  guardTokenSpendingQuota,
  validateExecuteSignature,
} from "./executeAuth.middleware";
import { ExecutePayload } from "./relayer.interfaces";
import { handleExecute } from "./relayer.service";
import { logger } from "../../libs/logger.service";
import { quotaMiddleware } from "../quota/quota.middleware";

const relayerController = express.Router();

relayerController.post(
  "/execute",
  validateExecuteSignature,
  quotaMiddleware,
  guardTokenSpendingQuota,
  async (req: Request, res: Response) => {
    const { address, transaction } = req.body as ExecutePayload;

    try {
      const transactionHash = await handleExecute(address, transaction);

      res.send({ transactionHash });
    } catch (error: any) {
      logger.error(error.message);

      if (error.message.includes("Transaction in progress")) {
        res.status(httpStatus.TOO_MANY_REQUESTS).send(error.message);
        return;
      }

      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send("Internal Server Error");
    }
  }
);

export default relayerController;
