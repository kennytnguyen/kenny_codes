# kenny_codes

1) Clone directory into a local directory
    e.g.) git clone https://github.com/kennytnguyen/kenny_codes.git
2) Change Directory into 'kenny_codes'


Ensure that node is installed on your machine, we can do this using Homebrew
1) Paste the following into a MacOS Terminal Prompt:
    /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
2) Check that brew is installed with the following command:
    brew -v
3) Once we've confirmed that brew is installed, use the following to install node:
    brew install node

Now that node has been insalled and we're in the primary 'kenny_codes' directory, we can
run the program now. To prepare, please gather the necessary credentials necessary. This will require:
1) a github username
2) a github personal access token
    i) https://github.com/settings/tokens
    ii) Generate or Create a new token
        a) Scopes used / boxes checked: repo, user

After generating a token and having the username handy, we can run the program by entering the following command:

    node input.js

It will prompt the user for their userName and Token. None of this is stored outside of the program. The program will run, write to 4 CSVs for step-wise interrogation for users to understand their data at every step of the way. This is how we manage "signals" at my current company (aside from adding on versioning and 'POR' signals).

Checklist
   
   MVP (~7 hours)
    
        [x] Create CLI requirement to ask for User Credentials (20 minutes)
        [x] Set up API to talk to and authenticate with GitHub (1 hour)
        [x] Pull any set of data then filter later (~2 hours)
            [x] Output Commits in Console
        [x] Sorting & Data Interrogation (2 hours)
            [x] Name
            [x] Data
            [x] 60 Most Recent
        [x] Throw into a CSV (30 minutes)
        [x] Calcuate average time between commits (30 minutes)
        [x] Create README on how to run (20 minutes)

    Nice-to-Haves
        [] Add validations (~2-3 hours)
            [] Is this a proper email
            [] Sorry your info is wrong

        [] Error Handling
            [] Process and catch errors better

        [] Security
            [x] don't store the data outside of the program
            [] create an 'ENV'

        [] create a UI to inquire user for information

        [] Code clean-up
            [] Seperate functions
            [] Handle and manage async functions more cleanly
            [] Less spaghetti-ish code

        [] Use less external libraries?
