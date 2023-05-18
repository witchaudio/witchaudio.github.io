// Audio elements
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let kick = document.getElementById("kick");
let snare = document.getElementById("snare");
let hihat = document.getElementById("hihat");



// Sequencer sequences
const snareSequence = [snare, snare, snare, snare, snare, snare, snare, snare];
const hihatSequence = [hihat, hihat, hihat, hihat, hihat, hihat, hihat, hihat];
const kickSequence = [kick, kick, kick, kick, kick, kick, kick, kick];

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
  // console.log("Search results data:", data);

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

    const assignDropdown = document.createElement("select");
    assignDropdown.className = "assign-key-dropdown";

    // Create options for each key and instruments
    const options = ["Assign to Key", "kick", "snare", "hihat", "q", "w", "e", "r", "t", "y"];
    options.forEach((optionText) => {
      const option = document.createElement("option");
      option.textContent = optionText.toUpperCase();
      option.value = optionText;
      assignDropdown.appendChild(option);
    });

    assignDropdown.addEventListener("change", (event) => {
      assignSample(sample.previews['preview-lq-mp3'], event.target.value);
    });

    sampleContainer.appendChild(assignDropdown);
  });
}

const keySampleMap = {};

function assignSample(sampleUrl, assignment) {
  // console.log("Assigning sample:", sampleUrl, "to:", assignment);

  // console.log('Assignment:', assignment);  // Check the assignment

  let sampleAudio = new Audio(sampleUrl);

  sampleAudio.addEventListener("canplaythrough", function() { 
    // Wait until the audio is loaded before making assignments
    // console.log("Audio loaded:", sampleUrl);

    if(assignment === "kick") {
      kickSequence.fill(null);
      kick = sampleAudio;
      kickSequence[0] = kick; 
      kickSequence[4] = kick;
      // console.log('Kick sequence:', kickSequence);  // Check the kick sequence
    } else if(assignment === "snare") {
      snareSequence.fill(null);
      snare = sampleAudio;
      snareSequence[1] = snare;
      snareSequence[3] = snare;
      snareSequence[5] = snare;
      snareSequence[7] = snare;
      // console.log('Snare sequence:', snareSequence);  // Check the snare sequence
    } else if(assignment === "hihat") {
      hihatSequence.fill(null);
      hihat = sampleAudio;
      hihatSequence.fill(hihat);
      // console.log('Hi-hat sequence:', hihatSequence);  // Check the hi-hat sequence
    } else {
      keySampleMap[assignment] = sampleAudio;
      // console.log("Sample assigned to:", assignment);
    }
  });

  sampleAudio.onerror = function() {
    console.log('Error loading audio:', sampleAudio.error);  // Check for errors loading the audio
  }
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

// console.log("After previewSample definition");

document.querySelector("#sample-search").addEventListener("click", previewSample);

// console.log("After event listener setup");


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
  console.log("Starting sequence with tempo:", tempo);
  let stepTime = (60 * 1000) / tempo;
  progress.style.width = 0;
  currentStep = 0;
  intervalId = setInterval(() => {
    // console.log("Current step:", currentStep);
    if (snareSequence[currentStep] && steps[currentStep + 8].classList.contains("active")) {
      // console.log("Playing snare sound on step:", currentStep);
      let snareSound = new Audio(snareSequence[currentStep].src);
      snareSound.play();
    }
    if (hihatSequence[currentStep] && steps[currentStep + 16].classList.contains("active")) {
      // console.log("Playing hihat sound on step:", currentStep);
      let hihatSound = new Audio(hihatSequence[currentStep].src);
      hihatSound.play();
    }
    if (kickSequence[currentStep] && steps[currentStep].classList.contains("active")) {
      // console.log("Playing kick sound on step:", currentStep);
      let kickSound = new Audio(kickSequence[currentStep].src);
      kickSound.play();
    }

    if (metronomeEnabled) {
      // console.log("Playing metronome sound on step:", currentStep);
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

  // Reload snare samples
  snareSequence.forEach((step, index) => {
    if (step) {
      let snareSound = new Audio(step.src);
      snareSequence[index] = snareSound;
    }
  });
  
  // Reload hihat samples
  hihatSequence.forEach((step, index) => {
    if (step) {
      let hihatSound = new Audio(step.src);
      hihatSequence[index] = hihatSound;
    }
  });
  
  // Reload kick samples
  kickSequence.forEach((step, index) => {
    if (step) {
      let kickSound = new Audio(step.src);
      kickSequence[index] = kickSound;
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

function reloadSamples() {
  // Reload snare samples
  snareSequence.forEach((step, index) => {
    if (step) {
      let snareSound = new Audio(step.src);
      snareSequence[index] = snareSound;
      console.log("Snare sample reloaded at index:", index);  // Add console log here
    }
  });
  
  // Reload hihat samples
  hihatSequence.forEach((step, index) => {
    if (step) {
      let hihatSound = new Audio(step.src);
      hihatSequence[index] = hihatSound;
      console.log("Hihat sample reloaded at index:", index);  // Add console log here
    }
  });
  
  // Reload kick samples
  kickSequence.forEach((step, index) => {
    if (step) {
      let kickSound = new Audio(step.src);
      kickSequence[index] = kickSound;
      console.log("Kick sample reloaded at index:", index);  // Add console log here
    }
  });

  console.log("All samples reloaded");  // Final log to confirm all samples were reloaded
}


// Add a button to reload the samples
const reloadButton = document.createElement("reload");
// reloadButton.textContent = "Reload Samples";
document.body.appendChild(reloadButton);

// Add event listener
reloadButton.addEventListener("click", reloadSamples);


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