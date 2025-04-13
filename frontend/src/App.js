import React, { useState } from 'react';
import { Web3Provider } from './contexts/Web3Context';
import { MixerProvider } from './contexts/MixerContext';
import Header from './components/Header';
import MixerInterface from './components/MixerInterface';
import Info from './components/Info';
import Footer from './components/Footer';
import './App.css';

function App() {
  const [activeSection, setActiveSection] = useState('mixer');

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'mixer':
        return <MixerInterface />;
      case 'info':
        return <Info />;
      default:
        return <MixerInterface />;
    }
  };

  return (
    <Web3Provider>
      <MixerProvider>
        <div className="App">
          <Header setActiveSection={setActiveSection} />
          
          <main className="main-content">
            {renderActiveSection()}
          </main>
          
          <Footer />
        </div>
      </MixerProvider>
    </Web3Provider>
  );
}

export default App;
