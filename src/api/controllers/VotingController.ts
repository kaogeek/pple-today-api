import { JsonController, Res, Post, Body, Req, Authorized, Param, Delete, Put, Get, QueryParam } from 'routing-controllers';
import { VotingEventRequest } from './requests/VotingEventRequest';
import { VotingContentsRequest } from './requests/VotingContentsRequest';
// import { UserSupportRequest } from './requests/UserSupportRequest';
import { SupportRequest } from './requests/SupportRequest';
import { FindVoteRequest } from './requests/FindVoteRequest';
import { VotedRequest } from './requests/VotedRequest';
import { InviteVoteRequest } from './requests/InviteVoteRequest';
import { VotingEventService } from '../services/VotingEventService';
import { VoteItemService } from '../services/VoteItemService';
import { VoteChoiceService } from '../services/VoteChoiceService';
import { AssetService } from '../services/AssetService';
import { UserService } from '../services/UserService';
import { HashTagService } from '../services/HashTagService';
import { UserSupportService } from '../services/UserSupportService';
import { VotingEventModel } from '../models/VotingEventModel';
// import { RetrieveVotingOptionsModel } from '../models/RetrieveVotingOptionsModel';
import { Worker} from 'worker_threads';
import { UserSupport as UserSupportModel } from '../models/UserSupportModel';
import { ResponseUtil } from '../../utils/ResponseUtil';
import { ObjectID } from 'mongodb';
import * as fs from 'fs';
import { PageService } from '../services/PageService';
import moment from 'moment';
// import { RetrieveVoteService } from '../services/RetrieveVotingOptionService';
import { Page } from '../models/Page';
import { ObjectUtil } from '../../utils/ObjectUtil';
import { SearchFilter } from './requests/SearchFilterRequest';
import { S3Service } from '../services/S3Service';
// import { DeviceToken } from '../models/DeviceToken';
import { DeviceTokenService } from '../services/DeviceToken';
// import { NotificationService } from '../services/NotificationService';
import axios from 'axios';
import qs from 'qs';
import * as path from 'path';
import { UserEngagement } from '../models/UserEngagement';
import { UserEngagementService } from '../services/UserEngagementService';
import { ENGAGEMENT_CONTENT_TYPE, ENGAGEMENT_ACTION } from '../../constants/UserEngagementAction';
import { PointStatementModel } from '../models/PointStatementModel';
import { PointStatementService } from '../services/PointStatementService';
import { AccumulateModel } from '../models/AccumulatePointModel';
import { AccumulateService } from '../services/AccumulateService';
import { NotiTypeAction } from '../../constants/WorkerThread';
import { checkify } from '../../utils/ChuckWorkerThreadUtil';
import {
    DEFAULT_MIN_SUPPORT,
    MIN_SUPPORT,
    DEFAULT_CLOSET_VOTE,
    CLOSET_VOTE,
    DEFAULT_TRIGGER_VOTE,
    TRIGGER_VOTE,
    ELIGIBLE_VOTES,
    MFPHASHTAG,
    DEFAULT_SUPPORT_DAYS_RANGE,
    SUPPORT_DAYS_RANGE,
    DEFAULT_VOTE_DAYS_RANGE,
    VOTE_DAYS_RANGE,
    DEFAULT_CLOSET_SUPPORT,
    CLOSET_SUPPORT,
    DEFAULT_MAX_VOTE_CHOICES,
    MAX_VOTE_CHOICES,
    DEFAULT_MAX_VOTE_QUESTIONS,
    MAX_VOTE_QUESTIONS,
    PRIVILEGES,
    DEFAULT_VOTE_POINT,
    VOTE_POINT,
    NOTI_VOTER,
    DEFAULT_SPECIFIC_NOTI_VOTER,
    SPECIFIC_NOTI_VOTER,
    DEFAULT_SWITCHING_LINE_FLEX_MESSAGE,
    SWITCHING_LINE_FLEX_MESSAGE
} from '../../constants/SystemConfig';
import { ConfigService } from '../services/ConfigService';
import { VoteItem as VoteItemModel } from '../models/VoteItemModel';
import { VoteChoice as VoteChoiceModel } from '../models/VoteChoiceModel';
import { InviteVote as InviteVoteModel } from '../models/InviteVoteModel';
import { VotedService } from '../services/VotedService';
import { InviteVoteService } from '../services/InviteVoteService';
import { AuthenticationIdService } from '../services/AuthenticationIdService';
import { Voted as VotedModel } from '../models/VotedModel';
import { PageAccessLevelService } from '../services/PageAccessLevelService';
import { PAGE_ACCESS_LEVEL } from '../../constants/PageAccessLevel';
import { HashTag } from '../models/HashTag';
import { POINT_TYPE } from '../../constants/PointType';
import { WorkerThread } from '../models/WokerThreadModel';
import { WorkerThreadService } from '../services/WokerThreadService';
import { IsReadVote} from './requests/IsReadVote';
import { IsReadPostService } from '../services/IsReadPostService';
// startVoteDatetime
@JsonController('/voting')
export class VotingController {
    constructor(
        private votingEventService: VotingEventService,
        private configService: ConfigService,
        private voteItemService: VoteItemService,
        private voteChoiceService: VoteChoiceService,
        private votedService: VotedService,
        private userSupportService: UserSupportService,
        private userService: UserService,
        private pageService: PageService,
        private pageAccessLevelService: PageAccessLevelService,
        private assetService: AssetService,
        private authenticationIdService: AuthenticationIdService,
        private inviteVoteService: InviteVoteService,
        private hashTagService: HashTagService,
        private s3Service: S3Service,
        private userEngagementService: UserEngagementService,
        private pointStatementService: PointStatementService,
        private accumulateService: AccumulateService,
        private deviceTokenService:DeviceTokenService,
        private workerThreadService:WorkerThreadService,
        private isReadPostService:IsReadPostService
        // private notificationService: NotificationService
        // private retrieveVoteService: RetrieveVoteService
    ) { }

