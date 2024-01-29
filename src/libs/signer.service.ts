import { BigNumber, ethers } from "ethers";

import { getProvider } from "./ethers.service";
import { logger } from "./logger.service";
import { CHAIN_ID, SIGNER_PRIVATE_KEY } from "../globals";

interface SigningRequest {
  transactionData: string;
  to: string;
  gasLimit: BigNumber;
}

interface SigningResponse {
  signerSignature: string;
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

  let signerBalanceInWei: ethers.BigNumber;
  try {
    signerBalanceInWei = await signer.getBalance();
  } catch (error) {
    logger.error("❌ Unable to get signing key balance.");
    throw error;
  }

  logger.info(
    `💰 Signer address ${
      signer?.address
    } has a balance of ${ethers.utils.formatEther(signerBalanceInWei)} LYX`
  );

  const { to, gasLimit, transactionData } = signingRequest;

  if (Number(gasLimit) > Number(signerBalanceInWei)) {
    const errorMessage = `😢 Insufficiant balance. Gas Limit : ${gasLimit} SignerKeyBalance : ${signerBalanceInWei}`;
    throw new Error(errorMessage);
  }

  const signerAddress = signer.address;
  logger.info(`🖋️ Signing transaction with signing key ${signerAddress}`);

  let signerNonce: number;
  try {
    signerNonce = await provider.getTransactionCount(signerAddress);
  } catch (error) {
    logger.error("❌ Unable to get signing key nonce.");
    throw error;
  }

  const transactionParameters = {
    to,
    from: signerAddress,
    nonce: signerNonce,
    gasLimit,
    value: 0,
    type: 2,
    chainId: Number.parseInt(CHAIN_ID),
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

  let signerSignature: string;
  try {
    signerSignature = await signer.signTransaction(populatedTransaction);
  } catch (error) {
    logger.error(`❌ Error signing transaction ${populatedTransaction}`);
    throw error;
  }

  return {
    signerSignature,
    signerAddress: signerAddress,
    nonce: signerNonce,
  };
}
