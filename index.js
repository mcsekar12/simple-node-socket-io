let express = require('express');
let app = express();
let server = require('http').createServer(app);
let io = require('socket.io')(server);
const dotenv = require('dotenv');
const axios = require('axios');
dotenv.config();
const querystring = require('querystring');

const apiai = require('apiai')(process.env.APIAI_CLIENT_TOKEN);

app.get('/send/:id', (req, res) => {
  console.log(req.params.id);
  io.sockets
    .in(req.params.id)
    .emit('new_msg', { msg: 'hello' + req.params.id });
  res.send('ok');
});

io.sockets.on('connection', function(client) {
  console.log(`Socket ${client.id} connected.`);

  client.on('disconnect', user => {
    console.log(`Socket ${client.id} disconnected.`);
  });
  client.on('authentication', function(user) {
    client.join(user.userId);
    console.log(user.userId);
  });

  client.on('askBot', function(question) {
    console.log('askBot', question.q);
    let text = question.q;
    axios
      .post(
        'http://142.93.198.17:5000/chatbot',
        querystring.stringify({ user_question: text })
      )
      .then(function(response) {
        console.log(response);
        client.emit('new_msg', response.data);
      })
      .catch(function(error) {
        console.log(error);
        client.emit('new_msg', error);
      });
    //   let apiaiReq = apiai.textRequest(text, {
    //     sessionId: client.id
    //   });

    //   apiaiReq.on('response', response => {
    //     let aiText = response.result.fulfillment.speech;
    //     console.log(aiText);
    //     client.emit('new_msg', aiText); // Send the result back to the browser!
    //   });
    //   apiaiReq.on('error', error => {
    //     console.log(error);
    //   });

    //   apiaiReq.end();
    // });
  });
});
server.listen(process.env.PORT, () => {
  console.log(`Node started in ${process.env.PORT} port`);
});
