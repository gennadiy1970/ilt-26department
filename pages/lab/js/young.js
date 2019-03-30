var gl;
var CanvasName = "WebGLCanvas";
var shaderProgram;
var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

var triangleVertexPositionBuffer;
var triangleVertexColorBuffer;

var AxesVertexPositionBuffer;
var AxesVertexColorBuffer;

var AxesLabelVertexPositionBuffer;
var AxesLabelVertexColorBuffer;

var b3DSupport;

var rotx = (Math.PI / 180) * 300;
var roty = 0;
var rotz = (Math.PI / 180) * 225;
var total_scale = 1.0;

var LabelWidth = 0.005;
var LabelHeight = 0.07;
var AxesLength = 1.5;
var fMinEValue;
var fMaxEValue;

var state = {
  first_event: true,
  is_clicking: false,
  button: 0,
  last_x: 0,
  last_y: 0
};
var CMatrix = [];
var SMatrix = [];

function GetColour(v, vmin, vmax) {
  var c = { r: 1.0, g: 1.0, b: 1.0 }; // white
  var dv;

  if (v < vmin) v = vmin;
  if (v > vmax) v = vmax;
  dv = vmax - vmin;

  if (v < vmin + 0.25 * dv) {
    c.r = 0;
    c.g = (4 * (v - vmin)) / dv;
  } else if (v < vmin + 0.5 * dv) {
    c.r = 0;
    c.b = 1 + (4 * (vmin + 0.25 * dv - v)) / dv;
  } else if (v < vmin + 0.75 * dv) {
    c.r = (4 * (v - vmin - 0.5 * dv)) / dv;
    c.b = 0;
  } else {
    c.g = 1 + (4 * (vmin + 0.75 * dv - v)) / dv;
    c.b = 0;
  }
  return c;
}

function webGLStart() {
  var canvas = document.getElementById(CanvasName);
  initGL(canvas);
  initShaders();
  CMatrix = new Array(6);
  SMatrix = new Array(6);
  for (var i = 0; i < 6; i++) {
    CMatrix[i] = new Array(6);
    SMatrix[i] = new Array(6);
  }

  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  mat4.perspective(
    45,
    gl.viewportWidth / gl.viewportHeight,
    0.1,
    100.0,
    pMatrix
  );
  mat4.identity(mvMatrix);
  mat4.translate(mvMatrix, [0, 0.0, -4.0]);
  LoadDemoModel();
}

function initGL(canvas) {
  try {
    //	gl = canvas.getContext("experimental-webgl",  {antialias: true, preserveDrawingBuffer: true});//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    gl = canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    screenshotcanvas = document.createElement("canvas");
    screenshotcanvas.width = canvas.width;
    screenshotcanvas.height = canvas.height;
    b3DSupport = true;
  } catch (e) {}
  if (!gl) {
    b3DSupport = false;
    alert("Could not initialise WebGL, sorry :-(");
  }
}

function getShader(gl, id) {
  var shaderScript = document.getElementById(id);
  if (!shaderScript) {
    return null;
  }

  var str = "";
  var k = shaderScript.firstChild;
  while (k) {
    if (k.nodeType == 3) {
      str += k.textContent;
    }
    k = k.nextSibling;
  }

  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }

  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Could not initialise shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(
    shaderProgram,
    "aVertexPosition"
  );
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(
    shaderProgram,
    "aVertexColor"
  );
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

  shaderProgram.pMatrixUniform = gl.getUniformLocation(
    shaderProgram,
    "uPMatrix"
  );
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(
    shaderProgram,
    "uMVMatrix"
  );
}

function mvPushMatrix() {
  var copy = mat4.create();
  mat4.set(mvMatrix, copy);
  mvMatrixStack.push(copy);
}

function mvPopMatrix() {
  if (mvMatrixStack.length == 0) {
    throw "Invalid popMatrix!";
  }
  mvMatrix = mvMatrixStack.pop();
}

