import { useState, useCallback } from 'react';

// Constants
const NOTE_VERSION = 'v1';
const DENOMINATION = '0.1'; // Example denomination, should match contract
const SECRET_BYTES = 31;
const NULLIFIER_BYTES = 31;

// Helper function to convert Uint8Array to BigInt
// (ethers.js BigNumber might not directly support this, using native BigInt)
function bytesToBigInt(bytes) {
  let hex = '0x';
  bytes.forEach(byte => {
    hex += byte.toString(16).padStart(2, '0');
  });
  return BigInt(hex);
}

// Helper function to encode note components to base64
function encodeNoteData(nullifierBigInt, secretBigInt) {
    // Convert BigInts back to fixed-length hex strings (pad if needed)
    // Assuming 31 bytes = 62 hex chars
    const nullifierHex = nullifierBigInt.toString(16).padStart(NULLIFIER_BYTES * 2, '0');
    const secretHex = secretBigInt.toString(16).padStart(SECRET_BYTES * 2, '0');
    const combinedHex = `${nullifierHex}:${secretHex}`;
    // Use browser's btoa for Base64 encoding of the hex string representation
    return btoa(combinedHex);
}

// Helper function to parse note components from base64
function decodeNoteData(encodedData) {
    try {
        const combinedHex = atob(encodedData);
        const parts = combinedHex.split(':');
        if (parts.length !== 2) {
            throw new Error('Invalid note data format');
        }
        const nullifierHex = '0x' + parts[0];
        const secretHex = '0x' + parts[1];

        // Validate hex string lengths
        if (nullifierHex.length !== 2 + NULLIFIER_BYTES * 2 || secretHex.length !== 2 + SECRET_BYTES * 2) {
             throw new Error('Invalid hex length in note data');
        }

        return {
            nullifier: BigInt(nullifierHex),
            secret: BigInt(secretHex),
        };
    } catch (e) {
        console.error("Failed to decode note data:", e);
        throw new Error("Invalid note format or encoding.");
    }
}


function useNoteManagement() {
  const [generatedNote, setGeneratedNote] = useState(null);
  const [parseError, setParseError] = useState(null);

  /**
   * Generates a new note (nullifier, secret) using secure randomness
   * and formats it into the standard string format.
   * @param {string | number} chainId The current chain ID.
   * @returns {string} The formatted note string.
   */
  const generateNote = useCallback((chainId) => {
    if (!chainId) {
        console.error("Chain ID is required to generate a note.");
        // Or throw an error, depending on desired handling
        return null;
    }

    const nullifierBytes = new Uint8Array(NULLIFIER_BYTES);
    const secretBytes = new Uint8Array(SECRET_BYTES);

    window.crypto.getRandomValues(nullifierBytes);
    window.crypto.getRandomValues(secretBytes);

    const nullifierBigInt = bytesToBigInt(nullifierBytes);
    const secretBigInt = bytesToBigInt(secretBytes);

    // Format: zkvoid-note-v1-eth-0.1-{chainId}-{base64(nullifier:secret)}
    // Chain ID is included for context and potential future multi-chain support checks
    const encodedData = encodeNoteData(nullifierBigInt, secretBigInt);
    const noteString = `zkvoid-note-${NOTE_VERSION}-eth-${DENOMINATION}-${chainId}-${encodedData}`;

    setGeneratedNote({
        note: noteString,
        nullifier: nullifierBigInt,
        secret: secretBigInt,
    });

    return noteString; // Return the string for immediate use (e.g., display)
  }, []);

  /**
   * Parses a note string into its components (nullifier, secret).
   * Validates the format prefix.
   * @param {string} noteString The note string to parse.
   * @returns {{nullifier: bigint, secret: bigint} | null} The parsed components or null if parsing fails.
   */
  const parseNote = useCallback((noteString) => {
    setParseError(null); // Clear previous error
    if (!noteString || typeof noteString !== 'string') {
      setParseError("Invalid input: Note string is required.");
      return null;
    }

    const parts = noteString.trim().split('-');
    // Example: zkvoid-note-v1-eth-0.1-11155111-YWJjMTIzOmRlZjQ1Ng==
    if (parts.length !== 7 || parts[0] !== 'zkvoid' || parts[1] !== 'note' || parts[2] !== NOTE_VERSION || parts[3] !== 'eth' || parts[4] !== DENOMINATION) {
      setParseError("Invalid note format prefix.");
      return null;
    }

    // We might want to validate chainId (parts[5]) against the current network later
    const encodedData = parts[6];

    try {
      const { nullifier, secret } = decodeNoteData(encodedData);
      return { nullifier, secret };
    } catch (error) {
       setParseError(error.message || "Failed to parse note data.");
       return null;
    }
  }, []);

  // Function to clear the generated note from state if needed
  const clearGeneratedNote = useCallback(() => {
    setGeneratedNote(null);
  }, []);


  return {
    generateNote,
    parseNote,
    generatedNote, // Contains { note: string, nullifier: bigint, secret: bigint } or null
    parseError,    // Contains error message string or null
    clearGeneratedNote
  };
}

export default useNoteManagement; 