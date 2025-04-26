import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 py-4 mt-auto">
      <div className="container mx-auto px-4 text-center text-gray-600">
        <p>&copy; {new Date().getFullYear()} Image Processing Service</p>
      </div>
    </footer>
  );
};
