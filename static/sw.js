self.addEventListener('fetch', function(event) {
	console.log("SW URL : "+ event.request.url);
	var url = event.request.url.split('/');
	if(url.includes("payment")){
		// event.waitUntil(async function() {/*https://developer.mozilla.org/en-US/docs/Web/API/Client/postMessage*/
		// 	if (!event.clientId) return;
		// 	const client = await clients.get(event.clientId);
		// 	if (!client) return;
		// 	fetchcritical(event.request).then(body => {
		// 		console.log("SW body : "+body.mode);
		// 		client.postMessage({
		// 			data: body,
		// 			msg: "FIDO",
		// 			url: event.request.url
		// 		});
		// 	});
		//
		//
		// }());
		// sleepFor( 50000 )

		event.respondWith(call());

		// 1. Send to fido new request -?
		// 2. Response from FIDO with id
		// 3. Open Iframe
		// 4. Iframe executes
		// 5. Control retuns to sw
		// 6. Call fido again to get response
		// 7. Release the response
	}else{
		event.respondWith(
			fetch(event.request));
	}
  
});

function call(){
	var fallbackResponse = {
		status: "C",
		body: "sdf",
		message: "Failed Transaction"
	};
	// fetch('https://jsonplaceholder.typicode.com/todos/1')
	// 	.then(response => response.json())
	// 	.then(json => console.log(json))
	// 	.then(()=>send)
	// 	.then()=>sleep())
	// .then(()=> calltoFIDO)
	// 	.then(()=>{
	// 		return new Response(JSON.stringify(fallbackResponse), {
	// 			headers: {'Content-Type': 'application/json'}
	// 		});
	// 	})
}

function sleepFor( sleepDuration ){
	var now = new Date().getTime();
	while(new Date().getTime() < now + sleepDuration){ /* do nothing */ }
}

function fetchcritical(request){
		return request.json().then(data => {
		console.log("SW c : "+data.customerName);
		let payment = {
			url: 'card.html', 
			apikey: data.apikey,
			redirectUrl: data.redirectUrl, 
			mode: data.mode,
			customerName: data.customerName, 
			customerReference: data.customerReference, 
			paymentAmount: data.paymentAmount 
		}; 
		return JSON.stringify(payment);
		/*
		console.log("SW b : "+JSON.stringify(payment));
		var fallbackResponse = {
		  status: "C",
		  body: JSON.stringify(payment),
		  message: "Failed Transaction"
		};
		return new Response(JSON.stringify(fallbackResponse), {
		  headers: {'Content-Type': 'application/json'}
		});
		*/
	});	
	
}



// https://felixgerschau.com/how-to-communicate-with-service-workers/