import express, { Request, Response } from "express";

import { ExecutePayload } from "./relayer.interfaces";
import { handleExecute } from "./relayer.service";
import { logger } from "../../libs/logger.service";

const router = express.Router();

router.post("/execute", async (req: Request, res: Response) => {
  const { address, transaction } = req.body as ExecutePayload;

  try {
    const transactionHash = await handleExecute(address, transaction);
    res.send({ transactionHash });
  } catch (error: any) {
    logger.error(error.message);
    res.status(500).send(new Error("Internal Server Error"));
  }
});

export default router;
