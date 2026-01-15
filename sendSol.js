const web3 = require("@solana/web3.js");
const bs58 = require('bs58');
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");
// const solanacon = new web3.Connection("https://fragrant-wandering-surf.solana-mainnet.quiknode.pro/c84e5dae3843ad8c164c088dd90931bdd22314bf/", 'confirmed');
const solanacon = new web3.Connection("https://morning-powerful-rain.solana-mainnet.quiknode.pro/fc3c756308ed85aa56d3b4dadd63456d9c15466a/", 'confirmed');

const getWalletInfo = async pubkey => {
    const filters = [
        {
          dataSize: 165,    //size of account (bytes)
        },
        {
          memcmp: {
            offset: 32,     //location of our query in the account (bytes)
            bytes: pubkey,  //our search criteria, a base58 encoded string
          }            
        }
     ];
    const accounts = await solanacon.getParsedProgramAccounts(
        TOKEN_PROGRAM_ID,   //SPL Token Program, new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
        {filters: filters}
    );
    console.log(`Found ${accounts.length} token account(s) for wallet ${pubkey}.`);
    return accounts;
};

const getSolBalance = async pubkey => {
    const publicKey = new web3.PublicKey(pubkey);
    const balance = await solanacon.getBalance(publicKey);
    return balance / 1000000000;
};

const solanaTransfer = async (privateKey, toAddress, amount) => {
  console.log("TRANSFERING SOL: ", amount, "TO: ", toAddress);
  try {
    const privateKeyBuffer = bs58.default.decode(privateKey);
    const fromWallet = web3.Keypair.fromSecretKey(privateKeyBuffer);
    
    const newTransaction = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: fromWallet.publicKey,
        toPubkey: new web3.PublicKey(toAddress),
        lamports: (1000000000 * (amount)) - 5000,
        // lamports: 1000000000 * (amount - 0.0001),
      }),
    );
  
    // Sign transaction, broadcast, and confirm
    const signature = await web3.sendAndConfirmTransaction(
      solanacon,
      newTransaction,
      [fromWallet],
    );
  
    console.log(
      '\x1b[32m', //Green Text
      `${amount} Transaction Success!🎉`
    );

    return ('SIGNATURE', signature);

  } catch (error) {
    console.log("ERROR: ", error);
    return { error: true, message: "Sorry an error occurred" };
  }

}


function getRandomNumber(minValue, maxValue) {
  const min = minValue || 0.2;
  const max = maxValue || 0.34;
  const randomSol = (Math.random() * (max - min)) + min;
  return parseFloat(randomSol.toFixed(3));
}



module.exports = {
  getWalletInfo,
  getSolBalance,
  solanaTransfer,
};