var shareImageButton = document.querySelector("#share-image-button");
var createPostArea = document.querySelector("#create-post");
var closeCreatePostModalButton = document.querySelector(
  "#close-create-post-modal-btn"
);
var sharedMomentsArea = document.querySelector("#shared-moments");
var form = document.querySelector("form");
var titleInput = document.querySelector("#title");
var bodyInput = document.querySelector("#body");
var locationInput = document.querySelector("#location");

var locationBtn = document.querySelector("#location-btn");
var locationLoader = document.querySelector("#location-loader");
var fetchLocation;
var post_url = "http://localhost:3000/posts";
var network_data_received = false;

function initializeLocation() {
  if (!("geolocation" in navigator)) {
    locationBtn.style.display = "none";
  }
}

function openCreatePostModal() {
  createPostArea.style.display = "block";
  /** Uncomment to enable installation prompt */
  // if (deferredPrompt) {
  //   deferredPrompt.prompt();

  //   deferredPrompt.userChoice.then((choice) => {
  //     console.log("User choice", choice.outcome);

  //     if (choice.outcome === "dismissed") {
  //       console.log("User cancelled installation");
  //     } else {
  //       console.log("User added to home screen");
  //     }
  //   });
  //   deferredPrompt = null;
  // }
  initializeLocation();
}

function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function updateUI(data) {
  clearCards();
  for (var i = 0; i < data.length; i++) {
    createCard(data[i]);
  }
}

function sendData() {
  fetch("http://localhost:3000/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      title: titleInput.value,
      body: bodyInput.value,
    }),
  })
    .then((resp) => resp.json())
    .then((data) => {
      fetch(post_url)
        .then((resp) => resp.json())
        .then((data) => updateUI(data));
    });
}

function closeCreatePostModal() {
  createPostArea.style.display = "none";
  locationBtn.style.display = "inline";
  locationLoader.style.display = "none";
}

function postHandler(event) {
  event.preventDefault();
  if (titleInput.value.trim() === "" || bodyInput.value.trim() === "") {
    alert("Please enter valid data!");
    return;
  }
  closeCreatePostModal();
  sendData();
}

shareImageButton.addEventListener("click", openCreatePostModal);

closeCreatePostModalButton.addEventListener("click", closeCreatePostModal);

form.addEventListener("submit", postHandler);

function createCard(data) {
  var cardWrapper = document.createElement("div");
  cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
  var cardTitle = document.createElement("div");
  cardTitle.className = "mdl-card__title";
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement("h2");
  cardTitleTextElement.className = "mdl-card__title-text";
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement("div");
  cardSupportingText.className = "mdl-card__supporting-text";
  cardSupportingText.textContent = data.body;
  cardSupportingText.style.textAlign = "justify";
  cardWrapper.appendChild(cardSupportingText);
  var cardLocation = document.createElement("div");
  cardLocation.className = "mdl-card__actions mdl-card--border";
  cardLocation.textContent = data.location;
  cardWrapper.appendChild(cardLocation);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

fetch(post_url)
  .then(function (res) {
    return res.json();
  })
  .then(function (data) {
    network_data_received = true;
    console.log("From web", data);
    updateUI(data);
  });
