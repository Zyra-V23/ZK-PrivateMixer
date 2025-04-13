import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Component to test
import MixerInterface from './MixerInterface';

// Mock contexts and hooks
import { Web3Context } from '../contexts/Web3Context';
import { MixerContext } from '../contexts/MixerContext';
import useNoteManagement from '../hooks/useNoteManagement';

// Mock the custom hook
jest.mock('../hooks/useNoteManagement');

// Mock the crypto utility (if it's complex or async)
// We already mocked poseidonHash inside MixerInterface for now, 
// but a cleaner approach might be mocking the module:
/*
jest.mock('../utils/cryptoUtils', () => ({
  poseidonHash: jest.fn().mockResolvedValue('0xMockCommitment'),
}));
*/

// Default mock values
const mockWeb3Context = {
  account: '0x1234567890abcdef1234567890abcdef12345678',
  chainId: 11155111,
  provider: null,
  signer: null,
  isConnected: true,
};

const mockMixerContext = {
  deposit: jest.fn(),
  withdraw: jest.fn(),
  isLoading: false,
  message: null,
};

const mockUseNoteManagement = {
  generateNote: jest.fn(),
  parseNote: jest.fn(),
  generatedNote: null,
  parseError: null,
  clearGeneratedNote: jest.fn(),
};

// Helper to render the component with mocked providers
const renderComponent = (web3Props = {}, mixerProps = {}, noteProps = {}) => {
  // Reset mocks before each render
  mockMixerContext.deposit.mockClear();
  mockMixerContext.withdraw.mockClear();
  mockUseNoteManagement.generateNote.mockClear();
  mockUseNoteManagement.parseNote.mockClear();
  mockUseNoteManagement.clearGeneratedNote.mockClear();

  // Apply overrides
  const web3ProviderValue = { ...mockWeb3Context, ...web3Props };
  const mixerProviderValue = { ...mockMixerContext, ...mixerProps };
  const noteHookValue = { ...mockUseNoteManagement, ...noteProps };

  // Configure the mock hook implementation
  useNoteManagement.mockImplementation(() => noteHookValue);

  return render(
    <Web3Context.Provider value={web3ProviderValue}>
      <MixerContext.Provider value={mixerProviderValue}>
        <MixerInterface />
      </MixerContext.Provider>
    </Web3Context.Provider>
  );
};

describe('<MixerInterface /> Component Tests', () => {

  it('should show note backup UI after successful deposit', async () => {
    const mockNoteString = 'zkvoid-note-v1-eth-0.1-11155111-mockBase64Data';
    const mockGeneratedNoteData = {
        note: mockNoteString,
        nullifier: BigInt(123),
        secret: BigInt(456),
    };
    const mockDepositFn = jest.fn().mockResolvedValue(true); // Simulate successful deposit
    const mockGenerateNoteFn = jest.fn().mockReturnValue(mockNoteString); // Return note string

    renderComponent(
        {},
        { deposit: mockDepositFn },
        {
            generateNote: mockGenerateNoteFn,
            // Need to provide generatedNote state *after* generateNote is called
            // We'll simulate this by setting it directly for this test case logic
            // A more complex setup might involve state updates within the mock hook
            generatedNote: mockGeneratedNoteData
        }
    );

    // Find and click the deposit button
    const depositButton = screen.getByRole('button', { name: /Deposit 0\.1 ETH/i });
    expect(depositButton).toBeInTheDocument();
    fireEvent.click(depositButton);

    // Wait for deposit to complete and UI to update
    // Check that generateNote was called
    expect(mockGenerateNoteFn).toHaveBeenCalledWith(mockWeb3Context.chainId);

    // Check that deposit context function was called (assuming mock poseidon hash resolves)
    // Commitment calculation happens inside the component, using the result of generateNote
    // We expect deposit to be called with *some* commitment hash
    await waitFor(() => {
        expect(mockDepositFn).toHaveBeenCalledWith(expect.stringMatching(/^0x[a-fA-F0-9]{64}$/), '0.1');
    });

    // Check that the backup section is now visible
    await waitFor(() => {
      expect(screen.getByText(/Important: Backup Your Secret Note!/i)).toBeVisible();
      expect(screen.getByText(mockNoteString)).toBeVisible(); // Check if the note string is displayed
      expect(screen.getByRole('button', { name: /Copy to Clipboard/i })).toBeVisible();
      expect(screen.getByRole('button', { name: /Download Note File/i })).toBeVisible();
    });
  });

  it('should call parseNote when withdrawing with input', async () => {
    const mockNoteInput = 'zkvoid-note-v1-eth-0.1-1-validBase64==';
    const mockRecipient = '0xRecipientAddress';
    const mockParseNoteFn = jest.fn().mockReturnValue({ nullifier: BigInt(1), secret: BigInt(2) }); // Simulate successful parsing

    renderComponent(
      {},
      {},
      { parseNote: mockParseNoteFn }
    );

    // Switch to withdraw mode
    const withdrawModeButton = screen.getByRole('button', { name: /Withdraw/i });
    fireEvent.click(withdrawModeButton);

    // Fill in the form
    const noteTextarea = screen.getByLabelText(/Secret Note/i);
    const recipientInput = screen.getByLabelText(/Recipient Address/i);
    const withdrawButton = screen.getByRole('button', { name: /^Withdraw$/i }); // Exact match

    fireEvent.change(noteTextarea, { target: { value: mockNoteInput } });
    fireEvent.change(recipientInput, { target: { value: mockRecipient } });

    // Click withdraw
    fireEvent.click(withdrawButton);

    // Check if parseNote was called with the input value
    await waitFor(() => {
      expect(mockParseNoteFn).toHaveBeenCalledWith(mockNoteInput);
    });

    // Check if context withdraw function was called (as it's a placeholder)
     await waitFor(() => {
         expect(mockMixerContext.withdraw).toHaveBeenCalled();
     });
  });

    it('should display parse error message for invalid note on withdraw attempt', async () => {
    const mockInvalidNoteInput = 'invalid-note-string';
    const mockRecipient = '0xRecipientAddress';
    const mockParseNoteFn = jest.fn().mockReturnValue(null); // Simulate failed parsing
    const mockErrorMessage = 'Invalid note format prefix.';

    renderComponent(
      {},
      {},
      { 
          parseNote: mockParseNoteFn, 
          parseError: mockErrorMessage // Provide the error message from the hook
      }
    );

    // Switch to withdraw mode
    const withdrawModeButton = screen.getByRole('button', { name: /Withdraw/i });
    fireEvent.click(withdrawModeButton);

    // Fill in the form
    const noteTextarea = screen.getByLabelText(/Secret Note/i);
    const recipientInput = screen.getByLabelText(/Recipient Address/i);
    const withdrawButton = screen.getByRole('button', { name: /^Withdraw$/i });

    fireEvent.change(noteTextarea, { target: { value: mockInvalidNoteInput } });
    fireEvent.change(recipientInput, { target: { value: mockRecipient } });

    // Click withdraw
    fireEvent.click(withdrawButton);

    // Check if parseNote was called
    await waitFor(() => {
      expect(mockParseNoteFn).toHaveBeenCalledWith(mockInvalidNoteInput);
    });

    // Check that the error message is displayed
    await waitFor(() => {
        expect(screen.getByText(`Invalid Note Format: ${mockErrorMessage}`)).toBeVisible();
    });

     // Check that context withdraw was NOT called
     expect(mockMixerContext.withdraw).not.toHaveBeenCalled();
  });

}); 