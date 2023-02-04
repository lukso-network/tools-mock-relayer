import { EIP191Signer } from "@lukso/eip191-signer.js";
import { ethers } from "ethers";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

import { ExecutePayload } from "./relayer.interfaces";
import { UniversalProfile__factory } from "../../../types/ethers-v5";
import { CHAIN_ID, IS_VALID_SIGNATURE_MAGIC_VALUE } from "../../globals";
import { getProvider } from "../../libs/ethers.service";

export async function validateExecuteSignature(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const executeRequest: ExecutePayload = req.body;

  const { address, transaction } = executeRequest;

  const provider = getProvider();

  const universalProfile = UniversalProfile__factory.connect(address, provider);
  const keyManagerAddress = await universalProfile.owner();

  const message = ethers.utils.solidityPack(
    ["uint256", "uint256", "uint256", "uint256", "bytes"],
    [6, CHAIN_ID, transaction.nonce, 0, transaction.abi]
  );

  const eip191Signer = new EIP191Signer();

  const messageHash = eip191Signer.hashDataWithIntendedValidator(
    keyManagerAddress,
    message
  );

  try {
    const isValidSignature = await universalProfile.isValidSignature(
      messageHash,
      transaction.signature
    );

    if (isValidSignature !== IS_VALID_SIGNATURE_MAGIC_VALUE) {
      throw new Error();
    }
  } catch {
    res.status(httpStatus.UNAUTHORIZED).send("Invalid Signature provided");
    return;
  }

  next();
}
