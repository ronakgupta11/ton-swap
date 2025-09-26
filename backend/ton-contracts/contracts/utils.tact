message(0x7362d09c) JettonTransferNotification {
    queryId: Int as uint64 = 0;
    amount: Int as coins;
    sender: Address;
    forwardPayload: Slice as remaining;
}

struct JettonWalletData {
    status: Int as uint4;
    balance: Int as coins;
    ownerAddress: Address;
    jettonMasterAddress: Address;
}

fun calculateJettonWalletAddress(
    ownerAddress: Address,
    jettonMasterAddress: Address,
    jettonWalletCode: Cell,
): Address {
    let initData = JettonWalletData {
        status: 0,
        balance: 0,
        ownerAddress,
        jettonMasterAddress,
    };

    return contractAddress(StateInit {
        code: jettonWalletCode,
        data: initData.toCell(),
    });
}

message(0xf8a7ea5) JettonTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    responseDestination: Address?;
    customPayload: Cell? = null;
    forwardTonAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

const JettonTransferGas: Int = ton("0.15");
const EscrowDeployGas: Int = ton("0.15");
