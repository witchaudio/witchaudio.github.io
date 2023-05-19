const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const el = (type, attr = {}, children = []) => {
  const element = document.createElement(type);
  Object.assign(element, attr);
  children.forEach(child => element.appendChild(child));
  return element;
}

const getAudioElementById = id => document.getElementById(id);
let [kick, snare, hihat] = ["kick", "snare", "hihat"].map(getAudioElementById);

const makeSequence = audio => Array(8).fill(audio);
let [snareSequence, hihatSequence, kickSequence] = [snare, hihat, kick].map(makeSequence);

const steps = document.querySelectorAll(".step");
const metronomeClick = new Audio("sounds/metronome.wav");
let [metronomeEnabled, tempo, isPlaying, currentStep] = [false, 120, false, 0];

let [tracks, keySampleMap, intervalId] = [[[], [], []], {}, null];

document.getElementById("search-button").addEventListener("click", searchSamples);

async function searchSamples() {
  const [searchInput, apiKey] = [document.getElementById("search-input").value, "5LxMLSJFbXKWmsmtRgYXIaNprrIvk2HyZqK78T7e"];
  const response = await fetch(`https://freesound.org/apiv2/search/text/?query=${searchInput}&token=${apiKey}&fields=id,name,previews`);
  const data = await response.json();
  displaySearchResults(data.results.slice(0, 6));
}

function createEl(type, attrs = {}, children = []) {
  const el = document.createElement(type);

  for (const [key, val] of Object.entries(attrs)) {
    el[key === 'text' ? 'textContent' : key] = val;
  }

  children.forEach(child => el.appendChild(child));

  return el;
}

function displaySearchResults(results) {
  const searchResults = document.getElementById("search-results");
  searchResults.innerHTML = "";

  const options = ["Assign to Key", "kick", "snare", "hihat", "q", "w", "e", "r", "t", "y"];

  results.forEach((sample) => {
    const assignDropdown = el('select', {className: 'assign-key-dropdown'},
      options.map(optionText => el('option', {textContent: optionText.toUpperCase(), value: optionText}))
    );

    assignDropdown.addEventListener("change", (event) => {
      assignSample(sample.previews['preview-lq-mp3'], event.target.value);
    });

    const sampleContainer = el('div', 
      {className: 'sample-container', draggable: true, ondragstart: (event) => {
        event.dataTransfer.setData('text/plain', sample.previews['preview-lq-mp3']);
      }}, [
        el('div', {textContent: sample.name}),
        el('audio', {src: sample.previews['preview-lq-mp3'], controls: true}),
        assignDropdown
      ]);

    searchResults.appendChild(sampleContainer);
  });
}

function assignSample(sampleUrl, assignment) {
  const sampleAudio = new Audio(sampleUrl);

  sampleAudio.addEventListener("canplaythrough", () => {
      if(assignment === "kick" || assignment === "snare") {
          let sequence = assignment === "kick" ? kickSequence : snareSequence;
          sequence.fill(null);
          let audio = assignment === "kick" ? kick = sampleAudio : snare = sampleAudio;
          sequence[0] = audio; 
          sequence[4] = audio;

          if (assignment === "snare") {
              sequence[1] = sequence[3] = sequence[5] = sequence[7] = audio;
          }
      } else if(assignment === "hihat") {
          hihatSequence.fill(null);
          hihat = sampleAudio;
          hihatSequence.fill(hihat);
      } else if (assignment.startsWith('Track ')) {
          let trackNumber = parseInt(assignment.split(' ')[1]) - 1;
          tracks[trackNumber].push(sampleAudio);
      } else {
          keySampleMap[assignment] = sampleAudio.cloneNode();
      }
  });

  sampleAudio.onerror = () => console.log('Error loading audio:', sampleAudio.error);
}

const previewSample = (event) => {
  const previewUrl = event.target.getAttribute('data-preview');
  previewUrl && new Audio(previewUrl).play();
}

const playSampleAudio = (event) => {
  const sampleAudio = keySampleMap[event.key];
  if (sampleAudio) {
    sampleAudio.currentTime = 0;
    sampleAudio.play();
  }
}

