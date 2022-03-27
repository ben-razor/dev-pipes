// We import Chai to use its asserting functions here.
const { Description } = require("@ethersproject/properties");
const { expect } = require("chai");

const biconomyForwarderAddress = '0x84a0856b038eaAd1cC7E297cF34A7e72685A8693';
const rinkebyForwarderAddress = '0xFD4973FeB2031D4409fB57afEE5dF2051b171104';
const maticForwarderAddress = '0x86C80a8aa58e0A4fa09A69624c31Ab2a6CAD56b8';
const mumbaiForwarderAddress = '0x9399BB24DBB5C4b782C70c2969F58716Ebbd6a3b';

// `describe` is a Mocha function that allows you to organize your tests. It's
// not actually needed, but having your tests organized makes debugging them
// easier. All Mocha functions are available in the global scope.

// `describe` receives the name of a section of your test suite, and a callback.
// The callback must define the tests of that section. This callback can't be
// an async function.
describe("DevPipes contract", function () {
  // Mocha has four functions that let you hook into the the test runner's
  // lifecyle. These are: `before`, `beforeEach`, `after`, `afterEach`.

  // They're very useful to setup the environment for tests, and to clean it
  // up after they run.

  // A common pattern is to declare some variables, and assign them in the
  // `before` and `beforeEach` callbacks.

  let DevPipes;
  let hardhatDevPipes;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    DevPipes = await ethers.getContractFactory("DevPipes");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // To deploy our contract, we just have to call DevPipes.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    hardhatDevPipes = await DevPipes.deploy();
    hardhatDevPipes.init(rinkebyForwarderAddress);
  });

  // You can nest describe calls to create subsections.
  describe("Deployment", function () {
    // `it` is another Mocha function. This is the one you use to define your
    // tests. It receives the test name, and a callback function.

    // If the callback function is async, Mocha will `await` it.
    it("Should set the right owner", async function () {
      // Expect receives a value, and wraps it in an Assertion object. These
      // objects have a lot of utility methods to assert values.

      // This test expects the owner variable stored in the contract to be equal
      // to our Signer's owner.
      expect(await hardhatDevPipes.owner()).to.equal(owner.address);
    });

  });

  describe('Projects', function() {
    it("Should create projects", async function () {
      let dueDate = Math.floor(Date.now() / 1000);
      let payment = 10n;
      let oneEth = payment**18n;
      let pointOneEth = payment**17n;

      await hardhatDevPipes.connect(addr1).createProject(
        "DevPipes", "Creating the Dev Pipes DApp", "https://ipfs.io/ipfs/bafkreicr6p5fvmewvwzrmkanwcuc6a4cn4gjjacbhhblriigarhzemvfze",
        "", dueDate, oneEth.toString(), 
      );

      let projects = await hardhatDevPipes.getProjectsForUser(addr1.address);
      console.log("PROJ", projects);
      expect(projects.length).to.equal(1);
      expect(projects[0].budget).to.equal(oneEth.toString());

      await hardhatDevPipes.connect(addr1).editProject(projects[0].id,
        "DevPipes", "Creating the Dev Pipes DApp", "https://ipfs.io/ipfs/bafkreicr6p5fvmewvwzrmkanwcuc6a4cn4gjjacbhhblriigarhzemvfze",
        "eth", dueDate, pointOneEth.toString(), 
      );

      let projects1 = await hardhatDevPipes.getProjectsForUser(addr1.address);
      expect(projects1.length).to.equal(1);
      expect(projects1[0].budget).to.equal(pointOneEth.toString());
      expect(projects1[0].tags).to.equal('eth');
    });

    it("Should add royalties", async function () {
      let dueDate = Math.floor(Date.now() / 1000);
      let payment = 10n;
      let oneEth = payment**18n;
      let pointOneEth = payment**17n;

      await hardhatDevPipes.connect(addr1).createProject(
        "DevPipes", "Creating the Dev Pipes DApp", "https://ipfs.io/ipfs/bafkreicr6p5fvmewvwzrmkanwcuc6a4cn4gjjacbhhblriigarhzemvfze",
        "", dueDate, oneEth.toString(), 
      );

      await hardhatDevPipes.connect(addr1).addRoyalty(1, addr1.address, pointOneEth);

      let royalties = await hardhatDevPipes.getRoyaltiesTotal(1);
      expect(royalties).to.equal(pointOneEth);
    });

    it("Should not allow others to add royalties", async function () {
      let dueDate = Math.floor(Date.now() / 1000);
      let payment = 10n;
      let oneEth = payment**18n;
      let pointOneEth = payment**17n;

      await hardhatDevPipes.connect(addr1).createProject(
        "DevPipes", "Creating the Dev Pipes DApp", "https://ipfs.io/ipfs/bafkreicr6p5fvmewvwzrmkanwcuc6a4cn4gjjacbhhblriigarhzemvfze",
        "", dueDate, oneEth.toString(), 
      );

      await 
      expect(hardhatDevPipes.connect(addr2).addRoyalty(1, addr1.address, pointOneEth))
      .to.be.revertedWith('error_only_project_creator_can_edit');
    });

    it("Should be publishable", async function () {
      let dueDate = Math.floor(Date.now() / 1000);
      let payment = 10n;
      let oneEth = payment**18n;
      let pointOneEth = payment**17n;

      let connAddr1 = hardhatDevPipes.connect(addr1);

      await connAddr1.createProject(
        "DevPipes", "Creating the Dev Pipes DApp", "https://ipfs.io/ipfs/bafkreicr6p5fvmewvwzrmkanwcuc6a4cn4gjjacbhhblriigarhzemvfze",
        "", dueDate, oneEth.toString(), 
      );

      await connAddr1.publish(1);

    });

  });

  /*
  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      // Transfer 50 tokens from owner to addr1
      await hardhatDevPipes.transfer(addr1.address, 50);
      const addr1Balance = await hardhatDevPipes.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);

      // Transfer 50 tokens from addr1 to addr2
      // We use .connect(signer) to send a transaction from another account
      await hardhatDevPipes.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await hardhatDevPipes.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

    it("Should fail if sender doesn’t have enough tokens", async function () {
      const initialOwnerBalance = await hardhatDevPipes.balanceOf(owner.address);

      // Try to send 1 token from addr1 (0 tokens) to owner (1000000 tokens).
      // `require` will evaluate false and revert the transaction.
      await expect(
        hardhatDevPipes.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("Not enough tokens");

      // Owner balance shouldn't have changed.
      expect(await hardhatDevPipes.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });

    it("Should update balances after transfers", async function () {
      const initialOwnerBalance = await hardhatDevPipes.balanceOf(owner.address);

      // Transfer 100 tokens from owner to addr1.
      await hardhatDevPipes.transfer(addr1.address, 100);

      // Transfer another 50 tokens from owner to addr2.
      await hardhatDevPipes.transfer(addr2.address, 50);

      // Check balances.
      const finalOwnerBalance = await hardhatDevPipes.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(150));

      const addr1Balance = await hardhatDevPipes.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(100);

      const addr2Balance = await hardhatDevPipes.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });
  });
  */
});