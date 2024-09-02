const { parentPort } = require('worker_threads');
const axios = require('axios');
const firebase = require('firebase-admin');
const serviceAccount = require('../firebase.json');

parentPort.on('message', async (jobs) => {
    let count = 0;
    if(jobs.type === 'LINE_NOTI' && jobs.typeAdmin === undefined) { 
        console.log('pass1');
        for(const user of jobs.users){
            const requestBody = {
                'to': String(user),
                'messages': JSON.parse(jobs.messages)
            }
            await axios.post('https://api.line.me/v2/bot/message/push', requestBody, { headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*', Authorization: 'Bearer ' + jobs.token } }).then((res) => {
                if(res) {
                    count +=1;
                }
            }).catch((err) => {
                console.log('err',err.data);
            });
        }
        const result = { message: 'done',total:jobs.users.length, count: count};
        parentPort.postMessage(result);
    } else if(jobs.type === 'PPLE_NEWS' && jobs.typeAdmin === undefined) {
        console.log('pass2');
        let body = undefined;
        let image = undefined;
        if (String(jobs['filterNews']) === 'true') {
            for (let i = 0; i < jobs['snapshot'].pageRoundRobin.contents.length; i++) {
                body = jobs['snapshot'].pageRoundRobin.contents[i].post.title ? String(jobs['snapshot'].pageRoundRobin.contents[i].post.title) : undefined;
                image = jobs['snapshot'].pageRoundRobin.contents[i].coverPageSignUrl ? jobs['snapshot'].pageRoundRobin.contents[i].coverPageSignUrl : 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Move_Forward_Party_Logo.svg/180px-Move_Forward_Party_Logo.svg.png';
                if (body && image !== undefined) {
                    break;
                } else {
                    continue;
                }
            }
            if (body === undefined) {
                body = jobs['snapshot'].majorTrend.contents[0].post.title ? String(jobs['snapshot'].majorTrend.contents[0].post.title) : 'ประชาชนหน้าหนึ่ง';
                image = jobs['snapshot'].majorTrend.contents[0].coverPageSignUrl ? jobs['snapshot'].majorTrend.contents[0].coverPageSignUrl : 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Move_Forward_Party_Logo.svg/180px-Move_Forward_Party_Logo.svg.png';
            }
        } else {
            body = jobs['snapshot'].majorTrend.contents[0].post.title ? String(jobs['snapshot'].majorTrend.contents[0].post.title) : 'ประชาชนหน้าหนึ่ง';
            image = jobs['snapshot'].majorTrend.contents[0].coverPageSignUrl ? jobs['snapshot'].majorTrend.contents[0].coverPageSignUrl : 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Move_Forward_Party_Logo.svg/180px-Move_Forward_Party_Logo.svg.png';
        }
        if (body.length > 60) {
            body = body.substring(0, 60) + '...';
        }

        let dd = jobs['date'].getDate() - 1;
        let mm = jobs['date'].getMonth() + 1;
        if(dd<10) { dd='0'+dd;}
        if(mm<10) { mm='0'+mm;}
        firebase.initializeApp({
            credential: firebase.credential.cert(serviceAccount),
        });
        const fireBaseToken = [];
        if (jobs['token'].length > 0) {
            for (let j = 0; j < jobs['token'].length; j++) {
                if (jobs['token'][j] !== undefined && jobs['token'][j] !== null && jobs['token'][j] !== '') {
                    fireBaseToken.push(jobs['token']);
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
            const link = process.env.APP_HOME + `?date=${jobs['date'].getFullYear()}-${mm}-${dd}`;
            if(slicedArrays.length > 0) {
                const title = 'ประชาชนหน้าหนึ่ง';
                const notificationType = 'TODAY_NEWS';
                const payload =
                {
                    tokens: slicedArrays[0][0],
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
                if(jobs['token'] !== undefined && jobs['token'].length > 0) {
                    await firebase.messaging().sendMulticast(payload).then((res) => {
                        if(res) {
                            console.log('successCount:',res.successCount, 'failureCount',res.failureCount);
                            count += 1;
                        }
                    }).catch((err) => {
                        console.log('Err pple news event:',err.data);
                    })
                    const result = { message: 'done',total: jobs['token'].length, count: count};
                    parentPort.postMessage(result);
                }
            }
        }
    } else if(jobs.type === 'VOTE_EVENT_NOTI' && jobs.typeAdmin === undefined) {
        console.log('pass3');
        firebase.initializeApp({
            credential: firebase.credential.cert(serviceAccount),
        });
        const fireBaseToken = [];
        if (jobs['token'].length > 0) {
            for (let j = 0; j < jobs['token'].length; j++) {
                if (jobs['token'][j].token !== undefined && jobs['token'][j].token !== null && jobs['token'][j].token !== '') {
                    fireBaseToken.push(jobs['token'][j].token);
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
            if(slicedArrays.length > 0) {
                const title = jobs['title'];
                const body = jobs['body'];
                const image = jobs['image'];
                const notificationType = jobs['type'];
                const link = jobs['link'];
                const payload =
                {
                    tokens: slicedArrays,
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
                if(jobs['token'] !== undefined && jobs['token'].length > 0) {
                    await firebase.messaging().sendMulticast(payload).then((res) => {
                        if(res) {
                            console.log('successCount:',res.successCount, 'failureCount',res.failureCount);
                            count += 1;
                        }
                    }).catch((err) => {
                        console.log('Err vote event:',err.data);
                    })
                    const result = { message: 'done',total: jobs['token'].length, count: count};
                    parentPort.postMessage(result);
                }
            }
        }

    } else if (jobs.typeAdmin === 'CREATE_VOTE_EVENT_NOTI') {
        console.log('pass4');
        // const userObj = JSON.parse(jobs['userArrs']);
        // const notificationRepository = getCustomRepository(NotificationRepository);
        // const notificationService = new NotificationService(notificationRepository);
        // console.log('notificationService',notificationService);
        // for(const user of userObj) {

        // }
        const result = { message: 'done', notification: jobs};
        parentPort.postMessage(result);
    } else if (jobs.typeAdmin === 'CREATE_LINE_NOTI') {
        console.log('pass5');
        const result = { message: 'done', notification: jobs};
        parentPort.postMessage(result);
    }  else if (jobs.typeAdmin === 'CREATE_PPLE_NEWS_NOTI') {
        console.log('pass6');
        const result = { message: 'done', notification: jobs};
        parentPort.postMessage(result);
    }
});