function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function InitModelBuffers() {
  var fTheta = [];
  var fPhi = [];
  var iNum = 100;
  var Sc = 1000;
  var vertices = [];
  var colors = [];
  Sc = 0;
  fMaxEValue = -1000000000000000;
  fMinEValue = 1000000000000000;

  for (var i = 0; i <= iNum; i++) {
    fTheta.push(((1.0 * Math.PI) / iNum) * i);
    fPhi.push(((2.0 * Math.PI) / iNum) * i);
  }

  for (var j = 0; j < iNum; j++)
    for (var i = 0; i < iNum; i++) {
      var l1, l2, l3, f;
      l1 = lx(fTheta[j], fPhi[i]);
      l2 = ly(fTheta[j], fPhi[i]);
      l3 = lz(fTheta[j]);
      f = Young(l1, l2, l3);
      if (f > fMaxEValue) {
        fMaxEValue = f;
        Sc = f;
      }
      if (f < fMinEValue) fMinEValue = f;
      //	if(f > Sc) Sc = f;
    }

  Sc = Sc * 0.7;

  //----------------------------------

  for (var j = 0; j < iNum; j++)
    for (var i = 0; i < iNum; i++) {
      var l1, l2, l3, f;
      var c;
      l1 = lx(fTheta[j], fPhi[i]);
      l2 = ly(fTheta[j], fPhi[i]);
      l3 = lz(fTheta[j]);
      f = Young(l1, l2, l3);
      //--------------------------------------------------------
      c = GetColour(f, fMinEValue, fMaxEValue);
      colors.push(c.r);
      colors.push(c.g);
      colors.push(c.b);
      colors.push(1);
      //--------------------------------------------------------
      vertices.push((l1 * f) / Sc);
      vertices.push((l2 * f) / Sc);
      vertices.push((l3 * f) / Sc);

      l1 = lx(fTheta[j], fPhi[i + 1]);
      l2 = ly(fTheta[j], fPhi[i + 1]);
      l3 = lz(fTheta[j]);
      f = Young(l1, l2, l3);
      //--------------------------------------------------------
      c = GetColour(f, fMinEValue, fMaxEValue);
      colors.push(c.r);
      colors.push(c.g);
      colors.push(c.b);
      colors.push(1);
      //--------------------------------------------------------
      vertices.push((l1 * f) / Sc);
      vertices.push((l2 * f) / Sc);
      vertices.push((l3 * f) / Sc);

      l1 = lx(fTheta[j + 1], fPhi[i + 1]);
      l2 = ly(fTheta[j + 1], fPhi[i + 1]);
      l3 = lz(fTheta[j + 1]);
      f = Young(l1, l2, l3);
      //--------------------------------------------------------
      c = GetColour(f, fMinEValue, fMaxEValue);
      colors.push(c.r);
      colors.push(c.g);
      colors.push(c.b);
      colors.push(1);
      //--------------------------------------------------------
      vertices.push((l1 * f) / Sc);
      vertices.push((l2 * f) / Sc);
      vertices.push((l3 * f) / Sc);

      //-----------------------------------------

      l1 = lx(fTheta[j], fPhi[i]);
      l2 = ly(fTheta[j], fPhi[i]);
      l3 = lz(fTheta[j]);
      f = Young(l1, l2, l3);
      //--------------------------------------------------------
      c = GetColour(f, fMinEValue, fMaxEValue);
      colors.push(c.r);
      colors.push(c.g);
      colors.push(c.b);
      colors.push(1);
      //--------------------------------------------------------
      vertices.push((l1 * f) / Sc);
      vertices.push((l2 * f) / Sc);
      vertices.push((l3 * f) / Sc);

      l1 = lx(fTheta[j + 1], fPhi[i + 1]);
      l2 = ly(fTheta[j + 1], fPhi[i + 1]);
      l3 = lz(fTheta[j + 1]);
      f = Young(l1, l2, l3);
      //--------------------------------------------------------
      c = GetColour(f, fMinEValue, fMaxEValue);
      colors.push(c.r);
      colors.push(c.g);
      colors.push(c.b);
      colors.push(1);
      //--------------------------------------------------------
      vertices.push((l1 * f) / Sc);
      vertices.push((l2 * f) / Sc);
      vertices.push((l3 * f) / Sc);

      l1 = lx(fTheta[j + 1], fPhi[i]);
      l2 = ly(fTheta[j + 1], fPhi[i]);
      l3 = lz(fTheta[j + 1]);
      f = Young(l1, l2, l3);
      //--------------------------------------------------------
      c = GetColour(f, fMinEValue, fMaxEValue);
      colors.push(c.r);
      colors.push(c.g);
      colors.push(c.b);
      colors.push(1);
      //--------------------------------------------------------
      vertices.push((l1 * f) / Sc);
      vertices.push((l2 * f) / Sc);
      vertices.push((l3 * f) / Sc);
    }
  //

  triangleVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  triangleVertexPositionBuffer.itemSize = 3;
  triangleVertexPositionBuffer.numItems =
    vertices.length / triangleVertexPositionBuffer.itemSize; // 6 * iNum * iNum;//

  triangleVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  triangleVertexColorBuffer.itemSize = 4;
  triangleVertexColorBuffer.numItems =
    colors.length / triangleVertexColorBuffer.itemSize;
}

