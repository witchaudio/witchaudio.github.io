let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let kick = document.getElementById("kick");
let snare = document.getElementById("snare");
let hihat = document.getElementById("hihat");

let snareSequence = [null, snare, null, snare, null, snare, null, snare];
let hihatSequence = [hihat, hihat, hihat, hihat, hihat, hihat, hihat, hihat];
let kickSequence = [kick, null, null, null, kick, null, null, null];

let steps = document.querySelectorAll(".step");
let progress = document.getElementById("progress");
let intervalId;
let currentStep = 0;

let metronomeClick = new Audio("sounds/metronome.wav");
let metronomeEnabled = false;

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

let tempo = 120; // Default tempo
let isPlaying = false; // Flag to track if the sequence is playing

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

function playSample(url) {
  let sample = new Audio(url);
  sample.currentTime = 0;
  sample.play();
}


  

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

let playButton = document.getElementById("play");
playButton.addEventListener("click", play);

let pauseButton = document.getElementById("pause");
pauseButton.addEventListener("click", pause);

let stopButton = document.getElementById("stop");
stopButton.addEventListener("click", stop);
