import React from 'react';

const Info = () => {
  return (
    <div className="info-container">
      <h2>What is U-ZK Void?</h2>
      <p>
        U-ZK Void is a decentralized application (dApp) designed to obscure your transaction origins
        on the Ethereum blockchain. Using Zero-Knowledge Proofs (ZKPs),
        your funds enter the void, severing the link to their source before emerging elsewhere.
      </p>

      <h3>How does it work?</h3>
      <div className="info-steps">
        <div className="info-step">
          <h4>1. Deposit</h4>
          <p>
            You deposit a fixed amount of ETH into the U-ZK Void smart contract.
            The system generates a cryptographic <strong title="A unique hash derived from your secret values (nullifier and secret). It proves ownership without revealing the secrets.">commitment</strong> using secret values that only you know.
            This commitment is stored in the contract without revealing your secrets.
          </p>
        </div>
        
        <div className="info-step">
          <h4>2. Secret Note</h4>
          <p>
            You receive a secret note - your key to navigating the void. Guard it meticulously,
            for it contains the unique essence needed to reclaim your deposit.
            Lose the note, and the funds are lost to the abyss forever.
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
            This cryptographic whisper confirms your rightful claim to *a* deposit within the void, without revealing *which* one 
            (by proving knowledge of the secrets linked to the commitment and showing a unique <strong title="A value derived from your secret nullifier, proving this specific deposit hasn't been withdrawn before.">nullifier hash</strong>).
            The funds then materialize at the address you specify, their origins shrouded.
          </p>
        </div>
      </div>

      <h3>Privacy Technologies</h3>
      <div className="privacy-tech">
        <div className="tech-item">
          <h4>Zero-Knowledge Proofs (ZKP)</h4>
          <p>
            Zero-knowledge proofs allow you to prove you know a secret without revealing it.
            In U-ZK Void, you prove you have the right to withdraw funds without revealing which specific deposit you're withdrawing.
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
            U-ZK Void uses advanced hash functions (like Poseidon) that are efficient for generating ZKPs.
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
        A real implementation would have additional features such as relayers, multiple denominations,
        and advanced protections against various attack vectors.
      </p>
    </div>
  );
};

export default Info; 