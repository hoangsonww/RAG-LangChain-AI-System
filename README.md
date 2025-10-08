# LangChain & RAG System for Portfolio Support in Google Colab

This repository contains a [Google Colab Notebook](RAG_LangChain_AI_System.ipynb) that implements a Retrieval-Augmented Generation (RAG) system for portfolio support. The system integrates document retrieval, dynamic entity extraction, and external API calls to generate informed, context-aware responses using a Hugging Face language model via Ollama. The entire application runs in Google Colab and is designed to work on both Linux and Windows environments.

In addition to that, this repository also contains a Flask app that serves as an API endpoint for the RAG system. The app allows users to interact with the RAG system via HTTP POST requests, enabling seamless integration with other applications and services.

Additionally, it also includes a sample backend Express API that can be used to interact with the RAG system. The system can (and should) query from the API to get more data to generate better-informed responses.

- **Author:** [Son Nguyen](https://github.com/hoangsonww)

<p align="center">
  <img src="resources/RAG_System_Diagram.JPG" alt="LangChain & RAG System for Portfolio Support in Google Colab" width="100%" style="border-radius: 8px">
</p>

## Table of Contents

- [Overview](#LangChain--RAG-System-for-Portfolio-Support-in-Google-Colab)
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [Embedding and Language Models Used](#embedding-and-language-models-used)
- [Strategies for Retrieval Accuracy and Persistent Memory](#strategies-for-retrieval-accuracy-and-persistent-memory)
- [API Tool Integration Methodology](#api-tool-integration-methodology)
- [How to Deploy / Use the Code](#how-to-deploy--use-the-code)
- [Running the Sample Backend Express API](#running-the-sample-backend-express-api)
- [Demonstration Examples](#demonstration-examples)
- [Why Use Google Colab](#why-use-google-colab)
- [Code Sharing](#code-sharing-)
- [Additional Resources](#additional-resources)
  - [DO YOU WANT TO LEARN MORE ABOUT AI/ML?](#do-you-want-to-learn-more-about-aiml)
- [Conclusion](#conclusion)

## System Architecture

### High-Level Architecture Overview

The RAG AI System follows a multi-layered architecture that combines document retrieval, vector embeddings, LLM generation, and external API integration. Below is the high-level system architecture:

```mermaid
graph TB
    subgraph "Client Layer"
        A[User Interface]
        B[CLI Interface]
        C[Jupyter Notebook]
        D[HTTP Client]
    end

    subgraph "Application Layer"
        E[Flask API Server]
        F[RAG Processing Engine]
        G[Conversation Manager]
    end

    subgraph "AI/ML Layer"
        H[Ollama LLM<br/>llama2]
        I[HuggingFace Embeddings<br/>all-MiniLM-L6-v2]
        J[FAISS Vector Store]
    end

    subgraph "Backend Services"
        K[Express API Server]
        L[Authentication Middleware]
        M[Swagger Documentation]
    end

    subgraph "Data Sources"
        N[(MongoDB)]
        O[Document Repository]
        P[External Web Sources]
    end

    A --> E
    B --> F
    C --> F
    D --> E

    E --> F
    F --> G
    F --> H
    F --> I
    F --> J
    F --> K

    K --> L
    K --> M
    K --> N

    F --> O
    F --> P
```

### RAG Processing Pipeline

The following diagram illustrates the complete RAG processing pipeline from user query to response generation:

```mermaid
graph TB
    A[User Query] --> B{Query Type Detection}

    B -->|Greeting| C[Return Preset Response]
    B -->|Complex Query| D[Document Retrieval]

    D --> E[FAISS Vector Search<br/>Top-K Similarity]

    E --> F[Entity Extraction]
    F --> G{Extract Entities}

    G -->|Person Name| H[Call Team API]
    G -->|Company Name| I[Call Investments API]
    G -->|Sector| J[Call Sectors API]
    G -->|URL| K[Call Scrape API]
    G -->|Consultation| L[Call Consultations API]

    H --> M[Aggregate API Data]
    I --> M
    J --> M
    K --> M
    L --> M

    M --> N[Build LLM Prompt]
    E --> N
    O[Conversation History] --> N

    N --> P[Ollama LLM<br/>Generate Response]
    P --> Q[Update Conversation History]
    Q --> R[Return Response]

    C --> R
```

### Data Flow Sequence

This sequence diagram shows the detailed interaction between components during query processing:

```mermaid
sequenceDiagram
    participant U as User
    participant F as Flask API
    participant R as RAG Engine
    participant V as FAISS Store
    participant L as Ollama LLM
    participant E as Express API
    participant M as MongoDB

    U->>F: POST /chat {query}
    F->>R: Process Query

    R->>V: Similarity Search
    V-->>R: Top-K Documents

    R->>R: Extract Entities<br/>(Regex Patterns)

    par API Enrichment
        R->>E: GET /api/team?name=...
        E->>M: Query TeamMember
        M-->>E: Member Data
        E-->>R: Team Profile

        R->>E: GET /api/investments?company=...
        E->>M: Query Investment
        M-->>E: Investment Data
        E-->>R: Investment Info
    end

    R->>R: Build Prompt<br/>(Docs + API + History)

    R->>L: Generate Response
    L-->>R: LLM Output

    R->>R: Update History
    R-->>F: Response
    F-->>U: JSON Response
```

### Backend API Architecture

The Express backend provides RESTful endpoints with authentication and comprehensive documentation:

```mermaid
graph TB
    subgraph "Express Backend API"
        A[Express App Server<br/>Port 3456]

        B[Swagger UI<br/>/docs]
        C[Auth Routes<br/>/auth/token]
        D[Protected Routes]

        A --> B
        A --> C
        A --> D

        subgraph "Authentication"
            E[Bearer Token Middleware]
            C --> E
            D --> E
        end

        subgraph "API Endpoints"
            F[/ping/]
            G[/api/team/]
            H[/api/investments/]
            I[/api/sectors/]
            J[/api/consultations/]
            K[/api/scrape/]
            L[/api/documents/]
        end

        D --> F
        D --> G
        D --> H
        D --> I
        D --> J
        D --> K
        D --> L

        G --> M[(MongoDB)]
        H --> M
        I --> M
        J --> M
    end
```

For a comprehensive architectural overview with detailed design patterns, deployment strategies, and scalability considerations, please refer to [ARCHITECTURE.md](ARCHITECTURE.md).

## Key Features

- **Document Processing and Retrieval:**  
  - Downloads and extracts MasterClass documents.
  - Splits documents into text chunks for embedding.
  - Builds a FAISS vector store for efficient retrieval.
- **Persistent Memory and Context Preservation:**  
  - Maintains conversation history for context-aware responses.
  - Handles follow-up questions and maintains coherence.
- **Dynamic Entity Extraction:**  
  - Extracts entities from user queries and conversation history.
  - Calls external APIs based on extracted entities.
- **Error Handling and Robustness:**  
  - Implements error handling for document retrieval and API calls.
  - Provides informative messages in case of errors.
- **API Tool Integration Methodology:**  
  - Integrates with external APIs for data enrichment.
  - Dynamically extracts entities to call the appropriate API endpoints.
- **API Chaining and Data Enrichment:**  
  - Chains API calls to enrich responses with additional data.
  - Combines document context and API data for comprehensive responses.
- **Flask API Endpoint:**  
  - Provides an API endpoint for the RAG system.
  - Allows users to interact with the system via HTTP POST requests.
- **Sample Backend Express API:** 
  - Simulates external APIs for team profiles, investments, sectors, and consultations.
  - Provides data for enriching responses and supporting portfolio management.
  - Live at: [https://rag-langchain-ai-system.onrender.com](https://rag-langchain-ai-system.onrender.com).
- **Interactive Conversation Loop:**  
  - Allows users to type queries and receive context-aware responses.
  - Supports multiple interactions and follow-up questions.

### Key Technologies Used

[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Hugging Face](https://img.shields.io/badge/Hugging%20Face-233C3F?style=for-the-badge&logo=huggingface&logoColor=white)](https://huggingface.co/)
[![Ollama](https://img.shields.io/badge/Ollama-FFA500?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.ai/)
[![FAISS](https://img.shields.io/badge/FAISS-FFA500?style=for-the-badge&logo=faiss&logoColor=white)](https://ai.meta.com/tools/faiss/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![ngrok](https://img.shields.io/badge/ngrok-1F1E37?style=for-the-badge&logo=ngrok&logoColor=white)](https://ngrok.com/)
[![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)](https://www.postman.com/)
[![Google Colab](https://img.shields.io/badge/Google%20Colab-F9AB00?style=for-the-badge&logo=googlecolab&logoColor=white)](https://colab.research.google.com/)
[![Google Python Style Guide](https://img.shields.io/badge/Google%20Python%20Style%20Guide-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://google.github.io/styleguide/pyguide.html)

> [!IMPORTANT]
> Note: The live sample Express API is hosted on Render.com and can be accessed at [https://rag-langchain-ai-system.onrender.com](https://rag-langchain-ai-system.onrender.com). The API provides endpoints for team profiles, investments, sectors, consultations, and more. You can use these endpoints to retrieve data and enrich the responses generated by the RAG system.
>
> However, please note that it will spin down after 15 minutes of inactivity, so it may need some time to spin up again if it has been inactive for a while.

## Embedding and Language Models Used

- **Embedding Model:**  
  We use the Hugging Face model `all-MiniLM-L6-v2` to encode text chunks extracted from MasterClass documents. This model generates vector representations that enable fast similarity searches using a FAISS vector store.

- **Language Model:**  
  The system utilizes the Ollama integration with the `llama2` model to generate natural language responses based on the retrieved context and API data.

- **FAISS Vector Store:**  
  The FAISS vector store is used to efficiently retrieve relevant document content based on user queries. The vector store is built from the embedded text chunks using the `all-MiniLM-L6-v2` model.

- **Flask API:**  
  The Flask app serves as an API endpoint for the RAG system, allowing users to interact with the system via HTTP POST requests. The app provides a simple and intuitive interface for querying the RAG system and receiving context-aware responses.

- **External APIs & API Chaining:**  
  The system integrates with external APIs to retrieve additional data related to team profiles, investments, sectors, consultations, and more. These APIs provide valuable insights that enhance the system's responses and support portfolio management activities.

> [!CAUTION]
> Note: In this project, the "external APIs" are simulated using a sample backend Express API. The actual APIs can be substituted with real endpoints to access live data of your choice. Visit the [Sample Backend Express API](https://rag-langchain-ai-system.onrender.com) for more details.

## Strategies for Retrieval Accuracy and Persistent Memory

### Document Processing Flow

The following diagram illustrates the document indexing pipeline:

```mermaid
sequenceDiagram
    participant S as System Startup
    participant E as Express API
    participant D as Document Processor
    participant T as Text Splitter
    participant H as HuggingFace Embeddings
    participant V as FAISS Vector Store

    S->>E: GET /api/documents/download
    E-->>S: documents.zip

    S->>D: Extract ZIP
    D->>D: Read .txt Files

    loop For Each Document
        D->>T: Split into Chunks<br/>(500 chars, 100 overlap)
        T-->>D: Text Chunks[]

        D->>H: Encode Chunks
        H-->>D: Embeddings[]
    end

    D->>V: Build Index
    V-->>D: FAISS Index Ready

    D-->>S: Indexing Complete
    S->>S: Ready for Queries
```

- **Document Processing and Retrieval:**
  1. The system downloads a ZIP file of MasterClass documents via the `/api/documents/download` endpoint.
  2. It extracts all text files and splits them into manageable chunks using a `CharacterTextSplitter`.
  3. These text chunks are then embedded using the `all-MiniLM-L6-v2` model and stored in an in-memory FAISS vector store, which allows for efficient retrieval of relevant content based on user queries.
  4. When a user query is received, the system retrieves the most relevant document chunks using the FAISS vector store and generates a response based on the retrieved context.
  5. The response is further enriched with data from external APIs to provide comprehensive and accurate information.
  6. The system uses a combination of document retrieval, external API data, and dynamic entity extraction to generate context-aware responses that address user queries effectively.

- **Persistent Memory:**  
  Conversation history is maintained in a global variable (or via session data) so that context is preserved across multiple user queries. This persistent memory enables the system to handle follow-up questions accurately and generate coherent, context-aware responses.

- **Dynamic Entity Extraction:**  
  Regular expressions are used to extract entities (e.g., person names, company names, sectors, URLs) from the user's query or conversation history. Based on keywords such as "consult", "profile", "investment", "sector", or "scrape", the corresponding API endpoint is called. The retrieved data (or friendly messages if no data is found) is then appended to the prompt used to generate the final response.

- **Error Handling and Robustness:**  
  The system includes robust error handling mechanisms to gracefully handle failures when retrieving documents, querying external APIs, or processing user queries. By implementing try/except blocks and error checks, the system ensures a smooth user experience and provides informative messages in case of errors.

- **API Tool Integration Methodology:**  
  The system integrates with multiple API endpoints, including `/ping`, `/api/documents/download`, `/api/team`, `/api/investments`, `/api/sectors`, `/api/consultations`, and `/api/scrape`. Based on the user query or conversation history, the system dynamically extracts entities and calls the appropriate API endpoint to retrieve relevant data. The retrieved information is then used to generate context-aware responses that address the user's query effectively.

- **API Chaining and Data Enrichment:**  
  The system leverages external APIs to enrich the responses with additional data related to team profiles, investments, sectors, and consultations. By chaining API calls and combining the retrieved data with document context, the system provides comprehensive and up-to-date information to support portfolio management activities.

## API Tool Integration Methodology

### Entity Extraction and API Routing

The system uses regex-based entity extraction to dynamically route API calls:

```mermaid
graph TB
    A[User Query + History] --> B[Entity Extractor]

    B --> C{Regex Pattern Matching}

    C -->|Person Pattern| D["consult/profile/team with Name"]
    C -->|Company Pattern| E["company CompanyName"]
    C -->|Sector Pattern| F["sector of Sector"]
    C -->|URL Pattern| G["https://..."]

    D --> H[API Router]
    E --> H
    F --> H
    G --> H

    H --> I{Route to API}

    I -->|Person| J[/api/team<br/>/api/consultations/]
    I -->|Company| K[/api/investments/]
    I -->|Sector| L[/api/sectors/]
    I -->|URL| M[/api/scrape/]

    J --> N[Aggregate Results]
    K --> N
    L --> N
    M --> N

    N --> O[Enriched Context<br/>for LLM]
```

- **External API Endpoints:**
  The system integrates with multiple API endpoints, including:
  - **/ping:** Verifies API credentials.
  - **/api/documents/download:** Downloads MasterClass documents.
  - **/api/team** and **/api/team/insights:** Retrieve team profiles and related insights.
  - **/api/investments** and **/api/investments/insights:** Retrieve investment details.
  - **/api/sectors:** Retrieves information about specific sectors.
  - **/api/consultations:** Retrieves consultation details.
  - **/api/scrape:** Scrapes content from provided URLs.

- **Dynamic Entity Extraction:**
  Regular expressions are used to extract entities (e.g., person names, company names, sectors, URLs) from the user's query or conversation history. Based on keywords such as "consult", "profile", "investment", "sector", or "scrape", the corresponding API endpoint is called.
  The retrieved data (or friendly messages if no data is found) is then appended to the prompt used to generate the final response.

- **API Chaining and Data Enrichment:**
  The system leverages external APIs to enrich the responses with additional data related to team profiles, investments, sectors, and consultations. By chaining API calls and combining the retrieved data with document context, the system provides comprehensive and up-to-date information to support portfolio management activities.

## How to Deploy / Use the Code

### 1. Set Up Your Colab Environment

> [!IMPORTANT]
> **Note:** Please use a Google Colab instance with a GPU (e.g. T4 GPU) for better performance. All code is tested and optimized for Google Colab only!

**a. Install the Colab XTerm extension (for command-line support):**
```python
!pip install colab-xterm
%load_ext colabxterm
```

**b. Launch an XTerm terminal within Colab:**
```python
%xterm
```
This opens a full-screen terminal window within your notebook.

**c. Install and serve Ollama:**

In the XTerm terminal, run:
```bash
curl https://ollama.ai/install.sh | sh
ollama serve &
```
- The first command installs Ollama.
- The second command starts the Ollama server in the background.  
  *(Tip: Check the `server.log` file for startup messages.)*

**d. Pull an AI Model (Example using `llama2`):**
```bash
ollama pull llama2
```
This downloads the model for use.

**e. Verify the Ollama Installation:**
```python
!ollama -version
```
If you see the version number, your Ollama server is running correctly.

### 2. Install Required Python Packages

Run the following cell in Colab:
```python
!pip install langchain_community faiss-cpu sentence-transformers requests flask pyngrok
```

### 3. Run the RAG Script

Copy the full RAG system script (provided in the notebook) into a new cell and run it. The script will:
1. Download and extract MasterClass documents.
2. Build a FAISS vector store from the document contents.
3. Initialize the Ollama language model.
4. Start an interactive conversation loop where you can type queries.
5. Retrieve relevant document context and external API data to generate responses.

> [!IMPORTANT]
> **Note:**  
> - Update `API_TOKEN` and `API_BASE_URL` with your credentials.
> - Type queries in the interactive loop. Type `exit` or `quit` to end the session.

### 4. Running the Flask App

1. **Set Up ngrok for Colab:**

   - Install pyngrok and Flask if not already installed:
     ```python
     !pip install flask pyngrok
     ```
   - Set your ngrok authtoken (replace `"YOUR_NGROK_AUTH_TOKEN"` with your actual token):
     ```python
     from pyngrok import ngrok
     ngrok.set_auth_token("YOUR_NGROK_AUTH_TOKEN")
     ```

2. **Run the Flask App Cell:**

   Execute the cell containing the Flask app code. Once the documents are loaded and indexed, the app will start on port 5000 and ngrok will create a public tunnel. The output will display a public URL (e.g., `https://your-ngrok-url.ngrok-free.app`).

3. **Test the Flask Endpoint:**

   Send a POST request to the `/chat` endpoint using the public URL. For example, in a new Colab cell:
   ```bash
   !curl -X POST "https://your-ngrok-url.ngrok-free.app/chat" -H "Content-Type: application/json" -d '{"query": "hello"}'
   ```
   Replace `https://your-ngrok-url.ngrok-free.app` with the actual URL printed by ngrok.

## Running the Sample Backend Express API

1. **Install Required Packages:**

   Navigate to the `backend` directory and install the required packages:
   ```bash
   cd backend
   npm install
   ```
   
   Also, don't forget to set up the `.env` file with the following content:
   ```plaintext
    MONGO_URI=<your-mongo-uri>
    PORT=3456
    ```
   
2. **Start the Express Server:**

   Start the Express server:
   ```bash
   npm start
   ```
   The server will run on `http://localhost:3456`. Visiting it in your browser should show the API documentation in Swagger UI.

3. **Test the API Endpoints:**
  
    You can now test the API endpoints using tools like Postman or cURL. For example:
    ```bash
    curl http://localhost:3456/api/team
    ```
   
4. **Integrate with the RAG System:**

   Update the Flask app to query the sample backend API endpoints for additional data. You can modify the `/chat` endpoint in the Flask app to call the sample backend API and enrich the responses with relevant information. Also, feel free to make changes to the API as needed if you want it to return different data or support more operations.

## Demonstration Examples

Below are some example interactions from the notebook (which you can also verify by viewing the console output in the notebook - under the "RAG System" code section).

- **Example 1: Greeting**
  - **User Query:** `Hello`
  - **Assistant Response:**  
    `Hello! I'm your assistant here to help with information about PeakSpan MasterClasses, team profiles, investments, sectors, and more. How can I assist you today?`

- **Example 2: Query about PeakSpan**
  - **User Query:** `Tell me about PeakSpan`
  - **Assistant Response:**  
    Provides detailed information about PeakSpan, including its investment focus, team structure, and market insights based on the MasterClass documents and API data.

- **Example 3: Consultation Data Query**
  - **User Query:** `I consulted with James Isaacs recently. I forgot, which PeakSpan portfolio companies did James consult with recently?`
  - **Assistant Response:**  
    Retrieves consultation details from the API (or returns a friendly message if no data is found). Note that in this case, James Iaaacs is actually not found in the consultation API (querying the API gives the 404 error). Please also test this functionality with Scott Varner instead.

- **Example 4: Capabilities Query**
  - **User Query:** `My name is Charlie, I work for a company named Vizzo. What are you and what can you do?`
  - **Assistant Response:**  
    `I am an intelligent assistant designed to provide you with up-to-date information about PeakSpan MasterClasses, team profiles, investments, sectors, and related insights. I retrieve document-based context and external API data to help answer your questions accurately. How may I assist you today?`

- **Example 5: Query about a Specific PeakSpan Team Member**
  - **User Query:** `Can you tell me more about Scott Varner?`
  - **Assistant Response:**  
    Retrieves detailed information about Scott Varner, including his role, background, and insights based on the API data.
  - **Example:**
  ```plaintext
  Your Query: Tell me about Scott Varner

  Assistant: Scott Varner is a Managing Partner at PeakSpan Capital, where he focuses on investments in the technology and software sectors. He brings over 20 years of experience in the industry to his role, having held various leadership positions at companies such as Microsoft, IBM, and Oracle.

  Varner has a track record of success in building and scaling high-growth businesses, and he is known for his ability to identify and support promising startups and entrepreneurs. At PeakSpan Capital, he leads the firm's investments in companies such as Calendly, Cameo, Doolittle, Flock Safety, GrowTech, Hive, Intricelabs, Jobber, and LinguaSnap, among others.

  Varner is also recognized for his commitment to diversity and inclusion in the tech industry. He has been featured in numerous publications, including Forbes, Fortune, and TechCrunch, and he regularly speaks at industry events and conferences.

  In addition to his investment work, Varner is also involved in various philanthropic initiatives, focusing on education and workforce development programs. He serves on the boards of several non-profit organizations and is a mentor to several startup founders and entrepreneurs.
  ```
And many more features can be tested interactively in the notebook!

## Why Use Google Colab

### Deployment Architecture on Google Colab

```mermaid
graph TB
    subgraph "Google Colab Environment"
        A[Colab Notebook<br/>T4 GPU Runtime]

        subgraph "Setup Phase"
            B[Install colab-xterm]
            C[Launch XTerm Terminal]
            D[Install Ollama CLI]
            E[Pull llama2 Model]
        end

        subgraph "Runtime Services"
            F[Ollama Server<br/>Background Process]
            G[Flask App<br/>Port 5000]
            H[ngrok Tunnel<br/>Public HTTPS]
        end

        subgraph "Python Environment"
            I[langchain_community]
            J[faiss-cpu]
            K[sentence-transformers]
            L[pyngrok]
        end

        A --> B --> C --> D --> E
        E --> F
        A --> I
        A --> J
        A --> K
        A --> L

        F --> G
        G --> H
        L --> H
    end

    subgraph "External Services"
        M[Express API<br/>Render.com]
        N[MongoDB Atlas]
        O[Internet Clients]
    end

    H <--> O
    G <--> M
    M <--> N
```

Google Colab provides a free, cloud-based Jupyter notebook environment with GPU support, making it an ideal platform for running AI models, training neural networks, and executing complex computations compared to local machines.

Thus, I have elected to use Google Colab for this project to leverage its great GPU capabilities, easy setup, and seamless integration with external APIs and services.

I have also tested the code so that it works on my MacOS (Local) and Windows (Local) machines, with minor adjustments. However, the performance was quite poor compared to Google Colab, so I recommend using Google Colab for the best experience.

## Code Sharing 

- **Google Drive Link for the Colab Notebook:** [https://colab.research.google.com/drive/1rIYsnLwLvSit4Xf7VyT_IIFyDFlohyH7?usp=sharing](https://colab.research.google.com/drive/1rIYsnLwLvSit4Xf7VyT_IIFyDFlohyH7?usp=sharing)

## Additional Resources

### **DO YOU WANT TO LEARN MORE ABOUT AI/ML?**

This repository also contains additional resources that you can utilize to teach yourself and learn AI/ML! Feel free to explore the
`resources` directory for more information. Resources include:

- [Textual Analysis](resources/Unstructured_Data_Textual_Analysis.ipynb)
- [Data Science Pipeline](resources/Data_Science_Pipeline.ipynb)
- [Deep Learning & Neural Networks](resources/Deep_Learning_Neural_Networks.ipynb)
- [Representation Learning for Recommender Systems](resources/Representation_Learning_Recommender.ipynb)
- [LLM & Mining CX on Social Media](resources/LLM_Mining_CX.ipynb)
- [AI Agents](resources/AI_Agents_Assistants.ipynb)
- [AI & Businesses](resources/AI_and_Businesses.ipynb)
- [Retrieval-Augmented Generation (RAG) System](resources/Retrieval_Augmented_Generation.ipynb)
- [Storytelling with Data for Stakeholders](resources/Storytelling_with_Data.pdf)
- [k-Nearest Neighbors (k-NN) Algorithm](resources/k-Nearest-Neighbors.ipynb)
- [Decision Trees & Ensemble Learning](resources/Decision_Trees_Ensemble_Learning.ipynb)
- [Synthetic Experts](resources/Synthetic_Experts.pdf)
- [Confusion Matrix](resources/Confusion_Matrix.ipynb)
- [Regression](resources/Regression.ipynb)

[These resources](resources) cover a wide range of topics, from textual analysis and data science pipelines to deep learning, neural networks, and representation learning for recommender systems. You can use these resources to enhance your knowledge and skills in AI/ML and apply them to real-world projects and applications.

Feel free to also check out my other **[GitHub projects](https://github.com/hoangsonww)** for more AI/ML resources, tutorials, and code samples, or read my **[blog posts](https://devverse-swe.vercel.app)** for insights on AI, machine learning, and SWE topics. I hope you find these resources helpful and informative as you continue your learning journey in AI/ML! 🚀

## Conclusion

### Technology Stack Overview

```mermaid
mindmap
  root((RAG AI System))
    Backend
      Express.js
      TypeScript
      Node.js
      MongoDB/Mongoose
      Swagger/OpenAPI

    AI/ML
      LangChain
      Ollama
      HuggingFace
      FAISS
      llama2 Model
      all-MiniLM-L6-v2

    Frontend/Interface
      Flask
      Jupyter/Colab
      Python CLI
      ngrok

    DevOps
      Docker
      Render.com
      GitHub
      Makefile

    Data Processing
      Text Splitter
      Regex Entity Extraction
      Vector Embeddings
      Web Scraping
```

This RAG system for portfolio support in Google Colab demonstrates the integration of document retrieval, dynamic entity extraction, and external API calls to generate context-aware responses using a Hugging Face language model via Ollama. The system is designed to provide accurate and informative responses based on user queries and conversation history. By leveraging the power of AI models and external data sources, the system can assist users in accessing relevant information about PeakSpan MasterClasses, team profiles, investments, sectors, and more.

The system's ability to maintain persistent memory, handle follow-up questions, and enrich responses with external API data makes it a valuable tool for portfolio management and information retrieval tasks. By combining document context, dynamic entity extraction, and API chaining, the system can generate comprehensive and context-aware responses that address user queries effectively.

For detailed architectural documentation, design patterns, and deployment strategies, please refer to [ARCHITECTURE.md](ARCHITECTURE.md).

---

Thank you for checking out this project today! 🙏 Happy coding! 🚀
