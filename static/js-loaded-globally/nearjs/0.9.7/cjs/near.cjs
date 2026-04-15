/* ⋈ 🏃🏻💨 FastNear API - CJS (@fastnear/api version 0.9.7) */
/* https://www.npmjs.com/package/@fastnear/api/v/0.9.7 */
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var near_exports = {};
__export(near_exports, {
  MaxBlockDelayMs: () => MaxBlockDelayMs,
  accountId: () => accountId,
  actions: () => actions,
  afterTxSent: () => afterTxSent,
  authStatus: () => authStatus,
  config: () => config,
  event: () => event,
  exp: () => exp,
  generateTxId: () => generateTxId,
  getPublicKeyForContract: () => getPublicKeyForContract,
  localTxHistory: () => localTxHistory,
  publicKey: () => publicKey,
  queryAccessKey: () => queryAccessKey,
  queryAccount: () => queryAccount,
  queryBlock: () => queryBlock,
  queryTx: () => queryTx,
  requestSignIn: () => requestSignIn,
  selected: () => selected,
  sendRpc: () => sendRpc,
  sendTx: () => sendTx,
  sendTxToRpc: () => sendTxToRpc,
  signOut: () => signOut,
  state: () => state,
  utils: () => utils,
  view: () => view,
  withBlockId: () => withBlockId
});
module.exports = __toCommonJS(near_exports);
var import_big = __toESM(require("big.js"), 1);
var import_utils = require("@fastnear/utils");
var import_state = require("./state.js");
var import_state2 = require("./state.js");
var import_sha2 = require("@noble/hashes/sha2");
var reExportAllUtils = __toESM(require("@fastnear/utils"), 1);
var stateExports = __toESM(require("./state.js"), 1);
import_big.default.DP = 27;
const MaxBlockDelayMs = 1e3 * 60 * 60 * 6;
function withBlockId(params, blockId) {
  if (blockId === "final" || blockId === "optimistic") {
    return { ...params, finality: blockId };
  }
  return blockId ? { ...params, block_id: blockId } : { ...params, finality: "optimistic" };
}
__name(withBlockId, "withBlockId");
async function sendRpc(method, params) {
  const config2 = (0, import_state2.getConfig)();
  if (!config2?.nodeUrl) {
    throw new Error("fastnear: getConfig() returned invalid config: missing nodeUrl.");
  }
  const response = await fetch(config2.nodeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: `fastnear-${Date.now()}`,
      method,
      params
    })
  });
  const result = await response.json();
  if (result.error) {
    throw new Error(JSON.stringify(result.error));
  }
  return result;
}
__name(sendRpc, "sendRpc");
function afterTxSent(txId) {
  const txHistory = (0, import_state.getTxHistory)();
  sendRpc("tx", {
    tx_hash: txHistory[txId]?.txHash,
    sender_account_id: txHistory[txId]?.tx?.signerId,
    wait_until: "EXECUTED_OPTIMISTIC"
  }).then((result) => {
    const successValue = result?.result?.status?.SuccessValue;
    (0, import_state.updateTxHistory)({
      txId,
      status: "Executed",
      result,
      successValue: successValue ? (0, import_utils.tryParseJson)((0, import_utils.fromBase64)(successValue)) : void 0,
      finalState: true
    });
  }).catch((error) => {
    (0, import_state.updateTxHistory)({
      txId,
      status: "ErrorAfterIncluded",
      error: (0, import_utils.tryParseJson)(error.message) ?? error.message,
      finalState: true
    });
  });
}
__name(afterTxSent, "afterTxSent");
async function sendTxToRpc(signedTxBase64, waitUntil, txId) {
  waitUntil = waitUntil || "INCLUDED";
  try {
    const sendTxRes = await sendRpc("send_tx", {
      signed_tx_base64: signedTxBase64,
      wait_until: waitUntil
    });
    (0, import_state.updateTxHistory)({ txId, status: "Included", finalState: false });
    afterTxSent(txId);
    return sendTxRes;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    (0, import_state.updateTxHistory)({
      txId,
      status: "Error",
      error: (0, import_utils.tryParseJson)(errorMessage) ?? errorMessage,
      finalState: false
    });
    throw new Error(errorMessage);
  }
}
__name(sendTxToRpc, "sendTxToRpc");
function generateTxId() {
  const randomPart = crypto.getRandomValues(new Uint32Array(2)).join("");
  return `tx-${Date.now()}-${parseInt(randomPart, 10).toString(36)}`;
}
__name(generateTxId, "generateTxId");
const accountId = /* @__PURE__ */ __name(() => import_state._state.accountId, "accountId");
const publicKey = /* @__PURE__ */ __name(() => import_state._state.publicKey, "publicKey");
const config = /* @__PURE__ */ __name((newConfig) => {
  const current = (0, import_state2.getConfig)();
  if (newConfig) {
    if (newConfig.networkId && current.networkId !== newConfig.networkId) {
      (0, import_state2.setConfig)(newConfig.networkId);
      (0, import_state.update)({ accountId: null, privateKey: null, lastWalletId: null });
      (0, import_utils.lsSet)("block", null);
      (0, import_state2.resetTxHistory)();
    }
    (0, import_state2.setConfig)({ ...(0, import_state2.getConfig)(), ...newConfig });
  }
  return (0, import_state2.getConfig)();
}, "config");
const authStatus = /* @__PURE__ */ __name(() => {
  if (!import_state._state.accountId) {
    return "SignedOut";
  }
  return "SignedIn";
}, "authStatus");
const getPublicKeyForContract = /* @__PURE__ */ __name((opts) => {
  return publicKey();
}, "getPublicKeyForContract");
const selected = /* @__PURE__ */ __name(() => {
  const network = (0, import_state2.getConfig)().networkId;
  const nodeUrl = (0, import_state2.getConfig)().nodeUrl;
  const walletUrl = (0, import_state2.getConfig)().walletUrl;
  const helperUrl = (0, import_state2.getConfig)().helperUrl;
  const explorerUrl = (0, import_state2.getConfig)().explorerUrl;
  const account = accountId();
  const contract = import_state._state.accessKeyContractId;
  const publicKey2 = getPublicKeyForContract();
  return {
    network,
    nodeUrl,
    walletUrl,
    helperUrl,
    explorerUrl,
    account,
    contract,
    publicKey: publicKey2
  };
}, "selected");
const requestSignIn = /* @__PURE__ */ __name(async ({ contractId }) => {
  const privateKey = (0, import_utils.privateKeyFromRandom)();
  (0, import_state.update)({ accessKeyContractId: contractId, accountId: null, privateKey });
  const pubKey = (0, import_utils.publicKeyFromPrivate)(privateKey);
  const result = await import_state._adapter.signIn({
    networkId: (0, import_state2.getConfig)().networkId,
    contractId,
    publicKey: pubKey
  });
  if (result.error) {
    throw new Error(`Wallet error: ${result.error}`);
  }
  if (result.url) {
    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.location.href = result.url;
      }, 100);
    }
  } else if (result.accountId) {
    (0, import_state.update)({ accountId: result.accountId });
  }
}, "requestSignIn");
const view = /* @__PURE__ */ __name(async ({
  contractId,
  methodName,
  args,
  argsBase64,
  blockId
}) => {
  const encodedArgs = argsBase64 || (args ? (0, import_utils.toBase64)(JSON.stringify(args)) : "");
  const queryResult = await sendRpc(
    "query",
    withBlockId(
      {
        request_type: "call_function",
        account_id: contractId,
        method_name: methodName,
        args_base64: encodedArgs
      },
      blockId
    )
  );
  return (0, import_utils.parseJsonFromBytes)(queryResult.result.result);
}, "view");
const queryAccount = /* @__PURE__ */ __name(async ({
  accountId: accountId2,
  blockId
}) => {
  return sendRpc(
    "query",
    withBlockId({ request_type: "view_account", account_id: accountId2 }, blockId)
  );
}, "queryAccount");
const queryBlock = /* @__PURE__ */ __name(async ({ blockId }) => {
  return sendRpc("block", withBlockId({}, blockId));
}, "queryBlock");
const queryAccessKey = /* @__PURE__ */ __name(async ({
  accountId: accountId2,
  publicKey: publicKey2,
  blockId
}) => {
  return sendRpc(
    "query",
    withBlockId(
      { request_type: "view_access_key", account_id: accountId2, public_key: publicKey2 },
      blockId
    )
  );
}, "queryAccessKey");
const queryTx = /* @__PURE__ */ __name(async ({ txHash, accountId: accountId2 }) => {
  return sendRpc("tx", [txHash, accountId2]);
}, "queryTx");
const localTxHistory = /* @__PURE__ */ __name(() => {
  return (0, import_state.getTxHistory)();
}, "localTxHistory");
const signOut = /* @__PURE__ */ __name(() => {
  (0, import_state.update)({ accountId: null, privateKey: null, contractId: null });
  (0, import_state2.setConfig)(import_state.NETWORKS[import_state.DEFAULT_NETWORK_ID]);
}, "signOut");
const sendTx = /* @__PURE__ */ __name(async ({
  receiverId,
  actions: actions2,
  waitUntil
}) => {
  const signerId = import_state._state.accountId;
  if (!signerId) throw new Error("Must sign in");
  const publicKey2 = import_state._state.publicKey ?? "";
  const privKey = import_state._state.privateKey;
  const txId = generateTxId();
  if (!privKey || receiverId !== import_state._state.accessKeyContractId || !(0, import_utils.canSignWithLAK)(actions2)) {
    const jsonTx = { signerId, receiverId, actions: actions2 };
    (0, import_state.updateTxHistory)({ status: "Pending", txId, tx: jsonTx, finalState: false });
    const url = new URL(typeof window !== "undefined" ? window.location.href : "");
    url.searchParams.set("txIds", txId);
    const existingParams = new URLSearchParams(window.location.search);
    existingParams.forEach((value, key) => {
      if (!url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    });
    url.searchParams.delete("errorCode");
    url.searchParams.delete("errorMessage");
    try {
      const result = await import_state._adapter.sendTransactions({
        transactions: [jsonTx],
        callbackUrl: url.toString()
      });
      if (result.url) {
        if (typeof window !== "undefined") {
          setTimeout(() => {
            window.location.href = result.url;
          }, 100);
        }
      } else if (result.outcomes?.length) {
        result.outcomes.forEach(
          (r) => (0, import_state.updateTxHistory)({
            txId,
            status: "Executed",
            result: r,
            txHash: r.transaction.hash,
            finalState: true
          })
        );
      } else if (result.rejected) {
        (0, import_state.updateTxHistory)({ txId, status: "RejectedByUser", finalState: true });
      } else if (result.error) {
        (0, import_state.updateTxHistory)({
          txId,
          status: "Error",
          error: (0, import_utils.tryParseJson)(result.error),
          finalState: true
        });
      }
      return result;
    } catch (err) {
      console.error("fastnear: error sending tx using adapter:", err);
      (0, import_state.updateTxHistory)({
        txId,
        status: "Error",
        error: (0, import_utils.tryParseJson)(err.message),
        finalState: true
      });
      return Promise.reject(err);
    }
  }
  let nonce = (0, import_utils.lsGet)("nonce");
  if (nonce == null) {
    const accessKey = await queryAccessKey({ accountId: signerId, publicKey: publicKey2 });
    if (accessKey.result.error) {
      throw new Error(`Access key error: ${accessKey.result.error} when attempting to get nonce for ${signerId} for public key ${publicKey2}`);
    }
    nonce = accessKey.result.nonce;
    (0, import_utils.lsSet)("nonce", nonce);
  }
  let lastKnownBlock = (0, import_utils.lsGet)("block");
  if (!lastKnownBlock || parseFloat(lastKnownBlock.header.timestamp_nanosec) / 1e6 + MaxBlockDelayMs < Date.now()) {
    const latestBlock = await queryBlock({ blockId: "final" });
    lastKnownBlock = {
      header: {
        hash: latestBlock.result.header.hash,
        timestamp_nanosec: latestBlock.result.header.timestamp_nanosec
      }
    };
    (0, import_utils.lsSet)("block", lastKnownBlock);
  }
  nonce += 1;
  (0, import_utils.lsSet)("nonce", nonce);
  const blockHash = lastKnownBlock.header.hash;
  const plainTransactionObj = {
    signerId,
    publicKey: publicKey2,
    nonce,
    receiverId,
    blockHash,
    actions: actions2
  };
  const txBytes = (0, import_utils.serializeTransaction)(plainTransactionObj);
  const txHashBytes = (0, import_sha2.sha256)(txBytes);
  const txHash58 = (0, import_utils.toBase58)(txHashBytes);
  const signatureBase58 = (0, import_utils.signHash)(txHashBytes, privKey, { returnBase58: true });
  const signedTransactionBytes = (0, import_utils.serializeSignedTransaction)(plainTransactionObj, signatureBase58);
  const signedTxBase64 = (0, import_utils.bytesToBase64)(signedTransactionBytes);
  (0, import_state.updateTxHistory)({
    status: "Pending",
    txId,
    tx: plainTransactionObj,
    signature: signatureBase58,
    signedTxBase64,
    txHash: txHash58,
    finalState: false
  });
  try {
    return await sendTxToRpc(signedTxBase64, waitUntil, txId);
  } catch (error) {
    console.error("Error Sending Transaction:", error, plainTransactionObj, signedTxBase64);
  }
}, "sendTx");
const exp = {
  utils: {},
  // we will map this in a moment, giving keys, for IDE hints
  borsh: reExportAllUtils.exp.borsh,
  borshSchema: reExportAllUtils.exp.borshSchema.getBorshSchema()
};
for (const key in reExportAllUtils) {
  exp.utils[key] = reExportAllUtils[key];
}
const utils = exp.utils;
const state = {};
for (const key in stateExports) {
  state[key] = stateExports[key];
}
const event = state["events"];
delete state["events"];
try {
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    const accId = url.searchParams.get("account_id");
    const pubKey = url.searchParams.get("public_key");
    const errCode = url.searchParams.get("errorCode");
    const errMsg = url.searchParams.get("errorMessage");
    const decodedErrMsg = errMsg ? decodeURIComponent(errMsg) : null;
    const txHashes = url.searchParams.get("transactionHashes");
    const txIds = url.searchParams.get("txIds");
    if (errCode || errMsg) {
      console.warn(new Error(`Wallet raises:
code: ${errCode}
message: ${decodedErrMsg}`));
    }
    if (accId && pubKey) {
      if (pubKey === import_state._state.publicKey) {
        (0, import_state.update)({ accountId: accId });
      } else {
        if (authStatus() === "SignedIn") {
          console.warn("Public key mismatch from wallet redirect", pubKey, import_state._state.publicKey);
        }
        url.searchParams.delete("public_key");
      }
    }
    if (txHashes || txIds) {
      const hashArr = txHashes ? txHashes.split(",") : [];
      const idArr = txIds ? txIds.split(",") : [];
      if (idArr.length > hashArr.length) {
        idArr.forEach((id) => {
          (0, import_state.updateTxHistory)({ txId: id, status: "RejectedByUser", finalState: true });
        });
      } else if (idArr.length === hashArr.length) {
        idArr.forEach((id, i) => {
          (0, import_state.updateTxHistory)({
            txId: id,
            status: "PendingGotTxHash",
            txHash: hashArr[i],
            finalState: false
          });
          afterTxSent(id);
        });
      } else {
        console.error(new Error("Transaction hash mismatch from wallet redirect"), idArr, hashArr);
      }
    }
    url.searchParams.delete("txIds");
    if (authStatus() === "SignedOut") {
      url.searchParams.delete("errorCode");
      url.searchParams.delete("errorMessage");
    }
  }
} catch (e) {
  console.error("Error handling wallet redirect:", e);
}
const actions = {
  functionCall: /* @__PURE__ */ __name(({
    methodName,
    gas,
    deposit,
    args,
    argsBase64
  }) => ({
    type: "FunctionCall",
    methodName,
    args,
    argsBase64,
    gas,
    deposit
  }), "functionCall"),
  transfer: /* @__PURE__ */ __name((yoctoAmount) => ({
    type: "Transfer",
    deposit: yoctoAmount
  }), "transfer"),
  stakeNEAR: /* @__PURE__ */ __name(({ amount, publicKey: publicKey2 }) => ({
    type: "Stake",
    stake: amount,
    publicKey: publicKey2
  }), "stakeNEAR"),
  addFullAccessKey: /* @__PURE__ */ __name(({ publicKey: publicKey2 }) => ({
    type: "AddKey",
    publicKey: publicKey2,
    accessKey: { permission: "FullAccess" }
  }), "addFullAccessKey"),
  addLimitedAccessKey: /* @__PURE__ */ __name(({
    publicKey: publicKey2,
    allowance,
    accountId: accountId2,
    methodNames
  }) => ({
    type: "AddKey",
    publicKey: publicKey2,
    accessKey: {
      permission: "FunctionCall",
      allowance,
      receiverId: accountId2,
      methodNames
    }
  }), "addLimitedAccessKey"),
  deleteKey: /* @__PURE__ */ __name(({ publicKey: publicKey2 }) => ({
    type: "DeleteKey",
    publicKey: publicKey2
  }), "deleteKey"),
  deleteAccount: /* @__PURE__ */ __name(({ beneficiaryId }) => ({
    type: "DeleteAccount",
    beneficiaryId
  }), "deleteAccount"),
  createAccount: /* @__PURE__ */ __name(() => ({
    type: "CreateAccount"
  }), "createAccount"),
  deployContract: /* @__PURE__ */ __name(({ codeBase64 }) => ({
    type: "DeployContract",
    codeBase64
  }), "deployContract")
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MaxBlockDelayMs,
  accountId,
  actions,
  afterTxSent,
  authStatus,
  config,
  event,
  exp,
  generateTxId,
  getPublicKeyForContract,
  localTxHistory,
  publicKey,
  queryAccessKey,
  queryAccount,
  queryBlock,
  queryTx,
  requestSignIn,
  selected,
  sendRpc,
  sendTx,
  sendTxToRpc,
  signOut,
  state,
  utils,
  view,
  withBlockId
});
//# sourceMappingURL=near.cjs.map
