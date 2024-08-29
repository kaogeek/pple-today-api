import 'reflect-metadata';
import { IsString } from 'class-validator';

export class UserEngagementUpdateRequest {
    @IsString()
    public isReadId: string;

    @IsString()
    public commentId: string;

    @IsString()
    public likeId: string;

    @IsString()
    public voteChoiceId: string;

    @IsString()
    public voteItemId: string;

    @IsString()
    public votingId: string;

    @IsString()
    public voteId: string;

}