using UnityEngine;
using System.Collections;
using WebSocketSharp;
using System.Collections.Generic;
using LitJson;

class VectorInfo {
	public string x;
	public string y;
	public string z;
}

class QuaternionInfo {
	public string x;
	public string y;
	public string z;
	public string w;
}


class UserInfo {
	public VectorInfo position;
	public QuaternionInfo rotation;
	public VectorInfo velocity;
	public VectorInfo angularVelocity;
}


public class Online : MonoBehaviour {

//	const string ENDPOINT_URL = "ws://10.0.1.35:8080/";
	const string ENDPOINT_URL = "ws://honma-r-hand-wssample.nodejitsu.com/";
	
	const string PROXY_HOST = "10.0.0.21";
	const int PROXY_PORT = 3128;
	
    List<string> messages = new List<string>();

    // Use this for initialization
    void Start () {
        Connect();
    }
 
    // Update is called once per frame
    void Update () {
    }

    void FixedUpdate () {
		
		lock (messages) {
	 		GameObject obj = GameObject.Find("ObjectManager");
			foreach(string message in messages) {
	            obj.SendMessage("HandleRemoteData", message);
	        }
			messages.Clear();
		}
    }

 
    /// <summary>
    /// Raises the GU event.
    ///
    /// </summary>
    void OnGUI(){
    }
 
    WebSocket ws;
 
    void Connect(){
        ws =  new WebSocket(ENDPOINT_URL);
		if (Application.platform == RuntimePlatform.WindowsPlayer ||
		    Application.platform == RuntimePlatform.WindowsEditor) {
			ws.UseProxy = true;
			ws.ProxyHost = PROXY_HOST;
			ws.ProxyPort = PROXY_PORT;
		}
 
        // called when websocket messages come.
        ws.OnMessage += (sender, e) => {
			OnMessage(sender, e);
        };

        // called when websocket messages come.
        ws.OnOpen += (sender, e) => {
			OnOpen(sender);
        };
		
        // called when websocket messages come.
        ws.OnError += (sender, e) => {
			OnError(sender, e);
        };

		try {
        	ws.Connect();
		} catch (System.Exception e) {
			Debug.Log("Connection failed." + e.Message);
			return;
		}

        Debug.Log("Connect to " + ws.Url);
		Debug.Log("IsAlive:" + ws.IsAlive);
		Debug.Log("ReadyState:" + ws.ReadyState);
		
    }
	
	
	public void OnMessage(object sender, MessageEventArgs e){

		string text = e.Data;
		lock (messages) {
			messages.Add(text);
		}
	}

	public void OnOpen(object sender){

		Debug.Log("OnOpen: connected");
	}

	public void OnError(object sender, ErrorEventArgs e){

		Debug.Log("onError: " + e.Message);
	}

    public void SendPosition(Vector3 position, Quaternion rotation, Vector3 velocity, Vector3 angularVelocity){
		
		UserInfo container = new UserInfo();
		container.position = new VectorInfo();
		container.rotation = new QuaternionInfo();
		container.velocity = new VectorInfo();
		container.angularVelocity = new VectorInfo();
		
		container.position.x = System.Convert.ToString(position.x);
		container.position.y = System.Convert.ToString(position.y);
		container.position.z = System.Convert.ToString(position.z);

		container.rotation.x = System.Convert.ToString(rotation.x);
		container.rotation.y = System.Convert.ToString(rotation.y);
		container.rotation.z = System.Convert.ToString(rotation.z);
		container.rotation.w = System.Convert.ToString(rotation.w);

		container.velocity.x = System.Convert.ToString(velocity.x);
		container.velocity.y = System.Convert.ToString(velocity.y);
		container.velocity.z = System.Convert.ToString(velocity.z);

		container.angularVelocity.x = System.Convert.ToString(angularVelocity.x);
		container.angularVelocity.y = System.Convert.ToString(angularVelocity.y);
		container.angularVelocity.z = System.Convert.ToString(angularVelocity.z);

		string message = JsonMapper.ToJson(container);
//		Debug.Log("message =" + message);
//		Debug.Log("ws =" + ws);
        ws.Send(message);
    }

}
