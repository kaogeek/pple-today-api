/*
 * @license Spanboon Platform v0.1
 * (c) 2020-2021 KaoGeek. http://kaogeek.dev
 * License: MIT. https://opensource.org/licenses/MIT
 * Author:  shiorin <junsuda.s@absolute.co.th>, chalucks <chaluck.s@absolute.co.th>
 */

import 'reflect-metadata';
import { JsonController, Res, Req, Post, Body, Patch, Authorized, Param } from 'routing-controllers';
import { ObjectID } from 'mongodb';
import { UserEngagementService } from '../services/UserEngagementService';
import { UserEngagementUpdateRequest } from './requests/UserEngagementUpdateRequest';
import { UserEngagementRequest } from './requests/UserEngagementRequest';
import { UserEngagement } from '../models/UserEngagement';
import { ResponseUtil } from '../../utils/ResponseUtil';
import {
    TODAY_NEWS_POINT,
    LINE_NEWS_WEEK_OA,
} from '../../constants/SystemConfig';
import { Engage_action } from '../../constants/UserEngagementAction';
import { ConfigService } from '../services/ConfigService';

@JsonController('/engagement')
export class UserEngagementController {
    constructor(
        private userEngagementService: UserEngagementService,
        private configService: ConfigService
    ) { }

    @Patch('/:id')
    @Authorized('user')
    public async updateEngagement(@Param('id') id: string, @Body({ validate: true }) userEngagementUpdateRequest: UserEngagementUpdateRequest, @Res() res: any, @Req() req: any): Promise<any> {
        const query = {_id: new ObjectID(id)};
        const newValues = { $set: { commentId: userEngagementUpdateRequest.commentId, likeId: userEngagementUpdateRequest.likeId}};
        const update:any = await this.userEngagementService.update(query, newValues);
        if(update) {
            const errorResponse = ResponseUtil.getSuccessResponse('Update Engagement success.', undefined);
            return res.status(200).send(errorResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Update Engagement Failed.', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    // Create UserEngagement API
    /**
     * @api {post} /api/engagement Create UserEngagement API
     * @apiGroup UserEngagement
     * @apiParam (Request body) {String} contentId contentId
     * @apiParam (Request body) {String} contentType contentType
     * @apiParam (Request body) {String} action action
     * @apiParam (Request body) {String} reference reference 
     * @apiSuccessExample {json} Success
     * HTTP/1.1 200 OK
     * {
     *      "message": "Create UserEngagement"
     *      "data":"{}"
     *      "status": "1"
     * }
     * @apiSampleRequest /api/engagement
     * @apiErrorExample {json} UserEngagement error
     * HTTP/1.1 500 Internal Server Error
     */
    @Post('/')
    public async createEngagement(@Body({ validate: true }) userEngagementBody: UserEngagementRequest, @Res() res: any, @Req() req: any): Promise<any> {
        const idx:number = Engage_action.indexOf(userEngagementBody.action);
        if(idx === -1) {
            const errorResponse = ResponseUtil.getErrorResponse('Type is not correct.', undefined);
            return res.status(400).send(errorResponse);
        } 

        let score = 2;

        if (Engage_action[idx] === 'LINE_NOTI') {
            const todayNews = await this.configService.getConfig(TODAY_NEWS_POINT);
            if (todayNews) {
                score = parseInt(todayNews.value, 10);
            }
        } else if(Engage_action[idx] === 'PPLE_NEWS'){
            const linkAnnounceMent = await this.configService.getConfig(LINE_NEWS_WEEK_OA);
            if (linkAnnounceMent) {
                score = parseInt(linkAnnounceMent.value, 10);
            }
        } else {
            score = score * 2;
        }

        const userId =  req.headers.userid;
        const clientId = req.headers['client-id']; 
        const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).split(',')[0]; 
        const user = await this.userEngagementService.findOne({ where: { contentId:  userEngagementBody.contentId, contentType: userEngagementBody.contentType, action: userEngagementBody.action} });
        let userEngagementAction: UserEngagement;
        const userEngagement = new UserEngagement();
        userEngagement.clientId = clientId;
        userEngagement.ip = ipAddress; 
        userEngagement.device = userEngagementBody.device.toLowerCase().trim();
        userEngagement.userId = userId ? new ObjectID(req.headers.userid) : '';
        userEngagement.contentId = userEngagementBody.contentId;
        userEngagement.contentType = userEngagementBody.contentType;
        userEngagement.action = userEngagementBody.action.toLocaleUpperCase().trim();
        userEngagement.reference = userEngagementBody.reference;
        userEngagement.point = score;
        userEngagement.postId = userEngagementBody.postId === '' ? '' : new ObjectID(userEngagementBody.postId);
        userEngagement.voteId = userEngagementBody.voteId === '' ? '' : new ObjectID(userEngagementBody.voteId);
        userEngagement.isReadId = userEngagementBody.isReadId === '' ? '' : new ObjectID(userEngagementBody.isReadId);
       
        if(user){ 
            userEngagement.isFirst = false;
        } else { 
            userEngagement.isFirst = true; 
        } 

        userEngagementAction = await this.userEngagementService.create(userEngagement); 
 
        if (userEngagementAction) {
            const successResponse = ResponseUtil.getSuccessResponse('Create Engagement Success', userEngagementAction);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Create Engagement Failed', undefined);
            return res.status(400).send(errorResponse);
        } 
    }

} 
