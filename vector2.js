var Vector2 = function()
{
}

Vector2.prototype.set = function(nX,nY)
{
	this.x = nX;
	this.y = nY;
}


Vector2.prototype.Magnitude = function() 
{
	var mag = this.x*this.x + this.y*this.y;
	mag = Math.sqrt(mag);
	return mag;
}

Vector2.prototype.Normalize = function()//normalises THIS vector2   DESTRUCTIVE
{
	var mag = Magnitude();
	this.x = this.x/mag;
	this.y = this.y/mag;
}

Vector2.prototype.getNormal = function()//makes a new vector2 that is normalised
{
	var mag = this.Magnitude;
	var v2 = new Vector2(0,0);
	v2.x = this.x/mag;
	v2.y = this.y/mag;
	return v2;
}

Vector2.prototype.add = function(other) 
{
	this.x += other.x;
	this.x += other.y;
}
Vector2.prototype.subtract = function(other) 
{
	this.x -= other.x;
	this.y -= other.y;
}

Vector2.prototype.multiply = function(scalar)
{
	this.x *= scalar.x;
	this.y *= scalar.x;
}

Vector2.prototype.divide = function (scalar) 
{
	this.x /= scalar.x;
	this.y /= scalar.y;
}