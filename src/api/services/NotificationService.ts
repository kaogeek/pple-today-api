/*
 * @license Spanboon Platform v0.1
 * (c) 2020-2021 KaoGeek. http://kaogeek.dev
 * License: MIT. https://opensource.org/licenses/MIT
 * Author:  shiorin <junsuda.s@absolute.co.th>, chalucks <chaluck.s@absolute.co.th>
 */

import { OrmRepository } from 'typeorm-typedi-extensions';
import { Notification } from '../models/Notification';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { SearchUtil } from '../../utils/SearchUtil';
import { SearchFilter } from '../controllers/requests/SearchFilterRequest';
import { USER_TYPE } from '../../constants/NotificationType';
import { ObjectID } from 'mongodb';
import { Service } from 'typedi';
import * as serviceAccount from '../../../firebase.json';
import { ServiceAccount } from 'firebase-admin';
import * as admin from 'firebase-admin';
import { S3Service } from './S3Service';
@Service()
export class NotificationService {

    constructor(
        @OrmRepository() private notificationRepository: NotificationRepository,
        private s3Service:S3Service
    ) {
        console.log('constructor called()');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount as ServiceAccount),
            databaseURL: process.env.DATABASEURL_FIREBASE
        });
        console.log('constructor executed()');
    }

    // find Notification
    public async find(findCondition: any): Promise<Notification[]> {
        return await this.notificationRepository.find(findCondition);
    }

    // find Notification
    public async findOne(findCondition: any): Promise<Notification> {
        return await this.notificationRepository.findOne(findCondition);
    }

    // create Notification
    public async create(data: any): Promise<Notification> {
        return await this.notificationRepository.save(data);
    }

    // update Notification
    public update(query: any, newValue: any): Promise<any> {
        return this.notificationRepository.updateOne(query, newValue);
    }

    // updateMany
    public updateMany(query: any, newValue: any): Promise<any> {
        return this.notificationRepository.updateMany(query, newValue);
    }

    // delete Notification
    public async delete(query: any, options?: any): Promise<any> {
        return await this.notificationRepository.deleteOne(query, options);
    }

    // delete Notification
    public async deleteMany(query: any, options?: any): Promise<any> {
        return await this.notificationRepository.deleteMany(query, options);
    }

    // aggregate Notification
    public async aggregate(query: any, options?: any): Promise<any[]> {
        return await this.notificationRepository.aggregate(query, options).toArray();
    }

    // select distinct Notification
    public async distinct(key: any, query: any, options?: any): Promise<any> {
        return await this.notificationRepository.distinct(key, query, options);
    }

    // Search Notification
    public search(search: SearchFilter): Promise<any> {
        const condition: any = SearchUtil.createFindCondition(search.limit, search.offset, search.select, search.relation, search.whereConditions, search.orderBy);
        if (search.count) {
            return this.notificationRepository.count();
        } else {
            return this.notificationRepository.find(condition);
        }
    }
    public async testMultiDevice(token: any): Promise<any> {
        const registrationTokens = token;
        const title = 'Hello World ชาวประชาชน!';
        const image = 'https://scontent.fbkk2-3.fna.fbcdn.net/v/t39.30808-6/355437853_834984011524286_2620245563691529882_n.jpg?_nc_cat=111&cb=99be929b-59f725be&ccb=1-7&_nc_sid=730e14&_nc_eui2=AeHulsSGw1aykmm2mWaVr7ui84g9AOew56vziD0A57Dnq_ebcZYEz2lyh_ZTBRdkA_Uhh-I0e2lyIMNgTYvbZ6a8&_nc_ohc=zOqkiqXob2wAX_HQUSs&_nc_ht=scontent.fbkk2-3.fna&oh=00_AfBTww5j0wwsoi2AMVVlLnrJ1SG3x1A-JlI97O2YaqKS_g&oe=649AD4E3';
        const payload =
        {
            data: {
                title,
                image,
            },
            token:registrationTokens
        };
        if (String(registrationTokens) !== undefined) {
            Promise.all([await admin.messaging().send(payload)]);
        } else {
            return;
        }
    }

    public async multiPushNotificationVoterMessage(data: any, tokenId: any): Promise<any> {
        const title = data['title'];
        const body = data['body'];
        const image = data['image'];
        const token = tokenId;
        const notificationType = 'VOTE_EVENT';
        const link = process.env.APP_HOME + `/vote/event/${data.pageId}`;
        const payload =
        {
            tokens: token,
            notification: {
                title,
                body,
                image,
            },
            data: {
                notificationType,
                link
            }
        };

        if (String(token) !== undefined) {
            Promise.all([await admin.messaging().sendEachForMulticast(payload)]);
        } else {
            return;
        }
    }

    public async multiPushNotificationMessage(data: any, tokenId: any, date: any, filterNews: boolean): Promise<any> {
        const title = 'ประชาชนหน้าหนึ่ง';
        let body = undefined;
        let image = undefined;
        if (String(filterNews) === 'true') {
            for (let i = 0; i < data.pageRoundRobin.contents.length; i++) {
                body = data.pageRoundRobin.contents[i].post.title ? String(data.pageRoundRobin.contents[i].post.title) : undefined;
                image = data.pageRoundRobin.contents[i].coverPageSignUrl ? data.pageRoundRobin.contents[i].coverPageSignUrl : 'https://mfp-today-web.s3.ap-southeast-1.amazonaws.com/unnamed.png';
                if (body && image !== undefined) {
                    break;
                } else {
                    continue;
                }
            }
            if (body === undefined) {
                body = data.majorTrend.contents[0].post.title ? String(data.majorTrend.contents[0].post.title) : 'ประชาชนหน้าหนึ่ง';
                image = data.majorTrend.contents[0].coverPageSignUrl ? data.majorTrend.contents[0].coverPageSignUrl : 'https://mfp-today-web.s3.ap-southeast-1.amazonaws.com/unnamed.png';
            }
        } else {
            body = data.majorTrend.contents[0].post.title ? String(data.majorTrend.contents[0].post.title) : 'ประชาชนหน้าหนึ่ง';
            image = data.majorTrend.contents[0].coverPageSignUrl ? data.majorTrend.contents[0].coverPageSignUrl : 'https://mfp-today-web.s3.ap-southeast-1.amazonaws.com/unnamed.png';
        }
        if (body.length > 60) {
            body = body.substring(0, 60) + '...';
        }
        let dd:any = date.getDate() - 1;
        let mm = date.getMonth() + 1;
        if(dd<10) { dd='0'+dd;}
        if(mm<10) { mm='0'+mm;}
        const token = tokenId;
        const notificationType = 'TODAY_NEWS';
        const link = process.env.APP_HOME + `?date=${date.getFullYear()}-${mm}-${dd}`;
        const payload =
        {
            tokens: token,
            notification: {
                title,
                body,
                image,
            },
            data: {
                notificationType,
                link
            }
        };

        if (String(token) !== undefined) {
            Promise.all([await admin.messaging().sendEachForMulticast(payload)]);
        } else {
            return;
        }
    }
