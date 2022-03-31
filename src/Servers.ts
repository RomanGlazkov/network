import { User } from './User';

interface IChat {
  user: User;
  message: string;
}

/* Creates a new node */
class Node {
  readonly node: number;

  constructor(node: number) {
    if (node < 0 || node > 255) {
      return;
    }

    this.node = node;
  }
}

/* 
  Creates a new server
  @extends Node
*/
class Server extends Node {
  protected _name: string;
  protected _connectedNodes: Array<string> = [];

  constructor(node: number, name: string) {
    super(node);
    this._name = name;
  }

  /* Get the name of the server */
  protected getName() {
    return this._name;
  }

  /* Connect other node to this server */
  protected connect(nodeName: string) {
    this._connectedNodes.push(nodeName);

    console.log(`Server ${nodeName} is connected to server ${this._name}`);
  }

  /* Get API to register in the network */
  get API() {
    return {
      getName: this.getName.bind(this),
      connect: this.connect.bind(this),
    };
  }
}

/* 
  Creates a new public server
  @extends Server
*/
export class PublicServer extends Server {
  protected _users: Array<User> = [];
  protected _chat: Array<IChat> = [];

  constructor(node: number, name: string) {
    super(node, name);
  }

  /* 
    Connect to Server as a person

    To connect as an admin call this method with 'admin' arg
    To connect as a guest call this method without args
    To connect as a member with name call this method with this name 
  */
  connectToServer(name?: string): User {
    let role;
    let user = this._users.find((user) => user.name === name);

    if (user) {
      user.isConnectedToServer = true;

      console.log(`You are connected as ${user.name} to server ${this.getName()}`);
    } else {
      if (name === 'admin') {
        role = 'admin';
        user = new User(role);
      } else if (name) {
        role = 'member';
        user = new User(role, name);
      } else {
        role = 'guest';
        user = new User(role);
      }

      this._users.push(user);

      console.log(`You are connected as ${role} with id ${user.id} to server ${this.getName()}`);
    }

    return user;
  }

  /* Disconnect user from a server */
  disconnectFromServer(id: number): void {
    const searchedUser = this._users.find((user) => user.id === id);

    searchedUser.isConnectedToServer = false;

    console.log('You have disconnected from the server');
  }

  /* 
    Change user role from member to admin and vice versa
    
    This method can only be called by the admin
  */
  changeRole(id: number) {
    const searchedUser = this._users.find((user) => user.id === id);

    if (searchedUser === undefined) {
      console.log('User with the given id was not found');
      return;
    }

    if (searchedUser.role === 'guest') {
      console.log('The guest cannot be an admin');
      return;
    }

    searchedUser.role = searchedUser.role === 'member' ? 'admin' : 'member';
    console.log(`${searchedUser.name}'s role has been changed to ${searchedUser.role}`);

    return searchedUser.role;
  }

  /* Allow admin and members to add messages to the chat */
  addMessage(user: User, message: string) {
    let chatInfo = {
      logs: null,
      message: null,
    };

    if (user.role === 'guest') {
      console.log('Guests cannot leave messages in the chat');
      return;
    }

    if (user.isJoinedChat === false) {
      chatInfo.logs = this.joinChat(user);
      user.isJoinedChat = true;
    }

    this._chat.push({
      user,
      message,
    });

    chatInfo.message = `${user.name}: ${message}`;

    user.isUsedAPI = true;

    return chatInfo;
  }

  private joinChat(user: User) {
    console.log(`${user.name} joined the chat`);
    return `${user.name} joined the chat`;
  }

  leaveChat(user: User) {
    if (user.isJoinedChat) {
      user.isJoinedChat = false;
      console.log(`${user.name} left the chat`);
      return {
        logs: `${user.name} left the chat`,
      };
    }
  }

  showMessages(user: User) {
    console.log('This is the chat history:');

    const chatHistory: string[] = [];

    this._chat.forEach((elem, index) => {
      if (index < 50) {
        console.log(`${elem.user.name}: ${elem.message}`);
        chatHistory.push(`${elem.user.name}: ${elem.message}`);
      }
    });

    user.isUsedAPI = true;

    return chatHistory;
  }

  getUsers() {
    return this._users;
  }

  protected waitingForApiUsage() {
    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 60000);
    });
  }

  checkApiUsage(user: User) {
    return this.waitingForApiUsage().then(() => {
      return user.isUsedAPI;
    });
  }

  /* Returns user API after connecting to the server */
  getUserAPI(user: User): any {
    const api = {
      changeRole: this.changeRole.bind(this, user),
      addMessage: this.addMessage.bind(this, user),
      leaveChat: this.leaveChat.bind(this, user),
      showMessages: this.showMessages.bind(this, user),
      disconnectFromServer: this.disconnectFromServer.bind(this, user),
      getUsers: this.getUsers.bind(this),
      checkApiUsage: this.checkApiUsage.bind(this),
    };

    switch (user.role) {
      case 'admin':
        return api;
      case 'member':
        delete api.changeRole;
        return api;
      case 'guest':
        delete api.changeRole;
        delete api.addMessage;
        delete api.leaveChat;
        return api;
    }
  }
}

/* 
  Creates a new private server
  @extends PublicServer
*/
export class PrivateServer extends PublicServer {
  showMessages(user: User) {
    return super.showMessages(user);
  }

  addMessage(user: User, message: string) {
    let chatInfo = {
      logs: null,
      message: null,
    };

    if (user.isBlocked) {
      console.log('You cannot leave messages because you were blocked');
      chatInfo.logs = 'You cannot leave messages because you were blocked';
      return chatInfo;
    }

    return super.addMessage(user, message);
  }

  /* Blocks user by id */
  blockUser(id: number) {
    const searchedUser = this._users.find((user) => user.id === id);

    if (searchedUser === undefined) {
      console.log('User with the given id was not found');
      return;
    }

    if (searchedUser.isBlocked === false) {
      searchedUser.isBlocked = true;
      console.log(`User with id ${id} is blocked`);
    }

    return id;
  }

  getUserAPI(user: User) {
    let api = super.getUserAPI(user);

    if (user.role === 'admin') {
      api.blockUser = this.blockUser.bind(this);
    }

    if (user.role === 'guest') {
      delete api.showMessages;
    }

    return api;
  }
}
