import os
import pandas as pd
import tiktoken
import asyncio
from graphrag.query.indexer_adapters import read_indexer_entities, read_indexer_reports
from graphrag.query.llm.oai.chat_openai import ChatOpenAI
from graphrag.query.llm.oai.typing import OpenaiApiType
from graphrag.query.structured_search.global_search.community_context import GlobalCommunityContext
from graphrag.query.structured_search.global_search.search import GlobalSearch
from dotenv import load_dotenv

from graphrag.query.context_builder.entity_extraction import EntityVectorStoreKey
from graphrag.query.indexer_adapters import (
    read_indexer_covariates,
    read_indexer_entities,
    read_indexer_relationships,
    read_indexer_reports,
    read_indexer_text_units,
)
from graphrag.query.input.loaders.dfs import (
    store_entity_semantic_embeddings,
)
from graphrag.query.llm.oai.chat_openai import ChatOpenAI
from graphrag.query.llm.oai.embedding import OpenAIEmbedding
from graphrag.query.llm.oai.typing import OpenaiApiType
from graphrag.query.question_gen.local_gen import LocalQuestionGen
from graphrag.query.structured_search.local_search.mixed_context import (
    LocalSearchMixedContext,
)
from graphrag.query.structured_search.local_search.search import LocalSearch
from graphrag.vector_stores.lancedb import LanceDBVectorStore

# Rough and dirty code

# verify if graphrag index exists for a book.
load_dotenv('./config/.env')

def verify_graphrag_index(book_name):
    # Get the base path from the environment variable  
    base_path = os.getenv('graph_index_path')
    if not base_path:
        raise ValueError("graph_index_path environment variable not set in env file.")  
    
    # Construct the full path based on the provided book_name  
    folder_name, extension = os.path.splitext(book_name)
    path = os.path.join(base_path, folder_name)  
      
    # Check if the directory exists  
    return os.path.exists(path) and os.path.isdir(path) 



def find_artifacts_folder(index_path):  
    for root, dirs, files in os.walk(index_path):  
        if 'artifacts' in dirs:  
            return os.path.join(root, 'artifacts')  
    return None  

async def graphchat(question , book_name, searchType):

