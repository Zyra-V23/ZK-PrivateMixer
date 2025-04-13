import React from 'react';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-links">
          <ul>
            <li><a href="https://github.com/Zyra-V23/ZKUzumaki" target="_blank" rel="noopener noreferrer">Source Code</a></li>
            <li><a href="https://ethereum.org" target="_blank" rel="noopener noreferrer">Ethereum</a></li>
            <li><a href="https://github.com/iden3/circom" target="_blank" rel="noopener noreferrer">Circom</a></li>
            <li><a href="https://github.com/iden3/snarkjs" target="_blank" rel="noopener noreferrer">SnarkJS</a></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} U-ZK VOID</p>
      </div>
    </footer>
  );
};

export default Footer; 