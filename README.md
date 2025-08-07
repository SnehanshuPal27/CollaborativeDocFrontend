# CollabEdit: Real-Time Collaborative Document Editor (Frontend)

CollabEdit is a feature-rich, web-based collaborative document editor designed to provide a seamless, real-time multi-user editing experience similar to Google Docs. It allows users to create, share, and edit documents simultaneously, with changes reflected instantly for all participants.

This repository contains the complete frontend application built with React, TypeScript, and Vite.

**A corresponding backend server is required for this application to function. [➡️ View the Backend Repository](https://github.com/SnehanshuPal27/CollaborativeDocBackend)** ---

## Key Features

-   **Secure User Authentication:** A complete registration and login system using JWT-based session management to protect user accounts and data.
-   **Document Management Dashboard:** A centralized and intuitive interface for users to create, view, rename, and delete their documents.
-   **Real-Time Multi-User Collaboration:** The core of the application, this feature allows multiple users to edit the same document simultaneously. All changes are synced across all clients in real-time without conflicts.
-   **Live Presence and Cursor Tracking:** Provides immediate visual feedback of other active users in a document, including uniquely colored cursors tagged with usernames.
-   **Offline-First Capability:** Powered by IndexedDB, users can continue to edit documents even if their internet connection is lost. All changes made offline are automatically synced once the connection is restored.
-   **Document Sharing:** Document owners can invite other registered users to collaborate simply by entering their email address.

---

## Architectural Overview & Underlying Concepts

The primary goal of this project is to achieve a low-latency, conflict-free editing experience. This is accomplished through a sophisticated architecture that leverages Conflict-free Replicated Data Types (CRDTs).

-   **Client-Side Logic (CRDT):** The frontend uses **Yjs**, a powerful CRDT implementation. This allows editing conflicts (e.g., two users typing in the same place) to be resolved mathematically on the client side without needing to wait for a server's decision. This results in a fast, lag-free typing experience. The client generates tiny binary "updates" representing changes, not the entire document.

-   **Backend Logic (Relay & Persistence):** The **Java Spring Boot** backend is designed as a high-performance but "unaware" relay. It does not process or understand the content of the document updates. Its responsibilities are clearly defined:
    1.  **Authentication & Metadata:** Manages user data and document permissions, which are stored in a **PostgreSQL** database.
    2.  **Real-time Relay:** A **Spring WebSockets** server receives Yjs updates from one client.
    3.  **Scalable Broadcasting:** It leverages **Redis Pub/Sub** to instantly broadcast these updates to all other clients in the same document session. This decouples message-sending and allows the architecture to scale horizontally.
    4.  **Persistence:** The backend logs every update in a **Redis List** for the duration of an active session. When the session ends, this log of updates is concatenated and saved as a single snapshot to **Google Cloud Storage (GCS)** for long-term, durable storage.

---

## Tech Stack

### Frontend
-   **Framework:** React (Bootstrapped with Vite)
-   **Language:** TypeScript
-   **Real-time Sync & Editing:** Yjs, Tiptap, SockJS
-   **UI Components & Styling:** Tailwind CSS, shadcn/ui
-   **Server State Management:** TanStack Query (React Query)
-   **Routing:** React Router

### Backend
-   **Framework:** Java Spring Boot
-   **Language:** Java
-   **Real-time Communication:** Spring WebSockets
-   **Database:** PostgreSQL (for user and document metadata)
-   **In-Memory Cache & Messaging:** Redis (for session management and Pub/Sub)
-   **Durable Storage:** Google Cloud Storage (GCS) for document snapshots
-   **Authentication:** Spring Security with JSON Web Tokens (JWT)

---

## Local Development Setup

To run the frontend application on your local machine, please ensure you have a running instance of the [backend server](https://github.com/SnehanshuPal27/CollaborativeDocBackend).

### Prerequisites
-   Node.js (v18 or later)
-   npm or another package manager like yarn or pnpm

### Installation & Running

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/SnehanshuPal27/CollaborativeDocFrontend.git](https://github.com/SnehanshuPal27/CollaborativeDocFrontend.git)
    cd CollaborativeDocFrontend
    ```
    *Note: Replace the URL with your repository's actual URL.*

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a file named `.env` in the project's root directory. Add the following line, pointing to the URL of your local backend server:
    ```
    VITE_API_BASE_URL=http://localhost:8080
    ```

4.  **Start the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:8000`.