/*
 * @license Spanboon Platform v0.1
 * (c) 2020-2021 KaoGeek. http://kaogeek.dev
 * License: MIT. https://opensource.org/licenses/MIT
 * Author:  shiorin <junsuda.s@absolute.co.th>, chalucks <chaluck.s@absolute.co.th>
 */

import 'reflect-metadata';
import {IsBoolean, IsNotEmpty, IsString, IsNumber, Min} from 'class-validator';
export class UserEngagementRequest {
 
    public contentId: string;
    public contentType: string;
    public ip: string;

    @IsNotEmpty()
    @IsString()
    public device: string;

    @IsNotEmpty()
    @IsString()
    public userId: string;
    
    public clientId: string;

    @IsNotEmpty()
    @IsBoolean()
    public isFirst: boolean;

    @IsNotEmpty()
    @IsString()
    public action: string;
    
    @IsNotEmpty()
    @IsString()
    public reference: string;

    public likeAsPage: number;  

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    public point: number;

    @IsString()
    public postId: string;

    @IsString()
    public votingId: string;

    @IsString()
    public isReadId: string;

    @IsNotEmpty()
    @IsBoolean()
    public isRead: boolean;
}
