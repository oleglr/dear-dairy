const GEOAPIFY_KEY = "3b7b632ca03240dd9b2fcf24f1cc92a7";

var dbPromise = idb.open("posts-store", 1, function (db) {
  if (!db.objectStoreNames.contains("posts")) {
    db.createObjectStore("posts", { keyPath: "id", autoIncrement: true });
  }
  if (!db.objectStoreNames.contains("sync-posts")) {
    db.createObjectStore("sync-posts", { keyPath: "id", autoIncrement: true });
  }
});

function writeData(st, data) {
  console.log("writeData: ", data);
  return dbPromise.then(function (db) {
    var tx = db.transaction(st, "readwrite");
    var store = tx.objectStore(st);
    store.put(data);
    return tx.complete;
  });
}

function readAllData(st) {
  return dbPromise.then(function (db) {
    var tx = db.transaction(st, "readonly");
    var store = tx.objectStore(st);
    return store.getAll();
  });
}

function clearAllData(st) {
  return dbPromise.then(function (db) {
    var tx = db.transaction(st, "readwrite");
    var store = tx.objectStore(st);
    store.clear();
    return tx.complete;
  });
}

function deleteItemFromData(st, id) {
  dbPromise
    .then(function (db) {
      var tx = db.transaction(st, "readwrite");
      var store = tx.objectStore(st);
      store.delete(id);
      return tx.complete;
    })
    .then(function () {
      // console.log("Item deleted!");
    });
}

function getGeoLocation(latitude, longitude) {
  //https://api.geoapify.com/v1/geocode/reverse?lat=40.758896&lon=-73.985130&format=json&apiKey=YOUR_API_KEY

  const URL = `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${GEOAPIFY_KEY}`;
  console.log("URL gen: ", URL);
  return fetch(URL)
    .then((response) => response.json())
    .then((result) => {
      console.log("Result fetched [0]: ", result.results[0]);
      return {
        state: result.results[0].state,
        country: result.results[0].country,
      };
    })
    .catch((error) => console.log("Geolocation error", error));
}
