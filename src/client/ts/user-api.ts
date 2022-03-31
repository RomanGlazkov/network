import { request, showError } from './request';

const connectToServerForm: HTMLFormElement = document.forms['connect-to-server'];
const connectInput: HTMLInputElement = connectToServerForm.elements['connect-input'];
const userInfo: HTMLDivElement = document.querySelector('.user-info');
const userRole: HTMLDivElement = userInfo.querySelector('.user-header__role');
const userNotifications: HTMLDivElement = userInfo.querySelector('.user-notifications');
const publishForm: HTMLFormElement = document.forms['publish'];
const chat: HTMLDivElement = userNotifications.querySelector('.chat');
const chatMessagesContainer: HTMLDivElement = userNotifications.querySelector('.chat-messages');
const chatHistory: HTMLDivElement = userNotifications.querySelector('.chat-history');

const userRoles = {
  admin: 'администратор',
  member: 'участник',
  guest: 'гость',
};

const userApiHandlers = {
  disconnectFromServer,
  changeRole,
  addMessage,
  leaveChat,
  showMessages,
  blockUser,
};

interface IUser {
  id: number;
  role: string;
  name?: string;
  isConnectedToServer: boolean;
  api: {};
}

let user: IUser = {
  id: null,
  role: null,
  isConnectedToServer: null,
  api: null,
};

let usersList: IUser[] = [];
let ws: WebSocket;

connectToServerForm.addEventListener('submit', createUser);

async function createUser(event: Event) {
  event.preventDefault();

  const login = connectInput.value.trim();

  const response = await request('/api/users', 'POST', {
    login,
  });

  user = { ...response };

  connectToServerForm.hidden = true;

  let message = `Вы подключились к серверу как ${userRoles[user.role]}`;

  if (user.name !== user.role) {
    message += ` с именем ${user.name}`;
  }

  userRole.textContent = message;
  userInfo.hidden = false;

  showUserButtons(user.api);

  if (user.role !== 'guest') {
    createWebSocket();
  }

  publishForm.addEventListener('submit', sendMessage);

  connectInput.value = '';

  const isUsedApi = await request('/api/check');

  if (isUsedApi === false) {
    showError('Вы были отключены от сервера из-за неиспользования API');

    const disconnectFromServerBtn = document.querySelector('.server-btn');

    disconnectFromServer.call(disconnectFromServerBtn);
  }
}

function showUserButtons(api) {
  const userButtonsContainer: HTMLDivElement = userInfo.querySelector('.user-buttons');
  const userButtons = Array.from(userButtonsContainer.children) as HTMLElement[];

  userButtons.forEach((button) => {
    const action = button.dataset.action;

    if (api[action] === undefined) {
      button.classList.add('hidden');
    } else {
      if (button.classList.contains('hidden')) {
        button.classList.remove('hidden');
      }

      button.addEventListener('click', userApiHandlers[action]);
    }
  });
}

function createWebSocket() {
  ws = new WebSocket('ws://localhost:9000');

  ws.onmessage = updateChat;
}

function sendMessage(event: Event) {
  event.preventDefault();
  const message = {
    type: 'message',
    value: this.message.value,
  };

  ws.send(JSON.stringify(message));

  this.message.value = '';
}

function updateChat(event: MessageEvent) {
  const chatInfo = JSON.parse(event.data);

  if (chatInfo.logs) {
    const logsContainer = document.createElement('div');

    logsContainer.innerHTML = `<b>${chatInfo.logs}</b>`;
    chatMessagesContainer.append(logsContainer);
  }

  if (chatInfo.message) {
    const messageContainer = document.createElement('div');

    messageContainer.textContent = chatInfo.message;
    chatMessagesContainer.append(messageContainer);
  }
}

async function disconnectFromServer() {
  const data = {
    id: user.id,
  };

  await request('/api/users', 'DELETE', data);

  user.isConnectedToServer = false;

  userInfo.hidden = true;

  if (!chat.classList.contains('hidden')) {
    chat.classList.add('hidden');
  }

  connectToServerForm.hidden = false;

  updateUserNotificationsScreen(this.dataset.action);
}

