import 'reflect-metadata';
import { IsArray, IsString } from 'class-validator';

export class UserEngagementUpdateRequest {
    @IsString()
    public isReadId: string;

    @IsString()
    public commentId: string;

    @IsString()
    public likeId: string;

    @IsArray()
    public voteChoiceId: [];

    @IsArray()
    public voteItemId: [];

    @IsString()
    public votingId: string;

    @IsArray()
    public voteId: [];

}