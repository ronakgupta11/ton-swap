import "@stdlib/deploy";
import "./utils.tact";
import "./timelock.tact";

// NOTE: This contract assumes utils.tact contains definitions for:
// JettonTransfer, JettonTransferNotification, JettonTransferGas, cashback

// Order structure matching EVM interface
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

// Pre-interaction message
message(0x12345678) PreInteraction {
    order: Order;
    signature: Slice;
}

// Post-interaction message
message(0x87654321) PostInteraction {
    orderHash: Int as uint256;
    factory: Address;
    safetyDeposit: Int as coins;
}

// Order validated event
message(0x11111111) OrderValidated {
    orderHash: Int as uint256;
    maker: Address;
}

// Order filled event
message(0x22222222) OrderFilled {
    orderHash: Int as uint256;
    resolver: Address;
}

// Set factory message
message(0x55555555) SetFactory {
    factory: Address;
}

contract LimitOrderProtocol with Deployable {
    // Track validated orders to prevent replay attacks
    validatedOrders: map<Int, Bool>;
    
    // Store order details for validated orders
    orders: map<Int, Order>;
    
    // Owner address
    owner: Address;
    
    // Factory contract address
    factory: Address;

    init(owner: Address) {
        self.owner = owner;
        self.factory = owner; // Should be set properly by owner post-deployment
    }

    receive() {
        // Generic fallback to handle accidental TON transfers
        cashback(sender());
    }

    // Phase 1: Called by the maker to validate their order and provide TON if needed
    receive(msg: PreInteraction) {
        let order: Order = msg.order;
        
        // 1. Verify the signature to ensure the order is authentic
        let orderHash: Int = self.hashOrder(order);
        
        // CRITICAL: Call secure recover signer implementation
        let recoveredMaker: Address = self.recoverSigner(orderHash, msg.signature);
        
        require(recoveredMaker == order.maker, "Invalid signature");
        
        // 2. Only the maker can call this function
        require(sender() == order.maker, "Only maker can call preInteraction");
        
        // 3. Prevent replay attacks
        let isAlreadyValidatedOpt = self.validatedOrders.get(orderHash);
        let isAlreadyValidated: Bool = isAlreadyValidatedOpt != null ? isAlreadyValidatedOpt!! : false;
        require(!isAlreadyValidated, "Order already validated");
        
        // 4. Handle TON vs Jetton transfers
        if (order.makerAsset == null) {
            // TON swap: Maker sends TON with this transaction
            require(context().value >= order.makingAmount, "Insufficient TON amount sent");
        } else {
            // Jetton swap: The jetton transfer should have been sent to this contract
            // A small amount of TON is still required for gas
            require(context().value >= ton("0.1"), "Insufficient gas for jetton transfer");
        }
        
        // 5. Mark order as validated and store it
        self.validatedOrders.set(orderHash, true);
        self.orders.set(orderHash, order);
        
        // Emit event
        emit(OrderValidated {
            orderHash,
            maker: order.maker,
        }.toCell());
    }

    // Phase 2: Called by the resolver to transfer funds from LOP to escrow
    receive(msg: PostInteraction) {
        let orderHash: Int = msg.orderHash;
        
        // 1. Check that the order was validated in preInteraction
        let isAlreadyValidatedOpt = self.validatedOrders.get(orderHash);
        let isAlreadyValidated: Bool = isAlreadyValidatedOpt != null ? isAlreadyValidatedOpt!! : false;
        require(isAlreadyValidated, "Order not validated");
        
        // 2. Get the stored order (use '!!' to assert it exists, since we just checked)
        let order: Order = self.orders.get(orderHash)!!;
        
        // 3. Transfer funds from this contract to the EscrowFactory
        if (order.makerAsset == null) {
            // For TON: Forward TON to factory
            send(SendParameters {
                to: msg.factory,
                value: order.makingAmount,
                mode: SendRemainingValue, // Send all remaining value to cover fees
                body: PostInteraction { // Forwarding the message body
                    orderHash: orderHash,
                    factory: msg.factory, // Or self.factory, depending on logic
                    safetyDeposit: msg.safetyDeposit
                }.toCell()
            });
        } else {
            // For Jetton: Transfer tokens to factory
            let makerAssetAddress: Address = order.makerAsset!!;
            send(SendParameters {
                to: makerAssetAddress,
                value: ton("0.1"), // Jetton transfer gas
                body: JettonTransfer {
                    queryId: 0,
                    amount: order.makingAmount,
                    destination: msg.factory,
                    responseDestination: self.owner,
                    customPayload: null,
                    forwardTonAmount: ton("0.05"),
                    forwardPayload: beginCell()
                        .storeUint(0, 32) // No-op or custom instruction index
                        .endCell()
                        .beginParse(),
                }.toCell(),
            });
        }
        
        // 4. Mark order as filled (prevent replay) by deleting its state
        self.validatedOrders.del(orderHash);
        self.orders.del(orderHash);
        
        // Emit event
        emit(OrderFilled {
            orderHash,
            resolver: sender(),
        }.toCell());
    }

    // Receive jetton transfer notifications
    receive(msg: JettonTransferNotification) {
        // Credit jetton transfer to the contract's internal state or balance tracking if implemented
        // Otherwise, just accept transfer (gas will be taken care of)
    }

    // Set factory address (only owner)
    receive(msg: SetFactory) {
        require(sender() == self.owner, "Only owner can set factory");
        self.factory = msg.factory;
    }

    // Hash order for signature verification
    fun hashOrder(order: Order): Int {
        let cell = beginCell();
        cell.storeAddress(order.maker);
        
        if (order.makerAsset == null) {
            cell.storeUint(0, 2); // null address marker
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

    // Recover signer from signature (secure implementation)
    fun recoverSigner(hash: Int, signature: Slice): Address {
        // NOTE: This is a simplified example using check_signature -
        // in practice, you need the maker's public key to perform the verification.
        // Please replace 'makerPublicKey' with actual public key (passed or stored).
        //
        // E.g.:
        // let valid: Bool = check_signature(hash, signature, makerPublicKey);
        // require(valid, "Invalid signature");
        //
        // Since maker's pubkey is not stored, temporarily revert with zero address:
        // return newAddress(0, 0);

        // Placeholder implementation with failure to force correct implementation:
        // For demo, pretend signature is always invalid:
        require(false, "recoverSigner must be implemented securely");
        return newAddress(0, 0); // unreachable fallback
    }

    // Getter functions
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
