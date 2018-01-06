
// Good reference:
// http://eusebeia.dyndns.org/4d/vis/10-rot-1

var framesPerSecond = 10;
var canvasSize = 800;
var canvas;
var context;
var voxelPixelSize = 30;
var voxelPixelBorderSize = 4;
var voxelList = [];
var viewRot;
var viewRotDirection;
var shouldRedrawVoxels = true;
var hypercubeRot;
var hypercubeOffset = 0;
var voxelGenerationRange = 2;
var voxelGenerationResolution = 0.125;

// May be 2D, 3D, or 4D.
function Pos(coords) {
    this.coords = coords;
}

Pos.prototype.copy = function() {
    return new Pos(this.coords.slice());
}

Pos.prototype.set = function(pos) {
    var index = 0;
    while (index < this.coords.length) {
        this.coords[index] = pos.coords[index];
        index += 1;
    }
}

Pos.prototype.add = function(pos) {
    var index = 0;
    while (index < this.coords.length) {
        this.coords[index] += pos.coords[index];
        index += 1;
    }
}

Pos.prototype.scale = function(value) {
    var index = 0;
    while (index < this.coords.length) {
        this.coords[index] *= value;
        index += 1;
    }
}

Pos.prototype.rotateInPlane = function(index1, index2, angle) {
    var tempValue1 = this.coords[index1];
    var tempValue2 = this.coords[index2];
    var tempSine = Math.sin(angle);
    var tempCosine = Math.cos(angle);
    this.coords[index1] = tempValue1 * tempCosine - tempValue2 * tempSine;
    this.coords[index2] = tempValue1 * tempSine + tempValue2 * tempCosine;
}

Pos.prototype.rotate = function(rot) {
    if (this.coords.length == 2) {
        this.rotateInPlane(0, 1, rot.angles[0]);
    }
    if (this.coords.length == 3) {
        this.rotateInPlane(0, 1, rot.angles[0]);
        this.rotateInPlane(0, 2, rot.angles[1]);
        this.rotateInPlane(1, 2, rot.angles[2]);
    }
    if (this.coords.length == 4) {
        this.rotateInPlane(0, 1, rot.angles[0]);
        this.rotateInPlane(0, 2, rot.angles[1]);
        this.rotateInPlane(0, 3, rot.angles[2]);
        this.rotateInPlane(1, 2, rot.angles[3]);
        this.rotateInPlane(1, 3, rot.angles[4]);
        this.rotateInPlane(2, 3, rot.angles[5]);
    }
}

// Only works with 3D positions right now.
// The range of each coordinate should be from -1 to 1.
Pos.prototype.convertToColor = function() {
    var tempRed = 64 + Math.round((this.coords[0] + 1) * 65);
    var tempGreen = 64 + Math.round((this.coords[1] + 1) * 64);
    var tempBlue = 64 + Math.round((this.coords[2] + 1) * 64);
    if (tempRed < 64) {
        tempRed = 64;
    }
    if (tempRed > 192) {
        tempRed = 192;
    }
    if (tempGreen < 64) {
        tempGreen = 64;
    }
    if (tempGreen > 192) {
        tempGreen = 192;
    }
    if (tempBlue < 64) {
        tempBlue = 64;
    }
    if (tempBlue > 192) {
        tempBlue = 192;
    }
    return "rgb(" + tempRed + ", " + tempGreen + ", " + tempBlue + ")";
}

Pos.prototype.isInHypercube = function() {
    var index = 0;
    while (index < this.coords.length) {
        var tempValue = this.coords[index];
        if (tempValue < -1 || tempValue > 1) {
            return false;
        }
        index += 1;
    }
    return true;
}

// May be 2D, 3D, or 4D.
function Rot(angles) {
    this.angles = angles;
}

Rot.prototype.copy = function() {
    return new Rot(this.angles.slice());
}

Rot.prototype.add = function(rot) {
    var index = 0;
    while (index < this.angles.length) {
        this.angles[index] += rot.angles[index];
        index += 1;
    }
}

Rot.prototype.scale = function(value) {
    var index = 0;
    while (index < this.angles.length) {
        this.angles[index] *= value;
        index += 1;
    }
}

