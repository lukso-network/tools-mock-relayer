import { ethers } from "ethers";

import { getProvider } from "./ethers.service";
import { SIGNER_PRIVATE_KEY } from "../globals";

export interface SigningRequest {
  transactionData: string;
  to: string;
  gasLimit: string | number;
}

let signer: ethers.Wallet;

export function getSigner() {
  const provider = getProvider();

  if (!SIGNER_PRIVATE_KEY) {
    throw new Error("Error: No signing key set");
  }

  if (!signer) {
    signer = new ethers.Wallet(SIGNER_PRIVATE_KEY, provider);
  }

  return signer;
}

export async function signTransaction(signingRequest: SigningRequest) {
  const signer = getSigner();
  const provider = signer.provider;

  if (!provider) throw new Error("RPC provider not specified");

  const { to, gasLimit, transactionData } = signingRequest;

  const signerAddress = signer.address;

  const signerNonce = await provider.getTransactionCount(signerAddress);

  const txRequest = {
    to,
    from: signerAddress,
    nonce: signerNonce,
    gasLimit,
    value: ethers.utils.hexlify(0),
    type: 2,
    chainId: (await provider.getNetwork()).chainId,
    data: transactionData,
  };

  const populatedTransaction = await signer.populateTransaction(txRequest);
  const signedTransaction = await signer.signTransaction(populatedTransaction);

  return {
    signedTransaction,
    signerAddress: signerAddress,
    nonce: signerNonce,
  };
}
