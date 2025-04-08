import React, { createContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './Web3Context';

// Future import of ZK Mixer contract ABI
// import ZKMixerABI from '../abis/ZKMixer.json';

// Create context
export const MixerContext = createContext();

// Context provider
export const MixerProvider = ({ children }) => {
  const { provider, signer, account, isConnected } = useWeb3();
  const [mixerContract, setMixerContract] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [commitments, setCommitments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [denomination, setDenomination] = useState('0.1');
  
  // Contract address - change based on network
  // Note: This will be updated with the actual deployed contract address
  const MIXER_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

  // Initialize contract when signer is available
  useEffect(() => {
    if (signer && isConnected) {
      try {
        // Commented until we have the actual ABI
        // const contract = new ethers.Contract(MIXER_CONTRACT_ADDRESS, ZKMixerABI.abi, signer);
        // setMixerContract(contract);
        
        // Load data from localStorage
        loadStoredNotes();
      } catch (error) {
        console.error("Error initializing contract:", error);
      }
    }
  }, [signer, isConnected]);

  // Load locally stored notes
  const loadStoredNotes = useCallback(() => {
    if (account) {
      try {
        const storedNotes = localStorage.getItem(`zk-mixer-notes-${account}`);
        if (storedNotes) {
          setNotes(JSON.parse(storedNotes));
        }
      } catch (error) {
        console.error("Error loading notes:", error);
      }
    }
  }, [account]);

  // Store notes locally
  const storeNotes = useCallback((updatedNotes) => {
    if (account) {
      try {
        localStorage.setItem(`zk-mixer-notes-${account}`, JSON.stringify(updatedNotes));
      } catch (error) {
        console.error("Error storing notes:", error);
      }
    }
  }, [account]);

  // Generate a commitment (simulated for now)
  const generateCommitment = useCallback(() => {
    // In a real implementation, this would use the circomlibjs library
    // to generate a commitment using Poseidon hash
    const randomSecret = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    const randomNullifier = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    
    // Simulate a commitment hash (in production would be a Poseidon hash)
    const commitment = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['bytes32', 'bytes32'],
        [randomSecret, randomNullifier]
      )
    );
    
    return {
      secret: randomSecret,
      nullifier: randomNullifier,
      commitment
    };
  }, []);

  // Make a deposit
  const deposit = useCallback(async () => {
    if (!mixerContract || !signer) {
      alert("Contract not initialized or wallet not connected");
      return;
    }

    try {
      setIsLoading(true);
      
      // Generate commitment
      const { secret, nullifier, commitment } = generateCommitment();
      
      // In a real implementation:
      // const tx = await mixerContract.deposit(commitment, {
      //   value: ethers.utils.parseEther(denomination)
      // });
      // await tx.wait();
      
      // Simulate successful transaction
      console.log("Simulating deposit with:", { commitment, value: denomination });
      
      // Save note
      const newNote = {
        id: Date.now(),
        secret,
        nullifier,
        commitment,
        denomination,
        timestamp: Date.now(),
        status: 'deposited'
      };
      
      const updatedNotes = [...notes, newNote];
      setNotes(updatedNotes);
      storeNotes(updatedNotes);
      
      return newNote;
    } catch (error) {
      console.error("Error making deposit:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [mixerContract, signer, denomination, generateCommitment, notes, storeNotes]);

  // Make a withdrawal (simulated for now)
  const withdraw = useCallback(async (noteId, recipient) => {
    if (!mixerContract || !signer) {
      alert("Contract not initialized or wallet not connected");
      return;
    }

    try {
      setIsLoading(true);
      
      // Find the note
      const note = notes.find(n => n.id === noteId);
      if (!note) {
        throw new Error("Note not found");
      }
      
      // In a real implementation, we would generate the ZK proof using snarkjs
      // and call the contract to make the withdrawal
      
      // Simulate successful transaction
      console.log("Simulating withdrawal with:", { 
        nullifier: note.nullifier, 
        recipient, 
        denomination: note.denomination 
      });
      
      // Update note status
      const updatedNotes = notes.map(n => 
        n.id === noteId ? { ...n, status: 'withdrawn' } : n
      );
      
      setNotes(updatedNotes);
      storeNotes(updatedNotes);
      
      return true;
    } catch (error) {
      console.error("Error making withdrawal:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [mixerContract, signer, notes, storeNotes]);

  // Export context values and functions
  const contextValue = {
    mixerContract,
    denomination,
    setDenomination,
    notes,
    isLoading,
    deposit,
    withdraw
  };

  return (
    <MixerContext.Provider value={contextValue}>
      {children}
    </MixerContext.Provider>
  );
};

// Custom hook for easier context usage
export const useMixer = () => {
  const context = React.useContext(MixerContext);
  if (!context) {
    throw new Error("useMixer must be used within a MixerProvider");
  }
  return context;
}; 