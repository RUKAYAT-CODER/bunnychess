import { isDatabaseError } from '@common/database/postgres/errors';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PostgresError } from 'pg-error-enum';
import { Database } from '../../database/database.module';
import { EmailAlreadyExistsException } from '../exceptions/email-already-exists.exception';
import { UsernameAlreadyExistsException } from '../exceptions/username-already-exists.exception';
import { Account } from '../model/account.interface';

interface InsertAccount {
  email: string;
  username: string;
  password: string;
  isAdmin: boolean;
}

interface UpdateAccount {
  lastLoginAt?: Date;
}

@Injectable()
export class AccountRepositoryService {
  constructor(private readonly database: Database) {}

  async insertAccount({ email, username, password, isAdmin }: InsertAccount): Promise<Account> {
    try {
      const hashedPassword = await this.hashPassword(password);
      const account = await this.database
        .insertInto('account')
        .values({
          email: email.toLowerCase(),
          username,
          password: hashedPassword,
          isAdmin,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      return account;
    } catch (err) {
      if (isDatabaseError(err, PostgresError.UNIQUE_VIOLATION)) {
        switch (err.constraint) {
          case 'account_email_key':
            throw new EmailAlreadyExistsException();
          case 'account_username_key':
            throw new UsernameAlreadyExistsException();
        }
      }
      throw err;
    }
  }

  async findAccount(filter: { id: string } | { email: string }): Promise<Account | undefined> {
    let query = this.database.selectFrom('account').selectAll();
    if ('id' in filter && filter.id) {
      query = query.where('id', '=', filter.id);
    }
    if ('email' in filter && filter.email) {
      query = query.where('email', '=', filter.email.toLowerCase());
    }
    return query.executeTakeFirst();
  }

  async updateAccount(accountId: string, { lastLoginAt }: UpdateAccount): Promise<void> {
    const query = this.database
      .updateTable('account')
      .set({
        lastLoginAt,
      })
      .where('id', '=', accountId);
    await query.executeTakeFirst();
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
