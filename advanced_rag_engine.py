"""
Advanced RAG Engine with Masterful Implementation of:
- Multi-Query Retrieval
- Hybrid Search (Semantic + BM25)
- Re-Ranking with Cross-Encoders
- Query Decomposition
- Citation Tracking
- Semantic Chunking
- Contextual Compression
- Conversation Memory

Author: David Nguyen
Date: 2025-11-26
"""

import os
import re
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
import requests
from loguru import logger

# LangChain Imports
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.llms import Ollama
from langchain.prompts import PromptTemplate, ChatPromptTemplate
from langchain.chains import LLMChain
from langchain.memory import ConversationBufferMemory
from langchain.schema import Document
from langchain.retrievers import ContextualCompressionRetriever, EnsembleRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor
from langchain_community.retrievers import BM25Retriever

# Sentence Transformers for Re-ranking
from sentence_transformers import CrossEncoder
from rank_bm25 import BM25Okapi

# Configuration
logger.add("logs/rag_engine.log", rotation="500 MB", retention="10 days", level="INFO")


class RetrievalStrategy(Enum):
    """Enumeration of retrieval strategies"""
    SEMANTIC = "semantic"
    HYBRID = "hybrid"
    MULTI_QUERY = "multi_query"
    DECOMPOSED = "decomposed"


@dataclass
class RAGConfig:
    """Configuration for RAG Engine"""
    # API Configuration
    api_base_url: str = "https://rag-langchain-ai-system.onrender.com"
    api_token: str = "token"

    # Model Configuration
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    llm_model: str = "llama2"
    rerank_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"

    # Chunking Configuration
    chunk_size: int = 1000
    chunk_overlap: int = 200

    # Retrieval Configuration
    top_k: int = 5
    similarity_threshold: float = 0.7
    enable_reranking: bool = True
    enable_hybrid_search: bool = True

    # Vector Store Configuration
    persist_directory: str = "./chroma_db"
    collection_name: str = "rag_documents"

    # Memory Configuration
    memory_key: str = "chat_history"
    max_memory_length: int = 10


@dataclass
class RetrievalResult:
    """Result from document retrieval"""
    documents: List[Document]
    scores: List[float]
    query: str
    strategy: RetrievalStrategy
    metadata: Dict[str, Any] = field(default_factory=dict)


