import { User } from './user.model';

export class UserList {
  totalCount: number;
  incompleteResults: boolean;
  items: User[];
}