function addMessage() {
  updateUserNotificationsScreen(this.dataset.action);
}

function updateUserNotificationsScreen(action) {
  const notifications = userNotifications.querySelectorAll('[data-action]');
  let statusFlag: boolean;

  notifications.forEach((notification: HTMLElement) => {
    if (notification.dataset.action === action) {
      notification.classList.toggle('hidden');
      statusFlag = notification.classList.contains('hidden');
    } else {
      if (!notification.classList.contains('hidden')) {
        notification.classList.add('hidden');
      }
    }
  });

  return !statusFlag;
}

async function changeRole() {
  const viewStatus = updateUserNotificationsScreen(this.dataset.action);

  if (viewStatus) {
    let serverUsers = await getUsersList();

    serverUsers = serverUsers.filter((serverUser) => {
      return (
        serverUser.id !== user.id && serverUser.role !== 'guest' && serverUser.name !== 'admin'
      );
    });

    showServerUsers(serverUsers, this.dataset.action);
  }
}

async function blockUser() {
  const viewStatus = updateUserNotificationsScreen(this.dataset.action);

  if (viewStatus) {
    let serverUsers = await getUsersList();

    serverUsers = serverUsers.filter((serverUser) => {
      return serverUser.id !== user.id && serverUser.name !== 'admin';
    });

    showServerUsers(serverUsers, this.dataset.action);
  }
}

function showServerUsers(serverUsers, action) {
  const usersContainer: HTMLDivElement = userNotifications.querySelector(
    `.users[data-action=${action}]`
  );

  usersContainer.textContent = '';

  if (serverUsers.length === 0) {
    usersContainer.textContent = 'Пользователи отсутствуют';
    return;
  }

  const userList = document.createElement('div');
  const userListTitle = document.createElement('div');

  userList.classList.add('list', 'user-list');
  userListTitle.className = 'list-title';
  userListTitle.textContent = 'Выберите пользователя:';
  userList.append(userListTitle);

  serverUsers.forEach((serverUser) => {
    const button = document.createElement('button');
    button.classList.add('btn', 'list-button');
    button.dataset.id = serverUser.id;

    if (serverUser.name === 'guest') {
      button.textContent = `${serverUser.name} (id: ${serverUser.id})`;
    } else {
      button.textContent = `${serverUser.name} (${serverUser.role})`;
    }

    userList.append(button);
  });

  usersContainer.append(userList);

  userList.addEventListener('click', (event) => updateUser(event, action));
}

async function getUsersList() {
  usersList = await request('/api/users');

  return usersList;
}

async function updateUser(event: Event, action: string) {
  const target = event.target as HTMLElement;

  if (target.tagName === 'BUTTON') {
    const targetUserId = Number(target.dataset.id);
    const targetUser = usersList.find((user) => user.id === targetUserId);

    const response = await request('/api/users', 'PATCH', {
      userId: targetUserId,
      action,
    });

    let notification: string;

    if (action === 'changeRole') {
      notification = `Роль пользователя ${targetUser.name} изменена на ${response}`;
    } else {
      notification = `Пользователь ${targetUser.name} (id: ${response}) заблокирован`;
    }

    const usersContainer: HTMLDivElement = userNotifications.querySelector(
      `.users[data-action=${action}]`
    );

    usersContainer.innerHTML = notification;

    ws.send(
      JSON.stringify({
        type: 'action',
        value: notification,
      })
    );
  }
}

function leaveChat() {
  const message = {
    type: 'leave',
  };

  ws.send(JSON.stringify(message));
}

async function showMessages() {
  updateUserNotificationsScreen(this.dataset.action);

  const messageHistory = await request('/api/chat');

  chatHistory.innerHTML = '';

  const chatHistoryTitle = document.createElement('div');
  chatHistoryTitle.innerHTML = '<b>История чата:</b>';
  chatHistory.append(chatHistoryTitle);

  messageHistory.forEach((message) => {
    const div = document.createElement('div');
    div.textContent = message;
    chatHistory.append(div);
  });
}
