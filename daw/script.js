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

  const options = ["Assign to Key", "Track 1", "Track 2", "Track 3", "kick", "snare", "hihat", "q", "w", "e", "r", "t", "y"];

  results.forEach((sample) => {
    const assignDropdown = el('select', {className: 'assign-key-dropdown'},
      options.map(optionText => el('option', {textContent: optionText.toUpperCase(), value: optionText}))
    );

    assignDropdown.addEventListener("change", (event) => {
      assignSample(sample.previews['preview-lq-mp3'], event.target.value);
    });

    const sampleContainer = el('div', 
  {className: 'sample-container', draggable: true, ondragstart: (event) => {
    event.dataTransfer.setData('text/plain', JSON.stringify({
      url: sample.previews['preview-lq-mp3'],
      name: sample.name
    }));
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
        if(!isNaN(trackNumber)) {
          tracks[trackNumber].fill(null);
          tracks[trackNumber][0] = sampleAudio;
        } 
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

const startSequence = () => {
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

      tracks.forEach(track => {
        let sample = track[currentStep];
        if(sample) {
          let sound = new Audio(sample.src);
          sound.play();
        }
      });

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

function addSampleToSequence(sequence, step) {
  let sample = sequence[step];
  if (sample) {
      let sound = new Audio(sample.src);
      sound.play();
  }
}

const soloTrack = (trackNumberStr) => {
  let trackNumber = parseInt(trackNumberStr) - 1;

  if (isNaN(trackNumber) || trackNumber < 0 || trackNumber >= tracks.length) {
    return console.error(`Invalid track number: ${trackNumberStr}`);
  }

  // Mute all other tracks
  tracks.forEach((track, index) => {
    if (index !== trackNumber) {
      track.forEach(sample => sample.muted = true);
    } else {
      track.forEach(sample => sample.muted = false);
    }
  });
}

const muteTrack = (trackNumberStr) => {
  let trackNumber = parseInt(trackNumberStr) - 1;

  if (isNaN(trackNumber) || trackNumber < 0 || trackNumber >= tracks.length) {
    return console.error(`Invalid track number: ${trackNumberStr}`);
  }

  // Mute the specified track
  tracks[trackNumber].forEach(sample => sample.muted = true);
}

const play = () => {
  if (isPlaying) return;
  if (audioCtx.state === "suspended") {
    audioCtx.resume().then(startSequence);
  } else {
    startSequence();
  }
}

const playTrack = (track, step) => {
  let sample = track[step];
  if (sample) {
    let sound = new Audio(sample.src);
    sound.play();
  }
};

function stop() {
  clearInterval(intervalId);
  currentStep = 0;
  progress.style.width = 0;
  isPlaying = false;
  audioCtx.suspend();
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
  const sampleData = JSON.parse(event.dataTransfer.getData('text'));
  const trackElement = event.currentTarget;
  trackElement.querySelector(".sample-name").textContent = sampleData.name;
  assignSample(sampleData.url, trackElement.id);
};

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll(".track").forEach(track => {
    track.ondragover = allowDrop;
    track.ondrop = dropSample;
  });
});

window.addEventListener("click", () => {
  if (audioCtx.state === "suspended") audioCtx.resume();
});