function DrawModel() {
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    triangleVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexColorAttribute,
    triangleVertexColorBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);
}

function DrawAxes() {
  var phi = Math.atan(0.5);

  // Z
  gl.bindBuffer(gl.ARRAY_BUFFER, AxesVertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    AxesVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, AxesVertexColorBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexColorAttribute,
    AxesVertexColorBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, AxesVertexPositionBuffer.numItems);

  // Y
  mvPushMatrix();
  mat4.rotate(mvMatrix, Math.PI / 2, [0, 1, 0]);
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, AxesVertexPositionBuffer.numItems);

  // X
  mat4.rotate(mvMatrix, -Math.PI / 2, [1, 0, 0]);
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, AxesVertexPositionBuffer.numItems);
  mvPopMatrix();

  // --------------------- Label Z ----------------------------------------------
  mvPushMatrix();
  mat4.rotate(mvMatrix, (-Math.PI / 180) * 45, [0, 0, 1]); // rotate label Z along z-axes

  mvPushMatrix();
  mat4.translate(mvMatrix, [0.0, 0.0, AxesLength + LabelHeight]);
  mat4.rotate(mvMatrix, -phi, [0, 1, 0]);

  gl.bindBuffer(gl.ARRAY_BUFFER, AxesLabelVertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    AxesLabelVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, AxesLabelVertexColorBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexColorAttribute,
    AxesLabelVertexColorBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, AxesLabelVertexPositionBuffer.numItems);
  mvPopMatrix();

  mvPushMatrix();
  mat4.translate(mvMatrix, [0.0, 0.0, AxesLength + LabelHeight / 2]);
  mat4.rotate(mvMatrix, Math.PI / 2, [0, 1, 0]);
  mat4.scale(mvMatrix, [1.0, 1.0, 0.5]);
  gl.bindBuffer(gl.ARRAY_BUFFER, AxesLabelVertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    AxesLabelVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, AxesLabelVertexColorBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexColorAttribute,
    AxesLabelVertexColorBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, AxesLabelVertexPositionBuffer.numItems);
  mvPopMatrix();

  mvPushMatrix();
  mat4.translate(mvMatrix, [0.0, 0.0, AxesLength + 1.5 * LabelHeight]);
  mat4.rotate(mvMatrix, Math.PI / 2, [0, 1, 0]);
  mat4.scale(mvMatrix, [1.0, 1.0, 0.5]);
  gl.bindBuffer(gl.ARRAY_BUFFER, AxesLabelVertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    AxesLabelVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, AxesLabelVertexColorBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexColorAttribute,
    AxesLabelVertexColorBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, AxesLabelVertexPositionBuffer.numItems);
  mvPopMatrix();

  mvPopMatrix();

  // --------------------- Label X ----------------------------------------------
  mvPushMatrix();
  mat4.translate(mvMatrix, [AxesLength + LabelHeight, 0.0, 0.0]);
  mat4.rotate(mvMatrix, phi, [0, 1, 0]);

  gl.bindBuffer(gl.ARRAY_BUFFER, AxesLabelVertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    AxesLabelVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, AxesLabelVertexColorBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexColorAttribute,
    AxesLabelVertexColorBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, AxesLabelVertexPositionBuffer.numItems);
  mvPopMatrix();

  mvPushMatrix();
  mat4.translate(mvMatrix, [AxesLength + LabelHeight, 0.0, 0.0]);
  mat4.rotate(mvMatrix, -phi, [0, 1, 0]);

  gl.bindBuffer(gl.ARRAY_BUFFER, AxesLabelVertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    AxesLabelVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, AxesLabelVertexColorBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexColorAttribute,
    AxesLabelVertexColorBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, AxesLabelVertexPositionBuffer.numItems);
  mvPopMatrix();

  // --------------------- Label Y ----------------------------------------------
  mvPushMatrix();
  mat4.translate(mvMatrix, [0.0, AxesLength + LabelHeight, 0.0]);
  mat4.rotate(mvMatrix, -phi, [1, 0, 0]);

  gl.bindBuffer(gl.ARRAY_BUFFER, AxesLabelVertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    AxesLabelVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, AxesLabelVertexColorBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexColorAttribute,
    AxesLabelVertexColorBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, AxesLabelVertexPositionBuffer.numItems);
  mvPopMatrix();

  mvPushMatrix();

  mat4.scale(mvMatrix, [1.0, 1.0, 0.5]);
  mat4.translate(mvMatrix, [
    0.0,
    AxesLength + 0.75 * LabelHeight,
    LabelHeight / 4
  ]);
  mat4.rotate(mvMatrix, phi, [1, 0, 0]);

  gl.bindBuffer(gl.ARRAY_BUFFER, AxesLabelVertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    AxesLabelVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, AxesLabelVertexColorBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexColorAttribute,
    AxesLabelVertexColorBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, AxesLabelVertexPositionBuffer.numItems);
  mvPopMatrix();
}

