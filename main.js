
var framesPerSecond = 10;
var canvasSize = 800;
var canvas;
var context;

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
    
}


