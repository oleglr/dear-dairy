importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");

const STATIC_CACHE_NAME = "static-v1";
const DYNAMIC_CACHE_NAME = "dynamic-v1";

self.addEventListener("install", (event) => {
  // console.log("[SW v1] Installing service worker...", event);
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache_ref) => {
        // console.log("[SW] Precaching");
        // cache_ref.add("/src/js/app.js");
        // cache_ref.add("/");
        // cache_ref.add("/index.html");
        cache_ref.addAll([
          "/",
          "/src/js/app.js",
          "/src/js/feed.js",
          "/src/js/idb.js",
          "/src/js/utility.js",
          "/src/js/material.min.js",
          "/src/css/app.css",
          "/src/css/feed.css",
          "/src/images/main-image.png",
          "https://fonts.googleapis.com/css?family=Roboto:400,700",
          "https://fonts.googleapis.com/icon?family=Material+Icons",
          "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
        ]);
      })
      .catch((err) => {})
  );
});

var dbPromise = idb.open("posts-store", 1, (db) => {
  if (!db.objectStoreNames.contains("posts")) {
    db.createObjectStore("posts", { keyPath: "id" });
  }
});

self.addEventListener("activate", (event) => {
  // console.log("[SW v1] Activated service worker...", event);
  event.waitUntil(
    caches.keys().then((key_list) => {
      return Promise.all(
        key_list.map((key) => {
          if (key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME) {
            // console.log("[SW] Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  // console.log("[SW v1] Fetch event triggered...", event.request.url);

  // event.respondWith(fetch(event.request));

  // event.respondWith(
  //   caches.match(event.request).then((response) => {
  //     if (response) {
  //       return response;
  //     }
  //     return fetch(event.request)
  //       .then((resp) => {
  //         caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
  //           cache.put(event.request.url, resp.clone());
  //           return resp;
  //         });
  //       })
  //       .catch((err) => {});
  //   })
  // );
  console.log("event.request: ", event.request);
  var selected_url = "http://localhost:3000/posts";
  const { method, url } = event.request;
  if (url.indexOf(selected_url) > -1) {
    if (method === "GET") {
      event.respondWith(
        fetch(event.request).then(function (res) {
          var clonedRes = res.clone();
          clearAllData("posts")
            .then(function () {
              return clonedRes.json();
            })
            .then(function (data) {
              console.log("Data fetched: ", data);
              for (var key in data) {
                writeData("posts", data[key]);
              }
            });
          return res;
        })
      );
    } else {
      event.respondWith(
        fetch(event.request).then(function (res) {
          return res;
        })
      );
    }
  } else {
    event.respondWith(
      caches
        .match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request).then((resp) => {
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(event.request.url, resp.clone());
              return resp;
            });
          });
        })
        .catch((err) => {})
    );
  }
});

self.addEventListener("sync", (event) => {
  console.log("Sync event called");
  let syncing_id = null;
  let response_status = null;
  let post_url = "http://localhost:3000/posts";
  if (event.tag === "sync-new-posts") {
    console.log("[SW] Syncing new post");
    event.waitUntil(
      readAllData("sync-posts").then((data) => {
        console.log("Data in sync db: ", data);
        data.forEach((element) => {
          syncing_id = element.id;
          fetch(post_url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              title: element.title,
              body: element.body,
              location: element.location,
            }),
          })
            .then((resp) => {
              console.log("Sending data to DB");
              return resp.json();
            })
            .then((data) => {
              console.log("Synced data: ", data);
              fetch(post_url)
                .then((resp) => {
                  console.log("Resp in sync: ", resp);
                  response_status = resp.ok;
                  return resp.json();
                })
                .then((data) => {
                  if (response_status) {
                    deleteItemFromData("sync-posts", syncing_id);
                    for (var key in data) {
                      writeData("posts", data[key]);
                    }
                  }
                });
            })
            .catch((err) => {
              console.log("Sync error: ", err);
            });
        });
      })
    );
  }
});
