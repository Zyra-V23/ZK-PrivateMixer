import React from 'react';
import { useMixer } from '../contexts/MixerContext';

const NotesList = () => {
  const { notes } = useMixer();

  // Format date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Format string by truncating
  const formatString = (str, length = 8) => {
    if (!str) return '';
    return `${str.substring(0, length)}...`;
  };

  // Sort notes by date (most recent first)
  const sortedNotes = [...notes].sort((a, b) => b.timestamp - a.timestamp);

  if (sortedNotes.length === 0) {
    return (
      <div className="notes-list-container">
        <h2>My Notes</h2>
        <p className="no-notes-message">You don't have any notes saved in this browser.</p>
      </div>
    );
  }

  return (
    <div className="notes-list-container">
      <h2>My Notes</h2>
      <p className="notes-info">
        These notes are stored locally in your browser.
      </p>
      
      <table className="notes-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Value</th>
            <th>Date</th>
            <th>Commitment</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedNotes.map((note) => (
            <tr key={note.id} className={`note-row ${note.status}`}>
              <td>{note.id}</td>
              <td>{note.denomination} ETH</td>
              <td>{formatDate(note.timestamp)}</td>
              <td title={note.commitment}>
                {formatString(note.commitment)}
              </td>
              <td>
                <span className={`status-badge ${note.status}`}>
                  {note.status === 'deposited' ? 'Deposited' : 'Withdrawn'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="notes-warning">
        <p>
          <strong>Note:</strong> This information is for reference only. 
          Make sure to save your complete notes in a secure location to be able to withdraw your funds.
        </p>
      </div>
    </div>
  );
};

export default NotesList; 