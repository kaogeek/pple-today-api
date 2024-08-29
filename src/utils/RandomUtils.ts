import { NotiTypeAction } from '../constants/WorkerThread';
import { UserService } from '../api/services/UserService';
import { UserRepository } from '../api/repositories/UserRepository';
import { PageRepository } from '../api/repositories/PageRepository';
import { AssetService } from '../api/services/AssetService';
import { S3Service } from '../api/services/S3Service';
import { getCustomRepository } from 'typeorm';
import { AssetRepository } from '../api/repositories/AssetRepository';
import { ConfigRepository } from '../api/repositories/ConfigRepository';
import { ConfigService } from '../api/services/ConfigService';
import { ObjectID } from 'mongodb';
import { PostsCommentRepository } from '../api/repositories/PostsCommentRepository';
import { PostsCommentService } from '../api/services/PostsCommentService';
import { UserLikeRepository } from '../api/repositories/UserLikeRepository';
import { UserLikeService } from '../api/services/UserLikeService';
import { UserLike } from '../api/models/UserLike';
import { PostsComment } from '../api/models/PostsComment';
import { IsReadPostRepository } from '../api/repositories/IsReadRepository';
import { IsReadPostService } from '../api/services/IsReadPostService';
import { VotingEventRepository } from '../api/repositories/VotingEventRepository';
import { VotingEventService } from '../api/services/VotingEventService';
import { VoteItemRepository } from '../api/repositories/VoteItemRepository';
import { VoteItemService } from '../api/services/VoteItemService';
import { VoteChoiceRepository } from '../api/repositories/VoteChoiceRepository';
import { VoteChoiceService } from '../api/services/VoteChoiceService';
import { VotedRepository } from '../api/repositories/VotedRepository';
import { VotedService } from '../api/services/VotedService';
import { Voted } from '../api/models/VotedModel';

export async function randomNotiEngageAction(): Promise<any> {
    const getNotiAction: string[] = [];
    const queue:any = [NotiTypeAction];
    while(queue.length > 0) {
        const current:any = queue.shift();
        if(current['line_noti']) {
            getNotiAction.push(current['line_noti']);
        } else if(current['vote_event_noti']) {
            getNotiAction.push(current['vote_event_noti']);
        } else {
            getNotiAction.push(current['create_vote_event_noti']);
        }
    }
    const randomNum:number = Math.random() * 3;
    return getNotiAction[randomNum];
}

export async function randomUser(): Promise<any> {
    const userRepository = getCustomRepository(UserRepository);
    const pageRepository = getCustomRepository(PageRepository);
    const configRepository = getCustomRepository(ConfigRepository);
    const configService = new ConfigService(configRepository);
    const s3Service = new S3Service(configService);
    const assetRepository = getCustomRepository(AssetRepository);
    const assetService = new AssetService(assetRepository,configService,s3Service);

    const userService:any = new UserService(
        userRepository,
        pageRepository,
        assetService,
        s3Service
    );
    const userIds:any = await userService.aggregate([{$sample:{size:1}}, {$project: { _id: 1}}]);
    return new ObjectID(userIds[0]._id);
}

// TODO comment, like
export async function randomComment(postId: any, userId:any): Promise<any> {
    const randCommend: string[] = ['สวัสดีประชาชน','ดีมากเลยครับ','สู้ๆพรรคประชาชน','แล้วเราจะเดินไปด้วยกัน','ก้าวต่อไป'];
    const rand:any = randCommend[Math.random() * 5 + 1]; 
    const postsCommentRepository = getCustomRepository(PostsCommentRepository);
    const postsCommentService = new PostsCommentService(postsCommentRepository);
    const postsComment:any = new PostsComment();
    postsComment.user = new ObjectID(userId);
    postsComment.post = new ObjectID(postId);
    postsComment.comment = rand;
    postsComment.likeCount = 0;
    postsComment.createdDate = new Date();
    postsComment.updateDate = null;
    const createPostComment:any = await postsCommentService.create(postsComment);
    return createPostComment.id;
}