Rot.prototype.isZero = function() {
    var index = 0;
    while (index < this.angles.length) {
        if (this.angles[index] != 0) {
            return false;
        }
        index += 1;
    }
    return true;
}

Rot.prototype.equals = function(rot) {
    if (this.angles.length != rot.angles.length) {
        return false;
    }
    var index = 0;
    while (index < this.angles.length) {
        if (this.angles[index] != rot.angles[index]) {
            return false;
        }
        index += 1;
    }
    return true;
}

viewRot = new Rot([0, 0, 0]);
viewRotDirection = new Rot([0, 0, 0]);
hypercubeRot = new Rot([0, 0, 0, 0, 0, 0]);

function Voxel(pos) {
    this.pos = pos;
    this.color = this.pos.convertToColor();
    this.viewPos = this.pos.copy();
    voxelList.push(this);
}

Voxel.prototype.resolveViewPos = function() {
    this.viewPos.set(this.pos);
    this.viewPos.rotate(viewRot);
    this.viewPos.scale(canvasSize / 4);
    this.viewPos.coords[0] += canvasSize / 2;
    this.viewPos.coords[1] += canvasSize / 2;
}

Voxel.prototype.draw = function() {
    var tempPosX = this.viewPos.coords[0];
    var tempPosY = this.viewPos.coords[1];
    context.fillStyle = "#000000";
    context.fillRect(
        Math.round(tempPosX - voxelPixelSize / 2),
        Math.round(tempPosY - voxelPixelSize / 2),
        voxelPixelSize,
        voxelPixelSize
    );
    context.fillStyle = this.color;
    context.fillRect(
        Math.round(tempPosX - voxelPixelSize / 2 + voxelPixelBorderSize),
        Math.round(tempPosY - voxelPixelSize / 2 + voxelPixelBorderSize),
        voxelPixelSize - voxelPixelBorderSize * 2,
        voxelPixelSize - voxelPixelBorderSize * 2
    );
}

function resolveEveryVoxelViewPos() {
    var index = 0;
    while (index < voxelList.length) {
        var tempVoxel = voxelList[index];
        tempVoxel.resolveViewPos();
        index += 1;
    }
    // Draw the most distant voxels first.
    voxelList.sort(function(voxel1, voxel2) {
        var tempDepth1 = voxel1.viewPos.coords[2];
        var tempDepth2 = voxel2.viewPos.coords[2];
        if (tempDepth1 < tempDepth2) {
            return 1;
        }
        if (tempDepth1 > tempDepth2) {
            return -1;
        }
        return 0;
    });
}

function clearCanvas() {
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, canvasSize, canvasSize);
}

function drawAllVoxels() {
    resolveEveryVoxelViewPos();
    clearCanvas();
    var index = 0;
    while (index < voxelList.length) {
        var tempVoxel = voxelList[index];
        tempVoxel.draw();
        index += 1;
    }
}

function regenerateVoxels() {
    voxelList = [];
    var voxelGenerationAxisList = [];
    var index = 0;
    while (index < 4) {
        var tempCoords = [0, 0, 0, 0];
        tempCoords[index] = 1;
        var tempAxis = new Pos(tempCoords);
        tempAxis.rotate(hypercubeRot);
        voxelGenerationAxisList.push(tempAxis);
        index += 1;
    }
    var voxelGenerationOffset = new Pos([
        -voxelGenerationRange,
        -voxelGenerationRange,
        -voxelGenerationRange
    ]);
    var tempPos = new Pos([0, 0, 0, 0]);
    var tempOffset = new Pos([0, 0, 0, 0]);
    while (true) {
        tempPos.set(voxelGenerationAxisList[3]);
        tempPos.scale(hypercubeOffset);
        var index = 0;
        while (index < 3) {
            tempOffset.set(voxelGenerationAxisList[index]);
            tempOffset.scale(voxelGenerationOffset.coords[index]);
            tempPos.add(tempOffset);
            index += 1;
        }
        if (tempPos.isInHypercube()) {
            new Voxel(voxelGenerationOffset.copy());
        }
        voxelGenerationOffset.coords[0] += voxelGenerationResolution;
        if (voxelGenerationOffset.coords[0] > voxelGenerationRange) {
            voxelGenerationOffset.coords[0] = -voxelGenerationRange;
            voxelGenerationOffset.coords[1] += voxelGenerationResolution;
            if (voxelGenerationOffset.coords[1] > voxelGenerationRange) {
                voxelGenerationOffset.coords[1] = -voxelGenerationRange;
                voxelGenerationOffset.coords[2] += voxelGenerationResolution;
                if (voxelGenerationOffset.coords[2] > voxelGenerationRange) {
                    break;
                }
            }
        }
    }
    shouldRedrawVoxels = true;
}

