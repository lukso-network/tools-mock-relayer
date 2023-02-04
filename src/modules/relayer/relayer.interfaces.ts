export interface Transaction {
  abi: string;
  signature: string;
  nonce: number;
}

export interface ExecutePayload {
  address: string;
  transaction: Transaction;
}
