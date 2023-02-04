import ERC725 from "@erc725/erc725.js";
import { ethers } from "ethers";
import { arrayify } from "ethers/lib/utils";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

import { SignatureAuth } from "./quota.interfaces";
import { UniversalProfile__factory } from "../../../types/ethers-v5";
import {
  ADDRESS_PERMISSIONS_PREFIX,
  LSP0_INTERFACE_ID,
  TIMESTAMP_AUTH_WINDOW_IN_SECONDS,
} from "../../globals";
import { getProvider } from "../../libs/ethers.service";

export async function validateSignatureAuthentication(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const signatureAuthParameters = req.body as SignatureAuth;

  const { address, timestamp, signature } =
    signatureAuthParameters as SignatureAuth;

  if (!address || !timestamp || !signature) {
    res
      .status(httpStatus.UNAUTHORIZED)
      .send(
        "Invalid authorization parameters. Missing or empty address, timestamp or signature"
      );
    return;
  }

  const universalProfile = UniversalProfile__factory.connect(
    address,
    getProvider()
  );

  try {
    const isUniversalProfile = await universalProfile.supportsInterface(
      LSP0_INTERFACE_ID
    );

    if (!isUniversalProfile) {
      throw new Error();
    }
  } catch (error) {
    res
      .status(httpStatus.BAD_REQUEST)
      .send(
        `Provided Address ${address} is not a Universal Profile (it does not support the LSP0ERC725Account interface).`
      );
    return;
  }

  const unix = Math.round(Date.now() / 1000);

  const isTimestampValid =
    timestamp < unix + +TIMESTAMP_AUTH_WINDOW_IN_SECONDS &&
    timestamp > unix - +TIMESTAMP_AUTH_WINDOW_IN_SECONDS;

  if (!isTimestampValid) {
    res
      .status(httpStatus.UNAUTHORIZED)
      .send(
        "Stale Signature. Sign a new message. [The timestamp should be in seconds]"
      );
    return;
  }

  const message = ethers.utils.solidityKeccak256(
    ["address", "uint"],
    [address, timestamp]
  );

  let signer: string;

  try {
    signer = ethers.utils.verifyMessage(arrayify(message), signature);
  } catch {
    res.status(httpStatus.UNAUTHORIZED).send(`Invalid signature`);
    return;
  }

  const signerPermissions = await universalProfile["getData(bytes32)"](
    ADDRESS_PERMISSIONS_PREFIX + signer.slice(2)
  );

  if (
    signerPermissions === "0x" ||
    signerPermissions === ERC725.encodePermissions({})
  ) {
    res
      .status(httpStatus.UNAUTHORIZED)
      .send(
        `Recovered signer address ${signer} does not have permissions on the Universal Profile: ${address}`
      );
    return;
  }

  next();
}
