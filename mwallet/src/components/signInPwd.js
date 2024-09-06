import React, { useState } from "react";
import { BulbOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";
import { useNavigate } from "react-router-dom";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

function SignInPwd({ setWallet, setSeedPhrase }) {
    const navigate = useNavigate();
    const [typedSeed, setTypedSeed] = useState("");
    const [nonValid, setNonValid] = useState(false);

    function seedAdjust(e) {
        setNonValid(false);
        setTypedSeed(e.target.value);
    }

    function recoverWallet() {
        let recoveredWallet;
        try {
            const pass = localStorage.getItem(typedSeed.trim());
            if(pass!=null){
                const secretKey = bs58.decode(pass);
                recoveredWallet = Keypair.fromSecretKey(secretKey);
            }
            else{
                setNonValid(true);
                return;
            }
        } catch (err) {
            setNonValid(true);
            return;
        }
        setSeedPhrase(typedSeed);
        setWallet(recoveredWallet.publicKey.toString());
        navigate("/yourwallet");
        return;
    }

    return (
        <>
            <div className="content">
                <div className="mnemonic">
                    <BulbOutlined style={{ fontSize: "20px" }} />
                    <div>
                        Enter your password
                    </div>
                </div>
                <Input
                    value={typedSeed}
                    onChange={seedAdjust}
                    className="passwordContainer"
                    placeholder="Enter Password"
                />
                <Button
                    disabled={typedSeed.trim().length === 0}
                    className="frontPageButton"
                    type="primary"
                    onClick={() => recoverWallet()}
                >
                    Sign In
                </Button>
                {nonValid && <p style={{ color: "red" }}>Invalid Password</p>}
                <p className="frontPageBottom" onClick={() => navigate("/")}>
                    <span>Back Home</span>
                </p>
            </div>
        </>
    );
}

export default SignInPwd;
