//
//  Startup Code
//

System.Print("Rachio Driver: Initializing...\r\n");

//
// Globals - HTTP Buffer Object
//
var RACHIO_API = "api.rach.io";

var NET_COMM = new HTTP('OnCommRX');
NET_COMM.OnConnectFunc = OnTCPConnect;
NET_COMM.OnDisconnectFunc = OnTCPDisconnect;
NET_COMM.OnConnectFailedFunc = OnConnectFailed;
NET_COMM.OnSSLHandshakeFailedFunc = on_ssl_handshake_failed;
NET_COMM.OnSSLHandshakeFailedFunc = on_ssl_handshake_ok;

// Globals - STATIC VARS FOR QUEUED COMMANDS
var REQUEST_QUEUE = UTIL_QUEUE_new(100);

// Timers
var REFRESH_TIMER = new Timer();
var REFRESH_INTERVAL = 5000; // every second request status from API, flush command queue
REFRESH_TIMER.Start(on_refresh_timer,REFRESH_INTERVAL);


//
//  Internal Functions
//


// send queue and update status
// this should only be called when already connected
// and SSL authenticated
function update_status_and_queue() {
    // Update Watering Status
    var st_rq = UTIL_RACHIO_GET_REQUEST_new('/1/public/device/'+Config.Get("RachioDeviceID")+'/current_schedule');
    st_rq.write(NET_COMM);

    // Send any messages in queue
    var next_request = REQUEST_QUEUE.remove();
    while(next_request !== null){
        System.LogInfo(1,'RACHIO DRIVER - Sending Reuest\r\n');
        next_request.write(NET_COMM,RACHIO_API);
        next_request = REQUEST_QUEUE.remove();
    }

    // Restart Refresh Timer
    REFRESH_TIMER.Start(on_refresh_timer,REFRESH_INTERVAL);
}

function on_refresh_timer() {
	// If currently disconnected
	if(NET_COMM.ConnectState == 0){
		NET_COMM.Close();
		// register proper callbacks for what happens next
		NET_COMM.OnSSLHandshakeOKFunc = on_ssl_handshake_ok_refresh_timer;
		NET_COMM.OnSSLHandshakeFailedFunc = on_ssl_handshake_failed_refresh_timer;
		NET_COMM.OnConnectFunc = OnTCPConnect_refresh_timer;
	    var openState = NET_COMM.Open(RACHIO_API, 443);
	} else {
		// If connected, assume SSL session valid
		// thus update can be performed
		update_status_and_queue();
	}
}

//
// SSL Ok Callbacks
//
function on_ssl_handshake_ok() {
	System.LogInfo(1,"RACHIO DRIVER - SSL Handshake with Rachio API SUCCESS\r\n");
}

// callback for update status and queue
function on_ssl_handshake_ok_refresh_timer() {
	System.LogInfo(1,"RACHIO DRIVER - SSL Handshake with Rachio API SUCCESS\r\n");
	update_status_and_queue();
}



//
// SSL Failed Callbacks
//
function on_ssl_handshake_failed() {
	System.LogInfo(1,"RACHIO DRIVER - SSL Handshake with Rachio API FAILURE\r\n");
	NET_COMM.Close();
}

function on_ssl_handshake_failed_refresh_timer() {
	System.LogInfo(1,"RACHIO DRIVER - SSL Handshake with Rachio API FAILURE\r\n");
	NET_COMM.Close();

	// Restart Refresh Timer
    REFRESH_TIMER.Start(on_refresh_timer,REFRESH_INTERVAL);
}


//
// TCP Data Received Callbacks
//
function OnCommRX(data){
	System.Print('RACHIO DATA - '+data.length+'\r\n');
	System.Print('RACHIO DATA - '+data+'\r\n');
	System.Print('RACHIO DATA - '+data.length+'\r\n');

	// check for currently running status in response
	var running_str = '"status":"PROCESSING"';
	if(data.indexOf(running_str) !== -1 && data.indexOf('200') !== -1) {
		SystemVars.Write('RACHIO_watering_on',true);
	}
	if(data.indexOf(running_str) === -1 && data.indexOf('200') !== -1) {
		SystemVars.Write('RACHIO_watering_on',false);
	}
}


//
// TCP Connect Callbacks
//
// If TCP connection successfully established, then SSL handshake should
// be performed since Rachio API requires this.
function OnTCPConnect() {
	System.LogInfo(1,"RACHIO DRIVER - Connected to Rachio API\r\n");

	var sslState = NET_COMM.StartSSLHandshake();

	// if sslState == false, that means there was an error and NO CALLBACK
	// will be called. We should close connection since without handshake,
	// we cannot access API.
	if(!sslState){
		System.LogInfo(1,"RACHIO DRIVER -- SSL Failed");
		NET_COMM.Close();
	}
}


function OnTCPConnect_refresh_timer() {
	System.LogInfo(1,"RACHIO DRIVER - Connected to Rachio API\r\n");

	var sslState = NET_COMM.StartSSLHandshake();

	// if sslState == false, that means there was an error and NO CALLBACK
	// will be called. We should close connection since without handshake,
	// we cannot access API.
	if(!sslState){
		System.LogInfo(1,"RACHIO DRIVER -- SSL Failed");
		REFRESH_TIMER.Start(on_refresh_timer,REFRESH_INTERVAL);
		NET_COMM.Close();
	}
}



//
// TCP Disconnect Callbacks
//
// If TCP connection disconnects, we should to completely close the
// connection so it can be reopened later and the connection
// re-established. This will also force new SSL handshake
function OnTCPDisconnect() {
	System.LogInfo(1,"RACHIO DRIVER - Disconnected From Rachio API\r\n");
	NET_COMM.Close();
}



//
// TCP Failure Callbacks
//
// If TCP Connect fails, we should to completely close the
// connection so it can be reopened later
function OnConnectFailed() {
	System.LogInfo(1,"RACHIO DRIVER - Did Not Connect to Rachio API\r\n");
	NET_COMM.Close();
}


//
//  External Functions
//
function TimedWatering(time,ZoneID) {
	time = String(time);
	var tw_payload = '{id:'+ZoneID+', duration:' +time+ '}\n\n';
	var tw_endpoint = '/1/public/zone/start';
	var tw_request = UTIL_RACHIO_PUT_REQUEST_new(tw_endpoint,tw_payload);
	REQUEST_QUEUE.add(tw_request);
}