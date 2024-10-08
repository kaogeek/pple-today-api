/*
 * @license Spanboon Platform v0.1
 * (c) 2020-2021 KaoGeek. http://kaogeek.dev
 * License: MIT. https://opensource.org/licenses/MIT
 * Author:  shiorin <junsuda.s@absolute.co.th>, chalucks <chaluck.s@absolute.co.th>
 */

import { IsNotEmpty, IsMongoId } from 'class-validator';
import { BeforeInsert, BeforeUpdate, Column, Entity, ObjectIdColumn } from 'typeorm';
import { ObjectID } from 'mongodb';
import { BaseModel } from './BaseModel';
import moment from 'moment';

@Entity('AuthenticationId')
export class AuthenticationId extends BaseModel {

    @ObjectIdColumn({ name: '_id' })
    @IsNotEmpty()
    @IsMongoId()
    public id: ObjectID;

    @Column({ name: 'user' })
    public user: ObjectID;

    @Column({ name: 'lastAuthenTime' })
    public lastAuthenTime: Date;

    @Column({ name: 'lastSuccessAuthenTime' })
    public lastSuccessAuthenTime: Date;

    @Column({ name: 'providerName' })
    public providerName: string;

    @Column({ name: 'providerUserId' })
    public providerUserId: any;

    @Column({ name: 'storedCredentials' })
    public storedCredentials: string;

    @Column({ name: 'refreshToken' })
    public refreshToken: string;

    @Column({ name: 'properties' })
    public properties: any;

    @Column({ name: 'expirationDate' })
    public expirationDate: Date;

    @Column({ name: 'membership' })
    public membership: boolean;

    @Column({ name: 'expirationDate_law_expired' })
    public expirationDate_law_expired: Date;

    @Column({ name: 'membershipState' })
    public membershipState: string;

    @Column({ name: 'membershipType' })
    public membershipType: string;

    @Column({ name: 'identificationNumber' })
    public identificationNumber: any;

    @Column({ name: 'mobileNumber' })
    public mobileNumber: any;

    @Column({ name: 'mfpSerial'})
    public mfpSerial: any;

    @BeforeInsert()
    public createDetails(): any {
        this.createdDate = moment().toDate();
        this.createdTime = moment().toDate();
    }

    @BeforeUpdate()
    public updateDetails(): any {
        this.updateDate = moment().toDate();
    }
}
