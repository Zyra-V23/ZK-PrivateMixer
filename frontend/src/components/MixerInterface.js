import React, { useState, useContext } from 'react';
import { MixerContext } from '../contexts/MixerContext';
import { Web3Context } from '../contexts/Web3Context';
import '../App.css';

// Mock denomination options (replace with actual logic if needed)
const denominations = [
  { value: '0.1', label: '0.1 ETH' },
  { value: '1', label: '1 ETH' },
  { value: '10', label: '10 ETH' },
];

const MixerInterface = () => {
  const { deposit, withdraw, loading, message } = useContext(MixerContext);
  const { account } = useContext(Web3Context);
  const [mode, setMode] = useState('deposit'); // 'deposit' or 'withdraw'
  const [denomination, setDenomination] = useState(denominations[0].value); // Default denomination
  const [note, setNote] = useState('');
  const [recipient, setRecipient] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false); // To reveal note input on withdraw

  const handleDeposit = async () => {
    if (!account) {
      alert('Please connect your wallet first.');
      return;
    }
    console.log(`Depositing ${denomination} ETH`);
    await deposit(denomination);
    // Clear note input if shown from previous withdraw attempt?
    // setNote('');
    // setRecipient('');
  };

  const handleWithdraw = async () => {
    if (!account) {
      alert('Please connect your wallet first.');
      return;
    }
    if (!note || !recipient) {
      alert('Please provide the note and recipient address.');
      return;
    }
    console.log(`Withdrawing using note to ${recipient}`);
    await withdraw(note, recipient);
    // Clear inputs after successful withdrawal?
    // setNote('');
    // setRecipient('');
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    // Reset potentially irrelevant state when switching modes
    if (newMode === 'deposit') {
      setNote('');
      setRecipient('');
      setShowNoteInput(false);
    } else {
      // Optionally keep denomination or reset
    }
  };

  return (
    <div className="mixer-interface-container">
      {/* Mode Toggle (Deposit/Withdraw) */}
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
            disabled={loading || !account}
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
          {/* We need a way to input the secret note */} 
          <div className="input-group">
            <label htmlFor="note">Secret Note</label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Paste your secret note here (e.g., zkmixer-eth-0.1-...)" 
              disabled={loading || !account}
              rows={3}
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
              disabled={loading || !account}
            />
          </div>
        </>
      )}

      <button
        className="action-button"
        onClick={mode === 'deposit' ? handleDeposit : handleWithdraw}
        disabled={loading || !account || (mode === 'withdraw' && (!note || !recipient))}
      >
        {loading ? 'Processing...' : (mode === 'deposit' ? `Deposit ${denomination} ETH` : 'Withdraw')}
      </button>

      {/* Display Loading/Messages */}
      {loading && <div className="loading-indicator">Waiting for transaction...</div>}
      {message && 
        <div className={message.type === 'success' ? 'success-message' : 'error-message'}>
          {message.text}
        </div>
      }
    </div>
  );
};

export default MixerInterface; 