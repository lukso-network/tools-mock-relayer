import { ethers } from "ethers";

import { BOOTNODE_URL } from "../globals";

let provider: ethers.providers.JsonRpcProvider;

export function getProvider() {
  if (!provider) {
    provider = new ethers.providers.JsonRpcProvider(BOOTNODE_URL);
  }

  return provider;
}
