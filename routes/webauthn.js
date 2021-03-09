const express   = require('express');
const utils     = require('../utils');
const config    = require('../config.json');
const base64url = require('base64url');
const router    = express.Router();
const database  = require('./db');

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

    request.session.challenge = getAssertion.challenge;
    request.session.username  = username;

    response.json(getAssertion)
})
/* ---------- ROUTES END ---------- */

module.exports = router;
