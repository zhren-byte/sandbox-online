(function () {
  const socket = io();
  socket.on("serverestart", function () {
    window.location.href = window.location.href;
  });
  document
    .querySelector(".users .kickButton")
    .addEventListener("click", function () {
      let username = document.querySelector(".users .user").innerHTML;
      console.log(username);
    });
})();
