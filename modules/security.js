var schedule = require('node-schedule'),
	path = require('path'),
	crypto = require(path.join('..', 'lib', 'peerio_crypto_mod')),
	Base58 = require(path.join('..', 'lib', 'base58')),
  nacl = require('tweetnacl/nacl-fast'),
	keys = {},
	keyPair = nacl.box.keyPair();

keys.public = crypto.getPublicKeyString(keyPair.publicKey);
keys.private = nacl.util.encodeBase64(keyPair.secretKey);

function encryptToken(token, userPublicKeyString) {
	var nonce = nacl.randomBytes(24);
	var userBytes = new Uint8Array(Base58.decode(userPublicKeyString));
	var serverEphemeralSecret = nacl.util.decodeBase64(keys.private);
	var encrypted_token = nacl.box(
		nacl.util.decodeBase64(token),
		nonce,
		userBytes.subarray(0, 32),
		serverEphemeralSecret
	);
	return {
		token: nacl.util.encodeBase64(encrypted_token),
		nonce: nacl.util.encodeBase64(nonce),
		ephemeralServerPublicKey: keys.public
	}
}

function generateToken() {
	var token = new Uint8Array(32);
	token[0] = 0x41;
	token[1] = 0x54;
	token.set(nacl.randomBytes(30), 2);
	return nacl.util.encodeBase64(token);
}


schedule.scheduleJob('* 3 * * *', function() {
	console.log('change server\'s ephemeral keypair')

	keys.public = crypto.getPublicKeyString(keyPair.publicKey);
	keys.private = nacl.util.encodeBase64(keyPair.secretKey);
});

module.exports = {
	encryptToken: encryptToken,
	generateToken: generateToken
};