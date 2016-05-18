var canvas = document.getElementById("gameCanvas");
var context = canvas.getContext("2d");

var startFrameMillis = Date.now();
var endFrameMillis = Date.now();

// This function will return the time in seconds since the function 
// was last called
// You should only call this function once per frame
function getDeltaTime()
{
	endFrameMillis = startFrameMillis;
	startFrameMillis = Date.now();

		// Find the delta time (dt) - the change in time since the last drawFrame
		// We need to modify the delta time to something we can use.
		// We want 1 to represent 1 second, so if the delta is in milliseconds
		// we divide it by 1000 (or multiply by 0.001). This will make our 
		// animations appear at the right speed, though we may need to use
		// some large values to get objects movement and rotation correct
	var deltaTime = (startFrameMillis - endFrameMillis) * 0.001;
	
		// validate that the delta is within range
	if(deltaTime > 1)
		deltaTime = 1;
		
	return deltaTime;
}

//-------------------- Don't modify anything above here

var SCREEN_WIDTH = canvas.width;
var SCREEN_HEIGHT = canvas.height;
var LAYER_COUNT = 3;
var LAYER_PLATFORMS = 1;
var LAYER_LADDERS = 2;
var MAP = {tw:70,th:18}
var TILE = 35;
var TILESET_TILE = TILE*2;
var TILESET_PADDING = 2;
var TILESET_SPACING = 2;
var TILESET_COUNT_X = 14;
var TILESET_COUNT_Y = 14;
var tileset = document.createElement("img");
tileset.src = "tileset.png";
var cells =[];
var METER = TILE;
var GRAVITY = METER*9.8*2;
//max speeds
var MAXDX = METER*10;
var MAXDY = METER*15;
var ACCEL = MAXDX*2;
var FRICTION = MAXDX*6;
var JUMP = METER*1500;
var score = 0;
var HP = 32;
var AMMO = 32;
var HPTimer = 0;
var music;
var fireSFX;
var ENEMY_MAXDX = METER * 5;
var ENEMY_ACCEL = ENEMY_MAXDX * 2;
var enemies = [];
var LAYER_OBJECT_ENEMIES = 3;
var LAYER_OBJECT_TRIGGERS = 4;
var bullets = [];
var win = false;
var STATE_SPLASH = 0;
var STATE_GAME = 1;
var STATE_WIN = 2;
var STATE_LOSE = 3;
var gameState = STATE_SPLASH;
var splashTimer = 3;
var reloadTimer = 2;

var ammunition = document.createElement("img");
ammunition.src = "AMMO.jpg"
var Health = document.createElement("img");
Health.src = "HP.jpg"
function initialise() //define the function
{
    for (var layerIdx = 0; layerIdx < LAYER_COUNT; layerIdx++)
    { // initialize the collision map
        cells[layerIdx] = [];
        var idx = 0;
        for (var y = 0; y < level1.layers[layerIdx].height; y++)
        {
            cells[layerIdx][y] = [];
            for (var x = 0; x < level1.layers[layerIdx].width; x++)
            {
                if (level1.layers[layerIdx].data[idx] != 0)
                {
                    // for each tile we find in the layer data, we need to create 4 collisions
                    // (because our collision squares are 35x35 but the tile in the
                    // level are 70x70)
                    cells[layerIdx][y][x] = 1;
                    cells[layerIdx][y - 1][x] = 1;
                    cells[layerIdx][y - 1][x + 1] = 1;
                    cells[layerIdx][y][x + 1] = 1;
                }
                else if (cells[layerIdx][y][x] != 1)
                {
                    // if we haven't set this cell's value, then set it to 0 now
                    cells[layerIdx][y][x] = 0;
                }
                idx++;
            }
        }
    }
    music = new Howl(
	{
		urls: ["background.ogg"],
		loop: true,
		buffer: true,
		volume: 0.5
	} );
	fireSFX = new Howl(
	{
		urls: ["fireEffect.ogg"],
		buffer: true,
		volume: 1,
		onend: function() {
		isSfxPlaying = false;
	}

	} );
	// add enemies
	idx = 0;
	for(var y = 0; y < level1.layers[LAYER_OBJECT_ENEMIES].height; y++) {
		for(var x = 0; x < level1.layers[LAYER_OBJECT_ENEMIES].width; x++) {
			if(level1.layers[LAYER_OBJECT_ENEMIES].data[idx] != 0) {
				var px = tileToPixel(x);
				var py = tileToPixel(y);
				var e = new Enemy(px, py);
				enemies.push(e);
			}
			idx++;
		}
	} 
	// initialize trigger layer in collision map
	cells[LAYER_OBJECT_TRIGGERS] = [];
	idx = 0;
	for(var y = 0; y < level1.layers[LAYER_OBJECT_TRIGGERS].height; y++) {
		cells[LAYER_OBJECT_TRIGGERS][y] = [];
		for(var x = 0; x < level1.layers[LAYER_OBJECT_TRIGGERS].width; x++) {
			if(level1.layers[LAYER_OBJECT_TRIGGERS].data[idx] != 0) {
			cells[LAYER_OBJECT_TRIGGERS][y][x] = 1;
			cells[LAYER_OBJECT_TRIGGERS][y-1][x] = 1;
			cells[LAYER_OBJECT_TRIGGERS][y-1][x+1] = 1;
			cells[LAYER_OBJECT_TRIGGERS][y][x+1] = 1;
			}
			else if(cells[LAYER_OBJECT_TRIGGERS][y][x] != 1) {
				// if we haven't set this cell's value, then set it to 0 now
				cells[LAYER_OBJECT_TRIGGERS][y][x] = 0;
			}
			idx++;
		}
	}
}

