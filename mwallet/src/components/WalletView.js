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
import { QRCodeCanvas } from "qrcode.react";
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  Keypair,
  TransactionMessage,
  VersionedTransaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSyncAlt } from "@fortawesome/free-solid-svg-icons";
import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";
import TwoFactorAuth from "./TwoFactorAuth";

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
  const [amountToSend, setAmountToSend] = useState("");
  const [sendToAddress, setSendToAddress] = useState("");
  const [processing, setProcessing] = useState(false);
  const [hash, setHash] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [TwoFaSetup, setTwoFaSetup] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [flag, setflag] = useState(false);

  const [expandedTransaction, setExpandedTransaction] = useState(null);

  const transactionHistory = JSON.parse(localStorage.getItem(wallet)) || [];

  //password part
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [storedPassword, setStoredPassword] = useState(
    localStorage.getItem("walletPassword") || ""
  );
  const [enteredPassword, setEnteredPassword] = useState("");

  const handleItemClick = (index) => {
    setExpandedTransaction(expandedTransaction === index ? null : index);
  };

  //password part
  const verifyPasswordAndSend = async () => {
    if (enteredPassword === storedPassword && flag) {
      await sendTransaction(sendToAddress, amountToSend);
    } else {
      message.error("Incorrect password or 2FA code");
    }
  };

  const savePassword = () => {
    if (password === confirmPassword) {
      localStorage.setItem("walletPassword", password);
      setStoredPassword(password);
      message.success("Password set successfully");
    } else {
      message.error("Passwords do not match");
    }
  };
  // password part complete

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
                        Number(item.amountRaw) /
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
    // {
    //   key: "1",
    //   label: `NFTs`,
    //   children: (
    //     <>
    //       {nfts ? (
    //         <>
    //           {nfts.map((e, i) => {
    //             return (
    //               <>
    //                 {e && (
    //                   <img
    //                     key={i}
    //                     className="nftImage"
    //                     alt="nftImage"
    //                     src={e}
    //                   />
    //                 )}
    //               </>
    //             );
    //           })}
    //         </>
    //       ) : (
    //         <>
    //           <span>You seem to not have any NFTs yet</span>
    //         </>
    //       )}
    //     </>
    //   ),
    // },
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
              style={{
                marginLeft: "10px",
                cursor: "pointer",
                fontSize: "16px",
              }}
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
            onClick={() => {
              if (TwoFaSetup) {
                initiate2FA();
              } else {
                message.error("First setup 2FA");
              }
            }}
            disabled={processing || !sendToAddress}
          >
            Send Tokens
          </Button>
          {show2FA && (
            <TwoFactorAuth
              onVerify={handle2FAVerification}
              processing={processing}
            />
          )}

          {/* password part */}
          <div className="sendRow">
            <p style={{ width: "90px", textAlign: "left" }}> PIN:</p>
            <Input.Password
              value={enteredPassword}
              onChange={(e) => setEnteredPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
          <Button
            style={{ width: "100%", marginTop: "20px" }}
            type="primary"
            onClick={verifyPasswordAndSend}
            disabled={processing || !sendToAddress}
          >
            Send Tokens
          </Button>
          {/* password part ends */}

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
      label: `Tokens Sent`,
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
                        className={
                          tx.type == "Received" ? "received-icon" : "sent-icon"
                        }
                      />
                      <p className="date-time">{tx.dateTime}</p>
                    </span>
                    <span>{tx.amount} SOL</span>
                    <span>{tx.amount > 0 ? "Sent" : "Received"}</span>
                  </div>

                  {expandedTransaction === index && (
                    <div className="transaction-details-dropdown">
                      <p>
                        <strong>To Address:</strong> {tx.toAddress}
                      </p>
                      <Tooltip
                        title={
                          <a
                          href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}

                            target="_blank"
                          >
                            View on Solana Explorer
                          </a>
                        }
                      >
                        <p>
                          <strong>Transaction Hash:</strong> {tx.signature}
                        </p>
                      </Tooltip>

                      <p>
                        <strong>Date & Time:</strong> <br />
                        {tx.dateTime}
                      </p>
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
      label: `Security`,
      children: (
        <>
          <span>Step 1:-</span>{" "}
          <Button onClick={generate2FA}>Generate 2FA QR Code</Button>
          {qrCodeUrl && (
            <>
              <h3>Scan this QR Code with Google Authenticator:</h3>
              <img src={qrCodeUrl} alt="2FA QR Code" />
            </>
          )}
          <>
            <h3>
              {" "}
              <span>Step 2:-</span> Set Transaction PIN
            </h3>
            <div className="passwordRow">
              <p style={{ width: "150px", textAlign: "left" }}>PIN:</p>
              <Input.Password
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set a new password"
              />
            </div>
            <div className="passwordRow">
              <p style={{ width: "150px", textAlign: "left" }}>
                Confirm PIN:
              </p>
              <Input.Password
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
              />
            </div>
            <Button
              style={{ width: "100%", marginTop: "20px" }}
              type="primary"
              onClick={savePassword}
              disabled={!password || password !== confirmPassword}
            >
              Set Password
            </Button>
          </>
        </>
      ),
    },
    // {
    //   key: "5",
    //   label: `Set Password`,
    //   children: (

    //   ),
    // },
  ];

  async function generate2FA() {
    try {
      const response = await axios.post(
        "http://localhost:3001/auth/generate-2fa",
        { userId: wallet }
      );
      setQrCodeUrl(response.data.qrCodeUrl);
      setTwoFaSetup(true);
      console.log("2FA QR Code URL:", response.data.qrCodeUrl);
    } catch (error) {
      console.error("Error generating 2FA QR code:", error);
    }
  }

  async function initiate2FA() {
    setShow2FA(true);
    setTwoFaSetup(true);
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
        message.success("2FA verification successful, Now Enter Password");
        setflag(true);
        await verifyPasswordAndSend;
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
    );

    setProcessing(true);
    try {
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [fromWallet]
      );

      setHash(signature);
      console.log("Transaction signature:", signature);

      function getCurrentDateTime() {
        const currentDateTime = new Date();
        const year = currentDateTime.getFullYear();
        const month = String(currentDateTime.getMonth() + 1).padStart(2, "0"); // Months are zero-based
        const day = String(currentDateTime.getDate()).padStart(2, "0");
        const hours = String(currentDateTime.getHours()).padStart(2, "0");
        const minutes = String(currentDateTime.getMinutes()).padStart(2, "0");
        const seconds = String(currentDateTime.getSeconds()).padStart(2, "0");
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
      };
      const walletAddress = wallet;
      const existingTransactions =
        JSON.parse(localStorage.getItem(walletAddress)) || [];
      existingTransactions.push(transactionData);
      localStorage.setItem(walletAddress, JSON.stringify(existingTransactions));

      const { value: status } = await connection.getSignatureStatuses([
        signature,
      ]);
      const confirmedSignature = status[0];
      console.log(confirmedSignature);
      if (confirmedSignature.confirmationStatus === "confirmed") {
        message.success("Transaction Sent Successfully!");
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
        <Tooltip
        className="tools"
          title={
            <div>
              <div>Wallet QR code: </div>
              <QRCodeCanvas value={wallet} size={128} className="qrcode" />
              <div>Wallet: {wallet}</div>
              <div>Network: {selectedChain}</div>
              
            </div>
          }
        >
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
