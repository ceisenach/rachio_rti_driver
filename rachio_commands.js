//
//  Startup Code
//

System.Print("Rachio Driver: Initializing...\r\n");

//
// Globals
//
var RACHIO_API = "api.rach.io";

var g_comm = new HTTP('OnCommRX'); //doesn't need to receive data
g_comm.OnConnectFunc = OnTCPConnect;
g_comm.OnDisconnectFunc = OnTCPDisconnect;
g_comm.OnConnectFailedFunc = OnConnectFailed;
g_comm.OnSSLHandshakeOKFunc = OnSSLHandshakeOK;
g_comm.OnSSLHandshakeFailedFunc = OnSSLHandshakeFailed;

var API_CALL = null;
var API_CALL_DATA = null;
var API_CALL_DATA_LENGTH = 0;

//
//  Internal Functions
//

function OnCommRX(data){
	//System.Print('RACHIO DATA - '+data+'\r\n');
	g_comm.Disconnect();
}

function water_zone() {
	//System.Print('RACHIO DRIVER - Sending Command to API')

	g_comm.Write("PUT /1/public/zone/start HTTP/1.1\r\n");
	g_comm.Write("Host: "+RACHIO_API+":443\r\n");
	g_comm.Write("Connection: keep-alive\r\n");
	g_comm.Write("Content-Length: "+API_CALL_DATA_LENGTH+"\r\n");
	g_comm.Write("Cache-Control: max-age=0\r\n");
	g_comm.Write("Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8\r\n");
	g_comm.Write("User-Agent: Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36\r\n");
	g_comm.Write("Accept-Encoding: gzip, deflate\r\n");
    g_comm.Write("Accept-Language: nl-NL,nl;q=0.8,en-US;q=0.6,en;q=0.4\r\n");
    g_comm.Write('Authorization: Bearer '+Config.Get("RachioToken")+'\r\n');
	g_comm.Write("Content-Type: application/json\r\n\r\n");
	g_comm.Write(API_CALL_DATA);
}

function OnTCPConnect() {
	System.LogInfo(1,"RACHIO DRIVER - Connected to Rachio API\r\n");
	var sslState = g_comm.StartSSLHandshake();
	if(!sslState){
		System.LogInfo(3,"RACHIO DRIVER -- SSL Failed");
	}
}

function OnTCPDisconnect() {
	System.LogInfo(1,"RACHIO DRIVER - Disconnected From Rachio API\r\n");
	g_comm.Close();
}

function OnConnectFailed() {
	System.LogInfo(3,"RACHIO DRIVER - Did Not Connect to Rachio API\r\n");
	g_comm.Close();
}

function OnSSLHandshakeOK() {
	System.LogInfo(1,"RACHIO DRIVER - SSL Handshake with Rachio API SUCCESS\r\n");
	eval(API_CALL+'()');
}

function OnSSLHandshakeFailed() {
	System.LogInfo(3,"RACHIO DRIVER - SSL Handshake with Rachio API FAILURE\r\n");
	g_comm.Close();
}

//
//  External Functions
//
function TimedWatering(time,ZoneID) {
	time = String(time);
	API_CALL_DATA = '{id:'+ZoneID+', duration:' +time+ '}\n\n';
	API_CALL_DATA_LENGTH = 4+ZoneID.length +11+time.length +3;
	API_CALL = 'water_zone';
	var openState = g_comm.Open(RACHIO_API, 443);
}