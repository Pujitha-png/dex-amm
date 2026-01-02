// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DEX is ERC20, ReentrancyGuard {
    IERC20 public tokenA;
    IERC20 public tokenB;
    uint256 public reserveA;
    uint256 public reserveB;
    uint256 public totalLiquidity;
    mapping(address => uint256) public liquidity;

    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidityMinted);
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidityBurned);
    event Swap(address indexed trader, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);

    constructor(address _tokenA, address _tokenB) ERC20("DEX LP Token", "DEXLP") {
        require(_tokenA != address(0) && _tokenB != address(0), "Invalid token addresses");
        require(_tokenA != _tokenB, "Tokens must be different");
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    /// @notice Add liquidity to the pool
    function addLiquidity(uint256 amountA, uint256 amountB) external nonReentrant returns (uint256 liquidityMinted) {
        require(amountA > 0 && amountB > 0, "Amounts must be greater than zero");
        
        require(tokenA.transferFrom(msg.sender, address(this), amountA), "TokenA transfer failed");
        require(tokenB.transferFrom(msg.sender, address(this), amountB), "TokenB transfer failed");

        if (totalLiquidity == 0) {
            liquidityMinted = sqrt(amountA * amountB);
        } else {
            uint256 liquidityA = (amountA * totalLiquidity) / reserveA;
            uint256 liquidityB = (amountB * totalLiquidity) / reserveB;
            liquidityMinted = liquidityA < liquidityB ? liquidityA : liquidityB;
        }

        require(liquidityMinted > 0, "Liquidity minted must be greater than zero");

        _mint(msg.sender, liquidityMinted);
        liquidity[msg.sender] += liquidityMinted;
        totalLiquidity += liquidityMinted;
        reserveA += amountA;
        reserveB += amountB;

        emit LiquidityAdded(msg.sender, amountA, amountB, liquidityMinted);
        return liquidityMinted;
    }

    /// @notice Remove liquidity from the pool
    function removeLiquidity(uint256 liquidityAmount) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        require(liquidityAmount > 0, "Liquidity amount must be greater than zero");
        require(liquidity[msg.sender] >= liquidityAmount, "Insufficient liquidity");

        amountA = (liquidityAmount * reserveA) / totalLiquidity;
        amountB = (liquidityAmount * reserveB) / totalLiquidity;

        require(amountA > 0 && amountB > 0, "Amounts must be greater than zero");

        _burn(msg.sender, liquidityAmount);
        liquidity[msg.sender] -= liquidityAmount;
        totalLiquidity -= liquidityAmount;
        reserveA -= amountA;
        reserveB -= amountB;

        require(tokenA.transfer(msg.sender, amountA), "TokenA transfer failed");
        require(tokenB.transfer(msg.sender, amountB), "TokenB transfer failed");

        emit LiquidityRemoved(msg.sender, amountA, amountB, liquidityAmount);
        return (amountA, amountB);
    }

    /// @notice Swap token A for token B
    function swapAForB(uint256 amountAIn) external nonReentrant returns (uint256 amountBOut) {
        require(amountAIn > 0, "Amount must be greater than zero");
        require(reserveA > 0 && reserveB > 0, "Pool is empty");

        require(tokenA.transferFrom(msg.sender, address(this), amountAIn), "TokenA transfer failed");

        amountBOut = getAmountOut(amountAIn, reserveA, reserveB);
        require(amountBOut > 0, "Insufficient output");

        reserveA += amountAIn;
        reserveB -= amountBOut;

        require(tokenB.transfer(msg.sender, amountBOut), "TokenB transfer failed");

        emit Swap(msg.sender, address(tokenA), address(tokenB), amountAIn, amountBOut);
        return amountBOut;
    }

    /// @notice Swap token B for token A
    function swapBForA(uint256 amountBIn) external nonReentrant returns (uint256 amountAOut) {
        require(amountBIn > 0, "Amount must be greater than zero");
        require(reserveA > 0 && reserveB > 0, "Pool is empty");

        require(tokenB.transferFrom(msg.sender, address(this), amountBIn), "TokenB transfer failed");

        amountAOut = getAmountOut(amountBIn, reserveB, reserveA);
        require(amountAOut > 0, "Insufficient output");

        reserveB += amountBIn;
        reserveA -= amountAOut;

        require(tokenA.transfer(msg.sender, amountAOut), "TokenA transfer failed");

        emit Swap(msg.sender, address(tokenB), address(tokenA), amountBIn, amountAOut);
        return amountAOut;
    }

    /// @notice Get current price of token A in terms of token B
    function getPrice() external view returns (uint256 price) {
        require(reserveA > 0, "Pool is empty");
        price = (reserveB * 1e18) / reserveA;
    }

    /// @notice Get current reserves
    function getReserves() external view returns (uint256 _reserveA, uint256 _reserveB) {
        return (reserveA, reserveB);
    }

    /// @notice Calculate amount of token B received for given amount of token A
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256 amountOut) {
        require(amountIn > 0 && reserveIn > 0 && reserveOut > 0, "Invalid amounts");
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    /// @notice Calculate square root using Babylonian method
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
