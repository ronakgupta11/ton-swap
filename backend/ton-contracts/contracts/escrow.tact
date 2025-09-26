import "@stdlib/deploy";
import "./utils.tact";
import "./timelock.tact";

struct EscrowData {
    finalitySeconds: Int as uint32;
    timeLockState: Int as uint256;
    dstChain: Int as uint16;
    safetyDeposit: Int as coins;
    orderId: Int as uint256;
    hashLock: Int as uint256;
    taker: Address;
    maker: Address;
    amount: Int as uint256;
}

message(0x2365d020) Withdraw { secret: Slice }

message(0x368dde63) Cancel {}

message SetOrder {
    finalitySeconds: Int as uint32;
    timeLockState: Int as uint256;
    safetyDeposit: Int as coins;
    taker: Address;
    jettonWallet: Address;
    amount: Int as uint256;
}

contract Escrow with Deployable {
    data: EscrowData;
    owner: Address;
    jettonAmount: Int as coins;
    jettonWallet: Address;
    initialized: Bool;

    init(owner: Address, orderId: Int, hashLock: Int, dstChain: Int, maker: Address) {
        self.owner = owner;
        self.jettonAmount = 0;
        self.initialized = false;
        self.jettonWallet = owner;
        self.data = EscrowData {
            dstChain,
            safetyDeposit: 0,
            timeLockState: 0,
            orderId,
            hashLock,
            finalitySeconds: 0,
            taker: owner,
            maker,
            amount: 0,
        };
    }

    receive() {
        cashback(sender());
    }

    receive(transfer: JettonTransferNotification) {
        if (!self.initialized) {
            self.initialized = true;
            self.data.timeLockState = setDeployedAt(self.data.timeLockState, now() + self.data.finalitySeconds);
        }

        require(sender() == self.jettonWallet, "only configured jetton wallet");
        self.jettonAmount += transfer.amount;
    }

    receive(msg: SetOrder) {
        require(self.data.finalitySeconds == 0, "already initialized");
        require(sender() == self.owner, "only owner can set order");

        self.data.finalitySeconds = msg.finalitySeconds;
        self.data.timeLockState = msg.timeLockState;
        self.data.taker = msg.taker;
        self.data.amount = msg.amount;
        self.jettonWallet = msg.jettonWallet;
    }

    receive(msg: Withdraw) {
        let withdrawPeriod: Int = 0;
        let cancellationPeriod: Int = 0;
        if (self.data.dstChain == 0) {
            withdrawPeriod = getTimeLockStateValue(self.data.timeLockState, stageDstPublicWithdrawal);
            cancellationPeriod = getTimeLockStateValue(self.data.timeLockState, stageDstCancellation);
        } else {
            withdrawPeriod = getTimeLockStateValue(self.data.timeLockState, stageSrcPublicWithdrawal);
            cancellationPeriod = getTimeLockStateValue(self.data.timeLockState, stageSrcPublicCancellation);
        }

        require(self.initialized, "not initialized");
        require(now() > withdrawPeriod, "not in withdrawal period currently");
        require(now() < cancellationPeriod, "in cancellation period currently");
        require(keccak256(msg.secret) == self.data.hashLock, "invalid secret");

        send(SendParameters {
            to: self.jettonWallet,
            value: JettonTransferGas,
            body: JettonTransfer {
                queryId: 0,
                amount: self.data.amount,
                destination: self.data.taker,
                responseDestination: self.data.taker,
                customPayload: null,
                forwardTonAmount: 1,
                forwardPayload: beginCell()
                    .storeUint(0, 32)
                    .endCell()
                    .beginParse(),
            }.toCell(),
        });

        send(SendParameters {
            to: self.data.maker,
            value: 0,
            mode: SendRemainingValue,
        });
    }

    receive(msg: Cancel) {
        let cancellationPeriod: Int = 0;
        if (self.data.dstChain == 0) {
            cancellationPeriod = getTimeLockStateValue(self.data.timeLockState, stageDstCancellation);
        } else {
            cancellationPeriod = getTimeLockStateValue(self.data.timeLockState, stageSrcPublicCancellation);
        }

        require(self.initialized, "not initialized");
        require(now() > cancellationPeriod, "cancellation period not yet active");

        send(SendParameters {
            to: self.jettonWallet,
            value: JettonTransferGas,
            body: JettonTransfer {
                queryId: 0,
                amount: self.data.amount,
                destination: self.data.maker,
                responseDestination: myAddress(),
                customPayload: null,
                forwardTonAmount: 1,
                forwardPayload: beginCell()
                    .storeUint(0, 32)
                    .endCell()
                    .beginParse(),
            }.toCell(),
        });

        send(SendParameters {
            to: self.data.maker,
            value: 0,
            mode: SendRemainingValue,
        });
    }

    get fun getData(): EscrowData {
        return self.data;
    }

    get fun isInitialized(): Bool {
        return self.initialized;
    }
}