// some variables to calculate the Frames Per Second (FPS - this tells use
// how fast our game is running, and allows us to make the game run at a 
// constant speed)
var fps = 0;
var fpsCount = 0;
var fpsTime = 0;

var player = new Player();
var keyboard = new Keyboard();

function cellAtPixelCoord(layer, x,y)
{
	if(x<0 || x>SCREEN_WIDTH || y<0)
	return 0;
	if(y>SCREEN_HEIGHT)
	return 1;
	return cellAtTileCoord(layer, p2t(x), p2t(y));
};
function cellAtTileCoord(layer, tx, ty)
{
	if(tx<0 || tx>=MAP.tw || ty<0)
	return 0;
	if(ty>=MAP.th)
		return 1;
	if(ty>=MAP.th-1)
		loseHP();
	return cells[layer][ty][tx];
};
function loseHP()
{
	if(HPTimer <= 0)
	{
		HP -= 5
		HPTimer = 1
	}
}

function loseHP2()
{
	if(HPTimer <= 0)
	{
		HP -= 7
		HPTimer = 1
	}
}

function reload(deltaTime)
{
	if(reloadTimer >0)
	{
		reloadTimer -= deltaTime;
		console.log(reloadTimer)
	}
	else
	{
		AMMO = 32;
		reloadTimer = 2;
	}
}

function tileToPixel(tile)
{
	return tile * TILE;
}

function pixelToTile(pixel)
{
	return Math.floor(pixel/TILE);
}

function bound (value, min, max)
{
	if(value<min)
		return min;
	if(value>max)
		return max;
	return value;
}

var worldOffsetX =0;


