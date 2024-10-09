import os
import subprocess
import glob
import yaml
import graphrag
import shutil
#import docx2txt
from dotenv import load_dotenv
from graphrag_chat import verify_graphrag_index
from docx import Document  
import sys


import os  
from docx import Document  
  
def convert_to_txt(file_path, document_name):  
    load_dotenv('./config/.env')

    txt_dir = os.getenv('txt_dir')
    print(f"txt_dir for convered files: {txt_dir}")
    # Get the directory of the input file  
    #output_directory = os.path.dirname(file_path)  
    output_directory = txt_dir
    output_filename = document_name.replace(".docx", ".txt")  
      
    # Create the full output path  
    output_file_path = os.path.join(output_directory, output_filename)  
      
    print(f"convert_to_txt output_file_path: {output_file_path}")  
      
    if os.path.exists(file_path):
        if file_path.endswith('.docx'):
            try:
                doc = Document(file_path)
                with open(output_file_path, 'wb') as txt_file:
                    for para in doc.paragraphs:
                        try:
                            txt_file.write((para.text + '\n').encode('utf-8'))
                        except UnicodeEncodeError as e:
                            print(f"UnicodeEncodeError: {e}")
                            print(f"Problematic character: {para.text[e.start:e.end]}")
            except Exception as e:
                print(f"An error occurred while processing the DOCX file: {e}")
        else:
            print("The specified file is not a DOCX file.")
    else:
        print("File does not exist at the specified path.")


def create_chat_index(document_name): 
    print("-- GraphRAH Chat Indexer Starting--")
    print(os.getcwd())
    print(f"Book '{document_name}' received for indexing.")
    print(sys.getdefaultencoding())
    
    # Check if the document exists in the uploads folder 
    load_dotenv('./config/.env')
    grag_dir = os.getenv('graph_index_path') 
    flask_dir = os.getenv('flask_dir')

    uploads_folder = os.path.join(flask_dir, "uploads") 
    document_path = os.path.join(uploads_folder, document_name) 
    print(f"Document path: {document_path}") 
    
    if not os.path.exists(document_path):  
        print(f"Document '{document_name}' does not exist in the uploads folder.")  
        return  

    # Converting docx to txt
    convert_to_txt(document_path , document_name)

    # updating document path to point to converted txt file
    document_name = document_name.replace(".docx", ".txt")

    txt_dir = os.getenv('txt_dir')
    #document_path = os.path.join(uploads_folder, document_name)
    document_path = os.path.join(txt_dir, document_name) 

    

    index_exists = verify_graphrag_index(document_name)

    if index_exists:
        print(f"Index already exists for '{document_name}'.")
        return
    else:
        print(f"Index does not exist for '{document_name}'.")
        print(f"Creating index for '{document_name}'...")

        index_name = document_name.replace(".docx", "")
        index_name = document_name.replace(".txt", "")
        print(f"Index directory name: {index_name}")
        index_dir = os.path.join(grag_dir, index_name)
        print(f"Index directory: {index_dir}")
        
        input_directory = os.path.join(grag_dir, index_name, "input") 
        print(f"Input directory: {input_directory}")

        ## Manual GrapgRAG Initialization 

        os.makedirs(input_directory, exist_ok=True)
        shutil.copy(document_path, input_directory)
        print(f"Document '{document_name}' copied to '{input_directory}'") 
        env_file = os.path.join(grag_dir, "graphrag/.env") 
        if os.path.exists(env_file):
            print(f"env file exists")
            shutil.copy(env_file, index_dir)
        settings_file = os.path.join(grag_dir, "graphrag/settings.yaml")
        if os.path.exists(settings_file):
            print(f"settings file exists")
            shutil.copy(settings_file, index_dir)
        prompt_folder = os.path.join(grag_dir, "graphrag/prompts")
        if os.path.exists(prompt_folder):
            print(f"prompt folder exists")
            shutil.copytree(prompt_folder, os.path.join(index_dir, "prompts"))

        # Auto Prompt Tuning 

        
        command_promptune = f"python -m graphrag.prompt_tune --root {index_dir} --config {index_dir}/settings.yaml --no-entity-types"

        print(f"Trying to Autotune prompts based on selected book: {command_promptune}")
        return_code = os.system(command_promptune)  
        if return_code == 0:  
            print("command_promptune ran successfully.")  
        else:  
            print(f"command_promptune failed with return code: {return_code}")
        
        # Buidling the index    
        command = f"python -m graphrag.index --root "+index_dir
        print(f"Trying to Run Command: {command}")
        return_code = os.system(command)  
        if return_code == 0:  
            print("Command ran successfully.")  
        else:  
            print(f"Command failed with return code: {return_code}")
        return print("Indexing complete")
