# Mock Transaction Relayer &middot; [![lsp-smart-contracts](https://img.shields.io/static/v1?label=lsp-smart-contract&message=v0.8.0&color=green)](https://github.com/lukso-network/lsp-smart-contracts/releases/tag/v0.8.0)

---

Skeleton example Transaction Relayer Service according to [LSP15-TransactionRelayServiceAPI](https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-15-TransactionRelayServiceAPI.md) API specification.

This application is a starter project for an LSP15 Transaction Relayer Service for example and testing purposes and should not be considered production ready.

This application does not include any authentication, quota or nonce management. A real Transaction Relayer Service should consider how to manage signer key nonces appropriately to be able to handle concurrent transactions.

## Usage

To begin sending transaction with the Dummy Transaction Relayer create a `.env` file to hold configuration parameters:

```sh
cp .env.example .env
```

Fill the values with real data. A `SIGNER_PRIVATE_KEY` must be provided **with sufficient balance to execute transactions on the blockchain**.

Install the dependencies:

```sh
yarn
```

Run the application:

```sh
yarn run dev
```

### Transaction Gate

This project does not handle concurrent transactions. To prevent nonce reuse errors, a transaction gate is implemented which will block incoming transactions if there is already a transaction pending.

This can be turned on or off by setting `ENABLE_TRANSACTION_GATE` to `true` or `false` in the .env config.

## LSP15 Transaction Relayer Service API Specification

#### POST `/execute`

Executes a signed transaction on behalf of a Universal Profile using `executeRelayCall()`.

- `address` - The address of the Universal Profile which is executing the transaction.
- `transaction` - An object containing the transaction parameters which will executed with `executeRelayCall`.
  - `abi` - The abi-encoded transaction data (_e.g: a function call on the Universal Profile smart contract_) which will be passed as the payload parameter to the `executeRelayCall` function.
  - `signature` - The signed message according to LSP6 specification.
  - `nonce` - The nonce of the KeyManager fetched by calling `getNonce(address address, uint128 channelId)` on the LSP6 KeyManager contract.
  - `validityTimestamps` (optional) - Two concatenated `uint128` timestamps which indicate a time duration for which the transaction will be considered valid. If no validityTimestamps parameter is passed the relayer should assume that validityTimestamps is `0` and the transaction will be valid indefinitely until it is executed.

##### Request body

```json
{
  "address": "0xBB645D97B0c7D101ca0d73131e521fe89B463BFD",
  "transaction": {
    "abi": "0x7f23690c5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000596f357c6aa5a21984a83b7eef4cb0720ac1fcf5a45e9d84c653d97b71bbe89b7a728c386a697066733a2f2f516d624b43744b4d7573376741524470617744687a32506a4e36616f64346b69794e436851726d3451437858454b00000000000000",
    "signature": "0x43c958b1729586749169599d7e776f18afc6223c7da21107161477d291d497973b4fc50a724b1b2ab98f3f8cf1d5cdbbbdf3512e4fbfbdc39732229a15beb14a1b",
    "nonce": 1,
    "validityTimestamps": "0x0000000000000000000000006420f3f000000000000000000000000065ec82d0"
  }
}
```

##### Response

```json
{
  "transactionHash": "0xBB645D97B0c7D101ca0d73131e521fe89B463BFD"
}
```

#### POST `/quota`

Returns the available quota left for a registered Universal Profile.

- `signature` is the result of signing a hash calculated as an EIP-712 hash where the message is keccak256(`address`, `timestamp`).
- `address` is the controller address with permissions on the Universal Profile used to create the signature value.
- `timestamp` represents the time the signature was created. Must be +/- 300 seconds from current time to be considered a valid request. Value should be `int`, `int256`, `uint` or `uint256`.

##### Request body

```json
{
  "address": "0xBB645D97B0c7D101ca0d73131e521fe89B463BFD",
  "timestamp": 1656408193,
  "signature": "0xf480c87a352d42e49112257cc6afab0ff8365bb769424bb42e79e78cd11debf24fd5665b03407d8c2ce994cf5d718031a51a657d4308f146740e17e15b9747ef1b"
}
```

##### Response

```json
{
  "quota": 1543091,
  "unit": "gas",
  "totalQuota": 5000000,
  "resetDate": 1656408193
}
```

- `quota` shows available balance left in units defined by `unit`
- `unit` could be `gas`, `lyx` or `transactionCount` depending on the business model
- `totalQuota` reflects total limit. i.e. available + used quota since reset
- `resetDate` gives date that available quota will reset, e.g. a monthly allowance


### QuotaMode
This project allows to handle multiple quota modes based on an ENV parameter `QUOTA_MODE`
If you do not provide specific `QUOTA_MODE` default value will be `DummyQuota`.
For all available `QUOTA_MODES` see [THIS FILE](src/modules/quota/quota.service.ts)
`QUOTA_TOKEN_ADDRESS` Should be an address to the LSP7 token, that will be representing the usage.

#### Networks
If you want to deploy relayer to LUKSO mainnet you need to change
```.shell
IS_VALID_SIGNATURE_MAGIC_VALUE = 0xffffffff
```

### Quota mode reliant variables
#### QUOTA_MODE=TokenQuotaTransactionsCount
.env related variables
```.shell
QUOTA_MODE=TokenQuotaTransactionsCount
QUOTA_TOKEN_ADDRESS = LSP7 TOKEN ADDRESS
OPERATOR_UP_ADDRESS=FEE RECIPIENT. BACKEND WILL SEND LSP7 TOKENS TO THIS UP
```
Behaviour:
- to get Quota as a signer you perform normal operation, but since UP Extension does not support
  `transactionCount` as an `unit` values are heavily multiplied. In `totalQuota` response you can see how many LSP7 tokens
  approved the operator. In `quota` you will see all the tokens execution UP has.
- backend on execute will optimistically assure that if `quota` > 0 UP can consume the /Execute endpoint, although   
  if there is not enough LSP7 tokens that were approved to current operator backend will return `httpStatus.UPGRADE_REQUIRED`

LSP 7 Token distribution:
To gain access to the ecosystem there must be a distribution of LSP7 tokens, which is called `charger`.
To use LSP 7 user must have the UP. User can create new profiles via relayer only if the user has at least one.
There is a **PROFILE PARADOX** which you must solve by custom business logic.
Once User has the UP, claiming tokens will be handled via `charger station` implementations.
There is absolutely way more to discover via this approach.

For the LUKSO mainnet you can use UN1.IO Token, contact me for the token distribution.
If you know how to set up everything by your own feel free to use custom token.


#### How to authorize operator?:
See: [authorizeOperator](https://github.com/lukso-network/lsp-smart-contracts/blob/develop/docs/contracts/LSP7DigitalAsset/extensions/LSP7Burnable.md#authorizeoperator)
