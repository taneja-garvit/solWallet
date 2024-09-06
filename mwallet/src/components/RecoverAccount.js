import React, { useState } from "react";
import { BulbOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";
import { useNavigate } from "react-router-dom";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";


function RecoverAccount({ setWallet, setSeedPhrase }) {
  const navigate = useNavigate();
  const [typedSeed, setTypedSeed] = useState("");
  const [nonValid, setNonValid] = useState(false);
  const [blankPassword, setBlankPassword] = useState(false);
  const { TextArea } = Input;
  const [password, setPassword] = useState("");

  function seedAdjust(e) {
    setNonValid(false);
    setTypedSeed(e.target.value);
  }
  function passAdjust(e) {
    setBlankPassword(false);
    setPassword(e.target.value);
  }

  function recoverWallet() {
    let recoveredWallet;
    if (password != "") {
      try {
        const secretKey = bs58.decode(typedSeed.trim());
        recoveredWallet = Keypair.fromSecretKey(secretKey);
      } catch (err) {
        setNonValid(true);
        return;
      }
      localStorage.setItem(password,typedSeed.trim());
      setSeedPhrase(typedSeed);
      setWallet(recoveredWallet.publicKey.toString());
      navigate("/yourwallet");
      return;
    }else{
      setBlankPassword(true);
    }
  }

  return (
    <>
      <div className="content">
        <div className="mnemonic">
          <BulbOutlined style={{ fontSize: "20px" }} />
          <div>
            Paste your base58 encoded secret key in the field below to recover your wallet.
          </div>
        </div>
        <Input
          value={password}
          onChange={passAdjust}
          className="passwordContainer"
          placeholder="Enter New Password"
        />
        <TextArea
          value={typedSeed}
          onChange={seedAdjust}
          rows={4}
          className="seedPhraseContainer"
          placeholder="Paste your secret key here..."
        />
        <Button
          disabled={typedSeed.trim().length === 0}
          className="frontPageButton"
          type="primary"
          onClick={() => recoverWallet()}
        >
          Recover Wallet
        </Button>
        {nonValid && <p style={{ color: "red" }}>Invalid Secret Key</p>}
        {blankPassword && <p style={{ color: "red" }}>Enter Password</p>}
        <p className="frontPageBottom" onClick={() => navigate("/")}>
          <span>Back Home</span>
        </p>
      </div>
    </>
  );
}

export default RecoverAccount;