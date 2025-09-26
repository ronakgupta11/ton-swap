import "./escrow.tact";
import "./utils.tact";
import "@stdlib/deploy";
import "./timelock";

message(0xfc8f86e0) RefundMessage {
    amt: Int as coins;
    wallet: Address;
}

message(0xafe72100) EscrowCreated {
    finalitySeconds: Int;
    timeLockState: Int;
    dstChain: Int;
    orderId: Int as uint256;
    hashLock: Int as uint256;
    taker: Address;
    maker: Address;
    amount: Int as uint256;
    extraData: Cell;
    escrow: Address;
}

message SetJettonConfig {
    jettonMaster: Address;
    jettonWalletCode: Cell;
}

struct JettonConfig {
    jettonMaster: Address;
    jettonWalletCode: Cell;
}

contract Factory with Deployable {
    escrowCode: Cell;
    owner: Address;

    init(owner: Address, escrowCode: Cell) {
        self.owner = owner;
        self.escrowCode = escrowCode;
    }

    receive() {
        cashback(sender());
    }

    receive(transfer: JettonTransferNotification) {
        let orderId: Int = 0;
        let hashLock: Int = 0;
        let finalitySeconds: Int = 0;
        let timeLockState: Int = 0;
        let safetyDeposit = 0;
        let dstChain: Int = 0;
        let taker: Address = transfer.sender;
        let extraData: Cell = emptyCell();
        let escrowJettonWallet: Address = transfer.sender;

        if (!transfer.forwardPayload.empty()) {
            let forwardPayload: Slice = transfer.forwardPayload;
            let customPayloadCell: Cell = forwardPayload.loadRef();
            let mainSlice: Slice = customPayloadCell.beginParse();

            finalitySeconds = mainSlice.loadUint(32);
            dstChain = mainSlice.loadUint(16);
            orderId = mainSlice.loadUint(256);
            hashLock = mainSlice.loadUint(256);

            let addressesCell: Cell = mainSlice.loadRef();
            let addressSlice: Slice = addressesCell.beginParse();

            timeLockState = addressSlice.loadUint(256);
            taker = addressSlice.loadAddress();
            escrowJettonWallet = addressSlice.loadAddress();

            if (addressSlice.refs() > 0) {
                extraData = addressSlice.loadRef();
            }
        }

        let init: StateInit = initOf Escrow(myAddress(), orderId, hashLock, dstChain, transfer.sender);
        let escrowAddress: Address = contractAddress(init);

        send(SendParameters {
            to: escrowAddress,
            value: EscrowDeployGas,
            mode: SendIgnoreErrors,
            code: init.code,
            data: init.data,
            body: SetOrder {
                finalitySeconds,
                timeLockState,
                safetyDeposit,
                taker,
                jettonWallet: escrowJettonWallet,
                amount: transfer.amount,
            }.toCell(),
        });

        send(SendParameters {
            to: sender(),
            value: JettonTransferGas,
            body: JettonTransfer {
                queryId: transfer.queryId,
                amount: transfer.amount,
                destination: escrowAddress,
                responseDestination: self.owner,
                customPayload: null,
                forwardTonAmount: ton("0.05"),
                forwardPayload: beginCell()
                    .storeUint(0, 32)
                    .endCell()
                    .beginParse(),
            }.toCell(),
        });

        emit(EscrowCreated {
            finalitySeconds,
            timeLockState,
            dstChain,
            orderId,
            hashLock,
            taker,
            maker: transfer.sender,
            amount: transfer.amount,
            escrow: escrowAddress,
            extraData,
        }.toCell());
    }

    receive(msg: RefundMessage) {
        require(sender() == self.owner, "only owner");
        send(SendParameters {
            to: msg.wallet,
            value: JettonTransferGas,
            body: JettonTransfer {
                queryId: 0,
                amount: msg.amt,
                destination: self.owner,
                responseDestination: sender(),
                customPayload: null,
                forwardTonAmount: 1,
                forwardPayload: beginCell()
                    .storeUint(0, 32)
                    .endCell()
                    .beginParse(),
            }.toCell(),
        });

        send(SendParameters {
            to: self.owner,
            value: 0,
            mode: SendRemainingValue,
        });
    }

    get fun getOwner(): Address {
        return self.owner;
    }

    get fun getEscrowAddress(orderId: Int, hashLock: Int, dstChainId: Int, maker: Address): Address {
        let init: StateInit = initOf Escrow(myAddress(), orderId, hashLock, dstChainId, maker);
        return contractAddress(init);
    }

    receive("withdraw_all") {
        require(sender() == self.owner, "only owner");
        send(SendParameters {
            to: self.owner,
            value: 0,
            mode: SendRemainingBalance,
        });
    }

    get fun createTimeLockState(params: TimeLockData): Int { return createTimeLockState(params) }

    get fun getTimeLockStageValue(state: Int, stage: Int): Int { return getTimeLockStateValue(state, stage) }

    get fun setDeployedAtInTimeLockState(state: Int, at: Int): Int { return setDeployedAt(state, at) }

    get fun withCurrentDeployedAtInTimeLockState(state: Int): Int { return setDeployedAt(state, now()) }
}
