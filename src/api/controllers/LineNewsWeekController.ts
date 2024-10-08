import { JsonController, Res, Post, Req } from 'routing-controllers';
// import { UserService } from '../services/UserService';
import { ResponseUtil } from '../../utils/ResponseUtil';
import { ObjectID } from 'mongodb';
import { LineNewsWeek } from '../models/LineNewsWeek';
import { LineNewsWeekService } from '../services/LineNewsWeekService';
import {
    DEFAULT_LINE_NEWS_WEEK_OA,
    LINE_NEWS_WEEK_OA,
    DEFAULT_SWITCHING_LINE_FLEX_MESSAGE,
    SWITCHING_LINE_FLEX_MESSAGE
} from '../../constants/SystemConfig';
import { LineNewMovePartyService } from '../services/LineNewMovePartyService';
import { ConfigService } from '../services/ConfigService';
import { KaokaiTodaySnapShotService } from '../services/KaokaiTodaySnapShot';
import { LineNewMoveParty } from '../models/LineNewMoveParty';
import axios from 'axios';
import { Worker} from 'worker_threads';
import { WorkerThread } from '../models/WokerThreadModel';
import { WorkerThreadService } from '../services/WokerThreadService';
import { NotiTypeAction } from '../../constants/WorkerThread';
import { checkify  } from '../../utils/ChuckWorkerThreadUtil';
// startVoteDatetime
@JsonController('/line')
export class PointMfpController {
    constructor(
        private lineNewsWeekService: LineNewsWeekService,
        private configService: ConfigService,
        private lineNewMovePartyService: LineNewMovePartyService,
        private kaokaiTodaySnapShotService: KaokaiTodaySnapShotService,
        private workerThreadService: WorkerThreadService
    ) { }

