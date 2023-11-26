import express, {Request, Response} from "express";
import httpStatus from "http-status";

import {handleQuotas, QuotaMode} from "./quota.service";
import {validateSignatureAuthentication} from "./signatureAuth.middleware";
import {IS_QUOTA_MODE_TRANSACTIONS_COUNT, OPERATOR_UP_ADDRESS, QUOTA_CONTRACT_ADDRESS} from "../../globals";
import {SignatureAuth} from "./quota.interfaces";
import {LSP7DigitalAsset__factory} from "../../../types/ethers-v5";
import {LSP0ERC725AccountInit__factory, LSP7Mintable__factory, LSPFactory} from "@lukso/lsp-factory.js"
import {getProvider} from "../../libs/ethers.service";
import {getSigner} from "../../libs/signer.service";

const quotaController = express.Router();
export const quotaMode: QuotaMode =
  (process.env.QUOTA_MODE as QuotaMode) || QuotaMode.DummyQuota;

quotaController.post(
  "/",
  validateSignatureAuthentication,
  async (req: Request, res: Response) => {
    try {
      const quota = await handleQuotas(req, quotaMode);

      res.send(quota);
    } catch (error) {
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send("Internal Server Error");
    }
  }
);

if (IS_QUOTA_MODE_TRANSACTIONS_COUNT) {
  quotaController.get(
    "/payload",
    // validateSignatureAuthentication,
    async (req: Request, res: Response) => {
      try {
        const signatureAuthParameters = req.body as SignatureAuth;
        const { address, timestamp, signature } =
          signatureAuthParameters as SignatureAuth;

        //  DEPLOYED LSP7 via backend 0xB9577A81fa3B098Afc9e201E856C913386FDE39A

        const authorizationInput = {
          // address: address ?? "0x30E0693E4C4807C157F8b2e1426a74930C426b25",
          address: address ?? "0x3946b15b52f74B1B5C972fDDC9dfae52009461a9",
          timestamp: timestamp ?? new Date().getTime(),
          operator: OPERATOR_UP_ADDRESS,
          quotaTokenAddress: QUOTA_CONTRACT_ADDRESS,
          quota: 5,
        };

        const factoryResult = new LSPFactory(getProvider(), getSigner());

        //  Deploy LSP7 via backend
        if (process.env.RABADUBA) {
          const operatorProfile = LSP0ERC725AccountInit__factory.connect(
            OPERATOR_UP_ADDRESS,
            getSigner()
          );

          const operatorOwner = await operatorProfile.owner();

          console.log(`



 Operator owner: ${operatorOwner}





`);
          const deployedLSP7 = await factoryResult.LSP7DigitalAsset.deploy({
            name: "UN1.IO ",
            symbol: "UN1",
            isNFT: true,
            controllerAddress: operatorOwner,
            creators: [
              OPERATOR_UP_ADDRESS,
              "0xa857e696Bd0F689c2120061e3a61E8E0103c2D79",
            ],
          });
          console.log("deployed LSP7", deployedLSP7.LSP7DigitalAsset.address);
        }

        const lsp7 = LSP7Mintable__factory.connect(
          authorizationInput.quotaTokenAddress,
          getSigner()
        );

        const balance = await lsp7.balanceOf(authorizationInput.address);
        console.log("BALANCE:", balance.toNumber());
        const amount = 1000;

        const lsp7Mint = await lsp7.mint(
          authorizationInput.address,
          amount,
          false,
          []
        );
        console.log("lsp7Mint", lsp7Mint.hash);

        const gasCheck = await lsp7.estimateGas.authorizeOperator(
          authorizationInput.operator,
          amount,
          []
        );
        console.log("GAS CHECK", gasCheck.toNumber());

        if (gasCheck.lt(1)) {
          console.log("Gascheck is lower");
        }

        const authorized = await lsp7.authorizeOperator(
          authorizationInput.operator,
          amount,
          []
        );

        console.log("authorized, lol", authorized.hash);

        res.send(authorizationInput);
      } catch (error) {
        console.log("error", error);
      }
    }
  );
}

export default quotaController;
