const express   = require('express');
const utils     = require('../utils');
const config    = require('../config.json');
const base64url = require('base64url');
const router    = express.Router();
const database  = require('./db');
const path  = require('path');
const fs = require('fs');


/* ---------- ROUTES START ---------- */

router.post('/register', (request, response) => {
    if(!request.body || !request.body.username || !request.body.name) {
        response.json({
            'status': 'failed',
            'message': 'Request missing name or username field!'
        })

        return
    }

    let username = request.body.username;
    let name     = request.body.name;

    if(database[username] && database[username].registered) {
        response.json({
            'status': 'failed',
            'message': `Username ${username} already exists`
        })

        return
    }

    database[username] = {
        'name': name,
        'registered': false,
        'id': utils.randomBase64URLBuffer(),
        'authenticators': []
    }

    let challengeMakeCred    = utils.generateServerMakeCredRequest(username, name, database[username].id)
    challengeMakeCred.status = 'ok'

    request.session.challenge = challengeMakeCred.challenge;
    request.session.username  = username;

    response.json(challengeMakeCred)
})

router.post('/response', (request, response) => {
	console.info("Im Here");
    if(!request.body       || !request.body.id
    || !request.body.rawId || !request.body.response
    || !request.body.type  || request.body.type !== 'public-key' ) {
        response.json({
            'status': 'failed',
            'message': 'Response missing one or more of id/rawId/response/type fields, or type is not public-key!'
        })

        return
    }
	let myreq = JSON.stringify(request.body);
	console.info("Request :" + myreq);
    let webauthnResp = request.body
    let clientData   = JSON.parse(base64url.decode(webauthnResp.response.clientDataJSON));
	let clientq = JSON.stringify(clientData);
	console.info("Clent data :" + clientq);
    /* Check challenge... */
    if(clientData.challenge !== request.session.challenge) {
        response.json({
            'status': 'failed',
            'message': 'Challenges don\'t match!'
        })
		return
    }
	console.info("Request session :" + request.session.challenge);
    /* ...and origin */
    if(clientData.origin !== config.origin) {
        response.json({
            'status': 'failed',
            'message': 'Origins don\'t match!'
        })
		return
    }
	console.info("Request origin :" + clientData.origin);
	
	let result;
	if(	webauthnResp.response.attestationObject !== undefined) {
        /* This is create cred */
		console.info("Registration request :");
		result = utils.verifyAuthenticatorAttestationResponse(webauthnResp);
		console.info("Registration verified :"+ result.verified);
        if(result.verified) {
            database[request.session.username].authenticators.push(result.authrInfo);
            database[request.session.username].registered = true
        }
		let myJSON = JSON.stringify(result);
		console.info("Registration verified :"+ myJSON);	
    } else if(webauthnResp.response.authenticatorData !== undefined) {
        /* This is get assertion */
        result = utils.verifyAuthenticatorAssertionResponse(webauthnResp, database[request.session.username].authenticators);
    } else {
        response.json({
            'status': 'failed',
            'message': 'Can not determine type of response!'
        })
    }
	if(result.verified) {
        request.session.loggedIn = true;
        response.json({ 'status': 'ok' })
    } else {
        response.json({
            'status': 'failed',
            'message': 'Can not authenticate signature!'
        })
    }

})

router.post('/login', (request, response) => {
    if(!request.body || !request.body.username) {
        response.json({
            'status': 'failed',
            'message': 'Request missing username field!'
        })

        return
    }

    let username = request.body.username;

    if(!database[username] || !database[username].registered) {
        response.json({
            'status': 'failed',
            'message': `User ${username} does not exist!`
        })

        return
    }

    let getAssertion    = utils.generateServerGetAssertion(database[username].authenticators)
    getAssertion.status = 'ok'
    console.log("Challenge: "+getAssertion.challenge);
    request.session.challenge = getAssertion.challenge;
    request.session.username  = username;

    response.json(getAssertion)
})
/*--Payment-*/
router.post('/payConfirm', (request, response) => {
    if(!request.body || !request.session.username) {
        response.json({
            'status': 'failed',
            'message': 'Request missing username field!'
        })

        return
    }

    let username = request.session.username;

    if(!database[username] || !database[username].registered) {
        response.json({
            'status': 'failed',
            'message': `User ${username} not Valid!`
        })

        return
    }

    let getAssertion    = utils.generateServerGetAssertion(database[username].authenticators)
    getAssertion.status = 'ok'

    request.session.challenge = getAssertion.challenge;
    request.session.username  = username;
    console.log("Get Assert Pay: "+JSON.stringify(getAssertion));
    response.json(getAssertion);
})