function drawScene() {
  if (b3DSupport) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mvPushMatrix(); // Global Push
    mat4.scale(mvMatrix, [
      0.8 * total_scale,
      0.8 * total_scale,
      0.8 * total_scale
    ]);
    mat4.rotate(mvMatrix, rotx, [1, 0, 0]);
    mat4.rotate(mvMatrix, roty, [0, 1, 0]);
    mat4.rotate(mvMatrix, rotz, [0, 0, 1]);
    DrawModel();
    DrawAxes();
    mvPopMatrix(); // Global Pop
    gl.flush();
  }
}

function DrawScale() {
  var offset_x = 700;
  var offset_y = 50;
  var width = 30;
  var height = 300;

  var textCanvas = document.getElementById("text");
  var ctx = textCanvas.getContext("2d");
  ctx.clearRect(0, 0, textCanvas.width, textCanvas.height);
  ctx.font = "16px Arial";

  for (var i = 0; i < height; i++) {
    var cl = GetColour(
      fMinEValue + ((1.0 * i) / height) * (fMaxEValue - fMinEValue),
      fMinEValue,
      fMaxEValue
    );
    var a = 255 * cl.r;
    var b = 255 * cl.g;
    var c = 255 * cl.b;
    ctx.fillStyle = "rgb(" + a + "," + b + "," + c + ")";
    ctx.fillRect(offset_x, offset_y + height - i, width, 1);
  }
  var ScaleStep;
  if (fMaxEValue - fMinEValue < 100) ScaleStep = 10;
  else {
    if (fMaxEValue - fMinEValue < 500) ScaleStep = 50;
    else ScaleStep = 100;
  }
  var iNum1 = Math.round((fMaxEValue - fMinEValue) / ScaleStep);
  var i_min = Math.round(fMinEValue / ScaleStep);
  ctx.fillStyle = "#000000";
  for (var i = 0; i <= iNum1; i++) {
    var y = offset_y + height - (i / iNum1) * height + 5;
    ctx.fillText((i_min + i) * ScaleStep, offset_x + width + 5, y);
  }
}

function bContextID(e) {
  var target = e.srcElement ? e.srcElement : e.target;
  var id = target ? (target.id ? target.id : "NO ID") : "NO TARGET";
  if (id == "text" || id == CanvasName) {
    return true;
  } else {
    return false;
  }
}

function relXY(e) {
  if (typeof e.offsetX == "number") return { x: e.offsetX, y: e.offsetY };
  var off = { x: 0, y: 0 };
  var node = e.target;
  var pops = node.offsetParent;
  if (pops) {
    off.x += node.offsetLeft - pops.offsetLeft;
    off.y += node.offsetTop - pops.offsetTop;
  }
  return { x: e.layerX - off.x, y: e.layerY - off.y };
}

