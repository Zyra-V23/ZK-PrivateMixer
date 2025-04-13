import { renderHook, act } from '@testing-library/react';
import useNoteManagement from './useNoteManagement';

// Mock window.crypto.getRandomValues if needed (usually handled by jsdom in Jest)
// If not using Jest/jsdom, you might need a polyfill or manual mock:
/*
global.crypto = {
  getRandomValues: (arr) => {
    // Fill with non-random predictable values for testing if necessary
    for (let i = 0; i < arr.length; i++) {
      arr[i] = i % 256; 
    }
    return arr;
  },
};
*/

describe('useNoteManagement Hook', () => {

  it('should generate a note in the correct format', () => {
    const { result } = renderHook(() => useNoteManagement());
    const mockChainId = 11155111; // Example Sepolia chainId
    let generatedNoteString = null;

    act(() => {
      generatedNoteString = result.current.generateNote(mockChainId);
    });

    // Check the format: zkvoid-note-v1-eth-0.1-{chainId}-{base64(...)}
    expect(generatedNoteString).toMatch(/^zkvoid-note-v1-eth-0\.1-\d+-[A-Za-z0-9+/=]+$/);
    const parts = generatedNoteString.split('-');
    expect(parts.length).toBe(7);
    expect(parts[0]).toBe('zkvoid');
    expect(parts[1]).toBe('note');
    expect(parts[2]).toBe('v1');
    expect(parts[3]).toBe('eth');
    expect(parts[4]).toBe('0.1'); // Assuming fixed denomination
    expect(parts[5]).toBe(String(mockChainId));
    // Basic Base64 check (non-empty)
    expect(parts[6].length).toBeGreaterThan(0);

    // Check the hook state
    expect(result.current.generatedNote).not.toBeNull();
    expect(result.current.generatedNote.note).toBe(generatedNoteString);
    expect(typeof result.current.generatedNote.nullifier).toBe('bigint');
    expect(typeof result.current.generatedNote.secret).toBe('bigint');
    expect(result.current.generatedNote.nullifier).toBeGreaterThan(0n); // Should not be zero
    expect(result.current.generatedNote.secret).toBeGreaterThan(0n);    // Should not be zero
  });

  it('should return null and log error if chainId is missing during generation', () => {
    const { result } = renderHook(() => useNoteManagement());
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console error
    let generatedNoteString = null;

    act(() => {
      generatedNoteString = result.current.generateNote(null); // Pass null chainId
    });

    expect(generatedNoteString).toBeNull();
    expect(result.current.generatedNote).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith("Chain ID is required to generate a note.");

    consoleErrorSpy.mockRestore();
  });

  // --- Tests for parseNote ---

  it('should correctly parse a valid note string', () => {
    const { result } = renderHook(() => useNoteManagement());
    // Example valid Base64 part: btoa('010203...:0a0b0c...') - length depends on byte size
    const validNullifierHex = '0'.repeat(60) + 'ab'; // 31 bytes
    const validSecretHex = '1'.repeat(60) + 'cd'; // 31 bytes
    const validEncodedData = btoa(`${validNullifierHex}:${validSecretHex}`);
    const validNoteString = `zkvoid-note-v1-eth-0.1-1-${validEncodedData}`;

    let parsedResult = null;
    act(() => {
      parsedResult = result.current.parseNote(validNoteString);
    });

    expect(result.current.parseError).toBeNull();
    expect(parsedResult).not.toBeNull();
    expect(typeof parsedResult.nullifier).toBe('bigint');
    expect(typeof parsedResult.secret).toBe('bigint');
    // Convert expected hex back to BigInt for comparison
    expect(parsedResult.nullifier).toEqual(BigInt('0x' + validNullifierHex));
    expect(parsedResult.secret).toEqual(BigInt('0x' + validSecretHex));
  });

  it('should return null and set error for invalid prefix', () => {
    const { result } = renderHook(() => useNoteManagement());
    const invalidNoteString = `invalid-prefix-v1-eth-0.1-1-somebase64data`;
    let parsedResult = null;
    act(() => {
      parsedResult = result.current.parseNote(invalidNoteString);
    });

    expect(parsedResult).toBeNull();
    expect(result.current.parseError).toBe("Invalid note format prefix.");
  });

  it('should return null and set error for incorrect number of parts', () => {
    const { result } = renderHook(() => useNoteManagement());
    const invalidNoteString = `zkvoid-note-v1-eth-0.1-1`; // Missing base64 part
    let parsedResult = null;
    act(() => {
      parsedResult = result.current.parseNote(invalidNoteString);
    });

    expect(parsedResult).toBeNull();
    expect(result.current.parseError).toBe("Invalid note format prefix."); // Adjust error message if needed
  });

  it('should return null and set error for invalid base64 encoding', () => {
    const { result } = renderHook(() => useNoteManagement());
    const invalidNoteString = `zkvoid-note-v1-eth-0.1-1-%%%invalid-base64%%%`;
    let parsedResult = null;
    act(() => {
      parsedResult = result.current.parseNote(invalidNoteString);
    });

    expect(parsedResult).toBeNull();
    // Error message might vary slightly depending on browser implementation of atob
    expect(result.current.parseError).toContain("Invalid note format or encoding.");
  });

   it('should return null and set error for invalid hex format within base64', () => {
    const { result } = renderHook(() => useNoteManagement());
    const invalidEncodedData = btoa('notahex:notahex'); // Missing colon or wrong parts
    const invalidNoteString = `zkvoid-note-v1-eth-0.1-1-${invalidEncodedData}`;
    let parsedResult = null;
    act(() => {
      parsedResult = result.current.parseNote(invalidNoteString);
    });

    expect(parsedResult).toBeNull();
    expect(result.current.parseError).toBe("Invalid note data format");
  });

  it('should return null and set error for incorrect hex length within base64', () => {
    const { result } = renderHook(() => useNoteManagement());
    const shortHex = '010203';
    const validHex = '0'.repeat(62);
    const invalidEncodedData = btoa(`${shortHex}:${validHex}`); // First part too short
    const invalidNoteString = `zkvoid-note-v1-eth-0.1-1-${invalidEncodedData}`;
    let parsedResult = null;
    act(() => {
      parsedResult = result.current.parseNote(invalidNoteString);
    });

    expect(parsedResult).toBeNull();
    expect(result.current.parseError).toBe("Invalid hex length in note data");
  });

  it('should return null and set error for null or non-string input', () => {
    const { result } = renderHook(() => useNoteManagement());
    let parsedResult = null;

    act(() => {
      parsedResult = result.current.parseNote(null);
    });
    expect(parsedResult).toBeNull();
    expect(result.current.parseError).toBe("Invalid input: Note string is required.");

    act(() => {
      parsedResult = result.current.parseNote(12345); // Pass number
    });
    expect(parsedResult).toBeNull();
    expect(result.current.parseError).toBe("Invalid input: Note string is required.");
  });

  // --- Test for clearGeneratedNote --- 

  it('should clear the generated note state', () => {
    const { result } = renderHook(() => useNoteManagement());
    const mockChainId = 1;

    // Generate a note first
    act(() => {
      result.current.generateNote(mockChainId);
    });
    expect(result.current.generatedNote).not.toBeNull();

    // Clear the note
    act(() => {
      result.current.clearGeneratedNote();
    });
    expect(result.current.generatedNote).toBeNull();
  });


  // Add tests for parseNote (valid and invalid cases)
  // Add tests for clearGeneratedNote
}); 