import { JsonController, Res, Req, Authorized, Get } from 'routing-controllers';
import { USER_TYPE } from '../../../constants/NotificationType';
import { User } from '../../models/User';
import { Worker} from 'worker_threads';
import { NotificationService } from '../../services/NotificationService';
import { Notification } from '../../models/Notification';
import { CacheService } from '../../services/CacheService';
import { Cache } from '../../models/CacheModel';
// import { AnalyticsService } from '../../services/AnalyticsService';
import { WorkerThreadService } from '../../services/WokerThreadService';
import { checkify } from '../../../utils/ChuckWorkerThreadUtil';
import { VotingEventModel } from '../../models/VotingEventModel';
import { VotingEventService } from '../../services/VotingEventService';
import { UserService } from '../../services/UserService';
import { ObjectID } from 'mongodb';
import { NotiTypeAction } from '../../../constants/WorkerThread';
import { ResponseUtil } from '../../../utils/ResponseUtil';
import { PostsService } from '../../services/PostsService';
import { PostsGalleryService } from '../../services/PostsGalleryService';
import { AssetService } from '../../services/AssetService';
import { S3Service } from '../../services/S3Service';

@JsonController('/admin/notification')
export class AdminNotificationController {
    constructor(
        private votingEventService: VotingEventService,
        private userService:UserService,
        private workerThreadService:WorkerThreadService,
        private notificationService:NotificationService,
        private cacheService:CacheService,
        private postsService:PostsService,
        private postsGalleryService:PostsGalleryService,
        private assetService:AssetService,
        private s3Service:S3Service
    ) { }

