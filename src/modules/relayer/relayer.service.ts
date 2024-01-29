import { BigNumber, ethers } from "ethers";

import { Transaction } from "./relayer.interfaces";
import {
  LSP6KeyManagerInit__factory,
  LSP6KeyManager__factory,
  UniversalProfile__factory,
} from "../../../types/ethers-v5";
import { getProvider } from "../../libs/ethers.service";
import {
  transactionGate,
  waitForTransaction,
} from "../../libs/listener.service";
import { logger } from "../../libs/logger.service";
import { signTransaction } from "../../libs/signer.service";

export async function handleExecute(address: string, transaction: Transaction) {
  logger.info(`📥 Received execute request for Universal Profile ${address}`);

  transactionGate();

  const { signature, nonce, abi, validityTimestamps } = transaction;

  const provider = getProvider();

  const universalProfile = UniversalProfile__factory.connect(address, provider);
  const keyManagerAddress = await universalProfile.owner();
  const keyManager = LSP6KeyManager__factory.connect(
    keyManagerAddress,
    provider
  );

  let gasLimit: BigNumber;
  try {
    gasLimit = await keyManager.estimateGas.executeRelayCall(
      signature,
      nonce,
      validityTimestamps || 0,
      abi
    );
  } catch (error) {
    gasLimit = BigNumber.from(3000000);
    logger.info(
      "⏭️ Unable to estimate gas. Setting default value to gas Limit"
    );
  }

  const lsp6Interface = LSP6KeyManagerInit__factory.createInterface();

  const transactionData = lsp6Interface.encodeFunctionData("executeRelayCall", [
    signature,
    nonce,
    validityTimestamps,
    abi,
  ]);

  logger.info(`Signing executeRelayCall transaction`);

  const signedTransaction = await signTransaction({
    to: keyManagerAddress,
    transactionData,
    gasLimit,
  });

  let transactionResponse: ethers.providers.TransactionResponse;
  try {
    transactionResponse = await provider.sendTransaction(
      signedTransaction.signerSignature
    );
  } catch (error) {
    logger.error("❌ Error sending transaction to the blockchain.");
    throw error;
  }

  waitForTransaction(transactionResponse);

  const transactionHash = ethers.utils.keccak256(
    signedTransaction.signerSignature
  );

  logger.info(
    `✉️ Dispatched transaction: https://explorer.execution.testnet.lukso.network/tx/${transactionHash}`
  );

  return transactionHash;
}
