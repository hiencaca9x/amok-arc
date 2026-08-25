// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AmokToken.sol";

contract AmokLaunchpad {
    using SafeERC20 for IERC20;

    IERC20 public immutable USDC;
    address public treasury;

    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 1e18;
    uint256 public constant VIRTUAL_USDC = 3_000 * 1e6;       // thanh khoản ảo, khởi tạo giá ban đầu
    uint256 public constant GRADUATE_THRESHOLD = 20_000 * 1e6; // 20,000 USDC thật trong curve
    uint256 public constant CREATOR_FEE_BPS = 70;   // 0.7%
    uint256 public constant TREASURY_FEE_BPS = 30;  // 0.3%
    uint256 public constant BPS_DENOM = 10_000;

    struct TokenInfo {
        address creator;
        uint256 reserveUSDC;
        uint256 reserveToken;
        uint256 creatorEarned;
        bool graduated;
    }

    mapping(address => TokenInfo) public tokens;
    address[] public allTokens;

    event TokenCreated(address indexed token, address indexed creator, string name, string symbol);
    event Trade(address indexed token, address indexed trader, bool isBuy, uint256 usdcAmount, uint256 tokenAmount);
    event Graduated(address indexed token, uint256 finalReserveUSDC);

    constructor(address usdcAddress, address treasury_) {
        USDC = IERC20(usdcAddress);
        treasury = treasury_;
    }

    function createToken(string memory name, string memory symbol) external returns (address) {
        AmokToken token = new AmokToken(name, symbol, address(this));
        tokens[address(token)] = TokenInfo(msg.sender, 0, TOTAL_SUPPLY, 0, false);
        allTokens.push(address(token));
        emit TokenCreated(address(token), msg.sender, name, symbol);
        return address(token);
    }

    function buy(address token, uint256 usdcIn, uint256 minTokensOut) external {
        TokenInfo storage info = tokens[token];
        require(info.creator != address(0), "unknown token");
        require(!info.graduated, "graduated");

        uint256 creatorFee = (usdcIn * CREATOR_FEE_BPS) / BPS_DENOM;
        uint256 treasuryFee = (usdcIn * TREASURY_FEE_BPS) / BPS_DENOM;
        uint256 usdcNet = usdcIn - creatorFee - treasuryFee;

        uint256 vReserve = info.reserveUSDC + VIRTUAL_USDC;
        uint256 k = vReserve * info.reserveToken;
        uint256 newVReserve = vReserve + usdcNet;
        uint256 newReserveToken = k / newVReserve;
        uint256 tokensOut = info.reserveToken - newReserveToken;
        require(tokensOut >= minTokensOut, "slippage");

        USDC.safeTransferFrom(msg.sender, address(this), usdcIn);
        USDC.safeTransfer(treasury, treasuryFee);

        info.reserveUSDC += usdcNet;
        info.reserveToken = newReserveToken;
        info.creatorEarned += creatorFee;

        IERC20(token).safeTransfer(msg.sender, tokensOut);
        emit Trade(token, msg.sender, true, usdcIn, tokensOut);

        if (info.reserveUSDC >= GRADUATE_THRESHOLD) {
            info.graduated = true;
            emit Graduated(token, info.reserveUSDC);
        }
    }

    function sell(address token, uint256 tokensIn, uint256 minUsdcOut) external {
        TokenInfo storage info = tokens[token];
        require(info.creator != address(0), "unknown token");
        require(!info.graduated, "graduated");

        uint256 vReserve = info.reserveUSDC + VIRTUAL_USDC;
        uint256 k = vReserve * info.reserveToken;
        uint256 newReserveToken = info.reserveToken + tokensIn;
        uint256 newVReserve = k / newReserveToken;
        uint256 usdcOutGross = vReserve - newVReserve;

        uint256 creatorFee = (usdcOutGross * CREATOR_FEE_BPS) / BPS_DENOM;
        uint256 treasuryFee = (usdcOutGross * TREASURY_FEE_BPS) / BPS_DENOM;
        uint256 usdcOutNet = usdcOutGross - creatorFee - treasuryFee;
        require(usdcOutNet >= minUsdcOut, "slippage");

        IERC20(token).safeTransferFrom(msg.sender, address(this), tokensIn);

        info.reserveToken = newReserveToken;
        info.reserveUSDC -= usdcOutGross;
        info.creatorEarned += creatorFee;

        USDC.safeTransfer(treasury, treasuryFee);
        USDC.safeTransfer(msg.sender, usdcOutNet);
        emit Trade(token, msg.sender, false, usdcOutNet, tokensIn);
    }

    function claimCreatorRewards(address token) external {
        TokenInfo storage info = tokens[token];
        require(msg.sender == info.creator, "not creator");
        uint256 amount = info.creatorEarned;
        require(amount > 0, "nothing to claim");
        info.creatorEarned = 0;
        USDC.safeTransfer(msg.sender, amount);
    }

    function allTokensLength() external view returns (uint256) {
        return allTokens.length;
    }
}
