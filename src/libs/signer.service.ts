import { ethers } from "ethers";

import { getProvider } from "./ethers.service";
import { logger } from "./logger.service";
import { SIGNER_PRIVATE_KEY } from "../globals";

interface SigningRequest {
  transactionData: string;
  to: string;
  gasLimit: number;
}

interface SigningResponse {
  signature: string;
  signerAddress: string;
  nonce: number;
}

let signer: ethers.Wallet;

function getSigner() {
  const provider = getProvider();

  if (!SIGNER_PRIVATE_KEY) {
    throw new Error("Error: No signing key set");
  }

  if (!signer) {
    signer = new ethers.Wallet(SIGNER_PRIVATE_KEY, provider);
  }

  return signer;
}

export async function signTransaction(
  signingRequest: SigningRequest
): Promise<SigningResponse> {
  const signer = getSigner();
  const provider = signer.provider;

  if (!provider) throw new Error("RPC provider not specified");

  const { to, gasLimit, transactionData } = signingRequest;

  const signerAddress = signer.address;
  logger.info(`🖋️ Signing transaction with signing key ${signerAddress}`);

  let signerNonce: number;
  try {
    signerNonce = await provider.getTransactionCount(signerAddress);
  } catch (error) {
    logger.error("❌ Unable to get signing key nonce.");
    throw error;
  }

  const chainId = (await provider.getNetwork()).chainId;

  const transactionParameters = {
    to,
    from: signerAddress,
    nonce: signerNonce,
    gasLimit,
    value: 0,
    type: 2,
    chainId,
    data: transactionData,
  };

  let populatedTransaction;
  try {
    populatedTransaction = await signer.populateTransaction(
      transactionParameters
    );
  } catch (error) {
    logger.error(`❌ Unable to populate transaction ${transactionParameters}.`);
    throw error;
  }

  let signature: string;
  try {
    signature = await signer.signTransaction(populatedTransaction);
  } catch (error) {
    logger.error(`❌ Error signing transaction ${populatedTransaction}`);
    throw error;
  }

  return {
    signature,
    signerAddress: signerAddress,
    nonce: signerNonce,
  };
}
