import 'reflect-metadata';
import { IsString } from 'class-validator';

export class UserEngagementUpdateRequest {
    @IsString()
    public commentId: string;

    @IsString()
    public likeId: string;

}