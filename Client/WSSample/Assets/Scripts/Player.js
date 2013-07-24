#pragma strict

// const
private var KEY_SPEED : float = 10.0;
private var KEY_ROTATION_SPEED : float = 300.0;
private var MOUSE_SPEED : float = 10.0;
private var MOUSE_ROTATION_SPEED : float = 100.0;
private var INITIAL_BULLET_VELOCITY : int = 10;
private var FIRE_RATE : float = 0.1;
private var POS_SEND_INTERVAL : float = 0.2;

// instance members(public)
public  var id : String = '';
public  var projectile : GameObject;

// instance members(private)
private var _nextFire : float = 0.0;
private var _lastPosition : Vector3;
private var _lastSendedPosition : Vector3;
private var _lastSendedTime : float;
private var _isMine : boolean = true;



function Start () {

	if (_isMine) {
		// randomize initial position
		var position : Vector3 = transform.position;
		position.x = Random.value * 18 - 9;
		position.z = Random.value * 18 - 9;
		transform.position = position;
		
		// randomize initial rotation
		transform.rotation =  Quaternion.Euler(0, Random.value * 360, 0);
	}
}

function Update () {

	if (_isMine) {
		HandleOperate();
	}
}


public function setLocation(position : Vector3, rotation : Quaternion, velocity : Vector3, angularVelocity : Vector3) {
	transform.position = position;
	transform.rotation = rotation;
	rigidbody.velocity = velocity;
	rigidbody.angularVelocity = angularVelocity;
}

public function setOther() {
	_isMine = false;
}

private function HandleOperate () {

	var cylinder:GameObject = GameObject.Find("Cylinder");  
	
	// Get the horizontal and vertical axis.
	// By default they are mapped to the arrow keys.
	// The value is in the range -1 to 1
	var translation : float = Input.GetAxis ("Vertical") * KEY_SPEED;
	var rotation : float = Input.GetAxis ("Horizontal") * KEY_ROTATION_SPEED;
	
	if (translation == 0.0 && rotation == 0.0) {
		var nowX : float = Input.GetAxis("Mouse X");
		var nowY : float = Input.GetAxis("Mouse Y");
		if (!Input.GetMouseButtonDown(0)) {
			translation = nowY * MOUSE_SPEED;
			rotation = nowX * MOUSE_ROTATION_SPEED;
		}
	}
	
	// Make it move 10 meters per second instead of 10 meters per frame...
	translation *= Time.deltaTime;
	rotation *= Time.deltaTime;
	
	// Move translation along the object's z-axis
	var dir : Vector3 = Vector3((cylinder.transform.position.x - transform.position.x),
		(cylinder.transform.position.y - transform.position.y),
		(cylinder.transform.position.z - transform.position.z));

	rigidbody.AddForce(dir.normalized * translation, ForceMode.Impulse);
//	transform.Translate (0, 0, translation);
	
	// Rotate around our y-axis
	transform.Rotate (0, rotation, 0);
	
	if (_lastPosition != transform.position) {
		_lastPosition = transform.position;
	}
	
	// Send my location to server
	if (_lastSendedPosition != _lastPosition &&
		(Time.time - _lastSendedTime) > POS_SEND_INTERVAL) {
		var csOnline : Online = GameObject.Find("Online").GetComponent("Online") as Online;
		csOnline.SendPosition(transform.position, transform.rotation, rigidbody.velocity, rigidbody.angularVelocity);
		_lastSendedPosition = transform.position;
		_lastSendedTime = Time.time;
	}
	
	// fire action
/*
	if ((Input.GetKey ("space") || Input.GetMouseButtonDown(0)) && Time.time > _nextFire) {
		_nextFire = Time.time + FIRE_RATE;
		
		var clone : GameObject = 
			Instantiate(projectile, transform.TransformPoint(0,0.5,3), transform.rotation) as GameObject;

		var vec : Vector3 = Vector3((cylinder.transform.position.x - transform.position.x),
			(cylinder.transform.position.y - transform.position.y),
			(cylinder.transform.position.z - transform.position.z)) * INITIAL_BULLET_VELOCITY;
		clone.rigidbody.velocity = vec;
		
	}
*/
}

