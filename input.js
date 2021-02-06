/*
    Checklist
        MVP
        [x] Create CLI requirement to ask for User Credentials
        [x] Set up API to talk to and authenticate with GitHub
        [x] Pull any set of data then filter later
        [x] Output 60 Commits in Console
        [x] Throw into a CSV
        [x] Sort name
        [x] Sort recent

        Nice-to-Haves
        [] Add validations / Error Messages
            [] Is this a proper email
            [] Sorry your info is wrong
        [] Security
            [x] don't store the data locally to be accessed
            [] create an 'ENV'
        [] create a UI
        [] Create README on how to run

    Libraies I care about for the MVP:
        https://www.npmjs.com/package/objects-to-csv
        https://attacomsian.com/blog/nodejs-convert-json-to-csv
            good for writing ~ objects ~ to CSV
        http://github-tools.github.io/github/
            wrapper for GitHubs REST API in Node
        https://www.npmjs.com/package/axios
            Barebones REST client

Requirements
    The code you submit should be robust and optimized.

    Part 1
    Input
        Require User to enter in:
            1) Credentials
            2) Authentication Token
    Output
        Pull data on said user's credentials on last 60 commits
        Store into a CSV

    Part 2
    Output
        Modify your program to also find the mean time between the last 60 commits for the GitHub user. Your program should output this result to the console.
*/

const inquirer = require('inquirer');
const GitHub = require('github-api');
const Converter = require ('json-2-csv');
const axios = require ('axios');
const fs = require('fs');
const _ = require('lodash');
const { connect } = require('http2');
const { throwError } = require('rxjs');
const { parse } = require('path');
const { create } = require('lodash');


inquireUser();


function inquireUser() {
    var userName;
    var userToken;

    var questions = [
    {
        type: 'input',
        name: 'username',
        message: "What's your user?"
    },
    {
        type: 'input',
        name: 'token',
        message: "What's your token?"
    }
    ]

    inquirer.prompt(questions).then(answers => {
        userName = answers['username'];
        userToken = answers['token'];

        /* console.log(userName + ' ' + userToken); */

        connectGit(userName, userToken);
        /* getName(userName, userToken); */
    })
}

/* Github API has a limiter so I created this to test smaller functions */
async function testGit(userName, userToken) {
    var gh = new GitHub({

        username: userName,
        token: userToken
    });

    const user = gh.getUser(userName);

    var profile;
    profile = await user.getProfile()
        .then(( result => {
            return result;
        }));
    var name = profile.data.name;

    return name;
}

async function connectGit(userName, userToken) {

    console.log('Starting git connection');
    /* Authenticate to  */
    var gh = new GitHub({

        username: userName,
        token: userToken
    });
    var getRepos;

    /* var whoamI = gh.getUser();
    console.log(whoamI);
    */

    const user = gh.getUser(userName);

    var profile;
    profile = await user.getProfile()
        .then(( result => {
            return result;
        }));
    var name = profile.data.name;


    getRepos = await user.listRepos()
        .then((result => {
            return result;
        }));

    console.log(userName + ' has ' + getRepos.data.length + ' total repos');

    const repoData = getRepos.data;

/*     Converter.json2csv(repoData, (err, csv) => {
        if (err) {
            throw err;
        }
        console.log(csv);
    }) */
    var repoInfo = new Array();

    /* https://www.geeksforgeeks.org/node-js-split-function/#:~:text=The%20split()%20function%20is,the%20output%20in%20array%20form.&text=Parameters%3A%20This%20function%20accepts%20single,character%20to%20split%20the%20string. don't want to include SHA in commit URL */
    repoData.forEach(element => {
        var data = {
            id: element.id,
            name: element.name,
            created_at: element.created_at,
            updated_at: element.updated_at,
            owner: element.owner.login,
            url: element.url,
            commit_url: element.commits_url.split("{")[0]
        }
        repoInfo.push(data);
    });

    /* Convert JSON and write to a live CSV file */
    Converter.json2csv(repoInfo, (err, csv) => {
        if (err) {
            throw err;
        }
        console.log('Writing Repo List to CSV');
        fs.writeFileSync('reposInfo.csv',csv);
        processCommits(repoInfo, userName, userToken, name);
    })

    /*
       Logic here is to store a "signal" in an iterative process
       that can be interrogated, sifted through, and understood.

       Answers questions like:
       "Where did the commits come from?"
       "Who were the owners?"
       "What were the URLs?"

       Now we can get into pulling the commits
    */



}

