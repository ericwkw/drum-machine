import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

const sounds = ['kick', 'snare', 'hihat', 'crash', 'tom', 'clap'];
const soundPaths = {
  kick: '/sounds/kick.wav',
  snare: '/sounds/snare.wav',
  hihat: '/sounds/hihat.wav',
  crash: '/sounds/crash.wav',
  tom: '/sounds/tom.wav',
  clap: '/sounds/clap.wav'
};

const App = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tempo, setTempo] = useState(120);
  const [steps, setSteps] = useState(16);
  const [maxSteps, setMaxSteps] = useState(32);
  const [volume, setVolume] = useState(50);
  const [grid, setGrid] = useState(() => {
    const initialGrid = {};
    sounds.forEach(sound => {
      initialGrid[sound] = Array(16).fill(false);
    });
    return initialGrid;
  });
  const [soundControls, setSoundControls] = useState(() => {
    const initialControls = {};
    sounds.forEach(sound => {
      initialControls[sound] = { volume: 80, solo: false, mute: false };
    });
    return initialControls;
  });

  const [patterns, setPatterns] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState('');
  const [patternName, setPatternName] = useState('');

  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const soundBuffersRef = useRef({});
  const gridContainerRef = useRef(null);

  const loadPatternList = useCallback(() => {
    const savedPatterns = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('pattern_')) {
        try {
          const pattern = JSON.parse(localStorage.getItem(key));
          savedPatterns.push({ id: key, name: pattern.name });
        } catch (error) {
          console.error('Error parsing pattern:', error);
        }
      }
    }
    setPatterns(savedPatterns);
  }, []);

  useEffect(() => {
    const initAudio = async () => {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
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
    loadPatternList();
  }, [loadPatternList]);

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        const minCellWidth = 40; // Minimum width for a drum pad
        const gap = 12;
        const calculatedMaxSteps = Math.floor((width + gap) / (minCellWidth + gap));
        setMaxSteps(Math.max(4, calculatedMaxSteps));
      }
    });

    if (gridContainerRef.current) {
      observer.observe(gridContainerRef.current);
    }

    return () => {
      if (gridContainerRef.current) {
        observer.unobserve(gridContainerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (steps > maxSteps) {
      setSteps(maxSteps);
    }
  }, [maxSteps, steps]);

  const playSound = (sound, gainValue) => {
    if (!audioContextRef.current || !soundBuffersRef.current[sound]) return;
    const source = audioContextRef.current.createBufferSource();
    const gainNode = audioContextRef.current.createGain();
    source.buffer = soundBuffersRef.current[sound];
    source.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    gainNode.gain.value = gainValue;
    source.start();
  };

  const startSequencer = useCallback(() => {
    if (intervalRef.current) return;
    setIsPlaying(true);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const stepTime = (60 / tempo / 4) * 1000;
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          const nextStep = (prev + 1) % steps;
          const soloedSounds = sounds.filter(s => soundControls[s].solo);

          sounds.forEach(sound => {
            const isSoloed = soloedSounds.length > 0 && !soundControls[sound].solo;
            if (grid[sound]?.[nextStep] && !soundControls[sound].mute && !isSoloed) {
              const soundVolume = (soundControls[sound].volume / 100) * (volume / 100);
              playSound(sound, soundVolume);
            }
          });
          return nextStep;
        });
      }, stepTime);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, tempo, steps, grid, volume, soundControls]);


  const stopSequencer = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const toggleCell = (sound, step) => {
    const newGrid = { ...grid };
    newGrid[sound] = [...newGrid[sound]];
    newGrid[sound][step] = !newGrid[sound][step];
    setGrid(newGrid);
  };

  const handleStepsChange = (e) => {
    const newSteps = Number(e.target.value);
    setSteps(newSteps);
    const newGrid = {};
    sounds.forEach(sound => {
      const oldSteps = grid[sound] || [];
      const newSoundSteps = Array(newSteps).fill(false);
      for (let i = 0; i < Math.min(oldSteps.length, newSteps); i++) {
        newSoundSteps[i] = oldSteps[i];
      }
      newGrid[sound] = newSoundSteps;
    });
    setGrid(newGrid);
  };
  
  const updateSoundControl = (sound, property, value) => {
    setSoundControls(prev => ({
      ...prev,
      [sound]: { ...prev[sound], [property]: value }
    }));
  };

  const clearPattern = () => {
    const clearedGrid = {};
    sounds.forEach(sound => {
      clearedGrid[sound] = Array(steps).fill(false);
    });
    setGrid(clearedGrid);
  };

  const savePattern = () => {
    if (!patternName.trim()) {
      alert('Please enter a pattern name.');
      return;
    }
    const patternId = `pattern_${patternName.trim()}`;
    const pattern = {
      name: patternName.trim(),
      grid,
      tempo,
      steps,
      volume,
      soundControls
    };
    localStorage.setItem(patternId, JSON.stringify(pattern));
    loadPatternList();
    setPatternName('');
    setSelectedPattern(patternId);
  };

  const loadPattern = () => {
    if (!selectedPattern) return;
    const pattern = JSON.parse(localStorage.getItem(selectedPattern));
    if (pattern) {
      setGrid(pattern.grid);
      setTempo(pattern.tempo);
      setSteps(pattern.steps);
      setVolume(pattern.volume);
      setSoundControls(pattern.soundControls);
    }
  };

  const deletePattern = () => {
    if (!selectedPattern) return;
    localStorage.removeItem(selectedPattern);
    loadPatternList();
    setSelectedPattern('');
  }

  return (
    <div className="drum-machine" data-lovable-id="drum-machine-container">
      
      <div className="controls">
        <div className="control-group">
          <label htmlFor="tempo">Tempo</label>
          <input type="range" id="tempo" min="60" max="180" value={tempo} onChange={(e) => setTempo(Number(e.target.value))} />
          <span>{tempo} BPM</span>
        </div>
        <div className="control-group">
          <label htmlFor="steps">Steps</label>
          <input type="range" id="steps" min="4" max={maxSteps} value={steps} onChange={handleStepsChange} />
          <span>{steps}</span>
        </div>
        <div className="control-group">
          <label htmlFor="volume">Master Volume</label>
          <input type="range" id="volume" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
          <span>{volume}%</span>
        </div>
      </div>

      <div className="grid-container" ref={gridContainerRef} style={{ '--steps': steps }} data-lovable-id="grid-container">
        {sounds.map(sound => (
          <React.Fragment key={sound}>
            <div className="sound-info">
              <span className="sound-label">{sound.toUpperCase()}</span>
              <div className="sound-controls">
                <input
                  type="range"
                  className="sound-volume-slider"
                  min="0"
                  max="100"
                  value={soundControls[sound].volume}
                  onChange={(e) => updateSoundControl(sound, 'volume', Number(e.target.value))}
                />
                <button
                  className={`solo-btn ${soundControls[sound].solo ? 'active' : ''}`}
                  onClick={() => updateSoundControl(sound, 'solo', !soundControls[sound].solo)}
                >
                  S
                </button>
                <button
                  className={`mute-btn ${soundControls[sound].mute ? 'active' : ''}`}
                  onClick={() => updateSoundControl(sound, 'mute', !soundControls[sound].mute)}
                >
                  M
                </button>
              </div>
            </div>
            <div className="grid-row">
              {Array.from({ length: steps }, (_, step) => (
                <div
                  key={step}
                  className={`grid-cell ${grid[sound]?.[step] ? 'active' : ''} ${currentStep === step && isPlaying ? 'playhead' : ''}`}
                  onClick={() => toggleCell(sound, step)}
                  data-lovable-id={`grid-cell-${sound}-${step}`}
                />
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="pattern-controls">
        <div className="pattern-management">
            <input
              type="text"
              placeholder="New Pattern Name"
              value={patternName}
              onChange={(e) => setPatternName(e.target.value)}
            />
            <button onClick={savePattern}>Save</button>
        </div>
        <div className="pattern-selection">
            <select value={selectedPattern} onChange={(e) => setSelectedPattern(e.target.value)}>
              <option value="">Load a Pattern</option>
              {patterns.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={loadPattern} disabled={!selectedPattern}>Load</button>
            <button onClick={deletePattern} disabled={!selectedPattern}>Delete</button>
        </div>
      </div>

      <div className="main-actions">
        <button onClick={isPlaying ? stopSequencer : startSequencer}>
          {isPlaying ? 'Stop' : 'Play'}
        </button>
        <button onClick={clearPattern}>Clear Pattern</button>
      </div>
    </div>
  );
};

export default App;