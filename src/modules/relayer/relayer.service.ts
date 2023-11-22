import { BigNumber, ethers } from "ethers";

import { Transaction } from "./relayer.interfaces";
import {
  LSP6KeyManager__factory,
  LSP7DigitalAsset__factory,
  UniversalProfile__factory,
} from "../../../types/ethers-v5";
import { OPERATOR_UP_ADDRESS } from "../../globals";
import { getProvider } from "../../libs/ethers.service";
import {
  transactionGate,
  waitForTransaction,
} from "../../libs/listener.service";
import { logger } from "../../libs/logger.service";
import { getSigner, signTransaction } from "../../libs/signer.service";
import { quotaMode } from "../quota/quota.controller";
import { QuotaMode, quotaTokenAddress } from "../quota/quota.service";

export async function handleExecute(address: string, transaction: Transaction) {
  logger.info("Received execute request");

  transactionGate();

  const provider = getProvider();

  const universalProfile = UniversalProfile__factory.connect(address, provider);
  const keyManagerAddress = await universalProfile.owner();

  const keyManager = LSP6KeyManager__factory.connect(
    keyManagerAddress,
    provider
  );

  const gasLimit = await keyManager.estimateGas.executeRelayCall(
    transaction.signature,
    transaction.nonce,
    transaction.validityTimestamps || 0,
    transaction.abi
  );

  const transactionData = keyManager.interface.encodeFunctionData(
    "executeRelayCall",
    [
      transaction.signature,
      transaction.nonce,
      transaction.validityTimestamps || 0,
      transaction.abi,
    ]
  );

  logger.info(`Signing executeRelayCall transaction`);

  const signature = await signTransaction({
    to: keyManagerAddress,
    transactionData,
    gasLimit: gasLimit.toNumber(),
  });

  const transactionResponse = await provider.sendTransaction(
    signature.signedTransaction
  );

  const waitAndDispatch = async () => {
    await waitForTransaction(transactionResponse);
    await handleExecutionChargeback(
      address,
      ethers.utils.keccak256(signature.signedTransaction)
    );
  };

  waitAndDispatch();

  const transactionHash = ethers.utils.keccak256(signature.signedTransaction);
  logger.info(`✉️ Dispatched transaction: ${transactionHash}`);

  return transactionHash;
}

export async function handleExecutionChargeback(
  address: string,
  transactionHash: string
) {
  if (QuotaMode.TokenQuotaTransactionsCount !== quotaMode) {
    return;
  }

  const provider = getProvider();
  const lsp7Token = LSP7DigitalAsset__factory.connect(
    quotaTokenAddress,
    provider
  );

  const signer = getSigner();

  const transferTx = await lsp7Token.transfer(
    address,
    OPERATOR_UP_ADDRESS,
    BigNumber.from(1),
    false,
    transactionHash
  );

  await waitForTransaction(transferTx);

  logger.info(
    `✉️ Dispatched chargeback transaction: ${transactionHash}, signer: ${signer.address}, transferTx: ${transferTx.hash}, address: ${address}`
  );
}
