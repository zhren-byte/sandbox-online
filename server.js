const express = require("express");
const path = require("path");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

let boxes = [];
let users = [];

app.set("view engine", "hbs");
app.set("views", __dirname + "/views");
app.use(express.static(path.join(__dirname + "/public")));

app.get("/admin", (req, res) => {
  res.render("admin", { users });
});
io.on("connection", function (socket) {
  socket.on("addUser", function (data) {
    const { x, y, z, color } = data;
    users.push({ id: socket.id, x, y, z, color });
    socket.emit("newUser", users);
    socket.broadcast.emit("newUser", users);
    socket.emit("allBoxes", boxes);
  });
  socket.on("addBox", function (data) {
    boxes.push(data);
    socket.emit("newBox", data);
    socket.broadcast.emit("newBox", data);
  });
  socket.on("movement", function (data) {
    const user = users.findIndex((u) => u.id === socket.id);
    if (user != -1) {
      users[user].x = data.x;
      users[user].z = data.z;
      socket.broadcast.emit("movement", users[user]);
    }
  });
  socket.on("disconnect", function () {
    users = users.filter((user) => user.id !== socket.id);
    // return console.log(`--> Usuario no autenticado fue desconectado`);
  });
});
server.listen(7777);