document.querySelector("#sample-search").addEventListener("click", previewSample);

document.getElementById('search-button').addEventListener('click', function() {
  let searchTerm = document.getElementById('search-input').value;
  let results = searchSamples(searchTerm);
  let resultsDiv = document.getElementById('search-results');
  resultsDiv.innerHTML = '';
  for (let i = 0; i < results.length; i++) {
    let button = document.createElement('button');
    button.textContent = 'Sample ' + (i + 1);
    button.setAttribute('data-url', results[i]);
    button.addEventListener('click', previewSample);
    resultsDiv.appendChild(button);
  }
});

let currentlyPlayingSample;

window.addEventListener("keydown", (event) => {
  if (currentlyPlayingSample) {
    currentlyPlayingSample.pause();
    currentlyPlayingSample.currentTime = 0; // Rewind the audio sample
  }

  const sampleAudio = keySampleMap[event.key];
  if (sampleAudio) {
    currentlyPlayingSample = sampleAudio;
    sampleAudio.currentTime = 0;
    sampleAudio.play();
  }
});

function toggleMetronome() {
  metronomeEnabled = !metronomeEnabled;
  const metronomeButton = document.getElementById("metronome-button");
  if (metronomeEnabled) {
    metronomeButton.textContent = "Metronome Click: ON";
  } else {
    metronomeButton.textContent = "Metronome Click: OFF";
  }
}

document.getElementById("metronome-button").addEventListener("click", toggleMetronome);

function changeTempo(newTempo) {
  tempo = newTempo;
  document.getElementById("tempo-label").textContent = `${newTempo} BPM`;
  if (isPlaying) {
    clearInterval(intervalId); // Stop the current sequence
    startSequence(); // Start a new sequence with the new tempo
  }
}

const play = () => {
  if (isPlaying || audioCtx.state !== "suspended") {
    startSequence();
  } else {
    audioCtx.resume().then(startSequence);
  }
}

const playTrack = (trackNumberStr) => {
  let trackNumber = parseInt(trackNumberStr) - 1;
  
  if (isNaN(trackNumber) || trackNumber < 0 || trackNumber >= tracks.length) {
    return console.error(`Invalid track number: ${trackNumberStr}`);
  }

  let now = audioCtx.currentTime;
  tracks[trackNumber].forEach((sample, index) => {
      let source = audioCtx.createBufferSource();
      source.buffer = sample;
      source.connect(audioCtx.destination);
      source.start(now + index * 0.5); // Change 0.5 to the desired time between samples
  });
}

const startSequence = () => {
  console.log("Starting sequence with tempo:", tempo);
  let stepTime = (60 * 1000) / tempo;
  progress.style.width = 0;
  currentStep = 0;

  const playSound = (sequence, step) => {
    if(sequence[step] && steps[step + (sequence == snareSequence ? 8 : sequence == hihatSequence ? 16 : 0)].classList.contains("active")){
      let sound = new Audio(sequence[step].src);
      sound.play();
    }
  };

  intervalId = setInterval(() => {
    [snareSequence, hihatSequence, kickSequence].forEach(seq => playSound(seq, currentStep));

    if (metronomeEnabled) {
      let metronomeSound = new Audio(metronomeClick.src);
      metronomeSound.play();
    }

    currentStep = (currentStep + 1) % snareSequence.length;
    progress.style.width = ((currentStep + 1) / snareSequence.length * 100) + "%";
  }, stepTime);
}

// Add event listeners for drag events on sample elements
let samples = document.querySelectorAll(".sample");
samples.forEach((sample) => {
  sample.addEventListener("dragstart", handleDragStart);
  sample.addEventListener("dragend", handleDragEnd);
});

let draggedSample = null;

// Common handler for drag events
const handleDragEvent = (event, callback) => {
  event.preventDefault();
  callback && callback(event);
};

