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
	alert(1);
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
		alert(2);
        if(response.status !== 'ok')
            throw new Error(`Server responed with error. The message is: ${response.message}`);

        return response
    })
}

/* Handle for login form submission */
$('#login').submit(function(event) {
    event.preventDefault();
	alert(1);
    let username = this.username.value;

    if(!username) {
        alert('Username is missing!')
        return
    }
	alert(2);
    getGetAssertionChallenge({username})
        .then((response) => {alert(3);
            let publicKey = preformatGetAssertReq(response);
			let pk = JSON.stringify(publicKey);
			console.log("Public key :" + pk);
            return navigator.credentials.get({ publicKey })
        })
        .then((response) => {alert(4);
            let getAssertionResponse = publicKeyCredentialToJSON(response);
            return sendWebAuthnResponse(getAssertionResponse)
        })
        .then((response) => {alert(5);
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
