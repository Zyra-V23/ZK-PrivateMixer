import React from "react";
import { BedrockPassportProvider, LoginPanel } from "@bedrock_org/passport";
import "@bedrock_org/passport/dist/style.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthCallback from "./pages/auth/callback";

function App() {
  return (
    <BedrockPassportProvider
      baseUrl="https://api.bedrockpassport.com"
      authCallbackUrl="https://d26f-37-223-119-63.ngrok-free.app/auth/callback"
      tenantId="orange-dkuf82g6pr"
    >
      <Router>
        <Routes>
          <Route path="/" element={<LoginPanel />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </Router>
    </BedrockPassportProvider>
  );
}

export default App;
