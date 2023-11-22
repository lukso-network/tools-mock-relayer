export const BOOTNODE_URL =
  process.env.BOOTNODE_URL || "https://rpc.testnet.lukso.network";

export const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "";

export const ENABLE_TRANSACTION_GATE =
  process.env.ENABLE_TRANSACTION_GATE === "true";

export const CHAIN_ID = process.env.CHAIN_ID || 4201;

export const IS_VALID_SIGNATURE_MAGIC_VALUE =
  process.env.IS_VALID_SIGNATURE_MAGIC_VALUE || "0x1626ba7e";

export const TIMESTAMP_AUTH_WINDOW_IN_SECONDS = 5;

export const OPERATOR_UP_ADDRESS =
  process.env.OPERATOR_UP_ADDRESS ||
  "0xE4C4Bec85bEe30a98dBBe7Ae1348fDaE10e0aA21";

export const LINK_TO_QUOTA_CHARGE =
  process.env.OPERATOR_CHARGE_LINK || "https://docs.un1.io/faq";