export async function randomLike(postId: any, userId:any): Promise<any> {
    const userLikeRepository = getCustomRepository(UserLikeRepository);
    const userLikeService = new UserLikeService(userLikeRepository);
    const userLike:any = new UserLike();
    userLike.userId = new ObjectID(userId);
    userLike.subjectId = new ObjectID(postId);
    userLike.subjectType = 'POST';
    userLike.likeAsPage = null;
    const likeCreate:any = await userLikeService.create(userLike);
    return likeCreate.id;
}

export async function randomIsRead(thingId: string[], userId:any, action: string): Promise<any> {
    const isReadPostRepository = getCustomRepository(IsReadPostRepository);
    const isReadPostService = new IsReadPostService(isReadPostRepository);
    const devices: string[] = ['google_chrome', 'firefox', 'iphone', 'readlme', 'oppo', 'samsung', 'ipad'];
    const randDevice: string = devices[Math.floor(Math.random() * devices.length)];
    // LINE_NOTI, PPLE_NEWS
    if(action === NotiTypeAction['line_noti'] || action === NotiTypeAction['pple_news_noti']) {
        await isReadPostService.findOneAndUpdate(
            { userId: new ObjectID(userId)},
            { $set: { postId: thingId, 
                    isRead: true,
                    device: randDevice,
                    action: action.toUpperCase().trim(),
                    createdDate: new Date(),   
                } 
            },
            { upsert: true, new: true }
        );
        const isReadId:any = await isReadPostService.findOne({userId:  new ObjectID(userId)});
        return isReadId.id;
    } else {
        await isReadPostService.findOneAndUpdate(
            { userId: new ObjectID(userId)},
            { $set: { postId: thingId, 
                    isRead: true,
                    device: randDevice,
                    action: action.toUpperCase().trim(),
                    createdDate: new Date(),   
                } 
            },
            { upsert: true, new: true }
        );
        const isReadId:any = await isReadPostService.findOne({userId:  new ObjectID(userId)});
        return isReadId.id;
    }
}

// TODO Vote choice, one choice, multi choices, text
export async function randomVoteOneChoice(thingId: string, userId:any): Promise<any> {
    const votingEventRepository = getCustomRepository(VotingEventRepository);
    const voteItemRepository = getCustomRepository(VoteItemRepository);
    const voteChoiceRepository = getCustomRepository(VoteChoiceRepository);
    const votingEventService = new VotingEventService(votingEventRepository);
    const voteItemService = new VoteItemService(voteItemRepository);
    const voteChoiceService = new VoteChoiceService(voteChoiceRepository);

    const voteEvent:any = await votingEventService.findOne({_id: new ObjectID(thingId)});
    const voteItem:any = await voteItemService.find({votingId: voteEvent.id, type: 'single'});
    const randChoice: any[] = voteItem;
    let voteChoice:any = undefined;

    const votedRepository = getCustomRepository(VotedRepository);
    const votedService = new VotedService(votedRepository);
    const voted:any = new Voted();
    // devices[Math.floor(Math.random() * devices.length)];
    const getRand = Math.floor(Math.random() * voteItem.length);
    if(randChoice[getRand] === undefined) {
        return;
    }

    voteChoice = await voteChoiceService.findOne({voteItemId: new ObjectID(randChoice[getRand].id)});
    voted.votingId = voteEvent.id;
    voted.userId = new ObjectID(userId);
    voted.pageId = null;
    voted.answer = voteChoice.title;
    voted.voteItemId = new ObjectID(randChoice[getRand].id);
    voted.voteChoiceId = voteChoice.id;
    return await votedService.create(voted);
}