window.onmouseup = function(e) {
  if (!b3DSupport) {
    return;
  }
  if (bContextID(e)) {
    state.is_clicking = false;
    e.preventDefault();
  }
};

window.onmousedown = function(e) {
  if (!b3DSupport) {
    return;
  }
  if (bContextID(e)) {
    var rel = relXY(e);
    state.is_clicking = true;

    if (e.button == 0) {
      state.button = 1; // Left Click
    }
    if (e.button == 2) {
      state.button = 2; // Right Click
    }
    state.last_x = rel.x;
    state.last_y = rel.y;
    e.preventDefault();
  }
};

window.onmousemove = function(e) {
  if (!b3DSupport) {
    return;
  }
  if (bContextID(e)) {
    var rel = relXY(e);
    var delta_x = state.last_x - rel.x;
    var delta_y = state.last_y - rel.y;
    state.last_x = rel.x;
    state.last_y = rel.y;

    if (state.first_event) {
      state.first_event = false;
    } else {
      if (state.is_clicking) {
        if (state.button == 1) {
          // Left Click
          rotx = rotx - delta_y / 180;
          rotz = rotz - delta_x / 180;
        } else if (state.button == 2) {
          // Rigght Click
          roty = roty + delta_y / 180;
          rotz = rotz - delta_x / 180;
        }
        drawScene();
      }
    }
    e.preventDefault();
  }
};

function fRho(rho0, i, N) {
  return (rho0 * (N - i)) / N;
}

