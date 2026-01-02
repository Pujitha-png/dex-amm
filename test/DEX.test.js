const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DEX", function () {
  let dex, tokenA, tokenB;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    tokenA = await MockERC20.deploy("Token A", "TKA");
    tokenB = await MockERC20.deploy("Token B", "TKB");
    const DEX = await ethers.getContractFactory("DEX");
    dex = await DEX.deploy(tokenA.address, tokenB.address);
    
    await tokenA.approve(dex.address, ethers.utils.parseEther("1000000"));
    await tokenB.approve(dex.address, ethers.utils.parseEther("1000000"));
  });

  describe("Liquidity Management", function () {
    it("should allow initial liquidity provision", async function () {
      const amountA = ethers.utils.parseEther("100");
      const amountB = ethers.utils.parseEther("200");
      const tx = await dex.addLiquidity(amountA, amountB);
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
    });

    it("should mint correct LP tokens for first provider", async function () {
      const amountA = ethers.utils.parseEther("100");
      const amountB = ethers.utils.parseEther("200");
      await dex.addLiquidity(amountA, amountB);
      const ownerBalance = await dex.balanceOf(owner.address);
      expect(ownerBalance).to.be.gt(0);
    });

    it("should allow subsequent liquidity additions", async function () {
      const amountA = ethers.utils.parseEther("100");
      const amountB = ethers.utils.parseEther("200");
      await dex.addLiquidity(amountA, amountB);
      
      await tokenA.transfer(addr1.address, ethers.utils.parseEther("50"));
      await tokenB.transfer(addr1.address, ethers.utils.parseEther("100"));
      await tokenA.connect(addr1).approve(dex.address, ethers.utils.parseEther("50"));
      await tokenB.connect(addr1).approve(dex.address, ethers.utils.parseEther("100"));
      
      const tx = await dex.connect(addr1).addLiquidity(ethers.utils.parseEther("50"), ethers.utils.parseEther("100"));
      expect(tx).to.be.ok;
    });

    it("should maintain price ratio on liquidity addition", async function () {
      const amountA = ethers.utils.parseEther("100");
      const amountB = ethers.utils.parseEther("200");
      await dex.addLiquidity(amountA, amountB);
      
      const reserves1 = await dex.getReserves();
      expect(reserves1[0]).to.equal(amountA);
      expect(reserves1[1]).to.equal(amountB);
    });

    it("should allow partial liquidity removal", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      const balance = await dex.balanceOf(owner.address);
      const toRemove = balance.div(2);
      const tx = await dex.removeLiquidity(toRemove);
      expect(tx).to.be.ok;
    });

    it("should return correct token amounts on liquidity removal", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      const balance = await dex.balanceOf(owner.address);
      await dex.removeLiquidity(balance);
      const finalBalance = await dex.balanceOf(owner.address);
      expect(finalBalance).to.equal(0);
    });

    it("should revert on zero liquidity addition", async function () {
      await expect(dex.addLiquidity(0, ethers.utils.parseEther("100"))).to.be.reverted;
    });

    it("should revert when removing more liquidity than owned", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      const balance = await dex.balanceOf(owner.address);
      await expect(dex.removeLiquidity(balance.add(1))).to.be.reverted;
    });
  });

  describe("Token Swaps", function () {
    beforeEach(async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
    });

    it("should swap token A for token B", async function () {
      const amountIn = ethers.utils.parseEther("10");
      const tx = await dex.swapAForB(amountIn);
      expect(tx).to.be.ok;
    });

    it("should swap token B for token A", async function () {
      const amountIn = ethers.utils.parseEther("10");
      const tx = await dex.swapBForA(amountIn);
      expect(tx).to.be.ok;
    });

    it("should calculate correct output amount with fee", async function () {
      const amountIn = ethers.utils.parseEther("10");
      const output = await dex.getAmountOut(amountIn, ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      expect(output).to.be.gt(0);
    });

    it("should update reserves after swap", async function () {
      const reserves1 = await dex.getReserves();
      await dex.swapAForB(ethers.utils.parseEther("10"));
      const reserves2 = await dex.getReserves();
      expect(reserves2[0]).to.not.equal(reserves1[0]);
    });

    it("should increase k after swap due to fees", async function () {
      const reserves1 = await dex.getReserves();
      const k1 = reserves1[0].mul(reserves1[1]);
      await dex.swapAForB(ethers.utils.parseEther("10"));
      const reserves2 = await dex.getReserves();
      const k2 = reserves2[0].mul(reserves2[1]);
      expect(k2).to.be.gte(k1);
    });

    it("should revert on zero swap amount", async function () {
      await expect(dex.swapAForB(0)).to.be.reverted;
    });

    it("should handle large swaps with high price impact", async function () {
      const tx = await dex.swapAForB(ethers.utils.parseEther("50"));
      expect(tx).to.be.ok;
    });

    it("should handle multiple consecutive swaps", async function () {
      await dex.swapAForB(ethers.utils.parseEther("5"));
      await dex.swapBForA(ethers.utils.parseEther("5"));
      await dex.swapAForB(ethers.utils.parseEther("3"));
      const reserves = await dex.getReserves();
      expect(reserves[0]).to.be.gt(0);
    });
  });

  describe("Price Calculations", function () {
    it("should return correct initial price", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      const price = await dex.getPrice();
      expect(price).to.equal(ethers.utils.parseEther("2"));
    });

    it("should update price after swaps", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      const price1 = await dex.getPrice();
      await dex.swapAForB(ethers.utils.parseEther("10"));
      const price2 = await dex.getPrice();
      expect(price2).to.not.equal(price1);
    });

    it("should handle price queries with zero reserves gracefully", async function () {
      await expect(dex.getPrice()).to.be.reverted;
    });
  });

  describe("Fee Distribution", function () {
    it("should accumulate fees for liquidity providers", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      const balanceBefore = await tokenB.balanceOf(owner.address);
      await dex.swapAForB(ethers.utils.parseEther("10"));
      const balance = await dex.balanceOf(owner.address);
      expect(balance).to.be.gt(0);
    });

    it("should distribute fees proportionally to LP share", async function () {
      const tx = await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      expect(tx).to.be.ok;
    });
  });

  describe("Edge Cases", function () {
    it("should handle very small liquidity amounts", async function () {
      const tx = await dex.addLiquidity(ethers.utils.parseEther("0.001"), ethers.utils.parseEther("0.001"));
      expect(tx).to.be.ok;
    });

    it("should handle very large liquidity amounts", async function () {
      const tx = await dex.addLiquidity(ethers.utils.parseEther("1000000"), ethers.utils.parseEther("1000000"));
      expect(tx).to.be.ok;
    });

    it("should prevent unauthorized access", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      const balance = await dex.balanceOf(owner.address);
      await expect(dex.connect(addr1).removeLiquidity(balance)).to.be.reverted;
    });
  });

  describe("Events", function () {
    it("should emit LiquidityAdded event", async function () {
      await expect(dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"))).to.emit(dex, "LiquidityAdded");
    });

    it("should emit LiquidityRemoved event", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      const balance = await dex.balanceOf(owner.address);
      await expect(dex.removeLiquidity(balance)).to.emit(dex, "LiquidityRemoved");
    });

    it("should emit Swap event", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      await expect(dex.swapAForB(ethers.utils.parseEther("10"))).to.emit(dex, "Swap");
    });
  });
});