export async function randomVoteMultiChoice(thingId: string, userId:any): Promise<any> {
    const votingEventRepository = getCustomRepository(VotingEventRepository);
    const voteItemRepository = getCustomRepository(VoteItemRepository);
    const voteChoiceRepository = getCustomRepository(VoteChoiceRepository);
    const votingEventService = new VotingEventService(votingEventRepository);
    const voteItemService = new VoteItemService(voteItemRepository);
    const voteChoiceService = new VoteChoiceService(voteChoiceRepository);

    const voteEvent:any = await votingEventService.findOne({_id: new ObjectID(thingId)});
    const voteItem:any = await voteItemService.find({votingId: voteEvent.id, type: 'multi'});
    const randChoice: any[] = [];
    let voteChoice:any = undefined;
    if(voteItem.length > 0) {
        for(const item of voteItem) {
            randChoice.push(item);
        }
    }
    const votedRepository = getCustomRepository(VotedRepository);
    const votedService = new VotedService(votedRepository);
    const voted:any = new Voted();
    const getRand = Math.floor(Math.random() * voteItem.length);
    if(randChoice[getRand] === undefined) {
        return;
    }
    voteChoice = await voteChoiceService.find({voteItemId: new ObjectID(randChoice[getRand].id)});
    // if(voteChoice.length === 0) {
    //     voteChoice = await voteChoiceService.findOne({_id: randChoice.shift()});
    //     voted.votingId = voteEvent.id;
    //     voted.userId = new ObjectID(userId);
    //     voted.pageId = null;
    //     voted.answer = randChoice[getRand].title;
    //     voted.voteItemId = new ObjectID(randChoice[getRand]._id);
    //     voted.voteChoiceId = voteChoice.id;
    //     return await votedService.create(voted);
    // }
    const result:any = [];
    if(voteChoice.length > 0) {
        for(let i = 0; i< voteChoice.length; i++) {
            voted.votingId = voteEvent.id;
            voted.userId = new ObjectID(userId);
            voted.pageId = null;
            voted.answer = voteChoice[i].title;
            voted.voteItemId = new ObjectID(randChoice[getRand].id);
            voted.voteChoiceId = voteChoice.id;
            const create = await votedService.create(voted);
            result.push(create);
        }
    }
    if(result.length > 0) {
        return result;
    }
}

export async function randomVoteTextChoice(thingId: string, userId:any): Promise<any> {
    const votingEventRepository = getCustomRepository(VotingEventRepository);
    const voteItemRepository = getCustomRepository(VoteItemRepository);
    const votingEventService = new VotingEventService(votingEventRepository);
    const voteItemService = new VoteItemService(voteItemRepository);

    const voteEvent:any = await votingEventService.findOne({_id: new ObjectID(thingId)});
    const voteItem:any = await voteItemService.find({votingId: voteEvent.id, type: 'text'});
    const randChoice: any[] = [];
    if(voteItem.length > 0) {
        for(const item of voteItem) {
            randChoice.push(item);
        }
    }
    const textRand: string[] = ['ดีมากๆครับ', 'เห็นด้วยสุดๆ', 'ยอดเยี่ยมครับ', 'เชงมากๆ','อยากได้สุดๆ','หัวข้อไร้สาระมากๆครับ','ไม่สร้างสรรคเลยครับ'];
    const votedRepository = getCustomRepository(VotedRepository);
    const votedService = new VotedService(votedRepository);
    const voted:any = new Voted();
    const getRand = Math.floor(Math.random() * voteItem.length);
    const getRandText = Math.floor(Math.random() * textRand.length);
    if (randChoice[getRand] === undefined || textRand[getRandText] === undefined) {
        return;
    }
    console.log(`textRand[getRandText]`, textRand[getRandText]);
    voted.votingId = voteEvent.id;
    voted.userId = new ObjectID(userId);
    voted.pageId = null;
    voted.answer = textRand[getRandText];
    voted.voteItemId = new ObjectID(randChoice[getRand].id);
    voted.voteChoiceId = null;
    const create:any = await votedService.create(voted);
    return create;
}