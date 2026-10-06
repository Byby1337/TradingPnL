// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IPyth - Minimal interface for Pyth Network oracle on Arbitrum One
interface IPyth {
    struct Price {
        int64 price;
        uint64 conf;
        int32 expo;
        uint256 publishTime;
    }

    /// @notice Returns the price of a price feed if it is no older than `age` seconds
    /// @param id The Pyth Price Feed ID (e.g. BTC/USD, ETH/USD, SOL/USD)
    /// @param age Maximum acceptable age of the price in seconds
    function getPriceNoOlderThan(bytes32 id, uint256 age) external view returns (Price memory price);

    /// @notice Returns the most recent available price of a price feed
    function getPrice(bytes32 id) external view returns (Price memory price);
}
