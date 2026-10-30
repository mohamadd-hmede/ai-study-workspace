# Learnadio — AI-Powered Study Workspace

Learnadio is an AI-powered study platform designed to help students organize their courses and learning materials in one workspace. It combines contextual AI assistance, automated summaries, and interactive quizzes to make studying and reviewing course content more efficient.

**Live Demo:** [Learnadio](https://learnadio.vercel.app/)  
**Repository:** [ai-study-workspace](https://github.com/mohamadd-hmede/ai-study-workspace)

## Screenshots

<!-- Screenshots will be added here. -->

## Features

- **Course Management:** Create, edit, search, and organize courses and their learning materials.
- **Material Management:** Upload, preview, rename, search, sort, and manage learning resources.
- **Multi-Format Support:** Work with supported documents, presentations, spreadsheets, images, text files, and source code.
- **Contextual AI Chat:** Ask questions about learning materials and receive AI-generated explanations.
- **AI-Generated Summaries:** Generate structured summaries to support studying and revision.
- **Interactive Quizzes:** Generate multiple-choice quizzes, review explanations, and track previous attempts.
- **Document Rendering:** Convert supported Word and PowerPoint documents into visual pages for document analysis.
- **Account Management:** Manage your profile and access Puter account, usage, and storage information.

## Tech Stack

| Category            | Technologies                                                         |
| ------------------- | -------------------------------------------------------------------- |
| Frontend            | Next.js 16, React 19, TypeScript                                     |
| Styling             | Tailwind CSS 4                                                       |
| AI & Cloud Services | Puter.js                                                             |
| Document Processing | Mammoth, SheetJS, JSZip, docx-preview, @aiden0z/pptx-renderer, jsPDF |
| Document Rendering  | Node.js, Express.js, LibreOffice, Poppler                            |
| Testing             | Vitest, React Testing Library                                        |
| Code Quality        | ESLint                                                               |
| Deployment          | Vercel, Docker                                                       |

## Architecture

Learnadio uses the Next.js App Router for its application interface and Puter.js for authentication, AI integration, and cloud services.

- **Authentication:** Puter manages user authentication and account information.
- **Data Storage:** Puter Key-Value storage manages structured application records.
- **File Storage:** Puter cloud storage stores uploaded learning materials.
- **AI Integration:** Puter.js powers contextual chat, summary generation, and quiz generation.
- **Document Rendering:** A separate Express.js service uses LibreOffice and Poppler to convert supported DOCX and PPTX documents into rendered pages.

## Supported Materials

Learnadio supports several types of learning materials:

| Category      | Formats                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| Documents     | PDF, DOCX                                                                                                    |
| Presentations | PPTX                                                                                                         |
| Spreadsheets  | XLSX, CSV                                                                                                    |
| Images        | Browser-supported image formats                                                                              |
| Text files    | TXT, MD, Markdown, JSON, XML, YAML, YML                                                                      |
| Source code   | SQL, JavaScript, JSX, TypeScript, TSX, Java, Python, C, C++, C#, PHP, Ruby, Go, Rust, HTML, CSS, SCSS, Shell |

Preview and AI-processing capabilities depend on the file type. DOCX and PPTX documents use dedicated processing strategies and can be rendered into visual pages through the separate document-rendering service.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) and npm
- A Puter account
- Docker for the document-rendering service

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/mohamadd-hmede/ai-study-workspace.git
cd ai-study-workspace
npm install
```

The `postinstall` script automatically applies the project's dependency patches through `patch-package`.

### Environment Configuration

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_RENDERER_URL=http://localhost:3001
```

This variable specifies the base URL of the document-rendering service. Update it when using a remotely deployed renderer.

### Start the Document-Rendering Service

Build the Docker image:

```bash
docker build -t learnadio-renderer ./renderer-service
```

Run the service:

```bash
docker run --rm -p 3001:3001 \
  -e STUDYFLOW_ORIGIN=http://localhost:3000 \
  learnadio-renderer
```

The renderer uses LibreOffice and Poppler to convert supported Office documents into rendered pages.

### Start the Application

In a separate terminal, run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in through Puter.

## Available Scripts

| Command         | Description                  |
| --------------- | ---------------------------- |
| `npm run dev`   | Start the development server |
| `npm run build` | Create a production build    |
| `npm run start` | Start the production server  |
| `npm run lint`  | Run ESLint                   |
| `npm run test`  | Run the Vitest test suite    |

Run the automated tests and verify the production build:

```bash
npm run test
npm run lint
npm run build
```

## Deployment

The Next.js application is deployed through [Vercel](https://vercel.com/). The document-rendering service must be deployed separately in a Docker-compatible environment.

Configure `NEXT_PUBLIC_RENDERER_URL` to point to the deployed rendering service and set `STUDYFLOW_ORIGIN` to the frontend's production origin.

Both services must be accessible for rendering-dependent features to work correctly.

## Author

**Mohammad Hmede**  
Computer Science Student | Full-Stack Developer

[GitHub Profile](https://github.com/mohamadd-hmede)
