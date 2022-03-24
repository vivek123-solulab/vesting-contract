async function main() {
    const TokenVesting = await ethers.getContractFactory("TokenVesting");
    const tokenVesting = await TokenVesting.deploy();
    await tokenVesting.deployed();
    const MyToken = await ethers.getContractFactory("TokenVesting");
    const myToken = await MyToken.deploy();
    await myToken.deployed();
    console.log("MyToken contract deployed to:", myToken.address);
    console.log("Vesting contract deployed to:", tokenVesting.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
