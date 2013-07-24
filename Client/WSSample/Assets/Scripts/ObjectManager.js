
var objects : Array;

public  var projectile : GameObject;

function Awake(){
 Application.targetFrameRate = 60;
}

function Start () {
	objects = new Array();
}


function Update () {
}


public function HandleRemoteData(arg : String) {
	Debug.Log("Receive:" + arg);
	
	var data: LitJson.JsonData = LitJson.JsonMapper.ToObject(arg);
	var user_id : String = data["id"].ToString();
	var type : Number = parseFloat(data["type"].ToString());
	
	switch (type) {
	case 0:
		HandleUpdateLocationInfo(user_id, data);
		break;
	case 1:
		HandleUserLeave(user_id, data);
		break;
	default:
		break;
	}
}


private function HandleUpdateLocationInfo(user_id: String, data: LitJson.JsonData) {

	var player : Player = null;
	
	// If does not exist yet, instantiate.
	for (var obj : GameObject in objects) {
		var playerTmp : Player = obj.GetComponent("Player");
		if(playerTmp.id == user_id) {
			player = playerTmp;
			break;
		}
	}
	
	var position : Vector3;
	var rotation : Quaternion;
	var velocity : Vector3;
	var angularVelocity : Vector3;
	
	position = GetPositionFromJsonObj(data);
	rotation = GetRotationFromJsonObj(data);
	velocity = GetVelocityFromJsonObj(data);
	angularVelocity = GetAngularVelocityFromJsonObj(data);
	
	if (position != null && rotation != null) {
		if (player != null) {
			player.setLocation(position, rotation, velocity, angularVelocity);
		} else {
			Debug.Log("@ here comes new user:" + user_id);
			InstantiateNewPlayer(user_id, position, rotation, velocity, angularVelocity);
		}
	}
}


private function HandleUserLeave(user_id: String, data: LitJson.JsonData) {

	var idx : Number = -1;
	var count : Number = 0;
	for (var obj : GameObject in objects) {
		var playerTmp : Player = obj.GetComponent("Player");
		if(playerTmp.id == user_id) {
			Debug.Log("@@ destroy user:" + user_id);
			idx = count;
			Destroy(obj);
			break;
		}
		count++;
	}
	if (idx != -1) {
		objects.splice(idx, 1);
	}
}



private function GetPositionFromJsonObj(data : LitJson.JsonData) {

	var position : Vector3 = new Vector3();
	
	var tmpPos : LitJson.JsonData = data["position"];

	var str_x = tmpPos["x"].ToString();
	var str_y = tmpPos["y"].ToString();
	var str_z = tmpPos["z"].ToString();
	if (str_x.Length == 0 || str_y.Length == 0 || str_z.Length == 0) {
		return null;
	}
	position.x = float.Parse(str_x);
	position.y = float.Parse(str_y);
	position.z = float.Parse(str_z);

	return position;
}


private function GetRotationFromJsonObj(data : LitJson.JsonData) {

	var rotation : Quaternion = new Quaternion();
	
	var tmpRot : LitJson.JsonData = data["rotation"];

	var str_x = tmpRot["x"].ToString();
	var str_y = tmpRot["y"].ToString();
	var str_z = tmpRot["z"].ToString();
	var str_w = tmpRot["w"].ToString();
	if (str_x.Length == 0 || str_y.Length == 0 || str_z.Length == 0 || str_w.Length == 0) {
		return null;
	}
	rotation.x = double.Parse(str_x);
	rotation.y = double.Parse(str_y);
	rotation.z = double.Parse(str_z);
	rotation.w = double.Parse(str_w);
	
//	Debug.Log("str_x" + str_x + ", rotation.x" + rotation.x);
//	Debug.Log("str_y" + str_y + ", rotation.y" + rotation.y);
//	Debug.Log("str_z" + str_z + ", rotation.z" + rotation.z);
//	Debug.Log("str_w" + str_w + ", rotation.w" + rotation.w);

	return rotation;

}

private function GetVelocityFromJsonObj(data : LitJson.JsonData) {

	var velocity : Vector3 = new Vector3();
	
	var tmpPos : LitJson.JsonData = data["velocity"];

	var str_x = tmpPos["x"].ToString();
	var str_y = tmpPos["y"].ToString();
	var str_z = tmpPos["z"].ToString();
	if (str_x.Length == 0 || str_y.Length == 0 || str_z.Length == 0) {
		return null;
	}
	velocity.x = float.Parse(str_x);
	velocity.y = float.Parse(str_y);
	velocity.z = float.Parse(str_z);

	return velocity;
}

private function GetAngularVelocityFromJsonObj(data : LitJson.JsonData) {

	var angularVelocity : Vector3 = new Vector3();
	
	var tmpPos : LitJson.JsonData = data["angularVelocity"];

	var str_x = tmpPos["x"].ToString();
	var str_y = tmpPos["y"].ToString();
	var str_z = tmpPos["z"].ToString();
	if (str_x.Length == 0 || str_y.Length == 0 || str_z.Length == 0) {
		return null;
	}
	angularVelocity.x = float.Parse(str_x);
	angularVelocity.y = float.Parse(str_y);
	angularVelocity.z = float.Parse(str_z);

	return angularVelocity;
}



private function InstantiateNewPlayer(user_id, position, rotation, velocity, angularVelocity) {

	var clone : GameObject = 
		Instantiate(projectile, position, rotation) as GameObject;
	clone.rigidbody.velocity = velocity;
	clone.rigidbody.angularVelocity = angularVelocity;
	var clonePlayer : Player = clone.GetComponent("Player");
	clonePlayer.id = user_id;
	clonePlayer.setOther();
		
	objects.push(clone);
}



