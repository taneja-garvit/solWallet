import React, { useState } from "react";
import { Input, Button } from "antd";

function TwoFactorAuth({ onVerify, processing}) {
  const [otp, setotp] = useState("");

  const handleVerify = () => {
    onVerify(otp);
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <Input
        placeholder="Enter 2FA Code"
        value={otp}
        onChange={(e) => setotp(e.target.value)}
      />
      <Button
        type="primary"
        onClick={() => {
          handleVerify();
        }}
        disabled={processing || !otp}
        style={{ marginTop: "10px", width: "100%" }}
      >
        Verify & Send
      </Button>
    </div>
  );
}

export default TwoFactorAuth;