router.post('/payment', (request, response) => {
    if(!request.body) {
        response.json({
            'status': 'failed',
            'message': 'Request missing name or username field!'
        })

        return
    }


	let verified =true;
    let customerName = request.body.customerName;
    let customerReference     = request.body.customerReference;    
	let paymentAmount     = request.body.paymentAmount;
    let redirectUrl     = request.body.redirectUrl;
    let mode     = request.body.mode;
    let apikey     = request.body.apikey;
	console.info("Payment : "+ customerName)
	/*---code for null check*/
	/*--end null check--*/
	
    if(!verified) {
        response.json({
            'status': 'failed',
            'message': `Invalid Payment Request`
        })

        return
    }else{
		response.json({
            'status': 'Success',
        })
	}
})

//----------------------

router.post('/transaction', (request, response) => {
    // Get data saved in the transaction init call
    if(!request.body) {
        response.json({
            'status': 'failed',
            'message': 'Request missing name or username field!'
        })

        return
    }
    let username = request.session.username;
    if(!database[username] || !database[username].registered) {
        response.json({
            'status': 'failed',
            'message': `User ${username} not Valid!`
        })
        return
    }
    let verified =true;
    let iframeurl = "card.html";
    let customerName = request.body.customerName;
    let customerReference     = request.body.customerReference;
    let paymentAmount     = request.body.paymentAmount;
    //let redirectUrl     = request.body.redirectUrl;
    let mode     = request.body.mode;
    let stat = 0;
    let tranid  = Date.now()
    console.info("Payment : "+ customerName + " Transact ID: "+ tranid);
    console.info("Database : "+ JSON.stringify(database));
    database[username].transaction = {
        'tranid': tranid,
        'customerName': customerName,
        'customerReference': customerReference,
        'mode': mode,
        'paymentAmount':paymentAmount,
        'status':stat
    }
        /*Html Rendering*/
    let htmldata = '<div class="container">\n' +
        '\t  <h4><b>Customer Name: </b><span id="custName" style="color:black"><b>'+customerName+'</b></span></h4>\n' +
        '      <h4>Amount Due: \n' +
        '        <span id="payAmount" style="color:black">\n' +
        '          \n' +paymentAmount+
        '        </span>\n' +
        '      </h4>\n' +
        '      <hr>\t\n' +
        '\t  <form id ="trandata" >\n' +
        '\t\t<input type="hidden" id="customerName" value="'+customerName+'">\n' +
        '\t\t<input type="hidden" id="customerReference" value="'+customerReference+'">\n' +
        '\t\t<input type="hidden" id="paymentAmount" value="'+paymentAmount+'">\n' +
        '\t\t<input type="hidden" id="mode" value="'+mode+'">\n' +
        '\t\t<input type="submit" id="payConfirm" value="Confirm">\n' +
        '\t  </form>\n' +
        '\t  \n' +
        '    </div>';
    console.info("HTML DATA : "+ htmldata);
    let content ="";
    fs.readFile('./card.html', function read(err, data) {
        if (err) {
            throw err;
        }
        content = String(data);
        // Invoke the next step here however you like
        console.log(content);   // Put all of the code here (not the best solution)
        content.replace('<div class="container"></div>',htmldata);
    });
    if(!verified) {
        response.json({
            'status': 'failed',
            'message': `Invalid Payment Request`
        })

        return
    }else{
        response.json({
            'tranid': tranid,
            'url': content
        })
    }
    // Modify card.html with the data (you need to change card.html to be a simple template that you can modify dynamically)
    // And you send html back
    console.log("Transaction id: "+ request.param.id)
    response.sendFile(path.join(__dirname + '/../static/card.html'));
})

/* ---------- ROUTES END ---------- */

module.exports = router;
