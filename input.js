/*
    Checklist
        MVP
        [x] Create CLI requirement to ask for and store User Credentials - Locally per Run
        [x] Set up API to talk to and authenticate with GitHub
        [x] Pull any set of data then filter later
        [] Output 60 Commits in Console
        [x] Throw into a CSV
        [] Sort somewhere

        Nice-to-Haves (if I had / have time)
        [] Add validations / Error Messages
            [] Is this a proper email
            [] Sorry your info is wrong
        [] Security
            [] Maybe don't store the data locally to be accessed
        [] Maybe create a UI
        [] Create README on how to run

    Libraies I might care about for the MVP:
        https://www.npmjs.com/package/objects-to-csv
            good for writing ~ objects ~ to CSV
        http://github-tools.github.io/github/
            wrapper for GitHubs REST API in Node
        https://www.npmjs.com/package/axios
            Barebones REST client
    Input
        Require User to enter in:
            1) Credentials
            2) Authentication Token
    Output
        Pull data on said user's credentials on last 60 commits
*/

const inquirer = require('inquirer');
const GitHub = require('github-api');
const Converter = require ('json-2-csv');
const axios = require ('axios');
const fs = require('fs');
const { connect } = require('http2');
const { throwError } = require('rxjs');


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
    })
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

    console.log(user.__apiBase);


    getRepos = await user.listRepos()
        .then((result => {
            return result;
        }));

    console.log(userName + ' has ' + getRepos.data.length + ' total repos');

    const repoData = getRepos.data;

    var repoInfo = new Array();

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
        processCommits(repoInfo, userName, userToken);
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

async function processCommits(repoInfo, userName, userToken) {
    console.log('Starting Commits Pull, Reading from Repos Info');

    /* Lets try using a different way to authenticate / using Axios */

    var commitsInfo = new Array();
    var i;
    for (i = 0; i < repoInfo.length; i++){
        var commit_url = repoInfo[i].commit_url;
        var pageNumber = 1;
        /* Track pageNumber because limits at 30 */

        /* Use page parameter to retrieve all commits */

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
                console.log(result);
                return result;
            })
            .catch(function (result) {
                //handle error
                console.log(result);
            });

            /* https://docs.github.com/en/rest/reference/repos#get-a-commit */
            const parseCommit = response.data;
            parseCommit.forEach(element => {
                var data = {
                    id: element.node_id,
                    sha: element.sha,
                    date: element.commit.committer.date,
                    committer: element.commit.committer.name,
                    messaage: element.commit.message
                }
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
    }

    Converter.json2csv(commitsInfo, (err, csv) => {
        if (err) {
            throw err;
        }
        console.log('Writing Commit List to CSV');
        fs.writeFileSync('commitsInfo.csv',csv);
    })
}
