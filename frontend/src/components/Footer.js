import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>ZK Mixer</h4>
          <p>A demonstration application for preserving privacy on blockchain using zero-knowledge proofs.</p>
        </div>
        
        <div className="footer-section">
          <h4>Warning</h4>
          <p>This is a demonstration application. Do not use significant real funds in this implementation.</p>
        </div>
        
        <div className="footer-section">
          <h4>Links</h4>
          <ul>
            <li><a href="https://github.com/" target="_blank" rel="noopener noreferrer">Source Code</a></li>
            <li><a href="https://ethereum.org" target="_blank" rel="noopener noreferrer">Ethereum</a></li>
            <li><a href="https://github.com/iden3/circom" target="_blank" rel="noopener noreferrer">Circom</a></li>
            <li><a href="https://github.com/iden3/snarkjs" target="_blank" rel="noopener noreferrer">SnarkJS</a></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} ZK Mixer - Demonstration Prototype</p>
      </div>
    </footer>
  );
};

export default Footer; 