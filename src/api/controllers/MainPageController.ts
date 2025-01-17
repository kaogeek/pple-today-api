/*
 * @license Spanboon Platform v0.1
 * (c) 2020-2021 KaoGeek. http://kaogeek.dev
 * License: MIT. https://opensource.org/licenses/MIT
 * Author:  shiorin <junsuda.s@absolute.co.th>, chalucks <chaluck.s@absolute.co.th>
 */

import 'reflect-metadata';
import { JsonController, Res, Get, Post, Body, Req, QueryParam } from 'routing-controllers';
import axios from 'axios';
import { ResponseUtil } from '../../utils/ResponseUtil';
import { ProcessorUtil } from '../../utils/ProcessorUtil';
import { ObjectID } from 'mongodb';
import { PageService } from '../services/PageService';
import { HashTagService } from '../services/HashTagService';
import { UserService } from '../services/UserService';
import { SearchHistoryService } from '../services/SearchHistoryService';
import { SearchRequest } from './requests/SearchRequest';
import { ContentSearchRequest } from './requests/ContentSearchRequest';
import { IsRead } from './requests/IsRead';
import { SearchContentResponse } from './responses/SearchContentResponse';
import { PostsService } from '../services/PostsService';
import { UserFollowService } from '../services/UserFollowService';
import { PageObjectiveService } from '../services/PageObjectiveService';
import { SUBJECT_TYPE } from '../../constants/FollowType';
import { SEARCH_TYPE, SORT_SEARCH_TYPE } from '../../constants/SearchType';
import { SearchFilter } from './requests/SearchFilterRequest';
import { LastestLookingSectionProcessor } from '../processors/LastestLookingSectionProcessor';
import { EmergencyEventSectionProcessor } from '../processors/EmergencyEventSectionProcessor';
import { PostSectionProcessor } from '../processors/PostSectionProcessor';
import { PostSectionObjectiveProcessor } from '../processors/PostSectionObjectiveProcessor';
import { PageRoundRobinProcessor } from '../processors/PageRoundRobinProcessor';
import { MajorTrendSectionModelProcessor } from '../processors/MajorTrendSectionModelProcessor';
import { ObjectiveProcessor } from '../processors/ObjectiveProcessor';
import { NeedsService } from '../services/NeedsService';
import { EmergencyEventService } from '../services/EmergencyEventService';
import { S3Service } from '../services/S3Service';
import { UserRecommendSectionProcessor } from '../processors/UserRecommendSectionProcessor';
import { UserFollowSectionProcessor } from '../processors/UserFollowSectionProcessor';
import { UserPageLookingSectionProcessor } from '../processors/UserPageLookingSectionProcessor';
import { LastestObjectiveProcessor } from '../processors/LastestObjectiveProcessor';
import { EmergencyEventPinProcessor } from '../processors/EmergencyEventPinProcessor';
import { User } from '../models/User';
import { Page } from '../models/Page';
import { HashTag } from '../models/HashTag';
import { PageObjective } from '../models/PageObjective';
import { EmergencyEvent } from '../models/EmergencyEvent';
import { DateTimeUtil } from '../../utils/DateTimeUtil';
import { FollowingRecommendProcessor } from '../processors/FollowingRecommendProcessor';
import { LIKE_TYPE } from '../../constants/LikeType';
import { UserLikeService } from '../services/UserLikeService';
import { UserLike } from '../models/UserLike';
import { PostsCommentService } from '../services/PostsCommentService';
import { PostsComment } from '../models/PostsComment';
import { AssetService } from '../services/AssetService';
import { ImageUtil } from '../../utils/ImageUtil';
import { KaoKaiHashTagModelProcessor } from '../processors/KaoKaiHashTagModelProcessor';
import { KaokaiAllProvinceModelProcessor } from '../processors/KaokaiAllProvinceModelProcessor';
import { IsReadPostService } from '../services/IsReadPostService';
import { KaokaiTodayService } from '../services/KaokaiTodayService';
import { NotificationService } from '../services/NotificationService';
import { IsReadSectionProcessor } from '../processors/IsReadSectionProcessor';
import { PageFollowingPostSectionModelProcessor } from '../processors/PageFollowingPostSectionModelProcessor';
import { EmergencyFollowingPostSectionModelProcessor } from '../processors/EmergencyFollowingPostSectionModelProcessor';
import { ObjectiveFollowingPostSectionModelProcessor } from '../processors/ObjectiveFollowingPostSectionModelProcessor';
import { UserFollowingPostSectionModelProcessor } from '../processors/UserFollowingPostSectionModelProcessor';
import { FollowingProvinceSectionModelProcessor } from '../processors/FollowingProvinceSectionModelProcessor';
import { UserEngagement } from '../models/UserEngagement';
import { UserEngagementService } from '../services/UserEngagementService';
import { Worker} from 'worker_threads';
// import { PostsGalleryService } from '../services/PostsGalleryService';
import {
    TODAY_DATETIME_GAP,
    DEFAULT_TODAY_DATETIME_GAP,
    KAOKAITODAY_TIMER_CHECK_DATE,
    DEFAULT_KAOKAITODAY_TIMER_CHECK_DAY,
    KAOKAITODAY_RANGE_DATE_EMERGENCY,
    DEFAULT_KAOKAITODAY_RANGE_DATE_EMERGENY,
    SWITCH_CASE_SEND_EMAIL,
    DEFAULT_SWITCH_CASE_SEND_EMAIL,
    SEND_EMAIL_TO_USER,
    KAOKAITODAY_ANNOUNCEMENT,
    KAOKAITODAY_LINK_ANNOUNCEMENT,
    DEFAULT_KAOKAITODAY_ANNOUNCEMENT,
    DEFAULT_KAOKAITODAY_LINK_ANNOUNCEMENT,
    KAOKAITODAY_RANGE_OF_POPULAR_HASHTAGS,
    DEFAULT_KAOKAITODAY_RANGE_OF_POPULAR_HASHTAGS,
    SWITCH_CASE_SEND_NOTI,
    DEFAULT_SWITCH_CASE_SEND_NOTI,
    DEFAULT_SEARCH_CONFIG_VALUE,
    SEARCH_CONFIG_VALUES,
    DEFAULT_REVERSE_SEARCH,
    REVERSE_SEARCH,
    DEFAULT_FILTER_NEWS,
    FILTER_NEWS,
    VOTE_DASHBOARD,
    DEFAULT_TODAY_NEWS_POINT,
    TODAY_NEWS_POINT,
    DEFAULT_SWITCHING_LINE_FLEX_MESSAGE,
    SWITCHING_LINE_FLEX_MESSAGE,
} from '../../constants/SystemConfig';
import { ConfigService } from '../services/ConfigService';
import { KaokaiTodaySnapShotService } from '../services/KaokaiTodaySnapShot';
import { KaokaiContentModelProcessor } from '../processors/KaokaiContentModelProcessor';
import { MAILService } from '../../auth/mail.services';
import { DeviceTokenService } from '../services/DeviceToken';
import { NotificationNewsService } from '../services/NotificationNewsService';
import { FollowingContentsModelProcessor } from '../processors/FollowingContentsModelProcessor';
import moment from 'moment';
import { HidePostService } from '../services/HidePostService';
import { NewsClickService } from '../services/NewsClickService';
import { NewsClickModel } from '../models/NewsClickModel';
import { FileUtil } from '../../utils/FileUtil';
import { AssetRequest } from './requests/AssetRequest';
import { ASSET_CONFIG_NAME, DEFAULT_ASSET_CONFIG_VALUE } from '../../constants/SystemConfig';
import { ASSET_SCOPE } from '../../constants/AssetScope';
import { Asset } from '../models/Asset';
import * as AWS from 'aws-sdk'; // Load the SDK for JavaScript
import { S3 } from '@aws-sdk/client-s3';
import { PointStatementModel } from '../models/PointStatementModel';
import { PointStatementService } from '../services/PointStatementService';
import { AccumulateService } from '../services/AccumulateService';
import { AccumulateModel } from '../models/AccumulatePointModel';
import { WorkerThread } from '../models/WokerThreadModel';
import { WorkerThreadService } from '../services/WokerThreadService';
import { NotiTypeAction } from '../../constants/WorkerThread';
import { checkify } from '../../utils/ChuckWorkerThreadUtil';
@JsonController('/main')
export class MainPageController {
    constructor(
        private emergencyEventService: EmergencyEventService,
        private pageService: PageService,
        private hashTagService: HashTagService,
        private userService: UserService,
        private searchHistoryService: SearchHistoryService,
        private postsService: PostsService,
        private needsService: NeedsService,
        private userFollowService: UserFollowService,
        private pageObjectiveService: PageObjectiveService,
        private s3Service: S3Service,
        private userLikeService: UserLikeService,
        private postsCommentService: PostsCommentService,
        private assetService: AssetService,
        private kaokaiTodayService: KaokaiTodayService,
        private configService: ConfigService,
        private kaokaiTodaySnapShotService: KaokaiTodaySnapShotService,
        private isReadPostService: IsReadPostService,
        private deviceTokenService: DeviceTokenService,
        private notificationService: NotificationService,
        private notificationNewsService: NotificationNewsService,
        private hidePostService: HidePostService,
        private newsClickService: NewsClickService,
        private pointStatementService:PointStatementService,
        private accumulateService:AccumulateService,
        private workerThreadService:WorkerThreadService,
        private userEngagementService:UserEngagementService
        // private postsGalleryService: PostsGalleryService
    ) { }
    // Home page content V2
    @Get('/content/v3')
    public async getContentListV2(@QueryParam('offset') offset: number, @QueryParam('section') section: string, @QueryParam('date') date: any, @Res() res: any, @Req() req: any): Promise<any> {
        const jobscheduler = req.headers.jobscheduler;
        const dateFormat = new Date(date);
        const dateReal = dateFormat.setDate(dateFormat.getDate() + 1);
        const toDate = new Date(dateReal);
        let content = undefined;
        const userId = req.headers.userid;
        const mainPageSearchConfig = await this.pageService.searchPageOfficialConfig();
        const searchOfficialOnly = mainPageSearchConfig.searchOfficialOnly;
        const assetTodayDateGap = await this.configService.getConfig(TODAY_DATETIME_GAP);
        const assetTodayRangeDate = await this.configService.getConfig(KAOKAITODAY_RANGE_DATE_EMERGENCY);
        const announcement = await this.configService.getConfig(KAOKAITODAY_ANNOUNCEMENT);
        const linkAnnounceMent = await this.configService.getConfig(KAOKAITODAY_LINK_ANNOUNCEMENT);
        const rangeHashtag = await this.configService.getConfig(KAOKAITODAY_RANGE_OF_POPULAR_HASHTAGS);
        const rateLimit = await this.configService.getConfig(SEARCH_CONFIG_VALUES);
        const todayNews = await this.configService.getConfig(TODAY_NEWS_POINT);
        let todayNewsPoint = DEFAULT_TODAY_NEWS_POINT;

        let announcements = DEFAULT_KAOKAITODAY_ANNOUNCEMENT;
        let linkAnnouncements = DEFAULT_KAOKAITODAY_LINK_ANNOUNCEMENT;
        let assetEmergenDays = DEFAULT_KAOKAITODAY_RANGE_DATE_EMERGENY;
        let assetTodayDate = DEFAULT_TODAY_DATETIME_GAP;
        let rangeHashtags = DEFAULT_KAOKAITODAY_RANGE_OF_POPULAR_HASHTAGS;
        let configLimit = DEFAULT_SEARCH_CONFIG_VALUE.LIMIT;
        if (assetTodayDateGap) {
            assetTodayDate = parseInt(assetTodayDateGap.value, 10);
        }

        if (assetTodayRangeDate) {
            assetEmergenDays = parseInt(assetTodayRangeDate.value, 10);
        }
        if (announcement) {
            announcements = announcement.value;
        }
        if (linkAnnounceMent) {
            linkAnnouncements = linkAnnounceMent.value;
        }
        if (rangeHashtag) {
            rangeHashtags = rangeHashtag.value;
        }
        if (rateLimit) {
            configLimit = parseInt(rateLimit.value, 10);
        }
        const emergencyCheckEndDate = assetTodayRangeDate.endDateTime;
        const monthRange: Date[] = DateTimeUtil.generatePreviousDaysPeriods(new Date(), assetTodayDate);
        if (toDate) {
            const checkSnapshot = await this.kaokaiTodaySnapShotService.findOne({ endDateTime: toDate });
            if (checkSnapshot !== undefined && checkSnapshot !== null) {
                if(userId !== undefined && userId !== null && userId !== ''){
                    const checkSpam = await this.pointStatementService.findOne({userId:new ObjectID(userId),todayNewsId:new ObjectID(checkSnapshot.id)});
                    if(checkSpam === undefined){
                        const productModel = new PointStatementModel();
                        let dd:any = checkSnapshot.endDateTime.getDate() - 1;
                        let mm = checkSnapshot.endDateTime.getMonth() + 1;
                        if(dd<10) { dd='0'+dd;}
                        if(mm<10) { mm='0'+mm;}
                        if (todayNews) {
                            todayNewsPoint = parseInt(todayNews.value, 10);
                        }
                        productModel.title = `หน้าหนึ่งฉบับวันที่ ${checkSnapshot.endDateTime.getFullYear()}-${mm}-${dd}`;
                        productModel.detail = null;
                        productModel.point = todayNewsPoint;
                        productModel.type = 'TODAY_NEWS_POINT';
                        productModel.userId = new ObjectID(userId);
                        productModel.postId = null;
                        productModel.pointEventId = null;
                        productModel.productId = null;
                        productModel.todayNewsId = new ObjectID(checkSnapshot.id);
                        const createPointStatement = await this.pointStatementService.create(productModel);
                        if(createPointStatement) {
                            const accumulateCreate = await this.accumulateService.findOne({userId:new ObjectID(userId)});
                            if(accumulateCreate === undefined) {
                                const accumulateModel = new AccumulateModel();
                                accumulateModel.userId = new ObjectID(userId);
                                accumulateModel.accumulatePoint = createPointStatement.point;
                                accumulateModel.usedPoint = 0;
                                await this.accumulateService.create(accumulateModel);
                            } 
                            const updateAccumulate = await this.accumulateService.update(
                                {userId:new ObjectID(userId)},
                                {$set:{accumulatePoint:accumulateCreate.accumulatePoint + todayNewsPoint}}
                            );
                            if(updateAccumulate){
                                const successResponseS = ResponseUtil.getSuccessResponse('Successfully Main Page Data', checkSnapshot);
                                return res.status(200).send(successResponseS);
                            }
                        }
                    } else {
                        const successResponseS = ResponseUtil.getSuccessResponse('Successfully Main Page Data', checkSnapshot);
                        return res.status(200).send(successResponseS);
                    }
                } else {
                    const successResponseS = ResponseUtil.getSuccessResponse('Successfully Main Page Data', checkSnapshot);
                    return res.status(200).send(successResponseS);
                }

            }
        }
        // convert object to string then json !!!!
        // {endDateTime:-1};
        let convert = undefined;
        const checkCreate = await this.kaokaiTodaySnapShotService.findOne({ endDateTime: monthRange[1] });
        if (checkCreate !== undefined && checkCreate !== null) {
            if (typeof (JSON.stringify(checkCreate)) === 'string') {
                const stringObj = JSON.stringify(checkCreate);
                convert = JSON.parse(stringObj);
                return convert;
            }
        }
        // ordering
        const emerProcessor: EmergencyEventSectionProcessor = new EmergencyEventSectionProcessor(this.emergencyEventService, this.postsService, this.s3Service, this.hashTagService);
        emerProcessor.setData({
            userId,
            emergencyCheckEndDate,
            rangeHashtags,
            endDateTime: monthRange[1]
        });

        const emerSectionModel = await emerProcessor.process2();
        // summation
        const postSectionObjectiveProcessor: PostSectionObjectiveProcessor = new PostSectionObjectiveProcessor(this.postsService, this.s3Service, this.userLikeService);
        postSectionObjectiveProcessor.setData({
            userId,
            startDateTime: monthRange[0],
            endDateTime: monthRange[1]
        });
        postSectionObjectiveProcessor.setConfig({
            searchOfficialOnly
        });

        const postSectionModel = await postSectionObjectiveProcessor.process();
        // roundRobin
        const pageProcessor: PageRoundRobinProcessor = new PageRoundRobinProcessor(this.postsService, this.s3Service, this.userLikeService, this.kaokaiTodayService, this.hashTagService, this.pageService);
        pageProcessor.setData({
            userId,
            startDateTime: monthRange[0],
            endDateTime: monthRange[1],
            configLimit
        });

        pageProcessor.setConfig({
            searchOfficialOnly
        });
        // party executive committee
        // deputy leader
        // deputy secretary of the party
        const pageRoundRobin = await pageProcessor.process();
        let checkPosition1 = undefined;
        const filterContentsRobin = pageRoundRobin.contents;
        if (pageRoundRobin.position !== undefined && pageRoundRobin.position !== null) {
            checkPosition1 = pageRoundRobin.position;
        }
        // เกาะกระแส
        const majorTrendProcessor: MajorTrendSectionModelProcessor = new MajorTrendSectionModelProcessor(this.postsService, this.s3Service, this.userLikeService, this.kaokaiTodayService, this.hashTagService, this.pageService);
        majorTrendProcessor.setData({
            userId,
            startDateTime: monthRange[0],
            endDateTime: monthRange[1],
            filterContentsRobin,
            checkPosition1,
            configLimit
        });

        majorTrendProcessor.setConfig({
            searchOfficialOnly
        });
        const majorTrend = await majorTrendProcessor.process();
        const filterContentsMajor = majorTrend.contents;
        let checkPosition2 = undefined;
        if (majorTrend.position !== undefined && majorTrend.position !== null) {
            checkPosition2 = majorTrend.position;
        }

        const kaokaiProvinceProcessor: KaokaiAllProvinceModelProcessor = new KaokaiAllProvinceModelProcessor(this.postsService, this.s3Service, this.userLikeService, this.kaokaiTodayService, this.hashTagService, this.pageService);
        kaokaiProvinceProcessor.setData({
            userId,
            startDateTime: monthRange[0],
            endDateTime: monthRange[1],
            filterContentsRobin,
            filterContentsMajor,
            checkPosition1,
            checkPosition2,
            configLimit

        });

        kaokaiProvinceProcessor.setConfig({
            searchOfficialOnly
        });
        const kaokaiProvince = await kaokaiProvinceProcessor.process();
        const filterContentsProvince = kaokaiProvince.contents;
        let checkPosition3 = undefined;
        // kaokaiProvince.position;
        if (kaokaiProvince.position !== undefined && kaokaiProvince.position !== null) {
            checkPosition3 = kaokaiProvince.position;
        }
        const kaokaiHashTagProcessor: KaoKaiHashTagModelProcessor = new KaoKaiHashTagModelProcessor(this.postsService, this.s3Service, this.userLikeService, this.kaokaiTodayService, this.hashTagService, this.pageService);
        kaokaiHashTagProcessor.setData({
            userId,
            startDateTime: monthRange[0],
            endDateTime: monthRange[1],
            filterContentsRobin,
            filterContentsMajor,
            filterContentsProvince,
            checkPosition1,
            checkPosition2,
            checkPosition3,
            configLimit
        });

        kaokaiHashTagProcessor.setConfig({
            searchOfficialOnly
        });
        const kaokaiHashTag = await kaokaiHashTagProcessor.process();
        const filterContentsHashTag = kaokaiHashTag.contents;
        let checkPosition4 = undefined;
        // kaokaiHashTag.position;
        if (kaokaiHashTag.position !== undefined && kaokaiHashTag.position !== null) {
            checkPosition4 = kaokaiHashTag.position;
        }

        const kaokaiContentProcessor: KaokaiContentModelProcessor = new KaokaiContentModelProcessor(this.postsService, this.s3Service, this.userLikeService, this.kaokaiTodayService, this.hashTagService, this.pageService);
        kaokaiContentProcessor.setData({
            userId,
            startDateTime: monthRange[0],
            endDateTime: monthRange[1],
            filterContentsRobin,
            filterContentsMajor,
            filterContentsProvince,
            filterContentsHashTag,
            checkPosition1,
            checkPosition2,
            checkPosition3,
            checkPosition4,
            configLimit
        });

        kaokaiContentProcessor.setConfig({
            searchOfficialOnly
        });
        const kaokaiContent = await kaokaiContentProcessor.process();
        // pipeline: [{ $match: { $expr: { $in: ['$_id', bucketF] }, isOfficial: true } }],
        // hashTag
        const hashTagSumma = await this.hashTagService.aggregate([{ $sort: { count: -1 } }, { $limit: 3 }]);
        if (
            pageRoundRobin.contents.length === 0 &&
            majorTrend.contents.length === 0 &&
            kaokaiProvince.contents.length === 0 &&
            kaokaiHashTag.contents.length === 0 &&
            kaokaiContent.contents.length === 0
        ) {
            const emerProcessorUn: EmergencyEventSectionProcessor = new EmergencyEventSectionProcessor(this.emergencyEventService, this.postsService, this.s3Service, this.hashTagService);
            emerProcessorUn.setData({
                assetEmergenDays,
                emergencyCheckEndDate
            });
            const emerSectionModelUn = await emerProcessorUn.process2();
            const postProcessorUn: PostSectionProcessor = new PostSectionProcessor(this.postsService, this.s3Service, this.userLikeService);
            postProcessorUn.setData({
                userId,
                startDateTime: monthRange[0],
                endDateTime: monthRange[1]
            });
            postProcessorUn.setConfig({
                searchOfficialOnly
            });
            const postSectionModelUn = await postProcessorUn.process();
            const pageProcessorUn: PageRoundRobinProcessor = new PageRoundRobinProcessor(this.postsService, this.s3Service, this.userLikeService, this.kaokaiTodayService, this.hashTagService, this.pageService);
            pageProcessorUn.setData({
                userId,
                startDateTime: monthRange[0],
                endDateTime: monthRange[1]
            });

            pageProcessorUn.setConfig({
                searchOfficialOnly
            });
            // party executive committee
            // deputy leader
            // deputy secretary of the party
            const pageRoundRobinUn = await pageProcessorUn.processV2();
            // เกาะกระแส
            const majorTrendProcessorUn: MajorTrendSectionModelProcessor = new MajorTrendSectionModelProcessor(this.postsService, this.s3Service, this.userLikeService, this.kaokaiTodayService, this.hashTagService, this.pageService);
            majorTrendProcessorUn.setData({
                userId,
                startDateTime: monthRange[0],
                endDateTime: monthRange[1],
            });

            majorTrendProcessorUn.setConfig({
                searchOfficialOnly
            });
            const majorTrendUn = await majorTrendProcessorUn.processV2();
            const kaokaiHashTagProcessorUn: KaoKaiHashTagModelProcessor = new KaoKaiHashTagModelProcessor(this.postsService, this.s3Service, this.userLikeService, this.kaokaiTodayService, this.hashTagService, this.pageService);
            kaokaiHashTagProcessorUn.setData({
                userId,
                startDateTime: monthRange[0],
                endDateTime: monthRange[1],
            });

            kaokaiHashTagProcessorUn.setConfig({
                searchOfficialOnly
            });

            const kaokaiHashTagUn = await kaokaiHashTagProcessorUn.processV2();

            // pipeline: [{ $match: { $expr: { $in: ['$_id', bucketF] }, isOfficial: true } }],
            // hashTag
            const hashTagSummaUn = await this.hashTagService.aggregate([{ $sort: { count: -1 } }, { $limit: 3 }]);
            const resultUn: any = {};
            resultUn.emergencyEvents = emerSectionModelUn;
            resultUn.hashTagSumma = hashTagSummaUn;
            resultUn.postSectionModel = postSectionModelUn;
            resultUn.pageRoundRobin = pageRoundRobinUn;
            resultUn.majorTrend = majorTrendUn;
            resultUn.kaokaiHashTag = kaokaiHashTagUn;
            resultUn.announcement = announcements;
            resultUn.linkAnnounceMent = linkAnnouncements;
            const successResponseUn = ResponseUtil.getSuccessResponse('Successfully Main Page Data', resultUn);
            return res.status(200).send(successResponseUn);
        }
        const result: any = {};
        result.emergencyEvents = emerSectionModel;
        result.hashTagSumma = hashTagSumma;
        result.postSectionModel = postSectionModel;
        result.pageRoundRobin = pageRoundRobin;
        result.majorTrend = majorTrend;
        result.kaokaiProvince = kaokaiProvince;
        result.kaokaiHashTag = kaokaiHashTag;
        result.kaokaiContent = kaokaiContent;
        result.announcement = announcements;
        result.linkAnnounceMent = linkAnnouncements;
        content = await this.snapShotToday(result, monthRange[0], monthRange[1], jobscheduler);
        // const noti = await this.pushNotification(result, monthRange[0], monthRange[1]);
        if (date !== undefined && date !== null) {
            if (content) {
                const successResponseF = ResponseUtil.getSuccessResponse('Successfully Main Page Data', content.data);
                return res.status(200).send(successResponseF);
            } else {
                const errorResponse = ResponseUtil.getErrorResponse('This Email not exists', undefined);
                return res.status(400).send(errorResponse);
            }
        }
        if (content) {
            const successResponse = ResponseUtil.getSuccessResponse('Successfully Main Page Data', content);
            return res.status(200).send(successResponse);
        }
        else {
            const errorResponse = ResponseUtil.getErrorResponse('Unable got Main Page Data', undefined);
            return res.status(400).send(errorResponse);
        }
    }
    @Get('/user/readed')
    public async userReaded(@Res() res: any, @Req() req: any): Promise<any> {
        const userId = req.headers.userid;
        const objIds = new ObjectID(userId);
        const findPostIds = await this.isReadPostService.aggregate([
            {
                $match: { userId: objIds }
            },
            {
                $project: {
                    postId: 1,
                }
            }
        ]);
        const postIds = [];
        if (findPostIds.length > 0) {
            for (let i = 0; i < findPostIds.length; i++) {
                postIds.push(findPostIds[i].postId);
            }
        }
        if (objIds) {
            const successResponse = ResponseUtil.getSuccessResponse('Search IsRead Is sucessfully.', postIds.flat());
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Unable Search IsRead.', undefined);
            return res.status(400).send(errorResponse);
        }
    }
    @Post('/bottom/trend')
    public async mirrorTrends(@QueryParam('limit') limit: number, @QueryParam('offset') offset: number, @QueryParam('isReadPost') isReadPost: boolean, @QueryParam('pageFollowings') pageFollowings: boolean, @QueryParam('emergencyFollowings') emergencyFollowings: boolean, @QueryParam('objectiveFollowings') objectiveFollowings: boolean, @QueryParam('userFollowings') userFollowings: boolean, @QueryParam('followingProvinces') followingProvinces: boolean, @QueryParam('followingContent') followingContent: boolean, @QueryParam('section') section: string, @QueryParam('date') date: any, @Res() res: any, @Req() req: any): Promise<any> {
        const userId = req.headers.userid;
        const objIds = new ObjectID(userId);
        const isRead = await this.isReadPostService.aggregate(
            [
                {
                    $match: {
                        userId: objIds
                    }
                },
                {
                    $unwind: {
                        path: '$IsReadPost',
                        preserveNullAndEmptyArrays: true
                    }
                },
            ]
        );
        const hidePost = await this.hidePostService.find({ userId: objIds });
        const configRetrospect = await this.configService.getConfig(REVERSE_SEARCH);
        let reverseSearch = DEFAULT_REVERSE_SEARCH;
        if (configRetrospect) {
            reverseSearch = parseInt(configRetrospect.value, 10);
        }
        const mainPageSearchConfig = await this.pageService.searchPageOfficialConfig();
        const searchOfficialOnly = mainPageSearchConfig.searchOfficialOnly;
        const monthRange: Date[] = DateTimeUtil.generatePreviousDaysPeriods(new Date(), reverseSearch);
        let isReadPosts = undefined;
        let pageFollowing = undefined;
        let emergenFollowing = undefined;
        let objectiveFollowing = undefined;
        let userFollowing = undefined;
        let followingProvince = undefined;
        let followingContents = undefined;
        const isReadSectionProcessor: IsReadSectionProcessor = new IsReadSectionProcessor(this.postsService, this.s3Service);
        isReadSectionProcessor.setData({
            userId,
            startDateTime: monthRange[0],
            endDateTime: monthRange[1],
            postIds: isRead,
            reverseSearch,
            hidePost
        });

        isReadSectionProcessor.setConfig({
            searchOfficialOnly
        });
        if (isReadPost === true) {
            isReadPosts = await isReadSectionProcessor.process();
        }
        const pageFollowingPostSectionModelProcessor: PageFollowingPostSectionModelProcessor = new PageFollowingPostSectionModelProcessor(this.s3Service, this.userFollowService);
        pageFollowingPostSectionModelProcessor.setData({
            userId,
            startDateTime: monthRange[0],
            endDateTime: monthRange[1],
            postIds: isRead,
            hidePost
        });

        pageFollowingPostSectionModelProcessor.setConfig({
            searchOfficialOnly
        });
        if (pageFollowings === true) {
            pageFollowing = await pageFollowingPostSectionModelProcessor.process();
        }

        const emerFollowingPostSectionModelProcessor: EmergencyFollowingPostSectionModelProcessor = new EmergencyFollowingPostSectionModelProcessor(this.s3Service, this.userFollowService);
        emerFollowingPostSectionModelProcessor.setData({
            userId,
            startDateTime: monthRange[0],
            endDateTime: monthRange[1],
            postIds: isRead,
            hidePost
        });

        emerFollowingPostSectionModelProcessor.setConfig({
            searchOfficialOnly
        });
        if (emergencyFollowings === true) {
            emergenFollowing = await emerFollowingPostSectionModelProcessor.process();
        }
        const objectiveFollowingPostSectionModelProcessor: ObjectiveFollowingPostSectionModelProcessor = new ObjectiveFollowingPostSectionModelProcessor(this.s3Service, this.userFollowService);
        objectiveFollowingPostSectionModelProcessor.setData({
            userId,
            startDateTime: monthRange[0],
            endDateTime: monthRange[1],
            postIds: isRead,
            hidePost
        });

        objectiveFollowingPostSectionModelProcessor.setConfig({
            searchOfficialOnly
        });
        if (objectiveFollowings === true) {
            objectiveFollowing = await objectiveFollowingPostSectionModelProcessor.process();
        }
        const userFollowingPostSectionModelProcessor: UserFollowingPostSectionModelProcessor = new UserFollowingPostSectionModelProcessor(this.s3Service, this.userFollowService);
        userFollowingPostSectionModelProcessor.setData({
            userId,
            startDateTime: monthRange[0],
            endDateTime: monthRange[1],
            postIds: isRead,
            hidePost
        });

        userFollowingPostSectionModelProcessor.setConfig({
            searchOfficialOnly
        });
        if (userFollowings === true) {
            userFollowing = await userFollowingPostSectionModelProcessor.process();
        }
        const followingProvinceSectionModelProcessor: FollowingProvinceSectionModelProcessor = new FollowingProvinceSectionModelProcessor(this.postsService, this.s3Service, this.userLikeService, this.userService, this.pageService);
        followingProvinceSectionModelProcessor.setData({
            userId,
            startDateTime: monthRange[0],
            endDateTime: monthRange[1],
            postIds: isRead,
            hidePost

        });

        followingProvinceSectionModelProcessor.setConfig({
            searchOfficialOnly
        });
        if (followingProvinces === true) {
            followingProvince = await followingProvinceSectionModelProcessor.process();
        }
        const followingContentsModelProcessor: FollowingContentsModelProcessor = new FollowingContentsModelProcessor(
            this.s3Service, this.userFollowService, this.postsService
        );
        followingContentsModelProcessor.setData({
            userId,
            startDateTime: monthRange[0],
            endDateTime: monthRange[1],
            postIds: isRead,
            limits: limit,
            offsets: offset,
            hidePost
        });

        followingContentsModelProcessor.setConfig({
            searchOfficialOnly
        });
        if (followingContent === true) {
            followingContents = await followingContentsModelProcessor.process();
        }
        const result: any = {};
        result.isReadPosts = isReadPosts;
        result.pageFollowing = pageFollowing;
        result.emergenFollowing = emergenFollowing;
        result.objectiveFollowing = objectiveFollowing;
        result.userFollowing = userFollowing;
        result.followingProvince = followingProvince;
        result.followingContents = followingContents;
        const successResponse = ResponseUtil.getSuccessResponse('Successfully create isRead.', result);
        return res.status(200).send(successResponse);

    }

