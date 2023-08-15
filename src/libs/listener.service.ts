import { ethers } from "ethers";

import { ENABLE_TRANSACTION_GATE } from "../globals";
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
  if (ENABLE_TRANSACTION_GATE && !acceptNextTransaction) {
    throw new Error(
      `Transaction in progress. Waiting until transaction ${currentTransaction} has been validated`
    );
  }
}
