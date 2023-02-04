import express, { Request, Response } from "express";

import { ExecutePayload } from "./relayer.interfaces";
import { handleExecute } from "./relayer.service";

const router = express.Router();

router.post("/execute", async (req: Request, res: Response) => {
  const { address, transaction } = req.body as ExecutePayload;

  const transactionHash = await handleExecute(address, transaction);

  res.send({ transactionHash });
});

export default router;
