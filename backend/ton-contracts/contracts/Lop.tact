import "@stdlib/deploy";
import "./utils.tact";
import "./timelock.tact";

// NOTE: This contract assumes utils.tact contains definitions for:
// JettonTransfer, JettonTransferNotification, JettonTransferGas, cashback

struct Order {
    maker: Address;
    makerAsset: Address?; // For TON native, use null
    takerAsset: Address;
    makingAmount: Int as uint256;
    takingAmount: Int as uint256;
    receiver: Address;
    hashlock: Int as uint256;
    salt: Int as uint256;
}

message(0x12345678) PreInteraction {
    order: Order;
    signature: Slice;
    makerPublicKey: Int;
}

message(0x87654321) PostInteraction {
    orderHash: Int as uint256;
    factory: Address;
    safetyDeposit: Int as coins;
}

message(0x11111111) OrderValidated {
    orderHash: Int as uint256;
    maker: Address;
}

message(0x22222222) OrderFilled {
    orderHash: Int as uint256;
    resolver: Address;
}

message(0x55555555) SetFactory {
    factory: Address;
}

contract LimitOrderProtocol with Deployable {
    validatedOrders: map<Int, Bool>;
    orders: map<Int, Order>;
    owner: Address;
    factory: Address;

    init(owner: Address) {
        self.owner = owner;
        self.factory = owner; // Should be set properly by owner post-deployment
    }

    receive() {
        cashback(sender());
    }

    receive(msg: PreInteraction) {
        let order: Order = msg.order;

        let orderHash: Int = self.hashOrder(order);

        // Verify signature using makerPublicKey and maker address from order
        let recoveredMaker: Address = self.recoverSigner(orderHash, msg.signature, msg.makerPublicKey, order.maker);

        require(recoveredMaker == order.maker, "Invalid signature");

        require(sender() == order.maker, "Only maker can call preInteraction");

        let isAlreadyValidatedOpt = self.validatedOrders.get(orderHash);
        let isAlreadyValidated: Bool = isAlreadyValidatedOpt != null ? isAlreadyValidatedOpt!! : false;
        require(!isAlreadyValidated, "Order already validated");

        if (order.makerAsset == null) {
            require(context().value >= order.makingAmount, "Insufficient TON amount sent");
        } else {
            require(context().value >= ton("0.1"), "Insufficient gas for jetton transfer");
        }

        self.validatedOrders.set(orderHash, true);
        self.orders.set(orderHash, order);

        emit(OrderValidated {
            orderHash,
            maker: order.maker,
        }.toCell());
    }

    receive(msg: PostInteraction) {
        let orderHash: Int = msg.orderHash;

        let isAlreadyValidatedOpt = self.validatedOrders.get(orderHash);
        let isAlreadyValidated: Bool = isAlreadyValidatedOpt != null ? isAlreadyValidatedOpt!! : false;
        require(isAlreadyValidated, "Order not validated");

        let order: Order = self.orders.get(orderHash)!!;

        if (order.makerAsset == null) {
            send(SendParameters {
                to: msg.factory,
                value: order.makingAmount,
                mode: SendRemainingValue,
                body: PostInteraction {
                    orderHash: orderHash,
                    factory: msg.factory,
                    safetyDeposit: msg.safetyDeposit
                }.toCell()
            });
        } else {
            let makerAssetAddress: Address = order.makerAsset!!;
            send(SendParameters {
                to: makerAssetAddress,
                value: ton("0.1"),
                body: JettonTransfer {
                    queryId: 0,
                    amount: order.makingAmount,
                    destination: msg.factory,
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

        self.validatedOrders.del(orderHash);
        self.orders.del(orderHash);

        emit(OrderFilled {
            orderHash,
            resolver: sender(),
        }.toCell());
    }

    receive(msg: JettonTransferNotification) {
        // Accept jetton transfers
    }

    receive(msg: SetFactory) {
        require(sender() == self.owner, "Only owner can set factory");
        self.factory = msg.factory;
    }

   get fun hashOrder(order: Order): Int {
        let cell = beginCell();
        cell.storeAddress(order.maker);

        if (order.makerAsset == null) {
            cell.storeUint(0, 2);
        } else {
            cell.storeAddress(order.makerAsset!!);
        }

        cell.storeAddress(order.takerAsset);
        cell.storeUint(order.makingAmount, 256);
        cell.storeUint(order.takingAmount, 256);
        cell.storeAddress(order.receiver);
        cell.storeUint(order.hashlock, 256);
        cell.storeUint(order.salt, 256);

        return keccak256(cell.endCell().asSlice());
    }

    fun recoverSigner(hash: Int, signature: Slice, makerPublicKey: Int, makerAddress: Address): Address {
        let valid: Bool = checkSignature(hash, signature, makerPublicKey);
        require(valid, "Invalid signature");
        return makerAddress;
    }

    get fun getOwner(): Address {
        return self.owner;
    }

    get fun getFactory(): Address {
        return self.factory;
    }

    get fun isOrderValidated(orderHash: Int): Bool {
        let isAlreadyValidatedOpt = self.validatedOrders.get(orderHash);
        return isAlreadyValidatedOpt != null ? isAlreadyValidatedOpt!! : false;
    }

    get fun getOrder(orderHash: Int): Order? {
        return self.orders.get(orderHash);
    }
}
