import React, { createContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import Web3Modal from 'web3modal';

// Create context
export const Web3Context = createContext();

// Context provider
export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [web3Modal, setWeb3Modal] = useState(null);

  // Initialize Web3Modal
  useEffect(() => {
    const providerOptions = {
      // Add provider options if needed
    };

    const newWeb3Modal = new Web3Modal({
      cacheProvider: true,
      providerOptions,
      theme: "dark",
    });

    setWeb3Modal(newWeb3Modal);
  }, []);

  // Define handlers first, then the functions that depend on them

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      if (web3Modal) {
        web3Modal.clearCachedProvider();
      }
      setProvider(null);
      setSigner(null);
      setAccount(null);
      setChainId(null);
      setIsConnected(false);
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  }, [web3Modal]);

  // Handle account change
  const handleAccountsChanged = useCallback((accounts) => {
    if (accounts.length === 0) {
      // MetaMask is locked or user has no accounts
      disconnectWallet();
    } else {
      setAccount(accounts[0]);
    }
  }, [disconnectWallet]); // Depends on disconnectWallet

  // Handle network change
  const handleChainChanged = useCallback((chainIdHex) => {
    // Force page reload per MetaMask recommendation
    window.location.reload();
  }, []); // No dependencies needed here

  // Handle disconnection
  const handleDisconnect = useCallback(() => {
    disconnectWallet();
  }, [disconnectWallet]); // Depends on disconnectWallet

  // Connect to wallet
  const connectWallet = useCallback(async () => {
    // Ensure web3Modal is initialized before connecting
    if (!web3Modal) {
        console.error("Web3Modal not initialized yet");
        return;
    }
    try {
      setIsConnecting(true);

      // Check if MetaMask is installed
      const ethereumProvider = await detectEthereumProvider();
      
      if (!ethereumProvider) {
        alert("Please install MetaMask to use this application");
        setIsConnecting(false);
        return;
      }

      // Connect using Web3Modal
      const instance = await web3Modal.connect();
      const ethersProvider = new ethers.providers.Web3Provider(instance);
      const signerInstance = ethersProvider.getSigner();
      const accounts = await ethersProvider.listAccounts();
      const network = await ethersProvider.getNetwork();

      setProvider(ethersProvider);
      setSigner(signerInstance);
      setAccount(accounts[0]);
      setChainId(network.chainId);
      setIsConnected(true);

      // Subscribe to events
      instance.on("accountsChanged", handleAccountsChanged);
      instance.on("chainChanged", handleChainChanged);
      instance.on("disconnect", handleDisconnect);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  }, [web3Modal, handleAccountsChanged, handleChainChanged, handleDisconnect]);

  // Auto-connect if there's a cached provider
  useEffect(() => {
    if (web3Modal && web3Modal.cachedProvider) {
      connectWallet();
    }
  }, [web3Modal, connectWallet]);

  // Export context values and functions
  const contextValue = {
    provider,
    signer,
    account,
    chainId,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet
  };

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};

// Custom hook for easier context usage
export const useWeb3 = () => {
  const context = React.useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}; 