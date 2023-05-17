// Audio elements
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const kick = document.getElementById("kick");
const snare = document.getElementById("snare");
const hihat = document.getElementById("hihat");

// Sequencer sequences
const snareSequence = [null, snare, null, snare, null, snare, null, snare];
const hihatSequence = [hihat, hihat, hihat, hihat, hihat, hihat, hihat, hihat];
const kickSequence = [kick, null, null, null, kick, null, null, null];

// UI elements
const steps = document.querySelectorAll(".step");
const progress = document.getElementById("progress");
const metronomeButton = document.getElementById("metronome-button");

// Metronome click sound
const metronomeClick = new Audio("sounds/metronome.wav");
let metronomeEnabled = false;

// Tempo and play state
let tempo = 120;
let isPlaying = false;
let intervalId;
let currentStep = 0;

// Search button event listener
document.getElementById("search-button").addEventListener("click", searchSamples);

async function searchSamples() {
  const searchInput = document.getElementById("search-input").value;
  const apiKey = "5LxMLSJFbXKWmsmtRgYXIaNprrIvk2HyZqK78T7e";

  // Make the API request to freesound.org
  const response = await fetch(
    `https://freesound.org/apiv2/search/text/?query=${searchInput}&token=${apiKey}&fields=id,name,previews`
  );
  const data = await response.json();

  // Process the search results
  const results = data.results.slice(0, 6);
  displaySearchResults(results);
}


function displaySearchResults(results) {
  // Clear previous results
  const searchResults = document.getElementById("search-results");
  searchResults.innerHTML = "";

  // Display new results
  results.forEach((sample) => {
      // Create new elements
      const sampleName = document.createElement("div");
      sampleName.textContent = sample.name;

      const sampleControl = document.createElement("audio");
      sampleControl.src = sample.previews['preview-lq-mp3'];
      sampleControl.controls = true;

      // Create a new container for each sample
      const sampleContainer = document.createElement("div");
      sampleContainer.className = "sample-container";

      // Append the sample name and controls to the container
      sampleContainer.appendChild(sampleName);
      sampleContainer.appendChild(sampleControl);

      // Append the container to the search results
      searchResults.appendChild(sampleContainer);

      const assignKeyDropdown = document.createElement("select");
      // Add a class or ID for styling
  assignKeyDropdown.className = "assign-key-dropdown";
  const optionDefault = document.createElement("option");
  optionDefault.textContent = "Assign to Key";
  assignKeyDropdown.appendChild(optionDefault);

  // Create options for each key
  const keys = ["q", "w", "e", "r", "t", "y"];
  keys.forEach((key) => {
    const option = document.createElement("option");
    option.textContent = key.toUpperCase();
    option.value = key;
    assignKeyDropdown.appendChild(option);
  });

  assignKeyDropdown.addEventListener("change", (event) => {
    assignSampleToKey(sample.previews['preview-lq-mp3'], event.target.value);
  });

  sampleContainer.appendChild(assignKeyDropdown);
  });
}

const keySampleMap = {};
function assignSampleToKey(sampleUrl, key) {
  keySampleMap[key] = new Audio(sampleUrl);
}


function previewSample(event) {
  var previewUrl = event.target.getAttribute('data-preview');
  if (previewUrl) {
    var audio = new Audio(previewUrl);
    audio.play();
  }
}

window.addEventListener("keydown", (event) => {
  const sampleAudio = keySampleMap[event.key];
  if (sampleAudio) {
    sampleAudio.currentTime = 0;
    sampleAudio.play();
  }
});

console.log("After previewSample definition");

document.querySelector("#sample-search").addEventListener("click", previewSample);

console.log("After event listener setup");


