/*
 * @license Spanboon Platform v0.1
 * (c) 2020-2021 KaoGeek. http://kaogeek.dev
 * License: MIT. https://opensource.org/licenses/MIT
 * Author:  shiorin <junsuda.s@absolute.co.th>, chalucks <chaluck.s@absolute.co.th>
 */

export const PLATFORM_NAME_TH = 'ประชาชนทูเดย์';
export const PLATFORM_NAME_ENG = 'MFP Today';

export const ASSET_CONFIG_NAME = {
    EXPIRE_MINUTE: 'asset.expiration.minute',
    S3_STORAGE_UPLOAD: 'asset.s3.storage.upload',
    S3_SIGN_EXPIRING_SEC: 'asset.s3.sign.expires.sec'
};

export const DEFAULT_ASSET_CONFIG_VALUE = {
    EXPIRE_MINUTE: 60,
    S3_STORAGE_UPLOAD: false,
    S3_SIGN_EXPIRING_SEC: 3600 // 1 hour
};

export const SEARCH_ENGAGEMENT_ACCESSIBLE_DATE = 'search.engagement.accessible.date';
export const DEFAULT_SEARCH_ENGAGEMENT_ACCESSIBLE_DATE = 90;

export const USER_EXPIRED_TIME_CONFIG = 'user.expiration.time';
export const DEFAULT_USER_EXPIRED_TIME = 30; // as day
export const JOB_BEFORE_TOKEN_EXPIRE_MINUTE = 'job.beforeTokenExpire.minute';
export const DEFAULT_JOB_BEFORE_TOKEN_EXPIRE_MINUTE = 2880; // 2 days
export const MAIN_PAGE_SEARCH_OFFICIAL_POST_ONLY = 'page.main.searchOfficialPostOnly';
// DEFAULT_MAIN_PAGE_SEARCH_OFFICIAL_POST_ONLY
export const DEFAULT_MAIN_PAGE_SEARCH_OFFICIAL_POST_ONLY = false;

export const SEARCH_CONFIG_NAME = {
    LIMIT_CONFIG: 'search.limit'
};
export const SEARCH_CONFIG_VALUES = 'search.config.values';

export const DEFAULT_SEARCH_CONFIG_VALUE = {
    LIMIT: 200,
    OFFSET: 0
};
export const LIMIT_USER_REPORT_CONTENT_CONFIG_NAME = 'limit.user.report.content';
export const DEFAULT_LIMIT_USER_REPORT_CONTENT_CONFIG_VALUE = 1;
export const POST_WEIGHT_SCORE = {
    X: 'score.weight.today',
    Lot: 'score.like.today',
    Cot: 'score.commnet.today',
    Sot: 'score.share.today',
    Y: 'score.weight.facebook',
    Lof: 'score.like.facebook',
    Cof: 'score.comment.facebook',
    Sof: 'score.share.facebook'
};
export const DEFAULT_POST_WEIGHT_SCORE = {
    X: 2,
    Lot: 1,
    Cot: 2,
    Sot: 3,
    Y: 4,
    Lof: 1,
    Cof: 2,
    Sof: 3
};
export const TODAY_DATETIME_GAP = 'today.datetime.gap';
export const DEFAULT_TODAY_DATETIME_GAP = 30;

export const KAOKAITODAY_TIMER_CHECK_DATE = 'kaokaiToday.snapshot.timer.check.date';
export const DEFAULT_KAOKAITODAY_TIMER_CHECK_DAY = '07:00';

export const KAOKAITODAY_RANGE_DATE_EMERGENCY ='kaokaiToday.time.emergencyEvent.date';
export const DEFAULT_KAOKAITODAY_RANGE_DATE_EMERGENY =365;

export const SWITCH_CASE_SEND_EMAIL = 'kaokaiToday.case.send.email.available';
export const DEFAULT_SWITCH_CASE_SEND_EMAIL = true;

export const SWITCH_CASE_SEND_NOTI = 'kaokaiToday.case.send.noti.available';
export const DEFAULT_SWITCH_CASE_SEND_NOTI = true;

export const SEND_EMAIL_TO_USER = 'send.email.to.user';

export const KAOKAITODAY_ANNOUNCEMENT = 'kaokaiToday.announcement';
export const DEFAULT_KAOKAITODAY_ANNOUNCEMENT = 'สวัสดีประชาชนทูเดย์';

export const KAOKAITODAY_LINK_ANNOUNCEMENT='kaokaiToday.link.announcement';
export const DEFAULT_KAOKAITODAY_LINK_ANNOUNCEMENT= 'home';

export const KAOKAITODAY_RANGE_OF_POPULAR_HASHTAGS='kaokaiToday.range.of.popular.hashtags';
export const DEFAULT_KAOKAITODAY_RANGE_OF_POPULAR_HASHTAGS=5;

