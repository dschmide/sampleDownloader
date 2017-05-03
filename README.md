This project aims to search and download gitHub repositories written in JavaScript for further analysis.

It is using eslint to look for certain patterns and stores the reports in a local database


Installation
Install using npm install
This project uses the gitHub API. To avoid reaching your free limit, create a .txt file in your directory named “gitHubToken.txt” and copy your personal gitHub token into it
To save the results in a local database, use mysql and create a database called “projektarbeit” with a table called “reports”. To connect to this database, add a textfile called “dbAccess.txt” to this folder and write your password into it. The user should be root at localhost

Usage
node sampledownloader.js opens up a few prompts about your query. After that, the program fetches the Repos and copies them to a folder named “clonedRepos” in the same folder. The eslint node api will automatically lint the repositories and write the results into the local database.
