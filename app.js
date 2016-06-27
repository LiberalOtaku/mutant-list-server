// Create references for libraries
var express = require('express');
var http = require('http');
var firebase = require('firebase');
var twilio = require('twilio');
var dotenv = require('dotenv');
var mailgun = require('mailgun-js');

// Express server setup
var app = express();
var server = http.createServer(app);
dotenv.load();

// Authenticate with Firebase
firebase.initializeApp({
  serviceAccount: "firebase-credentials.json",
  databaseURL: "https://mutant-hours-f0ec3.firebaseio.com"
});
var rootRef = firebase.database().ref();

// Authenticate with twilio
var twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Authenticate with mailgun
var mailgunClient = mailgun({
  apiKey: process.env.MAILGUN_KEY,
  domain: process.env.MAILGUN_DOMAIN
});

// Listen for new texts being added
var textsRef = rootRef.child('texts');
textsRef.on('child_added', function(snapshot) {
  var text = snapshot.val();
  twilioClient.messages.create({
    body: text.name + ', I\'m available to see you now. Please come to my office so we can discuss: ' + text.topic + '.',
    to: text.phone,  // Text this number
    from: process.env.TWILIO_PHONE // From a valid Twilio number
  }, function(err, message) {
    if (err)
      console.log(err.message);
  });
});

// Listen for new emails being added
var emailsRef = rootRef.child('emails');
emailsRef.on('child_added', function(snapshot) {
  var email = snapshot.val();
  var emailData = {
    from: 'postmaster@' + process.env.MAILGUN_DOMAIN,
    to: email.email,
    subject: 'Welcome to Mutant Office Hours!',
    text: 'Thank you for registering. Have a good time!',
  };
  mailgunClient.messages().send(emailData, function (error, body) {
    console.log(body);
    if (error) {
      console.log(error);
    }
  });
});

server.listen(3030, function() {
  console.log('Listening on http://localhost:3030...');
});
