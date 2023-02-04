import { ethers } from "ethers";

import { enableTransactionGate } from "../globals";
import { logger } from "../libs/logger.service";

let acceptNextTransaction = true;
let currentTransaction: string;

export async function waitForTransaction(
  transaction: ethers.providers.TransactionResponse
) {
  acceptNextTransaction = false;
  currentTransaction = transaction.hash;

  await transaction.wait();

  logger.info(`⛏ Validated transaction ${transaction.hash}`);

  acceptNextTransaction = true;
}

export function transactionGate() {
  if (enableTransactionGate && !acceptNextTransaction) {
    throw new Error(
      `Transaction in progress. Waiting until transaction ${currentTransaction} has been validated`
    );
  }
}
