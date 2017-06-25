//
//  Startup Code
//

System.Print("Rachio Driver: Initializing...\r\n");

//
// Globals - HTTP Buffer Object
//
var RACHIO_API = "api.rach.io";

var net_comm = new HTTP('OnCommRX');
net_comm.OnConnectFunc = OnTCPConnect;
net_comm.OnDisconnectFunc = OnTCPDisconnect;
net_comm.OnConnectFailedFunc = OnConnectFailed;
net_comm.OnSSLHandshakeOKFunc = update_status_and_queue;
net_comm.OnSSLHandshakeFailedFunc = OnSSLHandshakeFailed;

// Globals - STATIC VARS FOR QUEUED COMMANDS
var REQUEST_QUEUE = UTIL_QUEUE_new(100);

// Timers
var refresh_timer = new Timer();
var refresh_interval = 5000; // every second request status from API, flush command queue
refresh_timer.Start(On_refresh_timer,refresh_interval);


//
//  Internal Functions
//
// send queue and update status
function update_status_and_queue() {
	System.Print('RACHIo DEBUG -- Updating status and sendning\r\n');
    // if(net_comm.ConnectState == 0){
    	// net_comm.Close();
     //    var openState = net_comm.Open(RACHIO_API, 443);
    // }

    // Update Watering Status
    var st_rq = UTIL_RACHIO_GET_REQUEST_new('/1/public/device/'+Config.Get("RachioDeviceID")+'/current_schedule');
    st_rq.write(net_comm);
    System.Print('RACHIO DEBUG -- '+String(REQUEST_QUEUE));
    // Send any messages in queue
    var next_request = REQUEST_QUEUE.remove();
    while(next_request != null){
        System.LogInfo(1,'PENTAIR DRIVER - Sending Message\r\n');
        next_request.write(net_comm,RACHIO_API);
        next_request = REQUEST_QUEUE.remove();
    }

    // Restart Refresh Timer
    refresh_timer.Start(On_refresh_timer,refresh_interval);
}

function On_refresh_timer() {
	System.Print('RACHIo DEBUG -- refresh timer\r\n');
	net_comm.Close();
    var openState = net_comm.Open(RACHIO_API, 443);
}

function OnCommRX(data){
	System.Print('RACHIO DATA - '+data.length+'\r\n');
	System.Print('RACHIO DATA - '+data+'\r\n');
	System.Print('RACHIO DATA - '+data.length+'\r\n');
}

function OnTCPConnect() {
	System.Print('RACHIO DEBUG -- TCP CONNECT');
	System.LogInfo(1,"RACHIO DRIVER - Connected to Rachio API\r\n");
	var sslState = net_comm.StartSSLHandshake();
	System.Print('RACHIo DEBUG -- ssl state:'+String(sslState)+'\r\n');
	if(!sslState){
		System.LogInfo(1,"RACHIO DRIVER -- SSL Failed");
	}
}

function OnTCPDisconnect() {
	System.Print('RACHIO DEBUG -- TCP DISCONNECT');
	System.LogInfo(1,"RACHIO DRIVER - Disconnected From Rachio API\r\n");
	net_comm.Close();
}

function OnConnectFailed() {
	System.Print('RACHIO DEBUG -- CONNECT FAILED');
	System.LogInfo(1,"RACHIO DRIVER - Did Not Connect to Rachio API\r\n");
	net_comm.Close();
}

function OnSSLHandshakeOK() {
	System.Print('RACHIO DEBUG -- SSL HANDSHAKE OK');
	System.LogInfo(1,"RACHIO DRIVER - SSL Handshake with Rachio API SUCCESS\r\n");
}

function OnSSLHandshakeFailed() {
	System.Print('RACHIO DEBUG -- SSL HANDSHAKE FAILED');
	System.LogInfo(1,"RACHIO DRIVER - SSL Handshake with Rachio API FAILURE\r\n");
	net_comm.Close();
}

//
//  External Functions
//
function TimedWatering(time,ZoneID) {
	System.Print('Timed Watering:'+String(time)+' '+ZoneID);
	time = String(time);
	var tw_payload = '{id:'+ZoneID+', duration:' +time+ '}\n\n';
	var tw_endpoint = '/1/public/zone/start';
	var tw_request = UTIL_RACHIO_PUT_REQUEST_new(tw_endpoint,tw_payload);
	REQUEST_QUEUE.add(tw_request);
}