document.getElementById('search-button').addEventListener('click', function() {
  var searchTerm = document.getElementById('search-input').value;
  var results = searchSamples(searchTerm);
  var resultsDiv = document.getElementById('search-results');
  resultsDiv.innerHTML = '';
  for (var i = 0; i < results.length; i++) {
    var button = document.createElement('button');
    button.textContent = 'Sample ' + (i + 1);
    button.setAttribute('data-url', results[i]);
    button.addEventListener('click', previewSample);
    resultsDiv.appendChild(button);
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

// Attach the click event to the metronome button here
document.getElementById("metronome-button").addEventListener("click", toggleMetronome);

function changeTempo(newTempo) {
  tempo = newTempo;
  document.getElementById("tempo-label").textContent = `${newTempo} BPM`;
  if (isPlaying) {
    clearInterval(intervalId); // Stop the current sequence
    startSequence(); // Start a new sequence with the new tempo
  }
}

function play() {
  if (!isPlaying) {
    // Ensuring the audio context is running
    if (audioCtx.state === "suspended") {
      audioCtx.resume().then(() => {
        startSequence();
      });
    } else {
      startSequence();
    }
  }
}

function startSequence() {
  let stepTime = (60 * 1000) / tempo;
  progress.style.width = 0;
  currentStep = 0;
  intervalId = setInterval(() => {
    if (snareSequence[currentStep] && steps[currentStep + 8].classList.contains("active")) {
      snareSequence[currentStep].currentTime = 0;
      snareSequence[currentStep].play();
    }
    if (hihatSequence[currentStep] && steps[currentStep + 16].classList.contains("active")) {
      hihatSequence[currentStep].currentTime = 0;
      hihatSequence[currentStep].play();
    }
    if (kickSequence[currentStep] && steps[currentStep].classList.contains("active")) {
      kickSequence[currentStep].currentTime = 0;
      kickSequence[currentStep].play();
    }

    if (metronomeEnabled) {
      metronomeClick.currentTime = 0;
      metronomeClick.play();
    }

    currentStep = (currentStep + 1) % snareSequence.length;
    progress.style.width = ((currentStep + 1) / snareSequence.length * 100) + "%";
  }, stepTime);
}

// function playSample(url) {
//   let sample = new Audio(url);
//   sample.currentTime = 0;
//   sample.play();
// }

// Add event listeners for drag events on sample elements
let samples = document.querySelectorAll(".sample");
samples.forEach((sample) => {
  sample.addEventListener("dragstart", handleDragStart);
  sample.addEventListener("dragend", handleDragEnd);
});

// Add event listeners for drag events on sequencer steps
steps.forEach((step) => {
  step.addEventListener("dragover", handleDragOver);
  step.addEventListener("dragenter", handleDragEnter);
  step.addEventListener("dragleave", handleDragLeave);
  step.addEventListener("drop", handleDrop);
});

let draggedSample = null;

function handleDragStart(event) {
  draggedSample = this;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", ""); // Required in Firefox for drag to work
}

function handleDragEnd() {
  draggedSample = null;
}

function handleDragOver(event) {
  event.preventDefault();
}

function handleDragEnter(event) {
  event.preventDefault();
  this.classList.add("drag-over");
}

function handleDragLeave() {
  this.classList.remove("drag-over");
}

function handleDrop(event) {
  event.preventDefault();
  this.classList.remove("drag-over");

  // Update the sequencer based on the dropped sample
  let row = Math.floor(currentStep / 8);
  let col = currentStep % 8;

  if (row === 0) {
    kickSequence[col] = draggedSample.id === "kick" ? kick : null;
  } else if (row === 1) {
    snareSequence[col] = draggedSample.id === "snare" ? snare : null;
  } else {
    hihatSequence[col] = draggedSample.id === "hihat" ? hihat : null;
  }
}

// Add event listeners for drag events on sequencer steps
steps.forEach((step) => {
  step.addEventListener("dragover", handleDragOver);
  step.addEventListener("dragenter", handleDragEnter);
  step.addEventListener("dragleave", handleDragLeave);
  step.addEventListener("drop", handleDrop);
});


function pause() {
  clearInterval(intervalId);
  isPlaying = false; // Set the flag to indicate that the sequence is not playing
}

function stop() {
  clearInterval(intervalId);
  currentStep = 0;
  progress.style.width = 0;
  snareSequence.forEach((step) => {
    if (step) {
      step.pause();
      step.currentTime = 0;
    }
  });
  hihatSequence.forEach((step) => {
    if (step) {
      step.pause();
      step.currentTime = 0;
    }
  });
  kickSequence.forEach((step) => {
    if (step) {
      step.pause();
      step.currentTime = 0;
    }
  });
  isPlaying = false; // Set the flag to indicate that the sequence is not playing
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
	var sequencerTab = document.getElementById('sequencer-tab');
	var arrangementTab = document.getElementById('arrangement-tab');
	var sequencerView = document.getElementById('sequencer-view');
	var arrangementView = document.getElementById('arrangement-view');

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



document.addEventListener("DOMContentLoaded", function() {
  const timeline = document.getElementById('timeline');
  const numMeasures = 2;  // or however many measures you want

  for (let i = 0; i < numMeasures; i++) {
    const measure = document.createElement('div');
    measure.classList.add('measure');
    measure.textContent = i + 1;  // label with measure number
    timeline.appendChild(measure);
  }
});


document.addEventListener('keydown', function(event) {
  switch(event.key) {
      case 'q':
          document.getElementById('qwerty-button-1').click();
          break;
      case 'w':
          document.getElementById('qwerty-button-2').click();
          break;
      case 'e':
          document.getElementById('qwerty-button-3').click();
          break;
      case 'r':
          document.getElementById('qwerty-button-4').click();
          break;
      case 't':
          document.getElementById('qwerty-button-5').click();
          break;
      case 'y':
          document.getElementById('qwerty-button-6qq').click();
          break;    
      default:
          break;
  }
});