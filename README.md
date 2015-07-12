Install Redis, node, npm, jasmine. 

To run `node index.js`. To run tests `jasmine`. 

Ephemeral Peerio Server Keypair: A miniLock key pair used by the Peerio Server Application in order to issue authentication challenges. It is ephemeral and the Peerio Server Application will regenerate it every 24 hours. We will refer to this value as ephemeralServerKeys and to the miniLock ID as the ephemeralServerID.

Authentication Challenge: A challenge performed in order for the client to receive an authentication token from the server.

    Client sends an authentication token request which includes their Peerio username and miniLock ID.
    Server checks if the given miniLock ID matches the one it has on record for that username. If the check fails, we issue an error and the request fails.
    Server generates a 32-byte value authToken. The first two bytes of an authToken are always 0x41, 0x54, followed by 30 random bytes.
    Server encrypts authToken with the nacl.box construction using their ephemeralServerKeys secret key and the client's miniLock ID.
    Server sends authToken, the nonce used to encrypt the authToken, and ephemeralServerID to the client.
    The client decrypts authToken. If the decryption is successful, the client may now use authToken as an authentication token to submit a request.

Note that the server must limit the number of issued authToken to a particular user to a maximum of 1024 at a time. An authentication token is only valid for a single authenticated request. The server keeps track of which authTokens are tied to which users.