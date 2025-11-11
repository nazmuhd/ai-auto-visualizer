import React from 'react';

interface Props {
  onClose: () => void;
}

export const LoginModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div>
      <h1>Login Modal (Placeholder)</h1>
      <button onClick={onClose}>Close</button>
    </div>
  );
};