function resetViewRot() {
    viewRot.angles[0] = 0;
    viewRot.angles[1] = 0;
    viewRot.angles[2] = 0;
    shouldRedrawVoxels = true;
}

function sliderChangeEvent() {
    var tempAngleList = [];
    var index = 0;
    while (index < 6) {
        var tempAngle = document.getElementById("angle" + index + "Slider").value;
        tempAngleList.push(tempAngle);
        document.getElementById("angle" + index + "Label").innerHTML = tempAngle;
        index += 1;
    }
    var tempRot = new Rot(tempAngleList);
    var tempOffset = document.getElementById("offsetSlider").value;
    if (!hypercubeRot.equals(tempRot) || hypercubeOffset != tempOffset) {
        hypercubeRot = tempRot;
        hypercubeOffset = tempOffset;
        var index = 0;
        while (index < 6) {
            var tempAngle = tempAngleList[index];
            document.getElementById("angle" + index + "Label").innerHTML = tempAngle;
            index += 1;
        }
        document.getElementById("offsetLabel").innerHTML = tempOffset;
        regenerateVoxels();
    }
}

function keyDownEvent(event) {
    var keyCode = event.which;
    // A.
    if (keyCode == 65) {
        viewRotDirection.angles[1] = 1;
    }
    // D.
    if (keyCode == 68) {
        viewRotDirection.angles[1] = -1;
    }
    // W.
    if (keyCode == 87) {
        viewRotDirection.angles[2] = -1;
    }
    // S.
    if (keyCode == 83) {
        viewRotDirection.angles[2] = 1;
    }
    // Q.
    if (keyCode == 81) {
        viewRotDirection.angles[0] = -1;
    }
    // E.
    if (keyCode == 69) {
        viewRotDirection.angles[0] = 1;
    }
}

function keyUpEvent(event) {
    var keyCode = event.which;
    // A.
    if (keyCode == 65) {
        if (viewRotDirection.angles[1] > 0) {
            viewRotDirection.angles[1] = 0;
        }
    }
    // D.
    if (keyCode == 68) {
        if (viewRotDirection.angles[1] < 0) {
            viewRotDirection.angles[1] = 0;
        }
    }
    // W.
    if (keyCode == 87) {
        if (viewRotDirection.angles[2] < 0) {
            viewRotDirection.angles[2] = 0;
        }
    }
    // S.
    if (keyCode == 83) {
        if (viewRotDirection.angles[2] > 0) {
            viewRotDirection.angles[2] = 0;
        }
    }
    // Q.
    if (keyCode == 81) {
        if (viewRotDirection.angles[0] < 0) {
            viewRotDirection.angles[0] = 0;
        }
    }
    // E.
    if (keyCode == 69) {
        if (viewRotDirection.angles[0] > 0) {
            viewRotDirection.angles[0] = 0;
        }
    }
}

function timerEvent() {
    if (!viewRotDirection.isZero()) {
        var tempOffset = viewRotDirection.copy();
        tempOffset.scale(0.1);
        viewRot.add(tempOffset);
        shouldRedrawVoxels = true;
    }
    if (shouldRedrawVoxels) {
        drawAllVoxels();
        shouldRedrawVoxels = false;
    }
}

function initializeApplication() {
    
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");
    
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    canvas.style.width = Math.floor(canvasSize / 2);
    canvas.style.height = Math.floor(canvasSize / 2);
    
    setInterval(timerEvent, 1000 / framesPerSecond);
    
    window.onkeydown = keyDownEvent;
    window.onkeyup = keyUpEvent;
    
    regenerateVoxels();
    
}