/*
    public async multiPushNotificationMessageTest(data: any, tokenId: any, date: any, filterNews: boolean): Promise<any> {
        const title = 'ประชาชนหน้าหนึ่ง';
        let body = undefined;
        let image = undefined;
        if (String(filterNews) === 'true') {
            for (let i = 0; i < data.pageRoundRobin.contents.length; i++) {
                body = data.pageRoundRobin.contents[i].post.title ? String(data.pageRoundRobin.contents[i].post.title) : undefined;
                image = data.pageRoundRobin.contents[i].coverPageSignUrl ? data.pageRoundRobin.contents[i].coverPageSignUrl : 'https://mfp-today-web.s3.ap-southeast-1.amazonaws.com/unnamed.png';
                if (body && image !== undefined) {
                    break;
                } else {
                    continue;
                }
            }
            if (body === undefined) {
                body = data.majorTrend.contents[0].post.title ? String(data.majorTrend.contents[0].post.title) : 'ประชาชนหน้าหนึ่ง';
                image = data.majorTrend.contents[0].coverPageSignUrl ? data.majorTrend.contents[0].coverPageSignUrl : 'https://mfp-today-web.s3.ap-southeast-1.amazonaws.com/unnamed.png';
            }
        } else {
            body = data.majorTrend.contents[0].post.title ? String(data.majorTrend.contents[0].post.title) : 'ประชาชนหน้าหนึ่ง';
            image = data.majorTrend.contents[0].coverPageSignUrl ? data.majorTrend.contents[0].coverPageSignUrl : 'https://mfp-today-web.s3.ap-southeast-1.amazonaws.com/unnamed.png';
        }
        if (body.length > 60) {
            body = body.substring(0, 60) + '...';
        }

        const token = tokenId;
        const notificationType = 'TODAY_NEWS';
        let dd:any = date.getDate() - 1;
        let mm = date.getMonth() + 1;
        if(dd<10) { dd='0'+dd;}
        if(mm<10) { mm='0'+mm;}
        const link = process.env.APP_HOME + `?date=${date.getFullYear()}-${mm}-${dd}`;
        console.log('link',link);
        const payload =
        {
            tokens: token,
            notification: {
                title,
                body,
                image,
            },
            data: {
                notificationType,
                link
            }
        };

        if (String(token) !== undefined) {
            // Promise.all([await admin.messaging().sendEachForMulticast(payload)]);
        } else {
            return;
        }
    }
*/
    public async manualMultiPushNotificationMessage(tokenId: any): Promise<any> {
        const title = 'พบกับประชาชนหน้าหนึ่งได้แล้ววันนี้';
        const body = 'อัพเดทแอปเป็นเวอร์ชั่นใหม่เลย';
        const image = 'https://today-api.moveforwardparty.org/api/file/65fb943fa521ac67854f81e8/image';
        const token = tokenId;
        const notificationType = '';
        const link = '';
        const payload =
        {
            tokens: token,
            notification: {
                title,
                body,
                image,

            },
            data: {
                notificationType,
                link
            }
        };
        if (String(token) !== undefined) {
            Promise.all([await admin.messaging().sendEachForMulticast(payload)]);
        } else {
            return;
        }
    }

    public async testManualMultiPushNotificationMessage(): Promise<any> {
        const title = 'พบกับประชาชนหน้าหนึ่งได้แล้ววันนี้';
        const body = 'อัพเดทแอปเป็นเวอร์ชั่นใหม่เลย';
        const image = 'https://today-api.moveforwardparty.org/api/file/65fb943fa521ac67854f81e8/image';
        const notificationType = '';
        // 20-03-2024
        const link = '';
        const payload =
        {
            notification: {
                title,
                body,
                image,

            },
            data: {
                notificationType,
                link
            }
        };
        Promise.all([await admin.messaging().sendToDevice(
            'fW637KbRTQmCgGiaZQWepe:APA91bF_ZEI9MRlsfrb2jTBYXgROhKbcPCaSDmfYlJbkWVXhVYpYtyb_-slzeAL4GXI6-Z40U_2z4fqVLblMFsrMw_vHvN4uDJQzboUT3h1DMqHs4vWNds5vWd-g65kpuy6Ywn_XH7ug'
            ,payload)]);
    }

    public async pushNotificationMessage(data: any, tokenId: any, date: any): Promise<any> {
        const title = 'ประชาชนหน้าหนึ่ง';
        let body = data.majorTrend.contents[0].post.title ? String(data.majorTrend.contents[0].post.title) : 'ประชาชนหน้าหนึ่ง';
        if (body.length > 60) {
            body = body.substring(0, 60) + '...';
        }
        const image = data.majorTrend.contents[0].coverPageSignUrl ? data.majorTrend.contents[0].coverPageSignUrl : 'https://mfp-today-web.s3.ap-southeast-1.amazonaws.com/unnamed.png';
        const thaiDate = String(date);
        const token = String(tokenId);
        const notificationType = 'TODAY_NEWS';
        const link = process.env.APP_HOME + `?date=${thaiDate}`;
        const payload =
        {
            notification: {
                title,
                body,
                image,
            },
            data: {
                notificationType,
                link
            }
        };
        if (String(token) !== undefined) {
            Promise.all([await admin.messaging().sendToDevice(token, payload)]);
        } else {
            return;
        }
    }

    public async pushNotificationMessageBirthDay(data: any, tokenId: string): Promise<any> {
        const title = 'Birthday';
        const image = data.s3ImageURL !== undefined ||  data.s3ImageURL !== null ? await this.s3Service.s3signCloudFront(data.s3ImageURL) : data.imageURL;
        const body = 'สุขสันต์วันเกิด! MFP Today ขออวยพรให้คุณมีความสุขในทุกๆวัน 🎂';
        const token = String(tokenId);
        const notificationType = 'BIRTHDAY_EVENT';
        const payload =
        {
            notification: {
                title,
                body,
                image,
            },
            data: {
                notificationType,
                
            }
        };
        if (String(token) !== undefined && String(token) !== '') {
            Promise.all([await admin.messaging().sendToDevice(token, payload)]);
        } else {
            return;
        }
    }

    public async pushNotificationMessageExpiredMemberShip(data: any, tokenId: any): Promise<any> {
        const title = 'ใกล้หมดอายุสมาชิกพรรค';
        const date = new Date(data.expirationDate);
        const oneDay = 24 * 60 * 60 * 1000; // one day in milliseconds
        const timeStamp = new Date(date.getTime() - oneDay).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        // const image = data.s3ImageURL !== undefined ||  data.s3ImageURL !== null ? await this.s3Service.s3signCloudFront(data.s3ImageURL) : data.imageURL;
        const body = `ใกล้หมดอายุสมาชิกพรรค วันที่ ${timeStamp}`;
        const token = String(tokenId);
        const notificationType = 'EXPIRE_MEMBERSHIP';
        const payload =
        {
            notification: {
                title,
                body,
            },
            data: {
                notificationType,
            }
        };
        if (String(token) !== undefined) {
            Promise.all([await admin.messaging().sendToDevice(token, payload)]);
        } else {
            return;
        }
    }

    public async sendNotificationFCM(toUserId: string, toUserType: string, fromUserId: string, fromUserType: string, notificationType: string, title: string, link: string, data?: any, displayName?: any, image?: any, id?: any, count?: any): Promise<any> {
        const notification: Notification = new Notification();
        notification.isRead = false;
        notification.toUser = new ObjectID(toUserId);
        notification.toUserType = toUserType;
        notification.fromUser = new ObjectID(fromUserId);
        notification.fromUserType = fromUserType;
        notification.title = title;
        notification.link = link;
        notification.type = notificationType;
        notification.deleted = false;
        notification.data = data;
        const token = String(data);
        const toUser = String(toUserId);
        const fromUser = String(fromUserId);
        const link_noti = String(link);
        const image_url = String(image);
        const payload =
        {
            data: {
                toUser,
                fromUser,
                title,
                link_noti,
                notificationType,
                image_url,
            }
        };
        if (String(notification.toUser) !== String(notification.fromUser)) {
            Promise.all([await admin.messaging().sendToDevice(token, payload)]);
        } else {
            return;
        }
    }

    public async createNofiticationObjective(toUserId: string, toUserType: string, fromUserId: string, fromUserType: string, notificationType: string, title: string, link: string, displayName?: any, image?: any, count?: any, mode?: string, joinObjectiveId?: string): Promise<any> {
        const notification: Notification = new Notification();
        notification.isRead = false;
        notification.toUser = new ObjectID(toUserId);
        notification.toUserType = toUserType;
        notification.fromUser = new ObjectID(fromUserId);
        notification.fromUserType = fromUserType;
        notification.title = title;
        notification.link = link;
        notification.type = notificationType;
        notification.deleted = false;
        notification.mode = mode;
        notification.imageURL = image;
        notification.joinObjectiveId = new ObjectID(joinObjectiveId);
        return await this.create(notification);
    }

    public async createNotificationFCM(toUserId: string, toUserType: string, fromUserId: string, fromUserType: string, notificationType: string, title: string, link: string, displayName?: any, image?: any, count?: any, mode?: string, pageId?: string): Promise<any> {
        const notification: Notification = new Notification();
        notification.isRead = false;
        notification.toUser = new ObjectID(toUserId);
        notification.toUserType = toUserType;
        notification.fromUser = new ObjectID(fromUserId);
        notification.fromUserType = fromUserType;
        notification.title = title;
        notification.link = link;
        notification.type = notificationType;
        notification.deleted = false;
        notification.imageURL = image;
        if (String(notification.toUser) !== String(notification.fromUser)) {
            return await this.create(notification);
        } else {
            return;
        }
    }
    public async createNotification(toUserId: string, toUserType: string, fromUserId: string, fromUserType: string, notificationType: string, title: string, link?: string, data?: any, displayName?: any, image?: any): Promise<any> {
        const notification: Notification = new Notification();
        notification.isRead = false;
        notification.toUser = new ObjectID(toUserId);
        notification.toUserType = toUserType;
        notification.fromUser = new ObjectID(fromUserId);
        notification.fromUserType = fromUserType;
        notification.title = title;
        notification.link = link;
        notification.type = notificationType;
        notification.deleted = false;
        notification.data = data;
        if (String(notification.toUser) !== String(notification.fromUser)) {
            return await this.create(notification);
        } else {
            return;
        }
    }

    public async createUserNotificationObjective
        (
            toUserId: string,
            fromUserId: string,
            fromUserType: string,
            notificationType: string,
            title: string,
            link?: string,
            displayName?: any,
            image?: any,
            count?: any,
            mode?: string,
            joinObjectiveId?: string,

        ):
        Promise<any> {

        return await this.createNofiticationObjective(toUserId, USER_TYPE.PAGE, fromUserId, fromUserType, notificationType, title, link, displayName, image, count, mode, joinObjectiveId);
    }

    public async createUserNotificationFCM(toUserId: string,
        fromUserId: string,
        fromUserType: string,
        notificationType: string,
        title: string,
        link?: string,
        displayName?: any,
        image?: any,
        count?: any,
        mode?: string,
        page?: string,): 
        Promise<any> {
        return await this.createNotificationFCM(toUserId, USER_TYPE.PAGE, fromUserId, fromUserType, notificationType, title, link, displayName, image, count, mode, page);
    }

    public async createUserNotification(toUserId: string, fromUserId: string, fromUserType: string, notificationType: string, title: string, link?: string, data?: any): Promise<any> {
        return await this.createNotification(toUserId, USER_TYPE.PAGE, fromUserId, fromUserType, notificationType, title, link);
    }

}