# Initial settings
    load_dotenv('./config/.env')
    
    llm_model = os.getenv("llm_model")
    api_base = os.getenv("api_base")
    api_version = os.getenv("api_version")
    api_key = os.getenv("api_key")
    embedding_model = os.getenv("embedding_model")

    llm = ChatOpenAI(
        api_key=api_key,
        model=llm_model,
        api_type=OpenaiApiType.AzureOpenAI,  # OpenaiApiType.OpenAI or OpenaiApiType.AzureOpenAI
        api_base=api_base,
        api_version=api_version,
        max_retries=20,
    )

    token_encoder = tiktoken.get_encoding("cl100k_base")


    text_embedder = OpenAIEmbedding(
        api_key=api_key,
        api_type=OpenaiApiType.AzureOpenAI,
        api_base=api_base,
        api_version=api_version,
        model=embedding_model,
        deployment_name=embedding_model,
        max_retries=20,
    )

    index_exists = verify_graphrag_index(book_name)
    if index_exists:  
        print(f"The folder for '{book_name}' exists.")  
        book_name, extension = os.path.splitext(book_name)

        print(f"foldername without extension: {book_name}")

        index_path = os.getenv('graph_index_path')

        index_path = os.path.join(index_path, book_name)
        print(f"index_path after joining bookname without extenesion: {index_path}")
        INPUT_DIR = find_artifacts_folder(index_path)
        print(f"INPUT_DIR for Selected index is : {INPUT_DIR}")


        COMMUNITY_REPORT_TABLE = "create_final_community_reports"
        ENTITY_TABLE = "create_final_nodes"
        ENTITY_EMBEDDING_TABLE = "create_final_entities"
        LANCEDB_URI = f"{INPUT_DIR}/lancedb"


        RELATIONSHIP_TABLE = "create_final_relationships"
        COVARIATE_TABLE = "create_final_covariates"
        TEXT_UNIT_TABLE = "create_final_text_units"
        COMMUNITY_LEVEL = 2

        entity_df = pd.read_parquet(f"{INPUT_DIR}/{ENTITY_TABLE}.parquet")
        report_df = pd.read_parquet(f"{INPUT_DIR}/{COMMUNITY_REPORT_TABLE}.parquet")
        entity_embedding_df = pd.read_parquet(f"{INPUT_DIR}/{ENTITY_EMBEDDING_TABLE}.parquet")

        reports = read_indexer_reports(report_df, entity_df, COMMUNITY_LEVEL)
        entities = read_indexer_entities(entity_df, entity_embedding_df, COMMUNITY_LEVEL)
        print(f"Report records: {len(report_df)}")

        # load description embeddings to an in-memory lancedb vectorstore
        # to connect to a remote db, specify url and port values.
        description_embedding_store = LanceDBVectorStore(
            collection_name="entity_description_embeddings",
        )
        description_embedding_store.connect(db_uri=LANCEDB_URI)
        entity_description_embeddings = store_entity_semantic_embeddings(
            entities=entities, vectorstore=description_embedding_store
        )

        relationship_df = pd.read_parquet(f"{INPUT_DIR}/{RELATIONSHIP_TABLE}.parquet")
        relationships = read_indexer_relationships(relationship_df)

        print(f"Relationship count: {len(relationship_df)}")

        text_unit_df = pd.read_parquet(f"{INPUT_DIR}/{TEXT_UNIT_TABLE}.parquet")
        text_units = read_indexer_text_units(text_unit_df)

        print(f"Text unit records: {len(text_unit_df)}")

        if searchType == "global":
            print("Global search")
            context_builder = GlobalCommunityContext(
                community_reports=reports,
                entities=entities,  # default to None if you don't want to use community weights for ranking
                token_encoder=token_encoder,
            )

            context_builder_params = {
                "use_community_summary": False,  # False means using full community reports. True means using community short summaries.
                "shuffle_data": True,
                "include_community_rank": True,
                "min_community_rank": 0,
                "community_rank_name": "rank",
                "include_community_weight": True,
                "community_weight_name": "occurrence weight",
                "normalize_community_weight": True,
                "max_tokens": 12_000,  # change this based on the token limit you have on your model (if you are using a model with 8k limit, a good setting could be 5000)
                "context_name": "Reports",
            }

            map_llm_params = {
                "max_tokens": 1000,
                "temperature": 0.0,
                "response_format": {"type": "json_object"},
            }

            reduce_llm_params = {
                "max_tokens": 2000,  # change this based on the token limit you have on your model (if you are using a model with 8k limit, a good setting could be 1000-1500)
                "temperature": 0.0,
            }

            search_engine = GlobalSearch(
                llm=llm,
                context_builder=context_builder,
                token_encoder=token_encoder,
                max_data_tokens=12_000,  # change this based on the token limit you have on your model (if you are using a model with 8k limit, a good setting could be 5000)
                map_llm_params=map_llm_params,
                reduce_llm_params=reduce_llm_params,
                allow_general_knowledge=False,  # set this to True will add instruction to encourage the LLM to incorporate general knowledge in the response, which may increase hallucinations, but could be useful in some use cases.
                json_mode=True,  # set this to False if your LLM model does not support JSON mode.
                context_builder_params=context_builder_params,
                concurrent_coroutines=32,
                response_type="multiple paragraphs",  # free form text describing the response type and format, can be anything, e.g. prioritized list, single paragraph, multiple paragraphs, multiple-page report
            )

            result = await search_engine.asearch(
                #"Character Analysis of Antagonists and Protagonists in The Jungle Book"
                question
            )

            print(result.response)
            # print(result.context_data["reports"])
            # print(type(result.context_data["reports"]))
            print(result.completion_time)
            print(result.llm_calls)
            print(result.prompt_tokens)
            #return result.response
            return result
        
        elif searchType == "local":
            print("Local search")

            context_builder = LocalSearchMixedContext(
            community_reports=reports,
            text_units=text_units,
            entities=entities,
            relationships=relationships,
            # if you did not run covariates during indexing, set this to None
            covariates=None,
            entity_text_embeddings=description_embedding_store,
            embedding_vectorstore_key=EntityVectorStoreKey.ID,  # if the vectorstore uses entity title as ids, set this to EntityVectorStoreKey.TITLE
            text_embedder=text_embedder,
            token_encoder=token_encoder,
            )

            # text_unit_prop: proportion of context window dedicated to related text units
            # community_prop: proportion of context window dedicated to community reports.
            # The remaining proportion is dedicated to entities and relationships. Sum of text_unit_prop and community_prop should be <= 1
            # conversation_history_max_turns: maximum number of turns to include in the conversation history.
            # conversation_history_user_turns_only: if True, only include user queries in the conversation history.
            # top_k_mapped_entities: number of related entities to retrieve from the entity description embedding store.
            # top_k_relationships: control the number of out-of-network relationships to pull into the context window.
            # include_entity_rank: if True, include the entity rank in the entity table in the context window. Default entity rank = node degree.
            # include_relationship_weight: if True, include the relationship weight in the context window.
            # include_community_rank: if True, include the community rank in the context window.
            # return_candidate_context: if True, return a set of dataframes containing all candidate entity/relationship/covariate records that
            # could be relevant. Note that not all of these records will be included in the context window. The "in_context" column in these
            # dataframes indicates whether the record is included in the context window.
            # max_tokens: maximum number of tokens to use for the context window.


            local_context_params = {
                "text_unit_prop": 0.5,
                "community_prop": 0.1,
                "conversation_history_max_turns": 5,
                "conversation_history_user_turns_only": True,
                "top_k_mapped_entities": 10,
                "top_k_relationships": 10,
                "include_entity_rank": True,
                "include_relationship_weight": True,
                "include_community_rank": False,
                "return_candidate_context": False,
                "embedding_vectorstore_key": EntityVectorStoreKey.ID,  # set this to EntityVectorStoreKey.TITLE if the vectorstore uses entity title as ids
                "max_tokens": 12_000,  # change this based on the token limit you have on your model (if you are using a model with 8k limit, a good setting could be 5000)
            }

            llm_params = {
                "max_tokens": 2_000,  # change this based on the token limit you have on your model (if you are using a model with 8k limit, a good setting could be 1000=1500)
                "temperature": 0.0,
            }

            search_engine = LocalSearch(
            llm=llm,
            context_builder=context_builder,
            token_encoder=token_encoder,
            llm_params=llm_params,
            context_builder_params=local_context_params,
            response_type="multiple paragraphs",  # free form text describing the response type and format, can be anything, e.g. prioritized list, single paragraph, multiple paragraphs, multiple-page report
        )

            result = await search_engine.asearch(question)
            print(result.response)
            print(result.completion_time)
            print(result.llm_calls)
            print(result.prompt_tokens)
            return result

    else:  
        print(f"The Chat data for '{book_name}' does not exist.") 
        return_message = f"The chat graph for '{book_name}' does not exist. Please build the index first."
        return return_message
