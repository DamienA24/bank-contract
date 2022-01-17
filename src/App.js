import { useState, useEffect, useCallback } from "react";
import { ethers, utils } from "ethers";
import abi from "./contracts/Bank.json";

function App() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isBankerOwner, setIsBankerOwner] = useState(false);
  const [inputValue, setInputValue] = useState({
    withdraw: "",
    deposit: "",
    bankName: "",
    address: "",
    moneySent: "",
  });

  const [customerTotalBalance, setCustomerTotalBalance] = useState(null);
  const [bankOwnerAddress, setBankOwnerAddress] = useState(null);
  const [currentBankName, setCurrentBankName] = useState(null);
  const [customerAddress, setCustomerAddress] = useState(null);
  const [bankContract, setContract] = useState(null);
  const [error, setError] = useState(null);

  const contractAddress = "0x5B94Ca8e448e7dD17622D23A0afCb348DAad626C";
  const contractABI = abi.abi;

  const connectContract = useCallback(async () => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const bankContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      setContract(bankContract);
    } else {
      setError("No wallet metamask detected");
      console.log("No metamask detected");
    }
  }, [contractABI]);

  const checkIfWalletIsConnected = useCallback(async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const account = accounts[0];
        setIsWalletConnected(true);
        setCustomerAddress(account);
        console.log("Account connected: ", account);
        connectContract();
      } else {
        setError("No wallet metamask detected");
        console.log("No metamask detected");
      }
    } catch (error) {
      console.log(error);
    }
  }, [connectContract]);

  const getBankName = async () => {
    try {
      //your code here
      if (window.ethereum) {
        console.log(bankContract);
        let bankName = await bankContract.bankName();
        bankName = utils.parseBytes32String(bankName);
        setCurrentBankName(bankName);
      } else {
        setError("No wallet metamask detected");
        console.log("No metamask detected");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const setBankNameHandler = async (event) => {
    try {
      event.preventDefault();
      //your code here
      if (window.ethereum) {
        const txn = await bankContract.setBankName(
          utils.formatBytes32String(inputValue.bankName)
        );
        console.log("setting bank name");
        await txn.wait();
        setCurrentBankName(inputValue.bankName);
        console.log("bank name changed", txn.hash);
      } else {
        setError("No wallet metamask detected");
        console.log("No metamask detected");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getbankOwnerHandler = async () => {
    try {
      //your code here
      if (window.ethereum) {
        let owner = await bankContract.bankOwner();
        setBankOwnerAddress(owner);

        const [account] = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        if (owner.toLowerCase() === account.toLowerCase()) {
          setIsBankerOwner(true);
        }
      } else {
        setError("No wallet metamask detected");
        console.log("No metamask detected");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const customerBalanceHanlder = async () => {
    try {
      //your code here
      if (window.ethereum) {
        let balance = await bankContract.getCustomerBalance();
        console.log("retrieve balance...", balance);

        setCustomerTotalBalance(utils.formatEther(balance));
      } else {
        setError("No wallet metamask detected");
        console.log("No metamask detected");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const transferMoney = async (event) => {
    try {
      //your code here
      event.preventDefault();
      if (window.ethereum) {
        let txn = await bankContract.transferMoney(
          inputValue.address,
          utils.parseEther(inputValue.moneySent)
        );

        console.log("sending money...");
        await txn.wait();
        console.log("money sent...", txn.hash);
      } else {
        setError("No wallet metamask detected");
        console.log("No metamask detected");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleInputChange = (event) => {
    setInputValue((prevFormData) => ({
      ...prevFormData,
      [event.target.name]: event.target.value,
    }));
  };

  const deposityMoneyHandler = async (event) => {
    try {
      //your code here
      event.preventDefault();
      if (window.ethereum) {
        let txn = await bankContract.depositMoney({
          value: utils.parseEther(inputValue.deposit),
        });

        console.log("deposing money...");
        await txn.wait();
        console.log("deposing money done...", txn.hash);

        customerBalanceHanlder();
      } else {
        setError("No wallet metamask detected");
        console.log("No metamask detected");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const withDrawMoneyHandler = async (event) => {
    try {
      //your code here
      event.preventDefault();
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        let myAddress = await signer.getAddress();

        console.log("provider signer...", myAddress);

        const txn = await bankContract.withdrawMoney(
          myAddress,
          utils.parseEther(inputValue.withdraw)
        );

        console.log("Withdrawing money...");
        await txn.wait();
        console.log("Money with drew...done", txn.hash);

        customerBalanceHanlder();
      } else {
        setError("No wallet metamask detected");
        console.log("No metamask detected");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [checkIfWalletIsConnected]);

  useEffect(() => {
    if (bankContract) {
      console.log("pass");
      getBankName();
      getbankOwnerHandler();
      customerBalanceHanlder();
    }
  }, [bankContract]);

  useEffect(() => {
    const onNewTransfer = (money, newBalance, message) => {
      console.log(
        "NewTransfer",
        utils.formatEther(money),
        utils.formatEther(newBalance),
        message
      );

      console.log("newDeposit", utils.formatEther(newBalance));
      setCustomerTotalBalance(utils.formatEther(newBalance));
    };

    if (bankContract) {
      bankContract.on("MoneySent", onNewTransfer);
    }

    return () => {
      if (bankContract) {
        bankContract.off("MoneySent", onNewTransfer);
      }
    };
  }, [bankContract]);

  return (
    <main className="main-container">
      <h2 className="headline">
        <span className="headline-gradient">Bank Contract Project</span> 💰
      </h2>
      <section className="customer-section px-10 pt-5 pb-10">
        {error && <p className="text-2xl text-red-700">{error}</p>}
        <div className="mt-5">
          {currentBankName === "" && isBankerOwner ? (
            <p>"Setup the name of your bank." </p>
          ) : (
            <p className="text-3xl font-bold">{currentBankName}</p>
          )}
        </div>
        <div className="mt-7 mb-9">
          <form className="form-style">
            <input
              type="text"
              className="input-style"
              onChange={handleInputChange}
              name="deposit"
              placeholder="0.0000 ETH"
              value={inputValue.deposit}
            />
            <button className="btn-purple" onClick={deposityMoneyHandler}>
              Deposit Money In ETH
            </button>
          </form>
        </div>
        <div className="mt-10 mb-10">
          <form className="form-style">
            <input
              type="text"
              className="input-style"
              onChange={handleInputChange}
              name="withdraw"
              placeholder="0.0000 ETH"
              value={inputValue.withdraw}
            />
            <button className="btn-purple" onClick={withDrawMoneyHandler}>
              Withdraw Money In ETH
            </button>
          </form>
        </div>
        <div className="mt-10 mb-10">
          <form className="form-style">
            <input
              type="text"
              className="input-style"
              onChange={handleInputChange}
              name="address"
              placeholder="set address to send money"
              value={inputValue.address}
            />
            <input
              type="text"
              className="input-style"
              onChange={handleInputChange}
              name="moneySent"
              placeholder="0.0000 ETH"
              value={inputValue.moneySent}
            />
            <button className="btn-purple" onClick={transferMoney}>
              send Money to address In ETH
            </button>
          </form>
        </div>
        <div className="mt-5">
          <p>
            <span className="font-bold">Your Balance: </span>
            {customerTotalBalance}
          </p>
        </div>
        <div className="mt-5">
          <p>
            <span className="font-bold">Bank Owner Address: </span>
            {bankOwnerAddress}
          </p>
        </div>
        <div className="mt-5">
          {isWalletConnected && (
            <p>
              <span className="font-bold">Your Wallet Address: </span>
              {customerAddress}
            </p>
          )}
          <button className="btn-connect" onClick={checkIfWalletIsConnected}>
            {isWalletConnected ? "Wallet Connected 🔒" : "Connect Wallet 🔑"}
          </button>
        </div>
      </section>
      {isBankerOwner && (
        <section className="bank-owner-section">
          <h2 className="text-xl border-b-2 border-indigo-500 px-10 py-4 font-bold">
            Bank Admin Panel
          </h2>
          <div className="p-10">
            <form className="form-style">
              <input
                type="text"
                className="input-style"
                onChange={handleInputChange}
                name="bankName"
                placeholder="Enter a Name for Your Bank"
                value={inputValue.bankName}
              />
              <button
                className="btn-grey"
                onClick={(e) => setBankNameHandler(e)}
              >
                Set Bank Name
              </button>
            </form>
          </div>
        </section>
      )}
    </main>
  );
}
export default App;
