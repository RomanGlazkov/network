import { request, showError } from './request';

const createServerForm: HTMLFormElement = document.forms['create-server'];
const nodeNumberInput: HTMLInputElement = createServerForm.elements['node-number'];
const serverNameInput: HTMLInputElement = createServerForm.elements['server-name'];
const serverTypeInput: HTMLInputElement = createServerForm.elements['server-type'];

const mainContainer: HTMLDivElement = document.querySelector('.container');

const serverInfo: HTMLDivElement = document.querySelector('.server-info');
const serverNameContainer: HTMLDivElement = serverInfo.querySelector('.server-header__name');
const networkBtn: HTMLButtonElement = serverInfo.querySelector('.network-btn');
const serverStatus: HTMLDivElement = serverInfo.querySelector('.server-header__status');
const serverApiButtons = serverInfo.querySelectorAll('.hidden');
const serverNotifications: HTMLDivElement = serverInfo.querySelector('.server-notifications');
const addressBtn: HTMLButtonElement = serverInfo.querySelector('.address-btn');
const connectBtn: HTMLButtonElement = serverInfo.querySelector('.connect-btn');

interface IServer {
  name: string;
  address: string;
}

const server: IServer = {
  name: null,
  address: null,
};

addEventListeners();

function addEventListeners() {
  createServerForm.addEventListener('submit', createServer);
  networkBtn.addEventListener('click', connectToNetwork);
  addressBtn.addEventListener('mouseover', showAddress);
  addressBtn.addEventListener('mouseout', showAddress);
  connectBtn.addEventListener('click', getNamedNodes);
}

async function createServer(event: Event) {
  event.preventDefault();

  const nodeNumber: number = Number(nodeNumberInput.value);
  const serverName: string = serverNameInput.value;
  const serverType: string = serverTypeInput.value;
  const data = {
    nodeNumber,
    serverName,
    serverType,
  };

  const response = await request('/api/servers', 'POST', data);

  server.name = response.serverName;

  createServerForm.hidden = true;

  serverNameContainer.textContent = response.serverName;
  mainContainer.hidden = false;
}

async function connectToNetwork() {
  const response = await request('http://localhost:4000/api/network', 'POST');

  if (response.error) {
    showError(response.error);
    this.disabled = true;

    return;
  }

  server.address = response.nodeAddress;

  this.textContent = 'Отключиться от сети';
  this.removeEventListener('click', connectToNetwork);
  this.addEventListener('click', disconnectFromNetwork);

  serverStatus.classList.add('online');
  serverStatus.title = 'Подключен к сети';

  serverApiButtons.forEach((apiButton) => {
    apiButton.classList.remove('hidden');
    apiButton.classList.add('api-btn');
  });

  const isConnectedToNode = await request('http://localhost:4000/api/connection');

  if (isConnectedToNode === false) {
    showError('Узел был отключен, так как не подключился к другому узлу');
    disconnectFromNetwork.call(networkBtn);
  }
}

async function disconnectFromNetwork() {
  await request('http://localhost:4000/api/network', 'DELETE', {
    serverName: server.name,
  });

  this.textContent = 'Подключиться к сети';
  this.removeEventListener('click', disconnectFromNetwork);
  this.addEventListener('click', connectToNetwork);

  serverStatus.classList.remove('online');
  serverStatus.title = 'Не подключен к сети';

  serverApiButtons.forEach((apiButton) => {
    apiButton.classList.remove('api-btn');
    apiButton.classList.add('hidden');
  });

  serverNotifications.textContent = '';
}

function showAddress() {
  if (this.classList.contains('address')) {
    this.textContent = 'Адрес сервера';
    this.classList.remove('address');
    return;
  }

  this.textContent = server.address;
  this.classList.add('address');
}

async function getNamedNodes() {
  let namedNodes: string[] = await request('http://localhost:4000/api/network');

  namedNodes = namedNodes.filter((nodeName) => nodeName !== server.name);

  this.removeEventListener('click', getNamedNodes);
  this.addEventListener('click', hideNodes);

  showNodes(namedNodes);
}

function showNodes(nodes: string[]) {
  if (nodes.length === 0) {
    const div = document.createElement('div');
    div.textContent = 'Отсутствуют узлы для подключения';
    serverNotifications.append(div);
    return;
  }

  const nodeList = document.createElement('div');
  const nodeListTitle = document.createElement('div');

  nodeList.classList.add('list', 'node-list');
  nodeListTitle.className = 'list-title';
  nodeListTitle.textContent = 'Выберите узел для подключения:';
  nodeList.append(nodeListTitle);

  nodes.forEach((node) => {
    const button = document.createElement('button');
    button.classList.add('list-button', 'btn');
    button.textContent = node;
    nodeList.append(button);
  });

  serverNotifications.append(nodeList);

  nodeList.addEventListener('click', connectToNode);
}

function hideNodes() {
  serverNotifications.textContent = '';

  this.removeEventListener('click', hideNodes);
  this.addEventListener('click', getNamedNodes);
}

async function connectToNode(event: Event) {
  const target = event.target as HTMLElement;

  if (target.tagName === 'BUTTON') {
    await request('http://localhost:4000/api/network', 'PATCH', {
      source: server.name,
      target: target.textContent,
    });

    connectBtn.textContent = `Подключен к узлу: ${target.textContent}`;
    hideNodes.call(connectBtn);
  }
}
