# BACKEND SETUP GUIDE 

## 1. Git pull the repository

## 2. Make sure pip is installed

## 3. Create a virtual environment (.venv) for python packages
    - cd to Backend folder
    - Use the command "python -m venv <the name of the folder, usually '.venv'>"

## 4. Activate virtual environment
    - Use the command ".venv\Scripts\Activate"

## 5. Install packages residing inside the "requirements.txt" file
    - Use the command "pip install -r requirements.txt"

# What to do when installing a new python package/library

## Inform the team

    Before making use of a new library, make to inform the team for possible insights, and transparency.

## Update requirements.txt

    When using a new package, requirements.txt must be updated in order for other devs to keep track. Use the command:
        "pip freeze > requirements.txt" while your virtual environment is ACTIVATED.

## List down the newly used package/library in the Maurealty_Documentation Google Docs
    - https://docs.google.com/document/d/1dsLg1jZyhcZSHiplCnEE1YeuH9zjrx5_eoQr8WUDk_w/edit?tab=t.lhal6556envk

