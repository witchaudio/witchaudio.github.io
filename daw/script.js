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

function play() {
    let stepTime = 60 / 120;
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
      currentStep = (currentStep + 1) % snareSequence.length;
      progress.style.width = ((currentStep + 1) / snareSequence.length * 100) + "%";
    }, stepTime * 1000);
  }
  

function pause() {
  clearInterval(intervalId);
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

let playButton = document.getElementById("play-button");
playButton.addEventListener("click", play);
