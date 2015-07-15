##System Setup 

I am assuming that it is an unix environment, so first install software and set-up environment: 
  * sudo apt-get install --yes nodejs redis
  * sudo npm install -g jasmine jsdoc


then: 
  * cd <Desired_project_location>
  * run `npm start` to start the application
  * run `npm test` to run the test cases.
  * run `npm run doc` to generate the documentation, can be found in `./docs` folder.

##Changes made:

I find promises to be more comfortable than normal node async callbacks, thus used `es6-promise` polyfill. That is reason I used `then-redis` as it is the promisified version of `redis` module. I have used `jsdoc` for generationg docs. Also removed `loadash` and `scrypt` as they were not being used. I have stored all configurable values on top of each module, later this can be moved to a common `config.json` and config variables in modules can be made to refer them.

##Assumptions about requirement: 

I have made some basic assumptions about the system. Like, I have assumed that the authentication tokens expire 15 minutes after creation, and when unused tokens reach the limit (1024) per user, the system would return error when user asks for more tokens, but if user is reaching limit( say 1020) but requests, we return no. of tokens( 4 tokens) till the limit is reached. Also, I have scheduled a job to run every 1 hour that checks and removes expired tokens from users with more than certain amount of unused tokens, and another job that runs every 24 hours that removes expired tokens for all users in the database.


## Project Structure

  * `./app.js` - contains code concerning whole application
  * `./modules/routes.js` - contains code  handling of api requests.
  * `./modules/security.js` - contains code handling token generation and validation.
  * `./modules/database.js` - contains code handling database interaction, later, any change in database, only this module has to be modified.
  * `./spec/indexSpec.js` - contains the jasmine tests.
