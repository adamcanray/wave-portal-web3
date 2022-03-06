import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/WavePortal.json";

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [message, setMessage] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [isMining, setIsMining] = useState(false);
  const [totalWaves, setTotalWaves] = useState(0);
  const [isTotalWavesRequest, setIsTotalWavesRequest] = useState(false);
  const [isListWavesRequest, setIsListWavesRequest] = useState(false);

  /**
   * Create a variable here that holds the contract address after you deploy!
   */
  const contractAddress = process.env.CONTRACT_ADDRESS;

  /**
   * Create a variable here that references the abi content!
   */
  const contractABI = abi.abi;
  
/**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

/*
   * Create a method that gets all waves from your contract
   */
  const getAllWaves = async () => {
      const { ethereum } = window;
    try {
      if (ethereum) {
setIsListWavesRequest(true)
        
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();


        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);
setIsListWavesRequest(false)    
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }
  
  const wave = async (e) => {
    try {
      e.preventDefault()
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        // let count = await wavePortalContract.getTotalWaves();
        // console.log("Retrieved total wave count...", count.toNumber());

        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000 });
        console.log("Mining...", waveTxn.hash);
        setIsMining(true)

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        setIsMining(false)
        setMessage("")
        
        setIsTotalWavesRequest(true)
        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        setTotalWaves(count.toNumber())
        setIsTotalWavesRequest(false)

        // getAllWaves();
        
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
      console.log(error.response);
    }
}
  
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
    /*
    * First make sure we have access to window.ethereum
    */
      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);


        /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        
        setIsTotalWavesRequest(true)
        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        setTotalWaves(count.toNumber())
        setIsTotalWavesRequest(false)
        
        getAllWaves();
      } else {
        console.log("No authorized account found")
      }
        
        
      }
    } catch (error) {
      console.log(error);
    }
  }

  /*
  * This runs our function when the page loads.
  */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])
  /**
 * Listen in for emitter events!
 */
useEffect(() => {
  let wavePortalContract;

  const onNewWave = (from, timestamp, message) => {
    console.log("NewWave", from, timestamp, message);
    setAllWaves(prevState => [
      ...prevState,
      {
        address: from,
        timestamp: new Date(timestamp * 1000),
        message: message,
      },
    ]);
  };

  if (window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
    wavePortalContract.on("NewWave", onNewWave);
  }

  return () => {
    if (wavePortalContract) {
      wavePortalContract.off("NewWave", onNewWave);
    }
  };
}, []);

  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        👋 Hey there! Total Waves: {isTotalWavesRequest ? '...' : totalWaves}
        </div>

        <div className="bio">
        I am Adam, Connect your Ethereum wallet and wave at me!
        </div>

        <form className="formWave" onSubmit={wave}>
            <textarea className="messageInput" type="text" required value={message} onChange={e => setMessage(e.target.value)} />

          <button type="submit" className="waveButton" disabled={isMining}>
            {isMining ? 'Loading....' : 'Wave at Me'}
          </button>

        {/*
          * If there is no currentAccount render this button
          */}
          {!currentAccount && (
            <button type="button" className="waveButton" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
        </form>

        {isListWavesRequest && (
        <div style={{ marginTop: "16px", padding: "8px" }}>Loading...</div>
  
        )}
        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "6px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
        
      </div>
    </div>
  );
}
