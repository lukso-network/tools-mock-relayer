export interface Transaction {
  abi: string;
  signature: string;
  nonce: number;
  validityTimestamps: string | number | null;
}

export interface ExecutePayload {
  address: string;
  transaction: Transaction;
}