    @Get('/vote')
    @Authorized('')
    public async notificationVoteEvent(@Res() res: any, @Req() req: any): Promise<any> {
        const voteEventNoti: any = await this.workerThreadService.aggregate([{$match:{type: NotiTypeAction['vote_event_noti'], active: false}},{$sort:{createdDate:-1}}, {$limit:1}]);
        if(voteEventNoti.length > 0) {
            let successResponse:any = null;
            const voteEvent:VotingEventModel = await this.votingEventService.findOne({_id: new ObjectID(voteEventNoti[0].theThings), approved: true, closed: false});
            if (voteEvent === undefined) {
                const errorResponse = ResponseUtil.getErrorResponse('Nothing to update.', undefined);
                return res.status(400).send(errorResponse);
            }
            const caching:any = await this.cacheService.aggregate([{$match:{theThings:voteEvent.id,active:false}}]);
            const userNotIn:ObjectID[] = [];
            if(caching.length > 0) {
                for(const user of caching[0].userIds) {
                    userNotIn.push(new ObjectID(user));
                }
            }

            const matchObj:any = [
                {
                    $match: 
                    {
                        _id: {$nin:userNotIn},
                        banned:false
                    }
                },
                {
                    $project: {
                        _id:1
                    }
                },
                {
                    $limit:10000,
                }
            ];

            if(caching[0] !== undefined && caching[0].sending === caching[0].sended) {
                await this.cacheService.update({_id: new ObjectID(caching[0]._id)}, {$set: {active:true}});
                await this.workerThreadService.update({_id: new ObjectID(voteEventNoti[0]._id)},{$set:{active:true}});
                successResponse = ResponseUtil.getSuccessResponse('All users have had notification.', voteEvent);
                return res.status(200).send(successResponse);
            }

            const users:User[] = await this.userService.aggregate(matchObj);
            const userObjIds: any[] = users.map((user:any) => new ObjectID(user._id));
            // caching
            if(caching.length === 0) {
                // const analytics:any = new AnalyticsModel();
                // analytics.type = NotiTypeAction['vote_event_noti'];
                // analytics.theThings = voteEvent.id;
                // await this.analyticsService.create(analytics);

                const allUsers:any = await this.userService.aggregate([{$match:{banned:false}}]);
                const cached:any = new Cache();
                cached.theThings = voteEvent.id;
                cached.userIds = userObjIds;
                cached.active = false;
                cached.sended = userObjIds.length;
                cached.sending = allUsers.length;
                await this.cacheService.create(cached);
            } else {
                await this.cacheService.update(
                    {
                        _id: new ObjectID(caching[0]._id)
                    }, 
                    {
                        $push: {
                            userIds: { $each: userObjIds }
                        },
                        $inc: {
                            sended: userObjIds.length,
                        }
                    }
                );
            }

            const chunks: any[][] = await checkify(userObjIds, Number(process.env.WORKER_THREAD_JOBS));
            const asset:any = await this.assetService.findOne({_id: new ObjectID(voteEvent.assetId)});
            const signUrl = await this.s3Service.s3signCloudFront(asset.s3FilePath);
            // imageURL: itemPost.s3CoverImage === null ? '/file/'+ String(asset.id) :  asset.s3FilePath,

            chunks.forEach((item:any, i:number) => {
                const workerThread = new Worker(process.env.WORKER_THREAD_PATH);
                const messagePayload:any = {
                    title: voteEvent.title,
                    detail: voteEvent.detail,
                    typeAdmin: NotiTypeAction['create_vote_event_noti'],
                    type: NotiTypeAction['vote_event_noti'],
                    fromUser: String(voteEvent.userId),
                    userArrs: JSON.stringify(item),
                    pageId: String(voteEvent.createAsPage),
                    imageURL: asset.s3FilePath === null ? '/file/'+ String(asset.id) :  signUrl,
                    link: process.env.APP_VOTE +`/event/${String(voteEvent.id)}`,
                };
                workerThread.postMessage(messagePayload);
                workerThread.on('message', (feedback:any) => {
                    if(feedback.message === 'done') {
                        if( feedback.notification.userArrs.length > 0) {
                            const userObj = JSON.parse(feedback.notification['userArrs']);
                            for(const itemContent of userObj) {
                                const notification = new Notification();
                                notification.title = feedback.notification['title'];
                                notification.toUser = new ObjectID(itemContent);
                                notification.toUserType = null;
                                notification.fromUser = new ObjectID(feedback.notification['fromUser']);
                                notification.fromUserType = null;
                                notification.isRead = false;
                                notification.link = feedback.notification['link'];
                                notification.type = feedback.notification['type'];
                                notification.deleted = false;
                                notification.data = feedback.notification['detail'];
                                notification.mode = feedback.notification['type'];
                                notification.pageId = new ObjectID(feedback.notification['pageId']);
                                notification.imageURL = feedback.notification['imageURL'];
                                notification.joinObjectiveId = null;
                                // console.log('notification::',notification);
                                this.notificationService.create(notification);
                            }
                        }
                        console.log(`Worker ${i} completed.`);
                    }
                });
            });
            successResponse = ResponseUtil.getSuccessResponse('Worker Thread create notification is success.', null);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Nothing to update.', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    @Get('/line')
    @Authorized('')
    public async notificationLineNoti(@Res() res: any, @Req() req: any): Promise<any> {
        const lineFlexMsgNoti: any = await this.workerThreadService.aggregate([{$match:{type: NotiTypeAction['line_noti'], active: false}},{$sort:{createdDate:-1}}, {$limit:1}]);
        if(lineFlexMsgNoti.length > 0) {
            const postArr: ObjectID[] = [];
            if(lineFlexMsgNoti.length > 0) {
                for(const item of lineFlexMsgNoti[0].postIds) {
                    postArr.push(new ObjectID(item));
                }
            }

            if(postArr.length === 0) {
                const errorResponse = ResponseUtil.getErrorResponse('Nothing to update.', undefined);
                return res.status(400).send(errorResponse);
            }

            let successResponse:any = null;
            const postObjIds:any = await this.postsService.aggregate(
                [
                    {
                        $match : {
                            _id : {$in: postArr}
                        }
                    }
                ]
            );
            const caching:any = await this.cacheService.aggregate([{$match:{theThings:new ObjectID(lineFlexMsgNoti[0].theThings),active:false}}]);
            const userNotIn:ObjectID[] = [];
            if(caching.length > 0) {
                for(const user of caching[0].userIds) {
                    userNotIn.push(new ObjectID(user));
                }
            }
            const matchObj:any = [
                {
                    $match: 
                    {
                        _id: {$nin:userNotIn},
                        banned:false
                    }
                },
                {
                    $project: {
                        _id:1
                    }
                },
                {
                    $limit:10000,
                }
            ];

            if(caching[0] !== undefined && caching[0].sending === caching[0].sended) {
                await this.cacheService.update({_id: new ObjectID(caching[0]._id)}, {$set: {active:true}});
                await this.workerThreadService.update({_id: new ObjectID(lineFlexMsgNoti[0]._id)},{$set:{active:true}});
                successResponse = ResponseUtil.getSuccessResponse('All users have had notification.', lineFlexMsgNoti);
                return res.status(200).send(successResponse);
            }
            const users:User[] = await this.userService.aggregate(matchObj);
            const userObjIds: any[] = users.map((user:any) => new ObjectID(user._id));
            
            if(caching.length === 0) {
                // const analytics:any = new AnalyticsModel();
                // analytics.type = NotiTypeAction['line_noti'];
                // analytics.theThings = new ObjectID(lineFlexMsgNoti[0].theThings);
                // await this.analyticsService.create(analytics);

                const allUsers:any = await this.userService.aggregate([{$match:{banned:false}}]);
                const cached:any = new Cache();
                cached.theThings = new ObjectID(lineFlexMsgNoti[0].theThings);
                cached.userIds = userObjIds;
                cached.active = false;
                cached.sended = userObjIds.length;
                cached.sending = allUsers.length;
                await this.cacheService.create(cached);
            } else {
                await this.cacheService.update(
                    {
                        _id: new ObjectID(caching[0]._id)
                    }, 
                    {
                        $push: {
                            userIds: { $each: userObjIds }
                        },
                        $inc: {
                            sended: userObjIds.length,
                        }
                    }
                );
            }

            const chunks: any[][] = await checkify(userObjIds, Number(process.env.WORKER_THREAD_JOBS));

            if(postObjIds.length > 0) {
                for(const itemPost of postObjIds) {
                    const postsGallery:any = await this.postsGalleryService.findOne({post: new ObjectID(itemPost._id)});
                    const asset:any = await this.assetService.findOne({_id: postsGallery.fileId});
                    chunks.forEach((item:any, i:number) => {
                        const workerThread = new Worker(process.env.WORKER_THREAD_PATH);
                        const messagePayload:any = {
                            title: itemPost.title,
                            detail: itemPost.detail,
                            typeAdmin: NotiTypeAction['create_vote_event_noti'],
                            type: NotiTypeAction['line_noti'],
                            toUser: String(item.ownerUser),
                            toUserType: USER_TYPE.USER,
                            fromUserType: USER_TYPE.PAGE,
                            fromUser: String(itemPost.ownerUser),
                            userArrs: JSON.stringify(item),
                            pageId: String(itemPost.pageId),
                            imageURL: itemPost.s3CoverImage === null ? '/file/'+ String(asset.id) :  asset.s3FilePath,
                            link: process.env.APP_POST +`/${String(itemPost._id)}`,
                        };
                        workerThread.postMessage(messagePayload);
                        workerThread.on('message', (feedback:any) => {
                            if(feedback.message === 'done') {
                                if( feedback.notification.userArrs.length > 0) {
                                    const userObj = JSON.parse(feedback.notification['userArrs']);
                                    for(const itemContent of userObj) {
                                        const notification = new Notification();
                                        notification.title = feedback.notification['title'];
                                        notification.toUser = new ObjectID(itemContent);
                                        notification.toUserType = feedback.notification['toUserType'];
                                        notification.fromUser = new ObjectID(feedback.notification['fromUser']);
                                        notification.fromUserType = feedback.notification['fromUserType'];
                                        notification.isRead = false;
                                        notification.link = feedback.notification['link'];
                                        notification.type = feedback.notification['type'];
                                        notification.deleted = false;
                                        notification.data = feedback.notification['detail'];
                                        notification.mode = feedback.notification['type'];
                                        notification.pageId = feedback.notification['pageId'] === null ? null : new ObjectID(feedback.notification['pageId']);
                                        notification.imageURL = feedback.notification['imageURL'];
                                        notification.joinObjectiveId = null;
                                        // console.log('notification::',notification);
                                        this.notificationService.create(notification);
                                    }
                                }
                                console.log(`Worker ${i} completed.`);
                            }
                        });
                    });
                }
            } else {
                const errorResponse = ResponseUtil.getErrorResponse('Post Object length is zero.', undefined);
                return res.status(400).send(errorResponse); 
            }
            successResponse = ResponseUtil.getSuccessResponse('Worker Thread create line noti is success.', null);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Nothing to update.', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    @Get('/pple')
    @Authorized('')
    public async notificationPpleNotification(@Res() res: any, @Req() req: any): Promise<any> {
        const ppleNoti:any = await this.workerThreadService.aggregate([{$match:{type: NotiTypeAction['pple_news_noti'], active: false}},{$sort:{createdDate:-1}}, {$limit:1}]);
        if(ppleNoti.length > 0) {
            let successResponse:any = null;
            const postArr: ObjectID[] = [];
            if(ppleNoti.length > 0) {
                for(const item of ppleNoti[0].postIds) {
                    postArr.push(new ObjectID(item));
                }
            }

            if(postArr.length === 0) {
                const errorResponse = ResponseUtil.getErrorResponse('Nothing to update.', undefined);
                return res.status(400).send(errorResponse);
            }

            const postObjIds:any = await this.postsService.aggregate(
                [
                    {
                        $match : {
                            _id : {$in: postArr}
                        }
                    }
                ]
            );
            const caching:any = await this.cacheService.aggregate([{$match:{theThings:new ObjectID(ppleNoti[0].theThings),active:false}}]);
            const userNotIn:ObjectID[] = [];
            if(caching.length > 0) {
                for(const user of caching[0].userIds) {
                    userNotIn.push(new ObjectID(user));
                }
            }
            const matchObj:any = [
                {
                    $match: 
                    {
                        _id: {$nin:userNotIn},
                        banned:false
                    }
                },
                {
                    $project: {
                        _id:1
                    }
                },
                {
                    $limit:10000,
                }
            ];
            
            if(caching[0] !== undefined && caching[0].sending === caching[0].sended) {
                await this.cacheService.update({_id: new ObjectID(caching[0]._id)}, {$set: {active:true}});
                await this.workerThreadService.update({_id: new ObjectID(ppleNoti[0]._id)},{$set:{active:true}});
                successResponse = ResponseUtil.getSuccessResponse('All users have had notification.', null);
                return res.status(200).send(successResponse);
            }
            
            const users:User[] = await this.userService.aggregate(matchObj);
            const userObjIds: any[] = users.map((user:any) => new ObjectID(user._id));

            if(caching.length === 0) {
                // const analytics:any = new AnalyticsModel();
                // analytics.type = NotiTypeAction['line_noti'];
                // analytics.theThings = new ObjectID(lineFlexMsgNoti[0].theThings);
                // await this.analyticsService.create(analytics);

                const allUsers:any = await this.userService.aggregate([{$match:{banned:false}}]);
                const cached:any = new Cache();
                cached.theThings = new ObjectID(ppleNoti[0].theThings);
                cached.userIds = userObjIds;
                cached.active = false;
                cached.sended = userObjIds.length;
                cached.sending = allUsers.length;
                await this.cacheService.create(cached);
            } else {
                await this.cacheService.update(
                    {
                        _id: new ObjectID(caching[0]._id)
                    }, 
                    {
                        $push: {
                            userIds: { $each: userObjIds }
                        },
                        $inc: {
                            sended: userObjIds.length,
                        }
                    }
                );
            }
            const chunks: any[][] = await checkify(userObjIds, Number(process.env.WORKER_THREAD_JOBS));
            if(postObjIds.length > 0) {
                for(const itemPost of postObjIds) {
                    const postsGallery:any = await this.postsGalleryService.findOne({post: new ObjectID(itemPost._id)});
                    const asset:any = await this.assetService.findOne({_id: postsGallery.fileId});
                    chunks.forEach((item:any, i:number) => {
                        const workerThread = new Worker(process.env.WORKER_THREAD_PATH);
                        const messagePayload:any = {
                            title: itemPost.title,
                            detail: itemPost.detail,
                            typeAdmin: NotiTypeAction['create_pple_news_noti'],
                            type: NotiTypeAction['pple_news_noti'],
                            toUser: String(item.ownerUser),
                            toUserType: USER_TYPE.USER,
                            fromUserType: USER_TYPE.PAGE,
                            fromUser: String(itemPost.ownerUser),
                            userArrs: JSON.stringify(item),
                            pageId: String(itemPost.pageId),
                            imageURL: itemPost.s3CoverImage === null ? '/file/'+ String(asset.id) :  asset.s3FilePath,
                            link: process.env.APP_POST +`/${String(itemPost._id)}`,
                        };
                        workerThread.postMessage(messagePayload);
                        workerThread.on('message', (feedback:any) => {
                            if(feedback.message === 'done') {
                                if( feedback.notification.userArrs.length > 0) {
                                    const userObj = JSON.parse(feedback.notification['userArrs']);
                                    for(const itemContent of userObj) {
                                        const notification = new Notification();
                                        notification.title = feedback.notification['title'];
                                        notification.toUser = new ObjectID(itemContent);
                                        notification.toUserType = feedback.notification['toUserType'];
                                        notification.fromUser = new ObjectID(feedback.notification['fromUser']);
                                        notification.fromUserType = feedback.notification['fromUserType'];
                                        notification.isRead = false;
                                        notification.link = feedback.notification['link'];
                                        notification.type = feedback.notification['type'];
                                        notification.deleted = false;
                                        notification.data = feedback.notification['detail'];
                                        notification.mode = feedback.notification['type'];
                                        notification.pageId = feedback.notification['pageId'] === null ? null : new ObjectID(feedback.notification['pageId']);
                                        notification.imageURL = feedback.notification['imageURL'];
                                        notification.joinObjectiveId = null;
                                        // console.log('notification::',notification);
                                        this.notificationService.create(notification);
                                    }
                                }
                                console.log(`Worker ${i} completed.`);
                            }
                        });
                    });
                }
            } else {
                const errorResponse = ResponseUtil.getErrorResponse('Post Object length is zero.', undefined);
                return res.status(400).send(errorResponse); 
            }
            successResponse = ResponseUtil.getSuccessResponse('Worker Thread create pple is success.', null);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Nothing to update.', undefined);
            return res.status(400).send(errorResponse);
        }
    }
}