function DrawAxesZ(rho, h, iNum) {
  var rho_array = 3 * rho;
  var vertices = [];
  var colors = [];
  var c = { r: 0.0, g: 0.0, b: 0.0 }; // white
  var h0 = h * 0.9;
  var h1 = h - h0;

  for (var j = 0; j < iNum; j++)
    for (var i = 0; i < iNum; i++) {
      vertices.push(rho * Math.cos((2 * Math.PI * i) / iNum));
      vertices.push(rho * Math.sin((2 * Math.PI * i) / iNum));
      vertices.push((h0 * j) / iNum);
      colors.push(c.r);
      colors.push(c.g);
      colors.push(c.b);
      colors.push(1);

      vertices.push(rho * Math.cos((2 * Math.PI * i) / iNum));
      vertices.push(rho * Math.sin((2 * Math.PI * i) / iNum));
      vertices.push((h0 * (j + 1)) / iNum);
      colors.push(c.r);
      colors.push(c.g);
      colors.push(c.b);
      colors.push(1);

      vertices.push(rho * Math.cos((2 * Math.PI * (i + 1)) / iNum));
      vertices.push(rho * Math.sin((2 * Math.PI * (i + 1)) / iNum));
      vertices.push((h0 * (j + 1)) / iNum);
      colors.push(c.r);
      colors.push(c.g);
      colors.push(c.b);
      colors.push(1);
      //--------------------------------------------------------

      vertices.push(rho * Math.cos((2 * Math.PI * i) / iNum));
      vertices.push(rho * Math.sin((2 * Math.PI * i) / iNum));
      vertices.push((h0 * j) / iNum);
      colors.push(c.r);
      colors.push(c.g);
      colors.push(c.b);
      colors.push(1);

      vertices.push(rho * Math.cos((2 * Math.PI * (i + 1)) / iNum));
      vertices.push(rho * Math.sin((2 * Math.PI * (i + 1)) / iNum));
      vertices.push((h0 * (j + 1)) / iNum);
      colors.push(c.r);
      colors.push(c.g);
      colors.push(c.b);
      colors.push(1);

      vertices.push(rho * Math.cos((2 * Math.PI * (i + 1)) / iNum));
      vertices.push(rho * Math.sin((2 * Math.PI * (i + 1)) / iNum));
      vertices.push((h0 * j) / iNum);
      colors.push(c.r);
      colors.push(c.g);
      colors.push(c.b);
      colors.push(1);
    }

  vertices.push(rho * Math.cos((2 * Math.PI * iNum) / iNum));
  vertices.push(rho * Math.sin((2 * Math.PI * iNum) / iNum));
  vertices.push((h0 * iNum) / iNum);

  colors.push(c.r);
  colors.push(c.g);
  colors.push(c.b);
  colors.push(1);

  vertices.push(rho * Math.cos((2 * Math.PI * iNum) / iNum));
  vertices.push(rho * Math.sin((2 * Math.PI * iNum) / iNum));
  vertices.push((h0 * iNum) / iNum);

  colors.push(c.r);
  colors.push(c.g);
  colors.push(c.b);
  colors.push(1);

  //--------------------------------------------------------------
  for (var j = 0; j < iNum; j++)
    for (var i = 0; i < iNum; i++) {
      rho = fRho(rho_array, j, iNum);
      vertices.push(rho * Math.cos((2 * Math.PI * i) / iNum));
      vertices.push(rho * Math.sin((2 * Math.PI * i) / iNum));
      vertices.push(h0 + (h1 * j) / iNum);
      colors.push(c.r);
      colors.push(c.g);
      colors.push(c.b);
      colors.push(1);

      rho = fRho(rho_array, j + 1, iNum);
      vertices.push(rho * Math.cos((2 * Math.PI * i) / iNum));
      vertices.push(rho * Math.sin((2 * Math.PI * i) / iNum));
      vertices.push(h0 + (h1 * (j + 1)) / iNum);
      colors.push(c.r);
      colors.push(c.g);
      colors.push(c.b);
      colors.push(1);

      vertices.push(rho * Math.cos((2 * Math.PI * (i + 1)) / iNum));
      vertices.push(rho * Math.sin((2 * Math.PI * (i + 1)) / iNum));
      vertices.push(h0 + (h1 * (j + 1)) / iNum);
      colors.push(c.r);
      colors.push(c.g);
      colors.push(c.b);
      colors.push(1);
      //--------------------------------------------------------
      rho = fRho(rho_array, j, iNum);
      vertices.push(rho * Math.cos((2 * Math.PI * i) / iNum));
      vertices.push(rho * Math.sin((2 * Math.PI * i) / iNum));
      vertices.push(h0 + (h1 * j) / iNum);
      colors.push(c.r);
      colors.push(c.g);
      colors.push(c.b);
      colors.push(1);

      rho = fRho(rho_array, j + 1, iNum);
      vertices.push(rho * Math.cos((2 * Math.PI * (i + 1)) / iNum));
      vertices.push(rho * Math.sin((2 * Math.PI * (i + 1)) / iNum));
      vertices.push(h0 + (h1 * (j + 1)) / iNum);
      colors.push(c.r);
      colors.push(c.g);
      colors.push(c.b);
      colors.push(1);

      rho = fRho(rho_array, j, iNum);
      vertices.push(rho * Math.cos((2 * Math.PI * (i + 1)) / iNum));
      vertices.push(rho * Math.sin((2 * Math.PI * (i + 1)) / iNum));
      vertices.push(h0 + (h1 * j) / iNum);
      colors.push(c.r);
      colors.push(c.g);
      colors.push(c.b);
      colors.push(1);
    }

  AxesVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, AxesVertexPositionBuffer);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  AxesVertexPositionBuffer.itemSize = 3;
  AxesVertexPositionBuffer.numItems =
    vertices.length / AxesVertexPositionBuffer.itemSize; // 6 * iNum * iNum;//

  AxesVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, AxesVertexColorBuffer);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  AxesVertexColorBuffer.itemSize = 4;
  AxesVertexColorBuffer.numItems =
    colors.length / AxesVertexColorBuffer.itemSize;
}

