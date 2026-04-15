/* ⋈ 🏃🏻💨 FastNear API - CJS (@fastnear/api version 0.9.7) */
/* https://www.npmjs.com/package/@fastnear/api/v/0.9.7 */
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var state_exports = {};
__export(state_exports, {
  DEFAULT_NETWORK_ID: () => DEFAULT_NETWORK_ID,
  NETWORKS: () => NETWORKS,
  WIDGET_URL: () => WIDGET_URL,
  _adapter: () => _adapter,
  _config: () => _config,
  _state: () => _state,
  _txHistory: () => _txHistory,
  _unbroadcastedEvents: () => _unbroadcastedEvents,
  events: () => events,
  getConfig: () => getConfig,
  getTxHistory: () => getTxHistory,
  getWalletAdapterState: () => getWalletAdapterState,
  onAdapterStateUpdate: () => onAdapterStateUpdate,
  resetTxHistory: () => resetTxHistory,
  setConfig: () => setConfig,
  update: () => update,
  updateTxHistory: () => updateTxHistory
});
module.exports = __toCommonJS(state_exports);
var import_utils = require("@fastnear/utils");
var import_wallet_adapter = require("@fastnear/wallet-adapter");
const WIDGET_URL = "https://js.cdn.fastnear.com";
const DEFAULT_NETWORK_ID = "mainnet";
const NETWORKS = {
  testnet: {
    networkId: "testnet",
    nodeUrl: "https://rpc.testnet.fastnear.com/"
  },
  mainnet: {
    networkId: "mainnet",
    nodeUrl: "https://rpc.mainnet.fastnear.com/"
  }
};
let _config = (0, import_utils.lsGet)("config") || {
  ...NETWORKS[DEFAULT_NETWORK_ID]
};
let _state = (0, import_utils.lsGet)("state") || {};
const onAdapterStateUpdate = /* @__PURE__ */ __name((state) => {
  console.log("Adapter state update:", state);
  const { accountId, lastWalletId, privateKey } = state;
  update({
    accountId: accountId || void 0,
    lastWalletId: lastWalletId || void 0,
    ...privateKey ? { privateKey } : {}
  });
}, "onAdapterStateUpdate");
const getWalletAdapterState = /* @__PURE__ */ __name(() => {
  return {
    publicKey: _state.publicKey,
    accountId: _state.accountId,
    lastWalletId: _state.lastWalletId,
    networkId: _config.networkId
  };
}, "getWalletAdapterState");
let _adapter = new import_wallet_adapter.WalletAdapter({
  onStateUpdate: onAdapterStateUpdate,
  lastState: getWalletAdapterState(),
  widgetUrl: WIDGET_URL
});
try {
  _state.publicKey = _state.privateKey ? (0, import_utils.publicKeyFromPrivate)(_state.privateKey) : null;
} catch (e) {
  console.error("Error parsing private key:", e);
  _state.privateKey = null;
  (0, import_utils.lsSet)("nonce", null);
}
let _txHistory = (0, import_utils.lsGet)("txHistory") || {};
const _unbroadcastedEvents = {
  account: [],
  tx: []
};
const events = {
  _eventListeners: {
    account: /* @__PURE__ */ new Set(),
    tx: /* @__PURE__ */ new Set()
  },
  notifyAccountListeners: /* @__PURE__ */ __name((accountId) => {
    if (events._eventListeners.account.size === 0) {
      _unbroadcastedEvents.account.push(accountId);
      return;
    }
    events._eventListeners.account.forEach((callback) => {
      try {
        callback(accountId);
      } catch (e) {
        console.error(e);
      }
    });
  }, "notifyAccountListeners"),
  notifyTxListeners: /* @__PURE__ */ __name((tx) => {
    if (events._eventListeners.tx.size === 0) {
      _unbroadcastedEvents.tx.push(tx);
      return;
    }
    events._eventListeners.tx.forEach((callback) => {
      try {
        callback(tx);
      } catch (e) {
        console.error(e);
      }
    });
  }, "notifyTxListeners"),
  onAccount: /* @__PURE__ */ __name((callback) => {
    events._eventListeners.account.add(callback);
    if (_unbroadcastedEvents.account.length > 0) {
      const accountEvent = _unbroadcastedEvents.account;
      _unbroadcastedEvents.account = [];
      accountEvent.forEach(events.notifyAccountListeners);
    }
  }, "onAccount"),
  onTx: /* @__PURE__ */ __name((callback) => {
    events._eventListeners.tx.add(callback);
    if (_unbroadcastedEvents.tx.length > 0) {
      const txEvent = _unbroadcastedEvents.tx;
      _unbroadcastedEvents.tx = [];
      txEvent.forEach(events.notifyTxListeners);
    }
  }, "onTx")
};
const update = /* @__PURE__ */ __name((newState) => {
  const oldState = _state;
  _state = { ..._state, ...newState };
  (0, import_utils.lsSet)("state", {
    accountId: _state.accountId,
    privateKey: _state.privateKey,
    lastWalletId: _state.lastWalletId,
    accessKeyContractId: _state.accessKeyContractId
  });
  if (newState.hasOwnProperty("privateKey") && newState.privateKey !== oldState.privateKey) {
    _state.publicKey = newState.privateKey ? (0, import_utils.publicKeyFromPrivate)(newState.privateKey) : null;
    (0, import_utils.lsSet)("nonce", null);
  }
  if (newState.accountId !== oldState.accountId) {
    events.notifyAccountListeners(newState.accountId);
  }
  if (newState.hasOwnProperty("lastWalletId") && newState.lastWalletId !== oldState.lastWalletId || newState.hasOwnProperty("accountId") && newState.accountId !== oldState.accountId || newState.hasOwnProperty("privateKey") && newState.privateKey !== oldState.privateKey) {
    _adapter.setState(getWalletAdapterState());
  }
}, "update");
const updateTxHistory = /* @__PURE__ */ __name((txStatus) => {
  const txId = txStatus.txId;
  _txHistory[txId] = {
    ..._txHistory[txId] || {},
    ...txStatus,
    updateTimestamp: Date.now()
  };
  (0, import_utils.lsSet)("txHistory", _txHistory);
  events.notifyTxListeners(_txHistory[txId]);
}, "updateTxHistory");
const getConfig = /* @__PURE__ */ __name(() => {
  return _config;
}, "getConfig");
const getTxHistory = /* @__PURE__ */ __name(() => {
  return _txHistory;
}, "getTxHistory");
const setConfig = /* @__PURE__ */ __name((newConf) => {
  _config = { ...NETWORKS[newConf.networkId], ...newConf };
  (0, import_utils.lsSet)("config", _config);
}, "setConfig");
const resetTxHistory = /* @__PURE__ */ __name(() => {
  _txHistory = {};
  (0, import_utils.lsSet)("txHistory", _txHistory);
}, "resetTxHistory");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_NETWORK_ID,
  NETWORKS,
  WIDGET_URL,
  _adapter,
  _config,
  _state,
  _txHistory,
  _unbroadcastedEvents,
  events,
  getConfig,
  getTxHistory,
  getWalletAdapterState,
  onAdapterStateUpdate,
  resetTxHistory,
  setConfig,
  update,
  updateTxHistory
});
//# sourceMappingURL=state.cjs.map
