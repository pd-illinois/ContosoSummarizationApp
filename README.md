# Contoso Graph Based Summarization and Chat 
- This application takes docx files and creates a detailed summary for that book. 
- The summary is divided into various parts, like title , synopsis , characters , reading guide and plot summaries etc.
- It is suitable to generate summaries books, novels , fiction , non fiction etc.
- The application also allows graph based conversation (based on GraphRAG)
- Future work included adding agentic conversation for the books.

# Implementation Steps.
- Recommended to use a python enviroment or conda envrionment with Python version 3.10+
- Clone this repo and install dependencies from requirements.txt
- Edit the config\.env file with details
- Edit \graphrag_indexer\graphrag\settings.yaml with your Azure OpenAI Connection, Model Name , API version and Embedding Model Name
- Edit \graphrag_indexer\graphrag\.env with Azure OpenAI Key
- Edit \graphrag_indexer\graphrag\.source.env with relevant details.
- Go to the Contoso_Summarization_Tool directory and run the flask application via python app.py command on your terminal.

# Current Scope
docx books

# Key references
- GraphRag
- Langgraph
- Books from [Project Gutenberg](https://www.gutenberg.org/)

# Author / Contributors
Steve Vassalo @cincyvassallo
Eric Jadi @erjadi
Prateek Dhiman