    @Post('/oa')
    public async lineNewsWeekOA(
        @Res() res: any,
        @Req() req: any): Promise<any> {
        const today = new Date();
        const pageLike = await this.configService.getConfig(LINE_NEWS_WEEK_OA);
        let pageLikePoint = DEFAULT_LINE_NEWS_WEEK_OA;
        if (pageLike) {
            pageLikePoint = parseInt(pageLike.value, 10);
        }
        const lineOa = await this.lineNewsWeekService.aggregate(
            [
                {
                    $match: {
                        active: false
                    }
                },
                {
                    $limit: 1
                }
            ]
        );

        // SWITCHING_LINE_FLEX_MESSAGE
        let switchingLFM = DEFAULT_SWITCHING_LINE_FLEX_MESSAGE;
        const configSwitchingLFM = await this.configService.getConfig(SWITCHING_LINE_FLEX_MESSAGE);
        if (configSwitchingLFM) {
            switchingLFM = configSwitchingLFM.value;
        }

        if(String(switchingLFM) === 'false') {
            const errorResponse = ResponseUtil.getErrorResponse('Config switching line flex message is false.', undefined);
            return res.status(400).send(errorResponse);
        }

        const twoWeeksAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000 * pageLikePoint);
        // TODO ::
        if (lineOa.length === 0) {
            const lineNewsWeek: LineNewsWeek = new LineNewsWeek();
            lineNewsWeek.todayDate = today;
            lineNewsWeek.newsWeek = new Date(today.getTime() + 24 * 60 * 60 * 1000 * pageLikePoint);
            lineNewsWeek.active = false;
            const created = await this.lineNewsWeekService.create(lineNewsWeek);
            if (created) {
                const successResponse = ResponseUtil.getSuccessResponse('Create Line News Week is success.', created);
                return res.status(200).send(successResponse);
            } else {
                const errorResponse = ResponseUtil.getErrorResponse('Cannot create Lune News Week.', undefined);
                return res.status(400).send(errorResponse);
            }
        } else {
            if (lineOa.length > 0) {
                for (const content of lineOa) {
                    if (content.active === false && today.getTime() >= content.newsWeek.getTime()) {
                        const lineOaStack = await this.lineNewMovePartyService.aggregate([]);
                        const lineMessage = await this.lineOaNoti(lineOaStack, today, twoWeeksAgo, content);
                        if (lineMessage === 'Line Flex message is success.') {
                            // Line Flex message is success.
                            const successResponse = ResponseUtil.getSuccessResponse('Line Flex message is success.', undefined);
                            return res.status(200).send(successResponse);
                        }
                        if (lineMessage === 'Not found the contents.') {
                            const errorResponse = ResponseUtil.getErrorResponse('Not found the contents.', undefined);
                            return res.status(400).send(errorResponse);
                        }

                        if (lineMessage === 'Line Flex message undefined.') {
                            const errorResponse = ResponseUtil.getErrorResponse('Line Flex message undefined.', undefined);
                            return res.status(400).send(errorResponse);
                        }

                        if (lineMessage === 'Line Flex message is empty array.') {
                            const errorResponse = ResponseUtil.getErrorResponse('Line Flex message is empty array.', undefined);
                            return res.status(400).send(errorResponse);
                        }
                    } else {
                        const successResponse = ResponseUtil.getSuccessResponse(`Today: ${today}, EndRange: ${content.newsWeek}`, undefined);
                        return res.status(200).send(successResponse);
                    }
                }
            } else {
                const errorResponse = ResponseUtil.getErrorResponse('Line Content is empty.', undefined);
                return res.status(400).send(errorResponse);
            }
        }
    }

    private async lineOaNoti(data: any, today: any, rangeEnd: any, lineOa: any): Promise<any> {
        const objStackIds: any = [];
        const postIds:any = [];
        for (const line of data) {
            line.objIds.map((ids:any) => objStackIds.push(new ObjectID(ids)));
        }

        const kaokaiSnapshot = await this.kaokaiTodaySnapShotService.aggregate(
            [
                {
                    $match: {
                        _id: { $nin: objStackIds },
                        endDateTime: { $gte: rangeEnd, $lte: today }
                    }
                },
                {
                    $sort: {
                        count: -1,
                        sumCount: -1
                    }
                },
                {
                    $limit: 50
                }
            ]
        );
        const content: any = {
            'messages': [
                {
                    'type': 'flex',
                    'altText': 'ข่าวประชาชน ที่น่าสนใจในช่วง 2 สัปดาห์ที่ผ่านมา',
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

        if (kaokaiSnapshot.length > 0) {
            const stackIds: any = [];
            for (const [key, kaokai] of Object.entries(kaokaiSnapshot)) {
                stackIds.push(new ObjectID(kaokai._id));
                let kaokaiToday = undefined;
                let dateTime = undefined;
                let endDate = undefined;
                if (parseInt(key, 10) === 0 && kaokaiSnapshot.length > 0) {
                    let dd: any = kaokaiSnapshot[key].endDateTime.getDate() - 1;
                    let mm = kaokaiSnapshot[key].endDateTime.getMonth() + 1;
                    if (dd < 10) { dd = '0' + dd; }
                    if (mm < 10) { mm = '0' + mm; }
                    kaokaiToday = process.env.APP_HOME + `?date=${kaokaiSnapshot[key].endDateTime.getFullYear()}-${mm}-${dd}&noti=true`;
                    endDate = new Date(kaokaiSnapshot[key].endDateTime);
                    endDate.setDate(endDate.getDate() - 1);
                    dateTime = endDate.toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    });
                    const postId:any =  kaokai.data.pageRoundRobin.contents[0] !== undefined ? kaokai.data.pageRoundRobin.contents[0].post._id : kaokai.data.majorTrend.contents[0].post._id;
                    postIds.push(new ObjectID(postId));
                    content['messages'][0].contents.body.contents.push(
                        {
                            'type': 'image',
                            'url': kaokai.data.pageRoundRobin.contents[0] !== undefined ? kaokai.data.pageRoundRobin.contents[0].coverPageSignUrl : kaokai.data.majorTrend.contents[0].coverPageSignUrl,
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
                                            'text': kaokai.data.pageRoundRobin.contents[0] !== undefined ? kaokai.data.pageRoundRobin.contents[0].post.title : kaokai.data.majorTrend.contents[0].post.title,
                                            'maxLines': 3,
                                            'wrap': true
                                        },
                                        {
                                            'type': 'text',
                                            'text': `ฉบับวันที่ ${dateTime}`,
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
                                                        'uri': kaokaiToday + '&openExternalBrowser=1'
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
                                {
                                    'type': 'box',
                                    'layout': 'vertical',
                                    'contents': [],
                                    'height': '250px',
                                    'paddingAll': '10px',
                                    'spacing': '10px',
                                    'backgroundColor': '#F0F0F0',
                                    'width': '100%'
                                }
                            ],
                            'width': '100%',
                            'height': '100%'
                        }
                    );
                }

                if (
                    parseInt(key, 10) === 1 &&
                    kaokaiSnapshot.length > 0 &&
                    content['messages'][0].contents.body.contents.length > 0
                ) {
                    let dd: any = kaokaiSnapshot[key].endDateTime.getDate() - 1;
                    let mm = kaokaiSnapshot[key].endDateTime.getMonth() + 1;
                    if (dd < 10) { dd = '0' + dd; }
                    if (mm < 10) { mm = '0' + mm; }
                    kaokaiToday = process.env.APP_HOME + `?date=${kaokaiSnapshot[key].endDateTime.getFullYear()}-${mm}-${dd}&noti=true`;
                    endDate = new Date(kaokaiSnapshot[key].endDateTime);
                    endDate.setDate(endDate.getDate() - 1);
                    dateTime = endDate.toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    });
                    const postId:any =  kaokai.data.pageRoundRobin.contents[0] !== undefined ? kaokai.data.pageRoundRobin.contents[0].post._id : kaokai.data.majorTrend.contents[0].post._id;
                    postIds.push(new ObjectID(postId));
                    content['messages'][0].contents.body.contents[1].contents[1].contents.push(
                        {
                            'type': 'box',
                            'layout': 'horizontal',
                            'contents': [
                                {
                                    'type': 'box',
                                    'layout': 'horizontal',
                                    'contents': [
                                        {
                                            'type': 'image',
                                            'url': kaokai.data.pageRoundRobin.contents[0] !== undefined ? kaokai.data.pageRoundRobin.contents[0].coverPageSignUrl : kaokai.data.majorTrend.contents[0].coverPageSignUrl,
                                            'size': '80px',
                                            'align': 'start',
                                            'aspectMode': 'cover'
                                        }
                                    ],
                                    'paddingAll': '5px',
                                    'cornerRadius': '8px',
                                    'width': '30%'
                                },
                                {
                                    'type': 'box',
                                    'layout': 'vertical',
                                    'contents': [
                                        {
                                            'type': 'text',
                                            'text': kaokai.data.pageRoundRobin.contents[0] !== undefined ? kaokai.data.pageRoundRobin.contents[0].post.title : kaokai.data.majorTrend.contents[0].post.title,
                                            'wrap': true,
                                            'size': '14px',
                                            'align': 'start',
                                            'gravity': 'center',
                                            'maxLines': 2,
                                            'margin': '5px',
                                            'lineSpacing': '2px'
                                        },
                                        {
                                            'type': 'text',
                                            'text': `ฉบับวันที่ ${dateTime}`,
                                            'gravity': 'bottom',
                                            'align': 'end',
                                            'size': '12px',
                                            'margin': '5px',
                                            'offsetEnd': '5px',
                                            'adjustMode': 'shrink-to-fit'
                                        },
                                    ]
                                }
                            ],
                            'backgroundColor': '#FFFFFF',
                            'width': '100%',
                            'height': '70px',
                            'cornerRadius': '8px',
                            'action': {
                                'type': 'uri',
                                'label': 'action',
                                'uri': kaokaiToday + '&openExternalBrowser=1',
                            }
                        },
                    );
                }
                if (
                    parseInt(key, 10) === 2 &&
                    kaokaiSnapshot.length > 0 &&
                    content['messages'][0].contents.body.contents.length > 0
                ) {
                    let dd: any = kaokaiSnapshot[key].endDateTime.getDate() - 1;
                    let mm = kaokaiSnapshot[key].endDateTime.getMonth() + 1;
                    if (dd < 10) { dd = '0' + dd; }
                    if (mm < 10) { mm = '0' + mm; }
                    kaokaiToday = process.env.APP_HOME + `?date=${kaokaiSnapshot[key].endDateTime.getFullYear()}-${mm}-${dd}&noti=true`;
                    endDate = new Date(kaokaiSnapshot[key].endDateTime);
                    endDate.setDate(endDate.getDate() - 1);
                    dateTime = endDate.toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    });

                    const postId:any = kaokai.data.pageRoundRobin.contents[0] !== undefined ? kaokai.data.pageRoundRobin.contents[0].post._id : kaokai.data.majorTrend.contents[0].post._id;
                    postIds.push(new ObjectID(postId));
                    content['messages'][0].contents.body.contents[1].contents[1].contents.push(
                        {
                            'type': 'box',
                            'layout': 'horizontal',
                            'contents': [
                                {
                                    'type': 'box',
                                    'layout': 'horizontal',
                                    'contents': [
                                        {
                                            'type': 'image',
                                            'url': kaokai.data.pageRoundRobin.contents[0] !== undefined ? kaokai.data.pageRoundRobin.contents[0].coverPageSignUrl : kaokai.data.majorTrend.contents[0].coverPageSignUrl,
                                            'size': '80px',
                                            'align': 'start',
                                            'aspectMode': 'cover'
                                        }
                                    ],
                                    'paddingAll': '5px',
                                    'cornerRadius': '8px',
                                    'width': '30%'
                                },
                                {
                                    'type': 'box',
                                    'layout': 'vertical',
                                    'contents': [
                                        {
                                            'type': 'text',
                                            'text': kaokai.data.pageRoundRobin.contents[0] !== undefined ? kaokai.data.pageRoundRobin.contents[0].post.title : kaokai.data.majorTrend.contents[0].post.title,
                                            'wrap': true,
                                            'size': '14px',
                                            'align': 'start',
                                            'gravity': 'center',
                                            'maxLines': 2,
                                            'margin': '5px',
                                            'lineSpacing': '2px'
                                        },
                                        {
                                            'type': 'text',
                                            'text': `ฉบับวันที่ ${dateTime}`,
                                            'gravity': 'bottom',
                                            'align': 'end',
                                            'size': '12px',
                                            'margin': '5px',
                                            'offsetEnd': '5px',
                                            'adjustMode': 'shrink-to-fit',
                                            'decoration': 'none'
                                        },
                                    ]
                                }
                            ],
                            'backgroundColor': '#FFFFFF',
                            'width': '100%',
                            'height': '70px',
                            'cornerRadius': '8px',
                            'action': {
                                'type': 'uri',
                                'label': 'action',
                                'uri': kaokaiToday + '&openExternalBrowser=1',
                            }
                        },
                    );
                }
                if (
                    parseInt(key, 10) === 3 &&
                    kaokaiSnapshot.length > 0 &&
                    content['messages'][0].contents.body.contents.length > 0
                ) {
                    let dd: any = kaokaiSnapshot[key].endDateTime.getDate() - 1;
                    let mm = kaokaiSnapshot[key].endDateTime.getMonth() + 1;
                    if (dd < 10) { dd = '0' + dd; }
                    if (mm < 10) { mm = '0' + mm; }
                    kaokaiToday = process.env.APP_HOME + `?date=${kaokaiSnapshot[key].endDateTime.getFullYear()}-${mm}-${dd}&noti=true`;
                    endDate = new Date(kaokaiSnapshot[key].endDateTime);
                    endDate.setDate(endDate.getDate() - 1);
                    dateTime = endDate.toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    });
                    const postId:any = kaokai.data.pageRoundRobin.contents[0] !== undefined ? kaokai.data.pageRoundRobin.contents[0].post._id : kaokai.data.majorTrend.contents[0].post._id;
                    postIds.push(new ObjectID(postId));
                    content['messages'][0].contents.body.contents[1].contents[1].contents.push(
                        {
                            'type': 'box',
                            'layout': 'horizontal',
                            'contents': [
                                {
                                    'type': 'box',
                                    'layout': 'horizontal',
                                    'contents': [
                                        {
                                            'type': 'image',
                                            'url': kaokai.data.pageRoundRobin.contents[0] !== undefined ? kaokai.data.pageRoundRobin.contents[0].coverPageSignUrl : kaokai.data.majorTrend.contents[0].coverPageSignUrl,
                                            'size': '80px',
                                            'align': 'start',
                                            'aspectMode': 'cover'
                                        }
                                    ],
                                    'paddingAll': '5px',
                                    'cornerRadius': '8px',
                                    'width': '30%'
                                },
                                {
                                    'type': 'box',
                                    'layout': 'vertical',
                                    'contents': [
                                        {
                                            'type': 'text',
                                            'text': kaokai.data.pageRoundRobin.contents[0] !== undefined ? kaokai.data.pageRoundRobin.contents[0].post.title : kaokai.data.majorTrend.contents[0].post.title,
                                            'wrap': true,
                                            'size': '14px',
                                            'align': 'start',
                                            'gravity': 'center',
                                            'maxLines': 2,
                                            'margin': '5px',
                                            'lineSpacing': '2px'
                                        },
                                        {
                                            'type': 'text',
                                            'text': `ฉบับวันที่ ${dateTime}`,
                                            'gravity': 'bottom',
                                            'align': 'end',
                                            'size': '12px',
                                            'margin': '5px',
                                            'offsetEnd': '5px'
                                        },
                                    ]
                                }
                            ],
                            'backgroundColor': '#FFFFFF',
                            'width': '100%',
                            'height': '70px',
                            'cornerRadius': '8px',
                            'action': {
                                'type': 'uri',
                                'label': 'action',
                                'uri': kaokaiToday + '&openExternalBrowser=1',
                            }
                        },
                    );
                }
            }

            const lineNewMoveParty = new LineNewMoveParty();
            lineNewMoveParty.lineNewsWeekId = new ObjectID(lineOa._id);
            lineNewMoveParty.objIds = stackIds;
            const tokenLine = process.env.LINE_AUTHORIZATION;
            const create = await this.lineNewMovePartyService.create(lineNewMoveParty);
            // api.line.me/v2/bot/message/push
            if (create) {
                const lineUsers = await axios.get(
                    'https://api.line.me/v2/bot/followers/ids', {
                    headers: {
                        Authorization: 'Bearer ' + tokenLine
                    }
                });
                if (lineUsers.data.userIds.length > 0 && content['messages'][0].contents.body.contents.length > 0) {
                    const workThreadModel: WorkerThread = new WorkerThread();
                    workThreadModel.theThings = new ObjectID(lineOa._id);
                    workThreadModel.sending = lineUsers.data.userIds.length;
                    workThreadModel.sended = 0;
                    workThreadModel.type = NotiTypeAction['line_noti'];
                    workThreadModel.postIds = postIds;
                    workThreadModel.active = false;
                    await this.workerThreadService.create(workThreadModel);
                    const chunks: number[][] = await checkify(lineUsers.data.userIds, Number(process.env.WORKER_THREAD_JOBS));
                    chunks.forEach((user,i) => {
                        const worker = new Worker(process.env.WORKER_THREAD_PATH);
                        const messagePayload = {
                            users: user,
                            messages: JSON.stringify(content['messages']),
                            type: 'LINE_NOTI',
                            token: tokenLine
                        };
                        
                        worker.postMessage(messagePayload);
                        worker.on('message', async (result:any) => {
                            if(result.message === 'done') {
                                console.log(`Worker ${i} completed.`);
                                logMemoryUsage();
                            }
                        });
                    });
                    const pageLike = await this.configService.getConfig(LINE_NEWS_WEEK_OA);
                    let pageLikePoint = DEFAULT_LINE_NEWS_WEEK_OA;
                    if (pageLike) {
                        pageLikePoint = parseInt(pageLike.value, 10);
                    }
                    const query = { _id: new ObjectID(lineOa._id) };
                    const newValues = { $set: { active: true} };
                    const update = await this.lineNewsWeekService.update(query, newValues);
                    if (update) {
                        const twoWeeksAgo = new Date(today.getTime() + 24 * 60 * 60 * 1000 * pageLikePoint);
                        const lineNewsWeek: LineNewsWeek = new LineNewsWeek();
                        lineNewsWeek.todayDate = today;
                        lineNewsWeek.newsWeek = twoWeeksAgo;
                        lineNewsWeek.active = false;
                        const created = await this.lineNewsWeekService.create(lineNewsWeek);
                        if (created) {
                            return 'Line Flex message is success.';
                        }
                    }
                } else {
                    return 'Line Flex message undefined.';
                }
            } else {
                return 'Line Flex message is empty array.';
            }
        } else {
            return 'Not found the contents.';
        }
    }

}

interface MemoryUsage {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
}

function logMemoryUsage(): void {
    const memoryUsage: MemoryUsage = process.memoryUsage();
    console.log(`Memory Usage: ${JSON.stringify(memoryUsage, null, 2)}`);
}
