const CanvasContextSingleton = (function () {
  let instance;

  function createInstance() {
    const context = canvas.getContext("2d");
    return context;
  }

  return {
    getInstance: function () {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    },
  };
})();

// Uso del Singleton para obtener el contexto del canvas
const ctx = CanvasContextSingleton.getInstance();
(function () {
  const socket = io();
  let playerHeight = 172;
  let x = -200;
  let y = 0;
  let z = -200;
  socket.emit("addUser", {
    x,
    y,
    z,
    color: "#ff0000",
  });
  let left = false;
  let right = false;
  let up = false;
  let down = false;

  let cameradown = false;
  let cameraup = false;

  let crouch = false;

  let fpang = 0;
  let quadsToDraw = [];

  let boxes = [];
  let users = [];

  let centerOfScreenX = canvas.width / 2;
  let centerOfScreenY = canvas.height / 2;

  let wireframe = false;

  window.onload = function () {
    document.addEventListener("keydown", keydown);
    document.addEventListener("keyup", keyup);
  };

  function update() {
    gameLogic();
    draw();
    requestAnimationFrame(update);
  }

  // Example: fpDrawPillar(100, 0, 300, 50, 300, 50);
  function fpDrawPillar(prX, prY, prZ, prW, prH, prL, put) {
    const propEnds = 0.03;
    const propIn = 0.6;

    prY = playerHeight - prH - prY;

    if (wireframe || put) {
      drawPrism(prX, prY, prZ, prW, prH * propEnds, prL);
      drawPrism(
        prX + (prW * (1 - propIn)) / 2,
        prY + prH * propEnds,
        prZ + (prL * (1 - propIn)) / 2,
        prW * propIn,
        prH - prH * propEnds,
        prL * propIn
      );
      drawPrism(prX, prY + prH - prH * propEnds, prZ, prW, prH * propEnds, prL);
      return;
    }

    fillPrism(
      prX + (prW * (1 - propIn)) / 2,
      prY + prH * propEnds,
      prZ + (prL * (1 - propIn)) / 2,
      prW * propIn,
      prH - prH * propEnds,
      prL * propIn
    );

    // const col = hexToRgb(ctx.fillStyle);

    // ctx.fillStyle = ctx.fillStyle =
    //   "rgb(" +
    //   parseInt(col.r / 2) +
    //   ", " +
    //   parseInt(col.g / 2) +
    //   ", " +
    //   parseInt(col.b / 2) +
    //   ")";
    fillPrism(prX, prY, prZ, prW, prH * propEnds, prL);
    fillPrism(prX, prY + prH - prH * propEnds, prZ, prW, prH * propEnds, prL);
  }

  function fpDrawSquare(prX, prY, prZ, prW, prH, prL, put) {
    const propEnds = 0.1;
    const propIn = 0.9;

    prY = playerHeight - prH - prY;

    if (wireframe || put)
      return drawPrism(
        prX + (prW * (1 - propIn)) / 2,
        prY + prH * propEnds,
        prZ + (prL * (1 - propIn)) / 2,
        prW * propIn,
        prH - prH * propEnds,
        prL * propIn
      );

    fillPrism(
      prX + (prW * (1 - propIn)) / 2,
      prY + prH * propEnds,
      prZ + (prL * (1 - propIn)) / 2,
      prW * propIn,
      prH - prH * propEnds,
      prL * propIn
    );
  }
  function fpDrawSphere(centerX, centerY, centerZ, radius, segments) {
    const phiDelta = Math.PI / segments;
    const thetaDelta = (Math.PI * 2) / segments;

    for (let phi = 0; phi <= Math.PI; phi += phiDelta) {
      for (let theta = 0; theta < Math.PI * 2; theta += thetaDelta) {
        const x = centerX + radius * Math.sin(phi) * Math.cos(theta);
        const y = (centerY+100) + radius * Math.cos(phi);
        const z = centerZ + radius * Math.sin(phi) * Math.sin(theta);

        const nextPhi = phi + phiDelta;
        const nextTheta = theta + thetaDelta;

        const xNext =
          centerX + radius * Math.sin(nextPhi) * Math.cos(nextTheta);
        const yNext = (centerY+100) + radius * Math.cos(nextPhi);
        const zNext =
          centerZ + radius * Math.sin(nextPhi) * Math.sin(nextTheta);

        // Dibujar un triángulo entre (x, y, z), (xNext, yNext, zNext) y el centro
        draw3dQuad(centerX, (centerY+100), centerZ, x, y, z, xNext, yNext, zNext);
      }
    }
  }
  function fpDrawPyramid(prX, prY, prZ, baseSize, height) {
    const halfBase = baseSize / 2;

    const top = { x: prX, y: (prY + 100) - height, z: prZ };
    const frontLeft = { x: prX - halfBase, y: (prY + 100), z: prZ + halfBase };
    const frontRight = { x: prX + halfBase, y: (prY + 100), z: prZ + halfBase };
    const backLeft = { x: prX - halfBase, y: (prY + 100), z: prZ - halfBase };
    const backRight = { x: prX + halfBase, y: (prY + 100), z: prZ - halfBase };
    // Cara base
    draw3dQuad(
      frontLeft.x,
      frontLeft.y,
      frontLeft.z,
      frontRight.x,
      frontRight.y,
      frontRight.z,
      backRight.x,
      backRight.y,
      backRight.z,
      backLeft.x,
      backLeft.y,
      backLeft.z
    );

    // Caras laterales
    ctx.fillStyle = "red";
    draw3dQuad(
      top.x,
      top.y,
      top.z,
      frontLeft.x,
      frontLeft.y,
      frontLeft.z,
      frontRight.x,
      frontRight.y,
      frontRight.z,
      top.x,
      top.y,
      top.z
    );
    ctx.fillStyle = "blue";
    draw3dQuad(
      top.x,
      top.y,
      top.z,
      frontRight.x,
      frontRight.y,
      frontRight.z,
      backRight.x,
      backRight.y,
      backRight.z,
      top.x,
      top.y,
      top.z
    );
    ctx.fillStyle = "green";
    draw3dQuad(
      top.x,
      top.y,
      top.z,
      backRight.x,
      backRight.y,
      backRight.z,
      backLeft.x,
      backLeft.y,
      backLeft.z,
      top.x,
      top.y,
      top.z
    );
    ctx.fillStyle = "white";
    draw3dQuad(
      top.x,
      top.y,
      top.z,
      backLeft.x,
      backLeft.y,
      backLeft.z,
      frontLeft.x,
      frontLeft.y,
      frontLeft.z,
      top.x,
      top.y,
      top.z
    );
  }

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  function fillPyramid(lX, lY, lZ, fX, fY, fZ, brX, brY, brZ, blX, blY, blZ) {
    // Cara base
    draw3dQuad(
      frontLeft.x,
      frontLeft.y,
      frontLeft.z,
      frontRight.x,
      frontRight.y,
      frontRight.z,
      backRight.x,
      backRight.y,
      backRight.z,
      backLeft.x,
      backLeft.y,
      backLeft.z
    );

    // Caras laterales
    ctx.fillStyle = "red";
    draw3dQuad(
      top.x,
      top.y,
      top.z,
      frontLeft.x,
      frontLeft.y,
      frontLeft.z,
      frontRight.x,
      frontRight.y,
      frontRight.z,
      top.x,
      top.y,
      top.z
    );
    ctx.fillStyle = "blue";
    draw3dQuad(
      top.x,
      top.y,
      top.z,
      frontRight.x,
      frontRight.y,
      frontRight.z,
      backRight.x,
      backRight.y,
      backRight.z,
      top.x,
      top.y,
      top.z
    );
    ctx.fillStyle = "green";
    draw3dQuad(
      top.x,
      top.y,
      top.z,
      backRight.x,
      backRight.y,
      backRight.z,
      backLeft.x,
      backLeft.y,
      backLeft.z,
      top.x,
      top.y,
      top.z
    );
    ctx.fillStyle = "white";
    draw3dQuad(
      top.x,
      top.y,
      top.z,
      backLeft.x,
      backLeft.y,
      backLeft.z,
      frontLeft.x,
      frontLeft.y,
      frontLeft.z,
      top.x,
      top.y,
      top.z
    );
  }

  function drawPrism(prX, prY, prZ, prW, prH, prL) {
    draw3dLine(prX, prY, prZ, prX, prY, prZ + prL);
    draw3dLine(prX, prY, prZ, prX, prY + prH, prZ);
    draw3dLine(prX, prY + prH, prZ, prX, prY + prH, prZ + prL);
    draw3dLine(prX, prY, prZ + prL, prX, prY + prH, prZ + prL);

    draw3dLine(prX + prW, prY, prZ, prX + prW, prY, prZ + prL);
    draw3dLine(prX + prW, prY, prZ, prX + prW, prY + prH, prZ);
    draw3dLine(prX + prW, prY + prH, prZ, prX + prW, prY + prH, prZ + prL);
    draw3dLine(prX + prW, prY, prZ + prL, prX + prW, prY + prH, prZ + prL);

    draw3dLine(prX, prY, prZ, prX + prW, prY, prZ);
    draw3dLine(prX, prY + prH, prZ, prX + prW, prY + prH, prZ);
    draw3dLine(prX, prY, prZ + prL, prX + prW, prY, prZ + prL);
    draw3dLine(prX, prY + prH, prZ + prL, prX + prW, prY + prH, prZ + prL);
  }

  function fillPrism(prX, prY, prZ, prW, prH, prL) {
    // Cara superior
    draw3dQuad(
      prX,
      prY,
      prZ,
      prX,
      prY,
      prZ + prL,
      prX + prW,
      prY,
      prZ + prL,
      prX + prW,
      prY,
      prZ
    );
    // Cara izquierda
    draw3dQuad(
      prX,
      prY,
      prZ,
      prX,
      prY,
      prZ + prL,
      prX,
      prY + prH,
      prZ + prL,
      prX,
      prY + prH,
      prZ
    );
    // Cara frontal
    draw3dQuad(
      prX,
      prY,
      prZ,
      prX,
      prY + prH,
      prZ,
      prX + prW,
      prY + prH,
      prZ,
      prX + prW,
      prY,
      prZ
    );
    // Cara derecha
    draw3dQuad(
      prX + prW,
      prY + prH,
      prZ + prL,
      prX + prW,
      prY + prH,
      prZ,
      prX + prW,
      prY,
      prZ,
      prX + prW,
      prY,
      prZ + prL
    );
    // Parte Inferior
    draw3dQuad(
      prX + prW,
      prY + prH,
      prZ + prL,
      prX + prW,
      prY + prH,
      prZ,
      prX,
      prY + prH,
      prZ,
      prX,
      prY + prH,
      prZ + prL
    );
    // Parte trasera
    draw3dQuad(
      prX + prW,
      prY + prH,
      prZ + prL,
      prX + prW,
      prY,
      prZ + prL,
      prX,
      prY,
      prZ + prL,
      prX,
      prY + prH,
      prZ + prL
    );
  }

  function draw3dLine(x1, y1, z1, x2, y2, z2) {
    const x1Diff = x1 - x;
    const y1Diff = y1 - y;
    const z1Diff = z1 - z;
    const x2Diff = x2 - x;
    const y2Diff = y2 - y;
    const z2Diff = z2 - z;

    let translatedX1 = x1Diff * Math.cos(-fpang) + z1Diff * Math.sin(-fpang);
    let translatedZ1 = z1Diff * Math.cos(-fpang) - x1Diff * Math.sin(-fpang);
    let translatedX2 = x2Diff * Math.cos(-fpang) + z2Diff * Math.sin(-fpang);
    let translatedZ2 = z2Diff * Math.cos(-fpang) - x2Diff * Math.sin(-fpang);

    if (translatedZ1 < 0 || translatedZ2 < 0) {
      return;
    }

    const screenDistance = 400;

    dispX1 = (translatedX1 / translatedZ1) * screenDistance + centerOfScreenX;
    dispY1 = (y1Diff / translatedZ1) * screenDistance + centerOfScreenY;
    dispX2 = (translatedX2 / translatedZ2) * screenDistance + centerOfScreenX;
    dispY2 = (y2Diff / translatedZ2) * screenDistance + centerOfScreenY;

    ctxDrawLine(dispX1, dispY1, dispX2, dispY2);
  }

  function draw3dQuad(x1, y1, z1, x2, y2, z2, x3, y3, z3, x4, y4, z4) {
    const x1Diff = x1 - x;
    const y1Diff = y1 - y;
    const z1Diff = z1 - z;
    const x2Diff = x2 - x;
    const y2Diff = y2 - y;
    const z2Diff = z2 - z;
    const x3Diff = x3 - x;
    const y3Diff = y3 - y;
    const z3Diff = z3 - z;
    const x4Diff = x4 - x;
    const y4Diff = y4 - y;
    const z4Diff = z4 - z;

    const translatedX1 = x1Diff * Math.cos(-fpang) + z1Diff * Math.sin(-fpang);
    const translatedZ1 = z1Diff * Math.cos(-fpang) - x1Diff * Math.sin(-fpang);
    const translatedX2 = x2Diff * Math.cos(-fpang) + z2Diff * Math.sin(-fpang);
    const translatedZ2 = z2Diff * Math.cos(-fpang) - x2Diff * Math.sin(-fpang);
    const translatedX3 = x3Diff * Math.cos(-fpang) + z3Diff * Math.sin(-fpang);
    const translatedZ3 = z3Diff * Math.cos(-fpang) - x3Diff * Math.sin(-fpang);
    const translatedX4 = x4Diff * Math.cos(-fpang) + z4Diff * Math.sin(-fpang);
    const translatedZ4 = z4Diff * Math.cos(-fpang) - x4Diff * Math.sin(-fpang);

    if (
      translatedZ1 < 0 ||
      translatedZ2 < 0 ||
      translatedZ3 < 0 ||
      translatedZ4 < 0
    ) {
      return;
    }

    const screenDistance = 400;

    const dispX1 =
      (translatedX1 / translatedZ1) * screenDistance + centerOfScreenX;
    const dispY1 = (y1Diff / translatedZ1) * screenDistance + centerOfScreenY;
    const dispX2 =
      (translatedX2 / translatedZ2) * screenDistance + centerOfScreenX;
    const dispY2 = (y2Diff / translatedZ2) * screenDistance + centerOfScreenY;
    const dispX3 =
      (translatedX3 / translatedZ3) * screenDistance + centerOfScreenX;
    const dispY3 = (y3Diff / translatedZ3) * screenDistance + centerOfScreenY;
    const dispX4 =
      (translatedX4 / translatedZ4) * screenDistance + centerOfScreenX;
    const dispY4 = (y4Diff / translatedZ4) * screenDistance + centerOfScreenY;

    const avgTZ =
      (translatedZ1 + translatedZ2 + translatedZ3 + translatedZ4) / 4;

    quadsToDraw.push([
      dispX1,
      dispY1,
      dispX2,
      dispY2,
      dispX3,
      dispY3,
      dispX4,
      dispY4,
      avgTZ,
      ctx.fillStyle,
    ]);
  }

  function ctxDrawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function ctxDrawQuad(x1, y1, x2, y2, x3, y3, x4, y4) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
  }

  function controlLogic() {
    const walkSpd = 10;
    const turnSpd = 1;
    const cameraSpd = 10;

    if (up) {
      x += Math.sin(fpang) * walkSpd;
      z += Math.cos(fpang) * walkSpd;
      socket.emit("movement", {
        x,
        z,
      });
    } else if (down) {
      x -= Math.sin(fpang) * walkSpd;
      z -= Math.cos(fpang) * walkSpd;
      socket.emit("movement", {
        x,
        z,
      });
    }

    if (right) fpang += turnSpd * (Math.PI / 180);
    else if (left) fpang -= turnSpd * (Math.PI / 180);

    if (cameraup) centerOfScreenY -= cameraSpd;
    else if (cameradown) centerOfScreenY += cameraSpd;

    if (crouch) playerHeight = 100;
    else if (!crouch) playerHeight = 172;
  }

  function gameLogic() {
    controlLogic();
  }

  function draw() {
    quadsToDraw = [];

    ctx.fillStyle = "#6a6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#000";

    const shapesTypes = {
      cubo: (e, { put }) => fpDrawSquare(e.x, e.y, e.z, e.h, e.w, e.l, put),
      pilar: (e, { put }) => fpDrawPillar(e.x, e.y, e.z, 50, 300, 50, put),
      esfera: (e, { put }) => fpDrawSphere(e.x, e.y, e.z, 20, 20, put),
      piramide: (e, { put }) => fpDrawPyramid(e.x, e.y, e.z, 20, 20, put),
    };
    shapesTypes[selectedObjectType()](
      {
        x: x + 300 * Math.sin(fpang),
        y,
        z: z + 300 * Math.cos(fpang),
        h: boxH.value,
        w: boxW.value,
        l: boxL.value,
      },
      { put: true }
    );
    world();
    boxes.forEach((e) => {
      ctx.fillStyle = e.color;
      shapesTypes[e.type](e, { put: false });
    });
    users.forEach((e) => {
      if (e.id == socket.id) return;
      ctx.fillStyle = e.color;
      fpDrawPillar(e.x, e.y, e.z, 50, 300, 50);
    });
    render();
  }

  function world() {
    for (var i = 0; i < 2; i++) {
      ctx.fillStyle = `rgb(${i * 31}, ${((i + 2) % 8) * 31}, ${
        ((i + 5) % 8) * 31
      })`;
      fpDrawPillar(-200, 0, 300 + 400 * i, 50, 300, 50);
      fpDrawPillar(200, 0, 300 + 400 * i, 50, 300, 50);
    }
    ctx.fillStyle = "purple";
    fpDrawSquare(-70, 0, 450, 200, 200, 200);
    ctx.fillStyle = "black";
    fpDrawSquare(350, 0, 0, 40, 350, 170);
    ctx.fillStyle = "darkblue";
    for (var i = 0; i < 140; i++) {
      fpDrawSquare(3000 * Math.sin(i), 0, 3000 * Math.cos(i), 350, 500, 350);
    }
  }

  function render() {
    quadsToDraw.sort(function (a, b) {
      return b[8] - a[8];
    });

    for (var i = 0; i < quadsToDraw.length; i++) {
      ctx.fillStyle = quadsToDraw[i][9];
      ctxDrawQuad(
        quadsToDraw[i][0],
        quadsToDraw[i][1],
        quadsToDraw[i][2],
        quadsToDraw[i][3],
        quadsToDraw[i][4],
        quadsToDraw[i][5],
        quadsToDraw[i][6],
        quadsToDraw[i][7]
      );
    }
  }

  function keydown(evt) {
    // console.log(evt.keyCode)
    switch (evt.keyCode) {
      case 65:
        left = true;
        break;
      case 38:
        up = true;
        break;
      case 68:
        right = true;
        break;
      case 40:
        down = true;
        break;
      case 87:
        cameradown = true;
        break;
      case 83:
        cameraup = true;
        break;
      case 16:
        crouch = true;
        break;
    }
  }

  function keyup(evt) {
    evt.preventDefault();
    // console.log(evt.keyCode)
    switch (evt.keyCode) {
      case 65:
        left = false;
        break;
      case 38:
        up = false;
        break;
      case 68:
        right = false;
        break;
      case 40:
        down = false;
        break;
      case 87:
        cameradown = false;
        break;
      case 83:
        cameraup = false;
        break;
      case 16:
        crouch = false;
        break;
    }
  }

  function variables() {
    console.log(quadsToDraw, x, y, z, fpang, centerOfScreenX, centerOfScreenY);
  }

  function wireframeTurn() {
    wireframe = !wireframe;
  }

  createBox.addEventListener("click", function () {
    return socket.emit("addBox", {
      x: x + 300 * Math.sin(fpang),
      y,
      z: z + 300 * Math.cos(fpang),
      h: boxH.value,
      w: boxW.value,
      l: boxL.value,
      color: colorI.value,
      type: selectedObjectType(),
    });
  });
  function selectedObjectType() {
    return objectType.value;
  }
  socket.on("allBoxes", function (data) {
    boxes = data;
  });
  socket.on("newUser", function (data) {
    users = data;
  });
  socket.on("newBox", function (data) {
    boxes.push(data);
  });
  socket.on("movement", function (data) {
    const userIndex = users.findIndex((u) => u.id === data.id);
    if (userIndex !== -1) {
      users[userIndex].x = data.x;
      users[userIndex].z = data.z;
    }
  });
  update();
})();
