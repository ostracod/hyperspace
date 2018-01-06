
var framesPerSecond = 10;
var canvasSize = 800;
var canvas;
var context;
var voxelPixelSize = 30;
var voxelPixelBorderSize = 4;
var voxelList = [];

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

function Voxel(pos) {
    this.pos = pos;
    this.viewPos = this.pos.copy();
    voxelList.push(this);
}

Voxel.prototype.resolveViewPos = function() {
    this.viewPos.set(this.pos);
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
    context.fillStyle = "#888888";
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
        var tempDepth1 = voxel1.pos.coords[2];
        var tempDepth2 = voxel2.pos.coords[2];
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

function timerEvent() {
    
}

function initializeApplication() {
    
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");
    
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    canvas.style.width = Math.floor(canvasSize / 2);
    canvas.style.height = Math.floor(canvasSize / 2);
    
    setInterval(timerEvent, 1000 / framesPerSecond);
    
    new Voxel(new Pos([100, 100, 100]));
    new Voxel(new Pos([110, 110, 50]));
    drawAllVoxels();
    
}


