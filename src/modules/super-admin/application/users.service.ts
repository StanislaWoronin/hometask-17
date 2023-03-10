import { Injectable } from '@nestjs/common';
import { UserDBModel } from '../infrastructure/entity/userDB.model';
import { BanUserDTO } from '../api/dto/ban-user.dto';
import { PgUsersRepository } from "../infrastructure/pg-users.repository";
import { PgEmailConfirmationRepository } from "../infrastructure/pg-email-confirmation.repository";
import { PgBanInfoRepository } from "../infrastructure/pg-ban-info.repository";
import { _generateHash } from '../../../helper.functions';
import { UserDto } from '../api/dto/userDto';
import { BanInfoModel } from '../infrastructure/entity/banInfo.model';
import { EmailConfirmation } from '../infrastructure/entity/emailConfirm.scheme';
import {EmailConfirmationModel} from "../infrastructure/entity/emailConfirmation.model";

@Injectable()
export class UsersService {
  constructor(
    protected banInfoRepository: PgBanInfoRepository,
    protected emailConfirmationRepository: PgEmailConfirmationRepository,
    protected usersRepository: PgUsersRepository,
  ) {}

  async createUser(dto: UserDto, emailConfirmation: EmailConfirmationModel, userId: string) {
    const hash = await _generateHash(dto.password);

    const user = new UserDBModel(
      userId,
      dto.login,
      dto.email,
      hash.passwordSalt,
      hash.passwordHash,
      new Date().toISOString(),
    );

    const banInfo = new BanInfoModel(
      userId,
      false,
      null,
      null,
      null,
    );

    const createdUser = await this.usersRepository.createUser(user);
    const createdBanInfo = await this.banInfoRepository.createBanInfo(banInfo);
    await this.emailConfirmationRepository.createEmailConfirmation(
      emailConfirmation,
    )

    return {createdUser, createdBanInfo}
  }

  async updateUserPassword(
      userId: string,
      newPassword: string,
  ): Promise<boolean> {
    const hash = await _generateHash(newPassword);

    return await this.usersRepository.updateUserPassword(
        userId,
        hash.passwordSalt,
        hash.passwordHash,
    );
  }

  async updateBanStatus(userId: string, dto: BanUserDTO): Promise<boolean> {
    let banDate = null;
    let banReason = null;
    if (dto.isBanned) {
      banDate = new Date().toISOString();
      banReason = dto.banReason;
    }
    //await this.blogsRepository.updateBanStatus(userId, dto.isBanned);
    //await this.likesRepository.updateBanStatus(userId, dto.isBanned);
    return this.banInfoRepository.saUpdateBanStatus(
      userId,
      dto.isBanned,
      banReason,
      banDate,
    );
  }

  async deleteUserById(userId: string): Promise<boolean> {
    const userDeleted = await this.usersRepository.deleteUserById(userId);
    await this.banInfoRepository.deleteBanInfoById(userId);
    await this.emailConfirmationRepository.deleteEmailConfirmationById(userId);

    if (!userDeleted) {
      return false;
    }

    return true;
  }
}
