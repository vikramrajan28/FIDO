'use strict';

/* Handle for register form submission */
$('#register').submit(function(event) {
    event.preventDefault();

    let username = this.username.value;
    let name     = this.name.value;

    if(!username || !name) {
        alert('Name or username is missing!')
        return
    }
    getMakeCredentialsChallenge({username, name})
        .then((response) => {
            let publicKey = preformatMakeCredReq(response);
            return navigator.credentials.create({ publicKey })
        })
        .then((response) => {
			let makeCredResponse = publicKeyCredentialToJSON(response);
			return sendWebAuthnResponse(makeCredResponse)
		})
		.then((response) => {
			if(response.status === 'ok') {
				loadMainContainer()   
			} else {
				alert(`Server responed with error. The message is: ${response.message}`);
			}
		})
		.catch((error) => alert(error))

})

let getMakeCredentialsChallenge = (formBody) => {
    return fetch('/webauthn/register', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formBody)
    })
    .then((response) => response.json())
    .then((response) => {
        if(response.status !== 'ok')
            throw new Error(`Server responed with error. The message is: ${response.message}`);

        return response
    })
}

let sendWebAuthnResponse = (body) => {
	
    return fetch('/webauthn/response', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    .then((response) => response.json())
    .then((response) => {
        if(response.status !== 'ok')
            throw new Error(`Server responed with error. The message is: ${response.message}`);

        return response
    })
}

/* Handle for login form submission */
$('#login').submit(function(event) {
    event.preventDefault();
    let username = this.username.value;

    if(!username) {
        alert('Username is missing!')
        return
    }
    getGetAssertionChallenge({username})
        .then((response) => {
            let publicKey = preformatGetAssertReq(response);
            return navigator.credentials.get({ publicKey })
        })
        .then((response) => {
            let getAssertionResponse = publicKeyCredentialToJSON(response);
            return sendWebAuthnResponse(getAssertionResponse)
        })
        .then((response) => {
            if(response.status === 'ok') {
                loadMainContainer()   
            } else {
                alert(`Server responed with error. The message is: ${response.message}`);
            }
        })
        .catch((error) => alert(error))
})

let getGetAssertionChallenge = (formBody) => {
    return fetch('/webauthn/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formBody)
    })
    .then((response) => response.json())
    .then((response) => {
        if(response.status !== 'ok')
            throw new Error(`Server responed with error. The message is: ${response.message}`);

        return response
    })
}

/*-----------Payment--------*/
$('#paynow').click(function(event) {
    event.preventDefault();
    $('#paynow').hide();
    let customerName = "Oliver";
    let customerReference     = "Arrow";    
	let paymentAmount     = 100.00;
    let redirectUrl     = "Google";
    let mode     = 0;
    let apikey     = "XXXX";

    if(!customerName || !paymentAmount) {
        alert('Name or Amount is missing!')
        return
    }
    fetchpayment({customerName,customerReference,paymentAmount,redirectUrl,mode,apikey})
        .then((response) => {
            $('#loader').remove();
            $("#payframe").remove()
			if(response.status === 'Success') {
				$('#success').show();
			}
			else {
				$("#sx").append('<p>Payment Unsuccessfull. Please retry after sometime.</p>');
                $('#paynow').show();
                alert(`Server responed with error. The message is: ${response.message}`);
			}
		})
		.catch((error) => alert(error))

})
let fetchpayment = (formBody) => {
    return fetch('/webauthn/payment', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formBody)
    })
    .then((response) => response.json())
    .then((response) => {
        if(response.status !== 'Success' )
            throw new Error(`Server responed with error. The message is: ${response.message}`);

        return response
    })
}
/*---------Pay End------------*/

