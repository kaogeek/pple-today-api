/*
 * @license Spanboon Platform v0.1
 * (c) 2020-2021 KaoGeek. http://kaogeek.dev
 * License: MIT. https://opensource.org/licenses/MIT
 * Author:  shiorin <junsuda.s@absolute.co.th>, chalucks <chaluck.s@absolute.co.th>
 */

import 'reflect-metadata';
import { JsonController, Res, Req, Get, Param, Post, Delete, Body, Authorized, QueryParam } from 'routing-controllers';
import { ResponseUtil } from '../../utils/ResponseUtil';
import { NotificationService } from '../services/NotificationService';
import { PageService } from '../services/PageService';
import { UserService } from '../services/UserService';
import { ObjectID } from 'mongodb';
import { SearchFilter } from './requests/SearchFilterRequest';
import { Notification } from '../models/Notification';
import { NotificationResponse } from './responses/NotificationResponse';
import { USER_TYPE } from '../../constants/NotificationType';
// import { PageObjectiveService } from '../services/PageObjectiveService';
@JsonController('/notification')
export class UserNotificationController {
    constructor(
        private notificationService: NotificationService,
        private userService: UserService,
        private pageService: PageService,
        // private pageObjectiveService: PageObjectiveService
    ) {

    }

    // Find UserNotifications API
    /**
     * @api {get} /api/notification list UnRead UserNotifications API
     * @apiGroup UserNotifications
     * @apiSuccessExample {json} Success
     * HTTP/1.1 200 OK
     * {
     *      "message": "Successfully get UserNotifications"
     *      "data":"{}"
     *      "status": "1"
     * }
     * @apiSampleRequest /api/notification
     * @apiErrorExample {json} UserNotifications error
     * HTTP/1.1 500 Internal Server Error
     */
    @Get()
    @Authorized('user')
    public async findAllUserNotifications(@QueryParam('limit') limit: number, @QueryParam('offset') offset: number, @Res() res: any, @Req() req: any): Promise<any> {
        const userObjId = new ObjectID(req.user.id);

        const filter: any = { where: { toUser: userObjId, toUserType: USER_TYPE.USER, deleted: false } };
        filter.order = {
            createdDate: -1
        };
        if (offset !== undefined && offset !== null) {
            filter.offset = offset;
        } else {
            filter.offset = 0;
        }

        if (limit !== undefined && limit !== null) {
            filter.take = limit;
        } else {
            filter.take = 5;
        }
        const userNotifications: Notification[] = await this.notificationService.find(filter);
        const notiResp = await this.parseNotificationsToResponses(userNotifications);

        if (userNotifications) {
            const successResponse = ResponseUtil.getSuccessResponse('Successfully got UserNotifications', notiResp);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Unable to get UserNotifications', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    // Delete UserNotifications API
    /**
     * @api {delete} /api/notification Delete UserNotifications API
     * @apiGroup UserNotifications
     * @apiSuccessExample {json} Success
     * HTTP/1.1 200 OK
     * {
     *      "message": "Successfully Delete UserNotifications"
     *      "data":"{}"
     *      "status": "1"
     * }
     * @apiSampleRequest /api/notification/:id
     * @apiErrorExample {json} UserNotifications error
     * HTTP/1.1 500 Internal Server Error
     */
    @Delete('/')
    @Authorized('user')
    public async deleteNotifications(@Body({ validate: true }) notificationIds: string[], @Res() res: any, @Req() req: any): Promise<any> {
        const userObjId = new ObjectID(req.user.id);

        const deletedIds = [];
        for (const notificationId of notificationIds) {
            try {
                const notiObjId = new ObjectID(notificationId);
                const userNotifications: Notification = await this.notificationService.findOne({ where: { _id: notiObjId, toUser: userObjId, toUserType: USER_TYPE.USER, deleted: false } });

                if (userNotifications) {
                    const newValue = { $set: { deleted: true } };
                    await this.notificationService.update({ _id: userNotifications.id }, newValue);

                    deletedIds.push(notificationId);
                }
            } catch (error) {
                console.log(error);
            }
        }

        if (deletedIds) {
            const successResponse = ResponseUtil.getSuccessResponse('Successfully Delete UserNotifications', deletedIds);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Unable to Get UserNotifications', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    // Find UserNotifications API
    /**
     * @api {get} /api/notification/:id Find UserNotifications API
     * @apiGroup UserNotifications
     * @apiSuccessExample {json} Success
     * HTTP/1.1 200 OK
     * {
     *      "message": "Successfully get UserNotifications"
     *      "data":"{}"
     *      "status": "1"
     * }
     * @apiSampleRequest /api/notification/:id
     * @apiErrorExample {json} UserNotifications error
     * HTTP/1.1 500 Internal Server Error
     */
    @Get('/:id')
    @Authorized('user')
    public async findUserNotification(@Param('id') notificationId: string, @Res() res: any, @Req() req: any): Promise<any> {
        const userObjId = new ObjectID(req.user.id);
        const notiObjId = new ObjectID(notificationId);

        const userNotifications: Notification = await this.notificationService.findOne({ where: { _id: notiObjId, toUser: userObjId, toUserType: USER_TYPE.USER, deleted: false } });

        if (userNotifications) {
            const notiResp = await this.createNotificationResponse(userNotifications);
            const successResponse = ResponseUtil.getSuccessResponse('Successfully got UserNotifications', notiResp);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Unable to get UserNotifications', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    // Search UserNotifications
    /**
     * @api {post} /api/notification/search Search UserNotifications API
     * @apiGroup UserNotifications
     * @apiParam (Request body) {number} limit limit
     * @apiParam (Request body) {number} offset offset
     * @apiParam (Request body) {String} select select
     * @apiParam (Request body) {String} relation relation
     * @apiParam (Request body) {String} whereConditions whereConditions
     * @apiSuccessExample {json} Success
     * HTTP/1.1 200 OK
     * {
     *    "message": "Successfully get userNotifications search",
     *    "data":{
     *    "name" : "",
     *    "description": "",
     *     }
     *    "status": "1"
     *  }
     * @apiSampleRequest /api/notification/search
     * @apiErrorExample {json} userNotifications error
     * HTTP/1.1 500 Internal Server Error
     */
    @Post('/search')
    @Authorized('user')
    public async searchUserNotifications(@Body({ validate: true }) filter: SearchFilter, @Res() res: any, @Req() req: any): Promise<any> {
        if (filter === undefined) {
            filter = new SearchFilter();
        }
        const limits = filter.limit;
        const skips = filter.offset;
        const userObjId = new ObjectID(req.user.id);
        const invites: any = await this.notificationService.aggregate(
            [
                {
                    $match: { toUser: userObjId, type: 'OBJECTIVE', mode: 'invite' },
                },
                {
                    $sort: { createdDate: -1 }
                },
                {
                    $lookup: {
                        from: 'PageObjectiveJoiner',
                        let: { joinObjectiveId: '$joinObjectiveId' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$$joinObjectiveId', '$_id']
                                    }
                                }
                            },
                            {
                                $lookup: {
                                    from: 'PageObjective',
                                    let: { objectiveId: '$objectiveId' },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $eq: ['$$objectiveId', '$_id']
                                                }
                                            }
                                        },
                                        {
                                            $lookup: {
                                                from: 'Page',
                                                let: { pageId: '$pageId' },
                                                pipeline: [
                                                    {
                                                        $match: {
                                                            $expr: {
                                                                $eq: ['$$pageId', '$_id']
                                                            }
                                                        }
                                                    }
                                                ],
                                                as: 'page'
                                            }
                                        },
                                        {
                                            $unwind: {
                                                path: '$page',
                                                preserveNullAndEmptyArrays: true
                                            }
                                        },

                                    ],
                                    as: 'pageObjective'
                                }
                            },
                            {
                                $unwind: {
                                    path: '$pageObjective',
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                        ],
                        as: 'pageObjectiveJoiner'
                    }
                },
                {
                    $unwind: {
                        path: '$pageObjectiveJoiner',
                        preserveNullAndEmptyArrays: true
                    }
                },

                {
                    $limit: limits
                },
                {
                    $skip: skips
                },
            ]
        );

        const joinNoti: any = await this.notificationService.aggregate(
            [
                {
                    $match: { toUser: userObjId, type: 'OBJECTIVE', mode: 'join' }
                },
                {
                    $sort: { createdDate: -1 }
                },
                {
                    $lookup: {
                        from: 'PageObjectiveJoiner',
                        let: { joinObjectiveId: '$joinObjectiveId' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$$joinObjectiveId', '$_id']
                                    }
                                }
                            },
                            {
                                $lookup: {
                                    from: 'PageObjective',
                                    let: { objectiveId: '$objectiveId' },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $eq: ['$$objectiveId', '$_id']
                                                }
                                            }
                                        },

                                        {
                                            $unwind: {
                                                path: '$page',
                                                preserveNullAndEmptyArrays: true
                                            }
                                        },

                                    ],
                                    as: 'pageObjective'
                                }
                            },
                            {
                                $lookup: {
                                    from: 'Page',
                                    let: { joiner: '$joiner' },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $eq: ['$$joiner', '$_id']
                                                }
                                            }
                                        }
                                    ],
                                    as: 'page'
                                }
                            },
                            {
                                $unwind: {
                                    path: '$page',
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $unwind: {
                                    path: '$pageObjective',
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                        ],
                        as: 'pageObjectiveJoiner'
                    }
                },
                {
                    $unwind: {
                        path: '$pageObjectiveJoiner',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $limit: limits
                },
                {
                    $skip: skips
                },
            ]
        );
        const pageObjectives: any = [];
        if (invites.length > 0) {
            for (const notiPage of invites) {
                // && notiPage.InviteNotification.isRead === false 
                if (notiPage !== undefined && notiPage.pageObjectiveJoiner !== undefined) {
                    const result: any = {};
                    result['id'] = notiPage._id;
                    result.title = notiPage.title;
                    result.fromUser = notiPage.fromUser;
                    result.toUser = notiPage.toUser;
                    result.isRead = notiPage.isRead;
                    result.toUserType = notiPage.toUserType;
                    result.fromUserType = notiPage.fromUserType;
                    result.link = notiPage.link;
                    result.type = notiPage.type;
                    result.deleted = notiPage.deleted;
                    result.data = notiPage.data;
                    result.mode = notiPage.mode;
                    result.createdDate = notiPage.createdDate;
                    result.objectiveId = notiPage.pageObjectiveJoiner.objectiveId;
                    result.pageId = notiPage.pageObjectiveJoiner.pageObjective.page._id;
                    result.joinerId = notiPage.pageObjectiveJoiner.joiner;
                    result.imageUrl = notiPage.pageObjectiveJoiner.pageObjective.page.s3ImageURL ? notiPage.pageObjectiveJoiner.pageObjective.page.s3ImageURL : notiPage.pageObjectiveJoiner.pageObjective.page.imageURL;
                    result.join = notiPage.pageObjectiveJoiner.join;
                    result.approve = notiPage.pageObjectiveJoiner.approve;
                    pageObjectives.push(result);
                } else {
                    continue;
                }
            }
        }
        if (joinNoti.length > 0) {
            for (const notiPage of joinNoti) {
                //  
                if (notiPage !== undefined && notiPage.pageObjectiveJoiner !== undefined) {
                    const result: any = {};
                    result['id'] = notiPage._id;
                    result.title = notiPage.title;
                    result.fromUser = notiPage.fromUser;
                    result.toUser = notiPage.toUser;
                    result.isRead = notiPage.isRead;
                    result.toUserType = notiPage.toUserType;
                    result.fromUserType = notiPage.fromUserType;
                    result.link = notiPage.link;
                    result.type = notiPage.type;
                    result.deleted = notiPage.deleted;
                    result.data = notiPage.data;
                    result.mode = notiPage.mode;
                    result.createdDate = notiPage.createdDate;
                    result.objectiveId = notiPage.pageObjectiveJoiner.objectiveId;
                    result.pageId = notiPage.pageObjectiveJoiner.pageId;
                    result.joinerId = notiPage.pageObjectiveJoiner.joiner;
                    result.imageUrl = notiPage.pageObjectiveJoiner.page.s3ImageURL ? notiPage.pageObjectiveJoiner.page.s3ImageURL : notiPage.pageObjectiveJoiner.page.imageURL;
                    result.join = notiPage.pageObjectiveJoiner.join;
                    result.approve = notiPage.pageObjectiveJoiner.approve;
                    pageObjectives.push(result);
                } else {
                    continue;
                }
            }
        }
        const stackIds: any = [];
        if (pageObjectives.length > 0) {
            for (let i = 0; i < pageObjectives.length; i++) {
                stackIds.push(pageObjectives[i].id);
            }
        }
        if (filter.whereConditions !== null && filter.whereConditions !== undefined) {
            if (typeof filter.whereConditions === 'object') {
                filter.whereConditions.toUser = userObjId;
                filter.whereConditions.deleted = false;
            } else if (Array.isArray(filter.whereConditions)) {
                for (const fCon of filter.whereConditions) {
                    if (typeof fCon.whereConditions === 'object') {
                        fCon.whereConditions.toUser = userObjId;
                        fCon.whereConditions.deleted = false;
                    }
                }
            }
        } else {
            filter.whereConditions = { toUser: userObjId, toUserType: USER_TYPE.USER };
        }

        /*        
        "$and": [
            {"mode": {"$ne": "invite"}},
            {"mode": {"$ne": "join"}}
        ]     */

        const notifications: any = await this.notificationService.aggregate([
            {
                $match: {
                    $and: [
                        { mode: { $ne: 'invite' } },
                        { mode: { $ne: 'join' } },
                    ],
                    toUser: filter.whereConditions.toUser,
                    deleted: filter.whereConditions.deleted
                }
            },
            {
                $sort: { createdDate: filter.orderBy.createdDate }
            },
            {
                $limit: filter.limit
            },
            {
                $skip: filter.offset
            }
        ]);
        const notiResp = await this.parseNotificationsToResponses(notifications);
        // const query = { toUser: userObjId, _id: { $nin: stackIds } };
        // const newValues = { $set: { isRead: true } };
        // const updateReadNoti = await this.notificationService.updateMany(query, newValues);
        if (notifications) {
            const successResponse = ResponseUtil.getSuccessResponse('Successfully search UserNotifications', notiResp, notiResp.length, pageObjectives);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot search UserNotifications', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    // Delete UserNotifications API
    /**
     * @api {delete} /api/notification/:id Delete UserNotifications API
     * @apiGroup UserNotifications
     * @apiSuccessExample {json} Success
     * HTTP/1.1 200 OK
     * {
     *      "message": "Successfully Delete UserNotifications"
     *      "data":"{}"
     *      "status": "1"
     * }
     * @apiSampleRequest /api/notification/:id
     * @apiErrorExample {json} UserNotifications error
     * HTTP/1.1 500 Internal Server Error
     */
    @Delete('/:id')
    @Authorized('user')
    public async deleteUserNotification(@Param('id') notificationId: string, @Res() res: any, @Req() req: any): Promise<any> {
        const userObjId = new ObjectID(req.user.id);
        const notiObjId = new ObjectID(notificationId);

        const userNotifications: Notification = await this.notificationService.findOne({ where: { _id: notiObjId, toUser: userObjId, toUserType: USER_TYPE.USER, deleted: false } });

        if (userNotifications) {
            const newValue = { $set: { deleted: true } };
            await this.notificationService.update({ _id: userNotifications.id }, newValue);

            const successResponse = ResponseUtil.getSuccessResponse('Successfully Delete UserNotifications', notiObjId);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Unable to Get UserNotifications', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    // Clear All UserNotifications
    /**
     * @api {post} /api/notification/clear Clear All Notifications API
     * @apiGroup UserNotifications
     * @apiSuccessExample {json} Success
     * HTTP/1.1 200 OK
     * {
     *    "message": "Successfully Clear All Notifications",
     *    "data":{
     *    "name" : "",
     *    "description": "",
     *     }
     *    "status": "1"
     *  }
     * @apiSampleRequest /api/notification/clear
     * @apiErrorExample {json} userNotifications error
     * HTTP/1.1 500 Internal Server Error
     */
    @Post('/clear')
    @Authorized('user')
    public async clearAllUserNotifications(@Res() res: any, @Req() req: any): Promise<any> {
        const userObjId = new ObjectID(req.user.id);

        const userNotifications: Notification[] = await this.notificationService.find({ where: { toUser: userObjId, toUserType: USER_TYPE.USER, deleted: false } });

        if (userNotifications) {
            const resultId = [];
            for (const unReadNoti of userNotifications) {
                const newValue = { $set: { isRead: true } };
                await this.notificationService.update({ _id: unReadNoti.id }, newValue);

                resultId.push(unReadNoti.id);
            }

            const successResponse = ResponseUtil.getSuccessResponse('Successfully Delete UserNotifications', resultId);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Unable to Get UserNotifications', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    // Mark Read UserNotifications API
    /**
     * @api {post} /api/notification/:id/read Mark Read UserNotifications API
     * @apiGroup UserNotifications
     * @apiSuccessExample {json} Success
     * HTTP/1.1 200 OK
     * {
     *      "message": "Successfully Delete UserNotifications"
     *      "data":"{}"
     *      "status": "1"
     * }
     * @apiSampleRequest /api/notification/:id/read
     * @apiErrorExample {json} UserNotifications error
     * HTTP/1.1 500 Internal Server Error
     */
    @Post('/:id/read')
    @Authorized('user')
    public async markReadUserNotification(@Param('id') notificationId: string, @Res() res: any, @Req() req: any): Promise<any> {
        const userObjId = new ObjectID(req.user.id);
        const notiObjId = new ObjectID(notificationId);

        const userNotifications: Notification = await this.notificationService.findOne({ where: { _id: notiObjId, toUser: userObjId } });

        if (userNotifications) {
            userNotifications.isRead = true;
            const newValue = { $set: { isRead: true } };
            await this.notificationService.update({ _id: userNotifications.id }, newValue);

            const notiResp = await this.createNotificationResponse(userNotifications);
            const successResponse = ResponseUtil.getSuccessResponse('Successfully Mark Read UserNotifications', notiResp);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Unable to Get read UserNotifications', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    private async parseNotificationsToResponses(notifications: Notification[]): Promise<NotificationResponse[]> {
        if (notifications === undefined || notifications === null) {
            return [];
        }

        const result: NotificationResponse[] = [];
        for (const noti of notifications) {
            const notoResp = await this.createNotificationResponse(noti);
            result.push(notoResp);
        }

        return result;
    }

    private async createNotificationResponse(notification: Notification): Promise<NotificationResponse> {
        if (notification === undefined || notification === null) {
            return undefined;
        }

        const response: NotificationResponse = new NotificationResponse();
        response.notification = notification;
        if (notification.fromUser && notification.fromUserType) {
            if (notification.fromUserType === USER_TYPE.USER) {
                const fromUser = await this.userService.findOne({ where: { _id: new ObjectID(notification.fromUser) } });

                if (fromUser) {
                    response.sender = {
                        id: fromUser.id,
                        displayName: fromUser.displayName,
                        uniqueId: fromUser.uniqueId,
                        type: USER_TYPE.USER,
                        imageURL: fromUser.imageURL
                    };
                }
            } else if (notification.fromUserType === USER_TYPE.PAGE) {
                const fromUser = await this.pageService.findOne({ where: { _id: new ObjectID(notification.fromUser) } });

                if (fromUser) {
                    response.sender = {
                        id: fromUser.id,
                        displayName: fromUser.name,
                        uniqueId: fromUser.pageUsername,
                        type: USER_TYPE.PAGE,
                        imageURL: fromUser.imageURL
                    };
                }
            }
        }

        return response;
    }

} 