function DrawLabels(rho, h, iNum) {
  var vertices = [];
  var colors = [];
  var c = { r: 1.0, g: 0.0, b: 0.0 }; // white

  for (var j = 0; j < iNum; j++)
    for (var i = 0; i < iNum; i++) {
      vertices.push(rho * Math.cos((2 * Math.PI * i) / iNum));
      vertices.push(rho * Math.sin((2 * Math.PI * i) / iNum));
      vertices.push((h * j) / iNum - h / 2.0);
      colors.push(c.r);
      colors.push(c.g);
      colors.push(c.b);
      colors.push(1);

      vertices.push(rho * Math.cos((2 * Math.PI * i) / iNum));
      vertices.push(rho * Math.sin((2 * Math.PI * i) / iNum));
      vertices.push((h * (j + 1)) / iNum - h / 2.0);
      colors.push(c.r);
      colors.push(c.g);
      colors.push(c.b);
      colors.push(1);

      vertices.push(rho * Math.cos((2 * Math.PI * (i + 1)) / iNum));
      vertices.push(rho * Math.sin((2 * Math.PI * (i + 1)) / iNum));
      vertices.push((h * (j + 1)) / iNum - h / 2.0);
      colors.push(c.r);
      colors.push(c.g);
      colors.push(c.b);
      colors.push(1);
      //--------------------------------------------------------

      vertices.push(rho * Math.cos((2 * Math.PI * i) / iNum));
      vertices.push(rho * Math.sin((2 * Math.PI * i) / iNum));
      vertices.push((h * j) / iNum - h / 2.0);
      colors.push(c.r);
      colors.push(c.g);
      colors.push(c.b);
      colors.push(1);

      vertices.push(rho * Math.cos((2 * Math.PI * (i + 1)) / iNum));
      vertices.push(rho * Math.sin((2 * Math.PI * (i + 1)) / iNum));
      vertices.push((h * (j + 1)) / iNum - h / 2.0);
      colors.push(c.r);
      colors.push(c.g);
      colors.push(c.b);
      colors.push(1);

      vertices.push(rho * Math.cos((2 * Math.PI * (i + 1)) / iNum));
      vertices.push(rho * Math.sin((2 * Math.PI * (i + 1)) / iNum));
      vertices.push((h * j) / iNum - h / 2.0);
      colors.push(c.r);
      colors.push(c.g);
      colors.push(c.b);
      colors.push(1);
    }

  AxesLabelVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, AxesLabelVertexPositionBuffer);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  AxesLabelVertexPositionBuffer.itemSize = 3;
  AxesLabelVertexPositionBuffer.numItems =
    vertices.length / AxesLabelVertexPositionBuffer.itemSize; // 6 * iNum * iNum;//

  AxesLabelVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, AxesLabelVertexColorBuffer);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  AxesLabelVertexColorBuffer.itemSize = 4;
  AxesLabelVertexColorBuffer.numItems =
    colors.length / AxesLabelVertexColorBuffer.itemSize;
}

function InitAxesBuffers() {
  DrawAxesZ(LabelWidth, AxesLength, 20);
  DrawLabels(LabelWidth, LabelHeight, 20);
}

function LoadDemoModel() {
  for (var i = 0; i < 6; i++)
    for (var j = 0; j < 6; j++) {
      CMatrix[i][j] = 0;
      SMatrix[i][j] = 0;
    }
  CMatrix[0][0] = CMatrix[1][1] = CMatrix[2][2] = 653.3;
  CMatrix[0][1] = CMatrix[0][2] = 412.6;
  CMatrix[1][0] = CMatrix[1][2] = 412.6;
  CMatrix[2][0] = CMatrix[2][1] = 412.6;
  CMatrix[3][3] = CMatrix[4][4] = CMatrix[5][5] = 538.6;

  InverseMatrix(6, CMatrix, SMatrix);

  InitModelBuffers();
  InitAxesBuffers();

  // --------------------   onIsometricView() ------------------------
  rotx = degToRad(300);
  roty = degToRad(0);
  rotz = degToRad(225);

  DrawScale();
  drawScene();
}

function InverseMatrix(size, inMatrix, outMatrix) {
  var values = new Array(size);
  var vectors = new Array(size);
  var tempInput = new Array(size);
  for (var i = 0; i < size; i++) {
    vectors[i] = new Array(size);
    tempInput[i] = new Array(size);
  }

  for (var i = 0; i < size; i++)
    for (var j = 0; j < size; j++) tempInput[i][j] = inMatrix[i][j];

  Jacobi(size, tempInput, values, vectors);

  for (var i = 0; i < size; i++) {
    if (values[i] <= 0.0) return -1;
  }

  for (var i = 0; i < size; i++)
    for (var j = 0; j < size; j++) {
      outMatrix[i][j] = 0;
      for (var k = 0; k < size; k++)
        outMatrix[i][j] += (vectors[i][k] * vectors[j][k]) / values[k];
    }
  return 0;
}
