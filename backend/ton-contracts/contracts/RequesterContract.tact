import "@stdlib/deploy";
import "./HoldingContract.tact"; // Import the definition of the other contract

// This message is sent to this contract to trigger the fund request process
message RequestFunds {
    queryId: Int as uint64;
    holdingContract: Address;
}

contract RequesterContract with Deployable {

    init() {}

    // --- Message Receivers ---

    // Receive the trigger message to start the process
    receive(msg: RequestFunds) {
        // Send the "Release" message to the HoldingContract
        send(SendParameters{
            to: msg.holdingContract,
            value: ton("0.1"), // Send 0.1 TON to cover gas fees for the HoldingContract
            body: Release{queryId: 0}.toCell() // Construct and send the Release message
        });
    }

    // This contract must also be able to receive funds, both for its initial funding
    // and when the HoldingContract sends the released assets.
    receive() {}

    // Get-method to check its own balance easily
    get fun balance(): Int {
        return myBalance();
    }
}