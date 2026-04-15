/* ⋈ 🏃🏻💨 FastNear API - ESM (@fastnear/api version 0.9.7) */
/* https://www.npmjs.com/package/@fastnear/api/v/0.9.7 */
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import {
  lsSet,
  lsGet,
  publicKeyFromPrivate
} from "@fastnear/utils";
import { WalletAdapter } from "@fastnear/wallet-adapter";
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
let _config = lsGet("config") || {
  ...NETWORKS[DEFAULT_NETWORK_ID]
};
let _state = lsGet("state") || {};
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
let _adapter = new WalletAdapter({
  onStateUpdate: onAdapterStateUpdate,
  lastState: getWalletAdapterState(),
  widgetUrl: WIDGET_URL
});
try {
  _state.publicKey = _state.privateKey ? publicKeyFromPrivate(_state.privateKey) : null;
} catch (e) {
  console.error("Error parsing private key:", e);
  _state.privateKey = null;
  lsSet("nonce", null);
}
let _txHistory = lsGet("txHistory") || {};
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
  lsSet("state", {
    accountId: _state.accountId,
    privateKey: _state.privateKey,
    lastWalletId: _state.lastWalletId,
    accessKeyContractId: _state.accessKeyContractId
  });
  if (newState.hasOwnProperty("privateKey") && newState.privateKey !== oldState.privateKey) {
    _state.publicKey = newState.privateKey ? publicKeyFromPrivate(newState.privateKey) : null;
    lsSet("nonce", null);
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
  lsSet("txHistory", _txHistory);
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
  lsSet("config", _config);
}, "setConfig");
const resetTxHistory = /* @__PURE__ */ __name(() => {
  _txHistory = {};
  lsSet("txHistory", _txHistory);
}, "resetTxHistory");
export {
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
};
//# sourceMappingURL=state.js.map
