let flag = 0;
self.addEventListener('message', event => {
	// event is an ExtendableMessageEvent object
	console.log(`The client sent me a message: ${event.data}`);
	//let transid = event.data.tranid;
	flag = 1;
});
let transid = 0;
self.addEventListener('fetch', function(event) {
	console.log("SW URL : "+ event.request.url);
	var url = event.request.url.split('/');

	if(url.includes("payment")){
		event.respondWith(
			sendRequestToFIDOServer(event)
				.then(data => sendIframeInitToMainFrame(event,data))
				.then(()=> waitForIframeAuthentication())
				.then((res)=>verifyFIDOAuthentication(transid,res))
				.then((body)=>buildFetchResponse(body,event))

			// sendInfoToBrowser(event)
			// 	.then(waitForIframeAuthentication)
			// .then(()=>fidoProcess(event))
		);
	}else{
		event.respondWith(
			fetch(event.request));
	}
});

async function sendRequestToFIDOServer(event){
	// Take request body and send to FIDO server
	// FIDO server will give you url that you will use to open iframe so change the line below
	console.log(event.request.credentials);
	return fetchcritical(event.request)
		.then((data) => {
			console.log(data)
			return fetch('http://localhost:3000/webauthn/transaction/init', {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				body: data
			}).then((response) => response.json())
				.then((response) => {
					if(!response.url ) {
						console.info("Error Occured");
						throw new Error(`Server responed with error. The message is: ${response.message}`);
					}
					transid=response.tranid;
					return response
				});
		});

	//let url = "http://localhost:3000/webauthn/transaction/1234/iframe.html"
	//return Promise.resolve(url)
}

async function sendIframeInitToMainFrame(event,data){
	return sendMessageToMainFrame(event,"FIDO_INIT_IFRAME",data)
}

async function waitForIframeAuthentication(){
	// Check if iframe from main page sent complete message
	// Sleep in loop and check if the mainframe sent a message about closing
	let result = await flagCheck();
	if(result){
		return {status:"Success"};
	}else{
		console.log("No answer from iframe sleeping")
		return {status:"Fail",message:"Timed Out!"}
	}

}
let c= 0;
async function flagCheck(){
	if(flag == 0) {
		await sleep(2000);
		c=c+1;
		console.log("Counter "+c);
		if(c>30){
			c=0;
			return false;
		}
		await flagCheck();
		/* this checks the flag every 100 milliseconds*/
	} else {
		flag = 0;
	}
	return true
}

async function verifyFIDOAuthentication(transactionId,res){
	if(!res.status == "Success"){
		throw new Error(`Server responed with error. The message is: TIMEOUT`);
	}
	// Call FIDO server to check if FIDO verification was completed
	console.log("Transaction ID for verification: "+transactionId);
	return fetch('http://localhost:3000/webauthn/transaction/verify', {
		method: 'POST',
		credentials: 'include',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body:  JSON.stringify({transactionId})
	}).then((response) => response.json())
		.then((response) => {
			if(!response.status ) {
				console.info("Error Occured ");
				throw new Error(`Server responed with error. The message is: ${response.message}`);
			}
			console.info("Resp Occured");
			return response
		});
	// If yes FIDO server should execute call ot backend and return the body response to you
	// If false FIDO server returns error status
	//return Promise.resolve({data:"mock data from response"})
}

async function buildFetchResponse(body,event){
	if(!body.status == "Success") {
		console.info("Error Occured");
		throw new Error(`Server responed with Error. The message is: ${response.message}`);
	}else{
		return new Response(JSON.stringify(body));
	}

}

async function sendMessageToMainFrame(event, type, data){
	if (!event.clientId) {
		return Promise.reject("clientID missing")
	}
	const client = await clients.get(event.clientId);
	if (!client) {
		return Promise.reject("client not found")
	}
	return client.postMessage({
		msg: type,
		data: data
	});
}

async function sendInfoToBrowser(event){
	if (!event.clientId) {
		return Promise.reject("clientID missing")
	}
	const client = await clients.get(event.clientId);
	if (!client) {
		return Promise.reject("client not found")
	}
	console.log("Client ID : " + client);
	//Step 1: Intercepting the request and sending post msg to open iframe
	return fetchcritical(event.request).then(body => {
		console.log("SW body : " + body.mode);
		client.postMessage({
			data: body,
			msg: "FIDO",
			url: event.request.url
		});
	});
}
function fidoProcess(event){
	// Final step: Returning Response
	console.log("Process Starting");
	var fallbackResponse = {
			status: "Authenticated",
			message: "Modified Transaction"
	};
	return new Response(JSON.stringify(fallbackResponse), {
			headers: {'Content-Type': 'application/json'}
	});
}
function fetchcritical(request){
	return request.json().then(data => {
		console.log("SW request data : "+JSON.stringify(data));

		var payment = {
			url: request.url,
			requestData: data
		};
		console.log("SW pay data : "+JSON.stringify(payment));
		return JSON.stringify(payment);
	});	
	
}

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

function sleepFor( sleepDuration ){
	var now = new Date().getTime();
	while(new Date().getTime() < now + sleepDuration){ /* do nothing */ }
}

