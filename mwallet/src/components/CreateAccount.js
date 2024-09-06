import React, { useState } from "react";
import { Button, Card,Input } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

function CreateAccount({ setWallet, setSeedPhrase }) {
  const [newSeedPhrase, setNewSeedPhrase] = useState(null);
  const navigate = useNavigate();
  const [password, setPassword] = useState("");

  function passAdjust(e) {
    setPassword(e.target.value);
  }

  function generateWallet() {
    const keypair = Keypair.generate();
    const secretKey = bs58.encode(keypair.secretKey);
    localStorage.setItem('privatekey', secretKey);
    setNewSeedPhrase(secretKey);

  }

  function setWalletAndMnemonic() {
    setSeedPhrase(newSeedPhrase);
    const keypair = Keypair.fromSecretKey(bs58.decode(newSeedPhrase));
    setWallet(keypair.publicKey.toString());
    localStorage.setItem(password,newSeedPhrase);
  }

  return (
    <>
      <div className="content">
        <div className="mnemonic">
          <ExclamationCircleOutlined style={{ fontSize: "20px" }} />
          <div>
            Once you set the password, a seedphrase will generate save it securely in order to
            recover your wallet in the future.
          </div>
        </div>
        <Input
          value={password}
          onChange={passAdjust}
          className="passwordContainer"
          placeholder="Enter New Password"
        />
        <Button
          className="frontPageButton"
          type="primary"
          onClick={() => generateWallet()}
        >
          Create Account
        </Button>
        <Card className="seedPhraseContainer">
          {newSeedPhrase && <pre style={{ whiteSpace: "pre-wrap" }}>{newSeedPhrase}</pre>}
        </Card>
        <Button
          className="frontPageButton"
          type="default"
          onClick={() => setWalletAndMnemonic()}
        >
          Open Your New Wallet
        </Button>
        <p className="frontPageBottom" onClick={() => navigate("/")}>
          Back Home
        </p>
      </div>
    </>
  );
}

export default CreateAccount;