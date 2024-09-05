import {
  JsonController,
  Res,
  Post,
  Req,
  Authorized,
} from 'routing-controllers';
import { PostsGalleryService } from '../../services/PostsGalleryService';
import { AssetService } from '../../services/AssetService';
import { ResponseUtil } from '../../../utils/ResponseUtil';
import { ObjectID } from 'mongodb';
import { S3Service } from '../../services/S3Service';
import { PostsService } from '../../services/PostsService';
import { AdminUserActionLogsService } from '../../services/AdminUserActionLogsService';
import { AnalyticsService } from '../../services/AnalyticsService';
import { AuthenticationIdService } from '../../services/AuthenticationIdService';
import { ChatMessageService } from '../../services/ChatMessageService';
import { ChatRoomService } from '../../services/ChatRoomService';
import { FacebookWebhookLogsService } from '../../services/FacebookWebhookLogsService';
import { FulfillmentAllocateStatementService } from '../../services/FulfillmentAllocateStatementService';
import { FulfillmentCaseService } from '../../services/FulfillmentCaseService';
import { FulfillmentRequestService } from '../../services/FulfillmentRequestService';
import { IsReadPostService } from '../../services/IsReadPostService';
import { KaokaiTodayService } from '../../services/KaokaiTodayService';
import { KaokaiTodaySnapShotService } from '../../services/KaokaiTodaySnapShot';
import { LineNewMovePartyService } from '../../services/LineNewMovePartyService';
import { LineNewsWeekService } from '../../services/LineNewsWeekService';
import { ManipulateService } from '../../services/ManipulateService';
import { PplebindingService } from '../../services/PplebindingService';
import { NeedsService } from '../../services/NeedsService';
import { NewsClickService } from '../../services/NewsClickService';
import { NotificationService } from '../../services/NotificationService';
import { NotificationNewsService } from '../../services/NotificationNewsService';
import { OtpService } from '../../services/OtpService';
import { PostsCommentService } from '../../services/PostsCommentService';
// import { ProductCategoryService } from '../../services/ProductCategoryService';
import { SearchHistoryService } from '../../services/SearchHistoryService';
import { SocialPostService } from '../../services/SocialPostService';
// import { SocialPostLogsService } from '../../services/SocialPostLogsService';
import { StandardItemService } from '../../services/StandardItemService';
import { StandardItemCategoryService } from '../../services/StandardItemCategoryService';
import { UserLikeService } from '../../services/UserLikeService';
import { UserReportContentService } from '../../services/UserReportContentService';
import { UserSupportService } from '../../services/UserSupportService';
import { ProductService } from '../../services/ProductService';

@JsonController('/admin/delete')
export class AdminDeleteAnyThingController {
  constructor(
    private postsGalleryService: PostsGalleryService,
    private assetService: AssetService,
    private s3Service: S3Service,
    private postsService: PostsService,
    private adminUserActionLogsService: AdminUserActionLogsService,
    private analyticsService: AnalyticsService,
    private authenticationIdService: AuthenticationIdService,
    private chatMessageService: ChatMessageService,
    private chatRoomService: ChatRoomService,
    private facebookWebhookLogsService: FacebookWebhookLogsService,
    private fulfillmentAllocateStatementService: FulfillmentAllocateStatementService,
    private fulfillmentCaseService: FulfillmentCaseService,
    private fulfillmentRequestService: FulfillmentRequestService,
    private isReadPostService: IsReadPostService,
    private kaokaiTodayService: KaokaiTodayService,
    private kaokaiTodaySnapShotService: KaokaiTodaySnapShotService,
    private lineNewMovePartyService: LineNewMovePartyService,
    private lineNewsWeekService: LineNewsWeekService,
    private manipulateService: ManipulateService,
    private pplebindingService: PplebindingService,
    private needsService: NeedsService,
    private newsClickService: NewsClickService,
    private notificationService: NotificationService,
    private notificationNewsService: NotificationNewsService,
    private otpService: OtpService,
    private postsCommentService: PostsCommentService,
    private searchHistoryService: SearchHistoryService,
    private socialPostService: SocialPostService,
    // private socialPostLogsService:SocialPostLogsService,
    private standardItemService: StandardItemService,
    private standardItemCategoryService: StandardItemCategoryService,
    private userLikeService: UserLikeService,
    private userReportContentService: UserReportContentService,
    private userSupportService: UserSupportService,
    private productService: ProductService
  ) // private productCategoryService:ProductCategoryService
  {}

  @Post('')
  @Authorized()
  public async deletePostAsset(@Res() res: any, @Req() req: any): Promise<any> {
    const galleyImages: any = await this.postsGalleryService.find({});
    const productImages: any = await this.productService.find({});
    if (galleyImages.length > 0) {
      const ids: any = [];
      for (const item of galleyImages) {
        for (const productAsset of productImages) {
          if (new ObjectID(productAsset.asset) !== new ObjectID(item.fileId)) {
            ids.push(new ObjectID(item.fileId));
            const s3Path = item.s3FilePath;
            const deleteS3: any = await this.s3Service.deleteFile(s3Path);
            if (deleteS3) {
              continue;
            } else {
              continue;
            }
          } else {
            continue;
          }
        }
      }

      await this.assetService.deleteMany({ _id: { $in: ids } });
    }

    await this.adminUserActionLogsService.deleteMany({});
    await this.analyticsService.deleteMany({});
    await this.authenticationIdService.deleteMany({ providerName: 'MFP' });
    await this.chatMessageService.deleteMany({});
    await this.chatRoomService.deleteMany({});
    await this.facebookWebhookLogsService.deleteMany({});
    await this.fulfillmentAllocateStatementService.deleteMany({});
    await this.fulfillmentCaseService.deleteMany({});
    await this.fulfillmentRequestService.deleteMany({});
    await this.isReadPostService.deleteMany({});
    await this.kaokaiTodayService.deleteMany({});
    await this.kaokaiTodaySnapShotService.deleteMany({});
    await this.lineNewMovePartyService.deleteMany({});
    await this.lineNewsWeekService.deleteMany({});
    await this.manipulateService.deleteMany({});
    await this.pplebindingService.deleteMany({});
    await this.needsService.deleteMany({});
    await this.newsClickService.deleteMany({});
    await this.notificationService.deleteMany({});
    await this.notificationNewsService.deleteMany({});
    await this.otpService.deleteMany({});
    await this.postsService.deleteMany({});
    await this.postsCommentService.deleteMany({});
    await this.postsGalleryService.deleteMany({});
    await this.searchHistoryService.deleteMany({});
    await this.socialPostService.deleteMany({});
    // await this.socialPostLogsService.deleteMany({});
    await this.standardItemService.deleteMany({});
    await this.standardItemCategoryService.deleteMany({});
    await this.userLikeService.deleteMany({});
    await this.userReportContentService.deleteMany({});
    await this.userSupportService.deleteMany({});

    const successResponse = ResponseUtil.getSuccessResponse(
      'Delete post asset is success.',
      null
    );
    return res.status(200).send(successResponse);
  }
}
