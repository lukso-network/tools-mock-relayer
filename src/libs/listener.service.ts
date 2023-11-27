import { ethers } from "ethers";

import { ENABLE_TRANSACTION_GATE } from "../globals";
import { logger } from "../libs/logger.service";

let acceptNextTransaction = true;
let currentTransaction: string;

export async function waitForTransaction(
  providerTransaction?: ethers.providers.TransactionResponse,
  contractTransaction?: ethers.ContractTransaction
) {
  if (
    "undefined" === typeof providerTransaction &&
    "undefined" === typeof contractTransaction
  ) {
    throw new Error("please provide transaction to wait for");
  }

  if (
    "undefined" !== typeof providerTransaction &&
    "undefined" !== typeof contractTransaction
  ) {
    throw new Error("cannot handle 2 transactions at once");
  }
  const transaction = providerTransaction ?? contractTransaction;
  if ("undefined" === typeof transaction) {
    throw new Error("internal error with dispatch of the transaction");
  }
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
