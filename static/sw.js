self.addEventListener('fetch', function(event) {
	console.log("SW URL : "+ event.request.url);
	var url = event.request.url.split('/');
	if(url.includes("payment")){
		event.waitUntil(async function() {/*https://developer.mozilla.org/en-US/docs/Web/API/Client/postMessage*/
			if (!event.clientId) return;
			const client = await clients.get(event.clientId);
			if (!client) return;
			fetchcritical(event.request).then(body => {
				console.log("SW body : "+body.mode);
				client.postMessage({
					data: body,
					msg: "FIDO",
					url: event.request.url
				});	
			});
			
		}());
		/*-
		event.respondWith(
			fetchcritical(event.request)); */
	}else{
		event.respondWith(
			fetch(event.request));
	}
  
});
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
		


