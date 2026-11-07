# Connected application update

Start with [SETUP.md](SETUP.md) for the current installation instructions, tested workflows, deployment settings and remaining requirements. The earlier overview below describes the project architecture; SETUP.md takes precedence where configuration differs.

# 👁️ SafeSight AI – Multi-Agent Eye Clinic Management System

> An AI-powered ophthalmology clinic management system built with **Node.js**, **Express.js**, **LangGraph**, **Google Gemini**, **MongoDB Atlas Vector Search**, and **Retrieval-Augmented Generation (RAG)**.

SafeSight AI is a modern backend application that combines traditional clinic management with Generative AI. The system uses specialized AI agents for patients, receptionists, and doctors to automate appointment booking, patient registration, clinical workflows, and medical knowledge retrieval.

---

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-AI-blue?style=for-the-badge)
![Google Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)
![RAG](https://img.shields.io/badge/RAG-MongoDB_Vector_Search-success?style=for-the-badge)

---

## ✨ Highlights

- 🤖 Multi-Agent AI Architecture
- 🧠 Retrieval-Augmented Generation (RAG)
- 🔍 MongoDB Atlas Vector Search
- 👨‍⚕️ Doctor AI Assistant
- 👩‍💼 Receptionist AI Assistant
- 🌐 Public AI Assistant
- 🛠️ AI Tool Calling using LangGraph
- 🔐 JWT Authentication & Role-Based Access Control
- 📅 Smart Appointment Management
- 👤 Patient Registration & Search
- 🏥 Clinic Information Retrieval
- 📚 Medical Knowledge Search

# 📖 About

SafeSight AI is designed to simplify ophthalmology clinic operations by combining AI-powered assistants with a robust backend architecture.

The system supports multiple user roles, including public users, receptionists, doctors, and administrators. Each AI agent has access only to the tools required for its responsibilities, ensuring secure and context-aware interactions.

Unlike traditional chatbots, SafeSight AI uses **LangGraph** to orchestrate specialized AI agents, **tool calling** for real-world actions, and **Retrieval-Augmented Generation (RAG)** to answer medical questions using a curated knowledge base.

This project demonstrates the integration of modern AI techniques into a real-world healthcare workflow while maintaining a clean, modular backend architecture.

# 🚀 Features

## 🤖 AI Features

- Multi-Agent Architecture
- Public AI Assistant
- Receptionist AI Assistant
- Doctor AI Assistant
- LangGraph Workflow
- AI Tool Calling
- Context-Aware Conversations
- Retrieval-Augmented Generation (RAG)
- MongoDB Atlas Vector Search

---

## 👨‍⚕️ Doctor Features

- View Today's Appointments
- Search Patients
- Review Patient History
- Record Clinical Examination
- Create Prescriptions
- Complete Patient Visits

---

## 👩‍💼 Receptionist Features

- Register New Patients
- Search Existing Patients
- Book Appointments
- Check Available Time Slots
- Manage Appointment Schedule

---

## 🌐 Public Features

- Book Appointments
- Search Doctors
- Register as a New Patient
- View Clinic Information
- Ask Eye Care Questions

---

## 🔐 Security Features

- JWT Authentication
- Role-Based Access Control (RBAC)
- Protected APIs
- Secure AI Tool Access

# 🏗️ System Architecture

```text
                          ┌────────────────────┐
                          │     Frontend       │
                          │  (Web Application) │
                          └─────────┬──────────┘
                                    │
                             HTTP / REST API
                                    │
                                    ▼
                    ┌──────────────────────────┐
                    │      Express Server      │
                    └───────────┬──────────────┘
                                │
      ┌─────────────────────────┼──────────────────────────┐
      │                         │                          │
      ▼                         ▼                          ▼
 Authentication             REST APIs                 AI Chat APIs
      │                         │                          │
      ▼                         ▼                          ▼
 JWT Middleware          Controllers                 AI Controllers
      │                         │                          │
      └─────────────────────────┼──────────────────────────┘
                                │
                                ▼
                           Service Layer
                                │
      ┌─────────────────────────┼──────────────────────────┐
      │                         │                          │
      ▼                         ▼                          ▼
   MongoDB                LangGraph                 RAG System
```
# 🤖 AI Architecture

```text
                      User Message
                           │
                           ▼
                  AI Chat Controller
                           │
                           ▼
                    LangGraph Graph
                           │
                           ▼
                    Chatbot Node
                           │
          ┌────────────────┴─────────────────┐
          │                                  │
          ▼                                  ▼
     Gemini LLM                      Tool Calling
                                             │
                ┌────────────────────────────┼─────────────────────────────┐
                │                            │                             │
                ▼                            ▼                             ▼
        Patient Tools                Appointment Tools             Knowledge Tools
                │                            │                             │
                ▼                            ▼                             ▼
            MongoDB                     MongoDB                    RAG / MongoDB
```
# 👨‍⚕️ Multi-Agent Architecture

```text
                     SafeSight AI

                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   Public Agent     Receptionist Agent    Doctor Agent
        │                  │                  │
        ▼                  ▼                  ▼
  Clinic Information   Patient Tools     Clinical Tools
  Doctor Search        Appointment       Prescription
  Eye Care Q&A         Registration      Examination
`
# 🧠 Retrieval-Augmented Generation (RAG)

```text
Markdown Documents
        │
        ▼
Document Loader
        │
        ▼
Text Splitter
        │
        ▼
Google Embeddings
        │
        ▼
MongoDB Atlas Vector Search
        │
        ▼
Retriever
        │
        ▼
Gemini
        │
        ▼
Grounded AI Response
`````

# 🛠️ AI Tool Calling

```text
User
 │
 ▼
Gemini
 │
 ▼
LangGraph
 │
 ▼
Should a Tool be Used?
 │
 ├─────────────── No ───────────────► Direct AI Response
 │
 Yes
 │
 ▼
ToolNode
 │
 ▼
Execute Tool
 │
 ▼
MongoDB / RAG
 │
 ▼
Tool Result
 │
 ▼
Gemini
 │
 ▼
Final Response
```

# 🛠️ Tech Stack

| Category | Technologies |
|----------|--------------|
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose |
| **Authentication** | JWT, bcryptjs |
| **AI Framework** | LangGraph, LangChain |
| **LLM** | Google Gemini |
| **RAG** | MongoDB Atlas Vector Search |
| **Embeddings** | Google Generative AI Embeddings |
| **Validation** | Zod |
| **Environment** | dotenv |
| **Development** | Nodemon |

SafeSight AI
│
├── src/
│   ├── ai/
│   │   ├── agents/
│   │   ├── config/
│   │   ├── context/
│   │   ├── graph/
│   │   ├── knowledge/
│   │   ├── memory/
│   │   ├── nodes/
│   │   ├── prompts/
│   │   ├── rag/
│   │   ├── tools/
│   │   └── index.js
│   │
|   ├── server.js
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
│
├── scripts/
├── package.json
└── README.md

# ⚙️ Installation

## Clone the repository

```bash
git clone <your-repository-url>
cd SafeSight-AI
```

## Install dependencies

```bash
npm install
```

## Configure environment variables

Create a `.env` file in the project root.

```env
PORT=3000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

GOOGLE_API_KEY=your_google_api_key
```

## Run the server

```bash
npm run dev
```

The backend will start on:

```
http://localhost:3000
```
# 📦 Environment Variables

| Variable | Description |
|-----------|-------------|
| `PORT` | Server Port |
| `MONGODB_URI` | MongoDB Atlas Connection String |
| `JWT_SECRET` | JWT Secret Key |
| `GOOGLE_API_KEY` | Google Gemini API Key |

# 🔄 Request Flow

```text
Client Request
      │
      ▼
Express Route
      │
      ▼
Controller
      │
      ▼
Service Layer
      │
      ▼
MongoDB

or

Controller
      │
      ▼
AI Agent
      │
      ▼
LangGraph
      │
      ▼
Tool Calling
      │
      ▼
MongoDB / RAG
      │
      ▼
Final AI Response
```

# 💡 Why SafeSight AI?

Traditional clinic management systems rely on manual workflows and static interfaces. SafeSight AI enhances these workflows by introducing AI-powered assistants capable of performing real actions such as patient registration, appointment scheduling, doctor search, and retrieval of medical knowledge.

The project demonstrates how Large Language Models can be integrated with business logic through LangGraph, tool calling, and Retrieval-Augmented Generation (RAG) while maintaining a modular and scalable backend architecture.