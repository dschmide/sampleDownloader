//created for 27.4.17
"use strict"


//var Preferences = require('preferences');

//var _           = require('lodash');
//var git         = require('simple-git')();
//var GitHubApi   = require('github');
//var fs          = require('fs');
//var exec = require('exec')
//var Git = require('nodegit');
//var touch       = require('touch');

//var CLI         = require('clui');
var inquirer    = require('inquirer');
var figlet      = require('figlet');
var clear       = require('clear');
var chalk       = require('chalk');
var GitHub = require('github-api');
var ghdownload = require('github-download')


var maxnumber = 10;
var configUsed = ".eslintrc.js";

var GITHUB_TOKEN = "ThisWillBeYourGitHubToken";
var dbPW = "ThisWillBeYourDBPW";






clear();
console.log(
  chalk.yellow(
    figlet.textSync('Sampler', { horizontalLayout: 'full' })
  )
);


getInput(function(){
});




function getInput(callback) {
  var argv = require('minimist')(process.argv.slice(2));

  var questions = [
    {
    type: 'input',
    name: 'SearchString',
    message: 'Enter a SearchString: (Space to ignore)',
    default: 'Objectoriented'
  },
  {
    type: 'input',
    name: 'language',
    default: "javascript",
    message: 'Enter a preferred Language'
  },
  {
    type: 'input',
    name: 'date',
    default: "2015-01-01",
    message: 'Enter creation or update minimum'
  },
  {
    type: 'input',
    name: 'number',
    default: "10",
    message: 'How many do you want to download'
  },
  {
    type: 'input',
    name: 'configFile',
    default: ".eslintrc.js",
    message: 'which config file to use'
  },

  ];

  inquirer.prompt(questions).then(function(answers) {
    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    var request = new XMLHttpRequest();
    // Set the event handler
    request.onload = printRepoNames;
    // Initialize the request
    if (answers.SearchString == " "){
      request.open('get', 'https://api.github.com/search/repositories?q=language:'+answers.language+'+created:>'+answers.date+'&sort=updated&order=desc', true);
    }else{
      request.open('get', 'https://api.github.com/search/repositories?q='+answers.SearchString+'+language:'+answers.language+'+created:>'+answers.date+'&sort=updated&order=desc', true);
    }// Fire away!
    console.log("fired Request");
    request.send();

    //Set Answers globally for later use
    maxnumber = answers.number;
    configUsed = answers.configFile;
    
  });
}

function printRepoNames() {
  console.log("Printing the Repo Names");
  var responseObj = JSON.parse(this.responseText);
  //console.log(responseObj.items[1].full_name);
  
  console.log("Nr Of Repos in search: " + responseObj.total_count);
  
  console.log("Downloading first " + maxnumber + " Repos");


  var fs = require('fs');

  //Get the gitHub Token from the Textfile
  try {  
      var data = fs.readFileSync('gitHubToken.txt', 'utf8');
      console.log(data);  
      GITHUB_TOKEN = data;
  
  } catch(e) {
      console.log('Error:', e.stack);
  }

  //Start Cloning all the Repos from the Search
  for( var i = 1; i <= maxnumber; i++) {
    var RepoName = responseObj.items[i].name;
    var UserName = responseObj.items[i].owner.login;

    console.log("name Repo: " + responseObj.items[i].name);
    console.log("name User: " + responseObj.items[i].owner.login);
  //DownloadRepos(UserName, RepoName);
  CloneRepos(UserName, RepoName);
}
console.log("Completed Cloning");

analyzeRepos(responseObj);
}

function CloneRepos(inUser, inName) {

  Git.Clone("https://github.com/"+inUser+"/"+inName, "./clonedrepos/"+inName, GITHUB_TOKEN).then(function(repository) {
  // Work with the repository object here.
});
}

function analyzeRepos(inResponse){
  var CLIEngine = require("eslint").CLIEngine,
  linter = require("eslint").linter;

  var cli = new CLIEngine({
    envs: ["node"],
    configFile: configUsed,
  });
  

  console.log("creating connection");
  var mysql = require("mysql");

  //Get the PW Credentials from the Textfile
  try {  
      var data = fs.readFileSync('dbAccess.txt', 'utf8');
      console.log(data);  
      dbPW = data;
  
  } catch(e) {
      console.log('Error:', e.stack);
  }


  // First create a connection to the db
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: dbPW,
    database: "projektarbeit"
  });

con.connect(function(err){
  if(err){
    console.log('Error connecting to Db');
    return;
  }
  console.log('Connection established');


});
  var formatter = cli.getFormatter("json");

  console.log("Linting Files with config: " + configUsed);
    for( var i = 1; i <= maxnumber; i++) {
      var targetDir = inResponse.items[i].name;
      var lintReport = cli.executeOnFiles(["./clonedrepos/"+targetDir+"/."]);

      console.log("Now Linting " + targetDir)
      

      //console.log(lintReport);
      console.log("Detections in this Lint run: " + lintReport.warningCount);

      //Insert the report into the DB
      var insertReport = { 
        report: lintReport, 
        location: targetDir, 
        count: lintReport.warningCount,
        configUsed: configUsed,
        timeOfLint: Math.round(+new Date()/1000)
      };
        con.query('INSERT INTO reports SET ?', insertReport, function(err,res){
          if(err) throw err;
          console.log('Last insert ID:', res.insertId);
        });
    }
    //Close Connection
    con.end(function(err) {
      console.log("conn closed");
      // The connection is terminated gracefully 
    });
}


