import express from 'express';
import { Network } from './Network';
import { server } from './subscriber';

const networkServer = express();
const port: number = 4000;
const network = new Network('190.180.1');
const networkAPI = network.getAPI();
let node;

networkServer.use(express.json());

networkServer.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  next();
});

networkServer.get('/api/network', (req, res) => {
  const namedNodes = networkAPI.showNamedNodes();

  res.json(namedNodes);
});

networkServer.patch('/api/network', (req, res) => {
  networkAPI.connectToNode(req.body.source, req.body.target);

  res.end();
});

networkServer.post('/api/network', (req, res) => {
  try {
    node = networkAPI.connectNode(server.node, server.API);

    res.json({
      nodeAddress: node.nodeAddress,
    });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

networkServer.delete('/api/network', (req, res) => {
  networkAPI.disableNode(req.body.serverName);

  res.end();
});

networkServer.get('/api/connection', async (req, res) => {
  const isConnectedToNode = await networkAPI.checkConnection(node);

  res.json(isConnectedToNode);
});

networkServer.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});
