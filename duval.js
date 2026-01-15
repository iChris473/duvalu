const web3 = require("@solana/web3.js");
const bs58 = require('bs58');
const { PublicKey } = require('@solana/web3.js');
const { solanaTransfer, getSolBalance } = require('./sendSol');
const duvaluModel = require("./model/duvalu.model");

let PrivacyCashModule = null;

async function getPrivacyCash() {
  if (!PrivacyCashModule) {
    PrivacyCashModule = await import('privacycash');
  }
  return PrivacyCashModule.PrivacyCash;
}


async function solExample(client, recipientAddress, amount) {
    // deposit SOL
    let depositRes = await client.deposit({
        lamports: amount * 1_000_000_000
    })

    console.log(depositRes)

    let privateBalance = await client.getPrivateBalance()
    console.log('balance after deposit:', privateBalance, privateBalance.lamports / 1_000_000_000)

    // withdraw SOL
    let withdrawRes = await client.withdraw({
        lamports: amount * 1_000_000_000,
        recipientAddress
    })

    console.log(withdrawRes)

    privateBalance = await client.getPrivateBalance();

    console.log('balance after withdraw:', privateBalance, privateBalance.lamports / 1_000_000_000)
}


const rpcURL = "https://morning-powerful-rain.solana-mainnet.quiknode.pro/fc3c756308ed85aa56d3b4dadd63456d9c15466a";

async function privateSOLTransfer(recipientAddress, amount, depositPublicKey) {
    try {
        const depositWallet = await duvaluModel.findOne({ depositPublicKey });

        if(!depositWallet) return 404;

        const PrivacyCash = await getPrivacyCash();

        let client = new PrivacyCash({
            RPC_url: rpcURL, // [YOUR_SOLANA_MAINNET_RPC_URL]
            owner: depositWallet.depositPrivateKey // [SOLANA_PRIVATE_KEY]
        })
    
        // the recipient address used in withdrawal
        // let recipientAddress = '61SJqi22bshirmr5Q6X3N4Crhfu1XWgo6EU9bTgcCwfW' // [RECIPIENT_ADDRESS]
    
        // historical utxos will be cached locally for faster performance.
        // you don't need to call clearCache() unless you encountered some issues and want to do a full refresh.
        // client.clearCache()

        // GENERATE NEW WALLET
        // const privateKeyBuffer = bs58.default.decode("2Rb46Kw6GvKiw2ZzG1gidXPJTha12xDHfD9aePYyx8tu3ZgTYkyMdg9KDZiP7hJqsPXTX5Yf1e4oqxdEAft7FBJd");
        // const SolanaWallet = web3.Keypair.fromSecretKey(privateKeyBuffer);

        const SolanaWallet = web3.Keypair.generate();
        const privateKey = bs58.default.encode(SolanaWallet.secretKey);
        const publicKey = SolanaWallet.publicKey.toString();

        console.log("TEMPORARY PUBLIC KEY: ", publicKey);
        console.log("TEMPORARY PRIVATE KEY: ", privateKey);
    
        // TRANSFER SOL PRIVATELY TO NEW WALLET
        await solExample(client, publicKey, amount);

        // ADD 3 SECOND DELAY TO RECEIVE SOL ON NEW WALLET
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const solBalance = await getSolBalance(publicKey);

        // TRANSFER SOL TO RECIPIENT
        await solanaTransfer(privateKey, recipientAddress, solBalance);

        console.log("SOL TRANSFERRED SUCCESSFULLY");
    
        return 200;
        
    } catch (error) {
        return 400;
    }
}

async function duvaluTransfer(from) {
    try {
        const depositWallet = await duvaluModel.findOne({ depositPublicKey: from });
        
        if(!depositWallet) return 404;

        const solBalance = await getSolBalance(from);
        
        console.log("SOL BALANCE: ", solBalance);
        
        if(solBalance < parseFloat(depositWallet.totalSOL)) return { error: true, message: "Insufficient SOL balance" };

        const wallets = JSON.parse(depositWallet.wallets);
        
        for(const wallet of wallets){
            await privateSOLTransfer(wallet.recipient, wallet.amount, depositWallet.depositPublicKey);
        }
        return { error: false, message: "SOL transferred successfully" };
    } catch (error) {
        console.error('Error transferring SOL privately:', error);
        return { error: true, message: "Sorry an error occurred" };
    }
}

async function addDuvaluWallets(wallets, totalSOL) {
    try {
        // GENERATE DEPOSIT WALLET
        const SolanaWallet = web3.Keypair.generate();
        const privateKey = bs58.default.encode(SolanaWallet.secretKey);
        const publicKey = SolanaWallet.publicKey.toString();
        await duvaluModel.create({
            depositPrivateKey: privateKey,
            depositPublicKey: publicKey,
            totalSOL: totalSOL.toString(),
            wallets: JSON.stringify(wallets)
        });
        return publicKey;
    } catch (error) {
        console.error('Error adding Duvalu wallets:', error);
        return null;
    }
}

module.exports = { privateSOLTransfer, addDuvaluWallets, duvaluTransfer };