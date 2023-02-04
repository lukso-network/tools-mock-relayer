# Dummy Transaction Relayer

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

##### Request body

```json
{
  "address": "0xBB645D97B0c7D101ca0d73131e521fe89B463BFD",
  "transaction": {
    "abi": "0x7f23690c5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000596f357c6aa5a21984a83b7eef4cb0720ac1fcf5a45e9d84c653d97b71bbe89b7a728c386a697066733a2f2f516d624b43744b4d7573376741524470617744687a32506a4e36616f64346b69794e436851726d3451437858454b00000000000000",
    "signature": "0x43c958b1729586749169599d7e776f18afc6223c7da21107161477d291d497973b4fc50a724b1b2ab98f3f8cf1d5cdbbbdf3512e4fbfbdc39732229a15beb14a1b",
    "nonce": 1
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