    @Get('/dashboard')
    public async getDashboard(@Res() res: any, @Req() req: any): Promise<any> {
        const voteDashboard = await this.configService.aggregate(
            [
                {
                    $match: {
                        name: VOTE_DASHBOARD
                    }
                }
            ]
        );
        if (voteDashboard.length > 0) {
            const successResponse = ResponseUtil.getSuccessResponse('Successfully create isRead.', voteDashboard);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Error cannot find the dashboard.', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    // API main page for mobile 
    @Get('/content/mobile')
    public async getContentMobile(@QueryParam('date') date: any, @Res() res: any, @Req() req: any): Promise<any> {
        let assetTodayDate = DEFAULT_TODAY_DATETIME_GAP;
        const assetTodayDateGap = await this.configService.getConfig(TODAY_DATETIME_GAP);
        if (assetTodayDateGap) {
            assetTodayDate = parseInt(assetTodayDateGap.value, 10);
        }
        const timeStamp: number = 24 * 60 * 60 * 1000;
        const snapshotObjId = [];
        const momentCurrently: Date[] = DateTimeUtil.generatePreviousDaysPeriods(new Date(), assetTodayDate);
        const todayTimeStamp = new Date();
        let currentLy = await this.kaokaiTodaySnapShotService.findOne({ endDateTime: momentCurrently[1] });
        if (currentLy === undefined) {
            currentLy = await this.kaokaiTodaySnapShotService.aggregate(
                [
                    {
                        $sort: {
                            endDateTime: -1
                        }
                    },
                    {
                        $limit: 1
                    }
                ]
            );
            currentLy = currentLy.shift();
            snapshotObjId.push(new ObjectID(currentLy._id));
        }
        const atMoment = await this.parseKaokaiTodayRangeDays(currentLy);
        snapshotObjId.push(new ObjectID(currentLy._id));
        const kaikaoSnapShotSevenDays = await this.kaokaiTodaySnapShotService.aggregate(
            [
                {
                    $match: {
                        _id: { $nin: snapshotObjId },
                        endDateTime: {
                            $gte: new Date(todayTimeStamp.getTime() - (timeStamp * 7)),
                            $lte: new Date(todayTimeStamp.getTime() - timeStamp)
                        }
                    }
                },
                {
                    $sort: {
                        endDateTime: -1
                    }
                }
            ]
        );
        if (kaikaoSnapShotSevenDays.length > 0) {
            for (const content of kaikaoSnapShotSevenDays) {
                snapshotObjId.push(new ObjectID(content._id));
            }
        }
        const kaikaoSnapShot = await this.kaokaiTodaySnapShotService.aggregate(
            [
                {
                    $match: {
                        _id: { $nin: snapshotObjId },
                        endDateTime: { $gte: new Date(todayTimeStamp.getTime() - (timeStamp * 37)), $lte: new Date(todayTimeStamp.getTime() - (timeStamp * 7)) }
                    }
                },
                {
                    $sort: {
                        endDateTime: -1
                    }
                }
            ]
        );
        if (kaikaoSnapShot.length > 0) {
            for (const content of kaikaoSnapShot) {
                snapshotObjId.push(new ObjectID(content._id));
            }
        }
        const popularNews = await this.kaokaiTodaySnapShotService.aggregate(
            [
                {
                    $match: {
                        _id: { $nin: snapshotObjId }
                    }
                },
                {
                    $sort: {
                        count: -1,
                        sumCount: -1
                    }
                },
                {
                    $limit: 7
                }
            ]
        );

        const result: any = {
            'today': atMoment.shift(),
            'todayPost7Days': [],
            'todayPast30days': [],
            'popularNews': []
        };

        if (kaikaoSnapShotSevenDays.length > 0) {
            for (const content of kaikaoSnapShotSevenDays) {
                const today = await this.parseKaokaiTodayRangeDays(content);
                result['todayPost7Days'].push(today.shift());
            }
        }

        if (kaikaoSnapShot.length > 0) {
            for (const content of kaikaoSnapShot) {
                const today = await this.parseKaokaiTodayRangeDays(content);
                result['todayPast30days'].push(today.shift());
            }
        }
        if (popularNews.length > 0) {
            for (const content of popularNews) {
                const today = await this.parseKaokaiTodayRangeDays(content);
                result['popularNews'].push(today.shift());
            }
        }
        // console.log('checkCreate',checkCreate);
        const successResponse = ResponseUtil.getSuccessResponse('Successfully Main Page Data Mobile', result);
        return res.status(200).send(successResponse);
    }

    @Get('/content/web')
    public async getContentWeb(@QueryParam('date') date: any, @Res() res: any, @Req() req: any): Promise<any> {
        let assetTodayDate = DEFAULT_TODAY_DATETIME_GAP;
        const assetTodayDateGap = await this.configService.getConfig(TODAY_DATETIME_GAP);
        if (assetTodayDateGap) {
            assetTodayDate = parseInt(assetTodayDateGap.value, 10);
        }
        const timeStamp: number = 24 * 60 * 60 * 1000;
        const snapshotObjId = [];
        const momentCurrently: Date[] = DateTimeUtil.generatePreviousDaysPeriods(new Date(), assetTodayDate);
        const todayTimeStamp = new Date();
        let currentLy = await this.kaokaiTodaySnapShotService.findOne({ endDateTime: momentCurrently[1] });
        if (currentLy === undefined) {
            currentLy = await this.kaokaiTodaySnapShotService.aggregate(
                [
                    {
                        $sort: {
                            endDateTime: -1
                        }
                    },
                    {
                        $limit: 1
                    }
                ]
            );
            currentLy = currentLy.shift();
            snapshotObjId.push(new ObjectID(currentLy._id));
        }
        const atMoment = await this.parseKaokaiTodayRangeDays(currentLy);
        snapshotObjId.push(new ObjectID(currentLy._id));
        const kaikaoSnapShotSevenDays = await this.kaokaiTodaySnapShotService.aggregate(
            [
                {
                    $match: {
                        _id: { $nin: snapshotObjId },
                        endDateTime: {
                            $gte: new Date(todayTimeStamp.getTime() - (timeStamp * 7)),
                            $lte: new Date(todayTimeStamp.getTime() - timeStamp)
                        }
                    }
                },
                {
                    $sort: {
                        endDateTime: -1
                    }
                }
            ]
        );
        if (kaikaoSnapShotSevenDays.length > 0) {
            for (const content of kaikaoSnapShotSevenDays) {
                snapshotObjId.push(new ObjectID(content._id));
            }
        }
        const kaikaoSnapShot = await this.kaokaiTodaySnapShotService.aggregate(
            [
                {
                    $match: {
                        _id: { $nin: snapshotObjId },
                        endDateTime: { $gte: new Date(todayTimeStamp.getTime() - (timeStamp * 37)), $lte: new Date(todayTimeStamp.getTime() - (timeStamp * 7)) }
                    }
                },
                {
                    $sort: {
                        endDateTime: -1
                    }
                }
            ]
        );
        if (kaikaoSnapShot.length > 0) {
            for (const content of kaikaoSnapShot) {
                snapshotObjId.push(new ObjectID(content._id));
            }
        }
        const popularNews = await this.kaokaiTodaySnapShotService.aggregate(
            [
                {
                    $match: {
                        _id: { $nin: snapshotObjId }
                    }
                },
                {
                    $sort: {
                        count: -1,
                        sumCount: -1
                    }
                },
                {
                    $limit: 7
                }
            ]
        );

        // console.log('kaikaoSnapShot',kaikaoSnapShot);
        const result: any = {
            'today': atMoment.shift(),
            'todayPost7Days': [],
            'todayPast30days': [],
            'popularNews': []
        };

        if (kaikaoSnapShotSevenDays.length > 0) {
            for (const content of kaikaoSnapShotSevenDays) {
                const today = await this.parseKaokaiTodayRangeDays(content);
                result['todayPost7Days'].push(today.shift());
            }
        }

        if (kaikaoSnapShot.length > 0) {
            for (const content of kaikaoSnapShot) {
                const today = await this.parseKaokaiTodayRangeDays(content);
                result['todayPast30days'].push(today.shift());
            }
        }
        if (popularNews.length > 0) {
            for (const content of popularNews) {
                const today = await this.parseKaokaiTodayRangeDays(content);
                result['popularNews'].push(today.shift());
            }
        }
        // console.log('checkCreate',checkCreate);
        const successResponse = ResponseUtil.getSuccessResponse('Successfully Main Page Data Mobile', result);
        return res.status(200).send(successResponse);
    }

    @Post('/manual/noti')
    public async manualNoti(@Res() res: any, @Req() req: any): Promise<any>{
        await this.manualNotiFunction();
        const successResponse = ResponseUtil.getSuccessResponse('Noti is success.', undefined);
        return res.status(200).send(successResponse);
    }

    @Post('/test/manual/noti')
    public async testManualNoti(@Res() res: any, @Req() req: any): Promise<any>{
        await this.testManualNotiFunction();
        const successResponse = ResponseUtil.getSuccessResponse('Noti is success.', undefined);
        return res.status(200).send(successResponse);
    }
/*
    @Post('/test/test/manual/noti')
    public async testTestManualNoti(@Res() res: any, @Req() req: any): Promise<any>{
        const snapShot = await this.kaokaiTodaySnapShotService.findOne({_id: new ObjectID('65f4e109da87336cb9f98466')});
        let filterNews = DEFAULT_FILTER_NEWS;
        const configFilterNews = await this.configService.getConfig(FILTER_NEWS);
        if (configFilterNews) {
            filterNews = configFilterNews.value;
        }
        const fireBaseToken = [];
        const deviceToken = await this.deviceTokenService.aggregate(
            [
                {
                    $match: {
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
        if (deviceToken.length > 0) {
            for (let j = 0; j < deviceToken.length; j++) {
                if (deviceToken[0].User.subscribeNoti === true && deviceToken[0].User !== undefined && deviceToken[j].token !== undefined && deviceToken[j].token !== null && deviceToken[j].token !== '') {
                    fireBaseToken.push(deviceToken[j].token);
                } else {
                    continue;
                }
            }
        }

        if (fireBaseToken.length > 0) {
            const token = fireBaseToken.filter((element, index) => {
                return fireBaseToken.indexOf(element) === index;
            });
            const originalArray = Array.from({ length: token.length }, (_, i) => i + 1); // Create the original array [1, 2, 3, ..., 50000]
            const slicedArrays = [];
            const batchSize = 499;
            for (let i = 0; i < originalArray.length; i += batchSize) {
                const slicedArray = token.slice(i, i + batchSize);
                slicedArrays.push(slicedArray);
            }
            if (slicedArrays.length > 0) {
                for (let j = 0; j < slicedArrays.length; j++) {
                    await this.notificationService.multiPushNotificationMessageTest(snapShot.data,slicedArrays[j],snapShot.endDateTime,filterNews);
                }
            }
            const successResponse = ResponseUtil.getSuccessResponse('Noti is success.', undefined);
            return res.status(200).send(successResponse);
        }

    }
*/
    @Post('/hot')
    public async hotnews(@Res() res: any, @Req() req: any): Promise<any> {
        const userId = req.headers['userid'];
        const uid = userId ? new ObjectID(userId) : undefined; // new ObjectID(userId);
        // const clientId = req.headers['client-id'];
        const ipAddr = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).split(',')[0];
        const dateTimes = new Date(req.body.createdDate);
        const newsObjectId = req.body.newsObj;
        const objIds = new ObjectID(newsObjectId);
        let create = undefined;
        const startDate = moment(new Date()).clone().utcOffset(0).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(2, 'days').toDate();
        const endDateRange = moment(new Date()).clone().utcOffset(0).set({ hour: 24, minute: 59, second: 59, millisecond: 59 }).toDate();
        if (objIds) {
            // check objIds is existing in the database.
            const newsObject: any = await this.kaokaiTodaySnapShotService.findOne({ _id: objIds });

            if (newsObject === undefined) {
                const errorResponse = ResponseUtil.getErrorResponse('Cannot find newsObject in the database.', undefined);
                return res.status(400).send(errorResponse);
            }

            if (ipAddr !== undefined && uid === undefined) {
                // check count exists ?

                const checkCountExist = await this.newsClickService.aggregate(
                    [
                        {
                            $match: {
                                kaokaiTodaySnapShotId: objIds,
                                ipAddress: ipAddr,
                                userId: null,
                                createdDate: { $gte: startDate, $lte: endDateRange }
                            }
                        },
                        {
                            $limit: 1
                        }
                    ]
                );

                if (checkCountExist.length > 0) {
                    const errorResponse = ResponseUtil.getErrorResponse('You have done this before.', undefined);
                    return res.status(400).send(errorResponse);
                }

                const newsClick: NewsClickModel = new NewsClickModel();
                newsClick.kaokaiTodaySnapShotId = objIds;
                newsClick.userId = uid;
                newsClick.ipAddress = ipAddr;
                newsClick.onClickDate = dateTimes;
                newsClick.count = 0 + checkCountExist.length ? parseInt(checkCountExist[0].count, 10) : 1;
                create = await this.newsClickService.create(newsClick);
            }

            if (ipAddr !== undefined && uid !== undefined) {
                const checkCountExist = await this.newsClickService.aggregate(
                    [
                        {
                            $match: {
                                kaokaiTodaySnapShotId: objIds,
                                ipAddress: ipAddr,
                                userId: uid,
                                createdDate: { $gte: startDate, $lte: endDateRange }
                            }
                        },
                    ]
                );
                if (checkCountExist.length > 0) {
                    const errorResponse = ResponseUtil.getErrorResponse('You have done this before.', undefined);
                    return res.status(400).send(errorResponse);
                }

                const newsClick: NewsClickModel = new NewsClickModel();
                newsClick.kaokaiTodaySnapShotId = objIds;
                newsClick.userId = uid;
                newsClick.ipAddress = ipAddr;
                newsClick.onClickDate = dateTimes;
                newsClick.count = 0 + checkCountExist.length ? parseInt(checkCountExist[0].count, 10) : 1;
                create = await this.newsClickService.create(newsClick);
            }
            let summationCount = 0;
            if (newsObject !== undefined) {
                if (newsObject.data.pageRoundRobin.contents.length > 0) {
                    for (const post of newsObject.data.pageRoundRobin.contents) {
                        summationCount += post.post.summationScore;
                    }
                }
                if (newsObject.data.majorTrend.contents.length > 0) {
                    for (const post of newsObject.data.majorTrend.contents) {
                        summationCount += post.post.summationScore;
                    }
                }
                if (newsObject.data.kaokaiProvince.contents.length > 0) {
                    for (const post of newsObject.data.kaokaiProvince.contents) {
                        summationCount += post.post.summationScore;
                    }
                }
                if (newsObject.data.kaokaiHashTag.contents.length > 0) {
                    for (const post of newsObject.data.kaokaiHashTag.contents) {
                        summationCount += post.post.summationScore;
                    }
                }
                if (newsObject.data.kaokaiContent.contents.length > 0) {
                    for (const post of newsObject.data.kaokaiContent.contents) {
                        summationCount += post.post.summationScore;
                    }
                }

            }
            if (newsObject && create) {
                const query = { _id: newsObject.id };
                const newValue = {
                    $set:
                    {
                        count: newsObject.count + 1,
                        sumCount: summationCount

                    }
                };
                const update = await this.kaokaiTodaySnapShotService.update(query, newValue);
                if (update) {
                    const successResponse = ResponseUtil.getSuccessResponse('Update and Create hot news count is successfully.', undefined);
                    return res.status(200).send(successResponse);
                }
            }
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Cannot find newsObj id.', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    // test s3 AWS_CLOUDFRONT_PREFIX
    @Post('/s3')
    public async testS3(@Body({ validate: true }) tempFile: AssetRequest, @Res() res: any, @Req() req: any): Promise<any> {
        try {
            const assetExpTimeCfg = await this.configService.getConfig(ASSET_CONFIG_NAME.EXPIRE_MINUTE);
            let assetExpTime = DEFAULT_ASSET_CONFIG_VALUE.EXPIRE_MINUTE;

            if (assetExpTimeCfg && assetExpTimeCfg.value) {
                assetExpTime = assetExpTimeCfg.value;
            }
            const userId = req.headers.userid;
            const userObjId = new ObjectID(userId);
            const assets = tempFile.asset;
            const fileName = FileUtil.renameFile();

            const asset = new Asset();
            asset.userId = userObjId;
            asset.scope = ASSET_SCOPE.PUBLIC;
            asset.data = assets.data;
            asset.fileName = fileName;
            asset.mimeType = assets.mimeType;
            asset.size = assets.size;

            if (assets.expirationDate !== null && assets.expirationDate !== undefined) {
                asset.expirationDate = assets.expirationDate;
            } else {
                asset.expirationDate = moment().add(assetExpTime, 'minutes').toDate();
            }
            const assetCreate: Asset = await this.assetService.create(asset);
            if (assetCreate) {
                const successResponse = ResponseUtil.getSuccessResponse('Sign s3 CloudFront is sucessfully.', assetCreate);
                return res.status(200).send(successResponse);
            }
        } catch (error) {
            console.log('Cannot Store to S3: ', error);
            return error;
        }
    }

    @Post('/presigned')
    public async reSignUrl(@Res() res: any, @Req() req: any): Promise<any> {
        // JS SDK v3 does not support global configuration.
        // Codemod has attempted to pass values to each service client in this file.
        // You may need to update clients outside of this file, if they use global config.
        AWS.config.update({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_DEFAULT_REGION
        });

        const s3 = new S3({
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            },

            region: process.env.AWS_DEFAULT_REGION
        });
        const bucket = { Bucket: process.env.AWS_BUCKET };
        const getObjectKey = await s3.listObjectsV2(bucket);
        const stack = [];
        if (getObjectKey) {
            for (const keyObject of getObjectKey.Contents) {
                const cloudFront = await this.s3Service.s3signCloudFront(keyObject.Key);
                stack.push(cloudFront);
            }
            const successResponse = ResponseUtil.getSuccessResponse('Sign s3 CloudFront is sucessfully.', stack);
            return res.status(200).send(successResponse);
        }
    }
    // presigned url 
    @Post('/presigned/reurl')
    public async presignCloudFront(@Res() res: any, @Req() req: any): Promise<any> {

        let name = undefined;
        const listObjectKaokaiSnapshot = await this.kaokaiTodaySnapShotService.find({});
        if (listObjectKaokaiSnapshot.length > 0) {
            for (let i = 0; i < listObjectKaokaiSnapshot.length; i++) {
                if (listObjectKaokaiSnapshot[i].data.emergencyEvents !== undefined) {
                    name = 'emergencyEvents';
                    await this.presignedS3(name, listObjectKaokaiSnapshot[i].data, listObjectKaokaiSnapshot[i].id);
                }
                if (listObjectKaokaiSnapshot[i].data.postSectionModel !== undefined) {
                    name = 'postSectionModel';
                    await this.presignedS3(name, listObjectKaokaiSnapshot[i].data, listObjectKaokaiSnapshot[i].id);
                }
                if (listObjectKaokaiSnapshot[i].data.pageRoundRobin !== undefined) {
                    name = 'pageRoundRobin';
                    await this.presignedS3(name, listObjectKaokaiSnapshot[i].data, listObjectKaokaiSnapshot[i].id);
                }

                if (listObjectKaokaiSnapshot[i].data.majorTrend !== undefined) {
                    name = 'majorTrend';
                    await this.presignedS3(name, listObjectKaokaiSnapshot[i].data, listObjectKaokaiSnapshot[i].id);
                }

                if (listObjectKaokaiSnapshot[i].data.kaokaiProvince !== undefined) {
                    name = 'kaokaiProvince';
                    await this.presignedS3(name, listObjectKaokaiSnapshot[i].data, listObjectKaokaiSnapshot[i].id);
                }
                if (listObjectKaokaiSnapshot[i].data.kaokaiHashTag !== undefined) {
                    name = 'kaokaiHashTag';
                    await this.presignedS3(name, listObjectKaokaiSnapshot[i].data, listObjectKaokaiSnapshot[i].id);
                }
                if (listObjectKaokaiSnapshot[i].data.kaokaiContent !== undefined) {
                    name = 'kaokaiContent';
                    await this.presignedS3(name, listObjectKaokaiSnapshot[i].data, listObjectKaokaiSnapshot[i].id);
                }

            }
            const successResponse = ResponseUtil.getSuccessResponse('Sign s3 CloudFront is sucessfully. ???? 1234', undefined);
            return res.status(200).send(successResponse);
        }
    }
    // test presigned snapshot 
    @Post('/presigned/snapshot')
    public async presignCloudFrontPage(@QueryParam('offset') offset: number, @QueryParam('section') section: string, @QueryParam('date') date: any, @Res() res: any, @Req() req: any): Promise<any> {
        // const jobscheduler = req.headers.jobscheduler;
        const dateFormat = new Date(date);
        const dateReal = dateFormat.setDate(dateFormat.getDate() + 1);
        const toDate = new Date(dateReal);
        // let content = undefined;
        const userId = req.headers.userid;
        const mainPageSearchConfig = await this.pageService.searchPageOfficialConfig();
        const searchOfficialOnly = mainPageSearchConfig.searchOfficialOnly;
        const assetTodayDateGap = await this.configService.getConfig(TODAY_DATETIME_GAP);
        const assetTodayRangeDate = await this.configService.getConfig(KAOKAITODAY_RANGE_DATE_EMERGENCY);
        const announcement = await this.configService.getConfig(KAOKAITODAY_ANNOUNCEMENT);
        const linkAnnounceMent = await this.configService.getConfig(KAOKAITODAY_LINK_ANNOUNCEMENT);
        const rangeHashtag = await this.configService.getConfig(KAOKAITODAY_RANGE_OF_POPULAR_HASHTAGS);
        const rateLimit = await this.configService.getConfig(SEARCH_CONFIG_VALUES);
        let announcements = DEFAULT_KAOKAITODAY_ANNOUNCEMENT;
        let linkAnnouncements = DEFAULT_KAOKAITODAY_LINK_ANNOUNCEMENT;
        let assetEmergenDays = DEFAULT_KAOKAITODAY_RANGE_DATE_EMERGENY;
        let assetTodayDate = DEFAULT_TODAY_DATETIME_GAP;
        let rangeHashtags = DEFAULT_KAOKAITODAY_RANGE_OF_POPULAR_HASHTAGS;
        let configLimit = DEFAULT_SEARCH_CONFIG_VALUE.LIMIT;
        if (assetTodayDateGap) {
            assetTodayDate = parseInt(assetTodayDateGap.value, 10);
        }

        if (assetTodayRangeDate) {
            assetEmergenDays = parseInt(assetTodayRangeDate.value, 10);
        }
        if (announcement) {
            announcements = announcement.value;
        }
        if (linkAnnounceMent) {
            linkAnnouncements = linkAnnounceMent.value;
        }
        if (rangeHashtag) {
            rangeHashtags = rangeHashtag.value;
        }
        if (rateLimit) {
            configLimit = parseInt(rateLimit.value, 10);
        }
        const emergencyCheckEndDate = assetTodayRangeDate.endDateTime;
        const monthRange: Date[] = DateTimeUtil.generatePreviousDaysPeriods(new Date(), assetTodayDate);
        if (toDate) {
            const checkSnapshot = await this.kaokaiTodaySnapShotService.findOne({ endDateTime: toDate });
            if (checkSnapshot !== undefined && checkSnapshot !== null) {
                const successResponseS = ResponseUtil.getSuccessResponse('Successfully Main Page Data', checkSnapshot);
                return res.status(200).send(successResponseS);
            }
        }
        // convert object to string then json !!!!
        // {endDateTime:-1};
        let convert = undefined;

        const checkCreate = await this.kaokaiTodaySnapShotService.findOne({ endDateTime: monthRange[1] });
        if (checkCreate !== undefined && checkCreate !== null) {
            if (typeof (JSON.stringify(checkCreate)) === 'string') {
                const stringObj = JSON.stringify(checkCreate);
                convert = JSON.parse(stringObj);
                return convert;
            }
        }
        // ordering
        const emerProcessor: EmergencyEventSectionProcessor = new EmergencyEventSectionProcessor(this.emergencyEventService, this.postsService, this.s3Service, this.hashTagService);
        emerProcessor.setData({
            userId,
            emergencyCheckEndDate,
            rangeHashtags,
            endDateTime: monthRange[1]
        });

        const emerSectionModel = await emerProcessor.process2();
        // summation
        const postSectionObjectiveProcessor: PostSectionObjectiveProcessor = new PostSectionObjectiveProcessor(this.postsService, this.s3Service, this.userLikeService);
        postSectionObjectiveProcessor.setData({
            userId,
            startDateTime: monthRange[0],
            endDateTime: monthRange[1]
        });
        postSectionObjectiveProcessor.setConfig({
            searchOfficialOnly
        });

        const postSectionModel = await postSectionObjectiveProcessor.process();
        // roundRobin
        const pageProcessor: PageRoundRobinProcessor = new PageRoundRobinProcessor(this.postsService, this.s3Service, this.userLikeService, this.kaokaiTodayService, this.hashTagService, this.pageService);
        pageProcessor.setData({
            userId,
            startDateTime: monthRange[0],
            endDateTime: monthRange[1],
            configLimit
        });

        pageProcessor.setConfig({
            searchOfficialOnly
        });
        // party executive committee
        // deputy leader
        // deputy secretary of the party
        const pageRoundRobin = await pageProcessor.process();
        let checkPosition1 = undefined;
        const filterContentsRobin = pageRoundRobin.contents;
        if (pageRoundRobin.position !== undefined && pageRoundRobin.position !== null) {
            checkPosition1 = pageRoundRobin.position;
        }
        // เกาะกระแส
        const majorTrendProcessor: MajorTrendSectionModelProcessor = new MajorTrendSectionModelProcessor(this.postsService, this.s3Service, this.userLikeService, this.kaokaiTodayService, this.hashTagService, this.pageService);
        majorTrendProcessor.setData({
            userId,
            startDateTime: monthRange[0],
            endDateTime: monthRange[1],
            filterContentsRobin,
            checkPosition1,
            configLimit
        });

        majorTrendProcessor.setConfig({
            searchOfficialOnly
        });
        const majorTrend = await majorTrendProcessor.process();
        const filterContentsMajor = majorTrend.contents;
        let checkPosition2 = undefined;
        if (majorTrend.position !== undefined && majorTrend.position !== null) {
            checkPosition2 = majorTrend.position;
        }

        const kaokaiProvinceProcessor: KaokaiAllProvinceModelProcessor = new KaokaiAllProvinceModelProcessor(this.postsService, this.s3Service, this.userLikeService, this.kaokaiTodayService, this.hashTagService, this.pageService);
        kaokaiProvinceProcessor.setData({
            userId,
            startDateTime: monthRange[0],
            endDateTime: monthRange[1],
            filterContentsRobin,
            filterContentsMajor,
            checkPosition1,
            checkPosition2,
            configLimit

        });

        kaokaiProvinceProcessor.setConfig({
            searchOfficialOnly
        });
        const kaokaiProvince = await kaokaiProvinceProcessor.process();
        const filterContentsProvince = kaokaiProvince.contents;
        let checkPosition3 = undefined;
        // kaokaiProvince.position;
        if (kaokaiProvince.position !== undefined && kaokaiProvince.position !== null) {
            checkPosition3 = kaokaiProvince.position;
        }
        const kaokaiHashTagProcessor: KaoKaiHashTagModelProcessor = new KaoKaiHashTagModelProcessor(this.postsService, this.s3Service, this.userLikeService, this.kaokaiTodayService, this.hashTagService, this.pageService);
        kaokaiHashTagProcessor.setData({
            userId,
            startDateTime: monthRange[0],
            endDateTime: monthRange[1],
            filterContentsRobin,
            filterContentsMajor,
            filterContentsProvince,
            checkPosition1,
            checkPosition2,
            checkPosition3,
            configLimit
        });

        kaokaiHashTagProcessor.setConfig({
            searchOfficialOnly
        });
        const kaokaiHashTag = await kaokaiHashTagProcessor.process();
        const filterContentsHashTag = kaokaiHashTag.contents;
        let checkPosition4 = undefined;
        // kaokaiHashTag.position;
        if (kaokaiHashTag.position !== undefined && kaokaiHashTag.position !== null) {
            checkPosition4 = kaokaiHashTag.position;
        }

        const kaokaiContentProcessor: KaokaiContentModelProcessor = new KaokaiContentModelProcessor(this.postsService, this.s3Service, this.userLikeService, this.kaokaiTodayService, this.hashTagService, this.pageService);
        kaokaiContentProcessor.setData({
            userId,
            startDateTime: monthRange[0],
            endDateTime: monthRange[1],
            filterContentsRobin,
            filterContentsMajor,
            filterContentsProvince,
            filterContentsHashTag,
            checkPosition1,
            checkPosition2,
            checkPosition3,
            checkPosition4,
            configLimit
        });

        kaokaiContentProcessor.setConfig({
            searchOfficialOnly
        });
        const kaokaiContent = await kaokaiContentProcessor.process();
        // pipeline: [{ $match: { $expr: { $in: ['$_id', bucketF] }, isOfficial: true } }],
        // hashTag
        const hashTagSumma = await this.hashTagService.aggregate([{ $sort: { count: -1 } }, { $limit: 3 }]);
        if (
            pageRoundRobin.contents.length === 0 &&
            majorTrend.contents.length === 0 &&
            kaokaiProvince.contents.length === 0 &&
            kaokaiHashTag.contents.length === 0 &&
            kaokaiContent.contents.length === 0
        ) {
            const emerProcessorUn: EmergencyEventSectionProcessor = new EmergencyEventSectionProcessor(this.emergencyEventService, this.postsService, this.s3Service, this.hashTagService);
            emerProcessorUn.setData({
                assetEmergenDays,
                emergencyCheckEndDate
            });
            const emerSectionModelUn = await emerProcessorUn.process2();
            const postProcessorUn: PostSectionProcessor = new PostSectionProcessor(this.postsService, this.s3Service, this.userLikeService);
            postProcessorUn.setData({
                userId,
                startDateTime: monthRange[0],
                endDateTime: monthRange[1]
            });
            postProcessorUn.setConfig({
                searchOfficialOnly
            });
            const postSectionModelUn = await postProcessorUn.process();
            const pageProcessorUn: PageRoundRobinProcessor = new PageRoundRobinProcessor(this.postsService, this.s3Service, this.userLikeService, this.kaokaiTodayService, this.hashTagService, this.pageService);
            pageProcessorUn.setData({
                userId,
                startDateTime: monthRange[0],
                endDateTime: monthRange[1]
            });

            pageProcessorUn.setConfig({
                searchOfficialOnly
            });
            // party executive committee
            // deputy leader
            // deputy secretary of the party
            const pageRoundRobinUn = await pageProcessorUn.processV2();
            // เกาะกระแส
            const majorTrendProcessorUn: MajorTrendSectionModelProcessor = new MajorTrendSectionModelProcessor(this.postsService, this.s3Service, this.userLikeService, this.kaokaiTodayService, this.hashTagService, this.pageService);
            majorTrendProcessorUn.setData({
                userId,
                startDateTime: monthRange[0],
                endDateTime: monthRange[1],
            });

            majorTrendProcessorUn.setConfig({
                searchOfficialOnly
            });
            const majorTrendUn = await majorTrendProcessorUn.processV2();
            const kaokaiHashTagProcessorUn: KaoKaiHashTagModelProcessor = new KaoKaiHashTagModelProcessor(this.postsService, this.s3Service, this.userLikeService, this.kaokaiTodayService, this.hashTagService, this.pageService);
            kaokaiHashTagProcessorUn.setData({
                userId,
                startDateTime: monthRange[0],
                endDateTime: monthRange[1],
            });

            kaokaiHashTagProcessorUn.setConfig({
                searchOfficialOnly
            });

            const kaokaiHashTagUn = await kaokaiHashTagProcessorUn.processV2();

            // pipeline: [{ $match: { $expr: { $in: ['$_id', bucketF] }, isOfficial: true } }],
            // hashTag
            const hashTagSummaUn = await this.hashTagService.aggregate([{ $sort: { count: -1 } }, { $limit: 3 }]);
            const resultUn: any = {};
            resultUn.emergencyEvents = emerSectionModelUn;
            resultUn.hashTagSumma = hashTagSummaUn;
            resultUn.postSectionModel = postSectionModelUn;
            resultUn.pageRoundRobin = pageRoundRobinUn;
            resultUn.majorTrend = majorTrendUn;
            resultUn.kaokaiHashTag = kaokaiHashTagUn;
            resultUn.announcement = announcements;
            resultUn.linkAnnounceMent = linkAnnouncements;
            const successResponseUn = ResponseUtil.getSuccessResponse('Successfully Main Page Data', resultUn);
            return res.status(200).send(successResponseUn);
        }
        const result: any = {};
        result.emergencyEvents = emerSectionModel;
        result.hashTagSumma = hashTagSumma;
        result.postSectionModel = postSectionModel;
        result.pageRoundRobin = pageRoundRobin;
        result.majorTrend = majorTrend;
        result.kaokaiProvince = kaokaiProvince;
        result.kaokaiHashTag = kaokaiHashTag;
        result.kaokaiContent = kaokaiContent;
        result.announcement = announcements;
        result.linkAnnounceMent = linkAnnouncements;
        const successResponse = ResponseUtil.getSuccessResponse('test test ....', result);
        return res.status(200).send(successResponse);
    }
    // Presigned S3 for Page profile
    @Post('/presigned/page')
    public async testS3CloudFront(@Res() res: any, @Req() req: any): Promise<any> {
        const emergencyEvent = await this.emergencyEventService.findOne({ _id: new ObjectID('63cf856d204f1f728cf5ff11') });
        const s3CloudFront = await this.s3Service.getS3Object(emergencyEvent.s3CoverPageURL);
        if (s3CloudFront) {
            const cloudFront = 'https://' + process.env.AWS_CLOUDFRONT_PREFIX + '/' + emergencyEvent.s3CoverPageURL;
            const successResponse = ResponseUtil.getSuccessResponse('test test ....', cloudFront);
            return res.status(200).send(successResponse);
        }
    }
    /*
    // Presigned S3 for User profile
    @Post('/presigned/user')
    public async presignCloudFrontUser(@Res() res: any, @Req() req: any): Promise<any> {
        const users = await this.userService.find({});
        // s3ImageURL
        // s3CoverURL
    }
    */
    @Post('/is/read')
    public async isRead(@Body({ validate: true }) data: IsRead, @Res() res: any, @Req() req: any): Promise<any> {
        const userId = req.headers.userid;
        const objIds = new ObjectID(userId);
        const clientId = req.headers['client-id']; 
        const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).split(',')[0]; 
        let count = 0;
        if(data.action !== '') {
            for(const item of data.postId) {
                count += 1;
                const workerTheadFindOne:any = await this.workerThreadService.findOne({theThings: new ObjectID(item), type: data.action.toLocaleUpperCase().trim()});
                const userEngagement = new UserEngagement();
                userEngagement.clientId = clientId;
                userEngagement.ip = ipAddress; 
                userEngagement.device = data.device.toLowerCase().trim();
                userEngagement.userId = userId ? new ObjectID(req.headers.userid) : '';
                userEngagement.contentId = '';
                userEngagement.contentType = '';
                userEngagement.action = data.action.toLocaleUpperCase().trim();
                userEngagement.reference = '';
                userEngagement.point = 5;
                userEngagement.postId = new ObjectID(item);
                userEngagement.voteId = [];
                userEngagement.isReadId = '';
                await this.userEngagementService.create(userEngagement);
                if(workerTheadFindOne !== undefined) {
                    await this.workerThreadService.update({_id: workerTheadFindOne.id }, {$set : {sended: workerTheadFindOne.sended + count}});
                }
            } 
        } else {
            for(const item of data.postId) {
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
                userEngagement.postId = new ObjectID(item);
                userEngagement.voteId = [];
                userEngagement.isReadId = '';
                await this.userEngagementService.create(userEngagement);
            } 
        }
        // check is read
        if (objIds) {
            // check is read
            const isReadPost = await this.isReadPostService.findOneAndUpdate(
                { userId: objIds },
                { $set: 
                    { 
                        postId: data.postId, 
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
    @Post('/days/check')
    public async daysCheck(@Res() res: any, @Req() req: any): Promise<any> {

        const now = new Date();
        const year = now.getFullYear(); // Get the current year
        const startDate = req.body.startDate ? req.body.startDate : new Date(year, 0, 1);
        const endDate = req.body.endDate ? req.body.endDate : new Date(year, 11, 31);

        const dateTime = await this.kaokaiTodaySnapShotService.aggregate
            ([
                {
                    $match:
                    {
                        endDateTime: { $gte: new Date(startDate), $lte: new Date(endDate) },
                    }
                },
                {
                    $sort: { endDateTime: -1 }
                },
                {
                    $project: {
                        endDateTime: 1,
                        _id: 0
                    }
                }
            ]);
        if (dateTime.length > 0) {
            const successResponseF = ResponseUtil.getSuccessResponse('Successfully Filter Range Days.', dateTime);
            return res.status(200).send(successResponseF);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Error Filter Range Date.', undefined);
            return res.status(400).send(errorResponse);
        }
    }
    // Find Page API
    /**
     * @api {get} /api/main/content Find Main Page Data API
     * @apiGroup MainPage
     * @apiSuccessExample {json} Success
     * HTTP/1.1 200 OK
     * {
     *      'message": "Successfully get Page"
     *      "data":"{}"
     *      "status": "1"
     * }
     * @apiSampleRequest /api/main/content
     * @apiErrorExample {json} Page error
     * HTTP/1.1 500 Internal Server Error
     */
    @Get('/content')
    public async getContentList(@QueryParam('offset') offset: number, @QueryParam('emergency') emergency: boolean, @QueryParam('section') section: string, @QueryParam('date') date: string, @Res() res: any, @Req() req: any): Promise<any> {

        const userId = req.headers.userid;
        const mainPageSearchConfig = await this.pageService.searchPageOfficialConfig();
        const searchOfficialOnly = mainPageSearchConfig.searchOfficialOnly;
        if (section !== undefined && section !== '') {
            // ordering 
            if (section === 'EMERGENCYEVENT') {
                const emerProcessorSec: EmergencyEventSectionProcessor = new EmergencyEventSectionProcessor(this.emergencyEventService, this.postsService, this.s3Service, this.hashTagService);
                emerProcessorSec.setConfig({
                    showUserAction: true,
                    offset,
                    date,
                    searchOfficialOnly
                });
                const emerSectionModelSec = await emerProcessorSec.process();
                const emerResult: any = {};
                emerResult.contents = emerSectionModelSec.contents;

                if (emerResult) {
                    const successResponse = ResponseUtil.getSuccessResponse('Successfully Main Page Data', emerResult);
                    return res.status(200).send(successResponse);
                } else {
                    const errorResponse = ResponseUtil.getErrorResponse('Unable got Main Page Data', undefined);
                    return res.status(400).send(errorResponse);
                }
            } else if (section === 'LASTEST') {
                const lastestLKProcessorSec: LastestLookingSectionProcessor = new LastestLookingSectionProcessor(this.postsService, this.needsService, this.userFollowService, this.s3Service);
                lastestLKProcessorSec.setData({
                    userId,
                    startDateTime: undefined,
                    endDateTime: undefined
                });
                lastestLKProcessorSec.setConfig({
                    showUserAction: true,
                    offset,
                    date,
                    searchOfficialOnly
                });
                const lastestLookSectionModelSec = await lastestLKProcessorSec.process();

                const lKresult: any = {};
                lKresult.contents = lastestLookSectionModelSec.contents;
                if (lKresult) {
                    const successResponse = ResponseUtil.getSuccessResponse('Successfully Main Page Data', lKresult);
                    return res.status(200).send(successResponse);
                } else {
                    const errorResponse = ResponseUtil.getErrorResponse('Unable got Main Page Data', undefined);
                    return res.status(400).send(errorResponse);
                }
            } else if (section === 'STILLLOOKING') {

                const errorResponse = ResponseUtil.getErrorResponse('Unable got Main Page Data', undefined);
                return res.status(400).send(errorResponse);
            } else if (section === 'RECOMMEND') {
                const userRecProcessorSec: UserRecommendSectionProcessor = new UserRecommendSectionProcessor(this.postsService, this.userFollowService, this.s3Service);
                userRecProcessorSec.setData({
                    userId,
                    startDateTime: undefined,
                    endDateTime: undefined
                });
                userRecProcessorSec.setConfig({
                    showUserAction: true,
                    offset,
                    date,
                    searchOfficialOnly
                });
                const userRecSectionModelSec = await userRecProcessorSec.process();
                userRecSectionModelSec.isList = true;

                const urResult: any = {};
                urResult.contents = userRecSectionModelSec.contents;

                if (urResult) {
                    const successResponse = ResponseUtil.getSuccessResponse('Successfully Main Page Data', urResult);
                    return res.status(200).send(successResponse);
                } else {
                    const errorResponse = ResponseUtil.getErrorResponse('Unable got Main Page Data', undefined);
                    return res.status(400).send(errorResponse);
                }
            } else {
                const errorResponse = ResponseUtil.getErrorResponse('Unable got Main Page Data', undefined);
                return res.status(400).send(errorResponse);
            }
        }

        let processorList: any[] = [];
        const weekRanges: Date[] = DateTimeUtil.generatePreviousDaysPeriods(new Date(), 7);

        // setup search date range for lastest post
        const monthRanges: Date[] = DateTimeUtil.generatePreviousDaysPeriods(new Date(), 30);

        const emerProcessor: EmergencyEventSectionProcessor = new EmergencyEventSectionProcessor(this.emergencyEventService, this.postsService, this.s3Service, this.hashTagService);
        emerProcessor.setConfig({
            showUserAction: true,
            offset,
            date,
            searchOfficialOnly
        });
        const emerSectionModel = await emerProcessor.process();

        const emergencyPinProcessor: EmergencyEventPinProcessor = new EmergencyEventPinProcessor(this.emergencyEventService, this.postsService, this.s3Service);
        emergencyPinProcessor.setConfig({
            searchOfficialOnly
        });
        const emergencyPinModel = await emergencyPinProcessor.process();
        let postSectionModel = undefined;
        let objectiveSectionModel = undefined;
        if (emergency !== true) {
            const postProcessor: PostSectionProcessor = new PostSectionProcessor(this.postsService, this.s3Service, this.userLikeService);
            postProcessor.setData({
                userId,
                startDateTime: monthRanges[0],
                endDateTime: monthRanges[1]
            });
            postProcessor.setConfig({
                searchOfficialOnly
            });
            postSectionModel = await postProcessor.process();
            const objectiveProcessor: ObjectiveProcessor = new ObjectiveProcessor(this.pageObjectiveService, this.postsService, this.s3Service, this.userLikeService, this.assetService);
            objectiveProcessor.setData({
                userId,
                startDateTime: weekRanges[0],
                endDateTime: weekRanges[1]
            });
            objectiveProcessor.setConfig({
                showUserAction: true,
                searchOfficialOnly
            });
            objectiveSectionModel = await objectiveProcessor.process();

            const lastestLKProcessor: LastestLookingSectionProcessor = new LastestLookingSectionProcessor(this.postsService, this.needsService, this.userFollowService, this.s3Service);
            lastestLKProcessor.setData({
                userId,
                startDateTime: weekRanges[0],
                endDateTime: weekRanges[1]
            });
            lastestLKProcessor.setConfig({
                showUserAction: true,
                offset,
                date,
                searchOfficialOnly
            });
            processorList.push(lastestLKProcessor);

            const userRecProcessor: UserRecommendSectionProcessor = new UserRecommendSectionProcessor(this.postsService, this.userFollowService, this.s3Service);
            userRecProcessor.setData({
                userId,
                startDateTime: weekRanges[0],
                endDateTime: weekRanges[1]
            });
            userRecProcessor.setConfig({
                showUserAction: true,
                offset,
                date,
                searchOfficialOnly
            });
            processorList.push(userRecProcessor);

            const userFollowProcessor: UserFollowSectionProcessor = new UserFollowSectionProcessor(this.postsService, this.userFollowService, this.pageService, this.s3Service);
            userFollowProcessor.setData({
                userId,
                startDateTime: weekRanges[0],
                endDateTime: weekRanges[1]
            });
            userFollowProcessor.setConfig({
                limit: 6,
                showUserAction: true,
                searchOfficialOnly
            });
            processorList.push(userFollowProcessor);

            const userPageLookingProcessor: UserPageLookingSectionProcessor = new UserPageLookingSectionProcessor(this.postsService, this.userFollowService, this.s3Service);
            userPageLookingProcessor.setData({
                userId,
                startDateTime: weekRanges[0],
                endDateTime: weekRanges[1]
            });
            userPageLookingProcessor.setConfig({
                limit: 2,
                showUserAction: true,
                searchOfficialOnly
            });
            processorList.push(userPageLookingProcessor);

            const followingRecommendProcessor: FollowingRecommendProcessor = new FollowingRecommendProcessor(this.postsService, this.userFollowService, this.assetService);
            followingRecommendProcessor.setData({
                userId,
                startDateTime: weekRanges[0],
                endDateTime: weekRanges[1]
            });
            followingRecommendProcessor.setConfig({
                limit: 6,
                searchOfficialOnly,
                showPage: true,
                showUserAction: true
            });
            processorList.push(followingRecommendProcessor);

            // open when main icon template show
            const lastestObjProcessor = new LastestObjectiveProcessor(this.pageObjectiveService, this.userFollowService, this.postsService, this.assetService);
            lastestObjProcessor.setData({
                userId,
                startDateTime: weekRanges[0],
                endDateTime: weekRanges[1]
            });
            lastestObjProcessor.setConfig({
                limit: 6,
                showUserAction: true,
                searchOfficialOnly
            });
            processorList.push(lastestObjProcessor);
            processorList = ProcessorUtil.randomProcessorOrdering(processorList);
        }
        const result: any = {};
        result.emergencyEvents = emerSectionModel;
        result.emergencyPin = emergencyPinModel;
        result.postSectionModel = postSectionModel;
        result.objectiveEvents = objectiveSectionModel;
        // result.lastest = lastestLookSectionModel;
        // result.looking = stillLKSectionModel;
        // result.viewSection = userRecSectionModel;
        result.sectionModels = [];
        // ! remove random function when fishished testing
        const randIdx = Math.floor(Math.random() * processorList.length);
        for (let i = 0; i < processorList.length; i++) {
            const processor = processorList[i];
            const model = await processor.process();
            if (model !== undefined && model.contents.length > 0) {
                // !remove random function when fishished testing
                if (randIdx === i) {
                    model.isHighlight = true;
                    // fix content to 3
                    if (model.contents.length > 3) {
                        model.contents = model.contents.slice(0, 3);
                    }
                }
                result.sectionModels.push(model);
            }
        }

        if (result) {
            const successResponse = ResponseUtil.getSuccessResponse('Successfully Main Page Data', result);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Unable got Main Page Data', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    // Find User and Page API
    /**
     * @api {get} /api/main/account Find Main Page Data API
     * @apiGroup MainPage
     * @apiSuccessExample {json} Success
     * HTTP/1.1 200 OK
     * {
     *      "message": "Get User Or Page Success"
     *      "data":"{}"
     *      "status": "1"
     * }
     * @apiSampleRequest /api/main/account
     * @apiErrorExample {json} Cannot Get User Or Page 
     * HTTP/1.1 500 Internal Server Error
     */
    @Get('/account')
    public async getUserAndPageAccount(@QueryParam('id') id: string, @Res() res: any, @Req() req: any): Promise<any> {

        let pageObjId: ObjectID;
        let userObjId: ObjectID;
        let pageStmt: any;
        let userStmt: any;
        let result: any;

        if (id === null || id === undefined || id === '') {
            return res.status(400).send(ResponseUtil.getErrorResponse('Cannot Get User Or Page', undefined));
        }

        try {
            userObjId = new ObjectID(id);
            pageObjId = new ObjectID(id);

            userStmt = { _id: userObjId };
            pageStmt = { _id: pageObjId };
        } catch (ex) {
            userStmt = { uniqueId: id };
            pageStmt = { pageUsername: id };
        } finally {
            if (userObjId === undefined || userObjId === 'undefined') {
                userObjId = null;
            }

            if (pageObjId === undefined || pageObjId === 'undefined') {
                pageObjId = null;
            }

            userStmt = { $or: [{ _id: userObjId }, { uniqueId: id }] };
            pageStmt = { $or: [{ _id: pageObjId }, { pageUsername: id }] };
        }

        let user: User = await this.userService.findOne(userStmt);
        const page: Page = await this.pageService.findOne(pageStmt);

        if (user !== null && user !== undefined) {
            user = await this.userService.cleanUserField(user);
            result = user;
            result.type = SEARCH_TYPE.USER;
        }

        if (page !== null && page !== undefined) {
            result = page;
            result.type = SEARCH_TYPE.PAGE;
        }

        if (result !== null && result !== undefined) {
            return res.status(200).send(ResponseUtil.getSuccessResponse('Get User Or Page Success', result));
        } else {
            return res.status(200).send(ResponseUtil.getSuccessResponse('User Or Page Not Found', undefined));
        }
    }

    // Search User and Page API
    /**
     * @api {post} /api/main/account/search Search Main Page Data API
     * @apiGroup MainPage
     * @apiSuccessExample {json} Success
     * HTTP/1.1 200 OK
     * {
     *      "message": "Get User Or Page Success"
     *      "data":"{}"
     *      "status": "1"
     * }
     * @apiSampleRequest /api/main/account/search
     * @apiErrorExample {json} Cannot Get User Or Page 
     * HTTP/1.1 500 Internal Server Error
     */
    @Post('/account/search')
    public async searchUserAndPageAutocomp(@Body({ validate: true }) data: SearchRequest, @Res() res: any, @Req() req: any): Promise<any> {

        try {
            let result: any;
            const resultData: any[] = [];
            const keyword = data.keyword;
            const regex = { $regex: '.*' + keyword + '.*', $options: 'si' };
            const userStmt = { $or: [{ firstName: regex }, { lastName: regex }, { displayName: regex }, { uniqueId: regex }, { email: regex }], banned: false };
            const pageStmt = { $or: [{ name: regex }, { pageUsername: regex }], banned: false };

            const pages: Page[] = await this.pageService.find(pageStmt);
            const users: User[] = await this.userService.find(userStmt);

            if (users !== null && users !== undefined && users.length > 0) {
                for (let user of users) {
                    user = await this.userService.cleanUserField(user);
                    result = user;
                    result.type = SEARCH_TYPE.USER;
                    resultData.push(result);
                }
            }

            if (pages !== null && pages !== undefined && pages.length > 0) {
                for (const page of pages) {
                    result = page;
                    result.type = SEARCH_TYPE.PAGE;
                    resultData.push(result);
                }
            }

            if (resultData !== null && resultData !== undefined && resultData.length > 0) {
                return res.status(200).send(ResponseUtil.getSuccessResponse('Get User Or Page Success', resultData));
            } else {
                return res.status(200).send(ResponseUtil.getSuccessResponse('User Or Page Not Found', undefined));
            }
        } catch (error: any) {
            return res.status(400).send(ResponseUtil.getErrorResponse('Search Error', error.message));
        }
    }

    // Search API
    /**
     * @api {get} /api/main/search Search API
     * @apiGroup MainPage
     * @apiSuccessExample {json} Success
     * HTTP/1.1 200 OK
     * {
     *      "message": "Search Success",
     *      "data":"{}"
     *      "status": "1"
     * }
     * @apiSampleRequest /api/main/search
     * @apiErrorExample {json} Search Failed
     * HTTP/1.1 500 Internal Server Error
     */
    @Post('/search')
    public async searchAll(@Body({ validate: true }) data: SearchRequest, @Res() res: any, @Req() req: any): Promise<any> {
        try {
            const search: any = {};
            const userId = data.userId;
            const keyword = data.keyword;
            const filter: SearchFilter = data.filter;
            const exp = { $regex: '.*' + keyword + '.*', $options: 'si' };
            const pageResultStmt = [];
            const userResultStmt = [];
            const hashTagResultStmt = [];
            const searchResults = [];
            const historyLimit = 10;
            let pageLimit;
            let userLimit;
            let hashTagLimit;
            let historyRows = 0;
            let pageRows = 0;
            let userRows = 0;
            let hashTagRows = 0;
            let userObjId;
            let historyQuery = {};
            if (userId !== '' && userId !== null && userId !== undefined) {
                userObjId = new ObjectID(userId);
                historyQuery = [
                    { $match: { keyword: exp, userId: userObjId } },
                    { $sort: { createdDate: -1 } },
                    { $limit: historyLimit },
                    { $group: { _id: '$keyword', result: { $first: '$$ROOT' } } },
                    { $replaceRoot: { newRoot: '$result' } }
                ];
            } else {
                historyQuery = [
                    { $match: { keyword: exp } },
                    { $sort: { createdDate: -1 } },
                    { $limit: historyLimit },
                    { $group: { _id: '$keyword', result: { $first: '$$ROOT' } } },
                    { $replaceRoot: { newRoot: '$result' } }
                ];
            }
            const histories = await this.searchHistoryService.aggregate(historyQuery);
            historyRows = histories.length;
            pageLimit = historyLimit - historyRows;
            if (filter !== undefined) {
                if (historyRows !== null && historyRows !== undefined && historyRows > 0) {
                    for (const history of histories) {
                        searchResults.push({ historyId: history._id, value: history.resultId, label: history.keyword, type: history.resultType });
                        if (history.resultType === SEARCH_TYPE.PAGE) {
                            pageResultStmt.push(new ObjectID(history.resultId));
                        } else if (history.resultType === SEARCH_TYPE.USER) {
                            userResultStmt.push(new ObjectID(history.resultId));
                        } else if (history.resultType === SEARCH_TYPE.HASHTAG) {
                            hashTagResultStmt.push(new ObjectID(history.resultId));
                        }
                    }
                }
                if (pageLimit !== null && pageLimit !== undefined && pageLimit > 0) {
                    // const pageQuery = { $and: [{ _id: { $not: { $in: pageResultStmt } } }, { $or: [{ name: exp }, { pageUsername: exp }] }] };
                    const pageQuery = [
                        { $match: { $and: [{ _id: { $not: { $in: pageResultStmt } }, banned: false }, { $or: [{ name: exp }, { pageUsername: exp }] }] } },
                        { $limit: pageLimit }
                    ];
                    const pages: any[] = await this.pageService.aggregate(pageQuery);

                    pageRows = pages.length;
                    if (filter.typeUser !== undefined) {
                        userLimit = pageLimit - pageRows;
                    }
                    if (pageRows !== null && pageRows !== undefined && pageRows > 0) {
                        let pageId;
                        let pageName;

                        for (const page of pages) {
                            pageId = page._id;
                            pageName = page.name;
                            searchResults.push({ value: pageId, label: pageName, type: SEARCH_TYPE.PAGE });
                        }
                    }
                }

                if (userLimit !== null && userLimit !== undefined && userLimit > 0) {
                    // const userQuery = { $and: [{ _id: { $not: { $in: userResultStmt } } }, { $or: [{ displayName: exp }, { firstName: exp }, { lastName: exp }] }] };
                    const userQuery = [
                        { $match: { $and: [{ _id: { $not: { $in: userResultStmt } } }, { isAdmin: false, isSubAdmin: false, banned: false }, { $or: [{ displayName: exp }, { firstName: exp }, { lastName: exp }] }] } },
                        { $limit: userLimit }
                    ];
                    const users = await this.userService.aggregate(userQuery);

                    userRows = users.length;
                    hashTagLimit = userLimit - userRows;
                    if (userRows !== null && userRows !== undefined && userRows > 0) {
                        for (const user of users) {
                            searchResults.push({ value: user._id, label: user.displayName, type: SEARCH_TYPE.USER });
                        }
                    }
                }

                if (filter.typeHashTag !== null && filter.typeHashTag !== undefined && filter.typeHashTag.length > 0) {
                    // const hashTagQuery = { $and: [{ _id: { $not: { $in: hashTagResultStmt } } }, { $or: [{ name: exp }] }] };
                    const hashTagQuery = [
                        { $match: { $and: [{ _id: { $not: { $in: hashTagResultStmt } } }, { $or: [{ name: exp }] }] } },
                        { $limit: 10 }
                    ];
                    const hashTags = await this.hashTagService.aggregate(hashTagQuery);

                    hashTagRows = hashTags.length;
                    if (hashTagRows !== null && hashTagRows !== undefined && hashTagRows > 0) {
                        let tagName;
                        let fullTagName;

                        for (const tag of hashTags) {
                            tagName = tag.name;
                            fullTagName = '#' + tagName;
                            searchResults.push({ value: tagName, label: fullTagName, type: SEARCH_TYPE.HASHTAG });
                        }
                    }
                }
            } else {
                if (historyRows !== null && historyRows !== undefined && historyRows > 0) {
                    for (const history of histories) {
                        searchResults.push({ historyId: history._id, value: history.keyword, label: history.keyword, type: history.resultType });
                        if (history.resultType === SEARCH_TYPE.PAGE) {
                            pageResultStmt.push(new ObjectID(history.resultId));
                        } else if (history.resultType === SEARCH_TYPE.USER) {
                            userResultStmt.push(new ObjectID(history.resultId));
                        } else if (history.resultType === SEARCH_TYPE.HASHTAG) {
                            hashTagResultStmt.push(new ObjectID(history.resultId));
                        }
                    }
                }
                if (pageLimit !== null && pageLimit !== undefined && pageLimit > 0) {
                    // const pageQuery = { $and: [{ _id: { $not: { $in: pageResultStmt } } }, { $or: [{ name: exp }, { pageUsername: exp }] }] };
                    const pageQuery = [
                        { $match: { $and: [{ _id: { $not: { $in: pageResultStmt } }, banned: false }, { $or: [{ name: exp }, { pageUsername: exp }] }] } },
                        { $limit: pageLimit }
                    ];
                    const pages: any[] = await this.pageService.aggregate(pageQuery);

                    pageRows = pages.length;
                    userLimit = pageLimit - pageRows;
                    if (pageRows !== null && pageRows !== undefined && pageRows > 0) {
                        let pageId;
                        let pageName;

                        for (const page of pages) {
                            pageId = page._id;
                            pageName = page.name;
                            searchResults.push({ value: pageId, label: pageName, type: SEARCH_TYPE.PAGE });
                        }
                    }
                }

                if (userLimit !== null && userLimit !== undefined && userLimit > 0) {
                    // const userQuery = { $and: [{ _id: { $not: { $in: userResultStmt } } }, { $or: [{ displayName: exp }, { firstName: exp }, { lastName: exp }] }] };
                    const userQuery = [
                        { $match: { $and: [{ _id: { $not: { $in: userResultStmt } } }, { isAdmin: false, isSubAdmin: false, banned: false }, { $or: [{ displayName: exp }, { firstName: exp }, { lastName: exp }] }] } },
                        { $limit: userLimit }
                    ];
                    const users = await this.userService.aggregate(userQuery);

                    userRows = users.length;
                    hashTagLimit = userLimit - userRows;
                    if (userRows !== null && userRows !== undefined && userRows > 0) {
                        for (const user of users) {
                            searchResults.push({ value: user._id, label: user.displayName, type: SEARCH_TYPE.USER });
                        }
                    }
                }

                if (hashTagLimit !== null && hashTagLimit !== undefined && hashTagLimit > 0) {
                    // const hashTagQuery = { $and: [{ _id: { $not: { $in: hashTagResultStmt } } }, { $or: [{ name: exp }] }] };
                    const hashTagQuery = [
                        { $match: { $and: [{ _id: { $not: { $in: hashTagResultStmt } } }, { $or: [{ name: exp }] }] } },
                        { $limit: hashTagLimit }
                    ];
                    const hashTags = await this.hashTagService.aggregate(hashTagQuery);

                    hashTagRows = hashTags.length;
                    if (hashTagRows !== null && hashTagRows !== undefined && hashTagRows > 0) {
                        let tagName;
                        let fullTagName;

                        for (const tag of hashTags) {
                            tagName = tag.name;
                            fullTagName = '#' + tagName;
                            searchResults.push({ value: tagName, label: fullTagName, type: SEARCH_TYPE.HASHTAG });
                        }
                    }
                }
            }
            search.result = searchResults;
            if (search !== null && search !== undefined && Object.keys(search).length > 0) {
                const successResponse = ResponseUtil.getSuccessResponse('Search Success', search);
                return res.status(200).send(successResponse);
            } else {
                const errorResponse = ResponseUtil.getErrorResponse('Search Failed', undefined);
                return res.status(400).send(errorResponse);
            }
        } catch (error: any) {
            const errorResponse = ResponseUtil.getErrorResponse('Search Error', error.message);
            return res.status(400).send(errorResponse);
        }
    }

    // Search API
    /**
     * @api {get} /api/main/content/search Search API
     * @apiGroup MainPage
     * @apiSuccessExample {json} Success
     * HTTP/1.1 200 OK
     * {
     *      "message": "Search Success",
     *      "data":"{}"
     *      "status": "1"
     * }
     * @apiSampleRequest /api/main/content/search
     * @apiErrorExample {json} Search Failed
     * HTTP/1.1 500 Internal Server Error
     */
    @Post('/content/search')
    public async searchContentAll(@Body({ validate: true }) data: ContentSearchRequest, @QueryParam('isHideStory') isHideStory: boolean, @Res() res: any, @Req() req: any): Promise<SearchContentResponse> {
        try {
            const uId = req.headers.userid;
            const postIds = [];
            if (uId) {
                const objIds = new ObjectID(uId);
                const hidePosts = await this.hidePostService.find({ userId: new ObjectID(objIds) });
                if (hidePosts.length > 0) {
                    for(const hidePost of hidePosts) {
                        postIds.push(new ObjectID(hidePost.postId));
                    }
                }
            }
            let search: any = {};
            const searchResults = [];
            const postStmt = [];
            let searchPostStmt: any[] = [];
            let filter: SearchFilter = data.filter;

            if (filter === undefined) {
                filter = new SearchFilter();
            }

            let keyword: string[];
            let hashTag: string[];
            let type: string;
            let onlyFollowed: boolean;
            let isOfficial: boolean;
            let createBy: any; // {id,type}
            let objective: string;
            let emergencyEvent: string;
            // let emergencyEventTag:string;
            let startDate: string;
            let endDate: string;
            let startViewCount: number = undefined;
            let endViewCount: number = undefined;
            // Count All Action
            let startActionCount: number = undefined;
            let endActionCount: number = undefined;
            // Count Comment
            let startCommentCount: number = undefined;
            let endCommentCount: number = undefined;
            // Count Repost
            let startRepostCount: number = undefined;
            let endRepostCount: number = undefined;
            // Count Like
            let startLikeCount: number = undefined;
            let endLikeCount: number = undefined;
            // Count Share
            let startShareCount: number = undefined;
            let endShareCount: number = undefined;
            // Location
            // let locations: string[];
            // Page Catgory
            let pageCategories: string[];
            let sortBy: string;
            if (data !== undefined) {
                // search all post by keyword or hashTag
                keyword = data.keyword;
                hashTag = data.hashtag;
                onlyFollowed = data.onlyFollowed;
                isOfficial = data.isOfficial;
                type = data.type;
                createBy = data.createBy;
                objective = data.objective;
                emergencyEvent = data.emergencyEvent;
                // emergencyEventTag = data.emergencyEventTag;
                startDate = data.startDate;
                endDate = data.endDate;

                // Comnment This Because Mobile App Show Old Post
                startViewCount = data.startViewCount;
                endViewCount = data.endViewCount;
                startActionCount = data.startActionCount;
                endActionCount = data.endActionCount;
                startCommentCount = data.startCommentCount;
                endCommentCount = data.endCommentCount;
                startRepostCount = data.startRepostCount;
                endRepostCount = data.endRepostCount;
                startLikeCount = data.startLikeCount;
                endLikeCount = data.endLikeCount;
                startShareCount = data.startShareCount;
                endShareCount = data.endShareCount;

                // locations = data.locations;
                pageCategories = data.pageCategories;
                sortBy = data.sortBy;
            }

            postStmt.push({ $match: { deleted: false } });
            postStmt.push({ $match: { pageId: { $ne: null } } });
            if (postIds.length > 0) {
                postStmt.push({ $match: { _id: { $nin: postIds } } });
            }
            if (keyword !== undefined && keyword.length === 1 && keyword[0] === '') {
                keyword = undefined;
            }

            if (keyword !== undefined && keyword !== null && keyword.length > 0) {
                let matchKeywordTitleStmt: any = {};
                let matchKeywordTitleStmtResult: any = {};
                let matchKeywordDetailStmt: any = {};
                let matchKeywordDetailStmtResult: any = {};
                const matchKeywordTitleStmtList: any[] = [];
                const matchKeywordDetailStmtList: any[] = [];
                const matchKeywordStmtResult: any[] = [];

                for (const kw of keyword) {
                    matchKeywordTitleStmt = {};
                    matchKeywordDetailStmt = {};

                    matchKeywordTitleStmt = { title: { $regex: '.*' + kw + '.*', $options: 'si' } };
                    matchKeywordDetailStmt = { detail: { $regex: '.*' + kw + '.*', $options: 'si' } };

                    matchKeywordTitleStmtList.push(matchKeywordTitleStmt);
                    matchKeywordDetailStmtList.push(matchKeywordDetailStmt);

                    matchKeywordTitleStmtResult = { $and: matchKeywordTitleStmtList };
                    matchKeywordDetailStmtResult = { $and: matchKeywordDetailStmtList };
                }

                matchKeywordStmtResult.push(matchKeywordTitleStmtResult, matchKeywordDetailStmtResult);

                if (matchKeywordStmtResult !== null && matchKeywordStmtResult !== undefined && matchKeywordStmtResult.length > 0) {
                    postStmt.push({ $match: { $or: matchKeywordStmtResult } });
                }
            }

            if (hashTag !== undefined && hashTag.length === 1 && hashTag[0] === '') {
                hashTag = undefined;
            }

            if (hashTag !== undefined && hashTag !== null && hashTag.length > 0) {
                /* // open for tag searching in title and detail
                let matchHashTagTitleStmt: any = {};
                let matchHashTagTitleStmtResult: any = {};
                let matchHashTagDetailStmt: any = {};
                let matchHashTagDetailStmtResult: any = {};
                const matchHashTagTitleStmtList: any[] = [];
                const matchHashTagDetailStmtList: any[] = [];
                const matchHashTagStmtResult: any[] = [];
            
                for (const tag of hashTag) {
                    matchHashTagTitleStmt = {};
                    matchHashTagDetailStmt = {};
            
                    matchHashTagTitleStmt = { title: { $regex: '.*' + tag + '.*', $options: 'si' } };
                    matchHashTagDetailStmt = { detail: { $regex: '.*' + tag + '.*', $options: 'si' } };
            
                    matchHashTagTitleStmtList.push(matchHashTagTitleStmt);
                    matchHashTagDetailStmtList.push(matchHashTagDetailStmt);
            
                    matchHashTagTitleStmtResult = { $and: matchHashTagTitleStmtList };
                    matchHashTagDetailStmtResult = { $and: matchHashTagDetailStmtList };
                }
            
                matchHashTagStmtResult.push(matchHashTagTitleStmtResult, matchHashTagDetailStmtResult);
            
                if (matchHashTagStmtResult !== null && matchHashTagStmtResult !== undefined && matchHashTagStmtResult.length > 0) {
                    postStmt.push({ $match: { $or: matchHashTagStmtResult } });
                }*/

                const hashTagIdList: ObjectID[] = [];

                const masterHashTags: HashTag[] = await this.hashTagService.find({ name: { $in: hashTag } });

                if (masterHashTags !== null && masterHashTags !== undefined && masterHashTags.length > 0) {
                    for (const tag of masterHashTags) {
                        const hashTagId = tag.id;

                        hashTagIdList.push(new ObjectID(hashTagId));
                    }

                    if (hashTagIdList !== null && hashTagIdList !== undefined && hashTagIdList.length > 0) {
                        postStmt.push({ $match: { $and: [{ postsHashTags: { $all: hashTagIdList } }] } });
                    } else {
                        return res.status(200).send(ResponseUtil.getSuccessResponse('Search Success', []));
                    }
                }
            }
            if (onlyFollowed === undefined) {
                onlyFollowed = false;
            }

            if (onlyFollowed) {
                const userId = req.headers.userid;
                // search followed user
                const fwhereConditions: any = { $or: [{ subjectType: SUBJECT_TYPE.PAGE }, { subjectType: SUBJECT_TYPE.USER }] };

                if (userId !== undefined && userId !== '') {
                    fwhereConditions.userId = userId;
                }

                const followResult: any = await this.userFollowService.search(undefined, undefined, ['subjectId', 'subjectType'], undefined, fwhereConditions, undefined, false);
                const orUserConditions = [];
                const orPageConditions = [];
                if (followResult !== null && followResult !== undefined) {
                    for (const followObj of followResult) {
                        if (followObj.subjectType === SUBJECT_TYPE.PAGE) {
                            orPageConditions.push(new ObjectID(followObj.subjectId));
                        } else if (followObj.subjectType === SUBJECT_TYPE.USER) {
                            orUserConditions.push(new ObjectID(followObj.subjectId));
                        }
                    }

                    if ((orPageConditions !== null && orPageConditions !== undefined && orPageConditions.length > 0) && (orUserConditions === null || orUserConditions === undefined || orUserConditions.length <= 0)) {
                        postStmt.push({ $match: { $or: [{ pageId: { $in: orPageConditions } }] } });
                    } else if ((orPageConditions === null || orPageConditions === undefined || orPageConditions.length > 0) && (orUserConditions !== null && orUserConditions !== undefined && orUserConditions.length <= 0)) {
                        postStmt.push({ $match: { $or: [{ pageId: { $in: orUserConditions } }] } });
                    } else if ((orPageConditions === null && orPageConditions !== undefined && orPageConditions.length > 0) && (orUserConditions !== null && orUserConditions !== undefined && orUserConditions.length <= 0)) {
                        postStmt.push({ $match: { $or: [{ pageId: { $in: orPageConditions } }, { ownerUser: { $in: orUserConditions } }] } });
                    }
                } else {
                    return res.status(200).send(ResponseUtil.getSuccessResponse('Search Success', []));
                }
                // console.log('orPageConditions',orPageConditions);
            }

            if (type !== null && type !== undefined && type !== '') {
                postStmt.push({ $match: { type } });
            }

            if (createBy !== undefined && createBy.length === 1 && createBy[0] === '') {
                createBy = undefined;
            }

            if (createBy !== null && createBy !== undefined && createBy.length > 0) {
                const searchStmt = [];

                for (const create of createBy) {
                    const id = create.id;
                    const createdByType = create.type;

                    if (createdByType !== null && createdByType !== undefined) {
                        if (createdByType === SEARCH_TYPE.PAGE) {
                            searchStmt.push({ pageId: new ObjectID(id) });
                        } else if (createdByType === SEARCH_TYPE.USER) {
                            searchStmt.push({ pageId: null, ownerUser: new ObjectID(id) });
                        }
                    }
                }

                postStmt.push({ $match: { $or: searchStmt } });
            }

            if (objective !== null && objective !== undefined && objective !== '') {
                const objHashTag: HashTag = await this.hashTagService.findOne({ name: objective });

                if (objHashTag !== null && objHashTag !== undefined) {
                    const pageObjective: PageObjective = await this.pageObjectiveService.findOne({ hashTag: new ObjectID(objHashTag.id) });

                    if (pageObjective !== null && pageObjective !== undefined) {
                        postStmt.push({ $match: { objective: new ObjectID(pageObjective.id) } });
                    }
                } else {
                    return res.status(200).send(ResponseUtil.getSuccessResponse('Search Success', []));
                }
            }

            if (emergencyEvent !== null && emergencyEvent !== undefined && emergencyEvent !== '') {
                const postsEmergencyEvent: EmergencyEvent = await this.emergencyEventService.findOne({ hashTag: new ObjectID(emergencyEvent) });
                if (postsEmergencyEvent !== null && postsEmergencyEvent !== undefined) {
                    postStmt.push({ $match: { emergencyEvent: new ObjectID(postsEmergencyEvent.id) } });
                } else {
                    return res.status(200).send(ResponseUtil.getSuccessResponse('Search Success', []));
                }
            }

            if ((startDate !== null && startDate !== undefined && startDate !== '') && (endDate === null || endDate === undefined || endDate === '')) {
                postStmt.push({ $match: { $and: [{ startDateTime: { $gte: new Date(startDate) } }] } });
            } else if ((startDate === null || startDate === undefined || startDate === '') && (endDate !== null && endDate !== undefined && endDate !== '')) {
                postStmt.push({ $match: { $and: [{ startDateTime: { $lte: new Date(endDate) } }] } });
            } else if ((startDate !== null && startDate !== undefined && startDate !== '') && (endDate !== null && endDate !== undefined && endDate !== '')) {
                postStmt.push({ $match: { $and: [{ startDateTime: { $gte: new Date(startDate), $lte: new Date(endDate) } }] } });
            }

            const groupByStmt = {
                $group: {
                    _id: '$_id',
                    result: { $mergeObjects: '$$ROOT' },
                    total: { $sum: { $add: ['$commentCount', '$repostCount', '$shareCount', '$likeCount'] } }
                }
            };

            const lookupStmt = { $replaceRoot: { newRoot: { $mergeObjects: ['$result', '$$ROOT'] } } };
            const projectStmt = { $project: { result: 0 } };

            let matchStmt;

            if ((startActionCount !== null && startActionCount !== undefined) && (endActionCount === null || endActionCount === undefined)) {
                matchStmt = { $match: { $and: [{ total: { $gte: startActionCount } }] } };
                postStmt.push(groupByStmt, matchStmt, lookupStmt, projectStmt);
            } else if ((startActionCount === null || startActionCount === undefined) && (endActionCount !== null && endActionCount !== undefined)) {
                matchStmt = { $match: { $and: [{ total: { $lte: endActionCount } }] } };
                postStmt.push(groupByStmt, matchStmt, lookupStmt, projectStmt);
            } else if ((startActionCount !== null && startActionCount !== undefined) && (endActionCount !== null && endActionCount !== undefined)) {
                matchStmt = { $match: { $and: [{ total: { $gte: startActionCount, $lte: endActionCount } }] } };
                postStmt.push(groupByStmt, matchStmt, lookupStmt, projectStmt);
            }

            if ((startViewCount !== null && startViewCount !== undefined) && (endViewCount === null || endViewCount === undefined)) {
                postStmt.push({ $match: { $and: [{ viewCount: { $gte: startViewCount } }] } });
            } else if ((startViewCount === null || startViewCount === undefined) && (endViewCount !== null && endViewCount !== undefined)) {
                postStmt.push({ $match: { $and: [{ viewCount: { $lte: endViewCount } }] } });
            } else if ((startViewCount !== null && startViewCount !== undefined) && (endViewCount !== null && endViewCount !== undefined)) {
                postStmt.push({ $match: { $and: [{ viewCount: { $gte: startViewCount, $lte: endViewCount } }] } });
            }

            if ((startCommentCount !== null && startCommentCount !== undefined) && (endCommentCount === null || endCommentCount === undefined)) {
                postStmt.push({ $match: { $and: [{ commentCount: { $gte: startCommentCount } }] } });
            } else if ((startCommentCount === null || startCommentCount === undefined) && (endCommentCount !== null && endCommentCount !== undefined)) {
                postStmt.push({ $match: { $and: [{ commentCount: { $gte: endCommentCount } }] } });
            } else if ((startCommentCount !== null && startCommentCount !== undefined) && (endCommentCount !== null && endCommentCount !== undefined)) {
                postStmt.push({ $match: { $and: [{ commentCount: { $gte: startCommentCount, $lte: endCommentCount } }] } });
            }

            if ((startRepostCount !== null && startRepostCount !== undefined) && (endRepostCount === null || endRepostCount === undefined)) {
                postStmt.push({ $match: { $and: [{ repostCount: { $gte: startRepostCount } }] } });
            } else if ((startRepostCount === null || startRepostCount === undefined) && (endRepostCount !== null && endRepostCount !== undefined)) {
                postStmt.push({ $match: { $and: [{ repostCount: { $lte: endRepostCount } }] } });
            } else if ((startRepostCount !== null && startRepostCount !== undefined) && (endRepostCount !== null && endRepostCount !== undefined)) {
                postStmt.push({ $match: { $and: [{ repostCount: { $gte: startRepostCount, $lte: endRepostCount } }] } });
            }

            if ((startLikeCount !== null && startLikeCount !== undefined) && (endLikeCount === null || endLikeCount === undefined)) {
                postStmt.push({ $match: { $and: [{ likeCount: { $gte: startLikeCount } }] } });
            } else if ((startLikeCount === null || startLikeCount === undefined) && (endLikeCount !== null && endLikeCount !== undefined)) {
                postStmt.push({ $match: { $and: [{ likeCount: { $lte: endLikeCount } }] } });
            } else if ((startLikeCount !== null && startLikeCount !== undefined) && (endLikeCount !== null && endLikeCount !== undefined)) {
                postStmt.push({ $match: { $and: [{ likeCount: { $gte: startLikeCount, $lte: endLikeCount } }] } });
            }

            if ((startShareCount !== null && startShareCount !== undefined) && (endShareCount === null || endShareCount === undefined)) {
                postStmt.push({ $match: { $and: [{ shareCount: { $gte: startShareCount } }] } });
            } else if ((startShareCount === null || startShareCount === undefined) && (endShareCount !== null && endShareCount !== undefined)) {
                postStmt.push({ $match: { $and: [{ shareCount: { $lte: endShareCount } }] } });
            } else if ((startShareCount !== null && startShareCount !== undefined) && (endShareCount !== null && endShareCount !== undefined)) {
                postStmt.push({ $match: { $and: [{ shareCount: { $gte: startShareCount, $lte: endShareCount } }] } });
            }

            // if (locations !== null && locations !== undefined && locations.length > 0) { }
            if (sortBy !== null && sortBy !== undefined && sortBy !== '') {
                if (sortBy === SORT_SEARCH_TYPE.LASTEST_DATE) {
                    postStmt.push({ $sort: { startDateTime: -1 } });
                } else if (sortBy === SORT_SEARCH_TYPE.POPULAR) {
                    postStmt.push({ $sort: { viewCount: -1 } });
                } else if (sortBy === SORT_SEARCH_TYPE.RELATED) {
                    postStmt.push({ $sort: { startDateTime: -1 } });
                }
            } else {
                postStmt.push({ $sort: { startDateTime: -1 } });
            }

            if (pageCategories !== undefined && pageCategories.length === 1 && pageCategories[0] === '') {
                pageCategories = undefined;
            }

            if (pageCategories !== null && pageCategories !== undefined && pageCategories.length > 0) {
                const categoryIdList = [];

                for (const category of pageCategories) {
                    categoryIdList.push(new ObjectID(category));
                }

                const pages: Page[] = await this.pageService.find({ category: { $in: categoryIdList } });
                const pageIdList = [];

                for (const page of pages) {
                    pageIdList.push(new ObjectID(page.id));
                }

                if (pageIdList !== null && pageIdList !== undefined && pageIdList.length > 0) {
                    postStmt.push({ $match: { $or: [{ pageId: { $in: pageIdList } }] } });
                } else {
                    return res.status(200).send(ResponseUtil.getSuccessResponse('Search Success', []));
                }
            }
            // const queryDb = [{$match:{"pageId":{$ne:null}}},{$lookup:{from:"Page",as:"page",let:{pageId:"$pageId"},pipeline:[{$match:{$expr:{$and:[{$eq:["$$pageId","$_id"]}]}}}]}},{$match:{"page.isOfficial" : false}}]
            const postsLookupStmt: any[] = [
                {
                    $lookup: {
                        from: 'Page',
                        as: 'page',
                        let: {
                            pageId: '$pageId'
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $and: [{ $eq: ['$$pageId', '$_id'] }] }
                                }
                            },
                            { $project: { email: 0 } }
                        ],

                    },
                },
                {
                    $unwind: {
                        path: '$page',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'PostsGallery',
                        localField: '_id',
                        foreignField: 'post',
                        as: 'gallery'
                    }
                },
                {
                    $lookup: {
                        from: 'Needs',
                        localField: '_id',
                        foreignField: 'post',
                        as: 'needs'
                    }
                },
                {
                    $lookup: {
                        from: 'Fulfillment',
                        localField: '_id',
                        foreignField: 'post',
                        as: 'fulfillment'
                    }
                },
                {
                    $lookup: {
                        from: 'Fulfillment',
                        localField: '_id',
                        foreignField: 'casePost',
                        as: 'caseFulfillment'
                    }
                },
                {
                    $lookup: {
                        from: 'FulfillmentCase',
                        localField: '_id',
                        foreignField: 'fulfillmentPost',
                        as: 'case'
                    }
                },
                {
                    $addFields: {
                        requesterId: {
                            '$arrayElemAt': ['$case.requester', 0],
                        },
                        fulfillmentPage: {
                            '$arrayElemAt': ['$case.pageId', 0]
                        },
                        casePostId: {
                            '$arrayElemAt': ['$case.postId', 0]
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'Needs',
                        localField: 'casePostId',
                        foreignField: 'post',
                        as: 'caseNeeds'
                    }
                },
                {
                    $lookup: {
                        from: 'User',
                        localField: 'requesterId',
                        foreignField: '_id',
                        as: 'requester'
                    }
                },
                {
                    $unwind: {
                        path: '$requester',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'Page',
                        localField: 'fulfillmentPage',
                        foreignField: '_id',
                        as: 'fulfillmentPage'
                    }
                },
                {
                    $unwind: {
                        path: '$fulfillmentPage',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'SocialPost',
                        localField: '_id',
                        foreignField: 'postId',
                        as: 'socialPosts'
                    }
                },
                {
                    $project: {
                        'case': 0,
                        'requesterId': 0,
                        'requester.password': 0,
                        'requester.birthdate': 0,
                        'requester.customGender': 0,
                        'requester.gender': 0,
                        'requester.createdDate': 0,
                        'requester.coverURL': 0,
                        'requester.address': 0,
                        'requester.facebookURL': 0,
                        'requester.instagramURL': 0,
                        'requester.lineId': 0,
                        'requester.mobileNo': 0,
                        'requester.websiteURL': 0,
                        'requester.twitterURL': 0,
                        'fulfillmentPage.subTitle': 0,
                        'fulfillmentPage.backgroundStory': 0,
                        'fulfillmentPage.detail': 0,
                        'fulfillmentPage.ownerUser': 0,
                        'fulfillmentPage.color': 0,
                        'fulfillmentPage.category': 0,
                        'fulfillmentPage.banned': 0,
                        'fulfillmentPage.createdDate': 0,
                        'fulfillmentPage.updateDate': 0,
                        'socialPosts': {
                            '_id': 0,
                            'pageId': 0,
                            'postId': 0,
                            'postBy': 0,
                            'postByType': 0
                        }
                    }
                },/* 
                $lookup: {
                    from: 'Page',
                    as: 'page',
                    let: {
                        pageId: '$pageId'
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $and: [{ $eq: ['$$pageId', '$_id'] }] }
                            }
                        }
                    ],
                }, */
                {
                    $lookup: {
                        from: 'EmergencyEvent',
                        localField: 'emergencyEvent',
                        foreignField: '_id',
                        as: 'emergencyEvent'
                    }
                },
                {
                    $unwind: {
                        path: '$emergencyEvent',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        // 'emergencyEvent._id': 0,
                        'emergencyEvent.title': 0,
                        'emergencyEvent.detail': 0,
                        'emergencyEvent.coverPageURL': 0,
                        'emergencyEvent.createdDate': 0,
                        'emergencyEvent.isClose': 0,
                        'emergencyEvent.isPin': 0
                    }
                },
                {
                    $lookup: {
                        from: 'PageObjective',
                        localField: 'objective',
                        foreignField: '_id',
                        as: 'objective'
                    }
                },
                {
                    $unwind: {
                        path: '$objective',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        // 'objective._id': 0,
                        'objective.pageId': 0,
                        'objective.title': 0,
                        'objective.detail': 0,
                        'objective.iconURL': 0,
                        'objective.createdDate': 0
                    }
                },
                {
                    $lookup: {
                        from: 'HashTag',
                        let: { postTags: { $ifNull: ['$postsHashTags', []] } },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: ['$_id', '$$postTags']
                                    }
                                }
                            }
                        ],
                        as: 'postsHashTags'
                    }
                },
                {
                    $addFields: {
                        hashTags: {
                            $map: {
                                input: '$postsHashTags',
                                as: 'hashTags',
                                in: { name: '$$hashTags.name' }
                            }
                        }
                    }
                },
                {
                    $project:
                    {
                        postsHashTags: 0,
                    },
                },
                {
                    $limit: filter.limit + filter.offset
                },
                {
                    $skip: filter.offset
                }
            ];

            if (isOfficial !== null && isOfficial !== undefined) {
                postsLookupStmt.splice(2, 0, { $match: { 'page.isOfficial': isOfficial, 'page.banned': false } });
            } else {
                postsLookupStmt.splice(2, 0, { $match: { 'page.banned': false } });
            }

            searchPostStmt = postStmt.concat(postsLookupStmt);
            const userMap = {};
            const postResult = await this.postsService.aggregate(searchPostStmt, { allowDiskUse: true }); // allowDiskUse: true to fix an Exceeded memory limit for $group.
            if (postResult !== null && postResult !== undefined && postResult.length > 0) {
                const postIdList = [];
                const postMap = {};
                for (const post of postResult) {
                    const result = new SearchContentResponse();
                    result.post = post;
                    postIdList.push(post._id);
                    postMap[post._id + ''] = post;

                    const postPage = post.page;

                    if (!!postPage) {
                        const pageImageURL = postPage.imageURL;
                        const pageCoverURL = postPage.coverURL;

                        const pageImageSignURL = await ImageUtil.generateAssetSignURL(this.assetService, pageImageURL, { prefix: '/file/' });
                        const pageCoverSignURL = await ImageUtil.generateAssetSignURL(this.assetService, pageCoverURL, { prefix: '/file/' });

                        Object.assign(postPage, { signURL: (pageImageSignURL ? pageImageSignURL : '') });
                        Object.assign(postPage, { coverSignURL: (pageCoverSignURL ? pageCoverSignURL : '') });
                        delete postPage.s3ImageURL;
                        delete postPage.s3CoverURL;
                    }

                    // inject sign URL
                    const covImageSignURL = await ImageUtil.generateAssetSignURL(this.assetService, post.coverImage, { prefix: '/file/' });
                    Object.assign(post, { coverImageSignURL: (covImageSignURL ? covImageSignURL : '') });

                    if (post.gallery && Array.isArray(post.gallery)) {
                        for (const galImage of post.gallery) {
                            const signURL = await ImageUtil.generateAssetSignURL(this.assetService, galImage.imageURL, { prefix: '/file/' });
                            Object.assign(galImage, { signURL: (signURL ? signURL : '') });
                            delete galImage.s3ImageURL;
                        }
                    }

                    // end inject sign URL
                    if (userMap[post.ownerUser] === undefined) {
                        const user = await this.userService.findOne({ _id: new ObjectID(post.ownerUser) });
                        userMap[post.ownerUser] = this.parseUserField(user);
                    }
                    result.user = userMap[post.ownerUser];
                    searchResults.push(result);
                }

                if (uId !== null && uId !== undefined && uId !== '') {
                    const userObjId = new ObjectID(uId);
                    const userLikes: UserLike[] = await this.userLikeService.find({ userId: userObjId, subjectId: { $in: postIdList }, subjectType: LIKE_TYPE.POST });

                    if (userLikes !== null && userLikes !== undefined && userLikes.length > 0) {
                        for (const like of userLikes) {
                            const postId = like.subjectId;
                            const likeAsPage = like.likeAsPage;
                            const postIdKey = postId + '';

                            if (postId !== null && postId !== undefined && postId !== '') {
                                if (likeAsPage !== null && likeAsPage !== undefined && likeAsPage !== '') {
                                    if (postMap[postIdKey] !== undefined) {
                                        postMap[postIdKey].likeAsPage = true;
                                    }
                                }

                                if (postMap[postIdKey] !== undefined) {
                                    postMap[postIdKey].isLike = true;
                                }
                            }
                        }
                    }

                    const postComments: PostsComment[] = await this.postsCommentService.find({ user: userObjId, post: { $in: postIdList }, deleted: false });
                    if (postComments !== null && postComments !== undefined && postComments.length > 0) {
                        for (const comment of postComments) {
                            const postId = comment.post;
                            const postIdKey = postId + '';

                            if (postId !== null && postId !== undefined && postId !== '') {
                                if (postMap[postIdKey] !== undefined) {
                                    postMap[postIdKey].isComment = true;
                                }
                            }
                        }
                    }
                }

                searchResults.map((dataMap) => {
                    const story = dataMap.post.story;

                    if (isHideStory === true) {
                        if (story !== null && story !== undefined) {
                            dataMap.post.story = {};
                        } else {
                            dataMap.post.story = null;
                        }
                    }
                });

                search = searchResults;
                if (search !== null && search !== undefined && Object.keys(search).length > 0) {
                    const successResponse = ResponseUtil.getSuccessResponse('Search Success', search);
                    return res.status(200).send(successResponse);
                } else {
                    const errorResponse = ResponseUtil.getErrorResponse('Search Failed', undefined);
                    return res.status(400).send(errorResponse);
                }
            } else {
                return res.status(200).send(ResponseUtil.getSuccessResponse('Search Success', []));
            }
        } catch (error: any) {
            const errorResponse = ResponseUtil.getErrorResponse('Search Error', error.message);
            return res.status(400).send(errorResponse);
        }
    }

    @Get('/notification/news')
    public async notificationNews(@Res() res: any, @Req() req: any): Promise<any> {
        const monthRange: Date[] = DateTimeUtil.generatePreviousDaysPeriods(new Date(), 1);
        const notiNews = await this.notificationNewsService.aggregate
            ([
                {
                    $match: { startDateTime: monthRange[1], finish: true, status: true }
                },
                {
                    $sort: { startDateTime: -1 }
                },
                {
                    $limit: 1
                }
            ]);
        if (notiNews) {
            const successResponse = ResponseUtil.getSuccessResponse('Search Success', notiNews);
            return res.status(200).send(successResponse);
        } else {
            const errorResponse = ResponseUtil.getErrorResponse('Search Error cannot find noti news', undefined);
            return res.status(400).send(errorResponse);
        }
    }

    public async snapShotToday(data: any, startDateRange: Date, endDateTimeToday: Date, jobscheduler: string): Promise<any> {

        const scheduler = String(jobscheduler);
        let switchEmail = DEFAULT_SWITCH_CASE_SEND_EMAIL;
        const switchSendEmail = await this.configService.getConfig(SWITCH_CASE_SEND_EMAIL);
        if (switchSendEmail) {
            switchEmail = switchSendEmail.value;
        }
        const switchSendNoti = await this.configService.getConfig(SWITCH_CASE_SEND_NOTI);
        let sendNotification = DEFAULT_SWITCH_CASE_SEND_NOTI;
        if (switchSendNoti) {
            sendNotification = switchSendNoti.value;
        }
        let filterNews = DEFAULT_FILTER_NEWS;
        const configFilterNews = await this.configService.getConfig(FILTER_NEWS);
        if (configFilterNews) {
            filterNews = configFilterNews.value;
        }
        let splitComma = undefined;
        const emailStack = [];
        const listEmail = await this.configService.getConfig(SEND_EMAIL_TO_USER);
        if (listEmail !== undefined) {
            splitComma = listEmail.value.split(',');
            if (splitComma.length > 0) {
                for (const email of splitComma) {
                    emailStack.push(String(email));
                }
            }
        }
        const switchSendEm = switchEmail;
        const now = new Date(); // Get the current time
        const hours = now.getHours(); // Get the hours of the current time
        const minutes = now.getMinutes(); // Get the minutes of the current time
        const assetTimerCheck = await this.configService.getConfig(KAOKAITODAY_TIMER_CHECK_DATE);
        let assetTimer = DEFAULT_KAOKAITODAY_TIMER_CHECK_DAY;
        if (assetTimerCheck) {
            assetTimer = assetTimerCheck.value;
        }
        const split = assetTimer.split(':');
        const hourSplit = split[0];
        const minuteSpit = split[1];
        const checkCreate = await this.kaokaiTodaySnapShotService.findOne({ endDateTime: endDateTimeToday });
        if (checkCreate !== undefined && checkCreate !== null) {
            return checkCreate.data;
        }

        // Check Date time === 06:00 morning
        const fireBaseToken = [];
        // String(switchSendEm) === 'true'
        if (scheduler === 'processor' && hours === parseInt(hourSplit, 10) && minutes === parseInt(minuteSpit, 10)) {
            const result: any = {};
            result.data = data;
            result.startDateTime = startDateRange;
            result.endDateTime = endDateTimeToday;
            result.count = 0;
            result.sumCount = 0;
            const snapshot = await this.kaokaiTodaySnapShotService.create(result);

            // SWITCHING_LINE_FLEX_MESSAGE
            let switchingLFM = DEFAULT_SWITCHING_LINE_FLEX_MESSAGE;
            const configSwitchingLFM = await this.configService.getConfig(SWITCHING_LINE_FLEX_MESSAGE);
            if (configSwitchingLFM) {
                switchingLFM = configSwitchingLFM.value;
            }

            // kaokaiToday.case.send.email.available === false ใช้ในการ switch ว่าจะส่ง email หาทั้งหมดหรือส่งเฉพาะกลุ่ม
            // ถ้า true ส่งเฉพาะบ้างกลุ่ม
            // ถ้า false ส่งทั้งหมด
            if (String(switchSendEm) === 'true' && snapshot) {
                let user = undefined;
                for (const userEmail of emailStack) {
                    user = await this.userService.findOne({ email: userEmail.toString() });
                    if (user.subscribeEmail === true) {
                        // await this.sendEmail(user, user.email, snapshot.data, 'ประชาชนวันนี้', endDateTimeToday);
                    } else {
                        continue;
                    }
                }
            } else {
                const users = await this.userService.find();
                if (snapshot) {
                    for (const user of users) {
                        if (user.subscribeEmail === true) {
                            // await this.sendEmail(user, user.email, snapshot.data, 'ประชาชนหน้าหนึ่ง', endDateTimeToday);
                        } else {
                            continue;
                        }
                    }
                }
            }
            // kaokaiToday.case.send.noti.available	=== false ใช้ในการ switch ว่าจะส่ง noti หาทั้งหมดหรือส่งเฉพาะกลุ่ม
            // ถ้า true ส่งเฉพาะบ้างกลุ่ม
            // ถ้า false ส่งทั้งหมด
            // emailStack คือ email ที่อยู่ใน list ของคนเฉพาะที่เราจะส่งไป  -> send.email.to.user
            if (String(sendNotification) === 'true' && snapshot) {
                for (const userEmail of emailStack) {
                    const user = await this.userService.findOne({ email: userEmail.toString() });
                    const deviceToken = await this.deviceTokenService.aggregate(
                        [
                            {
                                $match: {
                                    userId: user.id,
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
                    if (deviceToken.length > 0) {
                        for (let j = 0; j < deviceToken.length; j++) {
                            if (user.subscribeNoti === true && deviceToken[j].token !== undefined && deviceToken[j].token !== null && deviceToken[j].token !== '') {
                                fireBaseToken.push(deviceToken[j].token);
                            } else {
                                continue;
                            }
                        }
                    }
                }
                if (fireBaseToken.length > 0) {
                    const postIds: any[] = [];
                    const token = fireBaseToken.filter((element, index) => {
                        return fireBaseToken.indexOf(element) === index;
                    });
                    if (String(filterNews) === 'true') {
                        if(snapshot.data.pageRoundRobin.contents.length > 0) {
                            postIds.push(new ObjectID(snapshot.data.pageRoundRobin.contents[0].post._id));
                        }
                    } else {
                        postIds.push(new ObjectID(snapshot.data.majorTrend.contents[0].post._id));
                    }
                    if(String(switchingLFM) === 'true') {
                        const content: any = {
                            'messages': [
                                {
                                    'type': 'flex',
                                    'altText': `ข่าวหน้าหนึ่งประชาชนประจำวัน`,
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
                        let dd: any = snapshot.endDateTime.getDate() - 1;
                        let mm = snapshot.endDateTime.getMonth() + 1;
                        if (dd < 10) { dd = '0' + dd; }
                        if (mm < 10) { mm = '0' + mm; }
                        const votePPle = process.env.APP_HOME + `?date=${endDateTimeToday.getFullYear()}-${mm}-${dd}`;
                        const endDate = new Date(snapshot.endDateTime);
                        endDate.setDate(endDate.getDate() - 1);
                        const dateTime = endDate.toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        });
                        content['messages'][0].contents.body.contents.push(
                            {
                                'type': 'image',
                                'url': snapshot.data.pageRoundRobin.contents[0] !== undefined ? snapshot.data.pageRoundRobin.contents[0].coverPageSignUrl : snapshot.data.majorTrend.contents[0].coverPageSignUrl,
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
                                                'text': snapshot.data.pageRoundRobin.contents[0] !== undefined ? snapshot.data.pageRoundRobin.contents[0].post.title : snapshot.data.majorTrend.contents[0].post.title,
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
                    workThreadModel.postIds = postIds;
                    workThreadModel.type = NotiTypeAction['pple_news_noti'];
                    workThreadModel.active = false;
                    await this.workerThreadService.create(workThreadModel);
                    const chunks: number[][] = await checkify(fireBaseToken, Number(process.env.WORKER_THREAD_JOBS));
                    chunks.forEach((item,i) => {
                        const workerThread = new Worker(process.env.WORKER_THREAD_PATH);
                        const messagePayload = {
                            'snapshot': snapshot.data,
                            'token': item,
                            'date': endDateTimeToday,
                            'filterNews':filterNews,
                            'type': NotiTypeAction['pple_news_noti'],
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
                const deviceToken = await this.deviceTokenService.aggregate(
                    [
                        {
                            $match: {
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
                if (deviceToken.length > 0) {
                    for (let j = 0; j < deviceToken.length; j++) {
                        if (deviceToken[0].User.subscribeNoti === true && deviceToken[0].User !== undefined && deviceToken[j].token !== undefined && deviceToken[j].token !== null && deviceToken[j].token !== '') {
                            fireBaseToken.push(deviceToken[j].token);
                        } else {
                            continue;
                        }
                    }
                }
                if (fireBaseToken.length > 0) {
                    const postIds: any[] = [];
                    const token = fireBaseToken.filter((element, index) => {
                        return fireBaseToken.indexOf(element) === index;
                    });

                    if (String(filterNews) === 'true') {
                        if(snapshot.data.pageRoundRobin.contents.length > 0) {
                            for (let i = 0; i < snapshot.data.pageRoundRobin.contents.length; i++) {
                                postIds.push(new ObjectID(snapshot.data.pageRoundRobin.contents.contents[i].post._id));
                            }
                        }
                    } else {
                        postIds.push(new ObjectID(snapshot.data.majorTrend.contents[0].post._id));
                    }
                    if(String(switchingLFM) === 'true') {
                        const content: any = {
                            'messages': [
                                {
                                    'type': 'flex',
                                    'altText': `ข่าวหน้าหนึ่งประชาชนประจำวัน`,
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
                        let dd: any = snapshot.endDateTime.getDate();
                        let mm = snapshot.endDateTime.getMonth() + 1;
                        if (dd < 10) { dd = '0' + dd; }
                        if (mm < 10) { mm = '0' + mm; }
                        const votePPle = process.env.APP_HOME + `?date=${endDateTimeToday.getFullYear()}-${mm}-${dd}`;
                        const endDate = new Date(snapshot.endDateTime);
                        endDate.setDate(endDate.getDate() - 1);
                        const dateTime = endDate.toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        });
                        content['messages'][0].contents.body.contents.push(
                            {
                                'type': 'image',
                                'url': snapshot.data.pageRoundRobin.contents[0] !== undefined ? snapshot.data.pageRoundRobin.contents[0].coverPageSignUrl : snapshot.data.majorTrend.contents[0].coverPageSignUrl,
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
                                                'text': snapshot.data.pageRoundRobin.contents[0] !== undefined ? snapshot.data.pageRoundRobin.contents[0].post.title : snapshot.data.majorTrend.contents[0].post.title,
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
                    workThreadModel.postIds = postIds;
                    workThreadModel.type = NotiTypeAction['pple_news_noti'];
                    workThreadModel.active = false;
                    await this.workerThreadService.create(workThreadModel);
                    const chunks: number[][] = await checkify(deviceToken, Number(process.env.WORKER_THREAD_JOBS));
                    chunks.forEach((item,i) => {
                        const workerThread = new Worker(process.env.WORKER_THREAD_PATH);
                        const messagePayload = {
                            'snapshot': snapshot.data,
                            'token': item,
                            'date': endDateTimeToday,
                            'filterNews':filterNews,
                            'type': NotiTypeAction['pple_news_noti'],
                        };
                        
                        workerThread.postMessage(messagePayload);
                        workerThread.on('message', async (feedback:any) => {
                            if(feedback.message === 'done') {
                                console.log(`Worker ${i} completed.`);
                            }
                        });
                    });
                    // const originalArray = Array.from({ length: token.length }, (_, i) => i + 1); // Create the original array [1, 2, 3, ..., 50000]
                    // const slicedArrays = [];
                    // const batchSize = 499;
                    // let sendMulticast = undefined;
                    // for (let i = 0; i < originalArray.length; i += batchSize) {
                    //     const slicedArray = token.slice(i, i + batchSize);
                    //     slicedArrays.push(slicedArray);
                    // }
                    // if (slicedArrays.length > 0) {
                    //     for (let j = 0; j < slicedArrays.length; j++) {
                    //         // sendMulticast = await this.notificationService.multiPushNotificationMessage(snapshot.data, slicedArrays[j], endDateTimeToday, filterNews);
                    //     }
                    //     if (sendMulticast) {
                    //         // await this.notificationNewsService.create(
                    //         //     {
                    //         //         kaokaiTodaySnapShotId: snapshot.id,
                    //         //         data: snapshot.data,
                    //         //         tokenFCM: undefined,
                    //         //         startDateTime: endDateTimeToday,
                    //         //         endDateTime: endDateTimeToday,
                    //         //         total: token.length,
                    //         //         send: token.length + 1,
                    //         //         finish: true,
                    //         //         type: 'notification_news',
                    //         //         status: true
                    //         //     }
                    //         // );
                    //     }
                    // }
                }
            }
            return snapshot;
        } else {
            const maxDate = await this.kaokaiTodaySnapShotService.aggregate([{ $sort: { endDateTime: -1 } }, { $limit: 1 }]);
            if (maxDate.length > 0) {
                return maxDate[0];
            } else {
                const errorResponse = ResponseUtil.getErrorResponse('This Email not exists', undefined);
                return errorResponse;
            }
        }
    }

    public async sendEmail(user: User, email: string, content: any, subject: string, date?: Date): Promise<any> {
        const majorContents = [];
        const pageRoundRobin = [];
        if (content.majorTrend.contents.length > 0) {
            for (let i = 0; i < content.majorTrend.contents.length; i++) {
                if (content.majorTrend.contents[i].coverPageUrl !== undefined && i < 3) {
                    majorContents.push(content.majorTrend.contents[i]);
                } else {
                    continue;
                }
            }
        }
        if (content.pageRoundRobin.contents.length > 0) {
            for (let j = 0; j < content.pageRoundRobin.contents.length; j++) {
                if (content.pageRoundRobin.contents[j].coverPageUrl !== undefined && j < 4) {
                    pageRoundRobin.push(content.pageRoundRobin.contents[j]);
                } else {
                    continue;
                }
            }
        }
        const newsTitle = [];
        if (date === undefined) {
            const errorResponse = ResponseUtil.getErrorResponse('Date time undefined.', undefined);
            return errorResponse;
        }

        let postSection = undefined;
        let linkPostSection = undefined;
        let picPostSection = undefined;
        let hashTag = undefined;
        let splitPostSection = undefined;
        let splitDetailPostSection = undefined;
        if (content.postSectionModel.contents.length > 0) {
            postSection = content.postSectionModel.contents[0];
            if (postSection.post.title.length > 0) {
                splitPostSection = postSection.post.title;
            }
            if (postSection.post.detail.length > 0) {
                splitDetailPostSection = postSection.post.detail;
            }
            linkPostSection = process.env.APP_POST + '/' + postSection.post._id;
            picPostSection = content.postSectionModel.contents[0].coverPageUrl ? process.env.APP_API + content.postSectionModel.contents[0].coverPageUrl + '/image' : '';
            hashTag = content.hashTagSumma[0].name;
            if (splitPostSection.length >= 139) {
                splitPostSection = postSection.post.title.slice(0, 139);
            }
            if (splitDetailPostSection.length >= 280) {
                splitDetailPostSection = postSection.post.detail.slice(0, 280) + '.....';
            }
            newsTitle.push(splitPostSection);
        }
        let picPostMajorF = undefined;
        let picPostMajorS = undefined;

        let postMajorTitleF = undefined;
        let postMajorTitleS = undefined;
        let postMajorNameF = undefined;
        let postMajorNameS = undefined;
        if (majorContents[0] !== undefined) {
            postMajorTitleF = majorContents[0].post.title;
            if (postMajorTitleF.length > 100) {
                postMajorTitleF = majorContents[0].post.title.slice(0, 100) + '...';
            }
            newsTitle.push(postMajorTitleF);
        } if (majorContents[1] !== undefined) {
            postMajorTitleS = majorContents[1].post.title;
            if (postMajorTitleS.length > 100) {
                postMajorTitleS = majorContents[1].post.title.slice(0, 100) + '...';
            }
            newsTitle.push(postMajorTitleS);
        } if (majorContents[0] !== undefined) {
            postMajorNameF = majorContents[0].owner.name ? majorContents[0].owner.name : majorContents[0].owner.displayName;
        } if (majorContents[1] !== undefined) {
            postMajorNameS = majorContents[1].owner.name ? majorContents[1].owner.name : majorContents[1].owner.displayName;
        }
        if (majorContents[0] !== undefined) {
            picPostMajorF = majorContents[0].coverPageSignUrl ? `
            <div style="display: flex;gap: 5px;background: white;">
                <div
                    style="display: flex; text-align: center;font-size: 12pt;width:400px;height:340px;background: white;">
                    <img style="width: 100%;height: 100%;object-fit: cover;background: white;margin-left:15px"
                        src=${majorContents[0].coverPageSignUrl}>
                </div>
            </div>`:
                `<div style="display: flex;gap: 5px;width:400px;height:340px">
                <span style="color:black;text-align: center;margin-top:160px;margin-bottom:133px;width: 100%;">${postMajorTitleF}</span> 
            </div>`;
        }
        if (majorContents[1] !== undefined) {
            picPostMajorS = majorContents[1].coverPageSignUrl ? `
            <div style="display: flex;gap: 5px;background: white;">
                <div
                    style="display: flex; text-align: center;font-size: 12pt;width:400px;height:340px;background: white;">
                    <img style="width: 100%;height: 100%;object-fit: cover;background: white;margin-left:15px"
                        src=${majorContents[1].coverPageSignUrl}>
                </div>
            </div>` :
                `            
            <div style="display: flex;gap: 5px;width:400px;height:340px">
                <span style="color:black;text-align: center;margin-top:160px;margin-bottom:133px;width: 100%;">${postMajorTitleS}</span> 
            </div>`
                ;
        }
        let picPostRoundRobinF = undefined;
        let postRoundRobinF = undefined;
        let nameRoundRobinF = undefined;
        let linkPostRoundRobinF = undefined;

        let picPostRoundRobinS = undefined;
        let postRoundRobinS = undefined;
        let nameRoundRobinS = undefined;
        let linkPostRoundRobinS = undefined;

        let picPostRoundRobinT = undefined;
        let postRoundRobinT = undefined;
        let nameRoundRobinT = undefined;
        let linkPostRoundRobinT = undefined;
        const dateFormat = new Date(date);
        const dateReal = dateFormat.setDate(dateFormat.getDate() - 1);
        const toDate = new Date(dateReal);
        const year = toDate.getFullYear();
        const month = (toDate.getMonth() + 1).toString().padStart(2, '0');
        const day = toDate.getDate().toString().padStart(2, '0');
        const formattedDate = `${day}-${month}-${year}`;
        const homePage = process.env.APP_HOME + `?date=${formattedDate}`;
        if (pageRoundRobin.length > 0) {
            if (pageRoundRobin[0] !== undefined) {
                nameRoundRobinF = pageRoundRobin[0].owner.name ? pageRoundRobin[0].owner.name : pageRoundRobin[0].owner.displayName;
            }
            if (pageRoundRobin[0] !== undefined) {
                linkPostRoundRobinF = process.env.APP_POST + '/' + pageRoundRobin[0].post._id;
            }
            if (pageRoundRobin[0] !== undefined) {
                postRoundRobinF = pageRoundRobin[0].post.title;
                if (postRoundRobinF.length > 38) {
                    postRoundRobinF = pageRoundRobin[0].post.title.slice(0, 38) + '...';
                }
                newsTitle.push(postRoundRobinF);
            }
            if (pageRoundRobin[0] !== undefined) {
                picPostRoundRobinF = pageRoundRobin[0].coverPageSignUrl ?
                    `
                <div style="display: flex; text-align: center;font-size: 12pt;width:100%;height: 210px;background: white;margin-bottom: 10px;">
                    <img style="width: 100%;object-fit: cover;background: white;height:100%;"
                        src=${pageRoundRobin[0].coverPageSignUrl}>
                </div>`: `         
                <div style="display: flex;gap: 5px;width:100%;height: 210px;margin-bottom:10px">
                    <span style="color:black;text-align: center;margin-top:100px;width: 100%;">${postRoundRobinF}</span> 
                </div>`;
            }
            if (pageRoundRobin[1] !== undefined) {
                postRoundRobinS = pageRoundRobin[1].post.title;
                if (postRoundRobinS.length > 38) {
                    postRoundRobinS = pageRoundRobin[1].post.title.slice(0, 38) + '...';
                }
                newsTitle.push(postRoundRobinS);
            }
            if (pageRoundRobin[1] !== undefined) {
                nameRoundRobinS = pageRoundRobin[1].owner.name ? pageRoundRobin[1].owner.name : pageRoundRobin[1].owner.displayName;
            }
            if (pageRoundRobin[1] !== undefined) {
                linkPostRoundRobinS = process.env.APP_POST + '/' + pageRoundRobin[1].post._id;
            }
            if (pageRoundRobin[1] !== undefined) {
                picPostRoundRobinS = pageRoundRobin[1].coverPageSignUrl ?
                    `
                        <div style="display: flex; text-align: center;font-size: 12pt;width:100%;height: 210px;background: white;margin-bottom: 10px;">
                            <img style="width: 100%;object-fit: cover;background: white;height:100%;"
                                src=${pageRoundRobin[1].coverPageSignUrl}>
                        </div>`: `         
                        <div style="display: flex;gap: 5px;width:100%;height: 210px;margin-bottom:10px">
                            <span style="color:black;text-align: center;margin-top:100px;width: 100%;">${postRoundRobinS}</span> 
                        </div>`
                    ;
            }

            if (pageRoundRobin[2] !== undefined) {
                postRoundRobinT = pageRoundRobin[2].post.title;
                if (postRoundRobinT.length > 38) {
                    postRoundRobinT = pageRoundRobin[2].post.title.slice(0, 38) + '...';
                }
                newsTitle.push(postRoundRobinT);
            }

            if (pageRoundRobin[2] !== undefined) {
                picPostRoundRobinT = pageRoundRobin[2].coverPageSignUrl ?
                    `
                <div style="display: flex; text-align: center;font-size: 12pt;width:100%;height: 210px;background: white;margin-bottom: 10px;">
                        <img style="width: 100%;object-fit: cover;background: white;height:100%;"
                            src=${pageRoundRobin[2].coverPageSignUrl}>
                </div>`: `         
                <div style="display: flex;gap: 5px;width:100%;height: 210px;margin-bottom:10px">
                        <span style="color:black;text-align: center;margin-top:100px;width: 100%;">${postRoundRobinT}</span> 
                </div>`
                    ;
            }
            if (pageRoundRobin[2] !== undefined) {
                nameRoundRobinT = pageRoundRobin[2].owner.name ? pageRoundRobin[2].owner.name : pageRoundRobin[2].owner.displayName;
            }
            if (pageRoundRobin[2] !== undefined) {
                linkPostRoundRobinT = process.env.APP_POST + '/' + pageRoundRobin[2].post._id;
            }

        }
        // link post
        let linkPostMajorTrendF = undefined;
        let linkPostMajorTrendS = undefined;
        if (content.majorTrend.contents[0] !== undefined) {
            linkPostMajorTrendF = process.env.APP_POST + '/' + content.majorTrend.contents[0].post._id;
        } if (content.majorTrend.contents[1] !== undefined) {
            linkPostMajorTrendS = process.env.APP_POST + '/' + content.majorTrend.contents[1].post._id;
        }
        const loveIcons = 'https://ea.twimg.com/email/self_serve/media/icon_like-1497559206788.png';
        const commentIcons = 'https://ea.twimg.com/email/self_serve/media/icon_reply-1497559206779.png';
        const shareIcons = 'https://ea.twimg.com/email/self_serve/media/icon_retweet-1497559206722.png';
        const linkPlayStore = 'https://play.google.com/store/apps/details?id=org.moveforwardparty.today&hl=en_US';
        const linkAppStore = 'https://apps.apple.com/th/app/mfp-today/id6444463783?l=th';
        const linkPicPlaySyore = 'https://w7.pngwing.com/pngs/91/37/png-transparent-google-play-android-app-store-android-text-logo-microsoft-store.png';
        const linkPicAppStore = 'https://e7.pngegg.com/pngimages/506/939/png-clipart-app-store-logo-iphone-app-store-get-started-now-button-electronics-text.png';

        const oneDay = 24 * 60 * 60 * 1000; // one day in milliseconds
        const thaiDate = new Date(date.getTime() - oneDay).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        let sendMail = undefined;
        let message = undefined;
        if (picPostMajorF !== undefined &&
            picPostMajorS !== undefined &&
            postMajorTitleF !== undefined &&
            postMajorTitleS !== undefined &&
            postMajorNameF !== undefined &&
            postMajorNameS !== undefined &&
            picPostRoundRobinF !== undefined &&
            picPostRoundRobinS !== undefined &&
            picPostRoundRobinT !== undefined &&
            postRoundRobinF !== undefined &&
            nameRoundRobinF !== undefined &&
            postRoundRobinS !== undefined &&
            nameRoundRobinS !== undefined &&
            postRoundRobinT !== undefined &&
            nameRoundRobinT !== undefined &&
            postSection !== undefined &&
            linkPostSection !== undefined &&
            linkPostMajorTrendF !== undefined &&
            linkPostMajorTrendS !== undefined &&
            linkPostRoundRobinF !== undefined &&
            linkPostRoundRobinS !== undefined &&
            linkPostRoundRobinT !== undefined &&
            hashTag !== undefined &&
            picPostSection !== undefined &&
            splitPostSection !== undefined
        ) {
            message = `
            <div style="padding: 10px;background: white;width: 850px;">
               <div style="width: 60px;height: 52px;padding: 10px;position: absolute;float: right;background: white;">
                    <img src='https://mfp-today-web.s3.ap-southeast-1.amazonaws.com/unnamed.png'
                       alt='profile' style=" width: 100%;height: 100%;object-fit: cover;background: white;">
               </div>
               <div style="display: grid;margin: 30px 40px;
               gap: 5px;">
                   <span
                       style="font-size: 26pt;padding-bottom: 10px;background: white;color: #ee7623;text-align: center;">ประชาชนหน้าหนึ่ง</span>
                   <span style="background: white;color: #ee7623;text-align: center;">ฉบับวันที่ <span style = 'background: white;color:black;'>${thaiDate}</span></span>
               </div>
            
            
               <div style="width: 100%;padding-bottom: 20px;background: white;">
                   <div style="padding: 15px 0;background-color: #f8f8f8;padding-bottom: 10px;">
                       <span style="color:orange;font-size: 10pt;padding-left: 20px;background-color: #f8f8f8">มาใหม่ : </span>
                       <a style="font-size: 10pt;background-color: #f8f8f8">#${hashTag}</a>
                   </div>
                    <div style="width: 100%;padding-top: 10px;display: flex;background: white; border-bottom: 1px solid gray;">
                        <a href=${linkPostSection} style='display:flex;background:white;text-decoration:none;'>
                            <div style="display: flex; text-align: center;font-size: 12pt;height: 370px;background: white;">
                                <img style="width: 100%;height: 100%;object-fit: cover;background: white;"
                                    src=${picPostSection}>
                            </div>
                            <div style="background: white;width: 70%;text-decoration:none;color:black">
                                <div style="display: grid;word-break: break-all;padding: 15px;background: white; text-decoration:none;color:black">
                                    <span style="background: white;font-size: 16pt;">
                                        ${splitPostSection}
                                    </span>
                                    <span style="background: white;">
                                        ${splitDetailPostSection}
                                    </span>
                                    <span style="background: white;color: gray;font-size: 14px;">#${postSection.post.objectiveTag}</span>
                                    <span style="background: white;color: gray;font-size: 14px;">โดย <span style="color: #ee7623;font-size: 14px;background: white;">${postSection.owner.name}</span></span>
                                            <div style='display:flex; background-color:#FFFFFF'>
                                            <span
                                                style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                <img src=${commentIcons} style='width:20px;height:20px;background-color: #FFFFFF;'>
                                                ${postSection.post.commentCount}</span>
                                            <span
                                                style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                <img src=${shareIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                ${postSection.post.shareCount}</span>
                                            <span
                                                style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                <img src=${loveIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                ${postSection.post.likeCount}</span>
                                        </div>
                                </div>
                            </div>
                        </a>
                    </div>
               </div>
            
            
               <div style="width: 100%;background: white;border-bottom: 1px solid gray;">
                   <div style="width: 100%;display: flex;background: white;">
                        <div style="width: 50%;margin-right: 5px;background: white;">
                            <a href=${linkPostMajorTrendF} style='background:white;text-decoration:none;'>
                                ${picPostMajorF}
                                <div
                                    style="display: grid;word-break: break-all;margin-top: 15px;padding: 15px;background: white;margin-bottom: 10px;">
                                    <span style="background: white;margin-bottom: 10px;color:black;">
                                        ${postMajorTitleF}
                                    </span>
                                    <span style="background: white;color: gray;font-size: 14px;margin-bottom: 10px;">โดย <span
                                            style="color: #ee7623;font-size: 14px;background: white;">${postMajorNameF}</span></span>
                                    <div style='display:flex; background-color:#FFFFFF'>
                                    ${content.majorTrend.contents[0] ? content.majorTrend.contents[0].post.commentCount : 0}</span>
                                    <span
                                        style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                        <img src=${shareIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                        ${content.majorTrend.contents[0] ? content.majorTrend.contents[0].post.shareCount : 0}</span>
                                    <span
                                        style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                        <img src=${loveIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                        ${content.majorTrend.contents[0] ? content.majorTrend.contents[0].post.likeCount : 0}</span>
                                    </div>
                                </div>
                            </a>
                        </div>
                        <div style="width: 50%;margin-right: 5px;background: white;">
                            <a href=${linkPostMajorTrendS} style='background:white;text-decoration:none;'>
                                ${picPostMajorS}
                                <div
                                    style="display: grid;word-break: break-all;margin-top: 15px;padding: 15px;background: white;margin-bottom: 10px;">
                                    <span style="background: white;margin-bottom: 10px;color:black;">
                                        ${postMajorTitleS}
                                    </span>
                                    <span style="background: white;color: gray;font-size: 14px;margin-bottom: 10px;">โดย <span
                                            style="color: #ee7623;font-size: 14px;background: white;">${postMajorNameS}</span></span>
                                    <div style='display:flex; background-color:#FFFFFF'>
                                        <span
                                            style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                            <img src=${commentIcons} style='width:20px;height:20px;background-color: #FFFFFF;'>
                                            ${content.majorTrend.contents[1] ? content.majorTrend.contents[1].post.commentCount : 0}</span>
                                            <span
                                                style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                <img src=${shareIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                ${content.majorTrend.contents[1] ? content.majorTrend.contents[1].post.shareCount : 0}</span>
                                            <span
                                                style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                <img src=${loveIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                ${content.majorTrend.contents[1] ? content.majorTrend.contents[1].post.likeCount : 0}</span>
                                    </div>
                                </div>
                            </a>
                        </div>
                   </div>
               </div>
               <div style="display: flex;background: white;padding-top: 15px;padding-bottom: 15px;border-bottom: 1px solid gray;">
                    <div style="width: 33.33%;background: white;padding-right: 5px;">
                        <a href=${linkPostRoundRobinF} style='background:white;text-decoration:none;'>
                            ${picPostRoundRobinF}
                            <div style="margin-bottom: 5px;background: white;display: grid;">
                                <span style="background: white;font-size: 14px;margin-bottom: 40px;color:black;">
                                        ${postRoundRobinF}
                                </span>
                                <span style="background: white;color: gray;font-size: 14px;color:black;">โดย <span
                                        style="color: #ee7623;font-size: 14px;background: white;">${nameRoundRobinF}</span></span>
                            </div>
                        </a>
                    </div>
                    <div style="width: 33.33%;background: white;padding-right: 5px;">
                    <a href=${linkPostRoundRobinS} style='background:white;text-decoration:none;'>
                        ${picPostRoundRobinS}
                        <div style="margin-bottom: 5px;background: white;display: grid;">
                            <span style="background: white;font-size: 14px;margin-bottom: 40px;color:black;">
                                    ${postRoundRobinS}
                            </span>
                            <span style="background: white;color: gray;font-size: 14px;">โดย <span
                                    style="color: #ee7623;font-size: 14px;background: white;">${nameRoundRobinS}</span></span>
                        </div>
                    </a>
                    </div>
                   <div style="width: 33.33%;background: white;">
                        <a href=${linkPostRoundRobinT} style='background:white;text-decoration:none;'>
                            ${picPostRoundRobinT}
                            <div style="margin-bottom: 5px;background: white;display: grid;">
                                <span style="background: white;font-size: 14px;margin-bottom: 40px;color:black;">
                                        ${postRoundRobinT}
                                </span>
                                <span style="background: white;color: gray;font-size: 14px;">โดย <span
                                        style="color: #ee7623;font-size: 14px;background: white;">${nameRoundRobinT}</span></span>
                            </div>
                        </a>
                   </div>
               </div>
               <a href=${homePage} style="display:block;text-align:center;width:100%;margin-top:15px;background:white;margin-bottom:20px;border-radius:50px;padding:10px 0;border:1px solid #ee7623; background:white;color:#ee7623;text-decoration: none;">ติดตามพวกเราพรรคประชาชนได้ที่นี่</a>
               <div align='center' style="width: 100%;background: white;padding-top: 15px;margin-bottom: 10px;">
                    <div style='background: white;width:40%;margin: 0 auto'>
                        <a href=${linkPlayStore} style="background: white;margin: 0 auto">
                            <img src=${linkPicPlaySyore} style='width:150px;background: white;'>
                        </a>
                        <a href=${linkAppStore} style="background: white;margin: 0 auto">
                            <img src=${linkPicAppStore} style='width:150px;background: white;'></a>
                    </div>
               </div>
            </div>`;

            sendMail = MAILService.pushNotification(message, email, newsTitle[0]);
        } else if (
            picPostMajorF !== undefined &&
            picPostMajorS !== undefined &&
            postMajorTitleF !== undefined &&
            postMajorTitleS !== undefined &&
            postMajorNameF !== undefined &&
            postMajorNameS !== undefined &&
            picPostRoundRobinF !== undefined &&
            picPostRoundRobinS !== undefined &&
            picPostRoundRobinT !== undefined &&
            postRoundRobinF !== undefined &&
            nameRoundRobinF !== undefined &&
            postRoundRobinS !== undefined &&
            nameRoundRobinS !== undefined &&
            postRoundRobinT !== undefined &&
            nameRoundRobinT !== undefined &&
            postSection === undefined &&
            linkPostSection === undefined &&
            linkPostMajorTrendF !== undefined &&
            linkPostMajorTrendS !== undefined &&
            linkPostRoundRobinF !== undefined &&
            linkPostRoundRobinS !== undefined &&
            linkPostRoundRobinT !== undefined &&
            hashTag === undefined &&
            picPostSection === undefined &&
            splitPostSection === undefined
        ) {
            message = `
            <div style="padding: 10px;background: white;width: 850px;">
               <div style="width: 60px;height: 52px;padding: 10px;position: absolute;float: right;background: white;">
                    <img src='https://mfp-today-web.s3.ap-southeast-1.amazonaws.com/unnamed.png'
                       alt='profile' style=" width: 100%;height: 100%;object-fit: cover;background: white;">
               </div>
               <div style="display: grid;margin: 30px 40px;
               gap: 5px;">
                   <span
                       style="font-size: 26pt;padding-bottom: 10px;background: white;color: #ee7623;text-align: center;">ประชาชนหน้าหนึ่ง</span>
                   <span style="background: white;color: #ee7623;text-align: center;">ฉบับวันที่ <span style = 'background: white;color:black;'>${thaiDate}</span></span>
               </div>
               <div style="width: 100%;background: white;border-bottom: 1px solid gray;">
                   <div style="width: 100%;display: flex;background: white;">
                        <div style="width: 50%;margin-right: 5px;background: white;">
                            <a href=${linkPostMajorTrendF} style='background:white;text-decoration:none;'>
                                ${picPostMajorF}
                                <div
                                    style="display: grid;word-break: break-all;margin-top: 15px;padding: 15px;background: white;margin-bottom: 10px;">
                                    <span style="background: white;margin-bottom: 10px;color:black;">
                                        ${postMajorTitleF}
                                    </span>
                                    <span style="background: white;color: gray;font-size: 14px;margin-bottom: 10px;">โดย <span
                                            style="color: #ee7623;font-size: 14px;background: white;">${postMajorNameF}</span></span>
                                    <div style='display:flex; background-color:#FFFFFF'>
                                        <span
                                            style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                            <img src=${commentIcons} style='width:20px;height:20px;background-color: #FFFFFF;'>
                                            ${content.majorTrend.contents[0] ? content.majorTrend.contents[0].post.commentCount : 0}</span>
                                            <span
                                                style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                <img src=${shareIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                ${content.majorTrend.contents[0] ? content.majorTrend.contents[0].post.shareCount : 0}</span>
                                            <span
                                                style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                <img src=${loveIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                ${content.majorTrend.contents[0] ? content.majorTrend.contents[0].post.likeCount : 0}</span>
                                    </div>
                                </div>
                            </a>
                        </div>
                        <div style="width: 50%;margin-right: 5px;background: white;">
                            <a href=${linkPostMajorTrendS} style='background:white;text-decoration:none;'>
                                ${picPostMajorS}
                                <div
                                    style="display: grid;word-break: break-all;margin-top: 15px;padding: 15px;background: white;margin-bottom: 10px;">
                                    <span style="background: white;margin-bottom: 10px;color:black;">
                                        ${postMajorTitleS}
                                    </span>
                                    <span style="background: white;color: gray;font-size: 14px;margin-bottom: 10px;">โดย <span
                                            style="color: #ee7623;font-size: 14px;background: white;">${postMajorNameS}</span></span>
                                    <div style='display:flex; background-color:#FFFFFF'>
                                        <span
                                            style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                            <img src=${commentIcons} style='width:20px;height:20px;background-color: #FFFFFF;'>
                                            ${content.majorTrend.contents[1] ? content.majorTrend.contents[1].post.commentCount : 0}</span>
                                            <span
                                                style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                <img src=${shareIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                ${content.majorTrend.contents[1] ? content.majorTrend.contents[1].post.shareCount : 0}</span>
                                            <span
                                                style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                <img src=${loveIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                ${content.majorTrend.contents[1] ? content.majorTrend.contents[1].post.likeCount : 0}</span>
                                    </div>
                                </div>
                            </a>
                        </div>
                   </div>
               </div>
               <div style="display: flex;background: white;padding-top: 15px;padding-bottom: 15px;border-bottom: 1px solid gray;">
                    <div style="width: 33.33%;background: white;padding-right: 5px;">
                        <a href=${linkPostRoundRobinF} style='background:white;text-decoration:none;'>
                            ${picPostRoundRobinF}
                            <div style="margin-bottom: 5px;background: white;display: grid;">
                                <span style="background: white;font-size: 14px;margin-bottom: 40px;color:black;">
                                        ${postRoundRobinF}
                                </span>
                                <span style="background: white;color: gray;font-size: 14px;color:black;">โดย <span
                                        style="color: #ee7623;font-size: 14px;background: white;">${nameRoundRobinF}</span></span>
                            </div>
                        </a>
                    </div>
                   <div style="width: 33.33%;background: white;padding-right: 5px;">
                        <a href=${linkPostRoundRobinS} style='background:white;text-decoration:none;'>
                            ${picPostRoundRobinS}
                            <div style="margin-bottom: 5px;background: white;display: grid;">
                                <span style="background: white;font-size: 14px;margin-bottom: 40px;color:black;">
                                        ${postRoundRobinS}
                                </span>
                                <span style="background: white;color: gray;font-size: 14px;">โดย <span
                                        style="color: #ee7623;font-size: 14px;background: white;">${nameRoundRobinS}</span></span>
                            </div>
                        </a>
                   </div>
                   <div style="width: 33.33%;background: white;">
                        <a href=${linkPostRoundRobinT} style='background:white;text-decoration:none;'>
                            ${picPostRoundRobinT}
                            <div style="margin-bottom: 5px;background: white;display: grid;">
                                <span style="background: white;font-size: 14px;margin-bottom: 40px;color:black;">
                                        ${postRoundRobinT}
                                </span>
                                <span style="background: white;color: gray;font-size: 14px;">โดย <span
                                        style="color: #ee7623;font-size: 14px;background: white;">${nameRoundRobinT}</span></span>
                            </div>
                        </a>
                   </div>
               </div>
               <a href=${homePage} style="display:block;text-align:center;width:100%;margin-top:15px;background:white;margin-bottom:20px;border-radius:50px;padding:10px 0;border:1px solid #ee7623; background:white;color:#ee7623;text-decoration: none;">ติดตามพวกเราพรรคประชาชนได้ที่นี่</a>
               <div align='center' style="width: 100%;background: white;padding-top: 15px;margin-bottom: 10px;">
                    <div style='background: white;width:40%;margin: 0 auto'>
                        <a href=${linkPlayStore} style="background: white;margin: 0 auto">
                            <img src=${linkPicPlaySyore} style='width:150px;background: white;'>
                        </a>
                        <a href=${linkAppStore} style="background: white;margin: 0 auto">
                            <img src=${linkPicAppStore} style='width:150px;background: white;'></a>
                    </div>
               </div>
            </div>`;
            sendMail = MAILService.pushNotification(message, email, newsTitle[0]);
        } else if (
            picPostMajorF !== undefined &&
            picPostMajorS !== undefined &&
            postMajorTitleF !== undefined &&
            postMajorTitleS !== undefined &&
            postMajorNameF !== undefined &&
            postMajorNameS !== undefined &&
            picPostRoundRobinF === undefined &&
            picPostRoundRobinS === undefined &&
            picPostRoundRobinT === undefined &&
            postRoundRobinF === undefined &&
            nameRoundRobinF === undefined &&
            postRoundRobinS === undefined &&
            nameRoundRobinS === undefined &&
            postRoundRobinT === undefined &&
            nameRoundRobinT === undefined &&
            postSection === undefined &&
            linkPostSection === undefined &&
            linkPostMajorTrendF !== undefined &&
            linkPostMajorTrendS !== undefined &&
            linkPostRoundRobinF === undefined &&
            linkPostRoundRobinS === undefined &&
            linkPostRoundRobinT === undefined &&
            hashTag === undefined &&
            picPostSection === undefined &&
            splitPostSection === undefined) {
            message = `
                <div style="padding: 10px;background: white;width: 850px;">
                    <div style="width: 60px;height: 52px;padding: 10px;position: absolute;float: right;background: white;">
                            <img src='https://mfp-today-web.s3.ap-southeast-1.amazonaws.com/unnamed.png'
                            alt='profile' style=" width: 100%;height: 100%;object-fit: cover;background: white;">
                    </div>
                    <div style="display: grid;margin: 30px 40px;
                    gap: 5px;">
                        <span
                            style="font-size: 26pt;padding-bottom: 10px;background: white;color: #ee7623;text-align: center;">ประชาชนหน้าหนึ่ง</span>
                        <span style="background: white;color: #ee7623;text-align: center;">ฉบับวันที่ <span style = 'background: white;color:black;'>${thaiDate}</span></span>
                    </div>
                    <div style="width: 100%;background: white;border-bottom: 1px solid gray;">
                        <div style="width: 100%;display: flex;background: white;">
                                <div style="width: 50%;margin-right: 5px;background: white;">
                                    <a href=${linkPostMajorTrendF} style='background:white;text-decoration:none;'>
                                        ${picPostMajorF}
                                        <div
                                            style="display: grid;word-break: break-all;margin-top: 15px;padding: 15px;background: white;margin-bottom: 10px;">
                                            <span style="background: white;margin-bottom: 10px;color:black;">
                                                ${postMajorTitleF}
                                            </span>
                                            <span style="background: white;color: gray;font-size: 14px;margin-bottom: 10px;">โดย <span
                                                    style="color: #ee7623;font-size: 14px;background: white;">${postMajorNameF}</span></span>
                                            <div style='display:flex; background-color:#FFFFFF'>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${commentIcons} style='width:20px;height:20px;background-color: #FFFFFF;'>
                                                    ${content.majorTrend.contents[0] ? content.majorTrend.contents[0].post.commentCount : 0}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${shareIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${content.majorTrend.contents[0] ? content.majorTrend.contents[0].post.shareCount : 0}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${loveIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${content.majorTrend.contents[0] ? content.majorTrend.contents[0].post.likeCount : 0}</span>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                                <div style="width: 50%;margin-right: 5px;background: white;">
                                    <a href=${linkPostMajorTrendS} style='background:white;text-decoration:none;'>
                                        ${picPostMajorS}
                                        <div
                                            style="display: grid;word-break: break-all;margin-top: 15px;padding: 15px;background: white;margin-bottom: 10px;">
                                            <span style="background: white;margin-bottom: 10px;color:black;">
                                                ${postMajorTitleS}
                                            </span>
                                            <span style="background: white;color: gray;font-size: 14px;margin-bottom: 10px;">โดย <span
                                                    style="color: #ee7623;font-size: 14px;background: white;">${postMajorNameS}</span></span>
                                            <div style='display:flex; background-color:#FFFFFF'>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${commentIcons} style='width:20px;height:20px;background-color: #FFFFFF;'>
                                                    ${content.majorTrend.contents[1] ? content.majorTrend.contents[1].post.commentCount : 0}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${shareIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${content.majorTrend.contents[1] ? content.majorTrend.contents[1].post.shareCount : 0}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${loveIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${content.majorTrend.contents[1] ? content.majorTrend.contents[1].post.likeCount : 0}</span>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                        </div>
                    </div>
                    <a href=${homePage} style="display:block;text-align:center;width:100%;margin-top:15px;background:white;margin-bottom:20px;border-radius:50px;padding:10px 0;border:1px solid #ee7623; background:white;color:#ee7623;text-decoration: none;">ติดตามพวกเราพรรคประชาชนได้ที่นี่</a>
                    <div align='center' style="width: 100%;background: white;padding-top: 15px;margin-bottom: 10px;">
                            <div style='background: white;width:40%;margin: 0 auto'>
                                <a href=${linkPlayStore} style="background: white;margin: 0 auto">
                                    <img src=${linkPicPlaySyore} style='width:150px;background: white;'>
                                </a>
                                <a href=${linkAppStore} style="background: white;margin: 0 auto">
                                    <img src=${linkPicAppStore} style='width:150px;background: white;'></a>
                            </div>
                    </div>
                </div>`;
            sendMail = MAILService.pushNotification(message, email, newsTitle[0]);
        } else if (
            picPostMajorF !== undefined &&
            picPostMajorS !== undefined &&
            postMajorTitleF !== undefined &&
            postMajorTitleS !== undefined &&
            postMajorNameF !== undefined &&
            postMajorNameS !== undefined &&
            picPostRoundRobinF === undefined &&
            picPostRoundRobinS === undefined &&
            picPostRoundRobinT === undefined &&
            postRoundRobinF === undefined &&
            nameRoundRobinF === undefined &&
            postRoundRobinS === undefined &&
            nameRoundRobinS === undefined &&
            postRoundRobinT === undefined &&
            nameRoundRobinT === undefined &&
            postSection !== undefined &&
            linkPostSection !== undefined &&
            linkPostMajorTrendF !== undefined &&
            linkPostMajorTrendS !== undefined &&
            linkPostRoundRobinF === undefined &&
            linkPostRoundRobinS === undefined &&
            linkPostRoundRobinT === undefined &&
            hashTag !== undefined &&
            picPostSection !== undefined &&
            splitPostSection !== undefined
        ) {
            message = `
            <div style="padding: 10px;background: white;width: 850px;">
               <div style="width: 60px;height: 52px;padding: 10px;position: absolute;float: right;background: white;">
                    <img src='https://mfp-today-web.s3.ap-southeast-1.amazonaws.com/unnamed.png'
                       alt='profile' style=" width: 100%;height: 100%;object-fit: cover;background: white;">
               </div>
               <div style="display: grid;margin: 30px 40px;
               gap: 5px;">
                   <span
                       style="font-size: 26pt;padding-bottom: 10px;background: white;color: #ee7623;text-align: center;">ประชาชนหน้าหนึ่ง</span>
                   <span style="background: white;color: #ee7623;text-align: center;">ฉบับวันที่ <span style = 'background: white;color:black;'>${thaiDate}</span></span>
               </div>
            
            
               <div style="width: 100%;padding-bottom: 20px;background: white;">
                   <div style="padding: 15px 0;background-color: #f8f8f8;padding-bottom: 10px;">
                       <span style="color:orange;font-size: 10pt;padding-left: 20px;background-color: #f8f8f8">มาใหม่ : </span>
                       <a style="font-size: 10pt;background-color: #f8f8f8">#${hashTag}</a>
                   </div>
                    <div style="width: 100%;padding-top: 10px;display: flex;background: white; border-bottom: 1px solid gray;">
                        <a href=${linkPostSection} style='display:flex;background:white;text-decoration:none;'>
                            <div style="display: flex; text-align: center;font-size: 12pt;height: 370px;background: white;">
                                <img style="width: 100%;height: 100%;object-fit: cover;background: white;"
                                    src=${picPostSection}>
                            </div>
                            <div style="background: white;width: 70%;text-decoration:none;color:black">
                                <div style="display: grid;word-break: break-all;padding: 15px;background: white; text-decoration:none;color:black">
                                    <span style="background: white;font-size: 16pt;">
                                        ${splitPostSection}
                                    </span>
                                    <span style="background: white;">
                                        ${splitDetailPostSection}
                                    </span>
                                    <span style="background: white;color: gray;font-size: 14px;">#${postSection.post.objectiveTag}</span>
                                    <span style="background: white;color: gray;font-size: 14px;">โดย <span style="color: #ee7623;font-size: 14px;background: white;">${postSection.owner.name}</span></span>
                                            <div style='display:flex; background-color:#FFFFFF'>
                                            <span
                                                style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                <img src=${commentIcons} style='width:20px;height:20px;background-color: #FFFFFF;'>
                                                ${postSection.post.commentCount}</span>
                                            <span
                                                style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                <img src=${shareIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                ${postSection.post.shareCount}</span>
                                            <span
                                                style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                <img src=${loveIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                ${postSection.post.likeCount}</span>
                                        </div>
                                </div>
                            </div>
                        </a>
                    </div>
               </div>
               <div style="width: 100%;background: white;border-bottom: 1px solid gray;">
                    <div style="width: 100%;display: flex;background: white;">
                            <div style="width: 50%;margin-right: 5px;background: white;">
                                <a href=${linkPostMajorTrendF} style='background:white;text-decoration:none;'>
                                    ${picPostMajorF}
                                    <div
                                        style="display: grid;word-break: break-all;margin-top: 15px;padding: 15px;background: white;margin-bottom: 10px;">
                                        <span style="background: white;margin-bottom: 10px;color:black;">
                                            ${postMajorTitleF}
                                        </span>
                                        <span style="background: white;color: gray;font-size: 14px;margin-bottom: 10px;">โดย <span
                                                style="color: #ee7623;font-size: 14px;background: white;">${postMajorNameF}</span></span>
                                        <div style='display:flex; background-color:#FFFFFF'>
                                            <span
                                                style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                <img src=${commentIcons} style='width:20px;height:20px;background-color: #FFFFFF;'>
                                                ${content.majorTrend.contents[0] ? content.majorTrend.contents[0].post.commentCount : 0}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${shareIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${content.majorTrend.contents[0] ? content.majorTrend.contents[0].post.shareCount : 0}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${loveIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${content.majorTrend.contents[0] ? content.majorTrend.contents[0].post.likeCount : 0}</span>
                                        </div>
                                    </div>
                                </a>
                            </div>
                            <div style="width: 50%;margin-right: 5px;background: white;">
                                <a href=${linkPostMajorTrendS} style='background:white;text-decoration:none;'>
                                    ${picPostMajorS}
                                    <div
                                        style="display: grid;word-break: break-all;margin-top: 15px;padding: 15px;background: white;margin-bottom: 10px;">
                                        <span style="background: white;margin-bottom: 10px;color:black;">
                                            ${postMajorTitleS}
                                        </span>
                                        <span style="background: white;color: gray;font-size: 14px;margin-bottom: 10px;">โดย <span
                                                style="color: #ee7623;font-size: 14px;background: white;">${postMajorNameS}</span></span>
                                        <div style='display:flex; background-color:#FFFFFF'>
                                            <span
                                                style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                <img src=${commentIcons} style='width:20px;height:20px;background-color: #FFFFFF;'>
                                                ${content.majorTrend.contents[1] ? content.majorTrend.contents[1].post.commentCount : 0}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${shareIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${content.majorTrend.contents[1] ? content.majorTrend.contents[1].post.shareCount : 0}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${loveIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${content.majorTrend.contents[1] ? content.majorTrend.contents[1].post.likeCount : 0}</span>
                                        </div>
                                    </div>
                                </a>
                            </div>
                    </div>
                </div>
                <a href=${homePage} style="display:block;text-align:center;width:100%;margin-top:15px;background:white;margin-bottom:20px;border-radius:50px;padding:10px 0;border:1px solid #ee7623; background:white;color:#ee7623;text-decoration: none;">ติดตามพวกเราพรรคประชาชนได้ที่นี่</a>
                <div align='center' style="width: 100%;background: white;padding-top: 15px;margin-bottom: 10px;">
                    <div style='background: white;width:40%;margin: 0 auto'>
                        <a href=${linkPlayStore} style="background: white;margin: 0 auto">
                            <img src=${linkPicPlaySyore} style='width:150px;background: white;'>
                        </a>
                        <a href=${linkAppStore} style="background: white;margin: 0 auto">
                            <img src=${linkPicAppStore} style='width:150px;background: white;'></a>
                    </div>
               </div>
            </div>`;
            sendMail = MAILService.pushNotification(message, email, newsTitle[0]);
        } else if (picPostMajorF !== undefined &&
            picPostMajorS !== undefined &&
            postMajorTitleF !== undefined &&
            postMajorTitleS !== undefined &&
            postMajorNameF !== undefined &&
            postMajorNameS !== undefined &&
            picPostRoundRobinF !== undefined &&
            picPostRoundRobinS !== undefined &&
            picPostRoundRobinT === undefined &&
            postRoundRobinF !== undefined &&
            nameRoundRobinF !== undefined &&
            postRoundRobinS !== undefined &&
            nameRoundRobinS !== undefined &&
            postRoundRobinT === undefined &&
            nameRoundRobinT === undefined &&
            postSection !== undefined &&
            linkPostSection !== undefined &&
            linkPostMajorTrendF !== undefined &&
            linkPostMajorTrendS !== undefined &&
            linkPostRoundRobinF !== undefined &&
            linkPostRoundRobinS !== undefined &&
            linkPostRoundRobinT === undefined &&
            hashTag !== undefined &&
            picPostSection !== undefined &&
            splitPostSection !== undefined) {
            message = `
                <div style="padding: 10px;background: white;width: 850px;">
                   <div style="width: 60px;height: 52px;padding: 10px;position: absolute;float: right;background: white;">
                        <img src='https://mfp-today-web.s3.ap-southeast-1.amazonaws.com/unnamed.png'
                           alt='profile' style=" width: 100%;height: 100%;object-fit: cover;background: white;">
                   </div>
                   <div style="display: grid;margin: 30px 40px;
                   gap: 5px;">
                       <span
                           style="font-size: 26pt;padding-bottom: 10px;background: white;color: #ee7623;text-align: center;">ประชาชนหน้าหนึ่ง</span>
                       <span style="background: white;color: #ee7623;text-align: center;">ฉบับวันที่ <span style = 'background: white;color:black;'>${thaiDate}</span></span>
                   </div>
                
                
                   <div style="width: 100%;padding-bottom: 20px;background: white;">
                       <div style="padding: 15px 0;background-color: #f8f8f8;padding-bottom: 10px;">
                           <span style="color:orange;font-size: 10pt;padding-left: 20px;background-color: #f8f8f8">มาใหม่ : </span>
                           <a style="font-size: 10pt;background-color: #f8f8f8">#${hashTag}</a>
                       </div>
                        <div style="width: 100%;padding-top: 10px;display: flex;background: white; border-bottom: 1px solid gray;">
                            <a href=${linkPostSection} style='display:flex;background:white;text-decoration:none;'>
                                <div style="display: flex; text-align: center;font-size: 12pt;height: 370px;background: white;">
                                    <img style="width: 100%;height: 100%;object-fit: cover;background: white;"
                                        src=${picPostSection}>
                                </div>
                                <div style="background: white;width: 70%;text-decoration:none;color:black">
                                    <div style="display: grid;word-break: break-all;padding: 15px;background: white; text-decoration:none;color:black">
                                        <span style="background: white;font-size: 16pt;">
                                            ${splitPostSection}
                                        </span>
                                        <span style="background: white;">
                                            ${splitDetailPostSection}
                                        </span>
                                        <span style="background: white;color: gray;font-size: 14px;">#${postSection.post.objectiveTag}</span>
                                        <span style="background: white;color: gray;font-size: 14px;">โดย <span style="color: #ee7623;font-size: 14px;background: white;">${postSection.owner.name}</span></span>
                                                <div style='display:flex; background-color:#FFFFFF'>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${commentIcons} style='width:20px;height:20px;background-color: #FFFFFF;'>
                                                    ${postSection.post.commentCount}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${shareIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${postSection.post.shareCount}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${loveIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${postSection.post.likeCount}</span>
                                            </div>
                                    </div>
                                </div>
                            </a>
                        </div>
                   </div>
                
                
                   <div style="width: 100%;background: white;border-bottom: 1px solid gray;">
                       <div style="width: 100%;display: flex;background: white;">
                            <div style="width: 50%;margin-right: 5px;background: white;">
                                <a href=${linkPostMajorTrendF} style='background:white;text-decoration:none;'>
                                    ${picPostMajorF}
                                    <div
                                        style="display: grid;word-break: break-all;margin-top: 15px;padding: 15px;background: white;margin-bottom: 10px;">
                                        <span style="background: white;margin-bottom: 10px;color:black;">
                                            ${postMajorTitleF}
                                        </span>
                                        <span style="background: white;color: gray;font-size: 14px;margin-bottom: 10px;">โดย <span
                                                style="color: #ee7623;font-size: 14px;background: white;">${postMajorNameF}</span></span>
                                        <div style='display:flex; background-color:#FFFFFF'>
                                            <span
                                                style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                <img src=${commentIcons} style='width:20px;height:20px;background-color: #FFFFFF;'>
                                                ${content.majorTrend.contents[0] ? content.majorTrend.contents[0].post.commentCount : 0}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${shareIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${content.majorTrend.contents[0] ? content.majorTrend.contents[0].post.shareCount : 0}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                <img src=${loveIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${content.majorTrend.contents[0] ? content.majorTrend.contents[0].post.likeCount : 0}</span>
                                        </div>
                                    </div>
                                </a>
                            </div>
                            <div style="width: 50%;margin-right: 5px;background: white;">
                                <a href=${linkPostMajorTrendS} style='background:white;text-decoration:none;'>
                                    ${picPostMajorS}
                                    <div
                                        style="display: grid;word-break: break-all;margin-top: 15px;padding: 15px;background: white;margin-bottom: 10px;">
                                        <span style="background: white;margin-bottom: 10px;color:black;">
                                            ${postMajorTitleS}
                                        </span>
                                        <span style="background: white;color: gray;font-size: 14px;margin-bottom: 10px;">โดย <span
                                                style="color: #ee7623;font-size: 14px;background: white;">${postMajorNameS}</span></span>
                                        <div style='display:flex; background-color:#FFFFFF'>
                                            <span
                                                style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                <img src=${commentIcons} style='width:20px;height:20px;background-color: #FFFFFF;'>
                                                ${content.majorTrend.contents[1] ? content.majorTrend.contents[1].post.commentCount : 0}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${shareIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${content.majorTrend.contents[1] ? content.majorTrend.contents[1].post.shareCount : 0}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${loveIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${content.majorTrend.contents[1] ? content.majorTrend.contents[1].post.likeCount : 0}</span>
                                        </div>
                                    </div>
                                </a>
                            </div>
                       </div>
                   </div>
                   <div style="display: flex;background: white;padding-top: 15px;padding-bottom: 15px;border-bottom: 1px solid gray;">
                        <div style="width: 50%;background: white;padding-right: 5px;">
                            <a href=${linkPostRoundRobinF} style='background:white;text-decoration:none;'>
                                ${picPostRoundRobinF}
                                <div style="margin-bottom: 5px;background: white;display: grid;">
                                    <span style="background: white;font-size: 14px;margin-bottom: 40px;color:black;">
                                            ${postRoundRobinF}
                                    </span>
                                    <span style="background: white;color: gray;font-size: 14px;color:black;">โดย <span
                                            style="color: #ee7623;font-size: 14px;background: white;">${nameRoundRobinF}</span></span>
                                </div>
                            </a>
                        </div>
                        <div style="width: 50%;background: white;padding-right: 5px;">
                        <a href=${linkPostRoundRobinS} style='background:white;text-decoration:none;'>
                            ${picPostRoundRobinS}
                            <div style="margin-bottom: 5px;background: white;display: grid;">
                                <span style="background: white;font-size: 14px;margin-bottom: 40px;color:black;">
                                        ${postRoundRobinS}
                                </span>
                                <span style="background: white;color: gray;font-size: 14px;">โดย <span
                                        style="color: #ee7623;font-size: 14px;background: white;">${nameRoundRobinS}</span></span>
                            </div>
                        </a>
                        </div>
                   </div>
                   <a href=${homePage} style="display:block;text-align:center;width:100%;margin-top:15px;background:white;margin-bottom:20px;border-radius:50px;padding:10px 0;border:1px solid #ee7623; background:white;color:#ee7623;text-decoration: none;">ติดตามพวกเราพรรคประชาชนได้ที่นี่</a>
                   <div align='center' style="width: 100%;background: white;padding-top: 15px;margin-bottom: 10px;">
                        <div style='background: white;width:40%;margin: 0 auto'>
                            <a href=${linkPlayStore} style="background: white;margin: 0 auto">
                                <img src=${linkPicPlaySyore} style='width:150px;background: white;'>
                            </a>
                            <a href=${linkAppStore} style="background: white;margin: 0 auto">
                                <img src=${linkPicAppStore} style='width:150px;background: white;'></a>
                        </div>
                   </div>
                </div>`;

            sendMail = MAILService.pushNotification(message, email, newsTitle[0]);
        } else if (picPostMajorF !== undefined &&
            picPostMajorS !== undefined &&
            postMajorTitleF !== undefined &&
            postMajorTitleS !== undefined &&
            postMajorNameF !== undefined &&
            postMajorNameS !== undefined &&
            picPostRoundRobinF !== undefined &&
            picPostRoundRobinS === undefined &&
            picPostRoundRobinT === undefined &&
            postRoundRobinF !== undefined &&
            nameRoundRobinF !== undefined &&
            postRoundRobinS === undefined &&
            nameRoundRobinS === undefined &&
            postRoundRobinT === undefined &&
            nameRoundRobinT === undefined &&
            postSection !== undefined &&
            linkPostSection !== undefined &&
            linkPostMajorTrendF !== undefined &&
            linkPostMajorTrendS !== undefined &&
            linkPostRoundRobinF !== undefined &&
            linkPostRoundRobinS === undefined &&
            linkPostRoundRobinT === undefined &&
            hashTag !== undefined &&
            picPostSection !== undefined &&
            splitPostSection !== undefined
        ) {
            message = `
                <div style="padding: 10px;background: white;width: 850px;">
                   <div style="width: 60px;height: 52px;padding: 10px;position: absolute;float: right;background: white;">
                        <img src='https://mfp-today-web.s3.ap-southeast-1.amazonaws.com/unnamed.png'
                           alt='profile' style=" width: 100%;height: 100%;object-fit: cover;background: white;">
                   </div>
                   <div style="display: grid;margin: 30px 40px;
                   gap: 5px;">
                       <span
                           style="font-size: 26pt;padding-bottom: 10px;background: white;color: #ee7623;text-align: center;">ประชาชนหน้าหนึ่ง</span>
                       <span style="background: white;color: #ee7623;text-align: center;">ฉบับวันที่ <span style = 'background: white;color:black;'>${thaiDate}</span></span>
                   </div>
                
                
                   <div style="width: 100%;padding-bottom: 20px;background: white;">
                       <div style="padding: 15px 0;background-color: #f8f8f8;padding-bottom: 10px;">
                           <span style="color:orange;font-size: 10pt;padding-left: 20px;background-color: #f8f8f8">มาใหม่ : </span>
                           <a style="font-size: 10pt;background-color: #f8f8f8">#${hashTag}</a>
                       </div>
                        <div style="width: 100%;padding-top: 10px;display: flex;background: white; border-bottom: 1px solid gray;">
                            <a href=${linkPostSection} style='display:flex;background:white;text-decoration:none;'>
                                <div style="display: flex; text-align: center;font-size: 12pt;height: 370px;background: white;">
                                    <img style="width: 100%;height: 100%;object-fit: cover;background: white;"
                                        src=${picPostSection}>
                                </div>
                                <div style="background: white;width: 70%;text-decoration:none;color:black">
                                    <div style="display: grid;word-break: break-all;padding: 15px;background: white; text-decoration:none;color:black">
                                        <span style="background: white;font-size: 16pt;">
                                            ${splitPostSection}
                                        </span>
                                        <span style="background: white;">
                                            ${splitDetailPostSection}
                                        </span>
                                        <span style="background: white;color: gray;font-size: 14px;">#${postSection.post.objectiveTag}</span>
                                        <span style="background: white;color: gray;font-size: 14px;">โดย <span style="color: #ee7623;font-size: 14px;background: white;">${postSection.owner.name}</span></span>
                                                <div style='display:flex; background-color:#FFFFFF'>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${commentIcons} style='width:20px;height:20px;background-color: #FFFFFF;'>
                                                    ${postSection.post.commentCount}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${shareIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${postSection.post.shareCount}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${loveIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${postSection.post.likeCount}</span>
                                            </div>
                                    </div>
                                </div>
                            </a>
                        </div>
                   </div>
                
                
                   <div style="width: 100%;background: white;border-bottom: 1px solid gray;">
                       <div style="width: 100%;display: flex;background: white;">
                            <div style="width: 50%;margin-right: 5px;background: white;">
                                <a href=${linkPostMajorTrendF} style='background:white;text-decoration:none;'>
                                    ${picPostMajorF}
                                    <div
                                        style="display: grid;word-break: break-all;margin-top: 15px;padding: 15px;background: white;margin-bottom: 10px;">
                                        <span style="background: white;margin-bottom: 10px;color:black;">
                                            ${postMajorTitleF}
                                        </span>
                                        <span style="background: white;color: gray;font-size: 14px;margin-bottom: 10px;">โดย <span
                                                style="color: #ee7623;font-size: 14px;background: white;">${postMajorNameF}</span></span>
                                        <div style='display:flex; background-color:#FFFFFF'>
                                            <span
                                                style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                <img src=${commentIcons} style='width:20px;height:20px;background-color: #FFFFFF;'>
                                                ${content.majorTrend.contents[0] ? content.majorTrend.contents[0].post.commentCount : 0}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${shareIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${content.majorTrend.contents[0] ? content.majorTrend.contents[0].post.shareCount : 0}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${loveIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${content.majorTrend.contents[0] ? content.majorTrend.contents[0].post.likeCount : 0}</span>
                                        </div>
                                    </div>
                                </a>
                            </div>
                            <div style="width: 50%;margin-right: 5px;background: white;">
                                <a href=${linkPostMajorTrendS} style='background:white;text-decoration:none;'>
                                    ${picPostMajorS}
                                    <div
                                        style="display: grid;word-break: break-all;margin-top: 15px;padding: 15px;background: white;margin-bottom: 10px;">
                                        <span style="background: white;margin-bottom: 10px;color:black;">
                                            ${postMajorTitleS}
                                        </span>
                                        <span style="background: white;color: gray;font-size: 14px;margin-bottom: 10px;">โดย <span
                                                style="color: #ee7623;font-size: 14px;background: white;">${postMajorNameS}</span></span>
                                        <div style='display:flex; background-color:#FFFFFF'>
                                            <span
                                                style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                <img src=${commentIcons} style='width:20px;height:20px;background-color: #FFFFFF;'>
                                                ${content.majorTrend.contents[1] ? content.majorTrend.contents[1].post.commentCount : 0}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${shareIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${content.majorTrend.contents[1] ? content.majorTrend.contents[1].post.shareCount : 0}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${loveIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${content.majorTrend.contents[1] ? content.majorTrend.contents[1].post.likeCount : 0}</span>
                                        </div>
                                    </div>
                                </a>
                            </div>
                       </div>
                   </div>
                   <div style="display: flex;background: white;padding-top: 15px;padding-bottom: 15px;border-bottom: 1px solid gray;">
                        <div style="width: 100%;background: white;padding-right: 5px;">
                            <a href=${linkPostRoundRobinF} style='background:white;text-decoration:none;'>
                                ${picPostRoundRobinF}
                                <div style="margin-bottom: 5px;background: white;display: grid;">
                                    <span style="background: white;font-size: 14px;margin-bottom: 40px;color:black;">
                                            ${postRoundRobinF}
                                    </span>
                                    <span style="background: white;color: gray;font-size: 14px;color:black;">โดย <span
                                            style="color: #ee7623;font-size: 14px;background: white;">${nameRoundRobinF}</span></span>
                                </div>
                            </a>
                        </div>
                   </div>
                   <a href=${homePage} style="display:block;text-align:center;width:100%;margin-top:15px;background:white;margin-bottom:20px;border-radius:50px;padding:10px 0;border:1px solid #ee7623; background:white;color:#ee7623;text-decoration: none;">ติดตามพวกเราพรรคประชาชนได้ที่นี่</a>
                   <div align='center' style="width: 100%;background: white;padding-top: 15px;margin-bottom: 10px;">
                        <div style='background: white;width:40%;margin: 0 auto'>
                            <a href=${linkPlayStore} style="background: white;margin: 0 auto">
                                <img src=${linkPicPlaySyore} style='width:150px;background: white;'>
                            </a>
                            <a href=${linkAppStore} style="background: white;margin: 0 auto">
                                <img src=${linkPicAppStore} style='width:150px;background: white;'></a>
                        </div>
                   </div>
                </div>`;

            sendMail = MAILService.pushNotification(message, email, newsTitle[0]);

        } else if (picPostMajorF !== undefined &&
            picPostMajorS !== undefined &&
            postMajorTitleF !== undefined &&
            postMajorTitleS !== undefined &&
            postMajorNameF !== undefined &&
            postMajorNameS !== undefined &&
            picPostRoundRobinF !== undefined &&
            picPostRoundRobinS === undefined &&
            picPostRoundRobinT === undefined &&
            postRoundRobinF !== undefined &&
            nameRoundRobinF !== undefined &&
            postRoundRobinS === undefined &&
            nameRoundRobinS === undefined &&
            postRoundRobinT === undefined &&
            nameRoundRobinT === undefined &&
            postSection === undefined &&
            linkPostSection === undefined &&
            linkPostMajorTrendF !== undefined &&
            linkPostMajorTrendS !== undefined &&
            linkPostRoundRobinF !== undefined &&
            linkPostRoundRobinS === undefined &&
            linkPostRoundRobinT === undefined &&
            hashTag === undefined &&
            picPostSection === undefined &&
            splitPostSection === undefined
        ) {
            message = `
                <div style="padding: 10px;background: white;width: 850px;">
                   <div style="width: 60px;height: 52px;padding: 10px;position: absolute;float: right;background: white;">
                        <img src='https://mfp-today-web.s3.ap-southeast-1.amazonaws.com/unnamed.png'
                           alt='profile' style=" width: 100%;height: 100%;object-fit: cover;background: white;">
                   </div>
                   <div style="display: grid;margin: 30px 40px;
                   gap: 5px;">
                       <span
                           style="font-size: 26pt;padding-bottom: 10px;background: white;color: #ee7623;text-align: center;">ประชาชนหน้าหนึ่ง</span>
                       <span style="background: white;color: #ee7623;text-align: center;">ฉบับวันที่ <span style = 'background: white;color:black;'>${thaiDate}</span></span>
                   </div>    
                   <div style="width: 100%;background: white;border-bottom: 1px solid gray;">
                       <div style="width: 100%;display: flex;background: white;">
                            <div style="width: 50%;margin-right: 5px;background: white;">
                                <a href=${linkPostMajorTrendF} style='background:white;text-decoration:none;'>
                                    ${picPostMajorF}
                                    <div
                                        style="display: grid;word-break: break-all;margin-top: 15px;padding: 15px;background: white;margin-bottom: 10px;">
                                        <span style="background: white;margin-bottom: 10px;color:black;">
                                            ${postMajorTitleF}
                                        </span>
                                        <span style="background: white;color: gray;font-size: 14px;margin-bottom: 10px;">โดย <span
                                                style="color: #ee7623;font-size: 14px;background: white;">${postMajorNameF}</span></span>
                                        <div style='display:flex; background-color:#FFFFFF'>
                                            <span
                                                style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                <img src=${commentIcons} style='width:20px;height:20px;background-color: #FFFFFF;'>
                                                ${content.majorTrend.contents[0] ? content.majorTrend.contents[0].post.commentCount : 0}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${shareIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${content.majorTrend.contents[0] ? content.majorTrend.contents[0].post.shareCount : 0}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${loveIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${content.majorTrend.contents[0] ? content.majorTrend.contents[0].post.likeCount : 0}</span>
                                        </div>
                                    </div>
                                </a>
                            </div>
                            <div style="width: 50%;margin-right: 5px;background: white;">
                                <a href=${linkPostMajorTrendS} style='background:white;text-decoration:none;'>
                                    ${picPostMajorS}
                                    <div
                                        style="display: grid;word-break: break-all;margin-top: 15px;padding: 15px;background: white;margin-bottom: 10px;">
                                        <span style="background: white;margin-bottom: 10px;color:black;">
                                            ${postMajorTitleS}
                                        </span>
                                        <span style="background: white;color: gray;font-size: 14px;margin-bottom: 10px;">โดย <span
                                                style="color: #ee7623;font-size: 14px;background: white;">${postMajorNameS}</span></span>
                                        <div style='display:flex; background-color:#FFFFFF'>
                                            <span
                                                style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                <img src=${commentIcons} style='width:20px;height:20px;background-color: #FFFFFF;'>
                                                ${content.majorTrend.contents[1] ? content.majorTrend.contents[1].post.commentCount : 0}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${shareIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${content.majorTrend.contents[1] ? content.majorTrend.contents[1].post.shareCount : 0}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${loveIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${content.majorTrend.contents[1] ? content.majorTrend.contents[1].post.likeCount : 0}</span>
                                        </div>
                                    </div>
                                </a>
                            </div>
                       </div>
                   </div>
                   <div style="display: flex;background: white;padding-top: 15px;padding-bottom: 15px;border-bottom: 1px solid gray;">
                        <div style="width: 100%;background: white;padding-right: 5px;">
                            <a href=${linkPostRoundRobinF} style='background:white;text-decoration:none;'>
                                ${picPostRoundRobinF}
                                <div style="margin-bottom: 5px;background: white;display: grid;">
                                    <span style="background: white;font-size: 14px;margin-bottom: 40px;color:black;">
                                            ${postRoundRobinF}
                                    </span>
                                    <span style="background: white;color: gray;font-size: 14px;color:black;">โดย <span
                                            style="color: #ee7623;font-size: 14px;background: white;">${nameRoundRobinF}</span></span>
                                </div>
                            </a>
                        </div>
                   </div>
                   <a href=${homePage} style="display:block;text-align:center;width:100%;margin-top:15px;background:white;margin-bottom:20px;border-radius:50px;padding:10px 0;border:1px solid #ee7623; background:white;color:#ee7623;text-decoration: none;">ติดตามพวกเราพรรคประชาชนได้ที่นี่</a>
                   <div align='center' style="width: 100%;background: white;padding-top: 15px;margin-bottom: 10px;">
                        <div style='background: white;width:40%;margin: 0 auto'>
                            <a href=${linkPlayStore} style="background: white;margin: 0 auto">
                                <img src=${linkPicPlaySyore} style='width:150px;background: white;'>
                            </a>
                            <a href=${linkAppStore} style="background: white;margin: 0 auto">
                                <img src=${linkPicAppStore} style='width:150px;background: white;'></a>
                        </div>
                   </div>
                </div>`;

            sendMail = MAILService.pushNotification(message, email, newsTitle[0]);

        } else if (picPostMajorF !== undefined &&
            picPostMajorS !== undefined &&
            postMajorTitleF !== undefined &&
            postMajorTitleS !== undefined &&
            postMajorNameF !== undefined &&
            postMajorNameS !== undefined &&
            picPostRoundRobinF !== undefined &&
            picPostRoundRobinS !== undefined &&
            picPostRoundRobinT === undefined &&
            postRoundRobinF !== undefined &&
            nameRoundRobinF !== undefined &&
            postRoundRobinS !== undefined &&
            nameRoundRobinS !== undefined &&
            postRoundRobinT === undefined &&
            nameRoundRobinT === undefined &&
            postSection === undefined &&
            linkPostSection === undefined &&
            linkPostMajorTrendF !== undefined &&
            linkPostMajorTrendS !== undefined &&
            linkPostRoundRobinF !== undefined &&
            linkPostRoundRobinS !== undefined &&
            linkPostRoundRobinT === undefined &&
            hashTag === undefined &&
            picPostSection === undefined &&
            splitPostSection === undefined) {
            message = `
                <div style="padding: 10px;background: white;width: 850px;">
                   <div style="width: 60px;height: 52px;padding: 10px;position: absolute;float: right;background: white;">
                        <img src='https://mfp-today-web.s3.ap-southeast-1.amazonaws.com/unnamed.png'
                           alt='profile' style=" width: 100%;height: 100%;object-fit: cover;background: white;">
                   </div>
                   <div style="display: grid;margin: 30px 40px;
                   gap: 5px;">
                       <span
                           style="font-size: 26pt;padding-bottom: 10px;background: white;color: #ee7623;text-align: center;">ประชาชนหน้าหนึ่ง</span>
                       <span style="background: white;color: #ee7623;text-align: center;">ฉบับวันที่ <span style = 'background: white;color:black;'>${thaiDate}</span></span>
                   </div>    
                   <div style="width: 100%;background: white;border-bottom: 1px solid gray;">
                       <div style="width: 100%;display: flex;background: white;">
                            <div style="width: 50%;margin-right: 5px;background: white;">
                                <a href=${linkPostMajorTrendF} style='background:white;text-decoration:none;'>
                                    ${picPostMajorF}
                                    <div
                                        style="display: grid;word-break: break-all;margin-top: 15px;padding: 15px;background: white;margin-bottom: 10px;">
                                        <span style="background: white;margin-bottom: 10px;color:black;">
                                            ${postMajorTitleF}
                                        </span>
                                        <span style="background: white;color: gray;font-size: 14px;margin-bottom: 10px;">โดย <span
                                                style="color: #ee7623;font-size: 14px;background: white;">${postMajorNameF}</span></span>
                                        <div style='display:flex; background-color:#FFFFFF'>
                                            <span
                                                style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                <img src=${commentIcons} style='width:20px;height:20px;background-color: #FFFFFF;'>
                                                ${content.majorTrend.contents[0] ? content.majorTrend.contents[0].post.commentCount : 0}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${shareIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${content.majorTrend.contents[0] ? content.majorTrend.contents[0].post.shareCount : 0}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${loveIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${content.majorTrend.contents[0] ? content.majorTrend.contents[0].post.likeCount : 0}</span>
                                        </div>
                                    </div>
                                </a>
                            </div>
                            <div style="width: 50%;margin-right: 5px;background: white;">
                                <a href=${linkPostMajorTrendS} style='background:white;text-decoration:none;'>
                                    ${picPostMajorS}
                                    <div
                                        style="display: grid;word-break: break-all;margin-top: 15px;padding: 15px;background: white;margin-bottom: 10px;">
                                        <span style="background: white;margin-bottom: 10px;color:black;">
                                            ${postMajorTitleS}
                                        </span>
                                        <span style="background: white;color: gray;font-size: 14px;margin-bottom: 10px;">โดย <span
                                                style="color: #ee7623;font-size: 14px;background: white;">${postMajorNameS}</span></span>
                                        <div style='display:flex; background-color:#FFFFFF'>
                                            <span
                                                style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                <img src=${commentIcons} style='width:20px;height:20px;background-color: #FFFFFF;'>
                                                ${content.majorTrend.contents[1] ? content.majorTrend.contents[1].post.commentCount : 0}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${shareIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${content.majorTrend.contents[1] ? content.majorTrend.contents[1].post.shareCount : 0}</span>
                                                <span
                                                    style='text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#657786; vertical-align:middle; padding-bottom:8px;background:#FFFFFF;margin-right:20px'>
                                                    <img src=${loveIcons} style='width:20px;height:20px;background-color:#FFFFFF'>
                                                    ${content.majorTrend.contents[1] ? content.majorTrend.contents[1].post.likeCount : 0}</span>
                                        </div>
                                    </div>
                                </a>
                            </div>
                       </div>
                   </div>
                   <div style="display: flex;background: white;padding-top: 15px;padding-bottom: 15px;border-bottom: 1px solid gray;">
                        <div style="width: 50%;background: white;padding-right: 5px;">
                            <a href=${linkPostRoundRobinF} style='background:white;text-decoration:none;'>
                                ${picPostRoundRobinF}
                                <div style="margin-bottom: 5px;background: white;display: grid;">
                                    <span style="background: white;font-size: 14px;margin-bottom: 40px;color:black;">
                                            ${postRoundRobinF}
                                    </span>
                                    <span style="background: white;color: gray;font-size: 14px;color:black;">โดย <span
                                            style="color: #ee7623;font-size: 14px;background: white;">${nameRoundRobinF}</span></span>
                                </div>
                            </a>
                        </div>
                        <div style="width: 50%;background: white;padding-right: 5px;">
                        <a href=${linkPostRoundRobinS} style='background:white;text-decoration:none;'>
                            ${picPostRoundRobinS}
                            <div style="margin-bottom: 5px;background: white;display: grid;">
                                <span style="background: white;font-size: 14px;margin-bottom: 40px;color:black;">
                                        ${postRoundRobinS}
                                </span>
                                <span style="background: white;color: gray;font-size: 14px;">โดย <span
                                        style="color: #ee7623;font-size: 14px;background: white;">${nameRoundRobinS}</span></span>
                            </div>
                        </a>
                        </div>
                   </div>
                   <a href=${homePage} style="display:block;text-align:center;width:100%;margin-top:15px;background:white;margin-bottom:20px;border-radius:50px;padding:10px 0;border:1px solid #ee7623; background:white;color:#ee7623;text-decoration: none;">ติดตามพวกเราพรรคประชาชนได้ที่นี่</a>
                   <div align='center' style="width: 100%;background: white;padding-top: 15px;margin-bottom: 10px;">
                        <div style='background: white;width:40%;margin: 0 auto'>
                            <a href=${linkPlayStore} style="background: white;margin: 0 auto">
                                <img src=${linkPicPlaySyore} style='width:150px;background: white;'>
                            </a>
                            <a href=${linkAppStore} style="background: white;margin: 0 auto">
                                <img src=${linkPicAppStore} style='width:150px;background: white;'></a>
                        </div>
                   </div>
                </div>`;

            sendMail = MAILService.pushNotification(message, email, newsTitle[0]);
        } else {
            return ResponseUtil.getErrorResponse('error in sending email', '');
        }
        if (sendMail) {
            return ResponseUtil.getSuccessResponse('Your Activation Code has been sent to your email inbox.', '');
        } else {
            return ResponseUtil.getErrorResponse('error in sending email', '');
        }
    }

    private parseUserField(user: any): any {
        const userResult: any = {};

        if (user !== undefined) {
            userResult.id = user._id;
            userResult.displayName = user.displayName;
            userResult.imageURL = user.imageURL;
            // userResult.email = user.email;
            userResult.isAdmin = user.isAdmin;
            userResult.uniqueId = user.uniqueId;
        }

        return userResult;
    }
    // for today

    private async parseKaokaiTodayRangeDays(data: any): Promise<any> {
        const result: any = [];
        let imageFilter = undefined;
        // const thaiDate = data.endDateTime.getTime();
        const oneDay = 24 * 60 * 60 * 1000; // one day in milliseconds
        const timeStamp = new Date(data.endDateTime.getTime() - oneDay).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        // data: data.data,
        imageFilter = await this.parseKaokaiTodayPictureRange(data);
        const payload = {
            title: 'ประชาชนทูเดย์',
            image: imageFilter,
            timeStamp: data.endDateTime,
            date: 'ฉบับวันที่ ' + '' + timeStamp,
        };
        result.push(payload);
        return result;
    }

    // for customer range days

    private async parseKaokaiTodayPictureRange(data: any): Promise<any> {
        let image = undefined;
        if (data.data.pageRoundRobin.contents.length > 0) {
            image = data.data.pageRoundRobin.contents[0].coverPageSignUrl ? data.data.pageRoundRobin.contents[0].coverPageSignUrl : 'https://mfp-today-web.s3.ap-southeast-1.amazonaws.com/unnamed.png';
        }
        if (image === undefined) {
            image = data.data.majorTrend.contents[0].coverPageSignUrl ? data.data.majorTrend.contents[0].coverPageSignUrl : 'https://mfp-today-web.s3.ap-southeast-1.amazonaws.com/unnamed.png';
        }
        return image;
    }

    // presigned s3
    private async presignedS3(name: string, data: any, objId: string): Promise<any> {
        let s3SignUrlPath = undefined;
        const snapShotObjIds = new ObjectID(objId);
        if (String(name) === 'emergencyEvents' && data.emergencyEvents !== undefined) {
            for (let i = 0; i < data.emergencyEvents.contents.length; i++) {
                s3SignUrlPath = data.emergencyEvents.contents[i] ? data.emergencyEvents.contents[i].coverPageSignUrl : undefined;
                // for each contents
                if (s3SignUrlPath !== undefined && s3SignUrlPath !== null) {
                    const match = s3SignUrlPath.match(/([^/]+\/[^?]+)/);
                    const extractedPart = match[1];
                    const result = extractedPart.replace(/^https:\/\/[^/]+\//, '');
                    // signCloudFront 
                    const getSingedUrl = await this.s3Service.s3signCloudFront(result);
                    const query = { _id: snapShotObjIds };
                    const newValues = {
                        $set: {
                            [`data.emergencyEvents.contents.${i}.coverPageSignUrl`]: getSingedUrl
                        }
                    };
                    await this.kaokaiTodaySnapShotService.update(query, newValues);
                }
            }
        }
        if (String(name) === 'postSectionModel' && data.postSectionModel !== undefined) {
            for (let i = 0; i < data.postSectionModel.contents.length; i++) {
                s3SignUrlPath = data.postSectionModel.contents[i] ? data.postSectionModel.contents[i].coverPageSignUrl : undefined;
                if (s3SignUrlPath !== undefined && s3SignUrlPath !== null) {
                    const match = s3SignUrlPath.match(/([^/]+\/[^?]+)/);
                    const extractedPart = match[1];
                    const result = extractedPart.replace(/^https:\/\/[^/]+\//, '');
                    const getSingedUrl = await this.s3Service.s3signCloudFront(result);
                    const query = { _id: snapShotObjIds };
                    const newValues = {
                        $set: {
                            [`data.postSectionModel.contents.${i}.coverPageSignUrl`]: getSingedUrl
                        }
                    };
                    await this.kaokaiTodaySnapShotService.update(query, newValues);
                }
            }

        }
        if (String(name) === 'pageRoundRobin' && data.pageRoundRobin !== undefined) {
            for (let i = 0; i < data.pageRoundRobin.contents.length; i++) {
                s3SignUrlPath = data.pageRoundRobin.contents[i] ? data.pageRoundRobin.contents[i].coverPageSignUrl : undefined;
                if (s3SignUrlPath !== undefined && s3SignUrlPath !== null) {
                    const match = s3SignUrlPath.match(/([^/]+\/[^?]+)/);
                    const extractedPart = match[1];
                    const result = extractedPart.replace(/^https:\/\/[^/]+\//, '');
                    const getSingedUrl = await this.s3Service.s3signCloudFront(result);
                    const query = { _id: snapShotObjIds };
                    const newValues = {
                        $set: {
                            [`data.pageRoundRobin.contents.${i}.coverPageSignUrl`]: getSingedUrl
                        }
                    };
                    await this.kaokaiTodaySnapShotService.update(query, newValues);
                }
            }
        }
        if (String(name) === 'majorTrend' && data.majorTrend !== undefined) {
            for (let i = 0; i < data.majorTrend.contents.length; i++) {
                s3SignUrlPath = data.majorTrend.contents[i] ? data.majorTrend.contents[i].coverPageSignUrl : undefined;
                if (s3SignUrlPath !== undefined && s3SignUrlPath !== null) {
                    const match = s3SignUrlPath.match(/([^/]+\/[^?]+)/);
                    const extractedPart = match[1];
                    const result = extractedPart.replace(/^https:\/\/[^/]+\//, '');
                    const getSingedUrl = await this.s3Service.s3signCloudFront(result);
                    const query = { _id: snapShotObjIds };
                    const newValues = {
                        $set: {
                            [`data.majorTrend.contents.${i}.coverPageSignUrl`]: getSingedUrl
                        }
                    };
                    await this.kaokaiTodaySnapShotService.update(query, newValues);
                }
            }
        }
        if (String(name) === 'kaokaiProvince' && data.kaokaiProvince !== undefined) {
            for (let i = 0; i < data.kaokaiProvince.contents.length; i++) {
                s3SignUrlPath = data.kaokaiProvince.contents[i] ? data.kaokaiProvince.contents[i].coverPageSignUrl : undefined;
                if (s3SignUrlPath !== undefined && s3SignUrlPath !== null) {
                    const match = s3SignUrlPath.match(/([^/]+\/[^?]+)/);
                    const extractedPart = match[1];
                    const result = extractedPart.replace(/^https:\/\/[^/]+\//, '');
                    const getSingedUrl = await this.s3Service.s3signCloudFront(result);
                    const query = { _id: snapShotObjIds };
                    const newValues = {
                        $set: {
                            [`data.kaokaiProvince.contents.${i}.coverPageSignUrl`]: getSingedUrl
                        }
                    };
                    await this.kaokaiTodaySnapShotService.update(query, newValues);
                }
            }
        }
        if (String(name) === 'kaokaiHashTag' && data.kaokaiHashTag !== undefined) {
            for (let i = 0; i < data.kaokaiHashTag.contents.length; i++) {
                s3SignUrlPath = data.kaokaiHashTag.contents[i] ? data.kaokaiHashTag.contents[i].coverPageSignUrl : undefined;
                if (s3SignUrlPath !== undefined && s3SignUrlPath !== null) {
                    const match = s3SignUrlPath.match(/([^/]+\/[^?]+)/);
                    const extractedPart = match[1];
                    const result = extractedPart.replace(/^https:\/\/[^/]+\//, '');
                    const getSingedUrl = await this.s3Service.s3signCloudFront(result);
                    const query = { _id: snapShotObjIds };
                    const newValues = {
                        $set: {
                            [`data.kaokaiHashTag.contents.${i}.coverPageSignUrl`]: getSingedUrl
                        }
                    };
                    await this.kaokaiTodaySnapShotService.update(query, newValues);
                }
            }
        }
        if (String(name) === 'kaokaiContent' && data.kaokaiContent !== undefined) {
            for (let i = 0; i < data.kaokaiContent.contents.length; i++) {
                s3SignUrlPath = data.kaokaiContent.contents[i] ? data.kaokaiContent.contents[i].coverPageSignUrl : undefined;
                if (s3SignUrlPath !== undefined && s3SignUrlPath !== null) {
                    const match = s3SignUrlPath.match(/([^/]+\/[^?]+)/);
                    const extractedPart = match[1];
                    const result = extractedPart.replace(/^https:\/\/[^/]+\//, '');
                    const getSingedUrl = await this.s3Service.s3signCloudFront(result);
                    const query = { _id: snapShotObjIds };
                    const newValues = {
                        $set: {
                            [`data.kaokaiContent.contents.${i}.coverPageSignUrl`]: getSingedUrl
                        }
                    };
                    await this.kaokaiTodaySnapShotService.update(query, newValues);
                }
            }
        }
    }
    
    private async manualNotiFunction(): Promise<any>{
        const fireBaseToken = [];
        const deviceToken = await this.deviceTokenService.aggregate(
            [
                {
                    $match: {
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
        if (deviceToken.length > 0) {
            for (let j = 0; j < deviceToken.length; j++) {
                if (deviceToken[0].User.subscribeNoti === true && deviceToken[0].User !== undefined && deviceToken[j].token !== undefined && deviceToken[j].token !== null && deviceToken[j].token !== '') {
                    fireBaseToken.push(deviceToken[j].token);
                } else {
                    continue;
                }
            }
        }
        if (fireBaseToken.length > 0) {
            const token = fireBaseToken.filter((element, index) => {
                return fireBaseToken.indexOf(element) === index;
            });
            const originalArray = Array.from({ length: token.length }, (_, i) => i + 1); // Create the original array [1, 2, 3, ..., 50000]
            const slicedArrays = [];
            const batchSize = 499;
            for (let i = 0; i < originalArray.length; i += batchSize) {
                const slicedArray = token.slice(i, i + batchSize);
                slicedArrays.push(slicedArray);
            }
            if (slicedArrays.length > 0) {
                for (let j = 0; j < slicedArrays.length; j++) {
                    await this.notificationService.manualMultiPushNotificationMessage(slicedArrays[j]);
                }
            }

        }
    }

    private async testManualNotiFunction(): Promise<any>{
        await this.notificationService.testManualMultiPushNotificationMessage();
    }
}