export const DEFAULT_SEND_NOTIFICATION_NEWS = 5000;
export const SEND_NOTIFICATION_NEWS = 'send.notification.news';

export const DEFAULT_REVERSE_SEARCH = 7;
export const REVERSE_SEARCH = 'reverse.search';

export const DEFAULT_FILTER_NEWS = true;
export const FILTER_NEWS = 'filter.news';

export const DEFAULT_ADMIN_EMAIL = 'example@hotmail.com';
export const ADMIN_EMAIL = 'admin.email';

export const VOTE_DASHBOARD ='vote.dashboard';

export const DEFAULT_EMERGENCYEVENT_MODE = 'normal';
export const EMERGENCYEVENT_MODE = 'emergencyEvent.mode';

export const DEFAULT_OBJECTIVE_AUTO_TAGS_VALUE = 5;
export const OBJECTIVE_AUTO_TAGS_VALUE = 'objective.auto.tags.value';

export const DEFAULT_OBJECTIVE_TRIGGER_AUTO_TAGS = false;
export const OBJECTIVE_TRIGGER_AUTO_TAGS = 'objective.trigger.auto.tags.value';

export const DEFAULT_MIN_SUPPORT = 500;
export const MIN_SUPPORT = 'min.support';

export const DEFAULT_CLOSET_VOTE = 5;
export const CLOSET_VOTE = 'closet.vote';

export const DEFAULT_CLOSET_SUPPORT = 5;
export const CLOSET_SUPPORT = 'closet.support';

export const DEFAULT_MFP_HASHTAG = 'ประชาชน';
export const MFPHASHTAG = 'mfp.hashtag';

export const DEFAULT_TRIGGER_VOTE = true;
export const TRIGGER_VOTE = 'trigger.vote';

export const ELIGIBLE_VOTES = 'eligible.voters';

export const DEFAULT_SUPPORT_DAYS_RANGE = 30;
export const SUPPORT_DAYS_RANGE = 'support.days.range';

export const DEFAULT_VOTE_DAYS_RANGE = 30;
export const VOTE_DAYS_RANGE ='vote.days.range';

export const DEFAULT_TRIGGER_SWITCH_CREATE_VOTES = false;
export const TRIGGER_SWITCH_CREATE_VOTES = 'trigger.switch.create.votes';

export const DEFAULT_MAX_VOTE_CHOICES = 10;
export const MAX_VOTE_CHOICES = 'max.vote.choices';

export const DEFAULT_MAX_VOTE_QUESTIONS = 10;
export const MAX_VOTE_QUESTIONS = 'max.vote.questions';

export const PRIVILEGES = 'privileges';

export const DEFAULT_BIRTHDAY_NOTIFICATION_SYSTEM = 7;
export const BIRTHDAY_NOTIFICATION_SYSTEM = 'birthday.notification.system';

export const DEFAULT_PUSH_NOTI_EXPIRATION_MEMBERSHIP = 7;
export const PUSH_NOTI_EXPIRATION_MEMBERSHIP ='push.noti.expiration.membership';

export const DEFAULT_FIRST_LOGIN_POINT = 2;
export const FIRST_LOGIN_POINT = 'first.login.point';

export const DEFAULT_VOTE_POINT = 2;
export const VOTE_POINT= 'vote.point';

export const DEFAULT_BIRTHDAY_POINT = 50;
export const BIRTHDAY_POINT = 'birthday.event';

export const DEFAULT_BINDING_MEMBERSHIP_POINT = 100;
export const BINDING_MEMBERSHIP_POINT = 'binding.membership';

export const DEFAULT_COMMENT_POINT = 2;
export const COMMENT_POINT = 'comment.score';

// PAGE_POST_POINT

export const DEFAULT_PAGE_POST_POINT = 2;
export const PAGE_POST_POINT = 'page.post.point';

// TODAY_NEWS_POINT

export const DEFAULT_TODAY_NEWS_POINT = 2;
export const TODAY_NEWS_POINT = 'today.news.point';

// PAGE_LIKE_POINT

export const DEFAULT_PAGE_LIKE_POINT = 2;
export const PAGE_LIKE_POINT = 'page.like.point';

export const DEFAULT_LINE_NEWS_WEEK_OA = 14;
export const LINE_NEWS_WEEK_OA = 'line.news.week.oa';

export const NOTI_VOTER = 'noti.voter';

export const DEFAULT_SPECIFIC_NOTI_VOTER = false;
export const SPECIFIC_NOTI_VOTER = 'specific.noti.voter';

// line_flex_message
export const DEFAULT_SWITCHING_LINE_FLEX_MESSAGE = false;
export const SWITCHING_LINE_FLEX_MESSAGE = 'switching.line.flex.message';

export const DEFAULT_SWITCHING_WORKER_THREAD_NOTIFICATION = false;
export const SWITCHING_WORKER_THREAD_NOTIFICATION = 'switching.worker.thread.notification';