function drawMap()
{
	var startX = -1;
	var maxTiles = Math.floor(SCREEN_WIDTH / TILE) + 2;
	var tileX = pixelToTile(player.position.x);
	var offsetX = TILE + Math.floor(player.position.x%TILE);
	startX = tileX - Math.floor(maxTiles / 2);

	if(startX < -1)
	{
		startX = 0;
		offsetX = 0;
	}
	if(startX > MAP.tw - maxTiles)
	{
		startX = MAP.tw - maxTiles + 1;
		offsetX = TILE;
	}
	worldOffsetX = startX * TILE + offsetX;

	for( var layerIdx=0; layerIdx < LAYER_COUNT; layerIdx++ )
	{
		for( var y = 0; y < level1.layers[layerIdx].height; y++ )
		{
			var idx = y * level1.layers[layerIdx].width + startX;
			for( var x = startX; x < startX + maxTiles; x++ )
			{
				if( level1.layers[layerIdx].data[idx] != 0 )
				{
					// the tiles in the Tiled map are base 1 (meaning a value of 0 means no tile),
					// so subtract one from the tileset id to get the correct tile
					var tileIndex = level1.layers[layerIdx].data[idx] - 1;
					var sx = TILESET_PADDING + (tileIndex % TILESET_COUNT_X) *
					(TILESET_TILE + TILESET_SPACING);
					var sy = TILESET_PADDING + (Math.floor(tileIndex / TILESET_COUNT_Y)) *
					(TILESET_TILE + TILESET_SPACING);
					context.drawImage(tileset, sx, sy, TILESET_TILE, TILESET_TILE,
					(x-startX)*TILE - offsetX, (y-1)*TILE, TILESET_TILE, TILESET_TILE);
				}
			idx++;
			}
		}
	}
}
function intersects(x1, y1, w1, h1, x2, y2, w2, h2)
{
	if(y2 + h2 < y1 ||
		x2 + w2 < x1 ||
		x2 > x1 +w1 ||
		y2 > y1 + h1)
	{
		return false;
	}
	return true;
}
function runSplash(deltaTime)
{
	context.fillStyle = "#000035";
	context.fillRect(0, 0, canvas.width, canvas.height);

	splashTimer -= deltaTime;
	if(splashTimer<=0)
	{
		music.play();
		gameState = STATE_GAME;
		return;
	}
	var displayTimer = splashTimer.toFixed(0);
	context.fillStyle = "#FFFFFF";
	context.font="24px Arial";
	context.fillText("Start in " + displayTimer, 455, 320)
}
function runGame(deltaTime)
{
	context.fillStyle = "#ccc";
	context.fillRect(0, 0, canvas.width, canvas.height);
	player.update(deltaTime);
	for(var i=0; i<enemies.length; i++)
	{
		enemies[i].update(deltaTime);
		if(intersects(
    		enemies[i].position.x, enemies[i].position.y,
    		TILE, TILE,
    		player.position.x, player.position.y,
    		player.width, player.height) == true)
    	{
    		loseHP2();
    		console.log("losing hp" + HPTimer + HP);
    	}
		enemies[i].draw();
	}
	var hit=false;
	for(var i=0; i<bullets.length; i++)
	{
		bullets[i].update(deltaTime);
		if( bullets[i].position.x - worldOffsetX < 0 ||
		bullets[i].position.x - worldOffsetX > SCREEN_WIDTH)
		{
			hit = true;
		}
		for(var j=0; j<enemies.length; j++)
		{
			if(intersects( bullets[i].position.x, bullets[i].position.y, TILE, TILE,
				(enemies[j].position.x - (enemies[j].width/2)), (enemies[j].position.y - (enemies[j].height/2)), enemies[j].width, enemies[j].height) == true)
			{
				// kill both the bullet and the enemy
				enemies.splice(j, 1);
				console.log ("hit")
				hit = true;
				// increment the player score
				score += 50;
				break;
			}
		}
		if(hit == true)
		{
			bullets.splice(i, 1);
			break;
		}
		bullets[i].draw();
	}
	drawMap();
	player.draw();
	if(AMMO <= 0)
	{
		reload(deltaTime);
	}

	// update the frame counter
	fpsTime += deltaTime;
	fpsCount++;
	if(fpsTime >= 1)
	{
		fpsTime -= 1;
		fps = fpsCount;
		fpsCount = 0;
	}
	// score
	context.fillStyle = "yellow";
	context.font = "32px Arial";
	var scoreText = "Score: " + score;
	context.fillText(scoreText, SCREEN_WIDTH - 170, 35);
	// draw the FPS
	context.fillStyle = "#f11";
	context.font = "14px Arial";
	context.fillText("FPS: " + fps, 5, 20, 100);
	context.fillRect(20, 145, 40, 355)
	context.fillRect(35, 105, 10, 40)
	context.fillRect(20, 120, 40, 10)
	context.fillStyle = "#11F";
	context.fillRect(70, 145, 40, 355)

	if (HPTimer > 0)
		HPTimer -= deltaTime
	for(var i=0; i<HP; i++)
	{
		context.drawImage(Health, 23, 488 - ((Health.height + 2)*i))
	}
	/*if (ammoTimer > 0)
		ammoTimer -= deltaTime*/
	for (var i=0; i<AMMO; i++)
	{
		context.drawImage(ammunition, 73, 488 - ((ammunition.height + 2)*i))
	}
	if(win == true)
	{
		music.stop();
		gameState = STATE_WIN;
		return;
	}
	if(HP<=0 || player.position.y >700)
	{
		music.stop();
		gameState = STATE_LOSE;
		return;
	}
}
function runWin(deltaTime)
{
	context.fillStyle = "#000035";
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = "#FFFFFF";
	context.font="24px Arial";
	context.fillText("Victory", 450, 305)
}
function runLose(deltaTime)
{
	context.fillStyle = "#000035";
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = "#FFFFFF";
	context.font="24px Arial";
	context.fillText("Defeat", 470, 305)
}
function run()
{
	var deltaTime = getDeltaTime();
	switch(gameState)
	{
		case STATE_SPLASH:
			runSplash(deltaTime);
			break;
		case STATE_GAME:
			runGame(deltaTime);
			break;
		case STATE_WIN:
			runWin(deltaTime);
			break;
		case STATE_LOSE:
			runLose(deltaTime);
			break;
	}
}

initialise();

//-------------------- Don't modify anything below here


// This code will set up the framework so that the 'run' function is called 60 times per second.
// We have a some options to fall back on in case the browser doesn't support our preferred method.
(function() {
  var onEachFrame;
  if (window.requestAnimationFrame) {
    onEachFrame = function(cb) {
      var _cb = function() { cb(); window.requestAnimationFrame(_cb); }
      _cb();
    };
  } else if (window.mozRequestAnimationFrame) {
    onEachFrame = function(cb) {
      var _cb = function() { cb(); window.mozRequestAnimationFrame(_cb); }
      _cb();
    };
  } else {
    onEachFrame = function(cb) {
      setInterval(cb, 1000 / 60);
    }
  }
  
  window.onEachFrame = onEachFrame;
})();

window.onEachFrame(run);
