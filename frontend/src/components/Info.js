import React from 'react';

const Info = () => {
  return (
    <div className="info-container">
      <h2>What is ZK Mixer?</h2>
      <p>
        ZK Mixer is a decentralized application (dApp) that allows you to enhance your financial privacy 
        on the Ethereum blockchain through the use of Zero-Knowledge Proofs (ZKPs).
      </p>

      <h3>How does it work?</h3>
      <div className="info-steps">
        <div className="info-step">
          <h4>1. Deposit</h4>
          <p>
            You deposit a fixed amount of ETH into the ZK Mixer smart contract.
            The system generates a cryptographic "commitment" using secret values that only you know.
            This commitment is stored in the contract without revealing your secrets.
          </p>
        </div>
        
        <div className="info-step">
          <h4>2. Secret Note</h4>
          <p>
            You receive a secret note containing the information needed to withdraw your deposit later.
            This note MUST be kept private and secure. If you lose it, you cannot recover your funds.
          </p>
        </div>
        
        <div className="info-step">
          <h4>3. Wait (optional)</h4>
          <p>
            For greater privacy, you can wait for other people to make deposits into the mixer.
            The more deposits there are, the larger the "anonymity set" and the better your privacy.
          </p>
        </div>
        
        <div className="info-step">
          <h4>4. Withdrawal</h4>
          <p>
            When you want to withdraw your funds, you use your secret note to generate a "zero-knowledge proof".
            This proof demonstrates that you know a valid commitment in the contract without revealing which one it is.
            The funds are sent to the address you specify, with no visible connection to your original deposit.
          </p>
        </div>
      </div>

      <h3>Privacy Technologies</h3>
      <div className="privacy-tech">
        <div className="tech-item">
          <h4>Zero-Knowledge Proofs (ZKP)</h4>
          <p>
            Zero-knowledge proofs allow you to prove you know a secret without revealing it.
            In ZK Mixer, you prove you have the right to withdraw funds without revealing which specific deposit you're withdrawing.
          </p>
        </div>
        
        <div className="tech-item">
          <h4>Merkle Trees</h4>
          <p>
            Deposits are organized in a data structure called a "Merkle Tree".
            This allows efficient verification that your commitment is included in the set of all deposits
            without revealing which one is yours.
          </p>
        </div>
        
        <div className="tech-item">
          <h4>Cryptographic Hash Functions</h4>
          <p>
            ZK Mixer uses advanced hash functions (like Poseidon) that are efficient for generating ZKPs.
            These functions ensure that commitments cannot be reversed to discover your secrets.
          </p>
        </div>
      </div>

      <h3>Security Considerations</h3>
      <ul className="security-list">
        <li>
          <strong>Keep your notes secure:</strong> Without your secret notes, you cannot withdraw your funds.
        </li>
        <li>
          <strong>Avoid connecting your deposits and withdrawals:</strong> Don't make a withdrawal immediately after a deposit.
        </li>
        <li>
          <strong>Use different addresses:</strong> To maximize privacy, use different addresses for depositing and withdrawing.
        </li>
        <li>
          <strong>Consider timing:</strong> Avoid predictable time patterns in your deposits and withdrawals.
        </li>
      </ul>

      <h3>Limitations</h3>
      <p>
        This is a basic implementation for educational and demonstration purposes.
        A real mixer would have additional features such as relayers, multiple denominations, 
        and advanced protections against various attack vectors.
      </p>
    </div>
  );
};

export default Info; 