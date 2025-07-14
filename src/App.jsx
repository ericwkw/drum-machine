import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const App = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tempo, setTempo] = useState(120);
  const [steps, setSteps] = useState(16);
  const [volume, setVolume] = useState(50);
  const [selectedPattern, setSelectedPattern] = useState('');
  const [patternName, setPatternName] = useState('');
  const [grid, setGrid] = useState({});
  const [soundPaths] = useState({
    kick: '/sounds/kick.wav',
    snare: '/sounds/snare.wav',
    hihat: '/sounds/hihat.wav',
    crash: '/sounds/crash.wav',
    tom: '/sounds/tom.wav',
    clap: '/sounds/clap.wav'
  });

  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const soundBuffersRef = useRef({});
  const soundRowsRef = useRef({});

  const sounds = ['kick', 'snare', 'hihat', 'crash', 'tom', 'clap'];

  // Initialize audio context and load sounds
  useEffect(() => {
    const initAudio = async () => {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      // Load sound files
      for (const [soundName, path] of Object.entries(soundPaths)) {
        try {
          const response = await fetch(path);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
          soundBuffersRef.current[soundName] = audioBuffer;
        } catch (error) {
          console.error(`Failed to load ${soundName}:`, error);
        }
      }
    };

    initAudio();

    // Initialize grid
    const initialGrid = {};
    sounds.forEach(sound => {
      initialGrid[sound] = Array(16).fill(false);
    });
    setGrid(initialGrid);

    // Initialize sound rows
    sounds.forEach(sound => {
      soundRowsRef.current[sound] = {
        volume: 50,
        solo: false,
        mute: false
      };
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const playSound = (sound, gainValue = 1) => {
    if (!audioContextRef.current || !soundBuffersRef.current[sound]) return;

    const source = audioContextRef.current.createBufferSource();
    const gainNode = audioContextRef.current.createGain();
    
    source.buffer = soundBuffersRef.current[sound];
    source.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    gainNode.gain.value = gainValue;
    source.start();
  };

  const toggleCell = (sound, step) => {
    setGrid(prev => ({
      ...prev,
      [sound]: prev[sound].map((active, index) => 
        index === step ? !active : active
      )
    }));
  };

  const startSequencer = () => {
    if (intervalRef.current) return;

    setIsPlaying(true);
    const stepTime = (60 / tempo / 4) * 1000;

    intervalRef.current = setInterval(() => {
      setCurrentStep(prev => {
        const nextStep = (prev + 1) % steps;
        
        // Play sounds for current step
        sounds.forEach(sound => {
          const soundRow = soundRowsRef.current[sound];
          if (grid[sound] && grid[sound][nextStep] && !soundRow.mute) {
            const soundVolume = (soundRow.volume / 100) * (volume / 100);
            playSound(sound, soundVolume);
          }
        });

        return nextStep;
      });
    }, stepTime);
  };

  const stopSequencer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const clearPattern = () => {
    const clearedGrid = {};
    sounds.forEach(sound => {
      clearedGrid[sound] = Array(16).fill(false);
    });
    setGrid(clearedGrid);
    setCurrentStep(0);
  };

  const savePattern = () => {
    if (!patternName.trim()) return;
    
    const pattern = {
      grid,
      tempo,
      steps,
      volume,
      soundRows: soundRowsRef.current
    };
    
    localStorage.setItem(`pattern_${patternName}`, JSON.stringify(pattern));
    loadPatternList();
  };

  const loadPattern = () => {
    if (!selectedPattern) return;
    
    const pattern = JSON.parse(localStorage.getItem(selectedPattern));
    if (pattern) {
      setGrid(pattern.grid);
      setTempo(pattern.tempo);
      setSteps(pattern.steps);
      setVolume(pattern.volume);
      soundRowsRef.current = pattern.soundRows || {};
    }
  };

  const loadPatternList = () => {
    // This would populate pattern select options
    // Implementation depends on how you want to handle the select element
  };

  const updateSoundRow = (sound, property, value) => {
    soundRowsRef.current[sound] = {
      ...soundRowsRef.current[sound],
      [property]: value
    };
  };

  return (
    <div className="drum-machine">
      <div className="controls">
        <div className="control-group">
          <label htmlFor="tempo">Tempo</label>
          <input
            type="range"
            id="tempo"
            min="60"
            max="180"
            value={tempo}
            onChange={(e) => setTempo(Number(e.target.value))}
          />
          <span className="slider-value">{tempo} BPM</span>
        </div>

        <div className="control-group">
          <label htmlFor="steps">Steps</label>
          <input
            type="range"
            id="steps"
            min="4"
            max="16"
            value={steps}
            onChange={(e) => setSteps(Number(e.target.value))}
          />
          <span className="slider-value">{steps}</span>
        </div>

        <div className="control-group">
          <label htmlFor="volume">Volume</label>
          <input
            type="range"
            id="volume"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
          <span className="slider-value">{volume}%</span>
        </div>
      </div>

      <div className="grid-container">
        {sounds.map(sound => (
          <div key={sound} className="sound-row">
            <div className="sound-label">{sound.toUpperCase()}</div>
            <div className="sound-controls">
              <input
                type="range"
                className="volume-slider"
                min="0"
                max="100"
                defaultValue="50"
                onChange={(e) => updateSoundRow(sound, 'volume', Number(e.target.value))}
              />
              <button
                className="solo-btn"
                onClick={() => updateSoundRow(sound, 'solo', !soundRowsRef.current[sound]?.solo)}
              >
                S
              </button>
              <button
                className="mute-btn"
                onClick={() => updateSoundRow(sound, 'mute', !soundRowsRef.current[sound]?.mute)}
              >
                M
              </button>
            </div>
            <div className="grid-cells">
              {Array.from({ length: 16 }, (_, step) => (
                <div
                  key={step}
                  className={`grid-cell ${grid[sound]?.[step] ? 'active' : ''} ${
                    currentStep === step && isPlaying ? 'current' : ''
                  } ${step >= steps ? 'disabled' : ''}`}
                  onClick={() => step < steps && toggleCell(sound, step)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pattern-bank">
        <select
          value={selectedPattern}
          onChange={(e) => setSelectedPattern(e.target.value)}
        >
          <option value="">Select Pattern</option>
        </select>
        <input
          type="text"
          placeholder="Pattern Name"
          value={patternName}
          onChange={(e) => setPatternName(e.target.value)}
        />
        <button onClick={savePattern}>Save</button>
        <button onClick={loadPattern}>Load</button>
      </div>

      <div className="actions">
        <button onClick={isPlaying ? stopSequencer : startSequencer}>
          {isPlaying ? 'Stop' : 'Play'}
        </button>
        <button onClick={clearPattern}>Clear</button>
      </div>
    </div>
  );
};

export default App;