
//var go : GameObject;

function OnGUI () {
	var player : GameObject = GameObject.Find("MyPlayer");
	var text =  "position x:" + player.transform.position.x +
				", y:" + player.transform.position.y +
				", z:" + player.transform.position.z +
				"\nrotation x:" + player.transform.rotation.x +
				", y:" + player.transform.rotation.y +
				", z:" + player.transform.rotation.z +
				", w:" + player.transform.rotation.w;
				
	guiText.text = text;
}
