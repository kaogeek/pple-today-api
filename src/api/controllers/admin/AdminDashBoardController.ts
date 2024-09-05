import { JsonController, Res, Post, Body, Req, Authorized } from 'routing-controllers';
import { AuthenticationIdService } from '../../services/AuthenticationIdService';
import { UserService } from '../../services/UserService';
import { PageService } from '../../services/PageService';
import { ResponseUtil } from '../../../utils/ResponseUtil';
import moment from 'moment';
import { DashBoardRequest } from '../requests/DashBoardRequest';
import { WorkerThreadService } from '../../services/WokerThreadService';
import axios from 'axios';
import { ObjectID } from 'mongodb';
import { NotiTypeAction } from '../../../constants/WorkerThread';

@JsonController('/admin/dashboard')
export class AdminDashBoardController {
    constructor(
        private userService: UserService,
        private pageService: PageService,
        private authenticationIdService: AuthenticationIdService,
        private workerThreadService:WorkerThreadService
    ) { }

    @Post('/engagement')
    @Authorized()
    public async engagementDashboard(@Body({ validate: true }) search: DashBoardRequest, @Res() res: any, @Req() req: any): Promise<any>{
        // lineNewsWeekId
        // the_things
        const aggsLineNoti:any = await this.workerThreadService.aggregate(
            [
                {
                    $match: {
                        createdDate: { $gte: new Date(search.createDateLineNoti), $lte: new Date(search.endDateLineNoti) },
                        type: NotiTypeAction['line_noti']
                    }
                },
                {
                    $lookup: {
                        from:'Posts',
                        let: {postIds: '$postIds'},
                        pipeline:[
                            {
                                $match:{
                                    $expr:{
                                        $in:['$_id','$$postIds']
                                    }
                                }
                            },
                            {
                               $lookup: {
                                from: 'UserLike',
                                let: {id: '$_id'},
                                pipeline: [
                                    {
                                        $match:{
                                            $expr:{
                                                $eq:['$$id','$subjectId']
                                                }
                                            }
                                        }
                                    ],
                                    as:'userLike'
                               }
                            },
                            {
                                $lookup:{
                                    from: 'PostsComment',
                                    let: {id: '$_id'},
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr:
                                                {
                                                    $eq:['$$id','$post']
                                                }
                                            }
                                        }
                                    ],
                                    as:'postsComment'
                                }
                            },
                            {
                                $lookup: {
                                    from: 'IsReadPost',
                                    let: {id: '$_id'},
                                    pipeline: [
                                        {
                                            $match:{
                                                $expr:{
                                                    $in:['$$id','$postId']
                                                }
                                            }
                                        },
                                        {
                                            $match:{
                                                action:'LINE_NOTI'
                                            }
                                        }
                                    ],
                                    as:'isReadPost'
                                }
                            },
                            {
                                $addFields: {
                                    userLikeCount: { $size: '$userLike'},
                                    userCommentCount: { $size: '$postsComment'},
                                    userReadCount: { $size: '$isReadPost'}
                                }
                            },
                            {
                                $project: {
                                    _id:1,
                                    pageId:1,
                                    title:1,
                                    detail:1,
                                    type:1,
                                    ownerUser:1,
                                    userLikeCount:1,
                                    userCommentCount:1,
                                    userReadCount:1
                                }
                            },
                        ],
                        as:'posts'
                    }
                },
                {
                    $sort: {
                        createdDate: -1
                    }
                },
            ]
        );
        console.log('aggsLineNoti',aggsLineNoti[0]._id);
        const aggsPpleNoti:any = await this.workerThreadService.aggregate(
            [
                {
                    $match: {
                        createdDate: { $gte: new Date(search.createDatePpleNews), $lte: new Date(search.endDatePpleNews) },
                        type: NotiTypeAction['pple_news_noti']
                    }
                },
                {
                    $lookup: {
                        from:'Posts',
                        let: {postIds:'$postIds'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in:['$_id','$$postIds']
                                    }
                                }
                            },
                            {
                                $lookup: {
                                 from: 'UserLike',
                                 let: {id: '$_id'},
                                 pipeline: [
                                     {
                                         $match:{
                                             $expr:{
                                                 $eq:['$$id','$subjectId']
                                                 }
                                             }
                                         }
                                     ],
                                     as:'userLike'
                                }
                            },
                            {
                                $lookup:{
                                    from: 'PostsComment',
                                    let: {id: '$_id'},
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr:
                                                {
                                                    $eq:['$$id','$post']
                                                }
                                            }
                                        }
                                    ],
                                    as:'postsComment'
                                }
                            },
                            {
                                $lookup: {
                                    from: 'IsReadPost',
                                    let: {id: '$_id'},
                                    pipeline: [
                                        {
                                            $match:{
                                                $expr:{
                                                    $in:['$$id','$postId']
                                                }
                                            }
                                        },
                                        {
                                            $match:{
                                                action:'PPLE_NEWS'
                                            }
                                        }
                                    ],
                                    as:'isReadPost'
                                }
                            },
                            {
                                $addFields: {
                                    userLikeCount: { $size: '$userLike'},
                                    userCommentCount: { $size: '$postsComment'},
                                    userReadCount: { $size: '$isReadPost'}
                                }
                            },
                            {
                                $project: {
                                    _id:1,
                                    pageId:1,
                                    title:1,
                                    detail:1,
                                    type:1,
                                    ownerUser:1,
                                    userLikeCount:1,
                                    userCommentCount:1,
                                    userReadCount:1,
                                }
                            },
                        ],
                        as: 'posts'
                    }
                },
                {
                    $sort: {
                        createdDate: -1
                    }
                },
            ]
        );
        console.log('aggsPpleNoti',aggsPpleNoti[0]._id);
        const aggsVoteNoti:any = await this.workerThreadService.aggregate(
            [
                {
                    $match: {
                        createdDate: { $gte: new Date(search.createDateVoteEventNoti), $lte: new Date(search.endDateVoteEventNoti) },
                        type: NotiTypeAction['vote_event_noti']
                    }
                },
                {
                    $lookup: {
                        from:'VotingEvent',
                        let: {theThings: '$theThings'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq:['$$theThings','$_id']
                                    }
                                }
                            },
                            {
                                $project:{
                                    _id:1,
                                    title:1,
                                    detail:1,
                                    assertId:1,
                                    converPageURL:1,
                                    s3ConverPageURL:1,
                                    userId:1,
                                    approved:1,
                                    closed:1

                                }
                            },
                        ],
                        as:'votingEvent'
                    }
                },
                {
                    $unwind:{
                        path:'$votingEvent',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup:{
                        from:'UserEngagement',
                        let: {votingId: '$votingId'},
                        pipeline:[
                            {
                                $match:{
                                    $expr:{
                                        $in:['$votingId','$$votingId']
                                    }
                                }
                            },
                            {
                                $lookup:{
                                    from:'VoteItem',
                                    let:{voteItemId:'$voteItemId'},
                                    pipeline:[
                                        {
                                            $match:{
                                                $expr:{
                                                    $in: ['$_id', { $ifNull: ['$$voteItemId', []] }]
                                                }
                                            }
                                        },
                                    ],
                                    as:'voteItem'
                                }
                            },
                            {
                                $unwind:{
                                    path:'$voteItem',
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $project:{
                                    _id:1,
                                    device:1,
                                    userId:1,
                                    action:1,
                                    voteId:1,
                                    voteChoiceId:1,
                                    voteItem:1,
                                    voteItemId:1,
                                    votingEvent:1,
                                    votingId:1,
                                    
                                }
                            }
                        ],
                        as:'userEngagement'
                    }
                },
                {
                    $addFields: {
                        userVoteSingleChoiceCount: {
                            $size: {
                                $filter: {
                                    input: '$userEngagement',
                                    as: 'item',
                                    cond: { $eq: ['$$item.voteItem.type', 'single']}
                                }
                            }
                        },
                        userVoteMultiChoiceCount: {
                            $size: {
                                $filter: {
                                    input: '$userEngagement',
                                    as: 'item',
                                    cond: { $eq: ['$$item.voteItem.type', 'multi']}
                                }
                            }
                        },
                        userVoteTextChoiceCount: {
                            $size: {
                                $filter: {
                                    input: '$userEngagement',
                                    as: 'item',
                                    cond: { $eq: ['$$item.voteItem.type', 'text']}
                                }
                            }
                        }
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
                        theThings:1,
                        sending:1,
                        sended:1,
                        type:1,
                        postIds:1,
                        active:1,
                        votingEvent:1,
                        userVoteSingleChoiceCount:1,
                        userVoteMultiChoiceCount:1,
                        userVoteTextChoiceCount:1,
                    }
                },
                {
                    $sort: {
                        createdDate: -1
                    }
                },
            ]
        );

        const result:any = {
            'LINE_NOTI' : {
                'data': aggsLineNoti,
            },
            'PPLE_NEWS': {
                'data': aggsPpleNoti,
            },
            'VOTE_EVENT_NOTI': {
                'data': aggsVoteNoti,
            }
        };
        const successResponse = ResponseUtil.getSuccessResponse('DashBoard.', result);
        return res.status(200).send(successResponse);
    }

    @Post('/')
    @Authorized()
    public async dashboard(@Body({ validate: true }) search: DashBoardRequest, @Res() res: any, @Req() req: any): Promise<any> {
        const startDate: any = new Date(search.createDate);
        const endDate: any = new Date(search.endDate);

        if (startDate.getTime() > endDate.getTime()) {
            const errorResponse = ResponseUtil.getErrorResponse('StartDate > EndDate.', undefined);
            return res.status(400).send(errorResponse);
        }

        const timestamp = moment(startDate);
        const yearString = timestamp.format('YYYY'); // Output: "months"

        const provinces = await axios.get('https://raw.githubusercontent.com/earthchie/jquery.Thailand.js/master/jquery.Thailand.js/database/raw_database/raw_database.json');
        const users = await this.userService.aggregate(
            [

                {
                    $match: {
                        banned: false,
                        createdDate: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $sort: {
                        createdDate: 1
                    }
                },
                {
                    $project: {
                        _id: 1,
                        firstName: 1,
                        createdDate: 1
                    }
                }
            ]
        );

        const totalMFP = await this.authenticationIdService.aggregate(
            [
                {
                    $match: {
                        providerName: 'MFP'
                    }
                },
                {
                    $count: 'Total_MFP'
                }
            ]
        );

        const result: any = {
            'January': [],
            'February': [],
            'March': [],
            'April': [],
            'May': [],
            'June': [],
            'July': [],
            'August': [],
            'September': [],
            'October': [],
            'November': [],
            'December': [],
            'province': []
        };

        if (users.length > 0) {

            for (const user of users) {
                const parsedTimestamp = moment(user.createdDate);
                const monthString = parsedTimestamp.format('MMMM'); // Output: "months"
                // console.log('monthString',monthString);
                if (String(monthString) === 'January') {
                    // console.log('pass1');
                    result['January'].push(user);
                } else if (String(monthString) === 'February') {
                    result['February'].push(user);
                } else if (String(monthString) === 'March') {
                    result['March'].push(user);
                } else if (String(monthString) === 'April') {
                    result['April'].push(user);
                } else if (String(monthString) === 'May') {
                    result['May'].push(user);
                } else if (String(monthString) === 'June') {
                    result['June'].push(user);
                } else if (String(monthString) === 'July') {
                    result['July'].push(user);
                } else if (String(monthString) === 'August') {
                    result['August'].push(user);
                } else if (String(monthString) === 'September') {
                    result['September'].push(user);
                } else if (String(monthString) === 'October') {
                    result['October'].push(user);
                } else if (String(monthString) === 'November') {
                    result['November'].push(user);
                } else if (String(monthString) === 'December') {
                    result['December'].push(user);
                }
            }
        }
        const totalUser = await this.userService.aggregate(
            [

                {
                    $match: {
                        banned: false,
                    }
                },
                {
                    $count: 'Total_users'
                }
            ]
        );
        result['Year'] = yearString;
        result['Total_users'] = totalUser[0].Total_users;
        result['Total_MFP'] = totalMFP.length > 0 ? totalMFP[0].Total_MFP : [];
        result['January'] = result['January'].length;
        result['February'] = result['February'].length;
        result['March'] = result['March'].length;
        result['April'] = result['April'].length;
        result['May'] = result['May'].length;
        result['June'] = result['June'].length;
        result['July'] = result['July'].length;
        result['August'] = result['August'].length;
        result['September'] = result['September'].length;
        result['October'] = result['October'].length;
        result['November'] = result['November'].length;
        result['December'] = result['December'].length;

        if (provinces.data.length > 0) {
            for (const province of provinces.data) {
                result['province'].push(province.province);
            }
        }
        result['province'] = result['province'].filter((item,
            index) => result['province'].indexOf(item) === index
        );
        const findUsersByProvince = await this.userService.aggregate(
            [
                {
                    $match: {
                        createdDate: { $gte: startDate, $lte: endDate },
                        province: { $in: result['province'] }
                    }
                },
                {
                    $group: {
                        _id: '$province',
                        count: { $sum: 1 }
                    }
                }
            ]
        );

        result['province'] = findUsersByProvince;

        if (users.length > 0) {
            const successResponse = ResponseUtil.getSuccessResponse('DashBoard.', result);
            return res.status(200).send(successResponse);
        } else {
            const successResponse = ResponseUtil.getSuccessResponse('DashBoard.', []);
            return res.status(200).send(successResponse);
        }
    }

    @Post('/users/mfp')
    @Authorized()
    public async findUsersMFP(@Body({ validate: true }) search: DashBoardRequest, @Res() res: any, @Req() req: any): Promise<any> {
        const startDate: any = new Date(search.createDate);
        const endDate: any = new Date(search.endDate);

        if (startDate.getTime() > endDate.getTime()) {
            const errorResponse = ResponseUtil.getErrorResponse('StartDate > EndDate.', undefined);
            return res.status(400).send(errorResponse);
        }
        const provinces = await axios.get('https://raw.githubusercontent.com/earthchie/jquery.Thailand.js/master/jquery.Thailand.js/database/raw_database/raw_database.json');
        const stack: any = {
            'province': [],
        };

        if (provinces.data.length > 0) {
            for (const province of provinces.data) {
                stack['province'].push(province.province);
            }
        }
        stack['province'] = stack['province'].filter((item,
            index) => stack['province'].indexOf(item) === index
        );

        const mfpUserId = [];

        const mfpUsers = await this.authenticationIdService.aggregate(
            [
                {
                    $match: {
                        providerName: 'MFP'
                    }
                }
            ]
        );
        if (mfpUsers.length > 0) {
            for (const mfp of mfpUsers) {
                mfpUserId.push(new ObjectID(mfp.user));
            }
        }

        const findUsersMfpByProvince = await this.userService.aggregate(
            [
                {
                    $match: {
                        _id: { $in: mfpUserId },
                        province: { $in: stack['province'] },
                        banned: false,
                        createdDate: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: '$province',
                        count: { $sum: 1 }
                    }
                }
            ]
        );

        const followerPage = await this.pageService.aggregate(
            [
                {
                    $match: {
                        isOfficial: true,
                        banned: false
                    }
                },
                {
                    $lookup: {
                        from: 'UserFollow',
                        let: { id: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$$id', '$subjectId']
                                    }
                                }
                            },
                            {
                                $match: {
                                    subjectType: 'PAGE'
                                }
                            },
                            {
                                $count: 'total_follows'
                            }
                        ],
                        as: 'userFollow'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        imageURL: 1,
                        coverURL: 1,
                        isOfficial: 1,
                        banned: 1,
                        province: 1,
                        userFollow: 1
                    }
                },
                {
                    $sort: {
                        userFollow: -1
                    }
                },
                {
                    $unwind: {
                        path: '$userFollow'
                    }
                },
                {
                    $limit: 50
                }
            ]
        );

        const totalUser = await this.userService.aggregate(
            [

                {
                    $match: {
                        banned: false,
                    }
                },
                {
                    $count: 'Total_users'
                }
            ]
        );

        const totalMFP = await this.authenticationIdService.aggregate(
            [
                {
                    $match: {
                        providerName: 'MFP'
                    }
                },
                {
                    $count: 'Total_MFP'
                }
            ]
        );

        const result: any = {
            'mfpUsers': {},
            'followerPage': {}
        };
        result['mfpUsers'] = {
            'label': 'MFP Users',
            'data': findUsersMfpByProvince
        };
        result['followerPage'] = {
            'label': 'Follower Page',
            'data': followerPage,
        };

        result['Total_MFP'] = {
            'label': 'Total users MFP',
            'data': totalMFP.length > 0 ? totalMFP[0].Total_MFP : []
        };

        result['Total_USERS'] = {
            'label': 'General users',
            'data': totalUser.length > 0 ? totalUser[0].Total_users: []
        };

        if (result) {
            const successResponse = ResponseUtil.getSuccessResponse('DashBoard.', result);
            return res.status(200).send(successResponse);
        } else {
            const successResponse = ResponseUtil.getSuccessResponse('DashBoard.', []);
            return res.status(200).send(successResponse);
        }
    }
}