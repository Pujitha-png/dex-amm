async function main() {
  console.log("Deploying DEX contracts...");

  // Deploy MockERC20 tokens
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const tokenA = await MockERC20.deploy("Token A", "TKA");
  await tokenA.deployed();
  console.log("Token A deployed to:", tokenA.address);

  const tokenB = await MockERC20.deploy("Token B", "TKB");
  await tokenB.deployed();
  console.log("Token B deployed to:", tokenB.address);

  // Deploy DEX
  const DEX = await ethers.getContractFactory("DEX");
  const dex = await DEX.deploy(tokenA.address, tokenB.address);
  await dex.deployed();
  console.log("DEX deployed to:", dex.address);

  // Add initial liquidity
  await tokenA.approve(dex.address, ethers.utils.parseEther("1000"));
  await tokenB.approve(dex.address, ethers.utils.parseEther("1000"));
  await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
  console.log("Initial liquidity added!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
