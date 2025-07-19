# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/8f158bd7-d55a-43a8-b1ac-67a7d2ff10ab

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/8f158bd7-d55a-43a8-b1ac-67a7d2ff10ab) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/8f158bd7-d55a-43a8-b1ac-67a7d2ff10ab) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Document Schema for Backend

The frontend application expects a `Document` object with the following structure. The backend API should provide data conforming to this schema.

```typescript
/**
 * Represents a collaborator on a document.
 */
interface Collaborator {
  id: string;      // User's unique ID
  name: string;    // User's display name
  avatarUrl?: string; // URL for the user's avatar image
  color: string;   // A unique color for the user's cursor and presence
}

/**
 * Defines the schema for a Document object.
 */
interface Document {
  /**
   * Unique identifier for the document (e.g., UUID).
   * @example "doc_1a2b3c4d"
   */
  id: string;

  /**
   * The title of the document.
   */
  title: string;

  /**
   * The main content of the document (e.g., plain text, Markdown, or JSON).
   */
  content: string;

  /**
   * The ID of the user who owns the document.
   */
  ownerId: string;

  /**
   * An array of collaborators who have access to the document.
   */
  collaborators: Collaborator[];

  /**
   * A boolean flag indicating if the document is shared with others.
   */
  isShared: boolean;

  /**
   * ISO 8601 timestamp for when the document was created.
   * @example "2023-10-27T10:00:00Z"
   */
  createdAt: string;

  /**
   * ISO 8601 timestamp for when the document was last modified.
   * @example "2023-10-27T12:30:00Z"
   */
  lastModified: string;
}
```

### Key Parameters Required by the Frontend:

-   **`id` (string)**: Essential for navigation (`/editor/:id`) and all CRUD operations (get, update, delete).
-   **`title` (string)**: Displayed in document lists and the editor. Can be updated.
-   **`content` (string)**: The core editable text of the document.
-   **`lastModified` (string)**: Displayed on the `DocumentCard` to indicate freshness.
-   **`collaborators` (Collaborator[])**: Used to display collaborator avatars on the `DocumentCard`.
-   **`isShared` (boolean)**: Used to show a visual indicator on the `DocumentCard` if a document is shared.
