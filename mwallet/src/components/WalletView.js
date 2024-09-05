import React, { useEffect, useState } from "react";
import {
  Divider,
  Tooltip,
  List,
  Avatar,
  Spin,
  Tabs,
  Input,
  Button,
  message,
} from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import logo from "../noImg.png";
import axios from "axios";
import { CHAINS_CONFIG } from "../chains";
import { Connection, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction, Keypair, TransactionMessage, VersionedTransaction, sendAndConfirmTransaction } from '@solana/web3.js';
import bs58 from "bs58";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSyncAlt } from "@fortawesome/free-solid-svg-icons";
import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { Modal } from "react-bootstrap";
import TwoFactorAuth from "./TwoFactorAuth";
// import speakeasy from "speakeasy"
// import base32 from "thirty-two";

function WalletView({
  wallet,
  setWallet,
  seedPhrase,
  setSeedPhrase,
  selectedChain,
  userId,
}) {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState(null);
  const [nfts, setNfts] = useState(null);
  const [balance, setBalance] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [amountToSend, setAmountToSend] = useState('1');
  const [sendToAddress, setSendToAddress] = useState('DFfmB7PUQ2xdCto5XgWHSkCZGPUDsLTjXG5hgp8RQj39');
  const [processing, setProcessing] = useState(false);
  const [hash, setHash] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null); // Store the QR code URL
  const [twoFaToken, setTwoFaToken] = useState(""); // Store the 2FA token input
  const [show2FA, setShow2FA] = useState(false); // Add missing state for 2FA


  const [expandedTransaction, setExpandedTransaction] = useState(null); // State to track the expanded transaction

  const transactionHistory = JSON.parse(localStorage.getItem(wallet)) || [];

  const handleItemClick = (index) => {
    setExpandedTransaction(expandedTransaction === index ? null : index);
  };


  const items = [
    {
      key: "0",
      label: `Tokens`,
      children: (
        <>
          {tokens ? (
            <>
              <List
                bordered
                itemLayout="horizontal"
                dataSource={tokens}
                renderItem={(item, index) => (
                  <List.Item style={{ textAlign: "left" }}>
                    <List.Item.Meta
                      avatar={<Avatar src={item.logo || logo} />}
                      title={item.symbol}
                      description={item.name}
                    />
                    <div>
                      {(
                        Number(item.balance) /
                        10 ** Number(item.decimals)
                      ).toFixed(2)}{" "}
                      Tokens
                    </div>
                  </List.Item>
                )}
              />
            </>
          ) : (
            <>
              <span>You seem to not have any tokens yet</span>

            </>
          )}
        </>
      ),
    },
    {
      key: "1",
      label: `NFTs`,
      children: (
        <>
          {nfts ? (
            <>
              {nfts.map((e, i) => {
                return (
                  <>
                    {e && (
                      <img
                        key={i}
                        className="nftImage"
                        alt="nftImage"
                        src={e}
                      />
                    )}
                  </>
                );
              })}
            </>
          ) : (
            <>
              <span>You seem to not have any NFTs yet</span>
            </>
          )}
        </>
      ),
    },
    {
      key: "2",
      label: `Transfer`,
      children: (
        <>
          <h3>Native Balance </h3>
          <h1>
            {balance} {"SOL"}
            <FontAwesomeIcon
              icon={faSyncAlt}
              style={{ marginLeft: "10px", cursor: "pointer", fontSize: "16px" }}
              onClick={getAccountTokens}
            />
          </h1>
          <div className="sendRow">
            <p style={{ width: "90px", textAlign: "left" }}> To:</p>
            <Input
              value={sendToAddress}
              onChange={(e) => setSendToAddress(e.target.value)}
              placeholder="0x..."
            />
          </div>
          <div className="sendRow">
            <p style={{ width: "90px", textAlign: "left" }}> Amount:</p>
            <Input
              value={amountToSend}
              onChange={(e) => setAmountToSend(e.target.value)}
              placeholder="Native tokens you wish to send..."
            />
          </div>
          <Button
            style={{ width: "100%", marginTop: "20px", marginBottom: "20px" }}
            type="primary"
            onClick={() => initiate2FA()}
            disabled={processing}
          >
            Send Tokens
          </Button>
          {show2FA && (
            <TwoFactorAuth
              onVerify={handle2FAVerification}
              processing={processing}
            />
          )}
          {processing && (
            <>
              <Spin />
              {hash && (
                <Tooltip title={hash}>
                  <p>Hover For Tx Hash</p>
                </Tooltip>
              )}
            </>
          )}
        </>
      ),
    },
    {
      key: "3",
      label: `History`,
      children: (
        <>
          {transactionHistory.length > 0 ? (
            <ul className="transaction-history-list">
              {transactionHistory.map((tx, index) => (
                <li key={index} className="transaction-history-item">
                  <div
                    onClick={() => handleItemClick(index)}
                    className="transaction-summary"
                  >
                    <span>
                      <FontAwesomeIcon
                        icon={tx.type == "Received" ? faArrowDown : faArrowUp}
                        className={tx.type == "Received" ? "received-icon" : "sent-icon"}
                      />
                    </span>
                    <span>{tx.amount} SOL</span>
                    <span>{tx.amount > 0 ? "Sent" : "Received"}</span>
                  </div>

                  {expandedTransaction === index && (
                    <div className="transaction-details-dropdown">
                      <p><strong>To Address:</strong> {tx.toAddress}</p>
                      <p><strong>Transaction Hash:</strong> {tx.signature}</p>
                      <p><strong>Date & Time:</strong> <br />{tx.dateTime}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No transaction history available.</p>
          )}
        </>
      ),
    },
    {
      key: "4",
      label: `2FA Setup`,
      children: (
        <>
          <Button onClick={generate2FA}>Generate 2FA QR Code</Button>
          {qrCodeUrl && (
            <>
              <h3>Scan this QR Code with Google Authenticator:</h3>
              <img src={qrCodeUrl} alt="2FA QR Code" />
            </>
          )}
        </>
      ),
    },
  ];

  async function generate2FA() {
    try {
      const response = await axios.post("http://localhost:3001/auth/generate-2fa", { userId });
      setQrCodeUrl(response.data.qrCodeUrl);
      console.log("2FA QR Code URL:", response.data.qrCodeUrl);
    } catch (error) {
      console.error("Error generating 2FA QR code:", error);
    }
  }

  async function initiate2FA() {
    setShow2FA(true);
  }

  async function handle2FAVerification(otp) {
    const payload = {
      userId: wallet,
      token: otp,
    };
    console.log("Sending 2FA verification payload:", payload);
  
    setProcessing(true);
  
    try {
      const res = await axios.post("http://localhost:3001/verify-2fa", payload);
      console.log("2FA verification response:", res.data);
  
      if (res.data.valid) {
        console.log("2FA verification successful");
        await sendTransaction(sendToAddress, amountToSend);
      } else {
        console.error("Invalid 2FA code");
        message.error("Invalid 2FA code. Please try again.");
      }
    } catch (error) {
      console.error("2FA verification failed:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
        message.error(`Verification failed: ${error.response.data.message}`);
      } else {
        message.error("Verification failed. Please try again.");
      }
    } finally {
      setProcessing(false);
      setShow2FA(false);
    }
  }


  async function sendTransaction(to, amount) {
    const chain = CHAINS_CONFIG[selectedChain];
    const connection = new Connection(chain.rpcUrl, "confirmed");
    const secretKeyString = localStorage.getItem("privatekey");
    const secretKey = bs58.decode(secretKeyString);
    const fromWallet = Keypair.fromSecretKey(secretKey);
    const toPublicKey = new PublicKey(to);
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromWallet.publicKey,
        toPubkey: toPublicKey,
        lamports: amount * LAMPORTS_PER_SOL,
      })
    )

    setProcessing(true);
    try {
      const signature = await sendAndConfirmTransaction(connection, transaction, [fromWallet]);

      setHash(signature);
      console.log("Transaction signature:", signature);

      function getCurrentDateTime() {
        const currentDateTime = new Date();
        const year = currentDateTime.getFullYear();
        const month = String(currentDateTime.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const day = String(currentDateTime.getDate()).padStart(2, '0');
        const hours = String(currentDateTime.getHours()).padStart(2, '0');
        const minutes = String(currentDateTime.getMinutes()).padStart(2, '0');
        const seconds = String(currentDateTime.getSeconds()).padStart(2, '0');
        const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        return formattedDateTime;
      }
      const transactionData = {
        amount: amountToSend,
        signature: signature,
        toAddress: sendToAddress,
        token: "SOL",
        type: "Sent",
        dateTime: getCurrentDateTime(),
      }
      const walletAddress = wallet;
      const existingTransactions = JSON.parse(localStorage.getItem(walletAddress)) || [];
      existingTransactions.push(transactionData);
      localStorage.setItem(walletAddress, JSON.stringify(existingTransactions));

      const { value: status } = await connection.getSignatureStatuses([signature]);
      const confirmedSignature = status[0];
      console.log(confirmedSignature);
      if (confirmedSignature.confirmationStatus === "confirmed") {
        setProcessing(false);
        setAmountToSend(null);
        setSendToAddress(null);
        setShow2FA(false);

        getAccountTokens();
      } else {
        console.log("Transaction failed to finalize");
      }
    } catch (err) {
      console.log("Transaction failed:", err);
      setHash(null);
      setProcessing(false);
      setAmountToSend(null);
      setSendToAddress(null);
      setShow2FA(false);
    }

  }

  async function getAccountTokens() {
    setFetching(true);
    console.log(wallet, selectedChain);
    const res = await axios.get(`http://localhost:3001/getTokens`, {
      params: {
        userAddress: wallet,
        network: selectedChain,
      },
    });

    const response = res.data;

    if (response.tokens.length > 0) {
      setTokens(response.tokens);
    }

    if (response.nfts.length > 0) {
      setNfts(response.nfts);
    }
    console.log(response.balance);
    setBalance(response.balance);

    setFetching(false);
  }

  function logout() {
    setSeedPhrase(null);
    setWallet(null);
    setNfts(null);
    setTokens(null);
    setBalance(0);
    navigate("/");
  }

  useEffect(() => {
    if (!wallet || !selectedChain) return;
    setNfts(null);
    setTokens(null);
    setBalance(0);
    getAccountTokens();
  }, []);

  useEffect(() => {
    if (!wallet) return;
    setNfts(null);
    setTokens(null);
    setBalance(0);
    getAccountTokens();
  }, [selectedChain]);

  return (
    <>
      <div className="content">
        <div className="logoutButton" onClick={logout}>
          <LogoutOutlined />
        </div>
        <div className="walletName">Wallet</div>
        <Tooltip title={wallet}>
          <div>
            {wallet.slice(0, 4)}...{wallet.slice(38)}
          </div>
        </Tooltip>
        <Divider />
        {fetching ? (
          <Spin />
        ) : (
          <Tabs defaultActiveKey="2" items={items} className="walletView" />
        )}
      </div>
    </>
  );
}

export default WalletView;
