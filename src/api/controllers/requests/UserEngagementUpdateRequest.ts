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
    public voteChoiceId: string;

    @IsArray()
    public voteItemId: string;

    @IsString()
    public votingId: string;

    @IsString()
    public voteId: string;

}