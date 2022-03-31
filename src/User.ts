let id = 2;

export class User {
  readonly id: number;
  readonly name: string;
  role: string;
  isUsedAPI: boolean = false;
  isConnectedToServer: boolean = true;
  isJoinedChat: boolean = false;
  isBlocked: boolean = false;

  constructor(role: string, name?: string) {
    if (role === 'admin') {
      this.id = 1;
    } else {
      this.id = id++;
    }
    this.role = role;
    if (name) {
      this.name = name;
    } else {
      this.name = role;
    }
  }
}
