const { parentPort } = require('worker_threads');
const axios = require('axios');
parentPort.on('message', async (jobs) => {
    let count = 0;
    for(const user of jobs.users){
        // const requestBody = {
        //     'to': String(user),
        //     'messages': JSON.parse(jobs.messages)
        // }
        // await axios.post('https://api.line.me/v2/bot/message/push', requestBody, { headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*', Authorization: 'Bearer ' + jobs.token } }).then((res) => {
        // console.log('response Axios');
        // }).catch((err) => {
        //     return err.data.message;
        // });
        count += 1;
    }
    const result = { message: 'done','total':jobs.users.length, 'count': count};
    parentPort.postMessage(result);
});