    @Post('/is/read')
    public async isRead(@Body({ validate: true }) data: IsReadVote, @Res() res: any, @Req() req: any): Promise<any> {
        const userId = req.headers.userid;
        const objIds = new ObjectID(userId);

        const clientId = req.headers['client-id']; 
        const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).split(',')[0]; 
        let count = 0;
        for(const item of data.votingId) {
            count += 1;
            const workerTheadFindOne:any = await this.workerThreadService.findOne({theThings: new ObjectID(item), type: data.action.toLocaleUpperCase().trim()});
            const userEngagement = new UserEngagement();
            userEngagement.clientId = clientId;
            userEngagement.ip = ipAddress; 
            userEngagement.device = data.device.toLowerCase().trim();
            userEngagement.userId = userId ? new ObjectID(req.headers.userid) : '';
            userEngagement.contentId = '';
            userEngagement.contentType = '';
            userEngagement.action = data.action.toUpperCase().trim();
            userEngagement.reference = '';
            userEngagement.point = 5;
            userEngagement.postId = '';
            userEngagement.votingId = new ObjectID(item);
            userEngagement.isReadId = '';
            await this.userEngagementService.create(userEngagement);
            if(workerTheadFindOne !== undefined) {
                await this.workerThreadService.update({_id: workerTheadFindOne.id }, {$set : {sended: workerTheadFindOne.sended + count}});
            }
        }
        // check is read
        if (objIds) {
            // check is read

            const isReadPost = await this.isReadPostService.findOneAndUpdate(
                { userId: objIds },
                { 
                    $set: 
                    { 
                        votingId: data.votingId, 
                        isRead: data.isRead,
                        device: data.device.toLowerCase().trim(),
                        action: data.action.toUpperCase().trim(),
                        createdDate: new Date(),
                    } 
                },
                { upsert: true, new: true }
            );
            if (isReadPost) {
                const successResponse = ResponseUtil.getSuccessResponse('The content has already been read.', isReadPost);
                return res.status(200).send(successResponse);
            }
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot find User.', undefined);
            return res.status(400).send(errorResponse);
        }

    }

    @Get('/:id')
    public async getVotingEvent(@Param('id') id: string, @Res() res: any, @Req() req: any): Promise<any> {
        const userObjId = req.headers.userid ? new ObjectID(req.headers.userid) : undefined;
        const voteObject = new ObjectID(id);
        if (voteObject === undefined) {
            const errorResponse = ResponseUtil.getErrorResponse('Id is undefined.', undefined);
            return res.status(400).send(errorResponse);
        }

        const voteEventAggr: any = await this.votingEventService.aggregate(
            [
                {
                    $project: {
                        _id: 1,
                        createdDate: 1,
                        title: 1,
                        detail: 1,
                        assertId: 1,
                        coverPageURL: 1,
                        s3CoverPageURL: 1,
                        userId: 1,
                        approved: 1,
                        closed: 1,
                        minSupport: 1,
                        countSupport: 1,
                        supportDaysRange: 1,
                        startSupportDatetime: 1,
                        endSupportDatetime: 1,
                        voteDaysRange: 1,
                        startVoteDatetime: 1,
                        endVoteDatetime: 1,
                        approveDatetime: 1,
                        approveUsername: 1,
                        updateDatetime: 1,
                        closeDate: 1,
                        status: 1,
                        createAsPage: 1,
                        type: 1,
                        public: 1,
                        hashTag: 1,
                        pin: 1,
                        showVoterName: 1,
                        showVoteResult: 1,
                        voted: 1,
                        service: 1,
                        passing_scores: 1,
                        createPage: {
                            $cond: [
                                {
                                    $ne: ['$createAsPage', null]  // Check if 'showVoterName' is true
                                },
                                'Yes',
                                'No',
                            ]
                        }
                    }
                },
                {
                    $facet: {
                        showVoterName: [
                            {
                                $match: {
                                    createPage: 'Yes'
                                },

                            },
                            {
                                $lookup: {
                                    from: 'Page',
                                    let: { 'createAsPage': '$createAsPage' },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $eq: ['$$createAsPage', '$_id']
                                                }
                                            },
                                        },
                                        {
                                            $project: {
                                                _id: 1,
                                                name: 1,
                                                pageUsername: 1,
                                                isOfficial: 1,
                                                imageURL: 1,
                                                s3ImageURL: 1,
                                                banned: 1
                                            }
                                        }
                                    ],
                                    as: 'page'
                                }
                            },
                            {
                                $unwind: {
                                    path: '$page'
                                }
                            }
                        ],
                        notShowVoterName: [
                            {
                                $match: {
                                    createPage: 'No'
                                }
                            },
                            {
                                $lookup: {
                                    from: 'User',
                                    let: { userId: '$userId' },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr:
                                                {
                                                    $eq: ['$$userId', '$_id']
                                                }
                                            }
                                        },
                                        {
                                            $project: {
                                                _id: 1,
                                                firstName: 1,
                                                lastName: 1,
                                                imageURL: 1,
                                                s3ImageURL: 1
                                            }
                                        }
                                    ],
                                    as: 'user'
                                }
                            },
                            {
                                $unwind: {
                                    path: '$user'
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields: {
                        combinedResults: {
                            $concatArrays: ['$showVoterName', '$notShowVoterName'],
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
                    $match: {
                        _id: voteObject
                    }
                },
                {
                    $lookup: {
                        from: 'UserSupport',
                        let: { 'id': '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr:
                                    {
                                        $eq: ['$$id', '$votingId']
                                    }
                                }
                            },
                            {
                                $match: { userId: userObjId }
                            }
                        ],
                        as: 'userSupport'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        createdDate: 1,
                        title: 1,
                        detail: 1,
                        coverPageURL: 1,
                        s3CoverPageURL: 1,
                        userId: 1,
                        approved: 1,
                        closed: 1,
                        minSupport: 1,
                        countSupport: 1,
                        supportDaysRange: 1,
                        startSupportDatetime: 1,
                        endSupportDatetime: 1,
                        voteDaysRange: 1,
                        startVoteDatetime: 1,
                        endVoteDatetime: 1,
                        closeDate: 1,
                        status: 1,
                        type: 1,
                        hashTag: 1,
                        pin: 1,
                        showVoterName: 1,
                        showVoteResult: 1,
                        voted: 1,
                        page: 1,
                        user: 1,
                        service: 1,
                        userSupport: {
                            $cond: [
                                {
                                    $gt: [{ $size: '$userSupport' }, 0]
                                },
                                true,
                                false
                            ]
                        }
                    }
                },
                {
                    $sort: {
                        createdDate: -1
                    }
                },
            ]
        );
        if (voteEventAggr.length > 0) {
            const successResponse = ResponseUtil.getSuccessResponse('Get VoteEvent is successfuly.', voteEventAggr[0]);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Not found VoteEvent.', undefined);
            return res.status(400).send(errorResponse);
        }

    }

    @Post('/vote/search/')
    public async searchVoted(@Body({ validate: true }) search: FindVoteRequest, @Res() res: any, @Req() req: any): Promise<any> {
        if (ObjectUtil.isObjectEmpty(search)) {
            return res.status(200).send([]);
        }

        const whereConditions = search.whereConditions;
        let filter: any = search.filter;
        if (filter === undefined) {
            filter = new SearchFilter();
        }
        const keywords = search.keyword;
        const exp = { $regex: '.*' + keywords + '.*', $options: 'si' };
        const take = filter.limit ? filter.limit : 10;
        const offset = filter.offset ? filter.offset : 0;
        const matchVoteEvent: any = {};

        if (whereConditions.approved !== undefined && whereConditions.approved !== null) {
            matchVoteEvent.approved = whereConditions.approved;
        }

        if (whereConditions.closed !== undefined && whereConditions.closed !== null) {
            matchVoteEvent.closed = whereConditions.closed;
        }

        if (whereConditions.status !== undefined &&
            whereConditions.status.vote !== undefined &&
            whereConditions.status.support !== undefined) {
            matchVoteEvent.status =
                { $in: ['support', 'vote'] };
        }

        if (whereConditions.status !== undefined && whereConditions.status.vote === undefined && whereConditions.status.support === undefined) {
            matchVoteEvent.status = whereConditions.status;
        }

        if (whereConditions.type !== undefined && whereConditions.type !== null) {
            matchVoteEvent.type = whereConditions.type;
        }

        if (whereConditions.pin !== undefined && whereConditions.pin !== null) {
            matchVoteEvent.pin = whereConditions.pin;
        }

        if (whereConditions.showed !== undefined && whereConditions.showed !== null) {
            matchVoteEvent.showVoteResult = whereConditions.showVoteResult;
        }
        const hashTags: any = [];
        if (whereConditions.hashTag !== undefined && whereConditions.hashTag.length > 0) {
            for (const hashTag of whereConditions.hashTag) {
                hashTags.push(String(hashTag));
            }
        }
        if (hashTags.length > 0) {
            matchVoteEvent.hashTag = { $in: hashTags };
        }

        if (keywords !== undefined && keywords !== null && keywords !== '') {
            matchVoteEvent.title = exp;
        }

        matchVoteEvent.hide = true;

        const userObjId = req.headers.userid ? ObjectID(req.headers.userid) : undefined;
        const voteEventAggr: any = await this.votingEventService.aggregate(
            [
                {
                    $project: {
                        _id: 1,
                        createdDate: 1,
                        title: 1,
                        detail: 1,
                        assertId: 1,
                        coverPageURL: 1,
                        s3CoverPageURL: 1,
                        userId: 1,
                        approved: 1,
                        closed: 1,
                        minSupport: 1,
                        countSupport: 1,
                        supportDaysRange: 1,
                        startSupportDatetime: 1,
                        endSupportDatetime: 1,
                        voteDaysRange: 1,
                        startVoteDatetime: 1,
                        endVoteDatetime: 1,
                        approveDatetime: 1,
                        approveUsername: 1,
                        updateDatetime: 1,
                        closeDate: 1,
                        status: 1,
                        createAsPage: 1,
                        type: 1,
                        public: 1,
                        hashTag: 1,
                        pin: 1,
                        showVoterName: 1,
                        showVoteResult: 1,
                        hide: 1,
                        voted: 1,
                        service: 1,
                        passing_scores: 1,
                        createPage: {
                            $cond: [
                                {
                                    $ne: ['$createAsPage', null]  // Check if 'showVoterName' is true
                                },
                                'Yes',
                                'No',
                            ]
                        }
                    }
                },
                {
                    $facet: {
                        showVoterName: [
                            {
                                $match: {
                                    createPage: 'Yes'
                                },

                            },
                            {
                                $lookup: {
                                    from: 'Page',
                                    let: { 'createAsPage': '$createAsPage' },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $eq: ['$$createAsPage', '$_id']
                                                }
                                            },
                                        },
                                        {
                                            $project: {
                                                _id: 1,
                                                name: 1,
                                                pageUsername: 1,
                                                isOfficial: 1,
                                                imageURL: 1,
                                                s3ImageURL: 1,
                                                banned: 1
                                            }
                                        }
                                    ],
                                    as: 'page'
                                }
                            },
                            {
                                $unwind: {
                                    path: '$page'
                                }
                            }
                        ],
                        notShowVoterName: [
                            {
                                $match: {
                                    createPage: 'No'
                                }
                            },
                            {
                                $lookup: {
                                    from: 'User',
                                    let: { userId: '$userId' },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr:
                                                {
                                                    $eq: ['$$userId', '$_id']
                                                }
                                            }
                                        },
                                        {
                                            $project: {
                                                _id: 1,
                                                firstName: 1,
                                                lastName: 1,
                                                imageURL: 1,
                                                s3ImageURL: 1
                                            }
                                        }
                                    ],
                                    as: 'user'
                                }
                            },
                            {
                                $unwind: {
                                    path: '$user'
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields: {
                        combinedResults: {
                            $concatArrays: ['$showVoterName', '$notShowVoterName'],
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
                    $match: matchVoteEvent
                },
                {
                    $lookup: {
                        from: 'UserSupport',
                        let: { 'id': '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr:
                                    {
                                        $eq: ['$$id', '$votingId']
                                    }
                                }
                            },
                            {
                                $match: { userId: userObjId }
                            }
                        ],
                        as: 'userSupport'
                    }
                },
                {
                    $lookup: {
                        from: 'Voted',
                        let: { 'id': '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$$id', '$votingId']
                                    }
                                }
                            },
                            {
                                $match: {
                                    userId: userObjId
                                }
                            }
                        ],
                        as: 'myVotes'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        createdDate: 1,
                        title: 1,
                        detail: 1,
                        coverPageURL: 1,
                        s3CoverPageURL: 1,
                        userId: 1,
                        approved: 1,
                        closed: 1,
                        minSupport: 1,
                        countSupport: 1,
                        supportDaysRange: 1,
                        startSupportDatetime: 1,
                        endSupportDatetime: 1,
                        voteDaysRange: 1,
                        startVoteDatetime: 1,
                        endVoteDatetime: 1,
                        closeDate: 1,
                        status: 1,
                        type: 1,
                        hashTag: 1,
                        pin: 1,
                        showVoterName: 1,
                        showVoteResult: 1,
                        voted: 1,
                        page: 1,
                        user: 1,
                        service: 1,
                        hide: 1,
                        userSupport: {
                            $cond: [
                                {
                                    $gt: [{ $size: '$userSupport' }, 0]
                                },
                                true,
                                false
                            ]
                        },
                        myVotes: {
                            $cond: [
                                {
                                    $gt: [{ $size: '$myVotes' }, 0]
                                },
                                true,
                                false
                            ]
                        }
                    }
                },
                {
                    $sort: {
                        createdDate: -1
                    }
                },
                {
                    $skip: offset
                },
                {
                    $limit: take
                }
            ]
        );
        const countRows: any = [
            { 'count': voteEventAggr.length }
        ];

        const successResponse = ResponseUtil.getSuccessResponse('Search lists any vote is succesful.', voteEventAggr, countRows[0].count);
        return res.status(200).send(successResponse);
    }

    @Post('/permissible')
    @Authorized('user')
    public async permissible(@Res() res: any, @Req() req: any): Promise<any> {
        const userObjIds = new ObjectID(req.user.id);
        // check ban 
        const user = await this.userService.findOne({ _id: userObjIds });
        if (user !== undefined && user !== null && user.banned === true) {
            const errorResponse = ResponseUtil.getErrorResponse('You have been banned.', undefined);
            return res.status(400).send(errorResponse);
        }

        let eligibleValue = undefined;
        const eligibleConfig = await this.configService.getConfig(ELIGIBLE_VOTES);
        if (eligibleConfig) {
            eligibleValue = eligibleConfig.value;
        }
        const split = eligibleValue ? eligibleValue.split(',') : eligibleValue;
        const userObj = await this.userService.findOne({ _id: userObjIds });
        if (split.includes(userObj.email) === false) {
            const errorResponse = ResponseUtil.getErrorResponse('You have no permission to create the vote event.', undefined);
            return res.status(400).send(errorResponse);
        }

        const successResponse = ResponseUtil.getSuccessResponse('You good to go.', undefined);
        return res.status(200).send(successResponse);
    }

    @Post('/contents')
    public async votingContents(@Body({ validate: true }) votingContentsRequest: VotingContentsRequest, @Res() res: any, @Req() req: any): Promise<any> {
        const userObjId = req.headers.userid ? new ObjectID(req.headers.userid) : undefined;
        const keywords = votingContentsRequest.keyword;
        const exp = { $regex: '.*' + keywords + '.*', $options: 'si' };
        const take = votingContentsRequest.limit ? votingContentsRequest.limit : 10;
        const skips = votingContentsRequest.offset ? votingContentsRequest.offset : 0;
        let pinned: any = undefined;
        let myVote: any = undefined;
        let supporter: any = undefined;
        let closeVote: any = undefined;
        let hashTagVote: any = undefined;
        let closetSupportAggr: any = undefined;
        let generalSection: any = undefined;
        const stackId: any = [];

        if (votingContentsRequest.pin === true) {
            pinned = await this.votingEventService.aggregate(
                [
                    {
                        $project: {
                            _id: 1,
                            createdDate: 1,
                            title: 1,
                            detail: 1,
                            assertId: 1,
                            coverPageURL: 1,
                            s3CoverPageURL: 1,
                            userId: 1,
                            approved: 1,
                            closed: 1,
                            minSupport: 1,
                            countSupport: 1,
                            supportDaysRange: 1,
                            startSupportDatetime: 1,
                            endSupportDatetime: 1,
                            voteDaysRange: 1,
                            startVoteDatetime: 1,
                            endVoteDatetime: 1,
                            approveDatetime: 1,
                            approveUsername: 1,
                            updateDatetime: 1,
                            closeDate: 1,
                            status: 1,
                            createAsPage: 1,
                            type: 1,
                            public: 1,
                            hashTag: 1,
                            pin: 1,
                            showVoterName: 1,
                            showVoteResult: 1,
                            voted: 1,
                            service: 1,
                            passing_scores: 1,
                            hide: 1,
                            createPage: {
                                $cond: [
                                    {
                                        $ne: ['$createAsPage', null]  // Check if 'showVoterName' is true
                                    },
                                    'Yes',
                                    'No',
                                ]
                            }
                        }
                    },
                    {
                        $facet: {
                            showVoterName: [
                                {
                                    $match: {
                                        createPage: 'Yes'
                                    },

                                },
                                {
                                    $lookup: {
                                        from: 'Page',
                                        let: { 'createAsPage': '$createAsPage' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $eq: ['$$createAsPage', '$_id']
                                                    }
                                                },
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    name: 1,
                                                    pageUsername: 1,
                                                    isOfficial: 1,
                                                    imageURL: 1,
                                                    s3ImageURL: 1,
                                                    banned: 1
                                                }
                                            }
                                        ],
                                        as: 'page'
                                    }
                                },
                                {
                                    $unwind: {
                                        path: '$page'
                                    }
                                }
                            ],
                            notShowVoterName: [
                                {
                                    $match: {
                                        createPage: 'No'
                                    }
                                },
                                {
                                    $lookup: {
                                        from: 'User',
                                        let: { userId: '$userId' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr:
                                                    {
                                                        $eq: ['$$userId', '$_id']
                                                    }
                                                }
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    firstName: 1,
                                                    lastName: 1,
                                                    imageURL: 1,
                                                    s3ImageURL: 1
                                                }
                                            }
                                        ],
                                        as: 'user'
                                    }
                                },
                                {
                                    $unwind: {
                                        path: '$user'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            combinedResults: {
                                $concatArrays: ['$showVoterName', '$notShowVoterName'],
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
                        $match: {
                            pin: true,
                            // approved: true,
                            $or: [
                                { status: { $eq: 'vote' } },
                                { status: { $eq: 'close' } }
                            ],
                            hide: true,
                            title: exp
                        }
                    },
                    {
                        $sort: {
                            createdDate: -1
                        }
                    },
                    {
                        $lookup: {
                            from: 'UserSupport',
                            let: { 'id': '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr:
                                        {
                                            $eq: ['$$id', '$votingId']
                                        }
                                    }
                                },
                                {
                                    $match: { userId: userObjId }
                                }
                            ],
                            as: 'userSupport'
                        }
                    },
                    {
                        $lookup: {
                            from: 'Voted',
                            let: { 'id': '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $eq: ['$$id', '$votingId']
                                        }
                                    }
                                },
                                {
                                    $match: {
                                        userId: userObjId
                                    }
                                }
                            ],
                            as: 'myVotes'
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            createdDate: 1,
                            title: 1,
                            detail: 1,
                            coverPageURL: 1,
                            s3CoverPageURL: 1,
                            userId: 1,
                            approved: 1,
                            closed: 1,
                            minSupport: 1,
                            countSupport: 1,
                            supportDaysRange: 1,
                            startSupportDatetime: 1,
                            endSupportDatetime: 1,
                            voteDaysRange: 1,
                            startVoteDatetime: 1,
                            endVoteDatetime: 1,
                            closeDate: 1,
                            status: 1,
                            type: 1,
                            hashTag: 1,
                            pin: 1,
                            showVoterName: 1,
                            showVoteResult: 1,
                            voted: 1,
                            page: 1,
                            user: 1,
                            service: 1,
                            hide: 1,
                            userSupport: {
                                $cond: [
                                    {
                                        $gt: [{ $size: '$userSupport' }, 0]
                                    },
                                    true,
                                    false
                                ]
                            },
                            myVotes: {
                                $cond: [
                                    {
                                        $gt: [{ $size: '$myVotes' }, 0]
                                    },
                                    true,
                                    false
                                ]
                            }
                        }
                    },
                    {
                        $skip: skips
                    },
                    {
                        $limit: take
                    }
                ]
            );
        }

        if (votingContentsRequest.myVote === true) {
            if (userObjId === undefined) {
                const errorResponse = ResponseUtil.getErrorResponse('User id is undefined.', undefined);
                return res.status(400).send(errorResponse);
            }

            myVote = await this.votingEventService.aggregate(
                [
                    {
                        $project: {
                            _id: 1,
                            createdDate: 1,
                            title: 1,
                            detail: 1,
                            assertId: 1,
                            coverPageURL: 1,
                            s3CoverPageURL: 1,
                            userId: 1,
                            approved: 1,
                            closed: 1,
                            minSupport: 1,
                            countSupport: 1,
                            supportDaysRange: 1,
                            startSupportDatetime: 1,
                            endSupportDatetime: 1,
                            voteDaysRange: 1,
                            startVoteDatetime: 1,
                            endVoteDatetime: 1,
                            approveDatetime: 1,
                            approveUsername: 1,
                            updateDatetime: 1,
                            closeDate: 1,
                            status: 1,
                            createAsPage: 1,
                            type: 1,
                            public: 1,
                            hashTag: 1,
                            pin: 1,
                            showVoterName: 1,
                            showVoteResult: 1,
                            voted: 1,
                            service: 1,
                            hide: 1,
                            createPage: {
                                $cond: [
                                    {
                                        $ne: ['$createAsPage', null]  // Check if 'showVoterName' is true
                                    },
                                    'Yes',
                                    'No',
                                ]
                            }
                        }
                    },
                    {
                        $facet: {
                            showVoterName: [
                                {
                                    $match: {
                                        createPage: 'Yes'
                                    },

                                },
                                {
                                    $lookup: {
                                        from: 'Page',
                                        let: { 'createAsPage': '$createAsPage' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $eq: ['$$createAsPage', '$_id']
                                                    }
                                                },
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    name: 1,
                                                    pageUsername: 1,
                                                    isOfficial: 1,
                                                    imageURL: 1,
                                                    s3ImageURL: 1,
                                                    banned: 1
                                                }
                                            }
                                        ],
                                        as: 'page'
                                    }
                                },
                                {
                                    $unwind: {
                                        path: '$page'
                                    }
                                }
                            ],
                            notShowVoterName: [
                                {
                                    $match: {
                                        createPage: 'No'
                                    }
                                },
                                {
                                    $lookup: {
                                        from: 'User',
                                        let: { userId: '$userId' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr:
                                                    {
                                                        $eq: ['$$userId', '$_id']
                                                    }
                                                }
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    firstName: 1,
                                                    lastName: 1,
                                                    imageURL: 1,
                                                    s3ImageURL: 1
                                                }
                                            }
                                        ],
                                        as: 'user'
                                    }
                                },
                                {
                                    $unwind: {
                                        path: '$user'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            combinedResults: {
                                $concatArrays: ['$showVoterName', '$notShowVoterName'],
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
                        $match: {
                            userId: userObjId,
                            title: exp,
                            hide: true
                        }
                    },
                    {
                        $sort: {
                            createdDate: -1
                        }
                    },
                    {
                        $lookup: {
                            from: 'UserSupport',
                            let: { 'id': '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr:
                                        {
                                            $eq: ['$$id', '$votingId']
                                        }
                                    }
                                },
                                {
                                    $match: { userId: userObjId }
                                }
                            ],
                            as: 'userSupport'
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            createdDate: 1,
                            title: 1,
                            detail: 1,
                            coverPageURL: 1,
                            s3CoverPageURL: 1,
                            userId: 1,
                            approved: 1,
                            closed: 1,
                            minSupport: 1,
                            countSupport: 1,
                            supportDaysRange: 1,
                            startSupportDatetime: 1,
                            endSupportDatetime: 1,
                            voteDaysRange: 1,
                            startVoteDatetime: 1,
                            endVoteDatetime: 1,
                            closeDate: 1,
                            status: 1,
                            type: 1,
                            hashTag: 1,
                            pin: 1,
                            showVoterName: 1,
                            showVoteResult: 1,
                            voted: 1,
                            page: 1,
                            user: 1,
                            service: 1,
                            hide: 1,
                            userSupport: {
                                $cond: [
                                    {
                                        $gt: [{ $size: '$userSupport' }, 0]
                                    },
                                    true,
                                    false
                                ]
                            }
                        }
                    },
                    {
                        $skip: skips
                    },
                    {
                        $limit: take
                    }
                ]
            );
            if (myVote !== undefined && myVote.length > 0) {
                for (const objMyVote of myVote) {
                    stackId.push(new ObjectID(objMyVote._id));
                }
            }
        }

        if (votingContentsRequest.supporter === true) {
            supporter = await this.votingEventService.aggregate(
                [
                    {
                        $project: {
                            _id: 1,
                            createdDate: 1,
                            title: 1,
                            detail: 1,
                            assertId: 1,
                            coverPageURL: 1,
                            s3CoverPageURL: 1,
                            userId: 1,
                            approved: 1,
                            closed: 1,
                            minSupport: 1,
                            countSupport: 1,
                            supportDaysRange: 1,
                            startSupportDatetime: 1,
                            endSupportDatetime: 1,
                            voteDaysRange: 1,
                            startVoteDatetime: 1,
                            endVoteDatetime: 1,
                            approveDatetime: 1,
                            approveUsername: 1,
                            updateDatetime: 1,
                            closeDate: 1,
                            status: 1,
                            createAsPage: 1,
                            type: 1,
                            public: 1,
                            hashTag: 1,
                            pin: 1,
                            showVoterName: 1,
                            showVoteResult: 1,
                            hide: 1,
                            voted: 1,
                            service: 1,
                            createPage: {
                                $cond: [
                                    {
                                        $ne: ['$createAsPage', null]  // Check if 'showVoterName' is true
                                    },
                                    'Yes',
                                    'No',
                                ]
                            }
                        }
                    },
                    {
                        $facet: {
                            showVoterName: [
                                {
                                    $match: {
                                        createPage: 'Yes'
                                    },

                                },
                                {
                                    $lookup: {
                                        from: 'Page',
                                        let: { 'createAsPage': '$createAsPage' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $eq: ['$$createAsPage', '$_id']
                                                    }
                                                },
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    name: 1,
                                                    pageUsername: 1,
                                                    isOfficial: 1,
                                                    imageURL: 1,
                                                    s3ImageURL: 1,
                                                    banned: 1
                                                }
                                            }
                                        ],
                                        as: 'page'
                                    }
                                },
                                {
                                    $unwind: {
                                        path: '$page'
                                    }
                                }
                            ],
                            notShowVoterName: [
                                {
                                    $match: {
                                        createPage: 'No'
                                    }
                                },
                                {
                                    $lookup: {
                                        from: 'User',
                                        let: { userId: '$userId' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr:
                                                    {
                                                        $eq: ['$$userId', '$_id']
                                                    }
                                                }
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    firstName: 1,
                                                    lastName: 1,
                                                    imageURL: 1,
                                                    s3ImageURL: 1
                                                }
                                            }
                                        ],
                                        as: 'user'
                                    }
                                },
                                {
                                    $unwind: {
                                        path: '$user'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            combinedResults: {
                                $concatArrays: ['$showVoterName', '$notShowVoterName'],
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
                        $match: {
                            pin: false,
                            status: 'support',
                            title: exp
                        }
                    },
                    {
                        $sort: {
                            createdDate: -1
                        }
                    },
                    {
                        $lookup: {
                            from: 'UserSupport',
                            let: { 'id': '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr:
                                        {
                                            $eq: ['$$id', '$votingId']
                                        }
                                    }
                                },
                                {
                                    $match: { userId: userObjId }
                                }
                            ],
                            as: 'userSupport'
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            createdDate: 1,
                            title: 1,
                            detail: 1,
                            coverPageURL: 1,
                            s3CoverPageURL: 1,
                            userId: 1,
                            approved: 1,
                            closed: 1,
                            minSupport: 1,
                            countSupport: 1,
                            supportDaysRange: 1,
                            startSupportDatetime: 1,
                            endSupportDatetime: 1,
                            voteDaysRange: 1,
                            startVoteDatetime: 1,
                            endVoteDatetime: 1,
                            closeDate: 1,
                            status: 1,
                            type: 1,
                            hashTag: 1,
                            pin: 1,
                            showVoterName: 1,
                            showVoteResult: 1,
                            voted: 1,
                            page: 1,
                            user: 1,
                            service: 1,
                            hide: 1,
                            userSupport: {
                                $cond: [
                                    {
                                        $gt: [{ $size: '$userSupport' }, 0]
                                    },
                                    true,
                                    false
                                ]
                            }
                        }
                    },
                    {
                        $skip: skips
                    },
                    {
                        $limit: take
                    }
                ]
            );
        }

        const today = moment().toDate();
        if (votingContentsRequest.closeVote === true) {
            let closetVoteValue = DEFAULT_CLOSET_VOTE;
            const configClosetVote = await this.configService.getConfig(CLOSET_VOTE);
            if (configClosetVote) {
                closetVoteValue = parseInt(configClosetVote.value, 10);
            }

            const closetValue = (24 * closetVoteValue) * 60 * 60 * 1000; // one day in milliseconds
            const dateNow = new Date(today.getTime() + closetValue);
            closeVote = await this.votingEventService.aggregate(
                [
                    {
                        $project: {
                            _id: 1,
                            createdDate: 1,
                            title: 1,
                            detail: 1,
                            assertId: 1,
                            coverPageURL: 1,
                            s3CoverPageURL: 1,
                            userId: 1,
                            approved: 1,
                            closed: 1,
                            minSupport: 1,
                            countSupport: 1,
                            supportDaysRange: 1,
                            startSupportDatetime: 1,
                            endSupportDatetime: 1,
                            voteDaysRange: 1,
                            startVoteDatetime: 1,
                            endVoteDatetime: 1,
                            approveDatetime: 1,
                            approveUsername: 1,
                            updateDatetime: 1,
                            closeDate: 1,
                            status: 1,
                            createAsPage: 1,
                            type: 1,
                            public: 1,
                            hashTag: 1,
                            pin: 1,
                            showVoterName: 1,
                            showVoteResult: 1,
                            hide: 1,
                            voted: 1,
                            service: 1,
                            createPage: {
                                $cond: [
                                    {
                                        $ne: ['$createAsPage', null]  // Check if 'showVoterName' is true
                                    },
                                    'Yes',
                                    'No',
                                ]
                            }
                        }
                    },
                    {
                        $facet: {
                            showVoterName: [
                                {
                                    $match: {
                                        createPage: 'Yes'
                                    },

                                },
                                {
                                    $lookup: {
                                        from: 'Page',
                                        let: { 'createAsPage': '$createAsPage' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $eq: ['$$createAsPage', '$_id']
                                                    }
                                                },
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    name: 1,
                                                    pageUsername: 1,
                                                    isOfficial: 1,
                                                    imageURL: 1,
                                                    s3ImageURL: 1,
                                                    banned: 1
                                                }
                                            }
                                        ],
                                        as: 'page'
                                    }
                                },
                                {
                                    $unwind: {
                                        path: '$page'
                                    }
                                }
                            ],
                            notShowVoterName: [
                                {
                                    $match: {
                                        createPage: 'No'
                                    }
                                },
                                {
                                    $lookup: {
                                        from: 'User',
                                        let: { userId: '$userId' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr:
                                                    {
                                                        $eq: ['$$userId', '$_id']
                                                    }
                                                }
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    firstName: 1,
                                                    lastName: 1,
                                                    imageURL: 1,
                                                    s3ImageURL: 1
                                                }
                                            }
                                        ],
                                        as: 'user'
                                    }
                                },
                                {
                                    $unwind: {
                                        path: '$user'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            combinedResults: {
                                $concatArrays: ['$showVoterName', '$notShowVoterName'],
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
                        $match: {
                            endVoteDatetime: { $gte: today, $lte: dateNow },
                            approved: true,
                            closed: false,
                            title: exp,
                            pin: false,
                            hide: true,
                            _id: { $nin: stackId }
                        }
                    },
                    {
                        $sort: {
                            createdDate: -1
                        }
                    },
                    {
                        $lookup: {
                            from: 'UserSupport',
                            let: { 'id': '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr:
                                        {
                                            $eq: ['$$id', '$votingId']
                                        }
                                    }
                                },
                                {
                                    $match: { userId: userObjId }
                                }
                            ],
                            as: 'userSupport'
                        }
                    },
                    {
                        $lookup: {
                            from: 'Voted',
                            let: { 'id': '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $eq: ['$$id', '$votingId']
                                        }
                                    }
                                },
                                {
                                    $match: {
                                        userId: userObjId
                                    }
                                }
                            ],
                            as: 'myVotes'
                        }
                    },
                    {
                        $lookup: {
                            from: 'Voted',
                            let: { 'id': '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $eq: ['$$id', '$votingId']
                                        }
                                    }
                                },
                                {
                                    $match: {
                                        userId: userObjId
                                    }
                                }
                            ],
                            as: 'myVotes'
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            createdDate: 1,
                            title: 1,
                            detail: 1,
                            coverPageURL: 1,
                            s3CoverPageURL: 1,
                            userId: 1,
                            approved: 1,
                            closed: 1,
                            minSupport: 1,
                            countSupport: 1,
                            supportDaysRange: 1,
                            startSupportDatetime: 1,
                            endSupportDatetime: 1,
                            voteDaysRange: 1,
                            startVoteDatetime: 1,
                            endVoteDatetime: 1,
                            closeDate: 1,
                            status: 1,
                            type: 1,
                            hashTag: 1,
                            pin: 1,
                            showVoterName: 1,
                            showVoteResult: 1,
                            voted: 1,
                            page: 1,
                            user: 1,
                            service: 1,
                            hide: 1,
                            userSupport: {
                                $cond: [
                                    {
                                        $gt: [{ $size: '$userSupport' }, 0]
                                    },
                                    true,
                                    false
                                ]
                            },
                            myVotes: {
                                $cond: [
                                    {
                                        $gt: [{ $size: '$myVotes' }, 0]
                                    },
                                    true,
                                    false
                                ]
                            }
                        }
                    },
                    {
                        $skip: skips
                    },
                    {
                        $limit: take
                    }
                ]
            );
        }

        if (votingContentsRequest.hashTagVote === true) {
            const mfpHashTag = await this.configService.getConfig(MFPHASHTAG);
            const splitHashTag = mfpHashTag.value.split(',');
            hashTagVote = await this.votingEventService.aggregate(
                [
                    {
                        $match: {
                            hashTag: { $in: splitHashTag },
                        }
                    },
                    {
                        $match: {
                            hashTag: exp
                        }
                    },
                    {
                        $sort: {
                            createdDate: -1
                        }
                    },
                    {
                        $group: {
                            _id: '$hashTag',
                            count: { $sum: 1 },
                        }
                    },
                    {
                        $lookup: {
                            from: 'VotingEvent',
                            let: { 'id': '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $eq: ['$$id', '$hashTag']
                                        }
                                    }
                                },
                                {
                                    $project: {
                                        _id: 1,
                                        createdDate: 1,
                                        title: 1,
                                        detail: 1,
                                        assertId: 1,
                                        coverPageURL: 1,
                                        s3CoverPageURL: 1,
                                        userId: 1,
                                        approved: 1,
                                        closed: 1,
                                        minSupport: 1,
                                        countSupport: 1,
                                        supportDaysRange: 1,
                                        startSupportDatetime: 1,
                                        endSupportDatetime: 1,
                                        voteDaysRange: 1,
                                        startVoteDatetime: 1,
                                        endVoteDatetime: 1,
                                        approveDatetime: 1,
                                        approveUsername: 1,
                                        updateDatetime: 1,
                                        closeDate: 1,
                                        status: 1,
                                        createAsPage: 1,
                                        type: 1,
                                        public: 1,
                                        hashTag: 1,
                                        pin: 1,
                                        showVoterName: 1,
                                        showVoteResult: 1,
                                        hide: 1,
                                        voted: 1,
                                        service: 1,
                                        createPage: {
                                            $cond: [
                                                {
                                                    $ne: ['$createAsPage', null]  // Check if 'showVoterName' is true
                                                },
                                                'Yes',
                                                'No',
                                            ]
                                        }
                                    }
                                },
                                {
                                    $facet: {
                                        showVoterName: [
                                            {
                                                $match: {
                                                    createPage: 'Yes'
                                                },

                                            },
                                            {
                                                $lookup: {
                                                    from: 'Page',
                                                    let: { 'createAsPage': '$createAsPage' },
                                                    pipeline: [
                                                        {
                                                            $match: {
                                                                $expr: {
                                                                    $eq: ['$$createAsPage', '$_id']
                                                                }
                                                            },
                                                        },
                                                        {
                                                            $project: {
                                                                _id: 1,
                                                                name: 1,
                                                                pageUsername: 1,
                                                                isOfficial: 1,
                                                                imageURL: 1,
                                                                s3ImageURL: 1,
                                                                banned: 1
                                                            }
                                                        }
                                                    ],
                                                    as: 'page'
                                                }
                                            },
                                            {
                                                $unwind: {
                                                    path: '$page'
                                                }
                                            }
                                        ],
                                        notShowVoterName: [
                                            {
                                                $match: {
                                                    createPage: 'No'
                                                }
                                            },
                                            {
                                                $lookup: {
                                                    from: 'User',
                                                    let: { userId: '$userId' },
                                                    pipeline: [
                                                        {
                                                            $match: {
                                                                $expr:
                                                                {
                                                                    $eq: ['$$userId', '$_id']
                                                                }
                                                            }
                                                        },
                                                        {
                                                            $project: {
                                                                _id: 1,
                                                                firstName: 1,
                                                                lastName: 1,
                                                                imageURL: 1,
                                                                s3ImageURL: 1
                                                            }
                                                        }
                                                    ],
                                                    as: 'user'
                                                }
                                            },
                                            {
                                                $unwind: {
                                                    path: '$user'
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    $addFields: {
                                        combinedResults: {
                                            $concatArrays: ['$showVoterName', '$notShowVoterName'],
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
                                    $sort: {
                                        createdDate: -1
                                    }
                                },
                                {
                                    $lookup: {
                                        from: 'UserSupport',
                                        let: { 'id': '$_id' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr:
                                                    {
                                                        $eq: ['$$id', '$votingId']
                                                    }
                                                }
                                            },
                                            {
                                                $match: { userId: userObjId }
                                            }
                                        ],
                                        as: 'userSupport'
                                    }
                                },
                                {
                                    $lookup: {
                                        from: 'Voted',
                                        let: { id: '$_id' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr:
                                                    {
                                                        $eq: ['$$id', '$votingId']
                                                    }
                                                }
                                            },
                                            {
                                                $match: { userId: userObjId }
                                            }
                                        ],
                                        as: 'myVote'
                                    }
                                },
                                {
                                    $project: {
                                        _id: 1,
                                        createdDate: 1,
                                        title: 1,
                                        detail: 1,
                                        coverPageURL: 1,
                                        s3CoverPageURL: 1,
                                        userId: 1,
                                        approved: 1,
                                        closed: 1,
                                        minSupport: 1,
                                        countSupport: 1,
                                        supportDaysRange: 1,
                                        startSupportDatetime: 1,
                                        endSupportDatetime: 1,
                                        voteDaysRange: 1,
                                        startVoteDatetime: 1,
                                        endVoteDatetime: 1,
                                        closeDate: 1,
                                        status: 1,
                                        type: 1,
                                        hashTag: 1,
                                        pin: 1,
                                        showVoterName: 1,
                                        showVoteResult: 1,
                                        voted: 1,
                                        page: 1,
                                        user: 1,
                                        service: 1,
                                        hide: 1,
                                        myVote: {
                                            $cond: [
                                                {
                                                    $gt: [{ $size: '$myVote' }, 0]
                                                },
                                                true,
                                                false
                                            ]
                                        },
                                        userSupport: {
                                            $cond: [
                                                {
                                                    $gt: [{ $size: '$userSupport' }, 0]
                                                },
                                                true,
                                                false
                                            ]
                                        }
                                    }
                                },
                                {
                                    $match: {
                                        pin: false,
                                        hide: true,
                                        _id: { $nin: stackId }
                                    }
                                },
                                {
                                    $skip: skips
                                },
                                {
                                    $limit: take
                                }
                            ],
                            as: 'votingEvent'
                        }
                    }
                ]
            );
        }
        // DEFAULT_CLOSET_SUPPORT,
        // CLOSET_SUPPORT
        if (votingContentsRequest.closetSupport === true) {
            let closetSupport = DEFAULT_CLOSET_SUPPORT;
            const closetSupportConfig = await this.configService.getConfig(CLOSET_SUPPORT);

            if (closetSupportConfig) {
                closetSupport = parseInt(closetSupportConfig.value, 10);
            }
            const closetsup = (24 * closetSupport) * 60 * 60 * 1000; // one day in milliseconds
            const now = new Date(today.getTime() + closetsup);
            closetSupportAggr = await this.votingEventService.aggregate(
                [
                    {
                        $project: {
                            _id: 1,
                            createdDate: 1,
                            title: 1,
                            detail: 1,
                            assertId: 1,
                            coverPageURL: 1,
                            s3CoverPageURL: 1,
                            userId: 1,
                            approved: 1,
                            closed: 1,
                            minSupport: 1,
                            countSupport: 1,
                            supportDaysRange: 1,
                            startSupportDatetime: 1,
                            endSupportDatetime: 1,
                            voteDaysRange: 1,
                            startVoteDatetime: 1,
                            endVoteDatetime: 1,
                            approveDatetime: 1,
                            approveUsername: 1,
                            updateDatetime: 1,
                            closeDate: 1,
                            status: 1,
                            createAsPage: 1,
                            type: 1,
                            public: 1,
                            hashTag: 1,
                            pin: 1,
                            showVoterName: 1,
                            showVoteResult: 1,
                            hide: 1,
                            voted: 1,
                            service: 1,
                            createPage: {
                                $cond: [
                                    {
                                        $ne: ['$createAsPage', null]  // Check if 'showVoterName' is true
                                    },
                                    'Yes',
                                    'No',
                                ]
                            }
                        }
                    },
                    {
                        $facet: {
                            showVoterName: [
                                {
                                    $match: {
                                        createPage: 'Yes'
                                    },

                                },
                                {
                                    $lookup: {
                                        from: 'Page',
                                        let: { 'createAsPage': '$createAsPage' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $eq: ['$$createAsPage', '$_id']
                                                    }
                                                },
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    name: 1,
                                                    pageUsername: 1,
                                                    isOfficial: 1,
                                                    imageURL: 1,
                                                    s3ImageURL: 1,
                                                    banned: 1
                                                }
                                            }
                                        ],
                                        as: 'page'
                                    }
                                },
                                {
                                    $unwind: {
                                        path: '$page'
                                    }
                                }
                            ],
                            notShowVoterName: [
                                {
                                    $match: {
                                        createPage: 'No'
                                    }
                                },
                                {
                                    $lookup: {
                                        from: 'User',
                                        let: { userId: '$userId' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr:
                                                    {
                                                        $eq: ['$$userId', '$_id']
                                                    }
                                                }
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    firstName: 1,
                                                    lastName: 1,
                                                    imageURL: 1,
                                                    s3ImageURL: 1
                                                }
                                            }
                                        ],
                                        as: 'user'
                                    }
                                },
                                {
                                    $unwind: {
                                        path: '$user'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            combinedResults: {
                                $concatArrays: ['$showVoterName', '$notShowVoterName'],
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
                        $match: {
                            endSupportDatetime: { $gte: today, $lte: now },
                            closed: false,
                            status: 'support',
                            hide: true,
                            title: exp
                        }
                    },
                    {
                        $sort: {
                            createdDate: -1
                        }
                    },
                    {
                        $lookup: {
                            from: 'UserSupport',
                            let: { 'id': '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr:
                                        {
                                            $eq: ['$$id', '$votingId']
                                        }
                                    }
                                },
                                {
                                    $match: { userId: userObjId }
                                }
                            ],
                            as: 'userSupport'
                        }
                    },
                    {
                        $lookup: {
                            from: 'Voted',
                            let: { 'id': '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $eq: ['$$id', '$votingId']
                                        }
                                    }
                                },
                                {
                                    $match: {
                                        userId: userObjId
                                    }
                                }
                            ],
                            as: 'myVotes'
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            createdDate: 1,
                            title: 1,
                            detail: 1,
                            coverPageURL: 1,
                            s3CoverPageURL: 1,
                            userId: 1,
                            approved: 1,
                            closed: 1,
                            minSupport: 1,
                            countSupport: 1,
                            supportDaysRange: 1,
                            startSupportDatetime: 1,
                            endSupportDatetime: 1,
                            voteDaysRange: 1,
                            startVoteDatetime: 1,
                            endVoteDatetime: 1,
                            closeDate: 1,
                            status: 1,
                            type: 1,
                            hashTag: 1,
                            pin: 1,
                            showVoterName: 1,
                            showVoteResult: 1,
                            voted: 1,
                            page: 1,
                            user: 1,
                            service: 1,
                            hide: 1,
                            userSupport: {
                                $cond: [
                                    {
                                        $gt: [{ $size: '$userSupport' }, 0]
                                    },
                                    true,
                                    false
                                ]
                            },
                            myVotes: {
                                $cond: [
                                    {
                                        $gt: [{ $size: '$myVotes' }, 0]
                                    },
                                    true,
                                    false
                                ]
                            }
                        }
                    },
                    {
                        $skip: skips
                    },
                    {
                        $limit: take
                    }
                ]
            );
        }
        // section อื่นๆ
        if (votingContentsRequest.generalSection === true) {
            // stackId need to be cached to better performance.
            // It Need more Instances to cache the data.
            if (pinned !== undefined && pinned.length > 0) {
                for (const pin of pinned) {
                    stackId.push(new ObjectID(pin._id));
                }
            }
            if (supporter !== undefined && supporter.length > 0) {
                for (const ObjSupporter of supporter) {
                    stackId.push(new ObjectID(ObjSupporter._id));
                }
            }
            if (closeVote !== undefined && closeVote.length > 0) {
                for (const ObjcloseVote of closeVote) {
                    stackId.push(new ObjectID(ObjcloseVote._id));
                }
            }
            if (hashTagVote !== undefined && hashTagVote.length > 0) {
                for (const ObjHashTagVote of hashTagVote) {
                    const returnResult = await this.HashTagVoting(ObjHashTagVote);
                    stackId.concat(returnResult);
                }
            }
            if (closetSupportAggr !== undefined && closetSupportAggr.length > 0) {
                for (const ObjClosetSupportAggr of closetSupportAggr) {
                    stackId.push(new ObjectID(ObjClosetSupportAggr._id));
                }
            }
            if (votingContentsRequest.voteObjId !== undefined && votingContentsRequest.voteObjId.length > 0) {
                for (const voteIds of votingContentsRequest.voteObjId) {
                    stackId.push(new ObjectID(voteIds));
                }
            }
            // Votes Id.
            generalSection = await this.votingEventService.aggregate(
                [
                    {
                        $project: {
                            _id: 1,
                            createdDate: 1,
                            title: 1,
                            detail: 1,
                            assertId: 1,
                            coverPageURL: 1,
                            s3CoverPageURL: 1,
                            userId: 1,
                            approved: 1,
                            closed: 1,
                            minSupport: 1,
                            countSupport: 1,
                            supportDaysRange: 1,
                            startSupportDatetime: 1,
                            endSupportDatetime: 1,
                            voteDaysRange: 1,
                            startVoteDatetime: 1,
                            endVoteDatetime: 1,
                            approveDatetime: 1,
                            approveUsername: 1,
                            updateDatetime: 1,
                            closeDate: 1,
                            status: 1,
                            createAsPage: 1,
                            type: 1,
                            public: 1,
                            hashTag: 1,
                            pin: 1,
                            showVoterName: 1,
                            showVoteResult: 1,
                            hide: 1,
                            voted: 1,
                            service: 1,
                            createPage: {
                                $cond: [
                                    {
                                        $ne: ['$createAsPage', null]  // Check if 'showVoterName' is true
                                    },
                                    'Yes',
                                    'No',
                                ]
                            }
                        }
                    },
                    {
                        $facet: {
                            showVoterName: [
                                {
                                    $match: {
                                        createPage: 'Yes'
                                    },

                                },
                                {
                                    $lookup: {
                                        from: 'Page',
                                        let: { 'createAsPage': '$createAsPage' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $eq: ['$$createAsPage', '$_id']
                                                    }
                                                },
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    name: 1,
                                                    pageUsername: 1,
                                                    isOfficial: 1,
                                                    imageURL: 1,
                                                    s3ImageURL: 1,
                                                    banned: 1
                                                }
                                            }
                                        ],
                                        as: 'page'
                                    }
                                },
                                {
                                    $unwind: {
                                        path: '$page'
                                    }
                                }
                            ],
                            notShowVoterName: [
                                {
                                    $match: {
                                        createPage: 'No'
                                    }
                                },
                                {
                                    $lookup: {
                                        from: 'User',
                                        let: { userId: '$userId' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr:
                                                    {
                                                        $eq: ['$$userId', '$_id']
                                                    }
                                                }
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    firstName: 1,
                                                    lastName: 1,
                                                    imageURL: 1,
                                                    s3ImageURL: 1
                                                }
                                            }
                                        ],
                                        as: 'user'
                                    }
                                },
                                {
                                    $unwind: {
                                        path: '$user'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            combinedResults: {
                                $concatArrays: ['$showVoterName', '$notShowVoterName'],
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
                        $match: {
                            _id: { $nin: stackId },
                            hide: true,
                            title: exp
                        }
                    },
                    {
                        $sort: {
                            createdDate: -1
                        }
                    },
                    {
                        $lookup: {
                            from: 'UserSupport',
                            let: { 'id': '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr:
                                        {
                                            $eq: ['$$id', '$votingId']
                                        }
                                    }
                                },
                                {
                                    $match: { userId: userObjId }
                                }
                            ],
                            as: 'userSupport'
                        }
                    },
                    {
                        $lookup: {
                            from: 'Voted',
                            let: { 'id': '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $eq: ['$$id', '$votingId']
                                        }
                                    }
                                },
                                {
                                    $match: {
                                        userId: userObjId
                                    }
                                }
                            ],
                            as: 'myVotes'
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            createdDate: 1,
                            title: 1,
                            detail: 1,
                            coverPageURL: 1,
                            s3CoverPageURL: 1,
                            userId: 1,
                            approved: 1,
                            closed: 1,
                            minSupport: 1,
                            countSupport: 1,
                            supportDaysRange: 1,
                            startSupportDatetime: 1,
                            endSupportDatetime: 1,
                            voteDaysRange: 1,
                            startVoteDatetime: 1,
                            endVoteDatetime: 1,
                            closeDate: 1,
                            status: 1,
                            type: 1,
                            hashTag: 1,
                            pin: 1,
                            showVoterName: 1,
                            showVoteResult: 1,
                            voted: 1,
                            page: 1,
                            user: 1,
                            service: 1,
                            hide: 1,
                            userSupport: {
                                $cond: [
                                    {
                                        $gt: [{ $size: '$userSupport' }, 0]
                                    },
                                    true,
                                    false
                                ]
                            },
                            myVotes: {
                                $cond: [
                                    {
                                        $gt: [{ $size: '$myVotes' }, 0]
                                    },
                                    true,
                                    false
                                ]
                            }
                        }
                    },
                    {
                        $skip: skips
                    },
                    {
                        $limit: take
                    }
                ]
            );
        }
        let hashTagCount = 0;
        if (hashTagVote !== undefined && hashTagVote.length > 0) {
            for (const count of hashTagVote) {
                hashTagCount += count.votingEvent.length;
            }
        }

        const countRows: any = [{ 'count': 0 }];
        countRows[0].count += pinned ? pinned.length : 0;
        countRows[0].count += myVote ? myVote.length : 0;
        countRows[0].count += supporter ? supporter.length : 0;
        countRows[0].count += closeVote ? closeVote.length : 0;
        countRows[0].count += hashTagCount;

        // const pinTotalCount = await this.votingEventService.aggregate([{$match:{pin:true,hide:true}},{$count:'count'}]);
        // const myVoteTotalCount = await this.votingEventService.aggregate([{$match:{userId: userObjId,hide:true}},{$count:'count'}]);
        // pinned = pinned.length > 0 ? pinned.concat(pinTotalCount): [];
        // myVote = myVote.length > 0 ? myVote.concat(myVoteTotalCount): [];
        const result: any = {};
        result.pin = pinned;
        result.myVote = myVote;
        result.supporter = supporter;
        result.closeDate = closeVote;
        result.hashTagVote = hashTagVote;
        result.closetSupport = closetSupportAggr;
        result.generalSection = generalSection;
        result.voteObjId = stackId;
        const successResponse = ResponseUtil.getSuccessResponse('Search lists any vote is succesful.', result, countRows[0].count);
        return res.status(200).send(successResponse);
    }

    // hashTag/search
    @Post('/hashtag/search')
    public async VotinghashTagSearch(@Body({ validate: true }) votingContentsRequest: VotingContentsRequest, @Res() res: any, @Req() req: any): Promise<any> {
        const userObjId = req.headers.userid ? new ObjectID(req.headers.userid) : undefined;
        const keywords = votingContentsRequest.keyword;
        const exp = { $regex: '.*' + keywords + '.*', $options: 'si' };
        const take = votingContentsRequest.limit ? votingContentsRequest.limit : 10;
        const skips = votingContentsRequest.offset ? votingContentsRequest.offset : 0;

        const hashTagVote: any = await this.votingEventService.aggregate(
            [
                {
                    $match: {
                        hashTag: exp
                    }
                },
                {
                    $sort: {
                        createdDate: -1
                    }
                },
                {
                    $group: {
                        _id: '$hashTag',
                        count: { $sum: 1 },
                    }
                },
                {
                    $lookup: {
                        from: 'VotingEvent',
                        let: { 'id': '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$$id', '$hashTag']
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    createdDate: 1,
                                    title: 1,
                                    detail: 1,
                                    assertId: 1,
                                    coverPageURL: 1,
                                    s3CoverPageURL: 1,
                                    userId: 1,
                                    approved: 1,
                                    closed: 1,
                                    minSupport: 1,
                                    countSupport: 1,
                                    supportDaysRange: 1,
                                    startSupportDatetime: 1,
                                    endSupportDatetime: 1,
                                    voteDaysRange: 1,
                                    startVoteDatetime: 1,
                                    endVoteDatetime: 1,
                                    approveDatetime: 1,
                                    approveUsername: 1,
                                    updateDatetime: 1,
                                    closeDate: 1,
                                    status: 1,
                                    createAsPage: 1,
                                    type: 1,
                                    public: 1,
                                    hashTag: 1,
                                    pin: 1,
                                    showVoterName: 1,
                                    showVoteResult: 1,
                                    hide: 1,
                                    voted: 1,
                                    service: 1,
                                    createPage: {
                                        $cond: [
                                            {
                                                $ne: ['$createAsPage', null]  // Check if 'showVoterName' is true
                                            },
                                            'Yes',
                                            'No',
                                        ]
                                    }
                                }
                            },
                            {
                                $facet: {
                                    showVoterName: [
                                        {
                                            $match: {
                                                createPage: 'Yes'
                                            },

                                        },
                                        {
                                            $lookup: {
                                                from: 'Page',
                                                let: { 'createAsPage': '$createAsPage' },
                                                pipeline: [
                                                    {
                                                        $match: {
                                                            $expr: {
                                                                $eq: ['$$createAsPage', '$_id']
                                                            }
                                                        },
                                                    },
                                                    {
                                                        $project: {
                                                            _id: 1,
                                                            name: 1,
                                                            pageUsername: 1,
                                                            isOfficial: 1,
                                                            imageURL: 1,
                                                            s3ImageURL: 1,
                                                            banned: 1
                                                        }
                                                    }
                                                ],
                                                as: 'page'
                                            }
                                        },
                                        {
                                            $unwind: {
                                                path: '$page'
                                            }
                                        }
                                    ],
                                    notShowVoterName: [
                                        {
                                            $match: {
                                                createPage: 'No'
                                            }
                                        },
                                        {
                                            $lookup: {
                                                from: 'User',
                                                let: { userId: '$userId' },
                                                pipeline: [
                                                    {
                                                        $match: {
                                                            $expr:
                                                            {
                                                                $eq: ['$$userId', '$_id']
                                                            }
                                                        }
                                                    },
                                                    {
                                                        $project: {
                                                            _id: 1,
                                                            firstName: 1,
                                                            lastName: 1,
                                                            imageURL: 1,
                                                            s3ImageURL: 1
                                                        }
                                                    }
                                                ],
                                                as: 'user'
                                            }
                                        },
                                        {
                                            $unwind: {
                                                path: '$user'
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                $addFields: {
                                    combinedResults: {
                                        $concatArrays: ['$showVoterName', '$notShowVoterName'],
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
                                $sort: {
                                    createdDate: -1
                                }
                            },
                            {
                                $lookup: {
                                    from: 'UserSupport',
                                    let: { 'id': '$_id' },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr:
                                                {
                                                    $eq: ['$$id', '$votingId']
                                                }
                                            }
                                        },
                                        {
                                            $match: { userId: userObjId }
                                        }
                                    ],
                                    as: 'userSupport'
                                }
                            },
                            {
                                $lookup: {
                                    from: 'Voted',
                                    let: { id: '$_id' },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr:
                                                {
                                                    $eq: ['$$id', '$votingId']
                                                }
                                            }
                                        },
                                        {
                                            $match: { userId: userObjId }
                                        }
                                    ],
                                    as: 'myVote'
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    createdDate: 1,
                                    title: 1,
                                    detail: 1,
                                    coverPageURL: 1,
                                    s3CoverPageURL: 1,
                                    userId: 1,
                                    approved: 1,
                                    closed: 1,
                                    minSupport: 1,
                                    countSupport: 1,
                                    supportDaysRange: 1,
                                    startSupportDatetime: 1,
                                    endSupportDatetime: 1,
                                    voteDaysRange: 1,
                                    startVoteDatetime: 1,
                                    endVoteDatetime: 1,
                                    closeDate: 1,
                                    status: 1,
                                    type: 1,
                                    hashTag: 1,
                                    pin: 1,
                                    showVoterName: 1,
                                    showVoteResult: 1,
                                    voted: 1,
                                    page: 1,
                                    user: 1,
                                    service: 1,
                                    hide: 1,
                                    myVote: {
                                        $cond: [
                                            {
                                                $gt: [{ $size: '$myVote' }, 0]
                                            },
                                            true,
                                            false
                                        ]
                                    },
                                    userSupport: {
                                        $cond: [
                                            {
                                                $gt: [{ $size: '$userSupport' }, 0]
                                            },
                                            true,
                                            false
                                        ]
                                    }
                                }
                            },
                            {
                                $match: {
                                    pin: false,
                                    hide: true,
                                }
                            },
                            {
                                $skip: skips
                            },
                            {
                                $limit: take
                            }
                        ],
                        as: 'votingEvent'
                    }
                }
            ]
        );
        let hashTagCount = 0;
        if (hashTagVote !== undefined && hashTagVote.length > 0) {
            for (const count of hashTagVote) {
                hashTagCount += count.votingEvent.length;
            }
        }

        const countRows: any = [{ 'count': 0 }];
        countRows[0].count += hashTagCount;

        const result: any = {};
        result.hashTagVote = hashTagVote;

        const successResponse = ResponseUtil.getSuccessResponse('Search lists any vote is succesful.', result, countRows[0].count);
        return res.status(200).send(successResponse);
    }

    // voteChoice -> who votes
    @Post('/user/vote/:voteChoiceId')
    public async userVoteChoice(@Body({ validate: true }) search: FindVoteRequest, @Param('voteChoiceId') voteChoiceId: string, @Res() res: any, @Req() req: any): Promise<any> {
        if (ObjectUtil.isObjectEmpty(search)) {
            return res.status(200).send([]);
        }
        let filter: any = search.filter;
        if (filter === undefined) {
            filter = new SearchFilter();
        }
        const whereConditions: any = search.whereConditions;
        if (whereConditions.showVoterName === false) {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot get any users name.', undefined);
            return res.status(400).send(errorResponse);
        }

        const take = filter.limit ? filter.limit : 10;
        const offset = filter.offset ? filter.offset : 0;
        const objIds = new ObjectID(voteChoiceId);
        if (objIds === undefined && objIds === null) {
            const errorResponse = ResponseUtil.getErrorResponse('Vote Choice Id is undefined.', undefined);
            return res.status(400).send(errorResponse);
        }

        const voteChoice = await this.votedService.aggregate(
            [
                {
                    $match: {
                        voteChoiceId: objIds
                    }
                },
                {
                    $lookup: {
                        from: 'User',
                        let: { 'userId': '$userId' },
                        pipeline: [
                            {
                                $match: {
                                    $expr:
                                    {
                                        $eq: ['$$userId', '$_id']
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    firstName: 1,
                                    lastName: 1,
                                    displayName: 1,
                                    uniqueId: 1,
                                    imageURL: 1,
                                    s3ImageURL: 1
                                }
                            },
                            {
                                $limit: take
                            },
                            {
                                $skip: offset
                            }
                        ],
                        as: 'user'
                    }
                }
            ]
        );

        if (voteChoice.length > 0) {
            const successResponse = ResponseUtil.getSuccessResponse('Search lists any vote is succesful.', voteChoice);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot find any lists user.', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    // user vote type text
    @Post('/user/vote/text/:voteItemId')
    public async voteTypeText(@Body({ validate: true }) search: FindVoteRequest, @Param('voteItemId') voteItemId: string, @Res() res: any, @Req() req: any): Promise<any> {
        if (ObjectUtil.isObjectEmpty(search)) {
            return res.status(200).send([]);
        }
        let filter: any = search.filter;
        if (filter === undefined) {
            filter = new SearchFilter();
        }
        const whereConditions: any = search.whereConditions;
        if (whereConditions.showVoterName === false) {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot get any users name.', undefined);
            return res.status(400).send(errorResponse);
        }

        const take = filter.limit ? filter.limit : 10;
        const offset = filter.offset ? filter.offset : 0;
        const objIds = new ObjectID(voteItemId);
        if (objIds === undefined && objIds === null) {
            const errorResponse = ResponseUtil.getErrorResponse('Vote Item Id is undefined.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (whereConditions.voteChoice !== null) {
            const errorResponse = ResponseUtil.getErrorResponse('Search for a vote where the type is text and voteChoice is null.', undefined);
            return res.status(400).send(errorResponse);
        }

        const voteItem = await this.votedService.aggregate(
            [
                {
                    $match: {
                        voteItemId: objIds,
                        voteChoiceId: whereConditions.voteChoice
                    }
                },
                {
                    $lookup:{
                        from:'VotingEvent',
                        let: {'votingId': '$votingId'},
                        pipeline:[
                            {
                                $match:{
                                    $expr:
                                    {
                                        $eq:['$$votingId','$_id']
                                    }
                                }
                            },
                            {
                               $project:{
                                    showVoterName:1
                               } 
                            }
                        ],
                        as:'votingEvent'
                    }
                },
                {
                    $unwind:{
                        path: '$votingEvent'
                    }
                },
                {
                    $addFields:{
                        'showVoterName': '$votingEvent.showVoterName'
                    }
                },
                {
                    $project:{
                        _id:1,
                        createdBy:1,
                        createdDate:1,
                        createdTime:1,
                        createdByUsername:1,
                        updateDate:1,
                        updateByUsername:1,
                        id:1,
                        votingId:1,
                        userId:1,
                        pageId:1,
                        answer:1,
                        voteItemId:1,
                        voteChoiceId:1,
                        showVoterName:{
                            $cond:[
                                {
                                    $eq:['$showVoterName', true]
                                },
                                true,
                                false,
                            ]
                        }
                    }
                },
                {
                    $facet: {
                        showVoterName: [
                            {
                                $match: {
                                    showVoterName: true
                                },
                            },
                            {
                                $lookup: {
                                    from: 'User',
                                    let: { userId: '$userId' },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr:
                                                {
                                                    $eq: ['$$userId', '$_id']
                                                }
                                            }
                                        },
                                        {
                                            $project: {
                                                _id: 1,
                                                firstName: 1,
                                                lastName: 1,
                                                imageURL: 1,
                                                s3ImageURL: 1
                                            }
                                        }
                                    ],
                                    as: 'user'
                                }
                            },
                            {
                                $unwind: {
                                    path: '$user'
                                }
                            }
                        ],
                        notShowVoterName: [
                            {
                                $match: {
                                    showVoterName: false
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields: {
                        combinedResults: {
                            $concatArrays: ['$showVoterName', '$notShowVoterName'],
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
                    $sort: {
                        createdDate: -1
                    }
                },
                {
                    $skip: offset
                },
                {
                    $limit: take
                }
            ]
        );
        if (voteItem.length > 0) {
            const successResponse = ResponseUtil.getSuccessResponse('Search lists any vote is succesful.', voteItem);
            return res.status(200).send(successResponse);
        } else {
            const successResponse = ResponseUtil.getSuccessResponse('Search lists any vote is succesful.', []);
            return res.status(200).send(successResponse);
        }
    }

    @Post('/own/search/')
    @Authorized('user')
    public async searchVotedOwner(@Body({ validate: true }) votingContentsRequest: VotingContentsRequest, @Res() res: any, @Req() req: any): Promise<any> {
        const userObjId = new ObjectID(req.user.id);
        const keywords = votingContentsRequest.keyword;
        const exp = { $regex: '.*' + keywords + '.*', $options: 'si' };
        const take = votingContentsRequest.limit ? votingContentsRequest.limit : 10;
        const offset = votingContentsRequest.offset ? votingContentsRequest.offset : 0;
        let myVote: any = undefined;
        let myVoterSupport: any = undefined;
        let myVoted: any = undefined;
        let mySupported: any = undefined;

        if (votingContentsRequest.myVote === true) {
            myVote = await this.votingEventService.aggregate(
                [
                    {
                        $project: {
                            _id: 1,
                            createdDate: 1,
                            title: 1,
                            detail: 1,
                            assertId: 1,
                            coverPageURL: 1,
                            s3CoverPageURL: 1,
                            userId: 1,
                            approved: 1,
                            closed: 1,
                            minSupport: 1,
                            countSupport: 1,
                            supportDaysRange: 1,
                            startSupportDatetime: 1,
                            endSupportDatetime: 1,
                            voteDaysRange: 1,
                            startVoteDatetime: 1,
                            endVoteDatetime: 1,
                            approveDatetime: 1,
                            approveUsername: 1,
                            updateDatetime: 1,
                            closeDate: 1,
                            status: 1,
                            createAsPage: 1,
                            type: 1,
                            public: 1,
                            hashTag: 1,
                            pin: 1,
                            showVoterName: 1,
                            showVoteResult: 1,
                            hide: 1,
                            service: 1,
                            createPage: {
                                $cond: [
                                    {
                                        $ne: ['$createAsPage', null]  // Check if 'showVoterName' is true
                                    },
                                    'Yes',
                                    'No',
                                ]
                            }
                        }
                    },
                    {
                        $facet: {
                            showVoterName: [
                                {
                                    $match: {
                                        createPage: 'Yes'
                                    },

                                },
                                {
                                    $lookup: {
                                        from: 'Page',
                                        let: { 'createAsPage': '$createAsPage' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $eq: ['$$createAsPage', '$_id']
                                                    }
                                                },
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    name: 1,
                                                    pageUsername: 1,
                                                    isOfficial: 1,
                                                    imageURL: 1,
                                                    s3ImageURL: 1,
                                                    banned: 1
                                                }
                                            }
                                        ],
                                        as: 'page'
                                    }
                                },
                                {
                                    $unwind: {
                                        path: '$page'
                                    }
                                }
                            ],
                            notShowVoterName: [
                                {
                                    $match: {
                                        createPage: 'No'
                                    }
                                },
                                {
                                    $lookup: {
                                        from: 'User',
                                        let: { userId: '$userId' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr:
                                                    {
                                                        $eq: ['$$userId', '$_id']
                                                    }
                                                }
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    firstName: 1,
                                                    lastName: 1,
                                                    imageURL: 1,
                                                    s3ImageURL: 1
                                                }
                                            }
                                        ],
                                        as: 'user'
                                    }
                                },
                                {
                                    $unwind: {
                                        path: '$user'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            combinedResults: {
                                $concatArrays: ['$showVoterName', '$notShowVoterName'],
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
                        $lookup: {
                            from: 'UserSupport',
                            let: { 'id': '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr:
                                        {
                                            $eq: ['$$id', '$votingId']
                                        }
                                    }
                                },
                                {
                                    $match: { userId: userObjId }
                                }
                            ],
                            as: 'userSupport'
                        }
                    },
                    {
                        $lookup: {
                            from: 'Voted',
                            let: { 'id': '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $eq: ['$$id', '$votingId']
                                        }
                                    }
                                },
                                {
                                    $match: {
                                        userId: userObjId
                                    }
                                }
                            ],
                            as: 'myVotes'
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            createdDate: 1,
                            title: 1,
                            detail: 1,
                            coverPageURL: 1,
                            s3CoverPageURL: 1,
                            userId: 1,
                            approved: 1,
                            closed: 1,
                            minSupport: 1,
                            countSupport: 1,
                            supportDaysRange: 1,
                            startSupportDatetime: 1,
                            endSupportDatetime: 1,
                            voteDaysRange: 1,
                            startVoteDatetime: 1,
                            endVoteDatetime: 1,
                            closeDate: 1,
                            status: 1,
                            type: 1,
                            hashTag: 1,
                            pin: 1,
                            showVoterName: 1,
                            showVoteResult: 1,
                            voted: 1,
                            page: 1,
                            user: 1,
                            service: 1,
                            hide: 1,
                            userSupport: {
                                $cond: [
                                    {
                                        $gt: [{ $size: '$userSupport' }, 0]
                                    },
                                    true,
                                    false
                                ]
                            },
                            myVotes: {
                                $cond: [
                                    {
                                        $gt: [{ $size: '$myVotes' }, 0]
                                    },
                                    true,
                                    false
                                ]
                            }
                        }
                    },
                    {
                        $match: {
                            status: { $ne: 'support' },
                            userId: userObjId,
                            hide: true,
                            title: exp,

                        }
                    },
                    {
                        $sort: {
                            createdDate: -1
                        }
                    },
                    {
                        $skip: offset
                    },
                    {
                        $limit: take
                    }
                ]
            );
        }

        if (votingContentsRequest.myVoterSupport === true) {
            if (userObjId === undefined) {
                const errorResponse = ResponseUtil.getErrorResponse('User id is undefined.', undefined);
                return res.status(400).send(errorResponse);
            }

            myVoterSupport = await this.votingEventService.aggregate(
                [
                    {
                        $project: {
                            _id: 1,
                            createdDate: 1,
                            title: 1,
                            detail: 1,
                            assertId: 1,
                            coverPageURL: 1,
                            s3CoverPageURL: 1,
                            userId: 1,
                            approved: 1,
                            closed: 1,
                            minSupport: 1,
                            countSupport: 1,
                            supportDaysRange: 1,
                            startSupportDatetime: 1,
                            endSupportDatetime: 1,
                            voteDaysRange: 1,
                            startVoteDatetime: 1,
                            endVoteDatetime: 1,
                            approveDatetime: 1,
                            approveUsername: 1,
                            updateDatetime: 1,
                            closeDate: 1,
                            status: 1,
                            createAsPage: 1,
                            type: 1,
                            public: 1,
                            hashTag: 1,
                            pin: 1,
                            showVoterName: 1,
                            showVoteResult: 1,
                            service: 1,
                            createPage: {
                                $cond: [
                                    {
                                        $ne: ['$createAsPage', null]  // Check if 'showVoterName' is true
                                    },
                                    'Yes',
                                    'No',
                                ]
                            }
                        }
                    },
                    {
                        $facet: {
                            showVoterName: [
                                {
                                    $match: {
                                        createPage: 'Yes'
                                    },

                                },
                                {
                                    $lookup: {
                                        from: 'Page',
                                        let: { 'createAsPage': '$createAsPage' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $eq: ['$$createAsPage', '$_id']
                                                    }
                                                },
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    name: 1,
                                                    pageUsername: 1,
                                                    isOfficial: 1,
                                                    imageURL: 1,
                                                    s3ImageURL: 1,
                                                    banned: 1
                                                }
                                            }
                                        ],
                                        as: 'page'
                                    }
                                },
                                {
                                    $unwind: {
                                        path: '$page'
                                    }
                                }
                            ],
                            notShowVoterName: [
                                {
                                    $match: {
                                        createPage: 'No'
                                    }
                                },
                                {
                                    $lookup: {
                                        from: 'User',
                                        let: { userId: '$userId' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr:
                                                    {
                                                        $eq: ['$$userId', '$_id']
                                                    }
                                                }
                                            },
                                            {
                                                $project: {
                                                    _id: 1,
                                                    firstName: 1,
                                                    lastName: 1,
                                                    imageURL: 1,
                                                    s3ImageURL: 1
                                                }
                                            }
                                        ],
                                        as: 'user'
                                    }
                                },
                                {
                                    $unwind: {
                                        path: '$user'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            combinedResults: {
                                $concatArrays: ['$showVoterName', '$notShowVoterName'],
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
                        $lookup: {
                            from: 'UserSupport',
                            let: { 'id': '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr:
                                        {
                                            $eq: ['$$id', '$votingId']
                                        }
                                    }
                                },
                                {
                                    $match: { userId: userObjId }
                                }
                            ],
                            as: 'userSupport'
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            createdDate: 1,
                            title: 1,
                            detail: 1,
                            coverPageURL: 1,
                            s3CoverPageURL: 1,
                            userId: 1,
                            approved: 1,
                            closed: 1,
                            minSupport: 1,
                            countSupport: 1,
                            supportDaysRange: 1,
                            startSupportDatetime: 1,
                            endSupportDatetime: 1,
                            voteDaysRange: 1,
                            startVoteDatetime: 1,
                            endVoteDatetime: 1,
                            closeDate: 1,
                            status: 1,
                            type: 1,
                            hashTag: 1,
                            pin: 1,
                            showVoterName: 1,
                            showVoteResult: 1,
                            voted: 1,
                            page: 1,
                            user: 1,
                            service: 1,
                            hide: 1,
                            userSupport: {
                                $cond: [
                                    {
                                        $gt: [{ $size: '$userSupport' }, 0]
                                    },
                                    true,
                                    false
                                ]
                            }
                        }
                    },
                    {
                        $match: {
                            userId: userObjId,
                            hide: true,
                            status: 'support',
                            title: exp
                        }
                    },
                    {
                        $sort: {
                            createdDate: -1
                        }
                    },
                    {
                        $skip: offset
                    },
                    {
                        $limit: take
                    }
                ]
            );
        }

        if (votingContentsRequest.myVoted === true) {
            myVoted = await this.votedService.aggregate(
                [
                    {
                        $match: {
                            userId: userObjId,
                        }
                    },
                    {
                        $group: {
                            _id: '$votingId'
                        }
                    },
                    {
                        $lookup: {
                            from: 'VotingEvent',
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
                                    $match: {
                                        hide: true,
                                        title: exp
                                    }
                                },
                                {
                                    $project: {
                                        _id: 1,
                                        createdDate: 1,
                                        title: 1,
                                        detail: 1,
                                        assertId: 1,
                                        coverPageURL: 1,
                                        s3CoverPageURL: 1,
                                        userId: 1,
                                        approved: 1,
                                        closed: 1,
                                        minSupport: 1,
                                        countSupport: 1,
                                        supportDaysRange: 1,
                                        startSupportDatetime: 1,
                                        endSupportDatetime: 1,
                                        voteDaysRange: 1,
                                        startVoteDatetime: 1,
                                        endVoteDatetime: 1,
                                        approveDatetime: 1,
                                        approveUsername: 1,
                                        updateDatetime: 1,
                                        closeDate: 1,
                                        status: 1,
                                        createAsPage: 1,
                                        type: 1,
                                        public: 1,
                                        hashTag: 1,
                                        pin: 1,
                                        showVoterName: 1,
                                        showVoteResult: 1,
                                        service: 1,
                                        createPage: {
                                            $cond: [
                                                {
                                                    $ne: ['$createAsPage', null]  // Check if 'showVoterName' is true
                                                },
                                                'Yes',
                                                'No',
                                            ]
                                        }
                                    }
                                },
                                {
                                    $facet: {
                                        showVoterName: [
                                            {
                                                $match: {
                                                    createPage: 'Yes'
                                                },

                                            },
                                            {
                                                $lookup: {
                                                    from: 'Page',
                                                    let: { 'createAsPage': '$createAsPage' },
                                                    pipeline: [
                                                        {
                                                            $match: {
                                                                $expr: {
                                                                    $eq: ['$$createAsPage', '$_id']
                                                                }
                                                            },
                                                        },
                                                        {
                                                            $project: {
                                                                _id: 1,
                                                                name: 1,
                                                                pageUsername: 1,
                                                                isOfficial: 1,
                                                                imageURL: 1,
                                                                s3ImageURL: 1,
                                                                banned: 1
                                                            }
                                                        }
                                                    ],
                                                    as: 'page'
                                                }
                                            },
                                            {
                                                $unwind: {
                                                    path: '$page'
                                                }
                                            }
                                        ],
                                        notShowVoterName: [
                                            {
                                                $match: {
                                                    createPage: 'No'
                                                }
                                            },
                                            {
                                                $lookup: {
                                                    from: 'User',
                                                    let: { userId: '$userId' },
                                                    pipeline: [
                                                        {
                                                            $match: {
                                                                $expr:
                                                                {
                                                                    $eq: ['$$userId', '$_id']
                                                                }
                                                            }
                                                        },
                                                        {
                                                            $project: {
                                                                _id: 1,
                                                                firstName: 1,
                                                                lastName: 1,
                                                                imageURL: 1,
                                                                s3ImageURL: 1
                                                            }
                                                        }
                                                    ],
                                                    as: 'user'
                                                }
                                            },
                                            {
                                                $unwind: {
                                                    path: '$user'
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    $addFields: {
                                        combinedResults: {
                                            $concatArrays: ['$showVoterName', '$notShowVoterName'],
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
                                    $lookup: {
                                        from: 'UserSupport',
                                        let: { 'id': '$_id' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr:
                                                    {
                                                        $eq: ['$$id', '$votingId']
                                                    }
                                                }
                                            },
                                            {
                                                $match: { userId: userObjId }
                                            }
                                        ],
                                        as: 'userSupport'
                                    }
                                },
                                {
                                    $project: {
                                        _id: 1,
                                        createdDate: 1,
                                        title: 1,
                                        detail: 1,
                                        coverPageURL: 1,
                                        s3CoverPageURL: 1,
                                        userId: 1,
                                        approved: 1,
                                        closed: 1,
                                        minSupport: 1,
                                        countSupport: 1,
                                        supportDaysRange: 1,
                                        startSupportDatetime: 1,
                                        endSupportDatetime: 1,
                                        voteDaysRange: 1,
                                        startVoteDatetime: 1,
                                        endVoteDatetime: 1,
                                        closeDate: 1,
                                        status: 1,
                                        type: 1,
                                        hashTag: 1,
                                        pin: 1,
                                        showVoterName: 1,
                                        showVoteResult: 1,
                                        voted: 1,
                                        page: 1,
                                        user: 1,
                                        service: 1,
                                        hide: 1,
                                        userSupport: {
                                            $cond: [
                                                {
                                                    $gt: [{ $size: '$userSupport' }, 0]
                                                },
                                                true,
                                                false
                                            ]
                                        }
                                    }
                                },
                            ],
                            as: 'votingEvent'
                        }
                    },
                    {
                        $unwind: {
                            path: '$votingEvent'
                        }
                    },
                    {
                        $skip: offset
                    },
                    {
                        $limit: take
                    }
                ]
            );
        }

        if (votingContentsRequest.mySupported === true) {
            mySupported = await this.userSupportService.aggregate(
                [
                    {
                        $match: {
                            userId: userObjId,
                        }
                    },
                    {
                        $lookup: {
                            from: 'VotingEvent',
                            let: { 'votingId': '$votingId' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $eq: ['$$votingId', '$_id']
                                        }
                                    }
                                },
                                {
                                    $match: {
                                        hide: true,
                                        title: exp
                                    }
                                },
                                {
                                    $project: {
                                        _id: 1,
                                        createdDate: 1,
                                        title: 1,
                                        detail: 1,
                                        assertId: 1,
                                        coverPageURL: 1,
                                        s3CoverPageURL: 1,
                                        userId: 1,
                                        approved: 1,
                                        closed: 1,
                                        minSupport: 1,
                                        countSupport: 1,
                                        supportDaysRange: 1,
                                        startSupportDatetime: 1,
                                        endSupportDatetime: 1,
                                        voteDaysRange: 1,
                                        startVoteDatetime: 1,
                                        endVoteDatetime: 1,
                                        approveDatetime: 1,
                                        approveUsername: 1,
                                        updateDatetime: 1,
                                        closeDate: 1,
                                        status: 1,
                                        createAsPage: 1,
                                        type: 1,
                                        public: 1,
                                        hashTag: 1,
                                        pin: 1,
                                        showVoterName: 1,
                                        showVoteResult: 1,
                                        service: 1,
                                        hide: 1,
                                        createPage: {
                                            $cond: [
                                                {
                                                    $ne: ['$createAsPage', null]  // Check if 'showVoterName' is true
                                                },
                                                'Yes',
                                                'No',
                                            ]
                                        }
                                    }
                                },
                                {
                                    $facet: {
                                        showVoterName: [
                                            {
                                                $match: {
                                                    createPage: 'Yes'
                                                },

                                            },
                                            {
                                                $lookup: {
                                                    from: 'Page',
                                                    let: { 'createAsPage': '$createAsPage' },
                                                    pipeline: [
                                                        {
                                                            $match: {
                                                                $expr: {
                                                                    $eq: ['$$createAsPage', '$_id']
                                                                }
                                                            },
                                                        },
                                                        {
                                                            $project: {
                                                                _id: 1,
                                                                name: 1,
                                                                pageUsername: 1,
                                                                isOfficial: 1,
                                                                imageURL: 1,
                                                                s3ImageURL: 1,
                                                                banned: 1
                                                            }
                                                        }
                                                    ],
                                                    as: 'page'
                                                }
                                            },
                                            {
                                                $unwind: {
                                                    path: '$page'
                                                }
                                            }
                                        ],
                                        notShowVoterName: [
                                            {
                                                $match: {
                                                    createPage: 'No'
                                                }
                                            },
                                            {
                                                $lookup: {
                                                    from: 'User',
                                                    let: { userId: '$userId' },
                                                    pipeline: [
                                                        {
                                                            $match: {
                                                                $expr:
                                                                {
                                                                    $eq: ['$$userId', '$_id']
                                                                }
                                                            }
                                                        },
                                                        {
                                                            $project: {
                                                                _id: 1,
                                                                firstName: 1,
                                                                lastName: 1,
                                                                imageURL: 1,
                                                                s3ImageURL: 1
                                                            }
                                                        }
                                                    ],
                                                    as: 'user'
                                                }
                                            },
                                            {
                                                $unwind: {
                                                    path: '$user'
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    $addFields: {
                                        combinedResults: {
                                            $concatArrays: ['$showVoterName', '$notShowVoterName'],
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
                                    $lookup: {
                                        from: 'UserSupport',
                                        let: { 'id': '$_id' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr:
                                                    {
                                                        $eq: ['$$id', '$votingId']
                                                    }
                                                }
                                            },
                                            {
                                                $match: { userId: userObjId }
                                            }
                                        ],
                                        as: 'userSupport'
                                    }
                                },
                                {
                                    $project: {
                                        _id: 1,
                                        createdDate: 1,
                                        title: 1,
                                        detail: 1,
                                        coverPageURL: 1,
                                        s3CoverPageURL: 1,
                                        userId: 1,
                                        approved: 1,
                                        closed: 1,
                                        minSupport: 1,
                                        countSupport: 1,
                                        supportDaysRange: 1,
                                        startSupportDatetime: 1,
                                        endSupportDatetime: 1,
                                        voteDaysRange: 1,
                                        startVoteDatetime: 1,
                                        endVoteDatetime: 1,
                                        closeDate: 1,
                                        status: 1,
                                        type: 1,
                                        hashTag: 1,
                                        pin: 1,
                                        showVoterName: 1,
                                        showVoteResult: 1,
                                        voted: 1,
                                        page: 1,
                                        user: 1,
                                        service: 1,
                                        hide: 1,
                                        userSupport: {
                                            $cond: [
                                                {
                                                    $gt: [{ $size: '$userSupport' }, 0]
                                                },
                                                true,
                                                false
                                            ]
                                        }
                                    }
                                },
                            ],
                            as: 'votingEvent'
                        }
                    },
                    {
                        $unwind: {
                            path: '$votingEvent'
                        }
                    }
                ]
            );
        }

        const countRows: any = [{ 'count': 0 }];
        countRows[0].count += myVote ? myVote.length : 0;
        countRows[0].count += myVoterSupport ? myVoterSupport.length : 0;
        countRows[0].count += myVoted ? myVoted.length : 0;
        countRows[0].count += mySupported ? mySupported.length : 0;

        const result: any = {};
        result.myVote = myVote;
        result.myVoterSupport = myVoterSupport;
        result.myVoted = myVoted;
        result.mySupported = mySupported;

        const successResponse = ResponseUtil.getSuccessResponse('Search lists any vote is succesful.', result, countRows[0].count);
        return res.status(200).send(successResponse);
    }

    // ใกล้ปิด vote
    @Post('/closet/search')
    public async closetEndVote(@Body({ validate: true }) search: FindVoteRequest, @Res() res: any, @Req() req: any): Promise<any> {
        if (ObjectUtil.isObjectEmpty(search)) {
            return res.status(200).send([]);
        }
        const whereConditions = search.whereConditions;
        let filter: any = search.filter;
        if (filter === undefined) {
            filter = new SearchFilter();
        }
        const keywords = search.keyword;
        const exp = { $regex: '.*' + keywords + '.*', $options: 'si' };
        const take = filter.limit ? filter.limit : 10;
        const offset = filter.offset ? filter.offset : 0;
        const matchVoteEvent: any = {};

        if (whereConditions.approved !== undefined && whereConditions.approved !== null) {
            matchVoteEvent.approved = whereConditions.approved;
        }

        if (whereConditions.closed !== undefined && whereConditions.closed !== null) {
            matchVoteEvent.closed = whereConditions.closed;
        }

        if (whereConditions.status !== undefined && whereConditions.status !== null) {
            matchVoteEvent.status = whereConditions.status;
        }

        if (whereConditions.type !== undefined && whereConditions.type !== null) {
            matchVoteEvent.type = whereConditions.type;
        }

        if (whereConditions.pin !== undefined && whereConditions.pin !== null) {
            matchVoteEvent.pin = whereConditions.pin;
        }

        if (whereConditions.showed !== undefined && whereConditions.showed !== null) {
            matchVoteEvent.showVoteResult = whereConditions.showVoteResult;
        }

        if (keywords !== undefined && keywords !== null && keywords !== '') {
            matchVoteEvent.title = exp;
        }

        matchVoteEvent.hide = true;

        const voteEventAggr: any = await this.votingEventService.aggregate(
            [
                {
                    $project: {
                        _id: 1,
                        createdDate: 1,
                        title: 1,
                        detail: 1,
                        assertId: 1,
                        coverPageURL: 1,
                        s3CoverPageURL: 1,
                        userId: 1,
                        approved: 1,
                        closed: 1,
                        minSupport: 1,
                        countSupport: 1,
                        supportDaysRange: 1,
                        startSupportDatetime: 1,
                        endSupportDatetime: 1,
                        voteDaysRange: 1,
                        startVoteDatetime: 1,
                        endVoteDatetime: 1,
                        approveDatetime: 1,
                        approveUsername: 1,
                        updateDatetime: 1,
                        status: 1,
                        createAsPage: 1,
                        type: 1,
                        public: 1,
                        pin: 1,
                        showVoterName: 1,
                        showVoteResult: 1,
                        service: 1,
                        checkListName: {
                            $cond: [
                                {
                                    $eq: ['$showVoterName', true]  // Check if 'showVoterName' is true
                                },
                                'Yes',
                                'No'
                            ]
                        }
                    }
                },
                {
                    $facet: {
                        showVoterName: [
                            {
                                $match: {
                                    checkListName: 'Yes'
                                }
                            },
                            {
                                $lookup: {
                                    from: 'Voted',
                                    let: { 'id': '$_id' },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $eq: ['$$id', '$votingId']
                                                }
                                            },

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
                                                        },
                                                    },
                                                    {
                                                        $project: {
                                                            _id: 1,
                                                            firstName: 1,
                                                            lastName: 1,
                                                            imageURL: 1,
                                                            s3ImageURL: 1
                                                        }
                                                    }
                                                ],
                                                as: 'user'
                                            }
                                        },
                                        {
                                            $unwind: {
                                                path: '$user'
                                            }
                                        }
                                    ],
                                    as: 'voted'
                                }
                            },
                        ],
                        notShowVoterName: [
                            {
                                $match: {
                                    checkListName: 'No'
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields: {
                        combinedResults: {
                            $concatArrays: ['$showVoterName', '$notShowVoterName'],
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
                    $project: {
                        _id: 1,
                        createdDate: 1,
                        title: 1,
                        detail: 1,
                        assertId: 1,
                        coverPageURL: 1,
                        s3CoverPageURL: 1,
                        userId: 1,
                        approved: 1,
                        closed: 1,
                        minSupport: 1,
                        countSupport: 1,
                        supportDaysRange: 1,
                        startSupportDatetime: 1,
                        endSupportDatetime: 1,
                        voteDaysRange: 1,
                        startVoteDatetime: 1,
                        endVoteDatetime: 1,
                        approveDatetime: 1,
                        approveUsername: 1,
                        updateDatetime: 1,
                        status: 1,
                        createAsPage: 1,
                        type: 1,
                        public: 1,
                        pin: 1,
                        showVoterName: 1,
                        showVoteResult: 1,
                        voted: 1,
                        service: 1,
                        createPage: {
                            $cond: [
                                {
                                    $ne: ['$createAsPage', null]  // Check if 'showVoterName' is true
                                },
                                'Yes',
                                'No',
                            ]
                        }
                    }
                },
                {
                    $facet: {
                        showVoterName: [
                            {
                                $match: {
                                    createPage: 'Yes'
                                },

                            },
                            {
                                $lookup: {
                                    from: 'Page',
                                    let: { 'createAsPage': '$createAsPage' },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $eq: ['$$createAsPage', '$_id']
                                                }
                                            },
                                        },
                                        {
                                            $project: {
                                                _id: 1,
                                                name: 1,
                                                pageUsername: 1,
                                                isOfficial: 1,
                                                imageURL: 1,
                                                s3ImageURL: 1,
                                                banned: 1
                                            }
                                        }
                                    ],
                                    as: 'page'
                                }
                            },
                            {
                                $unwind: {
                                    path: '$page'
                                }
                            }
                        ],
                        notShowVoterName: [
                            {
                                $match: {
                                    createPage: 'No'
                                }
                            },
                            {
                                $lookup: {
                                    from: 'User',
                                    let: { userId: '$userId' },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr:
                                                {
                                                    $eq: ['$$userId', '$_id']
                                                }
                                            }
                                        },
                                        {
                                            $project: {
                                                _id: 1,
                                                firstName: 1,
                                                lastName: 1,
                                                imageURL: 1,
                                                s3ImageURL: 1
                                            }
                                        }
                                    ],
                                    as: 'user'
                                }
                            },
                            {
                                $unwind: {
                                    path: '$user'
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields: {
                        combinedResults: {
                            $concatArrays: ['$showVoterName', '$notShowVoterName'],
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
                    $project: {
                        _id: 1,
                        createdDate: 1,
                        title: 1,
                        detail: 1,
                        coverPageURL: 1,
                        s3CoverPageURL: 1,
                        userId: 1,
                        approved: 1,
                        closed: 1,
                        minSupport: 1,
                        countSupport: 1,
                        supportDaysRange: 1,
                        startSupportDatetime: 1,
                        endSupportDatetime: 1,
                        voteDaysRange: 1,
                        startVoteDatetime: 1,
                        endVoteDatetime: 1,
                        status: 1,
                        type: 1,
                        pin: 1,
                        showVoterName: 1,
                        showVoteResult: 1,
                        voted: 1,
                        page: 1,
                        user: 1,
                        service: 1,
                        hide: 1,
                    }
                },
                {
                    $match: matchVoteEvent
                },
                {
                    $sort: {
                        createdDate: -1
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

        let closetVoteValue = DEFAULT_CLOSET_VOTE;
        const configClosetVote = await this.configService.getConfig(CLOSET_VOTE);
        if (configClosetVote) {
            closetVoteValue = parseInt(configClosetVote.value, 10);
        }

        const response: any = [];
        const today = moment().toDate();
        const closetValue = (24 * closetVoteValue) * 60 * 60 * 1000; // one day in milliseconds
        const dateNow = new Date(today.getTime() + closetValue);
        for (const closetVote of voteEventAggr) {
            if (closetVote.endVoteDatetime !== null &&
                dateNow.getTime() > closetVote.endVoteDatetime.getTime() &&
                closetVote.closed === false
            ) {
                response.push(closetVote);
            } else {
                continue;
            }
        }

        if (response.length > 0) {
            const successResponse = ResponseUtil.getSuccessResponse('Search lists any vote is succesful.', response);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot find any lists vote.', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    // ดูว่าใครมากด vote .
    @Post('/votes/cast/search')
    @Authorized('user')
    public async searchVoteAction(@Body({ validate: true }) search: FindVoteRequest, @Res() res: any, @Req() req: any): Promise<any> {
        const userObjId = new ObjectID(req.user.id);
        if (ObjectUtil.isObjectEmpty(search)) {
            return res.status(200).send([]);
        }
        let filter: any = search.filter;
        if (filter === undefined) {
            filter = new SearchFilter();
        }
        const keywords = search.keyword;
        const exp = { $regex: '.*' + keywords + '.*', $options: 'si' };
        const take = filter.limit ? filter.limit : 10;
        const offset = filter.offset ? filter.offset : 0;
        const matchVoteEvent: any = {};

        if (userObjId !== undefined && userObjId !== null) {
            matchVoteEvent.userId = userObjId;
        }

        const voteAggr = await this.votedService.aggregate(
            [
                {
                    $match: matchVoteEvent
                },
                {
                    $lookup: {
                        from: 'VotingEvent',
                        let: { votingId: '$votingId' },
                        pipeline: [
                            {
                                $match: {
                                    $expr:
                                    {
                                        $eq: ['$$votingId', '$_id']
                                    }
                                }
                            },
                            {
                                $match: {
                                    hide: true,
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    createdDate: 1,
                                    title: 1,
                                    detail: 1,
                                    assertId: 1,
                                    coverPageURL: 1,
                                    s3CoverPageURL: 1,
                                    userId: 1,
                                    approved: 1,
                                    closed: 1,
                                    minSupport: 1,
                                    countSupport: 1,
                                    supportDaysRange: 1,
                                    startSupportDatetime: 1,
                                    endSupportDatetime: 1,
                                    voteDaysRange: 1,
                                    startVoteDatetime: 1,
                                    endVoteDatetime: 1,
                                    approveDatetime: 1,
                                    approveUsername: 1,
                                    updateDatetime: 1,
                                    status: 1,
                                    createAsPage: 1,
                                    type: 1,
                                    public: 1,
                                    pin: 1,
                                    showVoterName: 1,
                                    showVoteResult: 1,
                                    hide: 1,
                                    createPage: {
                                        $cond: [
                                            {
                                                $ne: ['$createAsPage', null]
                                            },
                                            'Yes',
                                            'No'
                                        ]
                                    }
                                }
                            },
                            {
                                $facet: {
                                    showVoterName: [
                                        {
                                            $match: {
                                                createPage: 'Yes'
                                            },

                                        },
                                        {
                                            $lookup: {
                                                from: 'Page',
                                                let: { 'createAsPage': '$createAsPage' },
                                                pipeline: [
                                                    {
                                                        $match: {
                                                            $expr: {
                                                                $eq: ['$$createAsPage', '$_id']
                                                            }
                                                        },
                                                    },
                                                    {
                                                        $project: {
                                                            _id: 1,
                                                            name: 1,
                                                            pageUsername: 1,
                                                            isOfficial: 1,
                                                            imageURL: 1,
                                                            s3ImageURL: 1,
                                                            banned: 1
                                                        }
                                                    }
                                                ],
                                                as: 'page'
                                            }
                                        },
                                        {
                                            $unwind: {
                                                path: '$page'
                                            }
                                        }
                                    ],
                                    notShowVoterName: [
                                        {
                                            $match: {
                                                createPage: 'No'
                                            }
                                        },
                                        {
                                            $lookup: {
                                                from: 'User',
                                                let: { userId: '$userId' },
                                                pipeline: [
                                                    {
                                                        $match: {
                                                            $expr:
                                                            {
                                                                $eq: ['$$userId', '$_id']
                                                            }
                                                        }
                                                    },
                                                    {
                                                        $project: {
                                                            _id: 1,
                                                            firstName: 1,
                                                            lastName: 1,
                                                            imageURL: 1,
                                                            s3ImageURL: 1
                                                        }
                                                    }
                                                ],
                                                as: 'user'
                                            }
                                        },
                                        {
                                            $unwind: {
                                                path: '$user'
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                $addFields: {
                                    combinedResults: {
                                        $concatArrays: ['$showVoterName', '$notShowVoterName'],
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
                                $project: {
                                    _id: 1,
                                    createdDate: 1,
                                    title: 1,
                                    detail: 1,
                                    coverPageURL: 1,
                                    s3CoverPageURL: 1,
                                    userId: 1,
                                    approved: 1,
                                    closed: 1,
                                    minSupport: 1,
                                    countSupport: 1,
                                    supportDaysRange: 1,
                                    startSupportDatetime: 1,
                                    endSupportDatetime: 1,
                                    voteDaysRange: 1,
                                    startVoteDatetime: 1,
                                    endVoteDatetime: 1,
                                    status: 1,
                                    type: 1,
                                    pin: 1,
                                    showVoterName: 1,
                                    showVoteResult: 1,
                                    hide: 1,
                                    voted: 1,
                                    page: 1,
                                    user: 1
                                }
                            },
                        ],
                        as: 'votingEvent'
                    }
                },
                {
                    $unwind: {
                        path: '$votingEvent',
                    },
                },
                {
                    $match: {
                        'votingEvent.title': exp
                    }
                },
                {
                    $sort: {
                        createdDate: -1
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
        if (voteAggr.length > 0) {
            const successResponse = ResponseUtil.getSuccessResponse('Votes cast in the past.', voteAggr);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Not found the votes.', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    // get Item
    @Get('/item/vote/:votingId')
    public async getItemVote(@Body({ validate: true }) search: FindVoteRequest, @Param('votingId') votingId: string, @QueryParam('limit') limit: number, @QueryParam('offset') offset: number, @Res() res: any, @Req() req: any): Promise<any> {
        const voteObjId = new ObjectID(votingId);

        const voteObj = await this.votingEventService.findOne({ _id: voteObjId });
        if (voteObj === undefined && voteObj === null) {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot find a vote.', undefined);
            return res.status(400).send(errorResponse);
        }
        let takeLimit = 0;
        let takeOffset = 0;

        const voteItemFind = await this.voteItemService.find({ votingId: voteObjId });

        if (limit !== undefined) {
            takeLimit = limit;
        }

        if (offset !== undefined) {
            takeOffset = offset;
        }

        if (limit === undefined) {
            takeLimit = voteItemFind.length;
        }

        const voteItem = await this.voteItemService.aggregate([
            {
                $match: {
                    votingId: voteObjId,
                },
            },
            {
                $project: {
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
                        $cond: [
                            {
                                $or: [
                                    { $eq: ['$type', 'single'] },
                                    { $eq: ['$type', 'multi'] }
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
                                    {
                                        $lookup: {
                                            from: 'Voted',
                                            let: { 'id': '$_id' },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr:
                                                        {
                                                            $eq: ['$$id', '$voteChoiceId']
                                                        }
                                                    }
                                                },
                                                {
                                                    $count: 'votedCount'
                                                }
                                            ],
                                            as: 'voted'
                                        }
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
                        },
                        {
                            $lookup: {
                                from: 'Voted',
                                let: { id: '$_id' },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $eq: ['$$id', '$voteItemId']
                                            }
                                        }
                                    },
                                    {
                                        $count: 'votedCount'
                                    }
                                ],
                                as: 'voted'
                            }
                        },
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
                $sort: {
                    ordering: 1
                }
            },
            {
                $skip: takeOffset
            },
            {
                $limit: takeLimit
            }
        ]);
        let voteEvent: any = undefined;
        if (voteObj.showVoterName === true) {
            voteEvent = await this.votedService.aggregate([
                {
                    $match: {
                        votingId: voteObjId
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
                    $unwind: {
                        path: '$user'
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
                    $unwind: {
                        path: '$user'
                    }
                },
                {
                    $project: {
                        user: 1
                    }
                }
            ]);
        }
        const voteCount = await this.votedService.aggregate(
            [
                {
                    $match: {
                        votingId: voteObjId
                    }
                },
                {
                    $group: {
                        _id: '$userId',
                        count: { $sum: 1 }
                    }
                }
            ]
        );
        const response: any = {
            'voteItem': {},
            'voted': {},
            'voteCount': {},
            'showVoterName': undefined,
        };
        response['voteItem'] = voteItem;
        response['voted'] = voteEvent ? voteEvent : [];
        response['voteCount'] = voteCount.length;
        response['showVoterName'] = voteObj.showVoterName;
        response['showVoteResult'] = voteObj.showVoteResult;

        if (response['voteItem'].length > 0) {
            const successResponse = ResponseUtil.getSuccessResponse('Get VoteItem is success.', response);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Not found Vote Item.', undefined);
            return res.status(400).send(errorResponse);
        }
    }
    @Get('/voted/own/:votingId')
    @Authorized('user')
    public async VotedOwn(@Param('votingId') votingId: string, @Res() res: any, @Req() req: any): Promise<any> {
        const userObjIds = new ObjectID(req.user.id);
        const voteObjId = new ObjectID(votingId);

        const user = await this.userService.findOne({ _id: userObjIds });
        if (user !== undefined && user !== null && user.banned === true) {
            const errorResponse = ResponseUtil.getErrorResponse('You have been banned.', undefined);
            return res.status(400).send(errorResponse);
        }
        if (user === undefined && user === null) {
            const errorResponse = ResponseUtil.getErrorResponse('Not found the user.', undefined);
            return res.status(400).send(errorResponse);
        }

        const voteObj = await this.votingEventService.findOne({ _id: voteObjId });
        if (voteObj === undefined && voteObj === null) {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot find a vote.', undefined);
            return res.status(400).send(errorResponse);
        }

        const voted = await this.votedService.find({ votingId: voteObjId, userId: userObjIds });
        if (voted.length > 0) {
            const successResponse = ResponseUtil.getSuccessResponse('Find any list votes is success.', voted);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot find any votes.', undefined);
            return res.status(400).send(errorResponse);
        }

    }

    // First
    @Put('/own/:votingId')
    @Authorized('user')
    public async updateVoteingEvent(@Body({ validate: true }) votingEventRequest: VotingEventRequest, @Param('votingId') votingId: string, @Res() res: any, @Req() req: any): Promise<any> {
        const userObjId = new ObjectID(req.user.id);
        const voteObjId = new ObjectID(votingId);
        const today = moment().toDate();
        // check exist?
        const user = await this.userService.findOne({ _id: userObjId });
        if (user !== undefined && user !== null && user.banned === true) {
            const errorResponse = ResponseUtil.getErrorResponse('You have been banned.', undefined);
            return res.status(400).send(errorResponse);
        }
        if (user === undefined && user === null) {
            const errorResponse = ResponseUtil.getErrorResponse('Not found the user.', undefined);
            return res.status(400).send(errorResponse);
        }
        const voteObj = await this.votingEventService.findOne({ _id: voteObjId, userId: userObjId });
        if (voteObj === undefined) {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot find a vote.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (voteObj.status === 'vote') {
            const errorResponse = ResponseUtil.getErrorResponse('Status is voted.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (voteObj.approved === true) {
            const errorResponse = ResponseUtil.getErrorResponse('The vote was approved.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (voteObj.closed === true) {
            const errorResponse = ResponseUtil.getErrorResponse('The vote was closed.', undefined);
            return res.status(400).send(errorResponse);
        }

        const regex = /[%^*+|~=`{}\[\]\/]/;
        const matchTitle = votingEventRequest.title.match(regex);
        if (matchTitle !== null && matchTitle.length > 0) {
            const errorResponse = ResponseUtil.getErrorResponse('Found special characters in title what you wrote.', matchTitle);
            return res.status(400).send(errorResponse);
        }

        const matchDetail = votingEventRequest.detail ? votingEventRequest.detail.match(regex) : null;

        if (matchDetail !== null && matchDetail.length > 0) {
            const errorResponse = ResponseUtil.getErrorResponse('Found special characters in detail what you wrote.', matchTitle);
            return res.status(400).send(errorResponse);
        }

        if (votingEventRequest.oldPictures.length > 0) {
            for (const assetId of votingEventRequest.oldPictures) {
                await this.assetService.update({ _id: new ObjectID(assetId) }, { $set: { expirationDate: today } });
            }
        }

        if (votingEventRequest.delete.length > 0) {
            for (const voteItem of votingEventRequest.delete) {
                await this.voteItemService.delete({ _id: new ObjectID(voteItem), votingId: voteObjId });
                await this.voteChoiceService.delete({ voteItem: new ObjectID(voteItem) });
            }
        }

        if (votingEventRequest.deleteChoices !== undefined &&
            votingEventRequest.deleteChoices.length > 0) {
            for (const voteChoice of votingEventRequest.deleteChoices) {
                await this.voteChoiceService.delete({ _id: new ObjectID(voteChoice) });
            }
        }

        let maxVoteChoices = DEFAULT_MAX_VOTE_CHOICES;
        let maxVote = DEFAULT_MAX_VOTE_QUESTIONS;

        const maxConfigVoteChoices = await this.configService.getConfig(MAX_VOTE_CHOICES);

        if (maxConfigVoteChoices) {
            maxVoteChoices = maxConfigVoteChoices.value;
        }

        const maxConfigVoteQuestion = await this.configService.getConfig(MAX_VOTE_QUESTIONS);
        if (maxConfigVoteQuestion) {
            maxVote = maxConfigVoteQuestion.value;
        }

        if (votingEventRequest.voteItem.length > maxVote) {
            const errorResponse = ResponseUtil.getErrorResponse('The number of VoteItem exceeds the maximum configured for VoteQuestion.', undefined);
            return res.status(400).send(errorResponse);
        }

        for (const voteItems of votingEventRequest.voteItem) {
            // check voteChoices
            const resultError = await this.CheckVoteChoices(voteItems, maxVoteChoices);
            if (resultError === 0) {
                const errorResponse = ResponseUtil.getErrorResponse('The number of VoteChoice exceeds the maximum configured for VoteChoice.', undefined);
                return res.status(400).send(errorResponse);
            }
        }

        let query: any;
        let newValues: any;
        // const objIds = [];
        if (votingEventRequest.voteItem.length > 0) {
            for (const [i, voteItem] of votingEventRequest.voteItem.entries()) {
                // objIds.push(new ObjectID(voteItem._id));

                // ไม่มี voteItem ต้องการสร้าง voteItem เพิ่ม และ สร้าง voteChoice
                // และ type เป็น single
                if (voteItem.typeChoice !== 'text' &&
                    voteItem.typeChoice !== 'multi' &&
                    voteItem.typeChoice === 'single'
                    && voteItem._id === undefined) {
                    // check ordering exists?
                    const voteItemEdit: any = new VoteItemModel();
                    voteItemEdit.votingId = voteObjId;
                    voteItemEdit.ordering = i + 1;
                    voteItemEdit.type = voteItem.typeChoice;
                    voteItemEdit.title = voteItem.title;
                    voteItemEdit.assetId = voteItem.assetId;
                    voteItemEdit.coverPageURL = voteItem.coverPageURL;
                    voteItemEdit.s3CoverPageURL = voteItem.s3coverPageURL;
                    const createVoteItem = await this.voteItemService.create(voteItemEdit);
                    if (voteItem.voteChoice.length > 0) {
                        if (createVoteItem) {
                            await this.FuncUpdateVoteChoice(createVoteItem, voteItem);
                        }
                    }
                }

                // ไม่มี voteItem ต้องการสร้าง voteItem เพิ่ม และ สร้าง voteChoice
                // และ type เป็น multi
                if (voteItem.typeChoice !== 'text' &&
                    voteItem.typeChoice === 'multi' &&
                    voteItem.typeChoice !== 'single'
                    && voteItem._id === undefined) {
                    // check ordering exists?
                    const voteItemEdit: any = new VoteItemModel();
                    voteItemEdit.votingId = voteObjId;
                    voteItemEdit.ordering = i + 1;
                    voteItemEdit.type = voteItem.typeChoice;
                    voteItemEdit.title = voteItem.title;
                    voteItemEdit.assetId = voteItem.assetId;
                    voteItemEdit.coverPageURL = voteItem.coverPageURL;
                    voteItemEdit.s3CoverPageURL = voteItem.s3coverPageURL;
                    const createVoteItem = await this.voteItemService.create(voteItemEdit);
                    if (voteItem.voteChoice.length > 0) {
                        if (createVoteItem) {
                            await this.FuncUpdateVoteChoice(createVoteItem, voteItem);
                        }
                    }
                }

                // สร้างเฉพาะ voteItem ที่เป็นแบบคำถาม
                if (voteItem.typeChoice === 'text' &&
                    voteItem.typeChoice !== 'multi' &&
                    voteItem.typeChoice !== 'single' &&
                    voteItem._id === undefined
                ) {
                    const voteItemEdit: any = new VoteItemModel();
                    voteItemEdit.votingId = voteObjId;
                    voteItemEdit.ordering = i + 1;
                    voteItemEdit.type = voteItem.typeChoice;
                    voteItemEdit.title = voteItem.title;
                    voteItemEdit.assetId = voteItem.assetId;
                    voteItemEdit.coverPageURL = voteItem.coverPageURL;
                    voteItemEdit.s3CoverPageURL = voteItem.s3coverPageURL;
                    await this.voteItemService.create(voteItemEdit);
                }

                // มี voteItem อยู่แล้ว และต้องการที่จะสร้างหรืออัพเดทเพิ่มจาก voteItem 
                // UpdateVoteChoice อัพเดท voteChoices
                // CreateVoteChoice สร้าง choice เพิ่ม
                if (voteItem._id !== undefined && voteItem.voteChoice.length > 0) {
                    const obJId = { 'id': voteItem._id };
                    await this.UpdateVoteChoice(voteItem);
                    await this.CreateVoteChoice(obJId, voteItem);
                    // ถ้าต้องการลบ voteChoice ออกไปด้วยใน array voteItem.voteChoice จะต้อง shift หรือ pop ออกมาแล้ว
                    // api ถึงจะ compare ได้ว่าตัวไหนหายไป
                }
                query = { _id: new ObjectID(voteItem._id), votingId: voteObjId };
                newValues = {
                    $set: {
                        ordering: i + 1,
                        title: voteItem.title,
                        coverPageURL: voteItem.coverPageURL,
                        s3CoverPageURL: voteItem.s3CoverPageURL,
                        assetId: voteItem.assetId,
                    }
                };
                await this.voteItemService.update(query, newValues);
            }
        }
        // console.log('objIds',objIds);

        query = { _id: voteObjId, userId: userObjId };
        newValues = {
            $set: {
                title: votingEventRequest.title,
                detail: votingEventRequest.detail,
                coverPageURL: votingEventRequest.coverPageURL,
                s3CoverPageURL: votingEventRequest.s3CoverPageURL,
                updateDatetime: today,
                type: votingEventRequest.type,
                hashTag: votingEventRequest.hashTag,
                voteDaysRange: votingEventRequest.voteDaysRange,
                showVoteResult: votingEventRequest.showVoteResult,
                showVoterName: votingEventRequest.showVoterName,
                service: votingEventRequest.service
            }
        };
        const update = await this.votingEventService.update(query, newValues);

        if (update) {
            const successResponse = ResponseUtil.getSuccessResponse('Update vote event is success.', undefined);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot update a VoteEvent.', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    // supported ???
    @Get('/get/support/:id')
    public async getSupport(@Body({ validate: true }) search: FindVoteRequest, @Param('id') id: string, @Res() res: any, @Req() req: any): Promise<any> {
        if (ObjectUtil.isObjectEmpty(search)) {
            return res.status(200).send([]);
        }

        const objIds = new ObjectID(id);
        if (objIds === undefined && objIds === null) {
            const errorResponse = ResponseUtil.getErrorResponse('Vote Id is undefined.', undefined);
            return res.status(400).send(errorResponse);
        }

        const getSupports = await this.userSupportService.aggregate(
            [
                {
                    $match: {
                        votingId: objIds,
                    }
                },
                {
                    $lookup: {
                        from: 'User',
                        let: { userId: '$userId' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$$userId', '$_id']
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    displayName: 1,
                                    firstName: 1,
                                    lastName: 1,
                                    imageURL: 1,
                                    s3ImageURL: 1
                                }
                            }
                        ],
                        as: 'user'
                    }
                },
                {
                    $sort: {
                        createdDate: -1
                    }
                },
                {
                    $project: {
                        _id: 0,
                        createdDate: 1,
                        user: 1
                    }
                },
                {
                    $unwind: {
                        path: '$user'
                    }
                },
                { $sample: { size: 5 } },
            ]
        );
        const countUser = await this.userSupportService.aggregate(
            [
                {
                    $match: {
                        votingId: objIds,
                    }
                },
                {
                    $count: 'count'
                }
            ]
        );
        const response: any = {
            'userSupport': {},
            'count': null,
        };
        response['userSupport'] = getSupports;
        response['count'] = countUser[0] ? countUser[0].count : 0;
        const successResponse = ResponseUtil.getSuccessResponse('Search lists any user support is succesful.', response);
        return res.status(200).send(successResponse);
    }

    @Delete('/own/:votingId')
    @Authorized('user')
    public async deleteVoteingEvent(@Param('votingId') votingId: string, @Res() res: any, @Req() req: any): Promise<any> {
        const userObjId = new ObjectID(req.user.id);
        const voteObjId = new ObjectID(votingId);

        // check exist?
        const voteObj = await this.votingEventService.findOne({ _id: voteObjId, userId: userObjId });
        if (voteObj === undefined) {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot find a vote.', undefined);
            return res.status(400).send(errorResponse);
        }
        const today = moment().toDate();

        const voteItemObj = await this.voteItemService.findOne({ votingId: voteObj.id });
        const voteItems = await this.voteItemService.find({ votingId: voteObj.id });
        if (voteItems.length > 0) {
            await this.assetService.update({ _id: new ObjectID(voteObj.assetId) }, { $set: { expirationDate: today } });
            for (const voteItem of voteItems) {
                if (voteItem !== undefined && voteItem.assetId !== undefined) {
                    await this.assetService.update({ _id: voteItem.assetId }, { $set: { expirationDate: today } });
                }
                const voteChoiceList = await this.voteChoiceService.findOne({ voteItemId: voteItem.id });
                if (voteChoiceList !== undefined && voteChoiceList.assetId) {
                    await this.assetService.update({ _id: voteChoiceList.assetId }, { $set: { expirationDate: today } });
                }
            }
        }

        const deleteVoteEvent = await this.votingEventService.delete({ _id: voteObjId, userId: userObjId });
        const deleteVoteItem = await this.voteItemService.deleteMany({ votingId: voteObj.id });
        if (voteItemObj !== undefined && voteItemObj !== null) {
            await this.voteChoiceService.deleteMany({ voteItemId: voteItemObj.id });
        }
        const deleteVoted = await this.votedService.deleteMany({ votingId: voteObj.id });
        const deleteUserSupport = await this.userSupportService.deleteMany({ votingId: voteObj.id });
        if (deleteVoteEvent &&
            deleteVoteItem &&
            deleteVoted &&
            deleteUserSupport
        ) {
            const successResponse = ResponseUtil.getSuccessResponse('delete vote event is success.', undefined);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot delete a VoteEvent.', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    @Delete('/own/item/:votingId/:voteItem')
    @Authorized('user')
    public async deleteVoteItem(@Param('votingId') votingId: string, @Param('voteItem') voteItem: string, @Res() res: any, @Req() req: any): Promise<any> {
        const userObjId = new ObjectID(req.user.id);
        const voteObjId = new ObjectID(votingId);
        const voteItemObjId = new ObjectID(voteItem);
        // check exist?

        const voteObj = await this.votingEventService.findOne({ _id: voteObjId, userId: userObjId });
        if (voteObj === undefined && voteObj === null) {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot find a vote.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (voteObj.approved === true) {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot Delete Item, the status is approved.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (voteObj.closed === true) {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot Delete Item, the status is closed.', undefined);
            return res.status(400).send(errorResponse);
        }
        const today = moment().toDate();

        const voteItemObj = await this.voteItemService.findOne({ _id: voteItemObjId, votingId: voteObj.id });
        const voteChoices = await this.voteChoiceService.find({ voteItemId: voteItemObj.id });
        if (voteChoices.length > 0) {
            for (const voteChoice of voteChoices) {
                await this.assetService.update({ _id: voteChoice.assetId }, { $set: { expirationDate: today } });
                await this.votedService.delete({ votingId: voteObj.id, voteItemId: voteItemObj.id, voteChoiceId: voteChoice.id });
            }
        }

        const deleteAsset = await this.assetService.update({ _id: voteItemObj.assetId }, { $set: { expirationDate: today } });
        const deleteVoteItem = await this.voteItemService.delete({ _id: voteItemObjId });
        const deleteVoteChoice = await this.voteChoiceService.deleteMany({ voteItemId: voteItemObjId });
        if (
            deleteVoteItem &&
            deleteAsset &&
            deleteVoteChoice
        ) {
            const successResponse = ResponseUtil.getSuccessResponse('Delete vote item is success.', undefined);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot delete a Vote imte.', undefined);
            return res.status(400).send(errorResponse);
        }
    }
    @Delete('/own/choice/:voteItem/:voteChoice')
    @Authorized('user')
    public async deleteVoteChoice(@Param('voteItem') voteItem: string, @Param('voteChoice') voteChoice: string, @Res() res: any, @Req() req: any): Promise<any> {
        const voteChoiceObjId = new ObjectID(voteChoice);
        const voteItemObjId = new ObjectID(voteItem);
        // check exist?

        const voteItemObj = await this.voteItemService.findOne({ _id: voteItemObjId });
        if (voteItemObj === undefined && voteItemObj === null) {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot find a vote.', undefined);
            return res.status(400).send(errorResponse);
        }

        const voteEvent = await this.votingEventService.findOne({ _id: voteItemObj.votingId });

        if (voteEvent.approved === true) {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot Delete Item, the status is approved.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (voteEvent.closed === true) {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot Delete Item, the status is closed.', undefined);
            return res.status(400).send(errorResponse);
        }
        const today = moment().toDate();

        const voteChoiceObj = await this.voteChoiceService.findOne({ _id: voteChoiceObjId, voteItemId: voteItemObjId });
        await this.assetService.update({ _id: voteChoiceObj.assetId }, { $set: { expirationDate: today } });
        await this.votedService.deleteMany({ votingId: voteItemObj.votingId, voteItemId: voteItemObj.id, voteChoiceId: voteChoiceObjId });

        const deleteVoteChoice = await this.voteChoiceService.delete({ voteItemId: voteItemObj.id });
        if (
            deleteVoteChoice
        ) {
            const successResponse = ResponseUtil.getSuccessResponse('delete vote choice is success.', undefined);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot delete a Vote choice.', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    @Post('/own')
    @Authorized('user')
    public async createVotingEventOwn(@Body({ validate: true }) votingEventRequest: VotingEventRequest, @Res() res: any, @Req() req: any): Promise<any> {
        const userObjId = new ObjectID(req.user.id);
        const today = moment().toDate();
        let minSupportValue = DEFAULT_MIN_SUPPORT;
        // ELIGIBLE_VOTES
        // let triggerValue = DEFAULT_TRIGGER_VOTE;
        let sdr = DEFAULT_SUPPORT_DAYS_RANGE;
        let vdr = DEFAULT_VOTE_DAYS_RANGE;
        const voteDaysRangeConfig = await this.configService.getConfig(VOTE_DAYS_RANGE);
        const sdrConfig = await this.configService.getConfig(SUPPORT_DAYS_RANGE);
        // const triggerConfig = await this.configService.getConfig(TRIGGER_VOTE);
        // let eligibleValue = undefined;
        // const eligibleConfig = await this.configService.getConfig(ELIGIBLE_VOTES);
        const configMinSupport = await this.configService.getConfig(MIN_SUPPORT);

        if (sdrConfig) {
            sdr = sdrConfig.value;
        }

        /* 
        if (triggerConfig) {
            triggerValue = triggerConfig.value;
        }

        if (eligibleConfig) {
            eligibleValue = eligibleConfig.value;
        }
        */
        if (voteDaysRangeConfig) {
            vdr = voteDaysRangeConfig.value;
        }

        if (votingEventRequest.voteDaysRange !== undefined) {
            vdr = votingEventRequest.voteDaysRange;
        }

        if (configMinSupport) {
            minSupportValue = parseInt(configMinSupport.value, 10);
        }

        if (typeof (vdr) !== 'number') {
            const errorResponse = ResponseUtil.getErrorResponse('voteDaysRange is not number.', undefined);
            return res.status(400).send(errorResponse);
        }

        const postiveNumber = vdr > 0;
        if (postiveNumber === false) {
            const errorResponse = ResponseUtil.getErrorResponse('voteDaysRange is not positive number.', undefined);
            return res.status(400).send(errorResponse);
        }

        let hashTagObjId: any = undefined;
        let createHashTag: any = undefined;
        const hashTag = votingEventRequest.hashTag;
        if (hashTag !== undefined && hashTag !== null) {
            hashTagObjId = await this.hashTagService.findOne({ name: hashTag, objectiveId: null });
            if (hashTagObjId === undefined) {
                const newHashTag: HashTag = new HashTag();
                newHashTag.name = hashTag;
                newHashTag.lastActiveDate = today;
                newHashTag.count = 0;
                newHashTag.iconURL = '';
                newHashTag.personal = false;
                createHashTag = await this.hashTagService.create(newHashTag);
                if (createHashTag) {
                    createHashTag = hashTag;
                }
            } else {
                createHashTag = hashTagObjId.name;
            }
        }

        const closetValue = (24 * sdr) * 60 * 60 * 1000; // one day in milliseconds
        const dateNow = new Date(today.getTime() + closetValue);

        // const adminIn = new ObjectID(votingEventRequest.adminId);
        // const needed = votingEventRequest.needed;
        const pin = votingEventRequest.pin ? votingEventRequest.pin : false;
        const status = votingEventRequest.status;
        const type = votingEventRequest.type;
        const title = votingEventRequest.title;
        const detail = votingEventRequest.detail;
        const coverImage = votingEventRequest.coverPageURL;
        const approve = votingEventRequest.approved ? votingEventRequest.approved : false;
        const close = votingEventRequest.closed ? votingEventRequest.closed : false;
        const minSupport = votingEventRequest.minSupport ? votingEventRequest.minSupport : minSupportValue;
        const supportDaysRange = votingEventRequest.supportDaysRange;
        const voteDaysRange = votingEventRequest.voteDaysRange;
        const showed = votingEventRequest.showVoterName ? votingEventRequest.showVoterName : false;

        if (approve === true) {
            const errorResponse = ResponseUtil.getErrorResponse('You are trying to do something badly cannot manual the API to approve TRUE! By yourself', undefined);
            return res.status(400).send(errorResponse);
        }
        if (close === true) {
            const errorResponse = ResponseUtil.getErrorResponse('The default Close vote should be false!', undefined);
            return res.status(400).send(errorResponse);
        }

        if (votingEventRequest.approveDatetime !== null && votingEventRequest.approveDatetime !== undefined) {
            const errorResponse = ResponseUtil.getErrorResponse('ApproveDatetime should be NULL!', undefined);
            return res.status(400).send(errorResponse);
        }

        if (votingEventRequest.approveUsername !== null && votingEventRequest.approveUsername !== undefined) {
            const errorResponse = ResponseUtil.getErrorResponse('ApproveUsername should be null', undefined);
            return res.status(400).send(errorResponse);
        }
        // check ban 
        const user = await this.userService.findOne({ _id: userObjId });
        if (user !== undefined && user !== null && user.banned === true) {
            const errorResponse = ResponseUtil.getErrorResponse('You have been banned.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (title === undefined && title === null) {
            const errorResponse = ResponseUtil.getErrorResponse('Title is required.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (detail === undefined && detail === null) {
            const errorResponse = ResponseUtil.getErrorResponse('Detail is required.', undefined);
            return res.status(400).send(errorResponse);
        }
        /* 
        if (coverImage === undefined && coverImage === null) {
            const errorResponse = ResponseUtil.getErrorResponse('coverImage is required.', undefined);
            return res.status(400).send(errorResponse);
        }
        */
        const regex = /[%^*+|~=`{}\[\]\/]/;
        const matchTitle = title.match(regex);
        if (matchTitle !== null && matchTitle.length > 0) {
            const errorResponse = ResponseUtil.getErrorResponse('Found special characters in title what you wrote.', matchTitle);
            return res.status(400).send(errorResponse);
        }

        const matchDetail = detail ? detail.match(regex) : null;

        if (matchDetail !== null && matchDetail.length > 0) {
            const errorResponse = ResponseUtil.getErrorResponse('Found special characters in detail what you wrote.', matchTitle);
            return res.status(400).send(errorResponse);
        }

        if (status === undefined && status === null) {
            const errorResponse = ResponseUtil.getErrorResponse('Status is undefined.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (type === undefined && type === null) {
            const errorResponse = ResponseUtil.getErrorResponse('Type is undefined.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (minSupport === undefined && minSupport === null) {
            const errorResponse = ResponseUtil.getErrorResponse('minSupport is null or undefined.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (supportDaysRange === undefined && supportDaysRange === null) {
            const errorResponse = ResponseUtil.getErrorResponse('Start Vote Datetime is null or undefined.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (voteDaysRange === undefined && voteDaysRange === null) {
            const errorResponse = ResponseUtil.getErrorResponse('End Vote Datetime is null or undefined.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (pin === true) {
            const errorResponse = ResponseUtil.getErrorResponse('Pin should be false.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (status !== 'support') {
            const errorResponse = ResponseUtil.getErrorResponse('Status should be support.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (votingEventRequest.voteItem.length === 0) {
            const errorResponse = ResponseUtil.getErrorResponse('VoteItem is empty.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (votingEventRequest.voteItem.length > 0) {
            for (const item of votingEventRequest.voteItem) {

                if (item.titleItem === undefined) {
                    const errorResponse = ResponseUtil.getErrorResponse('VoteItem Title is required.', undefined);
                    return res.status(400).send(errorResponse);
                }

                const foundItemTitle = item.titleItem ? item.titleItem.match(regex) : null;
                if (foundItemTitle !== null && foundItemTitle.length > 0) {
                    const errorResponse = ResponseUtil.getErrorResponse('Found special characters in voteItem title what you wrote.', foundItemTitle);
                    return res.status(400).send(errorResponse);
                }

                if (item.titleItem === '') {
                    const errorResponse = ResponseUtil.getErrorResponse('VoteItem Title is required.', undefined);
                    return res.status(400).send(errorResponse);
                }
                const voteChoice = await this.CheckEmptyTitleVoteChoice(item);
                if (item.typeChoice !== 'text' &&
                    voteChoice !== null &&
                    voteChoice !== '' &&
                    voteChoice.length === 0
                ) {
                    const errorResponse = ResponseUtil.getErrorResponse('VoteChoice is empty.', undefined);
                    return res.status(400).send(errorResponse);
                }

                if (voteChoice !== null && voteChoice.length > 0) {
                    const errorResponse = ResponseUtil.getErrorResponse('Found special characters in voteChoice title what you wrote.', foundItemTitle);
                    return res.status(400).send(errorResponse);
                }

                if (voteChoice !== null && voteChoice === '') {
                    const errorResponse = ResponseUtil.getErrorResponse('VoteChoice Title is required.', undefined);
                    return res.status(400).send(errorResponse);
                }

            }
        }

        let maxVoteChoices = DEFAULT_MAX_VOTE_CHOICES;
        let maxVote = DEFAULT_MAX_VOTE_QUESTIONS;

        const maxConfigVoteChoices = await this.configService.getConfig(MAX_VOTE_CHOICES);

        if (maxConfigVoteChoices) {
            maxVoteChoices = maxConfigVoteChoices.value;
        }

        const maxConfigVoteQuestion = await this.configService.getConfig(MAX_VOTE_QUESTIONS);
        if (maxConfigVoteQuestion) {
            maxVote = maxConfigVoteQuestion.value;
        }

        if (votingEventRequest.voteItem.length > maxVote) {
            const errorResponse = ResponseUtil.getErrorResponse('The number of VoteItem exceeds the maximum configured for VoteQuestion.', undefined);
            return res.status(400).send(errorResponse);
        }

        for (const voteItems of votingEventRequest.voteItem) {
            // check voteChoices
            const resultError = await this.CheckVoteChoices(voteItems, maxVoteChoices);
            if (resultError === 0) {
                const errorResponse = ResponseUtil.getErrorResponse('The number of VoteChoice exceeds the maximum configured for VoteChoice.', undefined);
                return res.status(400).send(errorResponse);
            }
        }

        let hideMode = false;
        const resRank = await this.RankingLevelFunction(userObjId);
        if (resRank.status === 0) {
            const errorResponse = ResponseUtil.getErrorResponse(resRank.message, resRank.data);
            return res.status(400).send(errorResponse);
        }

        // ตรงนี้เราจะใช้ในการเช็ดว่า ค่าระบบ triggerSwitchCreateVote เป็น true หรือเป็น false
        // โดยถ้า triggerSwitchCreateVote เป็น true จะทำให้ hidemode ของ level 2 และ 3 เป็น true ซึ่งเมื่อสร้าง vote แล้วจะแสดงทันที
        if (resRank.message === 1) {
            hideMode = resRank.data;
        }

        if (resRank.message === 2) {
            hideMode = resRank.data;

        }

        if (resRank.message === 3) {
            hideMode = resRank.data;
        }

        const signUrl = await this.s3Service.s3signCloudFront(votingEventRequest.s3CoverPageURL);

        const votingEvent = new VotingEventModel();
        votingEvent.title = title;
        votingEvent.detail = detail;
        votingEvent.assetId = votingEventRequest.assetId;
        votingEvent.coverPageURL = coverImage;
        votingEvent.s3CoverPageURL = signUrl;
        // votingEvent.needed = needed;
        votingEvent.userId = userObjId;
        votingEvent.approved = approve;
        votingEvent.closed = close;
        votingEvent.minSupport = minSupport;
        votingEvent.countSupport = 0;

        votingEvent.supportDaysRange = sdr;
        votingEvent.startSupportDatetime = today;
        votingEvent.endSupportDatetime = dateNow;

        votingEvent.voteDaysRange = vdr;
        votingEvent.startVoteDatetime = null;
        votingEvent.endVoteDatetime = null;
        votingEvent.approveDatetime = null;
        votingEvent.approveUsername = null;
        votingEvent.updateDatetime = today;
        // votingEvent.create_user = new ObjectID(votingEventRequest.create_user);
        votingEvent.hashTag = createHashTag;
        votingEvent.status = status;
        votingEvent.createAsPage = null;
        votingEvent.type = type;
        votingEvent.pin = pin;
        votingEvent.showVoterName = showed;
        votingEvent.showVoteResult = votingEventRequest.showVoteResult;
        votingEvent.service = votingEventRequest.service;
        votingEvent.hide = hideMode;
        const result = await this.votingEventService.create(votingEvent);
        const stackVoteItem: any = {
            'VoteItem': [],
            'VoteChoice': []
        };
        if (result) {

            // const stackVoteItems:any = {};
            if (votingEventRequest.voteItem.length > 0) {
                for (const voteItems of votingEventRequest.voteItem) {
                    if (voteItems.titleItem !== '') {
                        const voteItem = new VoteItemModel();
                        voteItem.votingId = result.id;
                        voteItem.ordering = voteItems.ordering;
                        voteItem.type = voteItems.typeChoice;
                        voteItem.title = voteItems.titleItem;
                        voteItem.assetId = voteItems.assetIdItem;
                        voteItem.coverPageURL = voteItems.coverPageURLItem;
                        voteItem.s3CoverPageURL = voteItems.s3CoverPageURLItem;
                        voteItem.userId = userObjId;
                        const createVoteItem = await this.voteItemService.create(voteItem);
                        if (createVoteItem) {
                            stackVoteItem['VoteItem'].push(createVoteItem);
                            const createdVoteChoice = await this.CreateVoteChoice(createVoteItem, voteItems, userObjId);
                            stackVoteItem['VoteChoice'].push(createdVoteChoice);
                        }
                    } else {
                        continue;
                    }
                }
                const query = { _id: new ObjectID(result.assetId) };
                const newValue = { $set: { expirationDate: null } };
                await this.assetService.update(query, newValue);
                const formatVoteItem: any = {};
                if (stackVoteItem['VoteItem'].length > 0) {
                    for (const data of stackVoteItem['VoteItem']) {
                        formatVoteItem.ordering = data.ordering;
                        formatVoteItem.titleItem = data.title;
                        formatVoteItem.typeChoice = data.type;
                        formatVoteItem.assetIdItem = data.assetId;
                        formatVoteItem.coverPageURLItem = data.coverPageURL;
                        formatVoteItem.voteChoice = stackVoteItem['VoteChoice'].shift();

                    }
                }

                const response: any = {};
                response.id = result.id;
                response.title = result.title;
                response.detail = result.detail;
                response.assetId = result.assetId;
                response.coverPageURL = result.coverPageURL;
                response.s3CoverPageURL = result.s3CoverPageURL;
                response.userId = result.userId;
                response.approved = result.approved;
                response.closed = result.closed;
                response.minSupport = result.minSupport;
                response.countSupport = result.countSupport;
                response.supportDaysRange = result.supportDaysRange;
                response.startSupportDatetime = result.startSupportDatetime;
                response.endSupportDatetime = result.endSupportDatetime;
                response.voteDaysRange = result.voteDaysRange;
                response.startVoteDatetime = result.startVoteDatetime;
                response.endVoteDatetime = result.endVoteDatetime;
                response.approveDatetime = result.approveDatetime;
                response.approveUsername = result.approveUsername;
                response.updateDatetime = result.updateDatetime;
                response.status = result.status;
                response.createAsPage = result.createAsPage;
                response.type = result.type;
                response.hashTag = result.hashTag;
                response.pin = result.pin;
                response.showVoterName = result.showVoterName;
                response.showVoteResult = result.showVoteResult;
                response.voteItems = formatVoteItem;
                response.service = votingEventRequest.service;
                response.hide = result.hide;
                const successResponse = ResponseUtil.getSuccessResponse('Successfully create Voting Event.', response);
                return res.status(200).send(successResponse);
            } else {
                const errorResponse = ResponseUtil.getErrorResponse('Cannot create a voting Item, Vote Choice is empty.', undefined);
                return res.status(400).send(errorResponse);
            }
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot create a voting event.', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    @Post('/:pageId/page')
    @Authorized('user')
    public async createVotingEvent(@Body({ validate: true }) votingEventRequest: VotingEventRequest, @Param('pageId') pageId: string, @Res() res: any, @Req() req: any): Promise<any> {
        const userObjId = new ObjectID(req.user.id);
        let pageObjId = null;
        let pageData: Page[];
        const today = moment().toDate();
        let sdr = DEFAULT_SUPPORT_DAYS_RANGE;
        const sdrConfig = await this.configService.getConfig(SUPPORT_DAYS_RANGE);
        let vdr = DEFAULT_VOTE_DAYS_RANGE;
        const voteDaysRangeConfig = await this.configService.getConfig(VOTE_DAYS_RANGE);
        let minSupportValue = DEFAULT_MIN_SUPPORT;
        // ELIGIBLE_VOTES
        let triggerValue = DEFAULT_TRIGGER_VOTE;
        const triggerConfig = await this.configService.getConfig(TRIGGER_VOTE);
        let eligibleValue = undefined;
        const eligibleConfig = await this.configService.getConfig(ELIGIBLE_VOTES);
        const configMinSupport = await this.configService.getConfig(MIN_SUPPORT);

        if (sdrConfig) {
            sdr = sdrConfig.value;
        }

        if (triggerConfig) {
            triggerValue = triggerConfig.value;
        }

        if (eligibleConfig) {
            eligibleValue = eligibleConfig.value;
        }

        if (voteDaysRangeConfig) {
            vdr = voteDaysRangeConfig.value;
        }

        if (String(triggerValue) === 'true') {
            const split = eligibleValue ? eligibleValue.split(',') : eligibleValue;
            const userObj = await this.userService.findOne({ _id: userObjId });
            if (split.includes(userObj.email) === false) {
                const errorResponse = ResponseUtil.getErrorResponse('You have no permission to create the vote event.', undefined);
                return res.status(400).send(errorResponse);
            }
        }

        if (votingEventRequest.voteDaysRange !== undefined) {
            vdr = votingEventRequest.voteDaysRange;
        }

        if (typeof (vdr) !== 'number') {
            const errorResponse = ResponseUtil.getErrorResponse('voteDaysRange is not number.', undefined);
            return res.status(400).send(errorResponse);
        }

        const postiveNumber = vdr > 0;
        if (postiveNumber === false) {
            const errorResponse = ResponseUtil.getErrorResponse('voteDaysRange is not positive number.', undefined);
            return res.status(400).send(errorResponse);
        }

        let maxVoteChoices = DEFAULT_MAX_VOTE_CHOICES;
        let maxVote = DEFAULT_MAX_VOTE_QUESTIONS;

        const maxConfigVoteChoices = await this.configService.getConfig(MAX_VOTE_CHOICES);

        if (maxConfigVoteChoices) {
            maxVoteChoices = maxConfigVoteChoices.value;
        }

        const maxConfigVoteQuestion = await this.configService.getConfig(MAX_VOTE_QUESTIONS);
        if (maxConfigVoteQuestion) {
            maxVote = maxConfigVoteQuestion.value;
        }

        if (votingEventRequest.voteItem.length > maxVote) {
            const errorResponse = ResponseUtil.getErrorResponse('The number of VoteItem exceeds the maximum configured for VoteQuestion.', undefined);
            return res.status(400).send(errorResponse);
        }

        for (const voteItems of votingEventRequest.voteItem) {
            // check voteChoices
            const resultError = await this.CheckVoteChoices(voteItems, maxVoteChoices);
            if (resultError === 0) {
                const errorResponse = ResponseUtil.getErrorResponse('The number of VoteChoice exceeds the maximym configured for VoteChoice.', undefined);
                return res.status(400).send(errorResponse);
            }
        }

        const closetValue = (24 * sdr) * 60 * 60 * 1000; // one day in milliseconds
        const dateNow = new Date(today.getTime() + closetValue);
        if (configMinSupport) {
            minSupportValue = parseInt(configMinSupport.value, 10);
        }
        let hashTagObjId: any = undefined;
        let createHashTag: any = undefined;
        const hashTag = votingEventRequest.hashTag;
        if (hashTag !== undefined && hashTag !== null) {
            hashTagObjId = await this.hashTagService.findOne({ name: hashTag, objectiveId: null });
            if (hashTagObjId === undefined) {
                const newHashTag: HashTag = new HashTag();
                newHashTag.name = hashTag;
                newHashTag.lastActiveDate = today;
                newHashTag.count = 0;
                newHashTag.iconURL = '';
                newHashTag.personal = false;
                createHashTag = await this.hashTagService.create(newHashTag);
            } else {
                createHashTag = hashTagObjId.name;
            }
        }
        // const adminIn = new ObjectID(votingEventRequest.adminId);
        // const needed = votingEventRequest.needed;
        const pin = votingEventRequest.pin ? votingEventRequest.pin : false;
        const status = votingEventRequest.status;
        const type = votingEventRequest.type;
        const title = votingEventRequest.title;
        const detail = votingEventRequest.detail;
        const coverImage = votingEventRequest.coverPageURL;
        const approve = votingEventRequest.approved ? votingEventRequest.approved : false;
        const close = votingEventRequest.closed ? votingEventRequest.closed : false;
        const minSupport = votingEventRequest.minSupport ? votingEventRequest.minSupport : minSupportValue;
        const supportDaysRange = votingEventRequest.supportDaysRange;
        const voteDaysRange = votingEventRequest.voteDaysRange;
        const showed = votingEventRequest.showVoterName ? votingEventRequest.showVoterName : false;

        if (approve === true) {
            const errorResponse = ResponseUtil.getErrorResponse('You are trying to do something badly cannot manual the API to approve TRUE! By yourself', undefined);
            return res.status(400).send(errorResponse);
        }
        if (close === true) {
            const errorResponse = ResponseUtil.getErrorResponse('The default Close vote should be false!', undefined);
            return res.status(400).send(errorResponse);
        }

        if (votingEventRequest.approveDatetime !== null && votingEventRequest.approveDatetime !== undefined) {
            const errorResponse = ResponseUtil.getErrorResponse('ApproveDatetime should be NULL!', undefined);
            return res.status(400).send(errorResponse);
        }

        if (votingEventRequest.approveUsername !== null && votingEventRequest.approveUsername !== undefined) {
            const errorResponse = ResponseUtil.getErrorResponse('ApproveUsername should be null', undefined);
            return res.status(400).send(errorResponse);
        }
        // check ban 
        let pageObj:any = null;
        if (pageId !== undefined && pageId !== null) {
            pageObjId = new ObjectID(pageId);
            pageData = await this.pageService.find({ where: { _id: pageObjId } }); // ??????? WTF

            if (pageData === undefined) {
                return res.status(400).send(ResponseUtil.getErrorResponse('Page was not found.', undefined));
            }

            pageObj = await this.pageService.findOne({ _id: pageObjId });
            if (pageObj !== undefined && pageObj.banned === true) {
                const errorResponse = ResponseUtil.getErrorResponse('Page was banned.', undefined);
                return res.status(400).send(errorResponse);
            }

            // Check PageAccess
            const accessLevels = [PAGE_ACCESS_LEVEL.OWNER, PAGE_ACCESS_LEVEL.ADMIN, PAGE_ACCESS_LEVEL.MODERATOR, PAGE_ACCESS_LEVEL.POST_MODERATOR];
            const canAccess: boolean = await this.pageAccessLevelService.isUserHasAccessPage(req.user.id + '', pageId, accessLevels);
            if (!canAccess) {
                return res.status(401).send(ResponseUtil.getErrorResponse('You cannot edit vote event of this page.', undefined));
            }
        }

        const user = await this.userService.findOne({ _id: userObjId });
        if (user !== undefined && user !== null && user.banned === true) {
            const errorResponse = ResponseUtil.getErrorResponse('You have been banned.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (title === undefined && title === null) {
            const errorResponse = ResponseUtil.getErrorResponse('Title is required.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (detail === undefined && detail === null) {
            const errorResponse = ResponseUtil.getErrorResponse('Detail is required.', undefined);
            return res.status(400).send(errorResponse);
        }
        /*
        if (coverImage === undefined && coverImage === null) {
            const errorResponse = ResponseUtil.getErrorResponse('coverImage is required.', undefined);
            return res.status(400).send(errorResponse);
        } */

        const regex = /[$%^&*+|~=`{}\[\]\/<>]/;
        const matchTitle = title.match(regex);
        if (matchTitle !== null && matchTitle.length > 0) {
            const errorResponse = ResponseUtil.getErrorResponse('Found special characters in title what you wrote.', matchTitle);
            return res.status(400).send(errorResponse);
        }

        const matchDetail = detail ? detail.match(regex) : null;

        if (matchDetail !== null && matchDetail.length > 0) {
            const errorResponse = ResponseUtil.getErrorResponse('Found special characters in detail what you wrote.', matchTitle);
            return res.status(400).send(errorResponse);
        }

        if (status === undefined && status === null) {
            const errorResponse = ResponseUtil.getErrorResponse('Status is undefined.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (type === undefined && type === null) {
            const errorResponse = ResponseUtil.getErrorResponse('Type is undefined.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (minSupport === undefined && minSupport === null) {
            const errorResponse = ResponseUtil.getErrorResponse('minSupport is null or undefined.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (supportDaysRange === undefined && supportDaysRange === null) {
            const errorResponse = ResponseUtil.getErrorResponse('Start Vote Datetime is null or undefined.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (voteDaysRange === undefined && voteDaysRange === null) {
            const errorResponse = ResponseUtil.getErrorResponse('End Vote Datetime is null or undefined.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (pin === true) {
            const errorResponse = ResponseUtil.getErrorResponse('Pin should be false.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (status !== 'support') {
            const errorResponse = ResponseUtil.getErrorResponse('Status should be support.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (votingEventRequest.voteItem.length === 0) {
            const errorResponse = ResponseUtil.getErrorResponse('VoteItem is empty.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (votingEventRequest.voteItem.length > 0) {
            for (const item of votingEventRequest.voteItem) {

                if (item.titleItem === undefined) {
                    const errorResponse = ResponseUtil.getErrorResponse('VoteItem Title is required.', undefined);
                    return res.status(400).send(errorResponse);
                }

                const foundItemTitle = item.titleItem ? item.titleItem.match(regex) : null;
                if (foundItemTitle !== null && foundItemTitle.length > 0) {
                    const errorResponse = ResponseUtil.getErrorResponse('Found special characters in voteItem title what you wrote.', foundItemTitle);
                    return res.status(400).send(errorResponse);
                }

                if (item.titleItem === '') {
                    const errorResponse = ResponseUtil.getErrorResponse('VoteItem Title is required.', undefined);
                    return res.status(400).send(errorResponse);
                }
                const voteChoice = await this.CheckEmptyTitleVoteChoice(item);

                if (item.typeChoice !== 'text' &&
                    voteChoice !== null &&
                    voteChoice !== '' &&
                    voteChoice.length === 0) {
                    const errorResponse = ResponseUtil.getErrorResponse('VoteChoice is empty.', undefined);
                    return res.status(400).send(errorResponse);
                }

                if (voteChoice !== null && voteChoice.length > 0) {
                    const errorResponse = ResponseUtil.getErrorResponse('Found special characters in voteChoice title what you wrote.', foundItemTitle);
                    return res.status(400).send(errorResponse);
                }

                if (voteChoice !== null && voteChoice === '') {
                    const errorResponse = ResponseUtil.getErrorResponse('VoteChoice Title is required.', undefined);
                    return res.status(400).send(errorResponse);
                }

            }
        }

        let hideMode = false;
        const resRank = await this.RankingLevelFunction(userObjId);
        if (resRank.status === 0) {
            const errorResponse = ResponseUtil.getErrorResponse(resRank.message, resRank.data);
            return res.status(400).send(errorResponse);
        }

        // ตรงนี้เราจะใช้ในการเช็ดว่า ค่าระบบ triggerSwitchCreateVote เป็น true หรือเป็น false
        // โดยถ้า triggerSwitchCreateVote เป็น true จะทำให้ hidemode ของ level 2 และ 3 เป็น true ซึ่งเมื่อสร้าง vote แล้วจะแสดงทันที
        if (resRank.message === 1) {
            hideMode = resRank.data;
        }

        if (resRank.message === 2) {
            hideMode = resRank.data;

        }

        if (resRank.message === 3) {
            hideMode = resRank.data;
        }

        const signUrl = await this.s3Service.s3signCloudFront(votingEventRequest.s3CoverPageURL);

        const votingEvent = new VotingEventModel();
        votingEvent.title = title;
        votingEvent.detail = detail;
        votingEvent.assetId = new ObjectID(votingEventRequest.assetId);
        votingEvent.coverPageURL = coverImage;
        votingEvent.s3CoverPageURL = signUrl;
        // votingEvent.needed = needed;
        votingEvent.userId = userObjId;
        votingEvent.approved = approve;
        votingEvent.closed = close;
        votingEvent.minSupport = minSupport;
        votingEvent.countSupport = 0;
        votingEvent.supportDaysRange = sdr;
        votingEvent.startSupportDatetime = today;
        votingEvent.endSupportDatetime = dateNow;

        votingEvent.voteDaysRange = vdr;
        votingEvent.startVoteDatetime = null;
        votingEvent.endVoteDatetime = null;
        votingEvent.approveDatetime = null;
        votingEvent.approveUsername = null;
        votingEvent.updateDatetime = today;
        votingEvent.hashTag = createHashTag;
        // votingEvent.create_user = new ObjectID(votingEventRequest.create_user);
        votingEvent.status = status;
        votingEvent.createAsPage = new ObjectID(pageObjId);
        votingEvent.type = type;
        votingEvent.pin = pin;
        votingEvent.showVoterName = showed;
        votingEvent.showVoteResult = votingEventRequest.showVoteResult;
        votingEvent.service = votingEventRequest.service;
        votingEvent.hide = hideMode;
        const result = await this.votingEventService.create(votingEvent);

        // TODO : Noti voter
        const notiVoter:any = await this.configService.getConfig(NOTI_VOTER);
        if(result) {
            const splitVoter:any = notiVoter.value.split(',');
            let deviceToken:any = null;
            if (splitVoter.length > 0 && splitVoter.includes(String(pageObjId)) === true) {   
                let defaultNotiVoter:any = DEFAULT_SPECIFIC_NOTI_VOTER;
                const notiVoterConfig:any = await this.configService.getConfig(SPECIFIC_NOTI_VOTER);
                if (notiVoterConfig) {
                    defaultNotiVoter = notiVoterConfig.value;
                }
                const fireBaseToken:any[] = [];
                // ถ้าเป็น true ส่ง noti หาทุกคน 
                if(defaultNotiVoter === String('true')) {
                    deviceToken = await this.deviceTokenService.aggregate([
                        {
                            $match: {
                                $and: [
                                    { token: { $ne: null } },
                                    { token: { $ne: '' } }
                                ]
                            }
                        },
                        {
                            $group: {
                                _id: '$token',
                                doc: { $first: '$$ROOT' }
                            }
                        },
                        {
                            $replaceRoot: {
                                newRoot: '$doc'
                            }
                        },
                        {
                            $unwind: {
                                path: '$User',
                                preserveNullAndEmptyArrays: true
                            }
                        }
                    ]);
                    if (deviceToken.length > 0 ) {
                        const content: any = {
                            'messages': [
                                {
                                    'type': 'flex',
                                    'altText': `รวมโหวตและแสดงความคิดเห็น กับ ${pageObj.name}`,
                                    'contents': {
                                        'type': 'bubble',
                                        'size': 'mega',
                                        'body': {
                                            'type': 'box',
                                            'layout': 'vertical',
                                            'contents': [],
                                            'paddingAll': '0px',
                                            'width': '100%',
                                            'height': '100%'
                                        }
                                    }
                                }
                            ]
                        };
                        let dd: any = result.createdDate.getDate();
                        let mm = result.createdDate.getMonth() + 1;
                        if (dd < 10) { dd = '0' + dd; }
                        if (mm < 10) { mm = '0' + mm; }
                        const votePPle = process.env.APP_VOTE + `/event/${result.id}?noti=true`;
                        const endDate = new Date(result.createdDate);
                        endDate.setDate(endDate.getDate() - 1);
                        const dateTime = endDate.toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        });
                        content['messages'][0].contents.body.contents.push(
                            {
                                'type': 'image',
                                'url': result.s3CoverPageURL,
                                'size': 'full',
                                'aspectMode': 'cover',
                                'aspectRatio': '1:1',
                                'gravity': 'center'
                            },
                            {
                                'type': 'box',
                                'layout': 'vertical',
                                'contents': [
                                    {
                                        'type': 'box',
                                        'layout': 'vertical',
                                        'contents': [
                                            {
                                                'type': 'text',
                                                'text': result.title,
                                                'maxLines': 3,
                                                'wrap': true
                                            },
                                            {
                                                'type': 'text',
                                                'text': dateTime,
                                                'gravity': 'bottom',
                                                'align': 'end',
                                                'size': '12px',
                                                'margin': '5px',
                                                'offsetEnd': '5px'
                                            },
                                            {
                                                'type': 'box',
                                                'layout': 'vertical',
                                                'contents': [
                                                    {
                                                        'type': 'button',
                                                        'action': {
                                                            'type': 'uri',
                                                            'label': 'อ่านเพิ่มเติม',
                                                            'uri': votePPle + '&openExternalBrowser=1'
                                                        },
                                                        'color': '#F18805',
                                                        'scaling': false,
                                                        'style': 'primary',
                                                        'height': 'sm',
                                                        'adjustMode': 'shrink-to-fit',
                                                        'gravity': 'center',
                                                        'margin': '10px'
                                                    }
                                                ],
                                                'position': 'relative',
                                                'height': '60px'
                                            }
                                        ],
                                        'height': '150px',
                                        'paddingAll': '10px',
                                        'backgroundColor': '#F0F0F0',
                                        'width': '100%'
                                    },
                                ],
                                'width': '100%',
                                'height': '100%'
                            }
                        );
                        const tokenLine = process.env.LINE_AUTHORIZATION;
                        const lineUsers = await axios.get(
                            'https://api.line.me/v2/bot/followers/ids', {
                            headers: {
                                Authorization: 'Bearer ' + tokenLine
                            }
                        });
                        if (lineUsers.data.userIds.length > 0 && content['messages'][0].contents.body.contents.length > 0) {
                            const chunksVote: number[][] = await checkify(lineUsers.data.userIds, Number(process.env.WORKER_THREAD_JOBS));
                            chunksVote.forEach((userVote,i) => {
                                const worker = new Worker(process.env.WORKER_THREAD_PATH);
                                const messagePayload = {
                                    users: userVote,
                                    messages: JSON.stringify(content['messages']),
                                    type: 'LINE_NOTI',
                                    token: tokenLine
                                };
                                
                                worker.postMessage(messagePayload);
                                worker.on('message', async (resultVote:any) => {
                                    if(resultVote.message === 'done') {
                                        console.log(`Worker ${i} completed.`);
                                    }
                                });
                            });
                        }
                        const workThreadModel: WorkerThread = new WorkerThread();
                        workThreadModel.theThings = new ObjectID(result.id);
                        workThreadModel.sending = deviceToken.length;
                        workThreadModel.sended = 0;
                        workThreadModel.votingId = [new ObjectID(result.id)];
                        workThreadModel.type = NotiTypeAction['vote_event_noti'];
                        workThreadModel.active = false;
                        await this.workerThreadService.create(workThreadModel);
                        const chunks: number[][] = await checkify(deviceToken, Number(process.env.WORKER_THREAD_JOBS));
                        chunks.forEach((item,i) => {
                            const workerThread = new Worker(process.env.WORKER_THREAD_PATH);
                            const messagePayload = {
                                'title': title,
                                'body': detail,
                                'image': signUrl,
                                'type': 'VOTE_EVENT_NOTI',
                                'link': process.env.APP_VOTE +`/event/${pageObjId}?noti=true`,
                                'token': item,
                                'line_noti_vote': {
                                    users: user,
                                    messages: JSON.stringify(content['messages']),
                                    type: 'LINE_NOTI',
                                    token: tokenLine
                                }
                                // 'user': item['users']
                            };
                            
                            workerThread.postMessage(messagePayload);
                            workerThread.on('message', async (feedback:any) => {
                                if(feedback.message === 'done') {
                                    console.log(`Worker ${i} completed.`);
                                }
                            });
                        });
                    }

                } else {
                    // ถ้าเป็น false ส่ง noti เฉพาะบางคน
                    const idxArr: any[] = [];
                    const splitEligible:any[] = eligibleValue ? eligibleValue.split(',') : eligibleValue;
                    if(splitEligible.length > 0) {
                        for(const item of splitEligible) {
                            const userObj: any = await this.userService.findOne({email: item});
                            if(userObj) {
                                 idxArr.push(new ObjectID(userObj.id));
                            } else {
                                continue;
                            }
                        }
                    }
                    if(idxArr.length > 0){
                        deviceToken = await this.deviceTokenService.aggregate(
                            [
                                {
                                    $match: {
                                        userId: { $in: idxArr},
                                        token: { $ne: null }
                                    }
                                },
                                {
                                    $lookup: {
                                        from: 'User',
                                        localField: 'userId',
                                        foreignField: '_id',
                                        as: 'User'
                                    }
                                },
                                {
                                    $unwind: {
                                        path: '$User',
                                        preserveNullAndEmptyArrays: true
                                    }
                                }
                            ]
                        );
                    }
                }
                if (deviceToken.length > 0) {
                    for (let j = 0; j < deviceToken.length; j++) {
                        if (deviceToken[0].User.subscribeNoti === true && deviceToken[0].User !== undefined && deviceToken[j].token !== undefined && deviceToken[j].token !== null && deviceToken[j].token !== '') {
                            fireBaseToken.push(deviceToken[j].token);
                        } else {
                            continue;
                        }
                    }
                }

                if (fireBaseToken.length > 0 ) {
                    const token = fireBaseToken.filter(
                        (
                            element, index
                        ) => 
                            {
                                return fireBaseToken.indexOf(element) === index;
                            }
                    );

                    // SWITCHING_LINE_FLEX_MESSAGE
                    let switchingLFM = DEFAULT_SWITCHING_LINE_FLEX_MESSAGE;
                    const configSwitchingLFM = await this.configService.getConfig(SWITCHING_LINE_FLEX_MESSAGE);
                    if (configSwitchingLFM) {
                        switchingLFM = configSwitchingLFM.value;
                    }
                    if(String(switchingLFM) === 'true') {
                        const content: any = {
                            'messages': [
                                {
                                    'type': 'flex',
                                    'altText': `รวมโหวตและแสดงความคิดเห็น กับ ${pageObj.name}`,
                                    'contents': {
                                        'type': 'bubble',
                                        'size': 'mega',
                                        'body': {
                                            'type': 'box',
                                            'layout': 'vertical',
                                            'contents': [],
                                            'paddingAll': '0px',
                                            'width': '100%',
                                            'height': '100%'
                                        }
                                    }
                                }
                            ]
                        };
                        let dd: any = result.createdDate.getDate();
                        let mm = result.createdDate.getMonth() + 1;
                        if (dd < 10) { dd = '0' + dd; }
                        if (mm < 10) { mm = '0' + mm; }
                        const votePPle = process.env.APP_VOTE + `/event/${result.id}?noti=true`;
                        const endDate = new Date(result.createdDate);
                        endDate.setDate(endDate.getDate() - 1);
                        const dateTime = endDate.toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        });
                        content['messages'][0].contents.body.contents.push(
                            {
                                'type': 'image',
                                'url': result.s3CoverPageURL,
                                'size': 'full',
                                'aspectMode': 'cover',
                                'aspectRatio': '1:1',
                                'gravity': 'center'
                            },
                            {
                                'type': 'box',
                                'layout': 'vertical',
                                'contents': [
                                    {
                                        'type': 'box',
                                        'layout': 'vertical',
                                        'contents': [
                                            {
                                                'type': 'text',
                                                'text': result.title,
                                                'maxLines': 3,
                                                'wrap': true
                                            },
                                            {
                                                'type': 'text',
                                                'text': dateTime,
                                                'gravity': 'bottom',
                                                'align': 'end',
                                                'size': '12px',
                                                'margin': '5px',
                                                'offsetEnd': '5px'
                                            },
                                            {
                                                'type': 'box',
                                                'layout': 'vertical',
                                                'contents': [
                                                    {
                                                        'type': 'button',
                                                        'action': {
                                                            'type': 'uri',
                                                            'label': 'อ่านเพิ่มเติม',
                                                            'uri': votePPle + '&openExternalBrowser=1'
                                                        },
                                                        'color': '#F18805',
                                                        'scaling': false,
                                                        'style': 'primary',
                                                        'height': 'sm',
                                                        'adjustMode': 'shrink-to-fit',
                                                        'gravity': 'center',
                                                        'margin': '10px'
                                                    }
                                                ],
                                                'position': 'relative',
                                                'height': '60px'
                                            }
                                        ],
                                        'height': '150px',
                                        'paddingAll': '10px',
                                        'backgroundColor': '#F0F0F0',
                                        'width': '100%'
                                    },
                                ],
                                'width': '100%',
                                'height': '100%'
                            }
                        );
                        const tokenLine = process.env.LINE_AUTHORIZATION;
                        const lineUsers = await axios.get(
                            'https://api.line.me/v2/bot/followers/ids', {
                            headers: {
                                Authorization: 'Bearer ' + tokenLine
                            }
                        });
                        if (lineUsers.data.userIds.length > 0 && content['messages'][0].contents.body.contents.length > 0) {
                            const chunksVote: number[][] = await checkify(lineUsers.data.userIds, Number(process.env.WORKER_THREAD_JOBS));
                            chunksVote.forEach((userVote,i) => {
                                const worker = new Worker(process.env.WORKER_THREAD_PATH);
                                const messagePayload = {
                                    users: userVote,
                                    messages: JSON.stringify(content['messages']),
                                    type: 'LINE_NOTI',
                                    token: tokenLine
                                };
                                
                                worker.postMessage(messagePayload);
                                worker.on('message', async (resultVote:any) => {
                                    if(resultVote.message === 'done') {
                                        console.log(`Worker ${i} completed.`);
                                    }
                                });
                            });
                        }
                    }
                    const workThreadModel: WorkerThread = new WorkerThread();
                    workThreadModel.theThings = new ObjectID(result.id);
                    workThreadModel.sending = token.length;
                    workThreadModel.sended = 0;
                    workThreadModel.votingId = [new ObjectID(result.id)];
                    workThreadModel.type = NotiTypeAction['vote_event_noti'];
                    workThreadModel.active = false;
                    await this.workerThreadService.create(workThreadModel);
                    const chunks: number[][] = await checkify(token, Number(process.env.WORKER_THREAD_JOBS));
                    chunks.forEach((item,i) => {
                        const workerThread = new Worker(process.env.WORKER_THREAD_PATH);
                        const messagePayload = {
                            'title': title,
                            'body': detail,
                            'image': signUrl,
                            'type': NotiTypeAction['vote_event_noti'],
                            'link': process.env.APP_VOTE +`/event/${pageObjId}`,
                            'token': item,
                            // 'user': item['users']
                        };
                        
                        workerThread.postMessage(messagePayload);
                        workerThread.on('message', async (feedback:any) => {
                            if(feedback.message === 'done') {
                                console.log(`Worker ${i} completed.`);
                            }
                        });
                    });
                }
            }

            const stackVoteItem: any = {
                'VoteItem': [],
                'VoteChoice': []
            };
            if (result) {
                // const stackVoteItems:any = {};
                if (votingEventRequest.voteItem.length > 0) {
                    for (const voteItems of votingEventRequest.voteItem) {
                        if (voteItems.titleItem !== '') {
                            const voteItem = new VoteItemModel();
                            voteItem.votingId = result.id;
                            voteItem.ordering = voteItems.ordering;
                            voteItem.type = voteItems.typeChoice;
                            voteItem.title = voteItems.titleItem;
                            voteItem.assetId = voteItems.assetIdItem;
                            voteItem.coverPageURL = voteItems.coverPageURLItem;
                            voteItem.s3CoverPageURL = voteItems.s3CoverPageURLItem;
                            voteItem.userId = userObjId;
                            voteItem.pageId = new ObjectID(pageObjId);
                            const createVoteItem = await this.voteItemService.create(voteItem);
                            if (createVoteItem) {
                                stackVoteItem['VoteItem'].push(createVoteItem);
                                const createdVoteChoice = await this.CreateVoteChoice(createVoteItem, voteItems, userObjId, pageObjId);
                                stackVoteItem['VoteChoice'].push(createdVoteChoice);
                            }
                        } else {
                            continue;
                        }
                    }
                    const query = { _id: new ObjectID(result.assetId) };
                    const newValue = { $set: { expirationDate: null } };
                    await this.assetService.update(query, newValue);
                    const formatVoteItem: any = {};
                    if (stackVoteItem['VoteItem'].length > 0) {
                        for (const data of stackVoteItem['VoteItem']) {
                            formatVoteItem.ordering = data.ordering;
                            formatVoteItem.titleItem = data.title;
                            formatVoteItem.typeChoice = data.type;
                            formatVoteItem.assetIdItem = data.assetId;
                            formatVoteItem.coverPageURLItem = data.coverPageURL;
                            formatVoteItem.voteChoice = stackVoteItem['VoteChoice'].shift();
                        }
                    }
    
                    const response: any = {};
                    response.id = result.id;
                    response.title = result.title;
                    response.detail = result.detail;
                    response.assetId = result.assetId;
                    response.coverPageURL = result.coverPageURL;
                    response.s3CoverPageURL = result.s3CoverPageURL;
                    response.userId = result.userId;
                    response.approved = result.approved;
                    response.closed = result.closed;
                    response.minSupport = result.minSupport;
                    response.countSupport = result.countSupport;
                    response.supportDaysRange = result.supportDaysRange;
                    response.startSupportDatetime = result.startSupportDatetime;
                    response.endSupportDatetime = result.endSupportDatetime;
                    response.voteDaysRange = result.voteDaysRange;
                    response.startVoteDatetime = result.startVoteDatetime;
                    response.endVoteDatetime = result.endVoteDatetime;
                    response.approveDatetime = result.approveDatetime;
                    response.approveUsername = result.approveUsername;
                    response.updateDatetime = result.updateDatetime;
                    response.hashTag = result.hashTag;
                    response.status = result.status;
                    response.createAsPage = result.createAsPage;
                    response.type = result.type;
                    response.pin = result.pin;
                    response.showVoterName = result.showVoterName;
                    response.showVoteResult = result.showVoteResult;
                    // response.voteItems = formatVoteItem;
                    response.service = votingEventRequest.service;
                    response.hide = result.hide;
                    const successResponse = ResponseUtil.getSuccessResponse('Successfully create Voting Event.', response);
                    return res.status(200).send(successResponse);
                } else {
                    const errorResponse = ResponseUtil.getErrorResponse('Cannot create a voting Item, Vote Choice is empty.', undefined);
                    return res.status(400).send(errorResponse);
                }
            } else {
                const errorResponse = ResponseUtil.getErrorResponse('Cannot create a voting event.', undefined);
                return res.status(400).send(errorResponse);
            }
        }

    }

    // User vote
    @Post('/voted/:votingId')
    @Authorized('user')
    public async Voted(@Body({ validate: true }) votedRequest: VotedRequest, @Param('votingId') votingId: string, @Res() res: any, @Req() req: any): Promise<any> {
        const votingObjId = new ObjectID(votingId);
        const userObjId = new ObjectID(req.user.id);
        const pageObjId = new ObjectID(votedRequest.pageId);
        const voteEventObj = await this.votingEventService.findOne({ _id: votingObjId });
        const today = moment().toDate();
        let eligibleValue = undefined;
        const eligibleConfig = await this.configService.getConfig(ELIGIBLE_VOTES);
        if (eligibleConfig) {
            eligibleValue = eligibleConfig.value;
        }
        const split = eligibleValue ? eligibleValue.split(',') : eligibleValue;
        const userObj = await this.userService.findOne({ _id: userObjId });
        // split.includes(userObj.email) === false

        // status public, private, member
        if (voteEventObj.type === 'member' && split.includes(userObj.email) === false) {
            const authUser = await this.authenticationIdService.findOne({ user: userObjId, providerName: 'MFP', membershipState: 'APPROVED' });
            if (voteEventObj.type === 'member' &&
                authUser === undefined
            ) {
                const errorResponse = ResponseUtil.getErrorResponse('This vote only for membershipMFP, You are not membership.', undefined);
                return res.status(400).send(errorResponse);
            }
        }

        // if private vote check you are in vote
        if (voteEventObj.type === 'private') {
            // user 
            // vote by user
            if (votedRequest.pageId === undefined) {
                const userInvited = await this.inviteVoteService.findOne({ votingId: votingObjId, userId: userObjId });
                if (userInvited === undefined) {
                    const errorResponse = ResponseUtil.getErrorResponse('This vote is private and user not invited to vote. ', undefined);
                    return res.status(400).send(errorResponse);
                }
            }

            // page
            // vote by page
            if (votedRequest.pageId !== undefined) {
                const pageInvited = await this.inviteVoteService.findOne({ votingId: votingObjId, pageId: pageObjId });
                if (pageInvited === undefined) {
                    const errorResponse = ResponseUtil.getErrorResponse('This vote is private and page not invited to vote. ', undefined);
                    return res.status(400).send(errorResponse);
                }
            }
        }

        if (voteEventObj !== undefined && voteEventObj !== null && voteEventObj.approved === false) {
            const errorResponse = ResponseUtil.getErrorResponse('Status approve is false.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (today.getTime() > voteEventObj.endVoteDatetime.getTime()) {
            const query = { _id: voteEventObj.id };
            const newValues = {
                $set: {
                    closed: true,
                    closeDate: today,
                    pin: false,
                    status: 'close'
                }
            };
            const update = await this.votingEventService.update(query, newValues);
            if (update) {
                const errorResponse = ResponseUtil.getErrorResponse('Cannot Vote this vote status is close.', undefined);
                return res.status(400).send(errorResponse);
            }
        }

        if (voteEventObj.status === 'support') {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot Vote this vote status is support.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (voteEventObj.status === 'close') {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot Vote this vote status is close.', undefined);
            return res.status(400).send(errorResponse);
        }

        // check ban 
        const user = await this.userService.findOne({ _id: userObjId });
        if (user !== undefined && user !== null && user.banned === true) {
            const errorResponse = ResponseUtil.getErrorResponse('You have been banned.', undefined);
            return res.status(400).send(errorResponse);
        }
        const response: any = [];
        if (votedRequest.voteItem.length > 0) {
            for (const item of votedRequest.voteItem) {

                const voted = await this.CheckSpamVote(item, votingObjId, votedRequest.pageId, userObjId);
                if (voted === undefined) {
                    const voteItemObj = await this.voteItemService.findOne({ _id: new ObjectID(item.voteItemId) });
                    if (voteItemObj === undefined && voteItemObj === null) {
                        const errorResponse = ResponseUtil.getErrorResponse('Cannot find the VoteItem.', undefined);
                        return res.status(400).send(errorResponse);
                    }

                    if (item.voteItemId !== undefined) {
                        const create = await this.VoteChoice(item.voteItemId, item, votingObjId, userObjId, votedRequest.pageId);
                        if (create === 'Select Vote Choice is empty.') {
                            const errorResponse = ResponseUtil.getErrorResponse('Select Vote Choice is empty.', response);
                            return res.status(400).send(errorResponse);
                        }
                        response.push(create);
                    }
                } else {
                    const aggsVote = await this.voteItemService.aggregate(
                        [
                            {
                                $match: {
                                    votingId: votingObjId
                                }
                            },
                            {
                                $lookup: {
                                    from: 'VoteChoice',
                                    let: { 'id': '$_id' },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr:
                                                {
                                                    $eq: ['$$id', '$voteItemId']
                                                }
                                            }
                                        },
                                        {
                                            $project: {
                                                _id: 1,
                                                title: 1
                                            }
                                        }
                                    ],
                                    as: 'voteChoice'
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    type: 1,
                                    ordering: 1,
                                    title: 1,
                                    voteChoice: 1
                                }
                            }
                        ]
                    );
                    const errorResponse = ResponseUtil.getErrorResponse('You have been already voted.', aggsVote);
                    return res.status(400).send(errorResponse);
                }

            }
            // check spam vote
            const clientId = req.headers['client-id'];
            const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).split(',')[0];
            const userEngagement = new UserEngagement();
            userEngagement.clientId = clientId;
            userEngagement.contentId = null;
            userEngagement.contentType = ENGAGEMENT_CONTENT_TYPE.VOTE;
            userEngagement.ip = ipAddress;
            userEngagement.userId = userObjId;
            userEngagement.action = ENGAGEMENT_ACTION.VOTE;
            const createEngagement = await this.userEngagementService.create(userEngagement);
            let votePoint = DEFAULT_VOTE_POINT;
            const votePointConfig = await this.configService.getConfig(VOTE_POINT);
            if (votePointConfig) {
                votePoint = parseInt(votePointConfig.value, 10);
            }
            // FIRST_LOGIN
            if (createEngagement) {
                const productModel = new PointStatementModel();
                productModel.title = ENGAGEMENT_CONTENT_TYPE.VOTE;
                productModel.detail = null;
                productModel.point = votePoint;
                productModel.type = POINT_TYPE.VOTE;
                productModel.userId = userObjId;
                productModel.pointEventId = null;
                const createPoint = await this.pointStatementService.create(productModel);
                if (createPoint) {
                    const accumulateCreate = await this.accumulateService.findOne({ userId: userObjId });
                    if (accumulateCreate === undefined) {
                        const accumulateModel = new AccumulateModel();
                        accumulateModel.userId = userObjId;
                        accumulateModel.accumulatePoint = votePoint;
                        accumulateModel.usedPoint = 0;
                        await this.accumulateService.create(accumulateModel);
                    } else {
                        const query = { userId: userObjId };
                        const newValues = {
                            $set:
                            {
                                accumulatePoint: accumulateCreate.accumulatePoint + votePoint
                            }
                        };
                        await this.accumulateService.update(query, newValues);
                    }
                }
            }
            if (response.length > 0 && response !== undefined) {
                const successResponse = ResponseUtil.getSuccessResponse('Create vote is success.', response);
                return res.status(200).send(successResponse);
            } else {
                const errorResponse = ResponseUtil.getErrorResponse('Cannot create vote.', undefined);
                return res.status(400).send(errorResponse);
            }
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('The Item is empty.', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    // Invite Vote
    @Post('/invite/vote/:votingId')
    @Authorized('user')
    public async InviteVote(@Body({ validate: true }) inviteVoteRequest: InviteVoteRequest, @Param('votingId') votingId: string, @Res() res: any, @Req() req: any): Promise<any> {
        const votingObjId = new ObjectID(votingId);
        const userObjId = new ObjectID(req.user.id);
        let pageObjId: any = undefined;
        const voteEventObj = await this.votingEventService.findOne({ _id: votingObjId });

        if (voteEventObj === undefined && voteEventObj === null) {
            const errorResponse = ResponseUtil.getErrorResponse('The vote was not found.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (voteEventObj.status === 'close') {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot invite to vote the status was closed.', undefined);
            return res.status(400).send(errorResponse);
        }
        const owner = await this.userService.findOne({ _id: new ObjectID(userObjId) });
        if (owner !== undefined && owner !== null && owner.banned === true) {
            const errorResponse = ResponseUtil.getErrorResponse('You have been banned.', undefined);
            return res.status(400).send(errorResponse);
        }

        const response: any = [];
        if (voteEventObj.type === 'private') {
            if (inviteVoteRequest.InviteVote.length > 0) {
                for (const inviteObject of inviteVoteRequest.InviteVote) {
                    // check ban 
                    if (inviteObject.pageId !== undefined && inviteObject.pageId !== null) {
                        pageObjId = new ObjectID(inviteObject.pageId);
                        const pageData = await this.pageService.find({ where: { _id: pageObjId } }); // ??????? WTF

                        if (pageData === undefined) {
                            return res.status(400).send(ResponseUtil.getErrorResponse('Page was not found.', undefined));
                        }

                        const pageObj = await this.pageService.findOne({ _id: pageObjId });
                        if (pageObj !== undefined && pageObj.banned === true) {
                            const errorResponse = ResponseUtil.getErrorResponse('This page was banned.', pageObj.name);
                            return res.status(400).send(errorResponse);
                        }

                        // Check PageAccess
                        const accessLevels = [PAGE_ACCESS_LEVEL.OWNER, PAGE_ACCESS_LEVEL.ADMIN, PAGE_ACCESS_LEVEL.MODERATOR, PAGE_ACCESS_LEVEL.POST_MODERATOR];
                        const canAccess: boolean = await this.pageAccessLevelService.isUserHasAccessPage(req.user.id + '', pageObjId, accessLevels);
                        if (!canAccess) {
                            return res.status(401).send(ResponseUtil.getErrorResponse('You cannot edit vote event of this page.', undefined));
                        }
                    }
                    // check ban 
                    const user = await this.userService.findOne({ _id: new ObjectID(inviteObject.userId) });
                    if (user !== undefined && user !== null && user.banned === true) {
                        const errorResponse = ResponseUtil.getErrorResponse('This user was banned.', user.displayName);
                        return res.status(400).send(errorResponse);
                    }
                    // check spam user
                    const userInvited = await this.inviteVoteService.findOne({ votingId: votingObjId, userId: new ObjectID(inviteObject.userId) });
                    if (userInvited !== undefined && userInvited !== null) {
                        const errorResponse = ResponseUtil.getErrorResponse('This user was been invited.', userInvited.displayName);
                        return res.status(400).send(errorResponse);
                    }

                    // check spam page
                    const pageInvited = await this.inviteVoteService.findOne({ votingId: votingObjId, pageId: pageObjId });
                    if (userInvited !== undefined && userInvited !== null) {
                        const errorResponse = ResponseUtil.getErrorResponse('This user was been invited.', pageInvited.name);
                        return res.status(400).send(errorResponse);

                    }

                    const inviteVote = new InviteVoteModel();
                    inviteVote.votingId = votingObjId;
                    inviteVote.owner = voteEventObj.userId;
                    inviteVote.userId = inviteObject.userId ? new ObjectID(inviteObject.userId) : null;
                    inviteVote.pageId = pageObjId;
                    const create = await this.inviteVoteService.create(inviteVote);
                    response.push(create);
                }
            }
            if (response.length > 0) {
                const successResponse = ResponseUtil.getSuccessResponse('Successfully create Invite Vote.', response);
                return res.status(200).send(successResponse);
            } else {
                const errorResponse = ResponseUtil.getErrorResponse('Cannot Create Invite Vote.', undefined);
                return res.status(400).send(errorResponse);
            }
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot Invite to vote the type of vote event isn`t private.', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    // Unvote
    @Post('/unvoted/:votingId')
    @Authorized('user')
    public async Unvoted(@Body({ validate: true }) votedRequest: VotedRequest, @Param('votingId') votingId: string, @Res() res: any, @Req() req: any): Promise<any> {
        const votingObjId = new ObjectID(votingId);
        const userObjId = new ObjectID(req.user.id);
        const voteItemObjId = new ObjectID(votedRequest.voteItemId);
        const voteEventObj = await this.votingEventService.findOne({ _id: votingObjId });

        if (voteEventObj !== undefined && voteEventObj !== null && voteEventObj.approved === false) {
            const errorResponse = ResponseUtil.getErrorResponse('Status approve is false.', undefined);
            return res.status(400).send(errorResponse);
        }

        const voteItemObj = await this.voteItemService.findOne({ _id: voteItemObjId });
        if (voteItemObj === undefined && voteItemObj === null) {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot find the VoteItem.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (voteEventObj.status === 'support') {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot Vote this vote status is support.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (voteEventObj.status === 'close') {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot Vote this vote status is close.', undefined);
            return res.status(400).send(errorResponse);
        }

        // check ban 
        const user = await this.userService.findOne({ _id: userObjId });
        if (user !== undefined && user !== null && user.banned === true) {
            const errorResponse = ResponseUtil.getErrorResponse('You have been banned.', undefined);
            return res.status(400).send(errorResponse);
        }
        const deleteVoted = await this.votedService.delete({ votingId: votingObjId, userId: userObjId });
        if (deleteVoted) {
            const successResponse = ResponseUtil.getSuccessResponse('Update Unvote is successfully.', undefined);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Update Unvote is not success.', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    @Post('/support/:votingId')
    @Authorized('user')
    public async UserSupport(@Param('votingId') votingId: string, @Res() res: any, @Req() req: any): Promise<any> {
        const votingObjId = new ObjectID(votingId);
        const userObjId = new ObjectID(req.user.id);
        const votingObj = await this.votingEventService.findOne({ _id: votingObjId });
        let eligibleValue = undefined;
        const eligibleConfig = await this.configService.getConfig(ELIGIBLE_VOTES);
        if (eligibleConfig) {
            eligibleValue = eligibleConfig.value;
        }
        const split = eligibleValue ? eligibleValue.split(',') : eligibleValue;
        const userObj = await this.userService.findOne({ _id: userObjId });

        if (votingObj.type === 'member' && split.includes(userObj.email) === false) {
            const authUser = await this.authenticationIdService.findOne({ user: userObjId, providerName: 'MFP', membershipState: 'APPROVED' });
            if (
                votingObj.type === 'member' &&
                authUser === undefined
            ) {
                const errorResponse = ResponseUtil.getErrorResponse('This vote only for membershipMFP, You are not membership.', undefined);
                return res.status(400).send(errorResponse);
            }
        }

        if (votingObj === undefined && votingObj === null) {
            const errorResponse = ResponseUtil.getErrorResponse('Not Found the Voting Object.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (votingObj.status !== 'support') {
            const errorResponse = ResponseUtil.getErrorResponse('You cannot support this vote, The vote status isn`t support anymore.', undefined);
            return res.status(400).send(errorResponse);
        }

        // check ban 
        const user = await this.userService.findOne({ _id: userObjId });
        if (user !== undefined && user !== null && user.banned === true) {
            const errorResponse = ResponseUtil.getErrorResponse('You have been banned.', undefined);
            return res.status(400).send(errorResponse);
        }

        // check spam support
        const checkUserSupport = await this.userSupportService.findOne({ userId: userObjId, votingId: votingObjId });
        if (checkUserSupport !== undefined && checkUserSupport !== null) {
            const errorResponse = ResponseUtil.getErrorResponse('You have been supported.', undefined);
            return res.status(400).send(errorResponse);
        }

        const userSupport = new UserSupportModel();
        userSupport.userId = userObjId;
        userSupport.votingId = votingObjId;

        const create = await this.userSupportService.create(userSupport);
        if (create) {
            const userSupports = await this.userSupportService.find({ votingId: votingObjId });
            const query = { _id: votingObjId };
            const newValue = { $set: { countSupport: userSupports.length } };
            const update = await this.votingEventService.update(query, newValue);
            if (update) {
                const response: any = {};
                response.createdDate = create.createdDate;
                response.createdTime = create.createdTime;
                response.id = create.id;
                response.userId = create.userId;
                response.votingId = create.votingId;
                response.userId = user.id;
                response.username = user.username;
                response.firstName = user.firstName;
                response.lastName = user.lastName;
                response.displayName = user.displayName;
                response.uniqueId = user.uniqueId;
                response.imageURL = user.imageURL;
                response.s3ImageURL = user.s3ImageURL;
                const successResponse = ResponseUtil.getSuccessResponse('Successfully create User Support.', response);
                return res.status(200).send(successResponse);
            } else {
                const errorResponse = ResponseUtil.getErrorResponse('Cannot create a user support.', undefined);
                return res.status(400).send(errorResponse);
            }
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot create a user support.', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    @Post('/ranking/')
    @Authorized('user')
    public async RankingLevel(@Res() res: any, @Req() req: any): Promise<any> {
        const reqUserId = req.headers.userid ? req.headers.userid : null;

        const response = await this.RankingLevelFunction(reqUserId);

        if (response.status === 1) {
            const successResponse = ResponseUtil.getSuccessResponse(response.message, response.data);
            return res.status(200).send(successResponse);
        }

        if (response.status === 0) {
            const errorResponse = ResponseUtil.getErrorResponse(response.message, response.data);
            return res.status(400).send(errorResponse);
        }
    }

    @Get('/.well-known/apple-app-site-association/')
    public async DeepLink(@Res() res: any, @Req() req: any): Promise<any> {
        const test = path.join(__dirname, '../../../apple-app-site-association'); // Construct an absolute file path

        if (fs.existsSync(test) === false) {
            return null;
        }
        const readfile = fs.readFileSync(test, { encoding: 'utf8' });

        return res.status(200).send(readfile);
    }

    // RetrieveVotingOptions ## Unsupport
    /*
    const query = {_id:votingObjId};
    const newValues = {$set:{countSupport:voteEventObj.countSupport + 1}};
    await this.votingEventService.update(query,newValues);
    */
    @Post('/unsupport/')
    @Authorized('user')
    public async Unsupport(@Body({ validate: true }) supportRequest: SupportRequest, @Res() res: any, @Req() req: any): Promise<any> {
        const votingObjId = new ObjectID(supportRequest.votingId);
        const userObjId = new ObjectID(req.user.id);

        const voteEventObj = await this.votingEventService.findOne({ _id: votingObjId });

        if (votingObjId !== undefined && votingObjId !== null && votingObjId.approved === false) {
            const errorResponse = ResponseUtil.getErrorResponse('VotingEvent Id is undefined.', undefined);
            return res.status(400).send(errorResponse);
        }
        const userSupportObj = await this.userSupportService.findOne({ votingId: votingObjId, userId: userObjId });
        if (userSupportObj === undefined) {
            const errorResponse = ResponseUtil.getErrorResponse('Not found user support.', undefined);
            return res.status(400).send(errorResponse);
        }

        if (voteEventObj.status !== 'support') {
            const errorResponse = ResponseUtil.getErrorResponse('You cannot support this vote, The vote status isn`t support anymore.', undefined);
            return res.status(400).send(errorResponse);
        }

        const unsupport = await this.userSupportService.delete({ votingId: votingObjId, userId: userObjId });
        if (unsupport) {
            const query = { _id: votingObjId };
            const newValues = { $set: { countSupport: voteEventObj.countSupport - 1 } };
            await this.votingEventService.update(query, newValues);
            const successResponse = ResponseUtil.getSuccessResponse('Unsupport is success.', undefined);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot support vote.', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    private async VoteChoice(voteItemId: string, voteItem: any, votingId: string, userId: string, pageId: string): Promise<any> {
        const created: any = [];
        if (voteItem.voteItemId !== undefined && voteItem.answer === undefined) {
            if (voteItem.voteChoice.length === 0) {
                return 'Select Vote Choice is empty.';
            }
            for (const item of voteItem.voteChoice) {
                const voted = new VotedModel();
                voted.votingId = new ObjectID(votingId);
                voted.userId = new ObjectID(userId);
                voted.pageId = pageId ? new ObjectID(pageId) : null;
                voted.answer = item.answer;
                voted.voteItemId = new ObjectID(voteItemId);
                voted.voteChoiceId = new ObjectID(item.voteChoiceId);
                const create = await this.votedService.create(voted);
                created.push(create);
            }
        } else {
            const voted = new VotedModel();
            voted.votingId = new ObjectID(votingId);
            voted.userId = new ObjectID(userId);
            voted.pageId = pageId ? new ObjectID(pageId) : null;
            voted.answer = voteItem.answer;
            voted.voteItemId = new ObjectID(voteItem.voteItemId);
            voted.voteChoiceId = null;
            const create = await this.votedService.create(voted);
            created.push(create);
        }
        return created;
    }

    private async CreateVoteChoice(createVoteItem: any, voteItems: any, userId?: string, pageId?: string): Promise<any> {
        const userObjId = new ObjectID(userId);
        const pageObjId = pageId !== null ? new ObjectID(pageId) : null;
        if (voteItems) {
            const voteChoiceObj = voteItems.voteChoice;
            const stack: any = [];
            if (voteChoiceObj.length > 0) {
                for (const voteChoicePiece of voteChoiceObj) {
                    if (voteChoicePiece._id !== undefined) {
                        continue;
                    }
                    if (voteChoicePiece.title === '') {
                        continue;
                    }
                    const voteChoice = new VoteChoiceModel();
                    voteChoice.voteItemId = new ObjectID(createVoteItem.id);
                    voteChoice.coverPageURL = voteChoicePiece.coverPageURL;
                    voteChoice.s3coverPageURL = voteChoicePiece.s3CoverPageURL;
                    voteChoice.title = voteChoicePiece.title;
                    voteChoice.assetId = voteChoicePiece.assetId;
                    voteChoice.userId = userObjId;
                    voteChoice.pageId = pageObjId;
                    const result = await this.voteChoiceService.create(voteChoice);
                    stack.push(result);
                }
                return stack;
            }
        }
    }
    // function นี้อย่าสับสนกับ CreateVoteChoice วัตถุประสงค์ไม่เหมือนกัน ของ CreateVoteChoice เป็นการแก้ไข vote แล้วสร้าง voteitem เพิ่ม
    // ส่วน FuncUpdateVoteChoice เพิ่ม voteChoice เข้ามา
    private async FuncUpdateVoteChoice(createVoteItem: any, voteItems: any): Promise<any> {

        if (voteItems) {
            const voteChoiceObj = voteItems.voteChoice;
            const stack: any = [];
            if (voteChoiceObj.length > 0) {
                for (const voteChoicePiece of voteChoiceObj) {
                    if (voteChoicePiece.title === '') {
                        continue;
                    }

                    const voteChoice = new VoteChoiceModel();
                    voteChoice.voteItemId = new ObjectID(createVoteItem.id);
                    voteChoice.coverPageURL = voteChoicePiece.coverPageURL;
                    voteChoice.s3coverPageURL = voteChoicePiece.s3CoverPageURL;
                    voteChoice.title = voteChoicePiece.title;
                    voteChoice.assetId = voteChoicePiece.assetId;
                    const result = await this.voteChoiceService.create(voteChoice);
                    stack.push(result);
                }
                return stack;
            }
        }
    }

    private async CheckEmptyTitleVoteChoice(voteItems: any): Promise<any> {
        const regex = /[%^*+|~=`{}\[\]\/]/;
        if (voteItems) {
            const voteChoiceObj = voteItems.voteChoice;
            if (voteChoiceObj.length > 0) {
                for (const voteChoicePiece of voteChoiceObj) {
                    const foundTitleVoteChoice = voteChoicePiece.title.match(regex);
                    if (foundTitleVoteChoice !== null && foundTitleVoteChoice.length > 0) {
                        return foundTitleVoteChoice;
                    }
                    if (voteChoicePiece.title === '') {
                        return '';
                    }
                    return foundTitleVoteChoice;
                }
            } else {
                return [];
            }
        }
    }

    private async RankingLevelFunction(user: string): Promise<any> {
        const reqUserId = user ? user : null;
        if (
            reqUserId === undefined ||
            reqUserId === null
        ) {
            const errorResponse = ResponseUtil.getErrorResponse('Headers.userid not found.', undefined);
            return errorResponse;
        }
        const userObjId = new ObjectID(user);

        // ranking level
        let rank = null;
        const rankingConfig = await this.configService.getConfig(PRIVILEGES);
        if (rankingConfig.value === '1') {
            rank = 1;
        }
        if (rankingConfig.value === '2') {
            rank = 2;
        }
        if (rankingConfig.value === '3') {
            rank = 3;
        }
        if (rank === 1) {
            let eligibleValue = undefined;
            const eligibleConfig = await this.configService.getConfig(ELIGIBLE_VOTES);
            if (eligibleConfig) {
                eligibleValue = eligibleConfig.value;
            }
            // whitelist
            const split = eligibleValue ? eligibleValue.split(',') : eligibleValue;
            const userObj = await this.userService.findOne({ _id: userObjId });
            if (split.includes(userObj.email) === true) {
                const successResponse = ResponseUtil.getSuccessResponse(1, true);
                return successResponse;
            }

            // membership
            const requestBody = {
                'grant_type': process.env.GRANT_TYPE,
                'client_id': process.env.CLIENT_ID,
                'client_secret': process.env.CLIENT_SECRET,
                'scope': process.env.SCOPE
            };

            const formattedData = qs.stringify(requestBody);

            const response = await axios.post(
                process.env.APP_MFP_API_OAUTH,
                formattedData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/json'
                }
            });
            // check the status user MFP
            const tokenCredential = response.data.access_token;
            const getMembershipById = await axios.get(
                process.env.API_MFP_GET_ID + userObjId,
                {
                    headers: {
                        Authorization: `Bearer ${tokenCredential}`
                    }
                }
            );

            if (getMembershipById.data.data.state !== 'APPROVED') {
                const errorResponse = ResponseUtil.getErrorResponse('Cannot Login Your state is not APPROVED.', undefined);
                return errorResponse;
            }
            const today = moment().toDate();

            // check the expired_membership
            const date = new Date(getMembershipById.data.data.expired_at);
            const expired_at = date.getTime();
            // check authentication by id or mobile or identification_number
            // .getTime() <= today.getTime()
            if (expired_at <= today.getTime()) {
                const errorUserNameResponse: any = { status: 0, message: 'Membership has expired.' };
                return errorUserNameResponse;
            }
            if (getMembershipById.data.data.state === 'PENDING_PAYMENT' && getMembershipById.data.data.membership_type === 'UNKNOWN') {
                const errorResponse = ResponseUtil.getErrorResponse('PENDING_PAYMENT', undefined);
                return errorResponse;
            }
            // PENDING_APPROVAL 400
            if (getMembershipById.data.data.state === 'PENDING_APPROVAL') {
                const errorResponse = ResponseUtil.getErrorResponse('PENDING_APPROVAL', undefined);
                return errorResponse;
            }
            // REJECTED 400
            if (getMembershipById.data.data.state === 'REJECTED') {
                const errorResponse = ResponseUtil.getErrorResponse('REJECTED', undefined);
                return errorResponse;
            }
            // PROFILE_RECHECKED 400
            if (getMembershipById.data.data.state === 'PROFILE_RECHECKED') {
                const errorResponse = ResponseUtil.getErrorResponse('PROFILE_RECHECKED', undefined);
                return errorResponse;
            }
            if (getMembershipById.data.data.state === 'ARCHIVED') {
                const errorResponse = ResponseUtil.getErrorResponse('ARCHIVED', undefined);
                return errorResponse;
            }

            const authentication = await this.authenticationIdService.findOne({ user: userObjId, providerName: 'MFP' });
            if (authentication !== undefined) {
                const successResponse = ResponseUtil.getSuccessResponse(2, false);
                return successResponse;
            } else {
                const successResponse = ResponseUtil.getSuccessResponse(3, false);
                return successResponse;
            }
        }

        if (rank === 2) {
            let eligibleValue = undefined;
            const eligibleConfig = await this.configService.getConfig(ELIGIBLE_VOTES);
            if (eligibleConfig) {
                eligibleValue = eligibleConfig.value;
            }
            // whitelist
            const split = eligibleValue ? eligibleValue.split(',') : eligibleValue;
            const userObj = await this.userService.findOne({ _id: userObjId });
            if (split.includes(userObj.email) === true) {
                const successResponse = ResponseUtil.getSuccessResponse(1, false);
                return successResponse;
            }

            // membership
            const requestBody = {
                'grant_type': process.env.GRANT_TYPE,
                'client_id': process.env.CLIENT_ID,
                'client_secret': process.env.CLIENT_SECRET,
                'scope': process.env.SCOPE
            };

            const formattedData = qs.stringify(requestBody);

            const response = await axios.post(
                process.env.APP_MFP_API_OAUTH,
                formattedData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/json'
                }
            });
            // check the status user MFP
            const tokenCredential = response.data.access_token;
            const getMembershipById = await axios.get(
                process.env.API_MFP_GET_ID + userObjId,
                {
                    headers: {
                        Authorization: `Bearer ${tokenCredential}`
                    }
                }
            );

            if (getMembershipById.data.data.state !== 'APPROVED') {
                const errorResponse = ResponseUtil.getErrorResponse('Cannot Login Your state is not APPROVED.', undefined);
                return errorResponse;
            }
            const today = moment().toDate();

            // check the expired_membership
            const date = new Date(getMembershipById.data.data.expired_at);
            const expired_at = date.getTime();
            // check authentication by id or mobile or identification_number
            // .getTime() <= today.getTime()
            if (expired_at <= today.getTime()) {
                const errorUserNameResponse: any = { status: 0, message: 'Membership has expired.' };
                return errorUserNameResponse;
            }
            if (getMembershipById.data.data.state === 'PENDING_PAYMENT' && getMembershipById.data.data.membership_type === 'UNKNOWN') {
                const errorResponse = ResponseUtil.getErrorResponse('PENDING_PAYMENT', undefined);
                return errorResponse;
            }
            // PENDING_APPROVAL 400
            if (getMembershipById.data.data.state === 'PENDING_APPROVAL') {
                const errorResponse = ResponseUtil.getErrorResponse('PENDING_APPROVAL', undefined);
                return errorResponse;
            }
            // REJECTED 400
            if (getMembershipById.data.data.state === 'REJECTED') {
                const errorResponse = ResponseUtil.getErrorResponse('REJECTED', undefined);
                return errorResponse;
            }
            // PROFILE_RECHECKED 400
            if (getMembershipById.data.data.state === 'PROFILE_RECHECKED') {
                const errorResponse = ResponseUtil.getErrorResponse('PROFILE_RECHECKED', undefined);
                return errorResponse;
            }
            if (getMembershipById.data.data.state === 'ARCHIVED') {
                const errorResponse = ResponseUtil.getErrorResponse('ARCHIVED', undefined);
                return errorResponse;
            }

            const authentication = await this.authenticationIdService.findOne({ user: userObjId, providerName: 'MFP' });
            if (authentication !== undefined) {
                const successResponse = ResponseUtil.getSuccessResponse(2, true);
                return successResponse;
            } else {
                const successResponse = ResponseUtil.getSuccessResponse(3, false);
                return successResponse;
            }
        }

        if (rank === 3) {
            let eligibleValue = undefined;
            const eligibleConfig = await this.configService.getConfig(ELIGIBLE_VOTES);
            if (eligibleConfig) {
                eligibleValue = eligibleConfig.value;
            }
            // whitelist
            const split = eligibleValue ? eligibleValue.split(',') : eligibleValue;
            const userObj = await this.userService.findOne({ _id: userObjId });
            if (split.includes(userObj.email) === true) {
                const successResponse = ResponseUtil.getSuccessResponse(1, false);
                return successResponse;
            }

            // membership
            const requestBody = {
                'grant_type': process.env.GRANT_TYPE,
                'client_id': process.env.CLIENT_ID,
                'client_secret': process.env.CLIENT_SECRET,
                'scope': process.env.SCOPE
            };

            const formattedData = qs.stringify(requestBody);

            const response = await axios.post(
                process.env.APP_MFP_API_OAUTH,
                formattedData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/json'
                }
            });
            // check the status user MFP
            const tokenCredential = response.data.access_token;
            const getMembershipById = await axios.get(
                process.env.API_MFP_GET_ID + userObjId,
                {
                    headers: {
                        Authorization: `Bearer ${tokenCredential}`
                    }
                }
            );

            if (getMembershipById.data.data.state !== 'APPROVED') {
                const errorResponse = ResponseUtil.getErrorResponse('Cannot Login Your state is not APPROVED.', undefined);
                return errorResponse;
            }
            const today = moment().toDate();

            // check the expired_membership
            const date = new Date(getMembershipById.data.data.expired_at);
            const expired_at = date.getTime();
            // check authentication by id or mobile or identification_number
            // .getTime() <= today.getTime()
            if (expired_at <= today.getTime()) {
                const errorUserNameResponse: any = { status: 0, message: 'Membership has expired.' };
                return errorUserNameResponse;
            }
            if (getMembershipById.data.data.state === 'PENDING_PAYMENT' && getMembershipById.data.data.membership_type === 'UNKNOWN') {
                const errorResponse = ResponseUtil.getErrorResponse('PENDING_PAYMENT', undefined);
                return errorResponse;
            }
            // PENDING_APPROVAL 400
            if (getMembershipById.data.data.state === 'PENDING_APPROVAL') {
                const errorResponse = ResponseUtil.getErrorResponse('PENDING_APPROVAL', undefined);
                return errorResponse;
            }
            // REJECTED 400
            if (getMembershipById.data.data.state === 'REJECTED') {
                const errorResponse = ResponseUtil.getErrorResponse('REJECTED', undefined);
                return errorResponse;
            }
            // PROFILE_RECHECKED 400
            if (getMembershipById.data.data.state === 'PROFILE_RECHECKED') {
                const errorResponse = ResponseUtil.getErrorResponse('PROFILE_RECHECKED', undefined);
                return errorResponse;
            }
            if (getMembershipById.data.data.state === 'ARCHIVED') {
                const errorResponse = ResponseUtil.getErrorResponse('ARCHIVED', undefined);
                return errorResponse;
            }

            const authentication = await this.authenticationIdService.findOne({ user: userObjId, providerName: 'MFP' });
            if (authentication !== undefined) {
                const successResponse = ResponseUtil.getSuccessResponse(2, false);
                return successResponse;
            } else {
                const successResponse = ResponseUtil.getSuccessResponse(3, true);
                return successResponse;
            }
        }
    }

    private async CheckVoteChoices(voteItems: any, maxVoteChoices: any): Promise<any> {
        const voteChoiceObj = voteItems.voteChoice;
        if (voteChoiceObj.length > 0) {
            if (voteChoiceObj.length > maxVoteChoices) {
                return 0;
            }
        }
    }

    private async UpdateVoteChoice(voteItem: any): Promise<any> {
        if (voteItem.voteChoice.length > 0) {
            for (const voteChoice of voteItem.voteChoice) {
                if (voteChoice._id === undefined) {
                    return undefined;
                }
                const query = { _id: new ObjectID(voteChoice._id) };
                const newValues = {
                    $set: {
                        title: voteChoice.title,
                        coverPageURL: voteChoice.coverPageURL,
                        s3CoverPageURL: voteChoice.s3CoverPageURL,
                        assetId: voteChoice.assetId
                    }
                };
                await this.voteChoiceService.update(query, newValues);
            }
            return true;
        }
    }

    private async HashTagVoting(hashTagObjs: any): Promise<any> {
        const stackId: any = [];
        if (hashTagObjs.votingEvent.length > 0) {
            for (const hashTagObj of hashTagObjs.votingEvent) {
                stackId.push(new ObjectID(hashTagObj._id));
            }
        }

        return stackId;
    }

    private async CheckSpamVote(voteObject: any, voteEventId: string, pageId: string, userId: string): Promise<any> {
        let voted: any = undefined;
        if (voteObject.voteChoice.length > 0) {
            for (const choice of voteObject.voteChoice) {
                if (pageId !== undefined) {
                    if (choice.voteChoiceId !== undefined) {
                        voted = await this.votedService.findOne(
                            {
                                votingId: new ObjectID(voteEventId),
                                pageId: new ObjectID(pageId),
                                voteItemId: new ObjectID(voteObject.voteItemId),
                                voteChoiceId: new ObjectID(choice.voteChoiceId)
                            }
                        );
                    } if (voted !== undefined) {
                        return voted;
                    } else {
                        return undefined;
                    }
                } else {
                    // type single, multi
                    if (choice.voteChoiceId !== undefined) {
                        // check single type ?
                        const signleType = await this.voteItemService.findOne(
                            {
                                _id: new ObjectID(voteObject.voteItemId),
                                votingId: new ObjectID(voteEventId),
                                type: 'single'
                            });
                        if (signleType !== undefined) {
                            voted = await this.votedService.findOne(
                                {
                                    votingId: signleType.votingId,
                                    userId: new ObjectID(userId),
                                    voteItemId: signleType.id
                                }
                            );
                            if (voted !== undefined) {
                                return voted;
                            }
                        }

                        voted = await this.votedService.findOne(
                            {
                                votingId: new ObjectID(voteEventId),
                                userId: new ObjectID(userId),
                                voteItemId: new ObjectID(voteObject.voteItemId),
                                voteChoiceId: new ObjectID(choice.voteChoiceId)
                            }
                        );
                    }
                    if (voted !== undefined) {
                        return voted;
                    } else {
                        return undefined;
                    }
                }
            }
        } else {
            if (pageId !== undefined) {
                voted = await this.votedService.findOne(
                    {
                        votingId: new ObjectID(voteEventId),
                        pageId: new ObjectID(pageId),
                        voteItemId: new ObjectID(voteObject.voteItemId)
                    }
                );
                if (voted !== undefined) {
                    return voted;
                } else {
                    return undefined;
                }
            } else {
                voted = await this.votedService.findOne(
                    {
                        votingId: new ObjectID(voteEventId),
                        userId: new ObjectID(userId),
                        voteItemId: new ObjectID(voteObject.voteItemId)
                    }
                );
                if (voted !== undefined) {
                    return voted;
                } else {
                    return undefined;
                }
            }
        }
    }
}