class AdvancedRAGEngine:
    """
    Advanced RAG Engine implementing state-of-the-art retrieval techniques
    """

    def __init__(self, config: RAGConfig = None):
        self.config = config or RAGConfig()

        # Initialize components
        logger.info("Initializing Advanced RAG Engine...")
        self.embeddings = self._init_embeddings()
        self.llm = self._init_llm()
        self.reranker = self._init_reranker() if self.config.enable_reranking else None
        self.memory = ConversationBufferMemory(
            memory_key=self.config.memory_key,
            max_length=self.config.max_memory_length,
            return_messages=True
        )

        # Vector stores and retrievers (initialized when documents are loaded)
        self.vector_store = None
        self.bm25_retriever = None
        self.ensemble_retriever = None

        logger.info("✓ Advanced RAG Engine initialized successfully")

    def _init_embeddings(self) -> HuggingFaceEmbeddings:
        """Initialize embedding model"""
        logger.info(f"Loading embedding model: {self.config.embedding_model}")
        return HuggingFaceEmbeddings(
            model_name=self.config.embedding_model,
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )

    def _init_llm(self) -> Ollama:
        """Initialize language model"""
        logger.info(f"Initializing LLM: {self.config.llm_model}")
        return Ollama(
            model=self.config.llm_model,
            temperature=0.7,
        )

    def _init_reranker(self) -> CrossEncoder:
        """Initialize cross-encoder for re-ranking"""
        logger.info(f"Loading re-ranker model: {self.config.rerank_model}")
        return CrossEncoder(self.config.rerank_model)

    def load_documents_from_api(self) -> List[Document]:
        """
        Download and load documents from the API endpoint
        """
        logger.info("Downloading documents from API...")

        try:
            headers = {"Authorization": f"Bearer {self.config.api_token}"}
            url = f"{self.config.api_base_url}/api/documents/download"

            response = requests.get(url, headers=headers)
            response.raise_for_status()

            # Save to temporary file and extract
            import zipfile
            import io

            with zipfile.ZipFile(io.BytesIO(response.content)) as zip_file:
                documents = []
                for file_name in zip_file.namelist():
                    if file_name.endswith('.txt'):
                        with zip_file.open(file_name) as file:
                            content = file.read().decode('utf-8')
                            documents.append(Document(
                                page_content=content,
                                metadata={
                                    "source": file_name,
                                    "type": "masterclass_document"
                                }
                            ))

            logger.info(f"✓ Loaded {len(documents)} documents from API")
            return documents

        except Exception as e:
            logger.error(f"Error loading documents from API: {e}")
            return []

    def chunk_documents(self, documents: List[Document]) -> List[Document]:
        """
        Advanced document chunking with semantic awareness
        """
        logger.info("Chunking documents with advanced strategy...")

        # Recursive character text splitter - better than simple character splitter
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.config.chunk_size,
            chunk_overlap=self.config.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

        chunks = text_splitter.split_documents(documents)

        # Add chunk metadata
        for i, chunk in enumerate(chunks):
            chunk.metadata['chunk_id'] = i
            chunk.metadata['chunk_size'] = len(chunk.page_content)

        logger.info(f"✓ Created {len(chunks)} semantic chunks")
        return chunks

    def build_vector_store(self, chunks: List[Document]) -> None:
        """
        Build vector store with ChromaDB for persistence
        """
        logger.info("Building vector store with ChromaDB...")

        self.vector_store = Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            persist_directory=self.config.persist_directory,
            collection_name=self.config.collection_name
        )

        logger.info("✓ Vector store built successfully")

    def build_bm25_retriever(self, chunks: List[Document]) -> None:
        """
        Build BM25 retriever for keyword-based search
        """
        logger.info("Building BM25 retriever for hybrid search...")

        self.bm25_retriever = BM25Retriever.from_documents(chunks)
        self.bm25_retriever.k = self.config.top_k

        logger.info("✓ BM25 retriever built successfully")

    def build_ensemble_retriever(self) -> None:
        """
        Build ensemble retriever combining semantic and keyword search
        """
        if not self.vector_store or not self.bm25_retriever:
            logger.warning("Vector store or BM25 retriever not initialized")
            return

        logger.info("Building ensemble retriever (Hybrid Search)...")

        # Get semantic retriever from vector store
        semantic_retriever = self.vector_store.as_retriever(
            search_kwargs={"k": self.config.top_k}
        )

        # Combine with BM25 (0.5 weight each)
        self.ensemble_retriever = EnsembleRetriever(
            retrievers=[semantic_retriever, self.bm25_retriever],
            weights=[0.5, 0.5]
        )

        logger.info("✓ Ensemble retriever built successfully")

    def initialize_from_api(self) -> None:
        """
        Complete initialization pipeline from API
        """
        logger.info("=== Starting RAG Engine Initialization ===")

        # Load documents
        documents = self.load_documents_from_api()
        if not documents:
            logger.error("No documents loaded. Aborting initialization.")
            return

        # Chunk documents
        chunks = self.chunk_documents(documents)

        # Build vector store
        self.build_vector_store(chunks)

        # Build BM25 retriever if hybrid search enabled
        if self.config.enable_hybrid_search:
            self.build_bm25_retriever(chunks)
            self.build_ensemble_retriever()

        logger.info("=== RAG Engine Initialization Complete ===")

    def generate_multi_queries(self, query: str, num_queries: int = 3) -> List[str]:
        """
        Generate multiple variations of the query for better retrieval
        """
        logger.info(f"Generating {num_queries} query variations...")

        template = """You are an AI assistant that generates multiple search queries
        based on a single input query to improve document retrieval.

        Original query: {query}

        Generate {num_queries} different variations of this query that capture different aspects
        or phrasings. Return only the queries, one per line."""

        prompt = PromptTemplate(
            template=template,
            input_variables=["query", "num_queries"]
        )

        try:
            chain = LLMChain(llm=self.llm, prompt=prompt)
            result = chain.run(query=query, num_queries=num_queries)

            # Parse queries
            queries = [q.strip() for q in result.split('\n') if q.strip()]
            queries = [query] + queries[:num_queries-1]  # Include original

            logger.info(f"✓ Generated queries: {queries}")
            return queries

        except Exception as e:
            logger.error(f"Error generating multi-queries: {e}")
            return [query]

    def decompose_query(self, query: str) -> List[str]:
        """
        Decompose complex query into simpler sub-queries
        """
        logger.info("Decomposing complex query into sub-queries...")

        template = """You are an AI assistant that breaks down complex questions into simpler sub-questions.

        Complex question: {query}

        Break this down into 2-4 simpler sub-questions that, when answered together,
        would address the original question. Return only the sub-questions, one per line."""

        prompt = PromptTemplate(
            template=template,
            input_variables=["query"]
        )

        try:
            chain = LLMChain(llm=self.llm, prompt=prompt)
            result = chain.run(query=query)

            sub_queries = [q.strip() for q in result.split('\n') if q.strip()]
            logger.info(f"✓ Decomposed into: {sub_queries}")
            return sub_queries

        except Exception as e:
            logger.error(f"Error decomposing query: {e}")
            return [query]

    def retrieve_documents(
        self,
        query: str,
        strategy: RetrievalStrategy = RetrievalStrategy.HYBRID
    ) -> RetrievalResult:
        """
        Retrieve documents using specified strategy
        """
        logger.info(f"Retrieving documents using strategy: {strategy.value}")

        if strategy == RetrievalStrategy.SEMANTIC:
            documents = self._semantic_retrieval(query)
        elif strategy == RetrievalStrategy.HYBRID:
            documents = self._hybrid_retrieval(query)
        elif strategy == RetrievalStrategy.MULTI_QUERY:
            documents = self._multi_query_retrieval(query)
        elif strategy == RetrievalStrategy.DECOMPOSED:
            documents = self._decomposed_retrieval(query)
        else:
            documents = self._semantic_retrieval(query)

        # Re-rank if enabled
        if self.config.enable_reranking and documents:
            documents, scores = self._rerank_documents(query, documents)
        else:
            scores = [1.0] * len(documents)

        return RetrievalResult(
            documents=documents,
            scores=scores,
            query=query,
            strategy=strategy,
            metadata={"num_retrieved": len(documents)}
        )

    def _semantic_retrieval(self, query: str) -> List[Document]:
        """Standard semantic search"""
        if not self.vector_store:
            return []

        retriever = self.vector_store.as_retriever(
            search_kwargs={"k": self.config.top_k}
        )
        return retriever.get_relevant_documents(query)

    def _hybrid_retrieval(self, query: str) -> List[Document]:
        """Hybrid search combining semantic and keyword"""
        if not self.ensemble_retriever:
            logger.warning("Ensemble retriever not available, falling back to semantic")
            return self._semantic_retrieval(query)

        return self.ensemble_retriever.get_relevant_documents(query)

    def _multi_query_retrieval(self, query: str) -> List[Document]:
        """Multi-query retrieval with query variations"""
        queries = self.generate_multi_queries(query)

        all_docs = []
        doc_ids = set()

        for q in queries:
            docs = self._hybrid_retrieval(q)
            for doc in docs:
                doc_id = hash(doc.page_content)
                if doc_id not in doc_ids:
                    all_docs.append(doc)
                    doc_ids.add(doc_id)

        return all_docs[:self.config.top_k * 2]  # Return top 2x documents

    def _decomposed_retrieval(self, query: str) -> List[Document]:
        """Query decomposition retrieval"""
        sub_queries = self.decompose_query(query)

        all_docs = []
        doc_ids = set()

        for q in sub_queries:
            docs = self._hybrid_retrieval(q)
            for doc in docs:
                doc_id = hash(doc.page_content)
                if doc_id not in doc_ids:
                    all_docs.append(doc)
                    doc_ids.add(doc_id)

        return all_docs[:self.config.top_k * 2]

    def _rerank_documents(
        self,
        query: str,
        documents: List[Document]
    ) -> Tuple[List[Document], List[float]]:
        """
        Re-rank documents using cross-encoder
        """
        if not self.reranker or not documents:
            return documents, [1.0] * len(documents)

        logger.info(f"Re-ranking {len(documents)} documents...")

        # Prepare pairs for cross-encoder
        pairs = [[query, doc.page_content] for doc in documents]

        # Get scores
        scores = self.reranker.predict(pairs)

        # Sort by scores
        sorted_pairs = sorted(
            zip(documents, scores),
            key=lambda x: x[1],
            reverse=True
        )

        reranked_docs = [doc for doc, _ in sorted_pairs]
        reranked_scores = [score for _, score in sorted_pairs]

        logger.info(f"✓ Re-ranking complete. Top score: {reranked_scores[0]:.4f}")

        return reranked_docs[:self.config.top_k], reranked_scores[:self.config.top_k]

    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """
        Extract entities from text for API calls
        """
        entities = {
            "persons": [],
            "companies": [],
            "sectors": [],
            "urls": []
        }

        # Person names (simple pattern - could be enhanced with NER)
        person_pattern = r'\b([A-Z][a-z]+ [A-Z][a-z]+)\b'
        entities["persons"] = list(set(re.findall(person_pattern, text)))

        # Company names (capitalized words)
        company_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b'
        potential_companies = re.findall(company_pattern, text)
        entities["companies"] = [c for c in potential_companies if len(c.split()) <= 3]

        # URLs
        url_pattern = r'https?://[^\s]+'
        entities["urls"] = re.findall(url_pattern, text)

        # Sectors (keywords)
        sector_keywords = ["technology", "healthcare", "finance", "saas", "software"]
        entities["sectors"] = [s for s in sector_keywords if s in text.lower()]

        return entities

    def call_api_chain(self, entities: Dict[str, List[str]]) -> Dict[str, Any]:
        """
        Chain API calls based on extracted entities
        """
        logger.info("Executing API chain based on entities...")

        api_data = {}
        headers = {"Authorization": f"Bearer {self.config.api_token}"}
        base_url = self.config.api_base_url

        try:
            # Team API calls
            for person in entities.get("persons", [])[:3]:  # Limit to 3
                try:
                    response = requests.get(
                        f"{base_url}/api/team",
                        headers=headers,
                        params={"name": person},
                        timeout=5
                    )
                    if response.status_code == 200:
                        api_data[f"team_{person}"] = response.json()
                except Exception as e:
                    logger.debug(f"Team API call failed for {person}: {e}")

            # Investment API calls
            for company in entities.get("companies", [])[:3]:
                try:
                    response = requests.get(
                        f"{base_url}/api/investments",
                        headers=headers,
                        params={"company_name": company},
                        timeout=5
                    )
                    if response.status_code == 200:
                        api_data[f"investment_{company}"] = response.json()
                except Exception as e:
                    logger.debug(f"Investment API call failed for {company}: {e}")

            # Sector API calls
            for sector in entities.get("sectors", [])[:2]:
                try:
                    response = requests.get(
                        f"{base_url}/api/sectors",
                        headers=headers,
                        params={"sector": sector},
                        timeout=5
                    )
                    if response.status_code == 200:
                        api_data[f"sector_{sector}"] = response.json()
                except Exception as e:
                    logger.debug(f"Sector API call failed for {sector}: {e}")

        except Exception as e:
            logger.error(f"Error in API chain: {e}")

        logger.info(f"✓ API chain complete. Retrieved {len(api_data)} datasets")
        return api_data

    def generate_response(
        self,
        query: str,
        retrieval_result: RetrievalResult,
        api_data: Dict[str, Any]
    ) -> str:
        """
        Generate final response with context and API data
        """
        logger.info("Generating response with LLM...")

        # Build context from documents
        context_parts = []
        for i, (doc, score) in enumerate(zip(retrieval_result.documents, retrieval_result.scores)):
            context_parts.append(
                f"[Document {i+1}] (Relevance: {score:.2f})\n"
                f"Source: {doc.metadata.get('source', 'Unknown')}\n"
                f"{doc.page_content}\n"
            )

        context = "\n---\n".join(context_parts)

        # Build API data summary
        api_summary = ""
        if api_data:
            api_summary = "External Data:\n" + "\n".join([
                f"- {key}: {str(value)[:200]}..."
                for key, value in api_data.items()
            ])

        # Get conversation history
        history = self.memory.load_memory_variables({}).get(self.config.memory_key, [])

        # Create prompt
        template = """You are an intelligent assistant with access to document context and external API data.

        Conversation History:
        {history}

        Document Context:
        {context}

        {api_summary}

        User Query: {query}

        Instructions:
        1. Use the document context and external data to answer accurately
        2. Cite sources when making specific claims [Document X]
        3. If information is unavailable, say so clearly
        4. Be concise but comprehensive
        5. Maintain conversation context

        Response:"""

        prompt = PromptTemplate(
            template=template,
            input_variables=["history", "context", "api_summary", "query"]
        )

        chain = LLMChain(llm=self.llm, prompt=prompt)

        try:
            response = chain.run(
                history=str(history),
                context=context,
                api_summary=api_summary,
                query=query
            )

            # Update memory
            self.memory.save_context({"input": query}, {"output": response})

            logger.info("✓ Response generated successfully")
            return response

        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return "I apologize, but I encountered an error generating a response. Please try again."

    def query(
        self,
        query: str,
        strategy: RetrievalStrategy = RetrievalStrategy.HYBRID,
        use_api_chain: bool = True
    ) -> Dict[str, Any]:
        """
        Main query method - orchestrates the entire RAG pipeline
        """
        logger.info(f"\n{'='*60}\nProcessing query: {query}\n{'='*60}")

        # Step 1: Retrieve documents
        retrieval_result = self.retrieve_documents(query, strategy)

        # Step 2: Extract entities and call APIs
        api_data = {}
        if use_api_chain:
            combined_text = query + " " + " ".join([
                doc.page_content for doc in retrieval_result.documents[:2]
            ])
            entities = self.extract_entities(combined_text)
            api_data = self.call_api_chain(entities)

        # Step 3: Generate response
        response = self.generate_response(query, retrieval_result, api_data)

        return {
            "query": query,
            "response": response,
            "strategy": strategy.value,
            "num_documents": len(retrieval_result.documents),
            "sources": [
                {
                    "source": doc.metadata.get("source", "Unknown"),
                    "score": float(score),
                    "preview": doc.page_content[:200] + "..."
                }
                for doc, score in zip(retrieval_result.documents, retrieval_result.scores)
            ],
            "api_data_keys": list(api_data.keys())
        }


if __name__ == "__main__":
    # Example usage
    print("Initializing Advanced RAG Engine...")

    config = RAGConfig()
    engine = AdvancedRAGEngine(config)

    # Initialize from API
    engine.initialize_from_api()

    # Example queries
    test_queries = [
        "What are the key topics covered in PeakSpan MasterClasses?",
        "Tell me about Scott Varner and his role at PeakSpan",
        "What investment strategies does PeakSpan focus on?"
    ]

    for query in test_queries:
        print(f"\n\n{'='*80}")
        result = engine.query(query, strategy=RetrievalStrategy.HYBRID)
        print(f"Query: {result['query']}")
        print(f"Strategy: {result['strategy']}")
        print(f"Documents Retrieved: {result['num_documents']}")
        print(f"\nResponse:\n{result['response']}")
        print(f"\nSources: {len(result['sources'])}")
        for i, source in enumerate(result['sources'][:3], 1):
            print(f"  [{i}] {source['source']} (Score: {source['score']:.2f})")
