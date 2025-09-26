import "@stdlib/deploy";

// Message that the RequesterContract will send to us
message Release {
    queryId: Int as uint64;
}

// The HoldingContract itself
contract HoldingContract with Deployable {
    // --- Storage ---
    owner: Address;          // The address of the user who can deposit
    requester: Address;      // The only address that can request the funds
    minRequesterBalance: Int as coins; // The minimum balance the requester must have

    // --- Deployment ---
    init(owner: Address, requester: Address, minRequesterBalance: Int) {
        self.owner = owner;
        self.requester = requester;
        self.minRequesterBalance = minRequesterBalance;
    }

    // --- Message Receivers ---

    // This function handles the "Release" message
    receive(msg: Release) {
        // 1. VERIFY: Is the sender the authorized requester contract?
        require(context().sender == self.requester, "HoldingContract: Not an authorized requester!");

        // 2. VERIFY: Does the requester have enough funds?
        let requesterBalance: Int = balance(self.requester);
        require(requesterBalance >= self.minRequesterBalance, "HoldingContract: Requester balance is too low!");

        // 3. RELEASE: If both checks pass, send all remaining funds to the requester.
        // The `SendRemainingValue` mode sends the entire contract balance minus network fees.
        send(SendParameters{
            to: self.requester,
            value: 0, // value is ignored when mode is SendRemainingValue
            mode: SendRemainingValue,
            body: "Funds released from holding contract".toCell() // Optional message body
        });
    }

    // A simple receiver for accepting deposits. Any internal message with no specific
    // format will be treated as a deposit and the funds will be accepted.
    receive() {}

    // --- Get-Method ---
    // Allows you to read the contract's data from off-chain
    get data(): (Address, Address, Int) {
        return (self.owner, self.requester, self.minRequesterBalance);
    }
}