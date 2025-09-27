// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { AddressLib, Address } from "./libraries/AddressLib.sol";
import { Timelocks, TimelocksLib } from "./libraries/TimelocksLib.sol";

import { IBaseEscrow } from "./interfaces/IBaseEscrow.sol";
import { BaseEscrow } from "./BaseEscrow.sol";
import { Escrow } from "./Escrow.sol";

/**
 * @title ton Destination Escrow for ton→EVM atomic swaps
 * @notice Escrow contract for ton→EVM swaps - holds ERC20/ETH, releases on secret reveal
 * @dev Used when ton is the source and EVM tokens are the destination
 * @custom:security-contact security@atomicswap.io
 */
contract EscrowDst is Escrow {
    using SafeERC20 for IERC20;
    using AddressLib for Address;
    using TimelocksLib for Timelocks;

    /// @notice ton transaction hash for verification (optional)
    mapping(bytes32 => string) public tonTxHashes;

    /// @notice ton addresses for verification (optional)
    mapping(bytes32 => string) public tonAddresses;

    event tonTxHashRecorded(bytes32 indexed hashlock, string tonTxHash);
    event tonAddressRecorded(bytes32 indexed hashlock, string tonAddress);

    constructor(uint32 rescueDelay, IERC20 accessToken) BaseEscrow(rescueDelay, accessToken) {}

    // Allow contract to receive ETH
    receive() external payable {}

    /**
     * @notice Private withdrawal by maker using secret
     * @dev Maker reveals secret to claim EVM tokens after providing ton
     * @param immutables The escrow immutables
     */
        //      onlyAfter(immutables.timelocks.get(TimelocksLib.Stage.DstWithdrawal))
        // onlyBefore(immutables.timelocks.get(TimelocksLib.Stage.DstCancellation))
    function withdraw(bytes32 /*secret*/, Immutables calldata immutables)
        external
        override
        onlyValidImmutables(immutables)
    {
        // Allow both maker and taker to withdraw in private period
        if (msg.sender != immutables.taker.get()) {
            revert InvalidCaller();
        }

        _withdraw( immutables);
    }

    /**
     * @notice Public withdrawal by anyone with access token
     * @dev Anyone with access token can trigger withdrawal in public period
     * @param secret The secret that matches the hashlock
     * @param immutables The escrow immutables
     */
    function publicWithdraw(bytes32 secret, Immutables calldata immutables)
        external
        onlyAccessTokenHolder()
        onlyValidImmutables(immutables)
        onlyValidSecret(secret, immutables)
        onlyAfter(immutables.timelocks.get(TimelocksLib.Stage.DstPublicWithdrawal))
        onlyBefore(immutables.timelocks.get(TimelocksLib.Stage.DstCancellation))
    {
        _withdraw( immutables);
    }

    /**
     * @notice Cancels escrow and returns funds to taker
     * @dev Can only be called after cancellation period starts
     * @param immutables The escrow immutables
     */
    function cancel(Immutables calldata immutables)
        external
        override
        onlyTaker(immutables)
        onlyValidImmutables(immutables)
        onlyAfter(immutables.timelocks.get(TimelocksLib.Stage.DstCancellation))
    {
        // Return tokens to taker
        _uniTransfer(immutables.token.get(), immutables.taker.get(), immutables.amount);
        // Return safety deposit to taker
        _ethTransfer(immutables.taker.get(), immutables.safetyDeposit);
        
        emit EscrowCancelled();
    }

    /**
     * @notice Records ton transaction hash for verification
     * @dev Optional function to link ton transaction to escrow
     * @param hashlock The escrow hashlock
     * @param tonTxHash The ton transaction hash
     * @param immutables The escrow immutables
     */
    function recordtonTx(
        bytes32 hashlock,
        string calldata tonTxHash,
        Immutables calldata immutables
    )
        external
        onlyValidImmutables(immutables)
    {
        // Only maker or taker can record ton tx
        if (msg.sender != immutables.maker.get() && msg.sender != immutables.taker.get()) {
            revert InvalidCaller();
        }

        tonTxHashes[hashlock] = tonTxHash;
        emit tonTxHashRecorded(hashlock, tonTxHash);
    }

    /**
     * @notice Records ton address for verification
     * @dev Optional function to link ton address to escrow
     * @param hashlock The escrow hashlock
     * @param tonAddress The ton address
     * @param immutables The escrow immutables
     */
    function recordtonAddress(
        bytes32 hashlock,
        string calldata tonAddress,
        Immutables calldata immutables
    )
        external
        onlyValidImmutables(immutables)
    {
        // Only maker or taker can record ton address
        if (msg.sender != immutables.maker.get() && msg.sender != immutables.taker.get()) {
            revert InvalidCaller();
        }

        tonAddresses[hashlock] = tonAddress;
        emit tonAddressRecorded(hashlock, tonAddress);
    }

    /**
     * @notice Gets recorded ton transaction hash
     * @param hashlock The escrow hashlock
     * @return The ton transaction hash
     */
    function gettonTxHash(bytes32 hashlock) external view returns (string memory) {
        return tonTxHashes[hashlock];
    }

    /**
     * @notice Gets recorded ton address
     * @param hashlock The escrow hashlock
     * @return The ton address
     */
    function gettonAddress(bytes32 hashlock) external view returns (string memory) {
        return tonAddresses[hashlock];
    }

    /**
     * @dev Internal withdrawal logic

     * @param immutables The escrow immutables
     */
    function _withdraw( Immutables calldata immutables) internal {
        // Transfer tokens to maker
        _uniTransfer(immutables.token.get(), immutables.maker.get(), immutables.amount);
        
        // Return safety deposit to taker
        _ethTransfer(immutables.taker.get(), immutables.safetyDeposit);
        
        emit EscrowWithdrawal();
    }
} 