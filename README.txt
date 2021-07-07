Framework: Node.js 
Editor: Visual Studio Code, Notepad ++
Database: PostgreSQL version 11.2 

About the Application:
A task matching application to facilitate users to hire temporary help to complete certain tasks.
Each user will be able to perform use cases of both Task Requesters and Taskers. 
Tasks can be requests (invitation sent directly to taskers for them to take up the offer) / listings (open for bidding)

SET-UP: 

1. Set up database
	- Download PostgreSQL version 11.2
		- Configure with these details:
			user: 'postgres',
   			host: 'localhost',
    			database: 'cs2102project',
    			password: '********',
    			port: 5432
	- Windows: Download pgAdmin4 for viewing tables in database

2. Extract the zipped folder into local directory.

3. On PSQL:
	postgres=# create database cs2102project; 
	CREATE DATABASE
	postgres=# \c midterm
	You are now connected to database "cs2102project" as user "postgres"
	cs2102project=# \i projectInit.sql

4. On Command Prompt: 
	- Navigate to project folder
 	- Start the application using 'nodemon' as the command 
	- "Server started on port 3000.." will appear
	
5. Go to browser "http://localhost:3000/" to view the application 
	- Using the 'register' button, create an administrator account with the username 'admin' 
	- (The administrator will be able to send emails to users, and create/delete task categories)
	- Subsequently, create acccount with any other username and you are good to go!
