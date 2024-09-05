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

@Entity('UserEngagement')
export class UserEngagement extends BaseModel {

    @ObjectIdColumn({ name: '_id' })
    @IsNotEmpty()
    @IsMongoId()
    public id: ObjectID;

    @Column({ name: 'contentId' })
    public contentId: string;

    @Column({ name: 'contentType' })
    public contentType: string;

    @Column({ name: 'ip' })
    public ip: string;

    @Column({ name: 'device'})
    public device: string;

    @Column({ name: 'userId' })
    public userId: ObjectID;

    @Column({ name: 'clientId' })
    public clientId: string;

    @Column({ name: 'isFirst' })
    public isFirst: boolean;

    @Column({ name: 'action' })
    public action: string;

    @Column({ name: 'reference' })
    public reference: string;

    @Column({ name: 'likeAsPage' })
    public likeAsPage: ObjectID;

    @Column({ name: 'point' })
    public point: number;

    @Column({ name: 'postId'})
    public postId: ObjectID;

    @Column({ name: 'voteId'})
    public voteId: ObjectID[];

    @Column({ name: 'isReadId'})
    public isReadId: ObjectID;

    @Column({ name: 'commentId'})
    public commentId: ObjectID;

    @Column({ name: 'likeId'})
    public likeId: ObjectID;

    @Column({ name: 'voteChoiceId'})
    public voteChoiceId: ObjectID[];

    @Column({ name: 'voteItemId'})
    public voteItemId: ObjectID[];

    @Column({ name: 'votingId'})
    public votingId: ObjectID;

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
