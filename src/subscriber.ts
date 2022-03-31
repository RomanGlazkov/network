import express from 'express';
import path from 'path';
import ws from 'ws';
import { PublicServer, PrivateServer } from './Servers';
import './operator';

const app = express();
const port: number = 3000;
const wsServer: ws = new ws.Server({ port: 9000 });
let server: PublicServer | PrivateServer;
let user;

wsServer.on('connection', (ws) => {
  ws.on('message', (m) => {
    const message = JSON.parse(m);
    let chatInfo;

    if (message.type === 'message') {
      chatInfo = server.addMessage(user, message.value);
    }

    if (message.type === 'leave') {
      chatInfo = server.leaveChat(user);
    }

    if (message.type === 'action') {
      chatInfo = {
        logs: message.value,
      };
    }

    ws.send(JSON.stringify(chatInfo));
  });

  ws.on('error', (err) => ws.send(err));
});

app.use(express.json());

app
  .route('/api/users')
  .get((req, res) => {
    const users = server.getUsers();

    res.json(users);
  })
  .post((req, res) => {
    user = server.connectToServer(req.body.login);
    const userAPI = server.getUserAPI(user);

    let responseApi = {};

    for (let key in userAPI) {
      responseApi[key] = true;
    }

    res.json({
      ...user,
      api: { ...responseApi },
    });
  })
  .patch((req, res) => {
    const action = req.body.action;
    let response;

    if (action === 'changeRole') {
      response = server.changeRole(req.body.userId);
      res.json(response);
    }

    if (server instanceof PrivateServer) {
      response = server.blockUser(req.body.userId);
      res.json(response);
    }
  })
  .delete((req, res) => {
    server.disconnectFromServer(req.body.id);

    res.end();
  });

app.get('/api/chat', (req, res) => {
  const chatHistory = server.showMessages(user);

  res.json(chatHistory);
});

app.post('/api/servers', (req, res) => {
  const params = { ...req.body };

  if (params.serverType === 'public') {
    server = new PublicServer(params.nodeNumber, params.serverName);
  } else {
    server = new PrivateServer(params.nodeNumber, params.serverName);
  }

  res.json({
    serverName: server.API.getName(),
  });
});

app.get('/api/check', async (req, res) => {
  const isUsedApi = await server.checkApiUsage(user);

  res.json(isUsedApi);
});

app.use(express.static(path.resolve(__dirname, 'client')));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'client', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});

export { server };
