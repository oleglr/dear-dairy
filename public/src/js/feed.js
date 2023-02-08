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

locationBtn.addEventListener("click", (event) => {
  if (!("geolocation" in navigator)) {
    return;
  }
  locationBtn.style.display = "none";
  locationLoader.style.display = "block";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      fetchLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.latitude,
      };
      getGeoLocation(fetchLocation.latitude, fetchLocation.longitude).then(
        (location) => {
          document
            .querySelector("#manual-location")
            .classList.add("is-focused");
          locationBtn.style.display = "inline";
          locationLoader.style.display = "none";
          locationInput.value = `${location.state}, ${location.country}`;
        }
      );
    },
    (err) => {
      console.log("Error with Geolocation: ", err);
      locationBtn.style.display = "inline";
      locationLoader.style.display = "none";
      alert("Couldn't fetch location, please enter manually");
      fetchLocation = { latitude: null, longitude: null };
    },
    { timeout: 10000 }
  );
});

function initializeLocation() {
  if (!("geolocation" in navigator)) {
    locationBtn.style.display = "none";
  }
}

function openCreatePostModal() {
  createPostArea.style.display = "block";
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then((choice) => {
      console.log("User choice", choice.outcome);

      if (choice.outcome === "dismissed") {
        console.log("User cancelled installation");
      } else {
        console.log("User added to home screen");
      }
    });
    deferredPrompt = null;
  }
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
    console.log("Card creation");
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

function onSaveButtonClicked() {
  console.log("Button clicked");
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
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready.then((sw_ref) => {
      const post_data = {
        id: new Date().toISOString(),
        title: titleInput.value,
        body: bodyInput.value,
        location: locationInput.value || "",
      };
      writeData("sync-posts", post_data)
        .then(() => {
          sw_ref.sync.register("sync-new-posts");
        })
        .then(() => {
          var snackbarContainer = document.querySelector("#confirmation-toast");
          var data = { message: "Your Post was saved for syncing!" };
          snackbarContainer.MaterialSnackbar.showSnackbar(data);
        })
        .catch(function (err) {
          console.log(err);
        });
    });
  } else {
    sendData();
  }
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

// fetch(post_url)
//   .then(function (res) {
//     return res.json();
//   })
//   .then(function (data) {
//     network_data_received = true;
//     console.log("From web data: ", data);
//     createCard(data[0]);
//   });

fetch(post_url)
  .then(function (res) {
    return res.json();
  })
  .then(function (data) {
    network_data_received = true;
    console.log("From web", data);
    updateUI(data);
  });

if ("indexedDB" in window) {
  readAllData("posts").then(function (data) {
    if (!network_data_received) {
      console.log("From cache", data);
      updateUI(data);
    }
  });
} else {
  console.log("No index DB");
}
