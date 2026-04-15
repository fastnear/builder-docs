import * as borsh from 'borsh';

interface NetworkConfig {
    networkId: string;
    nodeUrl?: string;
    walletUrl?: string;
    helperUrl?: string;
    explorerUrl?: string;
    [key: string]: any;
}
interface TxStatus {
    txId: string;
    updateTimestamp?: number;
    [key: string]: any;
}
type TxHistory = Record<string, TxStatus>;

declare const MaxBlockDelayMs: number;
interface AccessKeyWithError {
    result: {
        nonce: number;
        permission?: any;
        error?: string;
    };
}
interface WalletTxResult {
    url?: string;
    outcomes?: Array<{
        transaction: {
            hash: string;
        };
    }>;
    rejected?: boolean;
    error?: string;
}
interface BlockView {
    result: {
        header: {
            hash: string;
            timestamp_nanosec: string;
        };
    };
}
interface LastKnownBlock {
    header: {
        hash: string;
        timestamp_nanosec: string;
    };
}
declare function withBlockId(params: Record<string, any>, blockId?: string): {
    finality: string;
} | {
    block_id: string;
};
declare function sendRpc(method: string, params: Record<string, any> | any[]): Promise<any>;
declare function afterTxSent(txId: string): void;
declare function sendTxToRpc(signedTxBase64: string, waitUntil: string | undefined, txId: string): Promise<any>;
interface AccessKeyView {
    nonce: number;
    permission: any;
}
/**
 * Generates a mock transaction ID.
 *
 * This function creates a pseudo-unique transaction ID for testing or
 * non-production use. It combines the current timestamp with a
 * random component for uniqueness.
 *
 * **Note:** This is not cryptographically secure and should not be used
 * for actual transaction processing.
 *
 * @returns {string} A mock transaction ID in the format `tx-{timestamp}-{random}`
 */
declare function generateTxId(): string;
declare const accountId: () => string | null | undefined;
declare const publicKey: () => string | null | undefined;
declare const config: (newConfig?: Record<string, any>) => NetworkConfig;
declare const authStatus: () => string | Record<string, any>;
declare const getPublicKeyForContract: (opts?: any) => string | null | undefined;
declare const selected: () => {
    network: string;
    nodeUrl: string | undefined;
    walletUrl: string | undefined;
    helperUrl: string | undefined;
    explorerUrl: string | undefined;
    account: string | null | undefined;
    contract: string | null | undefined;
    publicKey: string | null | undefined;
};
declare const requestSignIn: ({ contractId }: {
    contractId: string;
}) => Promise<void>;
declare const view: ({ contractId, methodName, args, argsBase64, blockId, }: {
    contractId: string;
    methodName: string;
    args?: any;
    argsBase64?: string;
    blockId?: string;
}) => Promise<any>;
declare const queryAccount: ({ accountId, blockId, }: {
    accountId: string;
    blockId?: string;
}) => Promise<any>;
declare const queryBlock: ({ blockId }: {
    blockId?: string;
}) => Promise<BlockView>;
declare const queryAccessKey: ({ accountId, publicKey, blockId, }: {
    accountId: string;
    publicKey: string;
    blockId?: string;
}) => Promise<AccessKeyWithError>;
declare const queryTx: ({ txHash, accountId }: {
    txHash: string;
    accountId: string;
}) => Promise<any>;
declare const localTxHistory: () => TxHistory;
declare const signOut: () => void;
declare const sendTx: ({ receiverId, actions, waitUntil, }: {
    receiverId: string;
    actions: any[];
    waitUntil?: string;
}) => Promise<any>;
declare const exp: {
    utils: {};
    borsh: {
        serialize: typeof borsh.serialize;
        deserialize: typeof borsh.deserialize;
    };
    borshSchema: {
        Ed25519Signature: borsh.Schema;
        Secp256k1Signature: borsh.Schema;
        Signature: borsh.Schema;
        Ed25519Data: borsh.Schema;
        Secp256k1Data: borsh.Schema;
        PublicKey: borsh.Schema;
        FunctionCallPermission: borsh.Schema;
        FullAccessPermission: borsh.Schema;
        AccessKeyPermission: borsh.Schema;
        AccessKey: borsh.Schema;
        CreateAccount: borsh.Schema;
        DeployContract: borsh.Schema;
        FunctionCall: borsh.Schema;
        Transfer: borsh.Schema;
        Stake: borsh.Schema;
        AddKey: borsh.Schema;
        DeleteKey: borsh.Schema;
        DeleteAccount: borsh.Schema;
        ClassicAction: borsh.Schema;
        DelegateAction: borsh.Schema;
        SignedDelegate: borsh.Schema;
        Action: borsh.Schema;
        Transaction: borsh.Schema;
        SignedTransaction: borsh.Schema;
    };
};
declare const utils: {};
declare const state: {};
declare const event: any;
declare const actions: {
    functionCall: ({ methodName, gas, deposit, args, argsBase64, }: {
        methodName: string;
        gas?: string;
        deposit?: string;
        args?: Record<string, any>;
        argsBase64?: string;
    }) => {
        type: string;
        methodName: string;
        args: Record<string, any> | undefined;
        argsBase64: string | undefined;
        gas: string | undefined;
        deposit: string | undefined;
    };
    transfer: (yoctoAmount: string) => {
        type: string;
        deposit: string;
    };
    stakeNEAR: ({ amount, publicKey }: {
        amount: string;
        publicKey: string;
    }) => {
        type: string;
        stake: string;
        publicKey: string;
    };
    addFullAccessKey: ({ publicKey }: {
        publicKey: string;
    }) => {
        type: string;
        publicKey: string;
        accessKey: {
            permission: string;
        };
    };
    addLimitedAccessKey: ({ publicKey, allowance, accountId, methodNames, }: {
        publicKey: string;
        allowance: string;
        accountId: string;
        methodNames: string[];
    }) => {
        type: string;
        publicKey: string;
        accessKey: {
            permission: string;
            allowance: string;
            receiverId: string;
            methodNames: string[];
        };
    };
    deleteKey: ({ publicKey }: {
        publicKey: string;
    }) => {
        type: string;
        publicKey: string;
    };
    deleteAccount: ({ beneficiaryId }: {
        beneficiaryId: string;
    }) => {
        type: string;
        beneficiaryId: string;
    };
    createAccount: () => {
        type: string;
    };
    deployContract: ({ codeBase64 }: {
        codeBase64: string;
    }) => {
        type: string;
        codeBase64: string;
    };
};

export { type AccessKeyView, type AccessKeyWithError, type BlockView, type LastKnownBlock, MaxBlockDelayMs, type WalletTxResult, accountId, actions, afterTxSent, authStatus, config, event, exp, generateTxId, getPublicKeyForContract, localTxHistory, publicKey, queryAccessKey, queryAccount, queryBlock, queryTx, requestSignIn, selected, sendRpc, sendTx, sendTxToRpc, signOut, state, utils, view, withBlockId };
