System.Print("Rachio Driver UTILS: Initializing...\r\n");


function UTIL_ARRAY_new(length) {
	var nza = new Array(length);
	for(i=0;i<length;i++){
		nza[i]=0;
	}
	return nza;
}

function UTIL_QUEUE_new(length) {
	var nq = new Object();
	nq.array = UTIL_ARRAY_new(length);
	nq.max_length = length;
	nq.length = 0;
	nq.isEmpty = function(){
		if(nq.length == 0){
			return true;
		}
		return false;
	};
	nq.add = function(a) {
		if(nq.length == nq.max_length) {
			var old_entry = nq.remove();
		}
		nq.array[nq.length] = a;
		nq.length = nq.length + 1;
	};
	nq.remove = function() {
		if(nq.length == 0){
			return null;
		}
		var first_entry = nq.array[0];
        for(i=1;i < nq.length; i++){
            nq.array[i-1] = nq.array[i];
        }
        nq.length = nq.length - 1;
		return first_entry;
	};

	return nq;
}


function UTIL_RACHIO_PUT_REQUEST_new(endpoint,payload) {
	var nc = new Object();
	nc.endpoint = endpoint;
	nc.payload = payload;
	nc.request_type = "PUT";
	nc.write = function(net_comm,api_address) {
		net_comm.Write("PUT "+nc.endpoint+" HTTP/1.1\r\n");
		net_comm.Write("Host: "+api_address+":443\r\n");
		net_comm.Write("Connection: keep-alive\r\n");
		net_comm.Write("Content-Length: "+nc.payload.length+"\r\n");
		net_comm.Write("Cache-Control: max-age=0\r\n");
		net_comm.Write("Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8\r\n");
		net_comm.Write("User-Agent: Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36\r\n");
		net_comm.Write("Accept-Encoding: gzip, deflate\r\n");
	    net_comm.Write("Accept-Language: nl-NL,nl;q=0.8,en-US;q=0.6,en;q=0.4\r\n");
	    net_comm.Write('Authorization: Bearer '+Config.Get("RachioToken")+'\r\n');
		net_comm.Write("Content-Type: application/json\r\n\r\n");
		net_comm.Write(nc.payload);
	};
	return nc;
}

function UTIL_RACHIO_GET_REQUEST_new(endpoint) {
	var nc = new Object();
	nc.endpoint = endpoint;
	nc.request_type = "GET";
	nc.write = function(net_comm,api_address) {
		var rs = net_comm.Write("GET "+nc.endpoint+" HTTP/1.1\r\n");
		net_comm.Write("Host: "+api_address+":443\r\n");
		net_comm.Write("Connection: keep-alive\r\n");
		net_comm.Write("Cache-Control: max-age=0\r\n");
		net_comm.Write("Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8\r\n");
		net_comm.Write("User-Agent: Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36\r\n");
		net_comm.Write("Accept-Encoding: gzip, deflate\r\n");
	    net_comm.Write("Accept-Language: nl-NL,nl;q=0.8,en-US;q=0.6,en;q=0.4\r\n");
	    net_comm.Write('Authorization: Bearer '+Config.Get("RachioToken")+'\r\n');
		net_comm.Write("Content-Type: application/json\r\n\r\n");
	};

	return nc;
}