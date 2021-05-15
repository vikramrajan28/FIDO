self.addEventListener('fetch', function(event) {
	console.log("SW URL : "+ event.request.url);
	var url = event.request.url.split('/');
	if(url.includes("payment")){
		event.respondWith(
			sendInfoToBrowser(event).then(()=> {
				console.log("Slept");
				sleepFor(5000);
			}).then(()=>fidoProcess(event))
		);
	}else{
		event.respondWith(
			fetch(event.request));
	}
  
});
async function sendInfoToBrowser(event){
	if (!event.clientId) return;
	const client = await clients.get(event.clientId);
	if (!client) return;
	console.log("Client ID : " + client);
	//Step 1: Intercepting the request and sending post msg to open iframe
	await fetchcritical(event.request).then(body => {
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

function sleepFor( sleepDuration ){
	var now = new Date().getTime();
	while(new Date().getTime() < now + sleepDuration){ /* do nothing */ }
}

