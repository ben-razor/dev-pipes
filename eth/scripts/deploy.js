/*
 * 1. npx hardhat compile
 * 2. npx hardhat test 
 * 3. npx hardhat run scripts/deploy.js --network ropsten
 * 4. Update proxy/impAddress
 * 5. npx hardhat verify --network ropsten <impAddress>
 * 6. Copy ABI to code
 * 7. Set code address to proxy address if not upgrading
 */
const { ethers, upgrades } = require("hardhat");

let network = hre.network.name;
let proxyAddress;

if(network === 'polygon') {
  proxyAddress = '0xb671A76Fe1Ee4E8535d827AdD0b260Ab71A124a9';
  impAddress = '0x3b21Fdbba3380A1A2459BdFab13166117a460E3d';
}
else if(network === 'ropsten') {
  proxyAddress = '0x8D0676Da7F8A4Ae60f988beD23006f919f044756';
  impAddress = '0x7014fA3Ebb04D131B2101ABe4a1eBfA519E70527';
}

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const DevPipes = await ethers.getContractFactory("DevPipes");
  let instance;
  let res;
  let initRes;

  if(!proxyAddress) {
    console.log('Deploying contract');
    instance = await upgrades.deployProxy(DevPipes);
    res = await instance.deployed();
    initRes = res.init();
  }
  else {
    console.log('Upgrading contract');
    res = await upgrades.upgradeProxy(proxyAddress, DevPipes);
  }

  console.log("Proxy address:", res.address);
  console.log('Implementation address: ', await upgrades.erc1967.getImplementationAddress(res.address));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });