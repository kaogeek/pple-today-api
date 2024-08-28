import { IsNotEmpty, IsMongoId } from 'class-validator';
import { BeforeInsert, BeforeUpdate, Column, Entity, ObjectIdColumn } from 'typeorm';
import { ObjectID } from 'mongodb';
import { BaseModel } from './BaseModel';
import moment from 'moment';

@Entity('CacheEntity')
export class Cache extends BaseModel {

    @ObjectIdColumn({ name: '_id' })
    @IsNotEmpty()
    @IsMongoId()
    public id: ObjectID;

    @Column({ name: 'theThings'})
    public theThings: ObjectID;

    @Column({ name: 'userIds'})
    public userIds: ObjectID[];

    @Column({ name: 'sending'})
    public sending: number;

    @Column({ name: 'sended'})
    public sended: number;
    
    @Column({ name: 'active'})
    public active: boolean;

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