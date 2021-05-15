self.addEventListener('fetch', function(event) {
	console.log("SW URL : "+ event.request.url);
	var url = event.request.url.split('/');
	if(url.includes("payment")){
		event.respondWith(
			sendRequestToFIDOServer(event)
				.then(data => sendIframeInitToMainFrame(event,data))
				.then(()=> waitForIframeAuthentication())
				.then(()=>verifyFIDOAuthentication())
				.then((body)=>buildFetchResponse(body))


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
	let url = "http://localhost:3000/webauthn/transaction/1234/iframe.html"
	return Promise.resolve(url)
}


async function sendIframeInitToMainFrame(event,data){
	return sendMessageToMainFrame(event,"FIDO_INIT_IFRAME",data)
}

async function waitForIframeAuthentication(){
	// Check if iframe from main page sent complete message
	// Sleep in loop and check if the mainframe sent a message about closing
	console.log("No answer from iframe sleeping")
	return sleep(10000)
}

async function verifyFIDOAuthentication(transactionId){
	// Call FIDO server to check if FIDO verification was completed
	// If yes FIDO server should execute call ot backend and return the body response to you
	// If false FIDO server returns error status
	return Promise.resolve({data:"mock data from response"})
}

async function buildFetchResponse(body){
	let response = new Response(JSON.stringify(body), {
		headers: {'Content-Type': 'application/json'}
	});
	return Promise.resolve(response)
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
		console.log("SW c : "+data.customerName);

		var payment = {
			url: 'card.html', 
			apikey: data.apikey,
			redirectUrl: data.redirectUrl, 
			mode: data.mode,
			customerName: data.customerName, 
			customerReference: data.customerReference, 
			paymentAmount: data.paymentAmount 
		}; 
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

