import { JsonController, Res, Param, Post, Body, Req, Authorized, Put, Delete, Get } from 'routing-controllers';
import { VotingEventRequest } from '../requests/VotingEventRequest';
import { VotingEventService } from '../../services/VotingEventService';
import { VoteItemService } from '../../services/VoteItemService';
import { VoteChoiceService } from '../../services/VoteChoiceService';
import { VotedService } from '../../services/VotedService';
import { AssetService } from '../../services/AssetService';
import { UserSupportService } from '../../services/UserSupportService';
import { UserService } from '../../services/UserService';
// import { VotingEventModel } from '../../models/VotingEventModel';
import { ResponseUtil } from '../../../utils/ResponseUtil';
import { ObjectID } from 'mongodb';
// import moment from 'moment';
import { SearchFilter } from '../requests/SearchFilterRequest';
import { FindVoteRequest } from '../requests/FindVoteRequest';
import { ObjectUtil } from '../../../utils/ObjectUtil';
import { MFPHASHTAG } from '../../../constants/SystemConfig';
import { ConfigService } from '../../services/ConfigService';
import moment from 'moment';
import { NotiTypeAction } from '../../../constants/WorkerThread';
import { UserEngagement } from '../../models/UserEngagement';
// import { randomNotiEngageAction } from '../../../utils/RandomUtils';
import { PostsService } from '../../services/PostsService';
import { UserEngagementService } from '../../services/UserEngagementService';
import { LineNewMovePartyService } from '../../services/LineNewMovePartyService';
import { LineNewsWeekService } from '../../services/LineNewsWeekService';
import { WorkerThreadService } from '../../services/WokerThreadService';
import { 
    randomUser, 
    randomComment, 
    randomLike, 
    randomIsRead,
    randomVoteOneChoice,
    randomVoteMultiChoice,
    randomVoteTextChoice,
} from '../../../utils/RandomUtils';
import { IsReadPostService } from '../../services/IsReadPostService';
@JsonController('/admin/voted')
export class AdminVotedController {
    constructor(
        private votingEventService: VotingEventService,
        private voteItemService:VoteItemService,
        private voteChoiceService:VoteChoiceService,
        private votedService:VotedService,
        private userSupportService:UserSupportService,
        private userService:UserService,
        private assetService:AssetService,
        private configService:ConfigService,
        private postsService:PostsService,
        private userEngagementService:UserEngagementService,
        private isReadPostService:IsReadPostService,
        private lineNewMovePartyService:LineNewMovePartyService,
        private lineNewsWeekService:LineNewsWeekService,
        private workerThreadService:WorkerThreadService
    ) { }

