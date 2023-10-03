import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

const contractAddress = "0xF26d7E2f9288aB3941B7702Dd2e2F93D15aBe434";
const contractABI = [{"anonymous": false, "inputs": [{"indexed": true, "name": "sender", "type": "address"}, {"indexed": true, "name": "receiver", "type": "address"}, {"indexed": false, "name": "value", "type": "uint256"}], "name": "Transfer", "type": "event"}, {"inputs": [{"name": "name", "type": "string"}, {"name": "symbol", "type": "string"}, {"name": "total_supply", "type": "uint256"}, {"name": "dummy", "type": "string"}], "outputs": [], "stateMutability": "nonpayable", "type": "constructor", "name": "constructor"}, {"inputs": [{"name": "receiver", "type": "address"}, {"name": "val", "type": "uint256"}], "name": "transfer", "outputs": [{"name": "", "type": "bool"}], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"name": "str", "type": "string"}], "name": "external_func", "outputs": [{"name": "", "type": "string"}], "stateMutability": "view", "type": "function"}, {"inputs": [], "name": "name", "outputs": [{"name": "", "type": "string"}], "stateMutability": "view", "type": "function"}, {"inputs": [], "name": "symbol", "outputs": [{"name": "", "type": "string"}], "stateMutability": "view", "type": "function"}, {"inputs": [], "name": "totalSupply", "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"name": "arg0", "type": "address"}], "name": "balances", "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}]

let signerAccount;
let contract;

window.onload = init;
document.getElementById('connectButton').addEventListener('click', ConnectWithMetamask);
document.getElementById('sendButton').addEventListener('click', sendToken);

async function init() {
    if (typeof window.ethereum === "undefined") {
        // MetaMask未インストール時の処理
        handleMetaMaskNotInstalled();
    } else {
        // 接続済アカウントを取得
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (accounts.length === 0 || chainId !== "0xaa36a7") {
            // アカウント提供未許可 or NWが異なる場合の処理
            handleAccountNotConnected();
        } else {
            // アカウント提供許可 and NWが正しい場合の処理
            handleAccountConnected();
        }
    }
}

function handleMetaMaskNotInstalled() {
    document.getElementById("isNotInstalled").style.display = "block";
    document.getElementById("isNotConnected").style.display = "none";
    document.getElementById("isConnected").style.display = "none";
}

function handleAccountNotConnected() {
    document.getElementById("isNotInstalled").style.display = "none";
    document.getElementById("isNotConnected").style.display = "block";
    document.getElementById("isConnected").style.display = "none";
}

async function handleAccountConnected() {
    document.getElementById("isNotInstalled").style.display = "none";
    document.getElementById("isNotConnected").style.display = "none";
    document.getElementById("isConnected").style.display = "block";

    window.ethereum.on('accountsChanged', () => window.location.reload());
    window.ethereum.on('chainChanged', () => window.location.reload());

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    signerAccount = await signer.getAddress();
    document.getElementById("signerAccount").innerText = signerAccount;

    contract = new ethers.Contract(contractAddress, contractABI, signer);

    displayBalance();

    listenForTransfer();
}

async function ConnectWithMetamask() {
    // アカウントの接続承認
    await window.ethereum.request({ method: "eth_requestAccounts" })
    // NW切り替え
    await switchNetwork();
    // 表示エリアの切り替え
    handleAccountConnected();
}

async function switchNetwork() {
    try {
        await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [
                {
                    "chainId": "0xaa36a7",
                }
            ],
        });
    } catch (error) {
        if (error.code === 4902) {
            await ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                    {
                        "chainName": "Sepolia",
                        "rpcUrls": ["https://rpc.sepolia.org"],
                        "chainId": "0xaa36a7",
                        "blockExplorerUrls": ["https://sepolia.etherscan.io/"],
                    }
                ],
            });
        } else {
            throw new Error
        }
    }
}

async function displayBalance() {
    const balance = await contract.balances(signerAccount);
    document.getElementById("balance").innerText = balance;
}

async function sendToken() {
    const sendButton = document.getElementById("sendButton");
    const buttonText = document.getElementById("buttonText");
    const spinner = document.getElementById("spinner");

    sendButton.disabled = true;
    buttonText.textContent = "送信中...";
    spinner.style.display = "inline-block";

    const value = document.getElementById("valueToSend").value;
    const receiver = document.getElementById("receiverAccount").value;

    try {
        const tx = await contract.transfer(receiver, value);   
        await tx.wait(); 
        displayBalance();
        balanceAnimation();
    } catch (error) {
        console.error(error);
        alert("送信エラー")
    } finally {
        sendButton.disabled = false;
        buttonText.textContent = "DTKを送る";
        spinner.style.display = "none";
    }
}

function listenForTransfer() {
    contract.on("Transfer", (sender, receiver, value, event) => {
        if (receiver === signerAccount) {
            displayBalance();
            balanceAnimation();
        }
    });
}

function balanceAnimation() {
    const element = document.getElementById("changeAnimation");
    element.classList.add('animate__animated', 'animate__bounce');

    // アニメーションが終了したらクラスを削除
    element.addEventListener('animationend', () => {
        element.classList.remove('animate__animated', 'animate__bounce');
    });
}