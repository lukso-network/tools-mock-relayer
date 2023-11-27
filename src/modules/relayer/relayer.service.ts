import { ethers } from "ethers";

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

  //  This function is guarding the system to not initiate execution transaction before backend can pull the tokens
  //  Throws exception
  await handleExecutionChargeback(
    address,
    ethers.utils.keccak256(signature.signedTransaction),
    false
  );

  const waitAndDispatch = async () => {
    await waitForTransaction(transactionResponse);
    const chargebackTx = await handleExecutionChargeback(
      address,
      ethers.utils.keccak256(signature.signedTransaction),
      true
    );
    logger.info(`dispatched chargeback tx ${chargebackTx?.hash}`);
    waitForTransaction(chargebackTx);
  };

  waitAndDispatch();

  const transactionHash = ethers.utils.keccak256(signature.signedTransaction);
  logger.info(`✉️ Dispatched transaction: ${transactionHash}`);

  return transactionHash;
}

export async function handleExecutionChargeback(
  address: string,
  transactionHash: string,
  relay?: boolean
) {
  if (QuotaMode.TokenQuotaTransactionsCount !== quotaMode) {
    return;
  }

  const signer = getSigner();
  const lsp7Token = LSP7DigitalAsset__factory.connect(
    quotaTokenAddress,
    signer
  );

  logger.info(
    `Starting chargeback, tx: ${transactionHash}, address: ${address}}`
  );

  const operators = await lsp7Token.getOperatorsOf(address);

  let found = false;

  for (const operator of operators) {
    if (operator.toLowerCase() === OPERATOR_UP_ADDRESS.toLowerCase()) {
      found = true;
    }
  }

  if (!found) {
    throw new Error(
      `unauthorized profile ${address} for operator ${OPERATOR_UP_ADDRESS}`
    );
  }

  // This parameter estimates gas to safely check if transaction execution won't fail
  try {
    await lsp7Token.estimateGas.transfer(
      address,
      OPERATOR_UP_ADDRESS,
      1,
      false,
      transactionHash
    );
  } catch (error) {
    throw new Error("could not estimate transfer of the token");
  }

  logger.info("Estimate correct, handling chargeback");

  if (!relay) {
    return;
  }

  return lsp7Token.transfer(
    address,
    OPERATOR_UP_ADDRESS,
    1,
    false,
    transactionHash
  );
}
