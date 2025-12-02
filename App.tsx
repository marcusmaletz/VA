import React from 'react';
import VoiceAgent from './components/VoiceAgent';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-black text-brand-text flex items-center justify-center p-4">
      {/* 
        This wrapper simulates the integration container. 
        In your main website, you would place <VoiceAgent /> inside a modal or a specific section.
      */}
      <div className="w-full max-w-2xl">
        <VoiceAgent />
      </div>
    </div>
  );
};

export default App;