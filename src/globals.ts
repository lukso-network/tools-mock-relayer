export const BOOTNODE_URL =
  process.env.BOOTNODE_URL || "https://rpc.testnet.lukso.network";

export const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "";

export const ENABLE_TRANSACTION_GATE =
  process.env.ENABLE_TRANSACTION_GATE === "true";

export const CHAIN_ID = process.env.CHAIN_ID || "4201";

export const IS_VALID_SIGNATURE_MAGIC_VALUE = "0x1626ba7e";

export const TIMESTAMP_AUTH_WINDOW_IN_SECONDS = 5;
