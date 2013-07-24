/*
	WSSampleテスト用サーバアプリ
*/


/////////////////////////////////////////////////
// インポート

// ライブラリモジュール
var http = require('http');
var mongoose = require('mongoose');
var WSServer = require('websocket').server;
var url = require('url');


/////////////////////////////////////////////////
// 定義

// DB URL
var DB_URL = 'mongodb://nodejitsu:ed214e8b686991aeeb7ca885b2bcf36b@dharma.mongohq.com:10005/nodejitsudb1140433931';
//var DB_URL = 'mongodb://localhost/wssample' // ローカル用(node_memo_demo)

// wsプロトコルの待ち受けポート
var PORT_NO = 80;
//var port_no = 8080; // for local

///////////////////////////////////////////////////////////
// DBスキーマ定義
var userInfoSchemaString = {
	user:{
		id:String,
		enabled:Number
	},
	position:{
		x:String,
		y:String,
		z:String
	},
	rotation:{
		x:String,
		y:String,
		z:String,
		w:String
	},
	velocity:{
		x:String,
		y:String,
		z:String
	},
	angularVelocity:{
		x:String,
		y:String,
		z:String
	}
};

/////////////////////////////////////////////////
// グローバル

// セッション保持用
var connections = {};


/////////////////////////////////////////////////
// 処理

console.log('starting server ...');

// DB接続
console.log('connecting to mongo DB (' + DB_URL + ') ...');
var db = mongoose.connect(DB_URL);
mongoose.connection.on('error', function(){
	console.log('mongoose connection error.');
	process.exit();
});
console.log('connecting to mongo DB OK');

// スキーマモデル初期化
var userInfoSchema = new mongoose.Schema(userInfoSchemaString);
var userInfoModel = db.model('userInfo', userInfoSchema);

// 接続のエントリポイント
var plainHttpServer = http.createServer(function(req, res) {
	console.log('got request');
	res.writeHead(200, { 'Content-Type': 'text/html'});
	res.end();
});
plainHttpServer.listen(PORT_NO, function() {
    console.log((new Date()) + ' Server is listening on port.' + PORT_NO);
});

// WebSocketサーバを初期化
var webSocketServer = new WSServer({httpServer: plainHttpServer});

webSocketServer.on('request', function (req) {
	console.log('requested ' + req);

    if (!originIsAllowed(req.origin)) {
      // Make sure we only accept requests from an allowed origin
      req.reject();
      console.log((new Date()) + ' Connection from origin ' + req.origin + ' rejected.');
      return;
    }
    
	var websocket = req.accept(null, req.origin);
	console.log('websocket=' + toString(websocket));

	var userInfo = new userInfoModel();
	userInfo.user.enabled = 0;
	userInfo.save(function(err){
		if(err){
			console.log('error:' + toString(err));
			return;
		} else {
			// TODO

		}
	});
	
	
	var sid = userInfo._id;
	connections[sid] = websocket;

	console.log('connected:' + userInfo);
	console.log('userInfo._id:' + userInfo._id);
	console.log('sid:' + sid);
	sendAllUserInfo(sid);
	
	websocket.on('message', function (msg) {
		onMessage(msg, req, sid);
	});
	websocket.on('close', function (code, desc) {
		onClose(sid, code, desc);
	});


});

console.log('ws server has been crerated.');

var vectorObject = function(x, y, z) {
	
	this.x = x;
	this.y = y;
	this.z = z;
}

var quaternionObject = function(x, y, z, w) {
	
	this.x = x;
	this.y = y;
	this.z = z;
	this.w = w;
}

var sendObject = function(id, type, posision, rotation, velocity, angularVelocity) {
	
	this.id = id;
	this.type = type;
	this.position = posision;
	this.rotation = rotation;
	this.velocity = velocity;
	this.angularVelocity = angularVelocity;
}


function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

function onMessage(msg, req, sid) {
	
	// DBの自機情報を更新
	userInfoModel.findOne({_id:sid}, function(err,info){
	
		if(!err || info !== null){
			data = JSON.parse(msg.utf8Data);
			info.user.enabled = 1;
			
			info.position.x = data.position.x;
			info.position.y = data.position.y;
			info.position.z = data.position.z;
			
			info.rotation.x = data.rotation.x;
			info.rotation.y = data.rotation.y;
			info.rotation.z = data.rotation.z;
			info.rotation.w = data.rotation.w;
			
			info.velocity.x = data.velocity.x;
			info.velocity.y = data.velocity.y;
			info.velocity.z = data.velocity.z;

			info.angularVelocity.x = data.angularVelocity.x;
			info.angularVelocity.y = data.angularVelocity.y;
			info.angularVelocity.z = data.angularVelocity.z;

			info.save();
		}
		
		// 対戦メンバーにブロードキャスト
		for(var i in connections) {
			if(i != sid) {
				var position = new vectorObject(data.position.x, data.position.y, data.position.z);
				var rotation = new quaternionObject(data.rotation.x, data.rotation.y, data.rotation.z, data.rotation.w);
				var velocity = new vectorObject(data.velocity.x, data.velocity.y, data.velocity.z);
				var angularVelocity = new vectorObject(data.angularVelocity.x, data.angularVelocity.y, data.angularVelocity.z);
				var jsonObj = new sendObject(sid, 0, position, rotation, velocity, angularVelocity);
				var jsonText = JSON.stringify(jsonObj);
				connections[i].sendUTF(jsonText);
//				console.log('sending :' + jsonText);
			}
		}

	});

}

function onClose(sid, code, desc) {
	console.log('connection released! :' + code + ' - ' + desc);
	
	// セッションから削除
	delete connections[sid];

	// 全ユーザに切断を通知
	for(var i in connections) {
		var jsonObj = new sendObject(sid, 1, null, null, null, null);
		var jsonText = JSON.stringify(jsonObj);
		connections[i].sendUTF(jsonText);
	}
	
	// DBから削除
	userInfoModel.remove({_id : sid }, function(err){
		console.log('delete record from mongo DB failed: _id=' + sid);
	});
}


function sendAllUserInfo(sid) {

	// ユーザにすべてのユーザの位置情報を通知する
	console.log('sending infomation of others to:' + sid);
	userInfoModel.find({_id : { $ne : sid }}, function(err, docs){
	
		if(!err || docs !== null){
			console.log('count of others:' + docs.length);
			for(var i in connections) {
				if(i == sid) {
					for (var idx in docs) {
						var cursor = docs[idx];
						// 位置情報を持つユーザのみ送信
						if (cursor.user.enabled != 0 && cursor._id != sid) {
							var position = new vectorObject(cursor.position.x, cursor.position.y, cursor.position.z);
							var rotation = new quaternionObject(cursor.rotation.x, cursor.rotation.y, cursor.rotation.z, cursor.rotation.w);
							var velocity = new vectorObject(cursor.velocity.x, cursor.velocity.y, cursor.velocity.z);
							var angularVelocity = new vectorObject(cursor.angularVelocity.x, cursor.angularVelocity.y, cursor.angularVelocity.z);
							var jsonObj = new sendObject(cursor._id, 0, position, rotation, velocity, angularVelocity);
							var jsonText = JSON.stringify(jsonObj);
							connections[i].sendUTF(jsonText);
						}
					}
					break;
				}
			}
		}
	});

}
