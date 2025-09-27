import "@stdlib/deploy";
import "./lop.tact";
import "./escrow.tact";
import "./utils.tact";
import "./timelock.tact";

// Post-interaction message from LOP
message(0x12345678) PostInteractionCall {
    orderHash: Int as uint256;
    maker: Address;
    takerAsset: Address?; // Made nullable to reflect jetton or TON
    makingAmount: Int as uint256;
    takingAmount: Int as uint256;
    safetyDeposit: Int as coins;
}

// Escrow created event
message(0x33333333) EscrowSrcDeployed {
    escrow: Address;
    maker: Address;
    resolver: Address;
}

// Set LOP message
message(0x66666666) SetLop {
    lop: Address;
}

// Escrow creation message
message(0x44444444) CreateEscrow {
    orderHash: Int as uint256;
    hashlock: Int as uint256;
    maker: Address;
    taker: Address;
    token: Address?; // Token can be nullable
    amount: Int as uint256;
    safetyDeposit: Int as coins;
}

contract EscrowFactory with Deployable {
    escrowCode: Cell;
    owner: Address;
    lop: Address;

    init(owner: Address, escrowCode: Cell) {
        self.owner = owner;
        self.escrowCode = escrowCode;
        self.lop = owner; // Will be set later via SetLop
    }

    receive() {
        cashback(sender());
    }

    // Called by the LOP after securing Maker's funds
    receive(msg: PostInteractionCall) {
        require(sender() == self.lop, "Only LOP can call postInteraction");

        // Ideally, resolver address should be passed explicitly, not sender()
        // Using sender() here could be LOP, adjust as needed
        let resolverAddress: Address = sender();

        // Using hashlock=0 and dstChain=1 for EVM chain hardcoded here, adjust if necessary
        let immutables: EscrowData = EscrowData {
            finalitySeconds: 0,
            timeLockState: 0,
            dstChain: 1,
            safetyDeposit: msg.safetyDeposit,
            orderId: msg.orderHash,
            hashLock: 0,
            taker: resolverAddress,
            maker: msg.maker,
            amount: msg.makingAmount,
        };

        let init: StateInit = initOf Escrow(myAddress(), msg.orderHash, 0, 1, msg.maker);
        let escrowAddress: Address = contractAddress(init);

        // Deploy escrow contract
        send(SendParameters {
            to: escrowAddress,
            value: EscrowDeployGas,
            mode: SendIgnoreErrors,
            code: init.code,
            data: init.data,
            body: SetOrder {
                finalitySeconds: 0,
                timeLockState: 0,
                safetyDeposit: msg.safetyDeposit,
                taker: resolverAddress,
               jettonWallet: msg.takerAsset != null ? msg.takerAsset!! : newAddress(0, 0),
                amount: msg.makingAmount,
            }.toCell(),
        });

        // Transfer maker's tokens to escrow if jetton (takerAsset != null)
        if (msg.takerAsset != null) {
            send(SendParameters {
                to: msg.takerAsset!!,
                value: JettonTransferGas,
                body: JettonTransfer {
                    queryId: 0,
                    amount: msg.makingAmount,
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
        }

        emit(EscrowSrcDeployed {
            escrow: escrowAddress,
            maker: msg.maker,
            resolver: resolverAddress,
        }.toCell());
    }

    receive(msg: CreateEscrow) {
        let init: StateInit = initOf Escrow(myAddress(), msg.orderHash, msg.hashlock, 0, msg.maker);
        let escrowAddress: Address = contractAddress(init);

        send(SendParameters {
            to: escrowAddress,
            value: EscrowDeployGas + msg.safetyDeposit,
            mode: SendIgnoreErrors,
            code: init.code,
            data: init.data,
            body: SetOrder {
                finalitySeconds: 0,
                timeLockState: 0,
                safetyDeposit: msg.safetyDeposit,
                taker: msg.taker,
                jettonWallet: msg.token != null ? msg.token!! : newAddress(0, 0),
                amount: msg.amount,
            }.toCell(),
        });

        emit(EscrowSrcDeployed {
            escrow: escrowAddress,
            maker: msg.maker,
            resolver: msg.taker,
        }.toCell());
    }

    // Set LOP address (only owner)
    receive(msg: SetLop) {
        require(sender() == self.owner, "Only owner");
        self.lop = msg.lop;
    }

    // Getter functions
    get fun getOwner(): Address {
        return self.owner;
    }

    get fun getLop(): Address {
        return self.lop;
    }

    get fun getEscrowAddress(orderId: Int, hashLock: Int, dstChainId: Int, maker: Address): Address {
        let init: StateInit = initOf Escrow(myAddress(), orderId, hashLock, dstChainId, maker);
        return contractAddress(init);
    }
}
