import React, { useState, useContext, useEffect } from 'react';
import { MixerContext } from '../contexts/MixerContext';
import { Web3Context } from '../contexts/Web3Context';
import useNoteManagement from '../hooks/useNoteManagement';
import { poseidonHash } from '../utils/cryptoUtils';
import '../App.css';

// Mock poseidon hash function for now - REPLACE WITH ACTUAL IMPLEMENTATION
/* async function poseidonHash(inputs) {
    console.warn("Using mock poseidonHash! Replace with actual implementation.");
    // Simulate hashing - THIS IS NOT SECURE OR CORRECT
    const packed = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256'], [inputs[0], inputs[1]]);
    return ethers.utils.keccak256(packed);
} */

// Mock denomination options (replace with actual logic if needed)
const denominations = [
  { value: '0.1', label: '0.1 ETH' },
  { value: '1', label: '1 ETH' },
  { value: '10', label: '10 ETH' },
];

const MixerInterface = () => {
  const { deposit, withdraw, isLoading, message: contextMessage } = useContext(MixerContext);
  const { account, chainId } = useContext(Web3Context);
  const {
      generateNote,
      parseNote,
      generatedNote,
      parseError,
      clearGeneratedNote
  } = useNoteManagement();

  const [mode, setMode] = useState('deposit'); // 'deposit' or 'withdraw'
  const [denomination, setDenomination] = useState(denominations[0].value); // Default denomination
  const [noteInput, setNoteInput] = useState('');
  const [recipient, setRecipient] = useState('');
  const [noteToBackup, setNoteToBackup] = useState(null);
  const [backupStatusMessage, setBackupStatusMessage] = useState('');
  const [localMessage, setLocalMessage] = useState(null);

  useEffect(() => {
    setLocalMessage(null);
  }, [contextMessage, isLoading]);

  useEffect(() => {
      setNoteToBackup(null);
      setBackupStatusMessage('');
      clearGeneratedNote();
  }, [mode, account, clearGeneratedNote]);

  const handleDeposit = async () => {
    setLocalMessage(null);
    setNoteToBackup(null);
    setBackupStatusMessage('');

    if (!account || !chainId) {
      setLocalMessage({ type: 'error', text: 'Please connect wallet & ensure network is detected.'});
      return;
    }
    if (!generateNote) {
        setLocalMessage({ type: 'error', text: 'Note generation function not ready.'});
        return;
    }

    const noteData = generateNote(chainId);
    if (!noteData || !generatedNote) {
        setLocalMessage({ type: 'error', text: 'Failed to generate secret note.' });
        return;
    }
    const { nullifier, secret } = generatedNote;
    console.log("Generated Note Details:", { nullifier: nullifier.toString(), secret: secret.toString() });

    let commitment;
    try {
      commitment = await poseidonHash([nullifier, secret]);
      console.log("Calculated Commitment:", commitment);
    } catch (error) {
      console.error("Poseidon hash calculation failed:", error);
      setLocalMessage({ type: 'error', text: `Failed to calculate commitment: ${error.message}` });
      return;
    }

    const depositSuccess = await deposit(commitment, denomination);

    if (depositSuccess) {
      setNoteToBackup(generatedNote.note);
      setLocalMessage({ type: 'info', text: 'Deposit submitted! Please BACKUP your secret note below.' });
    } else {
      clearGeneratedNote();
    }
  };

  const handleWithdraw = async () => {
    setLocalMessage(null);
    if (!account) {
       setLocalMessage({ type: 'error', text: 'Please connect your wallet first.' });
      return;
    }
    if (!noteInput || !recipient) {
      setLocalMessage({ type: 'error', text: 'Please provide the note and recipient address.' });
      return;
    }

    const parsed = parseNote(noteInput);
    if (!parsed) {
      setLocalMessage({ type: 'error', text: `Invalid Note Format: ${parseError}` });
      return;
    }
    const { nullifier, secret } = parsed;
    console.log("Parsed Note:", { nullifier: nullifier.toString(), secret: secret.toString() });

    console.log(`Withdrawing using parsed note to ${recipient}`);
    await withdraw();
  };

  const handleCopyNote = () => {
    if (noteToBackup) {
      navigator.clipboard.writeText(noteToBackup)
        .then(() => {
          setBackupStatusMessage('Copied to clipboard!');
          setTimeout(() => setBackupStatusMessage(''), 2000);
        })
        .catch(err => {
          console.error('Failed to copy note: ', err);
          setBackupStatusMessage('Failed to copy.');
           setTimeout(() => setBackupStatusMessage(''), 2000);
        });
    }
  };

  const handleDownloadNote = () => {
    if (noteToBackup) {
      const blob = new Blob([noteToBackup], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `zkvoid-note-eth-${denomination}-chain${chainId}-${Date.now()}.txt`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setBackupStatusMessage('Download started.');
      setTimeout(() => setBackupStatusMessage(''), 2000);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === 'deposit') {
      setNoteInput('');
      setRecipient('');
    }
  };

  return (
    <div className="mixer-interface-container">
      <div className="mode-toggle">
        <button
          className={mode === 'deposit' ? 'active' : ''}
          onClick={() => handleModeChange('deposit')}
        >
          Deposit
        </button>
        <button
          className={mode === 'withdraw' ? 'active' : ''}
          onClick={() => handleModeChange('withdraw')}
        >
          Withdraw
        </button>
      </div>

      {mode === 'deposit' && (
        <div className="input-group">
          <label htmlFor="denomination">Select Amount (Denomination)</label>
          <select
            id="denomination"
            value={denomination}
            onChange={(e) => setDenomination(e.target.value)}
            disabled={isLoading || !account}
          >
            {denominations.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {mode === 'withdraw' && (
        <>
          <div className="input-group">
            <label htmlFor="note">Secret Note</label>
            <textarea
              id="note"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Paste your secret note here (e.g., zkvoid-note-v1-...)" 
              disabled={isLoading || !account}
              rows={3}
              title="Paste the full secret note you saved after depositing. Format: zkvoid-note-v1-eth-0.1-{chainId}-{base64_data}"
            />
          </div>

          <div className="input-group">
            <label htmlFor="recipient">Recipient Address</label>
            <input
              type="text"
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter the withdrawal address (e.g., 0x...)"
              disabled={isLoading || !account}
            />
          </div>
        </>
      )}

      <button
        className="action-button"
        onClick={mode === 'deposit' ? handleDeposit : handleWithdraw}
        disabled={isLoading || !account || (mode === 'withdraw' && (!noteInput || !recipient))}
      >
        {isLoading ? 'Processing...' : (mode === 'deposit' ? `Deposit ${denomination} ETH` : 'Withdraw')}
      </button>

      {isLoading && <div className="loading-indicator">Waiting for transaction...</div>}
      {(contextMessage || localMessage) && 
        <div className={
            (contextMessage?.type === 'success' || localMessage?.type === 'success') ? 'success-message' :
            (contextMessage?.type === 'error' || localMessage?.type === 'error') ? 'error-message' :
            'info-message'
        }>
          {contextMessage?.text || localMessage?.text}
        </div>
      }

      {/* Note Backup Section - Shown after successful deposit */}
      {noteToBackup && mode === 'deposit' && (
        <div className="note-backup-section void-border-glow">
          <h4 className="warning-header">🚨 Important: Backup Your Secret Note! 🚨</h4>
          <p className="warning-text">
            This note is the **ONLY** way to withdraw your funds.<br /> 
            Keep it secret, keep it safe. Store it offline securely.<br />
            <strong>If you lose this note, your funds are lost forever. We cannot recover it.</strong>
          </p>
          <div className="note-display">
            <code>{noteToBackup}</code>
          </div>
          <div className="backup-actions">
            <button onClick={handleCopyNote} className="button-secondary">Copy Note</button>
            <button onClick={handleDownloadNote} className="button-secondary">Download File</button>
          </div>
           {backupStatusMessage && <p className="backup-status fade-out">{backupStatusMessage}</p>}
           <p className="backup-footer-text">Once saved securely, you can make another deposit or switch to withdraw.</p>
        </div>
      )}

    </div>
  );
};

export default MixerInterface; 