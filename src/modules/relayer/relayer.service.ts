import { ethers } from "ethers";

import { Transaction } from "./relayer.interfaces";
import {
  LSP6KeyManager__factory,
  UniversalProfile__factory,
} from "../../../types/ethers-v5";
import { getProvider } from "../../libs/ethers.service";
import { logger } from "../../libs/logger.service";
import { signTransaction } from "../../libs/signer.service";

export async function handleExecute(address: string, transaction: Transaction) {
  logger.info("Received execute request");

  const provider = getProvider();

  const universalProfile = UniversalProfile__factory.connect(address, provider);
  const keyManagerAddress = await universalProfile.owner();

  const keyManager = LSP6KeyManager__factory.connect(
    keyManagerAddress,
    provider
  );

  const gasLimit = await keyManager.estimateGas[
    "executeRelayCall(bytes,uint256,bytes)"
  ](transaction.signature, transaction.nonce, transaction.abi);

  const transactionData = keyManager.interface.encodeFunctionData(
    "executeRelayCall(bytes,uint256,bytes)",
    [transaction.signature, transaction.nonce, transaction.abi]
  );

  logger.info(`Signing executeRelayCall transaction`);

  const signature = await signTransaction({
    to: keyManagerAddress,
    transactionData,
    gasLimit: gasLimit.toNumber(),
  });

  provider.sendTransaction(signature.signedTransaction);

  const transactionHash = ethers.utils.keccak256(signature.signedTransaction);
  logger.info(`Dispatched transaction: ${transactionHash}`);

  return transactionHash;
}
