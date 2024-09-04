/*
 * @license Spanboon Platform v0.1
 * (c) 2020-2021 KaoGeek. http://kaogeek.dev
 * License: MIT. https://opensource.org/licenses/MIT
 * Author:  shiorin <junsuda.s@absolute.co.th>, chalucks <chaluck.s@absolute.co.th>
 */

import 'reflect-metadata';
import { IsNotEmpty, IsString, IsArray, IsBoolean } from 'class-validator';
import { ObjectID } from 'typeorm';

export class IsReadVote {
    @IsNotEmpty({ message: 'userId is required' })
    @IsString()
    public userId: ObjectID;

    @IsNotEmpty({ message: 'votingId is required' })
    @IsArray()
    public votingId: string;

    @IsNotEmpty({ message: 'isRead is required' })
    @IsBoolean()
    public isRead: boolean;

    @IsNotEmpty({ message: 'device is required' })
    @IsString()
    public device: string;

    @IsNotEmpty({ message: 'action is required' })
    @IsString()
    public action: string;

    public createdDate: Date;
}