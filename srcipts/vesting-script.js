async function main() {
    const Raffle = await ethers.getContractFactory("raffle");
    const raffle = await Raffle.deploy();
    await raffle.deployed();
    console.log("Raffle deployed to:", raffle.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