steps.forEach((step) => {
  step.addEventListener("dragover", event => handleDragEvent(event));
  step.addEventListener("dragenter", event => handleDragEvent(event, () => step.classList.add("drag-over")));
  step.addEventListener("dragleave", () => step.classList.remove("drag-over"));
  step.addEventListener("drop", event => handleDragEvent(event, () => handleDrop(step)));
});

function handleDragStart(event) {
  draggedSample = this;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", ""); // Required in Firefox for drag to work
}

function handleDragEnd() {
  draggedSample = null;
}

function handleDrop(step) {
  step.classList.remove("drag-over");

  const [kickSequence, snareSequence, hihatSequence] = [kick, snare, hihat].map(sample => draggedSample.id === sample.id ? sample : null);
  const row = Math.floor(currentStep / 8);
  const col = currentStep % 8;
  
  if(row === 0) kickSequence[col] = kickSequence;
  if(row === 1) snareSequence[col] = snareSequence;
  if(row > 1) hihatSequence[col] = hihatSequence;
}

function stop() {
  clearInterval(intervalId);
  currentStep = 0;
  progress.style.width = 0;
  isPlaying = false;

  const reloadSamples = (sequence) => {
    sequence.forEach((step, index) => {
      if (step) sequence[index] = new Audio(step.src);
    });
  };

  // Reload all samples
  ['snareSequence', 'hihatSequence', 'kickSequence'].forEach(seq => reloadSamples(window[seq]));
}

function clearSelection() {
  steps.forEach((step) => {
    step.classList.remove("active");
  });
  kickSequence.fill(null);
  snareSequence.fill(null);
  hihatSequence.fill(null);
}

steps.forEach((step, index) => {
  step.addEventListener("click", () => {
    step.classList.toggle("active");
    let row = Math.floor(index / 8);
    let col = index % 8;
    if (step.classList.contains("active")) {
      if (row === 0) {
        kickSequence[col] = kick;
      } else if (row === 1) {
        snareSequence[col] = snare;
      } else {
        hihatSequence[col] = hihat;
      }
    } else {
      if (row === 0) {
        kickSequence[col] = null;
      } else if (row === 1) {
        snareSequence[col] = null;
      } else {
        hihatSequence[col] = null;
      }
    }
  });
}); 

window.onload = function() {
	let sequencerTab = document.getElementById('sequencer-tab');
	let arrangementTab = document.getElementById('arrangement-tab');
	let sequencerView = document.getElementById('sequencer-view');
	let arrangementView = document.getElementById('arrangement-view');

	sequencerTab.onclick = function() {
		sequencerView.style.display = 'block';
		arrangementView.style.display = 'none';
	}

	arrangementTab.onclick = function() {
		sequencerView.style.display = 'none';
		arrangementView.style.display = 'block';
	}
}
function switchTo(view) {
  document.getElementById('sequencer-view').style.display = view === 'sequencer' ? 'block' : 'none';
  document.getElementById('arrangement-view').style.display = view === 'arrangement' ? 'block' : 'none';
}

document.addEventListener("DOMContentLoaded", () => 
  Array.from({ length: 2 }, (_, i) => i + 1).forEach(measureNum => 
    document.getElementById('timeline').appendChild(
      Object.assign(document.createElement('div'), {
        className: 'measure',
        textContent: measureNum
      })
    )
  )
);

const keyToButtonId = {
  'q': 'qwerty-button-1',
  'w': 'qwerty-button-2',
  'e': 'qwerty-button-3',
  'r': 'qwerty-button-4',
  't': 'qwerty-button-5',
  'y': 'qwerty-button-6'
};

document.addEventListener('keydown', function(event) {
  let buttonId = keyToButtonId[event.key];
  if (buttonId) {
    document.getElementById(buttonId).click();
  }
});

const allowDrop = event => event.preventDefault();

const dropSample = event => {
  event.preventDefault();
  const sampleUrl = event.dataTransfer.getData('text');
  assignSample(sampleUrl, event.currentTarget.id);
};

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll(".track").forEach(track => {
    track.ondragover = allowDrop;
    track.ondrop = dropSample;
  });
});