async function processCommits(repoInfo, userName, userToken, name) {
    console.log('Starting Commits Pull, Reading from Repos Info for: ' + userName);

    /* Lets try using a different way to authenticate / using Axios */

    var commitsInfo = new Array();
    var i;
    for (i = 0; i < repoInfo.length; i++){
        var commit_url = repoInfo[i].commit_url;
        var pageNumber = 1;
        /* Track pageNumber because limits at 30 */

        /* Use page parameter to retrieve all commits */

        /* console.log(commit_url); */

        while(true){
            let response = await axios({
                method: 'get',
                url: commit_url,
                config:
                    {
                        'headers': {
                            'Authorization': userToken
                        }
                    }
            })
            .then(function (result) {
                /* console.log('Pulling Commit Data (In-Progress) for Repo Index: '+ i); */
                return result;
            })
            .catch(function (result) {
                //handle error
                console.log(result);
            });

            const parseInfo = response.data;

            parseInfo.forEach(element => {
                    var data = {
                        id: element.node_id,
                        sha: element.sha,
                        date: element.commit.committer.date,
                        committer: element.commit.committer.name,
                        message: element.commit.message
                    };
                    commitsInfo.push(data);

            });
            if(response.length == 30){
                pageNumber = pageNumber + 1;
                commit_url = commit_url + '?page=' + pageNumber.toString();
            }
            else {
                break;
            }
        }
        createCSV(commitsInfo, 'Repo Number ' + i + ' and its commits');
    }


    /* Sort the commits by date (most recent) */
    console.log('Sorting by Date')
    const sortedCommitsByDate = commitsInfo.sort(comp);
    createCSV(sortedCommitsByDate, 'sortedCommitsByDate');

    /* Get rid of external committers that aren't the user */
    console.log('Filtering by User: ' + name);
    const filteredCommitsByUser = _.filter(sortedCommitsByDate, {'committer': name.toString()});
    createCSV(filteredCommitsByUser, 'filteredCommitsByUser');

    /* Slim down to 60 most recent commits */
    const recentCommitsFinal = filteredCommitsByUser;
    while (recentCommitsFinal.length > 60){
        recentCommitsFinal.pop();
    }
    createCSV(recentCommitsFinal, 'recentCommitsFinal');



    /* Calculate Time */
    var timeBetweenCommits = new Array();
    var j;
    var total_time = 0;
    for (j = 0; j < (recentCommitsFinal.length-1); j++){
        var start = new Date(recentCommitsFinal[j].date);
        var end = new Date(recentCommitsFinal[j+1].date);

        /* ms to minutes */
        var distance = parseFloat(((start - end) / (1000*60)).toFixed(2));
        total_time += parseFloat(distance);
        timeBetweenCommits.push(parseFloat(distance));
    }
    /* console.log('Total Time: ' + total_time); */
    var average = parseFloat(total_time/timeBetweenCommits.length);
    /* console.log('Average: ' + average); */

    var d = Math.floor(average / 1440); // 60*24
    var h = Math.floor((average - (d * 1440)) / 60);
    var m = Math.round(average % 60);

    console.log('The mean time between commits is: ');
    console.log(d + " days, " + h + " hours, " + m + " minutes.");

    /* var total_time;
    var k;
    for (k = 0; k < timeBetweenCommits.length; k++){
        console.log(timeBetweenCommits[k]);
        total_time += timeBetweenCommits[k];
    }
 */




    /* Converter.json2csv(commitsInfo, (err, csv) => {
        if (err) {
            throw err;
        }
        console.log('Commit Data Pull Complete -> Writing Commit List to CSV');
        fs.writeFileSync('1-commitsInfo.csv',csv);
    })
    Converter.json2csv(sortedCommitsByDate, (err, csv) => {
        if (err) {
            throw err;
        }
        console.log('Commit Data Pull Complete -> Writing Sorted Commit List to CSV');
        fs.writeFileSync('2-sortedCommitsByDate.csv',csv);
    })
    Converter.json2csv(filteredCommitsByUser, (err, csv) => {
        if (err) {
            throw err;
        }
        console.log('Commit Data Pull Complete -> Writing User-Filtered Commit List to CSV');
        fs.writeFileSync('3-filteredCommitsByUser.csv',csv);
    })
    Converter.json2csv(recentCommitsFinal, (err, csv) => {
        if (err) {
            throw err;
        }
        console.log('Commit Data Pull Complete -> Writing final recent commits to CSV');
        fs.writeFileSync('-recentCommitsFinal.csv',csv);
    }) */
}

function comp(a,b) {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
}

function createCSV(obj, name) {
    Converter.json2csv(obj, (err, csv) => {
        if (err) {
            throw err;
        }
        console.log('Writing ' + name + ' to CSV');
        fs.writeFileSync(name + '.csv',csv);
    })
}
