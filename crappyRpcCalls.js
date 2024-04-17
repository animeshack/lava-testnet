
const { Web3 } = require('web3');
const axios = require('axios');

// RPC endpoint URL
const rpcEndpoint = 'https://eth1.lava.build/lava-referer-9c9fb9f7-8c96-42bc-bef1-2325cea50f1c/';

// Your Wallet address
const walletAddress = '0x922D12Bc61F2c35D6B43cC9908Cc20635272f1d0';

// Contract address and ABI - use any contract address.  This one is for DAI
const contractAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
const contractABI = [
    {
        "constant": true,
        "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];

// JSON-RPC payloads for different methods - more will be added later
const payloads = [
    { method: 'eth_chainId', params: [], id: 1 },
    { method: 'eth_protocolVersion', params: [], id: 2 },
    { method: 'net_version', params: [], id: 3 },
    { method: 'eth_getBlockByNumber', params: ['latest', true], id: 4 },
    { method: 'eth_getLogs', params: [{ fromBlock: 'latest', toBlock: 'latest', address: walletAddress }], id: 5 },
    // in case you are wondering - this is Cream hack transaction hash
    { method: 'eth_getTransactionReceipt', params: ['0x0fe2542079644e107cbf13690eb9c2c65963ccb79089ff96bfaf8dced2331c92'], id: 6 },
];

async function main() {
    const web3 = new Web3(rpcEndpoint);
    const tokenContract = new web3.eth.Contract(contractABI, contractAddress);

    try {
        // Execute all async tasks concurrently
        const [ethBalance, transactionCount, gasPrice, blockNumber, chainId, syncingStatus] = await Promise.all([
            getEthBalance(web3, walletAddress),
            getTransactionCount(web3, walletAddress, 'latest'),
            getGasPrice(web3),
            getBlockNumber(web3),
            getChainId(web3),
            getSyncingStatus(web3)
        ]);

        console.log(`Eth Balance: ${ethBalance}`);
        console.log(`Transaction Count: ${transactionCount}`);
        console.log(`Gas Price: ${gasPrice}`);
        console.log(`Block Number: ${blockNumber}`);
        console.log(`Chain ID: ${chainId}`);
        console.log(`Syncing Status: ${syncingStatus}`);
        
        const tokenBalance = await getTokenBalance(tokenContract, walletAddress);
        const tokenName = await getTokenName(tokenContract);
        console.log(`The Token balance of ${walletAddress} is ${tokenBalance} ${tokenName}`);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function initializeConnection() {
    try {
        // Send HTTP POST requests for each payload concurrently
        const responses = await Promise.all(payloads.map(payload => axios.post(rpcEndpoint, payload)));

        responses.forEach((response, index) => {
            const method = payloads[index].method;
            console.log(`Response from ${method}:`);
            
            if (response.data.result) {
                console.log(response.data.result);
            } else {
                console.log('No data found in the response.');
            }
        });
    } catch (error) {
        console.error('Error initializing connection:', error.message);
    }
}

async function getTokenName(contract) {
    const tokenName = await contract.methods.name().call();
    return tokenName;
}

async function getTokenBalance(contract, address) {
    const balance = await contract.methods.balanceOf(address).call();
    return balance;
}

async function getEthBalance(web3, address) {
    const balance = await web3.eth.getBalance(address);
    return web3.utils.fromWei(balance, 'ether');
}

async function getTransactionCount(web3, address, blockNumber) {
    const count = await web3.eth.getTransactionCount(address, blockNumber);
    return count;
}

async function getGasPrice(web3) {
    const gasPrice = await web3.eth.getGasPrice();
    return web3.utils.fromWei(gasPrice, 'gwei');
}

async function getBlockNumber(web3) {
    return await web3.eth.getBlockNumber();
}

async function getChainId(web3) {
    return await web3.eth.getChainId();
}

async function getSyncingStatus(web3) {
    return await web3.eth.isSyncing();
}

async function mainAndConnection() {
    await main();
    await initializeConnection();

    // run main and initializeConnection every 5 seconds.
    setInterval(async () => {
        await main();
        await initializeConnection();
    }, 5000); // Change it to whatever you like. Na you sabi
}

// Call mainAndConnection 
mainAndConnection();
