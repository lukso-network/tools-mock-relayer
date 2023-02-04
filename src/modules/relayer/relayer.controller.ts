import express, { Request, Response } from "express";

import { ExecutePayload } from "./relayer.interfaces";
import { handleExecute } from "./relayer.service";
import { logger } from "../../libs/logger.service";

const relayerController = express.Router();

relayerController.post("/execute", async (req: Request, res: Response) => {
  const { address, transaction } = req.body as ExecutePayload;

  try {
    const transactionHash = await handleExecute(address, transaction);
    res.send({ transactionHash });
  } catch (error: any) {
    logger.error(error.message);

    if (error.message.includes("Transaction in progress")) {
      res.status(429).send(error.message);
      return;
    }

    if (error.message) res.status(500).send("Internal Server Error");
  }
});

export default relayerController;
