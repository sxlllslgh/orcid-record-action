const core = require('@actions/core');
const fsp = require('fs/promise');

async function fetchRecord() {
    try {
        const myHeaders = new Headers();
        myHeaders.append('Accept', 'application/json');
        myHeaders.append('Authorization', `Bearer ${core.getInput('access-token')}`);

        const record = await fetch(`https://pub.orcid.org/v3.0/${core.getInput('orcid-id')}/record`, {headers: myHeaders});
        const recordJson = await record.json();
        for (const [i, work] of recordJson['activities-summary'].works.group.entries()) {
            const workDetailed = await fetch(`https://pub.orcid.org/v3.0/${core.getInput('orcid-id')}/work/${work['work-summary'][0]['put-code']}`, {headers: myHeaders});
            recordJson['activities-summary'].works.group[i]['work-summary'][0] = Object.assign({}, recordJson['activities-summary'].works.group[i]['work-summary'][0], await workDetailed.json());
        }
        const recordFile = core.getInput('record-file');
        if (recordFile != '') {
            fsp.writeFile(recordFile, JSON.stringify(recordJson));
        } else {
            core.setOutput('record', JSON.stringify(recordJson));
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

fetchRecord().finally();