    @Post('/all/search/')
    @Authorized('')
    public async searchVoteEvents(@Body({ validate: true }) search: FindVoteRequest,@Res() res: any, @Req() req: any): Promise<any> {
        if (ObjectUtil.isObjectEmpty(search)) {
            return res.status(200).send([]);
        }

        let filter: any = search.filter;
        if (filter === undefined) {
            filter = new SearchFilter();
        }
        // const take = filter.limit ? filter.limit: 10;
        // const offset = filter.offset ? filter.offset: 0;
        const voteEventAggr = await this.votingEventService.aggregate(
            [
                {
                    $sort:{
                        createdDate:-1
                    }
                }
            ]
        );
        if (voteEventAggr.length > 0) {
            const successResponse = ResponseUtil.getSuccessResponse('Search lists vote is succesful.', voteEventAggr);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot find any lists vote.', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    @Post('/search')
    @Authorized('')
    public async searchVoteEvent(@Body({ validate: true }) search: FindVoteRequest,@Res() res: any, @Req() req: any): Promise<any> {
        const keywords = search.keyword;
        const exp = { $regex: '.*' + keywords + '.*', $options: 'si' };
        if (ObjectUtil.isObjectEmpty(search)) {
            return res.status(200).send([]);
        }

        let filter: any = search.filter;
        if (filter === undefined) {
            filter = new SearchFilter();
        }
        const take = filter.limit ? filter.limit: 10;
        const offset = filter.offset ? filter.offset: 0;
        const voteEventAggr = await this.votingEventService.aggregate(
            [
                {
                    $match:{
                        title:exp
                    }
                },
                {
                    $sort:{
                        createdDate:-1
                    }
                },
                {
                    $limit: take
                },
                {
                    $skip: offset
                }
            ]
        );
        if (voteEventAggr.length > 0) {
            const successResponse = ResponseUtil.getSuccessResponse('Search lists vote is succesful.', voteEventAggr);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot find any lists vote.', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    @Post('/:id')
    @Authorized('')
    public async approvedVoteEvent(@Body({ validate: true }) votingEventRequest: VotingEventRequest, @Param('id') id: string,@Res() res: any, @Req() req: any): Promise<any> {
        const userObjId = new ObjectID(req.user.id);
        const voteObjId = new ObjectID(id);
        const today = moment().toDate();
        let newValues:any = {};
        // check exist?
        const user = await this.userService.findOne({_id:userObjId});

        const voteObj = await this.votingEventService.findOne({_id:voteObjId});
        if(voteObj === undefined && voteObj === null){
            const errorResponse = ResponseUtil.getErrorResponse('Cannot find a vote.', undefined);
            return res.status(400).send(errorResponse);
        }

        const voteApproved = votingEventRequest.approved;
        let votePin = votingEventRequest.pin;
        let voteShowed = votingEventRequest.showVoteResult;

        if (votePin === null || votePin === undefined) {
            votePin = voteObj.pin;
        }
        if (voteShowed === null || voteShowed === undefined) {
            voteShowed = voteObj.showVoteResult;

        }

        if(voteObj === true && voteApproved === false){
            const errorResponse = ResponseUtil.getErrorResponse('Approve vote should be true.', undefined);
            return res.status(400).send(errorResponse);
        }

        if(votingEventRequest.closed === true) {
            const errorResponse = ResponseUtil.getErrorResponse('Close status shoule be false.', undefined);
            return res.status(400).send(errorResponse);
        }

        if(votingEventRequest.voteDaysRange !== undefined && typeof(votingEventRequest.voteDaysRange) !== 'number') {
            const errorResponse = ResponseUtil.getErrorResponse('Voting Days range is not a number.', undefined);
            return res.status(400).send(errorResponse);
        }

        const query = {_id:voteObjId};
        // approved.
        newValues = {
            $set:{
                closed:votingEventRequest.closed ? votingEventRequest.closed : voteObj.closed,
                closeDate:null,
                approved:voteApproved,
                approveUsername:user.displayName,
                approveDatetime:today,
                pin:false,
                status: votingEventRequest.status ? votingEventRequest.status : voteObj.status,
                hide: true,

                startVoteDatetime: today,
                endVoteDatetime:   new Date(today.getTime() + ( (24 * voteObj.voteDaysRange) * 60 * 60 * 1000)), 

                showVoterName: votingEventRequest.showVoterName ? votingEventRequest.showVoterName : voteObj.showVoterName,
                showVoteResult: votingEventRequest.showVoteResult ? votingEventRequest.showVoteResult : voteObj.showVoteResult,
            }
        };

        const update = await this.votingEventService.update(query,newValues);
        if(update){
            const successResponse = ResponseUtil.getSuccessResponse('Update vote event is success.', undefined);
            return res.status(200).send(successResponse);
        }else{
            const errorResponse = ResponseUtil.getErrorResponse('Cannot update a VoteEvent.', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    @Post('/hide/:id')
    @Authorized('')
    public async EditHide(@Body({ validate: true }) votingEventRequest: VotingEventRequest, @Param('id') id: string,@Res() res: any, @Req() req: any): Promise<any> {
        const userObjId = new ObjectID(req.user.id);
        const voteObjId = new ObjectID(id);
        const today = moment().toDate();
        let newValues:any = {};
        // check exist?
        const user = await this.userService.findOne({_id:userObjId});

        const voteObj = await this.votingEventService.findOne({_id:voteObjId});
        if(voteObj === undefined && voteObj === null){
            const errorResponse = ResponseUtil.getErrorResponse('Cannot find a vote.', undefined);
            return res.status(400).send(errorResponse);
        }

        const query = {_id:voteObjId};
        // approved.
        newValues = {
            $set:{
                approveUsername:user.displayName,
                approveDatetime:today,
                hide: votingEventRequest.hide,
            }
        };

        const update = await this.votingEventService.update(query,newValues);
        if(update){
            const successResponse = ResponseUtil.getSuccessResponse('Update vote event is success.', undefined);
            return res.status(200).send(successResponse);
        }else{
            const errorResponse = ResponseUtil.getErrorResponse('Cannot update a VoteEvent.', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    @Put('/:id')
    @Authorized('')
    public async updateVoteEvent(@Body({ validate: true }) votingEventRequest: VotingEventRequest, @Param('id') id: string,@Res() res: any, @Req() req: any): Promise<any> {
        const userObjId = new ObjectID(req.user.id);
        const voteObjId = new ObjectID(id);
        const today = moment().toDate();
        let newValues:any = {};
        // check exist?
        const user = await this.userService.findOne({_id:userObjId});

        const voteObj = await this.votingEventService.findOne({_id:voteObjId});
        if(voteObj === undefined){
            const errorResponse = ResponseUtil.getErrorResponse('Cannot find a vote.', undefined);
            return res.status(400).send(errorResponse);
        }

        let voteApproved = votingEventRequest.approved;
        let votePin = votingEventRequest.pin;
        let voteShowed = votingEventRequest.showVoteResult;

        if (voteApproved === null || voteApproved === undefined) {
            voteApproved = voteObj.approved;
        }

        if (votePin === null || votePin === undefined) {
            votePin = voteObj.pin;
        }
        if (voteShowed === null || voteShowed === undefined) {
            voteShowed = voteObj.showVoteResult;
        }
        
        let startVoteDate = new Date(votingEventRequest.startVoteDatetime);
        if(startVoteDate === null) {
            startVoteDate = null;
        }
        let endVoteDate = new Date(votingEventRequest.endVoteDatetime);
        if(endVoteDate === null) {
            endVoteDate = null;
        }

        const query = {_id:voteObjId};
        // approved.
        newValues = {
            $set:{
                title: votingEventRequest.title,
                detail: votingEventRequest.detail,
                closed: votingEventRequest.closed,
                closeDate:null,
                approved:voteApproved,
                approveUsername:user.displayName,
                approveDatetime:today,
                pin:votingEventRequest.pin,
                status:voteObj.status,

                startSupportDatetime: new Date(votingEventRequest.startSupportDatetime),
                endSupportDatetime: new Date(votingEventRequest.endSupportDatetime),

                startVoteDatetime: startVoteDate,
                endVoteDatetime:   endVoteDate, 
                hashTag: votingEventRequest.hashTag,
                
                showVoterName: votingEventRequest.showVoterName,
                showVoteResult: votingEventRequest.showVoteResult,
                hide: votingEventRequest.hide,
            }
        };

        if(votingEventRequest.closed === true) {
            newValues = {
                $set:{
                    title: votingEventRequest.title,
                    detail: votingEventRequest.detail,
                    closed: true,
                    closeDate:null,
                    approved:voteApproved,
                    approveUsername:user.displayName,
                    approveDatetime:today,
                    pin:votingEventRequest.pin,
                    status:'close',
    
                    startSupportDatetime: new Date(votingEventRequest.startSupportDatetime),
                    endSupportDatetime: new Date(votingEventRequest.endSupportDatetime),
    
                    startVoteDatetime: startVoteDate,
                    endVoteDatetime:   endVoteDate, 
                    hashTag: votingEventRequest.hashTag,
                    hide: votingEventRequest.hide,

                    showVoterName: votingEventRequest.showVoterName,
                    showVoteResult: votingEventRequest.showVoteResult,
                }
            };
        }

        if(votingEventRequest.closed === false) {
            if(voteObj.startVoteDatetime === null && voteObj.endVoteDatetime === null) {
                newValues = {
                    $set:{
                        title: votingEventRequest.title,
                        detail: votingEventRequest.detail,
                        closed: false,
                        closeDate:null,
                        approved:voteApproved,
                        approveUsername:user.displayName,
                        approveDatetime:today,
                        pin:votingEventRequest.pin,
                        status:'support',
        
                        startSupportDatetime: new Date(votingEventRequest.startSupportDatetime),
                        endSupportDatetime: new Date(votingEventRequest.endSupportDatetime),
        
                        startVoteDatetime: startVoteDate,
                        endVoteDatetime:   endVoteDate, 
                        hashTag: votingEventRequest.hashTag,
                        hide: votingEventRequest.hide,

                        showVoterName: votingEventRequest.showVoterName,
                        showVoteResult: votingEventRequest.showVoteResult,
                    }
                };
            } else {
                newValues = {
                    $set:{
                        title: votingEventRequest.title,
                        detail: votingEventRequest.detail,
                        closed: false,
                        closeDate:null,
                        approved:voteApproved,
                        approveUsername:user.displayName,
                        approveDatetime:today,
                        pin:votingEventRequest.pin,
                        status:'vote',
        
                        startSupportDatetime: new Date(votingEventRequest.startSupportDatetime),
                        endSupportDatetime: new Date(votingEventRequest.endSupportDatetime),
                        hide: votingEventRequest.hide,

                        startVoteDatetime: startVoteDate,
                        endVoteDatetime:   endVoteDate, 
                        hashTag: votingEventRequest.hashTag,

                        showVoterName: votingEventRequest.showVoterName,
                        showVoteResult: votingEventRequest.showVoteResult,
                    }
                };
            }
        }

        const update = await this.votingEventService.update(query,newValues);
        if(update){
            const successResponse = ResponseUtil.getSuccessResponse('Update vote event is success.', undefined);
            return res.status(200).send(successResponse);
        }else{
            const errorResponse = ResponseUtil.getErrorResponse('Cannot update a VoteEvent.', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    @Delete('/:id')
    @Authorized('')
    public async deleteVoteEvent(@Param('id') id: string,@Res() res: any, @Req() req: any): Promise<any> {
        const voteObjId = new ObjectID(id);
        // check exist?

        const voteObj = await this.votingEventService.findOne({_id:voteObjId});
        if(voteObj === undefined && voteObj === null){
            const errorResponse = ResponseUtil.getErrorResponse('Cannot find a vote.', undefined);
            return res.status(400).send(errorResponse);
        }
        const voteItemObj = await this.voteItemService.findOne({votingId:voteObj.id});
        const voteItems = await this.voteItemService.find({votingId:voteObj.id});
        if(voteItems.length>0){
            for(const voteItem of voteItems){
                if(voteItem.assetId !== undefined) {
                    await this.assetService.delete({_id:voteItem.assetId});
                }
                const voteChoiceList = await this.voteChoiceService.findOne({voteItemId:voteItem.id});
                if(
                   voteChoiceList !== undefined && 
                   voteChoiceList.assetId !== undefined
                ) {
                    await this.assetService.delete({_id:voteChoiceList.assetId});
                }
            }
        }

        const deleteVoteEvent = await this.votingEventService.delete({_id:voteObjId});
        if(voteItemObj !== undefined && voteItemObj !== null){
            await this.assetService.delete({_id:voteItemObj.assetId});
        }
        const deleteVoteItem = await this.voteItemService.deleteMany({votingId:voteObj.id});
        if(voteItemObj !== undefined && voteItemObj !== null){
            await this.voteChoiceService.deleteMany({voteItemId:voteItemObj.id});
        }
        const deleteVoted = await this.votedService.deleteMany({votingId:voteObj.id});
        const deleteUserSupport = await this.userSupportService.deleteMany({votingId:voteObj.id});

        if(
            deleteVoteEvent && 
            deleteVoteItem && 
            deleteVoted && 
            deleteUserSupport
            )
        {

            const successResponse = ResponseUtil.getSuccessResponse('delete vote event is success.', undefined);
            return res.status(200).send(successResponse);
        }else{
            const errorResponse = ResponseUtil.getErrorResponse('Cannot delete a VoteEvent.', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    // reject
    @Post('/reject/:id')
    @Authorized('')
    public async RejectVoted(@Body({ validate: true }) votingEventRequest: VotingEventRequest, @Param('id') id: string,@Res() res: any, @Req() req: any): Promise<any> {
        const voteObjId = new ObjectID(id);
        const today = moment().toDate();
        // check exist?

        const voteObj = await this.votingEventService.findOne({_id:voteObjId});
        if(voteObj === undefined && voteObj === null){
            const errorResponse = ResponseUtil.getErrorResponse('Cannot find a vote.', undefined);
            return res.status(400).send(errorResponse);
        }
        let voteApproved = votingEventRequest.approved;
        let votePin = votingEventRequest.pin;
        let voteShowed = votingEventRequest.showVoteResult;

        if (voteApproved === null || voteApproved === undefined) {
            voteApproved = voteObj.approved;
        }

        if (votePin === null || votePin === undefined) {
            votePin = voteObj.pin;
        }
        if (voteShowed === null || voteShowed === undefined) {
            voteShowed = voteObj.showVoteResult;
        }

        if(votingEventRequest.closed === false){
            const errorResponse = ResponseUtil.getErrorResponse('Close vote should be true.', undefined);
            return res.status(400).send(errorResponse);
        }

        if(voteApproved === true){
            const errorResponse = ResponseUtil.getErrorResponse('Approve vote should be false', undefined);
            return res.status(400).send(errorResponse);
        }

        if(votingEventRequest.status !== 'close'){
            const errorResponse = ResponseUtil.getErrorResponse('Reject vote Status should be closed.', undefined);
            return res.status(400).send(errorResponse);
        }

        if(votePin !== false){
            const errorResponse = ResponseUtil.getErrorResponse('Pin should be false.', undefined);
            return res.status(400).send(errorResponse);
        }

        const query = {_id:voteObjId};
        const newValues = {
            $set:{
                closed:votingEventRequest.closed,
                closeDate: today,
                approved:false,              
                approveUsername:null,
                approveDatetime:null,
                pin:false,
                status:votingEventRequest.status
            }};

        const update = await this.votingEventService.update(query,newValues);
        if(update){
                const successResponse = ResponseUtil.getSuccessResponse('Reject VoteEvent is Successful.', undefined);
                return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Error Cannot Reject a VoteEvent.', undefined);
            return res.status(400).send(errorResponse);
        }
    }
    // unreject
    @Post('/cancel/:id')
    @Authorized('')
    public async CancelVote(@Body({ validate: true }) votingEventRequest: VotingEventRequest, @Param('id') id: string,@Res() res: any, @Req() req: any): Promise<any> {
        const voteObjId = new ObjectID(id);
        // const today = moment().toDate();
        // check exist?

        const voteObj = await this.votingEventService.findOne({_id:voteObjId});
        if(voteObj === undefined && voteObj === null){
            const errorResponse = ResponseUtil.getErrorResponse('Cannot find a vote.', undefined);
            return res.status(400).send(errorResponse);
        }
        let voteApproved = votingEventRequest.approved;
        let votePin = votingEventRequest.pin;
        let voteShowed = votingEventRequest.showVoteResult;

        if (voteApproved === null || voteApproved === undefined) {
            voteApproved = voteObj.approved;
        }

        if (votePin === null || votePin === undefined) {
            votePin = voteObj.pin;
        }
        if (voteShowed === null || voteShowed === undefined) {
            voteShowed = voteObj.showVoteResult;
        }

        if(votingEventRequest.closed === true){
            const errorResponse = ResponseUtil.getErrorResponse('Close vote should be false.', undefined);
            return res.status(400).send(errorResponse);
        }

        if(voteApproved === true){
            const errorResponse = ResponseUtil.getErrorResponse('Approve vote should be false', undefined);
            return res.status(400).send(errorResponse);
        }

        if(votingEventRequest.status !== 'support'){
            const errorResponse = ResponseUtil.getErrorResponse('Reject vote Status should be closed.', undefined);
            return res.status(400).send(errorResponse);
        }

        if(votePin !== false){
            const errorResponse = ResponseUtil.getErrorResponse('Pin should be false.', undefined);
            return res.status(400).send(errorResponse);
        }
        const query = {_id:voteObjId};
        const newValues = {
            $set:{
                closed:votingEventRequest.closed,
                closeDate: null,
                approved:voteApproved,              
                approveUsername:null,
                approveDatetime:null,
                pin:votePin,
                status:votingEventRequest.status
            }};

        const update = await this.votingEventService.update(query,newValues);
        if(update){
                const successResponse = ResponseUtil.getSuccessResponse('Reject VoteEvent is Successful.', undefined);
                return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Error Cannot Reject a VoteEvent.', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    // auto approve
    @Post('/auto/approve')
    @Authorized('')
    public async AutoApprove(@Res() res: any, @Req() req: any): Promise<any> {
        const userObjId = new ObjectID(req.user.id);
        const user = await this.userService.findOne({_id:userObjId});
        const today = moment().toDate();

        // ถ้าเป็น auto approve hide = false 

        const voteAggs = await this.votingEventService.aggregate(
            [
                {
                    $match:{
                        approved:false,
                        status:'support'
                    }
                }
            ]
        );
        
        if(voteAggs.length > 0){
            for(const vote of voteAggs){
                if(vote.approved !== true && vote.countSupport >= vote.minSupport){
                    // auto approve
                    const query = {_id: new ObjectID(vote._id)};
                    const newValues = {
                        $set:{
                            closed:false,
                            closeDate: null,
                            approved:true,
                            approveUsername:user.displayName,
                            approveDatetime:today,
                            startVoteDatetime:today,
                            endVoteDatetime: new Date(today.getTime() + ( (24 * vote.voteDaysRange) * 60 * 60 * 1000)), // voteDaysRange;
                            pin:false,
                            status: 'vote'
                        }};  
                    await this.votingEventService.update(query,newValues);              
                } else {
                    continue;
                }
            }
        }
        const successResponse = ResponseUtil.getSuccessResponse('Auto approve.', undefined);
        return res.status(200).send(successResponse);
    }

    // auto close
    @Post('/auto/close')
    @Authorized('')
    public async AutoClose(@Res() res: any, @Req() req: any): Promise<any> {
        const userObjId = new ObjectID(req.user.id);
        const user = await this.userService.findOne({_id:userObjId});
        const today = moment().toDate();

        const voteAggs = await this.votingEventService.aggregate([]);
        if(voteAggs.length > 0){
            for(const vote of voteAggs){
                if(
                    vote.status !== 'support' &&
                    vote.closed !== true && 
                    vote.endVoteDatetime !== null &&
                    today.getTime() > vote.endVoteDatetime.getTime()
                ) {
                    const query = {_id: new ObjectID(vote._id)};
                    const newValues = {
                        $set:{
                            closed:true,
                            closeDate: today,
                            approved:true,
                            approveUsername:user.displayName,
                            approveDatetime:today,
                            status: 'close'
                        }};  
                    await this.votingEventService.update(query,newValues);   
                } else {
                    continue;
                }
            }
        }
        const successResponse = ResponseUtil.getSuccessResponse('Auto Closed.', undefined);
        return res.status(200).send(successResponse);
    }

    @Get('/random')
    @Authorized('')
    public async getRandomEngagement(@Res() res: any, @Req() req: any): Promise<any> {
        // wT = worker thread
        // pple_news
        const wTPpleNews:any = await this.workerThreadService.aggregate([{$match:{active:false, type: NotiTypeAction['pple_news_noti']}}, {$sample:{size:1}}]);
        // line_noti
        const postIdsLineNoti:ObjectID[] = [];
        const wTLineNoti:any = await this.workerThreadService.aggregate([{$match:{active:false, type: NotiTypeAction['line_noti']}}, {$sample:{size:1}}]);
        if(wTLineNoti.length > 0) {
            for(const item of wTLineNoti[0].postIds) {
                postIdsLineNoti.push(new ObjectID(item));
            }
        }
        // vote_noti
        const wTVoteNoti:any = await this.workerThreadService.aggregate([{$match:{active:false, type: NotiTypeAction['vote_event_noti']}}, {$sample:{size:1}}]);

        const postIds:any = await this.postsService.aggregate([{$match:{_id: {$in: postIdsLineNoti}}},{$sample:  {size:1}}, {$project: {_id:1}}]);
        const lineNewsWeek:any = await this.lineNewsWeekService.findOne({active: true});
        const lineNewMp:any = await this.lineNewMovePartyService.findOne({lineNewsWeekId: lineNewsWeek.id});
        const arrPostObjId:any = [];
        if(lineNewMp.objIds.length > 0) {
            for(const item of lineNewMp.objIds) {
                arrPostObjId.push(new ObjectID(item));
            }
        }
        if(postIds.length === 0) {
            const errorResponse = ResponseUtil.getErrorResponse('get Random Engagement.', undefined);
            return res.status(400).send(errorResponse);
        }
        // read vote_event_noti vote one choice.
        if(wTVoteNoti.length > 0) {
            const userIds:any = await randomUser();
            const voteChoice:any = await randomVoteOneChoice(new ObjectID(wTVoteNoti[0].votingId[0]),userIds);
            const isReadId:any = await this.isReadPostService.findOne({userId:userIds});
            if(voteChoice !== undefined) {
                console.log('pass1');
                for(let g=0;g<=10;g++) {
                    const clientId = req.headers['client-id']; 
                    const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).split(',')[0]; 
                    const userEngage:any = new UserEngagement();
                    userEngage.clientId = clientId;
                    userEngage.ip = ipAddress; 
                    userEngage.device = 'tester_dev';
                    userEngage.userId = userIds;
                    userEngage.contentId = 'tester_dev';
                    userEngage.contentType = 'tester_dev';
                    userEngage.action = NotiTypeAction['vote_event_noti'];
                    userEngage.reference = 'tester_dev';
                    userEngage.point = Math.random() * 10 + 1;
                    userEngage.postId = '';
                    userEngage.votingId = new ObjectID(wTVoteNoti[0].votingId[0]);
                    userEngage.voteItemId = voteChoice.voteItemId;
                    userEngage.voteChoiceId = voteChoice.voteChoiceId;
                    userEngage.voteId = voteChoice.id;
                    userEngage.isReadId = isReadId === undefined ? await randomIsRead([new ObjectID(wTVoteNoti[0].votingId[0])],userIds,NotiTypeAction['line_noti']) : isReadId.id ;
                    await this.userEngagementService.create(userEngage);
                }
            }
        }

        // read vote_event_noti vote multi choice.
        if(wTVoteNoti.length > 0) {
            for(let h=0; h<=10; h++) {
                const userIds:any = await randomUser();
                const voteItemMulti:any = await randomVoteMultiChoice(new ObjectID(wTVoteNoti[0].votingId[0]),userIds);
                const isReadId:any = await this.isReadPostService.findOne({userId:userIds});
                const clientId = req.headers['client-id']; 
                const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).split(',')[0]; 
                const userEngage:any = new UserEngagement();
                if(voteItemMulti !== undefined && voteItemMulti.length > 0) {
                    console.log('pass2');
                    for(let i = 0; i < voteItemMulti.length; i++) {
                        userEngage.clientId = clientId;
                        userEngage.ip = ipAddress; 
                        userEngage.device = 'tester_dev';
                        userEngage.userId = userIds;
                        userEngage.contentId = 'tester_dev';
                        userEngage.contentType = 'tester_dev';
                        userEngage.action = NotiTypeAction['vote_event_noti'];
                        userEngage.reference = 'tester_dev';
                        userEngage.point = Math.random() * 10 + 1;
                        userEngage.postId = '';
                        userEngage.votingId = new ObjectID(wTVoteNoti[0].votingId[0]);
                        userEngage.voteItemId = new ObjectID(voteItemMulti[i].voteItemId);
                        userEngage.voteChoiceId = new ObjectID(voteItemMulti[i].voteChoiceId);
                        userEngage.isReadId = isReadId === undefined ? await randomIsRead([new ObjectID(wTVoteNoti[0].votingId[0])],userIds,NotiTypeAction['line_noti']) : isReadId.id ;
                        await this.userEngagementService.create(userEngage);
                    }
                }
            }
        }

        // read vote_event_noti vote text choice.
        if(wTVoteNoti.length > 0) {
            for(let m=0; m<=10; m++) {
                const userIds:any = await randomUser();
                const isReadId:any = await this.isReadPostService.findOne({userId:userIds});
                const voteTextId:any = await randomVoteTextChoice(new ObjectID(wTVoteNoti[0].votingId[0]),userIds);
                if(voteTextId !== undefined) {
                    console.log('pass3');
                    const clientId = req.headers['client-id']; 
                    const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).split(',')[0]; 
                    const userEngage:any = new UserEngagement();
                    userEngage.clientId = clientId;
                    userEngage.ip = ipAddress; 
                    userEngage.device = 'tester_dev';
                    userEngage.userId = userIds;
                    userEngage.contentId = 'tester_dev';
                    userEngage.contentType = 'tester_dev';
                    userEngage.action = NotiTypeAction['vote_event_noti'];
                    userEngage.reference = 'tester_dev';
                    userEngage.point = Math.random() * 10 + 1;
                    userEngage.postId = '';
                    userEngage.votingId = new ObjectID(wTVoteNoti[0].votingId[0]);
                    userEngage.voteItemId = voteTextId.voteItemId;
                    userEngage.voteId = voteTextId.id;
                    userEngage.isReadId = isReadId === undefined ? await randomIsRead([new ObjectID(wTVoteNoti[0].votingId[0])],userIds,NotiTypeAction['line_noti']) : isReadId.id ;
                    await this.userEngagementService.create(userEngage);   
                }
            }
        }

        // read line_noti
        for(let i = 0; i <= 10; i++) {
            const userIds:any = await randomUser();
            const isReadId:any = await this.isReadPostService.findOne({userId:userIds});
            const clientId = req.headers['client-id']; 
            const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).split(',')[0]; 
            const userEngage:any = new UserEngagement();
            userEngage.clientId = clientId;
            userEngage.ip = ipAddress; 
            userEngage.device = 'tester_dev';
            userEngage.userId = userIds;
            userEngage.contentId = 'tester_dev';
            userEngage.contentType = 'tester_dev';
            userEngage.action = NotiTypeAction['line_noti'];
            userEngage.reference = 'tester_dev';
            userEngage.point = Math.random() * 10 + 1;
            userEngage.postId = new ObjectID(postIds[0]._id);
            userEngage.votingId = '';
            userEngage.isReadId = isReadId === undefined ? await randomIsRead([new ObjectID(postIds[0]._id)],userIds,NotiTypeAction['line_noti']) : isReadId.id ;
            await this.userEngagementService.create(userEngage);
        }

        // read vote_event_noti
        if(wTVoteNoti.length > 0) {
            for(let j = 0; j <= 10; j++) {
                const userIds:any = await randomUser();
                const isReadId:any = await this.isReadPostService.findOne({userId:userIds});
                const clientId = req.headers['client-id']; 
                const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).split(',')[0]; 
                const userEngage:any = new UserEngagement();
                userEngage.clientId = clientId;
                userEngage.ip = ipAddress; 
                userEngage.device = 'tester_dev';
                userEngage.userId = userIds;
                userEngage.contentId = 'tester_dev';
                userEngage.contentType = 'tester_dev';
                userEngage.action = NotiTypeAction['vote_event_noti'];
                userEngage.reference = 'tester_dev';
                userEngage.point = Math.random() * 10 + 1;
                userEngage.postId = '';
                userEngage.votingId = new ObjectID(wTVoteNoti[0].votingId[0]);
                userEngage.isReadId = isReadId === undefined ? await randomIsRead([new ObjectID(wTVoteNoti[0].votingId[0])],userIds,NotiTypeAction['vote_event_noti']) : isReadId.id ;
                await this.userEngagementService.create(userEngage);
            }
        }

        // read vote_event_noti && vote one choice && multi choice && text
        if(wTVoteNoti.length > 0) {
            for(let j = 0; j <= 10; j++) {
                const userIds:any = await randomUser();
                const isReadId:any = await this.isReadPostService.findOne({userId:userIds});
                const clientId = req.headers['client-id']; 
                const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).split(',')[0]; 
                const userEngage:any = new UserEngagement();
                userEngage.clientId = clientId;
                userEngage.ip = ipAddress; 
                userEngage.device = 'tester_dev';
                userEngage.userId = userIds;
                userEngage.contentId = 'tester_dev';
                userEngage.contentType = 'tester_dev';
                userEngage.action = NotiTypeAction['vote_event_noti'];
                userEngage.reference = 'tester_dev';
                userEngage.point = Math.random() * 10 + 1;
                userEngage.postId = '';
                userEngage.votingId = new ObjectID(wTVoteNoti[0].votingId[0]);
                userEngage.isReadId = isReadId === undefined ? await randomIsRead([new ObjectID(wTVoteNoti[0].votingId[0])],userIds,NotiTypeAction['vote_event_noti']) : isReadId.id ;
                await this.userEngagementService.create(userEngage);
            }
        }

        // read pple_news_noti
        if(wTPpleNews.length > 0) {
            for(let z = 0; z<=10; z++) {
                const userIds:any = await randomUser();
                const isReadId:any = await this.isReadPostService.findOne({userId:userIds});
                const clientId = req.headers['client-id']; 
                const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).split(',')[0]; 
                const userEngage:any = new UserEngagement();
                userEngage.clientId = clientId;
                userEngage.ip = ipAddress; 
                userEngage.device = 'tester_dev';
                userEngage.userId = userIds;
                userEngage.contentId = 'tester_dev';
                userEngage.contentType = 'tester_dev';
                userEngage.action = NotiTypeAction['pple_news_noti'];
                userEngage.reference = 'tester_dev';
                userEngage.point = Math.random() * 10 + 1;
                userEngage.postId = new ObjectID(wTPpleNews[0].postIds[0]);
                userEngage.votingId = '';
                userEngage.isReadId = isReadId === undefined ? await randomIsRead([new ObjectID(postIds[0]._id)],userIds,NotiTypeAction['pple_news_noti']) : isReadId.id ;
                await this.userEngagementService.create(userEngage);
            }
        }

        // read pple_news_noti
        if(wTPpleNews.length > 0) {
            for(let z = 0; z<=10; z++) {
                const userIds:any = await randomUser();
                const isReadId:any = await this.isReadPostService.findOne({userId:userIds});
                const clientId = req.headers['client-id']; 
                const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).split(',')[0]; 
                const userEngage:any = new UserEngagement();
                userEngage.clientId = clientId;
                userEngage.ip = ipAddress; 
                userEngage.device = 'tester_dev';
                userEngage.userId = userIds;
                userEngage.contentId = 'tester_dev';
                userEngage.contentType = 'tester_dev';
                userEngage.action = NotiTypeAction['pple_news_noti'];
                userEngage.reference = 'tester_dev';
                userEngage.point = Math.random() * 10 + 1;
                userEngage.postId = new ObjectID(wTPpleNews[0].postIds[0]);
                userEngage.votingId = '';
                userEngage.isReadId = isReadId === undefined ? await randomIsRead([new ObjectID(wTPpleNews[0].postIds[0])],userIds,NotiTypeAction['pple_news_noti']) : isReadId.id ;
                await this.userEngagementService.create(userEngage);
            }
        }

        // read pple_news_noti && comment
        if(wTPpleNews.length > 0) {
            for(let z = 0; z<=10; z++) {
                const userIds:any = await randomUser();
                const isReadId:any = await this.isReadPostService.findOne({userId:userIds});
                const clientId = req.headers['client-id']; 
                const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).split(',')[0]; 
                const userEngage:any = new UserEngagement();
                userEngage.clientId = clientId;
                userEngage.ip = ipAddress; 
                userEngage.device = 'tester_dev';
                userEngage.userId = userIds;
                userEngage.contentId = 'tester_dev';
                userEngage.contentType = 'tester_dev';
                userEngage.action = NotiTypeAction['pple_news_noti'];
                userEngage.reference = 'tester_dev';
                userEngage.point = Math.random() * 10 + 1;
                userEngage.postId = new ObjectID(wTPpleNews[0].postIds[0]);
                userEngage.commentId = await randomComment(new ObjectID(wTPpleNews[0].postIds[0]), userIds);
                userEngage.votingId = '';
                userEngage.isReadId = isReadId === undefined ? await randomIsRead([new ObjectID(wTPpleNews[0].postIds[0])],userIds,NotiTypeAction['pple_news_noti']) : isReadId.id ;
                await this.userEngagementService.create(userEngage);
            }
        }

        // read pple_news_noti && like
        if(wTPpleNews.length > 0) {
            for(let z = 0; z<=10; z++) {
                const userIds:any = await randomUser();
                const isReadId:any = await this.isReadPostService.findOne({userId:userIds});
                const clientId = req.headers['client-id']; 
                const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).split(',')[0]; 
                const userEngage:any = new UserEngagement();
                userEngage.clientId = clientId;
                userEngage.ip = ipAddress; 
                userEngage.device = 'tester_dev';
                userEngage.userId = userIds;
                userEngage.contentId = 'tester_dev';
                userEngage.contentType = 'tester_dev';
                userEngage.action = NotiTypeAction['pple_news_noti'];
                userEngage.reference = 'tester_dev';
                userEngage.point = Math.random() * 10 + 1;
                userEngage.postId = new ObjectID(wTPpleNews[0].postIds[0]);
                userEngage.likeId = await randomLike(new ObjectID(wTPpleNews[0].postIds[0]), userIds);
                userEngage.votingId = '';
                userEngage.isReadId = isReadId === undefined ? await randomIsRead([new ObjectID(wTPpleNews[0].postIds[0])],userIds,NotiTypeAction['pple_news_noti']) : isReadId.id ;
                await this.userEngagementService.create(userEngage);
            }
        }
        
        // not read line_noti
        for(let a = 0; a <= 10; a++) {
            const userIds:ObjectID = randomUser();
            const clientId = req.headers['client-id']; 
            const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).split(',')[0]; 
            const userEngage:any = new UserEngagement();
            userEngage.clientId = clientId;
            userEngage.ip = ipAddress; 
            userEngage.device = 'tester_dev';
            userEngage.userId = userIds;
            userEngage.contentId = 'tester_dev';
            userEngage.contentType = 'tester_dev';
            userEngage.action = NotiTypeAction['line_noti'];
            userEngage.reference = 'tester_dev';
            userEngage.point = Math.random() * 10 + 1;
            userEngage.postId = new ObjectID(postIds[0]._id);
            userEngage.votingId = '';
            userEngage.isReadId = '';
            await this.userEngagementService.create(userEngage);
        }

        // not read pple_news_noti
        for(let b = 0; b<=10; b++) {
            const userIds:any = await randomUser();
            const clientId = req.headers['client-id']; 
            const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).split(',')[0]; 
            const userEngage:any = new UserEngagement();
            userEngage.clientId = clientId;
            userEngage.ip = ipAddress; 
            userEngage.device = 'tester_dev';
            userEngage.userId = userIds;
            userEngage.contentId = 'tester_dev';
            userEngage.contentType = 'tester_dev';
            userEngage.action = NotiTypeAction['pple_news_noti'];
            userEngage.reference = 'tester_dev';
            userEngage.point = Math.random() * 10 + 1;
            userEngage.postId = new ObjectID(wTPpleNews[0].postIds[0]);
            userEngage.votingId = '';
            userEngage.isReadId = '';
            await this.userEngagementService.create(userEngage);
        }

        // read and like and comment line_noti
        for(let c = 0; c<=10; c++) {
            const userIds:any = await randomUser();
            const isReadId:any = await this.isReadPostService.findOne({userId:userIds});
            const clientId = req.headers['client-id']; 
            const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).split(',')[0]; 
            const userEngage:any = new UserEngagement();
            userEngage.clientId = clientId;
            userEngage.ip = ipAddress; 
            userEngage.device = 'tester_dev';
            userEngage.userId = userIds;
            userEngage.contentId = 'tester_dev';
            userEngage.contentType = 'tester_dev';
            userEngage.action = NotiTypeAction['line_noti'];
            userEngage.reference = 'tester_dev';
            userEngage.point = Math.random() * 10 + 1;
            userEngage.postId = new ObjectID(postIds[0]._id);
            userEngage.votingId = '';
            userEngage.commentId = await randomComment(new ObjectID(postIds[0]._id), userIds);
            userEngage.likeId = await randomLike(new ObjectID(postIds[0]._id), userIds);
            userEngage.isReadId = isReadId === undefined ? await randomIsRead([new ObjectID(postIds[0]._id)],userIds,NotiTypeAction['line_noti']) : isReadId.id ;
            await this.userEngagementService.create(userEngage);
        }

        // read and like line_noti
        for(let d = 0; d<=10; d++) {
            const userIds:any = await randomUser();
            const isReadId:any = await this.isReadPostService.findOne({userId:userIds});
            const clientId = req.headers['client-id']; 
            const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).split(',')[0]; 
            const userEngage:any = new UserEngagement();
            userEngage.clientId = clientId;
            userEngage.ip = ipAddress; 
            userEngage.device = 'tester_dev';
            userEngage.userId = userIds;
            userEngage.contentId = 'tester_dev';
            userEngage.contentType = 'tester_dev';
            userEngage.action = NotiTypeAction['line_noti'];
            userEngage.reference = 'tester_dev';
            userEngage.point = Math.random() * 10 + 1;
            userEngage.postId = new ObjectID(postIds[0]._id);
            userEngage.votingId = '';
            userEngage.likeId = await randomLike(new ObjectID(postIds[0]._id), userIds);
            userEngage.isReadId = isReadId === undefined ? await randomIsRead([new ObjectID(postIds[0]._id)],userIds,NotiTypeAction['line_noti']) : isReadId.id ;
            await this.userEngagementService.create(userEngage);
            
        }
        // read and comment line_noti
        for(let f=0;f<=10;f++) {
            const userIds:any = await randomUser();
            const isReadId:any = await this.isReadPostService.findOne({userId:userIds});
            const clientId = req.headers['client-id']; 
            const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).split(',')[0]; 
            const userEngage:any = new UserEngagement();
            userEngage.clientId = clientId;
            userEngage.ip = ipAddress; 
            userEngage.device = 'tester_dev';
            userEngage.userId = userIds;
            userEngage.contentId = 'tester_dev';
            userEngage.contentType = 'tester_dev';
            userEngage.action = NotiTypeAction['line_noti'];
            userEngage.reference = 'tester_dev';
            userEngage.point = Math.random() * 10 + 1;
            userEngage.postId = new ObjectID(postIds[0]._id);
            userEngage.votingId = '';
            userEngage.commentId = await randomComment(new ObjectID(postIds[0]._id), userIds);
            userEngage.isReadId = isReadId === undefined ? await randomIsRead([new ObjectID(postIds[0]._id)],userIds,NotiTypeAction['line_noti']) : isReadId.id ;
            await this.userEngagementService.create(userEngage);
        }

        const successResponse = ResponseUtil.getSuccessResponse('Mock data users engagement is success.', undefined);
        return res.status(200).send(successResponse);
    }

    @Get('/item/:id')
    @Authorized('')
    public async getItemVote(@Body({ validate: true}) search: FindVoteRequest, @Param('id') id: string, @Res() res: any, @Req() req: any): Promise<any> {
        const voteObjId = new ObjectID(id);

        const voteObj = await this.votingEventService.findOne({ _id: voteObjId });
        if (voteObj === undefined && voteObj === null) {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot find a vote.', undefined);
            return res.status(400).send(errorResponse);
        }
        let filter: any = search.filter;
        if (filter === undefined) {
            filter = new SearchFilter();
        }
        const take = filter.limit ? filter.limit : 10;
        const offset = filter.offset ? filter.offset : 0;
        
        const voteItem = await this.voteItemService.aggregate([
            {
                $match: {
                votingId: voteObjId,
                },
            },
            {
                $sort:{
                    ordering: 1
                }
            },
            {
                $project:{
                    _id: 1,
                    createdDate: 1,
                    createdTime: 1,
                    votingId: 1,
                    assetId: 1,
                    ordering: 1,
                    type: 1,
                    title: 1,
                    coverPageURL: 1,
                    s3CoverPageURL: 1,
                    checkType: {
                        $cond:[
                            {
                                $or:[
                                {$eq:['$type','single']},
                                {$eq:['$type','multi']}
                            ]
                            },
                            'Yes',
                            'No'
                        ]
                    }
                }
            },
            {
                $facet: {
                    type: [
                        {
                            $match: {
                                checkType: 'Yes'
                            }, 
                        },
                        {
                            $lookup: {
                            from: 'VoteChoice',
                            let: { id: '$_id' },
                            pipeline: [
                                {
                                $match: {
                                    $expr: {
                                    $eq: ['$$id', '$voteItemId'],
                                    },
                                },
                                },
                            ],
                            as: 'voteChoice',
                            },
                        },
                    ],
                    noType: [
                        {
                            $match: {
                                checkType: 'No'
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    combinedResults: {
                        $concatArrays: ['$type', '$noType'],
                    }
                }
            },
            {
                $unwind: {
                    path: '$combinedResults',
                },
            },
            {
                $replaceRoot: {
                    newRoot: '$combinedResults',
                },
            },
            {
                $limit: take
            },
            {
                $skip: offset
            }
        ]);
        let voteEvent:any = undefined;
        if(voteObj.showVoterName === true) {
            voteEvent = await this.votedService.aggregate([
                {
                    $match:{
                        votingId:voteObjId
                    }
                },
                {
                    $lookup: {
                        from: 'User',
                        let: { 'userId': '$userId' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$$userId', '$_id']
                                    }
                                }
                            },
                            { $sample: { size: 5 } },     
                            {
                                $project: {
                                    _id: 1,
                                    displayName: 1,
                                    uniqueId: 1,
                                    imageURL: 1,
                                    s3ImageURL: 1
                                }
                            },
                        ],
                        as: 'user'
                    }
                },       
                {
                    $unwind:{
                        path:'$user'
                    }
                },
                {
                    $group: {
                    _id: '$user._id',
                    count: { $sum: 1 },
                    uniqueIds: { $addToSet: '$user._id' }
                    }
                },
                {
                    $lookup: {
                        from: 'User',
                        let: { 'id': '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$$id', '$_id']
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    displayName: 1,
                                    uniqueId: 1,
                                    imageURL: 1,
                                    s3ImageURL: 1
                                }
                            },
                        ],
                        as: 'user'
                    }
                },
                {
                    $unwind:{
                        path:'$user'
                    }
                },  
                {
                    $project:{
                        user:1
                    }
                }
            ]);
        }
        const voteCount = await this.votedService.aggregate(
            [
                {
                    $match:{
                        votingId:voteObjId
                    }
                },
                {
                    $group:{
                        _id:'$userId',
                        count:{$sum:1}
                    }
                }
            ]
        );
        const response:any = {
            'voteItem':{},
            'voted':{},
            'voteCount':{},
            'showVoterName':undefined,
        };
        response['voteItem'] = voteItem;
        response['voted'] = voteEvent ? voteEvent : [];
        response['voteCount'] = voteCount.length;
        response['showVoterName'] = voteObj.showVoterName;
        response['showVoteResult'] = voteObj.showVoteResult;

        if (response['voteItem'].length>0) {
            const successResponse = ResponseUtil.getSuccessResponse('Get VoteItem is success.', response);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Not found Vote Item.', undefined);
            return res.status(400).send(errorResponse);
        }
    }
    // HashTag 
    @Get('/hashtag')
    public async HashTag(@Res() res: any, @Req() req: any): Promise<any> {
        const mfpHashTag = await this.configService.getConfig(MFPHASHTAG);
        const split = mfpHashTag.value.split(',');
        if(split.length > 0){
            const successResponse = ResponseUtil.getSuccessResponse('Get Mfp HashTag is success.', split);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('MFP HashTag is empty.', undefined);
            return res.status(400).send(errorResponse);
        }
    }
}