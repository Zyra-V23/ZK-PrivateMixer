import React from 'react';
import '../App.css'; // Import general styles if needed
// Remove WalletConnect import if it's no longer needed here
// import WalletConnect from './WalletConnect'; 

const Header = ({ setActiveSection }) => {
  return (
    <header className="app-header">
      <div className="logo matrix-logo">ZYRA-V23</div>
      <nav>
        {/* Links to internal sections of the ZK Mixer app */}
        <a href="#" onClick={() => setActiveSection('mixer')}>Mixer</a>
        <a href="#" onClick={() => setActiveSection('notes')}>My Notes</a>
        <a href="#" onClick={() => setActiveSection('info')}>How it Works</a>
        {/* Add other relevant links if necessary */}
      </nav>
      {/* Remove WalletConnect component instance */}
      {/* <WalletConnect /> */}
      {/* Add a placeholder div if needed to maintain layout */}
      <div></div>
    </header>
  );
};

export default Header; 