import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import { MainSmartContractClient, MainSmartContractFactory } from '../clients/MainSmartContract';
import algosdk, { OnApplicationComplete } from 'algosdk';
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount';

describe('MainSmartContract Deployment', () => {
  let algorand: AlgorandClient;
  let deployer: algosdk.Account;

  beforeAll(async () => {
    algorand = AlgorandClient.testNet();

    // Create account from mnemonic
    const mnemonic = "announce feed swing base certain rib rose phrase crouch rotate voyage enroll same sort flush emotion pulp airport notice inject pelican zero blossom about honey";
    deployer = algosdk.mnemonicToSecretKey(mnemonic);

    // Fund account if needed (testnet)
    try {
      const accountInfo = await algorand.account.getInformation(deployer.addr);
      if (accountInfo.balance.microAlgo < 1000000) { // Less than 1 ALGO
        console.log('Account needs funding on testnet');
      }
    } catch (error) {
      console.log('Account not found, may need funding');
    }
  });

  it('should deploy the MainSmartContract', async () => {
    // Create the typed app factory
    const signer = algosdk.makeBasicAccountTransactionSigner(deployer);

    const appFactory = new MainSmartContractFactory({
      defaultSender: deployer.addr,
      defaultSigner: signer,
      algorand,
    });

    // Deploy the contract
    const { appClient } = await appFactory.send.create.createApplication({
      args: [],
      sender: deployer.addr,
      signer: signer,
      onComplete: OnApplicationComplete.NoOpOC,
    });

    // Verify deployment
    expect(appClient.appId).toBeDefined();
    expect(appClient.appId).toBeGreaterThan(0);
    console.log('Deployed MainSmartContract App ID:', appClient.appId);

    // Verify initial state
    const maintainerAddress = await appClient.state.global.maintainerAddress();
    const usersNumber = await appClient.state.global.usersNumber();
    
    expect(maintainerAddress).toBeDefined();
  });

  it('should register a user', async () => {
    // Deploy contract first
    const signer = algosdk.makeBasicAccountTransactionSigner(deployer);
    const appFactory = new MainSmartContractFactory({
      defaultSender: deployer.addr,
      defaultSigner: signer,
      algorand,
    });

    const { appClient } = await appFactory.send.create.createApplication({
      args: [],
      sender: deployer.addr,
      signer: signer,
      onComplete: OnApplicationComplete.NoOpOC,
    });

    // Fund the contract to handle the payment
    await algorand.send.payment({
      sender: deployer.addr,
      receiver: appClient.appAddress,
      amount: AlgoAmount.Algo(1),
      signer: signer
    });

    // Create a payment transaction for registration
    const paymentTxn = await algorand.createTransaction.payment({
      sender: deployer.addr,
      receiver: appClient.appAddress,
      amount: AlgoAmount.MicroAlgos(5000), // 5000 microAlgos as required by contract
      signer: signer
    });

    // Register user
    const registerResult = await appClient.send.register({
      args: {
        payTxn: paymentTxn,
        userAddress: algosdk.decodeAddress(deployer.addr.toString()).publicKey
      },
      sender: deployer.addr,
      staticFee:AlgoAmount.MicroAlgo(5000),
      signer: signer,
    });

    console.log('Registration successful, returned App ID:', registerResult.return);
    expect(registerResult.return).toBeDefined();

    // Verify user was registered in box storage
    const userAppId = await appClient.state.box.users.value(deployer.addr.toString());
    expect(userAppId).toBeDefined();
  });
});