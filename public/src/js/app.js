var deferredPrompt;

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js", { scope: "/" }).then(() => {
    // console.log("Service worker registered");
  });
}

window.addEventListener("beforeinstallprompt", (event) => {
  // console.log("Before install prompt fired");
  event.preventDefault();
  deferredPrompt = event;
  return false;
});
