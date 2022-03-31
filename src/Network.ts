interface API {
  getName(): string;
  connect(name: string): void;
}

interface Node {
  nodeAddress: string;
  name: string;
  nodeAPI: API;
  isConnectedToNode: boolean;
}

/* Creates a new network */
export class Network {
  readonly address: string;
  private _nodes: Array<Node> = [];

  constructor(address: string) {
    const addressArray: Array<string> = address.split('.');

    for (let elem of addressArray) {
      if (Number(elem) < 0 || Number(elem) > 255) {
        console.log('Invalid address! Try again.');
        return;
      }
    }

    this.address = address;
  }

  /* Connect a node to the network if the name and address are not yet taken */
  connectNode(node: number, serverAPI: API): Node {
    let nodeAddress: string;

    if (node) {
      nodeAddress = `${this.address}.${node}`;
    } else {
      console.log('Node must be between 0 and 255! Try again.');
      return;
    }

    const nodeAPI = serverAPI;
    const nodeName = serverAPI.getName();
    const foundNode = this._nodes.find((node) => node.name === nodeName);
    const foundNodeAddress = this._nodes.find((node) => node.nodeAddress === nodeAddress);
    const isConnectedToNode = false;

    if (foundNodeAddress) {
      console.log(`A node ${node} is already connected`);
      throw new Error(`Узел ${node} уже подключен к сети`);
    }

    if (foundNode) {
      console.log('Connection is rejected because the given name is already exist');
      throw new Error(`Узел с имененем ${foundNode.name} уже подключен к сети`);
    }

    const nodesLength = this._nodes.push({
      name: nodeName,
      nodeAddress,
      nodeAPI,
      isConnectedToNode,
    });
    const currentNode = this._nodes[nodesLength - 1];
    console.log(`Node ${nodeName} is connected to the network with address ${nodeAddress}`);

    console.log(this._nodes);
    return currentNode;
  }

  /* Disable a node from the network by node name */
  disableNode(nodeName: string) {
    let nodeIndex: number;

    this._nodes.forEach((node, index) => {
      if (node.name === nodeName) {
        nodeIndex = index;
      }
    });

    if (nodeIndex !== undefined) {
      this._nodes.splice(nodeIndex, 1);
      console.log(`Node ${nodeName} is disabled`);
    } else {
      console.log(`Node with name ${nodeName} was not found`);
    }

    console.log(this._nodes);
  }

  /* Connect a source node to a target node */
  connectToNode(source: string, target: string) {
    const sourceNode = this._nodes.find((node) => node.name === source);
    const targetNode = this._nodes.find(function (node) {
      return node.name === target || node.nodeAddress === target;
    });

    if (targetNode !== undefined) {
      targetNode.nodeAPI.connect(source);

      sourceNode.isConnectedToNode = true;
      targetNode.isConnectedToNode = true;
    } else {
      console.log(`Server ${target} is not connected to the network`);
    }
  }

  showNamedNodes() {
    const namedNodes = this._nodes.map((node) => {
      if (node.name) {
        return node.name;
      }
    });

    console.log(namedNodes);
    return namedNodes;
  }

  showAddress(node: Node) {
    console.log(node.nodeAddress);
  }

  protected waitingConnection() {
    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 300000);
    });
  }

  checkConnection(node: Node) {
    return this.waitingConnection().then(() => {
      return node.isConnectedToNode;
    });
  }

  getAPI() {
    return {
      connectNode: this.connectNode.bind(this),
      disableNode: this.disableNode.bind(this),
      connectToNode: this.connectToNode.bind(this),
      showNamedNodes: this.showNamedNodes.bind(this),
      showAddress: this.showAddress.bind(this),
      checkConnection: this.checkConnection.bind(this),
    };
  }
}
