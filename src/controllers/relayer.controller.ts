import express, { Request, Response } from "express";

const router = express.Router();

router.get("/execute", (req: Request, res: Response) => {
  res.send({ transactionHash: "0x" });
});

export default router;
