export interface Transaction {
  abi: string;
  signature: string;
  nonce: string;
  validityTimestamps: string | number;
}

export interface ExecutePayload {
  address: string;
  transaction: Transaction;
}
