// JavaScript (app.js)
function showPasswordInput(downloadLink) {
    const passwordContainer = document.getElementById("password-container");
    passwordContainer.style.display = 'block'; // Make the container visible

    // Clear any previous password inputs
    passwordContainer.innerHTML = "";

    // Create the password input and submit button
    const passwordInput = document.createElement("input");
    passwordInput.type = "password";
    passwordInput.placeholder = "Enter Password";
    passwordInput.id = "password"; // It's good practice to have an id
    const submitButton = document.createElement("button");
    submitButton.textContent = "Submit";
    submitButton.onclick = function () {
        checkPassword(downloadLink);
    };

    // Append the password input and submit button to the container
    passwordContainer.appendChild(passwordInput);
    passwordContainer.appendChild(submitButton);
}





function checkPassword(downloadLink) {
    const passwordInput = document.querySelector("#password-container input");
    const password = passwordInput.value;

    // Replace 'your_password_here' with your actual password
    if (password === "sexysample") {
        // Redirect to the download link if the password is correct
        window.location.href = downloadLink;
    } else {
        alert("Incorrect password. Please try again.");
    }
}

// Function for Unsplash random images
function getRandomImage(cardElement) {
    const accessKey = 'l4uFNRPBfuIoNhv93AN8KbrUOQAtO-56gXEPT6hRLj8';
    const orientation = 'portrait'; // You can adjust the orientation as needed (landscape, portrait, etc.)
    const apiUrl = `https://api.unsplash.com/photos/random?orientation=${orientation}&client_id=${accessKey}`;

    console.log('Fetching a random image...'); // Log when fetching starts

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Fetch error: ${response.status} - ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Data from Unsplash API:', data); // Log API response data

            // Get the image URL from the API response
            const imageUrl = data.urls.regular;

            // Set the background image of the card-image element
            const cardImage = cardElement.querySelector('.card-image');
            console.log('Setting background image to:', imageUrl); // Log the image URL
            cardImage.style.backgroundImage = `url(${imageUrl})`;
        })
        .catch(error => {
            console.error('Error fetching random image:', error);
        });
}


// Select card elements using querySelectorAll
const cardElements = document.querySelectorAll('.card');

// Iterate through each card element and call getRandomImage
cardElements.forEach(cardElement => {
    getRandomImage(cardElement);
});

document.addEventListener('DOMContentLoaded', (event) => {
    const carousel = document.getElementById('carousel');
    let offset = 0;
  
    document.getElementById('prev').addEventListener('click', () => {
      if (offset < 0) {
        offset += 300; // Width of the card plus margin
        carousel.style.transform = `translateX(${offset}px)`;
      }
    });
  
    document.getElementById('next').addEventListener('click', () => {
      if (offset > -(300 * (document.querySelectorAll('.card').length - 1))) {
        offset -= 300; // Width of the card plus margin
        carousel.style.transform = `translateX(${offset}px)`;
      }
    });
  });
  
