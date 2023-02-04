export const BOOTNODE_URL =
  process.env.BOOTNODE_URL || "https://rpc.l16.lukso.network";

export const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "";

export const enableTransactionGate =
  process.env.ENABLE_TRANSACTION_GATE === "true";

export const CHAIN_ID = process.env.CHAIN_ID || 2828;

export const IS_VALID_SIGNATURE_MAGIC_VALUE = "0x1626ba7e";

export const TIMESTAMP_AUTH_WINDOW_IN_SECONDS = 5;

export const LSP0_INTERFACE_ID = "0x66767497";

export const ADDRESS_PERMISSIONS_PREFIX = "0x4b80742de2bf82acb3630000";
