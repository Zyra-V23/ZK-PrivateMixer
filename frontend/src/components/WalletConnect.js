import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';

const WalletConnect = () => {
  const { account, isConnected, isConnecting, connectWallet, disconnectWallet } = useWeb3();

  // Format address for display
  const formatAccount = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="wallet-connect">
      {isConnected ? (
        <div className="wallet-info">
          <span className="account-address">
            {formatAccount(account)}
          </span>
          <button 
            className="disconnect-button"
            onClick={disconnectWallet}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button 
          className="connect-button"
          onClick={connectWallet}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  );
};

export default WalletConnect; 