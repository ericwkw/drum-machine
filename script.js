
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const gridContainer = document.querySelector('.grid-container');
    const playStopBtn = document.getElementById('play-stop-btn');
    const clearBtn = document.getElementById('clear-btn');
    const tempoSlider = document.getElementById('tempo-slider');
    const tempoValue = document.getElementById('tempo-value');
    const stepsSlider = document.getElementById('steps-slider');
    const stepsValue = document.getElementById('steps-value');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeValue = document.getElementById('volume-value');

    // --- State Variables ---
    const sounds = ['Kick', 'Snare', 'Hi-Hat', 'Crash', 'Toms', 'Clap'];
    const soundFiles = {
        'Kick': '/sounds/kick.wav',
        'Snare': '/sounds/snare.wav',
        'Hi-Hat': '/sounds/hihat.wav',
        'Crash': '/sounds/crash.wav',
        'Toms': '/sounds/tom.wav',
        'Clap': '/sounds/clap.wav'
    };
    let steps = parseInt(stepsSlider.value);
    let gridState = [];
    let audioContext;
    const audioBuffers = {};
    let mainGainNode;
    const soundGainNodes = {}; // Individual gain nodes for each sound
    let soloedSound = null;
    const mutedSounds = new Set();
    let isPlaying = false;
    let currentStep = 0;
    let tempo = parseInt(tempoSlider.value);
    let nextStepTime = 0.0;
    let lookahead = 25.0;
    let scheduleAheadTime = 0.1;
    let timerID;
    let lastStepDrawn = -1;
    const notesInQueue = [];

    // --- Grid Generation ---
    function createGrid() {
        gridContainer.innerHTML = '';
        const oldGridState = [...gridState];
        gridState = [];
        // Responsive grid layout
        const isNarrow = window.innerWidth <= 768;
        const controlWidth = isNarrow ? '200px' : '250px';
        gridContainer.style.gridTemplateColumns = `${controlWidth} repeat(${steps}, 1fr)`;
        gridContainer.style.gridTemplateRows = `repeat(${sounds.length}, 1fr)`;

        sounds.forEach((sound, rowIndex) => {
            const newRow = new Array(steps).fill(false);
            if (oldGridState[rowIndex]) {
                // Copy over the old steps that still fit
                const oldRow = oldGridState[rowIndex];
                for (let i = 0; i < Math.min(steps, oldRow.length); i++) {
                    newRow[i] = oldRow[i];
                }
            }
            gridState.push(newRow);

            // Create sound row container
            const soundRow = document.createElement('div');
            soundRow.classList.add('sound-row');
            
            const soundLabel = document.createElement('div');
            soundLabel.classList.add('sound-label');
            soundLabel.textContent = sound;
            soundRow.appendChild(soundLabel);

            // Add solo/mute buttons
            const soloBtn = document.createElement('button');
            soloBtn.textContent = 'S';
            soloBtn.classList.add('solo-btn');
            soloBtn.dataset.sound = sound;
            soundRow.appendChild(soloBtn);

            const muteBtn = document.createElement('button');
            muteBtn.textContent = 'M';
            muteBtn.classList.add('mute-btn');
            muteBtn.dataset.sound = sound;
            soundRow.appendChild(muteBtn);
            
            // Add individual volume control
            const volumeControl = document.createElement('div');
            volumeControl.classList.add('sound-volume-control');
            
            const volumeSlider = document.createElement('input');
            volumeSlider.type = 'range';
            volumeSlider.min = '0';
            volumeSlider.max = '1';
            volumeSlider.step = '0.01';
            volumeSlider.value = '0.8';
            volumeSlider.classList.add('sound-volume-slider');
            volumeSlider.dataset.sound = sound;
            
            volumeControl.appendChild(volumeSlider);
            soundRow.appendChild(volumeControl);
            
            gridContainer.appendChild(soundRow);

            for (let colIndex = 0; colIndex < steps; colIndex++) {
                const cell = document.createElement('div');
                cell.classList.add('grid-cell');
                if (gridState[rowIndex][colIndex]) {
                    cell.classList.add('active');
                }
                cell.dataset.row = rowIndex;
                cell.dataset.col = colIndex;
                gridContainer.appendChild(cell);
            }
        });
    }

    // --- Audio Setup ---
    function setupAudio() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        mainGainNode = audioContext.createGain();
        mainGainNode.gain.value = volumeSlider.value;
        mainGainNode.connect(audioContext.destination);
        
        // Create individual gain nodes for each sound
        sounds.forEach(sound => {
            soundGainNodes[sound] = audioContext.createGain();
            soundGainNodes[sound].gain.value = 0.8; // Default volume
            soundGainNodes[sound].connect(mainGainNode);
            loadSound(sound, soundFiles[sound]);
        });
    }

    async function loadSound(soundName, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            audioBuffers[soundName] = await audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error(`Error loading sound ${soundName}:`, error);
        }
    }

    function playSound(buffer, time, soundName) {
        if (!audioContext) return;

        if (soloedSound && soloedSound !== soundName) return;
        if (mutedSounds.has(soundName)) return;

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(soundGainNodes[soundName]);
        source.start(time);
    }

    // --- Sequencer Logic ---
    function nextNote() {
        const secondsPerBeat = 60.0 / tempo;
        nextStepTime += 0.25 * secondsPerBeat;
        currentStep = (currentStep + 1) % steps;
    }

    function scheduleNote(step, time) {
        notesInQueue.push({ note: step, time: time });
        for (let i = 0; i < sounds.length; i++) {
            if (gridState[i][step]) {
                playSound(audioBuffers[sounds[i]], time, sounds[i]);
            }
        }
    }

    function scheduler() {
        while (nextStepTime < audioContext.currentTime + scheduleAheadTime) {
            scheduleNote(currentStep, nextStepTime);
            nextNote();
        }
        timerID = window.setTimeout(scheduler, lookahead);
    }

    function draw() {
        if (!isPlaying) {
            const lastCells = document.querySelectorAll(`.grid-cell[data-col='${lastStepDrawn}']`);
            lastCells.forEach(c => c.classList.remove('playhead'));
            lastStepDrawn = -1;
        } else {
            let currentNote = lastStepDrawn;
            const currentTime = audioContext.currentTime;

            while (notesInQueue.length && notesInQueue[0].time < currentTime) {
                currentNote = notesInQueue[0].note;
                notesInQueue.shift();
            }

            if (lastStepDrawn !== currentNote) {
                const lastCells = document.querySelectorAll(`.grid-cell[data-col='${lastStepDrawn}']`);
                lastCells.forEach(c => c.classList.remove('playhead'));

                const currentCells = document.querySelectorAll(`.grid-cell[data-col='${currentNote}']`);
                currentCells.forEach(c => c.classList.add('playhead'));

                lastStepDrawn = currentNote;
            }
        }

        requestAnimationFrame(draw);
    }

    function togglePlayback() {
        if (isPlaying) {
            window.clearTimeout(timerID);
            playStopBtn.textContent = 'Play';
            notesInQueue.length = 0;
        } else {
            if (!audioContext) setupAudio();
            if (audioContext.state === 'suspended') audioContext.resume();
            currentStep = 0;
            nextStepTime = audioContext.currentTime;
            scheduler();
            playStopBtn.textContent = 'Stop';
        }
        isPlaying = !isPlaying;
    }

    // --- Event Listeners ---
    gridContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('grid-cell')) {
            e.target.classList.toggle('active');
            const row = e.target.dataset.row;
            const col = e.target.dataset.col;
            gridState[row][col] = !gridState[row][col];
        } else if (e.target.classList.contains('solo-btn')) {
            const soundName = e.target.dataset.sound;
            if (soloedSound === soundName) {
                soloedSound = null;
                e.target.classList.remove('active');
            } else {
                soloedSound = soundName;
                document.querySelectorAll('.solo-btn.active').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            }
        } else if (e.target.classList.contains('mute-btn')) {
            const soundName = e.target.dataset.sound;
            if (mutedSounds.has(soundName)) {
                mutedSounds.delete(soundName);
                e.target.classList.remove('active');
            } else {
                mutedSounds.add(soundName);
                e.target.classList.add('active');
            }
        }
    });

    clearBtn.addEventListener('click', () => {
        document.querySelectorAll('.grid-cell.active').forEach(cell => cell.classList.remove('active'));
        gridState = gridState.map(row => row.map(() => false));
    });

    stepsSlider.addEventListener('input', () => {
        const newSteps = parseInt(stepsSlider.value);
        if (newSteps !== steps) {
            steps = newSteps;
            stepsValue.textContent = `${steps} Steps`;
            createGrid();
        }
    });

    tempoSlider.addEventListener('input', () => {
        tempo = parseInt(tempoSlider.value);
        tempoValue.textContent = `${tempo} BPM`;
    });

    volumeSlider.addEventListener('input', () => {
        if(mainGainNode) mainGainNode.gain.value = volumeSlider.value;
        volumeValue.textContent = `${Math.round(volumeSlider.value * 100)}%`;
    });

    // Individual sound volume controls
    gridContainer.addEventListener('input', (e) => {
        if (e.target.classList.contains('sound-volume-slider')) {
            const soundName = e.target.dataset.sound;
            const volume = parseFloat(e.target.value);
            
            if (soundGainNodes[soundName]) {
                soundGainNodes[soundName].gain.value = volume;
            }
        }
    });

    playStopBtn.addEventListener('click', togglePlayback);

    // --- Responsive Logic ---
    function handleResize() {
        const width = window.innerWidth;
        let maxSteps;

        if (width <= 480) {
            maxSteps = 8;
        } else if (width <= 768) {
            maxSteps = 16;
        } else {
            maxSteps = 32;
        }
        
        if (parseInt(stepsSlider.max) !== maxSteps) {
            stepsSlider.max = maxSteps;
        }

        if (steps > maxSteps) {
            steps = maxSteps;
            stepsSlider.value = maxSteps;
            stepsValue.textContent = `${steps} Steps`;
            createGrid();
        } else {
            // Recreate grid to apply responsive styling
            createGrid();
        }
    }

    window.addEventListener('resize', handleResize);

    // --- Initial Setup ---
    createGrid();
    handleResize(); // Call on initial load
    requestAnimationFrame(draw);
});
