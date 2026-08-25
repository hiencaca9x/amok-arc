// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract AmokToken is ERC20 {
    constructor(
        string memory name_,
        string memory symbol_,
        address mintTo
    ) ERC20(name_, symbol_) {
        _mint(mintTo, 1_000_000_000 * 10 ** decimals());
    }
}
