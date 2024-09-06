const express = require("express");
const Moralis = require("moralis").default;
const speakeasy = require("speakeasy"); 
const qrcode = require("qrcode"); 
const cors = require("cors");
require("dotenv").config();
const port = 3001;

const app = express();
app.use(cors());
app.use(express.json());

const userSecrets = {};

app.post("/auth/generate-2fa", async (req, res) => {
  const { userId } = req.body;

  console.log(`Generating 2FA secret for user: ${userId}`);

  const secret = speakeasy.generateSecret({
    name: `SolanaWallet (${userId})`, 
  });

  userSecrets[userId] = secret;

  console.log(`2FA secret generated and stored for user: ${userId}`);

  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

  return res.status(200).json({ qrCodeUrl });
});

app.post("/verify-2fa", (req, res) => {
  const { userId, token } = req.body;

  console.log(`Verifying 2FA for user: ${userId}`);
  console.log(`Received token: ${token}`);

  const userSecret = userSecrets[userId];

  if (!userSecret) {
    console.log(`User ${userId} not enrolled in 2FA.`);
    return res
      .status(400)
      .json({ valid: false, message: "User not enrolled in 2FA." });
  }

  console.log(`User secret found for ${userId}`);

  try {
    const isValid = speakeasy.totp.verify({
      secret: userSecret.base32,
      encoding: 'base32',
      token: token,
      window: 1,
    });

    console.log(`2FA verification result for user ${userId}: ${isValid}`);

    if (isValid) {
      return res.status(200).json({ valid: true });
    } else {
      return res.status(400).json({ valid: false, message: "Invalid token." });
    }
  } catch (error) {
    console.error(`Error verifying 2FA token: ${error.message}`);
    return res.status(500).json({ valid: false, message: "Server error during verification." });
  }
});


app.get("/getTokens", async (req, res) => {
  const { userAddress, network } = req.query;

  const tokens = await Moralis.SolApi.account.getSPL({
    network: network,
    address: userAddress,
  });

  const balance = await Moralis.SolApi.account.getBalance({
    network: network,
    address: userAddress,
  });

  const jsonResponse = {
    tokens: tokens.raw,
    nfts: [],
    balance: balance.raw.solana,
  };

  return res.status(200).json(jsonResponse);
});

Moralis.start({
  apiKey: process.env.MORALIS_KEY,
}).then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
