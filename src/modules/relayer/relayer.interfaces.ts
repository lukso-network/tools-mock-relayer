export interface Transaction {
  abi: string;
  signature: string;
  nonce: number;
  validityTimestamps?: string;
}

export interface ExecutePayload {
  address: string;
  transaction: Transaction;
}
