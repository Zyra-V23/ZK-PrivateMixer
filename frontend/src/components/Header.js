import React from 'react';
import '../App.css'; // Import general styles if needed
// Remove WalletConnect import if it's no longer needed here
// import WalletConnect from './WalletConnect'; 

const Header = ({ setActiveSection }) => {
  return (
    <header className="app-header">
      <div className="logo matrix-logo">ZYRA-V23</div>
      <div className="logo void-logo">U-ZK VOID</div>
      <nav>
        {/* Links to internal sections of the ZK Mixer app */}
        {/* <a href="#" onClick={() => setActiveSection('mixer')}>Mixer</a> */}
        {/* <a href="#" onClick={() => setActiveSection('info')}>How it Works</a> */}
        <button className="nav-button" onClick={() => setActiveSection('mixer')}>Mixer</button>
        <button className="nav-button" onClick={() => setActiveSection('info')}>How it Works</button>
        {/* Add other relevant links if necessary */}
      </nav>
      {/* Remove WalletConnect component instance */}
      {/* <WalletConnect /> */}
    </header>
  );
};

export default Header; 