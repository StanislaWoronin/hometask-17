import { Injectable } from '@nestjs/common';
import { EmailConfirmationModel } from '../infrastructure/entity/emailConfirmation.model';
import {UsersService} from "../application/users.service";
import {UserDto} from "../api/dto/userDto";
import {toCreateUserViewModel} from "../../../data-mapper/to-create-user-view.model";
import { v4 as uuidv4 } from 'uuid';
import {UserViewModelWithBanInfo} from "../api/dto/userView.model";

@Injectable()
export class CreateUserBySaUseCase {
  constructor(protected usersService: UsersService) {}

  async execute(dto: UserDto): Promise<UserViewModelWithBanInfo> {
    const userId = uuidv4();
    const emailConfirmation = new EmailConfirmationModel(
       userId,
      null,
      null,
      true,
    );

    const userAndBanInfo = await this.usersService.createUser(dto, emailConfirmation, userId);
    const viewUser = toCreateUserViewModel(userAndBanInfo.createdUser, userAndBanInfo.createdBanInfo);

    return viewUser
  }
}