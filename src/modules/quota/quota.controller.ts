import express, { Request, Response } from "express";

import { handleQuota } from "./quota.service";

const quotaController = express.Router();

quotaController.post("/", async (req: Request, res: Response) => {
  const quota = handleQuota();

  res.send(quota);
});

export default quotaController;
